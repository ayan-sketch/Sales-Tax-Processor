import React, { useCallback } from 'react'
import { FileText, Sheet, Image, File, Download, Trash2, MoreHorizontal, Pencil, FolderInput, Copy, FolderOpen, Monitor, Verified, Eye } from 'lucide-react'
import { format } from 'date-fns'
import { useDocuments, useDeleteDocument } from '../hooks/useDocuments'
import { useDocumentStore } from '../stores/useDocumentStore'
import { documentService } from '../services/documentService'
import { formatFileSize } from '../types/document'
import type { Document, DocumentCategory, FilingStatus } from '../types/document'
import { DOCUMENT_CATEGORY_OPTIONS, FILING_STATUS_OPTIONS } from '../types/document'
import { FileX } from 'lucide-react'
import { useToastStore } from '../../../stores/useToastStore'

interface DocumentListViewProps {
  onPreview?: (doc: Document) => void
  onRename?: (doc: Document) => void
  onMove?: (doc: Document) => void
  onCopy?: (doc: Document) => void
  onDelete?: (doc: Document) => void
  onDownload?: (doc: Document) => void
  onSaveToDesktop?: (doc: Document) => void
  onSaveToClientFolder?: (doc: Document) => void
  onStandardizeName?: (doc: Document) => void
}

function getFileIcon(fileType: string) {
  switch (fileType) {
    case 'PDF': return <FileText className="h-4 w-4 text-red-500" />
    case 'Excel': return <Sheet className="h-4 w-4 text-emerald-500" />
    case 'Image': return <Image className="h-4 w-4 text-blue-500" />
    default: return <File className="h-4 w-4 text-slate-400" />
  }
}

function CategoryBadge({ category }: { category: DocumentCategory | null }) {
  if (!category) return <span className="text-xs text-slate-400">—</span>
  const opt = DOCUMENT_CATEGORY_OPTIONS.find((o) => o.value === category)
  return opt ? (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${opt.color}`}>
      {opt.label}
    </span>
  ) : null
}

function StatusBadge({ status }: { status: FilingStatus | null }) {
  if (!status) return <span className="text-xs text-slate-400">—</span>
  const opt = FILING_STATUS_OPTIONS.find((o) => o.value === status)
  return opt ? (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${opt.color}`}>
      {opt.label}
    </span>
  ) : null
}

