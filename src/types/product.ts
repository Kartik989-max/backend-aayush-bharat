import { Models } from 'appwrite';

export interface Variants {
  $id?: string;
  productId?: string;
  price: number;
  sale_price: number;
  stock: number;
  weight: number;
  months: number;
  image?: string;
  additionalImages: string[];
}

export interface Collections{
  name:string;
  description:string;
  products:Product[];
  $id:string;
}

export interface Product {
  $id: string;
  name: string;
  description: string;
  category: string;
  tags: string;
  slug: string;
  ingredients: string;
  variants: Variants[];
  collections: string[];
  productVideo: string[];
}

export interface ProductVideo {
  $id: string;
  productId: string;
  videos: string[];
}

export interface Category {
  $id: string;
  name: string;
}

export interface Weight {
  $id: string;
  name: string;
  value: number;
}

export interface Collection {
  $id: string;
  name: string;
}

export interface ProductFormData {
  name: string;
  description: string;
  category: string;
  tags: string;
  slug: string;
  ingredients: string;
  variants: {
    weight: number;
    price: number;
    sale_price: number;
    stock: number;
    months: number;
    image?: string;
    additionalImages: string[];
  }[];
  collections: string[];
  productVideo: string[];
}
