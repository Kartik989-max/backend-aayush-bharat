import { Client, Databases, ID, Storage, Query } from "appwrite";
import { config } from "@/config/config";
import { databases, storage } from "@/lib/appwrite";

// Blog collection ID from env with hardcoded fallbacks for safety
const databaseId = config.appwriteDatabaseId || process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || "68283bb0dfbb0bc2f45a";
const blogCollectionId = config.appwriteBlogCollectionId || process.env.NEXT_PUBLIC_APPWRITE_BLOG_COLLECTION_ID || "6829ca28bb6f12e3b1a7";

// Blog service class
export class BlogService {
  // Create a new blog post
  async createBlog(
    title: string,
    summary: string,
    blog_data: string,
    image?: string
  ) {
    try {
      console.log("Creating blog with:", { databaseId, blogCollectionId });
      
      return await databases.createDocument(
        databaseId,
        blogCollectionId,
        ID.unique(),
        {
          blog_heading: title,
          summary,
          blog_data,
          image,
          created_at: new Date().toISOString(),
        }
      );
    } catch (error) {
      console.error("Appwrite service :: createBlog :: error", error);
      throw error;
    }
  }

  // Update an existing blog post
  async updateBlog(
    id: string,
    title: string,
    summary: string,
    blog_data: string,
    image?: string
  ) {
    try {
      return await databases.updateDocument(
        databaseId,
        blogCollectionId,
        id,
        {
          blog_heading: title,
          summary,
          blog_data,
          image,
          updated_at: new Date().toISOString(),
        }
      );
    } catch (error) {
      console.error("Appwrite service :: updateBlog :: error", error);
      throw error;
    }
  }

  // Get a blog post by ID
  async getBlog(id: string) {
    try {
      return await databases.getDocument(
        databaseId,
        blogCollectionId,
        id
      );
    } catch (error) {
      console.error("Appwrite service :: getBlog :: error", error);
      throw error;
    }
  }

  // Get all blog posts
  async getBlogs(limit: number = 10) {
    try {
      return await databases.listDocuments(
        databaseId,
        blogCollectionId,
        [
          Query.orderDesc("created_at"),
          Query.limit(limit),
        ]
      );
    } catch (error) {
      console.error("Appwrite service :: getBlogs :: error", error);
      throw error;
    }
  }

  // Delete a blog post
  async deleteBlog(id: string) {
    try {
      return await databases.deleteDocument(
        databaseId,
        blogCollectionId,
        id
      );
    } catch (error) {
      console.error("Appwrite service :: deleteBlog :: error", error);
      throw error;
    }
  }
}

// Create a singleton instance
const blogService = new BlogService();

export default blogService;
