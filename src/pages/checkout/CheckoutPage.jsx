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
import { createMoMoPayment } from '../../services/buyer/momoPaymentService';
import { getProductVariantById } from '../../services/common/productService';
import SEO from '../../components/seo/SEO';

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

  // ❌ KHÔNG cộng hoa hồng nền tảng vào tiền khách trả
  // Hoa hồng nền tảng (serviceFee/platformCommission) sẽ do backend tính trên doanh thu của người bán
  // Tổng tiền khách phải trả chỉ gồm: tiền hàng - giảm giá + phí vận chuyển
  const finalTotal = Math.max(0, productTotal - discount + shippingFee);
  
  // Debug log (có thể bật lại khi cần)
  useEffect(() => {
    // console.log('[Checkout] Totals:', { productTotal, discount, shippingFee, finalTotal });
  }, [productTotal, discount, appliedPromotion, shippingFee, finalTotal]);

  // 🔁 Map variantId -> { storeId, storeName } được resolve từ API (nếu thiếu)
  // ⚠️ PHẢI KHAI BÁO TRƯỚC groupedItems vì groupedItems sử dụng nó
  const [resolvedStoreMap, setResolvedStoreMap] = useState({});

  // ✅ Group sản phẩm theo từng store để hiển thị tách biệt
  const groupedItems = useMemo(() => {
    if (!items || items.length === 0) return [];

    const groups = {};

    items.forEach((it) => {
      const product = it.product || {};
      const variantId = it.productVariantId || product.id;
      const resolved = (variantId && resolvedStoreMap[variantId]) || {};

      const storeId =
        resolved.storeId ||
        product.storeId ||
        product.store?.id ||
        it.storeId ||
        it.store?.id ||
        null;

      const storeName =
        resolved.storeName ||
        product.storeName ||
        product.store?.storeName ||
        product.store?.name ||
        it.storeName ||
        it.store?.storeName ||
        it.store?.name ||
        (storeId
          ? `Cửa hàng #${String(storeId).slice(-6)}`
          : 'Cửa hàng chưa xác định');

      const key = storeId || storeName || 'unknown';

      console.log('🧾[Checkout] Grouping item by store:', {
        cartItemId: it.id,
        productVariantId: it.productVariantId || product.id,
        productName: product.name,
        storeId,
        storeName,
        productStoreId: product.storeId,
        productStoreName: product.storeName,
        rawStoreObj: product.store,
      });

      if (!groups[key]) {
        groups[key] = {
          storeId,
          storeName,
          items: [],
        };
      }

      groups[key].items.push(it);
    });

    return Object.values(groups);
  }, [items, resolvedStoreMap]);

  // ✅ Tập các cửa hàng xuất hiện trong các item được chọn (tính từ groupedItems đã resolve)
  const uniqueStores = useMemo(() => {
    if (!groupedItems || groupedItems.length === 0) return [];
    
    return groupedItems.map(group => ({
      storeId: group.storeId,
      storeName: group.storeName,
    }));
  }, [groupedItems]);

  // ✅ Store chính nếu chỉ có 1 store (dùng cho khuyến mãi theo store)
  const primaryStoreId = useMemo(() => {
    if (uniqueStores.length === 1) {
      return uniqueStores[0].storeId || null;
    }
    return null;
  }, [uniqueStores]);

  // Nếu thiếu thông tin store trên item, gọi API variant để bổ sung (giống CartPage)
  useEffect(() => {
    if (!items || items.length === 0) return;

    const needResolve = [];
    const seenVariant = new Set();

    items.forEach((it) => {
      const product = it.product || {};
      const variantId = it.productVariantId || product.id;
      if (!variantId) return;

      const hasStoreInfo =
        product.storeId ||
        product.store?.id ||
        it.storeId ||
        it.store?.id ||
        product.storeName ||
        product.store?.name ||
        it.storeName ||
        it.store?.name;

      if (!hasStoreInfo && !seenVariant.has(variantId)) {
        seenVariant.add(variantId);
        needResolve.push(variantId);
      }
    });

    if (needResolve.length === 0) return;

    console.log('🧾[Checkout] Need resolve store from variant API for variantIds:', needResolve);

    (async () => {
      const updates = {};
      for (const variantId of needResolve) {
        try {
          const res = await getProductVariantById(variantId);
          if (res?.success && res.data) {
            const store = res.data.store || {};
            updates[variantId] = {
              storeId: store.id || null,
              storeName: store.name || store.storeName || null,
            };
            console.log('🧾[Checkout] Resolved store from variant API:', {
              variantId,
              resolvedStoreId: updates[variantId].storeId,
              resolvedStoreName: updates[variantId].storeName,
            });
          }
        } catch (err) {
          console.error('🧾[Checkout] Failed to resolve store for variant', variantId, err);
        }
      }

      if (Object.keys(updates).length > 0) {
        setResolvedStoreMap((prev) => ({ ...prev, ...updates }));
      }
    })();
  }, [items]);

  // 🔍 Log debug tổng quan store ở checkout
  useEffect(() => {
    console.log('🧾[Checkout] Selected items:', items);
    console.log('🧾[Checkout] uniqueStores:', uniqueStores);
    console.log('🧾[Checkout] primaryStoreId:', primaryStoreId);
    console.log('🧾[Checkout] groupedItems:', groupedItems);
  }, [items, uniqueStores, primaryStoreId, groupedItems]);
  

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
      // ⚠️ Backend đã sửa: cart trả về productVariantId thay vì productId
      const selectedItems = items.map(it => ({
        productVariantId: it.productVariantId || it.product?.id,
        quantity: it.quantity || 1,
        colorId: it.options?.colorId || it.options?.color || null,
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
        
        // ✅ Check promotion type: SHIPPING vs ORDER
        const promotionType = appliedPromotion.promotion?.type || appliedPromotion.promotion?.discountType;
        const isShippingPromotion = promotionType === 'SHIPPING' || promotionType === 'FREE_SHIPPING';
        
        console.log('🎫 [Checkout] Promotion details:', {
          code: appliedPromotion.code,
          type: promotionType,
          isShippingPromotion,
          isStorePromotion,
          fullPromotion: appliedPromotion.promotion
        });
        
        // ❗ Chỉ map khuyến mãi theo store nếu đơn chỉ có 1 store rõ ràng
        if (isStorePromotion && primaryStoreId) {
          // Store promotion - format: { [storeId]: promotionCode }
          storePromotions = {
            [primaryStoreId]: appliedPromotion.code
          };
          console.log('🏬 [Checkout] Using store promotion:', storePromotions);
        } else {
          // Platform promotion - phân biệt shipping vs order
          platformPromotions = {
            orderPromotionCode: isShippingPromotion ? null : appliedPromotion.code,
            shippingPromotionCode: isShippingPromotion ? appliedPromotion.code : null,
          };
          console.log('🏪 [Checkout] Using platform promotion:', platformPromotions);
        }
      }
      
      const orderData = {
        selectedItems,
        paymentMethod: paymentMethod.toUpperCase(), // ✅ Đã cập nhật: Không còn chuyển VNPAY thành BANK_TRANSFER
        note: note.trim(),
        address: addressDTO,
        ...(platformPromotions && { platformPromotions }),
        ...(storePromotions && Object.keys(storePromotions).length > 0 && { storePromotions }),
      };

      // 🔍 DEBUG LOGS
      console.log('🛒 [CHECKOUT DEBUG] ===== CHECKOUT REQUEST =====');
      console.log('🛒 [CHECKOUT DEBUG] Payment Method:', paymentMethod);
      console.log('🛒 [CHECKOUT DEBUG] Payment Method (uppercase):', paymentMethod.toUpperCase());
      console.log('🛒 [CHECKOUT DEBUG] Selected Items:', selectedItems);
      console.log('🛒 [CHECKOUT DEBUG] Address DTO:', addressDTO);
      console.log('🛒 [CHECKOUT DEBUG] Platform Promotions:', platformPromotions);
      console.log('🛒 [CHECKOUT DEBUG] Store Promotions:', storePromotions);
      console.log('🛒 [CHECKOUT DEBUG] Final Order Data:', orderData);
      console.log('🛒 [CHECKOUT DEBUG] ================================');
      
      console.log('📦 [Checkout] Order data:', JSON.stringify(orderData, null, 2));
      console.log('🎫 [Checkout] Applied promotion:', appliedPromotion);
      console.log('🏪 [Checkout] Primary Store ID:', primaryStoreId);
      console.log('💰 [Checkout] Order total:', productTotal);
      console.log('💸 [Checkout] Discount:', discount);
      console.log('💵 [Checkout] Final total:', finalTotal);
      
      const result = await createOrder(orderData);
      
      // 🔍 DEBUG RESPONSE
      console.log('🛒 [CHECKOUT DEBUG] ===== CHECKOUT RESPONSE =====');
      console.log('🛒 [CHECKOUT DEBUG] Result Success:', result.success);
      console.log('🛒 [CHECKOUT DEBUG] Result Data:', result.data);
      console.log('🛒 [CHECKOUT DEBUG] Result Error:', result.error);
      console.log('🛒 [CHECKOUT DEBUG] Full Result:', result);
      console.log('🛒 [CHECKOUT DEBUG] =================================');
      
      if (result.success) {
        console.log('✅ [Checkout] Order created:', result.data);
        
        // ✅ Lấy orderId từ response (có thể là object hoặc array)
        let orderId = null;
        if (Array.isArray(result.data) && result.data.length > 0) {
          // Nếu là array, lấy order đầu tiên
          orderId = result.data[0]?.id || result.data[0]?.orderId;
        } else if (result.data) {
          // Nếu là object
          orderId = result.data.id || result.data.orderId;
        }
        
        console.log('✅ [Checkout] Extracted Order ID:', orderId);
        
        removeSelectedItems();
        
        // ✅ Nếu chọn VNPay → Tạo payment URL và redirect
        if (paymentMethod === 'VNPAY') {
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
        }
        // ✅ Nếu chọn MoMo → Tạo payment request và redirect
        else if (paymentMethod === 'MOMO') {
          console.log('💳 [Checkout] MoMo selected, creating payment request...');
          console.log('💳 [Checkout] Order ID:', orderId);
          console.log('💳 [Checkout] Final total:', finalTotal);
          
          // ✅ Truyền orderId và orderInfo để backend có thể liên kết với order
          const orderInfo = `Thanh toán đơn hàng ${orderId || 'chưa có ID'}`;
          const momoResult = await createMoMoPayment(finalTotal, orderId, orderInfo);
          
          if (momoResult.success && momoResult.data?.payUrl) {
            console.log('✅ [Checkout] MoMo payment URL created:', momoResult.data.payUrl);
            console.log('✅ [Checkout] MoMo order ID:', momoResult.data.orderId);
            console.log('✅ [Checkout] MoMo trans ID:', momoResult.data.transId);
            
            // Mở MoMo trong tab mới
            const momoWindow = window.open(momoResult.data.payUrl, '_blank');
            
            if (momoWindow) {
              success('🎉 Đơn hàng đã tạo! Vui lòng thanh toán qua MoMo trên tab mới.');
              // TODO: Có thể thêm logic để check payment status sau khi thanh toán
            } else {
              error('Trình duyệt chặn popup! Vui lòng cho phép popup và thử lại.');
            }
          } else {
            error(momoResult.error || 'Không thể tạo link thanh toán MoMo. Vui lòng thử lại.');
            console.error('❌ [Checkout] Failed to create MoMo payment:', momoResult);
          }
        }
        else {
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
      <SEO 
        title="Thanh toán | E-Comm"
        description="Hoàn tất đơn hàng của bạn. Chọn địa chỉ giao hàng, phương thức thanh toán và áp dụng mã giảm giá."
        keywords="thanh toán, checkout, đặt hàng, giao hàng"
        url="https://pbl-6-eight.vercel.app/checkout"
      />
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
            <h2 className="text-xl font-bold mb-1">Sản phẩm đã chọn ({totalItems})</h2>
            <p className="text-sm text-gray-500 mb-3">
              {groupedItems.length <= 1 ? 'Đơn hàng của cửa hàng: ' : 'Đơn hàng của các cửa hàng: '}
              <span className="font-medium text-gray-800">
              {groupedItems.length > 0
                ? groupedItems
                    .map((group) =>
                      group.storeName && group.storeName !== 'Cửa hàng chưa xác định'
                        ? group.storeName
                        : group.storeId
                        ? `Cửa hàng #${String(group.storeId).slice(-6)}`
                        : 'Cửa hàng chưa xác định'
                    )
                    .join(', ')
                : 'Đang xác định...'}
              </span>
            </p>
          <div className="space-y-4">
            {groupedItems.map((group) => (
              <div
                key={group.storeId || group.storeName || 'unknown'}
                className="border rounded-lg overflow-hidden"
              >
                <div className="px-4 py-2 bg-gray-50 border-b flex items-center justify-between">
                  <div className="font-semibold text-gray-800">
                    Cửa hàng: {group.storeName}
                  </div>
                </div>
                <div className="divide-y">
                  {group.items.map((it) => (
                    <div key={it.id} className="py-3 px-4 flex items-center justify-between">
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center overflow-hidden">
                          {(() => {
                            // Ưu tiên: image > primaryImage > images[0]
                            const imageUrl =
                              it.product?.image ||
                              it.product?.primaryImage ||
                              (Array.isArray(it.product?.images) && it.product.images[0]);

                            if (imageUrl && (imageUrl.startsWith('http') || imageUrl.startsWith('/'))) {
                              return (
                                <img
                                  src={imageUrl}
                                  alt={it.product?.name || 'Sản phẩm'}
                                  className="w-full h-full object-cover rounded"
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.style.display = 'none';
                                    e.target.parentElement.innerHTML = '<span class=\"text-xl\">📦</span>';
                                  }}
                                />
                              );
                            }

                            return <span className="text-xl">📦</span>;
                          })()}
                        </div>
                        <div className="truncate">
                          <div className="font-medium truncate">{it.product.name}</div>
                          <div className="text-sm text-gray-500">x{it.quantity}</div>
                        </div>
                      </div>
                      <div className="font-semibold text-red-600">
                        {formatPrice(
                          (typeof it.product.price === 'string'
                            ? parseInt(it.product.price.replace(/\./g, '') || 0)
                            : parseInt(it.product.price || 0)) * it.quantity
                        )}đ
                      </div>
                    </div>
                  ))}
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
                <label className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                  <input 
                    type="radio" 
                    name="pm" 
                    value="COD" 
                    checked={paymentMethod==='COD'} 
                    onChange={()=>setPaymentMethod('COD')}
                    className="cursor-pointer"
                  />
                  <span className="flex items-center gap-2">
                    💵 Thanh toán khi nhận hàng (COD)
                  </span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                  <input 
                    type="radio" 
                    name="pm" 
                    value="VNPAY" 
                    checked={paymentMethod==='VNPAY'} 
                    onChange={()=>setPaymentMethod('VNPAY')}
                    className="cursor-pointer"
                  />
                  <span className="flex items-center gap-2">
                    🏦 Thanh toán qua VNPay
                  </span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                  <input 
                    type="radio" 
                    name="pm" 
                    value="MOMO" 
                    checked={paymentMethod==='MOMO'} 
                    onChange={()=>setPaymentMethod('MOMO')}
                    className="cursor-pointer"
                  />
                  <span className="flex items-center gap-2">
                    💳 Thanh toán qua MoMo
                  </span>
                </label>
              </div>
            </div>

            {/* Mã giảm giá */}
            <div className="mb-4">
              <PromoCodeInput
                orderTotal={productTotal}
                storeId={primaryStoreId}
                productIds={items.map(it => it.productVariantId || it.product?.id)}
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
                  storeId={primaryStoreId}
                  productIds={items.map(it => it.productVariantId || it.product?.id)}
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

