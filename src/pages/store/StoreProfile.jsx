import React, { useState, useEffect } from 'react';
import StoreLayout from '../../layouts/StoreLayout';
import StoreStatusGuard from '../../components/store/StoreStatusGuard';
import StorePageHeader from '../../components/store/StorePageHeader';
import { useStoreContext } from '../../context/StoreContext';
import { useToast } from '../../context/ToastContext';
import { updateStore, uploadStoreLogo, uploadStoreBanner, getMyStores } from '../../services/b2c/b2cStoreService';
import { getProvinces, getWardsByDistrict } from '../../services/common/provinceService';

const StoreProfile = () => {
  const { currentStore, setCurrentStore } = useStoreContext();
  const { success: showSuccess, error: showError } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState({ logo: false, banner: false });
  
  // Parse address từ currentStore
  const parseAddress = (address) => {
    if (!address) return { province: '', provinceCode: '', ward: '', wardCode: '', homeAddress: '' };
    if (typeof address === 'string') {
      // Nếu là string, tách ra
      const parts = address.split(',').map(s => s.trim());
      return {
        province: parts[parts.length - 1] || '',
        provinceCode: '',
        ward: parts[parts.length - 2] || '',
        wardCode: '',
        homeAddress: parts.slice(0, -2).join(', ') || '',
      };
    }
    // Nếu là object
    return {
      province: address.province || '',
      provinceCode: '',
      ward: address.ward || '',
      wardCode: '',
      homeAddress: address.homeAddress || address.houseAddress || '',
    };
  };
  
  const [formData, setFormData] = useState({
    name: currentStore?.storeName || currentStore?.name || '',
    description: currentStore?.description || '',
    address: parseAddress(currentStore?.address),
  });
  
  // Dropdown data
  const [provinces, setProvinces] = useState([]);
  const [wards, setWards] = useState([]);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);

  // Load provinces khi component mount
  useEffect(() => {
    loadProvinces();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load wards khi chọn province
  useEffect(() => {
    if (formData.address.provinceCode) {
      loadWards(formData.address.provinceCode);
    } else {
      setWards([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.address.provinceCode]);

  // Load provinces và wards khi vào edit mode
  useEffect(() => {
    if (isEditing && formData.address.province && !formData.address.provinceCode) {
      // Tìm provinceCode từ tên province
      const foundProvince = provinces.find(p => 
        (p.name || p.provinceName || p.province) === formData.address.province
      );
      if (foundProvince) {
        setFormData(prev => ({
          ...prev,
          address: {
            ...prev.address,
            provinceCode: foundProvince.code || foundProvince.idProvince || foundProvince.id,
          },
        }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing, provinces]);

  const loadProvinces = async () => {
    try {
      setLoadingProvinces(true);
      const result = await getProvinces();
      if (result.success && result.data) {
        const provincesData = Array.isArray(result.data) 
          ? result.data 
          : (result.data.data || result.data.provinces || []);
        setProvinces(provincesData);
      }
    } catch (err) {
      console.error('Error loading provinces:', err);
    } finally {
      setLoadingProvinces(false);
    }
  };

  const loadWards = async (provinceCode) => {
    try {
      setLoadingWards(true);
      const result = await getWardsByDistrict(provinceCode);
      if (result.success && result.data) {
        const wardsData = Array.isArray(result.data) 
          ? result.data 
          : (result.data.data || result.data.wards || []);
        setWards(wardsData);
        
        // Nếu đang edit và có ward name nhưng chưa có wardCode, tìm wardCode
        if (isEditing && formData.address.ward && !formData.address.wardCode) {
          const foundWard = wardsData.find(w => 
            (w.name || w.communeName || w.commune) === formData.address.ward
          );
          if (foundWard) {
            setFormData(prev => ({
              ...prev,
              address: {
                ...prev.address,
                wardCode: foundWard.code || foundWard.idCommune || foundWard.id,
              },
            }));
          }
        }
      } else {
        setWards([]);
      }
    } catch (err) {
      console.error('Error loading wards:', err);
      setWards([]);
    } finally {
      setLoadingWards(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      
      if (addressField === 'provinceCode') {
        // Khi chọn province, tìm tên province
        const selectedProvince = provinces.find(p => 
          (p.code || p.idProvince || p.id) === value
        );
        setFormData(prev => ({
          ...prev,
          address: {
            ...prev.address,
            provinceCode: value,
            province: selectedProvince?.name || selectedProvince?.provinceName || selectedProvince?.province || '',
            ward: '',
            wardCode: '',
          },
        }));
      } else if (addressField === 'wardCode') {
        // Khi chọn ward, tìm tên ward
        const selectedWard = wards.find(w => 
          (w.code || w.idCommune || w.id) === value
        );
        setFormData(prev => ({
          ...prev,
          address: {
            ...prev.address,
            wardCode: value,
            ward: selectedWard?.name || selectedWard?.communeName || selectedWard?.commune || '',
          },
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          address: {
            ...prev.address,
            [addressField]: value,
          },
        }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Format address theo AddressDTO: { province, ward, homeAddress }
    const addressDTO = {
      province: formData.address.province,
      ward: formData.address.ward,
      homeAddress: formData.address.homeAddress,
    };
    
    const result = await updateStore(currentStore.id, {
      name: formData.name,
      description: formData.description,
      address: addressDTO,
    });

    if (result.success) {
      showSuccess(result.message || 'Cập nhật cửa hàng thành công!');
      // Refresh store data
      const storesResult = await getMyStores();
      if (storesResult.success && storesResult.data?.length > 0) {
        const updatedStore = storesResult.data.find(s => s.id === currentStore.id);
        if (updatedStore) {
          const mappedStore = {
            ...updatedStore,
            logo: updatedStore.logoUrl,
            banner: updatedStore.bannerUrl,
            storeName: updatedStore.name
          };
          setCurrentStore(mappedStore);
        }
      }
      setIsEditing(false);
    } else {
      showError(result.error);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    
    if (!file) {
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showError('Kích thước file không được vượt quá 5MB');
      return;
    }

    setUploading(prev => ({ ...prev, logo: true }));
    
    const result = await uploadStoreLogo(currentStore.id, file);
    
    setUploading(prev => ({ ...prev, logo: false }));

    if (result.success) {
      showSuccess(result.message);
      
      const storesResult = await getMyStores();
      
      if (storesResult.success && storesResult.data?.length > 0) {
        const updatedStore = storesResult.data.find(s => s.id === currentStore.id);
        
        if (updatedStore) {
          
          // Map backend fields to frontend format
          const mappedStore = {
            ...updatedStore,
            logo: updatedStore.logoUrl,      // Backend: logoUrl → Frontend: logo
            banner: updatedStore.bannerUrl,  // Backend: bannerUrl → Frontend: banner
            storeName: updatedStore.name     // Backend: name → Frontend: storeName
          };
          
          setCurrentStore(mappedStore);
        }
      }
    } else {
      showError(result.error);
    }
  };

  const handleBannerUpload = async (e) => {
    const file = e.target.files?.[0];
    
    if (!file) {
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showError('Kích thước file không được vượt quá 10MB');
      return;
    }

    setUploading(prev => ({ ...prev, banner: true }));
    
    const result = await uploadStoreBanner(currentStore.id, file);
    
    setUploading(prev => ({ ...prev, banner: false }));

    if (result.success) {
      showSuccess(result.message);
      
      const storesResult = await getMyStores();
      
      if (storesResult.success && storesResult.data?.length > 0) {
        const updatedStore = storesResult.data.find(s => s.id === currentStore.id);
        
        if (updatedStore) {
          const mappedStore = {
            ...updatedStore,
            logo: updatedStore.logoUrl,
            banner: updatedStore.bannerUrl,
            storeName: updatedStore.name
          };
          
          setCurrentStore(mappedStore);
        }
      }
    } else {
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

                  {/* Banner - Kích thước lớn hơn */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Banner cửa hàng</label>
                    <div className="relative w-full h-48 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl overflow-hidden border-2 border-gray-200">
                      {currentStore?.banner ? (
                        <img src={currentStore.banner} alt="Banner" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white text-lg">
                          📸 Thêm banner cho cửa hàng
                        </div>
                      )}
                      <label className="absolute bottom-2 right-2 px-4 py-2 bg-white text-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 shadow-lg text-sm font-medium">
                        {uploading.banner ? '⏳ Đang tải...' : '📸 Đổi banner'}
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
                          address: parseAddress(currentStore?.address),
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
                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ cửa hàng</label>
                      
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Tỉnh/Thành phố *</label>
                        <select
                          name="address.provinceCode"
                          value={formData.address.provinceCode}
                          onChange={handleInputChange}
                          required
                          disabled={loadingProvinces}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">-- Chọn Tỉnh/Thành phố --</option>
                          {loadingProvinces ? (
                            <option disabled>Đang tải...</option>
                          ) : (
                            provinces.map((province) => (
                              <option key={province.code || province.idProvince || province.id} value={province.code || province.idProvince || province.id}>
                                {province.name || province.provinceName || province.province}
                              </option>
                            ))
                          )}
                        </select>
                      </div>

                      {formData.address.provinceCode && (
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Phường/Xã *</label>
                          <select
                            name="address.wardCode"
                            value={formData.address.wardCode}
                            onChange={handleInputChange}
                            required
                            disabled={loadingWards || wards.length === 0}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="">-- Chọn Phường/Xã --</option>
                            {loadingWards ? (
                              <option disabled>Đang tải...</option>
                            ) : (
                              wards.map((ward) => (
                                <option key={ward.code || ward.idCommune || ward.id} value={ward.code || ward.idCommune || ward.id}>
                                  {ward.name || ward.communeName || ward.commune}
                                </option>
                              ))
                            )}
                          </select>
                        </div>
                      )}

                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Số nhà, đường *</label>
                        <input
                          type="text"
                          name="address.homeAddress"
                          value={formData.address.homeAddress}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="VD: 123 Nguyễn Văn Linh"
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
                      <span className="text-sm text-gray-500 block mb-1">Địa chỉ</span>
                      <span className="text-gray-900">
                        {typeof currentStore?.address === 'string' 
                          ? currentStore.address 
                          : currentStore?.address 
                            ? `${currentStore.address.houseAddress || currentStore.address.homeAddress || ''}, ${currentStore.address.ward || ''}, ${currentStore.address.province || ''}`.trim().replace(/^,\s*|,\s*$/g, '') 
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
