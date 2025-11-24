import React from 'react';
import { Routes, Route } from 'react-router-dom';
import StoreAuthGuard from '../components/auth/StoreAuthGuard';
import StoreDashboard from '../pages/store/StoreDashboard';
import StoreProducts from '../pages/store/StoreProducts';
import StoreProductVariants from '../pages/store/StoreProductVariants';
import StoreProfile from '../pages/store/StoreProfile';
import StoreOrders from '../pages/store/StoreOrders';
import StoreProductDetail from '../pages/store/StoreProductDetail';
import StoreOrderDetail from '../pages/store/StoreOrderDetail';
import StorePromotions from '../pages/store/StorePromotions';
import StoreAnalytics from '../pages/store/StoreAnalytics';
import StoreNotifications from '../pages/store/StoreNotifications';
import StoreCreateProduct from '../pages/store/StoreCreateProduct';
import StoreChats from '../pages/store/StoreChats';
import AddProductVariant from '../pages/store/AddProductVariant';
import StoreManagement from '../pages/store/StoreManagement';
import StoreWallet from '../pages/store/StoreWallet';
import StoreShipments from '../pages/store/StoreShipments';

const StoreRoutes = () => {
  return (
    <StoreAuthGuard>
      <Routes>
        <Route path="/" element={<StoreDashboard />} />
        <Route path="/dashboard" element={<StoreDashboard />} />
        <Route path="/profile" element={<StoreProfile />} />
        <Route path="/products" element={<StoreProducts />} />
        <Route path="/products/create" element={<StoreCreateProduct />} />
        <Route path="/products/create-variant" element={<AddProductVariant />} />
        <Route path="/products/:productId" element={<StoreProductDetail />} />
        <Route path="/products/:productId/add-variant" element={<AddProductVariant />} />
        <Route path="/product-variants" element={<StoreProductVariants />} />
        <Route path="/product-variants/:variantId" element={<StoreProductDetail />} />
        <Route path="/product-variants/add" element={<AddProductVariant />} />
        <Route path="/orders" element={<StoreOrders />} />
        <Route path="/orders/:orderId" element={<StoreOrderDetail />} />
        <Route path="/promotions" element={<StorePromotions />} />
        <Route path="/analytics" element={<StoreAnalytics />} />
        <Route path="/notifications" element={<StoreNotifications />} />
        <Route path="/shipments" element={<StoreShipments />} />
        <Route path="/chats" element={<StoreChats />} />
        <Route path="/management" element={<StoreManagement />} />
        <Route path="/wallet/:storeId" element={<StoreWallet />} />
      </Routes>
    </StoreAuthGuard>
  );
};

export default StoreRoutes;
