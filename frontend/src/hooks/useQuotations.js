import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import * as quotationsService from '../services/quotations.service.js';

const KEY = 'quotations';

export function useQuotations(params) {
  return useQuery({
    queryKey: [KEY, params],
    queryFn: () => quotationsService.listQuotations(params),
    placeholderData: keepPreviousData,
  });
}

export function useQuotation(id) {
  return useQuery({
    queryKey: [KEY, 'detail', id],
    queryFn: () => quotationsService.getQuotation(id),
    enabled: Boolean(id),
  });
}

function useQuotationMutation(mutationFn) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
}

export const useCreateQuotation = () => useQuotationMutation(quotationsService.createQuotation);
export const useUpdateQuotation = () =>
  useQuotationMutation(({ id, payload }) => quotationsService.updateQuotation(id, payload));
export const useSetQuotationStatus = () =>
  useQuotationMutation(({ id, status }) => quotationsService.setQuotationStatus(id, status));
export const useConvertQuotation = () => useQuotationMutation(quotationsService.convertQuotation);
export const useDeleteQuotation = () => useQuotationMutation(quotationsService.deleteQuotation);
