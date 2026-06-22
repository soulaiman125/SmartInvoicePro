import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import * as invoicesService from '../services/invoices.service.js';

const KEY = 'invoices';

export function useInvoices(params) {
  return useQuery({
    queryKey: [KEY, params],
    queryFn: () => invoicesService.listInvoices(params),
    placeholderData: keepPreviousData,
  });
}

export function useInvoice(id) {
  return useQuery({
    queryKey: [KEY, 'detail', id],
    queryFn: () => invoicesService.getInvoice(id),
    enabled: Boolean(id),
  });
}

function useInvoiceMutation(mutationFn) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
}

export const useCreateInvoice = () => useInvoiceMutation(invoicesService.createInvoice);
export const useUpdateInvoice = () =>
  useInvoiceMutation(({ id, payload }) => invoicesService.updateInvoice(id, payload));
export const useIssueInvoice = () => useInvoiceMutation(invoicesService.issueInvoice);
export const useCancelInvoice = () =>
  useInvoiceMutation(({ id, reason }) => invoicesService.cancelInvoice(id, reason));
export const useDeleteInvoice = () => useInvoiceMutation(invoicesService.deleteInvoice);
