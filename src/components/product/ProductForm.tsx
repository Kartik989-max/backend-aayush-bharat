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
import { createDocument, getFilePreview, databases, ID } from '@/lib/appwrite';
import { Query } from 'appwrite';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

const BUCKET_IDS = {
  video: "68447dfa00141d2b6986",
  image: "682762c0001ebf72e7f5"
} as const;

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

interface VideoData {
  fileId: string;
  url: string;
}

interface ProductFormData {
  name: string;
  description: string;
  category: string;
  tags: string;
  slug: string;
  ingredients: string;
  collections: string[];
  productVideo: VideoData[];
  variants: Variant[];
}

interface ProductFormProps {
  initialData?: Product | null;
  onSubmit: (data: Product) => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function ProductForm({ initialData, onSubmit, onCancel, loading = false }: ProductFormProps) {
  // Generate a slug from the initial name if one exists
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  };

  const initialName = initialData?.name || '';
  const initialSlug = initialData?.slug || (initialName ? generateSlug(initialName) : '');

  const [formData, setFormData] = useState<ProductFormData>({
    name: initialName,
    description: initialData?.description || '',
    category: initialData?.category || '',
    tags: initialData?.tags || '',
    slug: initialSlug,
    ingredients: initialData?.ingredients || '',
    variants: initialData?.variants.map(v => ({
      ...v,
      additionalImages: v.additionalImages || []
    })) || [],
    collections: initialData?.collections || [],
    productVideo: initialData?.productVideo?.map(videoId => ({
      fileId: videoId,
      url: videoId // Use the URL directly since it's already in the correct format
    })) || []
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
    
    // If the name field is being updated, also update the slug
    if (name === 'name') {
      const slug = value
        .toLowerCase()
        .replace(/[^\w\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-'); // Replace multiple hyphens with a single hyphen
      
      setFormData(prev => ({
        ...prev,
        [name]: value,
        slug
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleVariantChange = (variants: Variants[]) => {
    setFormData(prev => ({
      ...prev,
      variants: variants.map(variant => ({
        ...variant,
        additionalImages: variant.additionalImages || []
      }))
    }));
  };

  const handleMediaSelect = async (files: { fileId: string; url: string }[]) => {
    if (files.length === 0) return;
      try {
      // Create product_video relationship for each video
      const videoPromises = files.map(async (file) => {
        const videoData = {
          productId: initialData?.$id || '', // Will be updated after product creation
          videos: [file.url] // Store the video URL
        };
        
        // No need to destructure since videoData doesn't have an $id property
        const result = await createDocument(
          process.env.NEXT_PUBLIC_APPWRITE_PRODUCT_VIDEO_COLLECTION_ID!,
          videoData
        );
        
        return {
          fileId: result.$id, // Store the relationship document ID
          url: file.url
        };
      });

      const newVideos = await Promise.all(videoPromises);
      
      setFormData(prev => ({
        ...prev,
        productVideo: [...prev.productVideo, ...newVideos]
      }));
    } catch (error) {
      console.error('Error saving videos:', error);
      toast.error('Failed to save videos');
    }
    
    setShowMediaManager(false);
  };

  const handleRemoveVideo = async (videoId: string) => {
    try {
      // For existing videos, we need to find the product_video relationship first
      if (initialData?.$id) {
        // Query to find the product_video relationship
        const response = await databases.listDocuments(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
          process.env.NEXT_PUBLIC_APPWRITE_PRODUCT_VIDEO_COLLECTION_ID!,
          [
            Query.equal('productId', initialData.$id)
          ]
        );

        // Find the document that contains the video
        const videoDoc = response.documents.find(doc => 
          Array.isArray(doc.videos) && doc.videos.some((url: string) => url.includes(videoId))
        );

        if (videoDoc) {
          // Update the videos array to remove the video
          const updatedVideos = videoDoc.videos.filter((v: string) => !v.includes(videoId));
          
          if (updatedVideos.length === 0) {
            // If no videos left, delete the document
            await databases.deleteDocument(
              process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
              process.env.NEXT_PUBLIC_APPWRITE_PRODUCT_VIDEO_COLLECTION_ID!,
              videoDoc.$id
            );
          } else {
            // Otherwise update the document with remaining videos
            await databases.updateDocument(
              process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
              process.env.NEXT_PUBLIC_APPWRITE_PRODUCT_VIDEO_COLLECTION_ID!,
              videoDoc.$id,
              { videos: updatedVideos }
            );
          }
        }
      }

      // Update the form state
      setFormData(prev => ({
        ...prev,
        productVideo: prev.productVideo.filter(v => v.fileId !== videoId)
      }));
    } catch (error) {
      console.error('Error removing video:', error);
      toast.error('Failed to remove video');
    }
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

      // Check if there are valid variants with prices > 0
      const validVariants = formData.variants.filter(v => v.price > 0 && v.weight > 0 && v.stock > 0);
      if (validVariants.length === 0) {
        toast.error('You must add at least one variant with a price, weight, and stock greater than 0');
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
        productVideo: formData.productVideo.map(v => v.fileId) // Store the relationship document IDs
      };

      let productId: string;      if (initialData?.$id) {
        // Update existing product
        await productService.updateProduct(initialData.$id, productData);
        productId = initialData.$id;
        
        // Update product_video relationships with the productId
        if (formData.productVideo.length > 0) {
          const updatePromises = formData.productVideo.map(video => 
            databases.updateDocument(
              process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
              process.env.NEXT_PUBLIC_APPWRITE_PRODUCT_VIDEO_COLLECTION_ID!,
              video.fileId,
              { productId }
            )
          );
          await Promise.all(updatePromises);
        }
      } else {
        // For new products, we don't create the product here
        // It will be created by the parent component's handleSubmit method
        productId = "temp_" + ID.unique(); // Temporary ID for client-side use only
      }// Handle variants only for existing products
      // For new products, we'll include variants in the product data 
      // so the parent component can handle creation
      if (initialData?.$id && validVariants.length > 0) {
        const variantPromises = validVariants.map((variant) => {
          const variantData = {
            productId: productId,
            price: Number(variant.price),
            weight: Number(variant.weight),
            months: Math.min(Number(variant.months), 12),
            sale_price: Number(variant.sale_price),
            stock: Number(variant.stock),
            image: variant.image || "",
            additionalImages: variant.additionalImages || []
          };

          if (variant.$id) {
            // For existing variants, update with ID
            return productService.updateVariant(variant.$id, variantData);
          } else {
            // For new variants, create without $id
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
        name: formData.name,
        description: formData.description,
        category: formData.category,
        tags: formData.tags,
        slug: formData.slug,
        ingredients: formData.ingredients,
        variants: validVariants,
        collections: collections,
        productVideo: formData.productVideo.map(v => v.fileId) // Use the relationship document IDs
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
          <Label htmlFor="tags">Tags</Label>
          <Input
            id="tags"
            name="tags"
            value={formData.tags}
            onChange={handleInputChange}
            placeholder="Enter tags separated by commas"
            disabled={loading}
          />
        </div>        <div className="space-y-2">
          <Label htmlFor="slug">Slug (Auto-generated)</Label>
          <Input
            id="slug"
            name="slug"
            value={formData.slug}
            onChange={handleInputChange}
            placeholder="product-name"
            required
            disabled={true}
            className="bg-gray-100"
          />
          <p className="text-xs text-gray-500 mt-1">Automatically generated from the product name</p>
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
      </div>      <Dialog
        open={showMediaManager}
        onClose={() => setShowMediaManager(false)}
        title="Select Videos"
      >
        <form 
          onSubmit={(e) => e.preventDefault()} 
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
              handleMediaSelect(files);
            }}
            onClose={() => setShowMediaManager(false)}
            allowMultiple={true}
            open={showMediaManager}
            isForm={true}
          />
        </form>
      </Dialog>

      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Product Videos</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {formData.productVideo?.map((video) => (
              <div key={video.fileId} className="relative aspect-video">
                <video
                  src={video.url}
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
                    handleRemoveVideo(video.fileId);
                  }}
                  disabled={loading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>          <Button
            type="button"
            variant="outline"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowMediaManager(true);
            }}
            className="mt-4"
            disabled={loading}
            formNoValidate
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
          {loading ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              {initialData ? 'Updating...' : 'Creating...'}
            </div>
          ) : (
            initialData ? 'Update Product' : 'Create Product'
          )}
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


