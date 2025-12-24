import React from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import useSWR from 'swr';
import { getOrderCode } from '../../utils/displayCodeUtils';
import { getAdminOrderById } from '../../services/admin/adminOrderService';
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
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch (e) {
    return 'N/A';
  }
};

/**
 * AdminOrderDetailPage - Trang chi tiết đơn hàng dành cho Admin
 * Luôn dùng admin API để lấy thông tin đơn hàng
 */
const AdminOrderDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { error: showError } = useToast();

  // ✅ Luôn dùng admin API
  const { data: orderData, error, isLoading } = useSWR(
    id ? ['admin-order-detail', id] : null,
    () => getAdminOrderById(id),
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
    }
  );

  const order = orderData?.success ? orderData.data : null;

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !order) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center">
        <div className="text-red-500 text-5xl mb-4">⚠️</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Không tìm thấy đơn hàng</h2>
        <p className="text-gray-600 mb-6">
          Đơn hàng này không tồn tại hoặc đã bị xóa.
          {orderData?.error && (
            <span className="block mt-2 text-sm text-red-500">
              Lỗi: {orderData.error}
            </span>
          )}
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => navigate('/admin-dashboard/refunds')}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            ← Quay lại Hoàn tiền
          </button>
          <button
            onClick={() => navigate('/admin-dashboard/disputes')}
            className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            ← Quay lại Khiếu nại
          </button>
        </div>
      </div>
    );
  }

  const {
    orderNumber,
    status,
    totalAmount: rawTotalAmount,
    totalPrice: rawTotalPrice,
    finalTotal: rawFinalTotal,
    createdAt,
    items: itemsFromOrder,
    orderItems: orderItemsFromOrder,
    shippingAddress,
    paymentMethod,
    storeName,
    store,
    shop,
    storeId,
    productPrice,
    storeDiscountAmount,
    platformCommission,
    platformDiscountAmount,
    shippingFee,
  } = order;

  // ✅ Parse các giá trị total nếu là string
  const totalAmount = typeof rawTotalAmount === 'string' ? parseFloat(rawTotalAmount) : (rawTotalAmount ?? 0);
  const totalPrice = typeof rawTotalPrice === 'string' ? parseFloat(rawTotalPrice) : (rawTotalPrice ?? 0);
  const finalTotal = typeof rawFinalTotal === 'string' ? parseFloat(rawFinalTotal) : (rawFinalTotal ?? 0);

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
  const orderCode = getOrderCode(orderNumber || id);

  // Get order items
  const items = itemsFromOrder || orderItemsFromOrder || [];

  // Get status badge
  const getStatusBadge = (status) => {
    const badges = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      CONFIRMED: 'bg-blue-100 text-blue-800',
      PROCESSING: 'bg-purple-100 text-purple-800',
      SHIPPING: 'bg-indigo-100 text-indigo-800',
      DELIVERED: 'bg-green-100 text-green-800',
      COMPLETED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800',
      RETURNED: 'bg-orange-100 text-orange-800',
      REFUNDED: 'bg-gray-100 text-gray-800',
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status) => {
    const labels = {
      PENDING: 'Chờ xác nhận',
      CONFIRMED: 'Đã xác nhận',
      PROCESSING: 'Đang xử lý',
      SHIPPING: 'Đang giao hàng',
      DELIVERED: 'Đã giao hàng',
      COMPLETED: 'Đã hoàn thành',
      CANCELLED: 'Đã hủy',
      RETURNED: 'Đã trả hàng',
      REFUNDED: 'Đã hoàn tiền',
    };
    return labels[status] || status;
  };

  const getPaymentMethodLabel = (method) => {
    const labels = {
      COD: 'Thanh toán khi nhận hàng (COD)',
      BANK_TRANSFER: 'Chuyển khoản ngân hàng',
      WALLET: 'Ví điện tử',
      CREDIT_CARD: 'Thẻ tín dụng',
    };
    return labels[method] || method || 'N/A';
  };

  // Ưu tiên các nguồn ảnh có thể có trên item
  const getItemImage = (item) => {
    if (!item) return null;
    return (
      item.colorImage ||
      item.imageUrl ||
      item.productImage ||
      item.image ||
      (item.product && (item.product.primaryImage || item.product.imageUrl || item.product.images?.[0])) ||
      (item.variant && (item.variant.primaryImage || item.variant.imageUrl || item.variant.images?.[0])) ||
      null
    );
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900">Chi tiết đơn hàng</h1>
            <button
              onClick={() => {
                // Nếu có history, dùng back; nếu không thì rơi về danh sách đơn
                if (location.key && location.key !== 'default') {
                  navigate(-1);
                } else if (location.state?.from) {
                  navigate(location.state.from);
                } else {
                  navigate('/admin-dashboard/orders');
                }
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              ← Quay lại
            </button>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-lg font-semibold text-gray-700">Mã đơn hàng: {orderCode}</span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(status)}`}>
              {getStatusLabel(status)}
            </span>
          </div>
        </div>

        {/* Order Info Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Thông tin đơn hàng</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Ngày đặt hàng</p>
                <p className="font-semibold text-gray-900">{formatDate(createdAt)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Cửa hàng</p>
                <p className="font-semibold text-gray-900">{displayStoreName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Phương thức thanh toán</p>
                <p className="font-semibold text-gray-900">{getPaymentMethodLabel(paymentMethod)}</p>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              {shippingAddress && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Địa chỉ giao hàng</p>
                  <p className="font-semibold text-gray-900">
                    {shippingAddress.fullName || ''} - {shippingAddress.phone || ''}
                    <br />
                    {shippingAddress.address || ''}, {shippingAddress.ward || ''}, {shippingAddress.district || ''}, {shippingAddress.province || ''}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Order Items */}
        {items.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Sản phẩm</h2>
            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={index} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
                  {getItemImage(item) && (
                    <img
                      src={getItemImage(item)}
                      alt={item.productName || item.name}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                  )}
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{item.productName || item.name}</p>
                    {item.variantName && (
                      <p className="text-sm text-gray-600">Biến thể: {item.variantName}</p>
                    )}
                    <p className="text-sm text-gray-600">Số lượng: {item.quantity || 1}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      {formatCurrency(item.price || item.unitPrice || 0)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Order Summary */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Tổng kết đơn hàng</h2>
          
          <div className="space-y-3">
            {productPrice !== undefined && (
              <div className="flex justify-between">
                <span className="text-gray-600">Giá sản phẩm:</span>
                <span className="font-semibold">{formatCurrency(productPrice)}</span>
              </div>
            )}
            {storeDiscountAmount !== undefined && storeDiscountAmount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Giảm giá cửa hàng:</span>
                <span>-{formatCurrency(storeDiscountAmount)}</span>
              </div>
            )}
            {platformDiscountAmount !== undefined && platformDiscountAmount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Giảm giá sàn:</span>
                <span>-{formatCurrency(platformDiscountAmount)}</span>
              </div>
            )}
            {platformCommission !== undefined && platformCommission > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>Hoa hồng sàn:</span>
                <span>{formatCurrency(platformCommission)}</span>
              </div>
            )}
            {shippingFee !== undefined && shippingFee > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Phí vận chuyển:</span>
                <span className="font-semibold">{formatCurrency(shippingFee)}</span>
              </div>
            )}
            <div className="border-t border-gray-200 pt-3 mt-3">
              <div className="flex justify-between text-lg font-bold text-gray-900">
                <span>Tổng cộng:</span>
                <span className="text-blue-600">
                  {formatCurrency(finalTotal || totalAmount || totalPrice)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
};

export default AdminOrderDetailPage;


                
