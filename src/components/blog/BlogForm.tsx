'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { MediaManager } from '@/components/media/MediaManager';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save, ImageIcon } from 'lucide-react';
import { toast } from 'react-toastify';
import { getFilePreview } from '@/lib/appwrite';
import dynamic from 'next/dynamic';
import blogService from '@/appwrite/blog';

// Dynamically import the editor to prevent SSR issues
const RichTextEditor = dynamic(() => import('@/components/blog/RichTextEditor'), {
  ssr: false,
  loading: () => (
    <div className="border rounded p-4 min-h-[300px] bg-muted flex items-center justify-center">
      <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
    </div>
  ),
});

interface BlogFormProps {
  id?: string;
}

export default function BlogForm({ id }: BlogFormProps) {
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [selectedMedia, setSelectedMedia] = useState<{ fileId: string; url: string; mimeType?: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showMediaManager, setShowMediaManager] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (id) {
      setIsEditing(true);
      fetchBlog(id);
    }
  }, [id]);

  const fetchBlog = async (blogId: string) => {
    try {
      setLoading(true);
      const blog = await blogService.getBlog(blogId);
      
      if (blog) {
        setTitle(blog.blog_heading || '');
        setSummary(blog.summary || '');
        setContent(blog.blog_data || '');
        
        if (blog.image) {
          setSelectedMedia([{ 
            fileId: blog.image, 
            url: getFilePreview(blog.image)
          }]);
        }
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching blog:', error);
      toast.error('Failed to load blog');
      setLoading(false);
    }
  };  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !summary || !content) {
      toast.error('Please fill all required fields');
      return;
    }
    
    try {
      setLoading(true);
      
      // Get the image ID from the selected media
      const imageId = selectedMedia.length > 0 ? selectedMedia[0].fileId : undefined;
      
      if (isEditing && id) {
        await blogService.updateBlog(id, title, summary, content, imageId);
        toast.success('Blog updated successfully');
      } else {
        await blogService.createBlog(title, summary, content, imageId);
        toast.success('Blog created successfully');
      }
      
      router.push('/dashboard/blog');
    } catch (error: any) {
      console.error('Error saving blog:', error);
      toast.error(error?.message || 'Failed to save blog');
    } finally {
      setLoading(false);
    }
  };

  const handleMediaSelect = (files: { fileId: string; url: string; mimeType?: string }[]) => {
    setSelectedMedia(files);
  };

  if (loading && isEditing) {
    return (
      <div className="flex justify-center items-center h-[80vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.push('/dashboard/blog')}>
          <ArrowLeft size={18} />
        </Button>
        <h1 className="text-3xl font-bold">{isEditing ? 'Edit Blog' : 'Create New Blog'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Blog Details</CardTitle>
                <CardDescription>Enter the basic information about your blog post</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter blog title"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="summary">Summary</Label>
                  <Textarea
                    id="summary"
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    placeholder="Enter a brief summary of your blog"
                    required
                  />
                  <p className="text-sm text-muted-foreground">
                    This will be displayed in blog cards and listings
                  </p>
                </div>
              </CardContent>
            </Card>            <Card>
              <CardHeader>
                <CardTitle>Blog Content</CardTitle>
                <CardDescription>Write your blog content here</CardDescription>
              </CardHeader>
              <CardContent>
                <RichTextEditor content={content} onChange={setContent} />
                <p className="text-sm text-muted-foreground mt-2">
                  Use the toolbar above to format your content. Your changes will be saved as HTML.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Featured Image</CardTitle>
                <CardDescription>Select an image for your blog</CardDescription>
              </CardHeader>              <CardContent>
                <Button 
                  variant="outline" 
                  className="w-full h-[200px] flex flex-col items-center justify-center border-dashed"
                  onClick={() => setShowMediaManager(true)}
                >
                  {selectedMedia.length > 0 ? (
                    <div className="relative w-full h-full">
                      <Image 
                        src={selectedMedia[0].url} 
                        alt="Selected image" 
                        fill 
                        className="object-contain"
                      />
                    </div>
                  ) : (
                    <>
                      <ImageIcon size={40} className="mb-2 text-muted-foreground" />
                      <span>Select Image</span>
                    </>
                  )}
                </Button>
                
                <MediaManager 
                  open={showMediaManager}
                  onClose={() => setShowMediaManager(false)}
                  onSelect={handleMediaSelect}
                  allowMultiple={false}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Publishing</CardTitle>
                <CardDescription>Publish your blog post</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Once published, your blog will be visible to all users on your website.
                </p>
              </CardContent>
              <CardFooter>
                <Button 
                  type="submit" 
                  className="w-full flex items-center gap-2"
                  disabled={loading}
                >
                  {loading && <div className="animate-spin h-4 w-4 border-2 border-b-0 border-r-0 rounded-full" />}
                  <Save size={18} />
                  {isEditing ? 'Update Blog' : 'Publish Blog'}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
