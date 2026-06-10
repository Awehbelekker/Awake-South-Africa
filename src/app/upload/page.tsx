'use client'

import { useState, useRef, useCallback } from 'react'
import Image from 'next/image'
import { Camera, Upload, Video, X, CheckCircle, Loader2 } from 'lucide-react'

type FilePreview = { file: File; previewUrl: string; type: 'image' | 'video' }

export default function UploadPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [caption, setCaption] = useState('')
  const [previews, setPreviews] = useState<FilePreview[]>([])
  const [uploading, setUploading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)

  const addFiles = useCallback((files: FileList | null) => {
    if (!files) return
    const newPreviews: FilePreview[] = []
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) return
      if (previews.length + newPreviews.length >= 5) return
      newPreviews.push({
        file,
        previewUrl: URL.createObjectURL(file),
        type: file.type.startsWith('video/') ? 'video' : 'image',
      })
    })
    setPreviews(prev => [...prev, ...newPreviews].slice(0, 5))
  }, [previews.length])

  const removeFile = (idx: number) => {
    setPreviews(prev => {
      URL.revokeObjectURL(prev[idx].previewUrl)
      return prev.filter((_, i) => i !== idx)
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) { setError('Please enter your name'); return }
    if (!previews.length) { setError('Please add at least one photo or video'); return }
    setError('')
    setUploading(true)

    try {
      for (const p of previews) {
        const fd = new FormData()
        fd.append('file', p.file)
        fd.append('name', name.trim())
        if (email.trim()) fd.append('email', email.trim())
        if (caption.trim()) fd.append('caption', caption.trim())

        const res = await fetch('/api/tenant/customer-uploads', { method: 'POST', body: fd })
        if (!res.ok) {
          const d = await res.json()
          throw new Error(d.error || 'Upload failed')
        }
      }
      setDone(true)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setUploading(false)
    }
  }

  if (done) {
    return (
      <main className="min-h-screen bg-awake-black flex flex-col items-center justify-center px-6 text-center">
        <div className="max-w-sm w-full">
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">Stoked! 🤙</h1>
          <p className="text-gray-400 mb-2">Your {previews.length === 1 ? 'upload' : `${previews.length} uploads`} landed safely.</p>
          <p className="text-gray-500 text-sm mb-8">We'll review it and may feature it on our site. Legend!</p>
          <button
            onClick={() => { setDone(false); setPreviews([]); setName(''); setEmail(''); setCaption('') }}
            className="w-full py-3 bg-accent-primary text-awake-black font-bold rounded-xl hover:bg-accent-secondary transition-colors"
          >
            Upload More
          </button>
          <a href="/" className="block mt-4 text-gray-500 text-sm hover:text-white transition-colors">Back to store</a>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-awake-black text-white pb-10">
      {/* Header */}
      <div className="bg-gradient-to-b from-accent-primary/20 to-transparent px-6 pt-10 pb-6 text-center">
        <div className="w-16 h-16 bg-accent-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Camera className="w-8 h-8 text-awake-black" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Share Your Ride</h1>
        <p className="text-gray-400 text-sm">Upload photos or videos from your session — you might get featured!</p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-lg mx-auto px-6 space-y-5">

        {/* File add buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => cameraRef.current?.click()}
            className="flex flex-col items-center gap-2 py-5 bg-awake-gray border border-white/10 rounded-2xl hover:border-accent-primary active:scale-95 transition-all"
          >
            <Camera className="w-7 h-7 text-accent-primary" />
            <span className="text-sm font-medium">Take Photo / Video</span>
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex flex-col items-center gap-2 py-5 bg-awake-gray border border-white/10 rounded-2xl hover:border-accent-primary active:scale-95 transition-all"
          >
            <Upload className="w-7 h-7 text-accent-primary" />
            <span className="text-sm font-medium">Choose from Gallery</span>
          </button>
        </div>

        {/* Hidden inputs */}
        <input
          ref={cameraRef}
          type="file"
          accept="image/*,video/*"
          capture="environment"
          multiple
          className="hidden"
          onChange={e => addFiles(e.target.files)}
        />
        <input
          ref={fileRef}
          type="file"
          accept="image/*,video/*"
          multiple
          className="hidden"
          onChange={e => addFiles(e.target.files)}
        />

        {/* Previews */}
        {previews.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {previews.map((p, idx) => (
              <div key={idx} className="relative aspect-square rounded-xl overflow-hidden bg-awake-gray">
                {p.type === 'image' ? (
                  <Image src={p.previewUrl} alt="" fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-1">
                    <Video className="w-8 h-8 text-accent-primary" />
                    <span className="text-xs text-gray-400 px-1 text-center truncate w-full">{p.file.name}</span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => removeFile(idx)}
                  className="absolute top-1 right-1 w-6 h-6 bg-black/70 rounded-full flex items-center justify-center"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            {previews.length < 5 && (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="aspect-square rounded-xl border-2 border-dashed border-white/20 flex items-center justify-center hover:border-accent-primary transition-colors"
              >
                <span className="text-2xl text-gray-500">+</span>
              </button>
            )}
          </div>
        )}

        {/* Form fields */}
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Your Name <span className="text-red-400">*</span></label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="John Doe"
              className="w-full px-4 py-3 bg-awake-gray border border-white/10 rounded-xl focus:ring-2 focus:ring-accent-primary text-white placeholder-gray-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Email <span className="text-gray-500">(optional — earn Stoke Points)</span></label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-3 bg-awake-gray border border-white/10 rounded-xl focus:ring-2 focus:ring-accent-primary text-white placeholder-gray-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Caption <span className="text-gray-500">(optional)</span></label>
            <textarea
              value={caption}
              onChange={e => setCaption(e.target.value)}
              placeholder="Where was this? What board? Any stoke to share..."
              rows={3}
              className="w-full px-4 py-3 bg-awake-gray border border-white/10 rounded-xl focus:ring-2 focus:ring-accent-primary text-white placeholder-gray-500 resize-none"
            />
          </div>
        </div>

        {error && (
          <div className="px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={uploading || !previews.length}
          className="w-full py-4 bg-accent-primary text-awake-black font-bold text-lg rounded-2xl hover:bg-accent-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
        >
          {uploading ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> Uploading…</>
          ) : (
            <><Upload className="w-5 h-5" /> Share It</>
          )}
        </button>

        <p className="text-center text-xs text-gray-600 pb-4">
          By uploading you give Awake SA permission to use your content on our website and socials.
        </p>
      </form>
    </main>
  )
}
