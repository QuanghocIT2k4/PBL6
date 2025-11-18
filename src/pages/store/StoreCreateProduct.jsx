import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import StoreLayout from '../../layouts/StoreLayout';
import StoreStatusGuard from '../../components/store/StoreStatusGuard';
import { useStoreContext } from '../../context/StoreContext';
import { createProduct } from '../../services/b2c/b2cProductService';
import { useToast } from '../../context/ToastContext';

const productSchema = z.object({
  name: z.string().min(1, 'Tên sản phẩm là bắt buộc').trim(),
  description: z.string().min(1, 'Mô tả sản phẩm là bắt buộc').trim(),
  brand: z.string().min(1, 'Thương hiệu là bắt buộc'),
  category: z.string().min(1, 'Danh mục là bắt buộc')
});

const StoreCreateProduct = () => {
  const navigate = useNavigate();
  const { currentStore, loading: storeLoading } = useStoreContext();
  const { showToast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      description: '',
      brand: '',
      category: ''
    }
  });

  // Categories list - Tiếng Anh để backend nhận được
  const categories = [
    { value: 'Phone', label: 'Điện thoại' },
    { value: 'Laptop', label: 'Laptop' },
    { value: 'Tablet', label: 'Máy tính bảng' },
    { value: 'Smartwatch', label: 'Đồng hồ thông minh' },
    { value: 'Headphone', label: 'Tai nghe' },
    { value: 'Accessories', label: 'Phụ kiện' },
    { value: 'Other', label: 'Khác' }
  ];

  // Brands list
  const brands = [
    'Apple',
    'Samsung',
    'Xiaomi',
    'Oppo',
    'Vivo',
    'Realme',
    'Huawei',
    'Nokia',
    'Sony',
    'LG',
    'Asus',
    'Acer',
    'Dell',
    'HP',
    'Lenovo',
    'MSI',
    'Khác'
  ];

  const onSubmit = async (data) => {
    try {
      // Tạo product data theo API spec
      const productData = {
        name: data.name.trim(),
        description: data.description.trim(),
        brand: data.brand.trim(),
        category: data.category,
        storeId: currentStore.id
      };
      
      console.log('Creating product:', productData);
      
      const result = await createProduct(productData);
      
      if (result.success) {
        showToast('Tạo sản phẩm thành công! Bây giờ bạn có thể thêm biến thể.', 'success');
        // Navigate to products list
        navigate('/store-dashboard/products');
      } else {
        showToast(result.error || 'Không thể tạo sản phẩm', 'error');
      }
    } catch (error) {
      console.error('Error creating product:', error);
      showToast('Lỗi khi tạo sản phẩm', 'error');
    }
  };

  return (
    <StoreStatusGuard currentStore={currentStore} pageName="tạo sản phẩm" loading={storeLoading}>
      <StoreLayout>
        <div className="max-w-3xl mx-auto py-8 px-4">
          {/* Header */}
          <div className="mb-8">
            <div className="bg-gradient-to-r from-cyan-200 to-blue-200 rounded-2xl p-6">
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                    <span className="text-3xl">📦</span>
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold">
                      <span className="text-cyan-600">Thêm</span>{' '}
                      <span className="text-blue-600">Sản phẩm mới</span>
                    </h1>
                    <p className="text-gray-600 mt-1">Tạo sản phẩm mới cho cửa hàng</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-xl border-2 border-gray-200 p-8 shadow-lg space-y-6">
            {/* Tên sản phẩm - Full width */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Tên sản phẩm <span className="text-red-600">*</span>
              </label>
              <input
                {...register('name')}
                type="text"
                className={`w-full px-4 py-2.5 border-2 rounded-lg focus:ring-2 transition-all ${
                  errors.name ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                }`}
                placeholder="VD: iPhone 15 Pro Max"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            {/* Row 1: Danh mục + Thương hiệu */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Danh mục */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Danh mục <span className="text-red-600">*</span>
                </label>
                <select
                  {...register('category')}
                  className={`w-full px-4 py-2.5 border-2 rounded-lg focus:ring-2 transition-all ${
                    errors.category ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                >
                  <option value="">-- Chọn danh mục --</option>
                  {categories.map((cat) => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
                {errors.category && (
                  <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
                )}
              </div>

              {/* Thương hiệu */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Thương hiệu <span className="text-red-600">*</span>
                </label>
                <select
                  {...register('brand')}
                  className={`w-full px-4 py-2.5 border-2 rounded-lg focus:ring-2 transition-all ${
                    errors.brand ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                >
                  <option value="">-- Chọn thương hiệu --</option>
                  {brands.map((brand) => (
                    <option key={brand} value={brand}>{brand}</option>
                  ))}
                </select>
                {errors.brand && (
                  <p className="mt-1 text-sm text-red-600">{errors.brand.message}</p>
                )}
              </div>
            </div>

            {/* Mô tả - Full width */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Mô tả sản phẩm <span className="text-red-600">*</span>
              </label>
              <textarea
                {...register('description')}
                rows={4}
                className={`w-full px-4 py-2.5 border-2 rounded-lg focus:ring-2 transition-all ${
                  errors.description ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                }`}
                placeholder="Mô tả chi tiết về sản phẩm..."
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>

            {/* Info box */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">ℹ️</span>
                <div>
                  <p className="text-sm font-medium text-blue-900 mb-1">Lưu ý quan trọng:</p>
                  <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                    <li>Sau khi tạo sản phẩm, bạn sẽ cần tạo <strong>biến thể</strong> (variant) để thêm giá, tồn kho và hình ảnh.</li>
                    <li>Biến thể là các phiên bản khác nhau của sản phẩm (VD: Màu sắc, dung lượng khác nhau).</li>
                    <li>Sản phẩm chỉ hiển thị trên trang bán khi đã có ít nhất 1 biến thể.</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => navigate('/store-dashboard/products')}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-bold transition-all"
              >
                ❌ Hủy
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Đang tạo...
                  </>
                ) : (
                  <>✅ Tạo sản phẩm</>
                )}
              </button>
            </div>
          </form>
        </div>
      </StoreLayout>
    </StoreStatusGuard>
  );
};

export default StoreCreateProduct;
