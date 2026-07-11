import { apiClient } from '@/services/apiClient';
import type {
  SyncConfig,
  SyncStatus,
  SyncConfigUpdate,
  SyncConfigResponse,
  SyncStatusResponse,
  SyncTriggerRequest,
  SyncTriggerResponse,
} from '../types/sync';

export const syncService = {
  /**
   * Get current sync configuration
   */
  async getConfig(): Promise<SyncConfig> {
    const response = await apiClient.get<SyncConfigResponse>('/sync/config');
    return response.data;
  },

  /**
   * Update sync configuration
   */
  async updateConfig(data: SyncConfigUpdate): Promise<SyncConfig> {
    const response = await apiClient.put<SyncConfigResponse>('/sync/config', data);
    return response.data;
  },

  /**
   * Get current sync status
   */
  async getStatus(): Promise<SyncStatus> {
    const response = await apiClient.get<SyncStatusResponse>('/sync/status');
    return response.data;
  },

  /**
   * Trigger manual sync
   */
  async triggerSync(request?: SyncTriggerRequest): Promise<SyncTriggerResponse> {
    return apiClient.post<SyncTriggerResponse>('/sync/trigger', request || {});
  },
};
