'use client';

import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import ReelPreview from '@/components/reelmanager/ReelPreview';
import { MediaManager } from '@/components/media/MediaManager';
import { reelService } from '@/services/ReelService';
import { toast } from 'react-toastify';
import { Models } from 'appwrite';

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
      loadReels(); // Refresh the list
    } catch (error) {
      console.error('Error deleting reel:', error);
      toast.error('Failed to delete reel');
    }
  };

  return (
    <div className="relative min-h-screen">
      <button
        onClick={() => setIsAddingReel(true)}
        className="fixed top-6 right-6 bg-black text-white px-6 py-3 rounded-md flex items-center gap-2 hover:bg-gray-800 shadow-xl z-10 text-lg font-medium"
      >
        <Plus className="w-6 h-6" />
        Add New Reel
      </button>      {isAddingReel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl">
            <MediaManager
              onSelect={async (files) => {
                if (files.length > 0) {
                  try {                    const file = files[0];
                    console.log('Creating reel with file:', file);
                    
                    // Create the reel with just the URL
                    const result = await reelService.createReel(file.url);
                    console.log('Reel created:', result);
                    
                    toast.success('Reel created successfully');
                    setIsAddingReel(false);
                    loadReels(); // Refresh the list
                  } catch (error) {
                    console.error('Error creating reel:', error);
                    toast.error('Failed to create reel');
                  }
                }
              }}
              onClose={() => setIsAddingReel(false)}
              allowMultiple={false}
            />
          </div>
        </div>
      )}

      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Reel Manager</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
    </div>
  );
}
