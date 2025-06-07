import React, { useState, useEffect, useCallback } from 'react';
import { Variants } from '@/types/product';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { MediaManager } from '../media/MediaManager';
import { getFilePreview } from '@/lib/appwrite';
import { productService } from '@/services/productService';
import Image from 'next/image';
import { toast } from 'react-toastify';
import { databases, ID } from '@/lib/appwrite';
import { Query } from 'appwrite';
import { Plus, Trash2, Image as ImageIcon, X } from 'lucide-react';
import { Dialog } from "../ui/dialog";
import { Alert, AlertDescription } from '@/components/ui/alert';

interface VariantFormProps {
  productId?: string;
  variants?: Variants[];
  onChange?: (variants: Variants[]) => void;
  onVariantCreate?: (variantData: Variants) => void;
}

type VariantUpdateData = {
  productId: string;
  price: number;
  weight: number;
  months: number;
  sale_price: number;
  stock: number;
  image: string;
  additionalImages: string[];
};

type VariantField = Exclude<keyof Variants, '$id'>;

const VariantForm: React.FC<VariantFormProps> = ({ 
  productId, 
  variants: initialVariants = [], 
  onChange, 
  onVariantCreate 
}) => {
  const [variants, setVariants] = useState<Variants[]>(() => {
    if (initialVariants.length > 0) {
      return initialVariants.map(variant => ({
        ...variant,
        additionalImages: variant.additionalImages || []
      }));
    }
    return [{
      productId: productId || "",
      price: 0,
      weight: 0,
      months: 1,
      sale_price: 0,
      stock: 0,
      image: "",
      additionalImages: []
    }];
  });

  const [loading, setLoading] = useState(false);
  const [variantImageIndexes, setVariantImageIndexes] = useState<{ index: number }>({ index: 0 });
  const [isSelectingVariant, setIsSelectingVariant] = useState(false);
  const [isSelectingVariantAdditional, setIsSelectingVariantAdditional] = useState(false);
  const [isMediaManagerOpen, setIsMediaManagerOpen] = useState(false);
  const [isMediaAdditionalManagerOpen, setIsMediaAdditionalManagerOpen] = useState(false);
  const isInitialMount = React.useRef(true);
  const previousVariants = React.useRef<Variants[]>([]);
  const [showMediaManager, setShowMediaManager] = useState(false);
  const [currentVariantIndex, setCurrentVariantIndex] = useState<number | null>(null);
  const [isAdditionalImages, setIsAdditionalImages] = useState(false);

  // Notify parent component of variant changes
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      previousVariants.current = variants;
      return;
    }

    // Check if variants have actually changed
    const hasChanged = JSON.stringify(previousVariants.current) !== JSON.stringify(variants);
    if (!hasChanged) {
      return;
    }

    previousVariants.current = variants;

    if (onChange) {
      onChange(variants);
    }
  }, [variants, onChange]);

  useEffect(() => {
    if (productId) {
      fetchVariants();
    }
  }, [productId]);

  // Optimize variant updates with useCallback
  const updateVariantState = useCallback((newVariants: Variants[]) => {
    setVariants(prev => {
      // Only update if the variants have actually changed
      if (JSON.stringify(prev) === JSON.stringify(newVariants)) {
        return prev;
      }
      return newVariants;
    });
  }, []);

  const fetchVariants = async () => {
    if (!productId) return;

    try {
      setLoading(true);
      const response = await databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_VARIANT_COLLECTION_ID!,
        [Query.equal('productId', productId)]
      );

      if (response.documents.length > 0) {
        const loadedVariants = response.documents.map(doc => ({
          $id: doc.$id,
          productId: doc.productId,
          price: Number(doc.price) || 0,
          weight: Number(doc.weight) || 0,
          sale_price: Number(doc.sale_price) || 0,
          stock: Number(doc.stock) || 0,
          months: Number(doc.months) || 1,
          image: doc.image || "",
          additionalImages: Array.isArray(doc.additionalImages) ? doc.additionalImages : [],
        }));

        console.log('Loaded variants:', loadedVariants);
        updateVariantState(loadedVariants);
      }
    } catch (error: any) {
      console.error('Error fetching variants:', error);
      if (error?.code === 401) {
        toast.error('Unauthorized access. Please login again.');
      } else if (!navigator.onLine) {
        toast.error('No internet connection. Please check your network.');
      } else {
        toast.error('Failed to fetch variants. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Add a new variant
  const addVariant = async () => {
    const newVariant: Variants = {
      productId: productId || "",
      price: 0,
      weight: 0,
      months: 1,
      sale_price: 0,
      stock: 0,
      image: "",
      additionalImages: [],
    };

    if (!productId) {
      updateVariantState([...variants, newVariant]);
      return;
    }

    try {
      setLoading(true);
      const result = await databases.createDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_VARIANT_COLLECTION_ID!,
        ID.unique(),
        {
          ...newVariant,
          productId: productId,
          price: Number(newVariant.price),
          weight: Number(newVariant.weight),
          months: Number(newVariant.months),
          sale_price: Number(newVariant.sale_price),
          stock: Number(newVariant.stock),
          additionalImages: [],
        }
      );

      const newVariantWithId = {
        ...newVariant,
        $id: result.$id,
        productId: productId
      };

      setVariants(prev => [...prev, newVariantWithId]);
      toast.success("New variant added");
    } catch (error) {
      console.error('Error adding variant:', error);
      toast.error("Failed to add variant");
    } finally {
      setLoading(false);
    }
  };

  // Update a variant
  const updateVariant = async (index: number, field: keyof VariantUpdateData, value: any) => {
    const variant = variants[index];
    if (!productId || !variant.$id) return;

    try {
      const updateData: VariantUpdateData = {
        productId: variant.productId || productId || '',
        price: Number(variant.price) || 0,
        weight: Number(variant.weight) || 0,
        months: Number(variant.months) || 1,
        sale_price: Number(variant.sale_price) || 0,
        stock: Number(variant.stock) || 0,
        image: variant.image || "",
        additionalImages: Array.isArray(variant.additionalImages) ? variant.additionalImages : []
      };

      // Update the changed field
      if (field === 'price' || field === 'weight' || field === 'months' || field === 'sale_price' || field === 'stock') {
        (updateData[field] as number) = Number(value);
      } else if (field === 'additionalImages' && Array.isArray(value)) {
        updateData.additionalImages = value;
      } else if (field === 'image') {
        updateData.image = value;
      }

      await databases.updateDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_VARIANT_COLLECTION_ID!,
        variant.$id,
        updateData
      );

      toast.success(`Updated ${field} successfully`);
    } catch (error: any) {
      console.error('Error updating variant:', error);
      toast.error(`Failed to update ${field}. Please try again.`);
    }
  };

  // Remove a variant
  const removeVariant = async (index: number) => {
    if (variants.length <= 1) {
      toast.error("Cannot delete the last variant");
      return;
    }

    const variant = variants[index];

    // If no productId or no variant.$id, just remove from UI
    if (!productId || !variant.$id) {
      const updatedVariants = variants.filter((_, i) => i !== index);
      setVariants(updatedVariants);
      return;
    }

    if (!window.confirm('Are you sure you want to delete this variant?')) {
      return;
    }

    try {
      setLoading(true);

      await databases.deleteDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_VARIANT_COLLECTION_ID!,
        variant.$id
      );

      // Update local state
      const updatedVariants = variants.filter((_, i) => i !== index);
      setVariants(updatedVariants);

      toast.success("Variant deleted successfully");
    } catch (error) {
      console.error('Error removing variant:', error);
      toast.error("Failed to delete variant");
    } finally {
      setLoading(false);
    }
  };

  // Handle media selection
  const handleMediaSelect = (files: { fileId: string; url: string }[]) => {
    if (files.length === 0) return;

    const fileId = files[0].fileId;
    const index = variantImageIndexes.index;
    const variant = variants[index];
    if (!variant) return;

    if (isSelectingVariant) {
      updateVariant(index, 'image', fileId);
      setIsSelectingVariant(false);
    } else if (isSelectingVariantAdditional) {
      const currentImages = [...variant.additionalImages];
      currentImages.push(fileId);
      updateVariant(index, 'additionalImages', currentImages);
      setIsSelectingVariantAdditional(false);
    }

    setIsMediaManagerOpen(false);
    setIsMediaAdditionalManagerOpen(false);
  };

  // Remove an additional image
  const removeVariantAdditionalImage = async (variantIndex: number, imageIndex: number) => {
    const variant = variants[variantIndex];
    if (!variant) return;

    const currentImages = [...variant.additionalImages];
    const updatedImages = currentImages.filter((_, i) => i !== imageIndex);

    // If no productId or no variant.$id, just update in the UI
    if (!productId || !variant.$id) {
      const updatedVariants = [...variants];
      updatedVariants[variantIndex] = {
        ...variant,
        additionalImages: updatedImages
      };
      setVariants(updatedVariants);
      return;
    }

    try {
      await databases.updateDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_VARIANT_COLLECTION_ID!,
        variant.$id,
        { additionalImages: updatedImages }
      );

      // Update local state
      const updatedVariants = [...variants];
      updatedVariants[variantIndex] = {
        ...variant,
        additionalImages: updatedImages
      };
      setVariants(updatedVariants);

      toast.success("Image removed successfully");
    } catch (error) {
      console.error('Error removing additional image:', error);
      toast.error("Failed to remove image");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    console.log(`Variant form input change - ${name}:`, value);
    
    setVariants(prev => prev.map(variant =>
      variant.productId === productId ? { ...variant, [name]: value } : variant
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submitting variant with data:", variants);
    
    try {
      // Create each variant individually
      const results = await Promise.all(
        variants.map(async (variant) => {
          const submissionData = {
            ...variant,
            price: Number(variant.price),
            weight: Number(variant.weight),
            months: Number(variant.months),
            sale_price: Number(variant.sale_price),
            stock: Number(variant.stock),
          };
          return await productService.createVariant(submissionData);
        })
      );
      
      console.log("Variant creation results:", results);
      
      // Clear the form
      setVariants([{
        productId: productId || "",
        price: 0,
        weight: 0,
        months: 1,
        sale_price: 0,
        stock: 0,
        image: "",
        additionalImages: [],
      }]);
      
      // Add to variants list
      setVariants(prev => [...prev, ...results]);
      
      // Notify parent
      if (onChange) {
        onChange([...variants, ...results]);
      }
    } catch (error) {
      console.error("Error creating variants:", error);
      toast.error("Failed to create variants");
    }
  };

  const handleAddVariant = () => {
    if (!productId) return;
    const newVariant: Variants = {
      productId,
      price: 0,
      weight: 0,
      sale_price: 0,
      stock: 0,
      months: 1,
      image: "",
      additionalImages: [],
    };
    if (onChange) onChange([...variants, newVariant]);
  };

  const handleRemoveVariant = (index: number) => {
    const newVariants = variants.filter((_, i) => i !== index);
    if (onChange) onChange(newVariants);
  };

  const handleVariantChange = (
    index: number,
    field: VariantField,
    value: string | number
  ) => {
    const newVariants = [...variants];
    const variant = newVariants[index];
    
    // Convert numeric fields
    if (typeof value === 'string' && ['price', 'weight', 'sale_price', 'stock', 'months'].includes(field)) {
      const numValue = Number(value) || 0;
      if (field === 'months' && numValue < 1) {
        value = 1;
      } else {
        value = numValue;
      }
    }

    // Update the variant
    newVariants[index] = {
      ...variant,
      [field]: value
    };

    // Update state and notify parent
    setVariants(newVariants);
    if (onChange) {
      onChange(newVariants);
    }

    // If we have a productId and variant.$id, update in database
    if (productId && variant.$id) {
      updateVariant(index, field as keyof VariantUpdateData, value);
    }
  };

  const handleImageSelect = (files: { fileId: string; url: string; mimeType?: string }[]) => {
    if (currentVariantIndex === null || files.length === 0) return;
    const newVariants = [...variants];
    if (isAdditionalImages) {
      newVariants[currentVariantIndex].additionalImages = [
        ...newVariants[currentVariantIndex].additionalImages,
        ...files.map(f => f.fileId)
      ];
    } else {
      newVariants[currentVariantIndex].image = files[0].fileId;
    }
    if (onChange) onChange(newVariants);
    setShowMediaManager(false);
  };

  const handleRemoveAdditionalImage = (variantIndex: number, imageId: string) => {
    const newVariants = [...variants];
    newVariants[variantIndex].additionalImages = newVariants[variantIndex].additionalImages.filter(
      id => id !== imageId
    );
    if (onChange) onChange(newVariants);
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
    <Card>
      <CardHeader>
        <CardTitle>Product Variants</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {variants.map((variant, index) => (
            <Card key={variant.$id || `new-variant-${index}`}>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Price (₹)</Label>
                    <Input
                      type="number"
                      value={variant.price}
                      onChange={(e) => handleVariantChange(index, 'price', e.target.value)}
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Sale Price (₹)</Label>
                    <Input
                      type="number"
                      value={variant.sale_price}
                      onChange={(e) => handleVariantChange(index, 'sale_price', e.target.value)}
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Weight (g)</Label>
                    <Input
                      type="number"
                      value={variant.weight}
                      onChange={(e) => handleVariantChange(index, 'weight', e.target.value)}
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Stock</Label>
                    <Input
                      type="number"
                      value={variant.stock}
                      onChange={(e) => handleVariantChange(index, 'stock', e.target.value)}
                      min="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Months</Label>
                    <Input
                      type="number"
                      value={variant.months}
                      onChange={(e) => handleVariantChange(index, 'months', e.target.value)}
                      min="1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Main Image</Label>
                    <div className="flex items-center gap-2">
                      {variant.image && (
                        <div className="relative w-20 h-20">
                          <Image
                            src={getImageUrl(variant.image)}
                            alt="Main variant"
                            fill
                            className="object-cover rounded-md"
                          />
                          <Button
                            variant="destructive"
                            size="icon"
                            className="absolute -top-2 -right-2 h-6 w-6"
                            onClick={() => handleVariantChange(index, 'image', '')}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                      <Button
                        variant="outline"
                        onClick={() => {
                          setCurrentVariantIndex(index);
                          setIsAdditionalImages(false);
                          setShowMediaManager(true);
                        }}
                      >
                        <ImageIcon className="h-4 w-4 mr-2" />
                        {variant.image ? "Change Image" : "Add Image"}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label>Additional Images</Label>
                    <div className="flex flex-wrap gap-2">
                      {variant.additionalImages.map((imageId) => (
                        <div key={imageId} className="relative w-20 h-20">
                          <Image
                            src={getImageUrl(imageId)}
                            alt="Additional variant"
                            fill
                            className="object-cover rounded-md"
                          />
                          <Button
                            variant="destructive"
                            size="icon"
                            className="absolute -top-2 -right-2 h-6 w-6"
                            onClick={() => handleRemoveAdditionalImage(index, imageId)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        onClick={() => {
                          setCurrentVariantIndex(index);
                          setIsAdditionalImages(true);
                          setShowMediaManager(true);
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Image
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex justify-end">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleRemoveVariant(index)}
                    disabled={variants.length === 1}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove Variant
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          <Button
            onClick={handleAddVariant}
            className="w-full"
            disabled={loading}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Variant
          </Button>
        </div>

        <Dialog
          open={showMediaManager}
          onClose={() => setShowMediaManager(false)}
          title="Select Image"
        >
          <MediaManager
            onSelect={handleImageSelect}
            onClose={() => setShowMediaManager(false)}
            allowMultiple={isAdditionalImages}
            open={showMediaManager}
          />
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default VariantForm;