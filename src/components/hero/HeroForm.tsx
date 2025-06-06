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
  );
  const handleMediaSelect = (files: { fileId: string; url: string }[]) => {
    const fileUrl = files[0].url;
    if (showMediaManager === 'main') {
      // If video is selected, clear image and vice versa
      if (mediaType === 'video') {
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
      </div>

      <div>
        <label className="block mb-2 text-light-100">Main Media* (Image or Video)</label>
        <div className="flex items-center gap-4 mb-4">
          <select
            value={mediaType}
            onChange={(e) => setMediaType(e.target.value as 'image' | 'video')}
            className="p-2 rounded bg-dark-200 text-light-100 border border-dark-300"
          >
            <option value="image">Image</option>
            <option value="video">Video</option>
          </select>
          <Button
            type="button"
            onClick={() => setShowMediaManager('main')}
            className="w-24 h-24 border-2 border-dashed border-muted flex items-center justify-center rounded hover:bg-muted transition"
          >
            <Plus className="w-6 h-6" />
          </Button>
        </div>
        
        {formData.video && (
          <div className="relative h-40 w-full rounded overflow-hidden mb-4">
            <video src={formData.video} className="w-full h-full object-cover" autoPlay muted loop />
          </div>
        )}
        {formData.image && (
          <div className="relative h-40 w-full rounded overflow-hidden mb-4">
            <Image src={formData.image} alt="Hero image" fill className="object-cover" />
          </div>
        )}
      </div>

      <div>
        <label className="block mb-2 text-light-100">Mobile Image (Optional)</label>
        <Button
          type="button"
          onClick={() => setShowMediaManager('mobile')}
          className="w-24 h-24 border-2 border-dashed border-muted flex items-center justify-center rounded hover:bg-muted transition mb-4"
        >
          <Plus className="w-6 h-6" />
        </Button>
        {formData.mobile_image && (
          <div className="relative h-40 w-24 rounded overflow-hidden">
            <Image src={formData.mobile_image} alt="Mobile preview" fill className="object-cover" />
          </div>
        )}
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
