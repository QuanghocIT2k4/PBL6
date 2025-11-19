import React, { useState } from 'react';
import useSWR from 'swr';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
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
  const [issuerFilter, setIssuerFilter] = useState('all'); // 'all' | 'platform' | 'store'
  const [currentPage, setCurrentPage] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [promotionToDelete, setPromotionToDelete] = useState(null);
  const pageSize = 20;

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    code: '',
    type: 'PERCENTAGE',
    applicableFor: 'ORDER',
    discountType: 'ORDER',
    discountValue: '',
    minOrderValue: '',
    maxDiscountValue: '',
    usageLimit: '',
    usageLimitPerUser: '',
    isNewUserOnly: false,
    categoryId: '',
    startDate: '',
    endDate: '',
  });

  // Fetch all promotions (filter ở client-side)
  const { data, error, isLoading, mutate } = useSWR(
    ['admin-promotions', currentPage],
    () => getAllPromotions({ page: currentPage, size: pageSize }),
    { revalidateOnFocus: false }
  );

  const allPromotions = data?.success ? (data.data?.content || data.data || []) : [];
  const totalPages = data?.data?.totalPages || 0;
  const totalElements = data?.data?.totalElements || 0;

  // 🔍 DEBUG: Check issuer field
  if (allPromotions.length > 0) {
    console.log('🔍 Total promotions:', allPromotions.length);
    console.log('🔍 Sample promotion:', allPromotions[0]);
    console.log('🔍 Issuer values:', allPromotions.map(p => p.issuer));
  }

  // Helper: Check if expired
  const isExpired = (promo) => {
    return new Date(promo.endDate) < new Date();
  };

  // Helper: Get status
  const getPromotionStatus = (promo) => {
    const now = new Date();
    const startDate = new Date(promo.startDate);
    const endDate = new Date(promo.endDate);

    // Check if expired (endDate < now)
    if (endDate < now) {
      return { label: 'EXPIRED', color: 'from-red-500 to-pink-500', isExpired: true };
    }

    // Check if upcoming (startDate > now)
    if (startDate > now) {
      return { label: 'UPCOMING', color: 'from-yellow-500 to-orange-500', isExpired: false };
    }

    // Check active/inactive (trong thời gian startDate - endDate)
    if (promo.status === 'ACTIVE') {
      return { label: 'ACTIVE', color: 'from-green-500 to-emerald-500', isExpired: false };
    }
    
    return { label: 'INACTIVE', color: 'from-gray-400 to-gray-500', isExpired: false };
  };

  // Filter by activeTab (client-side)
  let promotions = allPromotions;
  
  if (activeTab === 'active') {
    promotions = promotions.filter(p => 
      !isExpired(p) && 
      new Date(p.startDate) <= new Date() && 
      p.status === 'ACTIVE'
    );
  } else if (activeTab === 'inactive') {
    promotions = promotions.filter(p => 
      !isExpired(p) && 
      new Date(p.startDate) <= new Date() && 
      p.status === 'INACTIVE'
    );
  } else if (activeTab === 'upcoming') {
    promotions = promotions.filter(p => new Date(p.startDate) > new Date());
  } else if (activeTab === 'expired') {
    promotions = promotions.filter(p => isExpired(p));
  }

  // Filter by issuer
  if (issuerFilter === 'platform') {
    promotions = promotions.filter(p => p.issuer === 'PLATFORM');
  } else if (issuerFilter === 'store') {
    promotions = promotions.filter(p => p.issuer === 'STORE');
  }

  // Separate platform and store promotions
  const platformPromotions = promotions.filter(p => p.issuer === 'PLATFORM');
  const storePromotions = promotions.filter(p => p.issuer === 'STORE');

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
  const handleDeleteClick = (promo) => {
    setPromotionToDelete(promo);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!promotionToDelete) return;

    const result = await deletePromotion(promotionToDelete.id);

    if (result.success) {
      showToast('Xóa khuyến mãi thành công!', 'success');
      setShowDeleteModal(false);
      setPromotionToDelete(null);
      mutate();
    } else {
      showToast(result.error || 'Không thể xóa khuyến mãi', 'error');
    }
  };

  // Handle create
  const handleCreate = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.title || !formData.code || !formData.discountValue || !formData.startDate || !formData.endDate) {
      showToast('Vui lòng điền đầy đủ thông tin bắt buộc', 'error');
      return;
    }

    // Prepare data
    const payload = {
      title: formData.title,
      description: formData.description,
      code: formData.code.toUpperCase(),
      type: formData.type,
      applicableFor: formData.applicableFor,
      discountType: formData.discountType,
      discountValue: parseInt(formData.discountValue),
      startDate: new Date(formData.startDate).toISOString(),
      endDate: new Date(formData.endDate).toISOString(),
      minOrderValue: formData.minOrderValue ? parseInt(formData.minOrderValue) : undefined,
      maxDiscountValue: formData.maxDiscountValue ? parseInt(formData.maxDiscountValue) : undefined,
      usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : undefined,
      usageLimitPerUser: formData.usageLimitPerUser ? parseInt(formData.usageLimitPerUser) : undefined,
      isNewUserOnly: formData.isNewUserOnly,
      categoryId: formData.discountType === 'CATEGORY' && formData.categoryId ? formData.categoryId : undefined,
    };

    const result = await createPlatformPromotion(payload);

    if (result.success) {
      showToast('Tạo khuyến mãi nền tảng thành công! Nhấn "Kích hoạt" để bắt đầu sử dụng.', 'success');
      setShowCreateModal(false);
      resetForm();
      mutate();
    } else {
      showToast(result.error, 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      code: '',
      type: 'PERCENTAGE',
      applicableFor: 'ORDER',
      discountType: 'ORDER',
      discountValue: '',
      minOrderValue: '',
      maxDiscountValue: '',
      usageLimit: '',
      usageLimitPerUser: '',
      isNewUserOnly: false,
      categoryId: '',
      startDate: '',
      endDate: '',
    });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <AdminPageHeader 
        icon="🎁"
        title="Quản lý Khuyến mãi"
        subtitle="Quản lý khuyến mãi nền tảng và cửa hàng"
        action={
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-xl hover:from-teal-700 hover:to-emerald-700 font-bold transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
          >
            <span className="text-xl">➕</span>
            Tạo khuyến mãi
          </button>
        }
      />

      {/* Filter Tabs */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex flex-wrap gap-2">
            {/* Issuer Filters */}
            <button
              onClick={() => setIssuerFilter('all')}
              className={`px-5 py-2.5 rounded-xl font-semibold transition-all flex items-center gap-2 ${
                issuerFilter === 'all' 
                  ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${issuerFilter === 'all' ? 'bg-white' : 'bg-purple-500'}`}></span>
              Tất cả
            </button>
            <button
              onClick={() => setIssuerFilter('platform')}
              className={`px-5 py-2.5 rounded-xl font-semibold transition-all flex items-center gap-2 ${
                issuerFilter === 'platform' 
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white shadow-lg' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${issuerFilter === 'platform' ? 'bg-white' : 'bg-blue-500'}`}></span>
              Platform
            </button>
            <button
              onClick={() => setIssuerFilter('store')}
              className={`px-5 py-2.5 rounded-xl font-semibold transition-all flex items-center gap-2 ${
                issuerFilter === 'store' 
                  ? 'bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-lg' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${issuerFilter === 'store' ? 'bg-white' : 'bg-teal-500'}`}></span>
              Store
            </button>

            <div className="w-px h-8 bg-gray-300 mx-2"></div>

            {/* Status Filters */}
            <button
              onClick={() => { setActiveTab('all'); setCurrentPage(0); }}
              className={`px-5 py-2.5 rounded-xl font-semibold transition-all flex items-center gap-2 ${
                activeTab === 'all' ? 'bg-gradient-to-r from-gray-600 to-gray-700 text-white shadow-lg' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${activeTab === 'all' ? 'bg-white' : 'bg-gray-600'}`}></span>
              Tất cả
            </button>
            <button
              onClick={() => { setActiveTab('active'); setCurrentPage(0); }}
              className={`px-5 py-2.5 rounded-xl font-semibold transition-all flex items-center gap-2 ${
                activeTab === 'active' ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${activeTab === 'active' ? 'bg-white' : 'bg-green-500'}`}></span>
              Đang hoạt động
            </button>
            <button
              onClick={() => { setActiveTab('inactive'); setCurrentPage(0); }}
              className={`px-5 py-2.5 rounded-xl font-semibold transition-all flex items-center gap-2 ${
                activeTab === 'inactive' ? 'bg-gradient-to-r from-yellow-500 to-amber-600 text-white shadow-lg' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${activeTab === 'inactive' ? 'bg-white' : 'bg-yellow-500'}`}></span>
              Tạm dừng
            </button>
            <button
              onClick={() => { setActiveTab('upcoming'); setCurrentPage(0); }}
              className={`px-5 py-2.5 rounded-xl font-semibold transition-all flex items-center gap-2 ${
                activeTab === 'upcoming' ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${activeTab === 'upcoming' ? 'bg-white' : 'bg-orange-500'}`}></span>
              Sắp diễn ra
            </button>
            <button
              onClick={() => { setActiveTab('expired'); setCurrentPage(0); }}
              className={`px-5 py-2.5 rounded-xl font-semibold transition-all flex items-center gap-2 ${
                activeTab === 'expired' ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-lg' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${activeTab === 'expired' ? 'bg-white' : 'bg-pink-500'}`}></span>
              Đã hết hạn
            </button>
          </div>
        </div>

        {/* Promotions Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-600"></div>
          </div>
        ) : error ? (
          <div className="text-center py-12 text-red-600">
            <p>Không thể tải danh sách khuyến mãi</p>
          </div>
        ) : (
          <>
            {/* Platform Promotions Section */}
            {(issuerFilter === 'all' || issuerFilter === 'platform') && platformPromotions.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <span className="text-blue-600">🌐</span>
                  <span>Khuyến mãi Nền tảng</span>
                  <span className="text-sm font-normal text-gray-500">({platformPromotions.length})</span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {platformPromotions.map((promo) => {
                    const status = getPromotionStatus(promo);
                    return (
                      <div key={promo.id} className="group relative bg-white rounded-2xl overflow-hidden hover:shadow-2xl transition-all duration-300 flex flex-col border-2 border-gray-100 hover:border-transparent min-h-[420px]">
                        {/* Status Badge */}
                        <div className="absolute top-3 right-3 z-10">
                          <span className={`px-2 py-1 bg-gradient-to-r ${status.color} text-white text-xs font-bold rounded-lg shadow-lg ${status.label === 'ACTIVE' ? 'flex items-center gap-1' : ''}`}>
                            {status.label === 'ACTIVE' && <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>}
                            {status.label}
                          </span>
                        </div>

                        {/* Header - Blue/Purple Gradient for Platform */}
                        <div className="relative bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 p-4 pt-6">
                          <div className="absolute inset-0 bg-white/5"></div>
                          <div className="relative">
                            <h3 className="text-sm font-bold text-white mb-1.5 line-clamp-2 min-h-[2.25rem] leading-tight drop-shadow">
                              {promo.title || promo.name || promo.code}
                            </h3>
                            <div className="inline-flex items-center gap-1 bg-white/25 backdrop-blur-sm px-2 py-0.5 rounded shadow-sm">
                              <span className="text-[10px] font-bold text-white/90">{promo.code}</span>
                            </div>
                          </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 p-4 flex flex-col">
                          {/* Discount Value */}
                          <div className="relative bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 rounded-lg p-2.5 mb-2 shadow-md">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="text-[9px] font-semibold text-white/80 uppercase">
                                  {promo.type === 'PERCENTAGE' ? 'Giảm giá' : 'Giảm tiền'}
                                </div>
                              </div>
                              <div className="flex items-baseline gap-0.5 bg-white/15 backdrop-blur-sm px-2.5 py-1 rounded-md">
                                <span className="text-lg font-black text-white drop-shadow">{promo.discountValue}</span>
                                <span className="text-sm font-bold text-white/90">
                                  {promo.type === 'PERCENTAGE' ? '%' : '₫'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Description */}
                          <p className="text-[11px] text-gray-600 mb-2 line-clamp-2 flex-shrink-0 leading-snug">
                            {promo.description || 'Không có mô tả'}
                          </p>

                          {/* Date Info */}
                          <div className="space-y-1 mb-2 flex-shrink-0">
                            <div className="flex items-center justify-between text-[10px] bg-blue-50 rounded-lg p-1.5">
                              <span className="text-blue-700 font-medium">Bắt đầu:</span>
                              <span className="text-blue-900 font-bold">{formatDate(promo.startDate)}</span>
                            </div>
                            <div className="flex items-center justify-between text-[10px] bg-purple-50 rounded-lg p-1.5">
                              <span className="text-purple-700 font-medium">Kết thúc:</span>
                              <span className="text-purple-900 font-bold">{formatDate(promo.endDate)}</span>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-2 mt-auto pt-3 border-t-2 border-gray-100">
                            {isExpired(promo) ? (
                              <button disabled className="px-3 py-2 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed font-semibold text-xs">
                                Đã hết hạn
                              </button>
                            ) : promo.status === 'ACTIVE' ? (
                              <button
                                onClick={() => handleToggleActive(promo.id, true)}
                                className="flex-1 px-3 py-2 bg-gradient-to-r from-slate-500 to-gray-500 text-white rounded-lg hover:from-slate-600 hover:to-gray-600 transition-all font-semibold text-xs"
                              >
                                Tạm dừng
                              </button>
                            ) : (
                              <button
                                onClick={() => handleToggleActive(promo.id, false)}
                                className="flex-1 px-3 py-2 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-lg hover:from-teal-600 hover:to-cyan-600 transition-all font-semibold text-xs"
                              >
                                Kích hoạt
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteClick(promo)}
                              className="px-3 py-2 bg-gradient-to-r from-rose-500 to-red-500 text-white rounded-lg hover:from-rose-600 hover:to-red-600 transition-all font-semibold text-xs"
                            >
                              Xóa
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Store Promotions Section */}
            {(issuerFilter === 'all' || issuerFilter === 'store') && storePromotions.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mt-6">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <span className="text-orange-600">🏪</span>
                  <span>Khuyến mãi Cửa hàng</span>
                  <span className="text-sm font-normal text-gray-500">({storePromotions.length})</span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {storePromotions.map((promo) => {
                    const status = getPromotionStatus(promo);
                    return (
                      <div key={promo.id} className="group relative bg-white rounded-2xl overflow-hidden hover:shadow-2xl transition-all duration-300 flex flex-col border-2 border-gray-100 hover:border-transparent min-h-[420px]">
                        {/* Status Badge */}
                        <div className="absolute top-3 right-3 z-10">
                          <span className={`px-2 py-1 bg-gradient-to-r ${status.color} text-white text-xs font-bold rounded-lg shadow-lg ${status.label === 'ACTIVE' ? 'flex items-center gap-1' : ''}`}>
                            {status.label === 'ACTIVE' && <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>}
                            {status.label}
                          </span>
                        </div>

                        {/* Header - Teal/Cyan-Purple Gradient for Store */}
                        <div className="relative bg-gradient-to-br from-teal-400 via-cyan-500 to-blue-500 p-4 pt-6">
                          <div className="absolute inset-0 bg-white/5"></div>
                          <div className="relative">
                            <h3 className="text-sm font-bold text-white mb-1.5 line-clamp-2 min-h-[2.25rem] leading-tight drop-shadow">
                              {promo.title || promo.name || promo.code}
                            </h3>
                            <div className="inline-flex items-center gap-1 bg-white/25 backdrop-blur-sm px-2 py-0.5 rounded shadow-sm">
                              <span className="text-[10px] font-bold text-white/90">{promo.code}</span>
                            </div>
                          </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 p-4 flex flex-col">
                          {/* Discount Value */}
                          <div className="relative bg-gradient-to-br from-fuchsia-500 via-purple-500 to-indigo-500 rounded-lg p-2.5 mb-2 shadow-md">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="text-[9px] font-semibold text-white/80 uppercase">
                                  {promo.type === 'PERCENTAGE' ? 'Giảm giá' : 'Giảm tiền'}
                                </div>
                              </div>
                              <div className="flex items-baseline gap-0.5 bg-white/15 backdrop-blur-sm px-2.5 py-1 rounded-md">
                                <span className="text-lg font-black text-white drop-shadow">{promo.discountValue}</span>
                                <span className="text-sm font-bold text-white/90">
                                  {promo.type === 'PERCENTAGE' ? '%' : '₫'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Description */}
                          <p className="text-[11px] text-gray-600 mb-2 line-clamp-2 flex-shrink-0 leading-snug">
                            {promo.description || 'Không có mô tả'}
                          </p>

                          {/* Date Info */}
                          <div className="space-y-1 mb-2 flex-shrink-0">
                            <div className="flex items-center justify-between text-[10px] bg-cyan-50 rounded-lg p-1.5">
                              <span className="text-cyan-700 font-medium">Bắt đầu:</span>
                              <span className="text-cyan-900 font-bold">{formatDate(promo.startDate)}</span>
                            </div>
                            <div className="flex items-center justify-between text-[10px] bg-purple-50 rounded-lg p-1.5">
                              <span className="text-purple-700 font-medium">Kết thúc:</span>
                              <span className="text-purple-900 font-bold">{formatDate(promo.endDate)}</span>
                            </div>
                          </div>

                          {/* Store Info - Always show for Store promotions */}
                          <div className="text-[10px] text-gray-600 mb-2 bg-gray-50 rounded-lg p-1.5 border border-gray-200">
                            <span className="font-semibold text-cyan-700">🏪 Cửa hàng:</span>{' '}
                            <span className="font-medium text-gray-900">
                              {promo.store?.name || promo.storeName || 'Không xác định'}
                            </span>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-2 mt-auto pt-3 border-t-2 border-gray-100">
                            {isExpired(promo) ? (
                              <button disabled className="px-3 py-2 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed font-semibold text-xs">
                                Đã hết hạn
                              </button>
                            ) : promo.status === 'ACTIVE' ? (
                              <button
                                onClick={() => handleToggleActive(promo.id, true)}
                                className="flex-1 px-3 py-2 bg-gradient-to-r from-slate-500 to-gray-500 text-white rounded-lg hover:from-slate-600 hover:to-gray-600 transition-all font-semibold text-xs"
                              >
                                Tạm dừng
                              </button>
                            ) : (
                              <button
                                onClick={() => handleToggleActive(promo.id, false)}
                                className="flex-1 px-3 py-2 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-lg hover:from-teal-600 hover:to-cyan-600 transition-all font-semibold text-xs"
                              >
                                Kích hoạt
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteClick(promo)}
                              className="px-3 py-2 bg-gradient-to-r from-rose-500 to-red-500 text-white rounded-lg hover:from-rose-600 hover:to-red-600 transition-all font-semibold text-xs"
                            >
                              Xóa
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Empty State */}
            {platformPromotions.length === 0 && storePromotions.length === 0 && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
                <div className="text-gray-300 text-5xl mb-3">🎁</div>
                <p className="text-gray-500 font-medium">Không tìm thấy khuyến mãi nào</p>
                <p className="text-gray-400 text-sm mt-1">Thử thay đổi bộ lọc hoặc tạo khuyến mãi mới</p>
              </div>
            )}
          </>
        )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white z-10 px-6 pt-6 pb-4 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Tạo khuyến mãi nền tảng
                </h2>
                <button
                  onClick={() => { setShowCreateModal(false); resetForm(); }}
                  className="text-gray-400 hover:text-gray-600 text-2xl w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100"
                >
                  ✕
                </button>
              </div>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-5">
              {/* Tên khuyến mãi */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tên khuyến mãi <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  required
                  placeholder="VD: Giảm giá mùa hè"
                  className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Mã code */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Mã khuyến mãi <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                  required
                  pattern="[A-Z0-9]{4,20}"
                  placeholder="VD: SUMMER2025 (4-20 ký tự, chỉ chữ IN HOA và số)"
                  className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 uppercase"
                />
              </div>

              {/* Mô tả */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Mô tả <span className="text-red-600">*</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  required
                  rows={3}
                  placeholder="Mô tả chi tiết về khuyến mãi..."
                  className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Loại giảm & Giá trị */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Loại giảm <span className="text-red-600">*</span>
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    required
                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="PERCENTAGE">Phần trăm (%)</option>
                    <option value="FIXED_AMOUNT">Số tiền cố định (₫)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {formData.type === 'PERCENTAGE' ? 'Phần trăm giảm (%)' : 'Số tiền giảm (₫)'} <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.discountValue}
                    onChange={(e) => setFormData({...formData, discountValue: e.target.value})}
                    required
                    min="1"
                    max={formData.type === 'PERCENTAGE' ? 100 : undefined}
                    placeholder={formData.type === 'PERCENTAGE' ? "VD: 10" : "VD: 50000"}
                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Áp dụng cho & Loại discount */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Áp dụng cho <span className="text-red-600">*</span>
                  </label>
                  <select
                    value={formData.applicableFor}
                    onChange={(e) => setFormData({...formData, applicableFor: e.target.value})}
                    required
                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ORDER">Đơn hàng</option>
                    <option value="SHIPPING">Phí vận chuyển</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Loại khuyến mãi <span className="text-red-600">*</span>
                  </label>
                  <select
                    value={formData.discountType}
                    onChange={(e) => setFormData({...formData, discountType: e.target.value})}
                    required
                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ORDER">Toàn bộ đơn hàng</option>
                    <option value="CATEGORY">Theo danh mục</option>
                  </select>
                </div>
              </div>

              {/* Giảm tối đa (chỉ hiện khi type=PERCENTAGE) */}
              {formData.type === 'PERCENTAGE' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Giảm tối đa (₫)
                  </label>
                  <input
                    type="number"
                    value={formData.maxDiscountValue}
                    onChange={(e) => setFormData({...formData, maxDiscountValue: e.target.value})}
                    min="0"
                    placeholder="VD: 200000"
                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              {/* Đơn tối thiểu & Số lượt dùng */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Đơn tối thiểu (₫)
                  </label>
                  <input
                    type="number"
                    value={formData.minOrderValue}
                    onChange={(e) => setFormData({...formData, minOrderValue: e.target.value})}
                    min="0"
                    placeholder="VD: 100000"
                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Số lượt sử dụng
                  </label>
                  <input
                    type="number"
                    value={formData.usageLimit}
                    onChange={(e) => setFormData({...formData, usageLimit: e.target.value})}
                    min="1"
                    placeholder="VD: 100"
                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Giới hạn/user & Checkbox user mới */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Giới hạn/người dùng
                  </label>
                  <input
                    type="number"
                    value={formData.usageLimitPerUser}
                    onChange={(e) => setFormData({...formData, usageLimitPerUser: e.target.value})}
                    min="1"
                    placeholder="VD: 1"
                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center pt-8">
                  <input
                    type="checkbox"
                    id="isNewUserOnly"
                    checked={formData.isNewUserOnly}
                    onChange={(e) => setFormData({...formData, isNewUserOnly: e.target.checked})}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="isNewUserOnly" className="ml-2 text-sm font-medium text-gray-700">
                    Chỉ dành cho người dùng mới
                  </label>
                </div>
              </div>

              {/* Ngày bắt đầu & kết thúc */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Ngày bắt đầu <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                    required
                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Ngày kết thúc <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                    required
                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => { setShowCreateModal(false); resetForm(); }}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-semibold transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 font-semibold shadow-lg hover:shadow-xl transition-all"
                >
                  Tạo khuyến mãi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && promotionToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)}></div>
          <div className="relative bg-white w-[90%] max-w-md rounded-3xl shadow-2xl overflow-hidden">
            {/* Gradient Header */}
            <div className="bg-gradient-to-r from-red-600 via-rose-600 to-pink-600 px-6 py-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                  <span className="text-2xl">🗑️</span>
                </div>
                <h3 className="text-xl font-bold text-white">Xóa khuyến mãi</h3>
              </div>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="w-8 h-8 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
              >
                <span className="text-xl">✕</span>
              </button>
            </div>

            {/* Content */}
            <div className="px-6 py-5">
              <div className="mb-5 p-4 bg-gradient-to-br from-red-50 to-pink-50 rounded-2xl border-2 border-red-100">
                <p className="text-gray-800 font-semibold mb-2">
                  Bạn có chắc chắn muốn xóa khuyến mãi này?
                </p>
                <div className="mt-3 p-3 bg-white rounded-xl border border-red-200">
                  <p className="text-sm text-gray-600 mb-1">Mã khuyến mãi:</p>
                  <p className="font-bold text-red-600">{promotionToDelete.code}</p>
                  <p className="text-sm text-gray-600 mt-2 mb-1">Tiêu đề:</p>
                  <p className="font-semibold text-gray-900">{promotionToDelete.title}</p>
                </div>
                <p className="text-sm text-red-600 mt-3 font-medium">
                  ⚠️ Hành động này không thể hoàn tác!
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t-2 border-gray-100 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-6 py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-100 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={confirmDelete}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 text-white font-bold hover:from-red-700 hover:to-rose-700 shadow-lg transition-all"
              >
                🗑️ Xóa khuyến mãi
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



