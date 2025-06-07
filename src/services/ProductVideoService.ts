import { databases } from "@/lib/appwrite";
import { ID, Query } from "appwrite";

export class ProductVideoService {
  async createProductVideo(videoUrl: string, productId: string) {
    try {
      console.log('ProductVideoService.createProductVideo called with:', { videoUrl, productId });
      
      if (!videoUrl || !productId) {
        throw new Error('Video URL and Product ID are required');
      }

      const document = await databases.createDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_PRODUCT_VIDEO_COLLECTION_ID!,
        ID.unique(),
        {
          video: videoUrl,
          productId: productId
        }
      );
      
      console.log('Created product video document:', document);
      return document;
    } catch (error) {
      console.error("Error creating product video:", error);
      throw error;
    }
  }

  async getProductVideo(productId: string) {
    try {
      const response = await databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_PRODUCT_VIDEO_COLLECTION_ID!,        [
          // Add a query to filter by productId
          Query.equal('productId', [productId])
        ]
      );
      return response.documents[0]; // Return the first video found for this product
    } catch (error) {
      console.error("Error getting product video:", error);
      throw error;
    }
  }

  async deleteProductVideo(videoId: string) {
    try {
      await databases.deleteDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_PRODUCT_VIDEO_COLLECTION_ID!,
        videoId
      );
    } catch (error) {
      console.error("Error deleting product video:", error);
      throw error;
    }
  }
}

export const productVideoService = new ProductVideoService();
