import React from 'react';
import useSWR from 'swr';
import { useParams, useNavigate } from 'react-router-dom';
import ShipperLayout from '../../layouts/ShipperLayout';
import { getShipmentByShipmentId } from '../../services/shipper/shipperService';
import { useToast } from '../../context/ToastContext';
import { getOrderCode, getShipmentCode } from '../../utils/displayCodeUtils';

const ShipperShipmentDetail = () => {
  const { shipmentId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const { data, error, isLoading } = useSWR(
    ['shipper-shipment', shipmentId],
    () => getShipmentByShipmentId(shipmentId),
    { revalidateOnFocus: true }
  );

  const shipment = data?.success ? data.data : null;

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount || 0);
  };

  // ✅ Format status thành text tiếng Việt
  const getStatusText = (status) => {
    const statusMap = {
      'READY_TO_PICK': 'Chưa được nhận',
      'PICKING_UP': 'Đang nhận hàng',
      'PICKING': 'Đang lấy hàng',
      'PICKED': 'Đã lấy hàng',
      'SHIPPING': 'Đang giao hàng',
      'DELIVERED': 'Đã giao hàng',
      'DELIVERED_FAIL': 'Giao hàng thất bại',
      'FAILED': 'Giao hàng thất bại',
      'RETURNING': 'Đang trả hàng',
      'RETURNED': 'Đã trả hàng',
    };
    return statusMap[status] || status || 'N/A';
  };

  // ✅ Format status badge color
  const getStatusBadgeColor = (status) => {
    const colorMap = {
      'READY_TO_PICK': 'bg-gray-100 text-gray-800',
      'PICKING_UP': 'bg-yellow-100 text-yellow-800',
      'PICKING': 'bg-yellow-100 text-yellow-800',
      'PICKED': 'bg-blue-100 text-blue-800',
      'SHIPPING': 'bg-blue-100 text-blue-800',
      'DELIVERED': 'bg-green-100 text-green-800',
      'DELIVERED_FAIL': 'bg-red-100 text-red-800',
      'FAILED': 'bg-red-100 text-red-800',
      'RETURNING': 'bg-orange-100 text-orange-800',
      'RETURNED': 'bg-gray-100 text-gray-800',
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return (
      <ShipperLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
        </div>
      </ShipperLayout>
    );
  }

  if (error || !shipment) {
    const errorMessage = data?.notFound 
      ? 'Không tìm thấy thông tin vận đơn cho đơn hàng này'
      : data?.error || error?.message || 'Không thể tải thông tin shipment';
    
    return (
      <ShipperLayout>
        <div className="text-center py-12">
          <div className="mb-4">
            <span className="text-6xl">😕</span>
          </div>
          <p className="text-red-600 font-medium mb-2">{errorMessage}</p>
          <button
            onClick={() => navigate('/shipper')}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            ← Quay lại Dashboard
          </button>
        </div>
      </ShipperLayout>
    );
  }

  return (
    <ShipperLayout>
      <div>
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/shipper')}
            className="mb-4 text-blue-600 hover:text-blue-700 flex items-center gap-2"
          >
            ← Quay lại
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Chi tiết đơn hàng {getOrderCode(shipment.orderId || shipment.order?.id)}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Mã vận đơn: {getShipmentCode(shipment.id)}
          </p>
        </div>

        {/* Shipment Info */}
        <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
          {/* Status */}
          <div>
            <h2 className="text-lg font-bold mb-2">Trạng thái</h2>
            <div className={`px-4 py-2 rounded-lg inline-block font-medium ${getStatusBadgeColor(shipment.status)}`}>
              {getStatusText(shipment.status)}
            </div>
          </div>

          {/* Order Info */}
          <div>
            <h2 className="text-lg font-bold mb-2">Thông tin đơn hàng</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Mã đơn hàng</p>
                <p className="font-medium">{getOrderCode(shipment.orderId || shipment.order?.id)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Tổng tiền</p>
                <p className="font-bold text-lg text-blue-600">
                  {formatCurrency(parseFloat(shipment.order?.totalPrice || shipment.totalPrice || 0))}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Phương thức thanh toán</p>
                <p>
                  {shipment.order?.paymentMethod === 'COD' ? 'Tiền mặt' : 
                   shipment.order?.paymentMethod === 'BANK_TRANSFER' ? 'Chuyển khoản' :
                   shipment.order?.paymentMethod === 'VNPAY' ? 'VNPay' :
                   shipment.order?.paymentMethod === 'MOMO' ? 'MoMo' :
                   shipment.order?.paymentMethod || 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* Shop Address */}
          {(shipment.fromAddress || shipment.shopAddress) && (
            <div>
              <h2 className="text-lg font-bold mb-2">Địa chỉ shop (nơi gửi hàng)</h2>
              <div className="bg-purple-50 rounded-lg p-4">
                {(() => {
                  const addr = shipment.fromAddress || shipment.shopAddress;
                  if (typeof addr === 'string') {
                    return <p className="text-gray-700">{addr}</p>;
                  }
                  const parts = [
                    addr.homeAddress,
                    addr.ward,
                    addr.province
                  ].filter(Boolean);
                  return (
                    <div>
                      {addr.suggestedName && (
                        <p className="font-medium text-gray-900 mb-1">{addr.suggestedName}</p>
                      )}
                      <p className="text-gray-700">
                        {parts.length > 0 ? parts.join(', ') : 'N/A'}
                      </p>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Delivery Address */}
          {(shipment.toAddress || shipment.address) && (
            <div>
              <h2 className="text-lg font-bold mb-2">Địa chỉ giao hàng</h2>
              <div className="bg-gray-50 rounded-lg p-4">
                {(() => {
                  const addr = shipment.toAddress || shipment.address;
                  if (typeof addr === 'string') {
                    return <p className="text-gray-700">{addr}</p>;
                  }
                  const parts = [
                    addr.homeAddress,
                    addr.ward,
                    addr.province
                  ].filter(Boolean);
                  return (
                    <div>
                      {addr.suggestedName && (
                        <p className="font-medium text-gray-900 mb-1">{addr.suggestedName}</p>
                      )}
                      <p className="text-gray-600">
                        {parts.length > 0 ? parts.join(', ') : 'N/A'}
                      </p>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Carrier (Shipper) Info */}
          {(shipment.carrier || shipment.shipperName) && (
            <div>
              <h2 className="text-lg font-bold mb-2">Thông tin Shipper</h2>
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  {shipment.carrier?.avatar && (
                    <img 
                      src={shipment.carrier.avatar} 
                      alt={shipment.carrier.fullName || shipment.carrier.name} 
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  )}
                  <div>
                    <p className="font-medium text-gray-900">
                      {shipment.carrier?.fullName || shipment.carrier?.name || shipment.shipperName || 'N/A'}
                    </p>
                    {shipment.carrier && (
                      <>
                        <p className="text-sm text-gray-600">{shipment.carrier.email || 'N/A'}</p>
                        {shipment.carrier.phone && (
                          <p className="text-sm text-gray-600">{shipment.carrier.phone}</p>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Order Items */}
          {shipment.order?.orderItems && shipment.order.orderItems.length > 0 && (
            <div>
              <h2 className="text-lg font-bold mb-2">Sản phẩm</h2>
              <div className="space-y-2">
                {shipment.order.orderItems.map((item, index) => (
                  <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                    {item.productVariant?.images?.[0] && (
                      <img
                        src={item.productVariant.images[0]}
                        alt={item.productVariant.name}
                        className="w-16 h-16 object-cover rounded"
                      />
                    )}
                    <div className="flex-1">
                      <p className="font-medium">{item.productVariant?.name || 'N/A'}</p>
                      <p className="text-sm text-gray-600">
                        Số lượng: {item.quantity} × {formatCurrency(item.price)}
                      </p>
                    </div>
                    <p className="font-bold">
                      {formatCurrency((item.quantity || 0) * (item.price || 0))}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {shipment.order?.note && (
            <div>
              <h2 className="text-lg font-bold mb-2">Ghi chú</h2>
              <p className="text-gray-600 bg-gray-50 rounded-lg p-4">{shipment.order.note}</p>
            </div>
          )}
        </div>
      </div>
    </ShipperLayout>
  );
};

export default ShipperShipmentDetail;

