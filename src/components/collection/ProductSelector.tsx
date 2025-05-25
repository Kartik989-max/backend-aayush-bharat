'use client'
import React, { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import Image from 'next/image'
import { databases } from '@/lib/appwrite'
import { Button } from '../ui/button'
import { Product } from '@/types/product'
interface ProductSelectorProps {
    isOpen: boolean
    onClose: () => void
    collection: Collection
    products: Product[]
    onProductsAdded: () => void
}

interface Collection {
    $id: string
    name: string
}



const ProductSelector = ({ isOpen, onClose, collection, products: initialProducts, onProductsAdded }: ProductSelectorProps) => {
    const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set())
    const [products, setProducts] = useState<Product[]>([]) // Initialize with empty array
    const [loading, setLoading] = useState(false)
    const [currentPage, setCurrentPage] = useState(1)
    const [totalDocuments, setTotalDocuments] = useState(0)
    const productsPerPage = 12

    useEffect(() => {
        if (isOpen) {
            // Filter products that aren't in the collection
            // const availableProducts = initialProducts.filter(product => 
            //     !product.collections?.includes(collection)
            // );
            setProducts(availableProducts);
            setTotalDocuments(availableProducts.length);
        } else {
            setCurrentPage(1);
            setSelectedProducts(new Set());
        }
    }, [isOpen, initialProducts, collection.$id]);

    // Calculate paginated products
    const getPagedProducts = () => {
        const startIndex = (currentPage - 1) * productsPerPage;
        const endIndex = startIndex + productsPerPage;
        return products.slice(startIndex, endIndex);
    };

    // Get current page products
    const currentProducts = getPagedProducts();

    // Remove the filter here since we already filtered in useEffect
    const availableProducts = currentProducts;

    const toggleProduct = (productId: string) => {
        const newSelected = new Set(selectedProducts);
        if (newSelected.has(productId)) {
            newSelected.delete(productId);
        } else {
            newSelected.add(productId);
        }
        setSelectedProducts(newSelected);
    };

    const handleAddProducts = async () => {
        try {
            const updates = Array.from(selectedProducts).map(productId => {
                const product = products.find(p => p.$id === productId);
                if (!product) return null;

                const updatedCollections = [...product.collections, collection.$id];
                return databases.updateDocument(
                    process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
                    process.env.NEXT_PUBLIC_APPWRITE_PRODUCT_COLLECTION_ID!,
                    productId,
                    { product_collection: updatedCollections }
                );
            });

            await Promise.all(updates.filter(Boolean));
            onProductsAdded();
            onClose();
        } catch (error) {
            console.error('Error adding products to collection:', error);
        }
    };

    const totalPages = Math.max(1, Math.ceil(products.length / productsPerPage));

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
                            {availableProducts.map(product => (
                                <div 
                                    key={product.$id} 
                                    className={`bg-dark-200 p-4 rounded-lg cursor-pointer border-2 ${
                                        selectedProducts.has(product.$id) ? 'border-primary' : 'border-transparent'
                                    }`}
                                    onClick={() => toggleProduct(product.$id)}
                                >
                                    <div className="relative aspect-square mb-4">
                                        <Image
                                            src={`${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${process.env.NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID}/files/${product.image}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`}
                                            alt={product.name}
                                            fill
                                            className="rounded-lg object-cover"
                                        />
                                    </div>
                                    <Image alt='alt' src={product.image} height={500} width={500} className='h-20 w-20 object-cover rounded'/>
                                    <h3 className="text-light-100 font-semibold text-base">{product.name}</h3>
                                    <h3 className="text-light-100 font-semibold text-base">{product.price}</h3>
                                    <h3 className="text-light-100 font-semibold text-base">{product.stock} Total</h3>
                                </div>
                            ))}
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
                                        Page {currentPage} of {totalPages}
                                    </span>
                                    <span className="text-sm text-light-100/70">
                                        ({totalDocuments} total items)
                                    </span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                        disabled={currentPage === totalPages}
                                        className="px-3 py-1 bg-dark-300 text-white rounded disabled:opacity-50"
                                    >
                                        Next
                                    </button>
                                    <button
                                        onClick={() => setCurrentPage(totalPages)}
                                        disabled={currentPage === totalPages}
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
