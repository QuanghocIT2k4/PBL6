import { useState, useEffect } from 'react';
import { 
  getUserAddresses, 
  createAddress, 
  updateAddress, 
  deleteAddress, 
  checkHasAddress,
  formatFullAddress,
  validateAddressData 
} from '../../services/buyer/addressService';
import { getProvinces, getDistrictsByProvince, getWardsByDistrict } from '../../services/common/provinceService';
import { useToast } from '../../context/ToastContext';
import { confirmDelete } from '../../utils/sweetalert';

const AddressSelector = ({ onAddressSelect, selectedAddressId = null }) => {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const { success, error, warning } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    province: '',
    provinceCode: '',
    district: '',
    districtCode: '',
    ward: '',
    wardCode: '',
    homeAddress: '',
    suggestedName: '',
    phone: '',
    isDefault: false,
  });

  // Dropdown data
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);

  // Load addresses và provinces khi component mount
  useEffect(() => {
    loadAddresses();
    loadProvinces();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load provinces từ API
  const loadProvinces = async () => {
    try {
      setLoadingProvinces(true);
      const result = await getProvinces();
      console.log('📦 [AddressSelector] Provinces result:', result);
      if (result.success && result.data) {
        // API có thể trả về array hoặc object với data bên trong
        const provincesData = Array.isArray(result.data) 
          ? result.data 
          : (result.data.data || result.data.provinces || []);
        console.log('📦 [AddressSelector] Provinces data:', provincesData);
        setProvinces(provincesData);
      } else {
        console.error('❌ [AddressSelector] Failed to load provinces:', result.error);
      }
    } catch (err) {
      console.error('❌ [AddressSelector] Error loading provinces:', err);
    } finally {
      setLoadingProvinces(false);
    }
  };

  // Load districts khi chọn province
  useEffect(() => {
    if (formData.provinceCode) {
      loadDistricts(formData.provinceCode);
    } else {
      setDistricts([]);
      setWards([]);
      setFormData(prev => ({ ...prev, district: '', districtCode: '', ward: '', wardCode: '' }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.provinceCode]);

  // Load wards khi chọn province (vì file JSON không có district riêng)
  useEffect(() => {
    if (formData.provinceCode) {
      // File JSON local không có district, nên load wards trực tiếp từ provinceCode
      loadWards(formData.provinceCode);
    } else {
      setWards([]);
      setFormData(prev => ({ ...prev, ward: '', wardCode: '' }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.provinceCode]);

  const loadDistricts = async (provinceCode) => {
    try {
      setLoadingDistricts(true);
      const result = await getDistrictsByProvince(provinceCode);
      console.log('📦 [AddressSelector] Districts result:', result);
      if (result.success && result.data) {
        // API có thể trả về array hoặc object với data bên trong
        const districtsData = Array.isArray(result.data) 
          ? result.data 
          : (result.data.data || result.data.districts || []);
        console.log('📦 [AddressSelector] Districts data:', districtsData);
        setDistricts(districtsData);
      } else {
        console.error('❌ [AddressSelector] Failed to load districts:', result.error);
        setDistricts([]);
      }
    } catch (err) {
      console.error('❌ [AddressSelector] Error loading districts:', err);
      setDistricts([]);
    } finally {
      setLoadingDistricts(false);
    }
  };

  const loadWards = async (districtCode) => {
    try {
      setLoadingWards(true);
      const result = await getWardsByDistrict(districtCode);
      console.log('📦 [AddressSelector] Wards result:', result);
      if (result.success && result.data) {
        // API có thể trả về array hoặc object với data bên trong
        const wardsData = Array.isArray(result.data) 
          ? result.data 
          : (result.data.data || result.data.wards || []);
        console.log('📦 [AddressSelector] Wards data:', wardsData);
        setWards(wardsData);
      } else {
        console.error('❌ [AddressSelector] Failed to load wards:', result.error);
        setWards([]);
      }
    } catch (err) {
      console.error('❌ [AddressSelector] Error loading wards:', err);
      setWards([]);
    } finally {
      setLoadingWards(false);
    }
  };

  const loadAddresses = async () => {
    try {
      setLoading(true);
      console.log('📥 Loading user addresses...');
      
      const response = await getUserAddresses();
      
      console.log('✅ Address response:', response);
      
      if (response && response.success && response.data) {
        const addressList = Array.isArray(response.data) ? response.data : [response.data];
        
        console.log('✅ Loaded addresses:', addressList.length);
        setAddresses(addressList);
        
        // Tự động chọn địa chỉ default nếu có
        const defaultAddr = addressList.find(addr => addr.default || addr.isDefault);
        if (defaultAddr && onAddressSelect) {
          const defaultIndex = addressList.indexOf(defaultAddr);
          console.log('✅ Auto-selected default address:', defaultAddr);
          onAddressSelect(defaultAddr, defaultIndex);
        }
      } else {
        console.log('ℹ️ No addresses found');
        setAddresses([]);
      }
    } catch (err) {
      console.error('❌ Error loading addresses:', err);
      console.error('❌ Error response:', err.response?.data);
      
      // addressService đã handle 400/404 → return empty array
      // Nên không cần check lại ở đây
      setAddresses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'provinceCode') {
      // Khi chọn province, tìm tên province
      const selectedProvince = provinces.find(p => 
        (p.code || p.idProvince || p.id) === value
      );
      setFormData(prev => ({
        ...prev,
        provinceCode: value,
        province: selectedProvince?.name || selectedProvince?.provinceName || selectedProvince?.province || '',
        ward: '',
        wardCode: '',
      }));
    } else if (name === 'wardCode') {
      // Khi chọn ward (commune), tìm tên ward
      const selectedWard = wards.find(w => 
        (w.code || w.idCommune || w.id) === value
      );
      setFormData(prev => ({
        ...prev,
        wardCode: value,
        ward: selectedWard?.name || selectedWard?.communeName || selectedWard?.commune || '',
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleSubmitAddress = async (e) => {
    e.preventDefault();

    // Validate
    const validation = validateAddressData(formData);
    if (!validation.isValid) {
      warning(validation.errors[0]);
      return;
    }

    try {
      if (editingId !== null) {
        // Update existing address
        const response = await updateAddress(editingId, formData);
        console.log('Update address response:', response);
        if (response && response.success) {
          success('Cập nhật địa chỉ thành công!');
          resetForm();
          await new Promise(resolve => setTimeout(resolve, 500));
          await loadAddresses();
        } else {
          warning('Không thể cập nhật địa chỉ');
        }
      } else {
        // Create new address
        const response = await createAddress(formData);
        console.log('Create address response:', response);
        if (response && response.success) {
          success('Thêm địa chỉ mới thành công!');
          resetForm();
          // Chờ một chút để backend lưu xong
          await new Promise(resolve => setTimeout(resolve, 500));
          await loadAddresses();
        } else {
          warning('Không thể thêm địa chỉ');
        }
      }
    } catch (err) {
      console.error('Error saving address:', err);
      console.error('Error details:', err.response?.data);
      error(err.response?.data?.message || err.response?.data?.error || err.message || 'Không thể lưu địa chỉ');
    }
  };

  const handleDeleteAddress = async (address) => {
    // Lấy ID từ address object (ưu tiên _id, sau đó id)
    const addressId = address._id || address.id;
    
    if (!addressId) {
      error('Không tìm thấy ID địa chỉ');
      return;
    }

    // Hiển thị confirmation dialog bằng SweetAlert
    const confirmed = await confirmDelete('địa chỉ này');
    if (!confirmed) return;

    try {
      const response = await deleteAddress(addressId);
      if (response.success) {
        success('Đã xóa địa chỉ');
        await new Promise(resolve => setTimeout(resolve, 500));
        await loadAddresses();
      }
    } catch (err) {
      console.error('Error deleting address:', err);
      error(err.response?.data?.message || err.message || 'Không thể xóa địa chỉ');
    }
  };

  const handleEditAddress = async (address, index) => {
    // Tìm province code từ tên province
    let provinceCode = '';
    if (address.province) {
      const foundProvince = provinces.find(p => 
        p.name === address.province || 
        p.name.toLowerCase().includes(address.province.toLowerCase())
      );
      if (foundProvince) {
        provinceCode = foundProvince.code;
        // Load districts cho province này
        await loadDistricts(provinceCode);
      }
    }

    setFormData({
      province: address.province || '',
      provinceCode: provinceCode,
      district: address.district || '',
      districtCode: '',
      ward: address.ward || '',
      wardCode: '',
      homeAddress: address.homeAddress || '',
      suggestedName: address.suggestedName || '',
      phone: address.phone || '',
      isDefault: address.default || address.isDefault || false,
    });
    
    // Backend dùng INDEX theo Swagger spec
    setEditingId(index);
    setShowAddForm(true);
  };

  const resetForm = () => {
    setFormData({
      province: '',
      provinceCode: '',
      ward: '',
      wardCode: '',
      homeAddress: '',
      suggestedName: '',
      phone: '',
      isDefault: false,
    });
    setWards([]);
    setEditingId(null);
    setShowAddForm(false);
  };

  const handleSelectAddress = (address, index) => {
    if (onAddressSelect) {
      onAddressSelect(address, index);
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg border shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg border shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Địa chỉ nhận hàng</h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          {showAddForm ? '✕ Đóng' : '+ Thêm địa chỉ mới'}
        </button>
      </div>

      {/* Form thêm/sửa địa chỉ */}
      {showAddForm && (
        <form onSubmit={handleSubmitAddress} className="mb-6 p-4 bg-gray-50 rounded-lg space-y-3">
          <h3 className="font-semibold text-sm mb-2">
            {editingId !== null ? 'Chỉnh sửa địa chỉ' : 'Thêm địa chỉ mới'}
          </h3>
          
          <div>
            <label className="block text-sm font-medium mb-1">Tên gợi ý (tùy chọn)</label>
            <input
              type="text"
              name="suggestedName"
              value={formData.suggestedName}
              onChange={handleInputChange}
              placeholder="VD: Nhà riêng, Công ty..."
              className="w-full border rounded px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Số điện thoại *</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="0123456789"
              maxLength="10"
              required
              className="w-full border rounded px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Tỉnh/Thành phố *</label>
            <select
              name="provinceCode"
              value={formData.provinceCode}
              onChange={handleInputChange}
              required
              disabled={loadingProvinces}
              className="w-full border rounded px-3 py-2 text-sm"
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

          {formData.provinceCode && (
            <div>
              <label className="block text-sm font-medium mb-1">Phường/Xã *</label>
              <select
                name="wardCode"
                value={formData.wardCode}
                onChange={handleInputChange}
                required
                disabled={loadingWards || wards.length === 0}
                className="w-full border rounded px-3 py-2 text-sm"
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
            <label className="block text-sm font-medium mb-1">Số nhà, tên đường *</label>
            <input
              type="text"
              name="homeAddress"
              value={formData.homeAddress}
              onChange={handleInputChange}
              placeholder="VD: 123 Nguyễn Văn Linh"
              required
              className="w-full border rounded px-3 py-2 text-sm"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              name="isDefault"
              id="isDefault"
              checked={formData.isDefault}
              onChange={handleInputChange}
              className="mr-2"
            />
            <label htmlFor="isDefault" className="text-sm">Đặt làm địa chỉ mặc định</label>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm font-medium"
            >
              {editingId !== null ? 'Cập nhật' : 'Thêm địa chỉ'}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300 text-sm font-medium"
            >
              Hủy
            </button>
          </div>
        </form>
      )}

      {/* Danh sách địa chỉ */}
      {addresses.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p className="mb-2">Bạn chưa có địa chỉ nào</p>
          <button
            onClick={() => setShowAddForm(true)}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            + Thêm địa chỉ đầu tiên
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {addresses.map((address, index) => (
            <div
              key={index}
              className={`border rounded-lg p-4 cursor-pointer transition-all ${
                selectedAddressId === index
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
              onClick={() => handleSelectAddress(address, index)}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <input
                      type="radio"
                      checked={selectedAddressId === index}
                      onChange={() => handleSelectAddress(address, index)}
                      className="mt-1"
                    />
                    <div>
                      {address.suggestedName && (
                        <span className="font-semibold text-sm">
                          {address.suggestedName}
                          {(address.default || address.isDefault) && (
                            <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                              Mặc định
                            </span>
                          )}
                        </span>
                      )}
                      <p className="text-sm text-gray-600 mt-1">
                        {address.phone}
                      </p>
                      <p className="text-sm text-gray-700 mt-1">
                        {formatFullAddress(address)}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditAddress(address, index);
                    }}
                    className="text-blue-600 hover:text-blue-700 text-xs"
                  >
                    Sửa
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteAddress(address);
                    }}
                    className="text-red-600 hover:text-red-700 text-xs"
                  >
                    Xóa
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AddressSelector;

