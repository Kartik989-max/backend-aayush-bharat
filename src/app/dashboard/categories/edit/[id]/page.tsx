'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { databases } from '@/lib/appwrite';
import { ArrowLeft } from 'lucide-react';
import CategoryForm from '@/components/category/CategoryForm';
import Link from 'next/link';
import { use } from 'react';

export default function EditCategory({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [category, setCategory] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchCategory();
  }, [resolvedParams.id]);

  const fetchCategory = async () => {
    try {
      const response = await databases.getDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_CATEGORY_COLLECTION_ID!,
        resolvedParams.id
      );
      setCategory(response);
    } catch (error) {
      console.error('Error fetching category:', error);
      setError('Failed to load category');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: any) => {
    try {
      await databases.updateDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_CATEGORY_COLLECTION_ID!,
        resolvedParams.id,
        data
      );
      router.push('/dashboard/categories');
    } catch (error) {
      console.error('Error updating category:', error);
      setError('Failed to update category');
    }
  };

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

  if (error) {
    return (
      <div className="min-h-screen bg-dark-200 flex items-center justify-center">
        <div className="text-red-500 text-center">
          <p className="text-xl mb-4">{error}</p>
          <Link href="/dashboard/categories" className="text-primary hover:underline">
            Return to Categories
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-200 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/dashboard/categories"
            className="text-light-100 hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-3xl font-bold text-primary">Edit Category</h1>
        </div>

        <CategoryForm
          initialData={category}
          onSubmit={handleSubmit}
          onCancel={() => router.push('/dashboard/categories')}
        />
      </div>
    </div>
  );
} 