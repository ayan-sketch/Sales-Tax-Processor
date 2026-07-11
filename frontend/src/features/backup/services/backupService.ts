import { apiClient } from '@/services/apiClient';
import type { Backup, RestoreResult } from '../types/backup';

export const backupService = {
  async getAll(): Promise<Backup[]> {
    return apiClient.get<Backup[]>('/backups/');
  },

  async create(): Promise<Backup> {
    return apiClient.post<Backup>('/backups/');
  },

  async getById(id: string): Promise<Backup> {
    return apiClient.get<Backup>(`/backups/${id}`);
  },

  async restore(id: string): Promise<RestoreResult> {
    return apiClient.post<RestoreResult>(`/backups/${id}/restore`);
  },

  async delete(id: string): Promise<{ success: boolean; message: string }> {
    return apiClient.delete<{ success: boolean; message: string }>(`/backups/${id}`);
  },
};