export function DocumentListView({ onPreview, onRename, onMove, onCopy, onDelete, onDownload, onSaveToDesktop, onSaveToClientFolder, onStandardizeName }: DocumentListViewProps) {
  const { documents, isLoading, total, page, pageSize, setCurrentPage } = useDocuments()
  const deleteMutation = useDeleteDocument()
  const selectedIds = useDocumentStore((s) => s.selection.selectedIds)
  const toggleSelection = useDocumentStore((s) => s.toggleSelection)
  const selectAll = useDocumentStore((s) => s.selectAll)
  const deselectAll = useDocumentStore((s) => s.deselectAll)
  const addToast = useToastStore((s) => s.addToast)
  const [openMenuId, setOpenMenuId] = React.useState<string | null>(null)
  const menuRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!openMenuId) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [openMenuId])

  const totalPages = Math.ceil(total / pageSize)
  const allSelected = documents.length > 0 && documents.every((d) => selectedIds.has(d.id))

  const handleSelectAll = useCallback(() => {
    if (allSelected) deselectAll()
    else selectAll()
  }, [allSelected, selectAll, deselectAll])

  const handleDownload = (doc: Document, e: React.MouseEvent) => {
    e.stopPropagation()
    documentService.downloadDocument(doc.id)
  }

  const handleDelete = (doc: Document, e: React.MouseEvent) => {
    e.stopPropagation()
    setOpenMenuId(null)
    if (onDelete) {
      onDelete(doc)
    } else if (window.confirm(`Delete "${doc.original_file_name}"?`)) {
      deleteMutation.mutate(doc.id, {
        onSuccess: () => addToast('Document deleted', 'success'),
        onError: () => addToast('Failed to delete document', 'error'),
      })
    }
  }

  if (isLoading && documents.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 animate-pulse">
              <div className="h-4 w-4 bg-slate-100 rounded" />
              <div className="h-4 bg-slate-100 rounded w-48" />
              <div className="h-4 bg-slate-100 rounded w-32" />
              <div className="h-4 bg-slate-100 rounded w-24" />
              <div className="h-4 bg-slate-100 rounded w-20 ml-auto" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!isLoading && documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-slate-200">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
          <FileX className="h-8 w-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-1">No documents found</h3>
        <p className="text-sm text-slate-500 text-center max-w-sm">
          Upload your first document or adjust filters.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden" ref={menuRef}>
      {/* Table header */}
      <div className="grid grid-cols-[32px_1fr_160px_140px_100px_100px_120px_100px] gap-3 items-center px-4 py-3 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
        <div>
          <input
            type="checkbox"
            checked={allSelected}
            onChange={handleSelectAll}
            className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
          />
        </div>
        <div>File Name</div>
        <div>Client</div>
        <div>Category</div>
        <div>Status</div>
        <div>Size</div>
        <div>Date</div>
        <div></div>
      </div>

      {/* Table body */}
      <div className="divide-y divide-slate-100">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="group grid grid-cols-[32px_1fr_160px_140px_100px_100px_120px_100px] gap-3 items-center px-4 py-2.5 cursor-pointer transition-colors
              ${selectedIds.has(doc.id) ? 'bg-primary-50' : 'hover:bg-slate-50'}
            "
            onClick={() => toggleSelection(doc.id)}
          >
            {/* Checkbox */}
            <div>
              <input
                type="checkbox"
                checked={selectedIds.has(doc.id)}
                onChange={() => toggleSelection(doc.id)}
                onClick={(e) => e.stopPropagation()}
                className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
              />
            </div>

            {/* File name */}
            <div className="flex items-center gap-2.5 min-w-0">
              {getFileIcon(doc.file_type)}
              <span
                className="text-sm font-medium text-slate-900 truncate hover:text-primary-600 cursor-pointer"
                title={doc.original_file_name}
                onClick={(e) => { e.stopPropagation(); onPreview?.(doc) }}
              >
                {doc.original_file_name}
              </span>
            </div>

            {/* Client */}
            <div className="text-sm text-slate-600 truncate">
              {doc.client_name || '—'}
            </div>

            {/* Category */}
            <div>
              <CategoryBadge category={doc.doc_category} />
            </div>

            {/* Status */}
            <div>
              <StatusBadge status={doc.filing_status} />
            </div>

            {/* Size */}
            <div className="text-xs text-slate-500 tabular-nums">
              {formatFileSize(doc.file_size)}
            </div>

            {/* Date */}
            <div className="text-xs text-slate-500 tabular-nums">
              {format(new Date(doc.upload_date), 'dd MMM yyyy')}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 justify-end">
              <button
                onClick={(e) => { e.stopPropagation(); onPreview?.(doc) }}
                className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-primary-600 opacity-0 group-hover:opacity-100"
                title="Preview"
              >
                <Eye className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={(e) => handleDownload(doc, e)}
                className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600 opacity-0 group-hover:opacity-100"
                title="Download"
              >
                <Download className="h-3.5 w-3.5" />
              </button>
              <div className="relative">
                <button
                  onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === doc.id ? null : doc.id) }}
                  className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600 opacity-0 group-hover:opacity-100"
                  title="More actions"
                >
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </button>
                {openMenuId === doc.id && (
                  <div
                    className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl border border-slate-200 shadow-xl py-1 z-50"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MenuButton icon={<FileText className="h-4 w-4" />} label="Preview" onClick={() => { setOpenMenuId(null); onPreview?.(doc) }} />
                    <MenuButton icon={<Download className="h-4 w-4" />} label="Download" onClick={() => { setOpenMenuId(null); onDownload?.(doc); documentService.downloadDocument(doc.id) }} />
                    <MenuButton icon={<Pencil className="h-4 w-4" />} label="Rename" onClick={() => { setOpenMenuId(null); onRename?.(doc) }} />
                    <MenuButton icon={<FolderInput className="h-4 w-4" />} label="Move" onClick={() => { setOpenMenuId(null); onMove?.(doc) }} />
                    <MenuButton icon={<Copy className="h-4 w-4" />} label="Copy" onClick={() => { setOpenMenuId(null); onCopy?.(doc) }} />
                    <div className="border-t border-slate-100 my-1" />
                    <MenuButton icon={<FolderOpen className="h-4 w-4" />} label="Save to Folder" onClick={() => { setOpenMenuId(null); onSaveToClientFolder?.(doc) }} />
                    <MenuButton icon={<Monitor className="h-4 w-4" />} label="Save to Desktop" onClick={() => { setOpenMenuId(null); onSaveToDesktop?.(doc) }} />
                    <div className="border-t border-slate-100 my-1" />
                    <MenuButton icon={<Verified className="h-4 w-4" />} label="Standardize Name" onClick={() => { setOpenMenuId(null); onStandardizeName?.(doc) }} />
                    <MenuButton icon={<Trash2 className="h-4 w-4" />} label="Delete" onClick={(e) => handleDelete(doc, e as any)} danger />
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50">
          <span className="text-sm text-slate-500">
            Showing {((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, total)} of {total}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-sm rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Prev
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const start = Math.max(1, Math.min(page - 2, totalPages - 4))
              const pageNum = start + i
              if (pageNum > totalPages) return null
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`
                    px-3 py-1.5 text-sm rounded-lg border font-medium
                    ${pageNum === page
                      ? 'border-primary-300 bg-primary-50 text-primary-700'
                      : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                    }
                  `}
                >
                  {pageNum}
                </button>
              )
            })}
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 text-sm rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function MenuButton({ icon, label, onClick, danger }: { icon: React.ReactNode; label: string; onClick: (e: React.MouseEvent) => void; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors ${
        danger ? 'text-red-600 hover:bg-red-50' : 'text-slate-700 hover:bg-slate-50'
      }`}
    >
      {icon}
      {label}
    </button>
  )
}
