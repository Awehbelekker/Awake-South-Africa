# Awake Boards SA - Admin Dashboard Comprehensive Audit

**Date:** January 19, 2026  
**Project:** Awake Boards SA E-commerce Platform  
**Scope:** Admin Dashboard Product Management System

---

## Executive Summary

The current admin dashboard (`/services/storefront/src/app/admin/products/page.tsx`) provides basic product editing capabilities but has significant gaps in functionality, user experience, and integration with the Medusa backend. This audit identifies **23 critical improvements** across 5 key areas, prioritized by impact and complexity.

**Current State:**
- ✅ Basic inline editing for simple fields (name, price, stock)
- ✅ Cost tracking and margin calculations
- ✅ Category filtering
- ⚠️ localStorage-based (disconnected from Medusa backend)
- ❌ No image upload system
- ❌ No rich text editing for descriptions
- ❌ No array field editing (specs, features)
- ❌ Missing CRUD operations (Create, Delete)
- ❌ No bulk operations
- ❌ No validation or error handling

**Recommended Priority:**
1. **Phase 1 (Weeks 1-2):** Medusa API Integration + Enhanced Form Controls
2. **Phase 2 (Weeks 3-4):** Image Management System + Rich Text Editor
3. **Phase 3 (Weeks 5-6):** Missing Features + Bulk Operations
4. **Phase 4 (Week 7+):** Advanced Features + Optimization

---

## 1. Product Editing Components Analysis

### 1.1 Current Implementation Review

**File:** `services/storefront/src/app/admin/products/page.tsx`

**Current Capabilities:**
```typescript
// Inline editing for basic fields (lines 131-220)
- ✅ Text input: name, image URL
- ✅ Number input: price, costEUR, stockQuantity
- ✅ Textarea: description (basic, no formatting)
- ✅ File upload: image (converts to base64 data URL)
- ✅ Real-time margin/profit calculations
```

**Critical Issues Identified:**

| Issue | Severity | Impact | Current Code Location |
|-------|----------|--------|----------------------|
| No validation on save | 🔴 High | Data corruption risk | Line 39-45 |
| No error handling | 🔴 High | Poor UX, silent failures | Line 39-45 |
| Base64 image storage | 🔴 High | localStorage bloat, performance | Line 144-158 |
| No array field editing | 🔴 High | Can't edit specs/features | Missing |
| No modal for complex edits | 🟡 Medium | Poor UX for long content | Missing |
| No unsaved changes warning | 🟡 Medium | Data loss risk | Missing |
| No loading states | 🟡 Medium | Confusing UX | Missing |

### 1.2 Field-by-Field Analysis

#### Simple Fields (Working)
```typescript
// ✅ Name, Price, CostEUR, Stock - Basic inputs work
<input type="text" value={editForm.name} onChange={...} />
<input type="number" value={editForm.price} onChange={...} />
```

#### Complex Fields (Broken/Missing)

**1. Specs Array (Missing Editor)**
```typescript
// Current: specs?: string[] - NO UI TO EDIT
// Location: EditableProduct interface (products.ts:19)
// Example data: ["Max Speed: 50 km/h", "Battery: 65 min", "Weight: 32 kg"]
```

**Recommendation:** Dynamic array input with add/remove buttons

```typescript
// RECOMMENDED IMPLEMENTATION
const ArrayFieldEditor = ({ value, onChange, label }: {
  value: string[],
  onChange: (val: string[]) => void,
  label: string
}) => {
  const [items, setItems] = useState(value || [])

  const addItem = () => setItems([...items, ''])
  const removeItem = (idx: number) => {
    const newItems = items.filter((_, i) => i !== idx)
    setItems(newItems)
    onChange(newItems)
  }
  const updateItem = (idx: number, val: string) => {
    const newItems = [...items]
    newItems[idx] = val
    setItems(newItems)
    onChange(newItems)
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      {items.map((item, idx) => (
        <div key={idx} className="flex gap-2">
          <input
            value={item}
            onChange={(e) => updateItem(idx, e.target.value)}
            className="flex-1 px-2 py-1 border rounded"
          />
          <button onClick={() => removeItem(idx)} className="text-red-600">×</button>
        </div>
      ))}
      <button onClick={addItem} className="text-blue-600 text-sm">+ Add {label}</button>
    </div>
  )
}

// Usage in edit form:
<ArrayFieldEditor
  value={editForm.specs}
  onChange={(specs) => setEditForm({ ...editForm, specs })}
  label="Specifications"
/>
```

**2. Features Array (Missing Editor)**
```typescript
// Current: features?: string[] - NO UI TO EDIT
// Same issue as specs - needs array editor component
```

**3. Description Field (Inadequate)**
```typescript
// Current: Basic textarea (line 169-174)
<textarea value={editForm.description} rows={3} />

// Issues:
// - No formatting support (bold, lists, links)
// - No preview mode
// - Limited to 3 rows (cramped for long descriptions)
// - No character count
```

**Recommendation:** See Section 3 for Rich Text Editor implementation

**4. Image Field (Problematic)**
```typescript
// Current implementation (lines 134-158):
// - Text input for URL
// - File upload converts to base64 data URL
// - Stores in localStorage (MAJOR ISSUE)

// Problems:
// ❌ Base64 bloats localStorage (5MB limit)
// ❌ No image optimization
// ❌ No multiple images support
// ❌ No gallery management
// ❌ Poor performance with large images
```

**Recommendation:** See Section 2 for complete Image Management solution

### 1.3 Validation & Error Handling (Missing)

**Current State:** NO validation or error handling

```typescript
// Current save function (lines 39-45) - NO VALIDATION!
const saveEdit = () => {
  if (editingId) {
    updateProduct(editingId, editForm)  // ❌ No validation
    setEditingId(null)
    setEditForm({})
  }
}
```

**Recommended Validation Layer:**

```typescript
// RECOMMENDED: Comprehensive validation
import { z } from 'zod'

const ProductSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').max(100),
  price: z.number().positive('Price must be positive').max(10000000),
  priceExVAT: z.number().positive(),
  costEUR: z.number().positive().optional(),
  description: z.string().min(10, 'Description too short').max(2000),
  stockQuantity: z.number().int().min(0, 'Stock cannot be negative'),
  image: z.string().url('Invalid image URL').optional(),
  specs: z.array(z.string()).min(1, 'At least one spec required'),
  features: z.array(z.string()).min(1, 'At least one feature required'),
})

const saveEdit = () => {
  try {
    // Validate form data
    const validated = ProductSchema.parse(editForm)

    // Calculate derived fields
    const priceExVAT = validated.price / 1.15
    const costZAR = validated.costEUR ? validated.costEUR * settings.exchangeRate : 0

    // Save to store (or API)
    updateProduct(editingId, { ...validated, priceExVAT })

    // Success feedback
    toast.success('Product updated successfully')
    setEditingId(null)
    setEditForm({})
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Show validation errors
      setErrors(error.flatten().fieldErrors)
      toast.error('Please fix validation errors')
    } else {
      toast.error('Failed to save product')
      console.error(error)
    }
  }
}
```

**Required Dependencies:**
```bash
npm install zod react-hot-toast
```

