'use client';
import { useState } from 'react';
import Image from 'next/image';
import { Input } from '../ui/input';
import { MediaManager } from '@/components/media/MediaManager';
import { Button } from '../ui/button';
import { Plus, Loader2 } from 'lucide-react';
import { Hero } from '@/services/HeroService';
interface HeroFormProps {
  onSubmit: (data: Hero) => void;
  initialData?: Hero;
  onCancel: () => void;
}

const HeroForm = ({ onSubmit, initialData, onCancel }: HeroFormProps) => {
  const [formData, setFormData] = useState<Hero>({
    heading: initialData?.heading || '',
    sub_text: initialData?.sub_text || '',
    image: initialData?.image || '',
    video: initialData?.video || '',
    mobile_image: initialData?.mobile_image || '',
    button1: initialData?.button1 || '',
    button1_slug: initialData?.button1_slug || '',
    button2: initialData?.button2 || '',
    button2_slug: initialData?.button2_slug || '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMediaManager, setShowMediaManager] = useState<'main' | 'mobile' | false>(false);
  const [mediaType, setMediaType] = useState<'image' | 'video'>(
    initialData?.video ? 'video' : 'image'
  );  const handleMediaSelect = (files: { fileId: string; url: string; mimeType?: string }[]) => {
    const file = files[0];
    const fileUrl = file.url;
    
    if (showMediaManager === 'main') {
      // Detect if the file is a video based on mime type or file extension
      const isVideo = file.mimeType?.startsWith('video/') || fileUrl.match(/\.(mp4|webm|mov)$/i);
      
      if (isVideo) {
        setFormData({ ...formData, video: fileUrl, image: '' });
      } else {
        setFormData({ ...formData, image: fileUrl, video: '' });
      }
    } else if (showMediaManager === 'mobile') {
      setFormData({ ...formData, mobile_image: fileUrl });
    }
    setShowMediaManager(false);
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate required fields
      if (!formData.heading || !formData.sub_text || !formData.button1 || !formData.button1_slug) {
        throw new Error('Please fill in all required fields');
      }

      if (!formData.image && !formData.video) {
        throw new Error('Please upload either an image or video for the hero section');
      }

      await onSubmit(formData);
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
      )}      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block mb-2 text-light-100">Heading*</label>
          <Input
            type="text"
            value={formData.heading}
            onChange={(e) => setFormData({...formData, heading: e.target.value})}
            placeholder="Enter hero heading"
            className="w-full p-3 rounded-lg bg-dark-200 border border-black text-light-100"
            required
          />
        </div>

        <div>
          <label className="block mb-2 text-light-100">Sub Text*</label>
          <Input
            type="text"
            value={formData.sub_text}
            onChange={(e) => setFormData({...formData, sub_text: e.target.value})}
            placeholder="Enter subtext"
            className="w-full p-3 rounded-lg bg-dark-200 border border-black text-light-100"
            required
          />
        </div>
      </div>      <div>
        <label className="block mb-2 text-light-100">Main Media* (Image or Video)</label>
        <div className="flex flex-col gap-4">
          <Button
            type="button"
            onClick={() => setShowMediaManager('main')}
            className="w-full h-32 border-2 border-dashed border-muted/50 flex flex-col items-center justify-center rounded-lg hover:bg-muted/10 transition-all group"
          >
            <Plus className="w-8 h-8 mb-2 text-muted-foreground group-hover:text-primary transition-colors" />
            <span className="text-sm text-muted-foreground group-hover:text-primary transition-colors">
              Click to upload media (Image or Video)
            </span>
          </Button>
        </div>
          {formData.video && (
          <div className="relative h-48 w-full rounded-lg overflow-hidden mb-4 shadow-lg transition-all duration-300 ease-in-out opacity-0 animate-fade-in">
            <video 
              src={formData.video} 
              className="w-full h-full object-cover" 
              autoPlay 
              muted 
              loop 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          </div>
        )}
        {formData.image && (
          <div className="relative h-48 w-full rounded-lg overflow-hidden mb-4 shadow-lg transition-all duration-300 ease-in-out opacity-0 animate-fade-in">
            <Image 
              src={formData.image} 
              alt="Hero image" 
              fill 
              className="object-cover transition-transform duration-300 hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          </div>
        )}
      </div>      <div>
        <label className="block mb-2 text-light-100">Mobile Image (Optional)</label>
        <div className="flex flex-col gap-4">
          <Button
            type="button"
            onClick={() => setShowMediaManager('mobile')}
            className="w-48 h-64 border-2 border-dashed border-muted/50 flex flex-col items-center justify-center rounded-lg hover:bg-muted/10 transition-all group"
          >
            <Plus className="w-8 h-8 mb-2 text-muted-foreground group-hover:text-primary transition-colors" />
            <span className="text-sm text-center text-muted-foreground group-hover:text-primary transition-colors">
              Click to upload<br />mobile image
            </span>
          </Button>
          {formData.mobile_image && (
            <div className="relative w-48 h-64 rounded-lg overflow-hidden shadow-lg transition-all duration-300 ease-in-out opacity-0 animate-fade-in">
              <Image 
                src={formData.mobile_image} 
                alt="Mobile preview" 
                fill 
                className="object-cover transition-transform duration-300 hover:scale-105" 
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block mb-2 text-light-100">Button 1 Text*</label>
          <Input
            type="text"
            value={formData.button1}
            onChange={(e) => setFormData({...formData, button1: e.target.value})}
            placeholder="Enter button text"
            className="w-full p-3 rounded-lg bg-dark-200 border border-black text-light-100"
            required
          />
        </div>
        <div>
          <label className="block mb-2 text-light-100">Button 1 Link*</label>
          <Input
            type="text"
            value={formData.button1_slug}
            onChange={(e) => setFormData({...formData, button1_slug: e.target.value})}
            placeholder="Enter button link"
            className="w-full p-3 rounded-lg bg-dark-200 border border-black text-light-100"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block mb-2 text-light-100">Button 2 Text (Optional)</label>
          <Input
            type="text"
            value={formData.button2}
            onChange={(e) => setFormData({...formData, button2: e.target.value})}
            placeholder="Enter button text"
            className="w-full p-3 rounded-lg bg-dark-200 border border-black text-light-100"
          />
        </div>
        <div>
          <label className="block mb-2 text-light-100">Button 2 Link (Optional)</label>
          <Input
            type="text"
            value={formData.button2_slug}
            onChange={(e) => setFormData({...formData, button2_slug: e.target.value})}
            placeholder="Enter button link"
            className="w-full p-3 rounded-lg bg-dark-200 border border-black text-light-100"
          />
        </div>
      </div>

      {showMediaManager && (
        <MediaManager
          onSelect={handleMediaSelect}
          onClose={() => setShowMediaManager(false)}
        />
      )}

      <div className="flex gap-4">
        <Button 
          type="submit" 
          variant="secondary"
          className="flex-1 border flex items-center justify-center"
          disabled={loading}
        >
          {loading ? 'Saving...' : initialData ? 'Update Hero' : 'Create Hero'}
        </Button>
        <Button 
          variant="destructive"
          type="button" 
          onClick={onCancel}
          className="flex-1"
          disabled={loading}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
};

export default HeroForm;
