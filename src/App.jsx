import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SWRConfig } from 'swr';
import { HelmetProvider } from 'react-helmet-async';
import { lazy, Suspense } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { StoreProvider } from './context/StoreContext';
import { ToastProvider } from './context/ToastContext';
import { ChatProvider } from './context/ChatContext';

// ✅ CODE SPLITTING: Lazy load các routes để tối ưu performance
const HomePage = lazy(() => import('./pages/home/HomePage'));
const AuthPage = lazy(() => import('./pages/auth/AuthPage'));
const VerifyEmailPage = lazy(() => import('./pages/auth/VerifyEmailPage'));
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage'));
const ProductDetail = lazy(() => import('./pages/products/ProductDetail'));
const ProductList = lazy(() => import('./pages/products/ProductList'));
const CartPage = lazy(() => import('./pages/cart/CartPage'));
const ShopPage = lazy(() => import('./pages/shop/ShopPage'));
const CheckoutPage = lazy(() => import('./pages/checkout/CheckoutPage'));
const OrdersPage = lazy(() => import('./pages/orders/OrdersPage'));
const OrderDetailPage = lazy(() => import('./pages/orders/OrderDetailPage'));
const SearchResults = lazy(() => import('./pages/search/SearchResults'));
const ProfilePage = lazy(() => import('./pages/profile/ProfilePage'));
const BuyerNotifications = lazy(() => import('./pages/buyer/BuyerNotifications'));
const BuyerWallet = lazy(() => import('./pages/buyer/BuyerWallet'));
const StoresPage = lazy(() => import('./pages/stores/StoresPage'));
const StoreDetailPage = lazy(() => import('./pages/stores/StoreDetailPage'));
const StoreRoutes = lazy(() => import('./routes/StoreRoutes'));
const AdminRoutes = lazy(() => import('./routes/AdminRoutes'));
const BecomeStoreOwner = lazy(() => import('./pages/store/BecomeStoreOwner'));
const PaymentCallback = lazy(() => import('./pages/payment/PaymentCallback'));
const ChatPage = lazy(() => import('./pages/chat/ChatPage'));
const ShipperDashboard = lazy(() => import('./pages/shipper/ShipperDashboard'));
const ShipperShipmentDetail = lazy(() => import('./pages/shipper/ShipperShipmentDetail'));

// Loading component
const LoadingSpinner = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      <p className="mt-4 text-gray-600">Đang tải...</p>
    </div>
  </div>
);

const AppContent = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Suspense fallback={<LoadingSpinner />}>
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
        <Route path="/wallet" element={<BuyerWallet />} />
        <Route path="/payment/callback" element={<PaymentCallback />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/become-store-owner" element={<BecomeStoreOwner />} />
        
        {/* Shipper Routes */}
        <Route path="/shipper" element={<ShipperDashboard />} />
        <Route path="/shipper/history" element={<ShipperDashboard />} />
        <Route path="/shipper/shipments/:orderId" element={<ShipperShipmentDetail />} />
        
        {/* Store Management Routes (B2C) */}
        <Route path="/store-dashboard/*" element={<StoreRoutes />} />
        
        {/* Admin Management Routes */}
        <Route path="/admin-dashboard/*" element={<AdminRoutes />} />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};

export default function App() {
  return (
    <HelmetProvider>
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
    </HelmetProvider>
  );
}
