import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as service from '../services/notifications.service.js';

export function useNotifications(params) {
  return useQuery({
    queryKey: ['notifications', params],
    queryFn: () => service.listNotifications(params),
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: service.getUnreadCount,
    refetchInterval: 30_000, // light polling
  });
}

function useNotificationMutation(mutationFn) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });
}

export const useMarkRead = () => useNotificationMutation(service.markRead);
export const useMarkAllRead = () => useNotificationMutation(service.markAllRead);
