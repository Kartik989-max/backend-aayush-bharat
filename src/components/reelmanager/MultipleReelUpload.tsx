'use client';

import { useState } from 'react';
import { X, Plus } from 'lucide-react';

interface ReelFile {
  file: File;
  preview: string;
  title: string;
}

interface MultipleReelUploadProps {
  onClose: () => void;
}

const MultipleReelUpload = ({ onClose }: MultipleReelUploadProps) => {
  const [reels, setReels] = useState<ReelFile[]>([]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newReels = Array.from(files).map(file => ({
        file,
        preview: URL.createObjectURL(file),
        title: file.name.replace(/\.[^/.]+$/, "") // Remove extension
      }));
      setReels([...reels, ...newReels]);
    }
  };

  const removeReel = (index: number) => {
    const updatedReels = reels.filter((_, i) => i !== index);
    setReels(updatedReels);
  };

  const updateReelTitle = (index: number, title: string) => {
    const updatedReels = reels.map((reel, i) => 
      i === index ? { ...reel, title } : reel
    );
    setReels(updatedReels);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement form submission for multiple reels
    console.log('Submitting reels:', reels);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Upload Reels</h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="border-2 border-dashed rounded-lg p-6 text-center">
          <input
            type="file"
            accept="video/*"
            onChange={handleFileSelect}
            className="hidden"
            id="reel-upload"
            multiple
          />
          <label
            htmlFor="reel-upload"
            className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800"
          >
            <Plus className="w-5 h-5" />
            Add Reels
          </label>
          <p className="text-sm text-gray-500 mt-2">
            Select multiple files or drag and drop them here
          </p>
        </div>

        {reels.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-medium">Selected Reels</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reels.map((reel, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <input
                      type="text"
                      value={reel.title}
                      onChange={(e) => updateReelTitle(index, e.target.value)}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Enter reel title"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => removeReel(index)}
                      className="ml-2 p-1 hover:bg-red-50 rounded-full text-red-500"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="aspect-video rounded-lg overflow-hidden bg-black mt-2">
                    <video
                      src={reel.preview}
                      className="w-full h-full object-contain"
                      controls
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-between gap-4">
          <div className="text-sm text-gray-500">
            {reels.length} reel{reels.length !== 1 ? 's' : ''} selected
          </div>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={reels.length === 0}
              className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Upload Reels
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default MultipleReelUpload;
