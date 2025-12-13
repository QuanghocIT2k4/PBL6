import React from 'react';
import { Routes, Route } from 'react-router-dom';
import AdminAuthGuard from '../components/auth/AdminAuthGuard';
import AdminLayout from '../layouts/AdminLayout';
import AdminDashboard from '../pages/admin/AdminDashboard';
import AdminUsers from '../pages/admin/AdminUsers';
import AdminStores from '../pages/admin/AdminStores';
import AdminProducts from '../pages/admin/AdminProducts';
import AdminVariants from '../pages/admin/AdminVariants';
import AdminPromotions from '../pages/admin/AdminPromotions';
import AdminWithdrawals from '../pages/admin/AdminWithdrawals';
import AdminRevenue from '../pages/admin/AdminRevenue';
import AdminShippers from '../pages/admin/AdminShippers';

const AdminRoutes = () => {
  return (
    <AdminAuthGuard>
      <AdminLayout>
        <Routes>
          <Route path="/" element={<AdminDashboard />} />
          <Route path="/users" element={<AdminUsers />} />
          <Route path="/stores" element={<AdminStores />} />
          <Route path="/products" element={<AdminProducts />} />
          <Route path="/variants" element={<AdminVariants />} />
          <Route path="/promotions" element={<AdminPromotions />} />
          <Route path="/withdrawals" element={<AdminWithdrawals />} />
          <Route path="/statistics" element={<AdminRevenue />} />
          <Route path="/revenue" element={<AdminRevenue />} /> {/* Backward compatibility */}
          <Route path="/shippers" element={<AdminShippers />} />
        </Routes>
      </AdminLayout>
    </AdminAuthGuard>
  );
};

export default AdminRoutes;

//// ĐÃ KHÔI PHỤC