const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const userService = {
  // Get user profile
  async getUserProfile(userId) {
    await delay(300);
    
    // TODO: Thay bằng real API
    // const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
    //   headers: {
    //     'Authorization': `Bearer ${localStorage.getItem('token')}`
    //   }
    // });
    
    // Mock implementation
    let user = JSON.parse(localStorage.getItem('user') || '{}');
    
    // Nếu chưa có user, tạo user mặc định
    if (!user.id) {
      const defaultUser = {
        id: 'user_001',
        email: 'seller@techstore.com',
        name: 'Quang Nguyễn',
        avatar: null,
        phone: '',
        address: '',
        dateOfBirth: '',
        gender: '',
        preferences: {
          newsletter: true,
          promotions: true,
          notifications: true
        },
        stats: {
          totalOrders: 12,
          totalSpent: 45690000,
          memberSince: '2024-01-15'
        }
      };
      localStorage.setItem('user', JSON.stringify(defaultUser));
      user = defaultUser;
    }
    
    const mockProfile = {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar || null,
      phone: user.phone || '',
      address: user.address || '',
      dateOfBirth: user.dateOfBirth || '',
      gender: user.gender || '',
      preferences: user.preferences || {
        newsletter: true,
        promotions: true,
        notifications: true
      },
      stats: user.stats || {
        totalOrders: 12,
        totalSpent: 45690000,
        memberSince: '2024-01-15'
      }
    };
    
    return {
      success: true,
      data: mockProfile
    };
  },

  // Update user profile
  async updateUserProfile(userId, profileData) {
    await delay(500);
    
    // TODO: Thay bằng real API
    // const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
    //   method: 'PUT',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Authorization': `Bearer ${localStorage.getItem('token')}`
    //   },
    //   body: JSON.stringify(profileData)
    // });
    
    // Mock implementation
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const updatedUser = { ...currentUser, ...profileData };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    
    // Dispatch custom event để AuthContext có thể listen và update state
    window.dispatchEvent(new CustomEvent('userUpdated', { detail: updatedUser }));
    
    return {
      success: true,
      data: updatedUser,
      message: 'Cập nhật thông tin thành công!'
    };
  },

  // Change password
  async changePassword(userId, passwordData) {
    await delay(500);
    
    // TODO: Thay bằng real API
    // const response = await fetch(`${API_BASE_URL}/users/${userId}/password`, {
    //   method: 'PUT',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Authorization': `Bearer ${localStorage.getItem('token')}`
    //   },
    //   body: JSON.stringify(passwordData)
    // });
    
    // Mock implementation - validate current password
    if (passwordData.currentPassword !== 'password123') {
      return {
        success: false,
        error: 'Mật khẩu hiện tại không đúng'
      };
    }
    
    return {
      success: true,
      message: 'Đổi mật khẩu thành công'
    };
  },

  // Upload avatar
  async uploadAvatar(userId, file) {
    await delay(1000);
    
    // TODO: Thay bằng real API với FormData
    // const formData = new FormData();
    // formData.append('avatar', file);
    // const response = await fetch(`${API_BASE_URL}/users/${userId}/avatar`, {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${localStorage.getItem('token')}`
    //   },
    //   body: formData
    // });
    
    // Mock implementation - tạo URL từ file
    const avatarUrl = URL.createObjectURL(file);
    
    // Cập nhật user trong localStorage
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    currentUser.avatar = avatarUrl;
    localStorage.setItem('user', JSON.stringify(currentUser));
    
    return {
      success: true,
      data: { avatarUrl }
    };
  },

  // Get order history
  async getOrderHistory(userId) {
    await delay(400);
    
    // TODO: Thay bằng real API
    // const response = await fetch(`${API_BASE_URL}/users/${userId}/orders`);
    
    const key = `orders_${userId}`;
    const saved = localStorage.getItem(key);
    let orders = saved ? JSON.parse(saved) : [];
    
    // ✅ Nếu chưa có orders, tạo mock data với variant details
    if (orders.length === 0) {
      orders = [
        {
          id: 'ORD-2025-006',
          date: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
          status: 'processing',
          customer: { name: 'Quang Nguyễn', phone: '0367238563', address: '97 Nguyen Luong Bang' },
          items: [
            {
              productId: 1,
              name: 'ASUS ROG RTX 4080',
              quantity: 1,
              price: 24990000,
              options: {
                memoryType: 'GDDR6X',
                memorySize: '16GB',
                clockSpeed: '2230 MHz'
              },
              shop: { id: 'shop-1', name: 'Shop chính hãng' }
            },
            {
              productId: 2,
              name: 'MacBook Air M2',
              quantity: 1,
              price: 28990000,
              options: {
                ram: '8GB',
                storage: '256GB SSD',
                color: 'Bạc'
              },
              shop: { id: 'shop-1', name: 'Shop chính hãng' }
            }
          ],
          total: 53980000,
          shippingFee: 0,
          paymentMethod: 'cod',
          shippingMethod: 'express',
          note: '',
          promoCode: '',
          discount: 0,
          finalTotal: 53980000
        },
        {
          id: 'ORD-2025-004',
          date: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
          status: 'processing',
          customer: { name: 'Quang Nguyễn', phone: '0367238563', address: '97 Nguyen Luong Bang' },
          items: [
            {
              productId: 2,
              name: 'Sony WH-1000XM5',
              quantity: 2,
              price: 6990000,
              options: {
                color: 'Đen',
                connectivity: 'Bluetooth 5.2'
              }
            }
          ],
          total: 13980000,
          shippingFee: 0,
          paymentMethod: 'cod',
          shippingMethod: 'express',
          note: '',
          promoCode: '',
          discount: 0,
          finalTotal: 13980000
        }
      ];
      localStorage.setItem(key, JSON.stringify(orders));
    }
    
    return { success: true, data: orders };
  },

  // Create order and persist
  async createOrder(userId, orderData) {
    await delay(300);
    const key = `orders_${userId}`;
    const saved = localStorage.getItem(key);
    const orders = saved ? JSON.parse(saved) : [];
    const newOrder = {
      id: `ORD-${new Date().getFullYear()}-${(orders.length + 1).toString().padStart(3,'0')}`,
      date: new Date().toISOString(),
      status: 'processing',
      ...orderData
    };
    orders.unshift(newOrder);
    localStorage.setItem(key, JSON.stringify(orders));
    return { success: true, data: newOrder };
  },

  // Update order status
  async updateOrderStatus(userId, orderId, status) {
    await delay(200);
    const key = `orders_${userId}`;
    const saved = localStorage.getItem(key);
    const orders = saved ? JSON.parse(saved) : [];
    const idx = orders.findIndex(o => o.id === orderId);
    if (idx === -1) return { success: false, error: 'Order not found' };
    orders[idx].status = status;
    localStorage.setItem(key, JSON.stringify(orders));
    return { success: true, data: orders[idx] };
  },

  // ✅ Delete order
  async deleteOrder(userId, orderId) {
    await delay(200);
    const key = `orders_${userId}`;
    const saved = localStorage.getItem(key);
    const orders = saved ? JSON.parse(saved) : [];
    const idx = orders.findIndex(o => o.id === orderId);
    if (idx === -1) return { success: false, error: 'Order not found' };
    
    const deletedOrder = orders.splice(idx, 1)[0];
    localStorage.setItem(key, JSON.stringify(orders));
    return { success: true, data: deletedOrder };
  }
};