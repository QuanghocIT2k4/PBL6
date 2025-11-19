import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import useSWR from 'swr';
import StoreLayout from '../../layouts/StoreLayout';
import { useStoreContext } from '../../context/StoreContext';
import StoreStatusGuard from '../../components/store/StoreStatusGuard';
import { getProductsByStore } from '../../services/b2c/b2cProductService';
import { createProductVariantWithFormData } from '../../services/b2c/b2cProductService';
import { addColorToVariant } from '../../services/b2c/b2cProductService';
import { useToast } from '../../context/ToastContext';
import api from '../../services/common/api';

const AddProductVariant = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const productIdFromQuery = searchParams.get('productId');
  const { currentStore, loading: storeLoading } = useStoreContext();
  const { showToast } = useToast();
  
  // ✅ Ref để track submit - tránh React StrictMode gọi 2 lần
  const hasSubmittedRef = useRef(false);

  // 4 Steps: Basic Info -> Images -> Colors -> Review
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  // Selected Product (auto from query param)
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Step 1: Basic Info
  const [variantName, setVariantName] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [variantDescription, setVariantDescription] = useState('');
  const [attributes, setAttributes] = useState([{ key: '', value: '' }]);

  // Step 2: Images
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [primaryImageIndex, setPrimaryImageIndex] = useState(0);

  // Step 3: Colors (Optional)
  const [hasColors, setHasColors] = useState(false);
  const [colors, setColors] = useState([{ colorName: '', price: '', stock: '', image: null, imagePreview: null }]);

  // Step 4: Review & Submit
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdVariantId, setCreatedVariantId] = useState(null);

  // Fetch products
  const { data: productsData } = useSWR(
    currentStore?.id ? ['store-products-for-variant', currentStore.id] : null,
    () => getProductsByStore(currentStore.id, { page: 0, size: 100 }),
    { revalidateOnFocus: false }
  );

  const products = productsData?.success ? (productsData.data?.content || productsData.data || []) : [];
  const approvedProducts = products.filter(p => p.status === 'APPROVED' || p.approvalStatus === 'APPROVED');

  // Redirect if no productId in query - must select from products page
  useEffect(() => {
    if (!productIdFromQuery && !storeLoading) {
      showToast('Vui lòng chọn sản phẩm cần thêm biến thể', 'warning');
      navigate('/store-dashboard/products');
    }
  }, [productIdFromQuery, storeLoading, navigate, showToast]);

  // ✅ Auto-select product if productId is provided in query param - CHẶN nếu chưa được duyệt
  useEffect(() => {
    if (productIdFromQuery && products.length > 0) {
      const product = products.find(p => p.id === productIdFromQuery || p._id === productIdFromQuery);
      if (!product) {
        showToast('Sản phẩm không tồn tại', 'error');
        navigate('/store-dashboard/products');
        return;
      }
      
      // ✅ Kiểm tra trạng thái sản phẩm
      const productStatus = product.status || product.approvalStatus;
      if (productStatus !== 'APPROVED') {
        showToast('Sản phẩm phải được duyệt thành công trước khi thêm biến thể. Vui lòng đợi sản phẩm được duyệt.', 'error');
        navigate('/store-dashboard/products');
        return;
      }
      
      // ✅ Chỉ set selectedProduct nếu đã được duyệt
      setSelectedProduct(product);
      console.log('✅ Auto-selected approved product:', product.name);
    }
  }, [productIdFromQuery, products, navigate, showToast]);

  // Handle attributes changes
  const addAttribute = () => {
    setAttributes([...attributes, { key: '', value: '' }]);
  };

  const removeAttribute = (index) => {
    if (attributes.length > 1) {
      setAttributes(attributes.filter((_, i) => i !== index));
    }
  };

  const updateAttribute = (index, field, value) => {
    const updated = [...attributes];
    updated[index][field] = value;
    setAttributes(updated);
  };

  // Handle image uploads
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    console.log(`📸 Selected ${files.length} images:`, files.map(f => f.name));
    
    setImages(files);

    // Generate previews
    const previews = files.map(file => URL.createObjectURL(file));
    setImagePreviews(previews);
    
    console.log(`✅ Created ${previews.length} previews`);
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
    if (primaryImageIndex >= images.length - 1) {
      setPrimaryImageIndex(Math.max(0, images.length - 2));
    }
  };

  // Handle colors
  const addColor = () => {
    setColors([...colors, { colorName: '', price: '', stock: '', image: null, imagePreview: null }]);
  };

  const removeColor = (index) => {
    if (colors.length > 1) {
      setColors(colors.filter((_, i) => i !== index));
    } else {
      setHasColors(false);
      setColors([{ colorName: '', price: '', stock: '', image: null, imagePreview: null }]);
    }
  };

  const updateColor = (index, field, value) => {
    const updated = [...colors];
    updated[index][field] = value;
    setColors(updated);
  };

  const handleColorImageChange = (index, e) => {
    const file = e.target.files[0];
    if (file) {
      const updated = [...colors];
      updated[index].image = file;
      updated[index].imagePreview = URL.createObjectURL(file);
      setColors(updated);
    }
  };

  const removeColorImage = (index) => {
    const updated = [...colors];
    if (updated[index].imagePreview) {
      URL.revokeObjectURL(updated[index].imagePreview);
    }
    updated[index].image = null;
    updated[index].imagePreview = null;
    setColors(updated);
  };

  // Validation for each step
  const canProceedToNextStep = () => {
    switch (currentStep) {
      case 1:
        // ✅ Theo Swagger BE: Required chỉ có name, price, productId
        // Stock là optional - có thể cập nhật sau bằng button
        return variantName.trim() !== '' && price > 0 && selectedProduct !== null;
      case 2:
        // ✅ Images là optional - có thể bỏ qua
        return true;
      case 3:
        // Nếu có colors, kiểm tra tất cả colors đều hợp lệ
        if (!hasColors) return true;
        return colors.every(color => 
          color.colorName.trim() !== '' && 
          color.price > 0 && 
          color.stock > 0 && 
          color.image !== null
        );
      case 4:
        return true;
      default:
        return false;
    }
  };

  // Submit variant
  const handleSubmit = async () => {
    // ✅ Protection: Tránh submit nhiều lần (React StrictMode hoặc double click)
    if (isSubmitting || hasSubmittedRef.current) {
      console.warn('⚠️ [Submit] Already submitting or already submitted, ignoring duplicate call');
      return;
    }

    if (!selectedProduct) {
      showToast('Vui lòng chọn sản phẩm', 'error');
      return;
    }

    hasSubmittedRef.current = true;
    setIsSubmitting(true);

    try {
      const formData = new FormData();

      // Create attributes object from array
      const attributesObj = {};
      attributes.forEach(attr => {
        if (attr.key.trim() && attr.value.trim()) {
          attributesObj[attr.key.trim()] = attr.value.trim();
        }
      });

      // ✅ Create DTO theo API spec (ProductVariantDTO) - THEO LOGIC BE
      // Required: name, price, productId (theo Swagger)
      // Optional: description, stock, attributes (theo Swagger)
      
      console.log('💰 Price input value:', price);
      console.log('💰 Price type:', typeof price);
      const parsedPrice = parseInt(price);
      console.log('💰 Parsed price:', parsedPrice);
      
      const dto = {
        productId: selectedProduct.id,  // ✅ REQUIRED (theo BE)
        name: variantName.trim(),       // ✅ REQUIRED (theo BE)
        price: parsedPrice,             // ✅ REQUIRED (theo BE)
        // Optional fields - chỉ thêm nếu có giá trị
        ...(variantDescription.trim() && { description: variantDescription.trim() }),
        ...(stock && parseInt(stock) > 0 && { stock: parseInt(stock) }), // Optional - theo BE
        ...(Object.keys(attributesObj).length > 0 && { attributes: attributesObj })
      };
      
      console.log('📦 DTO to submit:', dto);

      let variantId = null;

      // ✅ Nếu KHÔNG CÓ ẢNH → Dùng API create-without-image
      if (!images || images.length === 0) {
        console.log('📝 Creating variant without images');
        const result = await api.post('/api/v1/b2c/product-variants/create-without-image', dto);
        
        console.log('🔍 [DEBUG] Full response:', result);
        console.log('🔍 [DEBUG] Response data:', result.data);
        
        // Kiểm tra nếu có lỗi
        if (result.data?.error || (result.data?.success === false)) {
          showToast(result.data?.error || 'Không thể tạo biến thể', 'error');
          setIsSubmitting(false);
          return;
        }

        // Thử nhiều cách lấy ID từ response
        variantId = 
          result.data?.data?.id || 
          result.data?.data?._id || 
          result.data?.data?.$oid ||
          result.data?.id || 
          result.data?._id ||
          result.data?.variantId ||
          (result.data?.data && typeof result.data.data === 'string' ? result.data.data : null);

        console.log('🔍 [DEBUG] Extracted variantId:', variantId);

        if (!variantId) {
          console.error('❌ [ERROR] Cannot extract variantId. Full response:', result);
          showToast('Không thể lấy ID biến thể sau khi tạo. Vui lòng kiểm tra console.', 'error');
          setIsSubmitting(false);
          return;
        }

        setCreatedVariantId(variantId);
      } else {
        // ✅ Nếu CÓ ẢNH → Dùng API create với multipart/form-data
        formData.append('dto', new Blob([JSON.stringify(dto)], { type: 'application/json' }));

        // Append images
        images.forEach(image => {
          formData.append('images', image);
        });

        const result = await createProductVariantWithFormData(formData);

        console.log('🔍 [DEBUG] createProductVariantWithFormData result:', result);

        if (!result.success) {
          showToast(result.error || 'Không thể tạo biến thể', 'error');
          setIsSubmitting(false);
          return;
        }

        // Thử nhiều cách lấy ID từ response
        variantId = 
          result.data?.id || 
          result.data?._id || 
          result.data?.$oid ||
          result.data?.data?.id ||
          result.data?.data?._id ||
          result.data?.variantId ||
          (result.data && typeof result.data === 'string' ? result.data : null);

        console.log('🔍 [DEBUG] Extracted variantId:', variantId);

        if (!variantId) {
          console.error('❌ [ERROR] Cannot extract variantId. Full result:', result);
          showToast('Không thể lấy ID biến thể sau khi tạo. Vui lòng kiểm tra console.', 'error');
          setIsSubmitting(false);
          return;
        }

        setCreatedVariantId(variantId);
      }

      // ✅ Bước 2: Thêm colors nếu có
      if (hasColors && colors.length > 0) {
        const validColors = colors.filter(color => 
          color.colorName.trim() !== '' && 
          color.price > 0 && 
          color.stock > 0 && 
          color.image !== null
        );

        if (validColors.length > 0) {
          showToast(`Đang thêm ${validColors.length} màu sắc...`, 'info');
          
          for (const color of validColors) {
            const colorResult = await addColorToVariant(variantId, {
              colorName: color.colorName.trim(),
              price: parseInt(color.price),
              stock: parseInt(color.stock)
            }, color.image);

            if (!colorResult.success) {
              console.error(`Lỗi khi thêm màu ${color.colorName}:`, colorResult.error);
              showToast(`Lỗi khi thêm màu ${color.colorName}`, 'warning');
            }
          }
        }
      }

      showToast('Thêm biến thể thành công!', 'success');
      
      // ✅ Delay nhỏ để đảm bảo state đã update trước khi navigate
      setTimeout(() => {
        navigate('/store-dashboard/product-variants');
      }, 500);
    } catch (error) {
      console.error('Error creating variant:', error);
      showToast('Đã xảy ra lỗi khi thêm biến thể', 'error');
      // ✅ Reset ref nếu có lỗi để có thể thử lại
      hasSubmittedRef.current = false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepIndicator = () => {
    return (
      <div className="flex items-center justify-center mb-8">
        {[1, 2, 3, 4].map((step, index) => (
          <React.Fragment key={step}>
            <div className="flex flex-col items-center">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all ${
                  step === currentStep
                    ? 'bg-blue-600 text-white scale-110'
                    : step < currentStep
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-300 text-gray-600'
                }`}
              >
                {step < currentStep ? '✓' : step}
              </div>
              <span className={`text-sm mt-2 font-medium ${step === currentStep ? 'text-blue-600' : 'text-gray-600'}`}>
                {step === 1 && 'Thông tin & Giá'}
                {step === 2 && 'Hình ảnh'}
                {step === 3 && 'Màu sắc'}
                {step === 4 && 'Xác nhận'}
              </span>
            </div>
            {index < 3 && (
              <div className={`w-16 h-1 mx-2 ${step < currentStep ? 'bg-green-500' : 'bg-gray-300'}`} />
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div>
            <h3 className="text-2xl font-bold mb-4 text-gray-900">Bước 1: Thông tin & Giá</h3>
            <p className="text-gray-600 mb-6">Nhập thông tin cơ bản cho biến thể sản phẩm</p>
            
            <div className="space-y-6">
              {/* Tên biến thể */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tên biến thể <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={variantName}
                  onChange={(e) => setVariantName(e.target.value)}
                  placeholder="Ví dụ: iPhone 15 Pro Max 256GB"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Giá */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Giá (VNĐ) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="Ví dụ: 26990000"
                  min="0"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {price > 0 && (
                  <p className="text-sm text-gray-600 mt-1">
                    = {parseInt(price || 0).toLocaleString('vi-VN')} đ
                  </p>
                )}
              </div>

              {/* Tồn kho */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tồn kho (Tùy chọn)
                </label>
                <input
                  type="number"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  placeholder="Ví dụ: 50 (có thể cập nhật sau)"
                  min="0"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Số lượng sản phẩm có sẵn trong kho. Có thể để trống và cập nhật sau bằng button "Cập nhật tồn kho".</p>
              </div>

              {/* Mô tả */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mô tả (Tùy chọn)
                </label>
                <textarea
                  value={variantDescription}
                  onChange={(e) => setVariantDescription(e.target.value)}
                  placeholder="Mô tả chi tiết về biến thể này..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Attributes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Thuộc tính (Tùy chọn)
                </label>
                <p className="text-xs text-gray-500 mb-3">Ví dụ: Bộ nhớ, Màn hình, CPU...</p>
                
                <div className="space-y-2">
                  {attributes.map((attr, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={attr.key}
                        onChange={(e) => updateAttribute(index, 'key', e.target.value)}
                        placeholder="Tên thuộc tính"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <input
                        type="text"
                        value={attr.value}
                        onChange={(e) => updateAttribute(index, 'value', e.target.value)}
                        placeholder="Giá trị"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      {attributes.length > 1 && (
                        <button
                          onClick={() => removeAttribute(index)}
                          className="px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                  
                  <button
                    onClick={addAttribute}
                    className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors"
                  >
                    + Thêm thuộc tính
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div>
            <h3 className="text-2xl font-bold mb-4 text-gray-900">Bước 2: Hình ảnh sản phẩm (Tùy chọn)</h3>
            <p className="text-gray-600 mb-6">Upload hình ảnh cho biến thể. Có thể bỏ qua và thêm ảnh sau.</p>
            
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  id="image-upload"
                />
                <label htmlFor="image-upload" className="cursor-pointer">
                  <div className="text-6xl mb-4">📸</div>
                  <p className="text-lg font-semibold text-gray-900 mb-2">Chọn hình ảnh</p>
                  <p className="text-gray-600">Kéo thả hoặc click để chọn nhiều ảnh</p>
                </label>
              </div>

              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
                      />
                      <button
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case 3:
        return (
          <div>
            <h3 className="text-2xl font-bold mb-4 text-gray-900">Bước 3: Màu sắc (Tùy chọn)</h3>
            <p className="text-gray-600 mb-6">Thêm các màu sắc cho biến thể. Nếu không có màu, biến thể sẽ dùng giá và tồn kho chung.</p>
            
            <div className="space-y-6">
              {/* Toggle có màu sắc không */}
              <div className="bg-gray-50 p-4 rounded-lg border-2 border-gray-200">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasColors}
                    onChange={(e) => {
                      setHasColors(e.target.checked);
                      if (!e.target.checked) {
                        setColors([{ colorName: '', price: '', stock: '', image: null, imagePreview: null }]);
                      }
                    }}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="font-semibold text-gray-900">Biến thể có nhiều màu sắc</span>
                </label>
                <p className="text-xs text-gray-600 mt-2 ml-8">
                  Nếu bật, mỗi màu sẽ có giá, tồn kho và hình ảnh riêng. Giá biến thể = giá thấp nhất, Tồn kho = tổng tất cả màu.
                </p>
              </div>

              {/* Colors Form */}
              {hasColors && (
                <div className="space-y-4">
                  {colors.map((color, index) => (
                    <div key={index} className="bg-white border-2 border-gray-200 rounded-xl p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-bold text-lg text-gray-900">Màu {index + 1}</h4>
                        {colors.length > 1 && (
                          <button
                            onClick={() => removeColor(index)}
                            className="px-3 py-1 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors text-sm"
                          >
                            ✕ Xóa
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Tên màu */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Tên màu <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={color.colorName}
                            onChange={(e) => updateColor(index, 'colorName', e.target.value)}
                            placeholder="Ví dụ: Titan Đen, Titan Trắng"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        {/* Giá màu */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Giá (VNĐ) <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            value={color.price}
                            onChange={(e) => updateColor(index, 'price', e.target.value)}
                            placeholder="Ví dụ: 30000000"
                            min="0"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          {color.price > 0 && (
                            <p className="text-xs text-gray-600 mt-1">
                              = {parseInt(color.price || 0).toLocaleString('vi-VN')} đ
                            </p>
                          )}
                        </div>

                        {/* Tồn kho màu */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Tồn kho <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            value={color.stock}
                            onChange={(e) => updateColor(index, 'stock', e.target.value)}
                            placeholder="Ví dụ: 50"
                            min="0"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        {/* Hình ảnh màu */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Hình ảnh màu <span className="text-red-500">*</span>
                          </label>
                          {color.imagePreview ? (
                            <div className="relative">
                              <img
                                src={color.imagePreview}
                                alt={color.colorName || `Color ${index + 1}`}
                                className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
                              />
                              <button
                                onClick={() => removeColorImage(index)}
                                className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleColorImageChange(index, e)}
                                className="hidden"
                                id={`color-image-${index}`}
                              />
                              <label
                                htmlFor={`color-image-${index}`}
                                className="cursor-pointer block"
                              >
                                <div className="text-3xl mb-2">📸</div>
                                <p className="text-sm text-gray-600">Chọn ảnh</p>
                              </label>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  <button
                    onClick={addColor}
                    className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors font-medium"
                  >
                    + Thêm màu sắc
                  </button>
                </div>
              )}

              {!hasColors && (
                <div className="bg-blue-50 p-6 rounded-xl border-2 border-blue-200 text-center">
                  <p className="text-gray-700">Biến thể sẽ sử dụng giá và tồn kho chung đã nhập ở bước 1.</p>
                </div>
              )}
            </div>
          </div>
        );

      case 4:
        return (
          <div>
            <h3 className="text-2xl font-bold mb-4 text-gray-900">Bước 4: Xác nhận thông tin</h3>
            <p className="text-gray-600 mb-6">Kiểm tra lại thông tin trước khi tạo biến thể</p>
            
            <div className="space-y-6">
              {/* Product Info */}
              <div className="bg-blue-50 p-6 rounded-xl border-2 border-blue-200">
                <h4 className="font-bold text-lg mb-3 text-gray-900">Sản phẩm</h4>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden">
                    {selectedProduct?.image ? (
                      <img src={selectedProduct.image} alt={selectedProduct.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl">📦</div>
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{selectedProduct?.name}</p>
                    <p className="text-sm text-gray-600">{selectedProduct?.category} - {selectedProduct?.brand}</p>
                  </div>
                </div>
              </div>

              {/* Variant Info */}
              <div className="bg-green-50 p-6 rounded-xl border-2 border-green-200">
                <h4 className="font-bold text-lg mb-3 text-gray-900">Thông tin biến thể</h4>
                <div className="space-y-2">
                  <p><span className="font-semibold">Tên:</span> {variantName}</p>
                  <p><span className="font-semibold">Giá:</span> <span className="text-red-600 font-bold">{parseInt(price || 0).toLocaleString('vi-VN')} đ</span></p>
                  <p><span className="font-semibold">Tồn kho:</span> <span className="font-bold">{parseInt(stock || 0).toLocaleString('vi-VN')}</span></p>
                  {variantDescription && <p><span className="font-semibold">Mô tả:</span> {variantDescription}</p>}
                </div>
              </div>

              {/* Attributes */}
              {attributes.some(attr => attr.key.trim() && attr.value.trim()) && (
                <div className="bg-purple-50 p-6 rounded-xl border-2 border-purple-200">
                  <h4 className="font-bold text-lg mb-3 text-gray-900">Thuộc tính</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {attributes.map((attr, idx) => {
                      if (attr.key.trim() && attr.value.trim()) {
                        return (
                          <div key={idx} className="p-3 bg-white rounded-lg">
                            <p className="text-xs text-gray-600">{attr.key}</p>
                            <p className="font-semibold text-gray-900">{attr.value}</p>
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>
                </div>
              )}

              {/* Images */}
              <div className="bg-orange-50 p-6 rounded-xl border-2 border-orange-200">
                <h4 className="font-bold text-lg mb-3 text-gray-900">Hình ảnh ({images.length})</h4>
                <div className="grid grid-cols-4 gap-2">
                  {imagePreviews.map((preview, idx) => (
                    <div key={idx} className="relative">
                      <img src={preview} alt={`Preview ${idx + 1}`} className="w-full h-20 object-cover rounded-lg" />
                      {idx === primaryImageIndex && (
                        <div className="absolute top-1 left-1 bg-blue-600 text-white text-xs px-2 py-0.5 rounded">Chính</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Colors */}
              {hasColors && colors.some(c => c.colorName.trim() && c.price > 0 && c.stock > 0 && c.image) && (
                <div className="bg-pink-50 p-6 rounded-xl border-2 border-pink-200">
                  <h4 className="font-bold text-lg mb-3 text-gray-900">Màu sắc ({colors.filter(c => c.colorName.trim() && c.price > 0 && c.stock > 0 && c.image).length})</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {colors.map((color, idx) => {
                      if (color.colorName.trim() && color.price > 0 && color.stock > 0 && color.image) {
                        return (
                          <div key={idx} className="bg-white p-4 rounded-lg border border-gray-200">
                            <div className="flex items-center gap-3 mb-2">
                              {color.imagePreview && (
                                <img src={color.imagePreview} alt={color.colorName} className="w-16 h-16 object-cover rounded-lg" />
                              )}
                              <div>
                                <p className="font-semibold text-gray-900">{color.colorName}</p>
                                <p className="text-sm text-red-600 font-bold">{parseInt(color.price || 0).toLocaleString('vi-VN')} đ</p>
                                <p className="text-xs text-gray-600">Tồn: {parseInt(color.stock || 0).toLocaleString('vi-VN')}</p>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <StoreStatusGuard currentStore={currentStore} pageName="thêm biến thể" loading={storeLoading}>
      <StoreLayout>
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Header */}
          <div className="bg-gradient-to-r from-cyan-200 to-blue-200 rounded-2xl p-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-400 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-4xl">🎨</span>
                </div>
                <div>
                  <h1 className="text-4xl font-bold mb-2">
                    <span className="text-cyan-600">Thêm</span> <span className="text-blue-600">Biến thể</span>
                  </h1>
                  <p className="text-gray-600 text-lg">4 bước đơn giản: Thông tin → Hình ảnh → Màu sắc → Xác nhận</p>
                </div>
              </div>
            </div>
          </div>

          {/* Selected Product Banner - Show if product was auto-selected */}
          {selectedProduct && productIdFromQuery && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white rounded-xl overflow-hidden border-2 border-green-300 flex-shrink-0">
                    {selectedProduct.image ? (
                      <img src={selectedProduct.image} alt={selectedProduct.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl">📦</div>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-green-700 font-medium mb-1">✅ Sản phẩm đã chọn</p>
                    <h3 className="text-xl font-bold text-gray-900">{selectedProduct.name}</h3>
                    <p className="text-sm text-gray-600">{selectedProduct.category || 'Chưa phân loại'}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    navigate('/store-dashboard/products');
                  }}
                  className="px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors border border-gray-300"
                >
                  Chọn SP khác
                </button>
              </div>
            </div>
          )}

          {/* Step Indicator */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            {renderStepIndicator()}
          </div>

          {/* Step Content */}
          <div className="bg-white rounded-xl p-8 shadow-sm">
            {renderStepContent()}
          </div>

          {/* Navigation Buttons */}
          <div className="bg-white rounded-xl p-6 shadow-sm flex items-center justify-between">
            <button
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              disabled={currentStep === 1}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              ← Quay lại
            </button>

            {currentStep < totalSteps ? (
              <button
                onClick={() => {
                  if (currentStep === 3 && !hasColors) {
                    // Nếu ở step 3 và không có colors, skip luôn sang step 4
                    setCurrentStep(4);
                  } else {
                    setCurrentStep(currentStep + 1);
                  }
                }}
                disabled={!canProceedToNextStep()}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Tiếp theo →
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !canProceedToNextStep()}
                className="px-8 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Đang tạo...
                  </>
                ) : (
                  <>
                    ✓ Tạo biến thể
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </StoreLayout>
    </StoreStatusGuard>
  );
};

export default AddProductVariant;
















