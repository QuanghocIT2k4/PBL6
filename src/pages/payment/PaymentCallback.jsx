import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { queryPayment, parseVNPayCallback, getVNPayErrorMessage } from '../../services/buyer/paymentService';
import { useToast } from '../../hooks/useToast';
import MainLayout from '../../layouts/MainLayout';

/**
 * ================================================
 * PAYMENT CALLBACK PAGE
 * ================================================
 * Xử lý callback từ VNPay sau khi user thanh toán
 * 
 * Flow:
 * 1. User thanh toán trên VNPay
 * 2. VNPay redirect về /payment/callback?vnp_ResponseCode=00&...
 * 3. Parse params và verify với backend
 * 4. Hiển thị kết quả (success/failed)
 * 5. Redirect về trang orders
 */

const PaymentCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  
  const [status, setStatus] = useState('processing'); // processing, success, failed
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    verifyPayment();
  }, []);

  const verifyPayment = async () => {
    try {
      // 1. Parse VNPay callback params
      const vnpayResult = parseVNPayCallback(searchParams);
      
      console.log('📥 VNPay callback received:', vnpayResult);
      
      setPaymentInfo(vnpayResult);
      
      // 2. Quick check response code
      if (!vnpayResult.isSuccess) {
        // Payment failed on VNPay side
        const errorMsg = getVNPayErrorMessage(vnpayResult.responseCode);
        setErrorMessage(errorMsg);
        setStatus('failed');
        toast?.error(`Thanh toán thất bại: ${errorMsg}`);
        return;
      }
      
      // 3. Verify with backend
      console.log('🔍 Verifying payment with backend...');
      
      const result = await queryPayment(vnpayResult.queryData);
      
      if (result.success) {
        // Backend verified successfully
        setStatus('success');
        toast?.success('Thanh toán thành công!');
        
        // Redirect to orders page after 2 seconds
        setTimeout(() => {
          navigate('/orders');
        }, 2000);
      } else {
        // Backend verification failed
        setStatus('failed');
        setErrorMessage(result.error || 'Xác thực thanh toán thất bại');
        toast?.error('Xác thực thanh toán thất bại!');
      }
    } catch (error) {
      console.error('❌ Error verifying payment:', error);
      setStatus('failed');
      setErrorMessage('Đã có lỗi xảy ra khi xác thực thanh toán');
      toast?.error('Đã có lỗi xảy ra!');
    }
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full">
          
          {/* PROCESSING STATE */}
          {status === 'processing' && (
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
              <h2 className="mt-6 text-xl font-semibold text-gray-900">
                Đang xác thực thanh toán...
              </h2>
              <p className="mt-2 text-gray-600">
                Vui lòng đợi trong giây lát
              </p>
            </div>
          )}

          {/* SUCCESS STATE */}
          {status === 'success' && (
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              {/* Success Icon */}
              <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-100">
                <svg className="h-12 w-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              
              <h2 className="mt-6 text-2xl font-bold text-green-600">
                Thanh toán thành công!
              </h2>
              
              <p className="mt-2 text-gray-600">
                Đơn hàng của bạn đã được thanh toán thành công
              </p>

              {/* Payment Details */}
              {paymentInfo && (
                <div className="mt-6 bg-gray-50 rounded-lg p-4 text-left">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Mã giao dịch:</span>
                      <span className="font-semibold text-gray-900">{paymentInfo.txnRef}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Số tiền:</span>
                      <span className="font-semibold text-green-600">
                        {paymentInfo.amount.toLocaleString('vi-VN')}₫
                      </span>
                    </div>
                    {paymentInfo.bankCode && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Ngân hàng:</span>
                        <span className="font-semibold text-gray-900">{paymentInfo.bankCode}</span>
                      </div>
                    )}
                    {paymentInfo.transactionNo && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Mã GD VNPay:</span>
                        <span className="font-semibold text-gray-900">{paymentInfo.transactionNo}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <p className="mt-6 text-sm text-gray-500">
                Đang chuyển đến trang đơn hàng...
              </p>

              {/* Manual redirect button */}
              <button
                onClick={() => navigate('/orders')}
                className="mt-4 w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                Xem đơn hàng ngay
              </button>
            </div>
          )}

          {/* FAILED STATE */}
          {status === 'failed' && (
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              {/* Error Icon */}
              <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-red-100">
                <svg className="h-12 w-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              
              <h2 className="mt-6 text-2xl font-bold text-red-600">
                Thanh toán thất bại!
              </h2>
              
              <p className="mt-2 text-gray-600">
                {errorMessage || 'Đã có lỗi xảy ra trong quá trình thanh toán'}
              </p>

              {/* Payment Details */}
              {paymentInfo && (
                <div className="mt-6 bg-gray-50 rounded-lg p-4 text-left">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Mã giao dịch:</span>
                      <span className="font-semibold text-gray-900">{paymentInfo.txnRef}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Mã lỗi:</span>
                      <span className="font-semibold text-red-600">{paymentInfo.responseCode}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-6 space-y-3">
                <button
                  onClick={() => navigate('/orders')}
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Về trang đơn hàng
                </button>
                <button
                  onClick={() => navigate('/cart')}
                  className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Quay lại giỏ hàng
                </button>
              </div>

              {/* Help Text */}
              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  💡 <strong>Lưu ý:</strong> Nếu tiền đã bị trừ nhưng đơn hàng chưa được tạo, 
                  vui lòng liên hệ bộ phận hỗ trợ để được xử lý.
                </p>
              </div>
            </div>
          )}

        </div>
      </div>
    </MainLayout>
  );
};

export default PaymentCallback;
