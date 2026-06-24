import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import * as recurringService from '../services/recurring.service.js';

const KEY = 'recurring-invoices';

export function useRecurringList(params) {
  return useQuery({
    queryKey: [KEY, params],
    queryFn: () => recurringService.listRecurring(params),
    placeholderData: keepPreviousData,
  });
}

function useRecurringMutation(mutationFn) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] });
      // Generation can create invoices + affect analytics.
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
}

export const useCreateRecurring = () => useRecurringMutation(recurringService.createRecurring);
export const useUpdateRecurring = () =>
  useRecurringMutation(({ id, payload }) => recurringService.updateRecurring(id, payload));
export const usePauseRecurring = () => useRecurringMutation(recurringService.pauseRecurring);
export const useResumeRecurring = () => useRecurringMutation(recurringService.resumeRecurring);
export const useDeleteRecurring = () => useRecurringMutation(recurringService.deleteRecurring);
export const useRunRecurring = () => useRecurringMutation(recurringService.runRecurring);
