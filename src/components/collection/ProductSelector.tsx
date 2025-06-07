'use client'
import React, { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import Image from 'next/image'
import { databases } from '@/lib/appwrite'
import { Button } from '../ui/button'
import { Product, Collections } from '@/types/product'

interface ProductSelectorProps {
    isOpen: boolean
    onClose: () => void
    collection: Collection
    products: Product[]
    onProductsAdded: () => void
}

interface Collection {
    $id: Collections
    name: string
}

const ProductSelector = ({ isOpen, onClose, collection, products: initialProducts, onProductsAdded }: ProductSelectorProps) => {
    const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set())
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(false)
    const [currentPage, setCurrentPage] = useState(1)
    const [totalDocuments, setTotalDocuments] = useState(0)
    const productsPerPage = 12

    useEffect(() => {
        if (isOpen) {
            // Filter products that aren't in the collection
            const availableProducts = initialProducts.filter(product => {
                const productCollections = Array.isArray(product.collections) ? product.collections : [];
                return !productCollections.includes(collection.$id);
            });
            setProducts(availableProducts);
            setTotalDocuments(availableProducts.length);
        } else {
            setCurrentPage(1);
            setSelectedProducts(new Set());
        }
    }, [isOpen, initialProducts, collection.$id]);

    const toggleProduct = (productId: string) => {
        setSelectedProducts(prev => {
            const newSet = new Set(prev);
            if (newSet.has(productId)) {
                newSet.delete(productId);
            } else {
                newSet.add(productId);
            }
            return newSet;
        });
    };

    const handleAddProducts = async () => {
        try {
            setLoading(true);
            const updates = Array.from(selectedProducts).map(productId => {
                const product = products.find(p => p.$id === productId);
                if (!product) return null;

                const currentCollections = Array.isArray(product.collections) ? product.collections : [];
                const updatedCollections = [...currentCollections, collection.$id];
                
                return databases.updateDocument(
                    process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
                    process.env.NEXT_PUBLIC_APPWRITE_PRODUCT_COLLECTION_ID!,
                    productId,
                    { collections: updatedCollections }
                );
            });

            await Promise.all(updates.filter(Boolean));
            onProductsAdded();
            onClose();
        } catch (error) {
            console.error('Error adding products to collection:', error);
        } finally {
            setLoading(false);
        }
    };

    const availableProducts = products.slice((currentPage - 1) * productsPerPage, currentPage * productsPerPage);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-dark-100 p-6 rounded-lg max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-light-100">Add Products to {collection.name}</h2>
                    <button onClick={onClose} className="text-light-100 hover:text-primary">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {availableProducts.map(product => {
                                const mainVariant = product.variants[0] || {};
                                return (
                                    <div 
                                        key={product.$id} 
                                        className={`bg-dark-200 p-4 rounded-lg cursor-pointer border-2 ${
                                            selectedProducts.has(product.$id) ? 'border-primary' : 'border-transparent'
                                        }`}
                                        onClick={() => toggleProduct(product.$id)}
                                    >
                                        <div className="relative aspect-square mb-4">
                                            <Image
                                                src={`${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${process.env.NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID}/files/${mainVariant.image}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`}
                                                alt={product.name}
                                                fill
                                                className="rounded-lg object-cover"
                                            />
                                        </div>
                                        <h3 className="text-light-100 font-semibold text-base">{product.name}</h3>
                                        <p className="text-light-100 font-semibold text-base">₹{mainVariant.price}</p>
                                        <p className="text-light-100 font-semibold text-base">{mainVariant.stock} in stock</p>
                                    </div>
                                );
                            })}
                        </div>

                        {products.length === 0 && !loading && (
                            <div className="text-center text-light-100/70 py-8">
                                All products are already in this collection
                            </div>
                        )}

                        {products.length > 0 && (
                            <div className="flex justify-between items-center mt-6 p-4 bg-dark-200 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setCurrentPage(1)}
                                        disabled={currentPage === 1}
                                        className="px-3 py-1 bg-dark-300 text-white rounded disabled:opacity-50"
                                    >
                                        First
                                    </button>
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                        disabled={currentPage === 1}
                                        className="px-3 py-1 bg-dark-300 text-white rounded disabled:opacity-50"
                                    >
                                        Previous
                                    </button>
                                </div>

                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-light-100">
                                        Page {currentPage} of {Math.ceil(totalDocuments / productsPerPage)}
                                    </span>
                                    <span className="text-sm text-light-100/70">
                                        ({totalDocuments} total items)
                                    </span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(totalDocuments / productsPerPage)))}
                                        disabled={currentPage >= Math.ceil(totalDocuments / productsPerPage)}
                                        className="px-3 py-1 bg-dark-300 text-white rounded disabled:opacity-50"
                                    >
                                        Next
                                    </button>
                                    <button
                                        onClick={() => setCurrentPage(Math.ceil(totalDocuments / productsPerPage))}
                                        disabled={currentPage >= Math.ceil(totalDocuments / productsPerPage)}
                                        className="px-3 py-1 bg-dark-300 text-white rounded disabled:opacity-50"
                                    >
                                        Last
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="mt-6 flex justify-end gap-4">
                            <Button onClick={onClose} variant='destructive'>
                                Cancel
                            </Button>
                            <Button 
                            variant='secondary'
                                onClick={handleAddProducts}
                                disabled={selectedProducts.size === 0}
                                className={` ${selectedProducts.size === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                Add Selected Products ({selectedProducts.size})
                            </Button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default ProductSelector;
