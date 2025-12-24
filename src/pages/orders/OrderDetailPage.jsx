import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { getOrderCode } from '../../utils/displayCodeUtils';
import MainLayout from '../../layouts/MainLayout';
import ReviewForm from '../../components/reviews/ReviewForm';
import { getOrderById, cancelOrder, canCancelOrder, canReviewOrder, getOrderStatusBadge, getPaymentMethodLabel } from '../../services/buyer/orderService';
import { getReturnRequestDetail } from '../../services/buyer/returnService';
import { getMyDisputes } from '../../services/buyer/disputeService';
import { getAdminOrderById } from '../../services/admin/adminOrderService';
import { checkExistingReview } from '../../services/buyer/reviewService';
import { getPromotionById } from '../../services/admin/adminPromotionService';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { confirmCancelOrder } from '../../utils/sweetalert';
import { createMoMoPayment, checkMoMoPaymentStatus } from '../../services/buyer/momoPaymentService';
import SEO from '../../components/seo/SEO';

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

// Lấy ID từ DBRef hoặc object populate
const getIdFromRef = (ref) => {
  if (!ref) return null;
  if (typeof ref === 'string' || typeof ref === 'number') return String(ref);
  return String(ref.$id || ref._id || ref.id || ref.$oid || ref);
};

/**
 * OrderDetailPage Component - SHOPEE/MALL STYLE
 * Clean, simple, professional
 */
const OrderDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  const { user } = useAuth();
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [reviewedItems, setReviewedItems] = useState({}); // Track which items have been reviewed
  const [existingReviews, setExistingReviews] = useState({}); // Store existing reviews for editing
  const [fetchedPromotions, setFetchedPromotions] = useState({}); // Cache fetched promotions from DBRef

  // ✅ Check if user is admin (check nhiều cách)
  const isAdmin = 
    user?.role === 'ADMIN' || 
    user?.roles?.includes('ADMIN') ||
    user?.authorities?.some(auth => auth.authority === 'ADMIN') ||
    window.location.pathname.includes('/admin-dashboard');

  // Fetch order details - thử admin API trước nếu có thể là admin
  const { data: orderData, error, mutate } = useSWR(
    id ? ['order-detail', id, isAdmin] : null,
    async () => {
      // Nếu là admin, chỉ dùng admin API (không fallback về buyer API vì sẽ fail)
      if (isAdmin) {
        const adminResult = await getAdminOrderById(id);
        return adminResult; // Trả về kết quả dù success hay fail
      }
      // Nếu không phải admin, dùng buyer API
      return await getOrderById(id);
    },
    {
      revalidateOnFocus: false,
    }
  );

  const order = orderData?.success ? orderData.data : null;
  
  // ✅ DEBUG: Log order ngay khi có data
  if (order) {
    console.log('🔍 [OrderDetailPage] ===== ORDER LOADED =====');
    console.log('🔍 [OrderDetailPage] Order ID:', order.id || order._id);
    console.log('🔍 [OrderDetailPage] platformDiscountAmount:', order.platformDiscountAmount);
    console.log('🔍 [OrderDetailPage] storeDiscountAmount:', order.storeDiscountAmount);
    console.log('🔍 [OrderDetailPage] promotions:', order.promotions);
    console.log('🔍 [OrderDetailPage] =========================');
  }

  // Nếu order có returnRequestId, load thêm chi tiết ReturnRequest (để lấy partialRefundToBuyer/Store nếu có)
  const { data: rrData } = useSWR(
    order?.returnRequestId ? ['buyer-return-request-detail', order.returnRequestId] : null,
    () => getReturnRequestDetail(order.returnRequestId),
    { revalidateOnFocus: false }
  );

  const returnRequest =
    order?.returnRequest || (rrData?.success ? rrData.data : null) || null;

  // Helper xác định trạng thái trả hàng chính để hiển thị trên timeline
  const getReturnMainStatus = (rr) => {
    if (!rr) return null;
    // Ưu tiên các trạng thái đã hoàn tất để khách dễ hiểu
    if (rr.status === 'REFUNDED') return 'REFUNDED';
    if (rr.status === 'RETURNED') return 'RETURNED';
    if (rr.status === 'RETURNING') return 'RETURNING';
    if (rr.status === 'READY_TO_RETURN') return 'READY_TO_RETURN';
    if (rr.status === 'APPROVED') return 'APPROVED';
    if (rr.status === 'REJECTED') return 'REJECTED';
    return rr.status || null;
  };

  // Label tiếng Việt cho trạng thái trả hàng (dùng cho timeline)
  const getReturnStatusLabel = (status) => {
    const labels = {
      PENDING: 'Chờ xử lý',
      APPROVED: 'Đã chấp nhận trả hàng',
      READY_TO_RETURN: 'Sẵn sàng trả hàng',
      RETURNING: 'Đang trả hàng',
      RETURNED: 'Đã trả hàng',
      REFUNDED: 'Đã hoàn tiền',
      REJECTED: 'Đã từ chối yêu cầu trả hàng',
      RETURN_DISPUTED: 'Tranh chấp chất lượng',
    };
    return labels[status] || status || 'Đang xử lý';
  };

  const returnMainStatus = getReturnMainStatus(returnRequest);

  // Khiếu nại gắn với đơn hàng này (buyer)
  const { data: disputesData } = useSWR(
    order ? ['buyer-order-disputes', order.id] : null,
    () => getMyDisputes({ page: 0, size: 200 }),
    { revalidateOnFocus: false }
  );

  const buyerDisputes = disputesData?.success
    ? disputesData.data?.content || disputesData.data || []
    : [];

  const orderDisputes = buyerDisputes.filter((d) => {
    const disputeOrderId = getIdFromRef(d.order || d.orderId || d.orderRef);
    return disputeOrderId && String(disputeOrderId) === String(order.id || order._id);
  });

  // ✅ Fetch promotion details nếu promotions là DBRef
  useEffect(() => {
    if (!order || !order.promotions || !Array.isArray(order.promotions)) return;
    
    const fetchPromotionDetails = async () => {
      const newFetchedPromotions = {};
      
      for (const promo of order.promotions) {
        // Nếu là DBRef chưa populate (có $id hoặc _id nhưng không có code)
        const isDBRef = (promo.$id || promo._id || promo.id) && !promo.code && !promo.issuer;
        
        if (isDBRef) {
          const promoId = promo.$id || promo._id || promo.id;
          
          // Nếu đã fetch rồi trong cache, bỏ qua
          if (fetchedPromotions[promoId]) {
            continue;
          }
          
          try {
            console.log('🔄 [OrderDetailPage] Fetching promotion details for ID:', promoId);
            const result = await getPromotionById(promoId);
            if (result.success && result.data) {
              newFetchedPromotions[promoId] = result.data;
              console.log('✅ [OrderDetailPage] Fetched promotion:', result.data.code, 'issuer:', result.data.issuer);
            }
          } catch (error) {
            console.error('❌ [OrderDetailPage] Error fetching promotion:', error);
          }
        }
      }
      
      if (Object.keys(newFetchedPromotions).length > 0) {
        setFetchedPromotions(prev => ({ ...prev, ...newFetchedPromotions }));
      }
    };
    
    fetchPromotionDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order?.promotions]);

  // Check which items have been reviewed
  useEffect(() => {
    const checkReviews = async () => {
      if (!order || !canReviewOrder(order.status)) return;
      
      const items = order.items || order.orderItems || [];
      const reviewStatus = {};
      const reviews = {};
      
      for (const item of items) {
        const variantId = item.productVariantId || item.id;
        const result = await checkExistingReview(variantId, order.id);
        
        if (result.success && result.hasReviewed) {
          reviewStatus[variantId] = true;
          reviews[variantId] = result.existingReview;
        }
      }
      
      setReviewedItems(reviewStatus);
      setExistingReviews(reviews);
    };
    
    checkReviews();
  }, [order]);

  // Handle cancel
  const handleCancel = async () => {
    const confirmed = await confirmCancelOrder(getOrderCode(order.id));
    if (!confirmed) return;

    const result = await cancelOrder(order.id);
    if (result.success) {
      // ✅ Nếu đơn thanh toán online (MoMo / VNPay), hiển thị thêm thông tin hoàn tiền
      const payMethod = (order.paymentMethod || paymentMethod || '').toUpperCase?.() || '';
      if (payMethod === 'MOMO') {
        success(
          (result.message || 'Đơn hàng đã được hủy') +
            '. Nếu bạn đã thanh toán trước đó qua MoMo, hệ thống sẽ tự động hoàn lại tiền về ví MoMo của bạn.'
        );
      } else if (payMethod === 'VNPAY') {
        success(
          (result.message || 'Đơn hàng đã được hủy') +
            '. Nếu bạn đã thanh toán trước đó qua VNPay, hệ thống sẽ tự động hoàn lại tiền về tài khoản ngân hàng của bạn.'
        );
      } else {
        success(result.message || 'Đơn hàng đã được hủy');
      }
      mutate();
    } else {
      showError(result.error);
    }
  };

  // Handle MoMo payment
  const handlePayMoMo = async () => {
    if (!order) return;

    const orderId = order.id || order._id;
    const payMethod = (order.paymentMethod || '').toUpperCase();
    const paymentStatus = order.paymentStatus || '';

    // ✅ Chỉ cho phép thanh toán nếu paymentMethod = MOMO và paymentStatus = UNPAID
    if (payMethod !== 'MOMO') {
      showError('Đơn hàng này không sử dụng phương thức thanh toán MoMo.');
      return;
    }

    if (paymentStatus === 'PAID') {
      success('Đơn hàng này đã được thanh toán rồi.');
      mutate(); // Refresh để cập nhật status
      return;
    }

    // ✅ Tính số tiền cần thanh toán
    const amount = parseFloat(
      order.finalTotal ||
      order.totalAmount ||
      order.totalPrice ||
      0
    );

    if (!amount || Number.isNaN(amount) || amount <= 0) {
      showError('Không xác định được số tiền thanh toán. Vui lòng liên hệ hỗ trợ.');
      return;
    }

    try {
      const orderInfo = `Thanh toán đơn hàng ${getOrderCode(orderId)}`;
      const momoResult = await createMoMoPayment(amount, orderId, orderInfo, [orderId]);

      if (momoResult.success && momoResult.data?.payUrl) {
        console.log('✅ [OrderDetail] MoMo payment URL created:', momoResult.data.payUrl);
        console.log('✅ [OrderDetail] MoMo order ID:', momoResult.data.orderId);
        console.log('✅ [OrderDetail] MoMo trans ID:', momoResult.data.transId);

        const momoWindow = window.open(momoResult.data.payUrl, '_blank');

        if (momoWindow) {
          success('Đang mở trang thanh toán MoMo. Vui lòng hoàn tất thanh toán trên tab mới.');
          
          // ✅ Sau khi thanh toán xong, tự động refresh order status sau 3 giây
          setTimeout(() => {
            mutate();
            success('Đã kiểm tra lại trạng thái đơn hàng. Nếu đã thanh toán thành công, trạng thái sẽ được cập nhật.');
          }, 3000);
        } else {
          showError('Trình duyệt chặn popup! Vui lòng cho phép popup và thử lại.');
        }
      } else {
        showError(momoResult.error || 'Không thể tạo link thanh toán MoMo. Vui lòng thử lại.');
        console.error('❌ [OrderDetail] Failed to create MoMo payment:', momoResult);
      }
    } catch (err) {
      console.error('❌ [OrderDetail] Error creating MoMo payment:', err);
      showError('Có lỗi xảy ra khi tạo thanh toán MoMo. Vui lòng thử lại.');
    }
  };

  // ✅ Kiểm tra lại payment status cho đơn MoMo
  const handleCheckMoMoPayment = async () => {
    if (!order) return;

    const orderId = order.id || order._id;
    const payMethod = (order.paymentMethod || '').toUpperCase();

    if (payMethod !== 'MOMO') {
      showError('Đơn hàng này không sử dụng phương thức thanh toán MoMo.');
      return;
    }

    // ⚠️ Backend cần lưu momoOrderId vào order khi tạo payment
    // Hoặc backend cần có API để check payment status bằng orderId của hệ thống
    const momoOrderId = order.momoOrderId || order.transactionId || orderId;

    try {
      warning('Đang kiểm tra trạng thái thanh toán MoMo...');
      
      const statusResult = await checkMoMoPaymentStatus(momoOrderId);
      
      if (statusResult.success && statusResult.data) {
        const resultCode = statusResult.data.resultCode;
        const message = statusResult.data.message || '';
        
        console.log('📊 [OrderDetail] MoMo payment status:', {
          resultCode,
          message,
          data: statusResult.data,
        });

        if (resultCode === 0 || resultCode === '0') {
          // ✅ Thanh toán thành công
          success('Thanh toán MoMo đã thành công! Đang cập nhật trạng thái đơn hàng...');
          
          // ✅ Refresh order để lấy status mới từ backend
          setTimeout(() => {
            mutate();
            success('Đã cập nhật trạng thái đơn hàng. Nếu backend đã xử lý callback, trạng thái sẽ là PAID.');
          }, 2000);
        } else {
          // ⚠️ Chưa thanh toán hoặc lỗi
          warning(`Trạng thái thanh toán: ${message || 'Chưa xác nhận thành công'}. Vui lòng thử lại sau hoặc liên hệ hỗ trợ.`);
        }
      } else {
        showError(statusResult.error || 'Không thể kiểm tra trạng thái thanh toán. Vui lòng thử lại.');
        console.error('❌ [OrderDetail] Failed to check MoMo payment status:', statusResult);
      }
    } catch (err) {
      console.error('❌ [OrderDetail] Error checking MoMo payment status:', err);
      showError('Có lỗi xảy ra khi kiểm tra trạng thái thanh toán. Vui lòng thử lại.');
    }
  };

  // Handle review
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
    mutate();
  };

  // Loading state
  if (!orderData && !error) {
    return (
      <MainLayout>
        <SEO 
          title="Chi tiết đơn hàng | E-Comm"
          description="Xem chi tiết đơn hàng, theo dõi trạng thái giao hàng và quản lý đơn hàng của bạn."
          keywords="chi tiết đơn hàng, theo dõi đơn hàng, trạng thái đơn hàng"
          url={`https://pbl-6-eight.vercel.app/orders/${id}`}
        />
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Error state
  if (error || !order) {
    // Nếu là admin và không tìm thấy, có thể do API chưa có hoặc order không tồn tại
    const isAdminView = isAdmin;
    return (
      <MainLayout>
        <SEO 
          title="Không tìm thấy đơn hàng | E-Comm"
          description="Đơn hàng không tồn tại hoặc đã bị xóa."
          keywords="đơn hàng, lỗi đơn hàng"
          url={`https://pbl-6-eight.vercel.app/orders/${id}`}
        />
        <div className="max-w-5xl mx-auto px-4 py-16 text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Không tìm thấy đơn hàng</h2>
          <p className="text-gray-600 mb-6">
            {isAdminView 
              ? 'Đơn hàng này không tồn tại hoặc API admin chưa được hỗ trợ. Vui lòng liên hệ backend để thêm API /api/v1/admin/orders/{id}'
              : 'Đơn hàng này không tồn tại hoặc đã bị xóa.'}
          </p>
          <button
            onClick={() => navigate(isAdminView ? '/admin-dashboard/refunds' : '/orders')}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            ← Quay lại
          </button>
        </div>
      </MainLayout>
    );
  }

  const {
    orderNumber,
    status,
    totalAmount: rawTotalAmount,
    totalPrice: rawTotalPrice,
    finalTotal: rawFinalTotal,
    createdAt,
    items: itemsFromOrder,
    orderItems: orderItemsFromOrder,
    shippingAddress,
    paymentMethod,
    storeName,
    store,
    shop,
    storeId,
  } = order;
  
  // ✅ Parse các giá trị total nếu là string
  const totalAmount = typeof rawTotalAmount === 'string' ? parseFloat(rawTotalAmount) : (rawTotalAmount ?? 0);
  const totalPrice = typeof rawTotalPrice === 'string' ? parseFloat(rawTotalPrice) : (rawTotalPrice ?? 0);
  const finalTotal = typeof rawFinalTotal === 'string' ? parseFloat(rawFinalTotal) : (rawFinalTotal ?? 0);
  
  // Handle different store name formats from backend
  const getStoreName = () => {
    if (storeName) return storeName;
    if (store?.storeName) return store.storeName;
    if (store?.name) return store.name;
    if (shop?.name) return shop.name;
    if (shop?.storeName) return shop.storeName;
    return 'Cửa hàng';
  };

  const displayStoreName = getStoreName();
  
  // Handle both 'items' and 'orderItems' field names
  const items = itemsFromOrder || orderItemsFromOrder || [];

  // Totals breakdown
  const subtotal = items.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 0)), 0);
  const shippingFeeValue = order.shippingFee ?? order.shippingCost ?? 0;
  
  // 💰 Hoa hồng nền tảng - chỉ để hiển thị, không cộng vào tổng của buyer
  const platformCommission = order.platformCommission ?? order.serviceFee ?? 0;
  
  // ✅ Helper function để extract promotion code từ nhiều nguồn
  const getPromotionCode = (order) => {
    // 1. Kiểm tra promotions array (DBRef hoặc populated)
    if (order.promotions && Array.isArray(order.promotions) && order.promotions.length > 0) {
      const firstPromo = order.promotions[0];
      // Nếu là DBRef đã populate, có code
      if (firstPromo.code) return firstPromo.code;
      // Nếu là DBRef chưa populate, có $id hoặc id
      // Tạm thời check các nguồn khác
    }
    
    // 2. Kiểm tra các field promotion khác
    return (
      order.promotion?.code || 
      order.promotionCode || 
      order.appliedPromotion?.code ||
      order.platformPromotions?.orderPromotionCode ||
      order.platformPromotions?.shippingPromotionCode ||
      null
    );
  };

  // ✅ Tính discount - ƯU TIÊN dùng discount từ backend, KHÔNG tính ngược (tránh sai số)
  let discountValue = 0;
  
  // 1. Ưu tiên: totalDiscountAmount > storeDiscountAmount + platformDiscountAmount
  if (order.totalDiscountAmount !== undefined && order.totalDiscountAmount !== null) {
    discountValue = parseFloat(order.totalDiscountAmount);
  } else {
    // Tính tổng từ storeDiscountAmount + platformDiscountAmount
    const storeDiscount = parseFloat(order.storeDiscountAmount || 0);
    const platformDiscount = parseFloat(order.platformDiscountAmount || 0);
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
    }
  }
  
  // 3. Nếu vẫn = 0, check trong appliedPromotion hoặc promotion object
  if (discountValue === 0) {
    const promo = order.promotion || order.appliedPromotion;
    if (promo) {
      discountValue = parseFloat(promo.discountAmount || promo.discountValue || promo.value || 0);
    }
  }
  
  // 4. Nếu vẫn = 0 và có dấu hiệu có promotion, tính ngược từ totalAmount
  if (discountValue === 0 && (order.promotion || order.appliedPromotion || order.promotionCode || order.promotions)) {
    const expectedTotal = subtotal + shippingFeeValue;
    // Parse totalPrice nếu là string
    const parsedTotalPrice = typeof order.totalPrice === 'string' ? parseFloat(order.totalPrice) : order.totalPrice;
    const parsedTotalAmount = typeof order.totalAmount === 'string' ? parseFloat(order.totalAmount) : order.totalAmount;
    const parsedFinalTotal = typeof finalTotal === 'string' ? parseFloat(finalTotal) : finalTotal;
    const actualTotal = parsedFinalTotal ?? parsedTotalAmount ?? parsedTotalPrice ?? 0;
    
    if (actualTotal > 0 && expectedTotal > actualTotal) {
      discountValue = expectedTotal - actualTotal;
    }
  }
  
  const parseTotalPrice = () => {
    if (finalTotal && !isNaN(finalTotal) && finalTotal > 0) return finalTotal;
    if (totalAmount && !isNaN(totalAmount) && totalAmount > 0) return totalAmount;
    if (totalPrice) {
      const parsed = parseFloat(totalPrice);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
    return Math.max(0, subtotal + shippingFeeValue - discountValue);
  };

  const calculatedTotal = parseTotalPrice();
  const statusBadge = getOrderStatusBadge(status);
  const canCancel = canCancelOrder(status);
  const canReview = canReviewOrder(status);
  
  // ✅ Debug log order status
  console.log('📦 [OrderDetailPage] Order status:', status);
  console.log('📦 [OrderDetailPage] Can review?', canReview);
  console.log('📦 [OrderDetailPage] Full order:', order);

  // Helper: build display name with color (productName - ColorName)
  const buildItemDisplayName = (item) => {
    const baseName = item.productName || item.name || '';
    const colorName =
      item.colorName ||
      item.color ||
      item.variantColor ||
      item.options?.color ||
      null;
    if (baseName && colorName) {
      return `${baseName} - ${colorName}`;
    }
    return baseName || colorName || '';
  };

  // Helper: get image for colored product
  const getItemImage = (item) => {
    return (
      item.colorImage ||
      item.imageUrl ||
      item.productImage ||
      item.image ||
      null
    );
  };

  const handlePrintInvoice = () => {
    if (!order) return;

    const orderCode = getOrderCode(order.id);
    const addrLines = shippingAddress
      ? [
          shippingAddress.recipientName,
          shippingAddress.phone,
          [shippingAddress.street, shippingAddress.ward, shippingAddress.district, shippingAddress.province]
            .filter(Boolean)
            .join(', '),
        ].filter(Boolean)
      : [];

    const itemRows = items
      .map(
        (item, idx) => `
          <tr>
            <td>${idx + 1}</td>
            <td>${buildItemDisplayName(item)}${item.variantName ? `<div style="color:#555;font-size:12px;">${item.variantName}</div>` : ''}</td>
            <td style="text-align:center;">${item.quantity}</td>
            <td style="text-align:right;">${formatCurrency(item.price || 0)}</td>
            <td style="text-align:right;">${formatCurrency((item.price || 0) * item.quantity)}</td>
          </tr>
        `
      )
      .join('');

    const win = window.open('', '_blank', 'width=900,height=1200');
    const html = `
      <html>
        <head>
          <title>Hóa đơn ${orderCode}</title>
          <style>
            body { font-family: 'Inter', system-ui, -apple-system, sans-serif; padding: 24px; color: #111; }
            h1 { margin: 0 0 4px; }
            h2 { margin: 0 0 8px; font-size: 16px; }
            .section { margin-bottom: 16px; }
            table { width: 100%; border-collapse: collapse; margin-top: 8px; }
            th, td { border: 1px solid #e5e7eb; padding: 10px; font-size: 14px; }
            th { background: #f8fafc; text-align: left; }
            .totals { margin-top: 12px; width: 100%; }
            .totals td { padding: 6px 0; }
            .text-right { text-align: right; }
            .muted { color: #6b7280; }
          </style>
        </head>
        <body>
          <div style="display:flex; justify-content:space-between; align-items:flex-start;">
            <div>
              <h1>Hóa đơn</h1>
              <div class="muted">Mã đơn: ${orderCode}</div>
              <div class="muted">Ngày: ${formatDate(createdAt)}</div>
            </div>
            <div style="text-align:right;">
              <div style="font-weight:600;">${displayStoreName}</div>
              ${store?.email ? `<div class="muted">${store.email}</div>` : ''}
              ${store?.phone ? `<div class="muted">${store.phone}</div>` : ''}
            </div>
          </div>

          <div class="section">
            <h2>Thông tin giao hàng</h2>
            <div>${addrLines.join('<br/>') || 'Không có'}</div>
          </div>

          <div class="section">
            <h2>Sản phẩm</h2>
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Tên sản phẩm</th>
                  <th style="text-align:center;">SL</th>
                  <th style="text-align:right;">Đơn giá</th>
                  <th style="text-align:right;">Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                ${itemRows}
              </tbody>
            </table>
          </div>

          <table class="totals">
            <tr>
              <td class="text-right muted">Tạm tính:</td>
              <td class="text-right">${formatCurrency(subtotal)}</td>
            </tr>
            <tr>
              <td class="text-right muted">Phí vận chuyển:</td>
              <td class="text-right">${formatCurrency(shippingFeeValue)}</td>
            </tr>
            <tr>
              <td class="text-right muted">Hoa hồng nền tảng:</td>
              <td class="text-right">${formatCurrency(platformCommission)}</td>
            </tr>
            ${discountValue ? `
            <tr>
              <td class="text-right muted">Mã giảm giá:</td>
              <td class="text-right">${order.promotion?.code || order.promotionCode || order.appliedPromotion?.code || order.appliedPromotion?.name || order.promotionName || 'Giảm giá từ chương trình'}</td>
            </tr>
            <tr>
              <td class="text-right muted">Số tiền giảm:</td>
              <td class="text-right">-${formatCurrency(discountValue)}</td>
            </tr>
            ` : ''}
            <tr>
              <td class="text-right muted">Tổng cộng:</td>
              <td class="text-right">${formatCurrency(calculatedTotal)}</td>
            </tr>
            <tr>
              <td class="text-right muted">Phương thức thanh toán:</td>
              <td class="text-right">${getPaymentMethodLabel(paymentMethod)}</td>
            </tr>
          </table>

          <div style="margin-top:24px; font-size:12px;" class="muted">
            Cảm ơn bạn đã mua sắm!
          </div>
          <script>
            window.onload = () => {
              window.print();
              setTimeout(() => window.close(), 300);
            };
          </script>
        </body>
      </html>
    `;

    win.document.open();
    win.document.write(html);
    win.document.close();
  };

  return (
    <MainLayout>
      <SEO 
        title={`Đơn hàng ${order ? getOrderCode(order.id) : ''} | E-Comm`}
        description={`Chi tiết đơn hàng ${order ? getOrderCode(order.id) : ''}. Xem trạng thái, thông tin giao hàng và sản phẩm trong đơn hàng.`}
        keywords={`đơn hàng ${order ? getOrderCode(order.id) : ''}, chi tiết đơn hàng, theo dõi đơn hàng`}
        url={`https://pbl-6-eight.vercel.app/orders/${id}`}
      />
      <div className="bg-gray-50 min-h-screen py-6">
        <div className="max-w-5xl mx-auto px-4">
          {/* Breadcrumb */}
          <div className="mb-4">
            <button
              onClick={() => navigate('/orders')}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/>
              </svg>
              Quay lại
            </button>
          </div>

          {/* Header */}
          <div className="bg-white border border-gray-200 rounded-lg p-5 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">
                  Đơn hàng #{orderNumber || id.slice(-8)}
                </h1>
                <p className="text-sm text-gray-600">
                  Ngày đặt: {formatDate(createdAt)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handlePrintInvoice}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md border border-gray-200 shadow-sm transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H9a2 2 0 00-2 2v2m10 0h2a2 2 0 012 2v5a2 2 0 01-2 2H7a2 2 0 01-2-2v-5a2 2 0 012-2h2m8 0H9"/>
                  </svg>
                  In hóa đơn
                </button>
                <span className={`px-4 py-2 rounded-md text-sm font-semibold ${statusBadge.bg} ${statusBadge.text}`}>
                  {statusBadge.icon} {statusBadge.label}
                </span>
              </div>
            </div>
          </div>

          {/* Khiếu nại liên quan đơn hàng */}
          {orderDisputes.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="mt-1">
                  <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-amber-800">Đơn hàng đang có khiếu nại</p>
                  <div className="mt-2 space-y-2">
                    {orderDisputes.map((d) => {
                      const disputeId = d.id || d._id;
                      return (
                        <div key={disputeId} className="bg-white border border-amber-100 rounded-md p-3 shadow-xs">
                          <div className="flex flex-wrap items-center gap-2 text-sm">
                            <span className="px-2 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                              {d.disputeType || 'Khiếu nại'}
                            </span>
                            <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                              Trạng thái: {d.status || 'N/A'}
                            </span>
                            {d.finalDecision && (
                              <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                                Quyết định: {d.finalDecision}
                              </span>
                            )}
                            {d.winner && (
                              <span className="px-2 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
                                Bên thắng: {d.winner}
                              </span>
                            )}
                          </div>
                          {d.decisionReason && (
                            <p className="text-sm text-gray-700 mt-1">
                              Lý do: {d.decisionReason}
                            </p>
                          )}
                          <div className="flex items-center justify-between mt-2">
                            <p className="text-xs text-gray-500">
                              Cập nhật: {d.updatedAt ? formatDate(d.updatedAt) : 'N/A'}
                            </p>
                            {disputeId && (
                              <button
                                onClick={() => navigate(`/orders/disputes/${disputeId}`)}
                                className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                              >
                                Xem chi tiết
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Products - MALL STYLE */}
          <div className="bg-white border border-gray-200 rounded-lg mb-4">
            {/* Store Header */}
            <div className="border-b border-gray-200 px-5 py-3 flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
                  </svg>
                </div>
                <span className="font-bold text-gray-900">{displayStoreName}</span>
              </div>
              <button className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                </svg>
                Chat
              </button>
              <button className="text-sm text-gray-600 hover:text-gray-900 font-medium">
                Xem Shop
              </button>
              <div className="ml-auto flex items-center gap-2 text-sm text-green-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                </svg>
                Giao hàng thành công
              </div>
            </div>

            {/* Products List */}
            <div className="divide-y divide-gray-100">
              {items.map((item, index) => (
                <div key={index} className="p-5">
                  <div className="flex items-start gap-4">
                    {/* Image */}
                    <div className="w-20 h-20 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                      {getItemImage(item) ? (
                        <img
                          src={getItemImage(item)}
                          alt={buildItemDisplayName(item)}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-900 mb-2">
                        {buildItemDisplayName(item)}
                      </h3>
                      {item.variantName && (
                        <p className="text-xs text-gray-600 mb-1">
                          Phân loại hàng: {item.variantName}
                        </p>
                      )}
                      <p className="text-xs text-gray-600">x{item.quantity}</p>
                    </div>

                    {/* Price */}
                    <div className="text-right">
                      <p className="text-lg font-semibold text-gray-900">
                        {formatCurrency(item.price * item.quantity)}
                      </p>
                    </div>
                  </div>

                  {/* Review Section for DELIVERED orders */}
                  {canReview && (
                    <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                      {reviewedItems[item.productVariantId || item.id] ? (
                        <>
                          <div className="text-sm text-green-600">
                            <p className="font-medium flex items-center gap-1">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              Đã đánh giá
                            </p>
                            <p className="text-xs text-gray-500">Bạn đã đánh giá sản phẩm này</p>
                          </div>
                          <span className="px-4 py-2 bg-gray-100 text-gray-500 rounded-md font-medium cursor-not-allowed">
                            ✅ Đã đánh giá
                          </span>
                        </>
                      ) : (
                        <>
                          <div className="text-sm text-blue-600">
                            <p className="font-medium">Đánh giá sản phẩm</p>
                            <p className="text-xs">Chia sẻ trải nghiệm của bạn về sản phẩm này</p>
                          </div>
                          <button
                            onClick={() => handleReviewClick(item)}
                            className="px-6 py-2 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
                          >
                            ✍️ Đánh Giá
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="border-t border-gray-200 px-5 py-4 bg-gray-50">
              <div className="space-y-1 text-right text-sm text-gray-700">
                <div className="flex justify-end gap-2">
                  <span className="text-gray-600">Tạm tính:</span>
                  <span className="font-medium">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-end gap-2">
                  <span className="text-gray-600">Phí vận chuyển:</span>
                  <span className="font-medium">{formatCurrency(shippingFeeValue)}</span>
                </div>
                {(() => {
                  // ✅ Lấy mã khuyến mãi store và sàn từ promotions array
                  let storePromotionCode = order.promotionCode || order.promotion?.code || order.appliedPromotion?.code;
                  let platformPromotionCode = order.platformPromotions?.orderPromotionCode || 
                                             order.platformPromotions?.shippingPromotionCode ||
                                             order.platformPromotionCode ||
                                             (order.platformPromotions && typeof order.platformPromotions === 'string' ? order.platformPromotions : null);
                  
                  // ✅ Nếu platformPromotions là object, thử lấy code từ các field khác
                  if (!platformPromotionCode && order.platformPromotions && typeof order.platformPromotions === 'object') {
                    platformPromotionCode = order.platformPromotions.code || 
                                           order.platformPromotions.promotionCode ||
                                           (order.platformPromotions.orderPromotion && order.platformPromotions.orderPromotion.code) ||
                                           (order.platformPromotions.shippingPromotion && order.platformPromotions.shippingPromotion.code);
                  }
                  
                  // ✅ QUAN TRỌNG: Kiểm tra promotions array để lấy mã sàn và mã store
                  if (order.promotions && Array.isArray(order.promotions) && order.promotions.length > 0) {
                    order.promotions.forEach(promo => {
                      // Nếu là DBRef chưa populate (có $id hoặc _id nhưng không có code và issuer)
                      const isDBRef = (promo.$id || promo._id || promo.id) && !promo.code && !promo.issuer;
                      
                      if (isDBRef) {
                        // DBRef chưa populate - thử lấy từ fetchedPromotions cache
                        const promoId = promo.$id || promo._id || promo.id;
                        const fetchedPromo = fetchedPromotions[promoId];
                        
                        if (fetchedPromo) {
                          // Đã fetch được promotion details
                          if (fetchedPromo.issuer === 'PLATFORM' || fetchedPromo.issuer === 'platform') {
                            if (fetchedPromo.code) {
                              platformPromotionCode = fetchedPromo.code;
                              console.log('✅ [OrderDetailPage] Tìm thấy mã sàn từ fetched promotion:', fetchedPromo.code);
                            }
                          } else if (fetchedPromo.issuer === 'STORE' || fetchedPromo.issuer === 'store') {
                            if (fetchedPromo.code) {
                              storePromotionCode = fetchedPromo.code;
                              console.log('✅ [OrderDetailPage] Tìm thấy mã store từ fetched promotion:', fetchedPromo.code);
                            }
                          }
                        } else {
                          console.log('⚠️ [OrderDetailPage] Promotion là DBRef chưa populate, ID:', promoId, '- Đang fetch...');
                        }
                        return;
                      }
                      
                      // Nếu đã populate, kiểm tra issuer
                      if (promo.issuer === 'PLATFORM' || promo.issuer === 'platform') {
                        // Đây là mã sàn
                        if (promo.code) {
                          platformPromotionCode = promo.code;
                          console.log('✅ [OrderDetailPage] Tìm thấy mã sàn:', promo.code);
                        }
                      } else if (promo.issuer === 'STORE' || promo.issuer === 'store') {
                        // Đây là mã store
                        if (promo.code) {
                          storePromotionCode = promo.code;
                          console.log('✅ [OrderDetailPage] Tìm thấy mã store:', promo.code);
                        }
                      } else if (promo.code) {
                        // Nếu có code nhưng không có issuer, thử đoán dựa vào discount amount
                        // Nếu chưa có store code, có thể là store promotion
                        if (!storePromotionCode) {
                          storePromotionCode = promo.code;
                          console.log('✅ [OrderDetailPage] Tìm thấy mã (fallback - có thể là store):', promo.code);
                        }
                      }
                    });
                  }
                  
                  // ✅ Lấy discount riêng biệt
                  const storeDiscount = parseFloat(order.storeDiscountAmount || 0);
                  const platformDiscount = parseFloat(order.platformDiscountAmount || 0);
                  
                  // ✅ Nếu promotions là DBRef nhưng có platformDiscountAmount > 0, vẫn hiển thị mã sàn
                  // (không có code cụ thể nhưng vẫn hiển thị để người dùng biết có mã sàn)
                  if (!platformPromotionCode && platformDiscount > 0) {
                    console.log('⚠️ [OrderDetailPage] Có platformDiscount nhưng không có code, sẽ hiển thị "Đã áp dụng mã sàn"');
                  }
                  
                  // ✅ DEBUG LOG CHI TIẾT
                  console.log('🔍 [OrderDetailPage] ===== PROMOTION DEBUG =====');
                  console.log('🔍 [OrderDetailPage] Full order object:', order);
                  console.log('🔍 [OrderDetailPage] Order keys:', Object.keys(order));
                  console.log('🔍 [OrderDetailPage] storeDiscountAmount:', order.storeDiscountAmount);
                  console.log('🔍 [OrderDetailPage] platformDiscountAmount:', order.platformDiscountAmount);
                  console.log('🔍 [OrderDetailPage] totalDiscountAmount:', order.totalDiscountAmount);
                  console.log('🔍 [OrderDetailPage] promotions array:', order.promotions);
                  console.log('🔍 [OrderDetailPage] promotions type:', typeof order.promotions);
                  console.log('🔍 [OrderDetailPage] promotions isArray:', Array.isArray(order.promotions));
                  if (order.promotions && Array.isArray(order.promotions)) {
                    order.promotions.forEach((promo, index) => {
                      console.log(`🔍 [OrderDetailPage] Promotion ${index}:`, promo);
                      console.log(`🔍 [OrderDetailPage] Promotion ${index} type:`, typeof promo);
                      if (promo && typeof promo === 'object') {
                        console.log(`🔍 [OrderDetailPage] Promotion ${index} keys:`, Object.keys(promo));
                        console.log(`🔍 [OrderDetailPage] Promotion ${index} issuer:`, promo.issuer);
                        console.log(`🔍 [OrderDetailPage] Promotion ${index} code:`, promo.code);
                      }
                    });
                  }
                  console.log('🔍 [OrderDetailPage] platformPromotions:', order.platformPromotions);
                  console.log('🔍 [OrderDetailPage] platformPromotions type:', typeof order.platformPromotions);
                  console.log('🔍 [OrderDetailPage] Final storePromotionCode:', storePromotionCode);
                  console.log('🔍 [OrderDetailPage] Final platformPromotionCode:', platformPromotionCode);
                  console.log('🔍 [OrderDetailPage] Final storeDiscount:', storeDiscount);
                  console.log('🔍 [OrderDetailPage] Final platformDiscount:', platformDiscount);
                  console.log('🔍 [OrderDetailPage] Will show platform promotion?', platformDiscount > 0 || platformPromotionCode);
                  console.log('🔍 [OrderDetailPage] ================================');
                  
                  // ✅ Hiển thị nếu có bất kỳ promotion nào (code hoặc discount)
                  if (storePromotionCode || platformPromotionCode || storeDiscount > 0 || platformDiscount > 0) {
                    return (
                      <>
                        {/* Mã khuyến mãi store - hiển thị nếu có code HOẶC có discount */}
                        {(storePromotionCode || storeDiscount > 0) && (
                          <div className="flex justify-end gap-2 items-center bg-blue-50 border border-blue-200 rounded-lg p-2 mt-2">
                            <span className="text-gray-700 flex items-center gap-1.5 text-sm">
                              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"/>
                              </svg>
                              <span className="font-medium">Mã khuyến mãi cửa hàng:</span>
                            </span>
                            <span className="font-bold text-blue-700 bg-white px-2 py-1 rounded border border-blue-300 text-sm">
                              {storePromotionCode || 'Đã áp dụng mã cửa hàng'}
                            </span>
                          </div>
                        )}
                        {/* Mã khuyến mãi sàn - hiển thị nếu có code HOẶC có discount */}
                        {(platformPromotionCode || platformDiscount > 0) && (
                          <div className="flex justify-end gap-2 items-center bg-purple-50 border border-purple-200 rounded-lg p-2 mt-2">
                            <span className="text-gray-700 flex items-center gap-1.5 text-sm">
                              <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"/>
                              </svg>
                              <span className="font-medium">Mã khuyến mãi sàn:</span>
                            </span>
                            <span className="font-bold text-purple-700 bg-white px-2 py-1 rounded border border-purple-300 text-sm">
                              {platformPromotionCode || 'Đã áp dụng mã sàn'}
                            </span>
                          </div>
                        )}
                        {/* Giảm giá từ mã cửa hàng */}
                        {storeDiscount > 0 && (
                          <div className="flex justify-end gap-2 text-green-600">
                            <span>Giảm giá từ mã cửa hàng:</span>
                            <span className="font-medium">-{formatCurrency(storeDiscount)}</span>
                          </div>
                        )}
                        {/* Giảm giá từ mã sàn */}
                        {platformDiscount > 0 && (
                          <div className="flex justify-end gap-2 text-green-600">
                            <span>Giảm giá từ mã sàn:</span>
                            <span className="font-medium">-{formatCurrency(platformDiscount)}</span>
                          </div>
                        )}
                        {/* Tổng giảm giá (nếu có cả 2) */}
                        {storeDiscount > 0 && platformDiscount > 0 && (
                          <div className="flex justify-end gap-2 text-green-600 font-semibold pt-1 border-t border-green-200">
                            <span>Tổng giảm giá:</span>
                            <span>-{formatCurrency(storeDiscount + platformDiscount)}</span>
                          </div>
                        )}
                      </>
                    );
                  }
                  return null;
                })()}
                {/* Thông tin hoàn tiền một phần (nếu có ReturnRequest gắn với order) */}
                {returnRequest &&
                  (typeof returnRequest.partialRefundToBuyer === 'number' ||
                    typeof returnRequest.partialRefundToStore === 'number') && (
                    <div className="pt-2 mt-1 border-t border-dashed border-gray-300 space-y-1 text-xs text-emerald-800">
                      <div className="flex justify-end gap-2">
                        <span className="font-semibold">Hoàn tiền một phần:</span>
                      </div>
                      {typeof returnRequest.partialRefundToBuyer === 'number' &&
                        returnRequest.partialRefundToBuyer > 0 && (
                          <div className="flex justify-end gap-2">
                            <span>Hoàn cho bạn:</span>
                            <span className="font-semibold">
                              {formatCurrency(returnRequest.partialRefundToBuyer)}
                            </span>
                          </div>
                        )}
                      {typeof returnRequest.partialRefundToStore === 'number' &&
                        returnRequest.partialRefundToStore > 0 && (
                          <div className="flex justify-end gap-2 text-emerald-700">
                            <span>Hoàn lại cho cửa hàng:</span>
                            <span className="font-semibold">
                              {formatCurrency(returnRequest.partialRefundToStore)}
                            </span>
                          </div>
                        )}
                    </div>
                  )}

                <div className="flex justify-end gap-2 pt-2 border-t border-gray-200 text-lg font-bold text-red-600">
                  <span className="text-gray-800">Tổng cộng:</span>
                  <span>{formatCurrency(calculatedTotal)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          {shippingAddress && (
            <div className="bg-white border border-gray-200 rounded-lg p-5 mb-4">
              <h2 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
                Địa chỉ nhận hàng
              </h2>
              <div className="text-sm text-gray-700 space-y-1">
                {shippingAddress.suggestedName && (
                  <p className="font-semibold text-blue-600">{shippingAddress.suggestedName}</p>
                )}
                <p className="font-semibold">{shippingAddress.recipientName || 'N/A'}</p>
                <p>{shippingAddress.phone || 'N/A'}</p>
                <p>
                  {[shippingAddress.street, shippingAddress.ward, shippingAddress.district, shippingAddress.province]
                    .filter(Boolean)
                    .join(', ')}
                </p>
              </div>
            </div>
          )}

          {/* Payment Info */}
          <div className="bg-white border border-gray-200 rounded-lg p-5 mb-4">
            <h2 className="font-bold text-gray-900 mb-3">Phương thức thanh toán</h2>
            <div className="space-y-2">
              <p className="text-sm text-gray-700">{getPaymentMethodLabel(paymentMethod)}</p>
              {/* ✅ Hiển thị trạng thái thanh toán */}
              {order.paymentStatus && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Trạng thái thanh toán:</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    (order.paymentStatus || '').toUpperCase() === 'PAID'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {(order.paymentStatus || '').toUpperCase() === 'PAID' ? '✅ Đã thanh toán' : '⏳ Chưa thanh toán'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Order Timeline - Process Tracking (bao gồm cả trả hàng nếu có) */}
          <div className="bg-white border border-gray-200 rounded-lg p-5 mb-4">
            <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/>
              </svg>
              Tiến trình đơn hàng
            </h2>
            
            <div className="relative">
              {/* Timeline Line */}
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-400 via-purple-400 to-green-400"></div>
              
              <div className="space-y-6 relative">
                {/* Step 1: Đặt hàng - Always shown */}
                <div className="flex items-start gap-4 relative z-10">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg ring-4 ring-blue-100">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1 pt-1">
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-bold text-blue-900 text-base">Đơn hàng đã được đặt</h3>
                        <span className="text-xs font-semibold text-blue-700 bg-blue-200 px-2 py-1 rounded-full">Hoàn tất</span>
                      </div>
                      <p className="text-sm text-blue-800">Đơn hàng của bạn đã được tạo thành công</p>
                      <p className="text-xs text-blue-600 mt-1">{formatDate(createdAt)}</p>
                    </div>
                  </div>
                </div>

                {/* Step 2: Xác nhận - If confirmed */}
                {(status === 'CONFIRMED' || status === 'SHIPPING' || status === 'DELIVERED' || order.confirmedAt) && (
                  <div className="flex items-start gap-4 relative z-10">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg ring-4 ring-green-100">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1 pt-1">
                      <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-bold text-green-900 text-base">Đơn hàng đã được xác nhận</h3>
                          <span className="text-xs font-semibold text-green-700 bg-green-200 px-2 py-1 rounded-full">Hoàn tất</span>
                        </div>
                        <p className="text-sm text-green-800">Cửa hàng đã xác nhận đơn hàng của bạn</p>
                        {order.confirmedAt && (
                          <p className="text-xs text-green-600 mt-1">{formatDate(order.confirmedAt)}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3: Đang giao - If shipping */}
                {(status === 'SHIPPING' || status === 'DELIVERED' || order.shippedAt) && (
                  <div className="flex items-start gap-4 relative z-10">
                    <div className="flex-shrink-0">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg ring-4 ${
                        status === 'SHIPPING' 
                          ? 'bg-gradient-to-br from-purple-500 to-purple-600 ring-purple-100 animate-pulse' 
                          : 'bg-gradient-to-br from-purple-500 to-purple-600 ring-purple-100'
                      }`}>
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/>
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1 pt-1">
                      <div className={`rounded-lg p-4 border ${
                        status === 'SHIPPING'
                          ? 'bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200'
                          : 'bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200'
                      }`}>
                        <div className="flex items-center justify-between mb-1">
                          <h3 className={`font-bold text-base ${
                            status === 'SHIPPING' ? 'text-purple-900' : 'text-purple-900'
                          }`}>
                            {status === 'SHIPPING' ? '🚚 Đang giao hàng' : 'Đơn hàng đã được giao'}
                          </h3>
                          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                            status === 'SHIPPING'
                              ? 'text-purple-700 bg-purple-200 animate-pulse'
                              : 'text-purple-700 bg-purple-200'
                          }`}>
                            {status === 'SHIPPING' ? 'Đang xử lý' : 'Hoàn tất'}
                          </span>
                        </div>
                        <p className={`text-sm ${
                          status === 'SHIPPING' ? 'text-purple-800' : 'text-purple-800'
                        }`}>
                          {status === 'SHIPPING' 
                            ? 'Đơn hàng đang trên đường đến bạn' 
                            : 'Đơn hàng đã được giao cho đơn vị vận chuyển'}
                        </p>
                        {order.shippedAt && (
                          <p className="text-xs text-purple-600 mt-1">{formatDate(order.shippedAt)}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 4: Đã giao - If delivered */}
                {(status === 'DELIVERED' || order.deliveredAt) && (
                  <div className="flex items-start gap-4 relative z-10">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg ring-4 ring-emerald-100">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1 pt-1">
                      <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-lg p-4 border border-emerald-200">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-bold text-emerald-900 text-base">🎉 Đã giao hàng thành công</h3>
                          <span className="text-xs font-semibold text-emerald-700 bg-emerald-200 px-2 py-1 rounded-full">Hoàn tất</span>
                        </div>
                        <p className="text-sm text-emerald-800">Đơn hàng đã được giao đến bạn thành công</p>
                        {order.deliveredAt && (
                          <p className="text-xs text-emerald-600 mt-1">{formatDate(order.deliveredAt)}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Return Steps - nếu đơn có yêu cầu trả hàng */}
                {returnMainStatus && (
                  <>
                    {/* Bắt đầu trả hàng */}
                    {(returnMainStatus === 'READY_TO_RETURN' ||
                      returnMainStatus === 'RETURNING' ||
                      returnMainStatus === 'RETURNED' ||
                      returnMainStatus === 'REFUNDED') && (
                      <div className="flex items-start gap-4 relative z-10">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center shadow-lg ring-4 ring-orange-100">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v6h6M20 20v-6h-6M5 19a9 9 0 0114-14"/>
                            </svg>
                          </div>
                        </div>
                        <div className="flex-1 pt-1">
                          <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
                            <div className="flex items-center justify-between mb-1">
                              <h3 className="font-bold text-orange-900 text-base">Bắt đầu quy trình trả hàng</h3>
                              <span className="text-xs font-semibold text-orange-700 bg-orange-200 px-2 py-1 rounded-full">
                                {getReturnStatusLabel(returnMainStatus)}
                              </span>
                            </div>
                            <p className="text-sm text-orange-800">
                              Yêu cầu trả hàng của bạn đã được chấp nhận, vui lòng gửi hàng lại cho shop theo hướng dẫn.
                            </p>
                            {returnRequest?.createdAt && (
                              <p className="text-xs text-orange-600 mt-1">
                                Tạo yêu cầu: {formatDate(returnRequest.createdAt)}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Đã trả hàng thành công */}
                    {(returnMainStatus === 'RETURNED' || returnMainStatus === 'REFUNDED') && (
                      <div className="flex items-start gap-4 relative z-10">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-sky-500 to-sky-600 flex items-center justify-center shadow-lg ring-4 ring-sky-100">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                            </svg>
                          </div>
                        </div>
                        <div className="flex-1 pt-1">
                          <div className="bg-gradient-to-r from-sky-50 to-sky-100 rounded-lg p-4 border border-sky-200">
                            <div className="flex items-center justify-between mb-1">
                              <h3 className="font-bold text-sky-900 text-base">Hàng trả đã được shop xác nhận</h3>
                              <span className="text-xs font-semibold text-sky-700 bg-sky-200 px-2 py-1 rounded-full">
                                Đã trả hàng
                              </span>
                            </div>
                            <p className="text-sm text-sky-800">
                              Shop đã xác nhận nhận được hàng trả về và không có vấn đề về chất lượng.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Đã hoàn tiền */}
                    {returnMainStatus === 'REFUNDED' && (
                      <div className="flex items-start gap-4 relative z-10">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg ring-4 ring-amber-100">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V4m0 12v2m9-8a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            </svg>
                          </div>
                        </div>
                        <div className="flex-1 pt-1">
                          <div className="bg-gradient-to-r from-amber-50 to-amber-100 rounded-lg p-4 border border-amber-200">
                            <div className="flex items-center justify-between mb-1">
                              <h3 className="font-bold text-amber-900 text-base">Đã hoàn tiền</h3>
                              <span className="text-xs font-semibold text-amber-700 bg-amber-200 px-2 py-1 rounded-full">
                                Hoàn tất
                              </span>
                            </div>
                            <p className="text-sm text-amber-800">
                              Số tiền hoàn ({formatCurrency(returnRequest?.refundAmount || 0)}) đã được xử lý theo phương thức thanh toán của bạn.
                            </p>
                            {returnRequest?.updatedAt && (
                              <p className="text-xs text-amber-600 mt-1">
                                Cập nhật: {formatDate(returnRequest.updatedAt)}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Step 5: Đã hủy - If cancelled */}
                {status === 'CANCELLED' && (
                  <div className="flex items-start gap-4 relative z-10">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg ring-4 ring-red-100">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1 pt-1">
                      <div className="bg-gradient-to-r from-red-50 to-red-100 rounded-lg p-4 border border-red-200">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-bold text-red-900 text-base">Đơn hàng đã bị hủy</h3>
                          <span className="text-xs font-semibold text-red-700 bg-red-200 px-2 py-1 rounded-full">Đã hủy</span>
                        </div>
                        <p className="text-sm text-red-800">Đơn hàng đã được hủy</p>
                        {order.cancelledAt && (
                          <p className="text-xs text-red-600 mt-1">{formatDate(order.cancelledAt)}</p>
                        )}
                        {order.cancelReason && (
                          <p className="text-xs text-red-700 mt-2 font-medium">Lý do: {order.cancelReason}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Pending steps - Show as gray if not reached */}
                {status === 'PENDING' && (
                  <div className="flex items-start gap-4 relative z-10 opacity-50">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center">
                        <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1 pt-1">
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <h3 className="font-medium text-gray-500 text-base">Chờ cửa hàng xác nhận</h3>
                        <p className="text-sm text-gray-400 mt-1">Đơn hàng đang chờ cửa hàng xác nhận</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            {/* ✅ Nút "Thanh toán MoMo" - Hiển thị khi paymentMethod=MOMO và paymentStatus=UNPAID */}
            {order && 
             (order.paymentMethod || '').toUpperCase() === 'MOMO' && 
             (order.paymentStatus || '').toUpperCase() === 'UNPAID' && 
             status === 'PENDING' && (
              <>
              <button
                onClick={handlePayMoMo}
                className="px-6 py-2 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-md font-semibold hover:from-pink-600 hover:to-pink-700 transition-all shadow-md hover:shadow-lg flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                Thanh toán MoMo
              </button>
                
                {/* ✅ Nút "Kiểm tra lại thanh toán" - Cho trường hợp đã thanh toán nhưng status chưa cập nhật */}
                <button
                  onClick={handleCheckMoMoPayment}
                  className="px-6 py-2 bg-blue-500 text-white rounded-md font-semibold hover:bg-blue-600 transition-all shadow-md hover:shadow-lg flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                  </svg>
                  Kiểm tra lại thanh toán
                </button>
              </>
            )}
            
            {/* Nút hủy đơn */}
            {canCancel && (
              <button
                onClick={handleCancel}
                className="px-6 py-2 border border-red-500 text-red-500 rounded-md font-semibold hover:bg-red-50 transition-colors"
              >
                Hủy đơn hàng
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Review Modal */}
      {showReviewModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Đánh giá sản phẩm</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedItem.productName || selectedItem.name}
                </p>
              </div>
              <button
                onClick={() => setShowReviewModal(false)}
                className="text-gray-400 hover:text-gray-600"
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
                existingReview={existingReviews[selectedItem.productVariantId || selectedItem.id] || null}
                onSuccess={handleReviewSuccess}
                onCancel={() => setShowReviewModal(false)}
              />
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default OrderDetailPage;
