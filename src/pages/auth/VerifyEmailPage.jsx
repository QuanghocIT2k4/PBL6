import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import * as authService from '../../services/common/authService';
import Button from '../../components/ui/Button';

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // 'verifying' | 'success' | 'error'
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      const code = searchParams.get('code');
      
      if (!code) {
        setStatus('error');
        setMessage('Mã xác minh không hợp lệ. Vui lòng kiểm tra lại link trong email.');
        return;
      }

      // Gọi API verify
      const result = await authService.verifyEmail(code);
      
      if (result.success) {
        setStatus('success');
        setMessage('Xác minh email thành công! Bạn có thể đăng nhập ngay bây giờ.');
        
        // Tự động chuyển sang trang login sau 3s
        setTimeout(() => {
          navigate('/auth?tab=login');
        }, 3000);
      } else {
        setStatus('error');
        setMessage(result.error || 'Xác minh thất bại. Mã có thể đã hết hạn hoặc không hợp lệ.');
      }
    };

    verifyEmail();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Xác minh email
          </h2>
        </div>

        <div className="bg-white py-8 px-4 shadow rounded-lg sm:px-10">
          {/* Loading */}
          {status === 'verifying' && (
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Đang xác minh email...</p>
            </div>
          )}

          {/* Success */}
          {status === 'success' && (
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">Xác minh thành công!</h3>
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

          {/* Error */}
          {status === 'error' && (
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">Xác minh thất bại</h3>
              <p className="mt-2 text-sm text-gray-600">{message}</p>
              <div className="mt-6 space-y-3">
                <Button
                  onClick={() => navigate('/auth?tab=register')}
                  className="w-full"
                >
                  Đăng ký lại
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate('/auth?tab=login')}
                  className="w-full"
                >
                  Quay lại đăng nhập
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;


