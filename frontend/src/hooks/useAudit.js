import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { listAuditLogs } from '../services/audit.service.js';

export function useAuditLogs(params) {
  return useQuery({
    queryKey: ['audit-logs', params],
    queryFn: () => listAuditLogs(params),
    placeholderData: keepPreviousData,
  });
}
