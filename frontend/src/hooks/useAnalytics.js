import { useQuery } from '@tanstack/react-query';
import * as analyticsService from '../services/analytics.service.js';

export function useDashboard() {
  return useQuery({ queryKey: ['analytics', 'dashboard'], queryFn: analyticsService.getDashboard });
}

export function useMonthlyRevenue(months = 12) {
  return useQuery({
    queryKey: ['analytics', 'revenue', months],
    queryFn: () => analyticsService.getMonthlyRevenue(months),
  });
}

export function useProductPerformance(limit = 5) {
  return useQuery({
    queryKey: ['analytics', 'product-performance', limit],
    queryFn: () => analyticsService.getProductPerformance(limit),
  });
}

export function useClientReport() {
  return useQuery({
    queryKey: ['analytics', 'client-report'],
    queryFn: analyticsService.getClientReport,
  });
}
