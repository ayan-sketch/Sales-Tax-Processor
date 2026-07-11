import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { salesTaxService } from '../services/salesTaxService';
import type { SalesTaxRecordCreate, SalesTaxRecordUpdate, SalesTaxFilters, SalesTaxListResponse } from '../types/salesTax';

export function useSalesTaxRecords(filters?: SalesTaxFilters) {
  return useQuery<SalesTaxListResponse>({
    queryKey: ['salesTaxRecords', filters],
    queryFn: () => salesTaxService.getAll(filters),
  });
}

export function useSalesTaxByClient(clientId: string) {
  return useQuery<SalesTaxListResponse>({
    queryKey: ['salesTaxRecords', { client_id: clientId }],
    queryFn: () => salesTaxService.getAll({ client_id: clientId, limit: 50 }),
    enabled: !!clientId,
  });
}

export function useSalesTaxRecord(id: string) {
  return useQuery({
    queryKey: ['salesTaxRecord', id],
    queryFn: () => salesTaxService.getById(id),
    enabled: !!id,
  });
}

export function useCreateSalesTaxRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SalesTaxRecordCreate) => salesTaxService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salesTaxRecords'] });
    },
  });
}

export function useUpdateSalesTaxRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: SalesTaxRecordUpdate }) =>
      salesTaxService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salesTaxRecords'] });
    },
  });
}

export function useDeleteSalesTaxRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => salesTaxService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salesTaxRecords'] });
    },
  });
}