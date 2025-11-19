import React, { useState } from 'react';
import useSWR, { mutate } from 'swr';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import { getPendingStores, getApprovedStores, approveStore, rejectStore, updateStoreStatus, softDeleteStore } from '../../services/admin/adminStoreService';
import { useToast } from '../../context/ToastContext';

const AdminStores = () => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'approved'
  const [page, setPage] = useState(0);
  const [selectedStore, setSelectedStore] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [newStatus, setNewStatus] = useState('');

  // Fetch data based on active tab
  const fetchStores = () => {
    if (activeTab === 'pending') {
      return getPendingStores({ page, size: 20 });
    }
    return getApprovedStores({ page, size: 20 });
  };

  const { data: storesData, error, isLoading } = useSWR(
    [`admin-stores-${activeTab}`, page],
    fetchStores,
    { revalidateOnFocus: false }
  );

  const stores = storesData?.data?.content || [];
  const totalPages = storesData?.data?.totalPages || 0;
  const totalElements = storesData?.data?.totalElements || 0;

  // Handle approve store
  const handleApprove = async (storeId) => {
    if (!confirm('Bạn có chắc muốn duyệt cửa hàng này?')) return;

    const result = await approveStore(storeId);
    if (result.success) {
      showToast(result.message || 'Duyệt cửa hàng thành công!', 'success');
      mutate([`admin-stores-${activeTab}`, page]);
      mutate('admin-pending-stores-count');
    } else {
      showToast(result.error || 'Có lỗi xảy ra', 'error');
    }
  };

  // Handle reject store
  const handleRejectClick = (store) => {
    setSelectedStore(store);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const handleRejectConfirm = async () => {
    if (!rejectReason.trim()) {
      showToast('Vui lòng nhập lý do từ chối', 'error');
      return;
    }

    const result = await rejectStore(selectedStore.id, rejectReason);
    if (result.success) {
      showToast(result.message || 'Từ chối cửa hàng thành công!', 'success');
      setShowRejectModal(false);
      setSelectedStore(null);
      setRejectReason('');
      mutate([`admin-stores-${activeTab}`, page]);
      mutate('admin-pending-stores-count');
    } else {
      showToast(result.error || 'Có lỗi xảy ra', 'error');
    }
  };

  // Handle update status
  const handleStatusClick = (store) => {
    setSelectedStore(store);
    setNewStatus(store.status || 'ACTIVE');
    setShowStatusModal(true);
  };

  const handleStatusConfirm = async () => {
    const result = await updateStoreStatus(selectedStore.id, newStatus);
    if (result.success) {
      showToast(result.message || 'Cập nhật trạng thái thành công!', 'success');
      setShowStatusModal(false);
      setSelectedStore(null);
      mutate([`admin-stores-${activeTab}`, page]);
    } else {
      showToast(result.error || 'Có lỗi xảy ra', 'error');
    }
  };

  // Handle delete store
  const handleDelete = async (storeId) => {
    if (!confirm('Bạn có chắc muốn xóa cửa hàng này? Hành động này có thể khôi phục.')) return;

    const result = await softDeleteStore(storeId);
    if (result.success) {
      showToast(result.message || 'Xóa cửa hàng thành công!', 'success');
      mutate([`admin-stores-${activeTab}`, page]);
    } else {
      showToast(result.error || 'Có lỗi xảy ra', 'error');
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      ACTIVE: { bg: 'bg-green-100', text: 'text-green-800', label: 'Hoạt động' },
      INACTIVE: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Không hoạt động' },
      SUSPENDED: { bg: 'bg-red-100', text: 'text-red-800', label: 'Tạm ngưng' },
      PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Chờ duyệt' },
    };
    const config = statusConfig[status] || statusConfig.PENDING;
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader 
        icon="🏪"
        title="Quản lý Cửa hàng"
        subtitle="Duyệt và quản lý các cửa hàng"
      />

      <div className="space-y-6">
        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border-2 border-gray-200">
          <div className="flex border-b">
            <button
              onClick={() => { setActiveTab('pending'); setPage(0); }}
              className={`flex-1 px-6 py-4 font-semibold transition-all ${
                activeTab === 'pending'
                  ? 'bg-yellow-50 text-yellow-600 border-b-4 border-yellow-500'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span className="text-2xl mr-2">⏳</span>
              Chờ duyệt
            </button>
            <button
              onClick={() => { setActiveTab('approved'); setPage(0); }}
              className={`flex-1 px-6 py-4 font-semibold transition-all ${
                activeTab === 'approved'
                  ? 'bg-green-50 text-green-600 border-b-4 border-green-500'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span className="text-2xl mr-2">✅</span>
              Đã duyệt
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Đang tải...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <span className="text-6xl">❌</span>
                <p className="mt-4 text-red-600 font-semibold">Có lỗi xảy ra khi tải dữ liệu</p>
              </div>
            ) : stores.length === 0 ? (
              <div className="text-center py-12">
                <span className="text-6xl">📭</span>
                <p className="mt-4 text-gray-600 font-semibold">
                  {activeTab === 'pending' ? 'Không có cửa hàng chờ duyệt' : 'Không có cửa hàng đã duyệt'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <p className="text-gray-600">
                    Tổng số: <span className="font-bold text-gray-900">{totalElements}</span> cửa hàng
                  </p>
                </div>

                {/* Store List */}
                <div className="grid gap-4">
                  {stores.map((store) => (
                    <div key={store.id} className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:shadow-xl transition-all">
                      <div className="flex items-start gap-4">
                        {/* Store Logo */}
                        <div className="w-24 h-24 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl flex items-center justify-center flex-shrink-0">
                          {store.logoUrl ? (
                            <img
                              src={store.logoUrl}
                              alt={store.name}
                              className="w-full h-full object-cover rounded-xl"
                            />
                          ) : (
                            <span className="text-5xl">🏪</span>
                          )}
                        </div>

                        {/* Store Info */}
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="text-xl font-bold text-gray-900 mb-1">{store.name}</h3>
                              <p className="text-gray-600 text-sm">{store.description || 'Chưa có mô tả'}</p>
                            </div>
                            {getStatusBadge(store.status)}
                          </div>

                          <div className="grid grid-cols-3 gap-4 text-sm mb-4">
                            <div>
                              <span className="text-gray-500 block">👤 Chủ shop:</span>
                              <span className="font-medium">
                                {(() => {
                                  // Debug log
                                  console.log('🔍 Store owner data:', {
                                    storeId: store.id,
                                    storeName: store.name,
                                    ownerName: store.ownerName,
                                    owner: store.owner,
                                    ownerId: store.ownerId,
                                    fullStore: store
                                  });
                                  
                                  return store.ownerName || 
                                         store.owner?.name || 
                                         store.owner?.username || 
                                         store.owner?.fullName ||
                                         'N/A';
                                })()}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500 block">📧 Email:</span>
                              <span className="font-medium">
                                {store.email || 
                                 store.contactEmail || 
                                 store.owner?.email || 
                                 'N/A'}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500 block">📍 Địa chỉ:</span>
                              <span className="font-medium">
                                {(() => {
                                  // Parse address object
                                  if (typeof store.address === 'string') {
                                    return store.address;
                                  } else if (typeof store.address === 'object' && store.address !== null) {
                                    const addr = store.address;
                                    return [
                                      addr.street,
                                      addr.ward,
                                      addr.district,
                                      addr.city,
                                      addr.province
                                    ].filter(Boolean).join(', ') || 'N/A';
                                  }
                                  return store.location || 'N/A';
                                })()}
                              </span>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2 flex-wrap">
                            {activeTab === 'pending' ? (
                              <>
                                <button
                                  onClick={() => handleApprove(store.id)}
                                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-semibold"
                                >
                                  ✅ Duyệt
                                </button>
                                <button
                                  onClick={() => handleRejectClick(store)}
                                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-semibold"
                                >
                                  ❌ Từ chối
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleStatusClick(store)}
                                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-semibold"
                                >
                                  🔄 Đổi trạng thái
                                </button>
                                <button
                                  onClick={() => handleDelete(store.id)}
                                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-semibold"
                                >
                                  🗑️ Xóa
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center gap-2 mt-6">
                    <button
                      onClick={() => setPage(p => Math.max(0, p - 1))}
                      disabled={page === 0}
                      className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                    >
                      ← Trước
                    </button>
                    <span className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg font-bold">
                      {page + 1} / {totalPages}
                    </span>
                    <button
                      onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                      disabled={page >= totalPages - 1}
                      className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                    >
                      Sau →
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">Từ chối cửa hàng</h2>
            <p className="text-gray-600 mb-4">Cửa hàng: <span className="font-bold">{selectedStore?.name}</span></p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Nhập lý do từ chối..."
              className="w-full border-2 border-gray-300 rounded-lg p-3 mb-4 focus:outline-none focus:border-red-500"
              rows="4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setShowRejectModal(false); setSelectedStore(null); setRejectReason(''); }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-semibold"
              >
                Hủy
              </button>
              <button
                onClick={handleRejectConfirm}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-semibold"
              >
                Xác nhận từ chối
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">Cập nhật trạng thái</h2>
            <p className="text-gray-600 mb-4">Cửa hàng: <span className="font-bold">{selectedStore?.name}</span></p>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="w-full border-2 border-gray-300 rounded-lg p-3 mb-4 focus:outline-none focus:border-blue-500"
            >
              <option value="ACTIVE">Hoạt động</option>
              <option value="INACTIVE">Không hoạt động</option>
              <option value="SUSPENDED">Tạm ngưng</option>
            </select>
            <div className="flex gap-3">
              <button
                onClick={() => { setShowStatusModal(false); setSelectedStore(null); }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-semibold"
              >
                Hủy
              </button>
              <button
                onClick={handleStatusConfirm}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-semibold"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default AdminStores;
