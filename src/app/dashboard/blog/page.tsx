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
import { BlogService, Blog } from '@/appwrite/blog';
import { config } from '@/config/config';
import getFilePreview from '@/lib/getFilePreview';

export default function BlogsPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetchBlogs();
  }, []);  const blogService = new BlogService();
  
  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const blogs = await blogService.getBlogs();
      setBlogs(blogs);
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
        await blogService.deleteBlog(id);
        setBlogs(blogs.filter(blog => blog.$id !== id));
        toast.success('Blog deleted successfully');
      } catch (error) {
        console.error('Error deleting blog:', error);
        toast.error('Failed to delete blog');
      }
    }
  };

  const filteredBlogs = blogs.filter(blog => 
    blog.blog_heading.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
                    <div className="relative h-48 w-full">                      {blog.image ? (                        <Image 
                          src={getFilePreview(blog.image)}
                          alt={blog.blog_heading}
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
                        <CardTitle className="text-lg line-clamp-1">{blog.blog_heading}</CardTitle>
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
                        <TableCell className="font-medium">{blog.blog_heading}</TableCell>
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
