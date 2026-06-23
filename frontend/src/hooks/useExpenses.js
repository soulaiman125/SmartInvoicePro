import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import * as expensesService from '../services/expenses.service.js';

const KEY = 'expenses';

export function useExpenses(params) {
  return useQuery({
    queryKey: [KEY, params],
    queryFn: () => expensesService.listExpenses(params),
    placeholderData: keepPreviousData,
  });
}

export function useExpenseCategories() {
  return useQuery({ queryKey: [KEY, 'categories'], queryFn: expensesService.getExpenseCategories });
}

function useExpenseMutation(mutationFn) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
}

export const useCreateExpense = () => useExpenseMutation(expensesService.createExpense);
export const useUpdateExpense = () =>
  useExpenseMutation(({ id, payload }) => expensesService.updateExpense(id, payload));
export const useDeleteExpense = () => useExpenseMutation(expensesService.deleteExpense);
