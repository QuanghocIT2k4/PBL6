import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Input from '../ui/Input';
import Button from '../ui/Button';

const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, 'Mật khẩu hiện tại là bắt buộc'),
  newPassword: z.string().min(6, 'Mật khẩu mới phải có ít nhất 6 ký tự'),
  confirmPassword: z.string().min(1, 'Xác nhận mật khẩu là bắt buộc')
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Mật khẩu xác nhận không khớp',
  path: ['confirmPassword']
}).refine((data) => data.currentPassword !== data.newPassword, {
  message: 'Mật khẩu mới phải khác mật khẩu hiện tại',
  path: ['newPassword']
});

const PasswordChangeForm = ({ onSubmit: onSubmitForm }) => {
  const [submitError, setSubmitError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset
  } = useForm({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
  });

  const onSubmit = async (data) => {
    setSubmitError('');
    
    try {
      const result = await onSubmitForm({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword
      });
      
      if (result.success) {
        reset();
        
        // Show success notification
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transform transition-all duration-300';
        notification.textContent = result.message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
          notification.classList.add('opacity-0', 'translate-x-full');
          setTimeout(() => {
            if (notification.parentNode) {
              notification.parentNode.removeChild(notification);
            }
          }, 300);
        }, 3000);
      } else {
        setSubmitError(result.error);
      }
    } catch (error) {
      setSubmitError('Đã xảy ra lỗi khi đổi mật khẩu');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Đổi mật khẩu</h2>
      
      {submitError && (
        <div className="mb-4 bg-red-50 border border-red-300 text-red-800 px-4 py-3 rounded-md text-sm">
          {submitError}
        </div>
      )}
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-md">
        <Input
          {...register('currentPassword')}
          type="password"
          label="Mật khẩu hiện tại *"
          placeholder="Nhập mật khẩu hiện tại"
          error={errors.currentPassword?.message}
          disabled={isSubmitting}
          showPasswordToggle
        />
        
        <Input
          {...register('newPassword')}
          type="password"
          label="Mật khẩu mới *"
          placeholder="Nhập mật khẩu mới (ít nhất 6 ký tự)"
          error={errors.newPassword?.message}
          disabled={isSubmitting}
          showPasswordToggle
        />
        
        <Input
          {...register('confirmPassword')}
          type="password"
          label="Xác nhận mật khẩu mới *"
          placeholder="Nhập lại mật khẩu mới"
          error={errors.confirmPassword?.message}
          disabled={isSubmitting}
          showPasswordToggle
        />

        {/* Password Requirements */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4 text-sm">
          <h4 className="font-medium text-blue-900 mb-2">Yêu cầu mật khẩu:</h4>
          <ul className="text-blue-800 space-y-1">
            <li>• Ít nhất 6 ký tự</li>
            <li>• Khác với mật khẩu hiện tại</li>
            <li>• Nên có cả chữ hoa, chữ thường và số</li>
          </ul>
        </div>

        <div className="flex justify-end">
          <Button
            type="submit"
            loading={isSubmitting}
            className="px-8"
          >
            Đổi mật khẩu
          </Button>
        </div>
      </form>
    </div>
  );
};

export default PasswordChangeForm;