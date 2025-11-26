import React, { useState, useEffect } from 'react';
import useSWR, { mutate } from 'swr';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import { getPendingProducts, approveProduct, rejectProduct } from '../../services/admin/adminProductService';
import { useToast } from '../../context/ToastContext';
import { getAllBrandsWithoutPagination } from '../../services/common/brandService';

const AdminProducts = () => {
  const { showToast } = useToast();
  const [page, setPage] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [brandMap, setBrandMap] = useState({});

  useEffect(() => {
    (async () => {
      const res = await getAllBrandsWithoutPagination();
      if (res?.success && Array.isArray(res.data)) {
        const map = {};
        for (const b of res.data) {
          if (b?.id) map[b.id] = b.name || b.displayName || b.slug || b.id;
        }
        setBrandMap(map);
      }
    })();
  }, []);

  // Fetch pending products
  const { data: productsData, error, isLoading } = useSWR(
    ['admin-pending-products', page],
    () => getPendingProducts({ page, size: 20 }),
    { revalidateOnFocus: false }
  );

  const products = productsData?.data?.content || [];
  const totalPages = productsData?.data?.totalPages || 0;
  const totalElements = productsData?.data?.totalElements || 0;

  // Handle approve product
  const handleApprove = async (productId) => {
    if (!confirm('Bạn có chắc muốn duyệt sản phẩm này?')) return;

    const result = await approveProduct(productId);
    if (result.success) {
      showToast(result.message || 'Duyệt sản phẩm thành công!', 'success');
      mutate(['admin-pending-products', page]);
      mutate('admin-pending-products-count');
    } else {
      showToast(result.error || 'Có lỗi xảy ra', 'error');
    }
  };

  // Handle reject product
  const handleRejectClick = (product) => {
    setSelectedProduct(product);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const handleRejectConfirm = async () => {
    if (!rejectReason.trim()) {
      showToast('Vui lòng nhập lý do từ chối', 'error');
      return;
    }

    const result = await rejectProduct(selectedProduct.id, rejectReason);
    if (result.success) {
      showToast(result.message || 'Từ chối sản phẩm thành công!', 'success');
      setShowRejectModal(false);
      setSelectedProduct(null);
      setRejectReason('');
      mutate(['admin-pending-products', page]);
      mutate('admin-pending-products-count');
    } else {
      showToast(result.error || 'Có lỗi xảy ra', 'error');
    }
  };

  // Handle view details
  const handleViewDetails = (product) => {
    setSelectedProduct(product);
    setShowDetailModal(true);
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader 
        icon="📦"
        title="Quản lý Sản phẩm"
        subtitle="Duyệt và quản lý sản phẩm"
      />
      <div className="space-y-6">
        {/* Products List */}
        <div className="bg-white rounded-xl shadow-sm border-2 border-gray-200 p-6">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Đang tải...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <span className="text-6xl">❌</span>
              <p className="mt-4 text-red-600 font-semibold">Có lỗi xảy ra khi tải dữ liệu</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <span className="text-6xl">📭</span>
              <p className="mt-4 text-gray-600 font-semibold">Không có sản phẩm chờ duyệt</p>
            </div>
          ) : (
            <div className="space-y-4">
              
              {/* Product Table */}
              <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên sản phẩm</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Danh mục</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thương hiệu</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cửa hàng</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {products.map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-gray-900">{product.name}</div>
                          <div className="text-sm text-gray-500 line-clamp-1">{product.description || 'Chưa có mô tả'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-700">{product.categoryName || product.category?.name || product.category || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-700">
                            {
                              product.brandName
                              || product.brand?.name
                              || (product.brand?.$id
                                  ? (brandMap[
                                      (typeof product.brand.$id === 'object' && product.brand.$id?.$oid)
                                        ? product.brand.$id.$oid
                                        : String(product.brand.$id)
                                    ] || null)
                                  : null)
                              || brandMap[product.brandId]
                              || brandMap[product.brand]
                              || product.brand
                              || 'N/A'
                            }
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-700">{product.storeName || product.store?.name || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-3 py-1 bg-yellow-500 text-white rounded-full text-xs font-bold">
                            Chờ duyệt
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => handleViewDetails(product)}
                              className="px-3 py-1.5 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition-colors text-xs font-semibold"
                            >
                              👁️ Chi tiết
                            </button>
                            <button
                              onClick={() => handleApprove(product.id)}
                              className="px-3 py-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-xs font-semibold"
                            >
                              ✅ Duyệt
                            </button>
                            <button
                              onClick={() => handleRejectClick(product)}
                              className="px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-xs font-semibold"
                            >
                              ❌ Từ chối
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
                  <span className="px-4 py-2 bg-blue-100 text-blue-800 rounded-lg font-bold">
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

      {/* Detail Modal */}
      {showDetailModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Chi tiết sản phẩm</h2>
              <button
                onClick={() => { setShowDetailModal(false); setSelectedProduct(null); }}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="p-6 space-y-4">
              {/* Images */}
              {selectedProduct.images && selectedProduct.images.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {selectedProduct.images.map((img, idx) => (
                    <img key={idx} src={img} alt={`Product ${idx + 1}`} className="w-full h-32 object-cover rounded-lg" />
                  ))}
                </div>
              )}

              <div>
                <h3 className="text-xl font-bold mb-2">{selectedProduct.name}</h3>
                <p className="text-gray-600">{selectedProduct.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500 block">Danh mục:</span>
                  <span className="font-medium">
                    {selectedProduct.categoryName || 
                     selectedProduct.category?.name || 
                     selectedProduct.category || 
                     'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block">Cửa hàng:</span>
                  <span className="font-medium">
                    {selectedProduct.storeName || 
                     selectedProduct.store?.name || 
                     selectedProduct.store?.storeName ||
                     'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block">Thương hiệu:</span>
                  <span className="font-medium">
                    {selectedProduct.brand || 
                     brandMap[selectedProduct.brandId] || 
                     'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block">Trạng thái:</span>
                  <span className="font-medium">{selectedProduct.status || 'PENDING'}</span>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button
                  onClick={() => {
                    handleApprove(selectedProduct.id);
                    setShowDetailModal(false);
                  }}
                  className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 font-semibold"
                >
                  ✅ Duyệt
                </button>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    handleRejectClick(selectedProduct);
                  }}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-semibold"
                >
                  ❌ Từ chối
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">Từ chối sản phẩm</h2>
            <p className="text-gray-600 mb-4">Sản phẩm: <span className="font-bold">{selectedProduct?.name}</span></p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Nhập lý do từ chối..."
              className="w-full border-2 border-gray-300 rounded-lg p-3 mb-4 focus:outline-none focus:border-red-500"
              rows="4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setShowRejectModal(false); setSelectedProduct(null); setRejectReason(''); }}
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
    </div>
  );
};

export default AdminProducts;
