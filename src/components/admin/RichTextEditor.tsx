'use client';

import React, { useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { 
  Bold, Italic, Underline as UnderlineIcon, List, ListOrdered, 
  Link2, Image as ImageIcon, AlignLeft, AlignCenter, AlignRight, 
  Heading1, Heading2, Heading3, Highlighter, Palette, Undo, Redo
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
}

export default function RichTextEditor({ value, onChange, placeholder, label }: RichTextEditorProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline',
        },
      }),
      Placeholder.configure({
        placeholder: placeholder || 'Write your description here...',
      }),
      Image.configure({
        inline: true,
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg',
        },
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Highlight.configure({
        multicolor: true,
      }),
      TextStyle,
      Color,
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  if (!editor) {
    return null;
  }

  const addLink = () => {
    if (linkUrl) {
      try {
        const url = new URL(linkUrl);
        // Only allow http and https protocols
        if (!['http:', 'https:'].includes(url.protocol)) {
          return; // Silently ignore invalid protocols
        }
        editor.chain().focus().setLink({ href: linkUrl }).run();
        setLinkUrl('');
        setShowLinkDialog(false);
      } catch {
        // Invalid URL, don't add
      }
    }
  };

  const addImage = () => {
    if (imageUrl) {
      try {
        const url = new URL(imageUrl);
        // Only allow http and https protocols for security
        if (!['http:', 'https:'].includes(url.protocol)) {
          return; // Silently ignore invalid protocols
        }
        editor.chain().focus().setImage({ src: imageUrl }).run();
        setImageUrl('');
        setShowImageDialog(false);
      } catch {
        // Invalid URL, don't add
      }
    }
  };

  return (
    <div className="space-y-2">
      {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}
      
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1 border border-gray-300 bg-gray-50 p-2 rounded-t-md">
        {!showPreview && (
          <>
            {/* Text formatting */}
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('bold') ? 'bg-blue-600 text-white' : 'bg-white'}`}
              title="Bold"
            >
              <Bold className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('italic') ? 'bg-blue-600 text-white' : 'bg-white'}`}
              title="Italic"
            >
              <Italic className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('underline') ? 'bg-blue-600 text-white' : 'bg-white'}`}
              title="Underline"
            >
              <UnderlineIcon className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleHighlight().run()}
              className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('highlight') ? 'bg-blue-600 text-white' : 'bg-white'}`}
              title="Highlight"
            >
              <Highlighter className="w-4 h-4" />
            </button>

            <div className="w-px bg-gray-300 mx-1" />

            {/* Headings */}
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('heading', { level: 1 }) ? 'bg-blue-600 text-white' : 'bg-white'}`}
              title="Heading 1"
            >
              <Heading1 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('heading', { level: 2 }) ? 'bg-blue-600 text-white' : 'bg-white'}`}
              title="Heading 2"
            >
              <Heading2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('heading', { level: 3 }) ? 'bg-blue-600 text-white' : 'bg-white'}`}
              title="Heading 3"
            >
              <Heading3 className="w-4 h-4" />
            </button>

            <div className="w-px bg-gray-300 mx-1" />

            {/* Lists */}
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('bulletList') ? 'bg-blue-600 text-white' : 'bg-white'}`}
              title="Bullet List"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('orderedList') ? 'bg-blue-600 text-white' : 'bg-white'}`}
              title="Numbered List"
            >
              <ListOrdered className="w-4 h-4" />
            </button>

            <div className="w-px bg-gray-300 mx-1" />

            {/* Alignment */}
            <button
              type="button"
              onClick={() => editor.chain().focus().setTextAlign('left').run()}
              className={`p-2 rounded hover:bg-gray-200 ${editor.isActive({ textAlign: 'left' }) ? 'bg-blue-600 text-white' : 'bg-white'}`}
              title="Align Left"
            >
              <AlignLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().setTextAlign('center').run()}
              className={`p-2 rounded hover:bg-gray-200 ${editor.isActive({ textAlign: 'center' }) ? 'bg-blue-600 text-white' : 'bg-white'}`}
              title="Align Center"
            >
              <AlignCenter className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().setTextAlign('right').run()}
              className={`p-2 rounded hover:bg-gray-200 ${editor.isActive({ textAlign: 'right' }) ? 'bg-blue-600 text-white' : 'bg-white'}`}
              title="Align Right"
            >
              <AlignRight className="w-4 h-4" />
            </button>

            <div className="w-px bg-gray-300 mx-1" />

            {/* Link and Image */}
            <button
              type="button"
              onClick={() => setShowLinkDialog(true)}
              className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('link') ? 'bg-blue-600 text-white' : 'bg-white'}`}
              title="Add Link"
            >
              <Link2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setShowImageDialog(true)}
              className="p-2 rounded hover:bg-gray-200 bg-white"
              title="Add Image"
            >
              <ImageIcon className="w-4 h-4" />
            </button>

            <div className="w-px bg-gray-300 mx-1" />

            {/* Undo/Redo */}
            <button
              type="button"
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              className="p-2 rounded hover:bg-gray-200 bg-white disabled:opacity-30"
              title="Undo"
            >
              <Undo className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              className="p-2 rounded hover:bg-gray-200 bg-white disabled:opacity-30"
              title="Redo"
            >
              <Redo className="w-4 h-4" />
            </button>
          </>
        )}

        <div className="flex-1" />

        {/* Preview Toggle */}
        <button
          type="button"
          onClick={() => setShowPreview(!showPreview)}
          className="px-4 py-1 text-sm bg-gray-600 hover:bg-gray-700 text-white rounded"
        >
          {showPreview ? '✏️ Edit' : '👁️ Preview'}
        </button>
      </div>

      {/* Editor or Preview */}
      {showPreview ? (
        <div 
          className="prose prose-slate max-w-none p-4 border border-gray-300 rounded-b-md min-h-[200px] bg-white text-gray-900"
          dangerouslySetInnerHTML={{ __html: value || '<p class="text-gray-400">No content to preview</p>' }}
        />
      ) : (
        <EditorContent 
          editor={editor}
          className="prose prose-slate max-w-none p-4 border border-gray-300 rounded-b-md min-h-[200px] bg-white text-gray-900 focus-within:ring-2 focus-within:ring-blue-500 [&_.ProseMirror]:text-gray-900 [&_.ProseMirror]:outline-none [&_.ProseMirror_p.is-editor-empty:first-child::before]:text-gray-400"
        />
      )}

      {/* Link Dialog */}
      {showLinkDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <h3 className="text-lg font-medium mb-4 text-gray-900">Add Link</h3>
            <input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addLink()}
              placeholder="https://example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4 text-gray-900 placeholder:text-gray-400"
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowLinkDialog(false);
                  setLinkUrl('');
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={addLink}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
              >
                Add Link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Dialog */}
      {showImageDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <h3 className="text-lg font-medium mb-4 text-gray-900">Add Image</h3>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addImage()}
              placeholder="https://example.com/image.jpg"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4 text-gray-900 placeholder:text-gray-400"
              autoFocus
            />
            {imageUrl && (
              <div className="mb-4 border border-gray-200 rounded-md p-2">
                <p className="text-xs text-gray-500 mb-2">Preview:</p>
                <img src={imageUrl} alt="Preview" className="max-w-full h-auto rounded" />
              </div>
            )}
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowImageDialog(false);
                  setImageUrl('');
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={addImage}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
              >
                Add Image
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

