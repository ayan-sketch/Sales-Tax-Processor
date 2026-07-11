import { useEffect, useCallback } from 'react'
import { useDocumentStore } from '../stores/useDocumentStore'
import { useFilterStore } from '../stores/useFilterStore'

interface ShortcutHandlers {
  onUpload?: () => void
  onSearchFocus?: () => void
  onDeleteSelected?: () => void
}

/**
 * Registers keyboard shortcuts for the Documents module.
 * 
 * Shortcuts:
 * - Ctrl+K / Cmd+K: Focus search
 * - Ctrl+U / Cmd+U: Open upload dialog
 * - G: Switch to grid view
 * - L: Switch to list view
 * - Escape: Clear selection / close panels
 * - Delete/Backspace: Delete selected (with confirmation)
 * - Ctrl+A / Cmd+A: Select all visible documents
 */
export function useDocumentKeyboardShortcuts(handlers: ShortcutHandlers = {}) {
  const { setViewMode, deselectAll, selectAll, getSelectedIds } = useDocumentStore()
  const { setFilterPanelOpen, resetFilters, isFilterPanelOpen } = useFilterStore()

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
        // Allow Escape to blur inputs
        if (e.key === 'Escape') {
          target.blur()
          return
        }
        return
      }

      const isCmd = e.metaKey || e.ctrlKey

      // Ctrl/Cmd + K: Focus search
      if (isCmd && e.key === 'k') {
        e.preventDefault()
        handlers.onSearchFocus?.()
        return
      }

      // Ctrl/Cmd + U: Open upload
      if (isCmd && e.key === 'u') {
        e.preventDefault()
        handlers.onUpload?.()
        return
      }

      // Ctrl/Cmd + A: Select all
      if (isCmd && e.key === 'a') {
        e.preventDefault()
        selectAll()
        return
      }

      // G: Grid view
      if (e.key === 'g' && !isCmd) {
        setViewMode('grid')
        return
      }

      // L: List view
      if (e.key === 'l' && !isCmd) {
        setViewMode('list')
        return
      }

      // F: Toggle filter panel
      if (e.key === 'f' && !isCmd) {
        setFilterPanelOpen(!isFilterPanelOpen)
        return
      }

      // Escape: Clear selection, close panels
      if (e.key === 'Escape') {
        deselectAll()
        if (isFilterPanelOpen) setFilterPanelOpen(false)
        return
      }

      // Delete / Backspace: Delete selected documents
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const selected = getSelectedIds()
        if (selected.length > 0) {
          e.preventDefault()
          handlers.onDeleteSelected?.()
        }
        return
      }

      // R: Reset all filters
      if (e.key === 'r' && !isCmd) {
        resetFilters()
        return
      }
    },
    [
      handlers,
      setViewMode,
      deselectAll,
      selectAll,
      getSelectedIds,
      setFilterPanelOpen,
      resetFilters,
      isFilterPanelOpen,
    ]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}