import { Models } from 'appwrite';

export interface Variants {
  $id?: string;
  weight: number;
  price: number;
  sale_price: number;
  stock: number;
  productId: string;
  months: number;
  additionalImages: string[];
  image: string;
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
  tags: string;
  slug: string;
  description: string;
  category: string;
  ingredients: string;
  variants: Variants[];
  collections: string[];
  productVideo: ProductVideo[];
  image: string;
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
  tags: string;
  slug: string;
  description: string;
  category: string;
  ingredients: string;
  variants: {
    weight: number;
    price: number;
    sale_price: number;
    stock: number;
    months: number;
    additionalImages: string[];
    image: string;
  }[];
  collections: string[];
  productVideo: {
    videos: string[];
  }[];
}
