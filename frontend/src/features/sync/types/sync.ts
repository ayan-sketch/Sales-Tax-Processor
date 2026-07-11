export interface SyncConfig {
  enabled: boolean;
  desktop_base_path: string;
  auto_sync_on_upload: boolean;
  auto_sync_on_delete: boolean;
  last_sync_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SyncStatus {
  enabled: boolean;
  last_sync_at: string | null;
  desktop_base_path: string;
  total_documents: number;
  synced_documents: number;
  pending_sync: number;
  is_syncing: boolean;
}

export interface SyncTriggerRequest {
  force?: boolean;
  client_id?: string;
}

export interface SyncTriggerResponse {
  success: boolean;
  message: string;
  synced_count: number;
  failed_count: number;
  duration_seconds: number;
}

export interface SyncConfigUpdate {
  enabled?: boolean;
  desktop_base_path?: string;
  auto_sync_on_upload?: boolean;
  auto_sync_on_delete?: boolean;
}

export interface SyncConfigResponse {
  success: boolean;
  data: SyncConfig;
}

export interface SyncStatusResponse {
  success: boolean;
  data: SyncStatus;
}
