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
 * 1. ĐĂNG KÝ - UPDATED (27/11/2024)
 * POST /api/v1/users/register
 * Body: { email, password, retype_password, full_name, phone?, dateOfBirth? }
 * Response: { success, data: { user info }, error }
 * 
 * ✅ NEW: Thêm phone và dateOfBirth (optional)
 */
export const register = async ({ fullName, email, password, confirmPassword, phone, dateOfBirth }) => {
  try {
    const requestBody = {
      full_name: fullName,
      email: email,
      password: password,
      retype_password: confirmPassword,
    };

    // ✅ NEW: Thêm phone và dateOfBirth nếu có
    if (phone && phone.trim()) {
      requestBody.phone = phone.trim();
    }
    
    if (dateOfBirth) {
      requestBody.dateOfBirth = dateOfBirth; // Format: YYYY-MM-DD
    }

    console.log('📝 Registration request:', requestBody);

    const response = await api.post('/api/v1/users/register', requestBody);
    
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
      
      const user = {
        id: loginData.id,
        name: loginData.username,
        email: email, // BE không trả email, dùng email đã nhập
        roles: loginData.roles || []
      };
      
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
    // ✅ Kiểm tra token trước - nếu không có token thì không lấy user
    const token = localStorage.getItem('token');
    if (!token) {
      return null;
    }
    
    // Lấy user từ localStorage (đã có roles từ lúc login)
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      // ✅ Kiểm tra lại token để đảm bảo đồng bộ
      if (token) {
        return JSON.parse(storedUser);
      }
      return null;
    }
    
    // Nếu không có trong localStorage, gọi API
    const response = await api.get('/api/v1/users/current');
    
    // BE trả về: { success: true, data: { user info }, error: null }
    if (response.data.success && response.data.data) {
      const userData = response.data.data;
      
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
    // ✅ Nếu lỗi 401 (Unauthorized), clear localStorage
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }
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
    
    
    const formData = new FormData();
    formData.append('avatarFile', file);
    
    const response = await api.put('/api/v1/users/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
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
 * POST /api/v1/users/logout
 * ⚠️ UPDATED: 26/11/2024 - Gọi API logout thay vì chỉ clear localStorage
 */
export const logout = async () => {
  console.log('🚀 AuthService: logout() function called');
  try {
    // Gọi API logout để invalidate token trên server
    console.log('🚀 AuthService: Calling API logout');
    await api.post('/api/v1/users/logout');
  } catch (error) {
    console.error('Logout API error:', error);
    // Tiếp tục clear localStorage dù API lỗi
  } finally {
    // ✅ Luôn clear localStorage và sessionStorage
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    // ✅ Clear cart luôn để chắc chắn badge giỏ hàng về 0 sau logout
    localStorage.removeItem('cart');
    sessionStorage.clear(); // ✅ Clear sessionStorage để đảm bảo
    
    // Dispatch logout event để CartContext clear cart
    console.log('🚨 AuthService: Dispatching userLogout event');
    window.dispatchEvent(new CustomEvent('userLogout'));
  }
  
  return { 
    success: true,
    message: 'Đăng xuất thành công'
  };
};

/**
 * 12. LÀM MỚI TOKEN
 * POST /api/v1/users/refresh-token
 * ✅ NEW: 26/11/2024 - Auto refresh token khi hết hạn
 */
export const refreshToken = async () => {
  try {
    const currentRefreshToken = localStorage.getItem('refreshToken');
    
    if (!currentRefreshToken) {
      return {
        success: false,
        error: 'Không tìm thấy refresh token',
      };
    }
    
    const response = await api.post('/api/v1/users/refresh-token', {
      refreshToken: currentRefreshToken,
    });
    
    // BE trả về: { success: true, data: { token, refresh_token }, error: null }
    if (response.data.success && response.data.data) {
      const { token, refresh_token } = response.data.data;
      
      // Lưu token mới
      localStorage.setItem('token', token);
      if (refresh_token) {
        localStorage.setItem('refreshToken', refresh_token);
      }
      
      return {
        success: true,
        data: { token, refresh_token },
      };
    } else {
      return {
        success: false,
        error: response.data.error || 'Không thể làm mới token',
      };
    }
  } catch (error) {
    console.error('Refresh token error:', error);
    
    // Nếu refresh token thất bại, logout user
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    
    return {
      success: false,
      error: error.message || 'Phiên đăng nhập đã hết hạn',
    };
  }
};

/**
 * 13. CẬP NHẬT THÔNG TIN USER - NEW (27/11/2024)
 * PUT /api/v1/users/profile
 * Body: { fullName, phone, dateOfBirth }
 * ✅ NEW: API cập nhật thông tin user
 */
export const updateProfile = async ({ fullName, phone, dateOfBirth }) => {
  try {
    if (!fullName || !phone || !dateOfBirth) {
      throw new Error('fullName, phone và dateOfBirth là bắt buộc');
    }

    console.log('📝 Updating user profile:', { fullName, phone, dateOfBirth });

    const response = await api.put('/api/v1/users/profile', {
      fullName: fullName.trim(),
      phone: phone.trim(),
      dateOfBirth: dateOfBirth, // Format: YYYY-MM-DD
    });

    console.log('✅ Profile updated successfully:', response.data);

    return {
      success: true,
      data: response.data.data || response.data,
      message: 'Cập nhật thông tin thành công',
    };
  } catch (error) {
    console.error('❌ Error updating profile:', error);
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Không thể cập nhật thông tin',
    };
  }
};

export default api;

