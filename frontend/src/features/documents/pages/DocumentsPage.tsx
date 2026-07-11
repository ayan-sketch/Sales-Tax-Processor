import { useState, useRef, useCallback } from 'react'
import { FileText, AlertCircle } from 'lucide-react'
import { DocumentStatsCards } from '../components/DocumentStatsCards'
import { DocumentToolbar } from '../components/DocumentToolbar'
import { DocumentGridView } from '../components/DocumentGridView'
import { DocumentListView } from '../components/DocumentListView'
import { FolderExplorer } from '../components/FolderExplorer'
import { DocumentActionBar } from '../components/DocumentActionBar'
import { BulkUploadDialog } from '../components/BulkUploadDialog'
import { DocumentPreviewModal } from '../components/DocumentPreviewModal'
import { MoveCopyDialog } from '../components/MoveCopyDialog'
import { RenameDialog } from '../components/RenameDialog'
import { useDocumentStore } from '../stores/useDocumentStore'
import { useFilterStore } from '../stores/useFilterStore'
import { useDocumentKeyboardShortcuts } from '../hooks/useDocumentKeyboardShortcuts'
import { useDocuments, useRenameDocument, useMoveDocument, useCopyDocument, useBatchDeleteDocuments, useBatchMoveDocuments, useBatchCopyDocuments } from '../hooks/useDocuments'
import { documentService } from '../services/documentService'
import { useToastStore } from '../../../stores/useToastStore'
import type { Document } from '../types/document'

