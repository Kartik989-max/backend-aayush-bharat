'use client'
import React, { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import Image from 'next/image'
import { databases } from '@/lib/appwrite'
import { Button } from '../ui/button'
import { Product } from '@/types/product'
import { Card, CardContent } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Shimmer } from "@/components/ui/shimmer";
import { Badge } from "@/components/ui/badge";

interface ProductSelectorProps {
    isOpen: boolean
    onClose: () => void
    collection: Collection
    products: Product[]
    onProductsAdded: (selectedProducts: Product[]) => void
}

interface Collection {
    $id: string
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
            
            // Get the selected products and pass them to the parent
            const selectedProductsList = products.filter(product => selectedProducts.has(product.$id));
            onProductsAdded(selectedProductsList);
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
        <Dialog open={isOpen} onClose={onClose}>
            <div className="fixed inset-0 z-50 bg-black/50" />
            <div className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-4xl translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 sm:rounded-lg max-h-[80vh] overflow-y-auto">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold">Add Products to {collection.name}</h2>
                        <p className="text-sm text-muted-foreground mt-1">
                            Select products to add to this collection
                        </p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="w-6 h-6" />
                    </Button>
                </div>

                {loading ? (
                    <div className="space-y-6 py-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {[...Array(8)].map((_, i) => (
                                <Shimmer key={i} type="card" />
                            ))}
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {availableProducts.map(product => {
                                const mainVariant = product.variants[0] || {};
                                return (
                                    <Card 
                                        key={product.$id} 
                                        className={`cursor-pointer transition-all ${
                                            selectedProducts.has(product.$id) 
                                                ? 'ring-2 ring-primary' 
                                                : 'hover:ring-2 hover:ring-primary/50'
                                        }`}
                                        onClick={() => toggleProduct(product.$id)}
                                    >
                                        <CardContent className="p-4">
                                            <div className="relative aspect-square mb-4">
                                                <Image
                                                    src={`${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${process.env.NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID}/files/${mainVariant.image}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`}
                                                    alt={product.name}
                                                    fill
                                                    className="rounded-lg object-cover"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <h3 className="font-semibold">{product.name}</h3>
                                                <div className="flex justify-between items-center">
                                                    <span className="font-medium">₹{mainVariant.price}</span>
                                                    <Badge variant={mainVariant.stock > 0 ? "default" : "destructive"}>
                                                        {mainVariant.stock} in stock
                                                    </Badge>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>

                        {products.length === 0 && !loading && (
                            <div className="text-center py-8 text-muted-foreground">
                                All products are already in this collection
                            </div>
                        )}

                        {products.length > 0 && (
                            <div className="flex justify-between items-center mt-6 p-4 bg-muted rounded-lg">
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(1)}
                                        disabled={currentPage === 1}
                                    >
                                        First
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                        disabled={currentPage === 1}
                                    >
                                        Previous
                                    </Button>
                                </div>

                                <div className="flex items-center gap-2">
                                    <span className="text-sm">
                                        Page {currentPage} of {Math.ceil(totalDocuments / productsPerPage)}
                                    </span>
                                    <span className="text-sm text-muted-foreground">
                                        ({totalDocuments} total items)
                                    </span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(totalDocuments / productsPerPage)))}
                                        disabled={currentPage >= Math.ceil(totalDocuments / productsPerPage)}
                                    >
                                        Next
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(Math.ceil(totalDocuments / productsPerPage))}
                                        disabled={currentPage >= Math.ceil(totalDocuments / productsPerPage)}
                                    >
                                        Last
                                    </Button>
                                </div>
                            </div>
                        )}

                        <div className="mt-6 flex justify-end gap-4">
                            <Button onClick={onClose} variant="outline">
                                Cancel
                            </Button>
                            <Button 
                                onClick={handleAddProducts}
                                disabled={selectedProducts.size === 0}
                            >
                                Add Selected Products ({selectedProducts.size})
                            </Button>
                        </div>
                    </>
                )}
            </div>
        </Dialog>
    );
};

export default ProductSelector;
