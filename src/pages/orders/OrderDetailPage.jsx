import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import useSWR from 'swr';
import MainLayout from '../../layouts/MainLayout';
import ReviewForm from '../../components/reviews/ReviewForm';
import { getOrderById, cancelOrder, canCancelOrder, canReviewOrder, getOrderStatusBadge, getPaymentMethodLabel } from '../../services/buyer/orderService';
import { useToast } from '../../context/ToastContext';
import { confirmCancelOrder } from '../../utils/sweetalert';

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
 * OrderDetailPage Component - SHOPEE/MALL STYLE
 * Clean, simple, professional
 */
const OrderDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // Fetch order details
  const { data: orderData, error, mutate } = useSWR(
    id ? ['order-detail', id] : null,
    () => getOrderById(id),
    {
      revalidateOnFocus: false,
    }
  );

  const order = orderData?.success ? orderData.data : null;

  // Handle cancel
  const handleCancel = async () => {
    const confirmed = await confirmCancelOrder(`#${order.orderNumber || order.id.slice(-8)}`);
    if (!confirmed) return;

    const result = await cancelOrder(order.id);
    if (result.success) {
      success(result.message);
      mutate();
    } else {
      showError(result.error);
    }
  };

  // Handle review
  const handleReviewClick = (item) => {
    setSelectedItem(item);
    setShowReviewModal(true);
  };

  const handleReviewSuccess = () => {
    setShowReviewModal(false);
    setSelectedItem(null);
    success('Đánh giá của bạn đã được gửi thành công!');
    mutate();
  };

  // Loading state
  if (!orderData && !error) {
    return (
      <MainLayout>
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Error state
  if (error || !order) {
    return (
      <MainLayout>
        <div className="max-w-5xl mx-auto px-4 py-16 text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Không tìm thấy đơn hàng</h2>
          <p className="text-gray-600 mb-6">Đơn hàng này không tồn tại hoặc đã bị xóa.</p>
          <button
            onClick={() => navigate('/orders')}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            ← Quay lại danh sách
          </button>
        </div>
      </MainLayout>
    );
  }

  const {
    orderNumber,
    status,
    totalAmount,
    totalPrice,
    finalTotal,
    createdAt,
    items: itemsFromOrder,
    orderItems: orderItemsFromOrder,
    shippingAddress,
    paymentMethod,
    storeName,
    store,
    shop,
    storeId,
  } = order;
  
  // Handle different store name formats from backend
  const getStoreName = () => {
    if (storeName) return storeName;
    if (store?.storeName) return store.storeName;
    if (store?.name) return store.name;
    if (shop?.name) return shop.name;
    if (shop?.storeName) return shop.storeName;
    return 'Cửa hàng';
  };

  const displayStoreName = getStoreName();
  
  // Handle both 'items' and 'orderItems' field names
  const items = itemsFromOrder || orderItemsFromOrder || [];

  // Parse total
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

  return (
    <MainLayout>
      <div className="bg-gray-50 min-h-screen py-6">
        <div className="max-w-5xl mx-auto px-4">
          {/* Breadcrumb */}
          <div className="mb-4">
            <button
              onClick={() => navigate('/orders')}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/>
              </svg>
              Quay lại
            </button>
          </div>

          {/* Header */}
          <div className="bg-white border border-gray-200 rounded-lg p-5 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">
                  Đơn hàng #{orderNumber || id.slice(-8)}
                </h1>
                <p className="text-sm text-gray-600">
                  Ngày đặt: {formatDate(createdAt)}
                </p>
              </div>
              <span className={`px-4 py-2 rounded-md text-sm font-semibold ${statusBadge.bg} ${statusBadge.text}`}>
                {statusBadge.icon} {statusBadge.label}
              </span>
            </div>
          </div>

          {/* Products - MALL STYLE */}
          <div className="bg-white border border-gray-200 rounded-lg mb-4">
            {/* Store Header */}
            <div className="border-b border-gray-200 px-5 py-3 flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
                  </svg>
                </div>
                <span className="font-bold text-gray-900">{displayStoreName}</span>
              </div>
              <button className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                </svg>
                Chat
              </button>
              <button className="text-sm text-gray-600 hover:text-gray-900 font-medium">
                Xem Shop
              </button>
              <div className="ml-auto flex items-center gap-2 text-sm text-green-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                </svg>
                Giao hàng thành công
              </div>
            </div>

            {/* Products List */}
            <div className="divide-y divide-gray-100">
              {items.map((item, index) => (
                <div key={index} className="p-5">
                  <div className="flex items-start gap-4">
                    {/* Image */}
                    <div className="w-20 h-20 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                      {item.image || item.productImage ? (
                        <img
                          src={item.image || item.productImage}
                          alt={item.productName || item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-900 mb-2">
                        {item.productName || item.name}
                      </h3>
                      {item.variantName && (
                        <p className="text-xs text-gray-600 mb-1">
                          Phân loại hàng: {item.variantName}
                        </p>
                      )}
                      <p className="text-xs text-gray-600">x{item.quantity}</p>
                    </div>

                    {/* Price */}
                    <div className="text-right">
                      <p className="text-lg font-semibold text-gray-900">
                        {formatCurrency(item.price * item.quantity)}
                      </p>
                    </div>
                  </div>

                  {/* Review Section for DELIVERED orders */}
                  {canReview && (
                    <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                      <div className="text-sm text-blue-600">
                        <p className="font-medium">Đánh giá sản phẩm</p>
                        <p className="text-xs">Chia sẻ trải nghiệm của bạn về sản phẩm này</p>
                      </div>
                      <button
                        onClick={() => handleReviewClick(item)}
                        className="px-6 py-2 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
                      >
                        ✍️ Đánh Giá
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="border-t border-gray-200 px-5 py-4 bg-gray-50">
              <div className="flex items-center justify-end gap-2 text-lg">
                <span className="text-gray-700">Thành tiền:</span>
                <span className="text-2xl font-bold text-red-600">
                  {formatCurrency(calculatedTotal)}
                </span>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          {shippingAddress && (
            <div className="bg-white border border-gray-200 rounded-lg p-5 mb-4">
              <h2 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
                Địa chỉ nhận hàng
              </h2>
              <div className="text-sm text-gray-700 space-y-1">
                <p className="font-semibold">{shippingAddress.recipientName || 'N/A'}</p>
                <p>{shippingAddress.phone || 'N/A'}</p>
                <p>
                  {[shippingAddress.street, shippingAddress.ward, shippingAddress.district, shippingAddress.province]
                    .filter(Boolean)
                    .join(', ')}
                </p>
              </div>
            </div>
          )}

          {/* Payment Info */}
          <div className="bg-white border border-gray-200 rounded-lg p-5 mb-4">
            <h2 className="font-bold text-gray-900 mb-3">Phương thức thanh toán</h2>
            <p className="text-sm text-gray-700">{getPaymentMethodLabel(paymentMethod)}</p>
          </div>

          {/* Order Timeline - Process Tracking */}
          <div className="bg-white border border-gray-200 rounded-lg p-5 mb-4">
            <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/>
              </svg>
              Tiến trình đơn hàng
            </h2>
            
            <div className="relative">
              {/* Timeline Line */}
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-400 via-purple-400 to-green-400"></div>
              
              <div className="space-y-6 relative">
                {/* Step 1: Đặt hàng - Always shown */}
                <div className="flex items-start gap-4 relative z-10">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg ring-4 ring-blue-100">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1 pt-1">
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-bold text-blue-900 text-base">Đơn hàng đã được đặt</h3>
                        <span className="text-xs font-semibold text-blue-700 bg-blue-200 px-2 py-1 rounded-full">Hoàn tất</span>
                      </div>
                      <p className="text-sm text-blue-800">Đơn hàng của bạn đã được tạo thành công</p>
                      <p className="text-xs text-blue-600 mt-1">{formatDate(createdAt)}</p>
                    </div>
                  </div>
                </div>

                {/* Step 2: Xác nhận - If confirmed */}
                {(status === 'CONFIRMED' || status === 'SHIPPING' || status === 'DELIVERED' || order.confirmedAt) && (
                  <div className="flex items-start gap-4 relative z-10">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg ring-4 ring-green-100">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1 pt-1">
                      <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-bold text-green-900 text-base">Đơn hàng đã được xác nhận</h3>
                          <span className="text-xs font-semibold text-green-700 bg-green-200 px-2 py-1 rounded-full">Hoàn tất</span>
                        </div>
                        <p className="text-sm text-green-800">Cửa hàng đã xác nhận đơn hàng của bạn</p>
                        {order.confirmedAt && (
                          <p className="text-xs text-green-600 mt-1">{formatDate(order.confirmedAt)}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3: Đang giao - If shipping */}
                {(status === 'SHIPPING' || status === 'DELIVERED' || order.shippedAt) && (
                  <div className="flex items-start gap-4 relative z-10">
                    <div className="flex-shrink-0">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg ring-4 ${
                        status === 'SHIPPING' 
                          ? 'bg-gradient-to-br from-purple-500 to-purple-600 ring-purple-100 animate-pulse' 
                          : 'bg-gradient-to-br from-purple-500 to-purple-600 ring-purple-100'
                      }`}>
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/>
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1 pt-1">
                      <div className={`rounded-lg p-4 border ${
                        status === 'SHIPPING'
                          ? 'bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200'
                          : 'bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200'
                      }`}>
                        <div className="flex items-center justify-between mb-1">
                          <h3 className={`font-bold text-base ${
                            status === 'SHIPPING' ? 'text-purple-900' : 'text-purple-900'
                          }`}>
                            {status === 'SHIPPING' ? '🚚 Đang giao hàng' : 'Đơn hàng đã được giao'}
                          </h3>
                          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                            status === 'SHIPPING'
                              ? 'text-purple-700 bg-purple-200 animate-pulse'
                              : 'text-purple-700 bg-purple-200'
                          }`}>
                            {status === 'SHIPPING' ? 'Đang xử lý' : 'Hoàn tất'}
                          </span>
                        </div>
                        <p className={`text-sm ${
                          status === 'SHIPPING' ? 'text-purple-800' : 'text-purple-800'
                        }`}>
                          {status === 'SHIPPING' 
                            ? 'Đơn hàng đang trên đường đến bạn' 
                            : 'Đơn hàng đã được giao cho đơn vị vận chuyển'}
                        </p>
                        {order.shippedAt && (
                          <p className="text-xs text-purple-600 mt-1">{formatDate(order.shippedAt)}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 4: Đã giao - If delivered */}
                {(status === 'DELIVERED' || order.deliveredAt) && (
                  <div className="flex items-start gap-4 relative z-10">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg ring-4 ring-emerald-100">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1 pt-1">
                      <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-lg p-4 border border-emerald-200">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-bold text-emerald-900 text-base">🎉 Đã giao hàng thành công</h3>
                          <span className="text-xs font-semibold text-emerald-700 bg-emerald-200 px-2 py-1 rounded-full">Hoàn tất</span>
                        </div>
                        <p className="text-sm text-emerald-800">Đơn hàng đã được giao đến bạn thành công</p>
                        {order.deliveredAt && (
                          <p className="text-xs text-emerald-600 mt-1">{formatDate(order.deliveredAt)}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 5: Đã hủy - If cancelled */}
                {status === 'CANCELLED' && (
                  <div className="flex items-start gap-4 relative z-10">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg ring-4 ring-red-100">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1 pt-1">
                      <div className="bg-gradient-to-r from-red-50 to-red-100 rounded-lg p-4 border border-red-200">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-bold text-red-900 text-base">Đơn hàng đã bị hủy</h3>
                          <span className="text-xs font-semibold text-red-700 bg-red-200 px-2 py-1 rounded-full">Đã hủy</span>
                        </div>
                        <p className="text-sm text-red-800">Đơn hàng đã được hủy</p>
                        {order.cancelledAt && (
                          <p className="text-xs text-red-600 mt-1">{formatDate(order.cancelledAt)}</p>
                        )}
                        {order.cancelReason && (
                          <p className="text-xs text-red-700 mt-2 font-medium">Lý do: {order.cancelReason}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Pending steps - Show as gray if not reached */}
                {status === 'PENDING' && (
                  <div className="flex items-start gap-4 relative z-10 opacity-50">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center">
                        <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1 pt-1">
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <h3 className="font-medium text-gray-500 text-base">Chờ cửa hàng xác nhận</h3>
                        <p className="text-sm text-gray-400 mt-1">Đơn hàng đang chờ cửa hàng xác nhận</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          {canCancel && (
            <div className="flex justify-end">
              <button
                onClick={handleCancel}
                className="px-6 py-2 border border-red-500 text-red-500 rounded-md font-semibold hover:bg-red-50 transition-colors"
              >
                Hủy đơn hàng
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Review Modal */}
      {showReviewModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Đánh giá sản phẩm</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedItem.productName || selectedItem.name}
                </p>
              </div>
              <button
                onClick={() => setShowReviewModal(false)}
                className="text-gray-400 hover:text-gray-600"
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
    </MainLayout>
  );
};

export default OrderDetailPage;
