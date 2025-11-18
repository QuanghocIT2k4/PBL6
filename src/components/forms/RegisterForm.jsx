import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '../../context/ToastContext';
import { register as registerAPI } from '../../services/common/authService';
import Button from '../ui/Button';
import Input from '../ui/Input';

const registerSchema = z.object({
  fullName: z.string().trim().min(1, 'Họ tên là bắt buộc'),
  email: z.string().trim().email('Email không hợp lệ').min(1, 'Email là bắt buộc'),
  password: z.string().trim().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
  confirmPassword: z.string().trim().min(1, 'Xác nhận mật khẩu là bắt buộc')
}).refine((data) => {
  const pwd = data.password.trim();
  const confirm = data.confirmPassword.trim();
  console.log('🔍 Zod validation:', {
    password: `"${pwd}"`,
    confirmPassword: `"${confirm}"`,
    passwordLength: pwd.length,
    confirmLength: confirm.length,
    match: pwd === confirm
  });
  return pwd === confirm;
}, {
  message: 'Mật khẩu xác nhận không khớp',
  path: ['confirmPassword']
});

const RegisterForm = ({ onSwitchToLogin }) => {
  const { showToast } = useToast();
  const [successMessage, setSuccessMessage] = useState('');
  const [generalError, setGeneralError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    clearErrors
  } = useForm({
    resolver: zodResolver(registerSchema),
    mode: 'onChange', // Validate on change
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: ''
    }
  });

  const onSubmit = async (data) => {
    setGeneralError('');
    setSuccessMessage('');
    
    console.log('📝 Form data:', data);
    console.log('🔑 Password:', data.password);
    console.log('🔑 Confirm:', data.confirmPassword);
    console.log('✅ Match?', data.password === data.confirmPassword);
    
    try {
      const result = await registerAPI({
        fullName: data.fullName,
        email: data.email,
        password: data.password,
        confirmPassword: data.confirmPassword  // ✅ THÊM FIELD NÀY
      });
      
      if (result.success) {
        const message = result.message || 'Đăng ký thành công! Vui lòng kiểm tra email để xác minh.';
        setSuccessMessage(message);
        showToast(message, 'success');
        reset();
      } else {
        const errorMessage = result.error || 'Đăng ký thất bại';
        setGeneralError(errorMessage);
        showToast(errorMessage, 'error');
      }
    } catch (error) {
      const errorMessage = error.message || 'Đăng ký thất bại';
      setGeneralError(errorMessage);
      showToast(errorMessage, 'error');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Tạo tài khoản mới
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Hoặc{' '}
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              đăng nhập với tài khoản có sẵn
            </button>
          </p>
        </div>

        <div className="bg-white py-8 px-4 shadow rounded-lg sm:px-10">
          {/* Success Message */}
          {successMessage && (
            <div className="mb-4 bg-green-50 border border-green-300 text-green-800 px-4 py-3 rounded-md text-sm">
              {successMessage}
            </div>
          )}

          {/* Error Message */}
          {generalError && (
            <div className="mb-4 bg-red-50 border border-red-300 text-red-800 px-4 py-3 rounded-md text-sm">
              {generalError}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <Input
              {...register('fullName')}
              type="text"
              label="Họ và tên"
              placeholder="Nhập họ và tên"
              error={errors.fullName?.message}
              disabled={isSubmitting}
            />

            <Input
              {...register('email')}
              type="email"
              label="Email"
              placeholder="Nhập email của bạn"
              error={errors.email?.message}
              disabled={isSubmitting}
            />

            <Input
              {...register('password')}
              type="password"
              label="Mật khẩu"
              placeholder="Nhập mật khẩu (ít nhất 6 ký tự)"
              error={errors.password?.message}
              disabled={isSubmitting}
              showPasswordToggle
            />

            <Input
              {...register('confirmPassword')}
              type="password"
              label="Xác nhận mật khẩu"
              placeholder="Nhập lại mật khẩu"
              error={errors.confirmPassword?.message}
              disabled={isSubmitting}
              showPasswordToggle
            />

            <div className="flex items-center">
              <input
                id="agree-terms"
                name="agree-terms"
                type="checkbox"
                required
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="agree-terms" className="ml-2 block text-sm text-gray-900">
                Tôi đồng ý với{' '}
                <a href="#" className="text-blue-600 hover:text-blue-500">
                  Điều khoản sử dụng
                </a>{' '}
                và{' '}
                <a href="#" className="text-blue-600 hover:text-blue-500">
                  Chính sách bảo mật
                </a>
              </label>
            </div>

            <Button
              type="submit"
              loading={isSubmitting}
              className="w-full"
            >
              Tạo tài khoản
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;