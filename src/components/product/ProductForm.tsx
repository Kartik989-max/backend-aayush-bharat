'use client';

import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Card, CardContent } from '../ui/card';
import { Product, Variants } from '@/types/product';
import { productService } from '@/services/productService';
import { toast } from 'react-toastify';
import { Alert, AlertDescription } from '../ui/alert';
import { AlertCircle, Plus, X } from 'lucide-react';
import VariantForm from './VariantForm';
import { MediaManager } from '../media/MediaManager';
import { Dialog } from '../ui/dialog';
import { createDocument, getFilePreview } from '@/lib/appwrite';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

interface Category {
  $id: string;
  name: string;
}

interface Collection {
  $id: string;
  name: string;
}

interface Variant {
  $id?: string;
  weight: number;
  price: number;
  sale_price: number;
  stock: number;
  months: number;
  image?: string;
  additionalImages: string[];
}

interface ProductFormData {
  name: string;
  description: string;
  category: string;
  tags: string;
  slug: string;
  ingredients: string;
  collections: string[];
  productVideo: string[];
  variants: Variant[];
}

interface ProductFormProps {
  initialData?: Product | null;
  onSubmit: (data: Product) => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function ProductForm({ initialData, onSubmit, onCancel, loading = false }: ProductFormProps) {
  const [formData, setFormData] = useState<ProductFormData>({
    name: initialData?.name || '',
    description: initialData?.description || '',
    category: initialData?.category || '',
    tags: initialData?.tags || '',
    slug: initialData?.slug || '',
    ingredients: initialData?.ingredients || '',
    variants: initialData?.variants.map(v => ({
      ...v,
      additionalImages: v.additionalImages || []
    })) || [],
    collections: initialData?.collections || [],
    productVideo: initialData?.productVideo || []
  });

  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [showMediaManager, setShowMediaManager] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoadingData(true);
      const [cats, cols] = await Promise.all([
        productService.fetchCategories(),
        productService.fetchCollections()
      ]);
      setCategories(cats);
      setCollections(cols);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleVariantChange = (variants: Variant[]) => {
    setFormData(prev => ({
      ...prev,
      variants
    }));
  };

  const handleMediaSelect = (files: { fileId: string; url: string }[]) => {
    if (files.length === 0) return;
    
    setFormData(prev => ({
      ...prev,
      productVideo: [...(prev.productVideo || []), ...files.map(f => f.url)]
    }));
    
    setShowMediaManager(false);
  };

  const handleRemoveVideo = (videoUrl: string) => {
    setFormData(prev => ({
      ...prev,
      productVideo: prev.productVideo?.filter(url => url !== videoUrl) || []
    }));
  };

  const handleCollectionChange = (value: string) => {
    console.log('Selected collection:', value); // Debug log
    setFormData(prev => ({
      ...prev,
      collections: [value] // Store only the selected collection ID
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      // Validate months for all variants
      const invalidVariant = formData.variants.find(v => v.months > 12);
      if (invalidVariant) {
        toast.error('Months cannot be more than 12');
        return;
      }

      // Ensure collections is an array and not empty
      const collections = Array.isArray(formData.collections) && formData.collections.length > 0 
        ? formData.collections 
        : [];

      // Prepare product data
      const productData = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        tags: formData.tags,
        slug: formData.slug,
        ingredients: formData.ingredients,
        collections: collections,
        productVideo: formData.productVideo || [],
        variants: formData.variants.map(variant => ({
          ...variant,
          months: Math.min(Number(variant.months), 12)
        }))
      };

      console.log('Submitting product data:', productData); // Debug log

      let productId;
      
      if (initialData?.$id) {
        // Update existing product
        await productService.updateProduct(initialData.$id, productData);
        productId = initialData.$id;
      } else {
        // Create new product
        const result = await createDocument(
          process.env.NEXT_PUBLIC_APPWRITE_PRODUCT_COLLECTION_ID!,
          productData
        );
        productId = result.$id;
      }

      // Handle variants
      if (formData.variants.length > 0) {
        const variantPromises = formData.variants.map((variant) => {
          const variantData = {
            productId: productId,
            price: Number(variant.price),
            weight: Number(variant.weight),
            months: Math.min(Number(variant.months), 12),
            sale_price: Number(variant.sale_price),
            stock: Number(variant.stock),
            image: variant.image || "",
            additionalImages: variant.additionalImages
          };

          if (variant.$id) {
            return productService.updateVariant(variant.$id, variantData);
          } else {
            return createDocument(
              process.env.NEXT_PUBLIC_APPWRITE_VARIANT_COLLECTION_ID!,
              variantData
            );
          }
        });
        await Promise.all(variantPromises);
      }

      // Convert to Product type for the callback
      const product: Product = {
        $id: productId,
        name: productData.name,
        description: productData.description,
        category: productData.category,
        tags: productData.tags,
        slug: productData.slug,
        ingredients: productData.ingredients,
        variants: formData.variants,
        collections: collections,
        productVideo: productData.productVideo
      };

      onSubmit(product);
    } catch (error: any) {
      console.error('Form submission failed:', error);
      setError(error?.message || 'Failed to save product');
      toast.error('Failed to save product');
    }
  };

  if (isLoadingData) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="name">Product Name</Label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select
            value={formData.category}
            onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.$id} value={category.name}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="collections">Collection</Label>
          <Select
            value={formData.collections?.[0] || ''}
            onValueChange={handleCollectionChange}
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a collection" />
            </SelectTrigger>
            <SelectContent>
              {collections.map((collection) => (
                <SelectItem key={collection.$id} value={collection.$id}>
                  {collection.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="tags">Tags</Label>
          <Input
            id="tags"
            name="tags"
            value={formData.tags}
            onChange={handleInputChange}
            placeholder="Enter tags separated by commas"
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="slug">Slug</Label>
          <Input
            id="slug"
            name="slug"
            value={formData.slug}
            onChange={handleInputChange}
            placeholder="product-name"
            required
            disabled={loading}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          rows={4}
          required
          disabled={loading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="ingredients">Ingredients</Label>
        <Textarea
          id="ingredients"
          name="ingredients"
          value={formData.ingredients}
          onChange={handleInputChange}
          rows={4}
          placeholder="Enter ingredients separated by commas"
          disabled={loading}
        />
      </div>

      <Dialog
        open={showMediaManager}
        onClose={() => setShowMediaManager(false)}
        title="Select Videos"
      >
        <div 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              e.stopPropagation();
            }
          }}
        >
          <MediaManager
            onSelect={(files) => {
              if (files.length === 0) return;
              setFormData(prev => ({
                ...prev,
                productVideo: [...(prev.productVideo || []), ...files.map(f => f.url)]
              }));
              setShowMediaManager(false);
            }}
            onClose={() => setShowMediaManager(false)}
            allowMultiple={true}
            open={showMediaManager}
          />
        </div>
      </Dialog>

      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Product Videos</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {formData.productVideo?.map((videoUrl) => (
              <div key={videoUrl} className="relative aspect-video">
                <video
                  src={videoUrl}
                  className="w-full h-full object-cover rounded-md"
                  controls
                  preload="metadata"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute -top-2 -right-2 h-6 w-6"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleRemoveVideo(videoUrl);
                  }}
                  disabled={loading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowMediaManager(true);
            }}
            className="mt-4"
            disabled={loading}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Videos
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Product Variants</h3>
          <VariantForm
            variants={formData.variants}
            onChange={handleVariantChange}
            productId={initialData?.$id}
            disabled={loading}
          />
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button 
          type="submit" 
          className="flex-1"
          disabled={loading}
        >
          {loading ? 'Saving...' : initialData ? 'Update Product' : 'Create Product'}
        </Button>
        <Button 
          type="button" 
          variant="outline"
          onClick={onCancel}
          className="flex-1"
          disabled={loading}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}


