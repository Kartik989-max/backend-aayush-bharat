'use client';

import { Trash2, InstagramIcon } from 'lucide-react';
import { toast } from 'react-toastify';

interface ReelPreviewProps {  reel?: {
    id: string;
    title: string;
    reel: string;
    home_reel: string;
    link?: string;
  };
  onDelete?: (id: string) => void;
}

const ReelPreview = ({ reel, onDelete }: ReelPreviewProps) => {
  const handleDelete = async (id: string) => {
    try {
      if (onDelete) {
        await onDelete(id);
        toast.success('Reel deleted successfully');
      }
    } catch (error) {
      toast.error('Failed to delete reel');
    }
  };

  if (!reel) {
    return (
      <div className="flex justify-center items-center h-[550px] bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <p className="text-gray-500 text-lg">No reel added yet</p>
      </div>
    );
  }
  return (
    <div className="relative group rounded overflow-hidden block h-[550px]">
      <video
        src={reel.home_reel || reel.reel}
        className="w-full h-full object-cover"
        loop
        muted
        controls
        playsInline
        preload="metadata"
      />
      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => handleDelete(reel.id)}
          className="p-2 bg-white rounded-full hover:bg-gray-100"
        >
          <Trash2 className="w-5 h-5 text-red-500" />
        </button>
      </div>
      {reel.link && (
        <a
          href={reel.link}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute bottom-16 left-1/2 transform -translate-x-1/2 flex items-center gap-2 text-white opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <InstagramIcon className="text-white text-3xl" />
          <span>View on Instagram</span>
        </a>
      )}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
        <h3 className="text-white font-semibold text-lg">{reel.title}</h3>
      </div>
    </div>
  );
};

export default ReelPreview;
