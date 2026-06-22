import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import * as clientsService from '../services/clients.service.js';

const KEY = 'clients';

export function useClients(params) {
  return useQuery({
    queryKey: [KEY, params],
    queryFn: () => clientsService.listClients(params),
    placeholderData: keepPreviousData, // smooth pagination/search transitions
  });
}

export function useClient(id) {
  return useQuery({
    queryKey: [KEY, 'detail', id],
    queryFn: () => clientsService.getClient(id),
    enabled: Boolean(id),
  });
}

export function useCreateClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: clientsService.createClient,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => clientsService.updateClient(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useDeleteClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: clientsService.deleteClient,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY] }),
  });
}
