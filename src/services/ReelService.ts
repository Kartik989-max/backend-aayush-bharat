import { databases } from "@/lib/appwrite";
import { ID } from "appwrite";

export class ReelService {  async createReel(videoUrl: string) {
    try {
      console.log('ReelService.createReel called with videoUrl:', videoUrl);
      
      if (!videoUrl) {
        throw new Error('Video URL is required');
      }

      // Create the document with only the reel field
      const document = await databases.createDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_REEL_COLLECTION_ID!,
        ID.unique(),
        {
          reel: videoUrl
        }
      );
      
      console.log('Created reel document:', document);
      return document;
    } catch (error) {
      console.error("Error creating reel:", error);
      throw error;
    }
  }

  async listReels() {
    try {
      const response = await databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_REEL_COLLECTION_ID!
      );
      return response.documents;
    } catch (error) {
      console.error("Error listing reels:", error);
      throw error;
    }
  }

  async deleteReel(reelId: string) {
    try {
      await databases.deleteDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_REEL_COLLECTION_ID!,
        reelId
      );
    } catch (error) {
      console.error("Error deleting reel:", error);
      throw error;
    }
  }
}

export const reelService = new ReelService();