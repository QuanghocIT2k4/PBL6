import React, { useState } from 'react';
import useSWR from 'swr';
import { 
  getAllPromotions, 
  getActivePromotions, 
  getInactivePromotions, 
  getExpiredPromotions,
  activatePromotion, 
  deactivatePromotion, 
  deletePromotion,
  createPlatformPromotion 
} from '../../services/admin/adminPromotionService';
import { useToast } from '../../context/ToastContext';

const AdminPromotions = () => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'active' | 'inactive' | 'expired'
  const [currentPage, setCurrentPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const pageSize = 20;

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    discountType: 'PERCENTAGE',
    discountValue: '',
    maxDiscountAmount: '',
    minOrderValue: '',
    usageLimit: '',
    startDate: '',
    endDate: '',
  });

  // Fetch promotions based on tab
  const getFetcher = () => {
    switch (activeTab) {
      case 'active': return getActivePromotions;
      case 'inactive': return getInactivePromotions;
      case 'expired': return getExpiredPromotions;
      default: return getAllPromotions;
    }
  };
  
  const { data, error, isLoading, mutate } = useSWR(
    ['admin-promotions', activeTab, currentPage],
    () => getFetcher()({ page: currentPage, size: pageSize }),
    { revalidateOnFocus: false }
  );

  const promotions = data?.success ? (data.data?.content || data.data || []) : [];
  const totalPages = data?.data?.totalPages || 0;
  const totalElements = data?.data?.totalElements || 0;

  // Filter by search
  const filteredPromotions = promotions.filter(promo => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      promo.name?.toLowerCase().includes(search) ||
      promo.description?.toLowerCase().includes(search) ||
      promo.code?.toLowerCase().includes(search)
    );
  });

  // Handle activate/deactivate
  const handleToggleActive = async (promoId, isActive) => {
    const toggleFunc = isActive ? deactivatePromotion : activatePromotion;
    const result = await toggleFunc(promoId);

    if (result.success) {
      showToast(`${isActive ? 'Vô hiệu hóa' : 'Kích hoạt'} khuyến mãi thành công`, 'success');
      mutate();
    } else {
      showToast(result.error, 'error');
    }
  };

  // Handle delete
  const handleDelete = async (promoId) => {
    if (!confirm('Bạn có chắc muốn xóa khuyến mãi này?')) return;

    const result = await deletePromotion(promoId);

    if (result.success) {
      showToast('Xóa khuyến mãi thành công', 'success');
      mutate();
    } else {
      showToast(result.error, 'error');
    }
  };

  // Handle create
  const handleCreate = async () => {
    if (!formData.name || !formData.discountValue) {
      showToast('Vui lòng điền đầy đủ thông tin', 'error');
      return;
    }

    const result = await createPlatformPromotion({
      ...formData,
      discountValue: parseFloat(formData.discountValue),
      maxDiscountAmount: formData.maxDiscountAmount ? parseFloat(formData.maxDiscountAmount) : null,
      minOrderValue: formData.minOrderValue ? parseFloat(formData.minOrderValue) : null,
      usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : null,
    });

    if (result.success) {
      showToast('Tạo khuyến mãi thành công', 'success');
      setShowCreateModal(false);
      setFormData({
        name: '',
        description: '',
        discountType: 'PERCENTAGE',
        discountValue: '',
        maxDiscountAmount: '',
        minOrderValue: '',
        usageLimit: '',
        startDate: '',
        endDate: '',
      });
      mutate();
    } else {
      showToast(result.error, 'error');
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-100 to-gray-100 rounded-2xl p-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-slate-600 to-slate-700 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-4xl">🎁</span>
                </div>
                <div>
                  <h1 className="text-3xl font-bold mb-2">
                    <span className="text-slate-700">Khuyến mãi</span> <span className="text-slate-600">Nền tảng</span>
                  </h1>
                  <p className="text-gray-600 text-base">Tổng số: <span className="font-semibold">{totalElements}</span> khuyến mãi</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-800 font-bold flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/>
                </svg>
                Tạo khuyến mãi
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => { setActiveTab('all'); setCurrentPage(0); }}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'all' ? 'bg-gray-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => { setActiveTab('active'); setCurrentPage(0); }}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'active' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              ✅ Đang hoạt động
            </button>
            <button
              onClick={() => { setActiveTab('inactive'); setCurrentPage(0); }}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'inactive' ? 'bg-yellow-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              ⏸️ Không hoạt động
            </button>
            <button
              onClick={() => { setActiveTab('expired'); setCurrentPage(0); }}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'expired' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              ⏰ Đã hết hạn
            </button>
          </div>

          {/* Search */}
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm khuyến mãi..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
          />
        </div>

        {/* Promotions List */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-600"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-600">
              <p>Không thể tải danh sách khuyến mãi</p>
            </div>
          ) : filteredPromotions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>Không có khuyến mãi nào</p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {filteredPromotions.map((promo) => (
                  <div key={promo.id} className="border-2 border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-xl font-bold text-gray-900">{promo.name}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            promo.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {promo.status === 'ACTIVE' ? '✅ Hoạt động' : '⏸️ Tạm dừng'}
                          </span>
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800">
                            {promo.issuer === 'PLATFORM' ? '🌐 Nền tảng' : '🏪 Cửa hàng'}
                          </span>
                        </div>

                        <p className="text-gray-600 mb-4">{promo.description}</p>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div>
                            <span className="text-sm text-gray-600">Giảm giá:</span>
                            <p className="font-bold text-slate-700">
                              {promo.discountType === 'PERCENTAGE' 
                                ? `${promo.discountValue}%` 
                                : formatPrice(promo.discountValue)}
                            </p>
                          </div>
                          {promo.maxDiscountAmount && (
                            <div>
                              <span className="text-sm text-gray-600">Tối đa:</span>
                              <p className="font-bold">{formatPrice(promo.maxDiscountAmount)}</p>
                            </div>
                          )}
                          {promo.minOrderValue && (
                            <div>
                              <span className="text-sm text-gray-600">Đơn tối thiểu:</span>
                              <p className="font-bold">{formatPrice(promo.minOrderValue)}</p>
                            </div>
                          )}
                          {promo.usageLimit && (
                            <div>
                              <span className="text-sm text-gray-600">Lượt dùng:</span>
                              <p className="font-bold">{promo.usedCount || 0} / {promo.usageLimit}</p>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>🗓️ Từ: <strong>{formatDate(promo.startDate)}</strong></span>
                          <span>→</span>
                          <span>🗓️ Đến: <strong>{formatDate(promo.endDate)}</strong></span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => handleToggleActive(promo.id, promo.isActive)}
                          className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap ${
                            promo.isActive 
                              ? 'bg-yellow-600 text-white hover:bg-yellow-700' 
                              : 'bg-green-600 text-white hover:bg-green-700'
                          }`}
                        >
                          {promo.isActive ? '⏸️ Tạm dừng' : '▶️ Kích hoạt'}
                        </button>
                        <button
                          onClick={() => handleDelete(promo.id)}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                        >
                          🗑️ Xóa
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-6 pt-6 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Trang <span className="font-medium">{currentPage + 1}</span> / <span className="font-medium">{totalPages}</span>
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
                      onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                      disabled={currentPage >= totalPages - 1}
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

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Tạo khuyến mãi nền tảng</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tên khuyến mãi *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Loại giảm giá *</label>
                  <select
                    value={formData.discountType}
                    onChange={(e) => setFormData({...formData, discountType: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="PERCENTAGE">Phần trăm (%)</option>
                    <option value="FIXED_AMOUNT">Số tiền cố định (VNĐ)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Giá trị giảm *</label>
                  <input
                    type="number"
                    value={formData.discountValue}
                    onChange={(e) => setFormData({...formData, discountValue: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Giảm tối đa (VNĐ)</label>
                  <input
                    type="number"
                    value={formData.maxDiscountAmount}
                    onChange={(e) => setFormData({...formData, maxDiscountAmount: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Đơn tối thiểu (VNĐ)</label>
                  <input
                    type="number"
                    value={formData.minOrderValue}
                    onChange={(e) => setFormData({...formData, minOrderValue: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Số lượt sử dụng</label>
                <input
                  type="number"
                  value={formData.usageLimit}
                  onChange={(e) => setFormData({...formData, usageLimit: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ngày bắt đầu *</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ngày kết thúc *</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={handleCreate}
                className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800"
              >
                Tạo khuyến mãi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPromotions;

/// ĐÃ KHÔI PHỤC



