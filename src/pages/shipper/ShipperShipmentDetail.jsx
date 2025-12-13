import React from 'react';
import useSWR from 'swr';
import { useParams, useNavigate } from 'react-router-dom';
import ShipperLayout from '../../layouts/ShipperLayout';
import { getShipmentByOrderId } from '../../services/shipper/shipperService';
import { useToast } from '../../context/ToastContext';

const ShipperShipmentDetail = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const { data, error, isLoading } = useSWR(
    ['shipper-shipment', orderId],
    () => getShipmentByOrderId(orderId),
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
    return (
      <ShipperLayout>
        <div className="text-center py-12 text-red-600">
          <p>Không thể tải thông tin shipment</p>
          <button
            onClick={() => navigate('/shipper')}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Quay lại
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
            Chi tiết đơn hàng #{shipment.orderId || orderId}
          </h1>
        </div>

        {/* Shipment Info */}
        <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
          {/* Status */}
          <div>
            <h2 className="text-lg font-bold mb-2">Trạng thái</h2>
            <div className="px-4 py-2 bg-blue-100 text-blue-800 rounded-lg inline-block font-medium">
              {shipment.status || 'N/A'}
            </div>
          </div>

          {/* Order Info */}
          <div>
            <h2 className="text-lg font-bold mb-2">Thông tin đơn hàng</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Mã đơn hàng</p>
                <p className="font-medium">#{shipment.orderId}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Tổng tiền</p>
                <p className="font-bold text-lg text-blue-600">
                  {formatCurrency(shipment.totalPrice || shipment.order?.totalPrice)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Ngày tạo</p>
                <p>{formatDate(shipment.createdAt || shipment.order?.createdAt)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Phương thức thanh toán</p>
                <p>{shipment.order?.paymentMethod || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Shop Address */}
          {shipment.shopAddress && (
            <div>
              <h2 className="text-lg font-bold mb-2">Địa chỉ shop (nơi gửi hàng)</h2>
              <div className="bg-purple-50 rounded-lg p-4">
                <p className="text-gray-700">
                  {typeof shipment.shopAddress === 'string' 
                    ? shipment.shopAddress 
                    : (shipment.shopAddress.fullAddress || shipment.shopAddress.address || 'N/A')}
                </p>
              </div>
            </div>
          )}

          {/* Delivery Address */}
          {shipment.address && (
            <div>
              <h2 className="text-lg font-bold mb-2">Địa chỉ giao hàng</h2>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="font-medium">{shipment.address.fullName || shipment.address.name || 'N/A'}</p>
                <p className="text-gray-600">{shipment.address.phone || 'N/A'}</p>
                <p className="text-gray-600 mt-2">
                  {shipment.address.fullAddress || shipment.address.address || 'N/A'}
                </p>
              </div>
            </div>
          )}

          {/* Carrier (Shipper) Info */}
          {shipment.carrier && (
            <div>
              <h2 className="text-lg font-bold mb-2">Thông tin Shipper</h2>
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  {shipment.carrier.avatar && (
                    <img 
                      src={shipment.carrier.avatar} 
                      alt={shipment.carrier.fullName || shipment.carrier.name} 
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  )}
                  <div>
                    <p className="font-medium text-gray-900">
                      {shipment.carrier.fullName || shipment.carrier.name || 'N/A'}
                    </p>
                    <p className="text-sm text-gray-600">{shipment.carrier.email || 'N/A'}</p>
                    {shipment.carrier.phone && (
                      <p className="text-sm text-gray-600">{shipment.carrier.phone}</p>
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

