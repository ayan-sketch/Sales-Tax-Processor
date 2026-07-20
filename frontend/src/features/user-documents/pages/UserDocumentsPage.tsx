import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Upload, Download, Eye, Trash2, Pencil, FileText, Grid3X3, List,
  Search, Loader2, ChevronLeft, ChevronRight, ArrowUpDown,
} from 'lucide-react'
import { FolderSidebar } from '../components/FolderSidebar'
import { userDocumentService } from '../services/userDocumentService'
import type { UserDocument } from '../types/userDocument'

const ITEMS_PER_PAGE = 25

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' })
}

function getFileIcon(type: string): string {
  const icons: Record<string, string> = { PDF: '📄', Excel: '📊', Word: '📝', Image: '🖼️', CSV: '📋', Text: '📃' }
  return icons[type] || '📁'
}

export function UserDocumentsPage() {
  const [docs, setDocs] = useState<UserDocument[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState('desc')
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)
  const [previewDoc, setPreviewDoc] = useState<UserDocument | null>(null)
  const [renaming, setRenaming] = useState<{ id: string; name: string } | null>(null)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [uploadFiles, setUploadFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const fileInputRef = useRef<HTMLInputElement>(null)
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout>>()

  const loadDocs = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const res = await userDocumentService.getDocuments({
        page,
        limit: ITEMS_PER_PAGE,
        folder_id: selectedFolderId ?? undefined,
        q: searchQuery || undefined,
        sort_by: sortBy,
        sort_order: sortOrder,
      })
      setDocs(res.data)
      setTotal(res.total)
      setTotalPages(res.total_pages)
    } catch {
      setError('Failed to load documents')
    } finally {
      setLoading(false)
    }
  }, [page, selectedFolderId, searchQuery, sortBy, sortOrder])

  useEffect(() => { loadDocs() }, [loadDocs])

  const handleSearch = (value: string) => {
    setSearchQuery(value)
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    searchTimeoutRef.current = setTimeout(() => setPage(1), 400)
  }

  const toggleSort = (field: string) => {
    if (sortBy === field) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    else { setSortBy(field); setSortOrder('desc') }
    setPage(1)
  }

  const handleUpload = async () => {
    if (uploadFiles.length === 0) return
    setUploading(true)
    try {
      if (uploadFiles.length === 1) {
        await userDocumentService.uploadDocument(uploadFiles[0], selectedFolderId ?? undefined)
      } else {
        await userDocumentService.uploadMultiple(uploadFiles, selectedFolderId ?? undefined)
      }
      setUploadOpen(false)
      setUploadFiles([])
      loadDocs()
    } catch { } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this document?')) return
    try {
      await userDocumentService.deleteDocument(id)
      loadDocs()
    } catch { }
  }

  const handleRename = async () => {
    if (!renaming || !renaming.name.trim()) return
    try {
      await userDocumentService.renameDocument(renaming.id, renaming.name.trim())
      setRenaming(null)
      loadDocs()
    } catch { }
  }

  const handleDownload = (doc: UserDocument) => {
    const url = userDocumentService.getDownloadUrl(doc.id)
    window.open(url, '_blank')
  }

  const handlePreview = (doc: UserDocument) => {
    setPreviewDoc(doc)
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectAll = () => {
    if (selectedIds.size === docs.length) setSelectedIds(new Set())
    else setSelectedIds(new Set(docs.map((d) => d.id)))
  }

  return (
    <div className="flex h-full">
      <FolderSidebar
        selectedFolderId={selectedFolderId}
        onSelectFolder={(id) => { setSelectedFolderId(id); setPage(1) }}
        onRefresh={loadDocs}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 bg-white">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search documents..."
              className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <button
            onClick={() => { setUploadFiles([]); setUploadOpen(true) }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Upload className="w-4 h-4" />
            Upload
          </button>

          <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 ${viewMode === 'list' ? 'bg-gray-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 ${viewMode === 'grid' ? 'bg-gray-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-20 text-red-500">{error}</div>
          ) : docs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <FileText className="w-12 h-12 mb-3" />
              <p className="text-lg font-medium mb-1">No documents yet</p>
              <p className="text-sm mb-4">Upload your first document to get started</p>
              <button
                onClick={() => setUploadOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Upload className="w-4 h-4" />
                Upload Document
              </button>
            </div>
          ) : viewMode === 'list' ? (
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="w-8 px-3 py-2">
                    <input
                      type="checkbox"
                      checked={docs.length > 0 && selectedIds.size === docs.length}
                      onChange={selectAll}
                      className="rounded"
                    />
                  </th>
                  <th className="px-3 py-2 text-left">
                    <button onClick={() => toggleSort('file_name')} className="flex items-center gap-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700">
                      Name <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                  <th className="px-3 py-2 text-left">
                    <button onClick={() => toggleSort('created_at')} className="flex items-center gap-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700">
                      Date <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {docs.map((doc) => (
                  <tr key={doc.id} className={`hover:bg-gray-50 transition-colors ${selectedIds.has(doc.id) ? 'bg-blue-50' : ''}`}>
                    <td className="px-3 py-2.5">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(doc.id)}
                        onChange={() => toggleSelect(doc.id)}
                        className="rounded"
                      />
                    </td>
                    <td className="px-3 py-2.5">
                      <button onClick={() => handlePreview(doc)} className="flex items-center gap-2 text-sm text-gray-900 hover:text-blue-600">
                        <span className="text-base">{getFileIcon(doc.file_type)}</span>
                        <span className="truncate max-w-[300px]">{doc.file_name}</span>
                      </button>
                    </td>
                    <td className="px-3 py-2.5 text-sm text-gray-500">{doc.file_type}</td>
                    <td className="px-3 py-2.5 text-sm text-gray-500">{formatFileSize(doc.file_size)}</td>
                    <td className="px-3 py-2.5 text-sm text-gray-500">{formatDate(doc.created_at)}</td>
                    <td className="px-3 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => handlePreview(doc)} className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-blue-600" title="Preview">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDownload(doc)} className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-green-600" title="Download">
                          <Download className="w-4 h-4" />
                        </button>
                        <button onClick={() => setRenaming({ id: doc.id, name: doc.file_name })} className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600" title="Rename">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(doc.id)} className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-red-600" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 p-4">
              {docs.map((doc) => (
                <div
                  key={doc.id}
                  className={`border rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer group ${
                    selectedIds.has(doc.id) ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                  onClick={() => toggleSelect(doc.id)}
                >
                  <div className="text-3xl mb-2 text-center">{getFileIcon(doc.file_type)}</div>
                  <p className="text-sm font-medium text-gray-900 truncate text-center">{doc.file_name}</p>
                  <p className="text-xs text-gray-400 text-center mt-1">{formatFileSize(doc.file_size)}</p>
                  <div className="flex items-center justify-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => { e.stopPropagation(); handlePreview(doc) }} className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-blue-600">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleDownload(doc) }} className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-green-600">
                      <Download className="w-4 h-4" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(doc.id) }} className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-2 border-t border-gray-200 bg-white">
            <span className="text-sm text-gray-500">{total} document{total !== 1 ? 's' : ''}</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1 rounded hover:bg-gray-100 disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-gray-600 px-2">{page} / {totalPages}</span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1 rounded hover:bg-gray-100 disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Upload Dialog */}
      {uploadOpen && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => !uploading && setUploadOpen(false)}>
          <div className="bg-white rounded-xl p-6 w-[500px] shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">Upload Documents</h3>

            <div
              className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-500 transition-colors cursor-pointer mb-4"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Click to select files or drag and drop</p>
              <p className="text-xs text-gray-400 mt-1">PDF, Excel, Word, Images up to 50MB</p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => setUploadFiles(Array.from(e.target.files || []))}
              />
            </div>

            {uploadFiles.length > 0 && (
              <div className="mb-4 max-h-32 overflow-y-auto">
                <p className="text-sm font-medium text-gray-700 mb-1">{uploadFiles.length} file(s) selected</p>
                {uploadFiles.map((f, i) => (
                  <div key={i} className="flex items-center justify-between text-sm text-gray-600 py-0.5">
                    <span className="truncate">{f.name}</span>
                    <span className="text-gray-400 shrink-0 ml-2">{formatFileSize(f.size)}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setUploadOpen(false)}
                disabled={uploading}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={uploadFiles.length === 0 || uploading}
                className="flex items-center gap-1.5 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {uploading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setPreviewDoc(null)}>
          <div className="bg-white rounded-xl w-[90vw] h-[90vh] shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">{previewDoc.file_name}</h3>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={userDocumentService.getDownloadUrl(previewDoc.id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Download className="w-4 h-4" />
                  Download
                </a>
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="flex-1 bg-gray-100">
              {previewDoc.file_type === 'PDF' ? (
                <iframe
                  src={userDocumentService.getPreviewUrl(previewDoc.id)}
                  className="w-full h-full"
                  title={previewDoc.file_name}
                />
              ) : previewDoc.file_type === 'Image' ? (
                <div className="flex items-center justify-center h-full">
                  <img
                    src={userDocumentService.getPreviewUrl(previewDoc.id)}
                    alt={previewDoc.file_name}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <div className="text-center">
                    <FileText className="w-16 h-16 mx-auto mb-3" />
                    <p className="text-lg">Preview not available for {previewDoc.file_type} files</p>
                    <a
                      href={userDocumentService.getDownloadUrl(previewDoc.id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 mt-3 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      <Download className="w-4 h-4" />
                      Download to view
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Rename Dialog */}
      {renaming && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setRenaming(null)}>
          <div className="bg-white rounded-xl p-4 w-80 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-semibold mb-3">Rename Document</h3>
            <input
              autoFocus
              value={renaming.name}
              onChange={(e) => setRenaming({ ...renaming, name: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRename()
                if (e.key === 'Escape') setRenaming(null)
              }}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setRenaming(null)} className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
              <button onClick={handleRename} className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">Rename</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
