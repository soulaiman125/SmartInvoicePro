import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import * as productsService from '../services/products.service.js';

const KEY = 'products';

export function useProducts(params) {
  return useQuery({
    queryKey: [KEY, params],
    queryFn: () => productsService.listProducts(params),
    placeholderData: keepPreviousData,
  });
}

export function useProduct(id) {
  return useQuery({
    queryKey: [KEY, 'detail', id],
    queryFn: () => productsService.getProduct(id),
    enabled: Boolean(id),
  });
}

export function useCategories() {
  return useQuery({
    queryKey: [KEY, 'categories'],
    queryFn: productsService.listCategories,
  });
}

function useInvalidatingMutation(mutationFn) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useCreateProduct() {
  return useInvalidatingMutation(productsService.createProduct);
}

export function useUpdateProduct() {
  return useInvalidatingMutation(({ id, payload }) => productsService.updateProduct(id, payload));
}

export function useDeleteProduct() {
  return useInvalidatingMutation(productsService.deleteProduct);
}
