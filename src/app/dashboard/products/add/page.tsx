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

export default function AddProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (formData: Product) => {
    try {
      setLoading(true);
      
      // Strip out $id when creating a new product to avoid Appwrite error
      const { $id, ...dataWithoutId } = formData;
      
      await productService.createProduct(dataWithoutId);
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