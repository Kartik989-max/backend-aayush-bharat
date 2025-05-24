// components/modals/ProductModel.tsx
'use client'

import { useEffect, useState } from 'react'
import { databases } from '@/lib/appwrite'
import { Models } from 'appwrite'
import { Button } from '../ui/button'
interface ProductModelProps {
  onClose: () => void
  onSelect: (products: Models.Document[]) => void
  selectedIds?: string[]
}

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
    const selected = products.filter((p) => selectedProducts.includes(p.$id))
    onSelect(selected) // Send selected product objects
    onClose()          // Close the modal
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
      <div className="bg-dark-100 p-6 rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-light-100">Select Products</h2>
          <button onClick={onClose} className="text-light-100/70 hover:text-white">✕</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {products.map((product) => (
            <div
              key={product.$id}
              className={`border p-4 rounded-lg cursor-pointer ${
                selectedProducts.includes(product.$id) ? 'border-primary bg-dark-200' : 'border-dark-300'
              }`}
              onClick={() => toggleSelect(product.$id)}
            >
              <h3 className="text-light-100 font-semibold">{product.name}</h3>
              <p className="text-light-200 text-sm">{product.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end gap-4">
          <Button onClick={handleSelectProducts} className="btn-primary">
            Select Products
          </Button>
          <Button onClick={onClose} className="btn-secondary">
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}
