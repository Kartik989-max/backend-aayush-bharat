'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { storage } from '@/lib/appwrite';
import { Spinner } from '@/components/ui/Spinner';
import { Models, ID } from 'appwrite';
import { compressImage } from '@/lib/imageCompression';

interface MediaManagerProps {
  onSelect: (fileId: string, url: string) => void;
  onClose: () => void;
}

export const MediaManager = ({ onSelect, onClose }: MediaManagerProps) => {
  const [files, setFiles] = useState<Models.File[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalFiles, setTotalFiles] = useState(0);
  const itemsPerPage = 12;

  useEffect(() => {
    fetchFiles();
  }, [currentPage]);

  const fetchFiles = async () => {
    try {
      const response = await storage.listFiles(
        process.env.NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID!,
        [
          `limit(${itemsPerPage})`,
          `offset(${(currentPage - 1) * itemsPerPage})`,
          'orderDesc("$createdAt")'
        ]
      );

      // Ensure unique files by using $id as key
      const uniqueFiles = Array.from(
        new Map(response.files.map(file => [file.$id, file])).values()
      );
      
      setFiles(uniqueFiles);
      setTotalFiles(response.total);
    } catch (error) {
      console.error('Error fetching files:', error);
      setError('Failed to load media files');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      setError(null);

      const compressedFile = await compressImage(file);
      
      const result = await storage.createFile(
        process.env.NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID!,
        ID.unique(),
        compressedFile
      );

      await fetchFiles(); // Refresh current page
      setCurrentPage(1); // Reset to first page after upload
    } catch (error: any) {
      console.error('Upload failed:', error);
      setError(error.message || 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const getFileUrl = (fileId: string) => {
    const baseUrl = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
    const bucketId = process.env.NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID;
    const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
    
    return `${baseUrl}/storage/buckets/${bucketId}/files/${fileId}/view?project=${projectId}&mode=admin`;
  };

  const handleFileSelect = (file: Models.File) => {
    const url = getFileUrl(file.$id);
    onSelect(file.$id, url);
  };

  const totalPages = Math.ceil(totalFiles / itemsPerPage);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-dark-100 p-6 rounded-lg w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-light-100">Media Manager</h2>
          <button onClick={onClose} className="text-light-100/70 hover:text-light-100">
            ✕
          </button>
        </div>

        <div className="mb-6">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="w-full p-3 rounded-lg bg-dark-200 text-light-100"
            disabled={uploading}
          />
          {uploading && (
            <div className="mt-2 text-primary flex items-center">
              <Spinner className="w-4 h-4 mr-2" />
              Uploading...
            </div>
          )}
          {error && (
            <div className="mt-2 text-red-500">
              {error}
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-48">
            <Spinner className="w-8 h-8" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {files.map((file) => (
                <div
                  key={`${file.$id}-${currentPage}`}
                  onClick={() => handleFileSelect(file)}
                  className="relative aspect-square cursor-pointer group overflow-hidden rounded-lg border-2 border-transparent hover:border-primary transition-all"
                >
                  <Image
                    src={getFileUrl(file.$id)}
                    alt={`${file.name}-${file.$id}`}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white text-sm">Select</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="mt-6 flex justify-center items-center gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentPage(prev => Math.max(prev - 1, 1));
                }}
                disabled={currentPage === 1}
                className="px-3 py-1 bg-dark-200 rounded disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-light-100" onClick={e => e.stopPropagation()}>
                Page {currentPage} of {totalPages}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentPage(prev => Math.min(prev + 1, totalPages));
                }}
                disabled={currentPage === totalPages}
                className="px-3 py-1 bg-dark-200 rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
