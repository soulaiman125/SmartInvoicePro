import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import * as paymentsService from '../services/payments.service.js';

export function usePayments(params) {
  return useQuery({
    queryKey: ['payments', 'list', params],
    queryFn: () => paymentsService.listPayments(params),
    placeholderData: keepPreviousData,
  });
}

export function useInvoicePayments(invoiceId) {
  return useQuery({
    queryKey: ['payments', invoiceId],
    queryFn: () => paymentsService.listInvoicePayments(invoiceId),
    enabled: Boolean(invoiceId),
  });
}

function usePaymentMutation(mutationFn) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
}

export const useRecordPayment = () =>
  usePaymentMutation(({ invoiceId, payload }) => paymentsService.recordPayment(invoiceId, payload));
export const useRefundPayment = () => usePaymentMutation(paymentsService.refundPayment);
