"use client";
import React from "react";
import { useEffect, useState } from "react";
import {MediaManager} from "@/components/media/MediaManager";
import { Card, CardContent } from "@/components/ui/card";
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
const [currentProductId, setCurrentProductId] = useState<string | null>(null);
const [isSelectingMainImage, setIsSelectingMainImage] = useState(true);

const handleFileSelection = (fileId: string, url: string) => {
  if (!currentProductId) return;

  if (isSelectingMainImage) {
    setFormData((prev) => ({
      ...prev,
      [currentProductId]: {
        ...prev[currentProductId],
        imageFile: fileId,
      },
    }));
    setVariantImagePreviews((prev) => ({
      ...prev,
      [currentProductId]: url,
    }));
  } else {
    setFormData((prev) => ({
      ...prev,
      [currentProductId]: {
        ...prev[currentProductId],
        additionalImages: [
          ...(prev[currentProductId]?.additionalImages || []),
          fileId,
        ],
      },
    }));
    setVariantAdditionalImagePreviews((prev) => ({
      ...prev,
      [currentProductId]: [
        ...(prev[currentProductId] || []),
        url,
      ],
    }));
  }

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
    console.log(variantId);

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

  // const handleAddVariant = async (productId: string) => {
  //   const data = formData[productId];
  //   if (!data?.price || !data?.weight || !data?.sale_price || !data?.stock) {
  //     alert("Please fill all fields.");
  //     return;
  //   }

  //   try {

  //     console.log(formData);

  //     const imagUrl=await productService.uploadImage(formData.imageFile);

  //     const newVariant = await databases.createDocument(
  //       process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
  //       process.env.NEXT_PUBLIC_APPWRITE_VARIANT_COLLECTION_ID!,
  //       ID.unique(),
  //       {
  //         productId,
  //         price: Number(data.price),
  //         weight: Number(data.weight),
  //         sale_price: Number(data.sale_price),
  //         stock: Number(data.stock),
  //       }
  //     );
  //     const existingVariants = items.variants || [];
  //     await databases.updateDocument(
  //       process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
  //       process.env.NEXT_PUBLIC_APPWRITE_PRODUCT_COLLECTION_ID!,
  //       productId,
  //       {
  //         variants: [...existingVariants, newVariant.$id],
  //       }
  //     );

  //     alert("Variant added successfully!");
  //     setFormData((prev) => ({ ...prev, [productId]: {} }));
  //     fetchInventory();
  //   } catch (error) {
  //     console.error("Error adding variant:", error);
  //     alert("Error adding variant.");
  //   }
  // };

  const handleAddVariant = async (productId: string) => {
    const data = formData[productId];
    if (!data?.price || !data?.weight || !data?.sale_price || !data?.stock) {
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
          sale_price: Number(data.sale_price),
          stock: Number(data.stock),
          image: data.imageFile,
          additionalImages: data.additionalImages?.join(','),
        }
      );

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
setVariantAdditionalImagePreviews((prev) => ({ ...prev, [productId]: [] }));
fetchInventory();
    } catch (error) {
      console.error("Error adding variant:", error);
      alert("Error adding variant.");
    }
  };

  return (
    <main className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Inventory Management</h1>

      <div className="rounded-lg border overflow-auto">
        <Table>
          <TableHeader>
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
                  <TableRow key={item.$id}>
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
                    <TableCell>{item.price}</TableCell>
                    <TableCell>{item.weight}</TableCell>
                    <TableCell>{item.variants?.length || 0}</TableCell>
                    <TableCell>"In Stock"</TableCell>
                    {/* <TableCell>{item.status}</TableCell> */}
                    <TableCell>
                      <Button onClick={() => toggleVariants(item.$id)}>
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
                        <div className="max-w-3xl w-full overflow-x-auto p-2 bg-white rounded shadow border mx-auto">
                          {/* Existing Variants */}
                          {(item.variants || []).map((variant: any, index: number) => (
                            <div
                              key={index}
                              className="border p-3 rounded-md flex flex-col md:flex-row gap-4 items-center justify-between mb-2"
                            >
                              
                              <Image alt={variant.price} src={getFilePreview(variant?.image)} height={50} width={50}/>
                              <span>Price: ₹{variant.price}</span>
                              <span>Weight: {variant.weight}</span>
                              <span>Sale Price: ₹{variant.sale_price}</span>
                              <span>Stock: {variant.stock}</span>
                              <Button
                                type="reset"
                                onClick={() => handleDeleteVariant(variant.$id)}
                              >
                                Delete
                              </Button>
                            </div>
                          ))}

                          {/* Add Variant Form */}
                          <div className="border p-4 rounded-lg space-y-2 bg-gray-50">
                            <h3 className="text-sm font-medium">Add New Variant</h3>
                            <div className="grid grid-cols-2 md:grid-cols-7 gap-2">
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

                              {/* Main Image */}
                              {/* <Input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  setFormData((prev) => ({
                                    ...prev,
                                    [item.$id]: {
                                      ...prev[item.$id],
                                      imageFile: file,
                                    },
                                  }));
                                  setVariantImagePreviews((prev) => ({
                                    ...prev,
                                    [item.$id]: file
                                      ? URL.createObjectURL(file)
                                      : null,
                                  }));
                                }}
                              />
                              {variantImagePreviews[item.$id] && (
                                <img
                                  src={variantImagePreviews[item.$id]!}
                                  alt="Preview"
                                  className="w-12 h-12 object-cover rounded border"
                                />
                              )} */}

                              {/* unsed Additional Images */}
                              {/* <Input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={(e) => {
                                  const files = Array.from(
                                    e.target.files || []
                                  );
                                  setFormData((prev) => ({
                                    ...prev,
                                    [item.$id]: {
                                      ...prev[item.$id],
                                      additionalImageFiles: files,
                                    },
                                  }));
                                  setVariantAdditionalImagePreviews((prev) => ({
                                    ...prev,
                                    [item.$id]: files.map((file) =>
                                      URL.createObjectURL(file)
                                    ),
                                  }));
                                }}
                              /> */}
                            {/* <Input
  type="file"
  accept="image/*"
  multiple
  onChange={(e) => {
    const files = Array.from(e.target.files || []);
    setFormData((prev) => ({
      ...prev,
      [item.$id]: {
        ...prev[item.$id],
        additionalImages: [
          ...(prev[item.$id]?.additionalImages || []),
          ...files,
        ],
      },
    }));
    setVariantAdditionalImagePreviews((prev) => ({
      ...prev,
      [item.$id]: [
        ...(prev[item.$id] || []),
        ...files.map((file) => URL.createObjectURL(file)),
      ],
    }));
  }}
/>

                              {variantAdditionalImagePreviews[item.$id] && (
                                <div className="flex gap-1">
                                  {variantAdditionalImagePreviews[item.$id].map(
                                    (src, idx) => (
                                      <img
                                        key={idx}
                                        src={src}
                                        alt={`Additional Preview ${idx + 1}`}
                                        className="w-10 h-10 object-cover rounded border"
                                      />
                                    )
                                  )}
                                </div>
                              )} */}

                              {/* Main Image */}
<Button
  variant="outline"
  onClick={() => {
    setCurrentProductId(item.$id);
    setIsSelectingMainImage(true);
    setShowMediaManager(true);
  }}
>
  Select Main Image
</Button>
{variantImagePreviews[item.$id] && (
  <img
    src={variantImagePreviews[item.$id]!}
    alt="Preview"
    className="w-12 h-12 object-cover rounded border"
  />
)}

{/* Additional Images */}
<Button
  variant="outline"
  onClick={() => {
    setCurrentProductId(item.$id);
    setIsSelectingMainImage(false);
    setShowMediaManager(true);
  }}
>
  Select Additional Images
</Button>
{variantAdditionalImagePreviews[item.$id] && (
  <div className="flex gap-1">
    {variantAdditionalImagePreviews[item.$id].map(
      (src, idx) => (
        <img
          key={idx}
          src={src}
          alt={`Additional Preview ${idx + 1}`}
          className="w-10 h-10 object-cover rounded border"
        />
      )
    )}
  </div>
)}
{showMediaManager && (
  <MediaManager
    onClose={() => setShowMediaManager(false)}
    onSelect={handleFileSelection}
    // allowMultiple={!isSelectingMainImage}
  />
)}


                              <Button
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
