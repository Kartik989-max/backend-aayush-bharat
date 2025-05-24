'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { databases } from '@/lib/appwrite';
import { Pencil, Trash2, Plus } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Card,CardContent} from '@/components/ui/card';
interface Category {
  $id: string;
  name: string;
  sub_text: string;
  description: string;
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
      <div className="bg-dark-100 p-6 rounded-lg max-w-md w-full mx-4 border border-gray-700">
        <h2 className="text-xl font-bold text-light-100 mb-4">Confirm Delete</h2>
        <p className="text-light-100/70 mb-6">Are you sure you want to delete this category? This action cannot be undone.</p>
        <div className="flex gap-4">
          <button 
            onClick={onConfirm}
            className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all"
          >
            Delete
          </button>
          <button 
            onClick={onClose}
            className="flex-1 bg-dark-200 text-light-100 px-4 py-2 rounded-lg hover:bg-dark-200/80 transition-all border border-gray-700"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const categoriesPerPage = 10;
  const router = useRouter();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_CATEGORY_COLLECTION_ID!
      );
      setCategories(response.documents as unknown as Category[]);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (categoryId: string) => {
    try {
      await databases.deleteDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_CATEGORY_COLLECTION_ID!,
        categoryId
      );
      await fetchCategories();
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
      <div className="min-h-screen bg-dark-200 flex items-center justify-center">
        <div className="relative inline-flex">
          <div className="w-12 h-12 bg-primary rounded-full opacity-75 animate-ping"></div>
          <div className="w-12 h-12 bg-primary rounded-full absolute inset-0 animate-pulse"></div>
        </div>
      </div>
    );
  }

  console.log(categories);
  
  return (
    <div className="min-h-screen bg-dark-200 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-primary">Categories</h1>
          <Link
            href="/dashboard/categories/new"
            className="bg-dark text-dark px-4 py-2 rounded-md hover:bg-primary/90 transition-colors duration-200 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Category
          </Link>
        </div>

        <div className="bg-dark-100 rounded-lg  overflow-hidden  ">
          <div className=" divide-gray-700">
         
            <div className="grid grid-cols-3 gap-4 bg-dark-100 shadow-lg">
              {currentCategories.map((category) => (
                <Card key={category.$id} className="hover:bg-dark-200/50 transition-colors w-100 h-80">
                  <CardContent className="p-0 m-0 whitespace-nowrap">
                    {category.image ? (
                      <div className="relative mb-2 w-100 h-60 rounded  bg-transparent">
                        <Image
                          src={category.image}
                          alt={category.name}
                          fill
                          className='object-cover w-100'
                        />
                      </div>
                    ) : (
                      <div className="w-100 h-60 bg-gray-200 rounded flex items-center justify-center text-gray-500">
                        No image
                      </div>
                    )}
                
                  <p className="py-2 px-4 whitespace-nowrap text-sm font-medium text-black">
                    {category.name}
                  </p>
                  {/* <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 h-24">
                    {category.sub_text}
                  </td> */}
                  {/* <td className="px-6 py-4 text-sm text-gray-400 h-24">
                    <div className="line-clamp-3 max-w-md">
                      {category.description}
                    </div>
                  </td> */}
                  <div className="p-2 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-4">
                      <Link
                        href={`/dashboard/categories/edit/${category.$id}`}
                        className="text-primary hover:text-primary/80 transition-colors"
                      >
                        <Pencil className="w-5 h-5" />
                      </Link>
                      <button
                        onClick={() => setDeleteId(category.$id)}
                        className="text-red-500 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                        </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            {Array.from({ length: totalPages }).map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentPage(index + 1)}
                className={`px-3 py-1 rounded ${
                  currentPage === index + 1
                    ? 'bg-primary text-dark-200'
                    : 'bg-dark-100 text-light-100 hover:bg-dark-200/50'
                } transition-colors`}
              >
                {index + 1}
              </button>
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