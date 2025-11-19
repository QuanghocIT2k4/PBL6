import MainLayout from '../../layouts/MainLayout';
import { useCart } from '../../context/CartContext';
import { useNavigate } from 'react-router-dom';
import { useMemo, useState, useEffect } from 'react';
import { useProfile } from '../../hooks/useProfile';
import { useToast } from '../../context/ToastContext';
import addressService from '../../services/buyer/addressService';
import PromoCodeInput from '../../components/promotions/PromoCodeInput';
import PromotionList from '../../components/promotions/PromotionList';
import { calculateDiscount } from '../../services/admin/promotionService';
import { createPaymentUrl } from '../../services/buyer/paymentService';
import { getProductVariantById } from '../../services/common/productService';

const CheckoutPage = () => {
  const { getSelectedItems, getSelectedTotalItems, getSelectedTotalPrice, formatPrice, removeSelectedItems } = useCart();
  const items = getSelectedItems();
  const navigate = useNavigate();
  
  // ✅ Toast notification
  const { success, error, warning } = useToast();

  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState(''); // 'COD' | 'BANK_TRANSFER' | etc
  const [note, setNote] = useState('');
  const [appliedPromotion, setAppliedPromotion] = useState(null); // { code, promotion, discount }
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const { profile, createOrder } = useProfile();

  // Format address object to string
  const formatAddress = (address) => {
    if (!address) return '';
    if (typeof address === 'string') return address;
    
    // If address is an object, format it
    const parts = [];
    if (address.street) parts.push(address.street);
    if (address.ward) parts.push(address.ward);
    if (address.district) parts.push(address.district);
    if (address.province) parts.push(address.province);
    
    return parts.join(', ');
  };

  // Load addresses
  useEffect(() => {
    const loadAddresses = async () => {
      const result = await addressService.getUserAddresses();
      if (result.success) {
        const addressList = result.data?.content || result.data || [];
        setAddresses(addressList);
        
        // Auto-select default address
        const defaultAddr = addressList.find(addr => addr.isDefault);
        if (defaultAddr) {
          setSelectedAddressId(defaultAddr.id);
        } else if (addressList.length > 0) {
          setSelectedAddressId(addressList[0].id);
        }
      }
    };
    loadAddresses();
  }, []);

  // Prefill customer info from profile
  useEffect(() => {
    if (profile) {
      setCustomerName(profile.fullName || profile.name || '');
      setCustomerPhone(profile.phone || '');
    }
  }, [profile]);

  // ✅ Redirect nếu giỏ hàng trống (trong useEffect, không phải render)
  useEffect(() => {
    if (!items || items.length === 0) {
      navigate('/cart');
    }
  }, [items, navigate]);

  const productTotal = getSelectedTotalPrice();
  const discount = appliedPromotion?.discount || 0;
  const shippingFee = 30000; // Phí vận chuyển cố định 30k
  const finalTotal = Math.max(0, productTotal - discount + shippingFee);
  
  // Debug log
  useEffect(() => {
    console.log('💰 [Checkout] Price calculation:', {
      productTotal,
      discount,
      appliedPromotion,
      finalTotal,
      discountFromPromo: appliedPromotion?.discount
    });
  }, [productTotal, discount, appliedPromotion, finalTotal]);

  // ✅ State để lưu storeId
  const [storeId, setStoreId] = useState(null);

  // ✅ Lấy storeId từ items - TẠM THỜI HARDCODE vì API không trả về
  useEffect(() => {
    if (!items || items.length === 0) {
      setStoreId(null);
      return;
    }
    
    const firstItem = items[0];
    const product = firstItem?.product;
    
    // Thử lấy storeId từ product
    const directStoreId = 
      product?.storeId || 
      product?.store?.id || 
      (product?.store && typeof product.store === 'string' ? product.store : null);
    
    if (directStoreId) {
      console.log('✅ [Checkout] Found storeId directly:', directStoreId);
      setStoreId(directStoreId);
      return;
    }
    
    // ⚠️ FALLBACK: Nếu không có storeId, thử lấy từ localStorage (last visited store)
    const lastStoreId = localStorage.getItem('lastViewedStoreId');
    if (lastStoreId) {
      console.log('⚠️ [Checkout] Using last viewed storeId from localStorage:', lastStoreId);
      setStoreId(lastStoreId);
      return;
    }
    
    // ⚠️ FALLBACK 2: Hardcode storeId của Quang Store (TẠM THỜI)
    // TODO: Backend cần trả về storeId trong cart items!
    const fallbackStoreId = '690e7f8c2a17c4ceb1c3079'; // Quang Store
    console.log('⚠️ [Checkout] Using fallback storeId:', fallbackStoreId);
    setStoreId(fallbackStoreId);
  }, [items]);
  
  // Debug log storeId
  useEffect(() => {
    console.log('🏪 [Checkout] StoreId:', storeId);
    console.log('🏪 [Checkout] Items:', items);
    console.log('🏪 [Checkout] First product:', items[0]?.product);
  }, [storeId, items]);

  const placeOrder = async () => {
    if (isPlacingOrder) return; // Prevent double submission
    
    // Validation
    if (!items || items.length === 0) {
      warning('Giỏ hàng trống. Vui lòng thêm sản phẩm.');
      return;
    }
    
    if (!selectedAddressId) {
      warning('Vui lòng chọn địa chỉ giao hàng');
      return;
    }
    
    if (!paymentMethod) {
      warning('Vui lòng chọn phương thức thanh toán');
      return;
    }
    
    setIsPlacingOrder(true);
    try {
      // ✅ Find selected address object
      const selectedAddress = addresses.find(addr => addr.id === selectedAddressId);
      if (!selectedAddress) {
        error('Vui lòng chọn địa chỉ giao hàng');
        setIsPlacingOrder(false);
        return;
      }
      
      // ✅ Validate phone trong địa chỉ đã chọn
      if (!selectedAddress.phone && !customerPhone) {
        error('Số điện thoại không được để trống. Vui lòng cập nhật địa chỉ giao hàng.');
        setIsPlacingOrder(false);
        return;
      }

      // ✅ Build selectedItems array
      // ⚠️ Swagger OrderDTO chỉ yêu cầu productVariantId, nhưng backend CẦN quantity để lưu OrderItem
      const selectedItems = items.map(it => ({
        productVariantId: it.product.id,
        quantity: it.quantity || 1, // ✅ THÊM QUANTITY
      }));
      
      // ✅ Build address object
      // ⚠️ Backend validate phone trong address mặc dù Swagger AddressDTO không định nghĩa
      const addressDTO = {
        province: selectedAddress.province || '',
        ward: selectedAddress.ward || '',
        homeAddress: selectedAddress.homeAddress || selectedAddress.street || '',
        phone: selectedAddress.phone || customerPhone || '', // ✅ THÊM PHONE
        suggestedName: selectedAddress.suggestedName || '', // Optional
      };
      
      // ✅ Build promotions (platform hoặc store)
      // Theo Swagger: OrderDTO có cả platformPromotions và storePromotions
      // - platformPromotions: { orderPromotionCode, shippingPromotionCode }
      // - storePromotions: { [storeId]: promotionCode }
      
      let platformPromotions = null;
      let storePromotions = null;
      
      if (appliedPromotion) {
        // ✅ Kiểm tra promotion là của platform hay store
        // PromoCodeInput đã set isStorePromotion khi tìm thấy
        const isStorePromotion = appliedPromotion.isStorePromotion === true;
        
        if (isStorePromotion && storeId) {
          // Store promotion - format: { [storeId]: promotionCode }
          storePromotions = {
            [storeId]: appliedPromotion.code
          };
          console.log('🏬 [Checkout] Using store promotion:', storePromotions);
        } else {
          // Platform promotion
          platformPromotions = {
            orderPromotionCode: appliedPromotion.code,
            shippingPromotionCode: null,
          };
          console.log('🏪 [Checkout] Using platform promotion:', platformPromotions);
        }
      }
      
      const orderData = {
        selectedItems,
        paymentMethod: paymentMethod.toUpperCase(),
        note: note.trim(),
        address: addressDTO,
        ...(platformPromotions && { platformPromotions }),
        ...(storePromotions && { storePromotions }),
      };
      
      console.log('📦 [Checkout] Order data:', JSON.stringify(orderData, null, 2));
      console.log('🎫 [Checkout] Applied promotion:', appliedPromotion);
      console.log('🏪 [Checkout] Store ID:', storeId);
      console.log('💰 [Checkout] Order total:', productTotal);
      console.log('💸 [Checkout] Discount:', discount);
      console.log('💵 [Checkout] Final total:', finalTotal);
      
      const result = await createOrder(orderData);
      
      console.log('📥 [Checkout] Backend response:', result);
      
      if (result.success) {
        console.log('✅ [Checkout] Order created:', result.data);
        
        // Lấy orderId từ response
        const orderId = result.data?.id || result.data?.orderId;
        
        removeSelectedItems();
        
        // ✅ Nếu chọn VNPay → Tạo payment URL và redirect
        if (paymentMethod.toUpperCase() === 'VNPAY') {
          console.log('💳 [Checkout] VNPay selected, creating payment URL...');
          console.log('💳 [Checkout] Order ID:', orderId);
          console.log('💳 [Checkout] Final total:', finalTotal);
          
          const paymentResult = await createPaymentUrl({
            amount: finalTotal,
            language: 'vn',
            // Có thể thêm orderId vào đây nếu backend cần
          });
          
          if (paymentResult.success && paymentResult.data?.paymentUrl) {
            console.log('✅ [Checkout] Payment URL created:', paymentResult.data.paymentUrl);
            
            // Mở VNPay trong tab mới NGAY LẬP TỨC
            const vnpayWindow = window.open(paymentResult.data.paymentUrl, '_blank');
            
            if (vnpayWindow) {
              success('🎉 Đơn hàng đã tạo! Vui lòng thanh toán trên tab mới. Check console để debug!');
              // TODO: Uncomment để auto redirect
              // setTimeout(() => {
              //   navigate('/orders');
              // }, 2000);
            } else {
              error('Trình duyệt chặn popup! Vui lòng cho phép popup và thử lại.');
            }
          } else {
            error('Không thể tạo link thanh toán. Vui lòng thử lại.');
            console.error('❌ [Checkout] Failed to create payment URL:', paymentResult);
          }
        } else {
          // COD hoặc payment method khác → Redirect về orders
          success('🎉 Đặt hàng thành công! Cảm ơn bạn đã mua hàng.');
          setTimeout(() => {
            navigate('/orders');
          }, 2000);
        }
      } else {
        error(result.error || 'Có lỗi khi tạo đơn hàng');
      }
    } catch (err) {
      console.error('Error placing order:', err);
      error('Có lỗi xảy ra khi đặt hàng. Vui lòng thử lại.');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const totalItems = getSelectedTotalItems();

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Thông tin nhận hàng</h2>
              <button 
                onClick={() => navigate('/profile?tab=addresses')}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                + Thêm địa chỉ mới
              </button>
            </div>

            {/* Address Selection */}
            <div className="space-y-3 mb-4">
              {addresses.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <p className="text-gray-600 mb-3">Bạn chưa có địa chỉ giao hàng nào</p>
                  <button
                    onClick={() => navigate('/profile?tab=addresses')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Thêm địa chỉ ngay
                  </button>
                </div>
              ) : (
                addresses.map((addr) => (
                  <label
                    key={addr.id}
                    className={`block p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedAddressId === addr.id
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-start">
                      <input
                        type="radio"
                        name="address"
                        value={addr.id}
                        checked={selectedAddressId === addr.id}
                        onChange={() => setSelectedAddressId(addr.id)}
                        className="mt-1 mr-3"
                      />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-semibold text-gray-900">
                            {addr.recipientName || customerName}
                          </span>
                          <span className="text-gray-600">|</span>
                          <span className="text-gray-600">{addr.phone || customerPhone}</span>
                          {addr.isDefault && (
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded">
                              Mặc định
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-700">
                          {formatAddress(addr)}
                        </p>
                      </div>
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>

          {/* Ghi chú đơn hàng */}
          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <h2 className="text-xl font-bold mb-4">Ghi chú</h2>
            <textarea value={note} onChange={(e)=>setNote(e.target.value)} placeholder="Ghi chú cho người giao hàng (tùy chọn)" rows={3} className="w-full border rounded px-3 py-2" />
          </div>

          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <h2 className="text-xl font-bold mb-4">Sản phẩm đã chọn ({totalItems})</h2>
            <div className="divide-y">
              {items.map(it => (
                <div key={it.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                      <span className="text-xl">{it.product.image?.startsWith('http') ? '🛍️' : (it.product.image || '📦')}</span>
                    </div>
                    <div className="truncate">
                      <div className="font-medium truncate">{it.product.name}</div>
                      <div className="text-sm text-gray-500">x{it.quantity}</div>
                    </div>
                  </div>
                  <div className="font-semibold text-red-600">
                    {formatPrice(
                      (typeof it.product.price === 'string' 
                        ? parseInt(it.product.price.replace(/\./g,'')||0)
                        : parseInt(it.product.price||0)) * it.quantity
                    )}đ
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-lg border shadow-sm sticky top-4">
            <h2 className="text-xl font-bold mb-4">Tiến hành thanh toán</h2>
            {/* Phương thức thanh toán */}
            <div className="mb-4">
              <div className="text-sm font-medium mb-2">Phương thức thanh toán</div>
              <div className="space-y-2 text-sm">
                <label className="flex items-center space-x-2">
                  <input type="radio" name="pm" value="COD" checked={paymentMethod==='COD'} onChange={()=>setPaymentMethod('COD')}/>
                  <span>Thanh toán khi nhận hàng (COD)</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="radio" name="pm" value="BANK_TRANSFER" checked={paymentMethod==='BANK_TRANSFER'} onChange={()=>setPaymentMethod('BANK_TRANSFER')}/>
                  <span>Chuyển khoản ngân hàng</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="radio" name="pm" value="VNPAY" checked={paymentMethod==='VNPAY'} onChange={()=>setPaymentMethod('VNPAY')}/>
                  <span>VNPay</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="radio" name="pm" value="MOMO" checked={paymentMethod==='MOMO'} onChange={()=>setPaymentMethod('MOMO')}/>
                  <span>Ví MoMo</span>
                </label>
              </div>
            </div>

            {/* Mã giảm giá */}
            <div className="mb-4">
              <PromoCodeInput
                orderTotal={productTotal}
                storeId={storeId}
                productIds={items.map(it => it.product.id)}
                onApplySuccess={(promoData) => {
                  setAppliedPromotion(promoData);
                  success(`✨ Áp dụng mã ${promoData.code} thành công!`);
                }}
                onRemove={() => {
                  setAppliedPromotion(null);
                  success('Đã xóa mã khuyến mãi');
                }}
                appliedPromotion={appliedPromotion}
              />
              <div className="mt-2">
                <PromotionList
                  orderTotal={productTotal}
                  storeId={storeId}
                  productIds={items.map(it => it.product.id)}
                  selectedCode={appliedPromotion?.code}
                  onSelectPromotion={(promotion, isStorePromotion = false) => {
                    console.log('🎁 [Checkout] Selected promotion:', promotion);
                    console.log('🎁 [Checkout] Promotion structure:', {
                      code: promotion.code,
                      discountType: promotion.discountType || promotion.type,
                      discountValue: promotion.discountValue || promotion.value,
                      maxDiscountAmount: promotion.maxDiscountAmount || promotion.maxDiscountValue,
                      isStorePromotion,
                      fullPromotion: promotion
                    });
                    console.log('🎁 [Checkout] Order total:', productTotal);
                    
                    const discount = calculateDiscount(promotion, productTotal);
                    console.log('🎁 [Checkout] Calculated discount:', discount);
                    
                    const promoData = {
                      code: promotion.code,
                      promotion,
                      discount,
                      isStorePromotion, // ✅ Lưu thông tin là store hay platform
                    };
                    console.log('🎁 [Checkout] Setting applied promotion:', promoData);
                    
                    setAppliedPromotion(promoData);
                    success(`✨ Áp dụng mã ${promotion.code} thành công!`);
                  }}
                />
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span>Tạm tính</span><span>{formatPrice(productTotal)}đ</span></div>
              {discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Giảm giá</span>
                  <span>-{formatPrice(discount)}đ</span>
                </div>
              )}
              <div className="flex justify-between"><span>Phí vận chuyển</span><span>{formatPrice(shippingFee)}đ</span></div>
              <div className="border-t pt-2 font-semibold text-lg flex justify-between">
                <span>Tổng cộng</span>
                <span className="text-red-600">
                  {formatPrice(finalTotal)}đ
                </span>
              </div>
            </div>
            <button 
              onClick={placeOrder} 
              disabled={isPlacingOrder}
              className="w-full mt-4 bg-blue-600 text-white rounded-lg py-3 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
            >
              {isPlacingOrder ? 'Đang xử lý...' : 'Tiến hành thanh toán'}
            </button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default CheckoutPage;

