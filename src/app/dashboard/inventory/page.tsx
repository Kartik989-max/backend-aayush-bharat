"use client";
import React from "react";
import { useEffect, useState } from "react";
import { MediaManager } from "@/components/media/MediaManager";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  ReloadIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from "@radix-ui/react-icons";
import { productService } from "@/services/productService";
import { databases, getFilePreview } from "@/lib/appwrite"; // appwrite client
import { ID } from "appwrite";
import Image from "next/image";

export default function InventoryPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showVariantsMap, setShowVariantsMap] = useState<{
    [key: string]: boolean;
  }>({});
  const [formData, setFormData] = useState<{ [key: string]: any }>({});
  const [variantImagePreviews, setVariantImagePreviews] = useState<{
    [key: string]: string | null;
  }>({});

  const [showMediaManager, setShowMediaManager] = useState(false);
  const [showMediaAdditionalManager, setShowMediaAdditionalManager] = useState(false);
  const [currentProductId, setCurrentProductId] = useState<string | null>(null);
  const [isSelectingMainImage, setIsSelectingMainImage] = useState(true); 

  const handleFileSelection = (files: { fileId: string; url: string }[]) => {
    if (!currentProductId) return;

    if (isSelectingMainImage) {
      setFormData((prev) => ({
        ...prev,
        [currentProductId]: {
          ...prev[currentProductId],
          imageFile: files[0].fileId,
        },
      }));
      setVariantImagePreviews((prev) => ({
        ...prev,
        [currentProductId]: files[0].url,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [currentProductId]: {
          ...prev[currentProductId],
          additionalImages: [
            ...(prev[currentProductId]?.additionalImages || []),
             ...files.map((file) => file.fileId), 
          ],
        },
      }));
      setVariantAdditionalImagePreviews((prev) => ({
        ...prev,
        [currentProductId]: [...(prev[currentProductId] || []), ...files.map((fileurl)=>fileurl.url)],
      }));
    }
    setShowMediaAdditionalManager(false)
    setShowMediaManager(false);
  };

  const [variantAdditionalImagePreviews, setVariantAdditionalImagePreviews] =
    useState<{ [key: string]: string[] }>({});

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const res = await productService.getProductsAndVariant();
      const docs = res.map((doc: any) => ({
        ...doc,
        status:
          doc.stock === 0
            ? "Out of Stock"
            : doc.stock < 10
            ? "Low Stock"
            : "In Stock",
      }));
      setItems(docs);
    } catch (err) {
      console.error("Error fetching inventory:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleDeleteVariant = async (variantId: string) => {
  

    if (!window.confirm("Are you sure you want to delete this variant?"))
      return;
    try {
      await databases.deleteDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_VARIANT_COLLECTION_ID!,
        variantId
      );
      alert("Variant deleted successfully!");
      fetchInventory();
    } catch (error) {
      console.error("Error deleting variant:", error);
      alert("Error deleting variant.");
    }
  };

  const toggleVariants = (id: string) => {
    setShowVariantsMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleFormChange = (
    productId: string,
    field: string,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [field]: value,
      },
    }));
  };

  const handleAddVariant = async (productId: string) => {

    const data = formData[productId];

    if (
  data?.price === undefined ||
  data?.weight === undefined ||
  data?.sale_price === undefined ||
  data?.stock === undefined ||
  data?.months === undefined
) {
  alert("Please fill all fields.");
  return;
}


    
    try {
    
      
      const newVariant = await databases.createDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_VARIANT_COLLECTION_ID!,
        ID.unique(),
        {
          productId,
          price: Number(data.price),
          weight: Number(data.weight),
          months:Number(data.months),
          sale_price: Number(data.sale_price),
          stock: Number(data.stock),
          image: data.imageFile,
          additionalImages:(data.additionalImages).join(','),
        }
      );

      console.log(newVariant);
      
      const product = items.find((item) => item.$id === productId);
      const existingVariants = product?.variants || [];

      await databases.updateDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_PRODUCT_COLLECTION_ID!,
        productId,
        {
          variants: [...existingVariants, newVariant.$id],
        }
      );

      alert("Variant added successfully!");
      setFormData((prev) => ({ ...prev, [productId]: {} }));
      setVariantImagePreviews((prev) => ({ ...prev, [productId]: null }));
      setVariantAdditionalImagePreviews((prev) => ({
        ...prev,
        [productId]: [],
      }));
      fetchInventory();
    }
     catch (error) {
      console.error("Error adding variant:", error);
      alert("Error adding variant.");
    }
  };
  
  const handleRemoveAdditionalImage = (productId: string, imgIdx: number) => {
  // Remove from additionalImages in formData
  setFormData((prev) => ({
    ...prev,
    [productId]: {
      ...prev[productId],
      additionalImages: prev[productId]?.additionalImages
        ? prev[productId].additionalImages.filter((_: any, i: number) => i !== imgIdx)
        : [],
    },
  }));
  // Remove from previews
  setVariantAdditionalImagePreviews((prev) => ({
    ...prev,
    [productId]: prev[productId]
      ? prev[productId].filter((_: string, i: number) => i !== imgIdx)
      : [],
  }));
};

  return (
    <main className="p-6 space-y-6">
      <h1 className="text-3xl text-primary font-bold">Inventory Management</h1>

      <div className="rounded-lg border overflow-auto">
        <Table>
          <TableHeader className="text-lg font-bold">
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Total Stock</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Weight</TableHead>
              <TableHead>Variants</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5}>Loading...</TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <React.Fragment key={item.$id}>
                  <TableRow
                    className={`text-lg ${
                      item.stock < 10 ? "bg-red-50 hover:bg-red-50" : ""
                    }`}
                    key={item.$id}
                  >
                    <TableCell>
                      <button
                        onClick={() => toggleVariants(item.$id)}
                        className="flex items-center gap-1 font-medium"
                      >
                        {showVariantsMap[item.$id] ? (
                          <ChevronDownIcon />
                        ) : (
                          <ChevronRightIcon />
                        )}
                        {item.name}
                      </button>
                    </TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell>{item.stock}</TableCell>
                    <TableCell>₹ {item.price}</TableCell>
                    <TableCell>{item.weight}</TableCell>
                    <TableCell>{item.variants?.length || 0}</TableCell>
                    <TableCell>
                      {item.stock < 10
                        ? "Low Stock"
                        : item.stock < 20
                        ? "Low Stock"
                        : "In Stock"}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="secondary"
                        className="border-2"
                        onClick={() => toggleVariants(item.$id)}
                      >
                        {showVariantsMap[item.$id]
                          ? "Hide Variants"
                          : "Show Variants"}
                      </Button>
                    </TableCell>
                  </TableRow>

                  {/* Show Variants */}
                  {showVariantsMap[item.$id] && (
                    <TableRow className="bg-muted/50">
                      <TableCell colSpan={8}>
                        <div className=" w-full overflow-x-auto p-2 bg-white rounded shadow border mx-auto">
                          {/* Existing Variants */}
                          {(item.variants || []).map(
                            (variant: any, index: number) => (
                              <div
                                key={index}
                                className="border p-3 rounded-md flex flex-col md:flex-row gap-4 items-center justify-between mb-2"
                              >
                                {(typeof variant.image=='object' ||    variant.image=='') ? (
                                    <>No Image</>
                                ):(
                                  <Image
                                  src={getFilePreview(variant?.image)!}
                                  alt={variant.price}
                                  height={50}
                                  width={50}
                                  />
                                )}
                                <span>Price: ₹{ variant.price}</span>
                                <span>Weight: {variant.weight}</span>
                                <span>Sale Price: ₹{variant.sale_price}</span>
                                <span>Months: {variant.months}</span>
                                <span>Stock: {variant.stock}</span>
                                <Button
                                  variant="destructive"
                                  onClick={() =>
                                    handleDeleteVariant(variant.$id)
                                  }
                                >
                                  Delete
                                </Button>
                              </div>
                            )
                          )}

                          {/* Add Variant Form */}
                          <div className="border p-4 rounded-lg space-y-2 bg-gray-50">
                            <h3 className="text-sm font-medium">
                              Add New Variant
                            </h3>

                            <div className="grid grid-cols-1 gap-2">
                              <div className="flex gap-6 max-w-full">
                                <Input
                                  placeholder="Price"
                                  type="number"
                                  value={formData[item.$id]?.price || ""}
                                  onChange={(e) =>
                                    handleFormChange(
                                      item.$id,
                                      "price",
                                      e.target.value
                                    )
                                  }
                                />
                                <Input
                                  placeholder="Weight"
                                  type="number"
                                  value={formData[item.$id]?.weight || ""}
                                  onChange={(e) =>
                                    handleFormChange(
                                      item.$id,
                                      "weight",
                                      e.target.value
                                    )
                                  }
                                />
                                <Input
                                  placeholder="Sale Price"
                                  type="number"
                                  value={formData[item.$id]?.sale_price || ""}
                                  onChange={(e) =>
                                    handleFormChange(
                                      item.$id,
                                      "sale_price",
                                      e.target.value
                                    )
                                  }
                                />
                                <Input
                                  placeholder="Months"
                                  type="number"
                                  value={formData[item.$id]?.months || ""}
                                  onChange={(e) =>
                                    handleFormChange(
                                      item.$id,
                                      "months",
                                      e.target.value
                                    )
                                  }
                                />
                                <Input
                                  placeholder="Stock"
                                  type="number"
                                  value={formData[item.$id]?.stock || ""}
                                  onChange={(e) =>
                                    handleFormChange(
                                      item.$id,
                                      "stock",
                                      e.target.value
                                    )
                                  }
                                />
                              </div>

                              <div className="flex  gap-4">
                                {/* Main Image */}
                                <div>
                                  <h1 className="text-sm my-2">Image</h1>
                                  <div className="flex gap-2 ">
                                    <Button
                                      variant="outline"
                                      onClick={() => {
                                        setCurrentProductId(item.$id);
                                        setIsSelectingMainImage(true);
                                        setShowMediaManager(true);
                                        
                                      }}
                                      className="w-24 h-24 border-2 border-dashed border-muted flex items-center justify-center rounded text-muted-foreground hover:bg-muted transition"
                                    >
                                      <Plus className="w-6 h-6" />
                                    </Button>
                                    {variantImagePreviews[item.$id] && (
                                      <div className="relative w-24 h-24 rounded border overflow-hidden">
                                      
                                      <Image
                                        src={variantImagePreviews[item.$id] || "https://www.freeiconspng.com/images/no-image-icon"}
                                        alt="Preview"
                                        width={500}
                                        height={500}
                                        className="w-full h-full object-cover rounded border"
                                        />
                                        <Button
                                              type="button"
                                              size="icon"
                                              variant="destructive"
                                              className="absolute top-2 right-2 rounded-full w-6 h-6"
                                               onClick={() => {
                                                 setFormData((prev) => ({
                                                   ...prev,
                                                   [item.$id]: {
                                                     ...prev[item.$id],
                                                     imageFile: "",
                                                   },
                                                 }));
                                                 setVariantImagePreviews((prev) => ({
                                                   ...prev,
                                                   [item.$id]: null,
                                                 }));
                                               }}
                                            >
                                              <Trash2 className="w-4 h-4" />
                        
                                            </Button>
                                        </div>
                                    )}
                                  </div>
                                </div>

                                {/* Additional Images */}
                                <div>
                                  <h1 className="text-sm my-2">
                                    Additional Image
                                  </h1>
                                  <div className="flex gap-2">
                                    <Button
                                      variant="outline"
                                      onClick={() => {
                                        setShowMediaAdditionalManager(true);
                                        setCurrentProductId(item.$id);
                                        setIsSelectingMainImage(false);
                                        
                                      }}
                                      className="w-24 h-24 border-2 border-dashed border-muted flex items-center justify-center rounded text-muted-foreground hover:bg-muted transition"
                                    >
                                      <Plus className="w-6 h-6" />
                                    </Button>
                                    {variantAdditionalImagePreviews[
                                      item.$id
                                    ] && (
                                      <div className="flex gap-1">
                                        {variantAdditionalImagePreviews[
                                          item.$id
                                        ].map((src, idx) => (
                                          <div key={idx} className="relative w-24 h-24 rounded border overflow-hidden">
                                            <Image
                                              width={500}
                                              height={500}
                                              src={src}
                                              alt={`Additional Preview ${
                                                idx + 1
                                              }`}
                                              className=" w-full h-full object-cover rounded border"
                                            />
                                            <Button
                                              type="button"
                                              size="icon"
                                              variant="destructive"
                                              className="absolute top-2 right-2 rounded-full w-6 h-6"
                                              onClick={() => handleRemoveAdditionalImage(item.$id, idx)}
                                            >
                                              <Trash2 className="w-4 h-4" />
                                            </Button>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {showMediaManager && (
                                <MediaManager
                                  onClose={() => setShowMediaManager(false)}
                                  onSelect={handleFileSelection}
                                  // allowMultiple={!isSelectingMainImage}
                                />
                              )}
                              {showMediaAdditionalManager && (
                                <MediaManager
                                  onClose={() => setShowMediaAdditionalManager(false)}
                                  onSelect={handleFileSelection}
                                  allowMultiple={true}
                                  // allowMultiple={!isSelectingMainImage}
                                />
                              )}

                              <Button
                                className="text-white bg-black"
                                onClick={() => handleAddVariant(item.$id)}
                              >
                                Add
                              </Button>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </main>
  );
}
