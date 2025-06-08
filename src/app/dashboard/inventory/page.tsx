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
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronDownIcon, ChevronRightIcon, PackageIcon } from "lucide-react";
import { Shimmer } from "@/components/ui/shimmer";

interface Variant {
  $id: string;
  productId: string;
  image?: string;
  price: number;
  weight: number;
  sale_price: number;
  months: number;
  stock: number;
  additionalImages: string[];
}

interface Product {
  $id: string;
  name: string;
  description: string;
  category: string;
  tags: string;
  slug: string;
  ingredients: string;
  variants: Variant[];
  collections: string[];
  productVideo: string[];
  stock: number;
  price: number;
  status: string;
}

export default function InventoryPage() {
  const [items, setItems] = useState<Product[]>([]);
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
        products
          .filter((p): p is Product => typeof p.$id === 'string')
          .map(async (product) => {
            try {
              const { variants } = await productService.getProductWithVariants(
                product.$id
              );
              
              // Ensure variants have all required fields
              const processedVariants = (variants || []).map(v => ({
                ...v,
                stock: v.stock || 0,
                price: v.price || 0,
                additionalImages: v.additionalImages || [],
                months: typeof v.months === 'string' ? parseInt(v.months, 10) : (v.months || 0)
              })) as Variant[];

              const productWithVariants: Product = {
                ...product,
                productVideo: product.productVideo || [],
                variants: processedVariants,
                // Calculate total stock across all variants
                stock: processedVariants.reduce(
                  (sum, variant) => sum + variant.stock,
                  0
                ),
                // Get min price from variants
                price: processedVariants.length 
                  ? Math.min(...processedVariants.map(v => v.price))
                  : 0,
                status: '' // Will be set in next step
              };

              return productWithVariants;
            } catch (error) {
              console.error(
                `Error fetching variants for product ${product.$id}:`,
                error
              );
              return {
                ...product,
                variants: [],
                productVideo: product.productVideo || [],
                stock: 0,
                price: 0,
                status: ''
              };
            }
          })
      );

      // Add status to each product
      const docs = productsWithVariants.map((product): Product => ({
        ...product,
        status:
          product.stock === 0
            ? "Out of Stock"
            : product.stock < 10
            ? "Low Stock"
            : "In Stock"
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight">
            Inventory Management
          </h2>
          <p className="text-sm text-muted-foreground">
            Manage your product stock and variants.
          </p>
        </div>
      </div>

      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
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
              <Shimmer type="table" count={5} />
            ) : (
              items.map((item) => (
                <React.Fragment key={item.$id}>
                  <TableRow
                    className={`${
                      item.stock < 10 ? "bg-destructive/5" : ""
                    }`}
                  >
                    <TableCell>
                      <button
                        onClick={() => toggleVariants(item.$id)}
                        className="flex items-center gap-2 font-medium"
                      >
                        {showVariantsMap[item.$id] ? (
                          <ChevronDownIcon className="h-4 w-4" />
                        ) : (
                          <ChevronRightIcon className="h-4 w-4" />
                        )}
                        {item.name}
                      </button>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{item.category}</Badge>
                    </TableCell>
                    <TableCell>{item.stock}</TableCell>
                    <TableCell>₹ {item.price}</TableCell>
                    <TableCell>{item.variants?.length || 0}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          item.stock === 0 ? "destructive" : "default"
                        }
                        className={
                          item.stock < 10 && item.stock > 0
                            ? "bg-yellow-500 hover:bg-yellow-500/90"
                            : item.stock >= 10
                            ? "bg-green-500 hover:bg-green-500/90"
                            : ""
                        }
                      >
                        {item.stock === 0
                          ? "Out of Stock"
                          : item.stock < 10
                          ? "Low Stock"
                          : "In Stock"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="secondary"
                        size="sm"
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
                    <TableRow>
                      <TableCell colSpan={8}>
                        <div className="grid gap-4 p-4">
                          {(item.variants || []).map(
                            (variant: any, index: number) => (
                              <Card key={index}>
                                <CardContent className="flex items-center gap-4 p-4">
                                  <div className="relative h-16 w-16 overflow-hidden rounded-md border">
                                    {(!variant.image ||
                                      typeof variant.image === "object" ||
                                      variant.image === "") ? (
                                      <div className="flex h-full w-full items-center justify-center bg-secondary">
                                        <PackageIcon className="h-8 w-8 text-muted-foreground" />
                                      </div>
                                    ) : (
                                      <Image
                                        src={getFilePreview(variant.image)}
                                        alt={`Variant ${index + 1}`}
                                        fill
                                        className="object-cover"
                                      />
                                    )}
                                  </div>
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1 text-sm">
                                    <div>
                                      <p className="text-muted-foreground">Price</p>
                                      <p className="font-medium">₹{variant.price}</p>
                                    </div>
                                    <div>
                                      <p className="text-muted-foreground">Weight</p>
                                      <p className="font-medium">{variant.weight}</p>
                                    </div>
                                    <div>
                                      <p className="text-muted-foreground">
                                        Sale Price
                                      </p>
                                      <p className="font-medium">
                                        ₹{variant.sale_price}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-muted-foreground">Months</p>
                                      <p className="font-medium">{variant.months}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Input
                                      type="number"
                                      className="w-24"
                                      value={
                                        formData[variant.$id]?.stock || variant.stock
                                      }
                                      onChange={(e) =>
                                        handleFormChange(
                                          variant.$id,
                                          "stock",
                                          e.target.value
                                        )
                                      }
                                    />
                                    <Button
                                      onClick={() =>
                                        handleUpdateStock(variant.$id, variant.productId)
                                      }
                                      variant="secondary"
                                      size="sm"
                                    >
                                      Update
                                    </Button>
                                  </div>
                                </CardContent>
                              </Card>
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
    </div>
  );
}
