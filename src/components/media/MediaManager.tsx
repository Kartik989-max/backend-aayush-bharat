"use client";

import { useState, useEffect } from "react";
import { Models, Permission, Role } from "appwrite";
import { getFilePreview, storage } from "@/lib/appwrite";
import { ID } from "appwrite";
import Image from "next/image";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Dialog } from "../ui/dialog";
import { Card, CardContent } from "../ui/card";
import { cn } from "@/lib/utils";
import { Loader2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";

interface MediaManagerProps {
  onSelect: (files: { fileId: string; url: string; mimeType?: string }[]) => void;
  onClose?: () => void;
  allowMultiple?: boolean;
  open: boolean;
  isForm?: boolean;
}

interface UploadProgressProps {
  fileName: string;
  progress: number;
}

const UploadProgress = ({ fileName, progress }: UploadProgressProps) => (
  <div className="mb-4">
    <div className="text-sm mb-1 flex justify-between">
      <span className="truncate max-w-[200px]">{fileName}</span>
      <span>{progress}%</span>
    </div>
    <div className="w-full bg-gray-200 rounded-full h-2">
      <div
        className="bg-primary h-2 rounded-full transition-all duration-300"
        style={{ width: `${progress}%` }}
      />
    </div>
  </div>
);

export function MediaManager({ onSelect, onClose, allowMultiple = false, open, isForm = false }: MediaManagerProps) {
  const [mediaType, setMediaType] = useState<"image" | "video">("image");
  const [files, setFiles] = useState<Models.File[]>([]);
  const [totalFiles, setTotalFiles] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [tab, setTab] = useState<"browse" | "upload">("browse");
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [uploading, setUploading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const router = useRouter();

  const itemsPerPage = 12;
  const totalPages = Math.ceil(totalFiles / itemsPerPage);

  const bucketIds = {
    video: "68447dfa00141d2b6986",
    image: "682762c0001ebf72e7f5"
  };

  // Helper functions to detect bucket from full URL
  const isVideoUrl = (url: string) => {
    return url.includes(`/buckets/${bucketIds.video}/`);
  };

  const isImageUrl = (url: string) => {
    return url.includes(`/buckets/${bucketIds.image}/`);
  };

  useEffect(() => {
    fetchFiles();
  }, [currentPage, mediaType]);

  const fetchFiles = async () => {
    try {
      const res = await storage.listFiles(
        bucketIds[mediaType],
        [
          `limit(${itemsPerPage})`,
          `offset(${(currentPage - 1) * itemsPerPage})`,
          'orderDesc("$createdAt")',
        ]
      );
      setFiles(res.files.filter(file => 
        mediaType === "video" 
          ? file.mimeType.startsWith("video/")
          : file.mimeType.startsWith("image/")
      ));
      setTotalFiles(res.total);
    } catch (err) {
      console.error("Error fetching files:", err);
    }
  };

  const handleFileUpload = async (files: FileList) => {
    setUploading(true);
    const uploadedFiles: string[] = [];

    try {
      for (const file of Array.from(files)) {
        const isVideo = file.type.startsWith("video/");
        const isImage = file.type.startsWith("image/");

        if ((mediaType === "video" && !isVideo) || (mediaType === "image" && !isImage)) {
          continue;
        }

        const fileId = ID.unique();
        setUploadProgress(prev => ({ ...prev, [fileId]: 0 }));

        const file_permissions = [
          Permission.read(Role.any()),
          Permission.update(Role.any()),
          Permission.delete(Role.any())
        ];

        await storage.createFile(
          bucketIds[mediaType],
          fileId,
          file,
          file_permissions,
          (progress) => {
            setUploadProgress(prev => ({
              ...prev,
              [fileId]: Math.round((progress.chunksUploaded / progress.chunksTotal) * 100)
            }));
          }
        );

        uploadedFiles.push(fileId);
      }

      await fetchFiles();
      setTab("browse");
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setUploading(false);
      setUploadProgress({});
    }
  };

  const handleDelete = async () => {
    for (const fileId of selected) {
      try {
        await storage.deleteFile(bucketIds[mediaType], fileId);
      } catch (err) {
        console.error(`Error deleting file ${fileId}:`, err);
      }
    }
    setSelected([]);
    fetchFiles();
  };

  const toggleSelection = (id: string) => {
    setSelected((prev) =>
      allowMultiple
        ? prev.includes(id)
          ? prev.filter((i) => i !== id)
          : [...prev, id]
        : prev.includes(id)
          ? []
          : [id]
    );
  };

  const content = (
    <div className="flex flex-col h-[80vh]">
      {!isForm && (
        <div className="flex border-b text-white border-gray-200">
          <Button
            variant={tab === "browse" ? "default" : "ghost"}
            onClick={() => setTab("browse")}
            className={cn(
              "rounded-none border-b-2 border-transparent",
              tab === "browse" 
                ? "border-primary text-white font-medium" 
                : "text-muted-foreground hover:text-foreground"
            )}
            data-state={tab === "browse" ? "active" : "inactive"}
          >
            Browse
          </Button>
          <Button
            variant={tab === "upload" ? "default" : "ghost"}
            onClick={() => {
              if (isForm) {
                router.push('/dashboard/media');
                if (onClose) onClose();
              } else {
                setTab("upload");
              }
            }}
            className={cn(
              "rounded-none border-b-2 border-transparent",
              tab === "upload" 
                ? "border-primary text-white font-medium" 
                : "text-muted-foreground hover:text-foreground"
            )}
            data-state={tab === "upload" ? "active" : "inactive"}
          >
            Upload
          </Button>
        </div>
      )}

      <div className="flex gap-2 p-4 border-b">
        <Button
          variant={mediaType === "image" ? "default" : "outline"}
          onClick={() => {
            setMediaType("image");
            setSelected([]);
          }}
          className={mediaType === "image" ? "text-white" : "text-foreground"}
        >
          Images
        </Button>
        <Button
          variant={mediaType === "video" ? "default" : "outline"}
          onClick={() => {
            setMediaType("video");
            setSelected([]);
          }}
          className={mediaType === "video" ? "text-white" : "text-foreground"}
        >
          Videos
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {tab === "browse" ? (
          <>
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
                  className="text-white hover:text-white/90"
                >
                  Delete Selected
                </Button>
              )}
            </div>

            <div className="grid grid-cols-4 gap-4">
              {files
                .filter(f => f.name.toLowerCase().includes(searchTerm.toLowerCase()))
                .map((file) => (
                  <Card
                    key={file.$id}
                    className={cn(
                      "cursor-pointer overflow-hidden group aspect-square",
                      selected.includes(file.$id) && "ring-2 ring-primary"
                    )}
                    onClick={() => toggleSelection(file.$id)}
                  >
                    <CardContent className="p-0 relative h-full">
                      {mediaType === "video" || file.mimeType.startsWith("video/") ? (
                        <video
                          src={getFilePreview(file.$id, bucketIds.video)}
                          className="object-cover w-full h-full"
                          preload="metadata"
                          controls
                        />
                      ) : (
                        <Image
                          src={getFilePreview(file.$id, bucketIds.image)}
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

            <div className="flex justify-center items-center gap-4 mt-6">
              <Button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                variant="outline"
              >
                Previous
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
          <div className="p-4">
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <input
                type="file"
                multiple={allowMultiple}
                accept={mediaType === "video" ? "video/*" : "image/*"}
                onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                className="hidden"
                id="file-upload"
                disabled={uploading}
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer inline-flex flex-col items-center gap-4"
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  {uploading ? (
                    <Loader2 className="w-6 h-6 text-primary animate-spin" />
                  ) : (
                    <Plus className="w-6 h-6 text-primary" />
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  {uploading ? (
                    "Uploading..."
                  ) : (
                    <>
                      <span className="font-medium text-primary">Click to upload</span> or drag and drop
                      <br />
                      {mediaType === "video" ? "MP4, WebM, MOV up to 100MB" : "PNG, JPG, GIF up to 10MB"}
                    </>
                  )}
                </div>
              </label>
            </div>

            {Object.keys(uploadProgress).length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-medium mb-4">Upload Progress</h3>
                {Object.entries(uploadProgress).map(([fileId, progress]) => (
                  <UploadProgress
                    key={fileId}
                    fileName={files.find(f => f.$id === fileId)?.name || fileId}
                    progress={progress}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-gray-200 flex justify-between items-center">
        {onClose && (
          <Button 
            variant="outline" 
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            Cancel
          </Button>
        )}
        <Button
          onClick={() => {
            const selectedData = selected.map((id) => {
              const file = files.find(f => f.$id === id);
              const isVideo = file?.mimeType?.startsWith("video/");
              return {
                fileId: id,
                url: getFilePreview(id, isVideo ? bucketIds.video : bucketIds.image),
                mimeType: file?.mimeType
              };
            });
            onSelect(selectedData);
            if (onClose) onClose();
          }}
          disabled={selected.length === 0}
          className="text-white ml-auto"
        >
          Select ({selected.length})
        </Button>
      </div>
    </div>
  );

  if (!open) return null;

  // If onClose is provided, wrap in Dialog, otherwise render content directly
  return onClose ? (
    <Dialog open={open} onClose={onClose} title="Media Library">
      {content}
    </Dialog>
  ) : content;
}
