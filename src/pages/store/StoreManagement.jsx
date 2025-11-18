import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StoreLayout from '../../layouts/StoreLayout';
import { useStoreContext } from '../../context/StoreContext';
import { createStore } from '../../services/b2c/b2cStoreService';
import { useToast } from '../../hooks/useToast';

const StoreManagement = () => {
  const navigate = useNavigate();
  const { userStores, currentStore, selectStore, refreshStores } = useStoreContext();
  const toast = useToast();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: {
      province: '',
      ward: '',
      homeAddress: '',
    },
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Handle nested address fields
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setFormData({
        ...formData,
        address: {
          ...formData.address,
          [addressField]: value,
        },
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name.trim()) {
      toast?.error('Vui lòng nhập tên cửa hàng');
      return;
    }
    
    if (!formData.phone.trim() || formData.phone.length < 10) {
      toast?.error('Vui lòng nhập số điện thoại hợp lệ');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await createStore(formData);
      
      if (result.success) {
        toast?.success('Tạo cửa hàng thành công! Đang chờ admin duyệt...');
        // Refresh stores list
        await refreshStores();
        // Reset form
        setFormData({
          name: '',
          description: '',
          phone: '',
          email: '',
          address: '',
        });
        setShowCreateForm(false);
      } else {
        toast?.error(result.error || 'Không thể tạo cửa hàng');
      }
    } catch (error) {
      console.error('Error creating store:', error);
      toast?.error('Đã có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'APPROVED': { text: 'Đã duyệt', color: 'bg-green-100 text-green-700 border-green-300' },
      'PENDING': { text: 'Chờ duyệt', color: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
      'REJECTED': { text: 'Từ chối', color: 'bg-red-100 text-red-700 border-red-300' },
    };
    const statusInfo = statusMap[status] || { text: 'Không xác định', color: 'bg-gray-100 text-gray-700 border-gray-300' };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${statusInfo.color}`}>
        {statusInfo.text}
      </span>
    );
  };

  return (
    <StoreLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quản lý chi nhánh</h1>
            <p className="text-gray-600 mt-1">Quản lý và tạo mới các chi nhánh của bạn</p>
          </div>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-lg hover:from-green-600 hover:to-green-700 transition-all shadow-sm hover:shadow-md"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/>
            </svg>
            {showCreateForm ? 'Hủy' : 'Thêm store mới'}
          </button>
        </div>

        {/* Create Form */}
        {showCreateForm && (
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Tạo store mới</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tên cửa hàng <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                  placeholder="VD: Cửa hàng công nghệ ABC"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Mô tả cửa hàng
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="3"
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all resize-none"
                  placeholder="Mô tả ngắn về cửa hàng của bạn..."
                ></textarea>
              </div>

              {/* Address */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-700">
                  Địa chỉ cửa hàng <span className="text-red-500">*</span>
                </label>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="text"
                    name="address.province"
                    value={formData.address.province}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                    placeholder="Tỉnh/Thành phố (VD: Đà Nẵng)"
                    required
                  />
                  <input
                    type="text"
                    name="address.ward"
                    value={formData.address.ward}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                    placeholder="Phường/Xã (VD: Hải Châu)"
                    required
                  />
                </div>
                
                <input
                  type="text"
                  name="address.homeAddress"
                  value={formData.address.homeAddress}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                  placeholder="Số nhà, đường (VD: 111 AXA, Lâm Chiểu)"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setFormData({
                      name: '',
                      description: '',
                      address: {
                        province: '',
                        ward: '',
                        homeAddress: '',
                      },
                    });
                  }}
                  className="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-lg hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Đang xử lý...
                    </>
                  ) : (
                    'Tạo store'
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Stores List */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Danh sách chi nhánh ({userStores?.length || 0})</h2>
          </div>
          <div className="p-6">
            {!userStores || userStores.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                </svg>
                <p className="text-gray-600 mb-4">Bạn chưa có chi nhánh nào</p>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-lg hover:from-green-600 hover:to-green-700 transition-all"
                >
                  Tạo chi nhánh đầu tiên
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {userStores.map((store) => (
                  <div
                    key={store.id}
                    className={`p-4 border-2 rounded-lg transition-all cursor-pointer ${
                      currentStore?.id === store.id
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                    }`}
                    onClick={() => {
                      selectStore(store.id);
                      toast?.success(`Đã chuyển sang ${store.name}`);
                    }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-lg">
                          {store.name?.charAt(0).toUpperCase() || 'S'}
                        </span>
                      </div>
                      {getStatusBadge(store.status)}
                    </div>
                    <h3 className="font-bold text-gray-900 mb-1">{store.name}</h3>
                    <p className="text-sm text-gray-600 mb-2">
                      {typeof store.address === 'string'
                        ? store.address
                        : (store.address?.homeAddress || store.address?.suggestedName || '') +
                          (store.address?.ward ? `, ${store.address.ward}` : '') +
                          (store.address?.province ? `, ${store.address.province}` : '')
                      }
                    </p>
                    {currentStore?.id === store.id && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <span className="text-xs font-medium text-green-600">✓ Đang sử dụng</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Info Note */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <div>
              <p className="font-semibold mb-1">Lưu ý:</p>
              <ul className="space-y-1 text-blue-700">
                <li>• Cửa hàng mới sẽ được admin xét duyệt trong vòng 24-48 giờ</li>
                <li>• Sau khi được duyệt, bạn có thể bắt đầu đăng sản phẩm và bán hàng</li>
                <li>• Click vào chi nhánh để chuyển đổi sang chi nhánh đó</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </StoreLayout>
  );
};

export default StoreManagement;



