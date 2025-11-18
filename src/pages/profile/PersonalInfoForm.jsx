import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

const personalInfoSchema = z.object({
  name: z.string().min(1, 'Tên là bắt buộc').trim(),
  phone: z.string().optional().refine((val) => {
    if (!val || val.trim() === '') return true;
    return /^\d{10,11}$/.test(val.replace(/\s/g, ''));
  }, {
    message: 'Số điện thoại không hợp lệ'
  }),
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
  address: z.string().optional()
});

const PersonalInfoForm = ({ profile, onSubmit: onSubmitForm, loading }) => {
  const [submitError, setSubmitError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset
  } = useForm({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: {
      name: '',
      phone: '',
      dateOfBirth: '',
      gender: '',
      address: ''
    }
  });

  useEffect(() => {
    if (profile) {
      reset({
        name: profile.name || '',
        phone: profile.phone || '',
        dateOfBirth: profile.dateOfBirth || '',
        gender: profile.gender || '',
        address: profile.address || ''
      });
    }
  }, [profile, reset]);

  const onSubmit = async (data) => {
    setSubmitError('');
    
    try {
      const result = await onSubmitForm(data);
      if (result.success) {
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
      setSubmitError('Đã xảy ra lỗi khi cập nhật thông tin');
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-10 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Thông tin cá nhân</h2>
      
      {submitError && (
        <div className="mb-4 bg-red-50 border border-red-300 text-red-800 px-4 py-3 rounded-md text-sm">
          {submitError}
        </div>
      )}
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            {...register('name')}
            type="text"
            label="Họ và tên *"
            placeholder="Nhập họ và tên"
            error={errors.name?.message}
            disabled={isSubmitting}
          />
          
          <Input
            {...register('phone')}
            type="tel"
            label="Số điện thoại"
            placeholder="Nhập số điện thoại"
            error={errors.phone?.message}
            disabled={isSubmitting}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ngày sinh
            </label>
            <input
              {...register('dateOfBirth')}
              type="date"
              disabled={isSubmitting}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Giới tính
            </label>
            <select
              {...register('gender')}
              disabled={isSubmitting}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Chọn giới tính</option>
              <option value="male">Nam</option>
              <option value="female">Nữ</option>
              <option value="other">Khác</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Địa chỉ
          </label>
          <textarea
            {...register('address')}
            rows={3}
            placeholder="Nhập địa chỉ của bạn"
            disabled={isSubmitting}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="flex justify-end">
          <Button
            type="submit"
            loading={isSubmitting}
            className="px-8"
          >
            Lưu thay đổi
          </Button>
        </div>
      </form>
    </div>
  );
};

export default PersonalInfoForm;