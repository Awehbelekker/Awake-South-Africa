'use client'

import { useCallback, useEffect, useRef } from 'react'

const DEFAULT_MESSAGE = 'You have unsaved changes. Leave without saving?'

/**
 * Browser tab close / refresh warning + programmatic confirm helper for in-app navigation.
 */
export function useUnsavedChangesAlert(dirty: boolean, message: string = DEFAULT_MESSAGE) {
  const dirtyRef = useRef(false)
  useEffect(() => {
    dirtyRef.current = dirty
  }, [dirty])

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!dirtyRef.current) return
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [])

  const confirmLeave = useCallback(
    (action: () => void) => {
      if (!dirtyRef.current) {
        action()
        return
      }
      if (globalThis.confirm(message)) action()
    },
    [message]
  )

  return { confirmLeave, dirtyRef }
}
