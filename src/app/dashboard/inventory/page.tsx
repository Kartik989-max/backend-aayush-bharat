"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { databases, getFilePreview } from "@/lib/appwrite";
import { productService } from "@/services/productService";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronDownIcon, ChevronRightIcon } from "lucide-react";

export default function InventoryPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showVariantsMap, setShowVariantsMap] = useState<{
    [key: string]: boolean;
  }>({});
  const [formData, setFormData] = useState<{ [key: string]: any }>({});


  const fetchInventory = async () => {
    setLoading(true);
    try {
      // First fetch all products
      const products = await productService.getProducts();
      
      // For each product, fetch variants
      const productsWithVariants = await Promise.all(
        products.map(async (product) => {
          try {
            const { variants } = await productService.getProductWithVariants(product.$id);
            return {
              ...product,
              variants,
              // Calculate total stock across all variants
              stock: variants.reduce((sum, variant) => sum + (variant.stock || 0), 0),
              // Get min price from variants
              price: Math.min(...variants.map(variant => variant.price || 0))
            };
          } catch (error) {
            console.error(`Error fetching variants for product ${product.$id}:`, error);
            return {
              ...product,
              variants: [],
              stock: 0,
              price: 0
            };
          }
        })
      );

      const docs = productsWithVariants.map((doc) => ({
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

  const handleUpdateStock = async (variantId: string, productId: string) => {
    const newStock = formData[variantId]?.stock;
    if (!newStock) {
      alert("Please enter a valid stock number");
      return;
    }

    try {
      await databases.updateDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_VARIANT_COLLECTION_ID!,
        variantId,
        {
          stock: Number(newStock),
        }
      );

      alert("Stock updated successfully!");
      fetchInventory();
    } catch (error) {
      console.error("Error updating stock:", error);
      alert("Error updating stock.");
    }
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
                        <div className="w-full overflow-x-auto p-2 bg-white rounded shadow border mx-auto">
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
                                <div className="flex items-center gap-2">
                                  <Input
                                    type="number"
                                    className="w-24"
                                    value={formData[variant.$id]?.stock || variant.stock}
                                    onChange={(e) =>
                                      handleFormChange(
                                        variant.$id,
                                        "stock",
                                        e.target.value
                                      )
                                    }
                                  />
                                  <Button
                                    onClick={() => handleUpdateStock(variant.$id, variant.productId)}
                                    variant="outline"
                                    className="whitespace-nowrap"
                                  >
                                    Update Stock
                                  </Button>
                                </div>
                              </div>
                            )
                          )}
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
