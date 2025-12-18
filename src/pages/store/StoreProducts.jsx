import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useSWR from 'swr';
import StoreLayout from '../../layouts/StoreLayout';
import { useStoreContext } from '../../context/StoreContext';
import StoreStatusGuard from '../../components/store/StoreStatusGuard';
import { getProductsByStore } from '../../services/b2c';
import { countProductsByStatus } from '../../services/b2c/b2cProductService';
import { useToast } from '../../hooks/useToast';
import { getAllBrandsWithoutPagination } from '../../services/common/brandService';

const StoreProducts = () => {
  const navigate = useNavigate();
  const { currentStore, loading: storeLoading } = useStoreContext();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const toast = useToast();
  const [brandMap, setBrandMap] = useState({});
  
  // ✅ Lưu stats cũ để tránh "nhảy" khi đang load
  const [cachedStats, setCachedStats] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
  });

  // ✅ CHỈ load products và brands, KHÔNG load variants (chưa cần thiết)
  const fetchProducts = async () => {
    try {
      setLoading(true);
      
      // ✅ Bỏ variants ra khỏi Promise.all để tăng tốc độ load
      const [productsResult, brandsResult] = await Promise.all([
        getProductsByStore(currentStore.id, { page: 0, size: 200, sortBy: 'createdAt', sortDir: 'desc' }),
        getAllBrandsWithoutPagination()
      ]);

      // Handle products
      if (productsResult.success) {
        const data = productsResult.data;
        if (Array.isArray(data)) {
          setProducts(data);
        } else if (data?.content) {
          setProducts(Array.isArray(data.content) ? data.content : []);
        } else {
          setProducts([]);
        }
      } else {
        console.error('Failed to fetch products:', productsResult.error);
        setProducts([]);
      }

      // Handle brands map (id -> name)
      if (brandsResult?.success && Array.isArray(brandsResult.data)) {
        const map = {};
        for (const b of brandsResult.data) {
          if (b?.id) map[b.id] = b.name || b.displayName || b.slug || b.id;
        }
        setBrandMap(map);
      } else {
        setBrandMap({});
      }
      
    } catch (error) {
      console.error('Error in fetchProducts:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Fetch product count by status - Dùng API count-by-status như yêu cầu (tương tự orders)
  // API này TRÁNH trường hợp khi search hay filter status khác thì bộ đếm cũng bị thay đổi theo
  const { data: statsData, mutate: mutateStats } = useSWR(
    currentStore?.id ? ['store-products-stats', currentStore.id] : null,
    () => {
      return countProductsByStatus(currentStore.id);
    },
    { 
      revalidateOnFocus: false, // ✅ Không load lại khi focus
      revalidateOnReconnect: false, // ✅ Không load lại khi reconnect
      revalidateIfStale: false, // ✅ Không load lại nếu data đã cũ
      dedupingInterval: 86400000, // Cache 24 giờ để tránh request quá nhiều
      // ✅ Cho phép load lần đầu (giống StoreOrders)
    }
  );

  // ✅ Update cached stats khi API load thành công
  useEffect(() => {
    if (statsData?.success && statsData.data) {
      const data = statsData.data;
      console.log('✅ [StoreProducts] Product stats loaded:', data);
      setCachedStats({
        total: data.total || data.TOTAL || 0,
        approved: data.APPROVED || data.approved || 0,
        pending: data.PENDING || data.pending || 0,
        rejected: data.REJECTED || data.rejected || 0,
      });
    } else if (statsData && !statsData.success) {
      console.error('❌ [StoreProducts] Failed to load stats:', statsData.error);
      // ✅ Nếu API không tồn tại, tính từ products hiện tại
      console.log('⚠️ [StoreProducts] API count-by-status không tồn tại, sẽ tính từ products hiện tại');
    }
  }, [statsData]);

  useEffect(() => {
    if (currentStore?.id) {
      fetchProducts();
    }
  }, [currentStore?.id]);

  // Helper: normalize product id (Mongo/ObjectId/string)
  const getProductId = (product) => {
    const direct = product?.id ?? product?._id ?? product?.productId ?? product?.product_id;
    if (direct) {
      if (typeof direct === 'object') {
        if (direct.$oid) return String(direct.$oid);
        if (direct.$id) return String(direct.$id?.$oid || direct.$id);
        if (direct.id) return String(direct.id);
        if (direct._id) return String(direct._id);
      }
      return String(direct);
    }
    return null;
  };

  // Process items - hiển thị TẤT CẢ sản phẩm (không cần check variants)
  const allItems = useMemo(() => {
    return products.map(p => {
      // Parse brand (ưu tiên brandName → object.name → DBRef.$id → string → map)
      let brandName = 'Chưa có';
      let brandIdFromRef = null;
      if (p?.brandName) {
        brandName = p.brandName;
      } else if (typeof p?.brand === 'object' && p.brand?.name) {
        brandName = p.brand.name;
      } else if (typeof p?.brand === 'object' && p.brand?.$id) {
        // MongoDB DBRef
        const idValue = p.brand.$id;
        brandIdFromRef = typeof idValue === 'object' && idValue?.$oid ? idValue.$oid : String(idValue);
        if (brandMap[brandIdFromRef]) brandName = brandMap[brandIdFromRef];
      } else if (typeof p?.brand === 'string') {
        brandName = p.brand || 'Chưa có';
      } else if (p?.brandId && brandMap[p.brandId]) {
        brandName = brandMap[p.brandId];
      } else if (typeof p?.brand === 'string' && brandMap[p.brand]) {
        // brand là id dạng string
        brandName = brandMap[p.brand];
      }

      // Parse category (ưu tiên categoryName → object.name → DBRef.$id → string)
      let categoryName = 'Chưa phân loại';
      let categoryIdFromRef = null;
      if (p?.categoryName) {
        categoryName = p.categoryName;
      } else if (typeof p?.category === 'object' && p.category?.name) {
        categoryName = p.category.name;
      } else if (typeof p?.category === 'object' && p.category?.$id) {
        const idValue = p.category.$id;
        categoryIdFromRef = typeof idValue === 'object' && idValue?.$oid ? idValue.$oid : String(idValue);
        // chưa có categoryMap, giữ id cuối để hiển thị fallback
        categoryName = categoryIdFromRef || 'Chưa phân loại';
      } else if (typeof p?.category === 'string') {
        categoryName = p.category || 'Chưa phân loại';
      }

      return {
        ...p,
        type: 'product',
        displayName: p.name,
        // Trạng thái duyệt lấy trực tiếp từ product
        approvalStatus: p.status || 'APPROVED',
        price: 0,
        images: [],
        stock: 0,
        brand: brandName,
        category: categoryName,
      };
    });
  }, [products, brandMap]);

  // Filter items
  const filteredItems = useMemo(() => {
    return allItems.filter(item => {
      const matchesSearch = searchTerm === '' || 
        item.displayName?.toLowerCase().includes(searchTerm.toLowerCase());

      // Lọc theo 3 trạng thái duyệt
      const matchesStatus = statusFilter === 'ALL' ||
        item.approvalStatus === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [allItems, searchTerm, statusFilter]);

  // Log counts và filter
  useEffect(() => {
    const counts = {
      total: allItems.length,
      approved: allItems.filter(i => i.approvalStatus === 'APPROVED').length,
      pending: allItems.filter(i => i.approvalStatus === 'PENDING').length,
      rejected: allItems.filter(i => i.approvalStatus === 'REJECTED').length,
    };
  }, [allItems, statusFilter]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const getApprovalBadge = (status) => {
    switch (status) {
      case 'APPROVED':
        return { label: 'Đã duyệt', className: 'bg-green-100 text-green-800', icon: '✅' };
      case 'PENDING':
        return { label: 'Chờ duyệt', className: 'bg-yellow-100 text-yellow-800', icon: '⏳' };
      case 'REJECTED':
        return { label: 'Từ chối', className: 'bg-red-100 text-red-800', icon: '❌' };
      default:
        return { label: status, className: 'bg-gray-100 text-gray-800', icon: '📋' };
    }
  };

  if (loading || storeLoading) {
    return (
      <StoreLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </StoreLayout>
    );
  }

  return (
    <StoreStatusGuard currentStore={currentStore} pageName="sản phẩm" loading={storeLoading}>
      <StoreLayout>
        <div className="min-h-screen bg-gray-50 p-6">
          {/* Header với gradient cyan-blue */}
          <div className="bg-gradient-to-r from-cyan-200 to-blue-200 rounded-2xl p-6 mb-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                    <span className="text-3xl">📦</span>
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                      Quản lý sản phẩm
                    </h1>
                    <p className="text-gray-600 text-sm">Quản lý danh sách sản phẩm của cửa hàng</p>
                  </div>
                </div>
                <Link
                  to="/store-dashboard/products/create"
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-all flex items-center gap-2"
                >
                  <span>➕</span>
                  Thêm Sản Phẩm Mới
                </Link>
              </div>

              {/* Stats Cards - Nằm trong cùng khung */}
              {/* ✅ Dùng API count-by-status (như yêu cầu), fallback về tính từ products hiện tại nếu API không tồn tại */}
              {(() => {
                const stats = statsData?.success ? statsData.data : null;
                const displayStats = {
                  total: stats?.total || stats?.TOTAL || (statsData?.success ? 0 : products.length),
                  approved: stats?.APPROVED || stats?.approved || (statsData?.success ? 0 : allItems.filter(i => i.approvalStatus === 'APPROVED').length),
                  pending: stats?.PENDING || stats?.pending || (statsData?.success ? 0 : allItems.filter(i => i.approvalStatus === 'PENDING').length),
                  rejected: stats?.REJECTED || stats?.rejected || (statsData?.success ? 0 : allItems.filter(i => i.approvalStatus === 'REJECTED').length),
                };
                
                return (
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <span className="text-lg">📦</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">Tổng sản phẩm</p>
                          <p className="text-xl font-bold text-gray-900">{displayStats.total}</p>
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
                          <p className="text-xl font-bold text-gray-900">{displayStats.approved}</p>
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
                          <p className="text-xl font-bold text-gray-900">{displayStats.pending}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-orange-50 rounded-lg p-4 border border-orange-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                          <span className="text-lg">⚠️</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">Bị từ chối</p>
                          <p className="text-xl font-bold text-gray-900">{displayStats.rejected}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
            <div className="flex gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Tìm kiếm sản phẩm..."
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

          {/* Products Table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {filteredItems.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-300 text-5xl mb-3">📦</div>
                <p className="text-gray-500 font-medium">Không tìm thấy sản phẩm nào</p>
                <p className="text-gray-400 text-sm mt-1">Thử tạo sản phẩm mới hoặc thay đổi bộ lọc</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên sản phẩm</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thương hiệu</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Danh mục</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredItems.map((item) => {
                    const approvalBadge = getApprovalBadge(item.approvalStatus);
                    
                    return (
                      <tr key={`${item.type}-${item.id}`} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">{item.displayName}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-700">{item.brand || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-700">{item.category || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-md text-xs font-semibold ${approvalBadge.className}`}>
                            {approvalBadge.icon} {approvalBadge.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => navigate(`/store-dashboard/products/${item.id}`)}
                              className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                              title="Xem chi tiết"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                              </svg>
                            </button>
                            
                            <button
                              onClick={() => {
                                if (item.approvalStatus !== 'APPROVED') {
                                  toast?.error?.('Sản phẩm phải được duyệt thành công trước khi thêm biến thể. Vui lòng đợi sản phẩm được duyệt.');
                                  return;
                                }
                                navigate(`/store-dashboard/products/create-variant?productId=${item.id}`);
                              }}
                              className={`p-2 rounded-lg transition-colors ${
                                item.approvalStatus === 'APPROVED'
                                  ? 'bg-green-50 text-green-600 hover:bg-green-100'
                                  : 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
                              }`}
                              title={item.approvalStatus === 'APPROVED' ? 'Thêm biến thể' : 'Sản phẩm phải được duyệt trước khi thêm biến thể'}
                              disabled={item.approvalStatus !== 'APPROVED'}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/>
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </StoreLayout>
    </StoreStatusGuard>
  );
};

export default StoreProducts;
