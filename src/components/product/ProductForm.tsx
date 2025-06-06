import React, { useState, useEffect } from "react";
import type { Product, Variants } from "@/types/product";
import { productService } from "@/services/productService";
import {
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import VariantForm from "./VariantForm";
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
import { databases } from "@/lib/appwrite";
import { toast } from "react-toastify";
import { ID, Query } from "appwrite";
import "./debug";

interface Category {
  $id: string;
  name: string;
}

interface ProductFormProps {
  initialData: Product | null;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

const ProductCreateForm: React.FC<ProductFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
}) => {  // Base form state
  const [form, setForm] = useState<Product>({
    // Appwrite document fields
    $id: initialData?.$id || "",
    $collectionId: initialData?.$collectionId || "",
    $databaseId: initialData?.$databaseId || "",
    $createdAt: initialData?.$createdAt || "",
    $updatedAt: initialData?.$updatedAt || "",    $permissions: initialData?.$permissions || [],    // Product fields
    name: initialData?.name || "",
    description: initialData?.description || "",
    category: initialData?.category || "",
    tags: initialData?.tags || "",
    ingredients: initialData?.ingredients || "",    slug: initialData?.slug || "",
    collections: initialData?.collections || []  });
    // Loading and error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Generate slug from name if not provided
      const slug = form.slug || form.name
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-_]/g, "");      // Prepare submission data according to the Product interface
      const submissionData = {
        name: form.name,
        description: form.description,
        category: form.category,
        tags: form.tags,
        ingredients: form.ingredients,
        slug: slug,        collections: form.collections || []
      };
      let data: Product;      if (initialData?.$id) {
        data = await productService.updateProduct(initialData.$id, submissionData);
        toast.success("Product updated successfully!");      } else {
        data = await productService.createProduct(submissionData);
        console.log("Product created with ID:", data.$id);
        
        // Update form state immediately after creation
        setForm(prevForm => ({
          ...prevForm,
          ...data, // Spread all the data properties including $id and other Appwrite fields
        }));
          
        // Create a default variant for the new product
        await createDefaultVariant(data.$id);
        
        toast.success("Product created successfully! You can now manage variants.");
      }

      onSubmit(data);
    } catch (err: any) {
      const errorMessage = err?.message || "Failed to save changes";
      setError(errorMessage);
      toast.error(errorMessage);
    }

    setLoading(false);
  };    const createDefaultVariant = async (productId: string) => {
    try {
      console.log("Creating variant for product ID:", productId);
      
      // Define numeric values explicitly
      const variantData = {
        productId: productId,
        price: 0,
        weight: 0,
        months: 1,
        sale_price: 0,
        stock: 0,
        image: "",
        additionalImages: []
      };
      
      console.log("Saving variant data:", variantData);
      
      // Create variant document
      const result = await productService.createVariant(variantData);
      
      console.log("Variant created:", result);
      return result;
    } catch (error) {
      console.error('Error creating variant:', error);
      throw error;
    }
  };

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

        {/* Basic Information Section */}
        <div className="gap-8">
          <div className="shadow-lg p-6 rounded-lg">
            <h1 className="text-xl font-semibold">Basic Information</h1>
            <p className="mb-6">Update product information below.</p>
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
                <label className="mb-2">Category</label>
                {loadingCategories ? (
                  <div>Loading categories...</div>
                ) : (                <Select
                    value={form.category}
                    onValueChange={(value) =>
                      setForm((prev) => ({ ...prev, category: value }))
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

              <div className="col-span-2">
                <label>Description</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  className="w-full mt-2 p-2 border rounded"
                  rows={5}
                  required
                />
                
              </div>
            </div>
          </div>
        </div>        {/* Variant Section */}
        <div className="p-5 bg-white rounded-xl border space-y-5">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold">Product Variants</h3>
            <p className="text-sm text-gray-500">At least one variant is required for each product</p>
          </div>
            {/* Just show the variant form without any conditions */}          <VariantForm 
            productId={form.$id || initialData?.$id} 
          />
        </div>

        {/* Submit/Cancel Buttons */}
        <div className="flex gap-4 justify-end">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type="submit"
            className="bg-green-600 text-white"
            disabled={loading}
          >
            {loading
              ? "Saving..."
              : initialData
              ? "Update Product"
              : "Create Product"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ProductCreateForm;


