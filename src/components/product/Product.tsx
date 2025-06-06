"use client";
import { useState, useEffect } from "react";
import { databases, storage } from "@/lib/appwrite";
import { Query } from "appwrite";
import ProductForm from "./ProductForm";
import Image from "next/image";
import Link from "next/link";
import { MoreHorizontal } from "lucide-react";
import type { Product as ProductType } from "@/types/product";
import type { ProductFormData } from "@/services/productService";
import { Button } from "../ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import { EyeIcon } from "lucide-react";
import { Eye } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const DeleteConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
}: DeleteModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-dark-100 p-6 rounded-lg max-w-md w-full mx-4">
        <h2 className="text-xl font-bold text-light-100 mb-4">
          Delete Product
        </h2>
        <p className="text-light-100/70 mb-6">
          Warning: This action cannot be undone. Deleting this product will
          permanently remove it from your inventory. Are you sure you want to
          proceed?
        </p>
        <div className="flex gap-4">
          <Button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all"
          >
            Yes, Delete Product
          </Button>
          <Button onClick={onClose} variant='secondary' className="flex-1 border">
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};

const Product = () => {
  const [products, setProducts] = useState<ProductType[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedProduct, setSelectedProduct] =
    useState<ProductType | null>(null);
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

  useEffect(() => {
    localStorage.setItem("productsCurrentPage", currentPage.toString());
  }, [currentPage]);

  useEffect(() => {
    fetchProducts();
  }, [currentPage]);
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const offset = (currentPage - 1) * productsPerPage;

      // First get all products
      const response = await databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_PRODUCT_COLLECTION_ID!,
        [
          Query.limit(productsPerPage),
          Query.offset(offset),
          Query.orderDesc("$createdAt"),
        ]
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

      const updatedImages = product.additionalImages.filter(
        (id: string) => id !== imageId
      );

      await databases.updateDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_PRODUCT_COLLECTION_ID!,
        productId,
        { additionalImages: updatedImages }
      );

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

    const valA = a[sortKey];
    const valB = b[sortKey];

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
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl mb-8 text-primary font-bold flex gap-2 items-center">
          Products
        </h1>

        {showForm ? (
          <Button
            onClick={(e) => {
              setShowForm(false);
            }}
            className="bg-dark text-dark px-4 py-2 rounded"
          >
            Back to Product
          </Button>
        ) : (
          <Button
            onClick={() => {
              setShowForm(true);
              setSelectedProduct(null);
            }}
            className="bg-dark text-dark px-4 py-2 rounded"
          >
            Add Product
          </Button>
        )}
      </div>

      {showForm ? (
        <div className="mb-6">
          <ProductForm
            initialData={selectedProduct} // Pass selected product for editing
            onSubmit={handleFormSubmit}
            onCancel={() => {
              setShowForm(false);
              setSelectedProduct(null);
            }}
          />
        </div>
      ) : (
        <div>
          <div className="bg-white p-4 rounded-lg shadow mb-6">
            <h2 className="text-lg font-semibold mb-4">Filters</h2>
            <div className="flex items-center gap-4">
              <select
                className="border border-gray-300 rounded-md px-3 py-2 w-64"
                // Add value and onChange handlers to control category
              >
                <option value="">All Categories</option>
                <option value="dairy">Dairy</option>
                <option value="Food Grains,oil and masala">
                  Food Grains, oil and masala
                </option>
                <option value="Confectionary Items">Confectionary Items</option>
                {/* Add your dynamic categories if needed */}
              </select>
              <Button
                variant="outline"
                className="px-4 py-2 border border-gray-300 rounded-md"
                onClick={() => {
                  // Reset filter logic
                }}
              >
                Reset Filters
              </Button>
            </div>
          </div>

          {/* table  */}

          <Table className="bg-white shadow-sm rounded-lg text-lg">
            <TableHeader className="bg-gray-100 text-gray-700 uppercase text-base font-semibold tracking-wide">
              <TableRow>
                <TableHead className="px-4 py-3">Image</TableHead>

                <TableHead
                  onClick={() => handleSort("name")}
                  className="cursor-pointer hover:underline px-4 py-3"
                >
                  Name{" "}
                  {sortKey === "name" && (sortDirection === "asc" ? "↑" : "↓")}
                </TableHead>

                <TableHead
                  onClick={() => handleSort("category")}
                  className="cursor-pointer hover:underline px-4 py-3"
                >
                  Category{" "}
                  {sortKey === "category" &&
                    (sortDirection === "asc" ? "↑" : "↓")}
                </TableHead>

                <TableHead className="px-4 py-3">Sale</TableHead>

                <TableHead
                  onClick={() => handleSort("stock")}
                  className="cursor-pointer hover:underline px-4 py-3"
                >
                  Stock{" "}
                  {sortKey === "stock" && (sortDirection === "asc" ? "↑" : "↓")}
                </TableHead>

                <TableHead
                  onClick={() => handleSort("price")}
                  className="cursor-pointer hover:underline px-4 py-3"
                >
                  Price{" "}
                  {sortKey === "price" && (sortDirection === "asc" ? "↑" : "↓")}
                </TableHead>

                <TableHead className="px-4 py-3">Variants</TableHead>
                <TableHead className="px-4 py-3">Status</TableHead>
                <TableHead className="px-4 py-3">Action</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody className="text-lg">
              {sortedProducts.map((product) => (
                <TableRow
                  key={product.$id}
                  className={`hover:bg-gray-50 ${
                    product.stock < 1 ? "bg-red-50" : ""
                  }`}
                >                  <TableCell>
                    <img
                      src={getImageUrl(product.displayImage)}
                      alt={product.name}
                      className="w-10 h-10 object-cover rounded"
                    />
                  </TableCell>
                  <TableCell className="text-lg capitalize font-medium text-gray-800">
                    {product.name}
                  </TableCell>
                  <TableCell className="text-gray-600">
                    {product.category}
                  </TableCell>
                  <TableCell>
                    {product.minSalePrice > 0 && (
                      <span className="text-green-600 font-medium">
                        ₹{product.minSalePrice}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        product.totalStock < 10
                          ? "bg-red-100 text-red-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {product.totalStock < 1
                        ? "Out of Stock"
                        : `In Stock (${product.totalStock})`}
                    </span>
                  </TableCell>
                  <TableCell>
                    {product.minPrice === product.maxPrice 
                      ? `₹${product.minPrice}`
                      : `₹${product.minPrice} - ₹${product.maxPrice}`
                    }
                  </TableCell>
                  <TableCell>{product.variants?.length || 0} variants</TableCell>
                  <TableCell>
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                      Active
                    </span>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger className="focus:outline-none">
                        <MoreHorizontal className="w-5 h-5" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleEdit(product)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <Link href={`/dashboard/products/${product.$id}`}>
                          <DropdownMenuItem>
                            <div className="flex gap-2">
                              <EyeIcon className="mr-2 h-4 w-4" />
                              View
                            </div>
                          </DropdownMenuItem>
                        </Link>
                        <DropdownMenuItem
                          onClick={() => setDeleteId(product.$id)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex justify-between items-center mt-4 p-4 bg-dark-100 rounded-lg">
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1}
                className="px-3 py-1 bg-dark-200 text-white rounded disabled:opacity-50"
              >
                First
              </button>
              <button
                onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 bg-dark-200 text-white rounded disabled:opacity-50"
              >
                Previous
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-light-100">
                Page {currentPage} of {totalPages}
              </span>
              <span className="text-sm text-light-100/70">
                ({totalDocuments} total items)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  handlePageChange(Math.min(currentPage + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className="px-3 py-1 bg-dark-200 text-white rounded disabled:opacity-50"
              >
                Next
              </button>
              <button
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 bg-dark-200 text-white rounded disabled:opacity-50"
              >
                Last
              </button>
            </div>
          </div>

          <DeleteConfirmationModal
            isOpen={deleteId !== null}
            onClose={() => setDeleteId(null)}
            onConfirm={() => deleteId && handleDelete(deleteId)}
          />
        </div>
      )}
    </div>
  );
};

export default Product;
