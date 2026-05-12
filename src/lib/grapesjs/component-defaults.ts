import type { Component, Editor, ResizerOptions } from 'grapesjs'

/** Block / layout elements: drag corners to resize width & height in the canvas. */
const RESIZE_BOX: ResizerOptions = {
  minDim: 40,
  step: 1,
}

/** Images: keep aspect ratio while resizing by default. */
const RESIZE_IMAGE: ResizerOptions = {
  minDim: 32,
  step: 1,
  ratioDefault: true,
}

/** Tags where resize handles fight UX (forms, media, table structure, inline text). */
const NO_RESIZE_TAGS = new Set([
  'input',
  'textarea',
  'select',
  'button',
  'label',
  'form',
  'iframe',
  'svg',
  'br',
  'hr',
  'meta',
  'link',
  'style',
  'script',
  'base',
  'col',
  'colgroup',
  'track',
  'source',
  'param',
  'area',
  'map',
  'object',
  'embed',
  'canvas',
  'picture',
  'td',
  'th',
  'tr',
  'tbody',
  'thead',
  'tfoot',
  'caption',
])

/** Inline / phrasing tags — avoid box resize on tiny wrappers. */
const NO_RESIZE_INLINE = new Set([
  'a',
  'span',
  'strong',
  'em',
  'b',
  'i',
  'small',
  'sub',
  'sup',
  'code',
  'mark',
  'cite',
  'abbr',
  'time',
  'u',
  's',
])

export function applyResizePolicy(component: Component) {
  if (component.is('wrapper')) {
    component.set('resizable', false)
    return
  }

  const type = component.get('type')
  const tag = (component.get('tagName') || '').toLowerCase()
  const style = component.getStyle() || {}
  const pos = String(style.position || '').toLowerCase()

  if (type === 'image') {
    component.set('resizable', { ...RESIZE_IMAGE })
    return
  }

  /** Floated links / buttons: drag (toolbar) + corner resize */
  const isFloated =
    (pos === 'absolute' || pos === 'fixed') &&
    (tag === 'a' || tag === 'button' || type === 'link')
  if (isFloated) {
    component.set('resizable', { minDim: 36, step: 1, ratioDefault: false })
    return
  }

  /** Block text (paragraphs, headings): mouse-resize the text box */
  if (type === 'text') {
    const blockText = new Set(['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote'])
    if (blockText.has(tag)) {
      component.set('resizable', { minDim: 48, step: 1, ratioDefault: false })
      return
    }
    component.set('resizable', false)
    return
  }

  if (type === 'link') {
    component.set('resizable', false)
    return
  }

  if (NO_RESIZE_TAGS.has(tag) || NO_RESIZE_INLINE.has(tag)) {
    component.set('resizable', false)
    return
  }

  component.set('resizable', { ...RESIZE_BOX })
}

/** Re-apply resize rules to every component (e.g. after loading saved project data). */
export function applyResizePolicyToEntireTree(editor: Editor) {
  const root = editor.getWrapper()
  if (!root) return
  const visit = (c: Component) => {
    applyResizePolicy(c)
    c.components().forEach((child: Component) => visit(child))
  }
  visit(root)
}

/**
 * Enables canvas resize handles where safe, and keeps images at aspect ratio by default.
 * Call once from `onEditor` before loading project data.
 */
export function registerDiggComponentResizeBehavior(editor: Editor) {
  editor.on('component:add', (component: Component) => {
    applyResizePolicy(component)
  })
  editor.on('load', () => {
    applyResizePolicyToEntireTree(editor)
  })
}
