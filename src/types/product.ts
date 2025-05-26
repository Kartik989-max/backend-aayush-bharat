import { Models } from 'appwrite';

export interface Variants {
    productId:string;
  price: number;
  weight: number;
  sale_price: number;
  stock: number;
  months:number;
  image?: string;
  additionalImages?:string[];
};
export interface Collections{
  name:string;
  description:string;
  products:Product[];
  $id:string;
}
export interface Product  {
  $id:string,
  name: string;
  description: string;
  rating:number;
  category: string[];
  weight: number;
  image: string;
  additionalImages: string[];
  stock: number;
  price: number;
  sale_price?: number;  
  tags:string[];
  ingredients:string[];
  slug:string;
  variants:Variants[];
  collections:Collections[];
  // Make sale_price optional
  // Appwrite document fields are already included from Models.Document:
  // $id, $collectionId, $databaseId, $createdAt, $updatedAt, $permissions
}
