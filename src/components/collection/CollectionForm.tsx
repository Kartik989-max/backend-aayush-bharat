'use client'

import { useState } from 'react'
import { createDocument, databases } from '@/lib/appwrite'
import { Button } from '../ui/button'
import { ProductModel } from '@/components/product/ProudctModal'
import { Models } from 'appwrite'
import { DeleteIcon, X } from 'lucide-react'

interface CollectionFormProps {
  onSubmit: (data: any) => void
  initialData?: Collection | null
  onCancel: () => void
}

interface Collection {
  $id?: string
  name: string
  description: string
}

const CollectionForm = ({ onSubmit, initialData, onCancel }: CollectionFormProps) => {
  const [formData, setFormData] = useState<Collection>({
    name: initialData?.name || '',
    description: initialData?.description || '',
  })

  const [selectedProducts, setSelectedProducts] = useState<Models.Document[]>([])
  const [showProductModal, setShowProductModal] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload = {
        ...formData,
        products: selectedProducts.map((p) => p.$id)
      }

      if (initialData?.$id) {
        await databases.updateDocument(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
          process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_COLLECTION_ID!,
          initialData.$id,
          payload
        )
      } else {
        await createDocument(
          process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_COLLECTION_ID!,
          payload
        )
      }

      onSubmit(payload)
    } catch (error) {
      console.error('Error submitting form:', error)
    }
  }

  const handleRemoveProduct = (id: string) => {
    setSelectedProducts(prev => prev.filter(product => product.$id !== id))
  }

  console.log(formData);
  
  return (
    <>
      <form onSubmit={handleSubmit} className="bg-dark-100 p-4 rounded-lg mb-4">
        <div className="mb-4">
          <label className="block text-light-100 mb-2">Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full p-2 rounded bg-dark-200 text-light-100"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-light-100 mb-2">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full p-2 rounded bg-dark-200 text-light-100"
            rows={4}
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-light-100 mb-2">Selected Products</label>
          <Button type="button" onClick={() => setShowProductModal(true)} className="btn-secondary mb-2">
            Select Products
          </Button>

          {selectedProducts.length === 0 ? (
            <p className="text-light-400 text-sm">No products selected.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {selectedProducts.map((product) => (
                <div key={product.$id} className="relative p-3 border rounded bg-dark-200">
                  <h4 className="text-light-100 font-semibold">{product.name}</h4>
                  <p className="text-light-300 text-sm">{product.description}</p>
                  <button
                    type="button"
                    onClick={() => handleRemoveProduct(product.$id)}
                    className="absolute top-1 right-2 text-red-400 text-xs hover:text-red-600"
                    title="Remove product"
                  >
                    <X/>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button type="submit" className="btn-primary">
            {initialData ? 'Update' : 'Create'} Collection
          </Button>
          <Button type="button" onClick={onCancel} className="btn-secondary">
            Cancel
          </Button>
        </div>
      </form>

      {showProductModal && (
        <ProductModel
          onClose={() => setShowProductModal(false)}
          onSelect={(products) => {
            setSelectedProducts(products)
            setShowProductModal(false)
          }}
          selectedIds={selectedProducts.map((p) => p.$id)}
        />
      )}
    </>
  )
}

export default CollectionForm
