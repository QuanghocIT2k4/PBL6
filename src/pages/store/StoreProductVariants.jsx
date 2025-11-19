import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useSWR from 'swr';
import StoreLayout from '../../layouts/StoreLayout';
import { useStoreContext } from '../../context/StoreContext';
import StoreStatusGuard from '../../components/store/StoreStatusGuard';
import StorePageHeader from '../../components/store/StorePageHeader';
import { getProductVariantsByStore, updateVariantPrice, updateVariantStock, deleteProductVariant } from '../../services/b2c/b2cProductService';
import { getInventoryAnalytics } from '../../services/b2c/b2cAnalyticsService';
import { useToast } from '../../hooks/useToast';

const StoreProductVariants = () => {
  const navigate = useNavigate();
  const { currentStore, loading: storeLoading } = useStoreContext();
  const toast = useToast();
  const [modal, setModal] = useState({ open: false, type: null, variant: null, value: '' });
  const [detailModal, setDetailModal] = useState({ open: false, variant: null });
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 20;
  const [statusFilter, setStatusFilter] = useState('ALL');

  // ✅ Fetch inventory analytics
  const { data: inventoryAnalytics } = useSWR(
    currentStore?.id ? ['inventory-analytics', currentStore.id] : null,
    () => getInventoryAnalytics(currentStore.id),
    { revalidateOnFocus: false }
  );

  const analytics = inventoryAnalytics?.success ? inventoryAnalytics.data : null;

  // Helpers
  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price || 0);
  };

  // ✅ Lấy status trực tiếp từ variant object
  // ⚠️ LƯU Ý: API /api/v1/b2c/product-variants/{storeId} KHÔNG trả về field `status`
  // Backend cần fix để thêm field `status` vào response
  const deriveApprovalStatus = (variant) => {
    // ✅ Field `status` là field chính từ database
    const status = variant?.status || variant?.approvalStatus || null;
    
    // Nếu có status → xử lý theo giá trị
    if (status) {
      const statusUpper = String(status).toUpperCase().trim();
      
      // APPROVED
      if (statusUpper === 'APPROVED' || statusUpper === 'APPROVE') {
        return 'APPROVED';
      }
      
      // REJECTED
      if (statusUpper === 'REJECTED' || statusUpper === 'REJECT') {
        return 'REJECTED';
      }
      
      // PENDING
      if (statusUpper === 'PENDING' || statusUpper === 'WAITING') {
        return 'PENDING';
      }
    }
    
    // ⚠️ API không trả về status → không thể xác định
    // Tạm thời: Nếu variant đã tồn tại (có id) → mặc định APPROVED (vì đã có trong DB)
    // Variant mới tạo (chưa có id) → PENDING
    if (variant?.id || variant?._id) {
      return 'APPROVED'; // Variant đã tồn tại → coi như đã duyệt
    }
    
    return 'PENDING'; // Variant mới tạo
  };

  const formatNumber = (value) => {
    const num = Number(String(value).replace(/[^\d]/g, ''));
    if (!Number.isFinite(num)) return '';
    return num.toLocaleString('vi-VN');
  };

  const parseNumber = (value) => {
    const num = Number(String(value).replace(/[^\d]/g, ''));
    return Number.isFinite(num) ? num : 0;
  };

  // ✅ Fetch PRODUCT VARIANTS (biến thể) từ API
  const { data: variantsData, error, isLoading, mutate } = useSWR(
    currentStore?.id ? ['store-product-variants', currentStore.id, currentPage] : null,
    () => getProductVariantsByStore(currentStore.id, {
      page: currentPage,
      size: pageSize,
      sortBy: 'createdAt',
      sortDir: 'desc'
    }),
    { revalidateOnFocus: false }
  );

  const variants = variantsData?.success ? (variantsData.data?.content || variantsData.data || []) : [];
  const totalPages = variantsData?.data?.totalPages || 0;
  const totalElements = variantsData?.data?.totalElements || 0;
  
  const approvedCount = variants.filter(v => deriveApprovalStatus(v) === 'APPROVED').length;
  const pendingCount = variants.filter(v => deriveApprovalStatus(v) === 'PENDING').length;
  const outOfStockCount = variants.filter(v => ((v.stock ?? v.stockQuantity ?? 0) <= 0)).length;

  // Badge trạng thái duyệt
  const getApprovalBadge = (status) => {
    switch (status) {
      case 'APPROVED':
        return { label: 'Đã duyệt', className: 'bg-green-100 text-green-800 border-green-200', icon: '✅' };
      case 'PENDING':
        return { label: 'Chờ duyệt', className: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: '⏳' };
      case 'REJECTED':
        return { label: 'Từ chối', className: 'bg-red-100 text-red-800 border-red-200', icon: '❌' };
      default:
        return { label: status || 'Không rõ', className: 'bg-gray-100 text-gray-700 border-gray-200', icon: '📋' };
    }
  };

  // Filter by search + status
  const filteredVariants = variants.filter(variant => {
    const searchLower = searchTerm.trim().toLowerCase();
    const matchesSearch = searchLower === '' ||
      variant.productName?.toLowerCase().includes(searchLower) ||
      variant.name?.toLowerCase().includes(searchLower) ||
      variant.sku?.toLowerCase().includes(searchLower);
    const matchesStatus = statusFilter === 'ALL' || deriveApprovalStatus(variant) === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Lấy productId từ variant theo nhiều format khác nhau
  const getProductIdFromVariant = (variant) => {
    if (variant?.productId) {
      const v = variant.productId;
      if (typeof v === 'object') {
        if (v.$oid) return String(v.$oid);
        if (v.$id) return String(v.$id?.$oid || v.$id);
      }
      return String(v);
    }
    const prod = variant?.product;
    if (typeof prod === 'string') return prod;
    if (prod && typeof prod === 'object') {
      if (prod.id) return String(prod.id);
      if (prod._id) return String(prod._id);
      if (prod.$id) return String(prod.$id?.$oid || prod.$id);
      if (prod.$oid) return String(prod.$oid);
    }
    return null;
  };

  // Quick actions
  const openModal = (e, type, variant) => {
    e?.stopPropagation?.();
    const initial =
      type === 'price' ? (variant.price ?? 0) :
      type === 'stock' ? (variant.stock ?? variant.stockQuantity ?? 0) : '';
    setModal({ open: true, type, variant, value: String(initial) });
  };

  const closeModal = () => setModal({ open: false, type: null, variant: null, value: '' });

  const submitModal = async () => {
    if (!modal.variant) return;
    if (modal.type === 'price') {
      const newPrice = Number(modal.value);
      if (Number.isNaN(newPrice) || newPrice < 0) {
        toast?.error?.('Giá không hợp lệ');
        return;
      }
      const res = await updateVariantPrice(modal.variant.id, newPrice);
      if (res.success) {
        toast?.success?.('Cập nhật giá thành công');
        closeModal();
        mutate();
      } else {
        toast?.error?.(res.error || 'Không thể cập nhật giá');
      }
    } else if (modal.type === 'stock') {
      const newStock = parseInt(modal.value, 10);
      if (!Number.isFinite(newStock) || newStock < 0) {
        toast?.error?.('Tồn kho không hợp lệ');
        return;
      }
      const res = await updateVariantStock(modal.variant.id, newStock);
      if (res.success) {
        toast?.success?.('Cập nhật tồn kho thành công');
        closeModal();
        mutate();
      } else {
        toast?.error?.(res.error || 'Không thể cập nhật tồn kho');
      }
    } else if (modal.type === 'delete') {
      const res = await deleteProductVariant(modal.variant.id);
      if (res.success) {
        toast?.success?.('Đã xóa biến thể');
        closeModal();
        mutate();
      } else {
        toast?.error?.(res.error || 'Không thể xóa biến thể');
      }
    }
  };

  return (
    <StoreStatusGuard currentStore={currentStore} pageName="quản lý biến thể" loading={storeLoading}>
      <StoreLayout>
        <div className="min-h-screen bg-gray-50 p-6">
          {/* Header giống trang Sản phẩm */}
          <div className="bg-gradient-to-r from-cyan-200 to-blue-200 rounded-2xl p-6 mb-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-3xl">🎨</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Quản lý biến thể
                  </h1>
                  <p className="text-gray-600 text-sm">Quản lý danh sách biến thể sản phẩm của cửa hàng</p>
                </div>
              </div>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="text-lg">🎨</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Tổng biến thể</p>
                      <p className="text-xl font-bold text-gray-900">{totalElements || variants.length}</p>
                      <p className="text-xs text-gray-500">Tất cả</p>
                    </div>
                  </div>
                </div>
                <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <span className="text-lg">✅</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Đã duyệt</p>
                      <p className="text-xl font-bold text-gray-900">{approvedCount}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <span className="text-lg">⏳</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Chờ duyệt</p>
                      <p className="text-xl font-bold text-gray-900">{pendingCount}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-orange-50 rounded-lg p-4 border border-orange-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                      <span className="text-lg">⚠️</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Hết hàng</p>
                      <p className="text-xl font-bold text-gray-900">{outOfStockCount}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Search + Filters */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div className="flex flex-col md:flex-row gap-3">
              <input
                type="text"
                placeholder="Tìm biến thể theo tên, SKU…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter Tabs */}
            <div className="flex flex-wrap gap-2 mt-4">
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`px-5 py-2.5 rounded-xl font-semibold transition-all flex items-center gap-2 ${
                  statusFilter === 'ALL' 
                    ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${statusFilter === 'ALL' ? 'bg-white' : 'bg-purple-500'}`}></span>
                Tất cả trạng thái
              </button>
              <button
                onClick={() => setStatusFilter('APPROVED')}
                className={`px-5 py-2.5 rounded-xl font-semibold transition-all flex items-center gap-2 ${
                  statusFilter === 'APPROVED' 
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${statusFilter === 'APPROVED' ? 'bg-white' : 'bg-green-500'}`}></span>
                Đã duyệt
              </button>
              <button
                onClick={() => setStatusFilter('PENDING')}
                className={`px-5 py-2.5 rounded-xl font-semibold transition-all flex items-center gap-2 ${
                  statusFilter === 'PENDING' 
                    ? 'bg-gradient-to-r from-yellow-500 to-amber-600 text-white shadow-lg' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${statusFilter === 'PENDING' ? 'bg-white' : 'bg-yellow-500'}`}></span>
                Chờ duyệt
              </button>
              <button
                onClick={() => setStatusFilter('REJECTED')}
                className={`px-5 py-2.5 rounded-xl font-semibold transition-all flex items-center gap-2 ${
                  statusFilter === 'REJECTED' 
                    ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${statusFilter === 'REJECTED' ? 'bg-white' : 'bg-red-500'}`}></span>
                Từ chối
              </button>
            </div>
          </div>

          {/* Variants Grid - thiết kế gọn */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : error ? (
              <div className="text-center py-12 text-red-600">
                <p>Không thể tải danh sách biến thể</p>
                <button
                  onClick={() => mutate()}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Thử lại
                </button>
              </div>
            ) : filteredVariants.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p className="text-lg mb-4">Chưa có biến thể nào</p>
                <Link
                  to="/store-dashboard/product-variants/create"
                  className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Thêm biến thể đầu tiên
                </Link>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredVariants.map((variant) => (
                    <div
                      key={variant.id}
                      onClick={() => setDetailModal({ open: true, variant })}
                      className="group relative bg-white rounded-2xl overflow-hidden hover:shadow-2xl transition-all duration-300 flex flex-col border-2 border-gray-100 hover:border-blue-400 cursor-pointer"
                    >
                      {/* Status Badge */}
                      <div className="absolute top-3 right-3 z-10">
                        {(() => {
                          const badge = getApprovalBadge(deriveApprovalStatus(variant));
                          return (
                            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold shadow-lg ${badge.className}`}>
                              {badge.icon} {badge.label}
                            </span>
                          );
                        })()}
                      </div>

                      {/* Image */}
                      <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden">
                        {variant.primaryImage || variant.images?.[0] ? (
                          <img
                            src={variant.primaryImage || variant.images[0]}
                            alt={variant.productName || variant.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="text-gray-300 text-6xl group-hover:scale-110 transition-transform duration-300">
                              🎨
                            </div>
                          </div>
                        )}
                        
                        {/* Stock badge */}
                        <div className="absolute bottom-3 left-3">
                          {((variant.stock ?? variant.stockQuantity ?? 0) <= 0) ? (
                            <span className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold shadow-lg">
                              Hết hàng
                            </span>
                          ) : ((variant.stock ?? variant.stockQuantity ?? 0) < 10) ? (
                            <span className="px-3 py-1.5 bg-yellow-500 text-white rounded-lg text-xs font-bold shadow-lg">
                              Sắp hết
                            </span>
                          ) : null}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 p-2.5 flex flex-col">
                        {/* Product Name */}
                        <h3 className="font-bold text-gray-900 line-clamp-1 mb-1.5 text-xs leading-tight">
                          {variant.productName || variant.name}
                        </h3>

                        {/* Attributes */}
                        {variant.attributes && Object.keys(variant.attributes).length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-1.5">
                            {Object.entries(variant.attributes).slice(0, 2).map(([key, value]) => (
                              <span key={key} className="px-1.5 py-0.5 bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 text-[9px] rounded border border-blue-200 font-semibold">
                                {key}: {value}
                              </span>
                            ))}
                            {Object.keys(variant.attributes).length > 2 && (
                              <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-[9px] rounded border border-gray-300 font-semibold">
                                +{Object.keys(variant.attributes).length - 2}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Price & Stock */}
                        <div className="mt-auto pt-1.5 border-t border-gray-100">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[9px] font-medium text-gray-500">Giá bán</span>
                            <span className="text-[9px] font-medium text-gray-500">Tồn kho</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-black text-red-600">
                              {formatPrice(variant.price)}
                            </p>
                            <p className={`text-sm font-bold ${
                              (variant.stock ?? variant.stockQuantity ?? 0) <= 0 
                                ? 'text-red-600' 
                                : (variant.stock ?? variant.stockQuantity ?? 0) < 10 
                                ? 'text-yellow-600' 
                                : 'text-green-600'
                            }`}>
                              {variant.stock ?? variant.stockQuantity ?? 0}
                            </p>
                          </div>
                        </div>
                        {/* Actions - Improved design */}
                        <div className="mt-1.5 pt-1.5 border-t border-gray-100 flex items-center justify-between gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              // Mở modal chi tiết thay vì navigate
                              setDetailModal({ open: true, variant });
                            }}
                            className="flex-1 px-2 py-1.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-[10px] font-semibold rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-1"
                            title="Xem chi tiết biến thể"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                            </svg>
                            Chi tiết
                          </button>
                          <div className="flex gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openModal(e, 'price', variant);
                              }}
                              className="p-1.5 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100 transition-colors"
                              title="Cập nhật giá"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-3.866 0-7 1.79-7 4s3.134 4 7 4 7-1.79 7-4-3.134-4-7-4z"/>
                              </svg>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openModal(e, 'stock', variant);
                              }}
                              className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
                              title="Cập nhật tồn kho"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h18v4H3zM3 13h18v8H3zM7 7v6M12 7v6M17 7v6"/>
                              </svg>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openModal(e, 'delete', variant);
                              }}
                              className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                              title="Xóa biến thể"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2"/>
                              </svg>
                            </button>
                          </div>
                        </div>
                        {variant.sku && (
                          <p className="text-[10px] text-gray-500 mt-1">SKU: {variant.sku}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-6 flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Trang <span className="font-medium">{currentPage + 1}</span> / <span className="font-medium">{totalPages}</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                        disabled={currentPage === 0}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        ← Trước
                      </button>
                      <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                        disabled={currentPage >= totalPages - 1}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
        {/* Modern Modal for price/stock update and delete confirm */}
        {modal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"></div>
            <div className="relative bg-white w-[90%] max-w-md rounded-2xl shadow-2xl border border-gray-200">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">⚙️</span>
                  {modal.type === 'price' && 'Cập nhật giá'}
                  {modal.type === 'stock' && 'Cập nhật tồn kho'}
                  {modal.type === 'delete' && 'Xóa biến thể'}
                </h3>
                <button
                  onClick={closeModal}
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
                >
                  ✕
                </button>
              </div>
              <div className="px-5 py-4">
                {/* Variant summary */}
                {modal.variant && (
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-12 h-12 rounded-lg bg-gray-50 overflow-hidden border border-gray-100 flex-shrink-0">
                      {modal.variant.primaryImage || modal.variant.images?.[0] ? (
                        <img
                          src={modal.variant.primaryImage || modal.variant.images?.[0]}
                          alt={modal.variant.productName || modal.variant.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">🎨</div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 text-sm">
                        {modal.variant.productName || modal.variant.name}
                      </div>
                      {modal.variant.attributes && Object.keys(modal.variant.attributes).length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {Object.entries(modal.variant.attributes).map(([k, v]) => (
                            <span key={k} className="px-1.5 py-0.5 rounded border border-gray-200 text-[10px] text-gray-700 bg-gray-50">{k}: {v}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {modal.type === 'delete' ? (
                  <div className="text-sm text-gray-700">
                    Bạn có chắc chắn muốn xóa biến thể{' '}
                    <span className="font-semibold">{modal.variant?.name || modal.variant?.productName}</span>
                    ? Hành động này không thể hoàn tác.
                  </div>
                ) : (
                  <div>
                    {modal.type === 'price' ? (
                      <>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Giá bán</label>
                        <div className="flex items-stretch rounded-lg border border-gray-300 overflow-hidden focus-within:ring-2 focus-within:ring-blue-600 focus-within:border-transparent">
                          <span className="px-3 bg-gray-50 text-gray-600 flex items-center">₫</span>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={formatNumber(modal.value)}
                            onChange={(e) => setModal(prev => ({ ...prev, value: String(parseNumber(e.target.value)) }))}
                            onKeyDown={(e) => { if (e.key === 'Enter') submitModal(); }}
                            className="flex-1 px-3 py-2 outline-none"
                            placeholder="0"
                          />
                        </div>
                        <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                          <span>Giá hiện tại: {formatPrice(modal.variant?.price || 0)}</span>
                          <span>VND</span>
                        </div>
                        {/* Presets */}
                        <div className="mt-3 flex flex-wrap gap-2">
                          {[50000, 100000, 200000].map((delta) => (
                            <button
                              key={delta}
                              onClick={() => setModal(prev => ({ ...prev, value: String(parseNumber(prev.value) + delta) }))}
                              className="px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100 text-xs hover:bg-blue-100"
                            >
                              +{(delta).toLocaleString('vi-VN')}đ
                            </button>
                          ))}
                          {[50000, 100000].map((delta) => (
                            <button
                              key={`minus-${delta}`}
                              onClick={() => setModal(prev => ({ ...prev, value: String(Math.max(0, parseNumber(prev.value) - delta)) }))}
                              className="px-3 py-1.5 rounded-full bg-rose-50 text-rose-700 border border-rose-100 text-xs hover:bg-rose-100"
                            >
                              -{(delta).toLocaleString('vi-VN')}đ
                            </button>
                          ))}
                        </div>
                      </>
                    ) : (
                      <>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tồn kho</label>
                        <div className="flex items-stretch rounded-lg border border-gray-300 overflow-hidden">
                          <button
                            onClick={() => setModal(prev => ({ ...prev, value: String(Math.max(0, parseInt(prev.value || '0', 10) - 1)) }))}
                            className="px-3 bg-gray-50 hover:bg-gray-100 text-gray-700"
                          >
                            −
                          </button>
                          <input
                            type="number"
                            min="0"
                            value={modal.value}
                            onChange={(e) => setModal(prev => ({ ...prev, value: e.target.value.replace(/[^\d]/g, '') }))}
                            onKeyDown={(e) => { if (e.key === 'Enter') submitModal(); }}
                            className="flex-1 px-3 py-2 outline-none"
                            placeholder="0"
                          />
                          <button
                            onClick={() => setModal(prev => ({ ...prev, value: String(parseInt(prev.value || '0', 10) + 1) }))}
                            className="px-3 bg-gray-50 hover:bg-gray-100 text-gray-700"
                          >
                            +
                          </button>
                        </div>
                        {/* Presets */}
                        <div className="mt-3 flex flex-wrap gap-2">
                          {[5, 10, 20, 50].map((delta) => (
                            <button
                              key={delta}
                              onClick={() => setModal(prev => ({ ...prev, value: String(parseInt(prev.value || '0', 10) + delta) }))}
                              className="px-3 py-1.5 rounded-full bg-green-50 text-green-700 border border-green-100 text-xs hover:bg-green-100"
                            >
                              +{delta}
                            </button>
                          ))}
                        </div>
                        <p className="mt-2 text-xs text-gray-500">Kho hiện tại: {modal.variant?.stock ?? modal.variant?.stockQuantity ?? 0}</p>
                      </>
                    )}
                  </div>
                )}
              </div>
              <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50"
                >
                  Quay lại
                </button>
                <button
                  onClick={submitModal}
                  className={`px-4 py-2 rounded-lg text-white ${
                    modal.type === 'delete' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {modal.type === 'delete' ? 'Xóa biến thể' : 'Xác nhận'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Detail Modal */}
        {detailModal.open && detailModal.variant && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setDetailModal({ open: false, variant: null })}>
            <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
              {/* Header */}
              <div className="sticky top-0 bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 text-white px-6 py-5 flex items-center justify-between z-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                    <span className="text-2xl">🎨</span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Chi tiết biến thể</h2>
                    <p className="text-sm text-white/80 mt-0.5">{detailModal.variant.productName || detailModal.variant.name}</p>
                  </div>
                </div>
                <button
                  onClick={() => setDetailModal({ open: false, variant: null })}
                  className="w-10 h-10 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                >
                  <span className="text-2xl">✕</span>
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Image */}
                  <div className="space-y-4">
                    <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl overflow-hidden">
                      {detailModal.variant.primaryImage || detailModal.variant.images?.[0] ? (
                        <img
                          src={detailModal.variant.primaryImage || detailModal.variant.images[0]}
                          alt={detailModal.variant.productName || detailModal.variant.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300 text-8xl">
                          🎨
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="space-y-6">
                    {/* Basic Info */}
                    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-5 border-2 border-blue-100">
                      <h3 className="text-sm font-bold text-blue-900 mb-4 flex items-center gap-2">
                        <span className="text-lg">📋</span>
                        Thông tin cơ bản
                      </h3>
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-blue-700 font-medium mb-1">Tên biến thể</p>
                          <p className="text-base font-bold text-gray-900">{detailModal.variant.productName || detailModal.variant.name}</p>
                        </div>
                        {detailModal.variant.attributes && Object.keys(detailModal.variant.attributes).length > 0 && (
                          <div>
                            <p className="text-xs text-blue-700 font-medium mb-2">Thuộc tính</p>
                            <div className="flex flex-wrap gap-2">
                              {Object.entries(detailModal.variant.attributes).map(([key, value]) => (
                                <span key={key} className="px-3 py-1.5 bg-white text-blue-700 text-xs rounded-lg border border-blue-200 font-semibold">
                                  {key}: {value}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Price & Stock */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-5 border-2 border-green-100">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-2xl">💰</span>
                          <h3 className="text-sm font-bold text-green-900">Giá bán</h3>
                        </div>
                        <p className="text-2xl font-black text-green-600">
                          {formatPrice(detailModal.variant.price)}
                        </p>
                      </div>

                      <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-2xl p-5 border-2 border-yellow-100">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-2xl">📦</span>
                          <h3 className="text-sm font-bold text-yellow-900">Tồn kho</h3>
                        </div>
                        <p className={`text-2xl font-black ${
                          (detailModal.variant.stock ?? detailModal.variant.stockQuantity ?? 0) <= 0 
                            ? 'text-red-600' 
                            : (detailModal.variant.stock ?? detailModal.variant.stockQuantity ?? 0) < 10 
                            ? 'text-yellow-600' 
                            : 'text-green-600'
                        }`}>
                          {detailModal.variant.stock ?? detailModal.variant.stockQuantity ?? 0}
                        </p>
                      </div>
                    </div>

                    {/* Status */}
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-5 border-2 border-purple-100">
                      <h3 className="text-sm font-bold text-purple-900 mb-3 flex items-center gap-2">
                        <span className="text-lg">⚡</span>
                        Trạng thái
                      </h3>
                      <div className="inline-block">
                        {(() => {
                          const badge = getApprovalBadge(deriveApprovalStatus(detailModal.variant));
                          return (
                            <span className={`px-4 py-2 rounded-xl text-sm font-bold ${badge.className}`}>
                              {badge.icon} {badge.label}
                            </span>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 mt-6 pt-6 border-t-2">
                  <button
                    onClick={() => setDetailModal({ open: false, variant: null })}
                    className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-semibold transition-colors"
                  >
                    Đóng
                  </button>
                  <button
                    onClick={() => {
                      setDetailModal({ open: false, variant: null });
                      navigate(`/store-dashboard/product-variants/${detailModal.variant.id}`);
                    }}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 font-semibold shadow-lg transition-all"
                  >
                    Chỉnh sửa chi tiết
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </StoreLayout>
    </StoreStatusGuard>
  );
};

export default StoreProductVariants;

