'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import grapesjs, { type Editor } from 'grapesjs'
import GjsEditor from '@grapesjs/react'
import gjsBlocksBasic from 'grapesjs-blocks-basic'
import gjsPresetWebpage from 'grapesjs-preset-webpage'
import gjsPluginForms from 'grapesjs-plugin-forms'
import gjsCustomCode from 'grapesjs-custom-code'
import gjsNavbar from 'grapesjs-navbar'
import gjsCountdown from 'grapesjs-component-countdown'
import gjsStyleBg from 'grapesjs-style-bg'
import gjsTabs from 'grapesjs-tabs'
import { createClient } from '@supabase/supabase-js'
import diggBlocksPlugin from '@/lib/grapesjs/blocks'
import { applyResizePolicyToEntireTree, registerDiggComponentResizeBehavior } from '@/lib/grapesjs/component-defaults'
import { registerFloatingCommands } from '@/lib/grapesjs/floating-controls'
import { registerMobileResponsiveCommands } from '@/lib/grapesjs/mobile-responsive-commands'
import { registerImageFocalOverlay } from '@/lib/grapesjs/image-focal-overlay'
import { diggAlignmentSector } from '@/lib/grapesjs/alignment-sector'
import { diggImageFramingSector, diggNewImageStyle } from '@/lib/grapesjs/image-framing-sector'
import {
  applyFlexibleWidthToComponent,
  getMobileLayoutHintsForComponent,
  getPreviewDeviceCategory,
} from '@/lib/grapesjs/mobile-hints'
import { PAGE_STARTERS } from '@/lib/grapesjs/page-starters'
import { sectionsToHtml } from '@/lib/grapesjs/sections-to-html'
import { GOOGLE_FONT_OPTIONS, googleFontsUrl } from '@/lib/google-fonts'
import { useUnsavedChangesAlert } from '@/lib/hooks/useUnsavedChangesAlert'
import type { Page, BuilderSnippet, PageSection } from '@/lib/types/pages'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

function toast(msg: string, type: 'success' | 'error' | 'info' = 'success') {
  const el = document.createElement('div')
  const colors = { success: '#22c55e', error: '#ef4444', info: '#3b82f6' }
  el.style.cssText = `position:fixed;bottom:24px;right:24px;z-index:200000;background:${colors[type]};color:white;padding:10px 18px;border-radius:10px;font-size:14px;font-weight:500;box-shadow:0 4px 16px rgba(0,0,0,.18);`
  el.textContent = msg
  document.body.appendChild(el)
  setTimeout(() => el.remove(), 3500)
}

interface PageBuilderProps {
  page?: Page
  tenantId: string
  tenantName?: string
  primaryColor?: string
}

