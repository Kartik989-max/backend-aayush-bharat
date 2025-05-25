'use client';
import { useState, useEffect } from 'react';
import { databases, storage } from '@/lib/appwrite';
import { useRouter, useParams } from 'next/navigation';
import { Spinner } from '@/components/ui/Spinner';
import { ArrowLeft, Trash2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import type { Product as ProductType } from '@/services/productService';
import { Button } from '@/components/ui/button';

const ProductDetailPage = () => {
  const params = useParams();
  const productId = params.id as string;
  const [product, setProduct] = useState<ProductType | null>(null);
  const [loading, setLoading] = useState(true);
  const [deletingImage, setDeletingImage] = useState<string | null>(null);
  const router = useRouter();
  
  useEffect(() => {
    fetchProduct();
  }, [productId]);
const imageArray = [...new Set(String(product?.additionalImages).split(','))];

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await databases.getDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_PRODUCT_COLLECTION_ID!,
        productId
      );
      setProduct(response as unknown as ProductType);

    } catch (error) {
      console.error('Error fetching product:', error);
    } finally {
      setLoading(false);

    }
  };
 
  
  
  const getImageUrl = (fileId: string) => {
    // if (!fileId) return '/placeholder.jpg';

    try {
      const baseUrl = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
      const bucketId = process.env.NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID;
      const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
      
      return `${baseUrl}/storage/buckets/${bucketId}/files/${fileId}/view?project=${projectId}`;
    } catch (error) {
      console.error('Error generating image URL:', error);
      return '/placeholder.jpg';
    }
  };

  const handleRemoveAdditionalImage = async (imageId: string) => {
    if (!product) return;
    
    try {
      setDeletingImage(imageId);
     
      
      const updatedImages = String(product.additionalImages).split(',').filter(id => id !== imageId);
      
      await databases.updateDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_PRODUCT_COLLECTION_ID!,
        product.$id,
        { additionalImages: String(updatedImages) }
      );
      
      await fetchProduct();
    } catch (error) {
      console.error('Error removing additional image:', error);
    } finally {
      setDeletingImage(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="relative inline-flex">
          <div className="w-12 h-12 bg-primary rounded-full opacity-75 animate-ping"></div>
          <div className="w-12 h-12 bg-primary rounded-full absolute inset-0 animate-pulse"></div>
        </div>
        <div className="text-xl font-semibold text-primary animate-pulse">
          Loading Product Details...
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="p-4">
        <div className="text-xl font-semibold text-red-500">
          Product not found
        </div>
        <Link href="/dashboard/products" className="mt-4 inline-block text-primary">
          ← Back to Products
        </Link>
      </div>
    );
  }
  console.log(product);
  

  return (
    <div className="p-4">
      <div className="flex items-center mb-6">
        <Link href="/dashboard/products" className="mr-4 text-primary hover:underline flex items-center">
          <ArrowLeft size={16} className="mr-1" />
          Back to Products
        </Link>
        <h1 className="text-2xl font-bold flex-1">{product.name}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Main Image</h2>
            <div className="bg-dark-100 p-4 rounded-lg">
              {product.image ? (
                <div className="relative">
                  <img
                    src={getImageUrl(product.image)}
                    alt={product.name}
                    className="w-full h-auto object-contain rounded-lg"
                    style={{ maxHeight: '400px' }}
                    

                  />
                </div>
              ) : (
                <div className="text-center py-8 text-light-100/50">
                  No main image available
                </div>
              )}
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">Additional Images</h2>
            <div className="bg-dark-100 p-4 rounded-lg">
              {product.additionalImages && product.additionalImages.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {imageArray.map((imgId, idx) => (
                    <div key={imgId} className="relative group">
                      <Image
                        src={getImageUrl(imgId)}
                        alt={`${product.name}`}
                        className="w-full h-[150px] object-cover rounded-lg"
                        width={500}
                        height={500}
                        // onError={(e) => {
                        //   const img = e.target as HTMLImageElement;
                        //   img.src = '/placeholder.jpg';
                        // }}
                      />
                      <Button
                        onClick={() => handleRemoveAdditionalImage(imgId)}
                        disabled={deletingImage === imgId}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 opacity-50 group-hover:opacity-100 hover:bg-red-500 transition-opacity"
                        title="Remove image"
                      >
                        {deletingImage === imgId ? (
                          <Spinner className="w-4 h-4" />
                        ) : (
                          <Trash2 size={16} />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
  
              ) : (
                <div className="text-center py-8 text-light-100/50">
                  No additional images
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-dark-100 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Product Details</h2>
          
          <div className="space-y-4">
            <div>
              <p className="text-light-100/70 mb-1">Name</p>
              <p className="font-medium">{product.name}</p>
            </div>
            
            <div>
              <p className="text-light-100/70 mb-1">Stock</p>
              <p className={`font-medium ${product.stock < 10 ? 'text-red-500' : ''}`}>
                {product.stock}
                {product.stock < 10 && <span className="ml-1">↓ Low Stock</span>}
              </p>
            </div>
            
            <div>
              <p className="text-light-100/70 mb-1">Description</p>
              <p className="text-sm">{product.description}</p>
            </div>
            
            <div>
              <p className="text-light-100/70 mb-1">Weight Options & Pricing</p>
              <div className="space-y-2">
                {/* {product.weight.map((w, index) => (
                  <div key={w} className="flex items-center justify-between border-b border-dark-200 pb-2">
                    <span>{w}g</span>
                    <div className="flex gap-4">
                      <span>Local: ₹{product.local_price[index]}</span>
                      <span>Sale: ₹{product.sale_price[index]}</span>
                    </div>
                  </div>
                ))} */}

              </div>
            </div>
          </div>
          
          <div className="mt-8">
            <Link 
              href={`/dashboard/products?edit=${product.$id}`}
              className="btn-primary w-full block text-center"
            >
              Edit Product
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage; 