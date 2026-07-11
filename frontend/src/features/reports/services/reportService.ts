import { apiClient } from '@/services/apiClient';
import type { Report, ReportCreate, ReportListResponse } from '../types/report';

export const reportService = {
  async getAll(): Promise<ReportListResponse> {
    return apiClient.get<ReportListResponse>('/reports/');
  },

  async getById(id: string): Promise<Report> {
    return apiClient.get<Report>(`/reports/${id}`);
  },

  async create(data: ReportCreate): Promise<Report> {
    return apiClient.post<Report>('/reports/', data);
  },

  async delete(id: string): Promise<{ success: boolean; message: string }> {
    return apiClient.delete<{ success: boolean; message: string }>(`/reports/${id}`);
  },

  async download(id: string): Promise<Blob> {
    return apiClient.getBlob(`/reports/${id}/download`);
  },
};