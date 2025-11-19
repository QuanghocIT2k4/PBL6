import React, { useState } from 'react';
import StoreLayout from '../../layouts/StoreLayout';
import StoreStatusGuard from '../../components/store/StoreStatusGuard';
import StorePageHeader from '../../components/store/StorePageHeader';
import { useStoreContext } from '../../context/StoreContext';
import { useToast } from '../../context/ToastContext';
import { updateStore, uploadStoreLogo, uploadStoreBanner, getMyStores } from '../../services/b2c/b2cStoreService';

const StoreProfile = () => {
  const { currentStore, setCurrentStore } = useStoreContext();
  const { success: showSuccess, error: showError } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState({ logo: false, banner: false });
  const [formData, setFormData] = useState({
    name: currentStore?.storeName || currentStore?.name || '',
    description: currentStore?.description || '',
    address: typeof currentStore?.address === 'string' ? currentStore.address : 
             (currentStore?.address ? `${currentStore.address.houseAddress || ''}, ${currentStore.address.ward || ''}, ${currentStore.address.province || ''}`.trim().replace(/^,\s*|,\s*$/g, '') : ''),
    phone: currentStore?.phone || '',
    email: currentStore?.email || ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const result = await updateStore(currentStore.id, {
      storeName: formData.name,
      description: formData.description,
      address: formData.address,
      phone: formData.phone,
      email: formData.email
    });

    if (result.success) {
      showSuccess(result.message);
      setCurrentStore(result.data);
      setIsEditing(false);
    } else {
      showError(result.error);
    }
  };

  const handleLogoUpload = async (e) => {
    console.log('🎯 Logo upload triggered!', e);
    
    const file = e.target.files?.[0];
    console.log('📁 Selected file:', file);
    
    if (!file) {
      console.log('❌ No file selected');
      return;
    }

    console.log('📊 File info:', {
      name: file.name,
      type: file.type,
      size: `${(file.size / 1024).toFixed(2)} KB`
    });

    if (file.size > 5 * 1024 * 1024) {
      showError('Kích thước file không được vượt quá 5MB');
      return;
    }

    console.log('📤 Uploading logo...');
    setUploading(prev => ({ ...prev, logo: true }));
    
    const result = await uploadStoreLogo(currentStore.id, file);
    console.log('📥 Upload result:', result);
    
    setUploading(prev => ({ ...prev, logo: false }));

    if (result.success) {
      showSuccess(result.message);
      console.log('✅ Success! Logo uploaded:', result.data);
      
      // Fetch lại store data để lấy logo mới từ DB
      console.log('🔄 Fetching updated store data...');
      const storesResult = await getMyStores();
      
      if (storesResult.success && storesResult.data?.length > 0) {
        const updatedStore = storesResult.data.find(s => s.id === currentStore.id);
        
        if (updatedStore) {
          console.log('✅ Store fetched! Full store data:', updatedStore);
          console.log('🔍 logoUrl:', updatedStore.logoUrl);
          console.log('🔍 bannerUrl:', updatedStore.bannerUrl);
          console.log('⚠️ Are they the same?', updatedStore.logoUrl === updatedStore.bannerUrl);
          
          // Map backend fields to frontend format
          const mappedStore = {
            ...updatedStore,
            logo: updatedStore.logoUrl,      // Backend: logoUrl → Frontend: logo
            banner: updatedStore.bannerUrl,  // Backend: bannerUrl → Frontend: banner
            storeName: updatedStore.name     // Backend: name → Frontend: storeName
          };
          
          setCurrentStore(mappedStore);
          console.log('✅ Logo updated successfully!');
        } else {
          console.error('❌ Store not found in list!');
        }
      } else {
        console.error('❌ Failed to fetch stores:', storesResult);
      }
    } else {
      console.error('❌ Upload failed:', result.error);
      showError(result.error);
    }
  };

  const handleBannerUpload = async (e) => {
    console.log('🎯 Banner upload triggered!', e);
    
    const file = e.target.files?.[0];
    console.log('📁 Selected file:', file);
    
    if (!file) {
      console.log('❌ No file selected');
      return;
    }

    console.log('📊 File info:', {
      name: file.name,
      type: file.type,
      size: `${(file.size / 1024).toFixed(2)} KB`
    });

    if (file.size > 10 * 1024 * 1024) {
      showError('Kích thước file không được vượt quá 10MB');
      return;
    }

    console.log('📤 Uploading banner...');
    setUploading(prev => ({ ...prev, banner: true }));
    
    const result = await uploadStoreBanner(currentStore.id, file);
    console.log('📥 Upload result:', result);
    
    setUploading(prev => ({ ...prev, banner: false }));

    if (result.success) {
      showSuccess(result.message);
      console.log('✅ Success! Banner uploaded:', result.data);
      
      // Fetch lại store data để lấy banner mới từ DB
      console.log('🔄 Fetching updated store data...');
      const storesResult = await getMyStores();
      
      if (storesResult.success && storesResult.data?.length > 0) {
        const updatedStore = storesResult.data.find(s => s.id === currentStore.id);
        
        if (updatedStore) {
          console.log('✅ Store fetched! Full store data:', updatedStore);
          console.log('🔍 logoUrl:', updatedStore.logoUrl);
          console.log('🔍 bannerUrl:', updatedStore.bannerUrl);
          console.log('⚠️ Are they the same?', updatedStore.logoUrl === updatedStore.bannerUrl);
          
          // Map backend fields to frontend format
          const mappedStore = {
            ...updatedStore,
            logo: updatedStore.logoUrl,
            banner: updatedStore.bannerUrl,
            storeName: updatedStore.name
          };
          
          setCurrentStore(mappedStore);
          console.log('✅ Banner updated successfully!');
        }
      }
    } else {
      console.error('❌ Upload failed:', result.error);
      showError(result.error);
    }
  };

        return (
    <StoreStatusGuard currentStore={currentStore} pageName="thông tin store" loading={false} allowPending={true}>
      <StoreLayout>
          <div className="space-y-6">
          {/* Header với gradient giống Dashboard */}
          <div className="bg-gradient-to-r from-cyan-200 to-blue-200 rounded-2xl p-6">
            <div className="relative bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-teal-400 to-cyan-400 rounded-2xl flex items-center justify-center shadow-lg">
                    <span className="text-4xl">🏪</span>
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold mb-2">
                      <span className="text-cyan-600">Thông tin</span> <span className="text-blue-600">cửa hàng</span>
                    </h1>
                    <p className="text-gray-600 text-lg">Quản lý thông tin và cài đặt cửa hàng của bạn</p>
                  </div>
                </div>
                {currentStore?.status && (
                  <div className={`px-6 py-3 rounded-xl font-semibold text-sm flex items-center gap-2 ${
                    currentStore.status === 'APPROVED' ? 'bg-green-100 text-green-800 border-2 border-green-300' :
                    currentStore.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800 border-2 border-yellow-300' :
                    'bg-red-100 text-red-800 border-2 border-red-300'
                  }`}>
                    <span className="text-lg">
                      {currentStore.status === 'APPROVED' ? '✅' :
                       currentStore.status === 'PENDING' ? '⏳' : '❌'}
                    </span>
                    <span>
                      {currentStore.status === 'APPROVED' ? 'Đã duyệt' :
                       currentStore.status === 'PENDING' ? 'Chờ duyệt' : 'Đã từ chối'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Store Info Grid */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Logo & Banner */}
              <div className="lg:col-span-1">
                <div className="space-y-4">
                  {/* Logo */}
              <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Logo cửa hàng</label>
                    <div className="relative w-full aspect-square bg-gray-100 rounded-xl overflow-hidden border-2 border-gray-200">
                      {currentStore?.logo ? (
                        <img src={currentStore.logo} alt="Logo" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-6xl">
                          🏪
                  </div>
                )}
                      <label className="absolute bottom-2 right-2 w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-700 shadow-lg">
                        {uploading.logo ? '⏳' : '📷'}
                <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          disabled={uploading.logo}
                          className="hidden"
                        />
                </label>
                </div>
              </div>

                  {/* Banner */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Banner cửa hàng</label>
                    <div className="relative w-full h-32 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl overflow-hidden border-2 border-gray-200">
                      {currentStore?.banner && (
                        <img src={currentStore.banner} alt="Banner" className="w-full h-full object-cover" />
                      )}
                      <label className="absolute bottom-2 right-2 px-3 py-1.5 bg-white text-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 shadow-lg text-sm">
                        {uploading.banner ? 'Đang tải...' : '📸 Đổi'}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleBannerUpload}
                          disabled={uploading.banner}
                          className="hidden"
                        />
                      </label>
                </div>
              </div>
            </div>
          </div>
                
              {/* Store Information */}
              <div className="lg:col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Thông tin cơ bản</h3>
                  {!isEditing ? (
                    <button
                      onClick={() => {
                        setIsEditing(true);
                        setFormData({
                          name: currentStore?.storeName || currentStore?.name || '',
                          description: currentStore?.description || '',
                          address: typeof currentStore?.address === 'string' ? currentStore.address : 
                                   (currentStore?.address ? `${currentStore.address.houseAddress || ''}, ${currentStore.address.ward || ''}, ${currentStore.address.province || ''}`.trim().replace(/^,\s*|,\s*$/g, '') : ''),
                          phone: currentStore?.phone || '',
                          email: currentStore?.email || ''
                        });
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                    >
                      ✏️ Chỉnh sửa
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setIsEditing(false)}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm font-medium"
                      >
                        Hủy
                      </button>
                      <button
                        onClick={handleSubmit}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                      >
                        💾 Lưu
                      </button>
                    </div>
                  )}
              </div>
              
                {isEditing ? (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tên cửa hàng</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ</label>
                      <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                  </div>
                  </form>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <span className="text-sm text-gray-500 block mb-1">Tên cửa hàng</span>
                      <span className="text-gray-900 font-medium">{currentStore?.storeName || currentStore?.name || 'N/A'}</span>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <span className="text-sm text-gray-500 block mb-1">Email</span>
                      <span className="text-gray-900">{currentStore?.email || 'Chưa cập nhật'}</span>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <span className="text-sm text-gray-500 block mb-1">Số điện thoại</span>
                      <span className="text-gray-900">{currentStore?.phone || 'Chưa cập nhật'}</span>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <span className="text-sm text-gray-500 block mb-1">Địa chỉ</span>
                      <span className="text-gray-900">
                        {typeof currentStore?.address === 'string' 
                          ? currentStore.address 
                          : currentStore?.address 
                            ? `${currentStore.address.houseAddress || ''}, ${currentStore.address.ward || ''}, ${currentStore.address.province || ''}`.trim().replace(/^,\s*|,\s*$/g, '') 
                            : 'Chưa cập nhật'}
                      </span>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 col-span-2">
                      <span className="text-sm text-gray-500 block mb-1">Mô tả</span>
                      <span className="text-gray-900">{currentStore?.description || 'Chưa có mô tả'}</span>
                    </div>
                  </div>
                )}
            </div>
          </div>
        </div>
      </div>
      </StoreLayout>
    </StoreStatusGuard>
  );
};

export default StoreProfile;
