export interface Variants {
  $id?: string;
  productId: string;
  price: number;
  weight: number;
  months: number;
  sale_price: number;
  stock: number;
  image: string;
  additionalImages: string[];
}

export interface Product {
  $id: string;
  $collectionId?: string;
  $databaseId?: string;
  $createdAt?: string;
  $updatedAt?: string;
  $permissions?: string[];
  name: string;
  description: string;
  category: string;
  tags: string;
  ingredients: string;
  slug: string;
  collections: string[];
  variants: Variants[];
}
