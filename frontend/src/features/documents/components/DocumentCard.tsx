import React, { useCallback } from 'react'
import { FileText, Sheet, Image, File, MoreVertical, Download, Trash2, Pencil, FolderInput, Copy, FolderOpen, Monitor, Verified } from 'lucide-react'
import { format } from 'date-fns'
import type { Document, DocumentCategory, FilingStatus } from '../types/document'
import { DOCUMENT_CATEGORY_OPTIONS, FILING_STATUS_OPTIONS, formatFileSize, getFileTypeBgColor } from '../types/document'
import { useDocumentStore } from '../stores/useDocumentStore'

interface DocumentCardProps {
  document: Document
  onPreview?: (doc: Document) => void
  onDownload?: (doc: Document) => void
  onRename?: (doc: Document) => void
  onMove?: (doc: Document) => void
  onCopy?: (doc: Document) => void
  onDelete?: (doc: Document) => void
  onSaveToDesktop?: (doc: Document) => void
  onSaveToClientFolder?: (doc: Document) => void
  onStandardizeName?: (doc: Document) => void
}

function getCategoryBadge(category: DocumentCategory | null) {
  if (!category) return null
  const opt = DOCUMENT_CATEGORY_OPTIONS.find((o) => o.value === category)
  if (!opt) return null
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${opt.color}`}>
      {opt.label}
    </span>
  )
}

function getStatusBadge(status: FilingStatus | null) {
  if (!status) return null
  const opt = FILING_STATUS_OPTIONS.find((o) => o.value === status)
  if (!opt) return null
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${opt.color}`}>
      {opt.label}
    </span>
  )
}

function getFileIcon(fileType: string, className = 'h-8 w-8') {
  switch (fileType) {
    case 'PDF':
      return <FileText className={`${className} text-red-500`} />
    case 'Excel':
      return <Sheet className={`${className} text-emerald-500`} />
    case 'Image':
      return <Image className={`${className} text-blue-500`} />
    default:
      return <File className={`${className} text-slate-400`} />
  }
}

export function DocumentCard({ document: doc, onPreview, onDownload, onRename, onMove, onCopy, onDelete, onSaveToDesktop, onSaveToClientFolder, onStandardizeName }: DocumentCardProps) {
  const [showMenu, setShowMenu] = React.useState(false)
  const toggleSelection = useDocumentStore((s) => s.toggleSelection)
  const isSelected = useDocumentStore((s) => s.selection.selectedIds.has(doc.id))
  const menuRef = React.useRef<HTMLDivElement>(null)

  // Close menu on outside click
  React.useEffect(() => {
    if (!showMenu) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showMenu])

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      toggleSelection(doc.id, e.shiftKey)
    },
    [doc.id, toggleSelection]
  )

  return (
    <div
      className={`
        group relative bg-white rounded-xl border transition-all duration-150 cursor-pointer
        ${isSelected
          ? 'border-primary-400 ring-2 ring-primary-100 shadow-md'
          : 'border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 hover:-translate-y-0.5'
        }
      `}
      onClick={handleClick}
    >
      {/* Selection checkbox */}
      <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => toggleSelection(doc.id)}
          onClick={(e) => e.stopPropagation()}
          className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
        />
      </div>

      {/* More menu */}
      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <div ref={menuRef} className="relative">
          <button
            onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu) }}
            className="p-1 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
          {showMenu && (
            <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl border border-slate-200 shadow-xl py-1 z-50"
              onClick={(e) => e.stopPropagation()}
            >
              <MenuButton icon={<FileText className="h-4 w-4" />} label="Preview" onClick={() => { setShowMenu(false); onPreview?.(doc) }} />
              <MenuButton icon={<Download className="h-4 w-4" />} label="Download" onClick={() => { setShowMenu(false); onDownload?.(doc) }} />
              <MenuButton icon={<Pencil className="h-4 w-4" />} label="Rename" onClick={() => { setShowMenu(false); onRename?.(doc) }} />
              <MenuButton icon={<FolderInput className="h-4 w-4" />} label="Move" onClick={() => { setShowMenu(false); onMove?.(doc) }} />
              <MenuButton icon={<Copy className="h-4 w-4" />} label="Copy" onClick={() => { setShowMenu(false); onCopy?.(doc) }} />
              <div className="border-t border-slate-100 my-1" />
              <MenuButton icon={<FolderOpen className="h-4 w-4" />} label="Save to Folder" onClick={() => { setShowMenu(false); onSaveToClientFolder?.(doc) }} />
              <MenuButton icon={<Monitor className="h-4 w-4" />} label="Save to Desktop" onClick={() => { setShowMenu(false); onSaveToDesktop?.(doc) }} />
              <div className="border-t border-slate-100 my-1" />
              <MenuButton icon={<Verified className="h-4 w-4" />} label="Standardize Name" onClick={() => { setShowMenu(false); onStandardizeName?.(doc) }} />
              <MenuButton icon={<Trash2 className="h-4 w-4" />} label="Delete" onClick={() => { setShowMenu(false); onDelete?.(doc) }} danger />
            </div>
          )}
        </div>
      </div>

      {/* Card body */}
      <div className="p-5 pt-4">
        {/* File icon area */}
        <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 ${getFileTypeBgColor(doc.file_type)}`}>
          {getFileIcon(doc.file_type)}
        </div>

        {/* File name */}
        <h3
          className="text-sm font-semibold text-slate-900 truncate mb-1"
          title={doc.original_file_name}
          onClick={(e) => { e.stopPropagation(); onPreview?.(doc) }}
        >
          {doc.original_file_name}
        </h3>

        {/* Client name */}
        {doc.client_name && (
          <p className="text-xs text-slate-500 truncate mb-2">{doc.client_name}</p>
        )}

        {/* Category & Status */}
        <div className="flex items-center gap-1.5 mb-3">
          {getCategoryBadge(doc.doc_category)}
          {getStatusBadge(doc.filing_status)}
        </div>

        {/* Bottom row: size + date */}
        <div className="flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-100">
          <span>{formatFileSize(doc.file_size)}</span>
          <span>{format(new Date(doc.upload_date), 'dd MMM yyyy')}</span>
        </div>
      </div>
    </div>
  )
}

function MenuButton({ icon, label, onClick, danger }: { icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean }) {
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