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
}

export default function ProductForm({ initialData, onSubmit, onCancel }: ProductFormProps) {
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

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [showMediaManager, setShowMediaManager] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [cats, cols] = await Promise.all([
        productService.fetchCategories(),
        productService.fetchCollections()
      ]);
      setCategories(cats);
      setCollections(cols);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev: ProductFormData) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleVariantChange = (variants: Variant[]) => {
    setFormData((prev: ProductFormData) => ({
      ...prev,
      variants
    }));
  };

  const handleMediaSelect = (files: { fileId: string; url: string }[]) => {
    if (files.length === 0) return;
    
    setFormData((prev: ProductFormData) => ({
      ...prev,
      productVideo: [...(prev.productVideo || []), ...files.map(f => f.fileId)]
    }));
    setShowMediaManager(false);
  };

  const handleRemoveVideo = (videoId: string) => {
    setFormData((prev: ProductFormData) => ({
      ...prev,
      productVideo: prev.productVideo?.filter(id => id !== videoId) || []
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Prepare product data
      const productData = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        tags: formData.tags,
        slug: formData.slug,
        ingredients: formData.ingredients,
        collections: formData.collections,
        productVideo: formData.productVideo || [],
        variants: formData.variants
      };

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
            months: Number(variant.months),
            sale_price: Number(variant.sale_price),
            stock: Number(variant.stock),
            image: variant.image || "",
            additionalImages: variant.additionalImages
          };

          if (variant.$id) {
            // Update existing variant
            return productService.updateVariant(variant.$id, variantData);
          } else {
            // Create new variant
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
        collections: productData.collections,
        productVideo: productData.productVideo
      };

      onSubmit(product);
      toast.success(initialData ? 'Product updated successfully' : 'Product created successfully');
    } catch (error: any) {
      console.error('Form submission failed:', error);
      setError(error?.message || 'Failed to save product');
      toast.error('Failed to save product');
    } finally {
      setLoading(false);
    }
  };

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
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleInputChange}
            className="w-full rounded-md border border-input bg-background px-3 py-2"
            required
          >
            <option value="">Select a category</option>
            {categories.map((category) => (
              <option key={category.$id} value={category.name}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="collections">Collection</Label>
          <select
            id="collections"
            name="collections"
            value={formData.collections[0] || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, collections: [e.target.value] }))}
            className="w-full rounded-md border border-input bg-background px-3 py-2"
          >
            <option value="">Select a collection</option>
            {collections.map((collection) => (
              <option key={collection.$id} value={collection.$id}>
                {collection.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="tags">Tags</Label>
          <Input
            id="tags"
            name="tags"
            value={formData.tags}
            onChange={handleInputChange}
            placeholder="Enter tags separated by commas"
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
        />
      </div>

      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Product Videos</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {formData.productVideo?.map((videoId) => (
              <div key={videoId} className="relative aspect-video">
                <video
                  src={(videoId)}
                  className="w-full h-full object-cover rounded-md"
                  controls
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute -top-2 -right-2 h-6 w-6"
                  onClick={() => handleRemoveVideo(videoId)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          <Button
            variant="outline"
            onClick={() => setShowMediaManager(true)}
            className="mt-4"
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
          />
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button 
          type="submit" 
          className="flex-1"
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save Product'}
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

      <Dialog
        open={showMediaManager}
        onClose={() => setShowMediaManager(false)}
        title="Select Videos"
      >
        <MediaManager
          onSelect={handleMediaSelect}
          onClose={() => setShowMediaManager(false)}
          allowMultiple={true}
          open={showMediaManager}
        />
      </Dialog>
    </form>
  );
}


