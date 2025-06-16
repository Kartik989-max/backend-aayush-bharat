'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'react-toastify';
import { ArrowLeft } from 'lucide-react';
import { Product } from '@/types/product';
import { productService } from '@/services/productService';
import ProductForm from '@/components/product/ProductForm';
import { databases } from '@/lib/appwrite';

export default function AddProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (formData: Product) => {
    try {
      setLoading(true);
      
      // Extract variants before removing the $id
      const variants = formData.variants;
      
      // Strip out $id when creating a new product to avoid Appwrite error
      const { $id, variants: _, ...dataWithoutIdAndVariants } = formData;
      
      // 1. Create the product first
      const productResponse = await productService.createProduct(dataWithoutIdAndVariants);
      const productId = productResponse.$id;
      
      // 2. Create variants with the product ID
      if (variants && variants.length > 0) {
        const validVariants = variants.filter(v => v.price > 0 && v.weight > 0 && v.stock > 0);
        
        if (validVariants.length > 0) {
          const variantPromises = validVariants.map(variant => {
            const variantData = {
              productId: productId,
              price: Number(variant.price),
              weight: Number(variant.weight),
              months: Math.min(Number(variant.months || 1), 12),
              sale_price: Number(variant.sale_price || 0),
              stock: Number(variant.stock || 0),
              image: variant.image || "",
              additionalImages: variant.additionalImages || []
            };
            
            return productService.createVariant(variantData);
          });
          
          await Promise.all(variantPromises);
        }
      }
      
      // 3. Update any product_video relationships
      if (formData.productVideo && formData.productVideo.length > 0) {
        const updatePromises = formData.productVideo.map(videoId => 
          databases.updateDocument(
            process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
            process.env.NEXT_PUBLIC_APPWRITE_PRODUCT_VIDEO_COLLECTION_ID!,
            videoId,
            { productId }
          )
        );
        
        await Promise.all(updatePromises);
      }
      
      toast.success('Product created successfully');
      router.push('/dashboard/products');
    } catch (error) {
      console.error('Error creating product:', error);
      toast.error('Failed to create product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          onClick={() => router.push('/dashboard/products')}
          disabled={loading}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">Add New Product</h1>
      </div>

      <Card>
        <CardContent className="p-6">
          <ProductForm
            initialData={null}
            onSubmit={handleSubmit}
            onCancel={() => router.push('/dashboard/products')}
            loading={loading}
          />
        </CardContent>
      </Card>
    </div>
  );
}