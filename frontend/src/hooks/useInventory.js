import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as inventoryService from '../services/inventory.service.js';

export function useMovements(params) {
  return useQuery({
    queryKey: ['inventory', 'movements', params],
    queryFn: () => inventoryService.listMovements(params),
  });
}

export function useLowStock() {
  return useQuery({
    queryKey: ['inventory', 'low-stock'],
    queryFn: inventoryService.lowStock,
  });
}

export function useAdjustStock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, payload }) => inventoryService.adjustStock(productId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
}
