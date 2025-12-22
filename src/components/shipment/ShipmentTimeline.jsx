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
  console.log('[ShipmentTimeline] 🔍 Component received shipment:', shipment);
  console.log('[ShipmentTimeline] 🔍 Shipment.history:', shipment?.history);
  console.log('[ShipmentTimeline] 🔍 Shipment.history type:', typeof shipment?.history);
  console.log('[ShipmentTimeline] 🔍 Shipment.history is array?', Array.isArray(shipment?.history));
  
  const rawHistory = Array.isArray(shipment.history) ? shipment.history : [];
  console.log('[ShipmentTimeline] 📋 Raw history:', rawHistory);
  console.log('[ShipmentTimeline] 📋 Raw history length:', rawHistory.length);
  
  const isStringHistory = rawHistory.length > 0 && typeof rawHistory[0] === 'string';
  console.log('[ShipmentTimeline] 📋 Is string history?', isStringHistory);
  if (rawHistory.length > 0) {
    console.log('[ShipmentTimeline] 📋 First item:', rawHistory[0]);
    console.log('[ShipmentTimeline] 📋 First item type:', typeof rawHistory[0]);
  }

  const parsedStringHistory = isStringHistory
    ? rawHistory.map((line) => {
        // Format ví dụ: "2025-12-16T21:24:01.151920443: Tạo đơn vận chuyển (READY_TO_PICK)"
        // Tìm vị trí dấu hai chấm đầu tiên sau timestamp (sau phần giây và nanoseconds)
        // Timestamp format: 2025-12-16T21:24:01.151920443
        // Tách bằng regex để tìm pattern: timestamp + ": " + message
        const match = line.match(/^(.+?):\s(.+)$/);
        if (match) {
          const timestampPart = match[1];
          const message = match[2];
          let date = null;
          try {
            // Thử parse timestamp (có thể có nanoseconds)
            const d = new Date(timestampPart);
            if (!isNaN(d.getTime())) {
              date = d.toLocaleString('vi-VN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              });
            }
          } catch (e) {
            console.warn('[ShipmentTimeline] Error parsing timestamp:', timestampPart, e);
          }
          return {
            raw: line,
            timestamp: date || timestampPart,
            message,
          };
        }
        // Fallback: nếu không match được, trả về toàn bộ line
        return {
          raw: line,
          timestamp: null,
          message: line,
        };
      })
    : [];
  
  console.log('[ShipmentTimeline] ✅ Parsed history:', parsedStringHistory);
  console.log('[ShipmentTimeline] ✅ Parsed history length:', parsedStringHistory.length);
  
  // Log để kiểm tra điều kiện hiển thị
  console.log('[ShipmentTimeline] 🎨 Will show history section?', parsedStringHistory.length > 0);

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

    </div>
  );
};

export default ShipmentTimeline;
