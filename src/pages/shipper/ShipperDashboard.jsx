import React, { useState, useEffect } from 'react';
import useSWR from 'swr';
import { useNavigate, useLocation } from 'react-router-dom';
import ShipperLayout from '../../layouts/ShipperLayout';
import { 
  getPickingUpShipments, 
  getShipperHistory,
  pickupOrder,
  startShipping,
  completeShipment,
  failShipment 
} from '../../services/shipper/shipperService';
import { useToast } from '../../context/ToastContext';

const ShipperDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  // Set active tab based on URL
  const [activeTab, setActiveTab] = useState(
    location.pathname === '/shipper/history' ? 'history' : 'picking-up'
  );
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 10;

  // Update tab when URL changes
  useEffect(() => {
    if (location.pathname === '/shipper/history') {
      setActiveTab('history');
    } else {
      setActiveTab('picking-up');
    }
  }, [location.pathname]);

  // Fetch picking up shipments
  // ❌ TẮT AUTO-REFRESH - Theo yêu cầu tắt tự động vận chuyển
  const { data: pickingUpData, error: pickingUpError, isLoading: pickingUpLoading, mutate: mutatePickingUp } = useSWR(
    ['shipper-picking-up', currentPage],
    () => getPickingUpShipments({ page: currentPage, size: pageSize }),
    { 
      revalidateOnFocus: true, // ✅ Bật lại revalidate khi focus vào tab để shipper thấy đơn mới
      refreshInterval: 0 // Tắt auto refresh
    }
  );

  // Fetch history
  const { data: historyData, error: historyError, isLoading: historyLoading, mutate: mutateHistory } = useSWR(
    ['shipper-history', currentPage],
    () => getShipperHistory({ page: currentPage, size: pageSize }),
    { revalidateOnFocus: false }
  );

  const pickingUpShipments = pickingUpData?.success ? (pickingUpData.data?.content || pickingUpData.data || []) : [];
  const historyShipments = historyData?.success ? (historyData.data?.content || historyData.data || []) : [];
  
  const totalPickingUpPages = pickingUpData?.data?.totalPages || 0;
  const totalHistoryPages = historyData?.data?.totalPages || 0;

  // Calculate statistics
  const stats = {
    totalPickingUp: pickingUpShipments.length,
    totalShipping: pickingUpShipments.filter(s => s.status === 'SHIPPING').length,
    totalDelivered: historyShipments.filter(s => s.status === 'DELIVERED').length,
    totalFailed: historyShipments.filter(s => s.status === 'FAILED').length,
    totalHistory: historyShipments.length,
  };

  // Handle pickup order
  const handlePickupOrder = async (orderId) => {
    const result = await pickupOrder(orderId);
    if (result.success) {
      showToast('Nhận đơn hàng thành công!', 'success');
      mutatePickingUp();
    } else {
      showToast(result.error, 'error');
    }
  };

  // Handle start shipping
  const handleStartShipping = async (shipmentId) => {
    const result = await startShipping(shipmentId);
    if (result.success) {
      showToast('Bắt đầu giao hàng thành công!', 'success');
      mutatePickingUp();
      mutateHistory();
    } else {
      showToast(result.error, 'error');
    }
  };

  // Handle complete shipment
  const handleCompleteShipment = async (shipmentId) => {
    if (!window.confirm('Xác nhận hoàn thành giao hàng?')) return;
    
    const result = await completeShipment(shipmentId);
    if (result.success) {
      showToast('Hoàn thành giao hàng thành công!', 'success');
      mutatePickingUp();
      mutateHistory();
    } else {
      showToast(result.error, 'error');
    }
  };

  // Handle fail shipment
  const handleFailShipment = async (shipmentId) => {
    const reason = window.prompt('Nhập lý do giao hàng thất bại:');
    if (!reason) return;
    
    const result = await failShipment(shipmentId, reason);
    if (result.success) {
      showToast('Đã đánh dấu giao hàng thất bại', 'success');
      mutatePickingUp();
      mutateHistory();
    } else {
      showToast(result.error, 'error');
    }
  };

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

  const getStatusBadge = (status) => {
    const statusMap = {
      'PICKING_UP': { text: 'Đang nhận hàng', color: 'bg-yellow-100 text-yellow-800' },
      'SHIPPING': { text: 'Đang giao hàng', color: 'bg-blue-100 text-blue-800' },
      'DELIVERED': { text: 'Đã giao', color: 'bg-green-100 text-green-800' },
      'FAILED': { text: 'Giao thất bại', color: 'bg-red-100 text-red-800' },
    };
    const statusInfo = statusMap[status] || { text: status, color: 'bg-gray-100 text-gray-800' };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusInfo.color}`}>
        {statusInfo.text}
      </span>
    );
  };

  return (
    <ShipperLayout>
      <div>
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-200 to-emerald-200 rounded-2xl p-6 mb-6">
          <div className="relative bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-4xl">🚚</span>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-800">Dashboard Shipper</h1>
                  <p className="text-gray-600 text-base mt-1">Quản lý đơn hàng và giao hàng</p>
                </div>
              </div>
              <button
                onClick={() => {
                  mutatePickingUp();
                  mutateHistory();
                  showToast('Đã làm mới danh sách đơn hàng', 'success');
                }}
                className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 font-medium shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Làm mới
              </button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Đơn chờ nhận</p>
                <p className="text-3xl font-bold text-yellow-600">{stats.totalPickingUp}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📦</span>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Đang giao hàng</p>
                <p className="text-3xl font-bold text-blue-600">{stats.totalShipping}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🚛</span>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Đã giao thành công</p>
                <p className="text-3xl font-bold text-green-600">{stats.totalDelivered}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">✅</span>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Giao thất bại</p>
                <p className="text-3xl font-bold text-red-600">{stats.totalFailed}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">❌</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex">
              <button
                onClick={() => {
                  setActiveTab('picking-up');
                  navigate('/shipper');
                }}
                className={`px-6 py-4 text-sm font-medium ${
                  activeTab === 'picking-up'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Đơn chờ nhận ({pickingUpShipments.length})
              </button>
              <button
                onClick={() => {
                  setActiveTab('history');
                  navigate('/shipper/history');
                }}
                className={`px-6 py-4 text-sm font-medium ${
                  activeTab === 'history'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Lịch sử giao hàng
              </button>
            </nav>
          </div>

          {/* Content */}
          <div className="p-6">
            {activeTab === 'picking-up' ? (
              <>
                {pickingUpLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  </div>
                ) : pickingUpError ? (
                  <div className="text-center py-12 text-red-600">
                    <p>Không thể tải danh sách đơn chờ nhận</p>
                  </div>
                ) : pickingUpShipments.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <p className="text-lg mb-2">📦</p>
                    <p>Không có đơn hàng nào đang chờ nhận</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pickingUpShipments.map((shipment) => (
                      <div
                        key={shipment.id || shipment.orderId}
                        className="bg-gradient-to-r from-white to-gray-50 border-2 border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all hover:border-teal-300"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-lg flex items-center justify-center shadow-md">
                                <span className="text-2xl">📦</span>
                              </div>
                              <div>
                                <h3 className="font-bold text-xl text-gray-900">
                                  Đơn hàng #{shipment.orderId || shipment.id}
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">
                                  {formatDate(shipment.createdAt)}
                                </p>
                              </div>
                            </div>
                          </div>
                          {getStatusBadge(shipment.status)}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          {/* Shop Address (Địa chỉ shop - nơi gửi hàng) */}
                          {shipment.shopAddress && (
                            <div className="bg-purple-50 rounded-lg p-4">
                              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">🏪 Địa chỉ shop (nơi gửi)</p>
                              <p className="text-sm text-gray-700">
                                {typeof shipment.shopAddress === 'string' 
                                  ? shipment.shopAddress 
                                  : (shipment.shopAddress.fullAddress || shipment.shopAddress.address || 'N/A')}
                              </p>
                            </div>
                          )}

                          {/* Delivery Address */}
                          {shipment.address && (
                            <div className="bg-gray-50 rounded-lg p-4">
                              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">📍 Địa chỉ giao hàng</p>
                              <p className="text-sm text-gray-700 font-medium">
                                {shipment.address.fullName || shipment.address.name || 'N/A'}
                              </p>
                              <p className="text-sm text-gray-600">
                                {shipment.address.phone || 'N/A'}
                              </p>
                              <p className="text-sm text-gray-600 mt-1">
                                {shipment.address.fullAddress || shipment.address.address || 'N/A'}
                              </p>
                            </div>
                          )}

                          {shipment.totalPrice && (
                            <div className="bg-blue-50 rounded-lg p-4">
                              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">💰 Tổng giá trị</p>
                              <p className="text-2xl font-bold text-blue-600">
                                {formatCurrency(shipment.totalPrice)}
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-200">
                          {shipment.status === 'PICKING_UP' && !shipment.shipperId && (
                            <button
                              onClick={() => handlePickupOrder(shipment.orderId || shipment.id)}
                              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 font-bold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                            >
                              <span>✅</span>
                              <span>Nhận đơn</span>
                            </button>
                          )}
                          {shipment.status === 'PICKING_UP' && shipment.shipperId && (
                            <button
                              onClick={() => handleStartShipping(shipment.id || shipment.shipmentId)}
                              className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 font-bold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                            >
                              <span>🚛</span>
                              <span>Bắt đầu giao hàng</span>
                            </button>
                          )}
                          {shipment.status === 'SHIPPING' && (
                            <>
                              <button
                                onClick={() => handleCompleteShipment(shipment.id || shipment.shipmentId)}
                                className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 font-bold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                              >
                                <span>✅</span>
                                <span>Hoàn thành</span>
                              </button>
                              <button
                                onClick={() => handleFailShipment(shipment.id || shipment.shipmentId)}
                                className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 font-bold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                              >
                                <span>❌</span>
                                <span>Giao thất bại</span>
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => navigate(`/shipper/shipments/${shipment.orderId || shipment.id}`)}
                            className="px-6 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-teal-400 font-medium transition-all flex items-center gap-2"
                          >
                            <span>📋</span>
                            <span>Chi tiết</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Pagination */}
                {totalPickingUpPages > 1 && (
                  <div className="mt-6 flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Trang <span className="font-medium">{currentPage + 1}</span> / <span className="font-medium">{totalPickingUpPages}</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                        disabled={currentPage === 0}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                      >
                        ← Trước
                      </button>
                      <button
                        onClick={() => setCurrentPage(p => Math.min(totalPickingUpPages - 1, p + 1))}
                        disabled={currentPage >= totalPickingUpPages - 1}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                      >
                        Sau →
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                {historyLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  </div>
                ) : historyError ? (
                  <div className="text-center py-12 text-red-600">
                    <p>Không thể tải lịch sử giao hàng</p>
                  </div>
                ) : historyShipments.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <p className="text-lg mb-2">📋</p>
                    <p>Chưa có lịch sử giao hàng</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {historyShipments.map((shipment) => (
                      <div
                        key={shipment.id || shipment.orderId}
                        className="bg-gradient-to-r from-white to-gray-50 border-2 border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all hover:border-teal-300"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className={`w-12 h-12 rounded-lg flex items-center justify-center shadow-md ${
                                shipment.status === 'DELIVERED' ? 'bg-gradient-to-br from-green-500 to-emerald-500' :
                                shipment.status === 'FAILED' ? 'bg-gradient-to-br from-red-500 to-red-600' :
                                'bg-gradient-to-br from-gray-400 to-gray-500'
                              }`}>
                                <span className="text-2xl">
                                  {shipment.status === 'DELIVERED' ? '✅' : 
                                   shipment.status === 'FAILED' ? '❌' : '📦'}
                                </span>
                              </div>
                              <div>
                                <h3 className="font-bold text-xl text-gray-900">
                                  Đơn hàng #{shipment.orderId || shipment.id}
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">
                                  {formatDate(shipment.createdAt)}
                                </p>
                              </div>
                            </div>
                          </div>
                          {getStatusBadge(shipment.status)}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          {shipment.address && (
                            <div className="bg-gray-50 rounded-lg p-4">
                              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">📍 Địa chỉ giao hàng</p>
                              <p className="text-sm text-gray-700 font-medium">
                                {shipment.address.fullName || shipment.address.name || 'N/A'}
                              </p>
                              <p className="text-sm text-gray-600">
                                {shipment.address.phone || 'N/A'}
                              </p>
                              <p className="text-sm text-gray-600 mt-1">
                                {shipment.address.fullAddress || shipment.address.address || 'N/A'}
                              </p>
                            </div>
                          )}

                          {shipment.totalPrice && (
                            <div className="bg-blue-50 rounded-lg p-4">
                              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">💰 Tổng giá trị</p>
                              <p className="text-2xl font-bold text-blue-600">
                                {formatCurrency(shipment.totalPrice)}
                              </p>
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() => navigate(`/shipper/shipments/${shipment.orderId || shipment.id}`)}
                          className="mt-4 px-6 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-teal-400 font-medium transition-all flex items-center gap-2"
                        >
                          <span>📋</span>
                          <span>Xem chi tiết</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Pagination */}
                {totalHistoryPages > 1 && (
                  <div className="mt-6 flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Trang <span className="font-medium">{currentPage + 1}</span> / <span className="font-medium">{totalHistoryPages}</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                        disabled={currentPage === 0}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                      >
                        ← Trước
                      </button>
                      <button
                        onClick={() => setCurrentPage(p => Math.min(totalHistoryPages - 1, p + 1))}
                        disabled={currentPage >= totalHistoryPages - 1}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                      >
                        Sau →
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </ShipperLayout>
  );
};

export default ShipperDashboard;

