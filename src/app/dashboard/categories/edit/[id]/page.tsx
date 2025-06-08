'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { databases } from '@/lib/appwrite';
import { Query } from 'appwrite';
import CategoryForm from '@/components/category/CategoryForm';
import { toast } from 'react-toastify';

interface Category {
  $id: string;
  name: string;
  description: string;
  image?: string;
}

export default function EditCategoryPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategory();
  }, [params.id]);

  const fetchCategory = async () => {
    try {
      const response = await databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_CATEGORY_COLLECTION_ID!,
        [Query.equal('$id', params.id)]
      );

      if (response.documents.length > 0) {
        const doc = response.documents[0];
        setCategory({
          $id: doc.$id,
          name: doc.name,
          description: doc.description,
          image: doc.image
        });
      } else {
        toast.error('Category not found');
        router.push('/dashboard/categories');
      }
    } catch (error) {
      console.error('Error fetching category:', error);
      toast.error('Failed to load category');
      router.push('/dashboard/categories');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: Category) => {
    try {
      await databases.updateDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_CATEGORY_COLLECTION_ID!,
        params.id,
        {
          name: data.name,
          description: data.description,
          image: data.image
        }
      );

      toast.success('Category updated successfully');
      router.push('/dashboard/categories');
    } catch (error) {
      console.error('Error updating category:', error);
      toast.error('Failed to update category');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Edit Category</h1>
      <CategoryForm
        initialData={category}
        onSubmit={handleSubmit}
        onCancel={() => router.push('/dashboard/categories')}
      />
    </div>
  );
} 