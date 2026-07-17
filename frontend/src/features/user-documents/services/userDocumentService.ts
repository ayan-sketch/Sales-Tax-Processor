import { apiClient } from '../../../services/apiClient'
import type { FolderNode, UserDocument, UserDocumentListResponse, UploadResult } from '../types/userDocument'

const FOLDERS_BASE = '/user/folders'
const DOCS_BASE = '/user/documents'

export const userDocumentService = {
  async getFolderTree(): Promise<FolderNode[]> {
    return apiClient.get<FolderNode[]>(FOLDERS_BASE)
  },

  async createFolder(name: string, parentId?: string): Promise<FolderNode> {
    return apiClient.post<FolderNode>(FOLDERS_BASE, { name, parent_id: parentId })
  },

  async renameFolder(id: string, name: string): Promise<FolderNode> {
    return apiClient.put<FolderNode>(`${FOLDERS_BASE}/${id}`, { name })
  },

  async deleteFolder(id: string): Promise<void> {
    return apiClient.delete<void>(`${FOLDERS_BASE}/${id}`)
  },

  async getDocuments(params?: {
    page?: number
    limit?: number
    folder_id?: string
    file_type?: string
    q?: string
    sort_by?: string
    sort_order?: string
  }): Promise<UserDocumentListResponse> {
    return apiClient.get<UserDocumentListResponse>(DOCS_BASE, { params })
  },

  async getDocument(id: string): Promise<UserDocument> {
    return apiClient.get<UserDocument>(`${DOCS_BASE}/${id}`)
  },

  async uploadDocument(file: File, folderId?: string): Promise<UserDocument> {
    const formData = new FormData()
    formData.append('file', file)
    if (folderId) {
      const params = new URLSearchParams({ folder_id: folderId })
      return apiClient.upload<UserDocument>(`${DOCS_BASE}/upload?${params.toString()}`, formData)
    }
    return apiClient.upload<UserDocument>(`${DOCS_BASE}/upload`, formData)
  },

  async uploadMultiple(files: File[], folderId?: string): Promise<UploadResult> {
    const formData = new FormData()
    files.forEach((f) => formData.append('files', f))
    if (folderId) {
      const params = new URLSearchParams({ folder_id: folderId })
      return apiClient.upload<UploadResult>(`${DOCS_BASE}/upload/multiple?${params.toString()}`, formData)
    }
    return apiClient.upload<UploadResult>(`${DOCS_BASE}/upload/multiple`, formData)
  },

  getPreviewUrl(id: string): string {
    return `/api/v1${DOCS_BASE}/${id}/preview`
  },

  getDownloadUrl(id: string): string {
    return `/api/v1${DOCS_BASE}/${id}/download`
  },

  async renameDocument(id: string, file_name: string): Promise<UserDocument> {
    return apiClient.put<UserDocument>(`${DOCS_BASE}/${id}/rename`, { file_name })
  },

  async moveDocument(id: string, folder_id: string): Promise<UserDocument> {
    return apiClient.patch<UserDocument>(`${DOCS_BASE}/${id}/move`, { folder_id })
  },

  async deleteDocument(id: string): Promise<void> {
    return apiClient.delete<void>(`${DOCS_BASE}/${id}`)
  },
}
