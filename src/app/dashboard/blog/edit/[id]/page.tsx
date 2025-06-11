'use client';

import BlogForm from '@/components/blog/BlogForm';

export default function EditBlogPage({ params }: { params: { id: string } }) {
  return <BlogForm id={params.id} />;
}
