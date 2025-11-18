import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import * as authService from '../../services/common/authService';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('form'); // 'form' | 'success' | 'error'
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Token không hợp lệ. Vui lòng yêu cầu reset password lại.');
    }
  }, [token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.password) {
      newErrors.password = 'Mật khẩu là bắt buộc';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
    }
    
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setLoading(true);
    setErrors({});
    
    const result = await authService.resetPassword({
      token: token,
      password: formData.password
    });
    
    if (result.success) {
      setStatus('success');
      setMessage('Đặt lại mật khẩu thành công! Bạn có thể đăng nhập ngay bây giờ.');
      
      // Tự động chuyển sang trang login sau 3s
      setTimeout(() => {
        navigate('/auth?tab=login');
      }, 3000);
    } else {
      setStatus('error');
      setMessage(result.error || 'Đặt lại mật khẩu thất bại. Token có thể đã hết hạn.');
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Đặt lại mật khẩu
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Nhập mật khẩu mới của bạn
          </p>
        </div>

        <div className="bg-white py-8 px-4 shadow rounded-lg sm:px-10">
          {/* Success State */}
          {status === 'success' && (
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">Thành công!</h3>
              <p className="mt-2 text-sm text-gray-600">{message}</p>
              <p className="mt-4 text-xs text-gray-500">Tự động chuyển trang sau 3 giây...</p>
              <Button
                onClick={() => navigate('/auth?tab=login')}
                className="mt-6"
              >
                Đăng nhập ngay
              </Button>
            </div>
          )}

          {/* Error State */}
          {status === 'error' && (
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">Có lỗi xảy ra</h3>
              <p className="mt-2 text-sm text-gray-600">{message}</p>
              <div className="mt-6 space-y-3">
                <Button
                  onClick={() => navigate('/auth?tab=login')}
                  className="w-full"
                >
                  Quay lại đăng nhập
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.location.reload()}
                  className="w-full"
                >
                  Thử lại
                </Button>
              </div>
            </div>
          )}

          {/* Form State */}
          {status === 'form' && (
            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* Error Message */}
              {errors.general && (
                <div className="bg-red-50 border border-red-300 text-red-800 px-4 py-3 rounded-md text-sm">
                  {errors.general}
                </div>
              )}

              <Input
                name="password"
                type="password"
                label="Mật khẩu mới"
                placeholder="Nhập mật khẩu mới (ít nhất 6 ký tự)"
                value={formData.password}
                onChange={handleChange}
                error={errors.password}
                disabled={loading}
                showPasswordToggle
                required
              />

              <Input
                name="confirmPassword"
                type="password"
                label="Xác nhận mật khẩu"
                placeholder="Nhập lại mật khẩu mới"
                value={formData.confirmPassword}
                onChange={handleChange}
                error={errors.confirmPassword}
                disabled={loading}
                showPasswordToggle
                required
              />

              <Button
                type="submit"
                loading={loading}
                className="w-full"
              >
                {loading ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => navigate('/auth?tab=login')}
                  className="text-sm font-medium text-blue-600 hover:text-blue-500"
                >
                  ← Quay lại đăng nhập
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;


