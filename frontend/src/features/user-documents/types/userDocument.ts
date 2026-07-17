export interface FolderNode {
  id: string
  name: string
  parent_id: string | null
  children: FolderNode[]
  created_at: string
  updated_at: string
}

export interface UserDocument {
  id: string
  folder_id: string | null
  folder_name: string
  file_name: string
  original_file_name: string
  file_extension: string
  file_size: number
  file_type: string
  checksum: string | null
  created_at: string
  updated_at: string
}

export interface UserDocumentListResponse {
  success: boolean
  data: UserDocument[]
  total: number
  page: number
  limit: number
  total_pages: number
}

export interface UploadResult {
  success: { file_name: string }[]
  errors: { file_name: string; error: string }[]
}
