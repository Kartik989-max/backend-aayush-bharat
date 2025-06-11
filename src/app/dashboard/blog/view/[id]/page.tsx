'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Pencil } from 'lucide-react';
import { toast } from 'react-toastify';
import Image from 'next/image';
import { format } from 'date-fns';

interface Blog {
  $id: string;
  title: string;
  summary: string;
  content: string;
  imageUrl?: string;
  $createdAt: string;
}

export default function ViewBlogPage({ params }: { params: { id: string } }) {
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (params.id) {
      fetchBlog(params.id);
    }
  }, [params.id]);  const fetchBlog = async (id: string) => {
    try {
      setLoading(true);
      
      // Fetch the blog from the service
      try {
        const blog = await import('@/appwrite/blog').then(mod => mod.default.getBlog(id));
        if (blog) {
          setBlog({
            $id: blog.$id,
            title: blog.blog_heading,
            summary: blog.summary,
            content: blog.blog_data,
            imageUrl: blog.image ? `/api/files/${blog.image}` : undefined,
            $createdAt: blog.created_at || new Date().toISOString(),
          });
        }
        setLoading(false);
      } catch (error) {
        console.log('Error fetching from service, using fallback data', error);
        // Fallback for UI demonstration if service fetch fails
        setTimeout(() => {
          setBlog({
            $id: id,
            title: 'Getting Started with Your New Product',
            summary: 'A comprehensive guide to using your new purchase effectively.',
            content: `
              <p>This is a sample blog post content. In a real application, this would be the full content of the blog post that you're viewing.</p>
              <h2>Introduction</h2>
              <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum nec varius massa. Nulla facilisi. Duis vel neque euismod, aliquet nisi vel, tincidunt nisl.</p>
              <h2>Getting Started</h2>
              <p>Sed at consectetur urna. Nullam vitae magna euismod, convallis nibh id, mattis enim. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Duis vel neque euismod, aliquet nisi vel, tincidunt nisl.</p>
              <h2>Tips and Tricks</h2>
              <p>In hac habitasse platea dictumst. Donec facilisis tortor vel magna lacinia, vel dictum velit vehicula. Donec non turpis et neque mattis scelerisque vel et sapien. Aenean lacinia dolor in dolor congue, vel congue velit mattis.</p>
              <h2>Conclusion</h2>
              <p>Cras mattis fermentum tortor at sollicitudin. Maecenas ultrices, massa et sollicitudin tincidunt, libero mi vestibulum elit, vitae commodo lacus augue at magna.</p>
            `,
            imageUrl: '/placeholder.jpg',
            $createdAt: new Date().toISOString(),
          });
          setLoading(false);
        }, 1000);
      }
      
    } catch (error) {
      console.error('Error fetching blog:', error);
      toast.error('Failed to load blog');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[80vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.push('/dashboard/blog')}>
            <ArrowLeft size={18} />
          </Button>
          <h1 className="text-3xl font-bold">Blog Not Found</h1>
        </div>
        
        <Card>
          <CardContent className="p-10 text-center">
            <p>The blog post you're looking for doesn't exist or has been deleted.</p>
            <Button 
              onClick={() => router.push('/dashboard/blog')} 
              className="mt-4"
            >
              Return to Blogs
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4 justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.push('/dashboard/blog')}>
            <ArrowLeft size={18} />
          </Button>
          <h1 className="text-3xl font-bold">View Blog</h1>
        </div>
        
        <Button 
          onClick={() => router.push(`/dashboard/blog/edit/${blog.$id}`)}
          className="flex items-center gap-2"
        >
          <Pencil size={18} /> Edit Blog
        </Button>
      </div>

      <Card>        <CardHeader className="space-y-4">
          <CardTitle className="text-3xl">{blog.title}</CardTitle>
          <div className="text-sm text-muted-foreground">
            Created on {format(new Date(blog.$createdAt), 'MMMM dd, yyyy')}
          </div>
          
          {blog.imageUrl && (
            <div className="relative h-[400px] w-full rounded-md overflow-hidden mt-4">
              <Image 
                src={blog.imageUrl} 
                alt={blog.title}
                fill
                className="object-cover"
              />
            </div>
          )}
        </CardHeader>
        
        <CardContent className="prose dark:prose-invert max-w-none">
          <p className="text-lg font-medium italic mb-8">{blog.summary}</p>
          
          <div dangerouslySetInnerHTML={{ __html: blog.content }} />
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => router.push('/dashboard/blog')}>
            Back to Blogs
          </Button>
          
          <Button 
            onClick={() => router.push(`/dashboard/blog/edit/${blog.$id}`)}
            className="flex items-center gap-2"
          >
            <Pencil size={18} /> Edit Blog
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
