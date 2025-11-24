import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import StoreLayout from '../../layouts/StoreLayout';
import StoreStatusGuard from '../../components/store/StoreStatusGuard';
import { useStoreContext } from '../../context/StoreContext';
import { getProductById, getProductVariants, getProductVariantById } from '../../services/common/productService';
import { useToast } from '../../hooks/useToast';

const StoreProductDetail = () => {
  const { productId, variantId } = useParams();
  const navigate = useNavigate();
  const { currentStore } = useStoreContext();
  const [product, setProduct] = useState(null);
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    fetchProductDetail();
  }, [productId, variantId]);

  const fetchProductDetail = async () => {
    try {
      setLoading(true);

      // ✅ Nếu đi theo route biến thể → chỉ hiển thị variant detail
      if (variantId) {
        const variantRes = await getProductVariantById(variantId);
        if (variantRes.success && variantRes.data) {
          // Lưu biến thể hiện tại vào danh sách để hiển thị
          setVariants([variantRes.data]);
          // Cố gắng lấy productId từ dữ liệu biến thể để tải thông tin sản phẩm cha (optional)
          const v = variantRes.data;
          const pid =
            (typeof v?.productId === 'object'
              ? (v.productId?.$oid || v.productId?.$id?.$oid || v.productId?.id || v.productId?._id)
              : v?.productId) ||
            (typeof v?.product === 'object'
              ? (v.product?.id || v.product?._id || v.product?.$id?.$oid || v.product?.$oid)
              : (typeof v?.product === 'string' ? v.product : null));
          if (pid) {
            try {
              const parentRes = await getProductById(String(pid));
              if (parentRes.success && parentRes.data) {
                setProduct(parentRes.data);
              }
            } catch (err) {
              // Nếu không lấy được product, vẫn hiển thị variant
              console.warn('Could not fetch parent product:', err);
            }
          }
        } else {
          toast?.error(variantRes.error || 'Không thể tải thông tin biến thể');
        }
        setLoading(false);
        return;
      }

      // ✅ Ngược lại: route theo productId (giữ nguyên hành vi cũ)
      if (!productId) {
        toast?.error('Không tìm thấy ID sản phẩm');
        setLoading(false);
        return;
      }

      const [productResult, variantsResult] = await Promise.all([
        getProductById(productId),
        getProductVariants({ productId })
      ]);

      if (productResult.success && productResult.data) {
        setProduct(productResult.data);
      } else {
        toast?.error('Không thể tải thông tin sản phẩm');
      }

      if (variantsResult.success && variantsResult.data) {
        setVariants(Array.isArray(variantsResult.data) ? variantsResult.data : variantsResult.data.content || []);
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      toast?.error('Lỗi khi tải sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const getBrandName = (brand) => {
    if (brand === null || brand === undefined) return 'Chưa có thương hiệu';
    
    if (typeof brand === 'string') {
      return brand || 'Chưa có thương hiệu';
    }
    
    if (typeof brand === 'object') {
      // Try name first (if populated)
      if (brand.name) return brand.name;
      
      // Try $id (MongoDB DBRef with ObjectId)
      if (brand.$id) {
        const idValue = brand.$id;
        // If ObjectId object, convert to string
        if (typeof idValue === 'object' && idValue.$oid) {
          return idValue.$oid;
        }
        if (idValue.toString) {
          return idValue.toString();
        }
        return String(idValue);
      }
      
      // Try other ID fields
      if (brand.id) return String(brand.id);
      if (brand._id) return String(brand._id);
      
      // If still not found
      console.warn('⚠️ Unknown brand structure:', brand);
      return 'Không xác định';
    }
    
    return 'Chưa có thương hiệu';
  };

  const getCategoryName = (category) => {
    
    if (category === null || category === undefined) return 'Chưa phân loại';
    
    if (typeof category === 'string') {
      return category || 'Chưa phân loại';
    }
    
    if (typeof category === 'object') {
      // Try name first (if populated)
      if (category.name) return category.name;
      
      // Try $id (MongoDB DBRef with ObjectId)
      if (category.$id) {
        const idValue = category.$id;
        // If ObjectId object, convert to string
        if (typeof idValue === 'object' && idValue.$oid) {
          return idValue.$oid;
        }
        if (idValue.toString) {
          return idValue.toString();
        }
        return String(idValue);
      }
      
      // Try other ID fields
      if (category.id) return String(category.id);
      if (category._id) return String(category._id);
      
      // If still not found
      console.warn('⚠️ Unknown category structure:', category);
      return 'Không xác định';
    }
    
    return 'Chưa phân loại';
  };

  // ✅ Chuẩn hóa trạng thái duyệt từ nhiều nguồn/format khác nhau (giống StoreProductVariants)
  const deriveApprovalStatus = (variant) => {
    const raw =
      variant?.approvalStatus ??
      variant?.status ??
      variant?.approval?.status ??
      variant?.approval_state ??
      null;
    
    // Debug: log để xem API trả về gì
    console.log('🔍 [Variant Detail] Checking status:', {
      approvalStatus: variant?.approvalStatus,
      status: variant?.status,
      approval: variant?.approval,
      approval_state: variant?.approval_state,
      raw,
      fullVariant: variant
    });
    
    const upper = typeof raw === 'string' ? raw.toUpperCase() : raw;
    if (upper === 'APPROVED' || upper === true || upper === 'ACTIVE' || upper === 'ENABLED' || upper === 'VISIBLE') {
      return 'APPROVED';
    }
    if (upper === 'REJECTED' || upper === 'DENIED' || upper === 'DECLINED' || variant?.rejectionReason) {
      return 'REJECTED';
    }
    if (upper === 'PENDING' || upper === 'WAITING' || upper === 'IN_REVIEW' || upper === 'SUBMITTED' || upper === 'DRAFT' || upper === false) {
      return 'PENDING';
    }
    // Fallback: nếu không có trường trạng thái → mặc định coi là APPROVED
    console.warn('⚠️ [Variant Detail] No status found, defaulting to APPROVED. Variant:', variant);
    return 'APPROVED';
  };

  if (loading) {
    return (
      <StoreLayout>
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </StoreLayout>
    );
  }

  // ✅ Nếu xem variant detail (có variantId) → hiển thị variant detail, không cần product
  if (variantId) {
    const currentVariant = variants[0];
    if (!currentVariant) {
      return (
        <StoreLayout>
          <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
              <div className="text-6xl mb-4">📦</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Biến thể không tồn tại</h2>
              <p className="text-gray-600 mb-6">Biến thể này không tồn tại hoặc đã bị xóa.</p>
              <button
                onClick={() => navigate('/store-dashboard/product-variants')}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-all"
              >
                ← Quay lại danh sách
              </button>
            </div>
          </div>
        </StoreLayout>
      );
    }

    // ✅ Hiển thị variant detail page
    return (
      <StoreLayout>
        <StoreStatusGuard currentStore={currentStore} pageName="chi tiết biến thể">
          <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-4xl mx-auto">
              {/* Header */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                      <span className="text-2xl">🎨</span>
                    </div>
                    <div>
                      <h1 className="text-xl font-bold text-gray-900">Chi tiết biến thể</h1>
                      <p className="text-sm text-gray-500">{currentVariant.name || currentVariant.productName}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/store-dashboard/product-variants')}
                    className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium transition-colors"
                  >
                    ← Quay lại
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Image */}
                <div className="lg:col-span-1">
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                    <div className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg overflow-hidden">
                      {currentVariant.primaryImage || currentVariant.images?.[0] ? (
                        <img
                          src={currentVariant.primaryImage || currentVariant.images[0]}
                          alt={currentVariant.name || currentVariant.productName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300 text-6xl">
                          🎨
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Info */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Basic Info */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">📋 Thông tin cơ bản</h2>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tên biến thể</label>
                        <div className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
                          <p className="text-gray-900 font-medium">{currentVariant.name || currentVariant.productName}</p>
                        </div>
                      </div>

                      {currentVariant.attributes && Object.keys(currentVariant.attributes).length > 0 && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Thuộc tính</label>
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(currentVariant.attributes).map(([key, value]) => (
                              <span key={key} className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg border border-blue-200 text-sm font-medium">
                                {key}: {value}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {currentVariant.sku && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                          <div className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
                            <p className="text-gray-900 font-mono text-sm">{currentVariant.sku}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Price & Stock */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                          <span className="text-2xl">💰</span>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Giá bán</p>
                          <p className="text-2xl font-bold text-green-600">{formatPrice(currentVariant.price || 0)}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                          (currentVariant.stock ?? currentVariant.stockQuantity ?? 0) <= 0 
                            ? 'bg-red-100' 
                            : (currentVariant.stock ?? currentVariant.stockQuantity ?? 0) < 10 
                            ? 'bg-yellow-100' 
                            : 'bg-blue-100'
                        }`}>
                          <span className="text-2xl">📦</span>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Tồn kho</p>
                          <p className={`text-2xl font-bold ${
                            (currentVariant.stock ?? currentVariant.stockQuantity ?? 0) <= 0 
                              ? 'text-red-600' 
                              : (currentVariant.stock ?? currentVariant.stockQuantity ?? 0) < 10 
                              ? 'text-yellow-600' 
                              : 'text-blue-600'
                          }`}>
                            {currentVariant.stock ?? currentVariant.stockQuantity ?? 0}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">📊 Trạng thái</h2>
                    <div className="flex flex-wrap gap-2">
                      {(() => {
                        // ✅ Dùng hàm deriveApprovalStatus để xử lý nhiều format
                        const status = deriveApprovalStatus(currentVariant);
                        const badge = 
                          status === 'APPROVED' ? { label: '✅ Đã duyệt', className: 'bg-green-100 text-green-800 border border-green-200' } :
                          status === 'PENDING' ? { label: '⏳ Chờ duyệt', className: 'bg-yellow-100 text-yellow-800 border border-yellow-200' } :
                          status === 'REJECTED' ? { label: '❌ Từ chối', className: 'bg-red-100 text-red-800 border border-red-200' } :
                          { label: '📋 Không xác định', className: 'bg-gray-100 text-gray-800 border border-gray-200' };
                        return (
                          <span className={`px-4 py-2 rounded-lg text-sm font-semibold ${badge.className}`}>
                            {badge.label}
                          </span>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Product Info (if available) */}
                  {product && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                      <h2 className="text-lg font-bold text-gray-900 mb-4">🔗 Sản phẩm cha</h2>
                      <div className="space-y-2">
                        <p className="text-sm text-gray-600">Tên sản phẩm:</p>
                        <p className="text-gray-900 font-medium">{product.name}</p>
                        <button
                          onClick={() => navigate(`/store-dashboard/products/${product.id || product._id}`)}
                          className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Xem chi tiết sản phẩm →
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </StoreStatusGuard>
      </StoreLayout>
    );
  }

  // ✅ Nếu không có product → hiển thị lỗi
  if (!product) {
    return (
      <StoreLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
            <div className="text-6xl mb-4">📦</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Sản phẩm không tồn tại</h2>
            <p className="text-gray-600 mb-6">Sản phẩm này không tồn tại hoặc đã bị xóa.</p>
            <button
              onClick={() => navigate('/store-dashboard/products')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-all"
            >
              ← Quay lại danh sách
            </button>
          </div>
        </div>
      </StoreLayout>
    );
  }

  const approvedVariants = variants.filter(v => v.status === 'APPROVED');
  const totalStock = approvedVariants.reduce((sum, v) => sum + (v.stock || 0), 0);

  return (
    <StoreLayout>
      <StoreStatusGuard currentStore={currentStore} pageName="chi tiết sản phẩm">
        {/* Modal-style Centered Layout */}
        <div className="min-h-screen bg-gray-50 py-8 px-4">
          <div className="max-w-3xl mx-auto">
            {/* Header */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">🔍</span>
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-gray-900">Chi tiết sản phẩm</h1>
                    <p className="text-sm text-gray-500">{product.name}</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/store-dashboard/products')}
                  className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium transition-colors"
                >
                  ← Quay lại
                </button>
              </div>
            </div>

            {/* Product Info Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">📋 Thông tin cơ bản</h2>
              
              <div className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tên sản phẩm</label>
                  <div className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-gray-900 font-medium">{product.name}</p>
                  </div>
                </div>

                {/* Brand & Category */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Thương hiệu</label>
                    <div className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-gray-900">{getBrandName(product.brand)}</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Danh mục</label>
                    <div className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-gray-900">{getCategoryName(product.category)}</p>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                  <div className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-200 min-h-[100px]">
                    <p className="text-gray-900 whitespace-pre-wrap">{product.description || 'Chưa có mô tả'}</p>
                  </div>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                  <div className="flex gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      product.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                      product.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {product.status === 'APPROVED' ? '✅ Đã duyệt' :
                       product.status === 'PENDING' ? '⏳ Chờ duyệt' :
                       '❌ Từ chối'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-xl">📦</span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Tổng kho</p>
                    <p className="text-2xl font-bold text-gray-900">{totalStock}</p>
                    <p className="text-xs text-gray-500">{approvedVariants.length} biến thể</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <span className="text-xl">{totalStock > 0 ? '✅' : '⚠️'}</span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Trạng thái</p>
                    <p className={`text-sm font-bold ${totalStock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {totalStock > 0 ? 'Đang bán' : 'Chưa có biến thể'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <span className="text-2xl">ℹ️</span>
                <div>
                  <p className="text-sm font-bold text-yellow-900 mb-1">Lưu ý về Giá</p>
                  <p className="text-sm text-yellow-800">
                    Sản phẩm không có giá cố định. Giá sẽ được xác định bởi <strong>biến thể</strong> (variant) mà bạn tạo.
                  </p>
                </div>
              </div>
            </div>

            {/* Variants List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">🎨 Biến thể sản phẩm</h2>
                {product.status === 'APPROVED' ? (
                  <Link
                    to={`/store-dashboard/products/create-variant?productId=${productId}`}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold transition-all"
                  >
                    ➕ Thêm biến thể
                  </Link>
                ) : (
                  <button
                    onClick={() => {
                      toast?.error?.('Sản phẩm phải được duyệt thành công trước khi thêm biến thể. Vui lòng đợi sản phẩm được duyệt.');
                    }}
                    className="px-4 py-2 bg-gray-300 text-gray-600 rounded-lg cursor-not-allowed font-semibold opacity-50"
                    disabled
                  >
                    ➕ Thêm biến thể
                  </button>
                )}
              </div>

              {approvedVariants.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-5xl mb-3">📦</div>
                  <p className="text-gray-600 font-medium">Chưa có biến thể nào được duyệt</p>
                  <p className="text-gray-500 text-sm mt-1">Thêm biến thể để bắt đầu bán sản phẩm</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {approvedVariants.map((variant) => (
                    <div
                      key={variant.id}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{variant.name}</h3>
                          {variant.attributes && (
                            <div className="flex gap-2 mt-1 flex-wrap">
                              {Object.entries(variant.attributes).map(([key, value]) => (
                                <span key={key} className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                                  {key}: {value}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="text-right ml-4">
                          <p className="text-lg font-bold text-blue-600">{formatPrice(variant.price || 0)}</p>
                          <p className="text-sm text-gray-600">Tồn: <span className="font-semibold">{variant.stock || 0}</span></p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => navigate('/store-dashboard/products')}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition-all"
              >
                ← Quay lại
              </button>
              {product.status === 'APPROVED' ? (
                <Link
                  to={`/store-dashboard/products/create-variant?productId=${productId}`}
                  className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold transition-all text-center"
                >
                  ➕ Thêm biến thể mới
                </Link>
              ) : (
                <button
                  onClick={() => {
                    toast?.error?.('Sản phẩm phải được duyệt thành công trước khi thêm biến thể. Vui lòng đợi sản phẩm được duyệt.');
                  }}
                  className="flex-1 px-6 py-3 bg-gray-300 text-gray-600 rounded-lg cursor-not-allowed font-semibold opacity-50"
                  disabled
                >
                  ➕ Thêm biến thể mới
                </button>
              )}
            </div>
          </div>
        </div>
      </StoreStatusGuard>
    </StoreLayout>
  );
};

export default StoreProductDetail;
