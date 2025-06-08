'use client'
import React, { useState, useEffect } from 'react'
import { databases, storage } from '@/lib/appwrite'
import { Pencil, Trash2 } from 'lucide-react'
import CollectionForm from './CollectionForm'
import Image from 'next/image'
// import CollectionView from './CollectionView'
import { Query } from 'appwrite'
import { Button } from '../ui/button'
import { Product } from '@/types/product'
import { Shimmer } from "@/components/ui/shimmer";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";

interface Collection {
  $id: string
  name: string
  description: string
  products:Product[]
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
          <Button onClick={onClose} variant='secondary' className="flex-1">
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

  // const getCollectionProducts = (collectionId: string) => {
  //   return products.filter(product => 
  //     product.collections.includes(collectionId)
  //   )
  // }

  const handleFormSubmit = async () => {
    await fetchCollections()
    setShowForm(false)
    setSelectedCollection(null)
  }

  const handleEdit = (collection: Collection) => {
    console.log(collection);
    
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
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Shimmer type="text" className="w-48" />
          <Shimmer type="button" />
        </div>
        <Shimmer type="table" count={5} />
      </div>
    );
  }

  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Collections</h1>
        {showForm ? (
          <Button
            onClick={() => setShowForm(false)}
            variant="outline"
          >
            Back to Collections
          </Button>
        ) : (
          <Button
            onClick={() => { setShowForm(true); setSelectedCollection(null) }}
            variant="default"
          >
            Add Collection
          </Button>
        )}
      </div>

      {showForm && (
        <Card>
          <CardContent className="p-6">
            <CollectionForm
              onSubmit={handleFormSubmit}
              initialData={selectedCollection}
              onCancel={() => {
                setShowForm(false)
                setSelectedCollection(null)
              }}
            />
          </CardContent>
        </Card>
      )}

      {!showForm && (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Products</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {collections.map((collection) => (
                  <TableRow key={collection.$id}>
                    <TableCell className="font-medium">{collection.name}</TableCell>
                    <TableCell>{collection.products.length} Total</TableCell>
                    <TableCell>{collection.description}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          onClick={() => handleEdit(collection)}
                          variant="ghost"
                          size="icon"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => setDeleteId(collection.$id)}
                          variant="ghost"
                          size="icon"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <DeleteConfirmationModal
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && handleDelete(deleteId)}
      />
    </div>
  )
}

export default Collection
