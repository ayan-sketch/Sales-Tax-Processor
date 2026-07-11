import { apiClient } from '@/services/apiClient';
import type { Setting, SettingUpdate, SettingsListResponse } from '../types/settings';

export const settingsService = {
  async getAll(): Promise<SettingsListResponse> {
    return apiClient.get<SettingsListResponse>('/settings/');
  },

  async getByKey(key: string): Promise<Setting> {
    return apiClient.get<Setting>(`/settings/${key}`);
  },

  async create(data: SettingUpdate): Promise<Setting> {
    return apiClient.post<Setting>('/settings/', data);
  },

  async update(key: string, data: Partial<SettingUpdate>): Promise<Setting> {
    return apiClient.put<Setting>(`/settings/${key}`, data);
  },

  async delete(key: string): Promise<{ success: boolean; message: string }> {
    return apiClient.delete<{ success: boolean; message: string }>(`/settings/${key}`);
  },

  async getStoragePath(): Promise<{ success: boolean; current_path: string; exists: boolean; message: string }> {
    return apiClient.get('/settings/storage/path');
  },

  async updateStoragePath(path: string): Promise<{ success: boolean; current_path: string; exists: boolean; message: string }> {
    return apiClient.put('/settings/storage/path', { path });
  },
};
