"use client";

import { useState, useEffect } from "react";
import { Models } from "appwrite";
import { getFilePreview, storage } from "@/lib/appwrite";
import { ID } from "appwrite";
import Image from "next/image";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Dialog } from "../ui/dialog";
import { Card, CardContent } from "../ui/card";
import { cn } from "@/lib/utils";

interface MediaManagerProps {
  onSelect: (files: { fileId: string; url: string; mimeType?: string }[]) => void;
  onClose: () => void;
  allowMultiple?: boolean;
  open: boolean;
  bucketId?: string; // Optional bucket ID to override default
}

export function MediaManager({ onSelect, onClose, allowMultiple = false, open, bucketId }: MediaManagerProps) {
  const [mediaType, setMediaType] = useState<"all" | "image" | "video">("all");
  const [files, setFiles] = useState<Models.File[]>([]);
  const [totalFiles, setTotalFiles] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [tab, setTab] = useState<"browse" | "upload">("browse");

  const itemsPerPage = 12;
  const [currentPage, setCurrentPage] = useState(1);
  
  // Calculate total pages
  const totalPages = Math.ceil(totalFiles / itemsPerPage);

  // Determine which bucket to use
  const getActiveBucketId = (fileType?: "image" | "video") => {
    if (bucketId) return bucketId;
    if (fileType === "video") return "68447dfa00141d2b6986"; // Videos bucket
    return "682762c0001ebf72e7f5"; // Default/images bucket
  };

  useEffect(() => {
    fetchFiles();
  }, [currentPage, mediaType]);

  const fetchFiles = async () => {
    try {
      // Use appropriate bucket based on media type
      const activeBucketId = mediaType === "video" ? 
        "68447dfa00141d2b6986" : // Videos bucket
        "682762c0001ebf72e7f5";  // Images bucket
      
      const res = await storage.listFiles(
        bucketId || activeBucketId,
        [
          `limit(${itemsPerPage})`,
          `offset(${(currentPage - 1) * itemsPerPage})`,
          'orderDesc("$createdAt")',
        ]
      );
      setFiles(res.files);
      setTotalFiles(res.total);
    } catch (err) {
      console.error("Error fetching files:", err);
    }
  };

  const filteredFiles = files.filter((f) => {
    const nameMatches = f.name.toLowerCase().includes(searchTerm.toLowerCase());
    const isImage = f.mimeType.startsWith("image/");
    const isVideo = f.mimeType.startsWith("video/");
    if (mediaType === "image") return nameMatches && isImage;
    if (mediaType === "video") return nameMatches && isVideo;
    return nameMatches;
  });

  const toggleSelection = (id: string) => {
    setSelected((prev) =>
      allowMultiple ? (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]) : prev.includes(id) ? [] : [id]
    );
  };

  const handleDelete = async () => {
    for (const fileId of selected) {
      try {
        // Determine bucket based on file type
        const file = files.find(f => f.$id === fileId);
        const activeBucketId = file?.mimeType?.startsWith("video/") ?
          "68447dfa00141d2b6986" : // Videos bucket
          "682762c0001ebf72e7f5";  // Images bucket

        await storage.deleteFile(bucketId || activeBucketId, fileId);
      } catch (err) {
        console.error(`Error deleting file ${fileId}:`, err);
      }
    }
    setSelected([]);
    fetchFiles();
  };

  const handleSubmit = () => {
    const selectedData = selected.map((id) => {
      const file = files.find(f => f.$id === id);
      const fileType = file?.mimeType?.startsWith("video/") ? "video" : "image";
      const activeBucketId = getActiveBucketId(fileType);
      
      return {
        fileId: id,
        url: getFilePreview(id, activeBucketId),
        mimeType: file?.mimeType
      };
    });
    onSelect(selectedData);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} title="Media Library">
      <div className="flex flex-col h-full">
        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <Button
            variant={tab === "browse" ? "default" : "ghost"}
            onClick={() => setTab("browse")}
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
            data-state={tab === "browse" ? "active" : "inactive"}
          >
            Browse
          </Button>
          <Button
            variant={tab === "upload" ? "default" : "ghost"}
            onClick={() => setTab("upload")}
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
            data-state={tab === "upload" ? "active" : "inactive"}
          >
            Upload
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {tab === "browse" ? (
            <>
              {/* Search and Delete */}
              <div className="flex items-center justify-between mb-4">
                <Input
                  type="text"
                  placeholder="Search media..."
                  className="w-1/2"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {selected.length > 0 && (
                  <Button
                    onClick={handleDelete}
                    variant="destructive"
                  >
                    Delete Selected
                  </Button>
                )}
              </div>

              {/* Media Type Filter */}
              <div className="flex gap-2 mb-4">
                {["all", "image", "video"].map((type) => (
                  <Button
                    key={type}
                    variant={mediaType === type ? "default" : "outline"}
                    onClick={() => setMediaType(type as "all" | "image" | "video")}
                    className="rounded-full"
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Button>
                ))}
              </div>

              {/* File Grid */}
              <div className="grid grid-cols-4 gap-4">
                {filteredFiles.map((file) => (
                  <Card
                    key={file.$id}
                    className={cn(
                      "cursor-pointer overflow-hidden group aspect-square",
                      selected.includes(file.$id) && "ring-2 ring-primary"
                    )}
                    onClick={() => toggleSelection(file.$id)}
                  >
                    <CardContent className="p-0 relative h-full">
                      {file.mimeType.startsWith("video/") ? (
                        <video
                          src={getFilePreview(file.$id, getActiveBucketId("video"))}
                          className="object-cover w-full h-full"
                          preload="metadata"
                          controls
                        />
                      ) : (
                        <Image
                          src={getFilePreview(file.$id, getActiveBucketId("image"))}
                          alt={file.name}
                          width={500}
                          height={500}
                          className="object-cover w-full h-full"
                        />
                      )}

                      {selected.includes(file.$id) && (
                        <div className="absolute top-2 right-2 bg-white rounded-full p-1">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 text-primary"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 00-1.414 0L8 12.586 4.707 9.293a1 1 0 00-1.414 1.414l4 4a1 1 0 001.414 0l8-8a1 1 0 000-1.414z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      )}
                      <p className="text-center text-sm mt-1 truncate p-2">{file.name}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              <div className="flex justify-center items-center gap-4 mt-6">
                <Button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  variant="outline"
                >
                  Prev
                </Button>
                <span>
                  Page {currentPage} of {totalPages || 1}
                </span>
                <Button
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  variant="outline"
                >
                  Next
                </Button>
              </div>
            </>
          ) : (
            // Upload tab content
            <div className="p-4">
              <Input
                type="file"
                multiple={allowMultiple}
                accept={mediaType === "video" ? "video/*" : mediaType === "image" ? "image/*" : "image/*,video/*"}
                onChange={async (e) => {
                  const files = e.target.files;
                  if (!files) return;

                  for (const file of Array.from(files)) {
                    const isVideo = file.type.startsWith("video/");
                    const activeBucketId = isVideo ? 
                      "68447dfa00141d2b6986" : // Videos bucket
                      "682762c0001ebf72e7f5";  // Images bucket

                    try {
                      await storage.createFile(
                        bucketId || activeBucketId,
                        ID.unique(),
                        file
                      );
                    } catch (err) {
                      console.error(`Error uploading file ${file.name}:`, err);
                    }
                  }
                  fetchFiles();
                  setTab("browse");
                }}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 flex justify-between items-center">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={selected.length === 0}
          >
            Select ({selected.length})
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
