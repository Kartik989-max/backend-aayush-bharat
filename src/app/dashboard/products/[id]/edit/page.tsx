'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { use } from 'react';
import { Product } from '@/types/product';
import { productService } from '@/services/productService';
import ProductForm from '@/components/product/ProductForm';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'react-toastify';
import { ArrowLeft } from 'lucide-react';

export default function EditProductPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const productId = use(Promise.resolve(params.id));

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const data = await productService.getProductWithVariants(productId);
        setProduct(data);
      } catch (error) {
        console.error('Error fetching product:', error);
        toast.error('Failed to load product');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  const handleSubmit = async (formData: any) => {
    try {
      await productService.updateProduct(productId, formData);
      toast.success('Product updated successfully');
      router.push('/dashboard/products');
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error('Failed to update product');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-[50vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Product not found</h2>
          <Button onClick={() => router.push('/dashboard/products')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Products
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => router.push('/dashboard/products')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">Edit Product</h1>
      </div>

      <Card>
        <CardContent className="p-6">
          <ProductForm
            initialData={product}
            onSubmit={handleSubmit}
            onCancel={() => router.push('/dashboard/products')}
          />
        </CardContent>
      </Card>
    </div>
  );
} 