'use client'
import React, { useState } from 'react'
import { X } from 'lucide-react'
import Image from 'next/image'
import { databases } from '@/lib/appwrite'
import ProductSelector from './ProductSelector'
import { Button } from '../ui/button'
interface CollectionViewProps {
    isOpen: boolean
    onClose: () => void
    collection: Collection | null
    products: Product[]
    onProductRemoved: () => void
}

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

const CollectionView = ({ isOpen, onClose, collection, products, onProductRemoved }: CollectionViewProps) => {
    const [showProductSelector, setShowProductSelector] = useState(false);
    const [productToRemove, setProductToRemove] = useState<Product | null>(null);
    if (!isOpen || !collection) return null;

    const collectionProducts = products.filter(product => 
        product.collections.includes(collection.$id)
    );
    console.log(collectionProducts);
    
    const handleRemoveProduct = async (product: Product) => {
        try {
            const updatedCollections = product.collections.filter(id => id !== collection.$id);
            
            await databases.updateDocument(
                process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
                process.env.NEXT_PUBLIC_APPWRITE_PRODUCT_COLLECTION_ID!,
                product.$id,
                { collections: updatedCollections }
            );

            onProductRemoved();
            setProductToRemove(null);
        } catch (error) {
            console.error('Error removing product from collection:', error);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-dark-100 p-6 rounded-lg max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-light-100">{collection.name}</h2>
                    <Button onClick={onClose} className="text-light-100 hover:text-primary">
                        <X className="w-6 h-6" />
                    </Button>
                </div>

                <div className="mb-4">
                    <Button
                        onClick={() => setShowProductSelector(true)}
                        className="bg-primary text-white px-4 py-2 rounded hover:bg-secondary transition-colors"
                    >
                        Add Products
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {collectionProducts.map(product => (
                        <div key={product.$id} className="bg-dark-200 p-4 rounded-lg">
                            <div className="relative aspect-square mb-4">
                                <Image
                                    src={`${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${process.env.NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID}/files/${product.image}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`}
                                    alt={product.name}
                                    fill
                                    className="rounded-lg object-cover"
                                />
                            </div>
                            <h3 className="text-light-100 font-semibold mb-2">{product.name}</h3>
                            <button
                                onClick={() => setProductToRemove(product)}
                                className="text-red-500 hover:text-red-600 text-sm"
                            >
                                Remove from Collection
                            </button>
                        </div>
                    ))}
                </div>

                {collectionProducts.length === 0 && (
                    <div className="text-center text-light-100/70 py-8">
                        No products in this collection
                    </div>
                )}

                {/* <ProductSelector
                    isOpen={showProductSelector}
                    onClose={() => setShowProductSelector(false)}
                    collection={collection}
                    products={products}
                    onProductsAdded={onProductRemoved}
                /> */}

                {productToRemove && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
                        <div className="bg-dark-100 p-6 rounded-lg max-w-md w-full mx-4">
                            <h2 className="text-xl font-bold text-light-100 mb-4">Confirm Remove</h2>
                            <p className="text-light-100/70 mb-6">
                                Are you sure you want to remove "{productToRemove.name}" from this collection?
                            </p>
                            <div className="flex gap-4">
                                <button
                                    onClick={() => handleRemoveProduct(productToRemove)}
                                    className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                                >
                                    Remove
                                </button>
                                <button
                                    onClick={() => setProductToRemove(null)}
                                    className="flex-1 btn-secondary"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CollectionView;
