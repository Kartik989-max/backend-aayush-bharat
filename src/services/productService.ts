import { databases, storage, createDocument, ID } from '@/lib/appwrite';
import { Models, Query } from 'appwrite';
import type { Product, Variants, Collections } from '@/types/product';

// Re-export types
export type { Product, Variants, Collections };

export interface Category extends Models.Document {
  name: string;
}

export interface Weight extends Models.Document {
  weight: number;
}

export interface WeightPrice {
  weight: number;
  local_price: number;
  sale_price?: number | null;
}

export interface ProductDocument extends Models.Document {
  name: string;
  description: string;
  category: string;  // Store as comma-separated string
  tags: string;      // Store as comma-separated string
  ingredients: string; // Store as comma-separated string
  slug: string;
  variants: string[];  // Array of variant IDs
  collections: string[]; // Array of collection IDs
}

// ProductFormData is just like Product but with optional $id
export type ProductFormData = Omit<Product, '$id'> & {
  $id?: string;
};

export interface Collection {
  $id: string;
  name: string;
}

export const productService = {
  async fetchCategories(): Promise<Category[]> {
    const response = await databases.listDocuments(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
      process.env.NEXT_PUBLIC_APPWRITE_CATEGORY_COLLECTION_ID!
    );
    return response.documents.map(doc => ({
      $id: doc.$id,
      name: doc.name as string
    }));
  },

  async fetchCollections(): Promise<Collection[]> {
    const response = await databases.listDocuments(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
      process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_COLLECTION_ID!
    );
    return response.documents.map(doc => ({
      $id: doc.$id,
      name: doc.name as string
    }));
  },

  async fetchWeights(): Promise<Weight[]> {
    const response = await databases.listDocuments(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
      process.env.NEXT_PUBLIC_APPWRITE_WEIGHT_COLLECTION_ID!
    );
    return response.documents.map(doc => ({
      $id: doc.$id,
      name: doc.name as string,
      value: Number(doc.value)
    }));
  },

  async uploadImage(file: File): Promise<string> {
    const response = await storage.createFile(
      process.env.NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID!,
      ID.unique(),
      file
    );
    return response.$id;
  },

  async createProduct(data: ProductFormData): Promise<Product> {
    const response = await databases.createDocument(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
      process.env.NEXT_PUBLIC_APPWRITE_PRODUCT_COLLECTION_ID!,
      ID.unique(),
      data
    );
    return response as unknown as Product;
  },

  async updateProduct(productId: string, data: ProductFormData): Promise<Product> {
    const response = await databases.updateDocument(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
      process.env.NEXT_PUBLIC_APPWRITE_PRODUCT_COLLECTION_ID!,
      productId,
      data
    );
    return response as unknown as Product;
  },

  async getProducts(): Promise<Product[]> {
    const response = await databases.listDocuments(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
      process.env.NEXT_PUBLIC_APPWRITE_PRODUCT_COLLECTION_ID!
    );
    return response.documents as unknown as Product[];
  },

  async getProductWithVariants(productId: string): Promise<Product> {
    const product = await databases.getDocument(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
      process.env.NEXT_PUBLIC_APPWRITE_PRODUCT_COLLECTION_ID!,
      productId
    );

    const variants = await databases.listDocuments(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
      process.env.NEXT_PUBLIC_APPWRITE_VARIANT_COLLECTION_ID!,
      [Query.equal("productId", productId)]
    );

    return {
      ...product,
      variants: variants.documents.map(doc => ({
        $id: doc.$id,
        productId: doc.productId as string,
        price: Number(doc.price),
        weight: Number(doc.weight),
        sale_price: Number(doc.sale_price),
        stock: Number(doc.stock),
        months: Number(doc.months),
        image: doc.image as string,
        additionalImages: Array.isArray(doc.additionalImages) ? doc.additionalImages : []
      }))
    } as unknown as Product;
  },

  async createVariant(data: Variants): Promise<Variants> {
    const response = await databases.createDocument(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
      process.env.NEXT_PUBLIC_APPWRITE_VARIANT_COLLECTION_ID!,
      ID.unique(),
      data
    );
    return {
      $id: response.$id,
      productId: response.productId as string,
      price: Number(response.price),
      weight: Number(response.weight),
      sale_price: Number(response.sale_price),
      stock: Number(response.stock),
      months: Number(response.months),
      image: response.image as string,
      additionalImages: Array.isArray(response.additionalImages) ? response.additionalImages : []
    };
  },

  async updateVariant(variantId: string, data: Variants): Promise<Variants> {
    const response = await databases.updateDocument(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
      process.env.NEXT_PUBLIC_APPWRITE_VARIANT_COLLECTION_ID!,
      variantId,
      data
    );
    return {
      $id: response.$id,
      productId: response.productId as string,
      price: Number(response.price),
      weight: Number(response.weight),
      sale_price: Number(response.sale_price),
      stock: Number(response.stock),
      months: Number(response.months),
      image: response.image as string,
      additionalImages: Array.isArray(response.additionalImages) ? response.additionalImages : []
    };
  },

  async deleteVariant(variantId: string): Promise<void> {
    await databases.deleteDocument(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
      process.env.NEXT_PUBLIC_APPWRITE_VARIANT_COLLECTION_ID!,
      variantId
    );
  },

  async createProductVideo(data: { productId: string; videos: string[] }): Promise<any> {
    const response = await databases.createDocument(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
      process.env.NEXT_PUBLIC_APPWRITE_PRODUCT_VIDEO_COLLECTION_ID!,
      ID.unique(),
      data
    );
    return response;
  },

  async updateProductVideo(videoId: string, data: { videos: string[] }): Promise<any> {
    const response = await databases.updateDocument(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
      process.env.NEXT_PUBLIC_APPWRITE_PRODUCT_VIDEO_COLLECTION_ID!,
      videoId,
      data
    );
    return response;
  },

  async getProductVideo(productId: string): Promise<any> {
    const response = await databases.listDocuments(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
      process.env.NEXT_PUBLIC_APPWRITE_PRODUCT_VIDEO_COLLECTION_ID!,
      [Query.equal("productId", productId)]
    );
    return response.documents[0] || null;
  }
};
