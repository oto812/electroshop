import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from './axios';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Product {
  id: number;
  name: string;
  description: string;
  imageUrl: string;
  price: number;
  stockQuantity: number;
}

export interface Order {
  id: number;
  totalAmount: number;
  status: string;
  createdAt: string;
}

export interface AdminOrder extends Order {
  deliveryLatitude?: number | null;
  deliveryLongitude?: number | null;
  user: { email: string };
}

export interface OrderDetail extends Order {
  deliveryAddress: string;
  deliveryLatitude?: number | null;
  deliveryLongitude?: number | null;
  user?: { email: string };
  orderItems: Array<{
    id: number;
    quantity: number;
    priceAtOrder: number;
    product: { name: string };
  }>;
}

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const queryKeys = {
  products: ['products'] as const,
  adminProducts: ['products', 'admin'] as const,
  orders: ['orders'] as const,
  adminOrders: ['orders', 'all'] as const,
  order: (id: string | undefined) => ['orders', id] as const,
  cart: ['cart'] as const,
};

// ─── Product Queries ──────────────────────────────────────────────────────────

export function useProducts() {
  return useQuery({
    queryKey: queryKeys.products,
    queryFn: async () => {
      const { data } = await api.get('/products');
      return data.map((p: any) => ({ ...p, price: Number(p.price) })) as Product[];
    },
  });
}

export function useAdminProducts() {
  return useQuery({
    queryKey: queryKeys.adminProducts,
    queryFn: async () => {
      const { data } = await api.get('/products/admin');
      return data.map((p: any) => ({ ...p, price: Number(p.price) })) as Product[];
    },
  });
}

// ─── Product Mutations ────────────────────────────────────────────────────────

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (product: Omit<Product, 'id'>) => api.post('/products', product),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products });
      queryClient.invalidateQueries({ queryKey: queryKeys.adminProducts });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Product> & { id: number }) =>
      api.patch(`/products/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products });
      queryClient.invalidateQueries({ queryKey: queryKeys.adminProducts });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/products/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products });
      queryClient.invalidateQueries({ queryKey: queryKeys.adminProducts });
    },
  });
}

// ─── Order Queries ────────────────────────────────────────────────────────────

export function useOrders() {
  return useQuery({
    queryKey: queryKeys.orders,
    queryFn: async () => {
      const { data } = await api.get('/orders');
      return data as Order[];
    },
  });
}

export function useAdminOrders() {
  return useQuery({
    queryKey: queryKeys.adminOrders,
    queryFn: async () => {
      const { data } = await api.get('/orders/all');
      return data as AdminOrder[];
    },
  });
}

export function useOrderDetail(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.order(id),
    queryFn: async () => {
      const { data } = await api.get(`/orders/${id}`);
      return {
        ...data,
        totalAmount: Number(data.totalAmount),
        orderItems: data.orderItems.map((item: any) => ({
          ...item,
          priceAtOrder: Number(item.priceAtOrder),
        })),
      } as OrderDetail;
    },
    enabled: !!id,
  });
}

// ─── Order Mutations ──────────────────────────────────────────────────────────

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      api.patch(`/orders/${id}/status`, { status }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminOrders });
      queryClient.invalidateQueries({ queryKey: queryKeys.order(String(id)) });
    },
  });
}

// ─── Cart Queries & Mutations ─────────────────────────────────────────────────

export interface CartProduct {
  productId: number;
  quantity: number;
  name: string;
  price: number;
  imageUrl: string;
}

export function useCartQuery(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.cart,
    queryFn: async () => {
      const { data } = await api.get('/cart');
      return data.map((item: any) => ({
        productId: item.productId,
        quantity: item.quantity,
        name: item.product.name,
        price: Number(item.product.price),
        imageUrl: item.product.imageUrl,
      })) as CartProduct[];
    },
    enabled,
  });
}

export function useAddToCart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, quantity }: { productId: number; quantity: number }) =>
      api.post('/cart', { productId, quantity }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cart });
    },
  });
}

export function useRemoveFromCart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (productId: number) => api.delete(`/cart/${productId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cart });
    },
  });
}

export function useUpdateCartQuantity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, quantity }: { productId: number; quantity: number }) =>
      api.patch(`/cart/${productId}`, { quantity }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cart });
    },
  });
}
