export interface Backup {
  id: string;
  backup_name: string;
  backup_path: string;
  backup_size: number | null;
  backup_date: string;
  status: 'success' | 'failed' | 'in_progress';
}

export interface RestoreResult {
  success: boolean;
  message: string;
}

export interface BackupListResponse {
  data: Backup[];
  total: number;
}