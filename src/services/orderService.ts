import { databases } from '@/lib/appwrite';
import { OrderType } from '@/types/order';

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
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
      orderId,
      { shipping_status }
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
  }
};