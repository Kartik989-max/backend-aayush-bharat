import { ID, Query } from "appwrite";
import { config } from "@/config/config";
import { databases } from "@/lib/appwrite";

export interface Blog {
  $id: string;
  blog_heading: string;
  summary: string;
  blog_data: string;
  image?: string;
  $createdAt: string;
}

// Blog collection ID from env with hardcoded fallbacks for safety
const databaseId = config.appwriteDatabaseId;
const blogCollectionId = config.appwriteBlogCollectionId;

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
          image
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
          image
        }
      );
    } catch (error) {
      console.error("Appwrite service :: updateBlog :: error", error);
      throw error;
    }
  }

  // Get a blog post by ID
  async getBlog(id: string): Promise<Blog> {
    try {
      const doc = await databases.getDocument(
        databaseId,
        blogCollectionId,
        id
      );
      return {
        $id: doc.$id,
        blog_heading: doc.blog_heading,
        summary: doc.summary,
        blog_data: doc.blog_data,
        image: doc.image,
        $createdAt: doc.$createdAt
      };
    } catch (error) {
      console.error("Appwrite service :: getBlog :: error", error);
      throw error;
    }
  }

  // Get all blog posts
  async getBlogs(limit: number = 10): Promise<Blog[]> {
    try {
      const response = await databases.listDocuments(
        databaseId,
        blogCollectionId,
        [
          Query.orderDesc("$createdAt"),
          Query.limit(limit),
        ]
      );

      // Transform the response to match the Blog interface
      return response.documents.map(doc => ({
        $id: doc.$id,
        blog_heading: doc.blog_heading,
        summary: doc.summary,
        blog_data: doc.blog_data,
        image: doc.image,
        $createdAt: doc.$createdAt
      }));
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
