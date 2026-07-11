import { DocumentCard } from './DocumentCard'
import { useDocuments, useDeleteDocument } from '../hooks/useDocuments'
import { documentService } from '../services/documentService'
import { FileX } from 'lucide-react'
import type { Document } from '../types/document'

interface DocumentGridViewProps {
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

export function DocumentGridView({ onPreview, onRename, onMove, onCopy, onSaveToDesktop, onSaveToClientFolder, onStandardizeName, onDelete, onDownload }: DocumentGridViewProps) {
  const { documents, isLoading } = useDocuments()
  const internalDelete = useDeleteDocument()

  const handleDownload = onDownload || ((doc: Document) => {
    documentService.downloadDocument(doc.id)
  })

  const handleDelete = onDelete || ((doc: Document) => {
    if (window.confirm(`Delete "${doc.original_file_name}"?`)) {
      internalDelete.mutate(doc.id)
    }
  })

  if (isLoading && documents.length === 0) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 animate-pulse">
            <div className="w-14 h-14 bg-slate-100 rounded-xl mb-4" />
            <div className="h-4 bg-slate-100 rounded w-3/4 mb-2" />
            <div className="h-3 bg-slate-100 rounded w-1/2 mb-4" />
            <div className="h-5 bg-slate-100 rounded w-20 mb-3" />
            <div className="flex justify-between pt-3 border-t border-slate-100">
              <div className="h-3 bg-slate-100 rounded w-12" />
              <div className="h-3 bg-slate-100 rounded w-20" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!isLoading && documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
          <FileX className="h-8 w-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-1">No documents found</h3>
        <p className="text-sm text-slate-500 text-center max-w-sm">
          Upload your first document to get started, or adjust your filters to see more results.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {documents.map((doc) => (
        <DocumentCard
          key={doc.id}
          document={doc}
          onPreview={onPreview}
          onDownload={handleDownload}
          onRename={onRename}
          onMove={onMove}
          onCopy={onCopy}
          onDelete={handleDelete}
          onSaveToDesktop={onSaveToDesktop}
          onSaveToClientFolder={onSaveToClientFolder}
          onStandardizeName={onStandardizeName}
        />
      ))}
    </div>
  )
}