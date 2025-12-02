import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../layouts/MainLayout';
import ProfileHeader from './ProfileHeader';
import PersonalInfoForm from './PersonalInfoForm';
import PasswordChangeForm from '../../components/profile/PasswordChangeForm';
import AddressSelector from '../../components/checkout/AddressSelector';
// ❌ COMMENT OUT CÁC IMPORT CHƯA TỒN TẠI
// import OrderHistoryTab from '../../components/profile/OrderHistoryTab';
// import PreferencesTab from '../../components/profile/PreferencesTab';
import { useProfile } from '../../hooks/useProfile';
import SEO from '../../components/seo/SEO';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { 
    profile, 
    orderHistory, 
    loading, 
    error, 
    updateProfile, 
    changePassword, 
    uploadAvatar 
  } = useProfile();
  
  const [activeTab, setActiveTab] = useState('personal');

  // Open orders tab if ?tab=orders is provided
  useState(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab === 'orders') setActiveTab('orders');
  });

  const tabs = [
    { id: 'personal', name: 'Thông tin cá nhân', icon: '👤' },
    { id: 'password', name: 'Đổi mật khẩu', icon: '🔒' },
    { id: 'addresses', name: 'Địa chỉ giao hàng', icon: '📍' },
    { id: 'preferences', name: 'Tùy chỉnh', icon: '⚙️' }
  ];

  if (loading) {
    return (
      <MainLayout>
        <SEO 
          title="Hồ sơ cá nhân | E-Comm"
          description="Quản lý thông tin cá nhân, địa chỉ giao hàng và cài đặt tài khoản của bạn."
          keywords="hồ sơ, thông tin cá nhân, tài khoản, cài đặt"
          url="https://pbl-6-eight.vercel.app/profile"
        />
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="bg-gray-200 h-32 rounded-lg mb-6"></div>
            <div className="bg-gray-200 h-96 rounded-lg"></div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center py-16">
            <div className="text-red-600 mb-4">
              <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <p className="text-lg font-medium">Lỗi tải thông tin profile</p>
              <p className="text-sm">{error}</p>
            </div>
            <button
              onClick={() => navigate('/')}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
            >
              Về trang chủ
            </button>
          </div>
        </div>
      </MainLayout>
    );
  }

  // ✅ SỬA FUNCTION renderTabContent
  const renderTabContent = () => {
    switch (activeTab) {
      case 'personal':
        return (
          <PersonalInfoForm
            profile={profile}
            onSubmit={updateProfile}
            loading={loading}
          />
        );
      case 'password':
        return (
          <PasswordChangeForm
            onSubmit={changePassword}
          />
        );
      case 'orders':
        return (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Lịch sử đơn hàng</h2>
            {orderHistory && orderHistory.length > 0 ? (
              <div className="space-y-4">
                {orderHistory.map((o) => (
                  <div key={o.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-semibold">{o.id}</div>
                        <div className="text-sm text-gray-500">{new Date(o.date).toLocaleString('vi-VN')}</div>
                        <div className="text-sm">Trạng thái: <span className="font-medium">{o.status}</span></div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-red-600">{(o.finalTotal || o.total).toLocaleString('vi-VN')}đ</div>
                      </div>
                    </div>
                    <div className="mt-3 text-sm text-gray-700">
                      {o.items?.map((it, idx) => (
                        <div key={idx} className="flex justify-between">
                          <span className="truncate mr-2">{it.name} x{it.quantity}</span>
                          <span>{(it.price * it.quantity).toLocaleString('vi-VN')}đ</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 text-gray-300">
                  <svg fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 7h-3V6a4 4 0 0 0-8 0v1H5a1 1 0 0 0-1 1v11a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V8a1 1 0 0 0-1-1zM10 6a2 2 0 0 1 4 0v1h-4V6zm8 13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V9h2v1a1 1 0 0 0 2 0V9h4v1a1 1 0 0 0 2 0V9h2v10z"/>
                  </svg>
                </div>
                <p className="text-gray-600 mb-4">Bạn chưa có đơn hàng nào</p>
                <button
                  onClick={() => navigate('/')}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Tiếp tục mua sắm
                </button>
              </div>
            )}
          </div>
        );
      case 'addresses':
        return (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Quản lý địa chỉ giao hàng</h2>
            <p className="text-gray-600 mb-6">
              Quản lý địa chỉ giao hàng của bạn. Địa chỉ này sẽ được sử dụng khi bạn đặt hàng.
            </p>
            <AddressSelector 
              onAddressSelect={(address, id) => {
                console.log('Selected address:', address, id);
              }}
            />
          </div>
        );
      case 'preferences':
        return (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Tùy chỉnh tài khoản</h2>
            <div className="space-y-6">
              {/* Email Preferences */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Thông báo email</h3>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Nhận thông báo về sản phẩm mới</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Nhận thông báo khuyến mãi</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Nhận newsletter hàng tuần</span>
                  </label>
                </div>
              </div>

              {/* Language */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Ngôn ngữ</h3>
                <select className="block w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option value="vi">Tiếng Việt</option>
                  <option value="en">English</option>
                </select>
              </div>

              {/* Save Button */}
              <div className="pt-4">
                <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
                  Lưu tùy chỉnh
                </button>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <MainLayout>
      <SEO 
        title="Hồ sơ cá nhân | E-Comm"
        description="Quản lý thông tin cá nhân, địa chỉ giao hàng và cài đặt tài khoản của bạn."
        keywords="hồ sơ, thông tin cá nhân, tài khoản, cài đặt, địa chỉ giao hàng"
        url="https://pbl-6-eight.vercel.app/profile"
      />
      {/* Breadcrumb */}
      <div className="bg-gray-50 py-4">
        <div className="max-w-6xl mx-auto px-4">
          <nav className="flex items-center space-x-2 text-sm">
            <button
              onClick={() => navigate('/')}
              className="text-gray-500 hover:text-gray-700"
            >
              Trang chủ
            </button>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
            </svg>
            <span className="text-gray-900 font-medium">Hồ sơ cá nhân</span>
          </nav>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <ProfileHeader
          profile={profile}
          onAvatarUpload={uploadAvatar}
        />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <nav className="space-y-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-lg">{tab.icon}</span>
                    <span className="font-medium">{tab.name}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default ProfilePage;