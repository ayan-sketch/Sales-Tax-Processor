import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { syncService } from '../services/syncService';
import type { SyncConfigUpdate, SyncTriggerRequest } from '../types/sync';

/**
 * Hook to fetch sync configuration
 */
export function useSyncConfig() {
  return useQuery({
    queryKey: ['syncConfig'],
    queryFn: () => syncService.getConfig(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch sync status
 */
export function useSyncStatus() {
  return useQuery({
    queryKey: ['syncStatus'],
    queryFn: () => syncService.getStatus(),
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
  });
}

/**
 * Hook to update sync configuration
 */
export function useUpdateSyncConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SyncConfigUpdate) => syncService.updateConfig(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['syncConfig'] });
      queryClient.invalidateQueries({ queryKey: ['syncStatus'] });
    },
  });
}

/**
 * Hook to trigger manual sync
 */
export function useTriggerSync() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request?: SyncTriggerRequest) => syncService.triggerSync(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['syncStatus'] });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });
}
