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
import { getOrderCode } from '../../utils/displayCodeUtils';

/**
 * StoreShipments Page
 * Quản lý vận đơn của store
 */
const StoreShipments = () => {
  const navigate = useNavigate();
  const { currentStore, loading: storeLoading } = useStoreContext();
  const { success, error: showError } = useToast();

  const [filter, setFilter] = useState('all'); // all, READY_TO_PICK, PICKING, SHIPPING, DELIVERED, DELIVERED_FAIL, RETURNED
  const [page, setPage] = useState(0);
  // Lưu toàn bộ shipment đã load để hỗ trợ "Xem thêm"
  const [loadedShipments, setLoadedShipments] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  // ✅ Lưu stats cũ để tránh "nhảy" khi đang load
  const [cachedStats, setCachedStats] = useState({
    total: 0,
    readyToPick: 0,
    picking: 0,
    shipping: 0,
    delivered: 0,
    deliverFail: 0,
    returned: 0,
  });

  // ✅ Dùng SWR để có thể invalidate từ nơi khác (sau khi confirm order)
  const { data: shipmentsData, error, isLoading, mutate } = useSWR(
    currentStore?.id ? ['store-shipments', currentStore.id, filter, page] : null,
    () => {
      const statusFilter = filter === 'all' ? null : filter;
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
      onError: (error) => {
        // ✅ Xử lý lỗi 500 từ Java backend (lỗi getFromAddress null)
        if (error.response?.status === 500) {
          console.warn('⚠️ [StoreShipments] Backend error 500 - có thể do Java backend expect fromAddress object');
        }
      },
    }
  );

  // ✅ Xử lý nhiều format response từ backend (1 page)
  const pageShipments = shipmentsData?.success 
    ? (Array.isArray(shipmentsData.data?.content) 
        ? shipmentsData.data.content 
        : Array.isArray(shipmentsData.data?.shipments)
          ? shipmentsData.data.shipments
          : Array.isArray(shipmentsData.data)
            ? shipmentsData.data
            : [])
    : [];
  
  const totalPages = shipmentsData?.data?.totalPages || 0;

  // ✅ Gộp các page lại thành danh sách hiển thị liên tục (newest → oldest)
  useEffect(() => {
    if (!shipmentsData?.success) return;

    // Còn trang để tải tiếp không?
    setHasMore(page < totalPages - 1);

    setLoadedShipments(prev => {
      // Nếu là trang đầu tiên hoặc filter/store thay đổi, reset danh sách
      if (page === 0) {
        return pageShipments;
      }
      // Các trang tiếp theo: append
      return [...prev, ...pageShipments];
    });
  }, [shipmentsData, page, totalPages, pageShipments]);

  // ✅ Fallback: đếm theo danh sách đã load nếu API stats lỗi/0
  const countsFromShipments = React.useMemo(() => {
    const counts = {
      total: loadedShipments.length,
      readyToPick: 0,
      picking: 0,
      shipping: 0,
      delivered: 0,
      deliverFail: 0,
      returned: 0,
    };
    loadedShipments.forEach((s) => {
      switch (s.status) {
        case 'READY_TO_PICK':
          counts.readyToPick += 1;
          break;
        case 'PICKING_UP':
        case 'PICKING':
          counts.picking += 1;
          break;
        case 'SHIPPING':
          counts.shipping += 1;
          break;
        case 'DELIVERED':
          counts.delivered += 1;
          break;
        case 'DELIVERED_FAIL':
        case 'FAILED':
          counts.deliverFail += 1;
          break;
        case 'RETURNED':
          counts.returned += 1;
          break;
        default:
          break;
      }
    });
    return counts;
  }, [loadedShipments]);
  
  
  // ✅ Lấy stats chính xác từ API (không phụ thuộc vào filter/pagination)
  // API này TRÁNH trường hợp khi search hay filter status khác thì bộ đếm cũng bị thay đổi theo
  // ✅ Lần đầu KHÔNG load luôn, chỉ dùng giá trị mặc định (0), chỉ load khi cần thiết
  const { data: statsData, isLoading: statsLoading, mutate: mutateStats } = useSWR(
    currentStore?.id ? ['store-shipments-stats', currentStore.id] : null,
    () => countShipmentsByStatus(currentStore.id),
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      revalidateIfStale: true,
      dedupingInterval: 3000, // cache ngắn để đồng bộ bộ đếm
    }
  );

  // ✅ Helper: chuẩn hóa dữ liệu đếm theo nhiều format backend có thể trả về
  const normalizeShipmentStats = React.useCallback((raw = {}) => {
    // Chấp nhận cả UPPER_SNAKE, camelCase, và một số key thay thế
    const get = (...keys) => {
      for (const k of keys) {
        if (raw[k] !== undefined && raw[k] !== null) return raw[k];
      }
      return 0;
    };

    const normalized = {
      total: get('total', 'TOTAL'),
      readyToPick: get('READY_TO_PICK', 'READY_TO_PICKUP', 'readyToPick', 'ready_to_pick', 'readyToPickup'),
      // gộp PICKING_UP + PICKING về "picking"
      picking: get('PICKING_UP', 'PICKING', 'pickingUp', 'picking'),
      shipping: get('SHIPPING', 'shipping'),
      delivered: get('DELIVERED', 'delivered'),
      // DELIVERED_FAIL / FAILED
      deliverFail: get('DELIVERED_FAIL', 'FAILED', 'failed', 'deliverFail', 'deliveredFail', 'delivered_fail'),
      returned: get('RETURNED', 'returned'),
    };

    return normalized;
  }, []);

  // ✅ Cập nhật cachedStats khi có data mới từ API count-by-status
  useEffect(() => {
    if (statsData?.success && statsData.data) {
      setCachedStats(normalizeShipmentStats(statsData.data));
    }
  }, [statsData, normalizeShipmentStats]);

  // ✅ CHỈ dùng stats từ API (đã normalize), fallback sang đếm từ danh sách nếu API lỗi
  // Dùng cachedStats để tránh "nhảy" khi đang load
  const statsRaw = statsData?.success && statsData.data
    ? normalizeShipmentStats(statsData.data)
    : countsFromShipments; // ✅ Fallback đếm theo danh sách

  // ✅ Nếu BE không trả field "total" thì tự cộng từ các trạng thái con
  const stats = React.useMemo(() => {
    const totalFromStatuses =
      (statsRaw.readyToPick || 0) +
      (statsRaw.picking || 0) +
      (statsRaw.shipping || 0) +
      (statsRaw.delivered || 0) +
      (statsRaw.deliverFail || 0) +
      (statsRaw.returned || 0);

    return {
      ...statsRaw,
      total: statsRaw.total && statsRaw.total > 0 ? statsRaw.total : totalFromStatuses,
    };
  }, [statsRaw]);

  // Đã bỏ nút "Làm mới" để tránh gây nhầm lẫn và request thừa trên trang này

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
          {/* Header */}
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Quản lý vận đơn</h1>
            <p className="text-sm text-gray-600 mt-1">
              Quản lý danh sách vận đơn cho các đơn hàng của cửa hàng
            </p>
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

              {/* Stats Cards - 6 status */}
              <div className="grid grid-cols-6 gap-4">
                {/* READY_TO_PICK */}
                <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-xl p-4 border-2 border-cyan-200">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-cyan-200 rounded-xl flex items-center justify-center">
                      <span className="text-2xl">📦</span>
                    </div>
                    <div>
                      <div className="text-xs text-gray-600 font-medium">Sẵn sàng lấy hàng</div>
                      <div className="text-xs text-gray-500">Chờ shipper</div>
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mt-3">{stats.readyToPick}</div>
                </div>

                {/* PICKING */}
                <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl p-4 border-2 border-pink-200">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-pink-200 rounded-xl flex items-center justify-center">
                      <span className="text-2xl">📦</span>
                    </div>
                    <div>
                      <div className="text-xs text-gray-600 font-medium">Đang lấy hàng</div>
                      <div className="text-xs text-gray-500">Shipper đang lấy</div>
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mt-3">{stats.picking}</div>
                </div>

                {/* SHIPPING */}
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

                {/* DELIVERED */}
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

                {/* DELIVER_FAIL */}
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border-2 border-orange-200">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-orange-200 rounded-xl flex items-center justify-center">
                      <span className="text-2xl">❌</span>
                    </div>
                    <div>
                      <div className="text-xs text-gray-600 font-medium">Thất bại</div>
                      <div className="text-xs text-gray-500">Giao thất bại</div>
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mt-3">{stats.deliverFail}</div>
                </div>

                {/* RETURNED */}
                <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-4 border-2 border-indigo-200">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-indigo-200 rounded-xl flex items-center justify-center">
                      <span className="text-2xl">↩️</span>
                    </div>
                    <div>
                      <div className="text-xs text-gray-600 font-medium">Đã trả hàng</div>
                      <div className="text-xs text-gray-500">Hoàn tất trả</div>
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mt-3">{stats.returned}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex gap-2 flex-wrap">
              {[
                // Lưu ý: filter dùng giá trị status ĐÚNG như backend cho LIST,
                // còn phần đếm đã normalize cả READY_TO_PICK và READY_TO_PICKUP.
                { key: 'all', label: 'Tất cả', count: stats.total },
                // Backend LIST đang dùng status READY_TO_PICK cho các đơn sẵn sàng lấy hàng
                { key: 'READY_TO_PICK', label: 'Sẵn sàng lấy hàng', count: stats.readyToPick },
                // PICKING_UP + PICKING được gộp trong stats.picking, filter dùng PICKING để backend trả đúng
                { key: 'PICKING', label: 'Đang lấy hàng', count: stats.picking },
                { key: 'SHIPPING', label: 'Đang giao', count: stats.shipping },
                { key: 'DELIVERED', label: 'Đã giao', count: stats.delivered },
                { key: 'DELIVERED_FAIL', label: 'Thất bại', count: stats.deliverFail },
                { key: 'RETURNED', label: 'Đã trả', count: stats.returned },
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
            {isLoading && page === 0 ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              </div>
            ) : loadedShipments.length === 0 ? (
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
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ID vận đơn
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Địa chỉ giao hàng
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Shipper
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Phí ship
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Trạng thái
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Dự kiến giao
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {loadedShipments.map((shipment) => {
                      const statusBadge = getShipmentStatusBadge(shipment.status);
                      const timeRemaining = getDeliveryTimeRemaining(shipment.expectedDeliveryDate);

                      return (
                        <tr key={shipment.id} className="hover:bg-gray-50">
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-blue-600">
                              {shipment.id}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="text-sm text-gray-900 max-w-xs truncate">
                              {formatAddress(
                                shipment.toAddress ||
                                shipment.address ||
                                'N/A'
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            {(() => {
                              // ✅ Hỗ trợ nhiều format dữ liệu shipper khác nhau từ backend
                              const shipperObj =
                                shipment.carrier || // format mới: carrier object
                                shipment.shipper || // có thể là shipper object
                                shipment.assignedShipper || // tên khác
                                null;

                              const shipperName =
                                shipperObj?.fullName ||
                                shipperObj?.name ||
                                shipment.shipperName || // format: field shipperName riêng
                                null;

                              const shipperPhone =
                                shipperObj?.phone ||
                                shipment.shipperPhone ||
                                null;

                              const avatar =
                                shipperObj?.avatar || shipperObj?.avatarUrl || null;

                              if (!shipperName && !shipperPhone && !avatar) {
                                return (
                                  <span className="text-sm text-gray-400">
                                    Chưa có shipper
                                  </span>
                                );
                              }

                              return (
                                <div className="flex items-center gap-2">
                                  {avatar && (
                                    <img
                                      src={avatar}
                                      alt={shipperName || 'Shipper'}
                                      className="w-6 h-6 rounded-full object-cover"
                                    />
                                  )}
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">
                                      {shipperName || 'N/A'}
                                    </div>
                                    {shipperPhone && (
                                      <div className="text-xs text-gray-500">
                                        {shipperPhone}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })()}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {formatCurrency(shipment.shippingFee || 0)}
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${statusBadge.bgColor} ${statusBadge.textColor}`}
                            >
                              {statusBadge.icon} {statusBadge.text}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {formatExpectedDeliveryDate(shipment.expectedDeliveryDate)}
                            </div>
                            {timeRemaining && (
                              <div className={`text-xs text-${timeRemaining.color}-600 mt-1`}>
                                {timeRemaining.text}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm">
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

            {/* Nút Xem thêm - dạng load-more, mỗi lần +10 đơn cho đến khi hết */}
            {hasMore && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-center">
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={isLoading}
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg text-sm font-semibold hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Đang tải...' : 'Xem thêm'}
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
