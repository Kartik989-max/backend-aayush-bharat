import { databases, storage, createDocument, ID } from '@/lib/appwrite';
import { Models } from 'appwrite';
import { Variants } from '@/types/product';
export interface BaseProduct {
  name: string;
  description: string;
  category: string[];
  weight: number;
  image: string;
  additionalImages: string[];
  sale_price?: number;
  rating: number;
  price: number;
  tags: string[];
  stock: number;
  ingredients: string[];
  slug:string;
  variants:Variants[];
}

export interface ProductFormData extends BaseProduct {
  $id?: string;
}

export interface Product extends BaseProduct {
  $id: string;
}

export interface Category extends Models.Document {
  name: string;
}

export interface Weight extends Models.Document {
  weight: number;
}

export interface WeightPrice {
  weight: number;
  local_price: number;
  sale_price?: number | null;  // Make sale_price optional and allow null
}

export interface Collection extends Models.Document {
  name: string;
  // Remove Collection: string[] since it's not needed
}

export const productService = {
  async fetchCategories() {
    const response = await databases.listDocuments(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
      process.env.NEXT_PUBLIC_APPWRITE_CATEGORY_COLLECTION_ID!
    );
    return response.documents as unknown as Category[];
  },

  async fetchWeights() {
    const response = await databases.listDocuments(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
      process.env.NEXT_PUBLIC_APPWRITE_WEIGHT_COLLECTION_ID!
    );
    return response.documents as unknown as Weight[];
  },

  // async fetchCollections() {
  //   const response = await databases.listDocuments(
  //     process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
  //     process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_COLLECTION_ID!
  //   );
  //   return response.documents as Collection[];  // Fix the type casting
  // },

  async uploadImage(file: File) {
    const bucketId = process.env.NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID;
    if (!bucketId) {
      throw new Error('Storage bucket ID is not configured');
    }

    // Check file size before attempting upload
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > 2) {
      console.warn(`Image file size (${fileSizeMB.toFixed(2)}MB) exceeds recommended limit of 2MB`);
    }

    try {
      return await storage.createFile(
        bucketId,
        ID.unique(),
        file
      );
    } catch (error: any) {
      console.error('Failed to upload image:', error);
      
      // Provide more specific error messages
      if (error.message && error.message.includes('Network request failed')) {
        throw new Error('Network error during upload. This might be due to CORS restrictions or server limits. Contact your administrator.');
      } else if (error.code === 413 || (error.message && error.message.includes('413'))) {
        throw new Error('Image is too large. Please try with a smaller image or compress it further.');
      } else if (error.code === 401 || error.code === 403) {
        throw new Error('Authentication error. You may need to log in again.');
      } else if (error.response && error.response.status === 413) {
        throw new Error('Server rejected the image because it\'s too large. Maximum size is 2MB.');
      } else {
        throw new Error('Failed to upload image. Please try again with a smaller image.');
      }
    }
  },

  async createProduct(data: ProductFormData) {
    const productData = {
      name: data.name,
      description: data.description,
      tags: Array.isArray(data.tags) ? data.tags.join(",") : (data.tags || ""),
      rating: Number(data.rating),
      category: Array.isArray(data.category) ? data.category.join(",") : (data.category || ""),
      weight: Number(data.weight),
      image: data.image,
      additionalImages: Array.isArray(data.additionalImages) ? data.additionalImages.join(",") : (data.additionalImages || ""),
      price: Number(data.price),
      sale_price: Number(data.sale_price),
      stock: Number(data.stock),
      ingredients: Array.isArray(data.ingredients) ? data.ingredients.join(",") : (data.ingredients || ""),
      slug: data.slug,
    };
    try {
      return await createDocument(
        process.env.NEXT_PUBLIC_APPWRITE_PRODUCT_COLLECTION_ID!,
        productData
      );
    } catch (error) {
      return error;
    }
  },

  async updateProduct(productId: string, data: ProductFormData) {
    const productData = {
      name: data.name,
      description: data.description,
      tags: Array.isArray(data.tags) ? data.tags.join(",") : (data.tags || ""),
      rating: Number(data.rating),
      category: Array.isArray(data.category) ? data.category.join(",") : (data.category || ""),
      weight: Number(data.weight),
      image: data.image,
      additionalImages: Array.isArray(data.additionalImages) ? data.additionalImages.join(",") : (data.additionalImages || ""),
      price: Number(data.price),
      sale_price: Number(data.sale_price),
      stock: Number(data.stock),
      ingredients: Array.isArray(data.ingredients) ? data.ingredients.join(",") : (data.ingredients || ""),
      slug: data.slug,
      variants:data.variants,
    };

    return await databases.updateDocument(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
      process.env.NEXT_PUBLIC_APPWRITE_PRODUCT_COLLECTION_ID!,
      productId,
      productData
    );
  },

  async getProducts(): Promise<Product[]> {
    const response = await databases.listDocuments(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
      process.env.NEXT_PUBLIC_APPWRITE_PRODUCT_COLLECTION_ID!
    );

    return response.documents.map(data => ({
      $id: data.$id,
      name: data.name,
      description: data.description,
      tags: Array.isArray(data.tags) ? data.tags.join(",") : (data.tags || ""),
      rating: Number(data.rating),
      category: Array.isArray(data.category) ? data.category.join(",") : (data.category || ""),
      weight: Number(data.weight),
      image: data.image,
      additionalImages: Array.isArray(data.additionalImages) ? data.additionalImages.join(",") : (data.additionalImages || ""),
      price: Number(data.price),
      sale_price: Number(data.sale_price),
      stock: Number(data.stock),
      ingredients: Array.isArray(data.ingredients) ? data.ingredients.join(",") : (data.ingredients || ""),
      slug: data.slug,
      variants: Array.isArray(data.variants) ? data.variants : [],
    }));
  },




  async getProductsAndVariant() {
    const productsRes = await databases.listDocuments(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
      process.env.NEXT_PUBLIC_APPWRITE_PRODUCT_COLLECTION_ID!,
    );

    const variantsRes = await databases.listDocuments(
       process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
      process.env.NEXT_PUBLIC_APPWRITE_VARIANT_COLLECTION_ID!,
    );

    // Group variants by productId
    const variantMap: { [key: string]: any[] } = {};
    variantsRes.documents.forEach((variant) => {
      const productId = variant.productId;
      if (!variantMap[productId]) variantMap[productId] = [];
      variantMap[productId].push(variant);
    });

    // Attach variants to corresponding products
    const combined = productsRes.documents.map((product) => ({
      ...product,
      variants: variantMap[product.$id] || [],
    }));

    return combined;
}





};
