import { Models } from 'appwrite';

export interface Variants {
  $id?: string;
  productId: string; // String type (required)
  weight: number;    // Integer type (required)
  price: number;     // Integer type (required)
  sale_price: number;// Integer type (required)
  stock: number;     // Integer type (required)
  image: string;     // String type (required)
  additionalImages: string[]; // Array of strings for Appwrite compatibility
  months: number;    // Integer type (required)
};
export interface Collections{
  name:string;
  description:string;
  products:Product[];
  $id:string;
}
export interface Product extends Models.Document {
  name: string;
  description: string;
  category: string;  // Store as comma-separated string
  tags: string;      // Store as comma-separated string
  ingredients: string; // Store as comma-separated string
  slug: string;
  collections?: Collections[];
  // Appwrite document fields are already included from Models.Document:
  // $id, $collectionId, $databaseId, $createdAt, $updatedAt, $permissions
}
