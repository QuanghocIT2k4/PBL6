import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import * as authService from '../services/common/authService';
import Input from './ui/Input';
import Button from './ui/Button';

const forgotPasswordSchema = z.object({
  email: z.string().email('Email không hợp lệ').min(1, 'Email là bắt buộc')
});

const ForgotPasswordForm = ({ onBackToLogin }) => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [generalError, setGeneralError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    getValues
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: ''
    }
  });

  const onSubmit = async (data) => {
    setGeneralError('');
    
    const result = await authService.forgotPassword(data.email);
    
    if (result.success) {
      setIsSubmitted(true);
    } else {
      setGeneralError(result.error || 'Không thể gửi email. Vui lòng thử lại.');
    }
  };

  if (isSubmitted) {
    const email = getValues('email');
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Email đã được gửi!
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Chúng tôi đã gửi link reset mật khẩu tới <strong>{email}</strong>
            </p>
            <button
              onClick={onBackToLogin}
              className="mt-4 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Quay lại đăng nhập
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Quên mật khẩu?
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Nhập email của bạn để nhận link reset mật khẩu
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          {/* Error Message */}
          {generalError && (
            <div className="bg-red-50 border border-red-300 text-red-800 px-4 py-3 rounded-md text-sm">
              {generalError}
            </div>
          )}

          <Input
            {...register('email')}
            type="email"
            label="Email"
            placeholder="Nhập email của bạn"
            error={errors.email?.message}
            disabled={isSubmitting}
          />

          <div>
            <Button
              type="submit"
              loading={isSubmitting}
              className="w-full"
            >
              Gửi link reset mật khẩu
            </Button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={onBackToLogin}
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              ← Quay lại đăng nhập
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPasswordForm;