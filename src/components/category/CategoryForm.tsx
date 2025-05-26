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
interface CategoryFormProps {
  onSubmit: (data: any) => void;
  initialData?: any;
  onCancel: () => void;
}

const CategoryForm = ({ onSubmit, initialData, onCancel }: CategoryFormProps) => {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    sub_text: initialData?.sub_text || '',
    description: initialData?.description || '',
    image: initialData?.image || ''
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialData?.image || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionStatus, setCompressionStatus] = useState('');
  const [isMediaManagerOpen,setIsMediaManagerOpen]=useState(false);
  useEffect(() => {
    // Create preview URL for selected file
    if (selectedFile) {
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [selectedFile]);

  const handleImageUpload = async (file: File) => {
    try {
      setIsCompressing(true);
      setCompressionStatus('Compressing image...');
      
      // Compress image before upload
      const compressedFile = await compressImage(file);
      console.log('Original size:', file.size / 1024 / 1024, 'MB');
      console.log('Compressed size:', compressedFile.size / 1024 / 1024, 'MB');
      
      setCompressionStatus('Uploading image...');
      
      // Verify we have a valid File object
      if (!(compressedFile instanceof File)) {
        throw new Error('Compression failed: Invalid file format');
      }

      const uploadResult = await uploadFile(compressedFile);
      const fileUrl = getFilePreview(uploadResult.$id);
      
      setCompressionStatus('');
      return { fileId: uploadResult.$id, fileUrl };
    } catch (error: any) {
      console.error('Image upload failed:', error);
      setCompressionStatus('');
      throw new Error(error?.message || 'Failed to upload image');
    } finally {
      setIsCompressing(false);
    }
  };




  
const handleMediaSelect = (files: { fileId: string; url: string }[]) => {
  if (files && files.length > 0) {
    const file = files[0];
    setFormData((prev) => ({
      ...prev,
      image: file.fileId,
    }));
    setPreviewUrl(file.url);
  }
  setIsMediaManagerOpen(false);
};

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let imageUrl = formData.image;

      if (selectedFile) {
        const { fileUrl } = await handleImageUpload(selectedFile);
        imageUrl = fileUrl;
      }

      const categoryData = {
        name: formData.name,
        sub_text: formData.sub_text,
        description: formData.description,
        image: imageUrl,
      };

      // Call the parent's onSubmit with the category data
      onSubmit(categoryData);
    } catch (error: any) {
      console.error('Form submission failed:', error);
      setError(error?.message || 'Failed to save changes');
      setLoading(false); // Make sure we set loading to false on error
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-dark-100 p-6 rounded-lg">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      
      <div>
        <label className="block mb-2 text-light-100">Name</label>
        <Input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          className="w-full p-3 rounded-lg bg-dark-200 border text-light-100"
          required
        />
      </div>

      <div>
        <label className="block mb-2 text-light-100">Sub Text</label>
        <Input
          type="text"
          value={formData.sub_text}
          onChange={(e) => setFormData({...formData, sub_text: e.target.value})}
          className="w-full p-3 rounded-lg bg-dark-200 border text-light-100"
          required
        />
      </div>

      <div>
        <label className="block mb-2 text-light-100">Description</label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          className="w-full p-3 rounded-lg bg-dark-200 border text-light-100"
          rows={4}
          required
        />
      </div>

      <div>
        <label className="block mb-2 text-light-100">Category Image</label>
        {/* <Input
          type="file"
          accept="image/*"
          onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
          className="w-full p-3 rounded-lg bg-dark-200 border border-dark-100 text-light-100"
          disabled={isCompressing || loading}
        /> */}
  <button
                          type="button"
                          onClick={() => {
                            setIsMediaManagerOpen(true);
                          }}
                          className="w-24 h-24 border-2 border-dashed border-muted flex items-center justify-center rounded text-muted-foreground hover:bg-muted transition"
                        >
                          <Plus className="w-6 h-6" />
                        </button>


        {compressionStatus && (
          <div className="mt-2 text-primary flex items-center">
            <Spinner className="w-4 h-4 mr-2" />
            {compressionStatus}
          </div>
        )}
        {previewUrl && (
          <div className="mt-4 relative flex justify-start h-48  rounded-lg overflow-hidden bg-transparent">
            <Image
              src={(previewUrl)}
              alt="Preview"
              fill
              className="object-cover w-40 h-40"
              unoptimized
            />
               <Button
                    type="button"
                    onClick={(prev)=>{setFormData((prev) => ({
      ...prev,
      image: '',
    })); setPreviewUrl('')}}
                     className="absolute top-1 right-1 text-red-400 hover:text-red-600 p-1 bg-white rounded-full"
      title="Remove product"
                    
                  >
                    <Trash2/>
                  </Button>
          </div>
        )}
      </div>

      <div className="flex gap-4">
        <button 
          type="submit" 
          className="btn-dark bg-black text-white flex-1 flex items-center justify-center"
          disabled={loading || isCompressing}
        >
          {(loading || isCompressing) ? (
            <>
              <Spinner className="w-5 h-5 mr-2" />
              {isCompressing ? 'Processing Image...' : 'Saving Changes...'}
            </>
          ) : (
            'Save Changes'
          )}
        </button>
          
        <button 
          type="button" 
          onClick={onCancel}
          className="btn-secondary flex-1"
          disabled={loading || isCompressing}
        >
          Cancel
        </button>
      </div>

       {isMediaManagerOpen && (
              <MediaManager
                // isOpen={isMediaManagerOpen}
                onClose={() => setIsMediaManagerOpen(false)}
                onSelect={handleMediaSelect}
                allowMultiple={false}
                // allowMultiple={isSelectingAdditional || isSelectingVariantAdditional}
      
              />
            )}
    </form>
  );
};

export default CategoryForm;
