'use client';

import dynamic from 'next/dynamic';
import React, { useState, useEffect } from 'react';
import { useQuill } from 'react-quilljs';
import 'quill/dist/quill.snow.css';
import '@/styles/quill.css';
import { getFilePreview } from '@/lib/appwrite';
import { Spinner } from '@/components/ui/Spinner';

// Import MediaManager directly
import { MediaManager } from '@/components/media/MediaManager';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
}

// Type for Quill's toolbar module
interface QuillToolbar {
  addHandler: (type: string, handler: () => void) => void;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ content, onChange }) => {
  const [showMediaManager, setShowMediaManager] = useState(false);

  // Configure Quill modules
  const modules = {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'],
      [{ header: [1, 2, 3, 4, 5, 6, false] }],
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ align: [] }],
      ['link', 'image'],
      [{ color: [] }, { background: [] }],
      ['clean']
    ]
  };

  // Define supported formats
  const formats = [
    'bold', 'italic', 'underline', 'strike',
    'header', 'list',
    'align', 'link', 'image',
    'color', 'background'
  ];

  // Initialize Quill
  const { quill, quillRef } = useQuill({
    modules,
    formats,
    theme: 'snow',
    placeholder: 'Write your blog content here...'
  });

  // Set up image handler to use media manager
  useEffect(() => {
    if (!quill) return;

    // Get the toolbar module
    const toolbar = quill.getModule('toolbar') as QuillToolbar;
    
    // Override the default image handler
    toolbar.addHandler('image', () => {
      setShowMediaManager(true);
    });
  }, [quill]);

  // Handle content changes
  useEffect(() => {
    if (!quill) return;

    quill.on('text-change', () => {
      onChange(quill.root.innerHTML);
    });
  }, [quill, onChange]);

  // Set initial content
  useEffect(() => {
    if (!quill) return;
    
    if (content && quill.root.innerHTML !== content) {
      quill.root.innerHTML = content;
    }
  }, [quill, content]);

  // Apply custom styles to match the dashboard theme
  useEffect(() => {
    if (!quill) return;
    
    // Apply custom styles to the editor
    const editorElement = quillRef.current;
    if (editorElement) {
      // Add custom classes to the toolbar
      const toolbar = editorElement.querySelector('.ql-toolbar');
      if (toolbar) {
        toolbar.classList.add('bg-dark-200', 'border-dark-300', 'rounded-t-lg', 'border-b');
      }
      
      // Add custom classes to the editor area
      const editor = editorElement.querySelector('.ql-editor');
      if (editor) {
        editor.classList.add('bg-dark-200', 'text-light-100', 'min-h-[300px]');
      }
      
      // Add custom classes to the container
      const container = editorElement.querySelector('.ql-container');
      if (container) {
        container.classList.add('bg-dark-200', 'border-dark-300', 'rounded-b-lg');
      }
    }
  }, [quill, quillRef]);

  // Handle media selection
  const handleMediaSelect = async (files: { fileId: string; url: string; mimeType?: string }[]) => {
    if (!files.length || !quill) return;
    
    const file = files[0];
    const range = quill.getSelection(true);
    
    // Get the preview URL from Appwrite
    const previewUrl = file.url || getFilePreview(file.fileId);
    
    // Insert the image at cursor position
    quill.insertEmbed(range.index, 'image', previewUrl);
    
    // Add the file ID as a data attribute to the image
    setTimeout(() => {
      const imgElements = quill.root.querySelectorAll('img');
      const lastImg = imgElements[imgElements.length - 1];
      if (lastImg) {
        lastImg.setAttribute('data-file-id', file.fileId);
      }
    }, 10);
    
    // Close the media manager
    setShowMediaManager(false);
  };
  return (
    <>
      <div className="quill-editor rounded-lg overflow-hidden border border-input">
        <div ref={quillRef} className="min-h-[400px]" />
      </div>
      
      {showMediaManager && (
        <MediaManager 
          open={showMediaManager}
          onClose={() => setShowMediaManager(false)}
          onSelect={handleMediaSelect}
          allowMultiple={false}
        />
      )}
    </>
  );
};

export default RichTextEditor;
