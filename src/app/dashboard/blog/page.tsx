'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { toast } from 'react-toastify';
import { FileText, Plus, MoreVertical, Pencil, Trash2, Eye } from 'lucide-react';
import { format } from 'date-fns';
import Image from 'next/image';

interface Blog {
  $id: string;
  title: string;
  summary: string;
  imageUrl?: string;
  content: string;
  $createdAt: string;
}

export default function BlogsPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      // Create dummy blog data for UI demonstration
      const dummyBlogs: Blog[] = [
        {
          $id: '1',
          title: 'Getting Started with Your New Product',
          summary: 'A comprehensive guide to using your new purchase effectively.',
          content: '<p>This is a sample blog post content.</p>',
          imageUrl: '/placeholder.jpg',
          $createdAt: new Date().toISOString(),
        },
        {
          $id: '2',
          title: 'Summer Collection 2025',
          summary: 'Explore our latest collection designed for the summer season.',
          content: '<p>This is a sample blog post content.</p>',
          imageUrl: '/placeholder.jpg',
          $createdAt: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          $id: '3',
          title: 'Care Tips for Long-lasting Products',
          summary: 'Learn how to maintain your products to ensure they last longer.',
          content: '<p>This is a sample blog post content.</p>',
          imageUrl: '/placeholder.jpg',
          $createdAt: new Date(Date.now() - 172800000).toISOString(),
        },
      ];
      
      setBlogs(dummyBlogs);
    } catch (error) {
      console.error('Error fetching blogs:', error);
      toast.error('Failed to load blogs');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this blog?')) {
      try {
        // Simulate deletion by filtering out the blog
        setBlogs(blogs.filter(blog => blog.$id !== id));
        toast.success('Blog deleted successfully');
      } catch (error) {
        console.error('Error deleting blog:', error);
        toast.error('Failed to delete blog');
      }
    }
  };

  const filteredBlogs = blogs.filter(blog => 
    blog.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    blog.summary.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Blog Management</h1>
        <Button onClick={() => router.push('/dashboard/blog/add')} className="flex items-center gap-2">
          <Plus size={18} /> Add New Blog
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">All Blogs</CardTitle>
          <CardDescription>Manage your blog posts from here</CardDescription>
          
          <div className="mt-4">
            <Input
              placeholder="Search blogs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
          </div>
        </CardHeader>
        
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                {filteredBlogs.slice(0, 3).map((blog) => (
                  <Card key={blog.$id} className="overflow-hidden h-full flex flex-col">
                    <div className="relative h-48 w-full">
                      {blog.imageUrl ? (
                        <Image 
                          src={blog.imageUrl} 
                          alt={blog.title}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="bg-muted h-full w-full flex items-center justify-center">
                          <FileText size={40} className="text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg line-clamp-1">{blog.title}</CardTitle>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => router.push(`/dashboard/blog/edit/${blog.$id}`)}>
                              <Pencil className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push(`/dashboard/blog/view/${blog.$id}`)}>
                              <Eye className="mr-2 h-4 w-4" /> View
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDelete(blog.$id)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <CardDescription className="text-xs">
                        {format(new Date(blog.$createdAt), 'MMM dd, yyyy')}
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="pb-2 flex-grow">
                      <p className="text-sm line-clamp-3">{blog.summary}</p>
                    </CardContent>
                    
                    <CardFooter>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={() => router.push(`/dashboard/blog/edit/${blog.$id}`)}
                      >
                        Edit Blog
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Created Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBlogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-10">
                        No blogs found. Create your first blog post!
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredBlogs.map((blog) => (
                      <TableRow key={blog.$id}>
                        <TableCell className="font-medium">{blog.title}</TableCell>
                        <TableCell>{format(new Date(blog.$createdAt), 'MMM dd, yyyy')}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => router.push(`/dashboard/blog/view/${blog.$id}`)}
                            >
                              <Eye size={16} />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => router.push(`/dashboard/blog/edit/${blog.$id}`)}
                            >
                              <Pencil size={16} />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleDelete(blog.$id)}
                            >
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
