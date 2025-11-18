import React, { useState } from 'react';
import useSWR from 'swr';
import StoreLayout from '../../layouts/StoreLayout';
import StoreStatusGuard from '../../components/store/StoreStatusGuard';
import StorePageHeader from '../../components/store/StorePageHeader';
import { useStoreContext } from '../../context/StoreContext';
import { useToast } from '../../context/ToastContext';
import {
  getStorePromotions,
  getActivePromotions,
  getInactivePromotions,
  getExpiredPromotions,
  createPromotion,
  updatePromotion,
  activatePromotion,
  deactivatePromotion,
  deletePromotion
} from '../../services/b2c/b2cPromotionService';
import { getCategories } from '../../services/common/productService';

const StorePromotions = () => {
  const { currentStore, loading: storeLoading } = useStoreContext();
  const { success: showSuccess, error: showError } = useToast();
  const [filter, setFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPromo, setEditingPromo] = useState(null);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    code: '',
    description: '',
    type: 'PERCENTAGE',
    applicableFor: 'ORDER',
    discountType: 'ORDER',
    discountValue: '',
    startDate: '',
    endDate: '',
    minOrderValue: '',
    maxDiscountValue: '',
    usageLimit: '',
    usageLimitPerUser: '',
    isNewUserOnly: false,
    categoryId: ''
  });
  const pageSize = 20;

  // ✅ Fetch categories để hiển thị trong dropdown
  const { data: categoriesData } = useSWR(
    'categories-all',
    async () => {
      const result = await getCategories();
      return result.success ? result.data : [];
    },
    { revalidateOnFocus: false }
  );
  const categories = categoriesData || [];

  // ✅ Fetch promotions từ API dựa vào filter
  const { data: promotionsData, error, isLoading, mutate } = useSWR(
    currentStore?.id ? ['store-promotions', currentStore.id, filter, currentPage] : null,
    async () => {
      if (filter === 'ACTIVE') return await getActivePromotions(currentStore.id);
      if (filter === 'INACTIVE') return await getInactivePromotions(currentStore.id);
      if (filter === 'EXPIRED') return await getExpiredPromotions(currentStore.id);
      return await getStorePromotions(currentStore.id, { page: currentPage, size: pageSize });
    },
    { revalidateOnFocus: false }
  );

  const promotions = promotionsData?.success ? (promotionsData.data?.content || promotionsData.data || []) : [];
  const totalPages = promotionsData?.data?.totalPages || 0;
  const totalElements = promotionsData?.data?.totalElements || promotions.length;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const handleActivate = async (id) => {
    const result = await activatePromotion(id);
    if (result.success) {
      showSuccess(result.message);
      mutate();
    } else {
      showError(result.error);
    }
  };

  const handleDeactivate = async (id) => {
    const result = await deactivatePromotion(id);
    if (result.success) {
      showSuccess(result.message);
      mutate();
    } else {
      showError(result.error);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa khuyến mãi này?')) return;
    
    const result = await deletePromotion(id);
    if (result.success) {
      showSuccess(result.message);
      mutate();
    } else {
      showError(result.error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const handleEdit = (promo) => {
    setEditingPromo(promo);
    // Convert date to YYYY-MM-DDTHH:mm format for datetime-local input
    const formatDateForInput = (dateString) => {
      if (!dateString) return '';
      try {
        const date = new Date(dateString);
        // Check if date is valid
        if (isNaN(date.getTime())) {
          console.warn('Invalid date:', dateString);
          return '';
        }
        // Format: YYYY-MM-DDTHH:mm
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
      } catch (error) {
        console.error('Error formatting date:', error, dateString);
        return '';
      }
    };
    
    setFormData({
      title: promo.title || promo.name || '',
      code: promo.code || '',
      description: promo.description || '',
      type: promo.type || 'PERCENTAGE',
      applicableFor: promo.applicableFor || 'ORDER',
      discountType: promo.discountType || 'ORDER',
      discountValue: promo.discountValue || '',
      startDate: formatDateForInput(promo.startDate),
      endDate: formatDateForInput(promo.endDate),
      minOrderValue: promo.minOrderValue || '',
      maxDiscountValue: promo.maxDiscountValue || promo.maxDiscountAmount || '',
      usageLimit: promo.usageLimit || promo.maxUsageCount || '',
      usageLimitPerUser: promo.usageLimitPerUser || promo.maxUsagePerUser || '',
      isNewUserOnly: promo.isNewUserOnly || false,
      categoryId: promo.categoryId || promo.category?.id || ''
    });
    setShowEditModal(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingPromo) return;
    
    setUpdating(true);
    // Convert date to ISO format
    const formatDateForAPI = (dateString) => {
      if (!dateString) return '';
      return new Date(dateString).toISOString();
    };

    // Build request data
    const requestData = {
      title: formData.title,
      code: formData.code.toUpperCase(),
      description: formData.description,
      type: formData.type,
      applicableFor: formData.applicableFor,
      discountType: formData.discountType,
      discountValue: parseInt(formData.discountValue),
      startDate: formatDateForAPI(formData.startDate),
      endDate: formatDateForAPI(formData.endDate),
      ...(formData.minOrderValue && { minOrderValue: parseInt(formData.minOrderValue) }),
      ...(formData.maxDiscountValue && { maxDiscountValue: parseInt(formData.maxDiscountValue) }),
      ...(formData.usageLimit && { usageLimit: parseInt(formData.usageLimit) }),
      ...(formData.usageLimitPerUser && { usageLimitPerUser: parseInt(formData.usageLimitPerUser) }),
      isNewUserOnly: formData.isNewUserOnly,
    };

    // Add categoryId if discountType is CATEGORY
    if (formData.discountType === 'CATEGORY' && formData.categoryId) {
      requestData.categoryId = formData.categoryId;
    }

    console.log('📝 Update promotion data:', requestData);

    try {
      const result = await updatePromotion(editingPromo.id, requestData);
      setUpdating(false);

      if (result.success) {
        showSuccess(result.message || 'Cập nhật khuyến mãi thành công!');
        setShowEditModal(false);
        setEditingPromo(null);
        resetForm();
        mutate();
      } else {
        const errorMsg = result.error || result.message || 'Không thể cập nhật khuyến mãi';
        console.error('❌ Update error:', errorMsg);
        showError(errorMsg);
      }
    } catch (error) {
      setUpdating(false);
      console.error('❌ Update exception:', error);
      showError(error.message || 'Có lỗi xảy ra khi cập nhật khuyến mãi');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      code: '',
      description: '',
      type: 'PERCENTAGE',
      applicableFor: 'ORDER',
      discountType: 'ORDER',
      discountValue: '',
      startDate: '',
      endDate: '',
      minOrderValue: '',
      maxDiscountValue: '',
      usageLimit: '',
      usageLimitPerUser: '',
      isNewUserOnly: false,
      categoryId: ''
    });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    
    setCreating(true);
    // Convert date to ISO format
    const formatDateForAPI = (dateString) => {
      if (!dateString) return '';
      return new Date(dateString).toISOString();
    };

    // Build request data
    const requestData = {
      title: formData.title,
      code: formData.code.toUpperCase(),
      description: formData.description,
      type: formData.type,
      applicableFor: formData.applicableFor,
      discountType: formData.discountType,
      discountValue: parseInt(formData.discountValue),
      startDate: formatDateForAPI(formData.startDate),
      endDate: formatDateForAPI(formData.endDate),
      ...(formData.minOrderValue && { minOrderValue: parseInt(formData.minOrderValue) }),
      ...(formData.maxDiscountValue && { maxDiscountValue: parseInt(formData.maxDiscountValue) }),
      ...(formData.usageLimit && { usageLimit: parseInt(formData.usageLimit) }),
      ...(formData.usageLimitPerUser && { usageLimitPerUser: parseInt(formData.usageLimitPerUser) }),
      isNewUserOnly: formData.isNewUserOnly,
    };

    // Add categoryId if discountType is CATEGORY
    if (formData.discountType === 'CATEGORY' && formData.categoryId) {
      requestData.categoryId = formData.categoryId;
    }

    console.log('📝 Create promotion data:', requestData);

    try {
      const result = await createPromotion(currentStore.id, requestData);
      setCreating(false);

      if (result.success) {
        showSuccess(result.message || 'Tạo khuyến mãi thành công!');
        setShowCreateModal(false);
        resetForm();
        mutate();
      } else {
        const errorMsg = result.error || result.message || 'Không thể tạo khuyến mãi';
        console.error('❌ Create error:', errorMsg);
        showError(errorMsg);
      }
    } catch (error) {
      setCreating(false);
      console.error('❌ Create exception:', error);
      showError(error.message || 'Có lỗi xảy ra khi tạo khuyến mãi');
    }
  };

  return (
    <StoreStatusGuard currentStore={currentStore} pageName="quản lý khuyến mãi" loading={storeLoading}>
      <StoreLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="mb-8">
            <div className="bg-gradient-to-r from-cyan-200 to-blue-200 rounded-2xl p-6">
              <div className="relative bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-400 rounded-xl flex items-center justify-center">
                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/>
                      </svg>
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold">
                        <span className="text-cyan-600">Quản lý</span> <span className="text-blue-600">khuyến mãi</span>
                      </h1>
                      <p className="text-gray-600 mt-1">Quản lý danh sách khuyến mãi của cửa hàng</p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg transition-all flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/>
                    </svg>
                    Tạo Khuyến mãi Mới
                  </button>
                </div>
                
                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mt-4">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-3 border border-blue-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center shadow-sm">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-600 truncate">Tổng khuyến mãi</p>
                        <p className="text-lg font-bold text-gray-900">{totalElements}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-3 border border-green-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center shadow-sm">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-600 truncate">Đang hoạt động</p>
                        <p className="text-lg font-bold text-gray-900">{promotions.filter(p => p.status === 'ACTIVE').length}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-3 border border-yellow-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center shadow-sm">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-600 truncate">Tạm dừng</p>
                        <p className="text-lg font-bold text-gray-900">{promotions.filter(p => p.status === 'INACTIVE').length}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl p-3 border border-pink-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-pink-500 rounded-lg flex items-center justify-center shadow-sm">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-600 truncate">Hết hạn</p>
                        <p className="text-lg font-bold text-gray-900">{promotions.filter(p => p.isExpired).length}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Filter */}
          <div className="bg-white rounded-xl shadow-sm p-3 border border-gray-100">
            <select
              value={filter}
              onChange={(e) => { setFilter(e.target.value); setCurrentPage(0); }}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white w-full max-w-xs"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="ACTIVE">Đang hoạt động</option>
              <option value="INACTIVE">Tạm dừng</option>
              <option value="EXPIRED">Đã hết hạn</option>
            </select>
          </div>

          {/* Promotions Grid */}
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-600 bg-white rounded-xl">
              <p>Không thể tải danh sách khuyến mãi</p>
              <button
                onClick={() => mutate()}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Thử lại
              </button>
            </div>
          ) : promotions.length === 0 ? (
            <div className="col-span-full text-center py-12 bg-white rounded-xl">
              <div className="text-gray-300 text-5xl mb-3">🎯</div>
              <p className="text-gray-500 font-medium">Không tìm thấy khuyến mãi nào</p>
              <p className="text-gray-400 text-sm mt-1">Thử tạo khuyến mãi mới hoặc thay đổi bộ lọc</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {promotions.map((promo) => (
                  <div key={promo.id} className="group relative bg-white rounded-lg border-2 border-gray-200 overflow-hidden hover:border-purple-500 hover:shadow-lg transition-all duration-200">
                    {/* Status Badge - Top Right */}
                    <div className="absolute top-1.5 right-1.5 z-10">
                      {promo.status === 'ACTIVE' && (
                        <span className="px-1.5 py-0.5 bg-green-500 text-white text-[9px] font-bold rounded shadow-sm flex items-center gap-0.5">
                          <span className="w-1 h-1 bg-white rounded-full animate-pulse"></span>
                          ACTIVE
                        </span>
                      )}
                      {promo.status === 'INACTIVE' && (
                        <span className="px-1.5 py-0.5 bg-gray-400 text-white text-[9px] font-bold rounded shadow-sm">
                          PAUSED
                        </span>
                      )}
                      {promo.isExpired && (
                        <span className="px-1.5 py-0.5 bg-red-500 text-white text-[9px] font-bold rounded shadow-sm">
                          EXPIRED
                        </span>
                      )}
                    </div>

                    {/* Header with Gradient */}
                    <div className="relative bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 p-3 pt-5">
                      <div className="absolute inset-0 bg-black/5"></div>
                      <div className="relative">
                        <h3 className="text-sm font-bold text-white mb-1.5 line-clamp-2 min-h-[2.25rem] leading-tight">
                          {promo.title || promo.name || promo.code}
                        </h3>
                        <div className="inline-flex items-center gap-1 bg-white/25 backdrop-blur-sm px-2 py-0.5 rounded">
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                          <span className="text-white font-mono font-bold text-[10px]">{promo.code}</span>
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-3">
                      {/* Description */}
                      <p className="text-[11px] text-gray-600 mb-2.5 line-clamp-2 min-h-[1.75rem] leading-snug">
                        {promo.description || 'Không có mô tả'}
                      </p>
                      
                      {/* Discount Value - Compact */}
                      <div className="bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 rounded p-2.5 mb-2.5 border border-red-200">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-[9px] font-semibold text-gray-600">
                            {promo.type === 'PERCENTAGE' ? 'Theo %' : 'Số tiền cố định'}
                          </span>
                          <div className="flex items-baseline gap-0.5">
                            <span className="text-xl font-black text-red-600">{promo.discountValue}</span>
                            <span className="text-base font-bold text-red-500">
                              {promo.type === 'PERCENTAGE' ? '%' : '₫'}
                            </span>
                          </div>
                        </div>
                        {promo.maxDiscountValue && (
                          <div className="mt-1 pt-1 border-t border-red-200 text-[9px] text-gray-600">
                            Tối đa: {new Intl.NumberFormat('vi-VN').format(promo.maxDiscountValue)}₫
                          </div>
                        )}
                      </div>

                      {/* Date Info */}
                      <div className="space-y-1 mb-2.5 bg-gray-50 rounded p-2">
                        <div className="flex items-center justify-between text-[9px]">
                          <span className="text-gray-500 font-medium flex items-center gap-0.5">
                            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Bắt đầu:
                          </span>
                          <span className="text-gray-900 font-semibold">{formatDate(promo.startDate)}</span>
                        </div>
                        <div className="flex items-center justify-between text-[9px]">
                          <span className="text-gray-500 font-medium flex items-center gap-0.5">
                            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Kết thúc:
                          </span>
                          <span className="text-gray-900 font-semibold">{formatDate(promo.endDate)}</span>
                        </div>
                      </div>

                      {/* Usage Count */}
                      {promo.usageCount !== undefined && (
                        <div className="flex items-center justify-between mb-2.5 bg-blue-50 rounded p-1.5">
                          <span className="text-[9px] text-blue-700 font-medium flex items-center gap-0.5">
                            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            Đã sử dụng:
                          </span>
                          <span className="text-blue-900 font-bold text-[10px]">{promo.usageCount} lần</span>
                        </div>
                      )}

                      {/* Additional Info */}
                      <div className="mb-2.5 space-y-1">
                        {promo.minOrderValue && (
                          <div className="flex items-center justify-between text-[9px] bg-purple-50 rounded p-1">
                            <span className="text-purple-700 font-medium">Đơn tối thiểu:</span>
                            <span className="text-purple-900 font-bold">{new Intl.NumberFormat('vi-VN').format(promo.minOrderValue)}₫</span>
                          </div>
                        )}
                        {promo.discountType === 'CATEGORY' && promo.categoryName && (
                          <div className="flex items-center justify-between text-[9px] bg-indigo-50 rounded p-1">
                            <span className="text-indigo-700 font-medium">Áp dụng cho:</span>
                            <span className="text-indigo-900 font-bold truncate ml-1">{promo.categoryName}</span>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-1 pt-1.5 border-t border-gray-200">
                        <button
                          onClick={() => handleEdit(promo)}
                          className="flex-1 flex items-center justify-center gap-0.5 px-1.5 py-1.5 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-all font-semibold text-[10px] border border-blue-200 hover:shadow-sm"
                          title="Chỉnh sửa"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          <span className="hidden sm:inline">Sửa</span>
                        </button>
                        {promo.status === 'ACTIVE' && (
                          <button
                            onClick={() => handleDeactivate(promo.id)}
                            className="px-1.5 py-1.5 bg-yellow-50 text-yellow-700 rounded hover:bg-yellow-100 transition-all font-semibold text-[10px] border border-yellow-200 hover:shadow-sm"
                            title="Tạm dừng"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </button>
                        )}
                        {promo.status === 'INACTIVE' && (
                          <button
                            onClick={() => handleActivate(promo.id)}
                            className="px-1.5 py-1.5 bg-green-50 text-green-700 rounded hover:bg-green-100 transition-all font-semibold text-[10px] border border-green-200 hover:shadow-sm"
                            title="Kích hoạt"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(promo.id)}
                          className="px-1.5 py-1.5 bg-red-50 text-red-700 rounded hover:bg-red-100 transition-all font-semibold text-[10px] border border-red-200 hover:shadow-sm"
                          title="Xóa"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ✅ CREATE MODAL */}
          {showCreateModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
              <div className="bg-white rounded-2xl max-w-4xl w-full p-8 my-8 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Tạo khuyến mãi mới
                  </h2>
          <button
                    onClick={() => { setShowCreateModal(false); resetForm(); }}
                    className="text-gray-400 hover:text-gray-600 text-2xl w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100"
          >
                    ✕
          </button>
        </div>

                <form onSubmit={handleCreate} className="space-y-6">
                  {/* Basic Info */}
                  <div className="grid grid-cols-2 gap-4">
          <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Tên khuyến mãi <span className="text-red-600">*</span>
                      </label>
            <input
              type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        required
                        placeholder="VD: Giảm giá mùa hè"
                        className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
          </div>
          <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Mã khuyến mãi <span className="text-red-600">*</span>
                        <span className="text-xs text-gray-500 ml-2">(4-20 ký tự, chữ hoa và số)</span>
                      </label>
              <input
                        type="text"
                        name="code"
                        value={formData.code}
                        onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') }))}
                        required
                        pattern="^[A-Z0-9]{4,20}$"
                        placeholder="VD: SUMMER2024"
                        className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-mono"
              />
            </div>
          </div>

            <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Mô tả <span className="text-red-600">*</span>
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      required
                      rows={3}
                      placeholder="Mô tả chi tiết về chương trình khuyến mãi..."
                      className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
              />
            </div>

                  {/* Discount Settings */}
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border-2 border-blue-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">⚙️ Cài đặt giảm giá</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Loại giảm giá <span className="text-red-600">*</span>
                        </label>
                        <select
                          name="type"
                          value={formData.type}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="PERCENTAGE">Theo phần trăm (%)</option>
                          <option value="FIXED_AMOUNT">Số tiền cố định (₫)</option>
                        </select>
                      </div>
            <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Giá trị giảm <span className="text-red-600">*</span>
                      </label>
              <input
                type="number"
                        name="discountValue"
                        value={formData.discountValue}
                        onChange={handleInputChange}
                        required
                          min="1"
                          placeholder={formData.type === 'PERCENTAGE' ? "10" : "100000"}
                          className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Áp dụng cho <span className="text-red-600">*</span>
                        </label>
                        <select
                          name="applicableFor"
                          value={formData.applicableFor}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="ORDER">Đơn hàng</option>
                          <option value="SHIPPING">Vận chuyển</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Loại áp dụng <span className="text-red-600">*</span>
                        </label>
                        <select
                          name="discountType"
                          value={formData.discountType}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="ORDER">Toàn bộ đơn hàng</option>
                          <option value="CATEGORY">Theo danh mục</option>
                        </select>
                      </div>
                      {formData.discountType === 'CATEGORY' && (
                        <div className="col-span-2">
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Danh mục <span className="text-red-600">*</span>
                          </label>
                          <select
                            name="categoryId"
                            value={formData.categoryId}
                            onChange={handleInputChange}
                            required={formData.discountType === 'CATEGORY'}
                            className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">-- Chọn danh mục --</option>
                            {categories.map((category) => (
                              <option key={category.id} value={category.id}>
                                {category.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Advanced Settings */}
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">🎯 Cài đặt nâng cao</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Đơn tối thiểu (₫)
                        </label>
                        <input
                          type="number"
                          name="minOrderValue"
                          value={formData.minOrderValue}
                          onChange={handleInputChange}
                          min="0"
                          placeholder="VD: 100000"
                          className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Giảm tối đa (₫)
                        </label>
                        <input
                          type="number"
                          name="maxDiscountValue"
                          value={formData.maxDiscountValue}
                          onChange={handleInputChange}
                        min="0"
                          placeholder="VD: 200000"
                          className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Giới hạn sử dụng
                        </label>
                        <input
                          type="number"
                          name="usageLimit"
                          value={formData.usageLimit}
                          onChange={handleInputChange}
                          min="1"
                          placeholder="VD: 100"
                          className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Giới hạn/người dùng
                        </label>
                        <input
                          type="number"
                          name="usageLimitPerUser"
                          value={formData.usageLimitPerUser}
                          onChange={handleInputChange}
                          min="1"
                          placeholder="VD: 1"
                          className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            name="isNewUserOnly"
                            checked={formData.isNewUserOnly}
                            onChange={handleInputChange}
                            className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm font-semibold text-gray-700">Chỉ dành cho người dùng mới</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Date Range */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Ngày bắt đầu <span className="text-red-600">*</span>
                      </label>
              <input
                        type="datetime-local"
                        name="startDate"
                        value={formData.startDate}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Ngày kết thúc <span className="text-red-600">*</span>
                      </label>
              <input
                        type="datetime-local"
                        name="endDate"
                        value={formData.endDate}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

                  <div className="flex gap-4 pt-4 border-t border-gray-200">
            <button
              type="button"
                      onClick={() => { setShowCreateModal(false); resetForm(); }}
                      className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 font-semibold transition-all"
            >
              Hủy
            </button>
            <button
              type="submit"
                      disabled={creating}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 font-semibold disabled:opacity-50 transition-all shadow-lg hover:shadow-xl"
                    >
                      {creating ? '⏳ Đang tạo...' : '✅ Tạo khuyến mãi'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ✅ EDIT MODAL */}
          {showEditModal && editingPromo && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
              <div className="bg-white rounded-2xl max-w-4xl w-full p-8 my-8 shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Chỉnh sửa khuyến mãi
                  </h2>
                  <button
                    onClick={() => { setShowEditModal(false); setEditingPromo(null); resetForm(); }}
                    className="text-gray-400 hover:text-gray-600 text-2xl w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleUpdate} className="space-y-6">
                  {/* Same form fields as create */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Tên khuyến mãi <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Mã khuyến mãi <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="text"
                        name="code"
                        value={formData.code}
                        onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') }))}
                        required
                        pattern="^[A-Z0-9]{4,20}$"
                        className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Mô tả <span className="text-red-600">*</span>
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      required
                      rows={3}
                      className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
                    />
                  </div>

                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border-2 border-purple-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">⚙️ Cài đặt giảm giá</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Loại giảm giá <span className="text-red-600">*</span>
                        </label>
                        <select
                          name="type"
                          value={formData.type}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500"
                        >
                          <option value="PERCENTAGE">Theo phần trăm (%)</option>
                          <option value="FIXED_AMOUNT">Số tiền cố định (₫)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Giá trị giảm <span className="text-red-600">*</span>
                        </label>
                        <input
                          type="number"
                          name="discountValue"
                          value={formData.discountValue}
                          onChange={handleInputChange}
                          required
                          min="1"
                          className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Áp dụng cho <span className="text-red-600">*</span>
                        </label>
                        <select
                          name="applicableFor"
                          value={formData.applicableFor}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500"
                        >
                          <option value="ORDER">Đơn hàng</option>
                          <option value="SHIPPING">Vận chuyển</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Loại áp dụng <span className="text-red-600">*</span>
                        </label>
                        <select
                          name="discountType"
                          value={formData.discountType}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500"
                        >
                          <option value="ORDER">Toàn bộ đơn hàng</option>
                          <option value="CATEGORY">Theo danh mục</option>
                        </select>
                      </div>
                      {formData.discountType === 'CATEGORY' && (
                        <div className="col-span-2">
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Danh mục <span className="text-red-600">*</span>
                          </label>
                          <select
                            name="categoryId"
                            value={formData.categoryId}
                            onChange={handleInputChange}
                            required={formData.discountType === 'CATEGORY'}
                            className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          >
                            <option value="">-- Chọn danh mục --</option>
                            {categories.map((category) => (
                              <option key={category.id} value={category.id}>
                                {category.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">🎯 Cài đặt nâng cao</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Đơn tối thiểu (₫)
                        </label>
                        <input
                          type="number"
                          name="minOrderValue"
                          value={formData.minOrderValue}
                          onChange={handleInputChange}
                          min="0"
                          className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Giảm tối đa (₫)
                        </label>
                        <input
                          type="number"
                          name="maxDiscountValue"
                          value={formData.maxDiscountValue}
                          onChange={handleInputChange}
                          min="0"
                          className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Giới hạn sử dụng
                        </label>
                        <input
                          type="number"
                          name="usageLimit"
                          value={formData.usageLimit}
                          onChange={handleInputChange}
                          min="1"
                          className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Giới hạn/người dùng
                        </label>
                        <input
                          type="number"
                          name="usageLimitPerUser"
                          value={formData.usageLimitPerUser}
                          onChange={handleInputChange}
                          min="1"
                          className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            name="isNewUserOnly"
                            checked={formData.isNewUserOnly}
                            onChange={handleInputChange}
                            className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                          />
                          <span className="text-sm font-semibold text-gray-700">Chỉ dành cho người dùng mới</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Ngày bắt đầu <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="datetime-local"
                        name="startDate"
                        value={formData.startDate}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Ngày kết thúc <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="datetime-local"
                        name="endDate"
                        value={formData.endDate}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => { setShowEditModal(false); setEditingPromo(null); resetForm(); }}
                      className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 font-semibold transition-all"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      disabled={updating}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 font-semibold disabled:opacity-50 transition-all shadow-lg hover:shadow-xl"
                    >
                      {updating ? '⏳ Đang cập nhật...' : '💾 Lưu thay đổi'}
            </button>
          </div>
        </form>
      </div>
            </div>
          )}
      </div>
    </StoreLayout>
    </StoreStatusGuard>
  );
};

export default StorePromotions;

