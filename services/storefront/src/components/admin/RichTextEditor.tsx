'use client';

import React, { useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
}

export default function RichTextEditor({ value, onChange, placeholder, label }: RichTextEditorProps) {
  const [showPreview, setShowPreview] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
      }),
      Placeholder.configure({
        placeholder: placeholder || 'Write your description here...',
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  if (!editor) {
    return null;
  }

  return (
    <div className="space-y-2">
      {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}
      
      {/* Toggle Preview Button */}
      <div className="flex justify-between items-center border-b border-gray-300 pb-2">
        <div className="flex gap-1">
          {!showPreview && (
            <>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={`px-3 py-1 text-sm rounded ${editor.isActive('bold') ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                title="Bold"
              >
                <strong>B</strong>
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={`px-3 py-1 text-sm rounded ${editor.isActive('italic') ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                title="Italic"
              >
                <em>I</em>
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={`px-3 py-1 text-sm rounded ${editor.isActive('bulletList') ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                title="Bullet List"
              >
                • List
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                className={`px-3 py-1 text-sm rounded ${editor.isActive('orderedList') ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                title="Numbered List"
              >
                1. List
              </button>
            </>
          )}
        </div>
        <button
          type="button"
          onClick={() => setShowPreview(!showPreview)}
          className="px-4 py-1 text-sm bg-gray-600 hover:bg-gray-700 text-white rounded"
        >
          {showPreview ? 'Edit' : 'Preview'}
        </button>
      </div>

      {/* Editor or Preview */}
      {showPreview ? (
        <div 
          className="prose max-w-none p-4 border border-gray-300 rounded-md min-h-[200px] bg-gray-50"
          dangerouslySetInnerHTML={{ __html: value || '<p class="text-gray-400">No content to preview</p>' }}
        />
      ) : (
        <EditorContent 
          editor={editor}
          className="prose max-w-none p-4 border border-gray-300 rounded-md min-h-[200px] focus-within:ring-2 focus-within:ring-blue-500"
        />
      )}
    </div>
  );
}

