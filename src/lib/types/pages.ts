export type EditorType = 'sections' | 'grapesjs'

export interface Page {
  id: string
  tenant_id: string
  slug: string
  title: string
  content: PageContent
  meta_title: string | null
  meta_description: string | null
  meta_og_image: string | null
  published: boolean
  editor_type: EditorType
  gjs_data: Record<string, unknown> | null
  content_html: string | null
  content_css: string | null
  created_at: string
  updated_at: string
}

export interface PageContent {
  sections: PageSection[]
}

export type SectionType =
  | 'hero' | 'text' | 'image' | 'grid' | 'stats'
  | 'products' | 'cta' | 'form' | 'testimonial' | 'video'
  | 'gallery' | 'two_column' | 'logos' | 'faq' | 'divider'

export interface PageSection {
  type: SectionType
  data: Record<string, unknown>
}

export interface BuilderSnippet {
  id: string
  tenant_id: string
  title: string
  component: Record<string, unknown>
  created_at: string
}
