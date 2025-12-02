import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useStoreContext } from '../../context/StoreContext';
import { createStore } from '../../services/b2c/b2cStoreService';
import { useToast } from '../../hooks/useToast';
import MainLayout from '../../layouts/MainLayout';
import SEO from '../../components/seo/SEO';

const BecomeStoreOwner = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { userStores: stores, loading: storesLoading, fetchUserStores } = useStoreContext();
  const toast = useToast();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: {
      province: '',
      ward: '',
      homeAddress: '',
    },
    logo: null, // File object
  });
  const [logoPreview, setLogoPreview] = useState(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      toast?.error('Vui lòng đăng nhập để tiếp tục');
      navigate('/auth?tab=login');
    }
  }, [isAuthenticated, navigate, toast]);

  // Check if user already has stores
  useEffect(() => {
    if (!storesLoading && stores && stores.length > 0) {
      // User đã có store → redirect to store dashboard để tạo store mới
      toast?.info('Bạn đã có cửa hàng. Đang chuyển đến trang quản lý...');
      navigate('/store-dashboard');
    }
  }, [stores, storesLoading, navigate, toast]);

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

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast?.error('Vui lòng chọn file ảnh');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast?.error('Kích thước ảnh không được vượt quá 5MB');
        return;
      }
      
      setFormData({ ...formData, logo: file });
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name.trim()) {
      toast?.error('Vui lòng nhập tên cửa hàng');
      return;
    }
    
    if (!formData.address.province.trim() || !formData.address.ward.trim() || !formData.address.homeAddress.trim()) {
      toast?.error('Vui lòng nhập đầy đủ địa chỉ cửa hàng');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await createStore(formData);
      
      if (result.success) {
        toast?.success('Tạo cửa hàng thành công! Đang chờ admin duyệt...');
        // Refresh stores list
        await fetchUserStores();
        // Redirect to store dashboard
        setTimeout(() => {
          navigate('/store-dashboard');
        }, 1500);
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

  if (!isAuthenticated || storesLoading) {
    return (
      <MainLayout>
        <SEO 
          title="Trở thành chủ Store | E-Comm"
          description="Đăng ký trở thành chủ cửa hàng trên E-Comm. Bán sản phẩm và phát triển kinh doanh online."
          keywords="trở thành chủ store, đăng ký cửa hàng, bán hàng online, seller"
          url="https://pbl-6-eight.vercel.app/become-store-owner"
        />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <SEO 
        title="Trở thành chủ Store | E-Comm"
        description="Đăng ký trở thành chủ cửa hàng trên E-Comm. Tạo cửa hàng của riêng bạn, bán sản phẩm và phát triển kinh doanh online. Dễ dàng quản lý đơn hàng, sản phẩm và doanh thu."
        keywords="trở thành chủ store, đăng ký cửa hàng, bán hàng online, seller, tạo cửa hàng, kinh doanh online"
        url="https://pbl-6-eight.vercel.app/become-store-owner"
      />
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50 py-12">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-orange-500 to-pink-500 rounded-full mb-6">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Trở thành <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-500">Chủ cửa hàng</span>
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Bắt đầu hành trình kinh doanh của bạn. Tạo cửa hàng đầu tiên và tiếp cận hàng triệu khách hàng!
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Store Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tên cửa hàng <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all"
                  placeholder="VD: Cửa hàng công nghệ ABC"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Mô tả cửa hàng
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="4"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all resize-none"
                  placeholder="Mô tả ngắn về cửa hàng của bạn..."
                ></textarea>
              </div>

              {/* Address */}
              <div className="space-y-4">
                <label className="block text-sm font-semibold text-gray-700">
                  Địa chỉ cửa hàng <span className="text-red-500">*</span>
                </label>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    name="address.province"
                    value={formData.address.province}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all"
                    placeholder="Tỉnh/Thành phố (VD: Đà Nẵng)"
                    required
                  />
                  <input
                    type="text"
                    name="address.ward"
                    value={formData.address.ward}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all"
                    placeholder="Phường/Xã (VD: Hải Châu)"
                    required
                  />
                </div>
                
                <input
                  type="text"
                  name="address.homeAddress"
                  value={formData.address.homeAddress}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all"
                  placeholder="Số nhà, đường (VD: 111 AXA, Lâm Chiểu)"
                  required
                />
              </div>

              {/* Logo Upload */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Logo cửa hàng (Tùy chọn)
                </label>
                <div className="flex items-center gap-4">
                  {logoPreview && (
                    <div className="w-24 h-24 rounded-lg overflow-hidden border-2 border-gray-200">
                      <img src={logoPreview} alt="Logo preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <label className="flex-1 cursor-pointer">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-orange-500 transition-colors">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="mt-2 text-sm text-gray-600">
                        {formData.logo ? formData.logo.name : 'Click để chọn ảnh logo'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">PNG, JPG tối đa 5MB</p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Info Note */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>📧 Email & 📞 Số điện thoại:</strong> Sẽ tự động lấy từ tài khoản của bạn ({user?.email || 'N/A'})
                </p>
              </div>

              {/* Benefits Section */}
              <div className="bg-gradient-to-r from-orange-50 to-pink-50 rounded-xl p-6 my-8">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                  </svg>
                  Quyền lợi khi trở thành chủ cửa hàng:
                </h3>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-700">
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                    Tiếp cận hàng triệu khách hàng
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-pink-500 rounded-full"></span>
                    Công cụ quản lý chuyên nghiệp
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                    Hỗ trợ marketing & quảng cáo
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    Thanh toán nhanh chóng, an toàn
                  </li>
                </ul>
              </div>

              {/* Submit Button */}
              <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium transition-colors"
                >
                  ← Quay lại
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-8 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold rounded-lg hover:from-orange-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      Đăng ký cửa hàng
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Info Note */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <div>
                <p className="font-semibold mb-1">Lưu ý:</p>
                <ul className="space-y-1 text-blue-700">
                  <li>• Cửa hàng của bạn sẽ được admin xét duyệt trong vòng 24-48 giờ</li>
                  <li>• Sau khi được duyệt, bạn có thể bắt đầu đăng sản phẩm và bán hàng</li>
                  <li>• Vui lòng cung cấp thông tin chính xác để quá trình duyệt diễn ra nhanh chóng</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default BecomeStoreOwner;
