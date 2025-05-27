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