export default function PageBuilder({ page, tenantId, tenantName, primaryColor = '#1B2A6B' }: PageBuilderProps) {
  const router = useRouter()
  const supabase = getSupabase()
  const editorRef = useRef<Editor | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const themeInputRef = useRef<HTMLInputElement>(null)
  const [saving, setSaving] = useState(false)
  const [title, setTitle] = useState(page?.title || 'Untitled page')
  const [slug, setSlug] = useState(page?.slug || '')
  const [published, setPublished] = useState(page?.published ?? true)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [importCode, setImportCode] = useState('')
  const [metaTitle, setMetaTitle] = useState(page?.meta_title || '')
  const [metaDescription, setMetaDescription] = useState(page?.meta_description || '')
  const [metaOgImage, setMetaOgImage] = useState(page?.meta_og_image || '')
  const [siteTheme, setSiteTheme] = useState({ headingFont: 'Montserrat', bodyFont: 'Lato' })
  const [allPages, setAllPages] = useState<{ id: string; title: string; slug: string }[]>([])
  const [pageSwitcherOpen, setPageSwitcherOpen] = useState(false)
  const [mobilePanelsOpen, setMobilePanelsOpen] = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const [startersOpen, setStartersOpen] = useState(false)
  const [snippetsOpen, setSnippetsOpen] = useState(false)
  const [snippetSaveTitle, setSnippetSaveTitle] = useState('')
  const [snippets, setSnippets] = useState<BuilderSnippet[]>([])
  const [snippetsLoading, setSnippetsLoading] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [previewDeviceName, setPreviewDeviceName] = useState('desktop')
  const [selectionMobileHints, setSelectionMobileHints] = useState<string[]>([])
  const saveRef = useRef<() => void>(() => {})
  const ignoreDirtyRef = useRef(true)
  const markDirtyRef = useRef<() => void>(() => {})
  const setPreviewDeviceNameRef = useRef(setPreviewDeviceName)
  const setSelectionMobileHintsRef = useRef(setSelectionMobileHints)

  useEffect(() => { setPreviewDeviceNameRef.current = setPreviewDeviceName }, [previewDeviceName])
  useEffect(() => { setSelectionMobileHintsRef.current = setSelectionMobileHints }, [selectionMobileHints])
  useEffect(() => { markDirtyRef.current = () => { if (ignoreDirtyRef.current) return; setDirty(true) } })

  const { confirmLeave } = useUnsavedChangesAlert(dirty, 'You have unsaved changes. Leave without saving?')

  useEffect(() => {
    supabase.from('tenant_site_settings')
      .select('key, value')
      .eq('tenant_id', tenantId)
      .in('key', ['heading_font', 'body_font'])
      .then(({ data }) => {
        if (!data) return
        const map: Record<string, string> = {}
        for (const row of data) map[row.key] = String(row.value ?? '')
        setSiteTheme({ headingFont: map.heading_font || 'Montserrat', bodyFont: map.body_font || 'Lato' })
      })
  }, [tenantId])

  useEffect(() => {
    supabase.from('pages')
      .select('id, title, slug')
      .eq('tenant_id', tenantId)
      .order('updated_at', { ascending: false })
      .then(({ data }) => { if (data) setAllPages(data) })
  }, [tenantId])

  const handleSave = useCallback(async () => {
    if (!slug.trim()) { toast('Set a page slug in Settings before saving.', 'error'); setSettingsOpen(true); return }
    const editor = editorRef.current
    if (!editor) { toast('Editor not ready — please wait a moment.', 'error'); return }

    setSaving(true)
    try {
      const payload = {
        tenant_id: tenantId,
        slug,
        title,
        meta_title: metaTitle || null,
        meta_description: metaDescription || null,
        meta_og_image: metaOgImage || null,
        published,
        editor_type: 'grapesjs' as const,
        gjs_data: editor.getProjectData(),
        content_html: editor.getHtml(),
        content_css: editor.getCss(),
        content: { sections: [] },
        updated_at: new Date().toISOString(),
      }

      if (page) {
        const { error } = await supabase.from('pages').update(payload).eq('id', page.id).eq('tenant_id', tenantId)
        if (error) throw error
      } else {
        const { error } = await supabase.from('pages').insert([payload])
        if (error) throw error
      }

      toast('Page saved!')
      setDirty(false)
      if (!page) { router.push('/admin/pages'); router.refresh() }
    } catch (err) {
      toast('Error: ' + (err instanceof Error ? err.message : String(err)), 'error')
    } finally {
      setSaving(false)
    }
  }, [slug, title, metaTitle, metaDescription, metaOgImage, published, page, tenantId, supabase, router])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); handleSave() }
    }
    globalThis.addEventListener('keydown', handler)
    return () => globalThis.removeEventListener('keydown', handler)
  }, [handleSave])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null
      if (!el || el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable) return
      if (e.key === '?' && !e.ctrlKey && !e.metaKey) { e.preventDefault(); setShortcutsOpen(true) }
      if (e.key === 'Escape' && shortcutsOpen) setShortcutsOpen(false)
    }
    globalThis.addEventListener('keydown', handler)
    return () => globalThis.removeEventListener('keydown', handler)
  }, [shortcutsOpen])

  const uploadSingleFile = useCallback(async (file: File): Promise<string | null> => {
    const ext = file.name.split('.').pop() || 'jpg'
    const path = `${tenantId}/pages/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`
    const { error } = await supabase.storage.from('tenant-media').upload(path, file, { cacheControl: '3600', upsert: false })
    if (error) { toast(`Upload failed: ${error.message}`, 'error'); return null }
    const { data: publicData } = supabase.storage.from('tenant-media').getPublicUrl(path)
    return publicData.publicUrl
  }, [supabase, tenantId])

  useEffect(() => {
    const editor = editorRef.current
    if (!editor) return
    const canvasDoc = editor.Canvas.getDocument()
    if (!canvasDoc) return
    let styleEl = canvasDoc.getElementById('tenant-theme-vars')
    if (!styleEl) { styleEl = canvasDoc.createElement('style'); styleEl.id = 'tenant-theme-vars'; canvasDoc.head.appendChild(styleEl) }
    styleEl.textContent = `
      :root {
        --font-heading: "${siteTheme.headingFont}", system-ui, sans-serif;
        --font-body: "${siteTheme.bodyFont}", system-ui, sans-serif;
        --color-primary: ${primaryColor};
      }
      body { font-family: var(--font-body); color: #333; }
      h1,h2,h3,h4,h5,h6 { font-family: var(--font-heading); }
    `
  }, [siteTheme, primaryColor])

  useEffect(() => { saveRef.current = handleSave }, [handleSave])

  useEffect(() => {
    const nav = document.querySelector('nav') as HTMLElement | null
    const main = document.querySelector('main') as HTMLElement | null
    if (nav) nav.style.display = 'none'
    if (main) { main.style.padding = '0'; main.style.margin = '0' }
    document.body.style.overflow = 'hidden'
    return () => {
      if (nav) nav.style.display = ''
      if (main) { main.style.padding = ''; main.style.margin = '' }
      document.body.style.overflow = ''
    }
  }, [])

  const onEditor = useCallback((editor: Editor) => {
    editorRef.current = editor
    ignoreDirtyRef.current = true

    registerDiggComponentResizeBehavior(editor)
    registerFloatingCommands(editor)
    registerMobileResponsiveCommands(editor)
    registerImageFocalOverlay(editor)

    if (page?.gjs_data && Object.keys(page.gjs_data).length > 0) {
      editor.loadProjectData(page.gjs_data as Parameters<Editor['loadProjectData']>[0])
    } else if (page?.content) {
      const sections = (page.content as { sections?: PageSection[] })?.sections ?? []
      if (sections.length > 0) editor.setComponents(sectionsToHtml(sections))
    }

    queueMicrotask(() => applyResizePolicyToEntireTree(editor))

    const refreshMobileHints = () => {
      const dev = editor.DeviceManager.getSelected()
      setPreviewDeviceNameRef.current(String(dev?.get('name') || 'desktop'))
      const sel = editor.getSelected()
      setSelectionMobileHintsRef.current(sel ? getMobileLayoutHintsForComponent(sel) : [])
    }

    editor.on('device:select', refreshMobileHints)
    queueMicrotask(refreshMobileHints)

    const mark = () => markDirtyRef.current()
    editor.on('component:add', mark)
    editor.on('component:remove', mark)
    editor.on('component:update', mark)
    editor.on('component:styleUpdate', () => { mark(); refreshMobileHints() })

    window.setTimeout(() => { ignoreDirtyRef.current = false }, 1000)

    editor.Commands.add('save', { run: () => saveRef.current() })
    editor.Commands.add('upload-image', { run: () => fileInputRef.current?.click() })
    editor.Commands.add('import-code', { run: () => setImportOpen(true) })
    editor.Commands.add('upload-theme', { run: () => themeInputRef.current?.click() })
    editor.Commands.add('settings', { run: () => setSettingsOpen(true) })

    supabase.from('products').select('name, images, slug').eq('tenant_id', tenantId).limit(50)
      .then(({ data }) => {
        if (data && data.length > 0) {
          editor.AssetManager.add(
            data.flatMap((p: any) => (p.images || []).map((url: string) => ({ src: url, name: p.name })))
          )
        }
      })

    editor.on('component:selected', (component) => {
      const smBtn = editor.Panels.getButton('views', 'open-sm')
      if (smBtn && !smBtn.get('active')) smBtn.set('active', true)
      refreshMobileHints()
    })

    editor.on('component:deselected', () => {
      refreshMobileHints()
      if (!editor.getSelected()) {
        const blkBtn = editor.Panels.getButton('views', 'open-blocks')
        if (blkBtn && !blkBtn.get('active')) blkBtn.set('active', true)
      }
    })

    const canvasDoc = editor.Canvas.getDocument()
    const canvasBody = editor.Canvas.getBody()
    if (canvasDoc && canvasBody) {
      canvasDoc.addEventListener('click', (e: Event) => {
        const link = (e.target as HTMLElement).closest('a')
        if (link) { e.preventDefault(); e.stopPropagation() }
      }, true)

      canvasDoc.addEventListener('submit', (e: Event) => { e.preventDefault(); e.stopPropagation() }, true)

      const prevent = (e: Event) => { e.preventDefault(); e.stopPropagation() }
      canvasDoc.addEventListener('dragover', prevent)
      canvasDoc.addEventListener('dragenter', prevent)
      canvasDoc.addEventListener('drop', async (e: Event) => {
        const de = e as DragEvent
        de.preventDefault(); de.stopPropagation()
        const files = de.dataTransfer?.files
        if (!files || files.length === 0) return
        const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'))
        if (imageFiles.length === 0) return
        toast(`Uploading ${imageFiles.length} image(s)...`, 'info')
        for (const file of imageFiles) {
          const url = await uploadSingleFile(file)
          if (url) {
            editor.AssetManager.add([{ src: url, type: 'image' as const }])
            const selected = editor.getSelected()
            if (selected && selected.get('type') === 'image') {
              selected.addAttributes({ src: url })
            } else {
              editor.addComponents({ type: 'image', attributes: { src: url }, style: { ...diggNewImageStyle } })
            }
          }
        }
        toast('Images uploaded — Save to keep layout.')
      })
    }
  }, [page, uploadSingleFile, supabase, tenantId])

  const uploadFile = useCallback(async (e: DragEvent | Event) => {
    const files = (e as DragEvent).dataTransfer
      ? (e as DragEvent).dataTransfer!.files
      : ((e as Event).target as HTMLInputElement).files
    if (!files) return
    const urls: string[] = []
    for (const file of Array.from(files)) {
      const url = await uploadSingleFile(file); if (url) urls.push(url)
    }
    if (editorRef.current && urls.length) {
      editorRef.current.AssetManager.add(urls.map(u => ({ src: u, type: 'image' as const })))
    }
  }, [uploadSingleFile])

  const handleFileSelected = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files; if (!files || files.length === 0) return
    toast('Uploading...', 'info')
    for (const file of Array.from(files)) {
      const url = await uploadSingleFile(file)
      if (url && editorRef.current) {
        editorRef.current.AssetManager.add([{ src: url, type: 'image' as const }])
        editorRef.current.addComponents({ type: 'image', attributes: { src: url }, style: { ...diggNewImageStyle } })
      }
    }
    toast('Image added — Save to keep.')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [uploadSingleFile])

  const loadSnippets = useCallback(async () => {
    setSnippetsLoading(true)
    try {
      const { data, error } = await supabase.from('builder_snippets').select('id, title, component, created_at').eq('tenant_id', tenantId).order('created_at', { ascending: false })
      if (error) throw error
      setSnippets((data as BuilderSnippet[]) ?? [])
    } catch { toast('Could not load saved blocks.', 'error'); setSnippets([]) }
    finally { setSnippetsLoading(false) }
  }, [supabase, tenantId])

  useEffect(() => { if (snippetsOpen) void loadSnippets() }, [snippetsOpen, loadSnippets])

  const saveSelectionAsSnippet = useCallback(async () => {
    const editor = editorRef.current; const sel = editor?.getSelected()
    if (!editor || !sel) { toast('Select a block first.', 'info'); return }
    if (sel.is('wrapper')) { toast('Select a block — not the whole page.', 'info'); return }
    const name = snippetSaveTitle.trim(); if (!name) { toast('Enter a name.', 'info'); return }
    const { error } = await supabase.from('builder_snippets').insert({ tenant_id: tenantId, title: name, component: sel.toJSON() })
    if (error) { toast(error.message, 'error'); return }
    toast(`Saved "${name}"`)
    setSnippetSaveTitle('')
    void loadSnippets()
  }, [snippetSaveTitle, supabase, tenantId, loadSnippets])

  const insertSnippet = useCallback((row: BuilderSnippet) => {
    const editor = editorRef.current; if (!editor) return
    try {
      editor.addComponents(JSON.parse(JSON.stringify(row.component)))
      queueMicrotask(() => applyResizePolicyToEntireTree(editor))
      setDirty(true); toast(`Inserted "${row.title}".`); setSnippetsOpen(false)
    } catch { toast('Could not insert block.', 'error') }
  }, [])

  const deleteSnippet = useCallback(async (id: string, title: string) => {
    if (!globalThis.confirm(`Delete "${title}"?`)) return
    const { error } = await supabase.from('builder_snippets').delete().eq('id', id).eq('tenant_id', tenantId)
    if (error) { toast(error.message, 'error'); return }
    toast('Block removed.')
    void loadSnippets()
  }, [supabase, tenantId, loadSnippets])

  const previewDeviceCategory = getPreviewDeviceCategory(previewDeviceName)

  return (
    <>
      <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileSelected} />
      <input ref={themeInputRef} type="file" accept=".html,.htm" className="hidden" onChange={async (e) => {
        const file = e.target.files?.[0]; if (!file || !editorRef.current) return
        editorRef.current.setComponents(await file.text()); toast('Theme applied!')
        if (themeInputRef.current) themeInputRef.current.value = ''
      }} />

      <div className="flex flex-col" style={{ position: 'fixed', inset: 0, zIndex: 9999, background: primaryColor }}>
        {/* Nav bar */}
        <div className="flex items-center px-2 gap-1.5 shrink-0" style={{ height: 36, background: primaryColor }}>
          <button onClick={() => confirmLeave(() => router.push('/admin/pages'))} className="text-white/70 hover:text-white p-1" title="Back to pages">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5m7-7l-7 7 7 7"/></svg>
          </button>
          <div className="relative">
            <button onClick={() => setPageSwitcherOpen(!pageSwitcherOpen)} className="flex items-center gap-1 bg-white/10 hover:bg-white/20 rounded px-2 py-0.5 text-white text-[11px] font-medium max-w-[160px]">
              <span className="truncate">{title || 'Select page'}</span>
              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
            </button>
            {pageSwitcherOpen && (
              <div className="absolute top-full left-0 mt-1 w-72 bg-white rounded-xl shadow-2xl border overflow-hidden" style={{ zIndex: 100001 }}>
                <div className="max-h-64 overflow-y-auto">
                  {allPages.map((p) => (
                    <button key={p.id} onClick={() => confirmLeave(() => { setPageSwitcherOpen(false); window.location.href = `/admin/pages/${p.id}` })}
                      className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex justify-between ${p.id === page?.id ? 'bg-blue-50 text-blue-800 font-semibold' : 'text-gray-700'}`}>
                      <span className="truncate">{p.title}</span>
                      <span className="text-[10px] text-gray-400 ml-2">/{p.slug}</span>
                    </button>
                  ))}
                </div>
                <div className="p-2 border-t">
                  <button onClick={() => confirmLeave(() => { setPageSwitcherOpen(false); router.push('/admin/pages/new') })}
                    className="w-full text-left px-4 py-2.5 text-sm font-semibold hover:bg-orange-50 rounded-lg flex items-center gap-2" style={{ color: '#F7941D' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    New Page
                  </button>
                </div>
              </div>
            )}
          </div>
          <input type="text" value={title} onChange={(e) => { setTitle(e.target.value); setDirty(true) }}
            className="bg-transparent text-white/50 text-[10px] border-none outline-none focus:text-white rounded px-1 py-0.5 w-20 hidden sm:block" />
          <div className="flex-1" />
          {dirty && <span className="text-[10px] font-semibold text-amber-200 hidden sm:inline">Unsaved</span>}
          <button onClick={() => { setPublished(p => !p); setDirty(true) }}
            className={`px-2 py-0.5 rounded text-[10px] font-semibold ${published ? 'bg-green-500/80' : 'bg-gray-500/80'} text-white`}>
            {published ? 'Live' : 'Draft'}
          </button>
          <button onClick={handleSave} disabled={saving} className="bg-orange-500 text-white px-3 py-0.5 rounded text-[11px] font-semibold hover:bg-orange-400 disabled:opacity-50">
            {saving ? '...' : 'Save'}
          </button>
        </div>

        {/* Tools bar */}
        <div className="bg-[#353535] flex items-center px-2 gap-1 border-t border-white/10 shrink-0 flex-wrap" style={{ height: 36 }}>
          {[['Undo', () => editorRef.current?.UndoManager.undo()], ['Redo', () => editorRef.current?.UndoManager.redo()]].map(([label, fn]) => (
            <button key={label as string} onClick={fn as () => void} className="px-1 py-1 text-white/60 hover:text-white rounded text-[11px]">{label as string}</button>
          ))}
          <div className="w-px h-5 bg-white/20" />
          <button onClick={() => { const e = editorRef.current; if (e) { e.select(); e.Panels.getButton('views','open-blocks')?.set('active',true) } }}
            className="flex items-center gap-1 bg-blue-400/20 hover:bg-blue-400/30 rounded px-2 py-1 text-blue-300 text-[11px] font-semibold">+ Blocks</button>
          <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1 bg-white/10 hover:bg-white/20 rounded px-2 py-1 text-white text-[11px]">Image</button>
          <button onClick={() => setImportOpen(true)} className="flex items-center gap-1 bg-white/10 hover:bg-white/20 rounded px-2 py-1 text-white text-[11px]">Code</button>
          <button onClick={() => themeInputRef.current?.click()} className="flex items-center gap-1 bg-white/10 hover:bg-white/20 rounded px-2 py-1 text-white text-[11px]">Theme</button>
          <button onClick={() => setStartersOpen(true)} className="flex items-center gap-1 bg-white/10 hover:bg-white/20 rounded px-2 py-1 text-white text-[11px]">Starters</button>
          <button onClick={() => setSnippetsOpen(true)} className="flex items-center gap-1 bg-white/10 hover:bg-white/20 rounded px-2 py-1 text-white text-[11px]">My blocks</button>
          <div className="w-px h-5 bg-white/20 hidden lg:block" />
          {['digg:mobile-stack','digg:mobile-full','digg:mobile-text'].map((cmd, i) => (
            <button key={cmd} onClick={() => editorRef.current?.runCommand(cmd)}
              className="hidden lg:flex items-center gap-1 bg-emerald-900/40 hover:bg-emerald-800/50 rounded px-2 py-1 text-emerald-100 text-[11px]">
              {['M stack','M full','M text'][i]}
            </button>
          ))}
          <div className="flex-1" />
          <button onClick={() => setShortcutsOpen(true)} className="p-1 text-white/60 hover:text-white text-[11px] font-semibold px-1">?</button>
          <button onClick={() => setSettingsOpen(!settingsOpen)} className="p-1 text-white/60 hover:text-white" title="Page settings">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
          </button>
        </div>

        {/* Mobile hints bar */}
        {(previewDeviceCategory !== 'desktop' || selectionMobileHints.length > 0) && (
          <div className="shrink-0 border-b border-amber-500/35 bg-gradient-to-r from-amber-950/90 to-slate-900 px-3 py-2 flex flex-wrap items-center gap-2 text-[11px] text-amber-50/95">
            {previewDeviceCategory !== 'desktop' && <span className="font-semibold text-amber-200">{previewDeviceCategory === 'mobile' ? 'Mobile' : 'Tablet'} preview</span>}
            <button onClick={() => { const e = editorRef.current; const s = e?.getSelected(); if (e && s) { applyFlexibleWidthToComponent(s); toast('Applied flex width.') } }}
              className="px-2 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/35 text-amber-100 font-semibold border border-amber-400/30 text-[10px]">Flex width on selection</button>
            {selectionMobileHints.map((h) => <span key={h} className="text-amber-100/90">{h}</span>)}
          </div>
        )}

        {/* Canvas */}
        <div className="flex-1 min-h-0 relative">
          <GjsEditor
            grapesjs={grapesjs}
            grapesjsCss="https://unpkg.com/grapesjs/dist/css/grapes.min.css"
            options={{
              height: '100%',
              storageManager: false,
              undoManager: { trackSelection: false },
              canvas: { styles: [googleFontsUrl(GOOGLE_FONT_OPTIONS)] },
              deviceManager: {
                devices: [
                  { name: 'desktop', width: '' },
                  { name: 'tablet', width: '768px', widthMedia: '992px' },
                  { name: 'mobile', width: '375px', widthMedia: '480px' },
                ],
              },
              styleManager: {
                sectors: [
                  { name: 'Typography', open: true, properties: [
                    { property: 'font-family', type: 'select', defaults: `"${siteTheme.headingFont}", sans-serif`,
                      options: [
                        { id: 'Arial, Helvetica, sans-serif', label: 'Arial' },
                        { id: 'Georgia, serif', label: 'Georgia' },
                        ...GOOGLE_FONT_OPTIONS.map(f => ({ id: `"${f}", sans-serif`, label: f })),
                      ] },
                    'font-size', 'font-weight', 'letter-spacing', 'color', 'line-height', 'text-align', 'text-decoration', 'text-transform', 'text-shadow',
                  ]},
                  diggAlignmentSector,
                  { name: 'Layout', open: false, properties: ['display','flex-direction','justify-content','align-items','flex-wrap','float','position','top','right','bottom','left'] },
                  { name: 'Size & Spacing', open: false, properties: ['width','height','max-width','min-height','margin','padding'] },
                  diggImageFramingSector,
                  { name: 'Appearance', open: false, properties: ['opacity','border-radius','border','box-shadow','background','background-color'] },
                  { name: 'Effects', open: false, properties: ['transition','perspective','transform','overflow'] },
                ],
              },
              plugins: [diggBlocksPlugin, gjsBlocksBasic, gjsPresetWebpage, gjsPluginForms, gjsCustomCode, gjsNavbar, gjsCountdown, gjsStyleBg, gjsTabs],
              pluginsOpts: {
                [gjsBlocksBasic as unknown as string]: { flexGrid: true },
                [gjsPresetWebpage as unknown as string]: { modalImportTitle: 'Import HTML', modalImportButton: 'Import' },
                [gjsPluginForms as unknown as string]: { blocks: ['form','input','textarea','select','button','label','checkbox','radio'] },
                [gjsNavbar as unknown as string]: {},
                [gjsCountdown as unknown as string]: {},
                [gjsStyleBg as unknown as string]: {},
                [gjsTabs as unknown as string]: { tabsBlock: { category: 'Extra' } },
              },
              assetManager: { uploadFile, assets: [] },
            }}
            onEditor={onEditor}
          />
        </div>
      </div>

      {/* Modals */}
      {shortcutsOpen && (
        <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 100000 }} onClick={() => setShortcutsOpen(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">Keyboard shortcuts</h3>
            <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-2 text-sm">
              <dt className="text-gray-600">Save</dt><dd className="font-mono text-right">Ctrl / ⌘ + S</dd>
              <dt className="text-gray-600">Undo</dt><dd className="font-mono text-right">Ctrl + Z</dd>
              <dt className="text-gray-600">Redo</dt><dd className="font-mono text-right">Ctrl + Shift + Z</dd>
              <dt className="text-gray-600">Delete selected</dt><dd className="font-mono text-right">Delete / Backspace</dd>
              <dt className="text-gray-600">Shortcuts panel</dt><dd className="font-mono text-right">?</dd>
            </dl>
            <button onClick={() => setShortcutsOpen(false)} className="mt-4 text-sm text-gray-500 hover:text-gray-700">Close</button>
          </div>
        </div>
      )}

      {startersOpen && (
        <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 100000 }} onClick={() => setStartersOpen(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-2">Page starters</h3>
            <p className="text-sm text-gray-500 mb-4">Replace the canvas with a ready-made layout.</p>
            <div className="grid gap-3 sm:grid-cols-3">
              {PAGE_STARTERS.map((s) => (
                <button key={s.id} onClick={() => {
                  const ed = editorRef.current; if (!ed) return
                  const count = ed.getWrapper()?.components().length ?? 0
                  if (count > 0 && !globalThis.confirm('Replace everything with this starter?')) return
                  ed.setComponents(s.html); setStartersOpen(false); toast('Starter applied — customize and Save.')
                }} className="text-left p-4 rounded-xl border border-gray-200 hover:border-orange-400 hover:bg-orange-50/50 transition-colors">
                  <span className="font-semibold block">{s.title}</span>
                  <span className="text-xs text-gray-500 mt-1 block">{s.description}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {snippetsOpen && (
        <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 100000 }} onClick={() => setSnippetsOpen(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-2">My blocks</h3>
            <p className="text-sm text-gray-500 mb-4">Reusable sections saved from this store.</p>
            <div className="flex gap-2 mb-3">
              <input type="text" value={snippetSaveTitle} onChange={e => setSnippetSaveTitle(e.target.value)} placeholder="Name for saved block"
                className="flex-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-400 focus:border-transparent" />
              <button onClick={() => void saveSelectionAsSnippet()} className="px-4 py-2 rounded-lg bg-orange-500 text-white text-sm font-semibold hover:bg-orange-400 shrink-0">Save selection</button>
            </div>
            <div className="border-t pt-4 mt-2">
              {snippetsLoading ? <p className="text-sm text-gray-400">Loading…</p>
                : snippets.length === 0 ? <p className="text-sm text-gray-400">No saved blocks yet.</p>
                : <ul className="space-y-2">{snippets.map(s => (
                  <li key={s.id} className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2 hover:bg-gray-50">
                    <span className="text-sm font-medium truncate">{s.title}</span>
                    <span className="flex gap-2 shrink-0">
                      <button onClick={() => insertSnippet(s)} className="text-xs font-semibold text-blue-700 hover:underline">Insert</button>
                      <button onClick={() => void deleteSnippet(s.id, s.title)} className="text-xs text-red-600 hover:underline">Delete</button>
                    </span>
                  </li>
                ))}</ul>}
            </div>
          </div>
        </div>
      )}

      {importOpen && (
        <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 100000 }} onClick={() => setImportOpen(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-2">Import HTML / Code</h3>
            <p className="text-sm text-gray-500 mb-3">Paste any HTML — a full template, a section, or code from any builder.</p>
            <textarea value={importCode} onChange={e => setImportCode(e.target.value)}
              placeholder={'<section>\n  <h1>My Page</h1>\n</section>'} rows={12}
              className="w-full px-4 py-3 border rounded-xl font-mono text-sm focus:ring-2 focus:ring-orange-400 resize-none" />
            <div className="flex gap-3 mt-4">
              <button onClick={() => { if (!importCode.trim() || !editorRef.current) return; editorRef.current.setComponents(importCode); setImportOpen(false); setImportCode(''); toast('Code imported!') }}
                disabled={!importCode.trim()} className="bg-orange-500 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-orange-400 disabled:opacity-40">Replace</button>
              <button onClick={() => { if (!importCode.trim() || !editorRef.current) return; editorRef.current.addComponents(importCode); setImportOpen(false); setImportCode(''); toast('Code added!') }}
                disabled={!importCode.trim()} className="bg-blue-700 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-blue-600 disabled:opacity-40">Add Below</button>
              <button onClick={() => setImportOpen(false)} className="px-6 py-2.5 text-gray-500 font-medium hover:text-gray-700">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {settingsOpen && (
        <div className="fixed inset-0" style={{ zIndex: 100000 }} onClick={() => setSettingsOpen(false)}>
          <div className="absolute inset-0 bg-black/30" />
          <div className="absolute right-0 top-0 bottom-0 w-96 bg-white shadow-2xl p-6 overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold">Page Settings</h3>
              <button onClick={() => setSettingsOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            {[
              { label: 'URL Slug', value: slug, setter: setSlug, type: 'text', help: `yoursite.com/${slug || 'page-url'}` },
              { label: 'Meta Title (SEO)', value: metaTitle, setter: setMetaTitle, type: 'text' },
              { label: 'Social Share Image URL', value: metaOgImage, setter: setMetaOgImage, type: 'text' },
            ].map(({ label, value, setter, type, help }) => (
              <label key={label} className="block mb-4">
                <span className="text-sm font-medium text-gray-700">{label}</span>
                <input type={type} value={value} onChange={e => { setter(e.target.value); setDirty(true) }}
                  className="mt-1 block w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-400 focus:border-transparent" />
                {help && <span className="text-xs text-gray-400 mt-1 block">{help}</span>}
              </label>
            ))}
            <label className="block mb-4">
              <span className="text-sm font-medium text-gray-700">Meta Description</span>
              <textarea value={metaDescription} onChange={e => { setMetaDescription(e.target.value); setDirty(true) }} rows={3}
                className="mt-1 block w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-400" />
            </label>
            <div className="mt-6 pt-4 border-t">
              <button onClick={() => { if (!editorRef.current || !globalThis.confirm('Clear all page content?')) return; editorRef.current.DomComponents.clear(); toast('Canvas cleared') }}
                className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 rounded-lg font-medium">Clear All Content</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
