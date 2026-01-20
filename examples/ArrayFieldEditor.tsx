'use client'

import { useState, useEffect } from 'react'

interface ArrayFieldEditorProps {
  value: string[]
  onChange: (value: string[]) => void
  label: string
  placeholder?: string
  maxItems?: number
}

/**
 * Array Field Editor Component
 * 
 * Allows editing of array fields like specs and features.
 * Supports add, remove, and reorder operations.
 * 
 * Usage:
 * <ArrayFieldEditor 
 *   value={editForm.specs} 
 *   onChange={(specs) => setEditForm({ ...editForm, specs })}
 *   label="Specifications"
 *   placeholder="e.g., Max Speed: 50 km/h"
 * />
 */
export default function ArrayFieldEditor({ 
  value, 
  onChange, 
  label, 
  placeholder = 'Enter value...',
  maxItems = 10 
}: ArrayFieldEditorProps) {
  const [items, setItems] = useState<string[]>(value || [])

  // Sync with parent when value changes
  useEffect(() => {
    setItems(value || [])
  }, [value])

  const addItem = () => {
    if (items.length < maxItems) {
      const newItems = [...items, '']
      setItems(newItems)
      onChange(newItems)
    }
  }

  const removeItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index)
    setItems(newItems)
    onChange(newItems)
  }

  const updateItem = (index: number, newValue: string) => {
    const newItems = [...items]
    newItems[index] = newValue
    setItems(newItems)
    onChange(newItems)
  }

  const moveItem = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === items.length - 1)
    ) {
      return
    }

    const newItems = [...items]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    ;[newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]]
    setItems(newItems)
    onChange(newItems)
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
        <span className="text-xs text-gray-500">
          {items.length}/{maxItems} items
        </span>
      </div>

      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={index} className="flex gap-2 items-center">
            <input
              type="text"
              value={item}
              onChange={(e) => updateItem(index, e.target.value)}
              placeholder={placeholder}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
            
            {/* Move buttons */}
            <div className="flex flex-col gap-1">
              <button
                type="button"
                onClick={() => moveItem(index, 'up')}
                disabled={index === 0}
                className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                title="Move up"
              >
                ▲
              </button>
              <button
                type="button"
                onClick={() => moveItem(index, 'down')}
                disabled={index === items.length - 1}
                className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                title="Move down"
              >
                ▼
              </button>
            </div>

            {/* Remove button */}
            <button
              type="button"
              onClick={() => removeItem(index)}
              className="text-red-600 hover:text-red-800 font-bold text-xl w-8 h-8 flex items-center justify-center"
              title="Remove"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {items.length < maxItems && (
        <button
          type="button"
          onClick={addItem}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          + Add {label}
        </button>
      )}

      {items.length === 0 && (
        <p className="text-sm text-gray-500 italic">
          No {label.toLowerCase()} added yet. Click "Add {label}" to get started.
        </p>
      )}
    </div>
  )
}

