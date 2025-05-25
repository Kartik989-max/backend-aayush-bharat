'use client';
import { useState, useEffect } from 'react';
import { storage, uploadFile, getFilePreview, databases } from '@/lib/appwrite';
import { ID } from 'appwrite';
import Image from 'next/image';
import { compressImage } from '@/lib/imageCompression';
import { Spinner } from '@/components/ui/Spinner'; // Create this component if not exists
import { Input } from '../ui/input';
import { MediaManager } from '@/components/media/MediaManager';
import { Button } from '../ui/button';
import { Plus } from 'lucide-react';
interface HeroFormProps {
  onSubmit: (data: any) => void;
  initialData?: any;
  onCancel: () => void;
}
interface heroForm{
  videourl:string;
  mobile_image:string;
  heroHeading:string;
  heroSubHeading:string;
  $id:string;
  slug:string;
}

const HeroForm = ({ onSubmit, initialData, onCancel }: HeroFormProps) => {
  const [formData, setFormData] = useState<heroForm>({
    videourl: initialData?.videourl || '',
    mobile_image: initialData?.mobile_image || '',
    heroHeading: initialData?.heroHeading || "", 
    heroSubHeading: initialData?.heroSubHeading || "", 
    $id: initialData?.$id || null,
    slug:initialData?.slug || ""
  });
  const [selectedPCFile, setSelectedPCFile] = useState<File | null>(null);
  const [selectedMobileFile, setSelectedMobileFile] = useState<File | null>(null);
  const [previewPCUrl, setPreviewPCUrl] = useState<string | null>(initialData?.pc_image || null);
  const [previewMobileUrl, setPreviewMobileUrl] = useState<string | null>(initialData?.mobile_image || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionStatus, setCompressionStatus] = useState('');
  const [showMediaManager, setShowMediaManager] = useState<string | boolean>(false);

  useEffect(() => {
    if (selectedPCFile) {
      const url = URL.createObjectURL(selectedPCFile);
      setPreviewPCUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [selectedPCFile]);

  useEffect(() => {
    if (selectedMobileFile) {
      const url = URL.createObjectURL(selectedMobileFile);
      setPreviewMobileUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [selectedMobileFile]);

  const handleImageUpload = async (file: File) => {
    try {
      setIsCompressing(true);
      setCompressionStatus('Compressing image...');
      
      const compressedFile = await compressImage(file);
      console.log('Original size:', file.size / 1024 / 1024, 'MB');
      console.log('Compressed size:', compressedFile.size / 1024 / 1024, 'MB');
      
      setCompressionStatus('Uploading image...');
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

  const handlePCImageSelect = (fileId: string, url: string) => {
    setFormData({ ...formData, videourl: url });
    setPreviewPCUrl(url);
    setShowMediaManager(false);
  };

  const handleMobileImageSelect = (fileId: string, url: string) => {
    setFormData({ ...formData, mobile_image: url });
    setPreviewMobileUrl(url);
    setShowMediaManager(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let videourl = formData.videourl;
      let mobileImageUrl = formData.mobile_image;

      if (selectedPCFile) {
        const { fileUrl } = await handleImageUpload(selectedPCFile);
        videourl = fileUrl;
      }
      if (selectedMobileFile) {
        const { fileUrl } = await handleImageUpload(selectedMobileFile);
        mobileImageUrl = fileUrl;
      }
      
      const heroData = {
        heroHeading: formData.heroHeading,
        heroSubHeading: formData.heroSubHeading,
        videourl: videourl,
        mobile_image: mobileImageUrl,
        slug:formData.slug,
      };

      const response = await databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_HERO_COLLECTION_ID!
      );

      // const existingHeroes = response.documents;
      // const conflictingHero = existingHeroes.find(
      //   hero => hero.position === formData.position && hero.$id !== formData.$id
      // );

      if (formData.$id) {
        // Updating existing hero
        await databases.updateDocument(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
          process.env.NEXT_PUBLIC_APPWRITE_HERO_COLLECTION_ID!,
          formData.$id,
          heroData
        );

        // If there's a position conflict, update the conflicting hero's position
        // if (conflictingHero) {
        //   const oldPosition = initialData?.position || 0;
        //   await databases.updateDocument(
        //     process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        //     process.env.NEXT_PUBLIC_APPWRITE_HERO_COLLECTION_ID!,
        //     conflictingHero.$id,
        //     { position: oldPosition }
        //   );
        // }
      }      

      onSubmit(heroData);
    } catch (error: any) {
      console.error('Form submission failed:', error);
      setError(error?.message || 'Failed to save changes');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-dark-100 p-6 rounded-lg">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          <span className="block sm:inline">{error}</span>
        </div>
      )}      <div>
        <label className="block mb-2 text-light-100">Hero Heading</label>
        <div className="flex items-center">
        
          <Input
            type="text"
            value={formData.heroHeading}
            onChange={(e) => setFormData({...formData, heroHeading: e.target.value})}
            placeholder="e.g. shop, about, contact"
            className="w-full p-3 rounded-r-lg bg-dark-200 border border-black text-light-100"
          />
        </div>
      </div>

      <div>
        <label className="block mb-2 text-light-100">Hero Subheading</label>
        <div className="flex items-center">
          <Input
            type="text"
            
            value={formData.heroSubHeading}
            onChange={(e) => setFormData({...formData, heroSubHeading: (e.target.value) || ""})}
            className="w-full p-3 rounded-lg bg-dark-200 border border-black text-light-100"
          />
        </div>
      </div>

{/* 
      <div>
        <label className="block mb-2 text-light-100">Subheading</label>
        <div className="flex items-center">
          <input
            type="text"
            
            value={formData.heroSubHeading}
            onChange={(e) => setFormData({...formData, heroSubHeading: (e.target.value) || ""})}
            className="w-full p-3 rounded-lg bg-dark-200 border border-dark-100 text-light-100"
          />
        </div>
        <p className="text-sm text-light-100/50 mt-1">Enter the hero subheading</p>
      </div> */}

      <div>
        <label className="block mb-2 text-light-100">Video</label>
        <div className="flex gap-4">
          {/* <Button
            type="button"
            onClick={() => setShowMediaManager('pc')}
            className="btn-secondary"
            disabled={isCompressing || loading}
          >
            Choose from Media
          </Button> */}

          <Button type="button" onClick={() => setShowMediaManager('pc')}
  className="w-24 h-24 border-2 border-dashed border-muted flex 
  items-center justify-center rounded text-muted-foreground
   hover:bg-muted transition mb-4">
        <Plus className="w-6 h-6" />
                </Button>
          {/* <input
            type="file"
            accept="image/*"
            onChange={(e) => setSelectedPCFile(e.target.files?.[0] || null)}
            className="w-full p-3 rounded-lg bg-dark-200 border border-dark-100 text-light-100"
            disabled={isCompressing || loading}
          /> */}
        </div>
        {previewPCUrl && (
          <div className="mt-4 relative h-50  rounded-lg overflow-hidden">
            <Image
              src={previewPCUrl}
              alt="PC Preview"
              
              className="object-cover"
              width={500} height={500}
            />
          </div>
        )}
      </div>

      <div>
        <label className="block mb-2 text-light-100">Mobile Image</label>
        <div className="flex gap-4">
          {/* <Bs */}
          {/* <input
            type="file"
            accept="image/*"
            onChange={(e) => setSelectedMobileFile(e.target.files?.[0] || null)}
            className="w-full p-3 rounded-lg bg-dark-200 border border-dark-100 text-light-100"
            disabled={isCompressing || loading}
          /> */}
          <Button type="button" onClick={() => setShowMediaManager('mobile')}
  className="w-24 h-24 border-2 border-dashed border-muted flex 
  items-center justify-center rounded text-muted-foreground
   hover:bg-muted transition mb-4">
        <Plus className="w-6 h-6" />
                </Button>
        </div>
        {previewMobileUrl && (
          <div className="mt-4 relative h-50 rounded-lg overflow-hidden">
            <Image
              src={previewMobileUrl}
              alt="Mobile Preview"
              width={500} height={500}
              className="object-cover"
            />
          </div>
        )}
      </div>

      {showMediaManager === 'pc' && (
        <MediaManager
          onSelect={handlePCImageSelect}
          onClose={() => setShowMediaManager(false)}
        />
      )}
      {showMediaManager === 'mobile' && (
        <MediaManager
          onSelect={handleMobileImageSelect}
          onClose={() => setShowMediaManager(false)}
        />
      )}

      <div className="flex gap-4">
        <Button 
          type="submit" 
          variant='secondary'
          className="flex-1 border flex items-center justify-center"
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
        </Button>
        <Button 
        variant='destructive'
          type="button" 
          onClick={onCancel}
          className="btn-secondary flex-1"
          disabled={loading || isCompressing}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
};

export default HeroForm;
