import type { Component } from 'grapesjs'

/** Map GrapesJS device name to a simple category. */
export function getPreviewDeviceCategory(deviceName: string | undefined): 'desktop' | 'tablet' | 'mobile' {
  const n = (deviceName || 'desktop').toLowerCase()
  if (n.includes('mobile')) return 'mobile'
  if (n.includes('tablet')) return 'tablet'
  return 'desktop'
}

function parsePx(value: string | undefined): number | null {
  if (!value || typeof value !== 'string') return null
  const m = value.trim().match(/^([\d.]+)\s*px$/i)
  return m ? parseFloat(m[1]) : null
}

function parseRem(value: string | undefined): number | null {
  if (!value || typeof value !== 'string') return null
  const m = value.trim().match(/^([\d.]+)\s*rem$/i)
  return m ? parseFloat(m[1]) : null
}

/**
 * Heuristic hints when styles may cause small-screen issues (not a full layout engine).
 */
export function getMobileLayoutHintsForComponent(component: Component): string[] {
  const style = component.getStyle() || {}
  const hints: string[] = []

  const width = style.width as string | undefined
  const minW = style['min-width'] as string | undefined
  const maxW = style['max-width'] as string | undefined
  const pos = (style.position as string | undefined)?.toLowerCase()
  const fs = style['font-size'] as string | undefined
  const overflow = (style.overflow as string | undefined)?.toLowerCase()
  const display = (style.display as string | undefined)?.toLowerCase()

  const wPx = parsePx(width)
  if (wPx !== null && wPx > 420) {
    hints.push(`Fixed width (${width}) can overflow narrow screens — try max-width: 100% or relative units.`)
  }

  const minPx = parsePx(minW)
  if (minPx !== null && minPx > 360) {
    hints.push(`Large min-width (${minW}) may cause horizontal scrolling on phones.`)
  }

  if (pos === 'absolute' || pos === 'fixed') {
    hints.push('Absolute/fixed positioning can overlap or clip on small viewports — check tablet/mobile preview.')
  }

  if (fs) {
    const rem = parseRem(fs)
    const fPx = parsePx(fs)
    if (rem !== null && rem > 3.5) {
      hints.push(`Very large text (${fs}) — confirm it still fits on a 375px-wide canvas.`)
    } else if (fPx !== null && fPx > 56) {
      hints.push(`Very large text (${fs}) — confirm readability on mobile.`)
    }
  }

  if (overflow === 'hidden') {
    hints.push('overflow: hidden may clip content when the layout reflows — verify on mobile preview.')
  }

  if (display === 'grid' || display === 'flex') {
    const dir = (style['flex-direction'] as string | undefined)?.toLowerCase()
    if (display === 'flex' && dir === 'row') {
      hints.push('Row flex can squeeze on phones — consider flex-wrap or column on small screens (Layout → flex-direction).')
    }
  }

  if (maxW && typeof maxW === 'string' && maxW.trim() === 'none' && wPx !== null && wPx > 600) {
    hints.push('A wide fixed block may feel edge-to-edge on mobile — try a max-width or % width.')
  }

  return hints.slice(0, 5)
}

/** Safe “Canva-style” helper: keep box within the frame without rewriting the whole layout. */
export function applyFlexibleWidthToComponent(component: Component) {
  component.addStyle({
    'max-width': '100%',
    'box-sizing': 'border-box',
  })
}
