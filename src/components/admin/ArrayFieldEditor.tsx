'use client';

import React, { useState } from 'react';

interface ArrayFieldEditorProps {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
}

export default function ArrayFieldEditor({ label, values, onChange, placeholder }: ArrayFieldEditorProps) {
  const [newItem, setNewItem] = useState('');

  const addItem = () => {
    if (newItem.trim()) {
      onChange([...values, newItem.trim()]);
      setNewItem('');
    }
  };

  const removeItem = (index: number) => {
    onChange(values.filter((_, i) => i !== index));
  };

  const moveUp = (index: number) => {
    if (index > 0) {
      const newValues = [...values];
      [newValues[index - 1], newValues[index]] = [newValues[index], newValues[index - 1]];
      onChange(newValues);
    }
  };

  const moveDown = (index: number) => {
    if (index < values.length - 1) {
      const newValues = [...values];
      [newValues[index], newValues[index + 1]] = [newValues[index + 1], newValues[index]];
      onChange(newValues);
    }
  };

  const updateItem = (index: number, value: string) => {
    const newValues = [...values];
    newValues[index] = value;
    onChange(newValues);
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      
      {/* Existing items */}
      <div className="space-y-2">
        {values.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <input
              type="text"
              value={item}
              onChange={(e) => updateItem(index, e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
            />
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => moveUp(index)}
                disabled={index === 0}
                className="px-2 py-1 text-sm bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded"
                title="Move up"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => moveDown(index)}
                disabled={index === values.length - 1}
                className="px-2 py-1 text-sm bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded"
                title="Move down"
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() => removeItem(index)}
                className="px-2 py-1 text-sm bg-red-100 hover:bg-red-200 text-red-700 rounded"
                title="Remove"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add new item */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addItem())}
          placeholder={placeholder || `Add new ${label.toLowerCase()}`}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
        />
        <button
          type="button"
          onClick={addItem}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
        >
          Add
        </button>
      </div>
    </div>
  );
}

