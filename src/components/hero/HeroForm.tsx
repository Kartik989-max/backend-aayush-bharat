'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Loader2 } from "lucide-react";
import { MediaManager } from '../media/MediaManager';
import type { Hero } from '@/services/HeroService';

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

  const handleMediaSelect = (files: { fileId: string; url: string; mimeType?: string }[]) => {
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
    <form onSubmit={handleSubmit} className="space-y-8 p-6">
      {error && (
        <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-lg">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-8">
        {/* Left Column */}
        <div className="space-y-6">
          <div>
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Main Media*
            </label>
            <p className="text-[0.8rem] text-muted-foreground mb-4">
              Upload an image or video for the hero section
            </p>
            <Button
              type="button"
              onClick={() => setShowMediaManager('main')}
              variant="outline"
              className="w-full h-32 border-dashed group relative overflow-hidden"
            >
              {formData.video ? (
                <video
                  src={formData.video}
                  className="absolute inset-0 w-full h-full object-cover"
                  autoPlay
                  muted
                  loop
                />
              ) : formData.image ? (
                <Image
                  src={formData.image}
                  alt="Hero image"
                  fill
                  className="object-cover transition-transform group-hover:scale-105"
                />
              ) : (
                <div className="flex flex-col items-center justify-center">
                  <Plus className="w-8 h-8 mb-2 text-muted-foreground group-hover:text-primary transition-colors" />
                  <span className="text-sm text-muted-foreground group-hover:text-primary transition-colors">
                    Upload media
                  </span>
                </div>
              )}
            </Button>
          </div>

          <div>
            <label className="text-sm font-medium leading-none">Mobile Image (Optional)</label>
            <p className="text-[0.8rem] text-muted-foreground mb-4">
              Upload a specific image for mobile devices
            </p>
            <Button
              type="button"
              onClick={() => setShowMediaManager('mobile')}
              variant="outline"
              className="w-48 h-64 border-dashed group relative overflow-hidden"
            >
              {formData.mobile_image ? (
                <Image
                  src={formData.mobile_image}
                  alt="Mobile preview"
                  fill
                  className="object-cover transition-transform group-hover:scale-105"
                />
              ) : (
                <div className="flex flex-col items-center justify-center">
                  <Plus className="w-8 h-8 mb-2 text-muted-foreground group-hover:text-primary transition-colors" />
                  <span className="text-sm text-center text-muted-foreground group-hover:text-primary transition-colors">
                    Upload mobile image
                  </span>
                </div>
              )}
            </Button>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="heading" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Heading*
              </label>
              <Input
                id="heading"
                value={formData.heading}
                onChange={(e) => setFormData({...formData, heading: e.target.value})}
                placeholder="Enter hero heading"
                required
                className="mt-2"
              />
            </div>

            <div>
              <label htmlFor="subtext" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Sub Text*
              </label>
              <Input
                id="subtext"
                value={formData.sub_text}
                onChange={(e) => setFormData({...formData, sub_text: e.target.value})}
                placeholder="Enter subtext"
                required
                className="mt-2"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="button1" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Button 1 Text*
                </label>
                <Input
                  id="button1"
                  value={formData.button1}
                  onChange={(e) => setFormData({...formData, button1: e.target.value})}
                  placeholder="Enter button text"
                  required
                  className="mt-2"
                />
              </div>
              <div>
                <label htmlFor="button1_slug" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Button 1 Link*
                </label>
                <Input
                  id="button1_slug"
                  value={formData.button1_slug}
                  onChange={(e) => setFormData({...formData, button1_slug: e.target.value})}
                  placeholder="Enter button link"
                  required
                  className="mt-2"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="button2" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Button 2 Text
                </label>
                <Input
                  id="button2"
                  value={formData.button2}
                  onChange={(e) => setFormData({...formData, button2: e.target.value})}
                  placeholder="Enter button text (optional)"
                  className="mt-2"
                />
              </div>
              <div>
                <label htmlFor="button2_slug" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Button 2 Link
                </label>
                <Input
                  id="button2_slug"
                  value={formData.button2_slug}
                  onChange={(e) => setFormData({...formData, button2_slug: e.target.value})}
                  placeholder="Enter button link (optional)"
                  className="mt-2"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {showMediaManager && (
        <MediaManager
          onSelect={handleMediaSelect}
          onClose={() => setShowMediaManager(false)}
        />
      )}

      <div className="flex items-center justify-end gap-4">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="min-w-[120px]"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>{initialData ? 'Update' : 'Create'} Hero</>
          )}
        </Button>
      </div>
    </form>
  );
};

export default HeroForm;
