import type { Component, Editor } from 'grapesjs'

const OVERLAY_CLASS = 'digg-img-focal-overlay'
const MIN_ZOOM = 0.5
const MAX_ZOOM = 3
const ZOOM_STEP = 0.06

function parseObjectPosition(op: string | undefined): [number, number] {
  if (!op || typeof op !== 'string') return [50, 50]
  const t = op.trim()
  const m = t.match(/^([\d.]+)%\s+([\d.]+)%$/)
  if (m) {
    return [
      Math.min(100, Math.max(0, parseFloat(m[1]))),
      Math.min(100, Math.max(0, parseFloat(m[2]))),
    ]
  }
  return [50, 50]
}

function readScale(style: Record<string, unknown>): number {
  const t = style.transform
  if (!t || typeof t !== 'string' || t === 'none') return 1
  const scaleMatch = t.match(/scale\(\s*([\d.]+)\s*(?:,\s*([\d.]+))?\s*\)/)
  if (scaleMatch) {
    const a = parseFloat(scaleMatch[1])
    return Number.isFinite(a) ? a : 1
  }
  return 1
}

function applyImageView(
  component: Component,
  focal: [number, number],
  scale: number,
  dot?: HTMLElement
) {
  const [cx, cy] = focal
  const s = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, scale))
  component.addStyle({
    'object-position': `${cx}% ${cy}%`,
    'transform-origin': `${cx}% ${cy}%`,
  })
  if (s === 1) {
    component.removeStyle('transform')
  } else {
    component.addStyle({ transform: `scale(${s})` })
  }
  if (dot) {
    dot.style.left = `${cx}%`
    dot.style.top = `${cy}%`
  }
}

function removeFocalOverlays(editor: Editor) {
  editor.Canvas.getDocument()?.querySelectorAll(`.${OVERLAY_CLASS}`).forEach((n) => n.remove())
}

function mountFocalOverlay(editor: Editor, component: Component) {
  removeFocalOverlays(editor)
  if (component.get('type') !== 'image') return

  const view = component.getView()
  const el = view?.el as HTMLElement | undefined
  if (!el || el.tagName !== 'IMG') return

  const doc = editor.Canvas.getDocument()
  if (!doc) return

  const parent = el.parentElement
  if (!parent) return

  if (!parent.style.position || parent.style.position === 'static') {
    parent.style.position = 'relative'
  }
  parent.style.overflow = 'hidden'

  const overlay = doc.createElement('div')
  overlay.className = OVERLAY_CLASS
  overlay.style.cssText =
    'position:absolute;inset:0;z-index:6;cursor:crosshair;pointer-events:auto;border:1px dashed rgba(247,148,29,0.45);box-sizing:border-box;'

  const style = component.getStyle() || {}
  const op = (style['object-position'] as string) || '50% 50%'
  let [px, py] = parseObjectPosition(op)
  let scale = readScale(style as Record<string, unknown>)
  if (scale === 1 && (style.transform === undefined || style.transform === 'none')) {
    scale = 1
  }

  const hint = doc.createElement('div')
  const refreshHint = () => {
    hint.textContent = `Drag — focal • Wheel — zoom (${Math.round(scale * 100)}%) • Corners — frame size`
  }
  refreshHint()
  hint.style.cssText =
    'position:absolute;top:4px;left:4px;right:4px;font:10px/1.3 system-ui,sans-serif;background:rgba(27,42,107,0.9);color:#fff;padding:4px 7px;border-radius:4px;pointer-events:none;text-align:left;'

  const dot = doc.createElement('div')
  dot.style.cssText = `position:absolute;width:20px;height:20px;border:3px solid #F7941D;border-radius:50%;background:rgba(255,255,255,0.4);transform:translate(-50%,-50%);left:${px}%;top:${py}%;pointer-events:none;box-shadow:0 1px 4px rgba(0,0,0,0.25);`

  overlay.appendChild(hint)
  overlay.appendChild(dot)

  applyImageView(component, [px, py], scale, dot)

  const applyFocalFromEvent = (e: MouseEvent) => {
    const r = el.getBoundingClientRect()
    if (r.width <= 0 || r.height <= 0) return
    const x = ((e.clientX - r.left) / r.width) * 100
    const y = ((e.clientY - r.top) / r.height) * 100
    px = Math.max(0, Math.min(100, x))
    py = Math.max(0, Math.min(100, y))
    applyImageView(component, [px, py], scale, dot)
    refreshHint()
  }

  overlay.addEventListener('mousedown', (e) => {
    e.preventDefault()
    e.stopPropagation()
    applyFocalFromEvent(e)

    const onMove = (ev: MouseEvent) => {
      applyFocalFromEvent(ev)
    }
    const onUp = () => {
      doc.removeEventListener('mousemove', onMove)
      doc.removeEventListener('mouseup', onUp)
    }
    doc.addEventListener('mousemove', onMove)
    doc.addEventListener('mouseup', onUp)
  })

  overlay.addEventListener(
    'wheel',
    (e) => {
      e.preventDefault()
      e.stopPropagation()
      const next = scale + (e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP)
      scale = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, next))
      applyImageView(component, [px, py], scale, dot)
      refreshHint()
    },
    { passive: false }
  )

  parent.appendChild(overlay)
}

/**
 * Image selected: dashed overlay — drag focal (object-position), wheel zoom (transform scale),
 * transform-origin follows focal. Frame size remains GrapesJS corner resize.
 */
export function registerImageFocalOverlay(editor: Editor) {
  const refresh = () => {
    const sel = editor.getSelected()
    removeFocalOverlays(editor)
    if (sel && sel.get('type') === 'image') mountFocalOverlay(editor, sel)
  }

  editor.on('component:deselected', () => {
    removeFocalOverlays(editor)
  })

  editor.on('component:selected', (component: Component) => {
    removeFocalOverlays(editor)
    if (component.get('type') === 'image') mountFocalOverlay(editor, component)
  })

  editor.on('canvas:frame:load', () => {
    removeFocalOverlays(editor)
    queueMicrotask(refresh)
  })
}
