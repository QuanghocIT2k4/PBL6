import api from './api';

/**
 * ================================================
 * AUTH SERVICE - QUẢN LÝ XÁC THỰC & TÀI KHOẢN
 * ================================================
 * ✅ Uses centralized api.js for:
 * - Consistent baseURL configuration
 * - Automatic JWT token attachment
 * - Unified error handling & retry logic
 * - Auto-logout on 401 Unauthorized
 */

// ===============================================
// 📌 AUTH API SERVICES
// ===============================================

/**
 * 1. ĐĂNG KÝ TÀI KHOẢN
 * POST /api/v1/users/register
 * Body: { email, password, retype_password, full_name }
 * Response: { success, data: { user info }, error }
 */
export const register = async ({ fullName, email, password, confirmPassword }) => {
  try {
    const response = await api.post('/api/v1/users/register', {
      full_name: fullName,
      email: email,
      password: password,
      retype_password: confirmPassword,
    });
    
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * 2. XÁC MINH EMAIL
 * GET /api/v1/users/verify?code=abc123
 * Response: { success, data, error }
 */
export const verifyEmail = async (code) => {
  try {
    const response = await api.get('/api/v1/users/verify', {
      params: { code },
    });
    
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * 3. ĐĂNG NHẬP
 * POST /api/v1/users/login
 * Body: { email, password }
 * Response: { success, data: { token, user }, error }
 */
export const login = async ({ email, password }) => {
  try {
    const response = await api.post('/api/v1/users/login', {
      email,
      password,
    });
    
    // ✅ BE trả về: { success: true, data: { token, refresh_token, id, username, roles }, error: null }
    if (response.data.success && response.data.data) {
      const loginData = response.data.data;
      const token = loginData.token;
      
      // 🔍 DEBUG: Log response từ backend
      console.log('🔍 API /login response:', loginData);
      console.log('🔍 Roles from backend:', loginData.roles);
      
      // Tạo object user từ data BE trả về
      const user = {
        id: loginData.id,
        name: loginData.username,
        email: email, // BE không trả email, dùng email đã nhập
        roles: loginData.roles || []
      };
      
      console.log('🔍 User object to save:', user);
      
      // Lưu vào localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Lưu thêm refresh_token nếu có
      if (loginData.refresh_token) {
        localStorage.setItem('refreshToken', loginData.refresh_token);
      }
      
      return {
        success: true,
        data: { token, user },
      };
    } else {
      return {
        success: false,
        error: response.data.error || 'Đăng nhập thất bại',
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * 4. LẤY THÔNG TIN USER HIỆN TẠI
 * GET /api/v1/users/current
 * Response: { success, data: { user info }, error }
 */
export const getCurrentUser = async () => {
  try {
    // Lấy user từ localStorage (đã có roles từ lúc login)
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      console.log('🔍 User from localStorage:', user);
      console.log('🔍 Roles from localStorage:', user.roles);
      return user;
    }
    
    // Nếu không có trong localStorage, gọi API
    const response = await api.get('/api/v1/users/current');
    
    // BE trả về: { success: true, data: { user info }, error: null }
    if (response.data.success && response.data.data) {
      const userData = response.data.data;
      
      // 🔍 DEBUG: Log response từ backend
      console.log('🔍 API /current response:', userData);
      console.log('🔍 Roles from backend:', userData.roles);
      
      // API /current không trả roles, cần lấy từ localStorage hoặc default
      const storedUserData = localStorage.getItem('user');
      if (storedUserData) {
        const parsedUser = JSON.parse(storedUserData);
        userData.roles = parsedUser.roles || [];
      }
      
      return userData;
    } else {
      return null;
    }
  } catch (error) {
    console.error('getCurrentUser error:', error);
    return null;
  }
};

/**
 * 5. ĐĂNG NHẬP GOOGLE
 * POST /api/v1/users/auth/social/callback
 * Body: { code, redirectUri }
 * Response: { success, data: { token, user }, error }
 */
export const loginWithGoogle = async ({ code, redirectUri }) => {
  try {
    const response = await api.post('/api/v1/users/auth/social/callback', {
      code,
      redirectUri,
    });
    
    const { token, user } = response.data;
    
    if (token) {
      localStorage.setItem('token', token);
    }
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    }
    
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * 6. QUÊN MẬT KHẨU
 * POST /forgot-password?email=user@example.com
 */
export const forgotPassword = async (email) => {
  try {
    const response = await api.post('/forgot-password', null, {
      params: { email },
    });
    
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * 7. ĐẶT LẠI MẬT KHẨU
 * POST /reset-password
 * Body: { token, password }
 */
export const resetPassword = async ({ token, password }) => {
  try {
    const response = await api.post('/reset-password', {
      token,
      password,
    });
    
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * 8. GỬI EMAIL XÁC MINH
 * POST /api/v1/users/send-verification-email
 * Response: { success, message, error }
 */
export const sendVerificationEmail = async () => {
  try {
    const response = await api.post('/api/v1/users/send-verification-email');
    
    return {
      success: true,
      message: response.data.message || 'Đã gửi email xác minh',
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * 9. ĐỔI MẬT KHẨU
 * POST /api/v1/users/change-password
 * Body: { oldPassword, newPassword }
 * Response: { success, message, error }
 */
export const changePassword = async ({ oldPassword, newPassword }) => {
  try {
    const response = await api.post('/api/v1/users/change-password', {
      oldPassword,
      newPassword,
    });
    
    return {
      success: true,
      message: response.data.message || 'Đổi mật khẩu thành công',
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * 10. CẬP NHẬT AVATAR
 * PUT /api/v1/users/avatar
 * Body: multipart/form-data { avatarFile }
 * Response: { success, data, error }
 */
export const updateAvatar = async (file) => {
  try {
    // Validate file
    if (!file) {
      return { success: false, error: 'Chưa chọn file ảnh' };
    }
    
    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return { 
        success: false, 
        error: `File không đúng định dạng. Chỉ hỗ trợ: ${validTypes.join(', ')}` 
      };
    }
    
    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return { 
        success: false, 
        error: `File quá lớn. Kích thước tối đa: ${maxSize / 1024 / 1024}MB` 
      };
    }
    
    console.log('📤 Uploading avatar:', {
      name: file.name,
      type: file.type,
      size: `${(file.size / 1024).toFixed(2)} KB`
    });
    
    const formData = new FormData();
    formData.append('avatarFile', file);
    
    const response = await api.put('/api/v1/users/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    console.log('📥 Avatar upload response:', response.data);
    
    // BE trả về: { success: true, data: { avatarUrl hoặc user object }, error: null }
    if (response.data.success) {
      return {
        success: true,
        data: response.data.data,
      };
    } else {
      return {
        success: false,
        error: response.data.error || 'Cập nhật avatar thất bại',
      };
    }
  } catch (error) {
    console.error('❌ Avatar upload error:', error);
    console.error('Error response:', error.response?.data);
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Lỗi upload avatar',
    };
  }
};

/**
 * 11. ĐĂNG XUẤT
 * Clears local storage and logs out user
 */
export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  return { success: true };
};

export default api;

