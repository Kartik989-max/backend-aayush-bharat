"use client";

import { useState } from "react";
import { MediaManager } from "@/components/media/MediaManager";

export default function MediaPage() {
  const [selectedMedia, setSelectedMedia] = useState<{ fileId: string; url: string; mimeType?: string }[]>([]);

  const handleMediaSelect = (files: { fileId: string; url: string; mimeType?: string }[]) => {
    setSelectedMedia(files);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Media Library</h1>
      <MediaManager
        open={true}
        onSelect={handleMediaSelect}
        allowMultiple={true}
        isForm={false}
      />
    </div>
  );
} 