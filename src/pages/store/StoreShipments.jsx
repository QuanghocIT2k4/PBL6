import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useSWR from 'swr';
import StoreLayout from '../../layouts/StoreLayout';
import StoreStatusGuard from '../../components/store/StoreStatusGuard';
import { useStoreContext } from '../../context/StoreContext';
import { useToast } from '../../context/ToastContext';
import {
  getShipmentsByStoreId,
  countShipmentsByStatus,
  getShipmentStatusBadge,
  formatExpectedDeliveryDate,
  getDeliveryTimeRemaining,
  formatCurrency,
  formatAddress,
} from '../../services/b2c/shipmentService';
import { getShipmentCode, getOrderCode } from '../../utils/displayCodeUtils';

/**
 * StoreShipments Page
 * Quản lý vận đơn của store
 */
const StoreShipments = () => {
  const navigate = useNavigate();
  const { currentStore, loading: storeLoading } = useStoreContext();
  const { success, error: showError } = useToast();

  const [filter, setFilter] = useState('all'); // all, PICKING_UP, SHIPPING, DELIVERED, FAILED
  const [page, setPage] = useState(0);

  // ✅ Dùng SWR để có thể invalidate từ nơi khác (sau khi confirm order)
  const { data: shipmentsData, error, isLoading, isValidating, mutate } = useSWR(
    currentStore?.id ? ['store-shipments', currentStore.id, filter, page] : null,
    () => {
      const statusFilter = filter === 'all' ? null : filter;
      console.log('📦 [StoreShipments] Fetching shipments...', { storeId: currentStore.id, filter: statusFilter, page });
      return getShipmentsByStoreId(currentStore.id, {
        page,
        size: 10,
        status: statusFilter,
      });
    },
    {
      revalidateOnFocus: true, // ✅ Refresh khi focus vào tab để thấy shipment mới
      revalidateOnReconnect: true,
      dedupingInterval: 2000, // Cache 2s để tránh request quá nhiều
      onSuccess: (data) => {
        console.log('✅ [StoreShipments] Shipments loaded:', data);
        const shipments = data?.data?.content || data?.data?.shipments || [];
        const count = shipments.length;
        console.log(`📊 [StoreShipments] Total shipments: ${count}`);
        
        // ✅ Log status của từng shipment để debug
        if (count > 0) {
          console.log('📋 [StoreShipments] Shipment statuses:');
          shipments.forEach((shipment, index) => {
            console.log(`  ${index + 1}. ID: ${shipment.id}, Status: ${shipment.status}, Order: ${shipment.order?.id}`);
          });
        }
      },
    }
  );

  const shipments = shipmentsData?.success ? (shipmentsData.data?.content || shipmentsData.data?.shipments || []) : [];
  const totalPages = shipmentsData?.data?.totalPages || 0;
  
  // ✅ Lấy stats chính xác từ API (không phụ thuộc vào filter/pagination)
  const { data: statsData } = useSWR(
    currentStore?.id ? ['store-shipments-stats', currentStore.id] : null,
    () => countShipmentsByStatus(currentStore.id),
    {
      revalidateOnFocus: true,
      dedupingInterval: 5000, // Cache 5s
    }
  );

  // ✅ Tính stats từ API hoặc fallback về tính từ shipments hiện tại
  const stats = statsData?.success ? {
    total: statsData.data?.total || 0,
    pickingUp: statsData.data?.PICKING_UP || 0,
    shipping: statsData.data?.SHIPPING || 0,
    delivered: statsData.data?.DELIVERED || 0,
    failed: statsData.data?.FAILED || 0,
  } : {
    // Fallback: tính từ shipments hiện tại (nếu API chưa load)
    total: shipments.length,
    pickingUp: shipments.filter((s) => s.status === 'PICKING_UP').length,
    shipping: shipments.filter((s) => s.status === 'SHIPPING').length,
    delivered: shipments.filter((s) => s.status === 'DELIVERED').length,
    failed: shipments.filter((s) => s.status === 'FAILED').length,
  };
  
  // Log khi shipments thay đổi
  useEffect(() => {
    console.log('📦 [StoreShipments] Shipments updated:', shipments.length, 'items');
    console.log('📊 [StoreShipments] Stats:', stats);
    
    // ✅ Log chi tiết status của từng shipment
    if (shipments.length > 0) {
      console.log('🔍 [StoreShipments] Current shipments status breakdown:');
      const statusCount = {};
      shipments.forEach((s) => {
        const status = s.status || 'UNKNOWN';
        statusCount[status] = (statusCount[status] || 0) + 1;
        console.log(`  - Shipment ${s.id}: status="${status}", orderId=${s.order?.id}`);
      });
      console.log('📊 [StoreShipments] Status count:', statusCount);
    }
  }, [shipments.length, stats, shipments]);

  const handleManualRefresh = () => {
    mutate(undefined, { revalidate: true });
    success('Đã làm mới danh sách vận đơn');
  };

  const handleViewDetails = (shipment) => {
    // Navigate to order detail page with orderId
    if (shipment.order?.id) {
      navigate(`/store-dashboard/orders/${shipment.order.id}`);
    } else {
      showError('Không tìm thấy thông tin đơn hàng');
    }
  };

  return (
    <StoreStatusGuard currentStore={currentStore} pageName="vận đơn" loading={storeLoading}>
      <StoreLayout>
        <div className="space-y-6">
          {/* Header with Refresh Button */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Quản lý vận đơn</h1>
              <p className="text-sm text-gray-600 mt-1">
                {/* ❌ TẮT AUTO-REFRESH - Theo yêu cầu tắt tự động vận chuyển */}
              </p>
            </div>
            <button
              onClick={handleManualRefresh}
              disabled={isLoading || isValidating}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg
                className={`w-5 h-5 ${isValidating ? 'animate-spin' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              {isValidating ? 'Đang làm mới...' : 'Làm mới'}
            </button>
          </div>

          {/* Stats Section - Giống Product Variants */}
          <div className="bg-gradient-to-r from-cyan-100 to-blue-100 rounded-2xl p-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-2xl text-white">🚚</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Quản lý vận đơn</h2>
                  <p className="text-sm text-gray-600">Quản lý danh sách biến thể sản phẩm của hàng</p>
                </div>
              </div>

              {/* Stats Cards - 4 cards ngang */}
              <div className="grid grid-cols-4 gap-4">
                {/* Đang lấy hàng */}
                <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl p-4 border-2 border-pink-200">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-pink-200 rounded-xl flex items-center justify-center">
                      <span className="text-2xl">📦</span>
                    </div>
                    <div>
                      <div className="text-xs text-gray-600 font-medium">Đang lấy hàng</div>
                      <div className="text-xs text-gray-500">Tất cả</div>
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mt-3">{stats.pickingUp}</div>
                </div>

                {/* Đang giao */}
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border-2 border-green-200">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-green-200 rounded-xl flex items-center justify-center">
                      <span className="text-2xl">🚚</span>
                    </div>
                    <div>
                      <div className="text-xs text-gray-600 font-medium">Đang giao</div>
                      <div className="text-xs text-gray-500">Đã duyệt</div>
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mt-3">{stats.shipping}</div>
                </div>

                {/* Đã giao */}
                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-4 border-2 border-yellow-200">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-yellow-200 rounded-xl flex items-center justify-center">
                      <span className="text-2xl">✅</span>
                    </div>
                    <div>
                      <div className="text-xs text-gray-600 font-medium">Đã giao</div>
                      <div className="text-xs text-gray-500">Chờ duyệt</div>
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mt-3">{stats.delivered}</div>
                </div>

                {/* Thất bại */}
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border-2 border-orange-200">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-orange-200 rounded-xl flex items-center justify-center">
                      <span className="text-2xl">❌</span>
                    </div>
                    <div>
                      <div className="text-xs text-gray-600 font-medium">Thất bại</div>
                      <div className="text-xs text-gray-500">Hết hàng</div>
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mt-3">{stats.failed}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex gap-2 flex-wrap">
              {[
                { key: 'all', label: 'Tất cả', count: stats.total },
                { key: 'PICKING_UP', label: 'Đang lấy hàng', count: stats.pickingUp },
                { key: 'SHIPPING', label: 'Đang giao', count: stats.shipping },
                { key: 'DELIVERED', label: 'Đã giao', count: stats.delivered },
                { key: 'FAILED', label: 'Thất bại', count: stats.failed },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => {
                    setFilter(tab.key);
                    setPage(0);
                  }}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filter === tab.key
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>
          </div>

          {/* Shipments List */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              </div>
            ) : shipments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4">
                <div className="text-6xl mb-4">📦</div>
                <p className="text-gray-500 text-center text-lg">Chưa có vận đơn nào</p>
                <p className="text-gray-400 text-sm text-center mt-2">
                  Vận đơn sẽ tự động được tạo khi xác nhận đơn hàng
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Mã vận đơn
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Đơn hàng
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Địa chỉ shop
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Địa chỉ giao hàng
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Shipper
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Phí ship
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Trạng thái
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Dự kiến giao
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {shipments.map((shipment) => {
                      const statusBadge = getShipmentStatusBadge(shipment.status);
                      const timeRemaining = getDeliveryTimeRemaining(shipment.expectedDeliveryDate);

                      return (
                        <tr key={shipment.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-blue-600">
                              {getShipmentCode(shipment.id)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-cyan-600 font-medium">
                              {getOrderCode(shipment.order?.id)}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 max-w-xs truncate">
                              {formatAddress(shipment.shopAddress || shipment.store?.address || 'N/A')}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 max-w-xs truncate">
                              {formatAddress(shipment.address)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {shipment.carrier ? (
                              <div className="flex items-center gap-2">
                                {shipment.carrier.avatar && (
                                  <img 
                                    src={shipment.carrier.avatar} 
                                    alt={shipment.carrier.fullName || shipment.carrier.name} 
                                    className="w-6 h-6 rounded-full object-cover"
                                  />
                                )}
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {shipment.carrier.fullName || shipment.carrier.name || 'N/A'}
                                  </div>
                                  {shipment.carrier.phone && (
                                    <div className="text-xs text-gray-500">
                                      {shipment.carrier.phone}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400">Chưa có shipper</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {formatCurrency(shipment.shippingFee || 0)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${statusBadge.bgColor} ${statusBadge.textColor}`}
                            >
                              {statusBadge.icon} {statusBadge.text}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {formatExpectedDeliveryDate(shipment.expectedDeliveryDate)}
                            </div>
                            {timeRemaining && (
                              <div className={`text-xs text-${timeRemaining.color}-600 mt-1`}>
                                {timeRemaining.text}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <button
                              onClick={() => handleViewDetails(shipment)}
                              className="text-blue-600 hover:text-blue-800 font-medium"
                            >
                              Xem chi tiết
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Trang trước
                </button>
                <span className="text-sm text-gray-700">
                  Trang {page + 1} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Trang sau
                </button>
              </div>
            )}
          </div>
        </div>
      </StoreLayout>
    </StoreStatusGuard>
  );
};

export default StoreShipments;
