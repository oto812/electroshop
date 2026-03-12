import { createContext, useContext, useState, useEffect, useCallback, type ReactNode,  } from 'react';
import { useAuth } from './AuthContext';
import api from '@/lib/axios';

interface CartProduct {
  productId: number;
  quantity: number;
  name: string;
  price: number;
  imageUrl: string;
}

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
  const [cartItems, setCartItems] = useState<CartProduct[]>([]);
  const { isAuthenticated } = useAuth();

  const fetchCart = useCallback(async () => {
    if (isAuthenticated) {
      try {
        const { data } = await api.get('/cart');
        setCartItems(
          data.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            name: item.product.name,
            price: Number(item.product.price),
            imageUrl: item.product.imageUrl,
          }))
        );
      } catch {
        // Ignore errors
      }
    } else {
      const stored = localStorage.getItem('guestCart');
      if (stored) {
        setCartItems(JSON.parse(stored));
      }
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const saveGuestCart = (items: CartProduct[]) => {
    localStorage.setItem('guestCart', JSON.stringify(items));
    setCartItems(items);
  };

  const addToCart = async (
    product: { id: number; name: string; price: number; imageUrl: string },
    quantity: number
  ) => {
    if (isAuthenticated) {
      await api.post('/cart', { productId: product.id, quantity });
      await fetchCart();
    } else {
      const existing = cartItems.find((item) => item.productId === product.id);
      if (existing) {
        const updated = cartItems.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
        saveGuestCart(updated);
      } else {
        saveGuestCart([
          ...cartItems,
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
      await api.delete(`/cart/${productId}`);
      await fetchCart();
    } else {
      const updated = cartItems.filter((item) => item.productId !== productId);
      saveGuestCart(updated);
    }
  };

  const updateQuantity = async (productId: number, quantity: number) => {
    if (quantity <= 0) {
      return removeFromCart(productId);
    }

    if (isAuthenticated) {
      await api.patch(`/cart/${productId}`, { quantity });
      await fetchCart();
    } else {
      const updated = cartItems.map((item) =>
        item.productId === productId ? { ...item, quantity } : item
      );
      saveGuestCart(updated);
    }
  };

  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem('guestCart');
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