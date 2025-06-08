'use client'

import { useState, useEffect } from 'react'
import { createDocument, databases } from '@/lib/appwrite'
import { Product } from '@/types/product'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Card, CardContent } from "@/components/ui/card";
import { Plus, X } from 'lucide-react'
import ProductSelector from './ProductSelector'
import { Badge } from "@/components/ui/badge";

interface CollectionFormProps {
  onSubmit: (data: any) => void
  initialData?: Collection | null
  onCancel: () => void
}

interface Collection {
  $id?: string
  name: string
  description: string
  products: Product[]
}

const CollectionForm = ({ onSubmit, initialData, onCancel }: CollectionFormProps) => {
  const [formData, setFormData] = useState<Collection>({
    name: initialData?.name || '',
    description: initialData?.description || '',
    products: initialData?.products || [],
  })

  const [selectedProducts, setSelectedProducts] = useState<Product[]>(initialData?.products || [])
  const [showProductSelector, setShowProductSelector] = useState(false)
  const [allProducts, setAllProducts] = useState<Product[]>([])

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const response = await databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_PRODUCT_COLLECTION_ID!
      )
      setAllProducts(response.documents as unknown as Product[])
    } catch (error) {
      console.error('Error fetching products:', error)
    }
  }

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

  const handleRemoveProduct = (productId: string) => {
    setSelectedProducts(prev => prev.filter(product => product.$id !== productId))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Collection Name</Label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter collection name"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Enter collection description"
            required
          />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Label>Products</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowProductSelector(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Products
          </Button>
        </div>

        {selectedProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {selectedProducts.map((product) => (
              <Card key={product.$id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{product.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {product.variants[0]?.price ? `₹${product.variants[0].price}` : 'No price set'}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveProduct(product.$id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground border rounded-lg">
            No products added to this collection
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Button type="submit" variant="default">
          {initialData ? 'Update' : 'Create'} Collection
        </Button>
        <Button type="button" onClick={onCancel} variant="outline">
          Cancel
        </Button>
      </div>

      {showProductSelector && (
        <ProductSelector
          isOpen={showProductSelector}
          onClose={() => setShowProductSelector(false)}
          collection={{ $id: initialData?.$id || '', name: formData.name }}
          products={allProducts}
          onProductsAdded={() => {
            fetchProducts()
            setShowProductSelector(false)
          }}
        />
      )}
    </form>
  )
}

export default CollectionForm