### 1.4 Inline vs Modal Editing Comparison

**Current:** 100% inline editing (cramped, poor UX for complex fields)

**Recommendation:** Hybrid approach

| Field Type | Approach | Rationale |
|------------|----------|-----------|
| Name, Price, Stock | Inline | Quick edits, simple fields |
| Description | Modal | Long content, needs rich text |
| Specs, Features | Modal | Array editing needs space |
| Images | Modal | Gallery management, cropping |
| All fields together | Modal | Comprehensive editing |

**Recommended Modal Implementation:**

```typescript
// ProductEditModal.tsx
'use client'

import { Dialog, Transition } from '@headlessui/react'
import { Fragment, useState } from 'react'
import { EditableProduct } from '@/store/products'

interface Props {
  product: EditableProduct
  isOpen: boolean
  onClose: () => void
  onSave: (product: EditableProduct) => void
}

export default function ProductEditModal({ product, isOpen, onClose, onSave }: Props) {
  const [form, setForm] = useState(product)
  const [activeTab, setActiveTab] = useState<'basic' | 'details' | 'images'>('basic')

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all">
                <Dialog.Title className="text-2xl font-bold mb-4">
                  Edit Product: {product.name}
                </Dialog.Title>

                {/* Tabs */}
                <div className="border-b mb-6">
                  <nav className="flex gap-4">
                    {['basic', 'details', 'images'].map(tab => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab as any)}
                        className={`pb-2 px-1 ${activeTab === tab ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
                      >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                      </button>
                    ))}
                  </nav>
                </div>

                {/* Tab Content */}
                <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                  {activeTab === 'basic' && (
                    <BasicFieldsTab form={form} setForm={setForm} />
                  )}
                  {activeTab === 'details' && (
                    <DetailsTab form={form} setForm={setForm} />
                  )}
                  {activeTab === 'images' && (
                    <ImagesTab form={form} setForm={setForm} />
                  )}
                </div>

                {/* Actions */}
                <div className="mt-6 flex justify-end gap-3">
                  <button onClick={onClose} className="px-4 py-2 border rounded">
                    Cancel
                  </button>
                  <button
                    onClick={() => onSave(form)}
                    className="px-4 py-2 bg-blue-600 text-white rounded"
                  >
                    Save Changes
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
```

**Required Dependencies:**
```bash
npm install @headlessui/react
```

---

## 2. Image Management System Evaluation

### 2.1 Current State Analysis

**Current Implementation Issues:**

```typescript
// Current image handling (lines 134-158 in page.tsx)
<input
  type="text"
  value={editForm.image}
  onChange={(e) => setEditForm({ ...editForm, image: e.target.value })}
  placeholder="Image URL or paste from clipboard"
/>
<input
  type="file"
  accept="image/*"
  onChange={async (e) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setEditForm({ ...editForm, image: reader.result as string })  // ❌ BASE64!
      }
      reader.readAsDataURL(file)
    }
  }}
/>
```

**Problems:**

| Issue | Impact | Severity |
|-------|--------|----------|
| Base64 storage in localStorage | 5MB limit, crashes with multiple images | 🔴 Critical |
| No image optimization | Slow page loads, poor performance | 🔴 High |
| Single image only | Can't show product from multiple angles | 🔴 High |
| No image preview/gallery | Poor UX, can't see what's uploaded | 🟡 Medium |
| No cropping/resizing | Images inconsistent sizes | 🟡 Medium |
| No CDN integration | Slow image delivery | 🟢 Low |

### 2.2 Medusa File Plugin Integration

**Available Infrastructure:**

```javascript
// medusa-config.js (lines 39-44)
{
  resolve: `@medusajs/file-local`,
  options: {
    upload_dir: "uploads",  // ✅ Already configured!
  },
}
```

**Medusa File Service API:**

```typescript
// Available endpoints (Medusa built-in):
POST /admin/uploads          // Upload file
DELETE /admin/uploads/:id    // Delete file
GET /uploads/:filename       // Serve file

// File service methods:
fileService.upload(file)     // Returns { url, key }
fileService.delete(fileKey)  // Deletes file
```

### 2.3 Recommended Image Management Solution

**Architecture:**

```
┌─────────────────────────────────────────────────────────────┐
│ Admin UI (Next.js Storefront)                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ ImageUploadComponent                                 │   │
│  │  - Drag & drop                                       │   │
│  │  - Multiple files                                    │   │
│  │  - Preview before upload                             │   │
│  │  - Client-side validation (size, type)               │   │
│  └──────────────────────────────────────────────────────┘   │
│                          │                                   │
│                          ▼                                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ API Route: /api/admin/upload                         │   │
│  │  - Resize/optimize images (sharp)                    │   │
│  │  - Generate thumbnails                               │   │
│  │  - Upload to Medusa backend                          │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ Medusa Backend                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ @medusajs/file-local                                 │   │
│  │  - Stores in /uploads directory                      │   │
│  │  - Returns public URL                                │   │
│  │  - Handles file management                           │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ Product Data (PostgreSQL)                                   │
│  {                                                          │
│    images: [                                                │
│      "http://localhost:9000/uploads/product-1-main.jpg",   │
│      "http://localhost:9000/uploads/product-1-side.jpg",   │
│      "http://localhost:9000/uploads/product-1-top.jpg"     │
│    ]                                                        │
│  }                                                          │
└─────────────────────────────────────────────────────────────┘
```

**Implementation Steps:**

**Step 1: Install Dependencies**

```bash
cd services/storefront
npm install react-dropzone sharp
npm install -D @types/react-dropzone
```

**Step 2: Create Image Upload Component**

```typescript
// services/storefront/src/components/admin/ImageUpload.tsx
'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import Image from 'next/image'

interface ImageUploadProps {
  images: string[]
  onChange: (images: string[]) => void
  maxImages?: number
}

