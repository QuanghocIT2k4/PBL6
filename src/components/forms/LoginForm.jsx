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
        const isShipper = userRoles.includes('SHIPPER') || userRoles.includes('ROLE_SHIPPER');
        
        if (isAdmin) {
          window.location.href = '/admin-dashboard';
        } else if (isShipper) {
          // Shipper → redirect đến trang shipper
          window.location.href = '/shipper';
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
        </div>
      </div>
    </div>
  );
};

export default LoginForm;