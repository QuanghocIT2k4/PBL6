import React, { useState, useEffect } from 'react';
import { getPendingVariants, approveVariant, rejectVariant } from '../../services/admin';
import { useToast } from '../../context/ToastContext';

const AdminVariants = () => {
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('PENDING'); // PENDING, APPROVED, REJECTED, all
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState(null);
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
        setVariants(list);
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

  const handleReject = async (variantId) => {
    const reason = prompt('Nhập lý do từ chối:');
    if (!reason) return;

    try {
      // ✅ Gọi API thật để từ chối biến thể
      const result = await rejectVariant(variantId, reason);
      
      if (result.success) {
        toast?.success('Đã từ chối biến thể. Lý do đã được gửi tới seller.');
        
        // Cập nhật UI ngay
        setVariants(prevVariants => 
          prevVariants.map(variant => 
            variant.id === variantId 
              ? { ...variant, status: 'REJECTED', rejectionReason: reason }
              : variant
          )
        );
        
        // Refresh danh sách
        setTimeout(() => fetchVariants(), 500);
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
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Biến thể chờ duyệt</h1>
            <p className="text-gray-600 mt-1">Chỉ hiển thị các biến thể đang chờ phê duyệt</p>
          </div>
        </div>

        {/* Variants Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {(variants || []).map((variant) => {
            const variantStatus = variant.status || 'PENDING'; // Default to PENDING if undefined
            
            return (
              <div key={variant.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-200">
                {/* Image */}
                <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200">
                  {variant.primaryImageUrl || (variant.imageUrls && variant.imageUrls[0]) ? (
                    <img
                      src={variant.primaryImageUrl || variant.imageUrls[0]}
                      alt={variant.name || variant.variantName}
                      className="w-full h-full object-cover"
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
                    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(variantStatus)}`}>
                      {getStatusText(variantStatus)}
                    </span>
                  </div>
                </div>

                {/* Info */}
                <div className="p-4">
                  <h3 className="font-bold text-gray-900 text-sm line-clamp-2 mb-2 min-h-[2.5rem]">
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
                    <div className="mb-3">
                      <p className="text-xs text-gray-500 mb-1">Màu sắc:</p>
                      <div className="flex gap-1 flex-wrap">
                        {variant.colors.map((color, idx) => (
                          <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                            {color.colorName}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Price & Stock */}
                  <div className="space-y-2 mb-3 pb-3 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">Giá:</span>
                      <span className="text-sm font-bold text-purple-600">{formatCurrency(variant.price)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">Tồn kho:</span>
                      <span className={`text-sm font-semibold ${variant.stock < 10 ? 'text-red-600' : 'text-green-600'}`}>
                        {variant.stock} {variant.stock < 10 && '⚠️'}
                      </span>
                    </div>
                    {variant.seller && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600">Người bán:</span>
                        <span className="text-xs font-medium text-gray-900">{variant.seller}</span>
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
                      className="w-full bg-purple-50 text-purple-600 py-2 px-3 rounded-lg hover:bg-purple-100 transition-colors text-xs font-medium"
                    >
                      👁️ Xem chi tiết
                    </button>
                    <div className="flex gap-2">
                      {(variantStatus === 'PENDING' || !variantStatus) && (
                        <>
                          <button
                            onClick={() => handleApprove(variant.id)}
                            className="flex-1 bg-green-50 text-green-600 py-2 px-3 rounded-lg hover:bg-green-100 transition-colors text-xs font-medium"
                          >
                            ✓ Duyệt
                          </button>
                          <button
                            onClick={() => handleReject(variant.id)}
                            className="flex-1 bg-red-50 text-red-600 py-2 px-3 rounded-lg hover:bg-red-100 transition-colors text-xs font-medium"
                          >
                            ✗ Từ chối
                          </button>
                        </>
                      )}
                      {variantStatus === 'APPROVED' && (
                        <button
                          onClick={() => handleReject(variant.id)}
                          className="w-full bg-red-50 text-red-600 py-2 px-3 rounded-lg hover:bg-red-100 transition-colors text-xs font-medium"
                        >
                          ↩️ Thu hồi
                        </button>
                      )}
                      {variantStatus === 'REJECTED' && (
                        <button
                          onClick={() => handleApprove(variant.id)}
                          className="w-full bg-green-50 text-green-600 py-2 px-3 rounded-lg hover:bg-green-100 transition-colors text-xs font-medium"
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
                {selectedVariant.imageUrls && selectedVariant.imageUrls.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Hình ảnh ({selectedVariant.imageUrls.length})</h4>
                    <div className="grid grid-cols-4 gap-3">
                      {selectedVariant.imageUrls.map((url, index) => (
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
                )}

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
                      <p className="text-sm text-gray-600">Tồn kho</p>
                      <p className={`font-medium ${selectedVariant.stock < 10 ? 'text-red-600' : 'text-green-600'}`}>
                        {selectedVariant.stock}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Người bán</p>
                      <p className="font-medium text-gray-900">{selectedVariant.seller || 'N/A'}</p>
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
      </div>
  );
};

export default AdminVariants;


/// ĐÃ LẤY LẠI ĐƯỢC