import axios from 'axios';

/**
 * ================================================
 * CENTRALIZED API CONFIGURATION
 * ================================================
 * Single axios instance used by all services
 * Benefits:
 * - DRY (Don't Repeat Yourself)
 * - Consistent configuration
 * - Centralized error handling
 * - Easy to maintain
 */

// ✅ Base URL - priority: env var > production
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://e-commerce-raq1.onrender.com';

// ✅ Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // ✅ Tăng lên 60s để đợi backend cold start (Render free tier)
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * ================================================
 * REQUEST INTERCEPTOR
 * ================================================
 * Automatically attach JWT token to all requests
 */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('❌ Request Interceptor Error:', error);
    return Promise.reject(error);
  }
);

/**
 * ================================================
 * RESPONSE INTERCEPTOR
 * ================================================
 * Handle common errors and auto-retry for server cold starts
 */
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    
    console.error('❌ API Error:', {
      url: config?.url,
      method: config?.method,
      status: error.response?.status,
      message: error.message,
    });
    
    // ✅ Auto-retry for server cold starts (502, 503, 504)
    if (error.response && [502, 503, 504].includes(error.response.status)) {
      config._retryCount = config._retryCount || 0;
      
      if (config._retryCount < 3) {
        config._retryCount++;
        
        // Wait 2 seconds before retry
        await new Promise(resolve => setTimeout(resolve, 2000));
        return api(config);
      }
    }
    
    // ✅ Handle 401 Unauthorized - auto logout
    // Chỉ redirect nếu có token (user đã login) và đang ở protected route
    if (error.response?.status === 401) {
      const isLoginPage = window.location.pathname === '/auth';
      const hasToken = localStorage.getItem('token');
      const isPublicRoute = ['/', '/products', '/product', '/stores', '/store', '/search'].some(
        route => window.location.pathname.startsWith(route)
      );
      
      // Chỉ redirect nếu:
      // 1. Không phải login page
      // 2. Có token (user đã login nhưng token invalid)
      // 3. Không phải public route (đang ở protected route)
      if (!isLoginPage && hasToken && !isPublicRoute) {
        console.warn('🔒 Unauthorized - Token expired or invalid');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('refreshToken');
        
        // Redirect to login page
        window.location.href = '/auth';
      }
      // Nếu không có token và đang ở public route → Không redirect (cho phép xem trang public)
    }
    
    // ✅ Extract error message
    let errorMessage = 'Có lỗi xảy ra';
    
    if (error.response) {
      // Server responded with error status
      errorMessage = error.response.data?.error || 
                     error.response.data?.message || 
                     `Lỗi ${error.response.status}`;
    } else if (error.request) {
      // No response received
      errorMessage = 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.';
    } else {
      // Request setup error
      errorMessage = error.message;
    }
    
    return Promise.reject(new Error(errorMessage));
  }
);

/**
 * ================================================
 * EXPORT
 * ================================================
 */
export default api;

// Also export the base URL for reference
export { API_BASE_URL };

