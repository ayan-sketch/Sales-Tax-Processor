import { apiClient } from '@/services/apiClient';
import type { Task, TaskCreate, TaskUpdate, TaskListResponse, TaskFilters } from '../types/task';

export const taskService = {
  async getAll(filters?: TaskFilters): Promise<TaskListResponse> {
    const params = new URLSearchParams();
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.status) params.append('status', filters.status);
    if (filters?.priority) params.append('priority', filters.priority);
    if (filters?.client_id) params.append('client_id', filters.client_id);
    if (filters?.task_type) params.append('task_type', filters.task_type);
    if (filters?.search) params.append('search', filters.search);
    return apiClient.get<TaskListResponse>(`/tasks/?${params.toString()}`);
  },

  async getById(id: string): Promise<Task> {
    return apiClient.get<Task>(`/tasks/${id}`);
  },

  async create(data: TaskCreate): Promise<Task> {
    return apiClient.post<Task>('/tasks/', data);
  },

  async update(id: string, data: TaskUpdate): Promise<Task> {
    return apiClient.put<Task>(`/tasks/${id}`, data);
  },

  async delete(id: string): Promise<{ success: boolean; message: string }> {
    return apiClient.delete<{ success: boolean; message: string }>(`/tasks/${id}`);
  },
};