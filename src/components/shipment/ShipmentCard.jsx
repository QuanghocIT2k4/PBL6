import React, { useState, useEffect } from 'react';
import ShipmentTimeline from './ShipmentTimeline';
import { getShipmentByOrderId, getShipmentStatusBadge, formatAddress, getShipmentsByStoreId } from '../../services/b2c/shipmentService';
import { getShipmentCode } from '../../utils/displayCodeUtils';
import { useStoreContext } from '../../context/StoreContext';

/**
 * ShipmentCard Component
 * Hiển thị thông tin vận đơn trong order detail
 */
const ShipmentCard = ({ orderId, storeId }) => {
  const { currentStore } = useStoreContext();
  const [shipment, setShipment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  
  const effectiveStoreId = storeId || currentStore?.id;

  useEffect(() => {
    if (orderId) {
      loadShipment();
    }
  }, [orderId, effectiveStoreId]);

  const loadShipment = async () => {
    setLoading(true);
    setError(null);

    console.log('[ShipmentCard] 🔍 Bắt đầu load shipment cho orderId:', orderId, 'storeId:', effectiveStoreId);

    // ✅ Cách 1: Lấy danh sách shipment của store và filter theo orderId (ưu tiên)
    if (effectiveStoreId) {
      try {
        console.log('[ShipmentCard] 📦 Đang lấy danh sách shipment của store...');
        const storeShipmentsResult = await getShipmentsByStoreId(effectiveStoreId, { size: 100 });
        console.log('[ShipmentCard] 📦 Kết quả lấy danh sách shipment:', storeShipmentsResult);

        if (storeShipmentsResult.success && storeShipmentsResult.data) {
          const shipments = Array.isArray(storeShipmentsResult.data) 
            ? storeShipmentsResult.data 
            : (storeShipmentsResult.data.content || storeShipmentsResult.data.data || []);
          
          console.log('[ShipmentCard] 📦 Danh sách shipment:', shipments);
          console.log('[ShipmentCard] 📦 Số lượng shipment:', shipments.length);

          // Tìm shipment có order.id hoặc order._id hoặc order.$id trùng với orderId
          const foundShipment = shipments.find(shipment => {
            const orderRef = shipment.order || shipment.orderRef;
            const orderIdFromShipment = orderRef?.id || orderRef?._id || orderRef?.$id || orderRef;
            const orderIdStr = String(orderId);
            const orderIdFromShipmentStr = String(orderIdFromShipment);
            
            console.log('[ShipmentCard] 🔍 So sánh:', {
              orderId: orderIdStr,
              orderIdFromShipment: orderIdFromShipmentStr,
              match: orderIdStr === orderIdFromShipmentStr
            });

            return orderIdStr === orderIdFromShipmentStr;
          });

          if (foundShipment) {
            console.log('[ShipmentCard] ✅ TÌM THẤY SHIPMENT TỪ DANH SÁCH!', foundShipment);
            console.log('[ShipmentCard] 📦 Shipment ID:', foundShipment.id);
            console.log('[ShipmentCard] 📦 Shipment history:', foundShipment.history);
            console.log('[ShipmentCard] 📦 History type:', typeof foundShipment.history);
            console.log('[ShipmentCard] 📦 History is array?', Array.isArray(foundShipment.history));
            console.log('[ShipmentCard] 📦 History length:', foundShipment.history?.length);
            if (foundShipment.history && foundShipment.history.length > 0) {
              console.log('[ShipmentCard] 📦 First history item:', foundShipment.history[0]);
              console.log('[ShipmentCard] 📦 First history item type:', typeof foundShipment.history[0]);
            }
            setShipment(foundShipment);
            setLoading(false);
            return;
          } else {
            console.log('[ShipmentCard] ❌ Không tìm thấy shipment trong danh sách');
          }
        }
      } catch (err) {
        console.warn('[ShipmentCard] ⚠️ Lỗi khi lấy danh sách shipment:', err);
      }
    }

    // ✅ Cách 2: Fallback - thử dùng getShipmentByOrderId (có thể không hỗ trợ)
    try {
      console.log('[ShipmentCard] 🔄 Thử cách 2: getShipmentByOrderId...');
      const result = await getShipmentByOrderId(orderId);

      if (result.success) {
        console.log('[ShipmentCard] ✅ Shipment loaded successfully:', result.data);
        console.log('[ShipmentCard] 📦 Shipment ID:', result.data?.id);
        console.log('[ShipmentCard] 📦 Shipment history:', result.data?.history);
        console.log('[ShipmentCard] 📦 History type:', typeof result.data?.history);
        console.log('[ShipmentCard] 📦 History is array?', Array.isArray(result.data?.history));
        console.log('[ShipmentCard] 📦 History length:', result.data?.history?.length);
        if (result.data?.history && result.data.history.length > 0) {
          console.log('[ShipmentCard] 📦 First history item:', result.data.history[0]);
          console.log('[ShipmentCard] 📦 First history item type:', typeof result.data.history[0]);
        }
        setShipment(result.data);
      } else if (result.notFound) {
        console.log('[ShipmentCard] ℹ️ Shipment not found via getShipmentByOrderId');
        setShipment(null);
        setError(null);
      } else {
        // ✅ Kiểm tra nếu là lỗi 500 hoặc "GET method not supported" - có thể là chưa có shipment
        const errorMessage = result.error || '';
        const isMethodNotSupported = errorMessage.includes('GET') && errorMessage.includes('not supported');
        const is500Error = result.status === 500;
        
        if (isMethodNotSupported || is500Error) {
          console.log('[ShipmentCard] ℹ️ GET method not supported or 500 error, treating as notFound');
          setShipment(null);
          setError(null);
        } else {
          setError(result.error || 'Không thể tải thông tin vận đơn');
        }
      }
    } catch (err) {
      console.error('[ShipmentCard] ❌ Error loading shipment:', err);
      // ✅ Kiểm tra nếu là lỗi 500 hoặc method not supported
      const errorMessage = err.message || err.response?.data?.message || '';
      const isMethodNotSupported = errorMessage.includes('GET') && errorMessage.includes('not supported');
      const is500Error = err.response?.status === 500;
      
      if (isMethodNotSupported || is500Error) {
        console.log('[ShipmentCard] ℹ️ GET method not supported or 500 error, treating as notFound');
        setShipment(null);
        setError(null);
      } else {
        setError('Không thể tải thông tin vận đơn');
      }
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

  // ✅ Hiển thị error banner chỉ khi có lỗi thực sự (không phải notFound)
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-3 text-red-700">
          <span className="text-xl">⚠️</span>
          <div>
            <p className="text-sm font-medium">Không thể tải thông tin vận đơn</p>
            <p className="text-xs text-red-600 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // ✅ Chưa có shipment là trường hợp bình thường, hiển thị message thân thiện
  if (!shipment) {
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

  console.log('[ShipmentCard] 🎨 Rendering shipment card');
  console.log('[ShipmentCard] 🎨 Shipment object:', shipment);
  console.log('[ShipmentCard] 🎨 Shipment history:', shipment?.history);
  console.log('[ShipmentCard] 🎨 Show history:', showHistory);
  console.log('[ShipmentCard] 🎨 Has history?', shipment?.history && shipment.history.length > 0);

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
              {getShipmentCode(shipment.id)}
            </span>
          </div>

          {/* Shop Address (Địa chỉ shop - nơi gửi hàng) */}
          {shipment.shopAddress && (
            <div className="flex items-start">
              <span className="text-sm text-gray-500 w-32">Địa chỉ shop:</span>
              <span className="text-sm text-gray-900">
                {formatAddress(shipment.shopAddress)}
              </span>
            </div>
          )}

          {/* Delivery Address (Địa chỉ giao hàng) */}
          <div className="flex items-start">
            <span className="text-sm text-gray-500 w-32">Địa chỉ giao:</span>
            <span className="text-sm text-gray-900">
              {formatAddress(shipment.toAddress || shipment.address)}
            </span>
          </div>

          {/* Carrier (Shipper) */}
          {(shipment.carrier || shipment.shipperName) && (
            <div className="flex items-start">
              <span className="text-sm text-gray-500 w-32">Shipper:</span>
              <div className="flex items-center gap-2">
                {shipment.carrier?.avatar && (
                  <img 
                    src={shipment.carrier.avatar} 
                    alt={shipment.carrier.fullName || shipment.carrier.name} 
                    className="w-6 h-6 rounded-full object-cover"
                  />
                )}
                <span className="text-sm text-gray-900 font-medium">
                  {shipment.carrier?.fullName || shipment.carrier?.name || shipment.shipperName || shipment.carrier?.email || 'N/A'}
                </span>
                {shipment.carrier?.phone && (
                  <span className="text-sm text-gray-500">
                    ({shipment.carrier.phone})
                  </span>
                )}
              </div>
            </div>
          )}

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

          {/* Created At */}
          {shipment.createdAt && (
            <div className="flex items-start">
              <span className="text-sm text-gray-500 w-32">Ngày tạo:</span>
              <span className="text-sm text-gray-900">
                {new Date(shipment.createdAt).toLocaleString('vi-VN', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          )}

          {/* Updated At */}
          {shipment.updatedAt && (
            <div className="flex items-start">
              <span className="text-sm text-gray-500 w-32">Cập nhật lần cuối:</span>
              <span className="text-sm text-gray-900">
                {new Date(shipment.updatedAt).toLocaleString('vi-VN', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Timeline - Hiển thị luôn */}
      <ShipmentTimeline shipment={shipment} />
      
      {/* Toggle History Button - Đặt sau timeline */}
      {shipment.history && shipment.history.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="w-full py-2 px-4 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
          >
            {showHistory ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
                Ẩn lịch sử vận đơn
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                Xem lịch sử vận đơn ({shipment.history.length})
              </>
            )}
          </button>
        </div>
      )}
      
      {/* History Section */}
      {showHistory && shipment.history && shipment.history.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Lịch sử vận đơn</h4>
          <div className="space-y-2 text-sm text-gray-700 max-h-60 overflow-y-auto border border-gray-100 rounded-lg p-3 bg-gray-50">
            {(() => {
              // Parse history từ string format
              const rawHistory = Array.isArray(shipment.history) ? shipment.history : [];
              const isStringHistory = rawHistory.length > 0 && typeof rawHistory[0] === 'string';
              
              const parsedHistory = isStringHistory
                ? rawHistory.map((line) => {
                    // Format: "2025-12-16T21:24:01.151920443: Tạo đơn vận chuyển (READY_TO_PICK)"
                    const match = line.match(/^(.+?):\s(.+)$/);
                    if (match) {
                      const timestampPart = match[1];
                      let message = match[2];
                      // Loại bỏ các status code tiếng Anh trong ngoặc đơn như (READY_TO_PICK), (SHIPPING), (DELIVERED), etc.
                      message = message.replace(/\s*\([A-Z_]+\)\s*$/g, '').trim();
                      let date = null;
                      try {
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
                        console.warn('[ShipmentCard] Error parsing timestamp:', timestampPart, e);
                      }
                      return {
                        raw: line,
                        timestamp: date || timestampPart,
                        message,
                      };
                    }
                    // Nếu không match format, vẫn loại bỏ status code nếu có
                    let cleanMessage = line.replace(/\s*\([A-Z_]+\)\s*$/g, '').trim();
                    return {
                      raw: line,
                      timestamp: null,
                      message: cleanMessage || line,
                    };
                  })
                : rawHistory.map((h) => ({
                    timestamp: h.timestamp ? new Date(h.timestamp).toLocaleString('vi-VN') : null,
                    message: h.message || h.note || h.status || JSON.stringify(h),
                  }));
              
              return parsedHistory.map((entry, idx) => (
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
              ));
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

export default ShipmentCard;
