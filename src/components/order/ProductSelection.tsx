'use client';

import { useEffect, useState } from 'react';
import { Input } from '../ui/input';
import { Models } from 'appwrite';
import { productService } from '@/services/productService';
import { databases } from '@/lib/appwrite';
import Image from 'next/image';

// Simplified product interface for what we need
interface Category extends Models.Document {
  name: string;
  sub_text: string;
  description: string;
}

// Add a custom type for the "All" category option
interface AllCategory {
  $id: string;
  name: string;
  isAll: true;  // Make this required to differentiate
}

type CategoryItem = Category | AllCategory;

// Function to type-guard between AllCategory and Category
const isCategory = (item: AllCategory | Category): item is Category => {
  return !('isAll' in item);
}

interface Product {
  $id: string;
  name: string;
  image: string;
  weight: number[];
  price: number[];
  category: string[]; // This contains category IDs
}

interface SelectedWeight {
  weight: number;
  quantity: number;
}

interface SelectedProduct {
  product_id: string;
  product_name: string;
  weights: { [key: number]: number }; // Changed to object mapping weight to quantity
  price: number;
}

interface ProductSelectionProps {
  onSubmit: (products: Array<{
    product_id: string;
    product_name: string;
    quantity: number;
    weight: number[];
    price: number;
  }>) => void;
  initialProducts?: Array<{
    product_id: string;
    product_name: string;
    quantity: number;
    weight: number[];
    price: number;
  }>;
}

export function ProductSelection({ onSubmit, initialProducts = [] }: ProductSelectionProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [categories, setCategories] = useState<CategoryItem[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch categories first
        const categoriesData = await databases.listDocuments<Category>(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
          process.env.NEXT_PUBLIC_APPWRITE_CATEGORY_COLLECTION_ID!
        );

        console.log('Fetched categories:', categoriesData.documents); // Debug log

        // Create the "All" category with proper typing
        const allCategory: AllCategory = {
          $id: 'all',
          name: 'All Categories',
          isAll: true
        };

        // Ensure categories have the required fields
        const validCategories = categoriesData.documents.map(cat => ({
          ...cat,
          name: cat.name || 'Unnamed Category', // Fallback name if missing
        }));

        setCategories([
          allCategory,
          ...validCategories
        ]);
        
        // Rest of your existing code for products
        const data = await productService.getProducts();
        if (data.length === 0) {
          setError('No products found');
          return;
        }
        // Map fetched products to match local Product interface
        const mappedProducts = data.map((product: any) => ({
          ...product,
          weight: Array.isArray(product.weight) ? product.weight : [product.weight],
          price: Array.isArray(product.price) ? product.price : [product.price],
        }));
        setProducts(mappedProducts);
        
      } catch (error) {
        console.error('Error loading data:', error);
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const filteredProducts = selectedCategory === 'all' 
    ? products 
    : products.filter(p => p.category.includes(selectedCategory)); // Changed to check if category array includes selected category

  const addProduct = (productId: string) => {
    const product = products.find(p => p.$id === productId);
    if (!product) return;

    setSelectedProducts(prev => [...prev, {
      product_id: product.$id,
      product_name: product.name,
      weights: product.weight.reduce((acc, w) => ({ ...acc, [w]: 0 }), {}),
      price: product.price[0]
    }]);
  };

  const removeProduct = (index: number) => {
    setSelectedProducts(prev => prev.filter((_, i) => i !== index));
  };

  const updateProductQuantity = (productIndex: number, weight: number, quantity: number) => {
    setSelectedProducts(prev => prev.map((item, i) => {
      if (i === productIndex) {
        return {
          ...item,
          weights: {
            ...item.weights,
            [weight]: quantity
          }
        };
      }
      return item;
    }));
  };

  return (
    <div className="space-y-4">
      {error && (
        <div key="error" className="text-red-400 p-2 border border-red-800/30 rounded bg-red-900/10">
          {error}
        </div>
      )}

      <div key="categories-filter" className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {categories.map(category => {
          console.log('Rendering category:', category); // Debug log
          return (
            <button
              key={category.$id}
              onClick={() => setSelectedCategory(category.$id)}
              className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${
                selectedCategory === category.$id 
                  ? 'bg-primary text-white' 
                  : 'bg-dark-300 text-light-100 hover:bg-dark-400'
              }`}
            >
              {category.name || 'Unnamed Category'}
            </button>
          );
        })}
      </div>
      
      <div key="products-grid" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {filteredProducts.map((product) => (
          <div
            key={product.$id}
            className={`bg-dark-300 rounded-lg overflow-hidden border-2 ${
              selectedProducts.some(p => p.product_id === product.$id)
                ? 'border-primary'
                : 'border-transparent'
            } hover:border-primary/50 transition-colors cursor-pointer`}
            onClick={() => !selectedProducts.some(p => p.product_id === product.$id) && addProduct(product.$id)}
          >
            <div className="relative aspect-square">
              <Image
                src={`${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${process.env.NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID}/files/${product.image}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`}
                alt={product.name}
                fill
                className="object-cover"
              />
            </div>
            <div className="p-2">
              <h3 className="text-light-100 font-semibold text-sm truncate">{product.name}</h3>
              <p className="text-light-100/70 text-xs">
                ₹{product.price[0]} • {product.weight[0]}g
              </p>
            </div>
          </div>
        ))}
      </div>

      {selectedProducts.length > 0 && (
        <div key="selected-products" className="border-t border-dark-300 mt-4 pt-4 space-y-3">
          <h3 className="text-base font-semibold text-light-100">Selected Products</h3>
          <div className="max-h-[300px] overflow-y-auto space-y-3">
            {selectedProducts.map((item, productIndex) => (
              <div key={`${item.product_id}-${productIndex}`} className="bg-dark-300 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-3">
                  <p className="font-medium text-light-100">{item.product_name}</p>
                  <button
                    onClick={() => removeProduct(productIndex)}
                    className="text-red-400 hover:bg-red-900/20 rounded p-1 text-sm"
                  >
                    Remove
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {Object.entries(item.weights).map(([weight, quantity]) => (
                    <div key={`${item.product_id}-${weight}`} className="flex items-center gap-2 bg-dark-400/50 p-2 rounded">
                      <span className="text-light-100 text-sm whitespace-nowrap">{weight}g:</span>
                      <Input
                        type="number"
                        value={quantity || ''}
                        onChange={(e) => updateProductQuantity(productIndex, parseInt(weight), parseInt(e.target.value) || 0)}
                        min="0"
                        placeholder="Qty"
                        className="w-14 h-7 bg-dark-300 border-dark-500 text-light-100 text-sm px-1"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => {
              const formattedProducts = selectedProducts.flatMap(product => 
                Object.entries(product.weights)
                  .filter(([_, quantity]) => quantity > 0)
                  .map(([weight, quantity]) => ({
                    product_id: product.product_id,
                    product_name: product.product_name,
                    quantity: quantity,
                    weight: [parseInt(weight)],
                    price: product.price
                  }))
              );
              onSubmit(formattedProducts);
            }}
            className="w-full bg-primary text-white py-2 px-4 rounded hover:bg-primary/90 transition-colors font-medium text-sm"
          >
            Continue to Address ({selectedProducts.reduce((sum, item) => 
              Object.values(item.weights).reduce((acc, qty) => acc + (qty > 0 ? 1 : 0), 0), 0
            )} items)
          </button>
        </div>
      )}
    </div>
  );
}