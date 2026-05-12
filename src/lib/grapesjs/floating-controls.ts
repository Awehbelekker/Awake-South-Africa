import type { Editor } from 'grapesjs'
import { applyResizePolicy } from '@/lib/grapesjs/component-defaults'

/**
 * Free placement for CTAs: absolute position + parent relative so users can drag (toolbar move) and resize corners.
 */
export function registerFloatingCommands(editor: Editor) {
  editor.Commands.add('digg:float', {
    run() {
      const c = editor.getSelected()
      if (!c) return
      const tag = (c.get('tagName') || '').toLowerCase()
      const type = c.get('type')
      const allowed = tag === 'a' || tag === 'button' || type === 'link'
      if (!allowed) return

      const parent = c.parent()
      if (parent && !parent.is('wrapper')) {
        const pStyle = parent.getStyle() || {}
        const pp = String(pStyle.position || '').toLowerCase()
        if (pp !== 'absolute' && pp !== 'relative' && pp !== 'fixed') {
          parent.addStyle({ position: 'relative' })
        }
      }

      c.addStyle({
        position: 'absolute',
        top: '24px',
        left: '24px',
        'z-index': '2',
      })
      applyResizePolicy(c)
    },
  })

  editor.Commands.add('digg:unfloat', {
    run() {
      const c = editor.getSelected()
      if (!c) return
      for (const p of ['position', 'top', 'right', 'bottom', 'left', 'z-index'] as const) {
        c.removeStyle(p)
      }
      applyResizePolicy(c)
    },
  })
}
