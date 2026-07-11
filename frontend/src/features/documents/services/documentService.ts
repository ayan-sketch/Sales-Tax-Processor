import { apiClient } from '../../../services/apiClient'
import type {
  Document,
  DocumentListResponse,
  DocumentFilters,
  DocumentStatsResponse,
  RenameRequest,
  MoveRequest,
  CopyRequest,
  BulkUploadResult,
  FolderNode,
  FolderContentsResponse,
  MissingDocumentsResponse,
  MissingCountResponse,
  ComplianceStatusResponse,
  DocumentActivity,
} from '../types/document'

const BASE = '/documents'

// --- Query string builder ---

function buildFilterParams(filters: DocumentFilters): Record<string, string> {
  const params: Record<string, string> = {}

  if (filters.q) params.q = filters.q
  if (filters.doc_category?.length) params.doc_category = filters.doc_category.join(',')
  if (filters.tax_year) params.tax_year = String(filters.tax_year)
  if (filters.tax_month?.length) params.tax_month = filters.tax_month.join(',')
  if (filters.client_id?.length) params.client_id = filters.client_id.join(',')
  if (filters.filing_status) params.filing_status = filters.filing_status
  if (filters.file_type) params.file_type = filters.file_type
  if (filters.upload_date_from) params.upload_date_from = filters.upload_date_from
  if (filters.upload_date_to) params.upload_date_to = filters.upload_date_to
  if (filters.file_size_min !== undefined) params.file_size_min = String(filters.file_size_min)
  if (filters.file_size_max !== undefined) params.file_size_max = String(filters.file_size_max)
  if (filters.is_missing) params.is_missing = 'true'
  if (filters.sort_by) params.sort_by = filters.sort_by
  if (filters.sort_order) params.sort_order = filters.sort_order
  if (filters.page) params.page = String(filters.page)
  if (filters.limit) params.limit = String(filters.limit)
  if (filters.folder_path) params.folder_path = filters.folder_path

  return params
}

// --- Document CRUD ---

