'use client';

import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import ReelPreview from '@/components/reelmanager/ReelPreview';
import { MediaManager } from '@/components/media/MediaManager';
import { reelService } from '@/services/ReelService';
import { toast } from 'react-toastify';
import { Models } from 'appwrite';
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";

interface Reel extends Models.Document {
  reel: string;
}

export default function ReelsPage() {
  const [isAddingReel, setIsAddingReel] = useState(false);
  const [reels, setReels] = useState<Reel[]>([]);

  useEffect(() => {
    loadReels();
  }, []);

  const loadReels = async () => {
    try {
      const reelData = await reelService.listReels();
      setReels(reelData as Reel[]);
    } catch (error) {
      console.error('Error loading reels:', error);
      toast.error('Failed to load reels');
    }
  };

  const handleDeleteReel = async (id: string) => {
    try {
      await reelService.deleteReel(id);
      toast.success('Reel deleted successfully');
      loadReels();
    } catch (error) {
      console.error('Error deleting reel:', error);
      toast.error('Failed to delete reel');
    }
  };

  return (
    <div className="relative min-h-screen p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold tracking-tight">Reel Manager</h1>
        <Button
          onClick={() => setIsAddingReel(true)}
          variant="secondary"
          size="default"
          className="font-medium"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add New Reel
        </Button>
      </div>

      {isAddingReel && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-background p-4 rounded-lg w-full max-w-3xl">
            <MediaManager
              onSelect={async (files) => {
                if (files.length > 0) {
                  try {
                    const file = files[0];
                    console.log('Creating reel with file:', file);
                    
                    const result = await reelService.createReel(file.url);
                    console.log('Reel created:', result);
                    
                    toast.success('Reel created successfully');
                    setIsAddingReel(false);
                    loadReels();
                  } catch (error) {
                    console.error('Error creating reel:', error);
                    toast.error('Failed to create reel');
                  }
                }
              }}
              onClose={() => setIsAddingReel(false)}
              allowMultiple={false}
              open={isAddingReel}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
        {reels.length === 0 ? (
          <ReelPreview />
        ) : (
          reels.map((reel) => (
            <ReelPreview
              key={reel.$id}
              reel={{
                id: reel.$id,
                title: reel.title,
                reel: reel.reel,
                home_reel: reel.home_reel
              }}
              onDelete={handleDeleteReel}
            />
          ))
        )}
      </div>
    </div>
  );
}
