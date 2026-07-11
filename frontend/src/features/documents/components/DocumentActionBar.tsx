import React from 'react'
import { X, Download, Trash2, FolderInput, Copy, FolderOpen, Monitor, Verified, Loader2 } from 'lucide-react'
import { useDocumentStore } from '../stores/useDocumentStore'
import { useBatchDeleteDocuments } from '../hooks/useDocuments'
import { documentService } from '../services/documentService'
import { useToastStore } from '../../../stores/useToastStore'

interface DocumentActionBarProps {
  onMoveSelected?: () => void
  onCopySelected?: () => void
}

export function DocumentActionBar({ onMoveSelected, onCopySelected }: DocumentActionBarProps) {
  const selectedIds = useDocumentStore((s) => s.selection.selectedIds)
  const deselectAll = useDocumentStore((s) => s.deselectAll)
  const batchDelete = useBatchDeleteDocuments()

  const addToast = useToastStore((s) => s.addToast)
  const [busy, setBusy] = React.useState<string | null>(null)

  const count = selectedIds.size
  if (count === 0) return null

  const ids = [...selectedIds]

  const handleDelete = () => {
    if (window.confirm(`Delete ${count} selected document(s)?`)) {
      batchDelete.mutate(ids, {
        onSuccess: () => addToast(`Deleted ${count} document(s)`, 'success'),
        onError: () => addToast('Failed to delete documents', 'error'),
      })
    }
  }

  const handleBatchDownload = async () => {
    setBusy('download')
    try {
      for (const id of ids) {
        await documentService.downloadDocument(id)
      }
      addToast(`Downloaded ${count} document(s)`, 'success')
    } catch {
      addToast('Failed to download documents', 'error')
    } finally {
      setBusy(null)
    }
  }

  const handleBatchStandardize = async () => {
    setBusy('standardize')
    let successCount = 0
    try {
      for (const id of ids) {
        try {
          await documentService.standardizeName(id)
          successCount++
        } catch {
          // skip individual failures
        }
      }
      addToast(`Standardized ${successCount} of ${count} document(s)`, successCount > 0 ? 'success' : 'error')
    } finally {
      setBusy(null)
    }
  }

  const handleBatchSaveToDesktop = async () => {
    setBusy('desktop')
    let successCount = 0
    try {
      for (const id of ids) {
        try {
          await documentService.saveToDesktop(id)
          successCount++
        } catch {
          // skip individual failures
        }
      }
      addToast(`Saved ${successCount} of ${count} document(s) to desktop`, successCount > 0 ? 'success' : 'error')
    } finally {
      setBusy(null)
    }
  }

  const handleBatchSaveToFolder = async () => {
    setBusy('folder')
    let successCount = 0
    try {
      for (const id of ids) {
        try {
          await documentService.saveToClientFolder(id)
          successCount++
        } catch {
          // skip individual failures
        }
      }
      addToast(`Saved ${successCount} of ${count} document(s) to client folder`, successCount > 0 ? 'success' : 'error')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 bg-primary-50 border border-primary-200 rounded-xl">
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-primary-700">{count} selected</span>
        <button onClick={deselectAll} className="p-1 rounded hover:bg-primary-100 text-primary-500 hover:text-primary-700">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="h-5 w-px bg-primary-200" />
      <div className="flex items-center gap-1 flex-wrap">
        <ActionButton icon={<FolderInput className="h-3.5 w-3.5" />} label="Move" onClick={onMoveSelected} busy={busy === 'move'} />
        <ActionButton icon={<Copy className="h-3.5 w-3.5" />} label="Copy" onClick={onCopySelected} busy={busy === 'copy'} />
        <ActionButton icon={<Download className="h-3.5 w-3.5" />} label="Download" onClick={handleBatchDownload} busy={busy === 'download'} />
        <ActionButton icon={<Verified className="h-3.5 w-3.5" />} label="Standardize" onClick={handleBatchStandardize} busy={busy === 'standardize'} />
        <ActionButton icon={<Monitor className="h-3.5 w-3.5" />} label="Desktop" onClick={handleBatchSaveToDesktop} busy={busy === 'desktop'} />
        <ActionButton icon={<FolderOpen className="h-3.5 w-3.5" />} label="To Folder" onClick={handleBatchSaveToFolder} busy={busy === 'folder'} />
        <div className="h-5 w-px bg-primary-200 mx-1" />
        <ActionButton icon={<Trash2 className="h-3.5 w-3.5" />} label="Delete" onClick={handleDelete} busy={busy === 'delete'} danger />
      </div>
    </div>
  )
}

function ActionButton({ icon, label, onClick, busy, danger }: { icon: React.ReactNode; label: string; onClick?: () => void; busy?: boolean; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={busy}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${
        danger
          ? 'text-red-600 hover:bg-red-50'
          : 'text-primary-700 hover:bg-primary-100'
      }`}
    >
      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : icon}
      {label}
    </button>
  )
}