export const documentService = {
  async getDocuments(filters: DocumentFilters = {}): Promise<DocumentListResponse> {
    const params = buildFilterParams(filters)
    return apiClient.get<DocumentListResponse>(BASE, { params })
  },

  async getDocument(id: string): Promise<Document> {
    return apiClient.get<Document>(`${BASE}/${id}`)
  },

  async updateDocument(id: string, data: Partial<Document>): Promise<Document> {
    return apiClient.patch<Document>(`${BASE}/${id}`, data)
  },

  async deleteDocument(id: string): Promise<{ success: boolean; message: string }> {
    return apiClient.delete<{ success: boolean; message: string }>(`${BASE}/${id}`)
  },

  // --- Stats ---

  async getStats(filters?: { start_date?: string; end_date?: string; client_id?: string }): Promise<DocumentStatsResponse> {
    const params: Record<string, string> = {}
    if (filters?.start_date) params.start_date = filters.start_date
    if (filters?.end_date) params.end_date = filters.end_date
    if (filters?.client_id) params.client_id = filters.client_id
    return apiClient.get<DocumentStatsResponse>(`${BASE}/stats`, { params })
  },

  // --- Search ---

  async searchDocuments(
    query: string,
    filters: Omit<DocumentFilters, 'q'> = {}
  ): Promise<DocumentListResponse> {
    const params = buildFilterParams({ ...filters, q: query })
    return apiClient.get<DocumentListResponse>(`${BASE}/search`, { params })
  },

  // --- Upload ---

  async uploadDocument(
    file: File,
    clientId: string,
    options?: {
      doc_category?: string
      tax_year?: number
      tax_month?: number
    },
    onProgress?: (percentage: number) => void
  ): Promise<Document> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('client_id', clientId)
    if (options?.doc_category) formData.append('document_type', options.doc_category)
    if (options?.tax_year) formData.append('tax_year', String(options.tax_year))
    if (options?.tax_month) formData.append('tax_month', String(options.tax_month))

    const result = await apiClient.uploadWithProgress(
      `${BASE}/upload`,
      formData,
      onProgress
    )
    return result as Document
  },

  async uploadBatch(
    files: File[],
    clientId: string,
    options?: {
      doc_category?: string
      tax_year?: number
      tax_month?: number
      overwrite?: boolean
    },
    onFileProgress?: (index: number, percentage: number) => void
  ): Promise<BulkUploadResult> {
    const formData = new FormData()
    files.forEach((file) => formData.append('files', file))
    formData.append('client_id', clientId)
    if (options?.doc_category) formData.append('doc_category', options.doc_category)
    if (options?.tax_year) formData.append('tax_year', String(options.tax_year))
    if (options?.tax_month) formData.append('tax_month', String(options.tax_month))
    if (options?.overwrite) formData.append('overwrite', 'true')

    // For batch, we don't have per-file progress from the backend,
    // so we'll report overall progress
    const result = await apiClient.uploadWithProgress(
      `${BASE}/upload/batch`,
      formData,
      onFileProgress ? (pct) => files.forEach((_, i) => onFileProgress(i, pct)) : undefined
    )
    return result as BulkUploadResult
  },

  // --- Actions ---

  async renameDocument(id: string, data: RenameRequest): Promise<Document> {
    return apiClient.put<Document>(`${BASE}/${id}/rename`, data)
  },

  async moveDocument(id: string, data: MoveRequest): Promise<Document> {
    return apiClient.post<Document>(`${BASE}/${id}/move`, data)
  },

  async copyDocument(id: string, data: CopyRequest): Promise<Document> {
    return apiClient.post<Document>(`${BASE}/${id}/copy`, data)
  },

  async restoreDocument(id: string): Promise<Document> {
    return apiClient.post<Document>(`${BASE}/${id}/restore`)
  },

  // --- Batch operations ---

  async batchDelete(ids: string[]): Promise<{ success: boolean; deleted: number }> {
    return apiClient.post<{ success: boolean; deleted: number }>(`${BASE}/batch/delete`, { ids })
  },

  async batchMove(ids: string[], clientId: string, folderPath: string): Promise<{ success: boolean; moved: number }> {
    return apiClient.post<{ success: boolean; moved: number }>(`${BASE}/batch/move`, {
      ids,
      client_id: clientId,
      folder_path: folderPath,
    })
  },

  async batchCopy(ids: string[], clientId: string, folderPath: string): Promise<{ success: boolean; copied: number }> {
    return apiClient.post<{ success: boolean; copied: number }>(`${BASE}/batch/copy`, {
      ids,
      client_id: clientId,
      folder_path: folderPath,
    })
  },

  // --- Download ---

  getDownloadUrl(id: string): string {
    return `/api/v1${BASE}/${id}/download`
  },

  getPreviewUrl(id: string): string {
    return `/api/v1${BASE}/${id}/preview`
  },

  async getPreviewBlobUrl(id: string): Promise<string> {
    const blob = await apiClient.getBlob(`${BASE}/${id}/preview`)
    return URL.createObjectURL(blob)
  },

  async getFileAsArrayBuffer(id: string): Promise<ArrayBuffer> {
    return apiClient.getArrayBuffer(`${BASE}/${id}/download`)
  },

  async downloadDocument(id: string): Promise<void> {
    const blob = await apiClient.getBlob(`${BASE}/${id}/download`)
    const doc = await this.getDocument(id)
    const url = URL.createObjectURL(blob)
    const a = window.document.createElement('a')
    a.href = url
    a.download = doc.original_file_name
    window.document.body.appendChild(a)
    a.click()
    window.document.body.removeChild(a)
    URL.revokeObjectURL(url)
  },

  // --- Activity ---

  async getActivity(id: string, limit = 20): Promise<DocumentActivity[]> {
    return apiClient.get<DocumentActivity[]>(`${BASE}/${id}/activity`, {
      params: { limit },
    })
  },

  async logActivity(id: string, activityType: string, metadata?: Record<string, unknown>): Promise<void> {
    await apiClient.post(`${BASE}/${id}/activity`, {
      activity_type: activityType,
      metadata: metadata || {},
    })
  },

  // --- Notes ---

  async updateNotes(id: string, notes: string): Promise<Document> {
    return apiClient.patch<Document>(`${BASE}/${id}/notes`, { notes })
  },

  // --- Folders ---

  async getFolderTree(): Promise<FolderNode[]> {
    const result = await apiClient.get<{ success: boolean; data: FolderNode[] }>('/folders/tree')
    return result.data
  },

  async getFolderContents(
    path: string,
    page = 1,
    limit = 25
  ): Promise<FolderContentsResponse> {
    return apiClient.get<FolderContentsResponse>('/folders/contents', {
      params: { path, page, limit },
    })
  },

  async searchFolders(query: string): Promise<FolderNode[]> {
    const result = await apiClient.get<{ success: boolean; data: FolderNode[] }>('/folders/search', {
      params: { q: query },
    })
    return result.data
  },

  // --- Compliance ---

  async getMissingDocuments(filters?: {
    client_id?: string
    status?: 'all' | 'overdue' | 'upcoming'
    category?: string
  }): Promise<MissingDocumentsResponse> {
    const params: Record<string, string> = {}
    if (filters?.client_id) params.client_id = filters.client_id
    if (filters?.status) params.status = filters.status
    if (filters?.category) params.category = filters.category
    return apiClient.get<MissingDocumentsResponse>('/compliance/missing-documents', { params })
  },

  async getMissingCount(): Promise<MissingCountResponse> {
    return apiClient.get<MissingCountResponse>('/compliance/missing-count')
  },

  async getComplianceStatus(
    clientId: string,
    year: number
  ): Promise<ComplianceStatusResponse> {
    return apiClient.get<ComplianceStatusResponse>('/compliance/status', {
      params: { client_id: clientId, year },
    })
  },

  // --- File System Actions ---

  async standardizeName(id: string): Promise<Document> {
    return apiClient.post<Document>(`${BASE}/${id}/standardize-name`)
  },

  async saveToDesktop(id: string): Promise<{ success: boolean; path: string }> {
    return apiClient.post<{ success: boolean; path: string }>(`${BASE}/${id}/save-to-desktop`)
  },

  async saveToClientFolder(id: string): Promise<{ success: boolean; path: string; file_name: string }> {
    return apiClient.post<{ success: boolean; path: string; file_name: string }>(`${BASE}/${id}/save-to-client-folder`)
  },

  // --- Trash ---

  async getTrashDocuments(page = 1, limit = 25): Promise<DocumentListResponse> {
    return apiClient.get<DocumentListResponse>(`${BASE}/trash/list`, {
      params: { page, limit },
    })
  },

  async emptyTrash(): Promise<{ success: boolean; deleted: number }> {
    return apiClient.delete<{ success: boolean; deleted: number }>(`${BASE}/trash/empty`)
  },
}