import { memo, useState, useEffect } from 'react';
import useSWR from 'swr';
import ReviewForm from '../reviews/ReviewForm';
import ChatButton from '../chat/ChatButton';
import { getOrderById, getOrderStatusBadge, getPaymentMethodLabel, canCancelOrder, canReviewOrder } from '../../services/buyer/orderService';
import { useToast } from '../../context/ToastContext';

/**
 * Format currency VND
 */
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
};

/**
 * Format date
 */
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

/**
 * OrderCard Component - WITH AUTO DETAIL FETCH
 * Automatically fetches order details to get items
 */
const OrderCard = ({ order, onCancel, onRefresh }) => {
  const { success } = useToast();
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [expanded, setExpanded] = useState(false);

  // Fetch order details to get items
  const { data: detailData } = useSWR(
    expanded ? ['order-detail', order.id] : null,
    () => getOrderById(order.id),
    {
      revalidateOnFocus: false,
    }
  );

  const orderDetail = detailData?.success ? detailData.data : null;
  
  const {
    id,
    orderNumber,
    status,
    totalAmount,
    totalPrice,
    finalTotal,
    createdAt,
    shippingAddress,
    paymentMethod,
    storeName,
    store,
    shop,
  } = order;

  // Handle different store name formats from backend
  const getStoreName = () => {
    if (storeName) return storeName;
    if (store?.storeName) return store.storeName;
    if (store?.name) return store.name;
    if (shop?.name) return shop.name;
    if (shop?.storeName) return shop.storeName;
    return 'Chưa có tên shop';
  };

  const displayStoreName = getStoreName();

  // Get items from detail or fallback to empty
  const items = orderDetail?.items || orderDetail?.orderItems || [];

  // Parse total price
  const parseTotalPrice = () => {
    if (totalPrice) {
      const parsed = parseFloat(totalPrice);
      if (!isNaN(parsed)) return parsed;
    }
    if (totalAmount && !isNaN(totalAmount)) return totalAmount;
    if (finalTotal && !isNaN(finalTotal)) return finalTotal;
    return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const calculatedTotal = parseTotalPrice();
  const statusBadge = getOrderStatusBadge(status);
  const canCancel = canCancelOrder(status);
  const canReview = canReviewOrder(status);

  // Auto expand on mount to load items
  useEffect(() => {
    setExpanded(true);
  }, []);

  const handleCancelClick = () => {
    if (onCancel) {
      onCancel(order);
    }
  };

  const handleReviewClick = (item) => {
    setSelectedItem(item);
    setShowReviewModal(true);
  };

  const handleReviewSuccess = () => {
    setShowReviewModal(false);
    setSelectedItem(null);
    success('Đánh giá của bạn đã được gửi thành công!');
    if (onRefresh) {
      onRefresh();
    }
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-4 overflow-hidden hover:shadow-md transition-all">
        {/* Simple Header - No Order Number */}
        <div className="bg-white px-5 py-3 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <span>{formatDate(createdAt)}</span>
            </div>

            {/* Status Badge - Simple */}
            <div className={`px-3 py-1.5 rounded-md ${statusBadge.bg} ${statusBadge.text} font-semibold text-xs`}>
              {statusBadge.label}
            </div>
          </div>
        </div>

        {/* Store Header - Clean */}
        <div className="bg-white px-5 py-3 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
              </svg>
              <span className="font-semibold text-gray-900">{displayStoreName}</span>
            </div>
            <ChatButton
              storeId={store?.id || shop?.id}
              storeName={displayStoreName}
              className="text-sm text-blue-600 hover:underline font-medium flex items-center gap-1"
            >
              Chat
            </ChatButton>
          </div>
        </div>

        {/* Products List - Clean */}
        <div className="p-5">
          {!orderDetail ? (
            <div className="flex items-center justify-center py-6">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-sm text-gray-500">Đang tải...</span>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-gray-500">Không có sản phẩm</p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="flex items-start gap-3 pb-3 border-b border-gray-100 last:border-b-0 last:pb-0">
                  {/* Product Image - Smaller */}
                  <div className="w-20 h-20 bg-white rounded-lg overflow-hidden flex-shrink-0 border border-gray-200">
                    {item.image || item.productImage ? (
                      <img
                        src={item.image || item.productImage}
                        alt={item.productName || item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Product Info - Compact */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 text-sm mb-1 line-clamp-2">
                      {item.variantName || item.productName || item.name || 'Sản phẩm'}
                    </h3>
                    {item.variantName && item.productName && item.variantName !== item.productName && (
                      <p className="text-xs text-gray-500 mb-1">
                        {item.productName}
                      </p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-gray-600">
                      <span>x{item.quantity}</span>
                      <span className="text-orange-600 font-medium">{formatCurrency(item.price)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Order Process Timeline */}
        <div className="px-5 py-4 bg-gradient-to-r from-blue-50 to-purple-50 border-t border-gray-200">
          <h4 className="text-xs font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            </svg>
            Tiến trình đơn hàng
          </h4>
          
          <div className="flex items-center gap-2 flex-wrap">
            {/* Step 1: Đặt hàng - Always completed */}
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                </svg>
              </div>
              <span className="text-xs font-medium text-blue-700">Đặt hàng</span>
            </div>
            
            {/* Connector */}
            <div className="w-8 h-0.5 bg-blue-300"></div>
            
            {/* Step 2: Xác nhận */}
            {(status === 'CONFIRMED' || status === 'SHIPPING' || status === 'DELIVERED' || orderDetail?.confirmedAt) ? (
              <>
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                    </svg>
                  </div>
                  <span className="text-xs font-medium text-green-700">Xác nhận</span>
                </div>
                <div className="w-8 h-0.5 bg-green-300"></div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-1.5 opacity-40">
                  <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                  </div>
                  <span className="text-xs font-medium text-gray-500">Chờ xác nhận</span>
                </div>
                <div className="w-8 h-0.5 bg-gray-200"></div>
              </>
            )}
            
            {/* Step 3: Đang giao */}
            {(status === 'SHIPPING' || status === 'DELIVERED' || orderDetail?.shippedAt) ? (
              <>
                <div className="flex items-center gap-1.5">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                    status === 'SHIPPING' ? 'bg-purple-500 animate-pulse' : 'bg-purple-500'
                  }`}>
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/>
                    </svg>
                  </div>
                  <span className={`text-xs font-medium ${
                    status === 'SHIPPING' ? 'text-purple-700' : 'text-purple-700'
                  }`}>
                    {status === 'SHIPPING' ? 'Đang giao' : 'Đã giao'}
                  </span>
                </div>
                {(status === 'DELIVERED' || orderDetail?.deliveredAt) && (
                  <div className="w-8 h-0.5 bg-emerald-300"></div>
                )}
              </>
            ) : status !== 'CANCELLED' ? (
              <>
                <div className="flex items-center gap-1.5 opacity-40">
                  <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/>
                    </svg>
                  </div>
                  <span className="text-xs font-medium text-gray-500">Chờ giao</span>
                </div>
              </>
            ) : null}
            
            {/* Step 4: Đã giao */}
            {(status === 'DELIVERED' || orderDetail?.deliveredAt) && (
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                  </svg>
                </div>
                <span className="text-xs font-medium text-emerald-700">Hoàn tất</span>
              </div>
            )}
            
            {/* Step 5: Đã hủy */}
            {status === 'CANCELLED' && (
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </div>
                <span className="text-xs font-medium text-red-700">Đã hủy</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer - With Price Breakdown */}
        <div className="bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 px-5 py-4 border-t border-gray-200">
          <div className="flex items-start justify-between gap-4">
            {/* Left: Payment Method */}
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
              </svg>
              <span className="font-medium">Phương thức thanh toán: {getPaymentMethodLabel(paymentMethod)}</span>
            </div>

            {/* Right: Action Buttons */}
            <div className="flex items-center gap-2">
              {/* Review Button */}
              {canReview && (
                <button
                  onClick={() => handleReviewClick(items[0])}
                  className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white text-sm font-semibold rounded-lg hover:from-orange-600 hover:to-pink-600 transition-all shadow-md hover:shadow-lg transform hover:scale-105"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
                  </svg>
                  Đánh giá
                </button>
              )}
              
              {/* Cancel Button */}
              {canCancel && (
                <button
                  onClick={handleCancelClick}
                  className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white text-sm font-semibold rounded-lg hover:from-red-600 hover:to-pink-600 transition-all shadow-md hover:shadow-lg transform hover:scale-105"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                  Hủy đơn
                </button>
              )}
            </div>
          </div>

          {/* Price Breakdown */}
          <div className="bg-white rounded-xl p-4 mt-3 shadow-sm border border-gray-200">
            {(() => {
              const subtotal = items.reduce((sum, item) => 
                sum + (parseFloat(item.price || 0) * parseInt(item.quantity || 0)), 0
              );
              const shippingFee = parseFloat(order.shippingFee || orderDetail?.shippingFee || 30000);
              const serviceFee = parseFloat(order.serviceFee || orderDetail?.serviceFee || order.platformFee || 0);
              
              // Tìm tất cả các field có thể chứa discount
              const discount = parseFloat(order.discount || orderDetail?.discount || order.discountAmount || 0);
              const promotionDiscount = parseFloat(order.promotionDiscount || orderDetail?.promotionDiscount || 0);
              const voucherDiscount = parseFloat(order.voucherDiscount || orderDetail?.voucherDiscount || 0);
              const couponDiscount = parseFloat(order.couponDiscount || orderDetail?.couponDiscount || 0);
              
              const total = calculatedTotal;

              // Tổng tất cả giảm giá
              const totalDiscount = discount + promotionDiscount + voucherDiscount + couponDiscount;

              return (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tạm tính:</span>
                    <span className="font-medium text-gray-900">{formatCurrency(subtotal)}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Phí vận chuyển:</span>
                    <span className="font-medium text-gray-900">{formatCurrency(shippingFee)}</span>
                  </div>
                  
                  {/* Phí dịch vụ nếu có */}
                  {serviceFee > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Phí dịch vụ:</span>
                      <span className="font-medium text-gray-900">{formatCurrency(serviceFee)}</span>
                    </div>
                  )}
                  
                  {/* Hiển thị khuyến mãi nếu có */}
                  {(promotionDiscount > 0 || voucherDiscount > 0 || couponDiscount > 0) && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 flex items-center gap-1">
                        <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/>
                        </svg>
                        Khuyến mãi:
                      </span>
                      <span className="font-medium text-orange-600">
                        -{formatCurrency(promotionDiscount + voucherDiscount + couponDiscount)}
                      </span>
                    </div>
                  )}
                  
                  {/* Giảm giá khác */}
                  {discount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Giảm giá khác:</span>
                      <span className="font-medium text-green-600">-{formatCurrency(discount)}</span>
                    </div>
                  )}
                  
                  <div className="border-t-2 border-dashed border-gray-300 pt-2 mt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-base font-bold text-gray-900">Tổng tiền:</span>
                      <span className="text-2xl font-black bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent">
                        {formatCurrency(total)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Review Modal */}
      {showReviewModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-slideUp">
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 flex items-center justify-between">
              <div className="text-white">
                <h3 className="text-xl font-black">✍️ Đánh giá sản phẩm</h3>
                <p className="text-sm text-blue-100 mt-1">
                  {selectedItem.variantName || selectedItem.productName || selectedItem.name}
                </p>
              </div>
              <button
                onClick={() => setShowReviewModal(false)}
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              <ReviewForm
                productVariantId={selectedItem.productVariantId || selectedItem.id}
                orderId={order.id}
                onSuccess={handleReviewSuccess}
                onCancel={() => setShowReviewModal(false)}
              />
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </>
  );
};

OrderCard.displayName = 'OrderCard';

export default memo(OrderCard);
