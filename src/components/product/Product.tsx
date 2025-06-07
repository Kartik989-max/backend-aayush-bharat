"use client";
import { useState, useEffect } from "react";
import { databases, storage } from "@/lib/appwrite";
import { Query } from "appwrite";
import ProductForm from "./ProductForm";
import Link from "next/link";
import { MoreHorizontal, Pencil, Trash2, EyeIcon } from "lucide-react";
import type { Product as ProductType } from "@/types/product";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Dialog } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight } from "lucide-react";

const Product = () => {
  const [products, setProducts] = useState<ProductType[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductType | null>(null);
  const [currentPage, setCurrentPage] = useState(() => {
    if (typeof window !== "undefined") {
      const savedPage = localStorage.getItem("productsCurrentPage");
      return savedPage ? parseInt(savedPage, 10) : 1;
    }
    return 1;
  });
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [totalDocuments, setTotalDocuments] = useState(0);
  const productsPerPage = 10;

  const [sortKey, setSortKey] = useState<
    "name" | "category" | "stock" | "price" | null
  >(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [categories, setCategories] = useState<{ $id: string; name: string }[]>([]);

  useEffect(() => {
    localStorage.setItem("productsCurrentPage", currentPage.toString());
  }, [currentPage]);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [currentPage, searchQuery, selectedCategory]);

  const fetchCategories = async () => {
    try {
      const response = await databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_CATEGORY_COLLECTION_ID!
      );
      setCategories(response.documents.map(doc => ({
        $id: doc.$id,
        name: doc.name as string
      })));
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const offset = (currentPage - 1) * productsPerPage;

      let queries = [
        Query.limit(productsPerPage),
        Query.offset(offset),
        Query.orderDesc("$createdAt"),
      ];

      if (searchQuery) {
        queries.push(Query.search("name", searchQuery));
      }

      if (selectedCategory !== "all") {
        queries.push(Query.equal("category", selectedCategory));
      }

      // First get all products
      const response = await databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_PRODUCT_COLLECTION_ID!,
        queries
      );

      // For each product, fetch its variants
      const productsWithVariants = await Promise.all(
        response.documents.map(async (product) => {
          const variantsResponse = await databases.listDocuments(
            process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
            process.env.NEXT_PUBLIC_APPWRITE_VARIANT_COLLECTION_ID!,
            [Query.equal('productId', product.$id)]
          );

          const variants = variantsResponse.documents.map(doc => ({
            $id: doc.$id,
            productId: doc.productId,
            price: Number(doc.price) || 0,
            weight: Number(doc.weight) || 0,
            sale_price: Number(doc.sale_price) || 0,
            stock: Number(doc.stock) || 0,
            months: Number(doc.months) || 1,
            image: doc.image || "",
            additionalImages: Array.isArray(doc.additionalImages) ? doc.additionalImages : []
          }));

          return {
            ...product,
            variants,
            // Get total stock across all variants
            totalStock: variants.reduce((sum, v) => sum + (v.stock || 0), 0),
            // Get price range
            minPrice: Math.min(...variants.map(v => v.price || 0)),
            maxPrice: Math.max(...variants.map(v => v.price || 0)),
            // Get min sale price if any variant has it
            minSalePrice: Math.min(...variants.filter(v => v.sale_price > 0).map(v => v.sale_price)),
            // Get the first variant's image if product has no image
            displayImage: product.image || (variants[0]?.image || "")
          };
        })
      );

      setTotalDocuments(response.total);
      setProducts(productsWithVariants as unknown as ProductType[]);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (fileId: string) => {
    // if (!fileId) return '/placeholder.jpg';
    try {
      const baseUrl = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
      const bucketId = process.env.NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID;
      const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;

      return `${baseUrl}/storage/buckets/${bucketId}/files/${fileId}/view?project=${projectId}`;
    } catch (error) {
      console.error("Error generating image URL:", error);
      console.log(error);

      // return '/placeholder.jpg';
    }
  };

  const handleRemoveAdditionalImage = async (
    productId: string,
    imageId: string
  ) => {
    try {
      setLoading(true);
      const product = products.find((p) => p.$id === productId);
      if (!product) return;

      // Remove image from all variants' additionalImages
      const updatedVariants = product.variants.map(variant => ({
        ...variant,
        additionalImages: variant.additionalImages.filter((id: string) => id !== imageId)
      }));
      // Optionally, update the product in the database here if needed
      // Refresh products after update
      await fetchProducts();
    } catch (error) {
      console.error("Error removing additional image:", error);
    } finally {
      setLoading(false);
    }
  };
  const handleFormSubmit = async (data: any) => {
    await fetchProducts();
    setShowForm(false);
    setSelectedProduct(null);
  };

  const handleEdit = (product: ProductType) => {
    setSelectedProduct(product);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (productId: string) => {
    try {
      await databases.deleteDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_PRODUCT_COLLECTION_ID!,
        productId
      );
      await fetchProducts();
      setDeleteId(null);
    } catch (error) {
      console.error("Error deleting product:", error);
    }
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const totalPages = Math.max(1, Math.ceil(totalDocuments / productsPerPage));

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        {[...Array(10)].map((_, i) => (
          <Skeleton key={i} className="h-10 w-full rounded-md" />
        ))}
      </div>
    );
  }

  const handleSort = (key: typeof sortKey) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };
  const sortedProducts = [...products].sort((a, b) => {
    if (!sortKey) return 0;
    let valA: string | number = '';
    let valB: string | number = '';
    if (sortKey === 'stock') {
      valA = a.variants?.reduce((sum, v) => sum + (v.stock || 0), 0) ?? 0;
      valB = b.variants?.reduce((sum, v) => sum + (v.stock || 0), 0) ?? 0;
    } else if (sortKey === 'price') {
      valA = a.variants && a.variants.length > 0 ? Math.min(...a.variants.map(v => v.price)) : 0;
      valB = b.variants && b.variants.length > 0 ? Math.min(...b.variants.map(v => v.price)) : 0;
    } else {
      valA = (a as any)[sortKey] ?? '';
      valB = (b as any)[sortKey] ?? '';
    }
    if (typeof valA === "string" && typeof valB === "string") {
      return sortDirection === "asc"
        ? valA.localeCompare(valB)
        : valB.localeCompare(valA);
    }
    if (typeof valA === "number" && typeof valB === "number") {
      return sortDirection === "asc" ? valA - valB : valB - valA;
    }
    return 0;
  });

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-0 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight text-primary">Products</h2>
          <Button onClick={() => setShowForm(true)}>Add Product</Button>
        </div>

        <div className="flex items-center gap-4">
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
          <Select
            value={selectedCategory}
            onValueChange={setSelectedCategory}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.$id} value={category.name}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-primary">Product List</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Image</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedProducts.map((product) => {
                  // Compute derived values
                  const displayImage = product.variants?.[0]?.image || "/placeholder.jpg";
                  const totalStock = product.variants?.reduce((sum, v) => sum + (v.stock || 0), 0) ?? 0;
                  const minPrice = product.variants && product.variants.length > 0 ? Math.min(...product.variants.map(v => v.price)) : 0;
                  const salePrices = product.variants?.filter(v => v.sale_price > 0).map(v => v.sale_price) || [];
                  const minSalePrice = salePrices.length > 0 ? Math.min(...salePrices) : 0;
                  return (
                    <TableRow key={product.$id}>
                      <TableCell>
                        <img
                          src={getImageUrl(displayImage)}
                          alt={product.name}
                          className="w-12 h-12 object-cover rounded-md"
                        />
                      </TableCell>
                      <TableCell>{product.name}</TableCell>
                      <TableCell>{product.category}</TableCell>
                      <TableCell>{totalStock}</TableCell>
                      <TableCell>
                        {minSalePrice > 0 ? (
                          <div className="flex items-center gap-2">
                            <span className="line-through text-muted-foreground">
                              ₹{minPrice}
                            </span>
                            <span className="text-primary">₹{minSalePrice}</span>
                          </div>
                        ) : (
                          <span>₹{minPrice}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/dashboard/products/${product.$id}`}>
                                <EyeIcon className="mr-2 h-4 w-4" />
                                View
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(product)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setDeleteId(product.$id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {Math.min((currentPage - 1) * productsPerPage + 1, totalDocuments)} to{" "}
                {Math.min(currentPage * productsPerPage, totalDocuments)} of{" "}
                {totalDocuments} products
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {showForm && (
        <ProductForm
          initialData={selectedProduct}
          onSubmit={handleFormSubmit}
          onCancel={() => {
            setShowForm(false);
            setSelectedProduct(null);
          }}
        />
      )}

      <Dialog 
        open={!!deleteId} 
        onClose={() => setDeleteId(null)}
        title="Delete Product"
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Warning: This action cannot be undone. Deleting this product will
            permanently remove it from your inventory. Are you sure you want to
            proceed?
          </p>
          <div className="flex justify-end gap-4">
            <Button
              variant="destructive"
              onClick={() => deleteId && handleDelete(deleteId)}
            >
              Yes, Delete Product
            </Button>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default Product;