export function DocumentsPage() {
  const [uploadOpen, setUploadOpen] = useState(false)
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null)

  const [renameDialog, setRenameDialog] = useState<{ open: boolean; doc: Document | null }>({ open: false, doc: null })
  const [moveDialog, setMoveDialog] = useState<{ open: boolean; doc: Document | null; batch: boolean }>({ open: false, doc: null, batch: false })
  const [copyDialog, setCopyDialog] = useState<{ open: boolean; doc: Document | null; batch: boolean }>({ open: false, doc: null, batch: false })

  const viewMode = useDocumentStore((s) => s.viewMode)
  const folderPath = useFilterStore((s) => s.folderPath)
  const searchRef = useRef<HTMLInputElement>(null)
  const documents = useDocumentStore((s) => s.documents)
  const { error } = useDocuments()
  const renameMutation = useRenameDocument()
  const moveMutation = useMoveDocument()
  const copyMutation = useCopyDocument()
  const batchDeleteMutation = useBatchDeleteDocuments()
  const batchMoveMutation = useBatchMoveDocuments()
  const batchCopyMutation = useBatchCopyDocuments()
  const getSelectedIds = useDocumentStore((s) => s.getSelectedIds)
  const addToast = useToastStore((s) => s.addToast)

  useDocumentKeyboardShortcuts({
    onUpload: () => setUploadOpen(true),
    onSearchFocus: () => searchRef.current?.focus(),
    onDeleteSelected: () => {
      const ids = getSelectedIds()
      if (ids.length > 0 && window.confirm(`Delete ${ids.length} selected document(s)?`)) {
        batchDeleteMutation.mutate(ids, {
          onSuccess: () => addToast(`Deleted ${ids.length} document(s)`, 'success'),
          onError: () => addToast('Failed to delete documents', 'error'),
        })
      }
    },
  })

  const handlePreview = useCallback((doc: Document) => {
    setPreviewDoc(doc)
  }, [])

  const handleNavigate = useCallback((doc: Document) => {
    setPreviewDoc(doc)
  }, [])

  const handleClosePreview = useCallback(() => {
    setPreviewDoc(null)
  }, [])

  const handleRename = useCallback((doc: Document) => {
    setRenameDialog({ open: true, doc })
  }, [])

  const handleRenameConfirm = useCallback((newName: string) => {
    const doc = renameDialog.doc
    if (!doc) return
    renameMutation.mutate(
      { id: doc.id, name: newName },
      {
        onSuccess: () => {
          addToast('Document renamed successfully', 'success')
          setRenameDialog({ open: false, doc: null })
        },
        onError: () => addToast('Failed to rename document', 'error'),
      }
    )
  }, [renameDialog.doc, renameMutation, addToast])

  const handleMove = useCallback((doc: Document) => {
    setMoveDialog({ open: true, doc, batch: false })
  }, [])

  const handleMoveConfirm = useCallback((clientId: string, folderPath: string) => {
    if (moveDialog.batch) {
      const ids = getSelectedIds()
      batchMoveMutation.mutate(
        { ids, clientId, folderPath },
        {
          onSuccess: () => {
            addToast(`Moved ${ids.length} document(s)`, 'success')
            setMoveDialog({ open: false, doc: null, batch: false })
          },
          onError: () => addToast('Failed to move documents', 'error'),
        }
      )
    } else if (moveDialog.doc) {
      moveMutation.mutate(
        { id: moveDialog.doc.id, clientId, folderPath },
        {
          onSuccess: () => {
            addToast('Document moved successfully', 'success')
            setMoveDialog({ open: false, doc: null, batch: false })
          },
          onError: () => addToast('Failed to move document', 'error'),
        }
      )
    }
  }, [moveDialog, moveMutation, batchMoveMutation, getSelectedIds, addToast])

  const handleCopy = useCallback((doc: Document) => {
    setCopyDialog({ open: true, doc, batch: false })
  }, [])

  const handleCopyConfirm = useCallback((clientId: string, folderPath: string) => {
    if (copyDialog.batch) {
      const ids = getSelectedIds()
      batchCopyMutation.mutate(
        { ids, clientId, folderPath },
        {
          onSuccess: () => {
            addToast(`Copied ${ids.length} document(s)`, 'success')
            setCopyDialog({ open: false, doc: null, batch: false })
          },
          onError: () => addToast('Failed to copy documents', 'error'),
        }
      )
    } else if (copyDialog.doc) {
      copyMutation.mutate(
        { id: copyDialog.doc.id, clientId, folderPath },
        {
          onSuccess: () => {
            addToast('Document copied successfully', 'success')
            setCopyDialog({ open: false, doc: null, batch: false })
          },
          onError: () => addToast('Failed to copy document', 'error'),
        }
      )
    }
  }, [copyDialog, copyMutation, batchCopyMutation, getSelectedIds, addToast])

  const handleStandardizeName = useCallback(async (doc: Document) => {
    try {
      await documentService.standardizeName(doc.id)
      addToast('Name standardized successfully', 'success')
    } catch {
      addToast('Failed to standardize name', 'error')
    }
  }, [addToast])

  const handleSaveToDesktop = useCallback(async (doc: Document) => {
    try {
      await documentService.saveToDesktop(doc.id)
      addToast('Saved to desktop', 'success')
    } catch {
      addToast('Failed to save to desktop', 'error')
    }
  }, [addToast])

  const handleSaveToClientFolder = useCallback(async (doc: Document) => {
    try {
      await documentService.saveToClientFolder(doc.id)
      addToast('Saved to client folder', 'success')
    } catch {
      addToast('Failed to save to client folder', 'error')
    }
  }, [addToast])

  const handleDelete = useCallback((doc: Document) => {
    if (window.confirm(`Delete "${doc.original_file_name}"?`)) {
      batchDeleteMutation.mutate([doc.id], {
        onSuccess: () => addToast('Document deleted', 'success'),
        onError: () => addToast('Failed to delete document', 'error'),
      })
    }
  }, [batchDeleteMutation, addToast])

  const handleDownload = useCallback((doc: Document) => {
    documentService.downloadDocument(doc.id)
  }, [])

  const handleBatchMove = useCallback(() => {
    const ids = getSelectedIds()
    if (ids.length === 0) return
    setMoveDialog({ open: true, doc: null, batch: true })
  }, [getSelectedIds])

  const handleBatchCopy = useCallback(() => {
    const ids = getSelectedIds()
    if (ids.length === 0) return
    setCopyDialog({ open: true, doc: null, batch: true })
  }, [getSelectedIds])

  const renameBusy = renameMutation.isPending
  const moveBusy = moveMutation.isPending || batchMoveMutation.isPending
  const copyBusy = copyMutation.isPending || batchCopyMutation.isPending

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-[1600px] mx-auto px-6 py-6">
        {/* Page header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-primary-50 rounded-xl">
              <FileText className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Documents</h1>
              <p className="text-sm text-slate-500">Manage compliance documents and filings</p>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-red-900 mb-1">Error loading documents</h3>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Stats cards */}
        <div className="mb-6">
          <DocumentStatsCards />
        </div>

        {/* Main content: sidebar + content area */}
        <div className="flex gap-5">
          {/* Folder explorer sidebar */}
          <div className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden sticky top-6">
              <div className="h-[calc(100vh-340px)] overflow-hidden">
                <FolderExplorer />
              </div>
            </div>
          </div>

          {/* Content area */}
          <div className="flex-1 min-w-0 space-y-4">
            {/* Folder context indicator */}
            {folderPath && (
              <div className="flex items-center gap-2 text-sm text-slate-600 bg-white rounded-lg border border-slate-200 px-4 py-2">
                <span className="text-slate-400">Viewing:</span>
                <span className="font-medium text-slate-800">{folderPath}</span>
              </div>
            )}

            {/* Toolbar */}
            <DocumentToolbar onUpload={() => setUploadOpen(true)} />

            {/* Action bar */}
            <DocumentActionBar onMoveSelected={handleBatchMove} onCopySelected={handleBatchCopy} />

            {/* Document view */}
            {viewMode === 'grid' ? (
              <DocumentGridView onPreview={handlePreview} onRename={handleRename} onMove={handleMove} onCopy={handleCopy} onSaveToDesktop={handleSaveToDesktop} onSaveToClientFolder={handleSaveToClientFolder} onStandardizeName={handleStandardizeName} onDelete={handleDelete} onDownload={handleDownload} />
            ) : (
              <DocumentListView onPreview={handlePreview} onRename={handleRename} onMove={handleMove} onCopy={handleCopy} onSaveToDesktop={handleSaveToDesktop} onSaveToClientFolder={handleSaveToClientFolder} onStandardizeName={handleStandardizeName} onDelete={handleDelete} onDownload={handleDownload} />
            )}
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <BulkUploadDialog
        isOpen={uploadOpen}
        onClose={() => setUploadOpen(false)}
      />

      <RenameDialog
        isOpen={renameDialog.open}
        currentName={renameDialog.doc?.original_file_name || ''}
        onClose={() => setRenameDialog({ open: false, doc: null })}
        onConfirm={handleRenameConfirm}
        busy={renameBusy}
      />

      <MoveCopyDialog
        title={moveDialog.batch ? 'Move Documents' : 'Move Document'}
        isOpen={moveDialog.open}
        onClose={() => setMoveDialog({ open: false, doc: null, batch: false })}
        onConfirm={handleMoveConfirm}
        busy={moveBusy}
        count={moveDialog.batch ? getSelectedIds().length : undefined}
      />

      <MoveCopyDialog
        title={copyDialog.batch ? 'Copy Documents' : 'Copy Document'}
        isOpen={copyDialog.open}
        onClose={() => setCopyDialog({ open: false, doc: null, batch: false })}
        onConfirm={handleCopyConfirm}
        busy={copyBusy}
        count={copyDialog.batch ? getSelectedIds().length : undefined}
      />

      {/* Document preview modal */}
      {previewDoc && (
        <DocumentPreviewModal
          document={previewDoc}
          documents={documents}
          isOpen={!!previewDoc}
          onClose={handleClosePreview}
          onNavigate={handleNavigate}
        />
      )}
    </div>
  )
}
