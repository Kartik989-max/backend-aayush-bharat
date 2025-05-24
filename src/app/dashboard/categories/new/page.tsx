'use client';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import CategoryForm from '@/components/category/CategoryForm';
import Link from 'next/link';
import { databases, ID } from '@/lib/appwrite';

export default function NewCategory() {
  const router = useRouter();

  const handleSubmit = async (data: any) => {
    try {
      await databases.createDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_CATEGORY_COLLECTION_ID!,
        ID.unique(),
        data
      );
      router.push('/dashboard/categories');
    } catch (error) {
      console.error('Error creating category:', error);
    }
  };

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
          <h1 className="text-3xl font-bold text-primary">New Category</h1>
        </div>

        <CategoryForm
          onSubmit={handleSubmit}
          onCancel={() => router.push('/dashboard/categories')}
        />
      </div>
    </div>
  );
} 