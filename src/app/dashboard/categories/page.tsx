'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { databases } from '@/lib/appwrite';
import { Pencil, Trash2, Plus } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shimmer } from "@/components/ui/shimmer";

import { useDispatch, useSelector } from 'react-redux';
import { fetchCategories } from '@/store/slices/categorySlice';
import { RootState, AppDispatch } from '@/store/store';

interface Category {
  $id: string;
  name: string;
  description: string;
  sub_text?: string;
  image?: string;
}

interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm }: DeleteModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4 shadow-lg">
        <h2 className="text-xl font-bold mb-4">Confirm Delete</h2>
        <p className="text-gray-600 mb-6">Are you sure you want to delete this category? This action cannot be undone.</p>
        <div className="flex gap-4">
          <Button 
            onClick={onConfirm}
            variant="destructive"
            className="flex-1"
          >
            Delete
          </Button>
          <Button 
            onClick={onClose}
            variant="outline"
            className="flex-1"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};

export default function Categories() {
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const categoriesPerPage = 10;
  const router = useRouter();

  const dispatch = useDispatch<AppDispatch>();
  const { categories, loading } = useSelector((state: RootState) => state.categories);

  useEffect(() => {
    if (categories.length === 0) {
      dispatch(fetchCategories());
    }
  }, [categories, dispatch]);

  const handleDelete = async (categoryId: string) => {
    try {
      await databases.deleteDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_CATEGORY_COLLECTION_ID!,
        categoryId
      );
      dispatch(fetchCategories()); // re-fetch updated list
      setDeleteId(null);
    } catch (error) {
      console.error('Error deleting category:', error);
    }
  };

  const totalPages = Math.ceil(categories.length / categoriesPerPage);
  const indexOfLastCategory = currentPage * categoriesPerPage;
  const indexOfFirstCategory = indexOfLastCategory - categoriesPerPage;
  const currentCategories = categories.slice(indexOfFirstCategory, indexOfLastCategory);

  if (loading) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex justify-between items-center mb-8">
            <Shimmer type="text" className="w-48 h-10" />
            <Shimmer type="button" className="w-32 h-10" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
              <Card key={index} className="overflow-hidden">
                <CardContent className="p-4">
                  <Shimmer type="image" className="aspect-video mb-4" />
                  <Shimmer type="text" className="w-3/4 h-6 mb-2" />
                  <Shimmer type="text" className="w-1/2 h-4 mb-4" />
                  <Shimmer type="text" className="w-full h-10" />
                  <div className="flex justify-end gap-2 mt-4">
                    <Shimmer type="button" className="w-20 h-8" />
                    <Shimmer type="button" className="w-20 h-8" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-primary">Categories</h1>
          <Link href="/dashboard/categories/new">
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Category
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentCategories.map((category) => (
            <Card key={category.$id} className="overflow-hidden">
              <CardContent className="p-4">
                {category.image ? (
                  <div className="relative aspect-video mb-4">
                    <img
                      src={category.image}
                      alt={category.name}
                      className="w-full h-full object-cover rounded-md"
                    />
                  </div>
                ) : (
                  <div className="aspect-video mb-4 bg-gray-200 rounded-md flex items-center justify-center text-gray-500">
                    No image
                  </div>
                )}
                
                <h3 className="text-lg font-semibold text-black mb-1">{category.name}</h3>
                {category.sub_text && (
                  <p className="text-sm text-gray-600 mb-3">{category.sub_text}</p>
                )}
                <div className="line-clamp-2 text-sm text-gray-500 mb-4 min-h-[40px]">
                  {category.description}
                </div>
                <div className="flex justify-end gap-2 mt-2">
                  <Link
                    href={`/dashboard/categories/edit/${category.$id}`}
                  >
                    <Button variant="outline" size="sm">
                      <Pencil className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                  </Link>
                  <Button
                    onClick={() => setDeleteId(category.$id)}
                    variant="destructive" 
                    size="sm"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            {Array.from({ length: totalPages }).map((_, index) => (
              <Button
                key={index}
                onClick={() => setCurrentPage(index + 1)}
                variant={currentPage === index + 1 ? "default" : "outline"}
                size="sm"
                className="w-8 h-8 p-0"
              >
                {index + 1}
              </Button>
            ))}
          </div>
        )}

        <DeleteConfirmationModal 
          isOpen={deleteId !== null}
          onClose={() => setDeleteId(null)}
          onConfirm={() => deleteId && handleDelete(deleteId)}
        />
      </div>
    </div>
  );
}