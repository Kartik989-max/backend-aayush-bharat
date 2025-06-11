'use client';

import { useState, useEffect } from 'react';
import { EditorState, ContentState, convertToRaw, convertFromHTML } from 'draft-js';
import { stateToHTML } from 'draft-js-export-html';
import dynamic from 'next/dynamic';
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';
import '@/styles/rich-text-editor.css';

// Dynamically import the Editor component
const Editor = dynamic(
  () => import('react-draft-wysiwyg').then((mod) => mod.Editor),
  { ssr: false }
);

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
}

const RichTextEditor = ({ content, onChange }: RichTextEditorProps) => {
  const [editorState, setEditorState] = useState(() => {
    if (!content || typeof window === 'undefined') {
      return EditorState.createEmpty();
    }

    try {
      const blocksFromHTML = convertFromHTML(content);
      const contentState = ContentState.createFromBlockArray(
        blocksFromHTML.contentBlocks,
        blocksFromHTML.entityMap
      );
      return EditorState.createWithContent(contentState);
    } catch (e) {
      console.error('Error parsing HTML content:', e);
      return EditorState.createEmpty();
    }
  });  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!content) {
      setEditorState(EditorState.createEmpty());
      return;
    }

    try {
      // Skip update if editor has focus to prevent losing cursor position
      if (document.activeElement?.className?.includes('DraftEditor-root')) {
        return;
      }
      
      // Only update from props if the content is different
      const currentContent = editorState.getCurrentContent();
      const currentHtml = stateToHTML(currentContent);

      if (content !== currentHtml) {
        const blocksFromHTML = convertFromHTML(content);
        const contentState = ContentState.createFromBlockArray(
          blocksFromHTML.contentBlocks,
          blocksFromHTML.entityMap
        );
        setEditorState(EditorState.createWithContent(contentState));
      }
    } catch (e) {
      console.error('Error updating editor state:', e);
    }
  }, [content]); // Remove editorState from dependencies
  const handleEditorChange = (state: EditorState) => {
    try {
      setEditorState(state);
      
      // Convert content to HTML and notify parent component
      const contentState = state.getCurrentContent();
      
      // Check if content has text or is not empty
      if (contentState.hasText() || contentState.getBlockMap().size > 1) {
        const html = stateToHTML(contentState);
        
        // Only call onChange if the content has actually changed
        if (html !== content) {
          onChange(html);
        }
      }
    } catch (e) {
      console.error('Error in editor change handler:', e);
    }
  };  const toolbarOptions = {
    options: ['inline', 'blockType', 'list', 'textAlign', 'link', 'image', 'history'],
    inline: {
      options: ['bold', 'italic', 'underline', 'strikethrough'],
      bold: { className: 'toolbar-btn' },
      italic: { className: 'toolbar-btn' },
      underline: { className: 'toolbar-btn' },
      strikethrough: { className: 'toolbar-btn' },
    },
    blockType: {
      options: ['Normal', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'Blockquote'],
      className: 'toolbar-btn',
    },
    list: {
      options: ['unordered', 'ordered'],
      unordered: { className: 'toolbar-btn' },
      ordered: { className: 'toolbar-btn' },
    },
    textAlign: {
      options: ['left', 'center', 'right'],
      left: { className: 'toolbar-btn' },
      center: { className: 'toolbar-btn' },
      right: { className: 'toolbar-btn' },
    },
    link: {
      options: ['link', 'unlink'],
      className: 'toolbar-btn',
      popupClassName: 'toolbar-popup',
    },
    image: {
      className: 'toolbar-btn',
      popupClassName: 'toolbar-popup',
      urlEnabled: true,
      uploadEnabled: true,
      alignmentEnabled: true,
      uploadCallback: (file: File) => {
        return new Promise((resolve, reject) => {
          // In a real app, upload the file to your server or a third-party service
          // For demo purposes, we'll just create a data URL
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => {
            resolve({ data: { link: reader.result } });
          };
          reader.onerror = error => reject(error);
        });
      },
      previewImage: true,
      inputAccept: 'image/gif,image/jpeg,image/jpg,image/png,image/svg',
      alt: { present: true, mandatory: false },
      defaultSize: {
        height: 'auto',
        width: '100%',
      },
    },
    history: {
      undo: { className: 'toolbar-btn' },
      redo: { className: 'toolbar-btn' },
    },
  };  return (
    <div className="rich-text-editor-container">
      <Editor
        editorState={editorState}
        onEditorStateChange={handleEditorChange}
        toolbar={toolbarOptions}
        editorClassName="px-4 py-3 min-h-[300px] prose dark:prose-invert max-w-none"
        placeholder="Write your blog content here..."
        wrapperClassName="rounded-md border border-input"
        toolbarClassName="sticky top-0 z-10 border-b border-input bg-background flex flex-wrap"
        localization={{
          locale: 'en',
        }}
        stripPastedStyles={false}
        spellCheck={true}
      />
    </div>
  );
};

export default RichTextEditor;
