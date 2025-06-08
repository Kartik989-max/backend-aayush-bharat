// components/modals/ProductModel.tsx
'use client'
import { databases } from '@/lib/appwrite'
import { Models } from 'appwrite'

import { useState,useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Image from 'next/image'
import { getFilePreview } from '@/lib/appwrite'
import { Product } from '@/types/product';


interface ProductModelProps {
  onClose: () => void;
  onSelect: (products: Product[]) => void;
  selectedIds?: string[]
}


const ITEMS_PER_PAGE = 10;

export const ProductModel = ({ onClose, onSelect, selectedIds = [] }: ProductModelProps) => {
  const [products, setProducts] = useState<Models.Document[]>([])
  const [selectedProducts, setSelectedProducts] = useState<string[]>(selectedIds)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await databases.listDocuments(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
          process.env.NEXT_PUBLIC_APPWRITE_PRODUCT_COLLECTION_ID!
        )
        setProducts(res.documents)
      } catch (error) {
        console.error('Error fetching products:', error)
      }
    }

    fetchProducts()
  }, [])

  const toggleSelect = (id: string) => {
    setSelectedProducts((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  const handleSelectProducts = () => {
    const selectedDocs = products.filter((p) => selectedProducts.includes(p.$id))
    const selected: Product[] = selectedDocs.map((doc) => ({
      $id: doc.$id,
      $collectionId: doc.$collectionId,
      $databaseId: doc.$databaseId,
      $createdAt: doc.$createdAt,
      $updatedAt: doc.$updatedAt,
      $permissions: doc.$permissions,
      name: doc.name,
      description: doc.description,
      rating: doc.rating,
      category: doc.category,
      price: doc.price,
      image: doc.image,
      tags: doc.tags || "",
      slug: doc.slug || "",
      ingredients: doc.ingredients || "",
      variants: doc.variants || [],
      collections: doc.collections || [],
      productVideo: doc.productVideo || [] // Add this line to include productVideo field
    }))
    onSelect(selected) // Send selected product objects
    onClose()          // Close the modal
  }




  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredProducts = useMemo(() => {
    return products.filter((product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, products]);

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  
  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
      <div className="bg-dark-100 p-6 rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-light-100">Select Products</h2>
          <button onClick={onClose} className="text-light-100/70 hover:text-white">✕</button>
        </div>

        <div className="grid grid-cols-1 gap-4">

    <div className="mb-4">
        <Input
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          className="max-w-sm"
        />
      </div>


 <div className="overflow-x-auto border rounded-lg">
        <table className="min-w-full text-sm text-left border-separate border-spacing-y-2">
          <thead className="bg-gray-50 text-muted-foreground">
            <tr>
              <th className="px-4 py-2">Product</th>
              <th className="px-4 py-2">Variants</th>
              <th className="px-4 py-2">Stock</th>
              <th className="px-4 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedProducts.map((product) => (
<tr
  key={product.$id}
  className={`rounded-md shadow-sm ${
    selectedProducts.includes(product.$id) ? 'bg-gray-300' : 'bg-white'
  }`}
>
  <td className="px-4 py-3 flex items-center gap-3">
    <Image
      src={getFilePreview(product.image)}
      alt={product.name}
      width={40}
      height={40}
      className="rounded-md border"
    />
    <span>{product.name}</span>
  </td>
  <td className="px-4 py-3">{product.variants.length} Total</td>
  <td className="px-4 py-3">{product.stock}</td>
  <td className="px-4 py-3 text-right">
    <Button
      variant="outline"
      size="sm"
      onClick={() => toggleSelect(product.$id)}
    >
      {selectedProducts.includes(product.$id) ? ' Selected' : 'Select'}
    </Button>
  </td>
</tr>

      
            ))}
          </tbody>
        </table>
        </div>



 <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
        <span>
          Showing {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, filteredProducts.length)} to{" "}
          {Math.min(currentPage * ITEMS_PER_PAGE, filteredProducts.length)} of {filteredProducts.length} products
        </span>

        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((prev) => prev - 1)}
          >
            Prev
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === totalPages || totalPages === 0}
            onClick={() => setCurrentPage((prev) => prev + 1)}
          >
            Next
          </Button>
        </div>
      </div>


          {/* {products.map((product) => (
            <div
              key={product.$id}
              className={`border flex gap-2 p-4 rounded-lg cursor-pointer ${
                selectedProducts.includes(product.$id) ? 'border-primary bg-dark-200' : 'border-dark-300'
              }`}
              onClick={() => toggleSelect(product.$id)}
            >
              <Image src={getFilePreview( product.image)} height={500} width={500} className='h-20 w-20 object-cover rounded' alt={product.name}/>

                                                 <h3 className="text-light-100 font-semibold text-base">{product.name}</h3>
                                                 <h3 className="text-light-100 font-semibold text-base">{product.price}</h3>
                                                 <h3 className="text-light-100 font-semibold text-base">{product.stock} Total</h3>
            </div>
          ))} */}
      
      
      
        </div>

        <div className="mt-6 flex justify-end gap-4">
          <Button onClick={handleSelectProducts} variant='secondary'>
            Select Products
          </Button>
          <Button onClick={onClose} variant="destructive">
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}