export default function ImageUpload({ images, onChange, maxImages = 5 }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setUploading(true)
    setError(null)

    try {
      const uploadPromises = acceptedFiles.map(async (file) => {
        // Client-side validation
        if (file.size > 5 * 1024 * 1024) {
          throw new Error(`${file.name} is too large (max 5MB)`)
        }

        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch('/api/admin/upload', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          throw new Error(`Upload failed: ${response.statusText}`)
        }

        const data = await response.json()
        return data.url
      })

      const uploadedUrls = await Promise.all(uploadPromises)
      onChange([...images, ...uploadedUrls].slice(0, maxImages))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }, [images, onChange, maxImages])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    maxFiles: maxImages - images.length,
    disabled: uploading || images.length >= maxImages,
  })

  const removeImage = (index: number) => {
    onChange(images.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-4">
      {/* Upload Zone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
        } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input {...getInputProps()} />
        {uploading ? (
          <p className="text-gray-600">Uploading...</p>
        ) : isDragActive ? (
          <p className="text-blue-600">Drop images here...</p>
        ) : (
          <div>
            <p className="text-gray-600">Drag & drop images here, or click to select</p>
            <p className="text-sm text-gray-500 mt-2">
              {images.length}/{maxImages} images • Max 5MB per image
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Image Gallery */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {images.map((url, index) => (
            <div key={index} className="relative group">
              <Image
                src={url}
                alt={`Product image ${index + 1}`}
                width={200}
                height={200}
                className="w-full h-40 object-cover rounded-lg"
              />
              <button
                onClick={() => removeImage(index)}
                className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ×
              </button>
              {index === 0 && (
                <span className="absolute bottom-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                  Main
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

**Step 3: Create Upload API Route**

```typescript
// services/storefront/src/app/api/admin/upload/route.ts
import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Convert to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Optimize image with sharp
    const optimized = await sharp(buffer)
      .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer()

    // Upload to Medusa backend
    const medusaFormData = new FormData()
    medusaFormData.append('files', new Blob([optimized], { type: 'image/jpeg' }), file.name)

    const medusaUrl = process.env.NEXT_PUBLIC_MEDUSA_URL || 'http://localhost:9000'
    const response = await fetch(`${medusaUrl}/admin/uploads`, {
      method: 'POST',
      body: medusaFormData,
      headers: {
        // Add admin authentication here when integrated
        // 'Authorization': `Bearer ${adminToken}`
      },
    })

    if (!response.ok) {
      throw new Error('Medusa upload failed')
    }

    const data = await response.json()
    const uploadedUrl = data.uploads[0].url

    return NextResponse.json({
      url: uploadedUrl,
      success: true
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Upload failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
```

**Step 4: Update Product Model for Multiple Images**

```typescript
// services/storefront/src/store/products.ts
export interface EditableProduct {
  id: string
  name: string
  price: number
  priceExVAT: number
  costEUR?: number
  category: string
  categoryTag?: string
  description?: string
  image?: string  // Keep for backward compatibility
  images?: string[]  // ✅ NEW: Multiple images
  badge?: string
  battery?: string
  skillLevel?: string
  specs?: string[]
  features?: string[]
  inStock: boolean
  stockQuantity: number
}
```

**Step 5: Update next.config.js for Medusa Uploads**

```javascript
// services/storefront/next.config.js
const nextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost', port: '9000', pathname: '/uploads/**' },  // ✅ Already configured
      { protocol: 'https', hostname: '*.awakeboards.com', pathname: '/**' },
      { protocol: 'https', hostname: 'awakeboards.com', pathname: '/**' },
      { protocol: 'https', hostname: '*.awakesa.co.za', pathname: '/**' },
      // Add production Medusa URL when deployed
      // { protocol: 'https', hostname: 'api.awakesa.co.za', pathname: '/uploads/**' },
    ],
  },
}
```

### 2.4 Migration Strategy: Static URLs → Dynamic Uploads

**Phase 1: Dual Support (Weeks 1-2)**
- Keep existing static URLs from Awake website
- Add `images` array field alongside `image` field
- Admin can add new images via upload
- Display logic: `images?.[0] || image` (fallback to old field)

**Phase 2: Gradual Migration (Weeks 3-4)**
- Download existing Awake images
- Re-upload through new system
- Update product records with new URLs
- Keep old URLs as backup

**Phase 3: Full Transition (Week 5+)**
- All products using uploaded images
- Remove `image` field (keep `images` only)
- Clean up old static URL references

**Migration Script:**

```typescript
// scripts/migrate-images.ts
import { useProductsStore } from '@/store/products'

async function migrateProductImages() {
  const { products, updateProduct } = useProductsStore.getState()

  for (const product of products) {
    if (product.image && !product.images) {
      // Download image from Awake website
      const response = await fetch(product.image)
      const blob = await response.blob()

      // Upload to Medusa
      const formData = new FormData()
      formData.append('file', blob, `${product.id}-main.jpg`)

      const uploadResponse = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      })

      const { url } = await uploadResponse.json()

      // Update product
      updateProduct(product.id, {
        images: [url],
        image: url,  // Keep for backward compatibility
      })

      console.log(`Migrated ${product.name}`)
    }
  }
}
```

---

## 3. Product Description and Content Editor

### 3.1 Current Implementation Issues

**Current:** Basic `<textarea>` (line 169-174)

```typescript
<textarea
  value={editForm.description}
  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
  className="w-full px-2 py-1 border rounded text-sm"
  rows={3}  // ❌ Only 3 rows!
/>
```

**Problems:**
- ❌ No formatting (bold, italic, lists, links)
- ❌ No preview mode
- ❌ Cramped (3 rows for potentially long descriptions)
- ❌ No markdown support
- ❌ Poor mobile experience

### 3.2 Rich Text Editor Comparison

| Editor | Pros | Cons | Size | Recommendation |
|--------|------|------|------|----------------|
| **TinyMCE** | Full-featured, WYSIWYG | Heavy (500KB+), complex | 🔴 Large | ❌ Overkill |
| **Quill** | Clean UI, modular | Limited customization | 🟡 Medium | ⚠️ Acceptable |
| **React-Markdown + SimpleMDE** | Lightweight, markdown | Learning curve for users | 🟢 Small | ✅ **RECOMMENDED** |
| **Tiptap** | Modern, extensible | Newer, less mature | 🟡 Medium | ✅ **BEST CHOICE** |

### 3.3 Recommended Solution: Tiptap Editor

**Why Tiptap:**
- ✅ Modern React-first design
- ✅ Headless (full styling control)
- ✅ Extensible (add features as needed)
- ✅ TypeScript support
- ✅ Mobile-friendly
- ✅ Markdown shortcuts
- ✅ ~100KB gzipped

**Installation:**

```bash
cd services/storefront
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-link @tiptap/extension-placeholder
```

**Implementation:**

```typescript
// services/storefront/src/components/admin/RichTextEditor.tsx
'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'

interface RichTextEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
}

export default function RichTextEditor({ content, onChange, placeholder }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: placeholder || 'Write product description...' }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
  })

  if (!editor) return null

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="bg-gray-50 border-b p-2 flex gap-1 flex-wrap">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`px-3 py-1 rounded ${editor.isActive('bold') ? 'bg-blue-600 text-white' : 'bg-white'}`}
        >
          <strong>B</strong>
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`px-3 py-1 rounded ${editor.isActive('italic') ? 'bg-blue-600 text-white' : 'bg-white'}`}
        >
          <em>I</em>
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`px-3 py-1 rounded ${editor.isActive('bulletList') ? 'bg-blue-600 text-white' : 'bg-white'}`}
        >
          • List
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`px-3 py-1 rounded ${editor.isActive('orderedList') ? 'bg-blue-600 text-white' : 'bg-white'}`}
        >
          1. List
        </button>
        <button
          onClick={() => {
            const url = window.prompt('Enter URL:')
            if (url) editor.chain().focus().setLink({ href: url }).run()
          }}
          className={`px-3 py-1 rounded ${editor.isActive('link') ? 'bg-blue-600 text-white' : 'bg-white'}`}
        >
          🔗 Link
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`px-3 py-1 rounded ${editor.isActive('heading', { level: 2 }) ? 'bg-blue-600 text-white' : 'bg-white'}`}
        >
          H2
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`px-3 py-1 rounded ${editor.isActive('heading', { level: 3 }) ? 'bg-blue-600 text-white' : 'bg-white'}`}
        >
          H3
        </button>
      </div>

      {/* Editor */}
      <EditorContent
        editor={editor}
        className="prose max-w-none p-4 min-h-[200px] focus:outline-none"
      />
    </div>
  )
}
```

**Usage in Product Edit Form:**

```typescript
import RichTextEditor from '@/components/admin/RichTextEditor'

// In edit modal:
<RichTextEditor
  content={editForm.description || ''}
  onChange={(description) => setEditForm({ ...editForm, description })}
  placeholder="Describe the product features, benefits, and specifications..."
/>
```

**Styling (Tailwind Typography):**

```bash
npm install @tailwindcss/typography
```

```javascript
// tailwind.config.js
module.exports = {
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
```

### 3.4 Alternative: Markdown Editor (Simpler Option)

If rich text is too complex, use markdown:

```bash
npm install react-simplemde-editor easymde
```

```typescript
// services/storefront/src/components/admin/MarkdownEditor.tsx
'use client'

import dynamic from 'next/dynamic'
import { useMemo } from 'react'
import 'easymde/dist/easymde.min.css'

const SimpleMDE = dynamic(() => import('react-simplemde-editor'), { ssr: false })

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
}

export default function MarkdownEditor({ value, onChange }: MarkdownEditorProps) {
  const options = useMemo(() => ({
    spellChecker: false,
    placeholder: 'Write product description in Markdown...',
    toolbar: ['bold', 'italic', 'heading', '|', 'unordered-list', 'ordered-list', '|', 'link', 'preview'],
  }), [])

  return <SimpleMDE value={value} onChange={onChange} options={options} />
}
```

---

## 4. Missing Admin Features Identification

### 4.1 CRUD Operations Gap Analysis

**Current State:**

| Operation | Status | Location | Notes |
|-----------|--------|----------|-------|
| **Create** | ❌ Missing | N/A | Can't add new products |
| **Read** | ✅ Working | Line 28-30 | Filter + display |
| **Update** | ⚠️ Partial | Line 39-45 | Only inline, no validation |
| **Delete** | ❌ Missing | N/A | Can't remove products |

**Impact:** Admin cannot manage full product lifecycle

### 4.2 Create Product Feature

**Recommended Implementation:**

```typescript
// Add to page.tsx
const [showCreateModal, setShowCreateModal] = useState(false)

const createNewProduct = () => {
  const newProduct: EditableProduct = {
    id: `product-${Date.now()}`,
    name: 'New Product',
    price: 0,
    priceExVAT: 0,
    costEUR: 0,
    category: 'jetboards',
    categoryTag: 'Jetboard',
    description: '',
    image: '',
    images: [],
    specs: [],
    features: [],
    inStock: true,
    stockQuantity: 0,
  }

  addProduct(newProduct)
  setEditingId(newProduct.id)
  setEditForm(newProduct)
}

// In UI:
<button
  onClick={() => setShowCreateModal(true)}
  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
>
  + Add New Product
</button>
```

### 4.3 Delete Product Feature

**Recommended Implementation:**

```typescript
const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

const handleDelete = (productId: string) => {
  if (deleteConfirm === productId) {
    deleteProduct(productId)
    setDeleteConfirm(null)
    toast.success('Product deleted')
  } else {
    setDeleteConfirm(productId)
    setTimeout(() => setDeleteConfirm(null), 3000)
  }
}

// In table row:
<button
  onClick={() => handleDelete(product.id)}
  className={`${deleteConfirm === product.id ? 'bg-red-600 text-white' : 'text-red-600'} px-2 py-1 rounded`}
>
  {deleteConfirm === product.id ? 'Click again to confirm' : 'Delete'}
</button>
```

### 4.4 Bulk Operations

**Missing Features:**

1. **Bulk Price Update** (e.g., apply 10% discount to all jetboards)
2. **Bulk Stock Update** (e.g., set all batteries to 5 units)
3. **Bulk Category Change**
4. **Bulk Export/Import** (CSV/Excel)

**Recommended Implementation:**

```typescript
// services/storefront/src/components/admin/BulkActions.tsx
'use client'

import { useState } from 'react'
import { EditableProduct } from '@/store/products'

interface BulkActionsProps {
  selectedProducts: string[]
  products: EditableProduct[]
  onUpdate: (updates: Partial<EditableProduct>) => void
}

export default function BulkActions({ selectedProducts, products, onUpdate }: BulkActionsProps) {
  const [action, setAction] = useState<'price' | 'stock' | 'category' | null>(null)
  const [value, setValue] = useState('')

  const applyBulkAction = () => {
    switch (action) {
      case 'price':
        const priceMultiplier = parseFloat(value) / 100
        onUpdate({
          price: (product) => product.price * (1 + priceMultiplier)
        })
        break
      case 'stock':
        onUpdate({ stockQuantity: parseInt(value) })
        break
      case 'category':
        onUpdate({ category: value })
        break
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <h3 className="font-semibold mb-3">Bulk Actions ({selectedProducts.length} selected)</h3>
      <div className="flex gap-3">
        <select
          value={action || ''}
          onChange={(e) => setAction(e.target.value as any)}
          className="border rounded px-3 py-2"
        >
          <option value="">Select action...</option>
          <option value="price">Adjust Price (%)</option>
          <option value="stock">Set Stock Level</option>
          <option value="category">Change Category</option>
        </select>

        {action && (
          <>
            <input
              type={action === 'category' ? 'text' : 'number'}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={action === 'price' ? '+10 or -10' : 'Value'}
              className="border rounded px-3 py-2"
            />
            <button
              onClick={applyBulkAction}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Apply to {selectedProducts.length} products
            </button>
          </>
        )}
      </div>
    </div>
  )
}
```

### 4.5 Inventory Management Features

**Missing:**

| Feature | Priority | Complexity | Impact |
|---------|----------|------------|--------|
| Low stock alerts | 🔴 High | Low | Prevent stockouts |
| Stock history tracking | 🟡 Medium | Medium | Audit trail |
| Reorder point settings | 🟡 Medium | Low | Automation |
| Stock reservations | 🟢 Low | High | Order management |

**Low Stock Alert Implementation:**

```typescript
// Add to dashboard
const lowStockProducts = products.filter(p => p.stockQuantity < 3 && p.inStock)

{lowStockProducts.length > 0 && (
  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
    <h3 className="font-semibold text-yellow-800 mb-2">
      ⚠️ Low Stock Alert ({lowStockProducts.length} products)
    </h3>
    <ul className="text-sm text-yellow-700">
      {lowStockProducts.map(p => (
        <li key={p.id}>
          {p.name}: {p.stockQuantity} units remaining
        </li>
      ))}
    </ul>
  </div>
)}
```

### 4.6 Product Categorization & Filtering

**Current:** Basic category filter (line 77-92)

**Missing:**
- Multi-category selection
- Tag-based filtering
- Price range filter
- Stock status filter
- Search by name/SKU

**Enhanced Filter Implementation:**

```typescript
// Enhanced filter state
const [filters, setFilters] = useState({
  categories: [] as string[],
  priceRange: [0, 1000000] as [number, number],
  stockStatus: 'all' as 'all' | 'in-stock' | 'low-stock' | 'out-of-stock',
  search: '',
})

// Filter logic
const filteredProducts = products.filter(p => {
  // Category filter
  if (filters.categories.length > 0 && !filters.categories.includes(p.category)) {
    return false
  }

  // Price range
  if (p.price < filters.priceRange[0] || p.price > filters.priceRange[1]) {
    return false
  }

  // Stock status
  if (filters.stockStatus === 'in-stock' && p.stockQuantity === 0) return false
  if (filters.stockStatus === 'low-stock' && p.stockQuantity >= 3) return false
  if (filters.stockStatus === 'out-of-stock' && p.stockQuantity > 0) return false

  // Search
  if (filters.search && !p.name.toLowerCase().includes(filters.search.toLowerCase())) {
    return false
  }

  return true
})
```

### 4.7 Additional Admin Features

**Recommended Additions:**

1. **Product Duplication**
   ```typescript
   const duplicateProduct = (product: EditableProduct) => {
     const duplicate = {
       ...product,
       id: `product-${Date.now()}`,
       name: `${product.name} (Copy)`,
     }
     addProduct(duplicate)
   }
   ```

2. **Export to CSV**
   ```typescript
   const exportToCSV = () => {
     const csv = [
       ['ID', 'Name', 'Price', 'Cost EUR', 'Stock', 'Margin'].join(','),
       ...products.map(p => [
         p.id,
         p.name,
         p.price,
         p.costEUR || 0,
         p.stockQuantity,
         calculateMargin(p),
       ].join(','))
     ].join('\n')

     const blob = new Blob([csv], { type: 'text/csv' })
     const url = URL.createObjectURL(blob)
     const a = document.createElement('a')
     a.href = url
     a.download = `products-${new Date().toISOString()}.csv`
     a.click()
   }
   ```

3. **Import from CSV**
   ```typescript
   const importFromCSV = async (file: File) => {
     const text = await file.text()
     const rows = text.split('\n').slice(1) // Skip header

     rows.forEach(row => {
       const [id, name, price, costEUR, stock] = row.split(',')
       updateProduct(id, {
         name,
         price: parseFloat(price),
         costEUR: parseFloat(costEUR),
         stockQuantity: parseInt(stock),
       })
     })
   }
   ```

---

## 5. Integration Architecture and Migration Strategy

### 5.1 Current Architecture Analysis

**Current State: Disconnected Systems**

```
┌─────────────────────────────────────────────────────────────┐
│ Storefront Admin (Next.js)                                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ useProductsStore (Zustand + localStorage)            │   │
│  │  - 36 products from constants                        │   │
│  │  - Persisted in browser localStorage                 │   │
│  │  - NO API calls                                      │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                          ❌ NO CONNECTION
┌─────────────────────────────────────────────────────────────┐
│ Medusa Backend                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ PostgreSQL Database                                  │   │
│  │  - 8 products seeded                                 │   │
│  │  - Extended product model with cost fields           │   │
│  │  - Custom /admin/products/costs endpoint             │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

**Problems:**
- ❌ Data inconsistency (storefront has 36 products, backend has 8)
- ❌ Changes in admin don't persist to database
- ❌ Can't access products from other devices
- ❌ No real-time updates
- ❌ No authentication with backend

### 5.2 Target Architecture

**Integrated System:**

```
┌─────────────────────────────────────────────────────────────┐
│ Storefront Admin (Next.js)                                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ useProductsStore (Zustand + React Query)             │   │
│  │  - Fetches from Medusa API                           │   │
│  │  - Optimistic updates                                │   │
│  │  - Cache management                                  │   │
│  └──────────────────────────────────────────────────────┘   │
│                          │                                   │
│                          ▼                                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ API Client (/lib/medusa-client.ts)                   │   │
│  │  - Authentication (JWT tokens)                       │   │
│  │  - Error handling                                    │   │
│  │  - Request/response transformation                   │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼ HTTP/REST
┌─────────────────────────────────────────────────────────────┐
│ Medusa Backend (http://localhost:9000)                     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Admin API Endpoints                                  │   │
│  │  - GET    /admin/products                            │   │
│  │  - POST   /admin/products                            │   │
│  │  - POST   /admin/products/:id                        │   │
│  │  - DELETE /admin/products/:id                        │   │
│  │  - GET    /admin/products/costs (custom)             │   │
│  └──────────────────────────────────────────────────────┘   │
│                          │                                   │
│                          ▼                                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ PostgreSQL Database                                  │   │
│  │  - Products table (extended)                         │   │
│  │  - Product variants                                  │   │
│  │  - Images, metadata                                  │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 5.3 Authentication Flow

**Current:** Simple password check in localStorage (line 44-50 in admin.ts)

**Target:** JWT-based authentication with Medusa

```typescript
// services/storefront/src/lib/medusa-client.ts
import Medusa from '@medusajs/medusa-js'

const medusaUrl = process.env.NEXT_PUBLIC_MEDUSA_URL || 'http://localhost:9000'

export const medusaClient = new Medusa({
  baseUrl: medusaUrl,
  maxRetries: 3
})

// Admin authentication
export async function loginAdmin(email: string, password: string) {
  try {
    const response = await medusaClient.admin.auth.getToken({
      email,
      password,
    })

    // Store token in localStorage
    localStorage.setItem('medusa_admin_token', response.access_token)

    // Get admin user details
    const user = await medusaClient.admin.auth.getSession({
      Authorization: `Bearer ${response.access_token}`
    })

    return { success: true, user, token: response.access_token }
  } catch (error) {
    return { success: false, error: 'Invalid credentials' }
  }
}

// Logout
export function logoutAdmin() {
  localStorage.removeItem('medusa_admin_token')
}

// Get stored token
export function getAdminToken() {
  return localStorage.getItem('medusa_admin_token')
}

// Set default auth header
export function setAuthToken(token: string) {
  medusaClient.client.setHeaders({
    Authorization: `Bearer ${token}`
  })
}
```

### 5.4 Step-by-Step Migration Strategy

**Phase 1: Setup (Week 1)**

✅ **Tasks:**
1. Install PostgreSQL + Redis locally
2. Start Medusa backend (`npm run dev`)
3. Verify Medusa admin dashboard works (http://localhost:9000/app)
4. Test custom `/admin/products/costs` endpoint
5. Install Medusa JS SDK in storefront

```bash
cd services/storefront
npm install @medusajs/medusa-js @tanstack/react-query
```

**Phase 2: Authentication Integration (Week 1-2)**

✅ **Tasks:**
1. Create Medusa client wrapper (`/lib/medusa-client.ts`)
2. Update admin login to use Medusa API
3. Store JWT token in localStorage
4. Add token refresh logic
5. Update admin store to use real authentication

```typescript
// services/storefront/src/store/admin.ts (UPDATED)
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { loginAdmin, logoutAdmin, getAdminToken } from '@/lib/medusa-client'

interface AdminStore {
  settings: StoreSettings
  isAuthenticated: boolean
  adminToken: string | null
  adminUser: any | null
  updateSettings: (settings: Partial<StoreSettings>) => void
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  checkAuth: () => boolean
}

export const useAdminStore = create<AdminStore>()(
  persist(
    (set, get) => ({
      settings: DEFAULT_SETTINGS,
      isAuthenticated: false,
      adminToken: null,
      adminUser: null,

      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),

      login: async (email, password) => {
        const result = await loginAdmin(email, password)
        if (result.success) {
          set({
            isAuthenticated: true,
            adminToken: result.token,
            adminUser: result.user,
          })
          return true
        }
        return false
      },

      logout: () => {
        logoutAdmin()
        set({
          isAuthenticated: false,
          adminToken: null,
          adminUser: null,
        })
      },

      checkAuth: () => {
        const token = getAdminToken()
        if (token) {
          set({ isAuthenticated: true, adminToken: token })
          return true
        }
        return false
      },
    }),
    {
      name: 'admin-storage',
    }
  )
)
```

**Phase 3: Product API Integration (Week 2-3)**

✅ **Tasks:**
1. Create product API service layer
2. Update `useProductsStore` to fetch from Medusa
3. Implement React Query for caching
4. Add optimistic updates
5. Handle loading/error states

```typescript
// services/storefront/src/lib/api/products.ts
import { medusaClient, getAdminToken } from '../medusa-client'
import { EditableProduct } from '@/store/products'

// Transform Medusa product to EditableProduct
function transformMedusaProduct(medusaProduct: any): EditableProduct {
  const variant = medusaProduct.variants?.[0]

  return {
    id: medusaProduct.id,
    name: medusaProduct.title,
    price: variant?.prices?.[0]?.amount / 100 || 0,
    priceExVAT: variant?.metadata?.priceExVAT || 0,
    costEUR: variant?.metadata?.costEUR || medusaProduct.cost_eur,
    category: medusaProduct.metadata?.category || 'unknown',
    categoryTag: medusaProduct.category_tag || medusaProduct.metadata?.categoryTag,
    description: medusaProduct.description,
    image: medusaProduct.images?.[0]?.url || medusaProduct.thumbnail,
    images: medusaProduct.images?.map((img: any) => img.url) || [],
    specs: medusaProduct.metadata?.specs || [],
    features: medusaProduct.metadata?.features || [],
    inStock: variant?.inventory_quantity > 0,
    stockQuantity: variant?.inventory_quantity || 0,
    skillLevel: medusaProduct.skill_level || medusaProduct.metadata?.skillLevel,
    badge: medusaProduct.metadata?.badge,
    battery: medusaProduct.metadata?.battery,
  }
}

// Fetch all products
export async function fetchProducts(): Promise<EditableProduct[]> {
  const token = getAdminToken()
  if (!token) throw new Error('Not authenticated')

  const response = await medusaClient.admin.products.list({
    limit: 100,
    expand: 'variants,images',
  })

  return response.products.map(transformMedusaProduct)
}

// Update product
export async function updateProduct(id: string, updates: Partial<EditableProduct>) {
  const token = getAdminToken()
  if (!token) throw new Error('Not authenticated')

  // Transform EditableProduct back to Medusa format
  const medusaUpdates: any = {
    title: updates.name,
    description: updates.description,
    metadata: {
      category: updates.category,
      categoryTag: updates.categoryTag,
      specs: updates.specs,
      features: updates.features,
      skillLevel: updates.skillLevel,
      battery: updates.battery,
      badge: updates.badge,
    },
  }

  // Update product
  const response = await medusaClient.admin.products.update(id, medusaUpdates)

  // Update variant if price/cost changed
  if (updates.price || updates.costEUR || updates.stockQuantity !== undefined) {
    const variantId = response.product.variants[0].id
    await medusaClient.admin.variants.update(variantId, {
      prices: updates.price ? [{
        amount: updates.price * 100,
        currency_code: 'ZAR',
      }] : undefined,
      inventory_quantity: updates.stockQuantity,
      metadata: {
        costEUR: updates.costEUR,
        priceExVAT: updates.priceExVAT,
      },
    })
  }

  return transformMedusaProduct(response.product)
}

// Create product
export async function createProduct(product: EditableProduct) {
  const token = getAdminToken()
  if (!token) throw new Error('Not authenticated')

  const response = await medusaClient.admin.products.create({
    title: product.name,
    description: product.description,
    is_giftcard: false,
    discountable: true,
    metadata: {
      category: product.category,
      categoryTag: product.categoryTag,
      specs: product.specs,
      features: product.features,
      skillLevel: product.skillLevel,
      battery: product.battery,
    },
    variants: [{
      title: 'Standard',
      prices: [{
        amount: product.price * 100,
        currency_code: 'ZAR',
      }],
      inventory_quantity: product.stockQuantity,
      metadata: {
        costEUR: product.costEUR,
        priceExVAT: product.priceExVAT,
      },
    }],
  })

  return transformMedusaProduct(response.product)
}

// Delete product
export async function deleteProduct(id: string) {
  const token = getAdminToken()
  if (!token) throw new Error('Not authenticated')

  await medusaClient.admin.products.delete(id)
}
```

**Phase 4: React Query Integration (Week 3)**

```typescript
// services/storefront/src/app/admin/products/page.tsx (UPDATED)
'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchProducts, updateProduct, createProduct, deleteProduct } from '@/lib/api/products'
import { toast } from 'react-hot-toast'

export default function AdminProductsPage() {
  const queryClient = useQueryClient()

  // Fetch products
  const { data: products = [], isLoading, error } = useQuery({
    queryKey: ['admin-products'],
    queryFn: fetchProducts,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string, updates: any }) =>
      updateProduct(id, updates),
    onMutate: async ({ id, updates }) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['admin-products'] })
      const previous = queryClient.getQueryData(['admin-products'])

      queryClient.setQueryData(['admin-products'], (old: any[]) =>
        old.map(p => p.id === id ? { ...p, ...updates } : p)
      )

      return { previous }
    },
    onError: (err, variables, context) => {
      // Rollback on error
      queryClient.setQueryData(['admin-products'], context?.previous)
      toast.error('Failed to update product')
    },
    onSuccess: () => {
      toast.success('Product updated successfully')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] })
    },
  })

  // Create mutation
  const createMutation = useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] })
      toast.success('Product created successfully')
    },
    onError: () => {
      toast.error('Failed to create product')
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] })
      toast.success('Product deleted successfully')
    },
    onError: () => {
      toast.error('Failed to delete product')
    },
  })

  if (isLoading) return <div>Loading products...</div>
  if (error) return <div>Error loading products: {error.message}</div>

  // Rest of component...
}
```

**Phase 5: Data Migration (Week 4)**

✅ **Tasks:**
1. Export all 36 products from localStorage
2. Seed remaining 28 products to Medusa
3. Verify data consistency
4. Remove localStorage persistence

```typescript
// scripts/migrate-to-medusa.ts
import { useProductsStore } from '@/store/products'
import { createProduct } from '@/lib/api/products'

async function migrateAllProducts() {
  const { products } = useProductsStore.getState()

  console.log(`Migrating ${products.length} products to Medusa...`)

  for (const product of products) {
    try {
      await createProduct(product)
      console.log(`✅ Migrated: ${product.name}`)
    } catch (error) {
      console.error(`❌ Failed to migrate ${product.name}:`, error)
    }
  }

  console.log('Migration complete!')
}
```

### 5.5 Data Synchronization Strategy

**Conflict Resolution:**

| Scenario | Strategy | Implementation |
|----------|----------|----------------|
| Concurrent edits | Last-write-wins | Use timestamps, show warning |
| Offline edits | Queue and sync | Use service worker + IndexedDB |
| Network failure | Retry with backoff | Exponential backoff (1s, 2s, 4s, 8s) |
| Validation errors | Rollback optimistic update | React Query onError handler |

**Optimistic Update Pattern:**

```typescript
// Best practice for all mutations
const mutation = useMutation({
  mutationFn: updateProduct,
  onMutate: async (variables) => {
    // Cancel outgoing queries
    await queryClient.cancelQueries({ queryKey: ['products'] })

    // Snapshot current state
    const previous = queryClient.getQueryData(['products'])

    // Optimistically update
    queryClient.setQueryData(['products'], (old) => {
      // Apply update immediately
      return applyUpdate(old, variables)
    })

    // Return rollback data
    return { previous }
  },
  onError: (err, variables, context) => {
    // Rollback on error
    queryClient.setQueryData(['products'], context.previous)
    toast.error('Update failed, changes reverted')
  },
  onSettled: () => {
    // Refetch to ensure consistency
    queryClient.invalidateQueries({ queryKey: ['products'] })
  },
})
```

### 5.6 Rollback Considerations

**Rollback Plan:**

1. **Keep localStorage backup** for 2 weeks after migration
2. **Export database** before migration
3. **Feature flag** to switch between localStorage and API
4. **Monitoring** for API errors and performance

```typescript
// Feature flag implementation
const USE_MEDUSA_API = process.env.NEXT_PUBLIC_USE_MEDUSA_API === 'true'

export const useProductsStore = create<ProductsStore>()(
  persist(
    (set, get) => ({
      products: USE_MEDUSA_API ? [] : flattenProducts(),

      updateProduct: async (id, updates) => {
        if (USE_MEDUSA_API) {
          // Use API
          await updateProduct(id, updates)
        } else {
          // Use localStorage
          set((state) => ({
            products: state.products.map((p) =>
              p.id === id ? { ...p, ...updates } : p
            ),
          }))
        }
      },
      // ...
    }),
    {
      name: 'products-storage',
      enabled: !USE_MEDUSA_API, // Only persist if not using API
    }
  )
)
```

### 5.7 Timeline & Complexity Estimates

| Phase | Tasks | Complexity | Duration | Dependencies |
|-------|-------|------------|----------|--------------|
| **Phase 1: Setup** | Install DB, start Medusa | 🟢 Low | 1-2 days | PostgreSQL, Redis |
| **Phase 2: Auth** | JWT integration | 🟡 Medium | 3-4 days | Medusa SDK |
| **Phase 3: Product API** | API service layer | 🟡 Medium | 4-5 days | Phase 2 |
| **Phase 4: React Query** | Caching, optimistic updates | 🟡 Medium | 3-4 days | Phase 3 |
| **Phase 5: Migration** | Data migration | 🟢 Low | 2-3 days | Phase 4 |
| **Phase 6: Testing** | E2E testing, bug fixes | 🟡 Medium | 3-5 days | All phases |
| **Total** | | | **3-4 weeks** | |

---

## 6. Prioritized Improvement List

### 6.1 Impact vs Complexity Matrix

```
High Impact │
           │  1. Medusa API      │  2. Image Upload    │
           │     Integration     │     System          │
           │  ─────────────────  │  ─────────────────  │
           │  • Auth flow        │  • Drag & drop      │
           │  • Product CRUD     │  • Multiple images  │
           │  • Data sync        │  • Optimization     │
           │  ⏱️ 3-4 weeks       │  ⏱️ 1-2 weeks       │
           │                     │                     │
───────────┼─────────────────────┼─────────────────────┤
           │  3. Form Controls   │  4. Rich Text       │
           │     Enhancement     │     Editor          │
           │  ─────────────────  │  ─────────────────  │
           │  • Array editors    │  • Tiptap           │
           │  • Validation       │  • Formatting       │
           │  • Modal editing    │  • Preview          │
           │  ⏱️ 1 week          │  ⏱️ 3-4 days        │
           │                     │                     │
───────────┼─────────────────────┼─────────────────────┤
Low Impact │  5. Bulk Ops        │  6. Export/Import   │
           │  ─────────────────  │  ─────────────────  │
           │  • Multi-select     │  • CSV export       │
           │  • Bulk price       │  • CSV import       │
           │  • Bulk stock       │  • Validation       │
           │  ⏱️ 1 week          │  ⏱️ 3-4 days        │
           │                     │                     │
           └─────────────────────┴─────────────────────┘
             Low Complexity        High Complexity
```

### 6.2 Recommended Implementation Order

**🔴 CRITICAL (Do First - Weeks 1-4)**

1. **Medusa API Integration** (3-4 weeks)
   - Impact: 🔴 Critical - Enables real persistence
   - Complexity: 🔴 High
   - Blockers: None
   - Deliverables: Auth flow, CRUD operations, data sync

2. **Form Controls Enhancement** (1 week)
   - Impact: 🔴 High - Enables editing all fields
   - Complexity: 🟢 Low
   - Blockers: None
   - Deliverables: Array editors, validation, modal

**🟡 HIGH PRIORITY (Weeks 5-7)**

3. **Image Upload System** (1-2 weeks)
   - Impact: 🔴 High - Professional image management
   - Complexity: 🟡 Medium
   - Blockers: Medusa API integration (for uploads)
   - Deliverables: Drag & drop, gallery, optimization

4. **Rich Text Editor** (3-4 days)
   - Impact: 🟡 Medium - Better content editing
   - Complexity: 🟢 Low
   - Blockers: None
   - Deliverables: Tiptap editor, formatting toolbar

**🟢 NICE TO HAVE (Weeks 8+)**

5. **Bulk Operations** (1 week)
   - Impact: 🟡 Medium - Efficiency for large catalogs
   - Complexity: 🟡 Medium
   - Blockers: Medusa API integration
   - Deliverables: Multi-select, bulk actions

6. **Export/Import** (3-4 days)
   - Impact: 🟢 Low - Backup and migration
   - Complexity: 🟢 Low
   - Blockers: None
   - Deliverables: CSV export/import

7. **Advanced Features** (2-3 weeks)
   - Low stock alerts
   - Product duplication
   - Stock history
   - Advanced filtering

### 6.3 Quick Wins (Can Implement Today)

**1. Add Validation (2 hours)**
```bash
npm install zod
# Implement ProductSchema validation in saveEdit()
```

**2. Add Loading States (1 hour)**
```typescript
const [saving, setSaving] = useState(false)
// Show spinner during save
```

**3. Add Error Messages (1 hour)**
```typescript
const [errors, setErrors] = useState<Record<string, string>>({})
// Display validation errors
```

**4. Add Unsaved Changes Warning (2 hours)**
```typescript
useEffect(() => {
  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    if (editingId) {
      e.preventDefault()
      e.returnValue = ''
    }
  }
  window.addEventListener('beforeunload', handleBeforeUnload)
  return () => window.removeEventListener('beforeunload', handleBeforeUnload)
}, [editingId])
```

**5. Add Toast Notifications (1 hour)**
```bash
npm install react-hot-toast
# Add success/error toasts
```

---

## 7. Recommended Third-Party Libraries

### 7.1 Essential Libraries

| Library | Purpose | Size | License | Recommendation |
|---------|---------|------|---------|----------------|
| **@medusajs/medusa-js** | Medusa API client | ~50KB | MIT | ✅ Required |
| **@tanstack/react-query** | Data fetching & caching | ~40KB | MIT | ✅ Required |
| **zod** | Validation | ~15KB | MIT | ✅ Highly Recommended |
| **react-hot-toast** | Notifications | ~5KB | MIT | ✅ Highly Recommended |

### 7.2 UI Enhancement Libraries

| Library | Purpose | Size | License | Recommendation |
|---------|---------|------|---------|----------------|
| **@headlessui/react** | Modal, dropdown components | ~30KB | MIT | ✅ Recommended |
| **react-dropzone** | File upload | ~20KB | MIT | ✅ Recommended |
| **@tiptap/react** | Rich text editor | ~100KB | MIT | ✅ Recommended |
| **sharp** | Image optimization | ~8MB | Apache-2.0 | ✅ Recommended (server-side) |

### 7.3 Optional Libraries

| Library | Purpose | Size | License | Recommendation |
|---------|---------|------|---------|----------------|
| **react-table** | Advanced table features | ~50KB | MIT | ⚠️ Optional (if needed) |
| **date-fns** | Date formatting | ~20KB | MIT | ⚠️ Optional |
| **recharts** | Analytics charts | ~400KB | MIT | ⚠️ Optional (for reports) |

### 7.4 Installation Commands

```bash
# Essential (Phase 1)
npm install @medusajs/medusa-js @tanstack/react-query zod react-hot-toast

# UI Enhancement (Phase 2)
npm install @headlessui/react react-dropzone @tiptap/react @tiptap/starter-kit @tiptap/extension-link @tiptap/extension-placeholder

# Image Processing (Phase 2)
npm install sharp

# Styling (if not already installed)
npm install @tailwindcss/typography

# Dev Dependencies
npm install -D @types/react-dropzone
```

---

## 8. Summary & Next Steps

### 8.1 Current State Assessment

**Strengths:**
- ✅ Basic product editing works
- ✅ Cost tracking and margin calculations functional
- ✅ Clean UI with Tailwind CSS
- ✅ Medusa backend already configured with custom fields

**Critical Gaps:**
- ❌ No backend integration (localStorage only)
- ❌ No image upload system
- ❌ No array field editing (specs, features)
- ❌ No validation or error handling
- ❌ Missing CRUD operations (Create, Delete)

### 8.2 Recommended Action Plan

**Week 1-2: Foundation**
- [ ] Install PostgreSQL + Redis
- [ ] Start Medusa backend
- [ ] Implement authentication with Medusa
- [ ] Create Medusa API client wrapper
- [ ] Add validation (Zod)
- [ ] Add toast notifications

**Week 3-4: Core Features**
- [ ] Integrate React Query
- [ ] Implement product CRUD via API
- [ ] Add array field editors (specs, features)
- [ ] Create product edit modal
- [ ] Migrate data from localStorage to Medusa

**Week 5-6: Enhanced Features**
- [ ] Implement image upload system
- [ ] Add rich text editor (Tiptap)
- [ ] Add Create/Delete product features
- [ ] Implement bulk operations

**Week 7+: Polish & Advanced**
- [ ] Add export/import (CSV)
- [ ] Low stock alerts
- [ ] Product duplication
- [ ] Advanced filtering
- [ ] Performance optimization

### 8.3 Success Metrics

**Technical Metrics:**
- [ ] 100% of products in Medusa database
- [ ] < 2s page load time
- [ ] < 500ms API response time
- [ ] 0 localStorage usage for products
- [ ] 100% field coverage (all fields editable)

**User Experience Metrics:**
- [ ] < 3 clicks to edit any product field
- [ ] Real-time validation feedback
- [ ] Optimistic UI updates
- [ ] Mobile-responsive admin panel
- [ ] Comprehensive error messages

### 8.4 Risk Mitigation

**Risks:**

1. **Data Loss During Migration**
   - Mitigation: Keep localStorage backup, export before migration

2. **API Performance Issues**
   - Mitigation: Implement caching, pagination, lazy loading

3. **Authentication Complexity**
   - Mitigation: Use Medusa's built-in auth, test thoroughly

4. **Image Storage Costs**
   - Mitigation: Start with local file storage, optimize images

### 8.5 Estimated Total Effort

| Category | Effort | Priority |
|----------|--------|----------|
| Medusa Integration | 3-4 weeks | 🔴 Critical |
| Form Enhancements | 1 week | 🔴 Critical |
| Image Management | 1-2 weeks | 🟡 High |
| Rich Text Editor | 3-4 days | 🟡 High |
| Bulk Operations | 1 week | 🟢 Medium |
| Advanced Features | 2-3 weeks | 🟢 Low |
| **Total** | **8-12 weeks** | |

**Minimum Viable Product (MVP):** 4-5 weeks (Phases 1-2)
**Full Feature Set:** 8-12 weeks (All phases)

---

## Appendix A: Code Examples Repository

All code examples from this audit are available in the following structure:

```
/examples/
├── components/
│   ├── ArrayFieldEditor.tsx
│   ├── ImageUpload.tsx
│   ├── RichTextEditor.tsx
│   ├── ProductEditModal.tsx
│   └── BulkActions.tsx
├── lib/
│   ├── medusa-client.ts
│   └── api/
│       └── products.ts
├── hooks/
│   └── useProductMutations.ts
└── scripts/
    ├── migrate-to-medusa.ts
    └── migrate-images.ts
```

## Appendix B: Environment Variables

```env
# .env.local (Storefront)
NEXT_PUBLIC_MEDUSA_URL=http://localhost:9000
NEXT_PUBLIC_USE_MEDUSA_API=true

# .env (Medusa Backend)
DATABASE_URL=postgres://localhost/medusa-store
REDIS_URL=redis://localhost:6379
ADMIN_CORS=http://localhost:3000,http://localhost:7000
STORE_CORS=http://localhost:3000
JWT_SECRET=your-secret-key
COOKIE_SECRET=your-cookie-secret
```

## Appendix C: Testing Checklist

**Pre-Migration Testing:**
- [ ] Export all products to JSON
- [ ] Verify all 36 products present
- [ ] Test current edit functionality
- [ ] Document any existing bugs

**Post-Migration Testing:**
- [ ] All 36 products in Medusa
- [ ] CRUD operations work
- [ ] Images display correctly
- [ ] Margin calculations accurate
- [ ] Stock levels correct
- [ ] Authentication works
- [ ] Optimistic updates work
- [ ] Error handling works
- [ ] Mobile responsive
- [ ] Cross-browser compatible

---

**End of Audit Report**

*For questions or clarifications, please refer to the codebase or contact the development team.*

