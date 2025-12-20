import { memo, useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import useSWR from 'swr';
import ReviewForm from '../reviews/ReviewForm';
import ChatButton from '../chat/ChatButton';
import { getOrderById, getOrderStatusBadge, getPaymentMethodLabel, canCancelOrder, canReviewOrder, completeOrder } from '../../services/buyer/orderService';
import { getOrderCode } from '../../utils/displayCodeUtils';
import { checkExistingReview } from '../../services/buyer/reviewService';
import { useToast } from '../../context/ToastContext';

/**
 * Format currency VND
 */
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
};

/**
 * Format date
 */
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

/**
 * OrderCard Component - WITH AUTO DETAIL FETCH
 * Automatically fetches order details to get items
 */
const OrderCard = ({ order, onCancel, onRefresh }) => {
  const { success } = useToast();
  const navigate = useNavigate();
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [reviewedItems, setReviewedItems] = useState({}); // Track which items have been reviewed
  const [cachedDiscount, setCachedDiscount] = useState(null);

  // Fetch order details to get items
  const { data: detailData } = useSWR(
    expanded ? ['order-detail', order.id] : null,
    () => getOrderById(order.id),
    {
      revalidateOnFocus: false,
    }
  );

  const orderDetail = detailData?.success ? detailData.data : null;
  
  const {
    id,
    orderNumber,
    status,
    totalAmount,
    totalPrice,
    finalTotal,
    createdAt,
    shippingAddress,
    paymentMethod,
    storeName,
    store,
    shop,
    refundStatus,
    refundTransactionId,
  } = order;

  // Handle different store name formats from backend
  const getStoreName = () => {
    if (storeName) return storeName;
    if (store?.storeName) return store.storeName;
    if (store?.name) return store.name;
    if (shop?.name) return shop.name;
    if (shop?.storeName) return shop.storeName;
    return 'Chưa có tên shop';
  };

  const displayStoreName = getStoreName();

  // Get items from detail or fallback to empty
  const items = orderDetail?.items || orderDetail?.orderItems || [];

  // Totals breakdown (prefer detail data, fallback to order fields)
  const subtotal = items.reduce(
    (sum, item) => sum + (parseFloat(item.price || 0) * parseInt(item.quantity || 0)), 0
  );
  const shippingFeeValue = parseFloat(
    orderDetail?.shippingFee ?? order.shippingFee ?? order.shippingCost ?? 0
  );

  // 💰 Hoa hồng nền tảng (platformCommission) - CHỈ DÙNG ĐỂ HIỂN THỊ NẾU CẦN, KHÔNG CỘNG VÀO TỔNG CỦA BUYER
  const platformCommissionValue = parseFloat(
    orderDetail?.platformCommission ??
    order.platformCommission ??
    orderDetail?.serviceFee ??
    order.serviceFee ??
    order.platformFee ??
    0
  );
  
  // ✅ Helper function để extract promotion code từ nhiều nguồn
  const getPromotionCode = (order, orderDetail) => {
    // 1. Kiểm tra promotions array (DBRef hoặc populated)
    if (order.promotions && Array.isArray(order.promotions) && order.promotions.length > 0) {
      const firstPromo = order.promotions[0];
      // Nếu là DBRef, có thể có $id hoặc id
      if (firstPromo.code) return firstPromo.code;
      if (firstPromo.$id) {
        // DBRef chưa populate, có thể cần gọi API để lấy code
        // Tạm thời return null, sẽ check các nguồn khác
      }
    }
    if (orderDetail?.promotions && Array.isArray(orderDetail.promotions) && orderDetail.promotions.length > 0) {
      const firstPromo = orderDetail.promotions[0];
      if (firstPromo.code) return firstPromo.code;
    }
    
    // 2. Kiểm tra các field promotion khác
    return (
      order.promotion?.code || 
      orderDetail?.promotion?.code || 
      order.promotionCode || 
      orderDetail?.promotionCode || 
      order.appliedPromotion?.code || 
      orderDetail?.appliedPromotion?.code ||
      order.platformPromotions?.orderPromotionCode ||
      order.platformPromotions?.shippingPromotionCode ||
      orderDetail?.platformPromotions?.orderPromotionCode ||
      orderDetail?.platformPromotions?.shippingPromotionCode ||
      null
    );
  };

  // ✅ Tính discount - ƯU TIÊN dùng discount từ backend, KHÔNG tính ngược (tránh sai số)
  let discountValue = 0;
  
  // 1. Lấy từ các fields discount trực tiếp (bao gồm cả các field mới từ BE)
  // Ưu tiên: totalDiscountAmount > storeDiscountAmount + platformDiscountAmount
  if (order.totalDiscountAmount !== undefined && order.totalDiscountAmount !== null) {
    discountValue = parseFloat(order.totalDiscountAmount);
  } else if (orderDetail?.totalDiscountAmount !== undefined && orderDetail?.totalDiscountAmount !== null) {
    discountValue = parseFloat(orderDetail.totalDiscountAmount);
  } else {
    // Tính tổng từ storeDiscountAmount + platformDiscountAmount
    const storeDiscount = parseFloat(order.storeDiscountAmount || orderDetail?.storeDiscountAmount || 0);
    const platformDiscount = parseFloat(order.platformDiscountAmount || orderDetail?.platformDiscountAmount || 0);
    discountValue = storeDiscount + platformDiscount;
  }
  
  // 2. Nếu vẫn = 0, check các field discount khác
  if (discountValue === 0) {
    const discountFields = [
      'discount',
      'discountAmount',
      'promotionDiscount',
      'appliedDiscount',
      'promotionAmount',
      'promotionValue',
      'discountValue',
    ];
    
    for (const field of discountFields) {
      if (order[field] !== undefined && order[field] !== null) {
        discountValue = parseFloat(order[field]);
        if (discountValue > 0) break;
      }
      if (orderDetail && orderDetail[field] !== undefined && orderDetail[field] !== null) {
        discountValue = parseFloat(orderDetail[field]);
        if (discountValue > 0) break;
      }
    }
  }
  
  // 3. Nếu vẫn = 0, check trong promotion hoặc appliedPromotion object
  if (discountValue === 0) {
    const promo = orderDetail?.promotion || order.promotion || orderDetail?.appliedPromotion || order.appliedPromotion;
    if (promo) {
      discountValue = parseFloat(promo.discountAmount || promo.discountValue || promo.value || 0);
    }
  }
  
  // 3. Nếu vẫn = 0 và có dấu hiệu có promotion, tính ngược từ totalAmount
  if (discountValue === 0 && (order.promotion || orderDetail?.promotion || order.appliedPromotion || orderDetail?.appliedPromotion || order.promotionCode || order.promotionId)) {
    const expectedTotal = subtotal + shippingFeeValue;
    const actualTotal = parseFloat(
      order.finalTotal ?? 
      orderDetail?.finalTotal ?? 
      order.totalAmount ?? 
      orderDetail?.totalAmount ?? 
      order.totalPrice ?? 
      orderDetail?.totalPrice ?? 
      0
    );
    
    if (actualTotal > 0 && expectedTotal > actualTotal) {
      discountValue = expectedTotal - actualTotal;
    }
  }
  
  const baseTotal = !isNaN(finalTotal) && finalTotal ? finalTotal
    : !isNaN(totalAmount) && totalAmount ? totalAmount
    : !isNaN(totalPrice) && totalPrice ? parseFloat(totalPrice)
    : NaN;

  // Fallback: tự tính lại từ breakdown (KHÔNG bao gồm platformCommission cho buyer)
  const fallbackTotal = Math.max(0, subtotal + shippingFeeValue - discountValue);
  const calculatedTotal = !Number.isNaN(baseTotal) && baseTotal > 0 ? baseTotal : fallbackTotal;

  // Map trạng thái hiển thị cho badge: RETURNED + refundStatus COMPLETED => REFUNDED
  let displayStatus = status;
  if (status === 'RETURNED') {
    displayStatus = refundStatus === 'COMPLETED' ? 'REFUNDED' : 'RETURNED';
  }

  const statusBadge = getOrderStatusBadge(displayStatus);
  const canCancel = canCancelOrder(status);
  const canReview = canReviewOrder(status);
  const canComplete = status === 'DELIVERED';
  const canReturn = status === 'DELIVERED' || status === 'COMPLETED';
  // Đơn đang có yêu cầu trả hàng/khiếu nại trả hàng
  const hasActiveReturnRequest =
    !!order.returnRequestId || // Swagger mới: dùng returnRequestId là chính
    !!order.returnRequest || // Backward-compat: BE có thể embed cả object
    order.returnStatus === 'REQUESTED' ||
    order.returnRequestStatus === 'PENDING' ||
    order.returnRequestStatus === 'REQUESTED';

  // Auto expand on mount to load items
  useEffect(() => {
    setExpanded(true);
  }, []);

  // Check which items have been reviewed
  useEffect(() => {
    const checkReviews = async () => {
      if (!orderDetail || !canReview) return;
      
      const items = orderDetail.items || orderDetail.orderItems || [];
      const reviewStatus = {};
      
      for (const item of items) {
        const variantId = item.productVariantId || item.id;
        const result = await checkExistingReview(variantId, order.id);
        
        if (result.success && result.hasReviewed) {
          reviewStatus[variantId] = true;
        }
      }
      
      setReviewedItems(reviewStatus);
    };
    
    checkReviews();
  }, [orderDetail, canReview, order.id]);
  
  // ✅ Cache discount khi tính được
  useEffect(() => {
    // Tính discount từ order object
    let discount = 0;
    
    // 1. Lấy từ discount fields (bao gồm các field mới: storeDiscountAmount, platformDiscountAmount, totalDiscountAmount)
    if (order.discount) discount = parseFloat(order.discount);
    else if (order.discountAmount) discount = parseFloat(order.discountAmount);
    else if (order.promotionDiscount) discount = parseFloat(order.promotionDiscount);
    else if (order.appliedDiscount) discount = parseFloat(order.appliedDiscount);
    else if (order.promotionAmount) discount = parseFloat(order.promotionAmount);
    else if (order.storeDiscountAmount) discount = parseFloat(order.storeDiscountAmount);
    else if (order.platformDiscountAmount) discount = parseFloat(order.platformDiscountAmount);
    else if (order.totalDiscountAmount) discount = parseFloat(order.totalDiscountAmount);
    else if (order.appliedPromotion?.discountAmount) discount = parseFloat(order.appliedPromotion.discountAmount);
    else if (order.appliedPromotion?.discountValue) discount = parseFloat(order.appliedPromotion.discountValue);
    
    // 2. Nếu có orderDetail, ưu tiên lấy từ đó
    if (orderDetail) {
      if (orderDetail.discount) discount = parseFloat(orderDetail.discount);
      else if (orderDetail.discountAmount) discount = parseFloat(orderDetail.discountAmount);
      else if (orderDetail.promotionDiscount) discount = parseFloat(orderDetail.promotionDiscount);
      else if (orderDetail.appliedDiscount) discount = parseFloat(orderDetail.appliedDiscount);
      else if (orderDetail.promotionAmount) discount = parseFloat(orderDetail.promotionAmount);
      else if (orderDetail.storeDiscountAmount) discount = parseFloat(orderDetail.storeDiscountAmount);
      else if (orderDetail.platformDiscountAmount) discount = parseFloat(orderDetail.platformDiscountAmount);
      else if (orderDetail.totalDiscountAmount) discount = parseFloat(orderDetail.totalDiscountAmount);
      else if (orderDetail.appliedPromotion?.discountAmount) discount = parseFloat(orderDetail.appliedPromotion.discountAmount);
      else if (orderDetail.appliedPromotion?.discountValue) discount = parseFloat(orderDetail.appliedPromotion.discountValue);
    }
    
    // 3. Nếu discount = 0 nhưng có promotion, tính ngược từ totalPrice
    if (discount === 0 && (order.promotionCode || orderDetail?.promotionCode || order.appliedPromotion || orderDetail?.appliedPromotion)) {
      const items = orderDetail?.items || orderDetail?.orderItems || [];
      const subtotal = items.reduce(
        (sum, item) => sum + (parseFloat(item.price || 0) * parseInt(item.quantity || 0)), 0
      );
      const shippingFee = parseFloat(order.shippingFee ?? orderDetail?.shippingFee ?? order.shippingCost ?? 0);
      const platformCommission = parseFloat(
        orderDetail?.platformCommission ??
        order.platformCommission ??
        orderDetail?.serviceFee ?? // backward-compat
        order.serviceFee ??
        order.platformFee ??
        0
      );
      const calculatedTotal = subtotal + shippingFee + platformCommission;
      const orderTotal = parseFloat(
        order.finalTotal ?? 
        orderDetail?.finalTotal ?? 
        order.totalAmount ?? 
        orderDetail?.totalAmount ?? 
        order.totalPrice ?? 
        orderDetail?.totalPrice ?? 
        0
      );
      
      if (orderTotal > 0 && calculatedTotal > orderTotal) {
        discount = calculatedTotal - orderTotal;
      }
    }
    
    // 4. Cache discount nếu có giá trị > 0
    const hasPromotion = !!(order.promotionCode || orderDetail?.promotionCode || order.appliedPromotion || orderDetail?.appliedPromotion);
    
      if (discount > 0) {
        setCachedDiscount(discount);
      }
  }, [order, orderDetail]);

  const handleCancelClick = () => {
    if (onCancel) {
      onCancel(order);
    }
  };

  const handleReviewClick = (item) => {
    setSelectedItem(item);
    setShowReviewModal(true);
  };

  const handleReviewSuccess = () => {
    // Mark item as reviewed
    if (selectedItem) {
      const variantId = selectedItem.productVariantId || selectedItem.id;
      setReviewedItems(prev => ({ ...prev, [variantId]: true }));
    }
    
    setShowReviewModal(false);
    setSelectedItem(null);
    success('Đánh giá của bạn đã được gửi thành công!');
    if (onRefresh) {
      onRefresh();
    }
  };

  const handleCompleteClick = async () => {
    try {
      const result = await completeOrder(order.id);
      if (result.success) {
        success('Đơn hàng đã được xác nhận hoàn tất');
        if (onRefresh) onRefresh();
      } else {
        throw new Error(result.error || 'Không thể xác nhận hoàn tất đơn hàng');
      }
    } catch (error) {
      console.error('Error completing order:', error);
    }
  };

  const handleReturnClick = () => {
    // Điều hướng tới trang tạo yêu cầu trả hàng (có orderId)
    navigate(`/orders/returns/new?orderId=${order.id}`);
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-4 overflow-hidden hover:shadow-md transition-all">
        {/* Simple Header - No Order Number */}
        <div className="bg-white px-5 py-3 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <span>{formatDate(createdAt)}</span>
              {refundStatus === 'COMPLETED' && refundTransactionId && (
                <span className="ml-2 text-xs text-emerald-600">
                  · Đã hoàn tiền ({refundTransactionId})
                </span>
              )}
            </div>

            {/* Status Badge - Simple */}
            <div className={`px-3 py-1.5 rounded-md ${statusBadge.bg} ${statusBadge.text} font-semibold text-xs`}>
              {statusBadge.label}
            </div>
          </div>
        </div>

        {/* Store Header - Clean */}
        <div className="bg-white px-5 py-3 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
              </svg>
              <span className="font-semibold text-gray-900">{displayStoreName}</span>
            </div>
            <ChatButton
              storeId={store?.id || shop?.id}
              storeName={displayStoreName}
              className="text-sm text-blue-600 hover:underline font-medium flex items-center gap-1"
            >
              Chat
            </ChatButton>
          </div>
        </div>

        {/* Products List - Clean */}
        <div className="p-5">
          {!orderDetail ? (
            <div className="flex items-center justify-center py-6">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-sm text-gray-500">Đang tải...</span>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-gray-500">Không có sản phẩm</p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="flex items-start gap-3 pb-3 border-b border-gray-100 last:border-b-0 last:pb-0">
                  {/* Product Image - Smaller */}
                  <div className="w-20 h-20 bg-white rounded-lg overflow-hidden flex-shrink-0 border border-gray-200">
                    {item.image || item.productImage ? (
                      <img
                        src={item.image || item.productImage}
                        alt={item.productName || item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Product Info - Compact */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 text-sm mb-1 line-clamp-2">
                      {item.variantName || item.productName || item.name || 'Sản phẩm'}
                    </h3>
                    {item.variantName && item.productName && item.variantName !== item.productName && (
                      <p className="text-xs text-gray-500 mb-1">
                        {item.productName}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2 text-[11px] text-gray-700 mb-1">
                      {(item.colorName || item.color || item.options?.color) && (
                        <span className="px-2 py-1 rounded bg-gray-100 border text-gray-800">
                          Màu: {item.colorName || item.color || item.options?.color}
                        </span>
                      )}
                      {(item.storage || item.attributes?.storage || item.options?.storage) && (
                        <span className="px-2 py-1 rounded bg-gray-100 border text-gray-800">
                          Bộ nhớ: {item.storage || item.attributes?.storage || item.options?.storage}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-600">
                      <span>x{item.quantity}</span>
                      <span className="text-orange-600 font-medium">{formatCurrency(item.price)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Order Process Timeline */}
        <div className="px-5 py-4 bg-gradient-to-r from-blue-50 to-purple-50 border-t border-gray-200">
          <h4 className="text-xs font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            </svg>
            Tiến trình đơn hàng
          </h4>
          
          <div className="flex items-center gap-2 flex-wrap">
            {/* Step 1: Đặt hàng - Always completed */}
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                </svg>
              </div>
              <span className="text-xs font-medium text-blue-700">Đặt hàng</span>
            </div>
            
            {/* Connector */}
            <div className="w-8 h-0.5 bg-blue-300"></div>
            
            {/* Step 2: Xác nhận */}
            {(displayStatus === 'CONFIRMED' || displayStatus === 'SHIPPING' || displayStatus === 'DELIVERED' || displayStatus === 'RETURNED' || displayStatus === 'REFUNDED' || orderDetail?.confirmedAt) ? (
              <>
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                    </svg>
                  </div>
                  <span className="text-xs font-medium text-green-700">Xác nhận</span>
                </div>
                <div className="w-8 h-0.5 bg-green-300"></div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-1.5 opacity-40">
                  <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                  </div>
                  <span className="text-xs font-medium text-gray-500">Chờ xác nhận</span>
                </div>
                <div className="w-8 h-0.5 bg-gray-200"></div>
              </>
            )}
            
            {/* Step 3: Đang giao */}
            {(displayStatus === 'SHIPPING' || displayStatus === 'DELIVERED' || displayStatus === 'RETURNED' || displayStatus === 'REFUNDED' || orderDetail?.shippedAt) ? (
              <>
                <div className="flex items-center gap-1.5">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                    displayStatus === 'SHIPPING' ? 'bg-purple-500 animate-pulse' : 'bg-purple-500'
                  }`}>
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/>
                    </svg>
                  </div>
                  <span className={`text-xs font-medium ${
                    displayStatus === 'SHIPPING' ? 'text-purple-700' : 'text-purple-700'
                  }`}>
                    {displayStatus === 'SHIPPING' ? 'Đang giao' : 'Đã giao'}
                  </span>
                </div>
                {(displayStatus === 'DELIVERED' || displayStatus === 'RETURNED' || displayStatus === 'REFUNDED' || orderDetail?.deliveredAt) && (
                  <div className="w-8 h-0.5 bg-emerald-300"></div>
                )}
              </>
            ) : displayStatus !== 'CANCELLED' ? (
              <>
                <div className="flex items-center gap-1.5 opacity-40">
                  <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/>
                    </svg>
                  </div>
                  <span className="text-xs font-medium text-gray-500">Chờ giao</span>
                </div>
              </>
            ) : null}
            
            {/* Step 4: Đã giao / Đã trả hàng */}
            {(displayStatus === 'DELIVERED' || displayStatus === 'RETURNED' || displayStatus === 'REFUNDED' || orderDetail?.deliveredAt) && (
              <>
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                    </svg>
                  </div>
                  <span className="text-xs font-medium text-emerald-700">
                    {status === 'RETURNED' ? 'Đã trả hàng' : 'Hoàn tất'}
                  </span>
                </div>

                {/* Step 5 (extra cho đơn đã trả hàng & đã hoàn tiền): Đã hoàn tiền */}
                {status === 'RETURNED' && refundStatus === 'COMPLETED' && (
                  <>
                    <div className="w-8 h-0.5 bg-gray-300"></div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-6 h-6 rounded-full bg-gray-500 flex items-center justify-center flex-shrink-0">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                        </svg>
                      </div>
                      <span className="text-xs font-medium text-gray-700">Đã hoàn tiền</span>
                    </div>
                  </>
                )}
              </>
            )}
            
            {/* Step 5: Đã hủy */}
            {status === 'CANCELLED' && (
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </div>
                <span className="text-xs font-medium text-red-700">Đã hủy</span>
              </div>
            )}
          </div>
        </div>

        {/* Shipping Address */}
        {(shippingAddress || order.address || orderDetail?.shippingAddress || orderDetail?.address) && (
          <div className="px-5 py-4 bg-white border-t border-gray-200">
            <h4 className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
              Địa chỉ giao hàng
            </h4>
            <div className="text-sm text-gray-700">
              {(() => {
                const address = shippingAddress || order.address || orderDetail?.shippingAddress || orderDetail?.address;
                
                // Format địa chỉ đầy đủ
                const addressParts = [];
                
                if (address.homeAddress || address.street || address.houseAddress) {
                  addressParts.push(address.homeAddress || address.street || address.houseAddress);
                }
                if (address.ward) {
                  addressParts.push(address.ward);
                }
                if (address.district) {
                  addressParts.push(address.district);
                }
                if (address.province) {
                  addressParts.push(address.province);
                }
                
                if (addressParts.length > 0) {
                  return <p className="text-gray-600">{addressParts.join(', ')}</p>;
                }
                
                // Fallback: nếu address là string
                if (typeof address === 'string') {
                  return <p className="text-gray-600">{address}</p>;
                }
                
                return null;
              })()}
            </div>
          </div>
        )}

        {/* Footer - With Price Breakdown */}
        <div className="bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 px-5 py-4 border-t border-gray-200">
          <div className="flex items-start justify-between gap-4">
            {/* Left: Payment Method */}
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
              </svg>
              <span className="font-medium">Phương thức thanh toán: {getPaymentMethodLabel(paymentMethod)}</span>
            </div>

            {/* Right: Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              {hasActiveReturnRequest && status !== 'RETURNED' && displayStatus !== 'REFUNDED' && refundStatus !== 'COMPLETED' ? (
                <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-sm font-medium">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 8v4l2 2m6-4a8 8 0 11-16 0 8 8 0 0116 0z"
                    />
                  </svg>
                  <span>Đã gửi lệnh trả hàng, chờ cửa hàng xử lý</span>
                </div>
              ) : (
                <>
                  {/* Complete Button */}
                  {canComplete && (
                    <button
                      onClick={handleCompleteClick}
                      className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-sm font-semibold rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all shadow-md hover:shadow-lg transform hover:scale-105"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      Hoàn tất
                    </button>
                  )}

                  {/* Return Button */}
                  {canReturn && (
                    <button
                      onClick={handleReturnClick}
                      className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white text-sm font-semibold rounded-lg hover:from-orange-600 hover:to-red-600 transition-all shadow-md hover:shadow-lg transform hover:scale-105"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4-4 4m0 6H4m0 0l4 4m-4-4 4-4" />
                      </svg>
                      Trả hàng
                    </button>
                  )}

                  {/* Review Button - Check if all items are reviewed */}
                  {canReview &&
                    (() => {
                      const firstItem = items[0];
                      const variantId = firstItem?.productVariantId || firstItem?.id;
                      const hasReviewed = reviewedItems[variantId];

                      if (hasReviewed) {
                        return (
                          <span className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 text-gray-500 text-sm font-medium rounded-lg cursor-not-allowed">
                            <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clipRule="evenodd"
                              />
                            </svg>
                            Đã đánh giá
                          </span>
                        );
                      }

                      return (
                        <button
                          onClick={() => handleReviewClick(firstItem)}
                          className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white text-sm font-semibold rounded-lg hover:from-orange-600 hover:to-pink-600 transition-all shadow-md hover:shadow-lg transform hover:scale-105"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                            />
                          </svg>
                          Đánh giá
                        </button>
                      );
                    })()}

                  {/* Cancel Button */}
                  {canCancel && (
                    <button
                      onClick={handleCancelClick}
                      className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white text-sm font-semibold rounded-lg hover:from-red-600 hover:to-pink-600 transition-all shadow-md hover:shadow-lg transform hover:scale-105"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Hủy đơn
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Price Breakdown */}
          <div className="bg-white rounded-xl p-4 mt-3 shadow-sm border border-gray-200">
            {useMemo(() => {
              const subtotal = items.reduce((sum, item) => 
                sum + (parseFloat(item.price || 0) * parseInt(item.quantity || 0)), 0
              );
              const shippingFee = parseFloat(order.shippingFee ?? orderDetail?.shippingFee ?? order.shippingCost ?? 0);
              
              // Tính discount giống logic ở trên
              let displayDiscount = 0;
              const discountFields = [
                'discount',
                'discountAmount',
                'promotionDiscount',
                'appliedDiscount',
                'promotionAmount',
                'promotionValue',
                'discountValue',
                'storeDiscountAmount',
                'platformDiscountAmount',
                'totalDiscountAmount',
              ];
              
              for (const field of discountFields) {
                if (order[field] !== undefined && order[field] !== null) {
                  displayDiscount = parseFloat(order[field]);
                  if (displayDiscount > 0) break;
                }
                if (orderDetail && orderDetail[field] !== undefined && orderDetail[field] !== null) {
                  displayDiscount = parseFloat(orderDetail[field]);
                  if (displayDiscount > 0) break;
                }
              }
              
              if (displayDiscount === 0) {
                const promo = orderDetail?.appliedPromotion || order.appliedPromotion;
                if (promo) {
                  displayDiscount = parseFloat(promo.discountAmount || promo.discountValue || promo.value || 0);
                }
              }
              
              if (displayDiscount === 0 && (order.appliedPromotion || orderDetail?.appliedPromotion || order.promotionCode)) {
                const actualTotal = parseFloat(
                  order.finalTotal ?? 
                  orderDetail?.finalTotal ?? 
                  order.totalAmount ?? 
                  orderDetail?.totalAmount ?? 
                  order.totalPrice ?? 
                  orderDetail?.totalPrice ?? 
                  0
                );
                const expectedTotal = subtotal + shippingFee;
                if (actualTotal > 0 && expectedTotal > actualTotal) {
                  displayDiscount = expectedTotal - actualTotal;
                }
              }
              
              const total = Math.max(0, subtotal + shippingFee - displayDiscount);

              return (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tạm tính:</span>
                    <span className="font-medium text-gray-900">{formatCurrency(subtotal)}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Phí vận chuyển:</span>
                    <span className="font-medium text-gray-900">{formatCurrency(shippingFee)}</span>
                  </div>
                  
                  {/* Hiển thị giảm giá/khuyến mãi nếu có */}
                  {displayDiscount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 flex items-center gap-1">
                        <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/>
                        </svg>
                        Giảm giá:
                      </span>
                      <span className="font-medium text-green-600">
                        -{formatCurrency(displayDiscount)}
                      </span>
                    </div>
                  )}
                  
                  {/* Hiển thị mã khuyến mãi nếu có */}
                  {(() => {
                    const promotionCode = getPromotionCode(order, orderDetail);
                    
                    // Hiển thị nếu có mã hoặc có discount
                    if (promotionCode || displayDiscount > 0) {
                      return (
                        <div className="flex justify-between items-center text-sm bg-blue-50 border border-blue-200 rounded-lg p-2 mt-2">
                          <span className="text-gray-700 flex items-center gap-1.5">
                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"/>
                            </svg>
                            <span className="font-medium">Mã khuyến mãi đã áp dụng:</span>
                          </span>
                          <span className="font-bold text-blue-700 bg-white px-2 py-1 rounded border border-blue-300">
                            {promotionCode || 'Đã áp dụng'}
                          </span>
                        </div>
                      );
                    }
                    return null;
                  })()}
                  
                  <div className="border-t-2 border-dashed border-gray-300 pt-2 mt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-base font-bold text-gray-900">Tổng tiền:</span>
                      <span className="text-2xl font-black bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent">
                        {formatCurrency(total)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            }, [items, order, orderDetail])}
          </div>
        </div>
      </div>

      {/* Review Modal */}
      {showReviewModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-slideUp">
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 flex items-center justify-between">
              <div className="text-white">
                <h3 className="text-xl font-black">✍️ Đánh giá sản phẩm</h3>
                <p className="text-sm text-blue-100 mt-1">
                  {selectedItem.variantName || selectedItem.productName || selectedItem.name}
                </p>
              </div>
              <button
                onClick={() => setShowReviewModal(false)}
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              <ReviewForm
                productVariantId={selectedItem.productVariantId || selectedItem.id}
                orderId={order.id}
                onSuccess={handleReviewSuccess}
                onCancel={() => setShowReviewModal(false)}
              />
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </>
  );
};

OrderCard.displayName = 'OrderCard';

export default memo(OrderCard);
