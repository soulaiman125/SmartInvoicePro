import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import * as emailsService from '../services/emails.service.js';

const KEY = 'emails';

export function useEmailHistory({ entityType, entityId } = {}, enabled = true) {
  return useQuery({
    queryKey: [KEY, entityType, entityId],
    queryFn: () => emailsService.listEmails({ entityType, entityId }),
    placeholderData: keepPreviousData,
    enabled,
  });
}

function useEmailMutation(mutationFn) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY] }),
  });
}

export const useSendInvoiceEmail = () =>
  useEmailMutation(({ id, to }) => emailsService.sendInvoiceEmail(id, to));
export const useSendInvoiceReminder = () =>
  useEmailMutation(({ id, to }) => emailsService.sendInvoiceReminder(id, to));
export const useSendQuoteEmail = () =>
  useEmailMutation(({ id, to }) => emailsService.sendQuoteEmail(id, to));
export const useRetryEmail = () => useEmailMutation((id) => emailsService.retryEmail(id));
