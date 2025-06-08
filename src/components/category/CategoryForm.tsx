'use client';
import { useState, useEffect } from 'react';
import { createDocument, uploadFile, getFilePreview, databases, ID } from '@/lib/appwrite';
import Image from 'next/image';
import { compressImage } from '@/lib/imageCompression';
import { Spinner } from '@/components/ui/Spinner';
import { Textarea } from '../ui/textarea';
import { Input } from '../ui/input';
import { Plus, Trash2 } from 'lucide-react';
import { MediaManager } from '../media/MediaManager';
import { X } from 'lucide-react';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { Dialog } from '../ui/dialog';
import { toast } from 'react-toastify';
import { Label } from '../ui/label';
import { Card, CardContent } from '../ui/card';
import { AlertCircle } from 'lucide-react';

interface Category {
  $id: string;
  name: string;
  description: string;
  image?: string;
}

interface CategoryFormProps {
  initialData?: Category | null;
  onSubmit: (data: Category) => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function CategoryForm({ initialData, onSubmit, onCancel, loading = false }: CategoryFormProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
    image: initialData?.image || ''
  });

  const [error, setError] = useState<string | null>(null);
  const [showMediaManager, setShowMediaManager] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleMediaSelect = async (files: { fileId: string; url: string }[]) => {
    if (files.length === 0) return;
    
    try {
      const file = files[0]; // We only need one image for category
      setFormData(prev => ({
        ...prev,
        image: file.url
      }));
    } catch (error) {
      console.error('Error saving image:', error);
      toast.error('Failed to save image');
    }
    
    setShowMediaManager(false);
  };

  const handleRemoveImage = () => {
    setFormData(prev => ({
      ...prev,
      image: ''
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const categoryData = {
        name: formData.name,
        description: formData.description,
        image: formData.image
      };

      let categoryId: string;
      
      if (initialData?.$id) {
        // Update existing category
        await databases.updateDocument(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
          process.env.NEXT_PUBLIC_APPWRITE_CATEGORY_COLLECTION_ID!,
          initialData.$id,
          categoryData
        );
        categoryId = initialData.$id;
      } else {
        // Create new category
        const result = await createDocument(
          process.env.NEXT_PUBLIC_APPWRITE_CATEGORY_COLLECTION_ID!,
          categoryData
        );
        categoryId = result.$id;
      }

      // Convert to Category type for the callback
      const category: Category = {
        $id: categoryId,
        name: categoryData.name,
        description: categoryData.description,
        image: categoryData.image
      };

      onSubmit(category);
    } catch (error: any) {
      console.error('Form submission failed:', error);
      setError(error?.message || 'Failed to save category');
      toast.error('Failed to save category');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">Category Name</Label>
        <Input
          id="name"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          required
          disabled={loading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          rows={4}
          required
          disabled={loading}
        />
      </div>

      <Dialog
        open={showMediaManager}
        onClose={() => setShowMediaManager(false)}
        title="Select Image"
      >
        <div 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              e.stopPropagation();
            }
          }}
        >
          <MediaManager
            onSelect={handleMediaSelect}
            onClose={() => setShowMediaManager(false)}
            allowMultiple={false}
            open={showMediaManager}
          />
        </div>
      </Dialog>

      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Category Image</h3>
          <div className="grid grid-cols-1 gap-4">
            {formData.image ? (
              <div className="relative aspect-video">
                <img
                  src={formData.image}
                  alt="Category"
                  className="w-full h-full object-cover rounded-md"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute -top-2 -right-2 h-6 w-6"
                  onClick={handleRemoveImage}
                  disabled={loading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowMediaManager(true)}
                  className="w-full"
                  disabled={loading}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Image
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button 
          type="submit" 
          className="flex-1"
          disabled={loading}
        >
          {loading ? 'Saving...' : initialData ? 'Update Category' : 'Create Category'}
        </Button>
        <Button 
          type="button" 
          variant="outline"
          onClick={onCancel}
          className="flex-1"
          disabled={loading}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
