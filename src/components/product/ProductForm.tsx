'use client';

import React, { useState, useEffect, useCallback } from "react";
import type { Product, Variants } from "@/types/product";
import { productService } from "@/services/productService";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import VariantForm from "./VariantForm";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Alert, AlertDescription } from "../ui/alert";
import { AlertCircle } from "lucide-react";
import { databases } from "@/lib/appwrite";
import { toast } from "react-toastify";
import { ID, Query } from "appwrite";
import ProductVideoForm from './ProductVideoForm';
import { MediaManager } from '../media/MediaManager';
import { Dialog } from '../ui/dialog';
import { Image as ImageIcon, Plus, X } from 'lucide-react';
import Image from 'next/image';

interface Category {
  $id: string;
  name: string;
}

interface Collection {
  $id: string;
  name: string;
}

interface ProductFormProps {
  initialData: Product | null;
  onSubmit: (data: Product) => void;
  onCancel: () => void;
}

const ProductCreateForm: React.FC<ProductFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
}) => {
  const [form, setForm] = useState<Product>({
    $id: initialData?.$id || "",
    $collectionId: initialData?.$collectionId || "",
    $databaseId: initialData?.$databaseId || "",
    $createdAt: initialData?.$createdAt || "",
    $updatedAt: initialData?.$updatedAt || "",
    $permissions: initialData?.$permissions || [],
    name: initialData?.name || "",
    description: initialData?.description || "",
    category: initialData?.category || "",
    tags: initialData?.tags || "",
    ingredients: initialData?.ingredients || "",
    slug: initialData?.slug || "",
    collections: initialData?.collections || [],
    variants: initialData?.variants || [],
    productVideo: initialData?.productVideo || null,
    image: initialData?.image || "",
    additionalImages: initialData?.additionalImages || [],
    videos: initialData?.videos || [],
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [variants, setVariants] = useState<Variants[]>(initialData?.variants || []);
  const [showMediaManager, setShowMediaManager] = useState(false);
  const [isAdditionalImages, setIsAdditionalImages] = useState(false);
  const [isVideos, setIsVideos] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cats, cols] = await Promise.all([
          productService.fetchCategories(),
          productService.fetchCollections()
        ]);
        setCategories(cats);
        setCollections(cols);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load categories and collections");
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchData();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleVariantChange = useCallback((updatedVariants: Variants[]) => {
    setVariants(updatedVariants);
  }, []);

  const handleVideoChange = useCallback((videoData: any) => {
    setForm(prev => ({
      ...prev,
      productVideo: videoData
    }));
  }, []);

  const createDefaultVariant = async (productId: string) => {
    try {
      console.log("Creating variant for product ID:", productId);

      // Define numeric values explicitly
      const variantData: Variants = {
        productId: productId,
        price: 0,
        weight: 0,
        months: 1,
        sale_price: 0,
        stock: 0,
        image: "",
        additionalImages: [],
      };

      console.log("Saving variant data:", variantData);

      // Create variant document
      const result = await productService.createVariant(variantData);

      console.log("Variant created:", result);
      return result;
    } catch (error) {
      console.error("Error creating variant:", error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const slug = form.slug || form.name.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-_]/g, "");

      const submissionData = {
        name: form.name,
        description: form.description,
        category: form.category,
        tags: form.tags,
        ingredients: form.ingredients,
        slug: slug,
        collections: form.collections,
        variants: variants.map((v) => ({
          ...v,
          price: Number(v.price),
          weight: Number(v.weight),
          months: Number(v.months),
          sale_price: Number(v.sale_price),
          stock: Number(v.stock),
        })),
        productVideo: form.productVideo,
        image: form.image,
        additionalImages: form.additionalImages,
        videos: form.videos,
      };

      let data: Product;

      if (initialData?.$id) {
        data = await productService.updateProduct(initialData.$id, submissionData);
        toast.success("Product updated successfully!");
      } else {
        data = await productService.createProduct(submissionData);
        console.log("Product created with ID:", data.$id);

        setForm((prevForm) => ({
          ...prevForm,
          ...data,
        }));

        const variantPromises = variants.map(async (variant) => {
          const variantData = {
            ...variant,
            productId: data.$id,
            price: Number(variant.price),
            weight: Number(variant.weight),
            months: Number(variant.months),
            sale_price: Number(variant.sale_price),
            stock: Number(variant.stock)
          };
          return await productService.createVariant(variantData);
        });

        const createdVariants = await Promise.all(variantPromises);
        data.variants = createdVariants;

        if (createdVariants.length === 0) {
          const defaultVariant = await createDefaultVariant(data.$id);
          data.variants = [defaultVariant];
        }

        toast.success("Product created successfully!");
      }

      onSubmit(data);
    } catch (err: any) {
      const errorMessage = err?.message || "Failed to save changes";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleMediaSelect = (files: { fileId: string; url: string; mimeType?: string }[]) => {
    if (files.length === 0) return;

    if (isAdditionalImages) {
      setForm(prev => ({
        ...prev,
        additionalImages: [...(prev.additionalImages || []), ...files.map(f => f.fileId)]
      }));
    } else if (isVideos) {
      setForm(prev => ({
        ...prev,
        videos: [...(prev.videos || []), ...files.map(f => f.fileId)]
      }));
    } else {
      setForm(prev => ({
        ...prev,
        image: files[0].fileId
      }));
    }

    setShowMediaManager(false);
  };

  const handleRemoveImage = (imageId: string) => {
    setForm(prev => ({
      ...prev,
      additionalImages: prev.additionalImages?.filter(id => id !== imageId) || []
    }));
  };

  const handleRemoveVideo = (videoId: string) => {
    setForm(prev => ({
      ...prev,
      videos: prev.videos?.filter(id => id !== videoId) || []
    }));
  };

  const getImageUrl = (fileId: string) => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
      const bucketId = process.env.NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID;
      const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;

      return `${baseUrl}/storage/buckets/${bucketId}/files/${fileId}/view?project=${projectId}`;
    } catch (error) {
      console.error("Error generating image URL:", error);
      return '';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{initialData ? "Edit Product" : "Create New Product"}</CardTitle>
      </CardHeader>
      <CardContent>
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
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={form.category}
                onValueChange={(value) => setForm({ ...form, category: value })}
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
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ingredients">Ingredients</Label>
              <Textarea
                id="ingredients"
                name="ingredients"
                value={form.ingredients}
                onChange={handleChange}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                name="tags"
                value={form.tags}
                onChange={handleChange}
                placeholder="Separate tags with commas"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug (Optional)</Label>
              <Input
                id="slug"
                name="slug"
                value={form.slug}
                onChange={handleChange}
                placeholder="Will be generated from name if empty"
              />
            </div>

            <div className="space-y-2">
              <Label>Collections</Label>
              <Select
                value={form.collections[0] || ""}
                onValueChange={(value) => setForm({ ...form, collections: [value] })}
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
              <Label>Main Image</Label>
              <div className="flex items-center gap-2">
                {form.image && (
                  <div className="relative w-20 h-20">
                    <Image
                      src={getImageUrl(form.image)}
                      alt="Main product"
                      fill
                      className="object-cover rounded-md"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6"
                      onClick={() => setForm({ ...form, image: '' })}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsAdditionalImages(false);
                    setIsVideos(false);
                    setShowMediaManager(true);
                  }}
                >
                  <ImageIcon className="h-4 w-4 mr-2" />
                  {form.image ? "Change Image" : "Add Image"}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Additional Images</Label>
              <div className="flex flex-wrap gap-2">
                {form.additionalImages?.map((imageId) => (
                  <div key={imageId} className="relative w-20 h-20">
                    <Image
                      src={getImageUrl(imageId)}
                      alt="Additional product"
                      fill
                      className="object-cover rounded-md"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6"
                      onClick={() => handleRemoveImage(imageId)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsAdditionalImages(true);
                    setIsVideos(false);
                    setShowMediaManager(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Image
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Videos</Label>
              <div className="flex flex-wrap gap-2">
                {form.videos?.map((videoId) => (
                  <div key={videoId} className="relative w-20 h-20">
                    <video
                      src={getImageUrl(videoId)}
                      className="w-full h-full object-cover rounded-md"
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
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsVideos(true);
                    setIsAdditionalImages(false);
                    setShowMediaManager(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Video
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <Label>Product Video</Label>
            <ProductVideoForm
              productId={form.$id}
              initialData={form.productVideo}
              onChange={handleVideoChange}
            />
          </div>

          <div className="space-y-4">
            <Label>Variants</Label>
            <VariantForm
              variants={variants}
              onChange={handleVariantChange}
              productId={form.$id}
            />
          </div>

          <div className="flex gap-4">
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? "Saving..." : initialData ? "Update Product" : "Create Product"}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>

      <Dialog
        open={showMediaManager}
        onClose={() => setShowMediaManager(false)}
        title={isVideos ? "Select Video" : "Select Image"}
      >
        <MediaManager
          onSelect={handleMediaSelect}
          onClose={() => setShowMediaManager(false)}
          allowMultiple={isAdditionalImages}
          open={showMediaManager}
          mediaType={isVideos ? "video" : "image"}
        />
      </Dialog>
    </Card>
  );
};

export default ProductCreateForm;


