import React, { useState, useEffect } from "react";
import { productService } from "@/services/productService";
import {
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ID } from "appwrite";
import { storage } from "@/lib/appwrite";
import { getFilePreview } from "@/lib/appwrite";
import { MediaManager } from "../media/MediaManager";
interface Category {
  $id: string;
  name: string;
}
import { Trash2, Plus } from "lucide-react";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import {
  Form,
  FormField,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Select } from "@/components/ui/select";
import { Textarea } from "../ui/textarea";
import { Badge } from "../ui/badge";
import { Product } from "@/types/product";
import { databases } from "@/lib/appwrite";
interface ProductFormProps {
  initialData: Product | null;
  onSubmit: (data: any) => void;
}

type Variant = {
  productId: string;
  price: number;
  weight: number;
  sale_price: number;
  stock: number;
  image: string;
  additionalImages: string[];
};
const ProductCreateForm: React.FC<ProductFormProps> = ({
  initialData,
  onSubmit,
}) => {
  const [form, setForm] = useState<Product>({
    name: initialData?.name || "",
    description: initialData?.description || "",
    rating: initialData?.rating || 0,
    category: initialData?.category || [],
    weight: initialData?.weight || 0,
    image: initialData?.image || "",
    additionalImages: initialData?.additionalImages || [],
    stock: initialData?.stock || 0,
    price: initialData?.price || 0,
    sale_price: initialData?.sale_price || 0,
    tags: initialData?.tags || [],
    ingredients: initialData?.ingredients || [],
    slug: initialData?.slug || "",
    $id: initialData?.$id || "",
    variants: initialData?.variants || [],
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  const [imageFile, setImageFile] = useState<File | null>(null);

  const [imagePreview, setImagePreview] = useState<string | null>(
    initialData?.image ? getFilePreview(initialData.image) : null
  );

  const [additionalImageFiles, setAdditionalImageFiles] = useState<File[]>([]);
  const [additionalImagePreviews, setAdditionalImagePreviews] = useState<
    string[]
  >([]);

  const [isMediaManagerOpen, setIsMediaManagerOpen] = useState(false);
  const [isSelectingAdditional, setIsSelectingAdditional] = useState(false);
  const [isSelectingVariant, setIsSelectingVariant] = useState(false);
  const [isSelectingVariantAdditional, setIsSelectingVariantAdditional] = useState(false);

const [variantImagePreviews, setVariantImagePreviews] = useState<string[]>([]);
const [variantImageIndexes, setVariantImageIndexes] = useState<{index: number | null}>({index: null});
const [variantAdditionalImagePreviews, setVariantAdditionalImagePreviews] = useState<string[][]>([]);
// const updateVariantImage = async (index: number, file: File) => {
//   // Upload file and update image in form state
//   try {
//     const fileRes = await storage.createFile(
//       process.env.NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID!,
//       ID.unique(),
//       file
//     );
//     setForm((prev) => {
//       const updatedVariants = [...prev.variants];
//       updatedVariants[index].image = fileRes.$id;
//       return { ...prev, variants: updatedVariants };
//     });
//     // Update preview
//     setVariantImagePreviews((prev) => {
//       const updated = [...prev];
//       updated[index] = URL.createObjectURL(file);
//       return updated;
//     });
//   } catch (error) {
//     // handle error if needed
//     console.error("Failed to upload variant image", error);
//   }
// };


const handleMediaSelect = (fileId: string | string[], url: string | string[], index: string = '') => {
  if (isSelectingAdditional) {
    setForm((prev) => ({
      ...prev,
      additionalImages: [...prev.additionalImages, ...(Array.isArray(fileId) ? fileId : [fileId])],
    }));
    setAdditionalImagePreviews((prev) => [...prev, ...(Array.isArray(url) ? url : [url])]);
  } else if (isSelectingVariant && variantImageIndexes.index !== null) {
    setForm((prev) => {
      const updatedVariants = [...prev.variants];
      updatedVariants[variantImageIndexes.index!].image = Array.isArray(fileId) ? fileId[0] : fileId;
      return { ...prev, variants: updatedVariants };
    });
    setVariantImagePreviews((prev) => {
      const updated = [...prev];
      updated[variantImageIndexes.index!] = Array.isArray(url) ? url[0] : url;
      return updated;
    });
    setIsSelectingVariant(false);
    setVariantImageIndexes({ index: null });
  } else if (isSelectingVariantAdditional && variantImageIndexes.index !== null) {
    setForm((prev) => {
      const updatedVariants = [...prev.variants];
      updatedVariants[variantImageIndexes.index!].additionalImages = [
        ...(updatedVariants[variantImageIndexes.index!].additionalImages || []),
        ...(Array.isArray(fileId) ? fileId : [fileId]),
      ];
      return { ...prev, variants: updatedVariants };
    });
    setVariantAdditionalImagePreviews((prev) => {
      const updated = [...prev];
      updated[variantImageIndexes.index!] = [
        ...(updated[variantImageIndexes.index!] || []),
        ...(Array.isArray(url) ? url : [url]),
      ];
      return updated;
    });
    setIsSelectingVariantAdditional(false);
    setVariantImageIndexes({ index: null });
  } else {
    setForm((prev) => ({
      ...prev,
      image: Array.isArray(fileId) ? fileId[0] : fileId,
    }));
    setImagePreview(Array.isArray(url) ? url[0] : url);
  }
  setIsMediaManagerOpen(false);
};
  useEffect(() => {
    const fetchCategories = async () => {
      const cats = await productService.fetchCategories();
      setCategories(cats);
      setLoadingCategories(false);
    };
    fetchCategories();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value === "" ? "" : Number(value) }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let imageFileId = form.image;
      if (imageFile) {
        const fileRes = await storage.createFile(
          process.env.NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID!,
          ID.unique(),
          imageFile
        );
        imageFileId = fileRes.$id;
      }

      let additionalImageIds = [...form.additionalImages];
      if (additionalImageFiles.length > 0) {
        const uploadPromises = additionalImageFiles.map((file) =>
          storage.createFile(
            process.env.NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID!,
            ID.unique(),
            file
          )
        );
        const results = await Promise.all(uploadPromises);
        additionalImageIds = results.map((res) => res.$id);
      }

      const slug = form.name.trim().replace(/\s+/g, "_");
      console.log();

      const submissionData = {
        ...form,
        image: imageFileId,
        additionalImages: additionalImageIds,
        slug: slug,
        variants:[],
      };

      let data;
      if (initialData?.$id) {
        data = await productService.updateProduct(
          initialData.$id,
          submissionData
        );
      } else {
        data = await productService.createProduct(submissionData);
      }

      if (data) console.log("Success:", data);

      const productId=data.$id;
      const variantIds:string[]=[];
      for (let i = 0; i < form.variants.length; i++) {
      const variant = form.variants[i];

      // If variant image is a file, upload it
      let variantImageId = variant.image;
      if (variant.image) {
        const fileRes = await storage.createFile(
          process.env.NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID!,
          ID.unique(),
          variantImageId
        );
        variantImageId = fileRes.$id;
      }

      // If additionalImages is an array of files, upload them
      let variantAdditionalImageIds = variant.additionalImages || [];
      if (
        Array.isArray(variant.additionalImages) &&
        variant.additionalImages.length > 0 &&
        typeof variant.additionalImages[0] !== "string"
      ) {
        const uploadPromises = variant.additionalImages.map((file: File) =>
          storage.createFile(
            process.env.NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID!,
            ID.unique(),
            file
          )
        );
        const results = await Promise.all(uploadPromises);
        variantAdditionalImageIds = results.map((res) => res.$id);
      }

       // Create variant in DB
       


       const variantRes = await databases.createDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_VARIANT_COLLECTION_ID!,
        ID.unique(),
        {
          price:Number(variant.price),
          weight:Number(variant.weight),
          stock:Number(variant.stock),
          sale_price:Number(variant.sale_price),
        productId,
        image: variantImageId,
        additionalImages: String(variantAdditionalImageIds),
        }
      );
      variantIds.push(variantRes.$id);

    }

    // 6. Update product with variant IDs
    // await productService.updateProduct(productId, {
    //   variants: variantIds,
    // });

    onSubmit({ data, variants: variantIds });
    } catch (err: any) {
      setError(err?.message || "Failed to save changes");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveProduct = () => {
    setForm((prev) => ({ ...prev, image: "" }));
    setImagePreview("");
  };

  const handleAdditionalImageRemove = (index: number) => {
    setForm((prev) => ({
      ...prev,
      additionalImages: prev.additionalImages.filter((_, i) => i !== index),
    }));
    setAdditionalImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

 

  const [variants, setVariants] = useState<Variant[]>([
    { weight: 0, price: 0, sale_price: 0, stock: 0,productId:form.$id,image:"",additionalImages:"" },
  ]);

   const addVariant = () => {
  setForm((prev) => ({
    ...prev,
    variants: [
      ...prev.variants,
      {productId:'', price: 0, weight: 0, sale_price: 0, image: '', stock: 0 ,additionalImages:''
      },
    ],
  }));
};

  
const updateVariant = (index: number, field: keyof Variant, value: any) => {
  setForm((prev) => {
    const updatedVariants = [...prev.variants];
    updatedVariants[index][field] = value;
    return { ...prev, variants: updatedVariants };
  });
};

const removeVariant = (index: number) => {
  setForm((prev) => {
    const updatedVariants = prev.variants.filter((_, i) => i !== index);
    return { ...prev, variants: updatedVariants };
  });
};


// For variant main image
const updateVariantImage = async (index: number, file: File) => {
  try {
    const fileRes = await storage.createFile(
      process.env.NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID!,
      ID.unique(),
      file
    );
    setForm((prev) => {
      const updatedVariants = [...prev.variants];
      updatedVariants[index].image = fileRes.$id;
      return { ...prev, variants: updatedVariants };
    });
    // Update preview
    setVariantImagePreviews((prev) => {
      const updated = [...prev];
      updated[index] = URL.createObjectURL(file);
      return updated;
    });
  } catch (error) {
    console.error("Failed to upload variant image", error);
  }
};
// For variant additional images
// const addVariantAdditionalImage = (index: number, file: string) => {
//   setForm((prev) => {
//     const updated = [...prev.variants];
//     updated[index].additionalImages = [
//       ...updated[index].additionalImages,
//       file,
//     ];
//     return { ...prev, variants: updated };
//   });
// };



const removeVariantAdditionalImage = (index: number, fileIndex: number) => {
  setForm((prev) => {
    const updated = [...prev.variants];
    updated[index].additionalImages = updated[index].additionalImages.filter(
      (_, i) => i !== fileIndex
    );
    return { ...prev, variants: updated };
  });
};
console.log(form);


  return (
    <div>
      <form
        onSubmit={handleSubmit}
        className="space-y-5 max-w-9xl mx-auto bg-white p-6 rounded shadow text-lg"
      >
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className=" gap-8">
          <div className="shadow-lg p-6 rounded-lg">
            <h1 className="text-xl font-semibold">Basic Information</h1>
            <p className="mb-6">
              Update product information below. You can drag and drop images to
              reorder them.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label>Name</label>
                <Input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="w-full mt-2 p-2 border rounded"
                  required
                />
              </div>

              <div>
                <label>Rating</label>
                <Input
                  name="rating"
                  type="number"
                  value={form.rating}
                  onChange={handleNumberChange}
                  className="w-full mt-2 p-2 border rounded"
                  min={0}
                  max={5}
                  required
                />
              </div>

              <div>
                <label className="mb-2">Category</label>
                {loadingCategories ? (
                  <div>Loading categories...</div>
                ) : (
                  <Select
                    value={form.category[0]}
                    onValueChange={(value) =>
                      setForm((prev) => ({ ...prev, category: Array(value) }))
                    }
                    required
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent className="mt-2">
                      {categories.map((cat) => (
                        <SelectItem key={cat.$id} value={cat.name}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div>
                <label>Weight</label>
                <Input
                  name="weight"
                  type="number"
                  value={form.weight}
                  onChange={handleNumberChange}
                  className="w-full p-2 mt-2 border rounded"
                  required
                />
              </div>

              <div>
                <label>Stock</label>
                <input
                  name="stock"
                  type="number"
                  value={form.stock}
                  onChange={handleNumberChange}
                  className="w-full mt-2 p-2 border rounded"
                  min={0}
                  required
                />
              </div>

              <div>
                <label>Price</label>
                <input
                  name="price"
                  type="number"
                  value={form.price}
                  onChange={handleNumberChange}
                  className="w-full p-2 mt-2 border rounded"
                  min={0}
                  required
                />
              </div>

              <div>
                <label>Sale Price</label>
                <input
                  name="sale_price"
                  type="number"
                  value={form.sale_price}
                  onChange={handleNumberChange}
                  className="w-full mt-2 p-2 border rounded"
                />
              </div>

              <div>
                <label>Tags (comma separated)</label>
                <input
                  name="tags"
                  value={form.tags}
                  onChange={handleChange}
                  className="w-full p-2 mt-2 border rounded"
                />
              </div>

              <div>
                <label>Ingredients (comma separated)</label>
                <input
                  name="ingredients"
                  value={form.ingredients}
                  onChange={handleChange}
                  className="w-full p-2 mt-2 border rounded"
                />
              </div>

              <div>
                <label>Description</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  className="w-full mt-2 p-2 border rounded"
                  required
                />
              </div>
            </div>
          </div>

          <div className="shadow-lg mt-6 p-6 rounded-lg">
            <h1>Product Media</h1>

            <div className="space-y-2">
              <div>
                <Label className="text-base">
                  Product Images <span className="text-red-500">*</span>
                </Label>
                <p className="text-sm text-muted-foreground">
                  Images will automatically sync to ALL variants
                </p>
              </div>

              <div className="flex gap-4 flex-wrap mt-2">
                {imagePreview && (
                  <div className="relative w-24 h-24 rounded border overflow-hidden">
                    <img
                      src={imagePreview}
                      alt={`Product ${imagePreview}`}
                      width={96}
                      height={96}
                      className="object-cover w-full h-full"
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="destructive"
                      className="absolute top-2 right-2 rounded-full w-6 h-6"
                      onClick={() => handleRemoveProduct()}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}

                {/* Add Image Button */}
                <button
                  type="button"
                  onClick={() => {
                    setIsSelectingAdditional(false);
                    setIsMediaManagerOpen(true);
                  }}
                  className="w-24 h-24 border-2 border-dashed border-muted flex items-center justify-center rounded text-muted-foreground hover:bg-muted transition"
                >
                  <Plus className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <div>
                <Label className="text-base">
                  Additional Images <span className="text-red-500">*</span>
                </Label>
                <p className="text-sm text-muted-foreground">
                  Images will automatically sync to ALL variants
                </p>
              </div>

              <div className="flex gap-4 flex-wrap mt-2">
                {additionalImagePreviews.map((img, index) => (
                  <div
                    key={index}
                    className="relative w-24 h-24 rounded border overflow-hidden"
                  >
                    <img
                      src={img}
                      alt={`Product ${index}`}
                      width={96}
                      height={96}
                      className="object-cover w-full h-full"
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="destructive"
                      className="absolute top-2 right-2 rounded-full w-6 h-6"
                      onClick={() => handleAdditionalImageRemove(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}

                {/* Add Image Button */}
                <button
                  type="button"
                  onClick={() => {
                    setIsSelectingAdditional(true);
                    setIsMediaManagerOpen(true);
                  }}
                  className="w-24 h-24 border-2 border-dashed border-muted flex items-center justify-center rounded text-muted-foreground hover:bg-muted transition"
                >
                  <Plus className="w-6 h-6" />
                </button>
              </div>
            </div>

         
          </div>
        </div>

        {/* variant */}

        <div className="p-5 bg-white rounded-xl border space-y-5">
          <h2 className="text-lg font-semibold">Variants</h2>

          {form.variants.map((variant, index) => (
            <div
              key={index}
              className="grid grid-cols-5 gap-4 items-end border p-4 rounded relative bg-gray-50"
            >
              <div className="col-span-2">
                <label className="text-sm font-medium mb-1 block">
                  Price/Amount
                </label>
                <Input
                  placeholder="e.g., 100, 500"
                  value={variant.price}
                  onChange={(e) =>
                    updateVariant(index, "price", e.target.value)
                  }
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Weight</label>
                <Input
                  placeholder="e.g., 100, 500"
                  value={variant.weight}
                  onChange={(e) =>
                    updateVariant(index, "weight", e.target.value)
                  }
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">
                  Sale Price
                </label>
                <Input
                  type="number"
                  value={variant.sale_price}
                  onChange={(e) =>
                    updateVariant(index, "sale_price", e.target.value)
                  }
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Stock</label>
                <Input
                  type="number"
                  value={variant.stock}
                  onChange={(e) =>
                    updateVariant(index, "stock", e.target.value)
                  }
                />
              </div>




                  <div>
                <label className="text-sm font-medium mb-1 block">
                  Variant Image
                </label>
                <div className="flex flex-row gap-2 mt-2">
                  {variantImagePreviews[index] && (
                    <div className="relative w-24 h-24 rounded border overflow-hidden">
                      <img
                        src={variantImagePreviews[index]}
                        alt={`Product ${index}`}
                        width={96}
                        height={96}
                        className="object-cover w-full h-full"
                      />
                      <Button
                        type="button"
                        size="icon"
                        variant="destructive"
                        className="absolute top-2 right-2 rounded-full w-6 h-6"
                        onClick={() => {
            setForm((prev) => {
              const updatedVariants = [...prev.variants];
              updatedVariants[index].image = "";
              return { ...prev, variants: updatedVariants };
            });
            setVariantImagePreviews((prev) => {
              const updated = [...prev];
              updated[index] = "";
              return updated;
            });
          }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}

                  {/* Add Image Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsSelectingVariant(true);
        setVariantImageIndexes({index});
        setIsMediaManagerOpen(true);
                    }}
                    className="w-24 h-24 border-2 border-dashed border-muted flex items-center justify-center rounded text-muted-foreground hover:bg-muted transition"
                  >
                    <Plus className="w-6 h-6" />
                  </button>
                </div>

              
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">
                  Aditional Image
                </label>
                <div className="flex flex-row gap-2 mt-2">
                  {(variantAdditionalImagePreviews[index] || []).map((img,imgIdx) => (
                    <div className="relative w-24 h-24 rounded border overflow-hidden" key={imgIdx}>
                      <img
                        src={img}
                        alt={`Product ${index}`}
                        width={96}
                        height={96}
                        className="object-cover w-full h-full"
                      />
                      <Button
                        type="button"
                        size="icon"
                        variant="destructive"
                        className="absolute top-2 right-2 rounded-full w-6 h-6"
                        onClick={() => removeVariantAdditionalImage( index,imgIdx)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                )  )}

                  {/* Add Image Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsSelectingVariantAdditional(true);
setVariantImageIndexes({ index });
setIsMediaManagerOpen(true);
                    }}
                    className="w-24 h-24 border-2 border-dashed border-muted flex items-center justify-center rounded text-muted-foreground hover:bg-muted transition"
                  >
                    <Plus className="w-6 h-6" />
                  </button>
                </div>

              

              </div>

                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute bottom-4 right-4"
                  onClick={() => removeVariant(index)}
                >
                  <Trash2 size={16} />
                </Button>
            </div>
            
          ))}


          <Button
            type="button"
            variant="outline"
            className="w-full flex items-center justify-center gap-2"
            onClick={addVariant}
          >
            <Plus size={16} />
            Add Weight Variant
          </Button>
        </div>

        <Button
          type="submit"
          className="bg-green-600 text-white px-4 py-2 rounded"
          disabled={loading}
        >
          {loading
            ? "Saving..."
            : initialData
            ? "Update Product"
            : "Create Product"}
        </Button>
      </form>
      {isMediaManagerOpen && (
        <MediaManager
          // isOpen={isMediaManagerOpen}
          onClose={() => setIsMediaManagerOpen(false)}
          onSelect={handleMediaSelect}
          // allowMultiple={isSelectingAdditional || isSelectingVariantAdditional}

        />
      )}
    </div>
  );
};

export default ProductCreateForm;
