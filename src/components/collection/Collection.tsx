'use client'
import React, { useState, useEffect } from 'react'
import { databases, storage } from '@/lib/appwrite'
import { Pencil, Trash2 } from 'lucide-react'
import CollectionForm from './CollectionForm'
import Image from 'next/image'
import CollectionView from './CollectionView'
import { Query } from 'appwrite'
import { Button } from '../ui/button'
interface Collection {
  $id: string
  name: string
  description: string
}

interface Product {
  $id: string
  name: string
  image: string
  collections: string[]
}

interface DeleteModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
}

const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm }: DeleteModalProps) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-dark-100 p-6 rounded-lg max-w-md w-full mx-4">
        <h2 className="text-xl font-bold text-light-100 mb-4">Confirm Delete</h2>
        <p className="text-light-100/70 mb-6">
          Are you sure you want to delete this collection? This action cannot be undone.
        </p>
        <div className="flex gap-4">
          <Button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all"
          >
            Delete
          </Button>
          <Button onClick={onClose} className="flex-1 btn-secondary">
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}

const Collection = () => {
  const [collections, setCollections] = useState<Collection[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [showForm, setShowForm] = useState(false)
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [viewCollection, setViewCollection] = useState<Collection | null>(null)

  useEffect(() => {
    fetchCollections()
    fetchProducts()
  }, [])

  const fetchCollections = async () => {
    try {
      setLoading(true)
      const response = await databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_COLLECTION_ID!
      )
      setCollections(response.documents as unknown as Collection[])
    } catch (error) {
      console.error('Error fetching collections:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchProducts = async () => {
    try {
      // First get the total count
      const countResponse = await databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_PRODUCT_COLLECTION_ID!,
        [Query.limit(1)] // Just to get total count
      );
      
      const total = countResponse.total;
      
      // Now fetch all products in one request
      const response = await databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_PRODUCT_COLLECTION_ID!,
        [
          Query.limit(total), // Fetch all products
          Query.orderDesc('$createdAt')
        ]
      );

      setProducts(response.documents as unknown as Product[]);
    } catch (error) {
      console.error('Error fetching products:', error)
    }
  }

  const getImagePreview = (fileId: string) => {
    return storage.getFilePreview(
      process.env.NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID!,
      fileId,
      100,
      100
    )
  }

  const getCollectionProducts = (collectionId: string) => {
    console.log(collectionId);
    return products.filter(product => 
      product.collections.includes(collectionId)
    )
  }

  const handleFormSubmit = async () => {
    await fetchCollections()
    setShowForm(false)
    setSelectedCollection(null)
  }

  const handleEdit = (collection: Collection) => {
    setSelectedCollection(collection)
    setShowForm(true)
  }

  const handleDelete = async (collectionId: string) => {
    try {
      await databases.deleteDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_COLLECTION_ID!,
        collectionId
      )
      await fetchCollections()
      setDeleteId(null)
    } catch (error) {
      console.error('Error deleting collection:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="relative inline-flex">
          <div className="w-12 h-12 bg-primary rounded-full opacity-75 animate-ping"></div>
          <div className="w-12 h-12 bg-primary rounded-full absolute inset-0 animate-pulse"></div>
        </div>
        <div className="text-xl font-semibold text-primary animate-pulse">
          Loading Collections...
        </div>
      </div>
    )
  }

  console.log(products);
  
  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-light-100">Collections</h1>
        <Button
          onClick={() => setShowForm(true)}
          className="bg-dark text-white px-4 py-2 rounded"
        >
          Add Collection
        </Button>
      </div>

      {showForm && (
        <CollectionForm
          onSubmit={handleFormSubmit}
          initialData={selectedCollection}
          onCancel={() => {
            setShowForm(false)
            setSelectedCollection(null)
          }}
        />
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {collections.map((collection) => {
          const collectionProducts = getCollectionProducts(collection.$id)
          
          return (
            <div 
              key={collection.$id} 
              className="bg-dark-100 p-4 rounded-lg cursor-pointer"
              onClick={() => setViewCollection(collection)}
            >
              <h3 className="text-xl font-semibold mb-2 text-light-100">{collection.name}</h3>
              <p className="text-light-100/70 mb-4">{collection.description}</p>
              
              {collectionProducts.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-light-100/80 mb-2">
                    Products in this collection ({collectionProducts.length})
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {collectionProducts.slice(0, 4).map(product => (
                      <div key={product.$id} className="relative group">
                        <Image
                          src={getImagePreview(product.image).toString()}
                          alt={product.name}
                          width={50}
                          height={50}
                          className="rounded"
                        />
                        <div className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center">
                          <span className="text-xs text-white text-center px-1">
                            {product.name}
                          </span>
                        </div>
                      </div>
                    ))}
                    {collectionProducts.length > 4 && (
                      <div className="w-[50px] h-[50px] bg-dark-200 rounded flex items-center justify-center">
                        <span className="text-xs text-light-100">
                          +{collectionProducts.length - 4}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={() => handleEdit(collection)}
                  className="p-1 text-blue-500 hover:text-blue-700"
                  title="Edit"
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  onClick={() => setDeleteId(collection.$id)}
                  className="p-1 text-red-500 hover:text-red-700"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )
        })}
      </div>

      <CollectionView
        isOpen={viewCollection !== null}
        onClose={() => setViewCollection(null)}
        collection={viewCollection}
        products={products}
        onProductRemoved={fetchProducts}
      />

      <DeleteConfirmationModal
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && handleDelete(deleteId)}
      />
    </div>
  )
}

export default Collection
