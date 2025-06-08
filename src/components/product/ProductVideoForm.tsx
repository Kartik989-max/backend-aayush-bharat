import { useState, useEffect } from 'react';
import { Video, X } from 'lucide-react';
import { MediaManager } from '@/components/media/MediaManager';
import { productVideoService } from '@/services/ProductVideoService';
import { toast } from 'react-toastify';
import { Models } from 'appwrite';

interface ProductVideo extends Models.Document {
  video: string;
  productId: string;
}

interface ProductVideoFormProps {
  productId?: string;
  onVideoAdded?: (video: ProductVideo) => void;
}

export default function ProductVideoForm({ productId, onVideoAdded }: ProductVideoFormProps) {
  const [isAddingVideo, setIsAddingVideo] = useState(false);
  const [currentVideo, setCurrentVideo] = useState<ProductVideo | null>(null);
  useEffect(() => {
    if (productId) {
      loadProductVideo();
    } else {
      // Reset video when creating a new product
      setCurrentVideo(null);
    }
  }, [productId]);

  const loadProductVideo = async () => {
    if (!productId) return;
    
    try {
      const video = await productVideoService.getProductVideo(productId);
      if (video) {
        setCurrentVideo(video as ProductVideo);
      }
    } catch (error) {
      console.error('Error loading product video:', error);
    }
  };

  const handleDeleteVideo = async () => {
    if (!currentVideo) return;

    try {
      await productVideoService.deleteProductVideo(currentVideo.$id);
      toast.success('Video deleted successfully');
      setCurrentVideo(null);
    } catch (error) {
      console.error('Error deleting video:', error);
      toast.error('Failed to delete video');
    }
  };  const handleAddVideo = async (files: { url: string }[]) => {
    if (files.length === 0) return;

    try {
      const file = files[0];
      console.log('Adding video with file:', file);
      
      if (!productId) {
        toast.warning('Please save the product first before adding a video');
        setIsAddingVideo(false);
        return;
      }
      
      // Store the selected video URL temporarily if product isn't created yet
      if (!productId) {
        toast.info('Save the product to attach this video');
        setIsAddingVideo(false);
        return;
      }

      const result = await productVideoService.createProductVideo(file.url, productId);
      console.log('Video created:', result);
      
      setCurrentVideo(result as ProductVideo);
      if (onVideoAdded) {
        onVideoAdded(result as ProductVideo);
      }
      
      toast.success('Video added successfully');
      setIsAddingVideo(false);
    } catch (error) {
      console.error('Error adding video:', error);
      toast.error('Failed to add video');
      setIsAddingVideo(false);
    }
  };

  return (
    <div className="mt-6 p-4 border rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Product Video</h3>
      
      {currentVideo ? (
        <div className="relative">
          <video 
            src={currentVideo.video}
            controls
            className="w-full h-64 object-cover rounded-lg"
          />
          <button
            onClick={handleDeleteVideo}
            className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (        <button
          type="button" // Add type="button" to prevent form submission
          onClick={(e) => {
            e.preventDefault(); // Prevent any form submission
            e.stopPropagation(); // Stop event bubbling
            setIsAddingVideo(true);
          }}
          className="w-full h-40 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-2 hover:border-gray-400 transition-colors"
        >
          <Video className="w-8 h-8 text-gray-400" />
          <span className="text-gray-600">Add Product Video</span>
        </button>
      )}

      {isAddingVideo && (
        // Move the media manager outside the form to prevent accidental submission
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={(e) => e.stopPropagation()}>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl">
            <MediaManager
              onSelect={handleAddVideo}
              onClose={() => setIsAddingVideo(false)}
              allowMultiple={false}
              open={isAddingVideo}
            />
          </div>
        </div>
      )}
    </div>
  );
}
