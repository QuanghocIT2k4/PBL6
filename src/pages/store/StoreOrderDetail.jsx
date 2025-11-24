import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useSWR from 'swr';
import StoreLayout from '../../layouts/StoreLayout';
import StoreStatusGuard from '../../components/store/StoreStatusGuard';
import StorePageHeader from '../../components/store/StorePageHeader';
import { useStoreContext } from '../../context/StoreContext';
import { useToast } from '../../context/ToastContext';
import { getOrderCode } from '../../utils/displayCodeUtils';
import ConfirmModal from '../../components/common/ConfirmModal';
import ShipmentCard from '../../components/shipment/ShipmentCard';
import { 
  getStoreOrderById, 
  confirmOrder, 
  shipOrder, 
  deliverOrder, 
  cancelStoreOrder 
} from '../../services/b2c/b2cOrderService';

const StoreOrderDetail = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { currentStore } = useStoreContext();
  const { success: showSuccess, error: showError } = useToast();
  const [actionLoading, setActionLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showShipModal, setShowShipModal] = useState(false);
  const [showDeliverModal, setShowDeliverModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  // ✅ Fetch order detail từ API
  const { data: orderData, error, isLoading, mutate } = useSWR(
    orderId && currentStore?.id ? ['store-order-detail', orderId, currentStore.id] : null,
    () => getStoreOrderById(orderId, currentStore.id),
    { revalidateOnFocus: false }
  );

  const order = orderData?.success ? orderData.data : null;

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const badges = {
      PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Chờ xác nhận', icon: '⏳' },
      CONFIRMED: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Đã xác nhận', icon: '✅' },
      SHIPPING: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Đang giao', icon: '🚚' },
      DELIVERED: { bg: 'bg-green-100', text: 'text-green-800', label: 'Đã giao', icon: '📦' },
      CANCELLED: { bg: 'bg-red-100', text: 'text-red-800', label: 'Đã hủy', icon: '❌' }
    };
    return badges[status] || { bg: 'bg-gray-100', text: 'text-gray-800', label: status, icon: '📋' };
  };

  const handleConfirmClick = () => {
    if (!currentStore?.id) {
      showError('Không tìm thấy thông tin cửa hàng');
      return;
    }
    setPendingAction('confirm');
    setShowConfirmModal(true);
  };

  const handleConfirm = async () => {
    if (!currentStore?.id) return;
    
    setActionLoading(true);
    try {
      const result = await confirmOrder(orderId, currentStore.id);
      
      if (result.success) {
        showSuccess(result.message);
        // ✅ Force refresh order detail
        await mutate(undefined, { revalidate: true });
      } else {
        showError(result.error);
      }
    } catch (err) {
      console.error('Error confirming order:', err);
      showError('Có lỗi xảy ra khi xác nhận đơn hàng');
    } finally {
      setActionLoading(false);
    }
  };

  const handleShipClick = () => {
    if (!currentStore?.id) {
      showError('Không tìm thấy thông tin cửa hàng');
      return;
    }
    setPendingAction('ship');
    setShowShipModal(true);
  };

  const handleShip = async () => {
    if (!currentStore?.id) return;
    
    setActionLoading(true);
    try {
      const result = await shipOrder(orderId, currentStore.id);
      
      if (result.success) {
        showSuccess(result.message);
        // ✅ Force refresh order detail
        await mutate(undefined, { revalidate: true });
      } else {
        showError(result.error);
      }
    } catch (err) {
      console.error('Error shipping order:', err);
      showError('Có lỗi xảy ra khi cập nhật trạng thái giao hàng');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeliverClick = () => {
    if (!currentStore?.id) {
      showError('Không tìm thấy thông tin cửa hàng');
      return;
    }
    setPendingAction('deliver');
    setShowDeliverModal(true);
  };

  const handleDeliver = async () => {
    if (!currentStore?.id) return;
    
    setActionLoading(true);
    try {
      const result = await deliverOrder(orderId, currentStore.id);
      
      if (result.success) {
        showSuccess(result.message);
        // ✅ Force refresh order detail
        await mutate(undefined, { revalidate: true });
      } else {
        showError(result.error);
      }
    } catch (err) {
      console.error('Error delivering order:', err);
      showError('Có lỗi xảy ra khi hoàn tất giao hàng');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    const reason = window.prompt('Lý do hủy đơn hàng:');
    if (!reason) return;
    
    setActionLoading(true);
    try {
      const result = await cancelStoreOrder(orderId, reason);
      
      if (result.success) {
        showSuccess(result.message);
        // ✅ Force refresh order detail
        await mutate(undefined, { revalidate: true });
      } else {
        showError(result.error);
      }
    } catch (err) {
      console.error('Error cancelling order:', err);
      showError('Có lỗi xảy ra khi hủy đơn hàng');
    } finally {
      setActionLoading(false);
    }
  };

  if (isLoading) {
    return (
      <StoreStatusGuard currentStore={currentStore} pageName="chi tiết đơn hàng">
        <StoreLayout>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </StoreLayout>
      </StoreStatusGuard>
    );
  }

  if (error || !order) {
    return (
      <StoreStatusGuard currentStore={currentStore} pageName="chi tiết đơn hàng">
        <StoreLayout>
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">Không thể tải chi tiết đơn hàng</p>
            <button
              onClick={() => navigate('/store-dashboard/orders')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Quay lại danh sách
            </button>
          </div>
        </StoreLayout>
      </StoreStatusGuard>
    );
  }

  const badge = getStatusBadge(order.status);
  
  // Calculate order breakdown
  const items = order.items || order.orderItems || [];
  const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.price || 0) * parseInt(item.quantity || 0)), 0);
  const shippingFee = parseFloat(order.shippingFee || order.shippingCost || 0);
  const discount = parseFloat(order.discount || order.discountAmount || 0);
  const totalPrice = parseFloat(order.totalPrice) || order.totalAmount || order.finalTotal || (subtotal + shippingFee - discount);

  return (
    <StoreStatusGuard currentStore={currentStore} pageName="chi tiết đơn hàng">
      <StoreLayout>
        <div className="space-y-6">
          {/* Header với gradient giống Dashboard */}
          <div className="bg-gradient-to-r from-cyan-200 to-blue-200 rounded-2xl p-6">
            <div className="relative bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-2xl flex items-center justify-center shadow-lg">
                    <span className="text-4xl">📦</span>
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold mb-2">
                      <span className="text-cyan-600">Đơn hàng</span> <span className="text-blue-600">{getOrderCode(order.id)}</span>
                    </h1>
                    <p className="text-gray-600 text-lg">Đặt lúc: {formatDate(order.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {/* Store Status Badge */}
                  {currentStore?.status && (
                    <div className={`px-6 py-3 rounded-xl font-semibold text-sm flex items-center gap-2 ${
                      currentStore.status === 'APPROVED' ? 'bg-green-100 text-green-800 border-2 border-green-300' :
                      currentStore.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800 border-2 border-yellow-300' :
                      'bg-red-100 text-red-800 border-2 border-red-300'
                    }`}>
                      <span className="text-lg">
                        {currentStore.status === 'APPROVED' ? '✅' :
                         currentStore.status === 'PENDING' ? '⏳' : '❌'}
                      </span>
                      <span>
                        {currentStore.status === 'APPROVED' ? 'Đã duyệt' :
                         currentStore.status === 'PENDING' ? 'Chờ duyệt' : 'Đã từ chối'}
                      </span>
                    </div>
                  )}
                  
                  <button
                    onClick={() => navigate('/store-dashboard/orders')}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 font-semibold flex items-center gap-2 transition-all"
                  >
                    ← Quay lại
                  </button>
                  <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${badge.bg} ${badge.text}`}>
                    <span className="mr-2">{badge.icon}</span>
                    {badge.label}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Order Items */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Sản phẩm</h2>
                <div className="space-y-4">
                  {items.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p>Không có sản phẩm nào trong đơn hàng</p>
                    </div>
                  ) : (
                    items.map((item, index) => (
                    <div key={index} className="flex items-center gap-4 pb-4 border-b border-gray-100 last:border-b-0 last:pb-0">
                      <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        {item.image || item.productImage ? (
                          <img 
                            src={item.image || item.productImage} 
                            alt={item.productName || item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            📦
                  </div>
                        )}
                </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">
                          {item.productName || item.name}
                        </h3>
                        {item.options && Object.keys(item.options).length > 0 && (
                          <p className="text-sm text-gray-600">
                            {Object.entries(item.options).map(([key, value]) => `${key}: ${value}`).join(', ')}
                          </p>
                        )}
                        <p className="text-sm text-gray-600">
                          Số lượng: {item.quantity}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          {formatPrice(item.price * item.quantity)}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatPrice(item.price)} x {item.quantity}
                        </p>
                      </div>
                    </div>
                    ))
                  )}
              </div>

                {/* Order Summary Breakdown */}
                <div className="mt-6 pt-6 border-t border-gray-200 space-y-3">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Tạm tính:</span>
                    <span className="font-medium">{formatPrice(subtotal)}</span>
                  </div>
                  {shippingFee > 0 && (
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Phí vận chuyển:</span>
                      <span className="font-medium">{formatPrice(shippingFee)}</span>
                    </div>
                  )}
                  {discount > 0 && (
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Giảm giá:</span>
                      <span className="font-medium text-green-600">-{formatPrice(discount)}</span>
                    </div>
                  )}
                  {(order.promotionCode || order.appliedPromotion) && (
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Mã khuyến mãi:</span>
                      <span className="font-medium text-blue-600">
                        {order.promotionCode || order.appliedPromotion?.code || 'N/A'}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-lg font-bold pt-3 border-t border-gray-200">
                    <span>Tổng cộng:</span>
                    <span className="text-red-600 text-xl">{formatPrice(totalPrice)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Info */}
            <div className="space-y-6">
              {/* Customer Info */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Thông tin khách hàng</h2>
                {order.shippingAddress ? (
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-600">Họ tên:</span>
                      <p className="font-medium text-gray-900">
                        {order.shippingAddress.suggestedName || 
                         order.shippingAddress.recipientName || 
                         order.shippingAddress.fullName || 
                         order.shippingAddress.name || 
                         'N/A'}
                      </p>
                  </div>
                    <div>
                      <span className="text-gray-600">Số điện thoại:</span>
                      <p className="font-medium text-gray-900">{order.shippingAddress.phone || 'N/A'}</p>
                  </div>
                    <div>
                      <span className="text-gray-600">Địa chỉ:</span>
                      <p className="font-medium text-gray-900">
                        {[
                          order.shippingAddress.homeAddress,
                          order.shippingAddress.detail,
                          order.shippingAddress.street
                        ].find(Boolean) || ''}, {order.shippingAddress.ward || ''}, {order.shippingAddress.district || ''}, {order.shippingAddress.province || ''}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500">Không có thông tin</p>
                )}
                </div>

              {/* Payment Method */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Phương thức thanh toán</h2>
                <p className="text-gray-700 mb-2">
                  {order.paymentMethod === 'COD' ? '💵 Thanh toán khi nhận hàng (COD)' : 
                   order.paymentMethod === 'BANK_TRANSFER' ? '🏦 Chuyển khoản ngân hàng' :
                   order.paymentMethod || 'Chưa xác định'}
                </p>
                {order.paymentStatus && (
                  <p className="text-sm text-gray-600">
                    Trạng thái: <span className={`font-medium ${
                      order.paymentStatus === 'PAID' ? 'text-green-600' :
                      order.paymentStatus === 'PENDING' ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {order.paymentStatus === 'PAID' ? 'Đã thanh toán' :
                       order.paymentStatus === 'PENDING' ? 'Chờ thanh toán' :
                       'Chưa thanh toán'}
                    </span>
                  </p>
                )}
              </div>

              {/* Order Note */}
              {order.note && (
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Ghi chú đơn hàng</h2>
                  <p className="text-gray-700 text-sm bg-gray-50 p-3 rounded-lg">
                    {order.note}
                  </p>
                </div>
              )}

              {/* Order Timeline */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Lịch sử đơn hàng</h2>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Đơn hàng được tạo</p>
                      <p className="text-xs text-gray-500">{formatDate(order.createdAt)}</p>
                    </div>
                  </div>
                  {order.confirmedAt && (
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">Đã xác nhận</p>
                        <p className="text-xs text-gray-500">{formatDate(order.confirmedAt)}</p>
                      </div>
                    </div>
                  )}
                  {order.shippedAt && (
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">Đã giao hàng</p>
                        <p className="text-xs text-gray-500">{formatDate(order.shippedAt)}</p>
                      </div>
                    </div>
                  )}
                  {order.deliveredAt && (
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">Đã giao thành công</p>
                        <p className="text-xs text-gray-500">{formatDate(order.deliveredAt)}</p>
                      </div>
                    </div>
                  )}
                  {order.cancelledAt && (
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">Đã hủy</p>
                        <p className="text-xs text-gray-500">{formatDate(order.cancelledAt)}</p>
                        {order.cancelReason && (
                          <p className="text-xs text-red-600 mt-1">Lý do: {order.cancelReason}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Shipment Info - Hiển thị nếu đơn đã xác nhận */}
              {(order.status === 'CONFIRMED' || order.status === 'SHIPPING' || order.status === 'DELIVERED') && (
                <ShipmentCard orderId={order.id} />
              )}

              {/* Actions */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Thao tác</h2>
                <div className="space-y-2">
                  {order.status === 'PENDING' && (
                    <>
                      <button
                        onClick={handleConfirmClick}
                        disabled={actionLoading}
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        ✅ Xác nhận đơn hàng
                      </button>
                      <button
                        onClick={handleCancel}
                        disabled={actionLoading}
                        className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        ❌ Hủy đơn hàng
                      </button>
                    </>
                  )}
                  
                  {order.status === 'CONFIRMED' && (
                    <>
                      <button
                        onClick={handleShipClick}
                        disabled={actionLoading}
                        className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        🚚 Bắt đầu giao hàng
                      </button>
                      <button
                        onClick={handleCancel}
                        disabled={actionLoading}
                        className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        ❌ Hủy đơn hàng
                      </button>
                    </>
                  )}
                  
                  {order.status === 'SHIPPING' && (
                    <button
                      onClick={handleDeliverClick}
                      disabled={actionLoading}
                      className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      📦 Xác nhận đã giao
                    </button>
                  )}
                  
                  {(order.status === 'DELIVERED' || order.status === 'CANCELLED') && (
                    <p className="text-center text-gray-500 py-4">
                      Đơn hàng đã hoàn tất
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </StoreLayout>

      {/* Confirm Order Modal */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirm}
        title="Xác nhận đơn hàng"
        message="Xác nhận đơn hàng này?"
        confirmText="Xác nhận"
        cancelText="Hủy"
        confirmColor="blue"
        icon="✅"
      />

      {/* Ship Order Modal */}
      <ConfirmModal
        isOpen={showShipModal}
        onClose={() => setShowShipModal(false)}
        onConfirm={handleShip}
        title="Bắt đầu giao hàng"
        message="Chuyển đơn hàng sang trạng thái đang giao?"
        confirmText="Xác nhận"
        cancelText="Hủy"
        confirmColor="purple"
        icon="🚚"
      />

      {/* Deliver Order Modal */}
      <ConfirmModal
        isOpen={showDeliverModal}
        onClose={() => setShowDeliverModal(false)}
        onConfirm={handleDeliver}
        title="Xác nhận giao hàng"
        message="Xác nhận đơn hàng đã giao thành công?"
        confirmText="Xác nhận"
        cancelText="Hủy"
        confirmColor="green"
        icon="📦"
      />
    </StoreStatusGuard>
  );
};

export default StoreOrderDetail;
