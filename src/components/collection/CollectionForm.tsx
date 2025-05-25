'use client'

import { useState } from 'react'
import { createDocument, databases } from '@/lib/appwrite'
import { ProductModel } from '@/components/product/ProudctModal'
import { Models } from 'appwrite'
import { DeleteIcon, X } from 'lucide-react'
import { Textarea } from '../ui/textarea'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Plus } from 'lucide-react'
import Image from 'next/image'
import { getFilePreview } from '@/lib/appwrite'
import { Product } from '@/types/product'
interface CollectionFormProps {
  onSubmit: (data: any) => void
  initialData?: Collection | null
  onCancel: () => void
}

interface Collection {
  $id?: string
  name: string
  description: string
  products:Product[]
}

const CollectionForm = ({ onSubmit, initialData, onCancel }: CollectionFormProps) => {
  const [formData, setFormData] = useState<Collection>({
    name: initialData?.name || '',
    description: initialData?.description || '',
    products:initialData?.products || [],
  })

  const [selectedProducts, setSelectedProducts] = useState<Product[]>(initialData?.products || [])
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
          <Input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full p-2 rounded bg-dark-200 text-light-100"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-light-100 mb-2">Description</label>
          <Textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full p-2 rounded bg-dark-200 text-light-100"
            rows={4}
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-light-100 mb-2">Select Products</label>
          {/* <Button type="button" onClick={() => setShowProductModal(true)} className="mb-2">
            Select Products
          </Button> */}


 <Button type="button" onClick={() => setShowProductModal(true)} 
  className="w-24 h-24 border-2 border-dashed border-muted flex 
  items-center justify-center rounded text-muted-foreground
   hover:bg-muted transition mb-4">
        <Plus className="w-6 h-6" />
                </Button>



          {selectedProducts.length === 0 ? (
            <p className="text-light-400 text-sm">No products selected.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {selectedProducts.map((product) => (

                <div key={product.$id} className="flex gap-4 relative p-3 border rounded bg-dark-200">
                  <div>
                  <Image src={getFilePreview(product.image)} alt={"Alt"} width={500} height={500} className='w-24 object-cover h-24'  />
                  </div>

<div>

                  <h4 className="text-light-100 text-xl capitalize my-2 font-semibold">{product.name}</h4>
                  <p className="text-light-300 text-base">₹{product.price}</p>
</div>
                  <Button
                    type="button"
                    onClick={() => handleRemoveProduct(product.$id)}
                    className="absolute top-1 right-2 text-red-400 text-xs hover:text-red-600"
                    title="Remove product"
                  >
                    <X/>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button type="submit" variant='secondary' className='border-gray-200 border-2' >
            {initialData ? 'Update' : 'Create'} Collection
          </Button>
          <Button type="button" onClick={onCancel} variant='destructive' >
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
