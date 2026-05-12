import type { Component, Editor } from 'grapesjs'
function showToast(msg: string, type?: string) {
  const el = document.createElement('div')
  const colors: Record<string, string> = { success: '#22c55e', error: '#ef4444', info: '#3b82f6' }
  el.style.cssText = `position:fixed;bottom:24px;right:24px;z-index:200000;background:${colors[type||'success']};color:white;padding:10px 18px;border-radius:10px;font-size:14px;font-weight:500;box-shadow:0 4px 16px rgba(0,0,0,.18);`
  el.textContent = msg; document.body.appendChild(el); setTimeout(() => el.remove(), 3500)
}

/** Aligns with common “phone / small tablet” layout breakpoint */
const MEDIA_MOBILE = '(max-width: 767px)'

function getOrCreateRspClass(comp: Component): string {
  const attrs = comp.getAttributes()
  let cls = attrs['data-digg-rsp'] as string | undefined
  if (!cls) {
    cls = `digg-rsp-${Math.random().toString(36).slice(2, 11)}`
    comp.addAttributes({ 'data-digg-rsp': cls })
  }
  comp.addClass(cls)
  return cls
}

function requireSelection(editor: Editor): Component | null {
  const c = editor.getSelected()
  if (!c) {
    showToast('Select a block first.', 'info')
    return null
  }
  if (c.is('wrapper')) {
    showToast('Select a section or element — not the whole page.', 'info')
    return null
  }
  return c
}

function setMobileRule(editor: Editor, comp: Component, style: Record<string, string>) {
  const cls = getOrCreateRspClass(comp)
  editor.Css.setRule(`.${cls}`, style, {
    atRuleType: 'media',
    atRuleParams: MEDIA_MOBILE,
    addStyles: true,
  })
}

/**
 * One-click helpers that add @media (max-width: 767px) rules scoped to the selection.
 */
export function registerMobileResponsiveCommands(editor: Editor) {
  editor.Commands.add('digg:mobile-stack', {
    run() {
      const c = requireSelection(editor)
      if (!c) return
      setMobileRule(editor, c, {
        'flex-direction': 'column',
        'align-items': 'stretch',
        'flex-wrap': 'nowrap',
        gap: '1rem',
      })
      showToast('Mobile: stack columns (≤767px). Use device preview to check.')
    },
  })

  editor.Commands.add('digg:mobile-full', {
    run() {
      const c = requireSelection(editor)
      if (!c) return
      setMobileRule(editor, c, {
        width: '100%',
        'max-width': '100%',
        'box-sizing': 'border-box',
      })
      showToast('Mobile: full width (≤767px).')
    },
  })

  editor.Commands.add('digg:mobile-text', {
    run() {
      const c = requireSelection(editor)
      if (!c) return
      setMobileRule(editor, c, {
        'font-size': '1rem',
        'line-height': '1.5',
      })
      showToast('Mobile: comfortable text size (≤767px).')
    },
  })
}
