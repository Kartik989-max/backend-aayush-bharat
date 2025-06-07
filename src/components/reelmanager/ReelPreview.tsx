'use client';

import { Trash2, InstagramIcon } from 'lucide-react';
import { toast } from 'react-toastify';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface ReelPreviewProps {
  reel?: {
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
      <Card className="h-[400px] flex items-center justify-center border-dashed">
        <CardContent className="p-4">
          <p className="text-muted-foreground text-base">No reel added yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="relative group overflow-hidden h-[400px]">
      <video
        src={reel.home_reel || reel.reel}
        className="w-full h-full object-cover"
        loop
        muted
        controls
        playsInline
        preload="metadata"
      />
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="destructive"
          size="icon"
          onClick={() => handleDelete(reel.id)}
          className="rounded-full h-8 w-8"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
      {reel.link && (
        <a
          href={reel.link}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute bottom-12 left-1/2 transform -translate-x-1/2 flex items-center gap-1.5 text-white opacity-0 group-hover:opacity-100 transition-opacity text-sm"
        >
          <InstagramIcon className="text-white text-2xl" />
          <span>View on Instagram</span>
        </a>
      )}
      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent">
        <h3 className="text-white font-medium text-base truncate">{reel.title}</h3>
      </div>
    </Card>
  );
};

export default ReelPreview;
