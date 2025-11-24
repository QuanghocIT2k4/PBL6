import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SWRConfig } from 'swr';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { StoreProvider } from './context/StoreContext';
import { ToastProvider } from './context/ToastContext';
import { ChatProvider } from './context/ChatContext';
import AuthPage from './pages/auth/AuthPage';
import VerifyEmailPage from './pages/auth/VerifyEmailPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import HomePage from './pages/home/HomePage';
import ProductDetail from './pages/products/ProductDetail';
import ProductList from './pages/products/ProductList';
import CartPage from './pages/cart/CartPage';
import ShopPage from './pages/shop/ShopPage';
import CheckoutPage from './pages/checkout/CheckoutPage';
import OrdersPage from './pages/orders/OrdersPage';
import OrderDetailPage from './pages/orders/OrderDetailPage';
import SearchResults from './pages/search/SearchResults';
import ProfilePage from './pages/profile/ProfilePage';
import BuyerNotifications from './pages/buyer/BuyerNotifications';
import StoresPage from './pages/stores/StoresPage';
import StoreDetailPage from './pages/stores/StoreDetailPage';
import StoreRoutes from './routes/StoreRoutes';
import AdminRoutes from './routes/AdminRoutes';
import BecomeStoreOwner from './pages/store/BecomeStoreOwner';
import PaymentCallback from './pages/payment/PaymentCallback';
import ChatPage from './pages/chat/ChatPage';

const AppContent = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/product/:id" element={<ProductDetail />} />
      <Route path="/products/:category" element={<ProductList />} />
      <Route path="/search" element={<SearchResults />} />
      <Route path="/cart" element={<CartPage />} />
      <Route path="/stores" element={<StoresPage />} />
      <Route path="/store/:storeId" element={<StoreDetailPage />} />
      <Route path="/checkout" element={<CheckoutPage />} />
      <Route path="/orders" element={<OrdersPage />} />
      <Route path="/orders/:id" element={<OrderDetailPage />} />
      <Route path="/notifications" element={<BuyerNotifications />} />
      <Route path="/payment/callback" element={<PaymentCallback />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/chat" element={<ChatPage />} />
      <Route path="/become-store-owner" element={<BecomeStoreOwner />} />
      
      {/* Store Management Routes (B2C) */}
      <Route path="/store-dashboard/*" element={<StoreRoutes />} />
      
      {/* Admin Management Routes */}
      <Route path="/admin-dashboard/*" element={<AdminRoutes />} />
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default function App() {
  return (
    <SWRConfig
      value={{
        // ✅ CẤU HÌNH SWR CHO TOÀN APP
        dedupingInterval: 60000, // Cache 60s
        focusThrottleInterval: 60000,
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
        shouldRetryOnError: false,
      }}
    >
      <AuthProvider>
        <CartProvider>
          <StoreProvider>
            <ChatProvider>
              <ToastProvider>
                <BrowserRouter>
                  <AppContent />
                </BrowserRouter>
              </ToastProvider>
            </ChatProvider>
          </StoreProvider>
        </CartProvider>
      </AuthProvider>
    </SWRConfig>
  );
}
