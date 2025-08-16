"use client"

import { useEffect } from 'react'

/**
 * Hook to fix Radix UI Dialog pointer-events issue
 * This ensures that pointer-events: none is properly cleaned up from the body
 */
export const useDialogPointerEventsFix = (isOpen: boolean) => {
  useEffect(() => {
    if (!isOpen) {
      // When dialog closes, ensure pointer-events is cleaned up
      const timer = setTimeout(() => {
        const body = document.body
        if (body.style.pointerEvents === 'none') {
          body.style.pointerEvents = 'auto'
        }
        
        // Also remove the style attribute if it only contains pointer-events
        const styleAttr = body.getAttribute('style')
        if (styleAttr === 'pointer-events: none;' || styleAttr === 'pointer-events: none') {
          body.removeAttribute('style')
        }
      }, 100) // Small delay to let Radix cleanup first
      
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      const body = document.body
      if (body.style.pointerEvents === 'none') {
        body.style.pointerEvents = 'auto'
      }
    }
  }, [])
}

/**
 * Enhanced version that also handles escape key and outside clicks
 */
export const useDialogEnhancedFix = (isOpen: boolean) => {
  useDialogPointerEventsFix(isOpen)
  
  useEffect(() => {
    if (!isOpen) return
    
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        // Ensure cleanup after escape key
        setTimeout(() => {
          const body = document.body
          if (body.style.pointerEvents === 'none') {
            body.style.pointerEvents = 'auto'
          }
        }, 150)
      }
    }
    
    document.addEventListener('keydown', handleEscapeKey)
    return () => document.removeEventListener('keydown', handleEscapeKey)
  }, [isOpen])
}
