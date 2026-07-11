import { apiClient } from '@/services/apiClient';
import type { WithholdingRecord, WithholdingRecordCreate, WithholdingRecordUpdate, WithholdingListResponse, WithholdingFilters, ImportChallanResponse, ImportStatementResponse, ImportPreviewResponse } from '../types/withholding';

export const withholdingService = {
  async getAll(filters?: WithholdingFilters): Promise<WithholdingListResponse> {
    const params = new URLSearchParams();
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.client_id) params.append('client_id', filters.client_id);
    if (filters?.section_type) params.append('section_type', filters.section_type);
    if (filters?.period) params.append('period', filters.period);
    if (filters?.withholding_registered_only !== undefined) params.append('withholding_registered_only', filters.withholding_registered_only.toString());
    return apiClient.get<WithholdingListResponse>(`/withholding/?${params.toString()}`);
  },

  async getById(id: string): Promise<WithholdingRecord> {
    return apiClient.get<WithholdingRecord>(`/withholding/${id}`);
  },

  async create(data: WithholdingRecordCreate): Promise<WithholdingRecord> {
    return apiClient.post<WithholdingRecord>('/withholding/', data);
  },

  async update(id: string, data: WithholdingRecordUpdate): Promise<WithholdingRecord> {
    return apiClient.put<WithholdingRecord>(`/withholding/${id}`, data);
  },

  async delete(id: string): Promise<{ success: boolean; message: string }> {
    return apiClient.delete<{ success: boolean; message: string }>(`/withholding/${id}`);
  },

  async bulkCreate(records: WithholdingRecordCreate[]): Promise<WithholdingRecord[]> {
    return apiClient.post<WithholdingRecord[]>('/withholding/bulk', records);
  },

  // ---- Import APIs ----

  async importChallan(file: File, sectionType?: string): Promise<ImportChallanResponse> {
    const formData = new FormData();
    formData.append('file', file);
    if (sectionType) formData.append('section_hint', sectionType);
    return apiClient.upload<ImportChallanResponse>('/withholding/import/challan', formData);
  },

  async importStatement(file: File): Promise<ImportStatementResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.upload<ImportStatementResponse>('/withholding/import/statement', formData);
  },

  async importPreview(file: File): Promise<ImportPreviewResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.upload<ImportPreviewResponse>('/withholding/import/preview', formData);
  },
};
