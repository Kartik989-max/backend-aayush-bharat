import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import {
  EditorState,
  ContentState,
  convertToRaw,
  convertFromHTML,
} from "draft-js";
import { stateToHTML } from "draft-js-export-html";

// Dynamically import react-draft-wysiwyg Editor to avoid SSR issues
const WysiwygEditor = dynamic(
  () => import("react-draft-wysiwyg").then((mod) => mod.Editor),
  {
    ssr: false,
    loading: () => (
      <div className="border rounded p-4 min-h-[150px] bg-gray-50 dark:bg-dark-200">
        Loading editor...
      </div>
    ),
  }
);

// Import the editor styles only on client side
const EditorStyles = () => {
  useEffect(() => {
    // Using try/catch to handle potential import failures
    try {
      // @ts-ignore - Ignoring TypeScript error for CSS import
      import("react-draft-wysiwyg/dist/react-draft-wysiwyg.css");
    } catch (error) {
      console.warn("Could not load rich text editor styles:", error);
    }
  }, []);
  return null;
};

interface RichTextEditorWrapperProps {
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
  placeholder?: string;
  minHeight?: string;
}

export const RichTextEditorWrapper = ({
  value,
  onChange,
  error = false,
  placeholder = "Enter content...",
  minHeight = "150px",
}: RichTextEditorWrapperProps) => {
  const [editorState, setEditorState] = useState(() => {
    if (!value || typeof window === "undefined") {
      return EditorState.createEmpty();
    }

    try {
      const blocksFromHTML = convertFromHTML(value);
      const contentState = ContentState.createFromBlockArray(
        blocksFromHTML.contentBlocks,
        blocksFromHTML.entityMap
      );
      return EditorState.createWithContent(contentState);
    } catch (e) {
      console.error("Error parsing HTML content:", e);
      return EditorState.createEmpty();
    }
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!value) {
      setEditorState(EditorState.createEmpty());
      return;
    }

    try {
      // Only update from props if the content is different
      const currentContent = editorState.getCurrentContent();
      const currentHtml = stateToHTML(currentContent);

      if (value !== currentHtml) {
        const blocksFromHTML = convertFromHTML(value);
        const contentState = ContentState.createFromBlockArray(
          blocksFromHTML.contentBlocks,
          blocksFromHTML.entityMap
        );
        setEditorState(EditorState.createWithContent(contentState));
      }
    } catch (e) {
      console.error("Error updating editor state:", e);
    }
  }, [value]);

  const handleEditorChange = (state: EditorState) => {
    try {
      setEditorState(state);
      const content = state.getCurrentContent();
      const html = stateToHTML(content);
      onChange(html);
    } catch (e) {
      console.error("Error in editor change handler:", e);
    }
  };

  const toolbarOptions = {
    options: ["inline", "blockType", "list", "textAlign", "link", "image", "history"],
    inline: {
      options: ["bold", "italic", "underline", "strikethrough"],
    },
    blockType: {
      options: ["Normal", "H1", "H2", "H3", "H4", "H5", "H6"],
    },
    list: {
      options: ["unordered", "ordered"],
    },
    textAlign: {
      options: ["left", "center", "right"],
    },
  };

  return (
    <>
      <EditorStyles />
      <div 
        className={`border rounded-md overflow-hidden ${
          error ? "border-red-500" : "border-gray-300 dark:border-dark-300"
        }`}
      >
        <WysiwygEditor
          editorState={editorState}
          onEditorStateChange={handleEditorChange}
          toolbar={toolbarOptions}
          editorClassName={`px-3 py-2 min-h-[${minHeight}] bg-white dark:bg-dark-200 text-black dark:text-white`}
          placeholder={placeholder}
          wrapperClassName="wrapper-class"
          toolbarClassName="!border-0 !border-b !border-gray-300 dark:!border-dark-300 !bg-gray-50 dark:!bg-dark-100 !rounded-none"
        />
      </div>
    </>
  );
};

// Define a simpler fallback component for when there are issues
export const SimpleRichTextEditor = ({
  value,
  onChange,
  error = false,
  placeholder = "Enter content...",
}: RichTextEditorWrapperProps) => {
  return (
    <div
      className={`border rounded p-4 ${
        error ? "border-red-500" : "border-gray-300 dark:border-dark-300"
      }`}
    >
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="min-h-[150px] w-full bg-transparent resize-y outline-none"
      />
    </div>
  );
};

// Add new component for displaying HTML content safely
export const RichTextDisplay = ({ 
  content,
  className = ""
}: { 
  content: string,
  className?: string 
}) => {
  return (
    <div
      className={`rich-text-content ${className}`}
      dangerouslySetInnerHTML={{ __html: content }}
      style={{
        lineHeight: "1.5",
      }}
    />
  );
};