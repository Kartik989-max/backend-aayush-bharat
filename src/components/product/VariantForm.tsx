import React, { useState, useEffect } from 'react';
import { Variants } from '@/types/product';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { MediaManager } from '../media/MediaManager';
import { getFilePreview } from '@/lib/appwrite';
import Image from 'next/image';
import { toast } from 'react-toastify';
import { databases, ID } from '@/lib/appwrite';

interface VariantFormProps {
  productId?: string; // Optional - only used when saving to database later
  onChange?: (variants: Variants[]) => void; // Add callback for parent to get variant changes
}

const VariantForm: React.FC<VariantFormProps> = ({ productId, onChange }) => {
  // Simple state for variants with one default variant
  const [variants, setVariants] = useState<Variants[]>([{
    productId: "",
    price: 0,
    weight: 0,
    months: 1,
    sale_price: 0,
    stock: 0,
    image: "",
    additionalImages: [] // Changed to array for Appwrite compatibility
  }]);
  
  const [loading, setLoading] = useState(false);
  const [variantImageIndexes, setVariantImageIndexes] = useState<{ index: number }>({ index: 0 });
  const [isSelectingVariant, setIsSelectingVariant] = useState(false);
  const [isSelectingVariantAdditional, setIsSelectingVariantAdditional] = useState(false);
  
  // Media manager states
  const [isMediaManagerOpen, setIsMediaManagerOpen] = useState(false);
  const [isMediaAdditionalManagerOpen, setIsMediaAdditionalManagerOpen] = useState(false);
  
  // Load variants if productId is provided
  useEffect(() => {
    if (productId) {
      fetchVariants();
    }
  }, [productId]);
  
  const fetchVariants = async () => {
    if (!productId) return;
    
    try {
      setLoading(true);
        const response = await databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_VARIANT_COLLECTION_ID!,
        [`productId=${productId}`]
      );
      
      if (response.documents.length > 0) {
        // Transform documents to Variants type
        const loadedVariants = response.documents.map(doc => ({
          $id: doc.$id,
          productId: doc.productId,
          price: Number(doc.price),
          weight: Number(doc.weight),
          sale_price: Number(doc.sale_price),
          stock: Number(doc.stock),
          months: Number(doc.months),
          image: doc.image || "",
          // Convert string to array if needed
          additionalImages: doc.additionalImages 
            ? (Array.isArray(doc.additionalImages) 
              ? doc.additionalImages 
              : doc.additionalImages.split(',').filter(Boolean))
            : []
        }));
        
        setVariants(loadedVariants);
      }
    } catch (error) {
      console.error('Error fetching variants:', error);
    } finally {
      setLoading(false);
    }
  };
  // Add a new variant 
  const addVariant = async () => {
    // Create basic variant structure
    const newVariant: Variants = {
      productId: productId || "",
      price: 0,
      weight: 0,
      months: 1,
      sale_price: 0, 
      stock: 0,
      image: "",
      additionalImages: [] // Initialize as empty array
    };
    
    // If no productId, just add to local state
    if (!productId) {
      setVariants(prev => [...prev, newVariant]);
      return;
    }
    
    // If we have a productId, create a variant in the database
    try {
      setLoading(true);
      
      const result = await databases.createDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_VARIANT_COLLECTION_ID!,
        ID.unique(),
        {
          ...newVariant,
          productId: productId,
          // Ensure numeric fields are stored as numbers
          price: Number(newVariant.price),
          weight: Number(newVariant.weight),
          months: Number(newVariant.months),
          sale_price: Number(newVariant.sale_price),
          stock: Number(newVariant.stock),
          // Make sure additionalImages is an array
          additionalImages: []
        }
      );
      
      // Add the new variant to the local state with its database ID
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
  const updateVariant = async (index: number, field: keyof Variants, value: any) => {
    const variant = variants[index];
    
    // If no productId or no variant.$id, just update in the UI
    if (!productId || !variant.$id) {
      const isNumericField = field === 'price' || field === 'weight' || 
                            field === 'sale_price' || field === 'stock' || 
                            field === 'months';
      
      const updatedVariants = [...variants];
      updatedVariants[index] = {
        ...variant,
        [field]: isNumericField ? Math.floor(Number(value)) : value
      };
      setVariants(updatedVariants);
      return;
    }

    try {
      // Convert numeric fields to numbers
      const isNumericField = field === 'price' || field === 'weight' || 
                            field === 'sale_price' || field === 'stock' || 
                            field === 'months';
      
      const updateData = {
        [field]: isNumericField ? Math.floor(Number(value)) : value
      };
      
      await databases.updateDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_VARIANT_COLLECTION_ID!,
        variant.$id,
        updateData
      );
      
      // Update local state
      const updatedVariants = [...variants];
      updatedVariants[index] = {
        ...variant,
        [field]: isNumericField ? Math.floor(Number(value)) : value
      };
      setVariants(updatedVariants);
      
      toast.success(`Updated ${field} successfully`);
    } catch (error) {
      console.error('Error updating variant:', error);
      toast.error(`Failed to update ${field}`);
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
    
    if (isSelectingVariant) {
      // Update main image
      updateVariant(index, 'image', fileId);
      setIsSelectingVariant(false);
    } else if (isSelectingVariantAdditional) {
      // Update additional images
      const variant = variants[index];
      const currentImages = Array.isArray(variant.additionalImages) 
        ? [...variant.additionalImages] 
        : [];
        
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
    
    // If no productId or no variant.$id, just update in the UI
    if (!productId || !variant.$id) {
      const currentImages = Array.isArray(variant.additionalImages) 
        ? [...variant.additionalImages] 
        : [];
        
      const updatedImages = currentImages.filter((_, i) => i !== imageIndex);
      
      const updatedVariants = [...variants];
      updatedVariants[variantIndex] = {
        ...variant,
        additionalImages: updatedImages
      };
      setVariants(updatedVariants);
      return;
    }

    try {
      const currentImages = Array.isArray(variant.additionalImages) 
        ? [...variant.additionalImages] 
        : [];
        
      const updatedImages = currentImages.filter((_, i) => i !== imageIndex);

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
  // No more auto-notification of parent - variants are managed independently

  // Simple UI rendering with loading state
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-xl font-semibold">Manage Variants</h3>
          <p className="text-sm text-gray-500 mt-1">Each variant can have its own price, weight, and images</p>
        </div>
        <Button 
          type="button" 
          onClick={addVariant}
          className="bg-green-600 text-white hover:bg-green-700 px-6 py-2 text-base font-medium shadow-md"
        >
          + Add Variant
        </Button>
      </div>
      
      {variants.length === 0 && !loading ? (
        <div className="p-4 border-2 border-dashed border-gray-300 rounded-md text-center">
          <p className="text-gray-500 mb-3">No variants added yet</p>
          <Button 
            type="button" 
            onClick={addVariant}
            className="bg-green-600 text-white hover:bg-green-700 px-4 py-2"
          >
            + Add First Variant
          </Button>
        </div>
      ) : (
        <div className="grid gap-6">
          {variants.map((variant, index) => (
            <Card key={index} className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-medium">Variant {index + 1}</h3>
                {variants.length > 1 && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => removeVariant(index)}
                  >
                    Delete
                  </Button>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left column - Images */}
                <div className="space-y-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">Main Image</label>
                    <div className="relative h-40 border rounded-lg overflow-hidden">
                      {variant.image ? (
                        <Image
                          src={getFilePreview(variant.image) || ''}
                          alt="Variant"
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="h-full flex items-center justify-center bg-gray-50">
                          <p className="text-gray-400">No image</p>
                        </div>
                      )}
                    </div>
                    <Button 
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setVariantImageIndexes({ index });
                        setIsSelectingVariant(true);
                        setIsMediaManagerOpen(true);
                      }}
                    >
                      Choose Image
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Additional Images</label>
                    <div className="grid grid-cols-3 gap-2">
                      {Array.isArray(variant.additionalImages) && variant.additionalImages.map((imageId, imgIndex) => (
                        imageId && (
                          <div key={imgIndex} className="relative h-20">
                            <Image
                              src={getFilePreview(imageId)}
                              alt={`Additional ${imgIndex + 1}`}
                              fill
                              className="object-cover rounded"
                            />
                            <button
                              onClick={() => removeVariantAdditionalImage(index, imgIndex)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                              type="button"
                            >
                              ×
                            </button>
                          </div>
                        )
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        className="h-20"
                        onClick={() => {
                          setVariantImageIndexes({ index });
                          setIsSelectingVariantAdditional(true);
                          setIsMediaAdditionalManagerOpen(true);
                        }}
                      >
                        +
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Right column - Details */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Price (₹)</label>
                      <Input 
                        type="number"
                        value={variant.price}
                        onChange={(e) => updateVariant(index, 'price', e.target.value)}
                        min="0"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Sale Price (₹)</label>
                      <Input 
                        type="number"
                        value={variant.sale_price}
                        onChange={(e) => updateVariant(index, 'sale_price', e.target.value)}
                        min="0"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Weight (grams)</label>
                      <Input 
                        type="number"
                        value={variant.weight}
                        onChange={(e) => updateVariant(index, 'weight', e.target.value)}
                        min="0"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Duration (months)</label>
                      <Input 
                        type="number"
                        value={variant.months}
                        onChange={(e) => updateVariant(index, 'months', e.target.value)}
                        min="1"
                        required
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-sm font-medium">Stock</label>
                      <Input 
                        type="number"
                        value={variant.stock}
                        onChange={(e) => updateVariant(index, 'stock', e.target.value)}
                        min="0"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {variants.length > 0 && (
        <div className="flex justify-center mt-4">
          <Button 
            type="button" 
            onClick={addVariant}
            className="bg-green-600 text-white hover:bg-green-700 px-4 py-2"
          >
            + Add Another Variant
          </Button>
        </div>
      )}

      {/* Media Manager Modal */}
      {isMediaManagerOpen && (
        <MediaManager
          onClose={() => setIsMediaManagerOpen(false)}
          onSelect={handleMediaSelect}
        />
      )}

      {/* Additional Images Media Manager Modal */}
      {isMediaAdditionalManagerOpen && (
        <MediaManager
          onClose={() => setIsMediaAdditionalManagerOpen(false)}
          onSelect={handleMediaSelect}
        />
      )}
    </div>
  );
};

export default VariantForm;