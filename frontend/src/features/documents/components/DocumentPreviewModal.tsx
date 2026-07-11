import React, { useState, useEffect, useRef } from 'react'
import { X, Download, FileText, Calendar, User, Building2, Tag, FileType, Hash, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, Printer, Maximize2, Minimize2, FolderOpen, Monitor, CheckCircle2, Loader2, Verified, Pencil, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import type { Document } from '../types/document'
import { formatFileSize, DOCUMENT_CATEGORY_OPTIONS, FILING_STATUS_OPTIONS } from '../types/document'
import { documentService } from '../services/documentService'
import { ExcelPreview } from './ExcelPreview'

interface DocumentPreviewModalProps {
  document: Document
  isOpen: boolean
  onClose: () => void
  documents?: Document[]
  onNavigate?: (doc: Document) => void
}

export function DocumentPreviewModal({ document: doc, isOpen, onClose, documents, onNavigate }: DocumentPreviewModalProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [zoom, setZoom] = useState(100)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [savingToDesktop, setSavingToDesktop] = useState(false)
  const [savingToFolder, setSavingToFolder] = useState(false)
  const [savedDesktop, setSavedDesktop] = useState(false)
  const [savedFolder, setSavedFolder] = useState(false)
  const [standardizing, setStandardizing] = useState(false)
  const [standardized, setStandardized] = useState(false)
  const [standardizedError, setStandardizedError] = useState(false)
  const pdfBlobUrlRef = useRef<string | null>(null)
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null)

  const currentIndex = documents?.findIndex((d) => d.id === doc.id) ?? -1
  const hasPrev = documents && currentIndex > 0
  const hasNext = documents && currentIndex < documents.length - 1

  useEffect(() => {
    if (!isOpen || !doc) return
    setLoading(true)
    setError(null)
    setZoom(100)
    // Revoke previous blob URL
    if (pdfBlobUrlRef.current) {
      URL.revokeObjectURL(pdfBlobUrlRef.current)
      pdfBlobUrlRef.current = null
    }
    setPdfBlobUrl(null)

    if (doc.file_type === 'PDF') {
      documentService.getPreviewBlobUrl(doc.id)
        .then((url) => {
          pdfBlobUrlRef.current = url
          setPdfBlobUrl(url)
          setLoading(false)
        })
        .catch((err) => {
          setError(err?.message || 'Failed to load PDF preview')
          setLoading(false)
        })
    } else if (doc.file_type === 'Excel') {
      setLoading(false)
    } else if (doc.file_type === 'Image') {
      setLoading(false)
    } else {
      setLoading(false)
    }

    return () => {
      if (pdfBlobUrlRef.current) {
        URL.revokeObjectURL(pdfBlobUrlRef.current)
        pdfBlobUrlRef.current = null
      }
    }
  }, [isOpen, doc.id, doc.file_type])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return
      if (e.key === 'ArrowLeft' && hasPrev && onNavigate) {
        onNavigate(documents![currentIndex - 1])
      } else if (e.key === 'ArrowRight' && hasNext && onNavigate) {
        onNavigate(documents![currentIndex + 1])
      } else if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, hasPrev, hasNext, currentIndex, documents, onNavigate, onClose])

  if (!isOpen) return null

  const handleDownload = () => {
    documentService.downloadDocument(doc.id)
  }

  const handleSaveToDesktop = async () => {
    setSavingToDesktop(true)
    setSavedDesktop(false)
    try {
      await documentService.saveToDesktop(doc.id)
      setSavedDesktop(true)
      setTimeout(() => setSavedDesktop(false), 3000)
    } catch {
      // silently fail
    } finally {
      setSavingToDesktop(false)
    }
  }

  const handleSaveToClientFolder = async () => {
    setSavingToFolder(true)
    setSavedFolder(false)
    try {
      await documentService.saveToClientFolder(doc.id)
      setSavedFolder(true)
      setTimeout(() => setSavedFolder(false), 3000)
    } catch {
      // silently fail
    } finally {
      setSavingToFolder(false)
    }
  }

  const handleStandardizeName = async () => {
    setStandardizing(true)
    try {
      await documentService.standardizeName(doc.id)
      setStandardized(true)
      setTimeout(() => setStandardized(false), 3000)
    } catch {
      setStandardizedError(true)
      setTimeout(() => setStandardizedError(false), 3000)
    } finally {
      setStandardizing(false)
    }
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const categoryLabel = DOCUMENT_CATEGORY_OPTIONS.find(o => o.value === doc.doc_category)?.label
  const statusLabel = FILING_STATUS_OPTIONS.find(o => o.value === doc.filing_status)?.label
  const [imageBlobUrl, setImageBlobUrl] = useState<string | null>(null)
  const imageBlobUrlRef = useRef<string | null>(null)

  useEffect(() => {
    if (!isOpen || !doc || doc.file_type !== 'Image') return
    if (imageBlobUrlRef.current) {
      URL.revokeObjectURL(imageBlobUrlRef.current)
      imageBlobUrlRef.current = null
    }
    setImageBlobUrl(null)
    documentService.getPreviewBlobUrl(doc.id)
      .then((url) => {
        imageBlobUrlRef.current = url
        setImageBlobUrl(url)
      })
      .catch(() => setImageBlobUrl(null))
    return () => {
      if (imageBlobUrlRef.current) {
        URL.revokeObjectURL(imageBlobUrlRef.current)
        imageBlobUrlRef.current = null
      }
    }
  }, [isOpen, doc.id, doc.file_type])

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className={`bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] flex flex-col ${isFullscreen ? 'fixed inset-4 max-w-none max-h-none rounded-2xl' : ''}`}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex-1 min-w-0 mr-4">
            <div className="flex items-center gap-2">
              {currentIndex >= 0 && documents && (
                <span className="text-xs text-slate-400 font-medium tabular-nums">
                  {currentIndex + 1} / {documents.length}
                </span>
              )}
              <h2 className="text-lg font-semibold text-slate-900 truncate">
                {doc.original_file_name}
              </h2>
            </div>
            <p className="text-sm text-slate-500 mt-0.5">
              {doc.client_name} • {formatFileSize(doc.file_size)} • {doc.file_type}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Zoom controls (PDF only) */}
            {doc.file_type === 'PDF' && (
              <div className="flex items-center gap-1 mr-2 px-2 py-1 bg-slate-100 rounded-lg">
                <button onClick={() => setZoom(Math.max(25, zoom - 25))} className="p-1 rounded hover:bg-white text-slate-500">
                  <ZoomOut className="h-4 w-4" />
                </button>
                <span className="text-xs font-medium text-slate-600 w-10 text-center">{zoom}%</span>
                <button onClick={() => setZoom(Math.min(200, zoom + 25))} className="p-1 rounded hover:bg-white text-slate-500">
                  <ZoomIn className="h-4 w-4" />
                </button>
              </div>
            )}
            <button
              onClick={() => window.print()}
              className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700"
              title="Print"
            >
              <Printer className="h-4 w-4" />
            </button>
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700"
              title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
            <button
              onClick={handleStandardizeName}
              disabled={standardizing}
              className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 ${
                standardized ? 'bg-emerald-100 text-emerald-700' :
                standardizedError ? 'bg-red-100 text-red-700' :
                'text-slate-700 bg-slate-100 hover:bg-slate-200'
              }`}
              title="Rename to standard format (Name-CNIC-Category)"
            >
              {standardizing ? <Loader2 className="h-4 w-4 animate-spin" /> :
               standardized ? <CheckCircle2 className="h-4 w-4" /> :
               standardizedError ? <AlertCircle className="h-4 w-4" /> :
               <Pencil className="h-4 w-4" />}
              <span className="hidden sm:inline">
                {standardized ? 'Standardized' :
                 standardizedError ? 'Failed' :
                 'Standardize Name'}
              </span>
            </button>
            <button
              onClick={handleSaveToClientFolder}
              disabled={savingToFolder}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50"
              title="Save to client folder"
            >
              {savingToFolder ? <Loader2 className="h-4 w-4 animate-spin" /> : savedFolder ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <FolderOpen className="h-4 w-4" />}
              <span className="hidden sm:inline">{savedFolder ? 'Saved' : 'To Folder'}</span>
            </button>
            <button
              onClick={handleSaveToDesktop}
              disabled={savingToDesktop}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50"
              title="Save to desktop"
            >
              {savingToDesktop ? <Loader2 className="h-4 w-4 animate-spin" /> : savedDesktop ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Monitor className="h-4 w-4" />}
              <span className="hidden sm:inline">{savedDesktop ? 'Saved' : 'Desktop'}</span>
            </button>
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
            >
              <Download className="h-4 w-4" />
              Download
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden flex">
          {/* Preview Area */}
          <div className="flex-1 overflow-auto bg-slate-50 relative">
            {/* Navigation arrows */}
            {hasPrev && (
              <button
                onClick={() => onNavigate?.(documents![currentIndex - 1])}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white/90 shadow-lg border border-slate-200 text-slate-600 hover:bg-white hover:text-slate-900 transition-all opacity-0 hover:opacity-100"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            )}
            {hasNext && (
              <button
                onClick={() => onNavigate?.(documents![currentIndex + 1])}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white/90 shadow-lg border border-slate-200 text-slate-600 hover:bg-white hover:text-slate-900 transition-all opacity-0 hover:opacity-100"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            )}

            {loading && (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                  <p className="text-sm text-slate-600">Loading preview...</p>
                </div>
              </div>
            )}

            {error && (
              <div className="h-full flex items-center justify-center">
                <div className="text-center max-w-md">
                  <FileText className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-sm text-slate-600 mb-2">Preview not available</p>
                  <p className="text-xs text-slate-500">{error}</p>
                </div>
              </div>
            )}

            {/* PDF Preview */}
            {!loading && !error && pdfBlobUrl && doc.file_type === 'PDF' && (
              <div className="h-full w-full p-4" style={{ zoom: `${zoom}%` }}>
                <embed
                  src={pdfBlobUrl}
                  type="application/pdf"
                  className="w-full h-full rounded-lg border border-slate-200 bg-white shadow-sm"
                  title="Document Preview"
                />
              </div>
            )}

            {/* Excel Preview */}
            {!loading && !error && doc.file_type === 'Excel' && (
              <ExcelPreview documentId={doc.id} />
            )}

            {/* Image Preview */}
            {!loading && !error && doc.file_type === 'Image' && imageBlobUrl && (
              <div className="h-full flex items-center justify-center p-6">
                <img
                  src={imageBlobUrl}
                  alt={doc.original_file_name}
                  className="max-w-full max-h-full rounded-lg shadow-md object-contain"
                  style={{ zoom: `${zoom}%` }}
                />
              </div>
            )}

            {/* Unsupported file type */}
            {!loading && !error && !pdfBlobUrl && doc.file_type !== 'Excel' && doc.file_type !== 'Image' && (
              <div className="h-full flex items-center justify-center">
                <div className="text-center max-w-md">
                  <FileText className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-sm text-slate-600 mb-2">
                    Preview not available for {doc.file_type} files
                  </p>
                  <p className="text-xs text-slate-500">
                    Please download to view this file.
                  </p>
                  <button
                    onClick={handleDownload}
                    className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    Download File
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Metadata Sidebar */}
          <div className="w-80 border-l border-slate-200 overflow-auto bg-white flex-shrink-0">
            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  Document Details
                </h3>
                <div className="space-y-3">
                  <InfoRow icon={<FileType className="h-4 w-4" />} label="File Type" value={doc.file_type} />
                  <InfoRow icon={<Hash className="h-4 w-4" />} label="Size" value={formatFileSize(doc.file_size)} />
                  {categoryLabel && <InfoRow icon={<Tag className="h-4 w-4" />} label="Category" value={categoryLabel} />}
                  {statusLabel && <InfoRow icon={<Tag className="h-4 w-4" />} label="Status" value={statusLabel} />}
                </div>
              </div>

              {(doc.tax_year || doc.tax_month) && (
                <div>
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                    Tax Period
                  </h3>
                  <div className="space-y-3">
                    {doc.tax_year && <InfoRow icon={<Calendar className="h-4 w-4" />} label="Year" value={doc.tax_year.toString()} />}
                    {doc.tax_month && <InfoRow icon={<Calendar className="h-4 w-4" />} label="Month" value={getMonthName(doc.tax_month)} />}
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  Additional Info
                </h3>
                <div className="space-y-3">
                  {doc.client_name && <InfoRow icon={<Building2 className="h-4 w-4" />} label="Client" value={doc.client_name} />}
                  {doc.client_cnic && <InfoRow icon={<Verified className="h-4 w-4" />} label="CNIC" value={doc.client_cnic} />}
                  {doc.uploader_name && <InfoRow icon={<User className="h-4 w-4" />} label="Uploaded By" value={doc.uploader_name} />}
                  <InfoRow
                    icon={<Calendar className="h-4 w-4" />}
                    label="Upload Date"
                    value={format(new Date(doc.upload_date), 'dd MMM yyyy, HH:mm')}
                  />
                  {doc.file_path && (
                    <div className="flex items-start gap-2.5">
                      <FolderOpen className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-500 mb-0.5">Location</p>
                        <p className="text-xs text-slate-700 font-mono break-all leading-relaxed">
                          {doc.file_path}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {doc.notes && (
                <div>
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                    Notes
                  </h3>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{doc.notes}</p>
                </div>
              )}

              {doc.tags && doc.tags.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                    Tags
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {doc.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded-md bg-slate-100 text-xs text-slate-700"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="text-slate-400 mt-0.5">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-500 mb-0.5">{label}</p>
        <p className="text-sm text-slate-900 font-medium break-words">{value}</p>
      </div>
    </div>
  )
}

function getMonthName(month: number): string {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]
  return months[month - 1] || month.toString()
}
