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

export const productService = {
  async fetchCategories(): Promise<Category[]> {
    const response = await databases.listDocuments(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
      process.env.NEXT_PUBLIC_APPWRITE_CATEGORY_COLLECTION_ID!
    );
    return response.documents as unknown as Category[];
  },

  async fetchWeights(): Promise<Weight[]> {
    const response = await databases.listDocuments(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
      process.env.NEXT_PUBLIC_APPWRITE_WEIGHT_COLLECTION_ID!
    );
    return response.documents as unknown as Weight[];
  },

  async uploadImage(file: File): Promise<string> {
    const response = await storage.createFile(
      process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID!,
      ID.unique(),
      file
    );
    return response.$id;
  },

  async createProduct(data: ProductFormData): Promise<Product> {
    try {
      // Create the product
      const productData = {
        name: data.name,
        description: data.description,
        category: data.category,
        tags: data.tags,
        ingredients: data.ingredients,
        slug: data.slug,
        collections: data.collections || []
      };

      const product = await databases.createDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_PRODUCT_COLLECTION_ID!,
        ID.unique(),
        productData
      ) as Product;

      return product;
    } catch (error) {
      console.error("Error creating product:", error);
      throw error;
    }
  },

  async updateProduct(productId: string, data: ProductFormData): Promise<Product> {
    try {
      // Update the product
      const productData = {
        name: data.name,
        description: data.description,
        category: data.category,
        tags: data.tags,
        ingredients: data.ingredients,
        slug: data.slug,
        collections: data.collections || []
      };

      const product = await databases.updateDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_PRODUCT_COLLECTION_ID!,
        productId,
        productData
      ) as Product;

      return product;
    } catch (error) {
      console.error("Error updating product:", error);
      throw error;
    }
  },

  async getProducts(): Promise<Product[]> {
    try {
      const response = await databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_PRODUCT_COLLECTION_ID!
      );
      return response.documents as unknown as Product[];
    } catch (error) {
      console.error("Error fetching products:", error);
      throw error;
    }
  },

  async getProductWithVariants(productId: string): Promise<{product: Product, variants: Variants[]}> {
    try {
      // Get product
      const product = await databases.getDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_PRODUCT_COLLECTION_ID!,
        productId
      ) as Product;

      // Get variants
      const response = await databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_VARIANT_COLLECTION_ID!,
        [Query.equal('productId', productId)]
      );

      // Cast documents to Variants
      const variants = response.documents.map(doc => ({
        $id: doc.$id,
        productId: doc.productId,
        price: Number(doc.price),
        weight: Number(doc.weight),
        sale_price: Number(doc.sale_price),
        stock: Number(doc.stock),
        months: Number(doc.months),
        image: doc.image || "",
        additionalImages: doc.additionalImages || []
      })) as Variants[];

      return { product, variants };
    } catch (error) {
      console.error("Error fetching product with variants:", error);
      throw error;
    }
  },

  async createVariant(data: Omit<Variants, '$id'>): Promise<Variants> {
    try {
      console.log("Received variant data:", data);
      
      // Remove any undefined values to prevent defaults from overriding
      const variantData = {
        productId: data.productId,
        price: data.price !== undefined ? Number(data.price) : 0,
        weight: data.weight !== undefined ? Number(data.weight) : 0,
        months: data.months !== undefined ? Number(data.months) : 1,
        sale_price: data.sale_price !== undefined ? Number(data.sale_price) : 0,
        stock: data.stock !== undefined ? Number(data.stock) : 0,
        image: data.image || "",
        additionalImages: Array.isArray(data.additionalImages) ? data.additionalImages : []
      };

      console.log("Processed variant data to save:", variantData);

      const result = await databases.createDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_VARIANT_COLLECTION_ID!,
        ID.unique(),
        variantData
      );

      console.log("Created variant with result:", result);

      const finalVariant = {
        $id: result.$id,
        ...variantData
      } as Variants;

      console.log("Final variant data:", finalVariant);
      return finalVariant;
    } catch (error) {
      console.error("Error creating variant:", error);
      throw error;
    }
  },
};
