import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import StoreLayout from '../../layouts/StoreLayout';
import StoreStatusGuard from '../../components/store/StoreStatusGuard';
import { useStoreContext } from '../../context/StoreContext';
import { getProductVariantsByStore, updateVariantPrice, updateVariantStock, deleteProductVariant, updateVariantImages } from '../../services/b2c';
import { useToast } from '../../hooks/useToast';
import { confirmDelete } from '../../utils/sweetalert';

const StoreVariants = () => {
  const { currentStore, loading: storeLoading } = useStoreContext();
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [editData, setEditData] = useState({ price: 0, stock: 0 });
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (currentStore?.id) {
      fetchVariants();
    } else {
      // Nếu không có store, set loading = false để không bị stuck
      setLoading(false);
    }
  }, [currentStore?.id]);

  const fetchVariants = async () => {
    try {
      setLoading(true);
      
      const result = await getProductVariantsByStore(currentStore.id);
      
      if (result.success) {
        const data = result.data;
        if (Array.isArray(data)) {
          setVariants(data);
        } else if (data?.content) {
          setVariants(Array.isArray(data.content) ? data.content : []);
        } else {
          setVariants([]);
        }
      } else {
        console.error('Failed to fetch variants:', result.error);
        toast?.error('Không thể tải danh sách biến thể');
        setVariants([]);
      }
    } catch (error) {
      console.error('Error fetching variants:', error);
      toast?.error('Lỗi khi tải danh sách biến thể');
      setVariants([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredVariants = variants.filter(variant => {
    const matchesSearch = searchTerm === '' || 
      variant.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      variant.size?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      variant.color?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'ALL' || variant.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleEditPrice = (variant) => {
    // ✅ Chặn edit nếu chưa được duyệt
    if (variant.status !== 'APPROVED') {
      toast?.error('Chỉ có thể sửa giá/tồn kho của biến thể đã được duyệt');
      return;
    }
    
    setSelectedVariant(variant);
    setEditData({ price: variant.price, stock: variant.stock });
    setShowEditModal(true);
  };

  const handleUpdatePrice = async () => {
    if (!selectedVariant) return;

    // ✅ Double check status
    if (selectedVariant.status !== 'APPROVED') {
      toast?.error('Chỉ có thể cập nhật giá của biến thể đã được duyệt');
      setShowEditModal(false);
      return;
    }

    try {
      const result = await updateVariantPrice(selectedVariant.id, editData.price);
      if (result.success) {
        toast?.success('Cập nhật giá thành công');
        setShowEditModal(false);
        fetchVariants();
      } else {
        toast?.error(result.error || 'Không thể cập nhật giá');
      }
    } catch (error) {
      console.error('Error updating price:', error);
      toast?.error('Lỗi khi cập nhật giá');
    }
  };

  const handleUpdateStock = async () => {
    if (!selectedVariant) return;

    // ✅ Double check status
    if (selectedVariant.status !== 'APPROVED') {
      toast?.error('Chỉ có thể cập nhật tồn kho của biến thể đã được duyệt');
      setShowEditModal(false);
      return;
    }

    try {
      const result = await updateVariantStock(selectedVariant.id, editData.stock);
      if (result.success) {
        toast?.success('Cập nhật tồn kho thành công');
        setShowEditModal(false);
        fetchVariants();
      } else {
        toast?.error(result.error || 'Không thể cập nhật tồn kho');
      }
    } catch (error) {
      console.error('Error updating stock:', error);
      toast?.error('Lỗi khi cập nhật tồn kho');
    }
  };

  const handleDelete = async (variantId) => {
    const confirmed = await confirmDelete('biến thể này');
    if (!confirmed) return;

    try {
      const result = await deleteProductVariant(variantId);
      if (result.success) {
        toast?.success('Xóa biến thể thành công');
        fetchVariants();
      } else {
        toast?.error(result.error || 'Không thể xóa biến thể');
      }
    } catch (error) {
      console.error('Error deleting variant:', error);
      toast?.error('Lỗi khi xóa biến thể');
    }
  };

  // ✅ Xử lý cập nhật ảnh variant
  const handleEditImages = (variant) => {
    if (variant.status !== 'APPROVED') {
      toast?.error('Chỉ có thể cập nhật ảnh của biến thể đã được duyệt');
      return;
    }
    setSelectedVariant(variant);
    setSelectedImages([]);
    setShowImageModal(true);
  };

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 5) {
      toast?.error('Tối đa 5 ảnh');
      return;
    }
    setSelectedImages(files);
  };

  const handleUpdateImages = async () => {
    if (!selectedVariant || selectedImages.length === 0) {
      toast?.error('Vui lòng chọn ít nhất 1 ảnh');
      return;
    }

    setUploadingImages(true);
    try {
      const result = await updateVariantImages(selectedVariant.id, selectedImages, 0);
      if (result.success) {
        toast?.success('Cập nhật ảnh thành công');
        setShowImageModal(false);
        setSelectedImages([]);
        fetchVariants();
      } else {
        toast?.error(result.error || 'Không thể cập nhật ảnh');
      }
    } catch (error) {
      console.error('Error updating images:', error);
      toast?.error('Lỗi khi cập nhật ảnh');
    } finally {
      setUploadingImages(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const getStatusBadge = (status) => {
    const badges = {
      APPROVED: { bg: 'bg-green-100', text: 'text-green-800', label: 'Đã duyệt' },
      PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Chờ duyệt' },
      REJECTED: { bg: 'bg-red-100', text: 'text-red-800', label: 'Bị từ chối' },
    };
    const badge = badges[status] || badges.PENDING;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  if (loading) {
    return (
      <StoreStatusGuard currentStore={currentStore} pageName="quản lý biến thể" loading={storeLoading}>
        <StoreLayout>
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        </StoreLayout>
      </StoreStatusGuard>
    );
  }

  return (
    <StoreStatusGuard currentStore={currentStore} pageName="quản lý biến thể" loading={storeLoading}>
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
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold">
                        <span className="text-cyan-600">Quản lý</span> <span className="text-blue-600">biến thể</span>
                      </h1>
                      <p className="text-gray-600 mt-1">Quản lý danh sách biến thể sản phẩm của cửa hàng</p>
                    </div>
                  </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-6">
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <span className="text-lg">🏷️</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Tổng biến thể</p>
                        <p className="text-xl font-bold text-gray-900">{variants.length}</p>
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
                        <p className="text-xl font-bold text-gray-900">{variants.filter(v => v.status === 'APPROVED').length}</p>
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
                        <p className="text-xl font-bold text-gray-900">{variants.filter(v => v.status === 'PENDING').length}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <span className="text-lg">📊</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Tồn kho</p>
                        <p className="text-xl font-bold text-gray-900">{variants.reduce((sum, v) => sum + (v.stock || 0), 0)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <input
                  type="text"
                  placeholder="Tìm kiếm biến thể..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="APPROVED">Đã duyệt</option>
                <option value="PENDING">Chờ duyệt</option>
                <option value="REJECTED">Bị từ chối</option>
              </select>
            </div>
          </div>

          {/* Variants Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredVariants.length > 0 ? (
              filteredVariants.map((variant) => (
                <div key={variant.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-200">
                  {/* Image */}
                  <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200">
                    {variant.primaryImageUrl || (variant.imageUrls && variant.imageUrls[0]) ? (
                      <img
                        src={variant.primaryImageUrl || variant.imageUrls[0]}
                        alt={variant.name}
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
                      {getStatusBadge(variant.status)}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <h3 className="font-bold text-gray-900 text-sm line-clamp-2 mb-2 min-h-[2.5rem]">
                      {variant.name}
                    </h3>

                    {/* Attributes */}
                    {variant.attributes && (
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
                        <span className="text-sm font-bold text-purple-600">{formatPrice(variant.price)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600">Tồn kho:</span>
                        <span className={`text-sm font-semibold ${variant.stock < 10 ? 'text-red-600' : 'text-green-600'}`}>
                          {variant.stock} {variant.stock < 10 && '⚠️'}
                        </span>
                      </div>
                    </div>

                    {/* Action Icons */}
                    <div className="flex gap-1 justify-end">
                      {/* Nút đổi ảnh */}
                      <button
                        onClick={() => handleEditImages(variant)}
                        disabled={variant.status !== 'APPROVED'}
                        className={`p-2 rounded-lg transition-colors ${
                          variant.status === 'APPROVED'
                            ? 'bg-purple-50 text-purple-600 hover:bg-purple-100'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                        title={variant.status === 'APPROVED' ? 'Đổi ảnh' : 'Chỉ đổi ảnh được khi đã duyệt'}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleEditPrice(variant)}
                        disabled={variant.status !== 'APPROVED'}
                        className={`p-2 rounded-lg transition-colors ${
                          variant.status === 'APPROVED'
                            ? 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                        title={variant.status === 'APPROVED' ? 'Sửa giá & tồn kho' : 'Chỉ sửa được khi đã duyệt'}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(variant.id)}
                        className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                        title="Xóa"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-12 bg-white rounded-xl">
                <div className="text-gray-300 text-5xl mb-3">🏷️</div>
                <p className="text-gray-500 font-medium">
                  {searchTerm 
                    ? `Không tìm thấy biến thể nào khớp với "${searchTerm}"` 
                    : 'Chưa có biến thể nào'}
                </p>
                <p className="text-gray-400 text-sm mt-1 mb-4">
                  Hãy chọn sản phẩm đã được duyệt và thêm biến thể đầu tiên
                </p>
                {!searchTerm && (
                  <Link
                    to="/store-dashboard/products"
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg transition-all inline-flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/>
                    </svg>
                    Đi đến danh sách sản phẩm
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Edit Modal */}
        {showEditModal && selectedVariant && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Cập nhật Biến thể</h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sản phẩm</label>
                  <p className="text-sm text-gray-900">{selectedVariant.productName}</p>
                  <p className="text-xs text-gray-500">{selectedVariant.size} / {selectedVariant.color}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Giá mới (VNĐ)</label>
                  <input
                    type="number"
                    value={editData.price}
                    onChange={(e) => setEditData({ ...editData, price: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tồn kho mới</label>
                  <input
                    type="number"
                    value={editData.stock}
                    onChange={(e) => setEditData({ ...editData, stock: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleUpdatePrice}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    Cập nhật Giá
                  </button>
                  <button
                    onClick={handleUpdateStock}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    Cập nhật Tồn kho
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Cập nhật ảnh */}
        {showImageModal && selectedVariant && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-lg w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">📸 Cập nhật ảnh biến thể</h3>
                <button
                  onClick={() => {
                    setShowImageModal(false);
                    setSelectedImages([]);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-2">Biến thể: <strong>{selectedVariant.name}</strong></p>
                  
                  {/* Ảnh hiện tại */}
                  {selectedVariant.images && selectedVariant.images.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm text-gray-500 mb-2">Ảnh hiện tại:</p>
                      <div className="flex gap-2 flex-wrap">
                        {selectedVariant.images.map((img, idx) => (
                          <img key={idx} src={img} alt={`Ảnh ${idx + 1}`} className="w-16 h-16 object-cover rounded-lg border" />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Chọn ảnh mới (tối đa 5 ảnh)</label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageSelect}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                  
                  {/* Preview ảnh đã chọn */}
                  {selectedImages.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm text-gray-500 mb-2">Ảnh đã chọn ({selectedImages.length}):</p>
                      <div className="flex gap-2 flex-wrap">
                        {selectedImages.map((file, idx) => (
                          <img 
                            key={idx} 
                            src={URL.createObjectURL(file)} 
                            alt={`Preview ${idx + 1}`} 
                            className="w-16 h-16 object-cover rounded-lg border border-purple-300" 
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setShowImageModal(false);
                      setSelectedImages([]);
                    }}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleUpdateImages}
                    disabled={uploadingImages || selectedImages.length === 0}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                      uploadingImages || selectedImages.length === 0
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-purple-600 hover:bg-purple-700 text-white'
                    }`}
                  >
                    {uploadingImages ? '⏳ Đang tải...' : '📸 Cập nhật ảnh'}
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

export default StoreVariants;