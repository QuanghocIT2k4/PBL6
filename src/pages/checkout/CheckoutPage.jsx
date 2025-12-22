import MainLayout from '../../layouts/MainLayout';
import { useCart } from '../../context/CartContext';
import { useNavigate } from 'react-router-dom';
import { useMemo, useState, useEffect } from 'react';
import { useProfile } from '../../hooks/useProfile';
import { useToast } from '../../context/ToastContext';
import addressService from '../../services/buyer/addressService';
import PromoCodeInput from '../../components/promotions/PromoCodeInput';
import PromotionList from '../../components/promotions/PromotionList';
import { calculateDiscount, formatCurrency } from '../../services/admin/promotionService';
import { createPaymentUrl } from '../../services/buyer/paymentService';
import { createMoMoPayment } from '../../services/buyer/momoPaymentService';
import { getProductVariantById } from '../../services/common/productService';
import { getStoreById } from '../../services/common/storeService';
import { calculateShippingFee, calculateExpectedDeliveryDate } from '../../services/common/provinceService';
import SEO from '../../components/seo/SEO';

const CheckoutPage = () => {
  const { getSelectedItems, getSelectedTotalItems, getSelectedTotalPrice, formatPrice, removeSelectedItems } = useCart();
  
  // ✅ Memoize items để tránh infinite loop trong useEffect
  const items = useMemo(() => getSelectedItems(), [getSelectedItems]);
  
  const navigate = useNavigate();
  
  // ✅ Toast notification
  const { success, error, warning } = useToast();

  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState(''); // 'COD' | 'BANK_TRANSFER' | etc
  const [note, setNote] = useState('');
  // ✅ Sửa để hỗ trợ cả platform và store promotions cùng lúc
  const [appliedPlatformPromotions, setAppliedPlatformPromotions] = useState({
    orderPromotionCode: null,
    shippingPromotionCode: null,
    orderPromotion: null, // Lưu full promotion object để tính discount
    shippingPromotion: null, // Lưu full promotion object để tính discount
  }); // { orderPromotionCode, shippingPromotionCode, orderPromotion, shippingPromotion }
  const [appliedStorePromotions, setAppliedStorePromotions] = useState({}); // { [storeId]: { code, promotion } }
  
  // ✅ Giữ lại appliedPromotion để tương thích với UI hiện tại (sẽ refactor sau)
  const [appliedPromotion, setAppliedPromotion] = useState(null); // { code, promotion, discount }
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [storeAddresses, setStoreAddresses] = useState({}); // { storeId: { province } }
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
  // ✅ Tính discount từ cả platform và store promotions
  // Platform order discount
  const platformOrderDiscount = appliedPlatformPromotions.orderPromotion 
    ? calculateDiscount(appliedPlatformPromotions.orderPromotion, productTotal)
    : 0;
  // Platform shipping discount
  const platformShippingDiscount = appliedPlatformPromotions.shippingPromotion 
    ? calculateDiscount(appliedPlatformPromotions.shippingPromotion, productTotal)
    : 0;
  // Store discount (tính tổng từ tất cả stores)
  const storeDiscountTotal = Object.values(appliedStorePromotions).reduce((total, promo) => {
    if (promo.promotion) {
      return total + calculateDiscount(promo.promotion, productTotal);
    }
    return total;
  }, 0);
  
  // ✅ Tổng hợp discount
  const orderDiscount = platformOrderDiscount + storeDiscountTotal;
  const shippingDiscount = platformShippingDiscount;
  
  // 🔁 Map variantId -> { storeId, storeName } được resolve từ API (nếu thiếu)
  // ⚠️ PHẢI KHAI BÁO TRƯỚC groupedItems vì groupedItems sử dụng nó
  const [resolvedStoreMap, setResolvedStoreMap] = useState({});
  const [isLoadingStoreInfo, setIsLoadingStoreInfo] = useState(false);

  // ✅ Group sản phẩm theo từng store để hiển thị tách biệt
  // ⚠️ PHẢI KHAI BÁO TRƯỚC shippingFee vì shippingFee sử dụng nó
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

  // ✅ Tính phí ship động dựa trên địa chỉ
  const selectedAddress = addresses.find(addr => addr.id === selectedAddressId);
  const shippingFee = useMemo(() => {
    if (!selectedAddress?.province) {
      return 30000; // Default nếu chưa chọn địa chỉ
    }
    
    // Tính tổng trọng lượng (mặc định 1sp = 500g)
    const totalWeight = items.reduce((sum, item) => {
      return sum + ((item.quantity || 1) * 0.5); // 0.5kg per item
    }, 0);
    
    // Nếu có nhiều cửa hàng, tính phí ship cho cửa hàng đầu tiên hoặc tính trung bình
    // Ưu tiên: lấy store đầu tiên từ groupedItems
    if (groupedItems.length > 0) {
      const firstStore = groupedItems[0];
      const storeId = firstStore.storeId;
      
      if (storeId && storeAddresses[storeId]?.province) {
        const storeProvince = storeAddresses[storeId].province;
        return calculateShippingFee(storeProvince, selectedAddress.province, totalWeight);
      }
    }
    
    // Fallback: dùng default
    return 30000;
  }, [selectedAddress, items, groupedItems, storeAddresses]);
  
  // ❌ KHÔNG cộng hoa hồng nền tảng vào tiền khách trả
  // Hoa hồng nền tảng (serviceFee/platformCommission) sẽ do backend tính trên doanh thu của người bán
  // Tổng tiền khách phải trả chỉ gồm: tiền hàng - giảm giá đơn hàng + (phí vận chuyển - giảm phí vận chuyển)
  const finalTotal = Math.max(0, productTotal - orderDiscount + Math.max(0, shippingFee - shippingDiscount));
  
  // Debug log (có thể bật lại khi cần)
  useEffect(() => {
    // console.log('[Checkout] Totals:', { productTotal, orderDiscount, shippingDiscount, shippingFee, finalTotal });
  }, [productTotal, orderDiscount, shippingDiscount, appliedPromotion, shippingFee, finalTotal]);

  const itemsKey = useMemo(() => items.map(it => it.id).join(','), [items]);

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

    if (needResolve.length === 0) {
      setIsLoadingStoreInfo(false);
      return;
    }

    setIsLoadingStoreInfo(true);

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
          }
        } catch (err) {
          console.error('🧾[Checkout] Failed to resolve store for variant', variantId, err);
        }
      }

      if (Object.keys(updates).length > 0) {
        setResolvedStoreMap((prev) => ({ ...prev, ...updates }));
      }
      setIsLoadingStoreInfo(false);
    })();
  }, [itemsKey]); // Sử dụng itemsKey để tránh infinite loop do reference thay đổi

  // ✅ Load địa chỉ của các store để tính phí ship
  useEffect(() => {
    const loadStoreAddresses = async () => {
      const storeIds = uniqueStores
        .map(s => s.storeId)
        .filter(id => id && !storeAddresses[id]);
      
      if (storeIds.length === 0) return;
      
      const addresses = {};
      for (const storeId of storeIds) {
        try {
          const result = await getStoreById(storeId);
          if (result.success && result.data?.address?.province) {
            addresses[storeId] = {
              province: result.data.address.province,
            };
          }
        } catch (err) {
          console.error('Error loading store address:', err);
        }
      }
      
      if (Object.keys(addresses).length > 0) {
        setStoreAddresses(prev => ({ ...prev, ...addresses }));
      }
    };
    
    loadStoreAddresses();
  }, [uniqueStores, storeAddresses]);
  
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
      // Swagger schema: { id, productVariantId, colorId, quantity }
      const selectedItems = items.map(it => ({
        ...(it.id && { id: it.id }), // Optional field theo Swagger
        productVariantId: it.productVariantId || it.product?.id,
        quantity: it.quantity || 1,
        ...(it.options?.colorId || it.options?.color ? { 
          colorId: it.options?.colorId || it.options?.color 
        } : {}), // Chỉ thêm nếu có giá trị
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
      
      // ✅ Build promotions (platform và/hoặc store)
      // Theo Swagger: OrderDTO có cả platformPromotions và storePromotions
      // - platformPromotions: { orderPromotionCode, shippingPromotionCode }
      // - storePromotions: { [storeId]: promotionCode }
      
      // ✅ Sử dụng state mới để hỗ trợ cả 2 loại cùng lúc
      let platformPromotions = null;
      let storePromotions = null;
      
      // ✅ Platform promotions (có thể có cả order và shipping)
      if (appliedPlatformPromotions.orderPromotionCode || appliedPlatformPromotions.shippingPromotionCode) {
        platformPromotions = {
          orderPromotionCode: appliedPlatformPromotions.orderPromotionCode || null,
          shippingPromotionCode: appliedPlatformPromotions.shippingPromotionCode || null,
        };
        console.log('🏪 [Checkout] Using platform promotions:', platformPromotions);
      }
      
      // ✅ Store promotions (có thể có nhiều store)
      // ⚠️ Backend mong đợi: { [storeId]: promotionCode (string) }
      // Không phải: { [storeId]: { code, promotion } }
      if (Object.keys(appliedStorePromotions).length > 0) {
        storePromotions = {};
        Object.keys(appliedStorePromotions).forEach(storeId => {
          const promo = appliedStorePromotions[storeId];
          if (promo && promo.code) {
            storePromotions[storeId] = promo.code; // ✅ Chỉ gửi code string, không gửi object
          }
        });
        console.log('🏬 [Checkout] Using store promotions:', storePromotions);
      }
      
      // ✅ Fallback: Nếu vẫn dùng appliedPromotion cũ (để tương thích)
      if (!platformPromotions && !storePromotions && appliedPromotion) {
        const isStorePromotion = appliedPromotion.isStorePromotion === true;
        const isShippingPromotion = appliedPromotion.isShippingPromotion === true;
        
        if (isStorePromotion && primaryStoreId) {
          storePromotions = {
            [primaryStoreId]: appliedPromotion.code
          };
        } else {
          platformPromotions = {
            orderPromotionCode: isShippingPromotion ? null : appliedPromotion.code,
            shippingPromotionCode: isShippingPromotion ? appliedPromotion.code : null,
          };
        }
      }
      
      // ✅ Tính ngày giao dự kiến dựa trên địa chỉ store và buyer
      let expectedDeliveryDate = null;
      if (selectedAddress?.province && primaryStoreId && storeAddresses[primaryStoreId]?.province) {
        const storeProvince = storeAddresses[primaryStoreId].province;
        const buyerProvince = selectedAddress.province;
        const expectedDate = calculateExpectedDeliveryDate(storeProvince, buyerProvince);
        // Format: ISO string (YYYY-MM-DDTHH:mm:ss.sssZ)
        expectedDeliveryDate = expectedDate.toISOString();
        console.log('📅 [Checkout] Expected delivery date:', {
          storeProvince,
          buyerProvince,
          expectedDate: expectedDeliveryDate,
          days: Math.ceil((expectedDate - new Date()) / (1000 * 60 * 60 * 24))
        });
      }
      
      // ✅ Đảm bảo chỉ gửi code string, không gửi object
      // Clean platformPromotions - chỉ giữ lại code strings, loại bỏ null
      // Swagger schema: { orderPromotionCode, shippingPromotionCode, applyShippingToStores[] }
      // ⚠️ QUAN TRỌNG: Backend cần applyShippingToStores để biết store nào được áp dụng platform promotion
      // và tạo AdminRevenue với revenueType = PLATFORM_DISCOUNT_LOSS
      let cleanPlatformPromotions = null;
      if (platformPromotions) {
        cleanPlatformPromotions = {};
        
        // Chỉ thêm orderPromotionCode nếu là string và không null
        if (typeof platformPromotions.orderPromotionCode === 'string' && platformPromotions.orderPromotionCode.trim()) {
          const orderCode = platformPromotions.orderPromotionCode.trim();
          cleanPlatformPromotions.orderPromotionCode = orderCode;
          
          // ⚠️ Log để debug: Kiểm tra promotion có minOrderValue không
          const orderPromo = appliedPlatformPromotions.orderPromotion;
          if (orderPromo) {
            console.log('🔍 [Checkout] Order Promotion Details:', {
              code: orderCode,
              hasMinOrderValue: orderPromo.minOrderValue !== null && orderPromo.minOrderValue !== undefined,
              minOrderValue: orderPromo.minOrderValue,
              promotion: orderPromo
            });
          }
        }
        
        // Chỉ thêm shippingPromotionCode nếu là string và không null
        if (typeof platformPromotions.shippingPromotionCode === 'string' && platformPromotions.shippingPromotionCode.trim()) {
          const shippingCode = platformPromotions.shippingPromotionCode.trim();
          cleanPlatformPromotions.shippingPromotionCode = shippingCode;
          
          // ⚠️ Log để debug: Kiểm tra promotion có minOrderValue không
          const shippingPromo = appliedPlatformPromotions.shippingPromotion;
          if (shippingPromo) {
            console.log('🔍 [Checkout] Shipping Promotion Details:', {
              code: shippingCode,
              hasMinOrderValue: shippingPromo.minOrderValue !== null && shippingPromo.minOrderValue !== undefined,
              minOrderValue: shippingPromo.minOrderValue,
              promotion: shippingPromo
            });
          }
        }
        
        // ✅ LUÔN thêm applyShippingToStores khi có platform promotions (cả order và shipping)
        // Backend cần field này để biết store nào được áp dụng platform promotion
        // và tạo AdminRevenue với revenueType = PLATFORM_DISCOUNT_LOSS
        if (uniqueStores.length > 0) {
          cleanPlatformPromotions.applyShippingToStores = uniqueStores
            .map(s => s.storeId)
            .filter(id => id); // Chỉ lấy storeId hợp lệ
        }
        
        // Chỉ thêm nếu có ít nhất 1 code (không gửi object rỗng)
        if (Object.keys(cleanPlatformPromotions).length === 0) {
          cleanPlatformPromotions = null;
        }
      }
      
      // Clean storePromotions - đảm bảo tất cả values đều là string
      let cleanStorePromotions = null;
      if (storePromotions && Object.keys(storePromotions).length > 0) {
        cleanStorePromotions = {};
        Object.keys(storePromotions).forEach(storeId => {
          const code = storePromotions[storeId];
          if (typeof code === 'string' && code.trim()) {
            cleanStorePromotions[storeId] = code.trim();
            
            // ⚠️ Log để debug: Kiểm tra promotion có minOrderValue không
            const storePromo = appliedStorePromotions[storeId]?.promotion;
            if (storePromo) {
              console.log('🔍 [Checkout] Store Promotion Details:', {
                storeId,
                code: code.trim(),
                hasMinOrderValue: storePromo.minOrderValue !== null && storePromo.minOrderValue !== undefined,
                minOrderValue: storePromo.minOrderValue,
                promotion: storePromo
              });
            }
          }
        });
        // Chỉ thêm nếu có ít nhất 1 code
        if (Object.keys(cleanStorePromotions).length === 0) {
          cleanStorePromotions = null;
        }
      }
      
      // ✅ SHOPEE STYLE: Tách đơn hàng theo store
      // Nếu có nhiều store → tạo nhiều đơn hàng riêng biệt
      const ordersToCreate = [];
      
      if (uniqueStores.length > 1) {
        // ✅ Có nhiều store → tách thành nhiều đơn hàng
        console.log('🛒 [Checkout] Multiple stores detected, splitting into separate orders:', uniqueStores.length);
        
        for (const store of uniqueStores) {
          const storeGroup = groupedItems.find(g => g.storeId === store.storeId);
          if (!storeGroup || !storeGroup.items || storeGroup.items.length === 0) continue;
          
          // ✅ Lấy items của store này
          const storeItems = storeGroup.items.map(it => ({
            ...(it.id && { id: it.id }),
            productVariantId: it.productVariantId || it.product?.id,
            quantity: it.quantity || 1,
            ...(it.options?.colorId || it.options?.color ? { 
              colorId: it.options?.colorId || it.options?.color 
            } : {}),
          }));
          
          // ✅ Tính shipping fee riêng cho store này
          let storeShippingFee = 30000; // Default
          if (store.storeId && storeAddresses[store.storeId]?.province && selectedAddress?.province) {
            const storeProvince = storeAddresses[store.storeId].province;
            const buyerProvince = selectedAddress.province;
            const storeWeight = storeGroup.items.reduce((sum, item) => {
              return sum + ((item.quantity || 1) * 0.5); // 0.5kg per item
            }, 0);
            storeShippingFee = calculateShippingFee(storeProvince, buyerProvince, storeWeight);
          }
          
          // ✅ Tính ngày giao dự kiến riêng cho store này
          let storeExpectedDeliveryDate = null;
          if (store.storeId && storeAddresses[store.storeId]?.province && selectedAddress?.province) {
            const storeProvince = storeAddresses[store.storeId].province;
            const buyerProvince = selectedAddress.province;
            const expectedDate = calculateExpectedDeliveryDate(storeProvince, buyerProvince);
            storeExpectedDeliveryDate = expectedDate.toISOString();
          }
          
          // ✅ Store promotions chỉ cho store này
          const storePromotionForThisStore = cleanStorePromotions?.[store.storeId] 
            ? { [store.storeId]: cleanStorePromotions[store.storeId] }
            : null;
          
          // ✅ Platform promotions (áp dụng chung cho tất cả stores)
          // ⚠️ QUAN TRỌNG: Luôn gửi applyShippingToStores khi có platform promotions
          // để backend biết store nào được áp dụng và tạo AdminRevenue với PLATFORM_DISCOUNT_LOSS
          const storePlatformPromotions = cleanPlatformPromotions ? {
            ...cleanPlatformPromotions,
            // ✅ LUÔN thêm applyShippingToStores với storeId này (cả order và shipping promotion)
            // Backend cần field này để tạo AdminRevenue với revenueType = PLATFORM_DISCOUNT_LOSS
            applyShippingToStores: [store.storeId]
          } : null;
          
          const storeOrderData = {
            selectedItems: storeItems,
            paymentMethod: paymentMethod.toUpperCase(),
            note: note.trim(),
            address: addressDTO,
            ...(storePlatformPromotions && { platformPromotions: storePlatformPromotions }),
            ...(storePromotionForThisStore && { storePromotions: storePromotionForThisStore }),
            ...(storeExpectedDeliveryDate && { expectedDeliveryDate: storeExpectedDeliveryDate }),
          };
          
          ordersToCreate.push({
            storeId: store.storeId,
            storeName: store.storeName,
            orderData: storeOrderData,
            shippingFee: storeShippingFee,
          });
          
          console.log(`📦 [Checkout] Prepared order for store ${store.storeName}:`, {
            items: storeItems.length,
            shippingFee: storeShippingFee,
            orderData: storeOrderData
          });
        }
      } else {
        // ✅ Chỉ có 1 store → tạo 1 đơn hàng như cũ
        const orderData = {
          selectedItems,
          paymentMethod: paymentMethod.toUpperCase(),
          note: note.trim(),
          address: addressDTO,
          ...(cleanPlatformPromotions && { platformPromotions: cleanPlatformPromotions }),
          ...(cleanStorePromotions && { storePromotions: cleanStorePromotions }),
          ...(expectedDeliveryDate && { expectedDeliveryDate }),
        };
        
        ordersToCreate.push({
          storeId: primaryStoreId || uniqueStores[0]?.storeId,
          storeName: uniqueStores[0]?.storeName || 'Store',
          orderData,
          shippingFee: shippingFee,
        });
      }
      
      // 🔍 DEBUG LOGS
      console.log('🛒 [CHECKOUT DEBUG] ===== CHECKOUT REQUEST =====');
      console.log('🛒 [CHECKOUT DEBUG] Number of stores:', uniqueStores.length);
      console.log('🛒 [CHECKOUT DEBUG] Orders to create:', ordersToCreate.length);
      console.log('🛒 [CHECKOUT DEBUG] Payment Method:', paymentMethod);
      console.log('🛒 [CHECKOUT DEBUG] Address DTO:', addressDTO);
      console.log('🛒 [CHECKOUT DEBUG] Platform Promotions:', cleanPlatformPromotions);
      console.log('🛒 [CHECKOUT DEBUG] Store Promotions:', cleanStorePromotions);
      console.log('🛒 [CHECKOUT DEBUG] Orders Data:', ordersToCreate);
      console.log('🛒 [CHECKOUT DEBUG] ================================');
      
      // ✅ Tạo tất cả đơn hàng (song song hoặc tuần tự)
      const orderResults = [];
      for (const orderInfo of ordersToCreate) {
        console.log(`📦 [Checkout] Creating order for store: ${orderInfo.storeName}`);
        const result = await createOrder(orderInfo.orderData);
        orderResults.push({
          ...result,
          storeId: orderInfo.storeId,
          storeName: orderInfo.storeName,
        });
        
        if (!result.success) {
          console.error(`❌ [Checkout] Failed to create order for store ${orderInfo.storeName}:`, result.error);
        } else {
          console.log(`✅ [Checkout] Order created for store ${orderInfo.storeName}:`, result.data);
        }
      }
      
      // ✅ Kiểm tra kết quả
      const successResults = orderResults.filter(r => r.success);
      const failedResults = orderResults.filter(r => !r.success);
      
      if (failedResults.length > 0) {
        error(`Có ${failedResults.length} đơn hàng không thể tạo. Vui lòng thử lại.`);
        setIsPlacingOrder(false);
        return;
      }
      
      // ✅ Lấy tất cả order IDs
      const allOrderIds = [];
      successResults.forEach(result => {
        if (Array.isArray(result.data)) {
          result.data.forEach(order => {
            allOrderIds.push(order.id || order.orderId);
          });
        } else if (result.data) {
          allOrderIds.push(result.data.id || result.data.orderId);
        }
      });
      
      const result = {
        success: successResults.length > 0,
        data: successResults.map(r => r.data).flat(),
        orderIds: allOrderIds,
        ordersCount: successResults.length,
      };
      
      // 🔍 DEBUG RESPONSE
      console.log('🛒 [CHECKOUT DEBUG] ===== CHECKOUT RESPONSE =====');
      console.log('🛒 [CHECKOUT DEBUG] Result Success:', result.success);
      console.log('🛒 [CHECKOUT DEBUG] Orders Created:', result.ordersCount);
      console.log('🛒 [CHECKOUT DEBUG] Order IDs:', result.orderIds);
      console.log('🛒 [CHECKOUT DEBUG] Result Data:', result.data);
      console.log('🛒 [CHECKOUT DEBUG] =================================');
      
      if (result.success) {
        console.log('✅ [Checkout] Orders created:', result.data);
        
        // ✅ Lấy orderId đầu tiên để xử lý payment (hoặc có thể xử lý tất cả)
        const orderId = result.orderIds[0] || null;
        const totalAmount = finalTotal; // Tổng tiền của tất cả đơn hàng
        
        console.log('✅ [Checkout] First Order ID:', orderId);
        console.log('✅ [Checkout] Total Orders:', result.ordersCount);
        console.log('✅ [Checkout] Total Amount:', totalAmount);
        
        removeSelectedItems();
        
        // ✅ Hiển thị thông báo thành công
        if (result.ordersCount > 1) {
          success(`🎉 Đã tạo ${result.ordersCount} đơn hàng thành công! (${uniqueStores.map(s => s.storeName).join(', ')})`);
        } else {
          success('🎉 Đặt hàng thành công! Cảm ơn bạn đã mua hàng.');
        }
        
        // ✅ Nếu chọn VNPay → Tạo payment URL và redirect
        if (paymentMethod === 'VNPAY') {
          console.log('💳 [Checkout] VNPay selected, creating payment URL...');
          console.log('💳 [Checkout] Order IDs:', result.orderIds);
          console.log('💳 [Checkout] Total amount:', totalAmount);
          
          // ✅ Tạo orderInfo với tất cả orderIds để backend có thể liên kết
          const orderInfo = result.ordersCount > 1 
            ? `Thanh toán ${result.ordersCount} đơn hàng (${result.orderIds.join(', ')})`
            : `Thanh toán đơn hàng ${orderId || 'chưa có ID'}`;
          
          const paymentResult = await createPaymentUrl({
            amount: totalAmount,
            language: 'vn',
            orderInfo: orderInfo, // ✅ Truyền orderInfo với tất cả orderIds
            orderIds: result.orderIds, // ✅ Truyền orderIds để backend liên kết payment với các đơn hàng
          });
          
          if (paymentResult.success && paymentResult.data?.paymentUrl) {
            console.log('✅ [Checkout] Payment URL created:', paymentResult.data.paymentUrl);
            
            // Mở VNPay trong tab mới
            const vnpayWindow = window.open(paymentResult.data.paymentUrl, '_blank');
            
            if (vnpayWindow) {
              success('🎉 Đơn hàng đã tạo! Vui lòng thanh toán trên tab mới.');
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
          console.log('💳 [Checkout] Order IDs:', result.orderIds);
          console.log('💳 [Checkout] Total amount:', totalAmount);
          
          // ✅ Truyền orderId đầu tiên, orderInfo và orderIds để backend có thể liên kết với nhiều orders
          const orderInfo = result.ordersCount > 1 
            ? `Thanh toán ${result.ordersCount} đơn hàng (${result.orderIds.join(', ')})`
            : `Thanh toán đơn hàng ${orderId || 'chưa có ID'}`;
          const momoResult = await createMoMoPayment(totalAmount, orderId, orderInfo, result.orderIds);
          
          if (momoResult.success && momoResult.data?.payUrl) {
            console.log('✅ [Checkout] MoMo payment URL created:', momoResult.data.payUrl);
            console.log('✅ [Checkout] MoMo order ID:', momoResult.data.orderId);
            console.log('✅ [Checkout] MoMo trans ID:', momoResult.data.transId);
            
            // Mở MoMo trong tab mới
            const momoWindow = window.open(momoResult.data.payUrl, '_blank');
            
            if (momoWindow) {
              success('🎉 Đơn hàng đã tạo! Vui lòng thanh toán qua MoMo trên tab mới.');
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
            {isLoadingStoreInfo ? (
              <div className="py-8 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <p className="mt-2 text-sm text-gray-500 italic">Đang tải thông tin cửa hàng...</p>
              </div>
            ) : (
              <>
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
              </>
            )}
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

            {/* ✅ Mã giảm giá - 2 phần riêng biệt */}
            <div className="mb-4 space-y-4">
              {/* ✅ GỘP TẤT CẢ MÃ KHUYẾN MÃI VÀO 1 SECTION GỌN GÀNG (Giống Shopee) */}
              <div className="border border-gray-200 rounded-lg p-4 bg-white">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  🎁 Mã giảm giá
                </label>
                
                {/* Input mã khuyến mãi sàn */}
                <div className="mb-3">
                  <PromoCodeInput
                    orderTotal={productTotal}
                    storeId={null}
                    productIds={items.map(it => it.productVariantId || it.product?.id)}
                    onApplySuccess={(promoData) => {
                      const isShippingPromotion = promoData.isShippingPromotion === true;
                      setAppliedPlatformPromotions(prev => ({
                        ...prev,
                        orderPromotionCode: isShippingPromotion ? prev.orderPromotionCode : promoData.code,
                        shippingPromotionCode: isShippingPromotion ? promoData.code : prev.shippingPromotionCode,
                        orderPromotion: isShippingPromotion ? prev.orderPromotion : promoData.promotion,
                        shippingPromotion: isShippingPromotion ? promoData.promotion : prev.shippingPromotion,
                      }));
                      success(`✨ Áp dụng mã sàn ${promoData.code} thành công!`);
                    }}
                    onRemove={() => {
                      const isShippingPromotion = appliedPlatformPromotions.shippingPromotionCode !== null;
                      setAppliedPlatformPromotions(prev => ({
                        ...prev,
                        orderPromotionCode: isShippingPromotion ? prev.orderPromotionCode : null,
                        shippingPromotionCode: isShippingPromotion ? null : prev.shippingPromotionCode,
                        orderPromotion: isShippingPromotion ? prev.orderPromotion : null,
                        shippingPromotion: isShippingPromotion ? null : prev.shippingPromotion,
                      }));
                      success('Đã xóa mã khuyến mãi sàn');
                    }}
                    appliedPromotion={
                      appliedPlatformPromotions.orderPromotionCode || appliedPlatformPromotions.shippingPromotionCode
                        ? { 
                            code: appliedPlatformPromotions.orderPromotionCode || appliedPlatformPromotions.shippingPromotionCode,
                            promotion: appliedPlatformPromotions.orderPromotion || appliedPlatformPromotions.shippingPromotion || null
                          }
                        : null
                    }
                  />
                </div>

                {/* Input mã khuyến mãi cửa hàng - GỌN GÀNG HƠN (Giống Shopee) */}
                {uniqueStores.length > 1 && (
                  <div className="mb-3">
                    {/* ✅ Hiển thị mã đã áp dụng với khung giống mã sàn */}
                    {Object.keys(appliedStorePromotions).length > 0 && (
                      <div className="space-y-3 mb-2">
                        {uniqueStores.map((store) => {
                          const promo = appliedStorePromotions[store.storeId];
                          if (!promo) return null;
                          
                          // ✅ Tính discount giống như mã sàn
                          const promotion = promo.promotion || {};
                          const storeGroup = groupedItems.find(g => g.storeId === store.storeId);
                          const storeItems = storeGroup?.items || [];
                          const storeTotal = storeItems.reduce((sum, item) => {
                            const price = typeof item.product?.price === 'string'
                              ? parseInt(item.product.price.replace(/\./g, '') || 0)
                              : parseInt(item.product?.price || 0);
                            return sum + (price * parseInt(item.quantity || 0));
                          }, 0);
                          const discount = promotion ? calculateDiscount(promotion, storeTotal) : 0;
                          
                          return (
                            <div key={store.storeId} className="bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 border-2 border-green-300 rounded-xl p-4 shadow-md">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2 mb-2 flex-wrap">
                                    <span className="text-2xl">🎉</span>
                                    <span className="font-mono font-bold text-green-700 bg-white px-3 py-1 rounded-lg shadow-sm border border-green-200">
                                      {promo.code}
                                    </span>
                                    {promotion && (
                                      <span className="text-xs bg-gradient-to-r from-green-400 to-emerald-500 text-white px-3 py-1 rounded-full font-bold shadow-md">
                                        {promotion.discountType === 'PERCENTAGE' 
                                          ? `Giảm ${promotion.discountValue}%`
                                          : promotion.discountType === 'FIXED'
                                          ? `Giảm ${formatCurrency(promotion.discountValue)}`
                                          : 'Giảm giá'}
                                      </span>
                                    )}
                                    <span className="text-xs text-gray-600 bg-white px-2 py-1 rounded border border-gray-200">
                                      {store.storeName}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-700 font-medium mb-1">
                                    {promotion?.description || 'Giảm giá đơn hàng'}
                                  </p>
                                  {discount > 0 && (
                                    <p className="text-base font-bold text-green-600 flex items-center space-x-1">
                                      <span>💰</span>
                                      <span>Tiết kiệm: {formatCurrency(discount)}</span>
                                    </p>
                                  )}
                                </div>
                                <button
                                  onClick={() => {
                                    setAppliedStorePromotions(prev => {
                                      const newState = { ...prev };
                                      delete newState[store.storeId];
                                      return newState;
                                    });
                                    success(`Đã xóa mã ${store.storeName}`);
                                  }}
                                  className="ml-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium text-sm transition-all shadow-md hover:scale-105"
                                >
                                  ✕ Xóa
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Danh sách mã khuyến mãi có sẵn - GỘP VÀO 1 SECTION (Giống Shopee) */}
                <div className="mt-3 pt-3 border-t border-gray-200">
                  {/* ✅ Mã khuyến mãi sàn */}
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">
                      🏪 Mã khuyến mãi sàn
                    </h4>
                    <PromotionList
                      orderTotal={productTotal}
                      storeId={null} // ✅ Chỉ lấy platform promotions
                      productIds={items.map(it => it.productVariantId || it.product?.id)}
                      selectedCode={
                        appliedPlatformPromotions.orderPromotionCode || 
                        appliedPlatformPromotions.shippingPromotionCode
                      }
                      onSelectPromotion={(promotion, isStorePromotion = false) => {
                        if (!isStorePromotion) {
                          // Platform promotion
                          const discount = calculateDiscount(promotion, productTotal);
                          const applicableFor = promotion.applicableFor || promotion.applicableForType;
                          const isShippingPromotion = applicableFor === 'SHIPPING';
                          
                          setAppliedPlatformPromotions(prev => ({
                            ...prev,
                            orderPromotionCode: isShippingPromotion ? prev.orderPromotionCode : promotion.code,
                            shippingPromotionCode: isShippingPromotion ? promotion.code : prev.shippingPromotionCode,
                            orderPromotion: isShippingPromotion ? prev.orderPromotion : promotion,
                            shippingPromotion: isShippingPromotion ? promotion : prev.shippingPromotion,
                          }));
                          success(`✨ Áp dụng mã sàn ${promotion.code} thành công!`);
                        }
                      }}
                    />
                  </div>
                  
                  {/* ✅ Mã khuyến mãi cửa hàng - Render riêng cho từng store */}
                  {uniqueStores.map((store) => {
                    const storeGroup = groupedItems.find(g => g.storeId === store.storeId);
                    const storeItems = storeGroup?.items || [];
                    const storeTotal = storeItems.reduce((sum, item) => {
                      const price = typeof item.product?.price === 'string'
                        ? parseInt(item.product.price.replace(/\./g, '') || 0)
                        : parseInt(item.product?.price || 0);
                      return sum + (price * parseInt(item.quantity || 0));
                    }, 0);
                    const storeProductIds = storeItems.map(it => it.productVariantId || it.product?.id);
                    
                    console.log(`🔍 [Checkout] Rendering PromotionList for store: ${store.storeName}`);
                    console.log(`🔍 [Checkout] storeId: ${store.storeId}`);
                    console.log(`🔍 [Checkout] storeTotal: ${storeTotal}`);
                    console.log(`🔍 [Checkout] storeProductIds:`, storeProductIds);
                    
                    return (
                      <div key={store.storeId} className="mt-4 pt-4 border-t border-gray-200">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">
                          🏬 Mã khuyến mãi {store.storeName}
                        </h4>
                        <PromotionList
                          orderTotal={storeTotal}
                          storeId={store.storeId} // ✅ Truyền storeId cụ thể
                          productIds={storeProductIds}
                          selectedCode={appliedStorePromotions[store.storeId]?.code}
                          onSelectPromotion={(promotion, isStorePromotion = true) => {
                            if (isStorePromotion) {
                              setAppliedStorePromotions(prev => ({
                                ...prev,
                                [store.storeId]: {
                                  code: promotion.code,
                                  promotion: promotion
                                }
                              }));
                              success(`✨ Áp dụng mã ${promotion.code} cho ${store.storeName} thành công!`);
                            }
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            
            {/* Thông tin cách tính phí ship */}
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <div className="text-xs font-semibold text-blue-900 mb-1">📦 Cách tính phí vận chuyển:</div>
                  <div className="text-xs text-blue-800 space-y-0.5">
                    <div>• <strong>Cùng tỉnh:</strong> 15,000đ</div>
                    <div>• <strong>Cùng vùng:</strong> 30,000đ</div>
                    <div>• <strong>Vùng lân cận:</strong> 45,000đ</div>
                    <div>• <strong>Vùng xa (Bắc↔Nam):</strong> 60,000đ</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span>Tạm tính</span><span>{formatPrice(productTotal)}đ</span></div>
              {orderDiscount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Giảm giá</span>
                  <span>-{formatPrice(orderDiscount)}đ</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Phí vận chuyển</span>
                <span>{formatPrice(shippingFee)}đ</span>
              </div>
              {shippingDiscount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Giảm phí vận chuyển</span>
                  <span>-{formatPrice(shippingDiscount)}đ</span>
                </div>
              )}
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

