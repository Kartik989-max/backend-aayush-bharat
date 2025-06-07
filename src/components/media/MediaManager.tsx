"use client";

import { useState, useEffect } from "react";
import { Models } from "appwrite";
import { getFilePreview, storage } from "@/lib/appwrite";
import { ID } from "appwrite";
import Image from "next/image";
import { Input } from "../ui/input";
import { Button } from "../ui/button";

interface MediaManagerProps {
  onSelect: (files: { fileId: string; url: string }[]) => void;
  onClose: () => void;
  allowMultiple?: boolean;
}

export function MediaManager({ onSelect, onClose, allowMultiple = false }: MediaManagerProps) {
  const [mediaType, setMediaType] = useState<"all" | "image" | "video">("all");
  const [files, setFiles] = useState<Models.File[]>([]);
  const [totalFiles, setTotalFiles] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [tab, setTab] = useState<"browse" | "upload">("browse");

  const itemsPerPage = 12;
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchFiles();
  }, [currentPage]);

  const fetchFiles = async () => {
    try {
      const res = await storage.listFiles(
        process.env.NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID!,
        [
          `limit(${itemsPerPage})`,
          `offset(${(currentPage - 1) * itemsPerPage})`,
          'orderDesc("$createdAt")',
        ]
      );
      setFiles(res.files);
      setTotalFiles(res.total); // Total number of files for pagination
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

  const totalPages = Math.ceil(totalFiles / itemsPerPage);

  const toggleSelection = (id: string) => {
    setSelected((prev) =>
      allowMultiple ? (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]) : prev.includes(id) ? [] : [id]
    );
  };

  const handleDelete = async () => {
    for (const fileId of selected) {
      await storage.deleteFile(process.env.NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID!, fileId);
    }
    setSelected([]);
    fetchFiles();
  };

  const handleSubmit = () => {
    const selectedData = selected.map((id) => ({
      fileId: id,
      url: getFilePreview(id).toString(),
    }));
    onSelect(selectedData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
      <div className="bg-white w-[90%] max-w-4xl max-h-[90vh] rounded-lg overflow-hidden shadow-lg flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Media Library</h2>
          <button onClick={onClose} className="text-4xl text-gray-500 hover:text-black">&times;</button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            className={`py-2 px-4 ${tab === "browse" ? "border-b-2 border-black font-semibold" : "text-gray-500"}`}
            onClick={() => setTab("browse")}
          >
            Browse
          </button>
          <button
            className={`py-2 px-4 ${tab === "upload" ? "border-b-2 border-black font-semibold" : "text-gray-500"}`}
            onClick={() => setTab("upload")}
          >
            Upload
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {tab === "browse" ? (
            <>
              {/* Search and Delete */}
              <div className="flex items-center justify-between mb-4">
                <input
                  type="text"
                  placeholder="Search media..."
                  className="border p-2 rounded w-1/2"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {selected.length > 0 && (
                  <button
                    onClick={handleDelete}
                    className="border px-4 py-2 rounded bg-red-500 text-white hover:bg-red-600"
                  >
                    Delete Selected
                  </button>
                )}
              </div>

              {/* Media Type Filter */}
              <div className="flex gap-2 mb-4">
                {["all", "image", "video"].map((type) => (
                  <button
                    key={type}
                    className={`px-4 py-1 rounded-full border ${
                      mediaType === type ? "bg-black text-white" : "text-black border-gray-300"
                    }`}
                    onClick={() => setMediaType(type as "all" | "image" | "video")}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>

              {/* File Grid */}
              <div className="grid grid-cols-4 gap-4">
                {filteredFiles.map((file) => (
                  <div
                    key={file.$id}
                    className={`relative cursor-pointer border-2 rounded-lg overflow-hidden group aspect-square ${
                      selected.includes(file.$id)
                        ? "border-blue-500 ring-2 ring-blue-300"
                        : "border-transparent hover:border-blue-300"
                    }`}
                    onClick={() => toggleSelection(file.$id)}
                  >
                    {file.mimeType.startsWith("video/") ? (
                      <video
                        src={getFilePreview(file.$id)}
                        className="object-cover w-full h-full"
                        preload="metadata"
                        controls
                      />
                    ) : (
                      <Image
                        src={getFilePreview(file.$id)}
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
                          className="h-4 w-4 text-blue-500"
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
                    <p className="text-center text-sm mt-1 truncate">{file.name}</p>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              <div className="flex justify-center items-center gap-4 mt-6">
                <Button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-1 text-black border shadow-md"
                >
                  Prev
                </Button>
                <span>
                  Page {currentPage} of {totalPages || 1}
                </span>
                <Button
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-4 text-black border shadow-md py-1"
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
                multiple
                accept="image/*,video/*"
                onChange={async (e) => {
                  const files = e.target.files;
                  if (!files) return;

                  for (const file of Array.from(files)) {
                    await storage.createFile(
                      process.env.NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID!,
                      ID.unique(),
                      file
                    );
                  }
                  fetchFiles();
                  setTab("browse");
                }}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex justify-between items-center">
          <Button onClick={onClose} className="text-gray-700 hover:underline">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800 disabled:opacity-50"
            disabled={selected.length === 0}
          >
            Select ({selected.length})
          </Button>
        </div>
      </div>
    </div>
  );
}
