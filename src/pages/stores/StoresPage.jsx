import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../layouts/MainLayout';
import { getAllStores } from '../../services/common/storeService';
import { useToast } from '../../context/ToastContext';
import { getFullImageUrl } from '../../utils/imageUtils';

const StoresPage = () => {
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name'); // name, rating, products, orders

  useEffect(() => {
    loadStores();
  }, []);

  const loadStores = async () => {
    try {
      setLoading(true);
      
      // ✅ Gọi API thật
      const result = await getAllStores({
        page: 0,
        size: 100, // Lấy nhiều để filter/sort trên frontend
        sortBy: 'createdAt',
        sortDir: 'desc',
      });
      
      if (result.success) {
        const data = result.data;
        const storeList = data.content || data || [];
        
        // ✅ Chỉ hiển thị stores đã được duyệt
        const approvedStores = storeList.filter(store => store.status === 'APPROVED');
        setStores(approvedStores);
      } else {
        console.error('Failed to fetch stores:', result.error);
        showError('Không thể tải danh sách cửa hàng');
        setStores([]);
      }
    } catch (error) {
      console.error('Error loading stores:', error);
      showError('Đã có lỗi xảy ra khi tải danh sách cửa hàng');
      setStores([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedStores = stores
    .filter(store => {
      const name = store.name || '';
      const description = store.description || '';
      return name.toLowerCase().includes(searchTerm.toLowerCase()) ||
             description.toLowerCase().includes(searchTerm.toLowerCase());
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          const ratingA = a.stats?.averageRating || a.averageRating || 0;
          const ratingB = b.stats?.averageRating || b.averageRating || 0;
          return ratingB - ratingA;
        case 'products':
          const productsA = a.stats?.totalProducts || a.totalProducts || 0;
          const productsB = b.stats?.totalProducts || b.totalProducts || 0;
          return productsB - productsA;
        case 'orders':
          const ordersA = a.stats?.totalOrders || a.totalOrders || 0;
          const ordersB = b.stats?.totalOrders || b.totalOrders || 0;
          return ordersB - ordersA;
        default:
          return a.name.localeCompare(b.name);
      }
    });

  const handleStoreClick = (storeId) => {
    navigate(`/store/${storeId}`);
    success(`🏪 Đang xem chi tiết cửa hàng`);
  };

  const renderStars = (rating) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`text-sm ${
              star <= rating ? 'text-yellow-400' : 'text-gray-300'
            }`}
          >
            ★
          </span>
        ))}
        <span className="text-sm text-gray-600 ml-1">({rating})</span>
      </div>
    );
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-gray-200 h-64 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Danh sách cửa hàng
          </h1>
          <p className="text-gray-600">
            Khám phá các cửa hàng uy tín tại Đà Nẵng
          </p>
        </div>

        {/* Search and Filter */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Tìm kiếm cửa hàng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="sm:w-48">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="name">Sắp xếp theo tên</option>
              <option value="rating">Sắp xếp theo đánh giá</option>
              <option value="products">Sắp xếp theo sản phẩm</option>
              <option value="orders">Sắp xếp theo đơn hàng</option>
            </select>
          </div>
        </div>

        {/* Stores Grid */}
        {filteredAndSortedStores.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🏪</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Không tìm thấy cửa hàng nào
            </h3>
            <p className="text-gray-600">
              Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedStores.map((store) => (
              <div
                key={store.id}
                onClick={() => handleStoreClick(store.id)}
                className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer group"
              >
                {/* Store Banner */}
                <div className="h-32 bg-gradient-to-r from-blue-500 to-purple-600 rounded-t-lg relative overflow-hidden">
                  <div className="absolute inset-0 bg-black bg-opacity-20"></div>
                  <div className="absolute top-3 left-3">
                    <span className="px-2 py-1 bg-green-500 text-white text-xs rounded-full">
                      ✓ Đã duyệt
                    </span>
                  </div>
                  <div className="absolute bottom-3 right-3 text-white text-sm font-medium">
                    {store.stats?.totalProducts || store.totalProducts || 0} sản phẩm
                  </div>
                </div>

                {/* Store Info */}
                <div className="p-4">
                  <div className="flex items-start space-x-3 mb-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center overflow-hidden">
                      {getFullImageUrl(store.logoUrl) ? (
                        <img 
                          src={getFullImageUrl(store.logoUrl)} 
                          alt={store.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.parentElement.innerHTML = `<span class="text-white font-bold text-lg">${(store.name || 'S')[0]}</span>`;
                          }}
                        />
                      ) : (
                        <span className="text-white font-bold text-lg">{(store.name || 'S')[0]}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors duration-200 truncate">
                        {store.name}
                      </h3>
                      <p className="text-sm text-gray-600 truncate">
                        {store.address?.suggestedName || store.address?.homeAddress || 'Địa chỉ cửa hàng'}
                      </p>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {store.description || 'Cửa hàng bán lẻ công nghệ'}
                  </p>

                  {/* Stats */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Đánh giá:</span>
                      {renderStars(store.stats?.averageRating || store.averageRating || 0)}
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Đơn hàng:</span>
                      <span className="font-medium">{(store.stats?.totalOrders || store.totalOrders || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Reviews:</span>
                      <span className="font-medium">{store.stats?.totalReviews || store.totalReviews || 0}</span>
                    </div>
                  </div>

                  {/* Action Button */}
                  <button className="w-full mt-4 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200">
                    Xem cửa hàng
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Stats Summary */}
        {stores.length > 0 && (
          <div className="mt-12 bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Thống kê tổng quan
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {stores.length}
                </div>
                <div className="text-sm text-gray-600">Cửa hàng</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {stores.reduce((sum, store) => sum + (store.stats?.totalProducts || store.totalProducts || 0), 0)}
                </div>
                <div className="text-sm text-gray-600">Sản phẩm</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {stores.reduce((sum, store) => sum + (store.stats?.totalOrders || store.totalOrders || 0), 0).toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Đơn hàng</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {stores.length > 0 
                    ? (stores.reduce((sum, store) => sum + (store.stats?.averageRating || store.averageRating || 0), 0) / stores.length).toFixed(1)
                    : '0.0'
                  }
                </div>
                <div className="text-sm text-gray-600">Đánh giá TB</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default StoresPage;
