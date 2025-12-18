import React, { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentUser, logout as logoutService } from '../services/common/authService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      // ✅ Kiểm tra token trước khi gọi getCurrentUser
      const token = localStorage.getItem('token');
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }
      
      const currentUser = await getCurrentUser();
      // ✅ Chỉ set user nếu có token và user data hợp lệ
      if (currentUser && token) {
        setUser(currentUser);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = (userData) => {
    setUser(userData);
  };

  const logout = async () => {
    try {
      console.log('🔑 AuthContext: logout() called, calling logoutService()');
      // ✅ Clear user ngay lập tức trước khi gọi logout service
      setUser(null);
      await logoutService();
      // ✅ Đảm bảo user đã được clear
      setUser(null);
      console.log('🔑 AuthContext: logout completed, user set to null');
    } catch (error) {
      console.error('Logout failed:', error);
      // ✅ Vẫn clear user dù có lỗi
      setUser(null);
    }
  };

  const value = {
    user,
    loading,
    login,
    logout,
    checkAuth,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export default AuthContext;
