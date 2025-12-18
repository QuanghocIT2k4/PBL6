import React from 'react';
import { getShipmentTimeline, formatExpectedDeliveryDate } from '../../services/b2c/shipmentService';

/**
 * ShipmentTimeline Component
 * Hiển thị timeline trạng thái vận đơn
 * Style: Modern timeline với progress bar
 */
const ShipmentTimeline = ({ shipment }) => {
  if (!shipment) {
    return (
      <div className="text-center py-8 text-gray-500">
        Chưa có thông tin vận đơn
      </div>
    );
  }

  const timeline = getShipmentTimeline(shipment);

  // Chuẩn hóa history từ backend: có thể là array object hoặc array string
  const rawHistory = Array.isArray(shipment.history) ? shipment.history : [];
  const isStringHistory = rawHistory.length > 0 && typeof rawHistory[0] === 'string';

  const parsedStringHistory = isStringHistory
    ? rawHistory.map((line) => {
        // Format ví dụ: "2025-12-15T23:12:00.247955989: Đã giao hàng thành công (DELIVERED)"
        const [timestampPart, ...rest] = line.split(': ');
        const message = rest.join(': ');
        let time = timestampPart;
        let date = null;
        try {
          const d = new Date(timestampPart);
          if (!isNaN(d.getTime())) {
            date = d.toLocaleString('vi-VN');
          }
        } catch (e) {
          // ignore parse error, fallback to raw string
        }
        return {
          raw: line,
          timestamp: date,
          message,
        };
      })
    : [];

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Trạng thái vận chuyển
        </h3>
        <p className="text-sm text-gray-600">
          Dự kiến giao: {formatExpectedDeliveryDate(shipment.expectedDeliveryDate)}
        </p>
      </div>

      {/* Timeline trạng thái chính */}
      <div className="relative">
        {timeline.map((step, index) => (
          <div key={step.status} className="relative pb-8 last:pb-0">
            {/* Connector Line */}
            {index < timeline.length - 1 && (
              <div
                className={`absolute left-6 top-12 w-0.5 h-full -ml-px ${
                  step.completed ? 'bg-blue-500' : 'bg-gray-300'
                }`}
              />
            )}

            {/* Step Content */}
            <div className="relative flex items-start">
              {/* Icon Circle */}
              <div
                className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-2xl ${
                  step.completed
                    ? 'bg-blue-500 text-white'
                    : step.active
                    ? 'bg-blue-100 text-blue-600 ring-4 ring-blue-50'
                    : 'bg-gray-200 text-gray-400'
                }`}
              >
                {step.icon}
              </div>

              {/* Step Info */}
              <div className="ml-4 flex-1">
                <div className="flex items-center justify-between">
                  <h4
                    className={`text-base font-medium ${
                      step.completed || step.active ? 'text-gray-900' : 'text-gray-500'
                    }`}
                  >
                    {step.label}
                  </h4>
                  {step.active && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Hiện tại
                    </span>
                  )}
                </div>
                <p
                  className={`text-sm mt-1 ${
                    step.completed || step.active ? 'text-gray-600' : 'text-gray-400'
                  }`}
                >
                  {step.description}
                </p>

                {/* History timestamp if available */}
                {shipment.history && shipment.history.length > 0 && (
                  <div className="mt-2">
                    {shipment.history
                      .filter((h) => h.status === step.status)
                      .map((h, i) => (
                        <div key={i} className="text-xs text-gray-500">
                          {new Date(h.timestamp).toLocaleString('vi-VN')}
                          {h.note && (
                            <span className="ml-2 text-gray-400">• {h.note}</span>
                          )}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Lịch sử vận đơn chi tiết từ backend (history array) */}
      {parsedStringHistory.length > 0 && (
        <div className="mt-8">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Lịch sử vận đơn</h4>
          <div className="space-y-2 text-sm text-gray-700 max-h-60 overflow-y-auto border border-gray-100 rounded-lg p-3 bg-gray-50">
            {parsedStringHistory.map((entry, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <span className="mt-1 text-xs text-gray-400">•</span>
                <div>
                  {entry.timestamp && (
                    <p className="text-xs text-gray-500">{entry.timestamp}</p>
                  )}
                  <p className="text-sm">
                    {entry.message || entry.raw}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Additional Info */}
      {shipment.status === 'FAILED' && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start">
            <span className="text-2xl mr-3">⚠️</span>
            <div>
              <h4 className="text-sm font-medium text-red-900">Giao hàng thất bại</h4>
              <p className="text-sm text-red-700 mt-1">
                Vui lòng liên hệ với khách hàng để sắp xếp lại giao hàng
              </p>
            </div>
          </div>
        </div>
      )}

      {shipment.status === 'DELIVERED' && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start">
            <span className="text-2xl mr-3">🎉</span>
            <div>
              <h4 className="text-sm font-medium text-green-900">Giao hàng thành công</h4>
              <p className="text-sm text-green-700 mt-1">
                Đơn hàng đã được giao đến khách hàng
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShipmentTimeline;
