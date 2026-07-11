import { apiClient } from '@/services/apiClient';

export interface DashboardStats {
  total_clients: number;
  total_sales_tax: number;
  total_withholding: number;
  pending_tasks: number;
  overdue_sales_tax: number;
  filings_this_month: number;
  total_documents: number;
}

export interface RecentActivity {
  id: string;
  type: string;
  title: string;
  description: string;
  client_name: string | null;
  created_at: string;
  link: string | null;
}

export interface DashboardData {
  stats: DashboardStats;
  recent_activity: RecentActivity[];
}

export const dashboardService = {
  async getStats(): Promise<DashboardData> {
    return apiClient.get<DashboardData>('/dashboard/stats');
  },
};