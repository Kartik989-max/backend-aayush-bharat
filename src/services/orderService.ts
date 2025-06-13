import { databases } from '@/lib/appwrite';
import { OrderType } from '@/types/order';
import { VariantType } from '@/types/variant';

export const orderService = {
  async getOrders(): Promise<OrderType[]> {
    const response = await databases.listDocuments(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
      process.env.NEXT_PUBLIC_APPWRITE_ORDERS_COLLECTION_ID!
    );
    return response.documents as OrderType[];
  },

  async getOrderAnalytics() {
    const orders = await this.getOrders();
    const today = new Date();
    const thisMonth = today.getMonth();
    const thisYear = today.getFullYear();

    const monthlyData = Array(12).fill(0);
    let totalRevenue = 0;
    let monthlyRevenue = 0;
    let dailyRevenue = 0;

    orders.forEach(order => {
      const orderDate = new Date(order.$createdAt);
      const orderAmount = order.total_amount || 0;

      // Total revenue
      totalRevenue += orderAmount;

      // Monthly data for chart
      if (orderDate.getFullYear() === thisYear) {
        monthlyData[orderDate.getMonth()] += orderAmount;
      }

      // This month's revenue
      if (orderDate.getMonth() === thisMonth && orderDate.getFullYear() === thisYear) {
        monthlyRevenue += orderAmount;
      }

      // Today's revenue
      if (orderDate.toDateString() === today.toDateString()) {
        dailyRevenue += orderAmount;
      }
    });

    return {
      totalRevenue,
      monthlyRevenue,
      dailyRevenue,
      monthlyData,
      totalOrders: orders.length,
      recentOrders: orders.sort((a, b) => 
        new Date(b.$createdAt).getTime() - new Date(a.$createdAt).getTime()
      ).slice(0, 5)
    };
  },

  async getOrderById(orderId: string): Promise<OrderType> {
    const response = await databases.getDocument(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
      process.env.NEXT_PUBLIC_APPWRITE_ORDERS_COLLECTION_ID!,
      orderId
    );
    return response as OrderType;
  },

  async updateOrderStatus(orderId: string, status: string): Promise<OrderType> {
    const response = await databases.updateDocument(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
      process.env.NEXT_PUBLIC_APPWRITE_ORDERS_COLLECTION_ID!,
      orderId,
      { status }
    );
    return response as OrderType;
  },

  async updateOrderShippingStatus(orderId: string, shipping_status: string): Promise<OrderType> {
    const response = await databases.updateDocument(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
      process.env.NEXT_PUBLIC_APPWRITE_ORDERS_COLLECTION_ID!,
      orderId,
      { shipping_status }
    );
    return response as OrderType;
  },
  
  async updateOrderWithDeliveryCharges(
    orderId: string, 
    shipping_status: string, 
    delivery_charges: number
  ): Promise<OrderType> {
    const response = await databases.updateDocument(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
      process.env.NEXT_PUBLIC_APPWRITE_ORDERS_COLLECTION_ID!,
      orderId,
      { 
        shipping_status,
        delivery_charges
      }
    );
    return response as OrderType;
  },

  async updateOrder(orderId: string, data: Partial<OrderType>) {
    return await databases.updateDocument(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
      process.env.NEXT_PUBLIC_APPWRITE_ORDERS_COLLECTION_ID!,
      orderId,
      data
    );
  },

  async createOrder(data: Partial<OrderType>) {
    return await databases.createDocument(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
      process.env.NEXT_PUBLIC_APPWRITE_ORDERS_COLLECTION_ID!,
      'unique()',
      data
    );
  },

  async calculateShiprocketShipping(data: {
    pickup_postcode: string;
    delivery_postcode: string;
    weight: number;
    length: number;
    breadth: number;
    height: number;
    cod?: boolean;
  }) {
    try {
      console.log('Sending shipping calculation request:', data);
      
      // Use mock API temporarily for testing
      const useMockAPI = true;
      const apiUrl = useMockAPI ? '/api/shipping/mock' : '/api/shipping/calculate';
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Failed to calculate shipping: ${response.status} ${errorText}`);
        throw new Error(`Failed to calculate shipping: ${response.status} ${errorText}`);
      }
      
      const responseData = await response.json();
      console.log('Shipping calculation response:', responseData);
      return responseData;
    } catch (error) {
      console.error('Error calculating shipping:', error);
      throw error;
    }
  },  async createShiprocketOrder(orderId: string, shipmentData: any) {
    try {
      console.log('Sending create order request to Shiprocket API:', {
        orderId,
        ...shipmentData
      });
      
      // Use mock API temporarily for testing
      const useMockAPI = true;
      const apiUrl = useMockAPI ? '/api/shipping/mock-create-order' : '/api/shipping/create-order';
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          ...shipmentData
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.details || errorData.error || 'Failed to create shipment';
        console.error('Shiprocket API error:', errorData);
        throw new Error(errorMessage);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error creating shipment:', error);
      throw error;
    }
  },

  async getVariantsForOrder(orderVariantsJson: string): Promise<VariantType[]> {
    try {
      if (!orderVariantsJson || orderVariantsJson === '{}') {
        console.log('No variants data in order or empty object');
        return [];
      }
      
      // Parse the order_variants JSON string
      const orderVariants = JSON.parse(orderVariantsJson);
      console.log('Parsed orderVariants:', orderVariants);
      
      // Extract variant IDs from the object
      const variantIds = Object.values(orderVariants);
      console.log('Extracted variant IDs:', variantIds);
      
      if (variantIds.length === 0) {
        console.log('No variant IDs found in the order_variants object');
        return [];
      }
      
      // Make sure collection ID exists
      if (!process.env.NEXT_PUBLIC_APPWRITE_VARIANT_COLLECTION_ID) {
        console.error('Missing NEXT_PUBLIC_APPWRITE_VARIANT_COLLECTION_ID environment variable');
        return [];
      }
        
      // Fetch each variant individually and combine the results
      const variantsPromises = variantIds.map(id => {
        console.log(`Fetching variant with ID: ${id}`);
        return databases.getDocument(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
          process.env.NEXT_PUBLIC_APPWRITE_VARIANT_COLLECTION_ID!,
          id as string
        ).catch(error => {
          console.error(`Failed to fetch variant with ID ${id}:`, error);
          return null;
        });
      });
      
      const results = await Promise.all(variantsPromises);
      // Filter out any null results from failed fetches
      const validResults = results.filter(result => result !== null) as VariantType[];
      console.log(`Successfully fetched ${validResults.length} variants out of ${variantIds.length} requested`);
      return validResults;
    } catch (error) {
      console.error('Error fetching variants for order:', error);
      return [];
    }
  }
};