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
  });
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!content) {
      setEditorState(EditorState.createEmpty());
      return;
    }

    try {
      // Only update from props if the content is different and the component is mounted
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
  }, [content, editorState]);

  const handleEditorChange = (state: EditorState) => {
    try {
      setEditorState(state);
      const content = state.getCurrentContent();
      const html = stateToHTML(content);
      onChange(html);
    } catch (e) {
      console.error('Error in editor change handler:', e);
    }
  };
  const toolbarOptions = {
    options: ['inline', 'blockType', 'fontSize', 'list', 'textAlign', 'colorPicker', 'link', 'embedded', 'emoji', 'image', 'history'],
    inline: {
      options: ['bold', 'italic', 'underline', 'strikethrough', 'monospace', 'superscript', 'subscript'],
      bold: { className: 'toolbar-btn' },
      italic: { className: 'toolbar-btn' },
      underline: { className: 'toolbar-btn' },
      strikethrough: { className: 'toolbar-btn' },
      monospace: { className: 'toolbar-btn' },
      superscript: { className: 'toolbar-btn' },
      subscript: { className: 'toolbar-btn' },
    },
    blockType: {
      options: ['Normal', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'Blockquote', 'Code'],
      className: 'toolbar-btn',
    },
    fontSize: {
      options: [8, 9, 10, 11, 12, 14, 16, 18, 24, 30, 36, 48, 60, 72, 96],
      className: 'toolbar-btn',
    },
    list: {
      options: ['unordered', 'ordered', 'indent', 'outdent'],
      unordered: { className: 'toolbar-btn' },
      ordered: { className: 'toolbar-btn' },
      indent: { className: 'toolbar-btn' },
      outdent: { className: 'toolbar-btn' },
    },
    textAlign: {
      options: ['left', 'center', 'right', 'justify'],
      left: { className: 'toolbar-btn' },
      center: { className: 'toolbar-btn' },
      right: { className: 'toolbar-btn' },
      justify: { className: 'toolbar-btn' },
    },
    colorPicker: {
      className: 'toolbar-btn',
      popupClassName: 'toolbar-popup',
    },
    link: {
      options: ['link', 'unlink'],
      className: 'toolbar-btn',
      popupClassName: 'toolbar-popup',
    },
    emoji: {
      className: 'toolbar-btn',
      popupClassName: 'toolbar-popup',
    },
    embedded: {
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
  };
  return (
    <div className="rich-text-editor-container">
      <Editor
        editorState={editorState}
        onEditorStateChange={handleEditorChange}
        toolbar={toolbarOptions}
        editorClassName="px-4 py-3 min-h-[300px] prose dark:prose-invert max-w-none"
        placeholder="Write your blog content here..."
        wrapperClassName="rounded-md border border-input"
        toolbarClassName="sticky top-0 z-10 border-b border-input bg-background"
        localization={{
          locale: 'en',
        }}
      />
    </div>
  );
};

export default RichTextEditor;
