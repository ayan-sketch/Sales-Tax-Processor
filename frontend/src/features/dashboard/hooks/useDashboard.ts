import { useQuery } from '@tanstack/react-query';
import { dashboardService, type DashboardData } from '../services/dashboardService';

export function useDashboard() {
  return useQuery<DashboardData>({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboardService.getStats(),
    staleTime: 1000 * 60 * 2,
    refetchInterval: 1000 * 60 * 5,
  });
}