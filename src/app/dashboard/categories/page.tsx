'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { databases, getFilePreview } from '@/lib/appwrite';
import { Pencil, Trash2, Plus } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Card,CardContent} from '@/components/ui/card';
import { Button } from '@/components/ui/button';

  import { useDispatch, useSelector } from 'react-redux';
import { fetchCategories } from '@/store/slices/categorySlice';
import { RootState, AppDispatch } from '@/store/store';

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
  // const [categories, setCategories] = useState<Category[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  // const [loading, setLoading] = useState(true);
  const categoriesPerPage = 10;
  const router = useRouter();


const dispatch = useDispatch<AppDispatch>();
const { categories, loading } = useSelector((state: RootState) => state.categories);

useEffect(() => {
  if (categories.length === 0) {
    dispatch(fetchCategories());
  }
}, [categories, dispatch]);
  // useEffect(() => {
  //   fetchCategories();
  // }, []);

  // const fetchCategories = async () => {
  //   try {
  //     setLoading(true);
  //     const response = await databases.listDocuments(
  //       process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
  //       process.env.NEXT_PUBLIC_APPWRITE_CATEGORY_COLLECTION_ID!
  //     );
  //     setCategories(response.documents as unknown as Category[]);
  //   } catch (error) {
  //     console.error('Error fetching categories:', error);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

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
      <div className="min-h-screen bg-dark-200 flex items-center justify-center">
        <div className="relative inline-flex">
          <div className="w-12 h-12 bg-primary rounded-full opacity-75 animate-ping"></div>
          <div className="w-12 h-12 bg-primary rounded-full absolute inset-0 animate-pulse"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-dark-200 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl mb-8 text-primary font-bold ">Categories</h1>
          <Link
            href="/dashboard/categories/new"
            className="bg-black flex gap-2 text-white px-4  py-2 rounded hover:text-black hover:bg-gray-300"
          >
            <Plus className="w-5 h-5" />
            Add Category
          </Link>
        </div>

        <div className="bg-dark-100 rounded-lg  overflow-hidden  ">
          <div className=" divide-gray-700">
         
            <div className="grid grid-cols-3 gap-4 bg-dark-100 shadow-lg">
              {currentCategories.map((category) => (
                <Card key={category.$id} className="hover:bg-dark-200/50 transition-colors w-100 h-90">
                  <CardContent className="p-0 m-0 whitespace-nowrap">
                    {category.image ? (
                      <div className="relative mb-2 w-100 h-60 rounded  bg-transparent">
                        <Image
                          src={getFilePreview( category.image)}
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
                
                  <p className="py-2 capitalize px-4 whitespace-nowrap text-lg font-medium text-black">
                    {category.name}
                  </p>
                  <p className=" capitalize px-4 whitespace-nowrap text-sm font-medium text-black">
                    {category.sub_text}
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
                    <div className="flex items-centerjustify-end gap-4">
                      <Link
                        href={`/dashboard/categories/edit/${category.$id}`}
                        className="text-primary hover:text-primary/80  py-2 px-6 shadow-sm border-2 rounded  transition-colors"
                      >
                        <Pencil className="w-5 h-5" />
                      </Link>
                      <Button
                        onClick={() => setDeleteId(category.$id)}
                        className=" py-2 px-6 bg-red-500 rounded   text-white hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </Button>
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