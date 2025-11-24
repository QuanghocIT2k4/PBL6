import React, { useState, useEffect } from 'react';
import ShipmentTimeline from './ShipmentTimeline';
import { getShipmentByOrderId, getShipmentStatusBadge, formatAddress } from '../../services/b2c/shipmentService';

/**
 * ShipmentCard Component
 * Hiển thị thông tin vận đơn trong order detail
 */
const ShipmentCard = ({ orderId }) => {
  const [shipment, setShipment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showTimeline, setShowTimeline] = useState(false);

  useEffect(() => {
    if (orderId) {
      loadShipment();
    }
  }, [orderId]);

  const loadShipment = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await getShipmentByOrderId(orderId);

      if (result.success) {
        setShipment(result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      console.error('Error loading shipment:', err);
      setError('Không thể tải thông tin vận đơn');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error || !shipment) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-3 text-gray-500">
          <span className="text-2xl">📦</span>
          <div>
            <p className="text-sm font-medium">Chưa có thông tin vận chuyển</p>
            <p className="text-xs text-gray-400 mt-1">
              Vận đơn sẽ được tạo sau khi shop xác nhận đơn hàng
            </p>
          </div>
        </div>
      </div>
    );
  }

  const statusBadge = getShipmentStatusBadge(shipment.status);

  return (
    <div className="space-y-4">
      {/* Shipment Info Card */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <span className="text-2xl">🚚</span>
            Thông tin vận chuyển
          </h3>
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusBadge.bgColor} ${statusBadge.textColor}`}
          >
            {statusBadge.icon} {statusBadge.text}
          </span>
        </div>

        <div className="space-y-3">
          {/* Shipment ID */}
          <div className="flex items-start">
            <span className="text-sm text-gray-500 w-32">Mã vận đơn:</span>
            <span className="text-sm text-gray-900 font-medium">
              {shipment.id}
            </span>
          </div>

          {/* Address */}
          <div className="flex items-start">
            <span className="text-sm text-gray-500 w-32">Địa chỉ giao:</span>
            <span className="text-sm text-gray-900">
              {formatAddress(shipment.address)}
            </span>
          </div>

          {/* Shipping Fee */}
          <div className="flex items-start">
            <span className="text-sm text-gray-500 w-32">Phí vận chuyển:</span>
            <span className="text-sm text-gray-900 font-medium">
              {new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND',
              }).format(shipment.shippingFee || 0)}
            </span>
          </div>

          {/* Expected Delivery */}
          {shipment.expectedDeliveryDate && (
            <div className="flex items-start">
              <span className="text-sm text-gray-500 w-32">Dự kiến giao:</span>
              <span className="text-sm text-gray-900">
                {new Date(shipment.expectedDeliveryDate).toLocaleDateString('vi-VN', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>
          )}
        </div>

        {/* Toggle Timeline Button */}
        <button
          onClick={() => setShowTimeline(!showTimeline)}
          className="mt-4 w-full py-2 px-4 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
        >
          {showTimeline ? (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
              Ẩn chi tiết vận chuyển
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
              Xem chi tiết vận chuyển
            </>
          )}
        </button>
      </div>

      {/* Timeline */}
      {showTimeline && <ShipmentTimeline shipment={shipment} />}
    </div>
  );
};

export default ShipmentCard;
