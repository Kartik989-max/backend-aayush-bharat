import { Models } from 'appwrite';

export interface VariantType extends Models.Document {
  weight: number;
  price: number;
  sale_price: number;
  stock: number;
  productId: string;
  months: number;
  additionalImages: string[];
  image: string;
}
