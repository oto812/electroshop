import { createContext, useContext, useState, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import {
  useCartQuery,
  useAddToCart,
  useRemoveFromCart,
  useUpdateCartQuantity,
  queryKeys,
  type CartProduct,
} from '@/lib/queries';

interface CartContextType {
  cartItems: CartProduct[];
  cartCount: number;
  addToCart: (product: { id: number; name: string; price: number; imageUrl: string }, quantity: number) => Promise<void>;
  removeFromCart: (productId: number) => Promise<void>;
  updateQuantity: (productId: number, quantity: number) => Promise<void>;
  clearCart: () => void;
  fetchCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  // Server cart (authenticated users)
  const { data: serverCart = [] } = useCartQuery(isAuthenticated);

  // Guest cart (unauthenticated users)
  const [guestCart, setGuestCart] = useState<CartProduct[]>(() => {
    const stored = localStorage.getItem('guestCart');
    return stored ? JSON.parse(stored) : [];
  });

  const cartItems = isAuthenticated ? serverCart : guestCart;

  // Mutations
  const addMutation = useAddToCart();
  const removeMutation = useRemoveFromCart();
  const updateMutation = useUpdateCartQuantity();

  const saveGuestCart = (items: CartProduct[]) => {
    localStorage.setItem('guestCart', JSON.stringify(items));
    setGuestCart(items);
  };

  const addToCart = async (
    product: { id: number; name: string; price: number; imageUrl: string },
    quantity: number
  ) => {
    if (isAuthenticated) {
      await addMutation.mutateAsync({ productId: product.id, quantity });
    } else {
      const existing = guestCart.find((item) => item.productId === product.id);
      if (existing) {
        saveGuestCart(
          guestCart.map((item) =>
            item.productId === product.id
              ? { ...item, quantity: item.quantity + quantity }
              : item
          )
        );
      } else {
        saveGuestCart([
          ...guestCart,
          {
            productId: product.id,
            quantity,
            name: product.name,
            price: product.price,
            imageUrl: product.imageUrl,
          },
        ]);
      }
    }
  };

  const removeFromCart = async (productId: number) => {
    if (isAuthenticated) {
      await removeMutation.mutateAsync(productId);
    } else {
      saveGuestCart(guestCart.filter((item) => item.productId !== productId));
    }
  };

  const updateQuantity = async (productId: number, quantity: number) => {
    if (quantity <= 0) {
      return removeFromCart(productId);
    }

    if (isAuthenticated) {
      await updateMutation.mutateAsync({ productId, quantity });
    } else {
      saveGuestCart(
        guestCart.map((item) =>
          item.productId === productId ? { ...item, quantity } : item
        )
      );
    }
  };

  const clearCart = () => {
    setGuestCart([]);
    localStorage.removeItem('guestCart');
    queryClient.setQueryData(queryKeys.cart, []);
  };

  const fetchCart = async () => {
    if (isAuthenticated) {
      await queryClient.invalidateQueries({ queryKey: queryKeys.cart });
    } else {
      const stored = localStorage.getItem('guestCart');
      setGuestCart(stored ? JSON.parse(stored) : []);
    }
  };

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{ cartItems, cartCount, addToCart, removeFromCart, updateQuantity, clearCart, fetchCart }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
