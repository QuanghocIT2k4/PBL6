import { useState, useEffect } from 'react';
import { userService } from '../services/admin/userService';
import * as authService from '../services/common/authService';
import { useAuth } from '../context/AuthContext';
import { createOrder as createOrderAPI, getMyOrders } from '../services/buyer/orderService';
import { clearCart } from '../services/buyer/cartService';

export const useProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [orderHistory, setOrderHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(false);

  // Fetch user profile
  const fetchProfile = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const result = await userService.getUserProfile(user.id);
      if (result.success) {
        setProfile(result.data);
      } else {
        setError('Không thể tải thông tin profile');
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  // Update profile
  const updateProfile = async (profileData) => {
    if (!user?.id) return { success: false, error: 'User not found' };
    
    try {
      setUpdating(true);
      setError(null);
      
      const result = await userService.updateUserProfile(user.id, profileData);
      if (result.success) {
        setProfile(result.data);
        return { success: true, message: 'Cập nhật profile thành công' };
      } else {
        setError(result.error);
        return { success: false, error: result.error };
      }
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setUpdating(false);
    }
  };

  // Change password
  const changePassword = async (passwordData) => {
    if (!user?.id) return { success: false, error: 'User not found' };
    
    try {
      setUpdating(true);
      const result = await userService.changePassword(user.id, passwordData);
      return result;
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      setUpdating(false);
    }
  };

  // Upload avatar
  const uploadAvatar = async (file) => {
    if (!user?.id) return { success: false, error: 'User not found' };
    
    try {
      setUpdating(true);
      
      // ✅ Gọi API update avatar
      const result = await authService.updateAvatar(file);
      
      if (result.success) {
        // Cập nhật avatar trong profile state
        const newAvatarUrl = result.data.avatar || result.data.avatarUrl || result.data;
        setProfile(prev => ({ ...prev, avatar: newAvatarUrl }));
        
        // Cập nhật avatar trong localStorage + AuthContext
        const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
        savedUser.avatar = newAvatarUrl;
        localStorage.setItem('user', JSON.stringify(savedUser));
        
        // Dispatch event để AuthContext cập nhật
        window.dispatchEvent(new CustomEvent('userUpdated', { detail: savedUser }));
        
        return { success: true, avatarUrl: newAvatarUrl };
      }
      return result;
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      setUpdating(false);
    }
  };

  // Fetch order history
  const fetchOrderHistory = async () => {
    if (!user?.id) return;
    
    try {
      // ✅ Dùng orderService.getMyOrders() - đã import ở đầu file
      const response = await getMyOrders();
      
      if (response.data) {
        // ✅ Parse paginated response
        const orders = response.data.content || response.data || [];
        setOrderHistory(orders);
      }
    } catch (err) {
      console.error('❌ Error fetching order history:', err);
    }
  };

  // Create order
  const createOrder = async (orderData) => {
    if (!user?.id) return { success: false, error: 'User not found' };
    try {
      // 🔍 DEBUG: Log payload trước khi gửi
      console.log('📦 Checkout payload:', JSON.stringify(orderData, null, 2));
      
      // ✅ Forward orderData directly (đã format đúng ở CheckoutPage)
      const result = await createOrderAPI(orderData);
      
      if (result.success) {
        // ✅ Clear cart after successful order
        await clearCart();
        
        // Refresh order history
        await fetchOrderHistory();
      }
      
      return result;
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    if (!user?.id) return { success: false, error: 'User not found' };
    try {
      const result = await userService.updateOrderStatus(user.id, orderId, status);
      if (result.success) await fetchOrderHistory();
      return result;
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // ✅ Delete order
  const deleteOrder = async (orderId) => {
    if (!user?.id) return { success: false, error: 'User not found' };
    try {
      const result = await userService.deleteOrder(user.id, orderId);
      if (result.success) await fetchOrderHistory();
      return result;
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // Load profile on component mount
  useEffect(() => {
    fetchProfile();
    fetchOrderHistory();
  }, [user?.id]);

  return {
    profile,
    orderHistory,
    loading,
    error,
    updating,
    updateProfile,
    changePassword,
    uploadAvatar,
    createOrder,
    updateOrderStatus,
    deleteOrder,
    refetchProfile: fetchProfile,
    refetchOrderHistory: fetchOrderHistory
  };
};