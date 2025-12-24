import React, { useState, useEffect } from 'react';
import { getPendingVariants, approveVariant, rejectVariant } from '../../services/admin';
import { getStoreById } from '../../services/common/storeService';
import { useToast } from '../../context/ToastContext';
import AdminPageHeader from '../../components/admin/AdminPageHeader';

const AdminVariants = () => {
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('PENDING'); // PENDING, APPROVED, REJECTED, all
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [variantToReject, setVariantToReject] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const toast = useToast();

  // Chuẩn hóa trạng thái duyệt từ nhiều nguồn/format khác nhau (đồng bộ với Store)
  const deriveApprovalStatus = (variant) => {
    const raw =
      variant?.approvalStatus ??
      variant?.status ??
      variant?.approval?.status ??
      variant?.approval_state ??
      null;
    const upper = typeof raw === 'string' ? raw.toUpperCase() : raw;
    if (upper === 'APPROVED' || upper === true || upper === 'ACTIVE' || upper === 'ENABLED' || upper === 'VISIBLE') {
      return 'APPROVED';
    }
    if (upper === 'REJECTED' || upper === 'DENIED' || upper === 'DECLINED' || variant?.rejectionReason) {
      return 'REJECTED';
    }
    if (upper === 'PENDING' || upper === 'WAITING' || upper === 'IN_REVIEW' || upper === 'SUBMITTED' || upper === 'DRAFT' || upper === false || upper == null) {
      return 'PENDING';
    }
    return 'PENDING';
  };

  useEffect(() => {
    fetchVariants();
  }, [filter]);

  const fetchVariants = async () => {
    try {
      setLoading(true);
      
      // ✅ Theo yêu cầu: CHỈ gọi endpoint PENDING
      console.log('🧭 [Admin][Variants] fetch (PENDING only)');
      const result = await getPendingVariants();
      console.log('📊 [Admin][Variants] fetch result:', {
        success: result.success,
        count: Array.isArray(result.data) ? result.data.length : (result.data?.length || result.data?.content?.length || 0),
        sample: Array.isArray(result.data)
          ? result.data.slice(0, 2)
          : (result.data?.content ? result.data.content.slice(0, 2) : [])
      });
      
      if (result.success) {
        const list = Array.isArray(result.data) ? result.data : (result.data?.content || result.data || []);
        
        // ✅ Fetch store names cho variants có storeId
        console.log('🔄 Fetching store names for', list.length, 'variants');
        
        const variantsWithStoreNames = await Promise.all(
          list.map(async (variant) => {
            // Nếu đã có store object từ backend
            if (variant.store?.name) {
              return {
                ...variant,
                storeName: variant.store.name
              };
            }
            
            // Nếu chỉ có storeId, fetch store info
            if (variant.storeId && !variant.storeName) {
              try {
                console.log('📞 Fetching store:', variant.storeId);
                const storeResult = await getStoreById(variant.storeId);
                console.log('📥 Store result:', storeResult);
                
                if (storeResult.success && storeResult.data) {
                  // Backend trả về store.name, không phải storeName
                  const storeName = storeResult.data.name || storeResult.data.storeName;
                  console.log('✅ Got store name:', storeName);
                  return {
                    ...variant,
                    storeName,
                    store: storeResult.data  // Lưu full store object
                  };
                } else {
                  console.warn('⚠️ Store fetch failed:', storeResult.error);
                }
              } catch (err) {
                console.error('❌ Failed to fetch store:', variant.storeId, err);
              }
            }
            return variant;
          })
        );
        
        console.log('✅ Variants with store names:', variantsWithStoreNames);
        
        setVariants(variantsWithStoreNames);
      } else {
        console.error('Failed to fetch variants:', result.error);
        toast?.error('Không thể tải danh sách biến thể');
        setVariants([]);
      }
    } catch (error) {
      console.error('Error fetching variants:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (variantId) => {
    try {
      // ✅ Gọi API thật để duyệt biến thể
      const result = await approveVariant(variantId);
      
      if (result.success) {
        toast?.success('Duyệt biến thể thành công!');
        
        // Cập nhật UI ngay
        setVariants(prevVariants => 
          prevVariants.map(variant => 
            variant.id === variantId 
              ? { ...variant, status: 'APPROVED', rejectionReason: null }
              : variant
          )
        );
        
        // Refresh danh sách
        setTimeout(() => fetchVariants(), 500);
      } else {
        toast?.error(result.error || 'Không thể duyệt biến thể');
      }
    } catch (error) {
      console.error('Error approving variant:', error);
      toast?.error('Lỗi khi duyệt biến thể');
    }
  };

  const handleRejectClick = (variant) => {
    setVariantToReject(variant);
    setShowRejectModal(true);
  };

  const confirmReject = async () => {
    if (!variantToReject || !rejectReason.trim()) {
      toast?.error('Vui lòng nhập lý do từ chối');
      return;
    }

    try {
      const result = await rejectVariant(variantToReject.id, rejectReason);
      
      if (result.success) {
        toast?.success('Đã từ chối biến thể. Lý do đã được gửi tới seller.');
        
        setVariants(prev => prev.map(v => 
          v.id === variantToReject.id 
            ? { ...v, status: 'REJECTED', rejectionReason: rejectReason }
            : v
        ));
        
        setShowRejectModal(false);
        setVariantToReject(null);
        setRejectReason('');
      } else {
        toast?.error(result.error || 'Không thể từ chối biến thể');
      }
    } catch (error) {
      console.error('Error rejecting variant:', error);
      toast?.error('Lỗi khi từ chối biến thể');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'APPROVED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'REJECTED':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'PENDING':
        return 'Chờ duyệt';
      case 'APPROVED':
        return 'Đã duyệt';
      case 'REJECTED':
        return 'Bị từ chối';
      default:
        return 'Không xác định';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  // ✅ Filter variants theo tab được chọn
  const filteredVariants = variants.filter(variant => {
    if (filter === 'all') return true;
    return deriveApprovalStatus(variant) === filter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader 
        icon="🎨"
        title="Quản lý Biến thể"
        subtitle="Duyệt và quản lý biến thể sản phẩm"
      />
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Biến thể chờ duyệt</h1>
            <p className="text-gray-600 mt-1">Chỉ hiển thị các biến thể đang chờ phê duyệt</p>
          </div>
        </div>

        {/* Variants Grid (style giống store) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {(variants || []).map((variant) => {
            const variantStatus = variant.status || 'PENDING'; // Default to PENDING if undefined
            
            // 🔍 Try multiple field names for image
            const imageUrl = 
              variant.primaryImageUrl || 
              (variant.imageUrls && variant.imageUrls[0]) ||
              (variant.images && variant.images[0]) ||
              variant.imageUrl ||
              (variant.colors && variant.colors[0] && (variant.colors[0].image || variant.colors[0].colorImage || variant.colors[0].imageUrl)) ||
              variant.image ||
              variant.variantImageUrl;
            
            // 🔍 Debug: Log if no image found
            if (!imageUrl) {
              console.log('🖼️ No image for variant:', variant.name, 'All fields:', variant);
            }
            
            return (
              <div
                key={variant.id}
                className="group relative bg-white rounded-2xl overflow-hidden border-2 border-gray-100 hover:border-blue-400 hover:shadow-2xl transition-all duration-300"
              >
                {/* Image */}
                <div className="relative aspect-[3/4] bg-gradient-to-br from-gray-50 via-white to-gray-100 p-3">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={variant.name || variant.variantName}
                      className="w-full h-full object-contain rounded-lg shadow-sm group-hover:scale-[1.02] transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                  
                  {/* Status Badge */}
                  <div className="absolute top-2 right-2">
                    <span className={`px-2 py-1 text-xs font-bold rounded-lg shadow ${getStatusColor(variantStatus)}`}>
                      {getStatusText(variantStatus)}
                    </span>
                  </div>
                </div>

                {/* Info */}
                <div className="p-3 space-y-2">
                  <h3 className="font-bold text-gray-900 text-sm line-clamp-2 min-h-[2.5rem]">
                    {variant.name || variant.variantName}
                  </h3>
                  
                  <p className="text-xs text-gray-500 mb-2">
                    Sản phẩm: {variant.productName}
                  </p>
                  
                  {/* Attributes */}
                  {variant.attributes && Object.keys(variant.attributes).length > 0 && (
                    <div className="space-y-1 mb-3">
                      {variant.attributes['Bộ nhớ trong'] && (
                        <p className="text-xs text-gray-600">💾 {variant.attributes['Bộ nhớ trong']}</p>
                      )}
                      {variant.attributes['Dung lượng RAM'] && (
                        <p className="text-xs text-gray-600">🔧 RAM: {variant.attributes['Dung lượng RAM']}</p>
                      )}
                    </div>
                  )}

                  {/* Colors */}
                  {variant.colors && variant.colors.length > 0 && (
                    <div className="mb-1">
                      <p className="text-xs text-gray-500 mb-1">Màu sắc:</p>
                      <div className="flex gap-1 flex-wrap">
                        {variant.colors.map((color, idx) => (
                          <span key={idx} className="px-2 py-1 bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 border border-blue-200 rounded text-[11px] font-semibold">
                            {color.colorName}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Price & Store */}
                  <div className="space-y-2 mb-3 pb-3 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">Giá:</span>
                      <span className="text-sm font-bold text-red-600">{formatCurrency(variant.price)}</span>
                    </div>
                    {(variant.storeName || variant.storeId) && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600">Cửa hàng:</span>
                        <span className="text-xs font-medium text-gray-900">
                          {variant.storeName || (variant.storeId ? `ID: ${variant.storeId.slice(0, 8)}...` : '')}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Rejection Reason */}
                  {variant.rejectionReason && (
                    <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded">
                      <p className="text-xs text-red-600">
                        <strong>Lý do từ chối:</strong> {variant.rejectionReason}
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        setSelectedVariant(variant);
                        setShowDetailModal(true);
                      }}
                      className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-2 px-3 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-colors text-xs font-semibold shadow-sm hover:shadow"
                    >
                      👁️ Xem chi tiết
                    </button>
                    <div className="flex gap-2">
                      {(variantStatus === 'PENDING' || !variantStatus) && (
                        <>
                          <button
                            onClick={() => handleApprove(variant.id)}
                            className="flex-1 bg-green-50 text-green-600 py-2 px-3 rounded-lg hover:bg-green-100 transition-colors text-xs font-semibold"
                          >
                            ✓ Duyệt
                          </button>
                          <button
                            onClick={() => handleRejectClick(variant)}
                            className="flex-1 bg-red-50 text-red-600 py-2 px-3 rounded-lg hover:bg-red-100 transition-colors text-xs font-semibold"
                          >
                            ✗ Từ chối
                          </button>
                        </>
                      )}
                      {variantStatus === 'APPROVED' && (
                        <button
                          onClick={() => handleRejectClick(variant)}
                          className="w-full bg-red-50 text-red-600 py-2 px-3 rounded-lg hover:bg-red-100 transition-colors text-xs font-semibold"
                        >
                          ↩️ Thu hồi
                        </button>
                      )}
                      {variantStatus === 'REJECTED' && (
                        <button
                          onClick={() => handleApprove(variant.id)}
                          className="w-full bg-green-50 text-green-600 py-2 px-3 rounded-lg hover:bg-green-100 transition-colors text-xs font-semibold"
                        >
                          ✓ Duyệt lại
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {(variants || []).length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <span className="text-2xl">🔧</span>
          </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Không có biến thể nào</h3>
            <p className="text-gray-600">Hiện chưa có biến thể nào chờ duyệt.</p>
        </div>
        )}

        {/* Detail Modal */}
        {showDetailModal && selectedVariant && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-4xl w-full p-6 my-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Chi tiết Biến thể</h3>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                {/* Images */}
                {(() => {
                  // Try multiple field names
                  const images = selectedVariant.imageUrls || selectedVariant.images || [];
                  console.log('🖼️ Modal images:', images, 'Variant:', selectedVariant);
                  
                  return images.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Hình ảnh ({images.length})</h4>
                      <div className="grid grid-cols-4 gap-3">
                        {images.map((url, index) => (
                          <div key={index} className="relative">
                            <img src={url} alt={`Image ${index + 1}`} className="w-full h-32 object-cover rounded-lg" />
                            {index === 0 && (
                              <div className="absolute top-1 left-1 bg-purple-500 text-white text-xs px-2 py-1 rounded">
                                Ảnh chính
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Basic Info */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Thông tin cơ bản</h4>
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-600">Tên biến thể</p>
                      <p className="font-medium text-gray-900">{selectedVariant.name || selectedVariant.variantName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Sản phẩm</p>
                      <p className="font-medium text-gray-900">{selectedVariant.productName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Giá</p>
                      <p className="font-medium text-purple-600">{formatCurrency(selectedVariant.price)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Cửa hàng</p>
                      <p className="font-medium text-gray-900">
                        {selectedVariant.storeName || (selectedVariant.storeId ? `Store ID: ${selectedVariant.storeId.slice(0, 8)}...` : 'N/A')}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Trạng thái</p>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(selectedVariant.status || 'PENDING')}`}>
                        {getStatusText(selectedVariant.status || 'PENDING')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Description */}
                {selectedVariant.description && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Mô tả</h4>
                    <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{selectedVariant.description}</p>
                  </div>
                )}

                {/* Attributes */}
                {selectedVariant.attributes && Object.keys(selectedVariant.attributes).length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Thuộc tính kỹ thuật</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {Object.entries(selectedVariant.attributes).map(([key, value]) => (
                        value && (
                          <div key={key} className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-xs text-gray-600 mb-1">{key}</p>
                            <p className="text-sm font-medium text-gray-900">{value}</p>
                          </div>
                        )
                      ))}
                    </div>
                  </div>
                )}

                {/* Colors */}
                {selectedVariant.colors && selectedVariant.colors.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Màu sắc khác ({selectedVariant.colors.length})</h4>
                    <div className="space-y-2">
                      {selectedVariant.colors.map((color, index) => (
                        <div key={index} className="bg-gray-50 p-3 rounded-lg flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">{color.colorName}</p>
                            <p className="text-sm text-gray-600">Giá: {formatCurrency(color.price)} • Tồn: {color.stock}</p>
                          </div>
                          {color.image && color.image !== 'tmp' && (
                            <img src={color.image} alt={color.colorName} className="w-12 h-12 object-cover rounded" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Rejection Reason */}
                {selectedVariant.rejectionReason && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h4 className="font-semibold text-red-900 mb-2">Lý do từ chối</h4>
                    <p className="text-red-700">{selectedVariant.rejectionReason}</p>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end gap-3">
                {(selectedVariant.status === 'PENDING' || !selectedVariant.status) && (
                  <>
                    <button
                      onClick={() => {
                        handleApprove(selectedVariant.id);
                        setShowDetailModal(false);
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                    >
                      ✓ Duyệt
                    </button>
                    <button
                      onClick={() => {
                        handleReject(selectedVariant.id);
                        setShowDetailModal(false);
                      }}
                      className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                    >
                      ✗ Từ chối
                    </button>
                  </>
                )}
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reject Modal */}
        {showRejectModal && variantToReject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowRejectModal(false)}></div>
            <div className="relative bg-white w-[90%] max-w-md rounded-3xl shadow-2xl overflow-hidden">
              {/* Gradient Header */}
              <div className="bg-gradient-to-r from-red-600 via-rose-600 to-pink-600 px-6 py-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                    <span className="text-2xl">❌</span>
                  </div>
                  <h3 className="text-xl font-bold text-white">Từ chối biến thể</h3>
                </div>
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="w-8 h-8 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
                >
                  <span className="text-xl">✕</span>
                </button>
              </div>

              {/* Content */}
              <div className="px-6 py-5">
                <div className="mb-4 p-4 bg-gradient-to-br from-red-50 to-pink-50 rounded-2xl border-2 border-red-100">
                  <p className="text-sm text-gray-600 mb-1">Biến thể:</p>
                  <p className="font-bold text-gray-900">{variantToReject.name}</p>
                </div>

                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lý do từ chối <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Nhập lý do từ chối (VD: Hình ảnh không rõ ràng, thông tin không đầy đủ...)"
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none resize-none"
                />
                <p className="text-xs text-gray-500 mt-2">
                  ⚠️ Lý do từ chối sẽ được gửi tới người bán
                </p>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-gray-50 border-t-2 border-gray-100 flex items-center justify-end gap-3">
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="px-6 py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-100 transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={confirmReject}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 text-white font-bold hover:from-red-700 hover:to-rose-700 shadow-lg transition-all"
                >
                  ❌ Từ chối
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminVariants;


/// ĐÃ LẤY LẠI ĐƯỢC