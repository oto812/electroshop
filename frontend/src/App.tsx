import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import styled from 'styled-components';
import { ThemeProvider } from '@/styles/ThemeProvider';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { Toaster } from 'sonner';
import { Navbar } from '@/components/Navbar';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AdminRoute } from '@/components/AdminRoute';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { ProductListPage } from '@/pages/ProductListPage';
import { CartPage } from '@/pages/CartPage';
import { CheckoutPage } from '@/pages/CheckoutPage';
import { OrdersPage } from '@/pages/OrdersPage';
import { OrderDetailPage } from '@/pages/OrderDetailPage';
import { AdminLayout } from '@/pages/admin/AdminLayout';
import { AdminProductsPage } from '@/pages/admin/AdminProductsPage';
import { AdminOrdersPage } from '@/pages/admin/AdminOrdersPage';
import { AdminOrderDetailPage } from '@/pages/admin/AdminOrderDetailPage';

const queryClient = new QueryClient();

const MainContent = styled.main`
  max-width: 80rem;
  margin: 0 auto;
  padding: ${({ theme }) => `${theme.space[6]} ${theme.space[4]}`};

  @media (min-width: ${({ theme }) => theme.breakpoint.sm}) {
    padding-left: ${({ theme }) => theme.space[6]};
    padding-right: ${({ theme }) => theme.space[6]};
  }

  @media (min-width: ${({ theme }) => theme.breakpoint.lg}) {
    padding-left: ${({ theme }) => theme.space[8]};
    padding-right: ${({ theme }) => theme.space[8]};
  }
`;

export default function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <CartProvider>
              <Navbar />
              <MainContent>
                <Routes>
                  <Route path="/" element={<ProductListPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/cart" element={<CartPage />} />
                  <Route path="/checkout" element={
                    <ProtectedRoute><CheckoutPage /></ProtectedRoute>
                  } />
                  <Route path="/orders" element={
                    <ProtectedRoute><OrdersPage /></ProtectedRoute>
                  } />
                  <Route path="/orders/:id" element={
                    <ProtectedRoute><OrderDetailPage /></ProtectedRoute>
                  } />
                  <Route path="/admin" element={
                    <AdminRoute><AdminLayout /></AdminRoute>
                  }>
                    <Route index element={<Navigate to="products" replace />} />
                    <Route path="products" element={<AdminProductsPage />} />
                    <Route path="orders" element={<AdminOrdersPage />} />
                    <Route path="orders/:id" element={<AdminOrderDetailPage />} />
                  </Route>
                </Routes>
              </MainContent>
              <Toaster position="top-right" richColors />
            </CartProvider>
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
