import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as service from '../services/settings.service.js';

export function useSettings() {
  return useQuery({ queryKey: ['settings'], queryFn: service.getSettings });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: service.updateSettings,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['settings'] }),
  });
}
