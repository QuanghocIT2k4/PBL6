import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../context/AuthContext';
import { login as loginService } from '../../services/common/authService';
import { useToast } from '../../context/ToastContext';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { getMyStores } from '../../services/b2c/b2cStoreService';

const LoginForm = ({ onSwitchToSignUp, onSwitchToForgotPassword }) => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const loginSchema = z.object({
    email: z.string({ required_error: 'Email là bắt buộc' })
      .min(1, 'Email là bắt buộc')
      .email('Email không hợp lệ'),
    password: z.string({ required_error: 'Mật khẩu là bắt buộc' })
      .min(1, 'Mật khẩu là bắt buộc')
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  });

  const checkUserStores = async (user) => {
    try {
      console.log('🔍 Checking user stores for:', user.id);
      const storesResult = await getMyStores();
      
      if (storesResult.success && storesResult.data && storesResult.data.length > 0) {
        console.log('🏪 User has stores:', storesResult.data.length);
        // User có store → redirect đến store-dashboard
        window.location.href = '/store-dashboard';
      } else {
        console.log('👤 User không có store → redirect đến home');
        // User không có store → redirect đến home
        window.location.href = '/';
      }
    } catch (error) {
      console.error('❌ Error checking stores:', error);
      // Nếu lỗi, mặc định redirect về home
      window.location.href = '/';
    }
  };

  const onSubmit = async (data) => {
    try {
      const result = await loginService({ email: data.email, password: data.password });

      if (result.success) {
        showToast('Đăng nhập thành công!', 'success');
        login(result.data.user);
        await new Promise(resolve => setTimeout(resolve, 100));
        const userRoles = result.data.user.roles || [];
        const isAdmin = userRoles.includes('ADMIN') || userRoles.includes('ROLE_ADMIN');
        
        if (isAdmin) {
          window.location.href = '/admin-dashboard';
        } else {
          // Kiểm tra user có store không bằng cách gọi API
          checkUserStores(result.data.user);
        }
      } else if (result.error) {
        showToast(result.error, 'error');
      } else {
        showToast('Đăng nhập thất bại', 'error');
      }
    } catch (error) {
      showToast(error.message || 'Có lỗi xảy ra khi đăng nhập', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Đăng nhập tài khoản
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Hoặc{' '}
            <button
              type="button"
              onClick={onSwitchToSignUp}
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              tạo tài khoản mới
            </button>
          </p>
        </div>

        <div className="bg-white py-8 px-4 shadow rounded-lg sm:px-10">
          {/* Form */}
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <Input
              name="email"
              type="email"
              label="Email"
              placeholder="Nhập email của bạn"
              error={errors.email?.message}
              disabled={isSubmitting}
              {...register('email')}
            />

            <Input
              name="password"
              type="password"
              label="Mật khẩu"
              placeholder="Nhập mật khẩu"
              error={errors.password?.message}
              disabled={isSubmitting}
              showPasswordToggle
              {...register('password')}
            />

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                  Ghi nhớ đăng nhập
                </label>
              </div>

              <button
                type="button"
                onClick={onSwitchToForgotPassword}
                className="text-sm font-medium text-blue-600 hover:text-blue-500"
              >
                Quên mật khẩu?
              </button>
            </div>

            <Button
              type="submit"
              loading={isSubmitting}
              className="w-full"
            >
              Đăng nhập
            </Button>
          </form>

          {/* Social Login */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Hoặc đăng nhập với</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={() => alert('Đăng nhập với Google - Tính năng sẽ được phát triển sau')}
                className="w-full"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google
              </Button>

              <Button
                variant="outline"
                onClick={() => alert('Đăng nhập với Facebook - Tính năng sẽ được phát triển sau')}
                className="w-full"
              >
                <svg className="w-5 h-5 mr-2" fill="#1877F2" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                Facebook
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;