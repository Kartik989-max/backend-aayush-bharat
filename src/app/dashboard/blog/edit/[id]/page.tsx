'use client';

import BlogForm from '@/components/blog/BlogForm';

// Update to handle params as a Promise, similar to the blog/[slug] page
export default async function EditBlogPage(props: { params: Promise<{ id: string }> }) {
  // Await the params Promise
  const params = await props.params;
  return <BlogForm id={params.id} />;
}
