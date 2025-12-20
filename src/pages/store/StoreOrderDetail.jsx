import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useSWR, { useSWRConfig } from 'swr';
import StoreLayout from '../../layouts/StoreLayout';
import StoreStatusGuard from '../../components/store/StoreStatusGuard';
import StorePageHeader from '../../components/store/StorePageHeader';
import { useStoreContext } from '../../context/StoreContext';
import { useToast } from '../../context/ToastContext';
import { getOrderCode } from '../../utils/displayCodeUtils';
import ConfirmModal from '../../components/common/ConfirmModal';
import ShipmentCard from '../../components/shipment/ShipmentCard';
import { 
  getStoreOrderById, 
  confirmOrder, 
  deliverOrder
} from '../../services/b2c/b2cOrderService';
import { getShipmentByOrderId, updateShipmentStatus, getShipmentsByStoreId } from '../../services/b2c/shipmentService';
import { getPaymentMethodLabel } from '../../services/buyer/orderService';

const StoreOrderDetail = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { currentStore } = useStoreContext();
  const { success: showSuccess, error: showError } = useToast();
  const { mutate: globalMutate } = useSWRConfig();
  const [actionLoading, setActionLoading] = useState(false);
  const [showDeliverModal, setShowDeliverModal] = useState(false);
  const [hasShipment, setHasShipment] = useState(false);
  const [checkingShipment, setCheckingShipment] = useState(true);

  // ✅ Helper functions - Định nghĩa trước khi sử dụng
  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price || 0);
  };

  const getShipping = (orderObj) =>
    orderObj?.shippingAddress ||
    orderObj?.shippingInfo ||
    orderObj?.deliveryAddress ||
    orderObj?.deliveryInfo ||
    orderObj?.address ||
    orderObj?.shipment?.shippingAddress ||
    orderObj?.shipment?.receiverAddress ||
    orderObj?.shipping ||
    orderObj?.receiverAddress ||
    orderObj?.addressInfo ||
    null;

  const getCustomerName = (orderObj) => {
    if (!orderObj) return 'N/A';
    
    const s = getShipping(orderObj) || {};
    
    // ✅ Ưu tiên 1: Tìm trong shipping address (suggestedName từ address array)
    const shippingName = s.suggestedName || s.recipientName || s.fullName || s.name || s.receiverName;
    if (shippingName) return shippingName;
    
    // ✅ Ưu tiên 2: Tìm trong order object
    if (orderObj.customerName) return orderObj.customerName;
    if (orderObj.buyerName) return orderObj.buyerName;
    
    // ✅ Ưu tiên 3: Tìm trong nested buyer object (từ User model)
    if (orderObj.buyer) {
      // fullName từ User model (như trong database)
      if (orderObj.buyer.fullName) return orderObj.buyer.fullName;
      // name field
      if (orderObj.buyer.name) return orderObj.buyer.name;
      // username hoặc email làm fallback
      if (orderObj.buyer.username) return orderObj.buyer.username;
      if (orderObj.buyer.email) return orderObj.buyer.email;
    }
    
    // ✅ Ưu tiên 4: Tìm trong nested user object
    if (orderObj.user) {
      if (orderObj.user.fullName) return orderObj.user.fullName;
      if (orderObj.user.name) return orderObj.user.name;
      if (orderObj.user.username) return orderObj.user.username;
      if (orderObj.user.email) return orderObj.user.email;
    }
    
    // ✅ Ưu tiên 5: Tìm trong shipment
    if (orderObj.shipment?.receiverName) return orderObj.shipment.receiverName;
    
    return 'N/A';
  };

  const getCustomerPhone = (orderObj) => {
    if (!orderObj) return 'N/A';
    
    const s = getShipping(orderObj) || {};
    
    // ✅ Ưu tiên 1: Tìm trong shipping address (phone từ address array)
    const shippingPhone = s.phone || s.receiverPhone || s.contactPhone || s.mobile || s.phoneNumber;
    if (shippingPhone) return shippingPhone;
    
    // ✅ Ưu tiên 2: Tìm trong order object
    if (orderObj.customerPhone) return orderObj.customerPhone;
    if (orderObj.buyerPhone) return orderObj.buyerPhone;
    
    // ✅ Ưu tiên 3: Tìm trong nested buyer object (từ User model)
    if (orderObj.buyer) {
      // phone từ User model (như trong database) - top level
      if (orderObj.buyer.phone) return orderObj.buyer.phone;
      if (orderObj.buyer.phoneNumber) return orderObj.buyer.phoneNumber;
      
      // ✅ Ưu tiên 3b: Tìm trong buyer.address array nếu có (từ User model)
      if (orderObj.buyer.address && Array.isArray(orderObj.buyer.address)) {
        // Tìm address default trước
        const defaultAddress = orderObj.buyer.address.find(addr => addr.isDefault === true);
        if (defaultAddress?.phone) return defaultAddress.phone;
        
        // Nếu không có default, lấy address đầu tiên có phone
        const addressWithPhone = orderObj.buyer.address.find(addr => addr.phone);
        if (addressWithPhone?.phone) return addressWithPhone.phone;
      }
    }
    
    // ✅ Ưu tiên 4: Tìm trong order.address array nếu có (address được chọn khi checkout)
    if (orderObj.address && Array.isArray(orderObj.address)) {
      const orderAddressWithPhone = orderObj.address.find(addr => addr.phone);
      if (orderAddressWithPhone?.phone) return orderAddressWithPhone.phone;
    }
    
    // ✅ Ưu tiên 5: Tìm trong nested user object
    if (orderObj.user) {
      if (orderObj.user.phone) return orderObj.user.phone;
      if (orderObj.user.phoneNumber) return orderObj.user.phoneNumber;
      
      // Tìm trong user.address array
      if (orderObj.user.address && Array.isArray(orderObj.user.address)) {
        const defaultUserAddress = orderObj.user.address.find(addr => addr.isDefault === true);
        if (defaultUserAddress?.phone) return defaultUserAddress.phone;
        
        const userAddressWithPhone = orderObj.user.address.find(addr => addr.phone);
        if (userAddressWithPhone?.phone) return userAddressWithPhone.phone;
      }
    }
    
    // ✅ Ưu tiên 6: Tìm trong shipment
    if (orderObj.shipment?.receiverPhone) return orderObj.shipment.receiverPhone;
    
    return 'N/A';
  };

  const formatAddress = (orderObj) => {
    const s = getShipping(orderObj);
    if (!s) return 'N/A';
    const parts = [
      s.homeAddress || s.detail || s.street || s.addressLine1 || s.address,
      s.ward,
      s.district,
      s.city || s.cityProvince,
      s.province,
    ].filter(Boolean);
    return parts.join(', ') || 'N/A';
  };

  // ✅ Fetch order detail từ API
  const { data: orderData, error, isLoading, mutate } = useSWR(
    orderId && currentStore?.id ? ['store-order-detail', orderId, currentStore.id] : null,
    () => getStoreOrderById(orderId, currentStore.id),
    { revalidateOnFocus: false }
  );

  const order = orderData?.success ? orderData.data : null;

  // ✅ Kiểm tra xem đơn hàng đã có vận đơn chưa (chỉ để hiển thị button "Đã tạo vận đơn")
  useEffect(() => {
    const checkShipment = async () => {
      if (!orderId || !currentStore?.id || !order || order.status !== 'CONFIRMED') {
        setCheckingShipment(false);
        if (order?.status !== 'CONFIRMED') {
          setHasShipment(false);
        }
        return;
      }

      console.log('[StoreOrderDetail] 🔍 Bắt đầu kiểm tra shipment cho orderId:', orderId, 'storeId:', currentStore.id);

      // ✅ Cách 1: Lấy danh sách shipment của store và filter theo orderId
      try {
        console.log('[StoreOrderDetail] 📦 Đang lấy danh sách shipment của store...');
        const storeShipmentsResult = await getShipmentsByStoreId(currentStore.id, { size: 100 });
        console.log('[StoreOrderDetail] 📦 Kết quả lấy danh sách shipment:', storeShipmentsResult);

        if (storeShipmentsResult.success && storeShipmentsResult.data) {
          const shipments = Array.isArray(storeShipmentsResult.data) 
            ? storeShipmentsResult.data 
            : (storeShipmentsResult.data.content || storeShipmentsResult.data.data || []);
          
          console.log('[StoreOrderDetail] 📦 Danh sách shipment:', shipments);
          console.log('[StoreOrderDetail] 📦 Số lượng shipment:', shipments.length);

          // Tìm shipment có order.id hoặc order._id hoặc order.$id trùng với orderId
          const foundShipment = shipments.find(shipment => {
            const orderRef = shipment.order || shipment.orderRef;
            const orderIdFromShipment = orderRef?.id || orderRef?._id || orderRef?.$id || orderRef;
            const orderIdStr = String(orderId);
            const orderIdFromShipmentStr = String(orderIdFromShipment);
            
            console.log('[StoreOrderDetail] 🔍 So sánh:', {
              orderId: orderIdStr,
              orderIdFromShipment: orderIdFromShipmentStr,
              match: orderIdStr === orderIdFromShipmentStr
            });

            return orderIdStr === orderIdFromShipmentStr;
          });

          if (foundShipment) {
            console.log('[StoreOrderDetail] ✅ TÌM THẤY SHIPMENT!', foundShipment);
            setHasShipment(true);
            setCheckingShipment(false);
            return;
          } else {
            console.log('[StoreOrderDetail] ❌ Không tìm thấy shipment trong danh sách');
          }
        }
      } catch (err) {
        console.warn('[StoreOrderDetail] ⚠️ Lỗi khi lấy danh sách shipment:', err);
      }

      // ✅ Cách 2: Fallback - thử dùng getShipmentByOrderId
      try {
        console.log('[StoreOrderDetail] 🔄 Thử cách 2: getShipmentByOrderId...');
        const checkResult = await getShipmentByOrderId(orderId);
        console.log('[StoreOrderDetail] 🔄 Kết quả getShipmentByOrderId:', checkResult);
        
        if (checkResult.data && !checkResult.notFound) {
          console.log('[StoreOrderDetail] ✅ Shipment found via getShipmentByOrderId, setting hasShipment = true');
          setHasShipment(true);
        } else if (checkResult.success && checkResult.data) {
          console.log('[StoreOrderDetail] ✅ Shipment found (success=true), setting hasShipment = true');
          setHasShipment(true);
        } else {
          console.log('[StoreOrderDetail] ❌ No shipment found, setting hasShipment = false');
          setHasShipment(false);
        }
      } catch (err) {
        console.warn('[StoreOrderDetail] ⚠️ Lỗi khi dùng getShipmentByOrderId:', err);
        setHasShipment(false);
      } finally {
        setCheckingShipment(false);
      }
    };

    checkShipment();
  }, [orderId, currentStore?.id, order?.status]);

  if (order) {
    console.log('[StoreOrderDetail] Raw order data:', order);
    console.log('[StoreOrderDetail] Shipping address:', getShipping(order));
    console.log('[StoreOrderDetail] Buyer object (full):', JSON.stringify(order?.buyer, null, 2));
    console.log('[StoreOrderDetail] User object (full):', JSON.stringify(order?.user, null, 2));
    console.log('[StoreOrderDetail] All order keys:', Object.keys(order));
    console.log('[StoreOrderDetail] Customer name fields:', {
      shipping: getShipping(order),
      customerName: order?.customerName,
      buyerName: order?.buyerName,
      buyer: order?.buyer,
      'buyer.name': order?.buyer?.name,
      'buyer.fullName': order?.buyer?.fullName,
      'buyer.username': order?.buyer?.username,
      user: order?.user,
      'user.fullName': order?.user?.fullName,
      'user.name': order?.user?.name
    });
    console.log('[StoreOrderDetail] Customer phone fields:', {
      shipping: getShipping(order),
      customerPhone: order?.customerPhone,
      buyerPhone: order?.buyerPhone,
      buyer: order?.buyer,
      'buyer.phone': order?.buyer?.phone,
      'buyer.phoneNumber': order?.buyer?.phoneNumber,
      user: order?.user,
      'user.phone': order?.user?.phone,
      'user.phoneNumber': order?.user?.phoneNumber
    });
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const badges = {
      PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Chờ xác nhận', icon: '⏳' },
      CONFIRMED: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Đã xác nhận', icon: '✅' },
      SHIPPING: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Đang giao', icon: '🚚' },
      DELIVERED: { bg: 'bg-green-100', text: 'text-green-800', label: 'Đã giao', icon: '📦' },
      CANCELLED: { bg: 'bg-red-100', text: 'text-red-800', label: 'Đã hủy', icon: '❌' }
    };
    return badges[status] || { bg: 'bg-gray-100', text: 'text-gray-800', label: status, icon: '📋' };
  };

  const handleConfirmClick = () => {
    if (!currentStore?.id) {
      showError('Không tìm thấy thông tin cửa hàng');
      return;
    }
    // Xác nhận trực tiếp không cần modal
    handleConfirm();
  };

  const handleConfirm = async () => {
    if (!currentStore?.id) return;
    
    setActionLoading(true);
    try {
      const result = await confirmOrder(orderId, currentStore.id);
      
      if (result.success) {
        showSuccess(result.message);
        // ✅ Force refresh order detail
        await mutate(undefined, { revalidate: true });
        
        // ✅ Tự động set status = PICKING_UP cho shipment mới tạo (với retry logic)
        const tryUpdateShipmentStatus = async (retryCount = 0, maxRetries = 5) => {
          try {
            // Đợi tăng dần: 1s, 2s, 3s, 4s, 5s
            const waitTime = (retryCount + 1) * 1000;
            if (retryCount > 0) {
              console.log(`⏳ [StoreOrderDetail] Waiting ${waitTime}ms before retry ${retryCount}/${maxRetries}...`);
              await new Promise(resolve => setTimeout(resolve, waitTime));
            }
            
            console.log(`🔍 [StoreOrderDetail] Checking shipment for order: ${orderId} (attempt ${retryCount + 1}/${maxRetries})`);
            const shipmentResult = await getShipmentByOrderId(orderId);
            
            if (shipmentResult.success && shipmentResult.data) {
              const shipment = shipmentResult.data;
              const shipmentId = shipment.id || shipment._id;
              const currentStatus = shipment.status;
              
              console.log('✅ [StoreOrderDetail] Found shipment:', { shipmentId, currentStatus });
              
              // ✅ Nếu status chưa phải PICKING_UP, tự động update
              if (currentStatus !== 'PICKING_UP') {
                console.log('🔄 [StoreOrderDetail] Updating shipment status to PICKING_UP...');
                const updateResult = await updateShipmentStatus(shipmentId, 'PICKING_UP');
                
                if (updateResult.success) {
                  console.log('✅ [StoreOrderDetail] Shipment status updated to PICKING_UP successfully!');
                  showSuccess('Đã cập nhật trạng thái vận đơn thành "Đang lấy hàng"');
                  return true;
                } else {
                  console.warn('⚠️ [StoreOrderDetail] Failed to update shipment status:', updateResult.error);
                  return false;
                }
              } else {
                console.log('✅ [StoreOrderDetail] Shipment already has PICKING_UP status');
                return true;
              }
            } else {
              // Shipment chưa tồn tại, retry nếu còn lượt
              if (retryCount < maxRetries - 1) {
                console.warn(`⚠️ [StoreOrderDetail] Shipment not found, will retry... (${retryCount + 1}/${maxRetries})`);
                return await tryUpdateShipmentStatus(retryCount + 1, maxRetries);
              } else {
                console.warn('⚠️ [StoreOrderDetail] Shipment not found after all retries.');
                return false;
              }
            }
          } catch (err) {
            console.error(`❌ [StoreOrderDetail] Error on attempt ${retryCount + 1}:`, err.message);
            
            if (retryCount < maxRetries - 1) {
              return await tryUpdateShipmentStatus(retryCount + 1, maxRetries);
            } else {
              console.error('❌ [StoreOrderDetail] All retry attempts failed');
              return false;
            }
          }
        };
        
        // Bắt đầu retry logic (không await để không block UI)
        tryUpdateShipmentStatus().catch(err => {
          console.error('❌ [StoreOrderDetail] Fatal error in shipment update logic:', err);
        });
        
        // ✅ Invalidate shipments và shipper cache để tự động refresh
        globalMutate(
          (key) => {
            if (Array.isArray(key)) {
              const keyName = key[0];
              return (
                keyName === 'store-shipments' || // ✅ Invalidate shipments để StoreShipments tự refresh
                keyName === 'store-shipments-stats' || // ✅ Invalidate stats để stats được cập nhật
                keyName === 'shipper-picking-up' || // ✅ Invalidate shipper để ShipperDashboard tự refresh
                keyName === 'shipper-history'
              );
            }
            return false;
          },
          undefined,
          { revalidate: true }
        );
        
        // ✅ Retry refresh shipments sau 2 giây (để đảm bảo backend đã tạo shipment)
        setTimeout(() => {
          globalMutate(
            (key) => {
              if (Array.isArray(key) && (key[0] === 'store-shipments' || key[0] === 'store-shipments-stats')) {
                return true;
              }
              return false;
            },
            undefined,
            { revalidate: true }
          );
        }, 2000);
      } else {
        showError(result.error);
      }
    } catch (err) {
      console.error('Error confirming order:', err);
      showError('Có lỗi xảy ra khi xác nhận đơn hàng');
    } finally {
      setActionLoading(false);
    }
  };


  const handleDeliverClick = () => {
    if (!currentStore?.id) {
      showError('Không tìm thấy thông tin cửa hàng');
      return;
    }
    setPendingAction('deliver');
    setShowDeliverModal(true);
  };

  const handleDeliver = async () => {
    if (!currentStore?.id) return;
    
    setActionLoading(true);
    try {
      const result = await deliverOrder(orderId, currentStore.id);
      
      if (result.success) {
        showSuccess(result.message);
        // ✅ Force refresh order detail
        await mutate(undefined, { revalidate: true });
      } else {
        showError(result.error);
      }
    } catch (err) {
      console.error('Error delivering order:', err);
      showError('Có lỗi xảy ra khi hoàn tất giao hàng');
    } finally {
      setActionLoading(false);
    }
  };


  if (isLoading) {
    return (
      <StoreStatusGuard currentStore={currentStore} pageName="chi tiết đơn hàng">
        <StoreLayout>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </StoreLayout>
      </StoreStatusGuard>
    );
  }

  if (error || !order) {
    return (
      <StoreStatusGuard currentStore={currentStore} pageName="chi tiết đơn hàng">
        <StoreLayout>
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">Không thể tải chi tiết đơn hàng</p>
            <button
              onClick={() => navigate('/store-dashboard/orders')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Quay lại danh sách
            </button>
          </div>
        </StoreLayout>
      </StoreStatusGuard>
    );
  }

  const badge = getStatusBadge(order.status);
  
  // Calculate order breakdown
  const items = order.items || order.orderItems || [];
  const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.price || 0) * parseInt(item.quantity || 0)), 0);
  const shippingFee = parseFloat(order.shippingFee || order.shippingCost || 0);
  
  // ✅ Helper function để lấy mã khuyến mãi của store (không lấy platform promotion)
  const getStorePromotionCode = (order) => {
    // Chỉ lấy mã nếu có storeDiscountAmount > 0 (có store promotion)
    const storeDiscount = parseFloat(order.storeDiscountAmount || 0);
    if (storeDiscount === 0) return null;
    
    // Kiểm tra promotions array (có thể là DBRef hoặc populated)
    if (order.promotions && Array.isArray(order.promotions) && order.promotions.length > 0) {
      const firstPromo = order.promotions[0];
      // Nếu là DBRef đã populate, có code
      if (firstPromo.code) return firstPromo.code;
    }
    
    // Kiểm tra các field promotion khác (chỉ nếu là store promotion)
    // Có thể cần check thêm logic để đảm bảo đây là store promotion
    return (
      order.promotionCode || 
      order.appliedPromotion?.code ||
      order.promotion?.code ||
      null
    );
  };

  // ✅ Tính discount từ nhiều nguồn có thể có
  // Ưu tiên: storeDiscountAmount (chỉ discount từ store promotion)
  let discount = parseFloat(order.storeDiscountAmount || 0);
  
  // Nếu không có storeDiscountAmount, thử các field khác
  if (discount === 0) {
    discount = parseFloat(order.discount || order.discountAmount || 0);
  }
  
  // 2. Nếu không có, thử từ promotion fields
  if (discount === 0) {
    discount = parseFloat(
      order.promotionDiscount || 
      order.appliedDiscount || 
      order.promotionAmount ||
      order.appliedPromotion?.discountAmount ||
      order.appliedPromotion?.discountValue ||
      0
    );
  }
  
  // 3. Nếu vẫn không có và có promotion, tính từ totalPrice ngược lại
  if (discount === 0 && order.appliedPromotion) {
    const calculatedTotal = subtotal + shippingFee;
    const actualTotal = parseFloat(order.totalPrice || order.totalAmount || order.finalTotal || 0);
    if (actualTotal > 0 && calculatedTotal > actualTotal) {
      discount = calculatedTotal - actualTotal;
    }
  }
  
  // 4. Nếu vẫn không có, tính từ totalPrice ngược lại (fallback)
  if (discount === 0) {
    const calculatedTotal = subtotal + shippingFee;
    const actualTotal = parseFloat(order.totalPrice || order.totalAmount || order.finalTotal || 0);
    if (actualTotal > 0 && calculatedTotal > actualTotal) {
      discount = calculatedTotal - actualTotal;
    }
  }
  
  const totalPrice = parseFloat(order.totalPrice) || order.totalAmount || order.finalTotal || (subtotal + shippingFee - discount);
  
  // ✅ Debug log để kiểm tra
  console.log('[StoreOrderDetail] Order breakdown:', {
    subtotal,
    shippingFee,
    discount,
    totalPrice,
    orderTotalPrice: order.totalPrice,
    orderTotalAmount: order.totalAmount,
    orderFinalTotal: order.finalTotal,
    appliedPromotion: order.appliedPromotion,
    promotionCode: order.promotionCode,
    orderKeys: Object.keys(order).filter(k => k.toLowerCase().includes('discount') || k.toLowerCase().includes('promotion'))
  });

  return (
    <StoreStatusGuard currentStore={currentStore} pageName="chi tiết đơn hàng">
      <StoreLayout>
        <div className="space-y-6">
          {/* Header với gradient giống Dashboard */}
          <div className="bg-gradient-to-r from-cyan-200 to-blue-200 rounded-2xl p-6">
            <div className="relative bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-2xl flex items-center justify-center shadow-lg">
                    <span className="text-4xl">📦</span>
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold mb-2">
                      <span className="text-cyan-600">Đơn hàng</span> <span className="text-blue-600">{getOrderCode(order.id)}</span>
                    </h1>
                    <p className="text-gray-600 text-lg">Đặt lúc: {formatDate(order.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {/* Store Status Badge */}
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
                  
                  <button
                    onClick={() => navigate('/store-dashboard/orders')}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 font-semibold flex items-center gap-2 transition-all"
                  >
                    ← Quay lại
                  </button>
                  <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${badge.bg} ${badge.text}`}>
                    <span className="mr-2">{badge.icon}</span>
                    {badge.label}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Order Items */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Sản phẩm</h2>
                <div className="space-y-4">
                  {items.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p>Không có sản phẩm nào trong đơn hàng</p>
                    </div>
                  ) : (
                    items.map((item, index) => (
                    <div key={index} className="flex items-center gap-4 pb-4 border-b border-gray-100 last:border-b-0 last:pb-0">
                      <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        {item.image || item.productImage ? (
                          <img 
                            src={item.image || item.productImage} 
                            alt={item.productName || item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            📦
                  </div>
                        )}
                </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">
                          {item.productName || item.name}
                        </h3>
                        {item.options && Object.keys(item.options).length > 0 && (
                          <p className="text-sm text-gray-600">
                            {Object.entries(item.options).map(([key, value]) => `${key}: ${value}`).join(', ')}
                          </p>
                        )}
                        <p className="text-sm text-gray-600">
                          Số lượng: {item.quantity}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          {formatPrice(item.price * item.quantity)}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatPrice(item.price)} x {item.quantity}
                        </p>
                      </div>
                    </div>
                    ))
                  )}
              </div>

                {/* Order Summary Breakdown */}
                <div className="mt-6 pt-6 border-t border-gray-200 space-y-3">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Tạm tính:</span>
                    <span className="font-medium">{formatPrice(subtotal)}</span>
                  </div>
                  {shippingFee > 0 && (
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Phí vận chuyển:</span>
                      <span className="font-medium">{formatPrice(shippingFee)}</span>
                    </div>
                  )}
                  {/* Hiển thị số tiền giảm trước */}
                  {(() => {
                    const storeDiscount = parseFloat(order.storeDiscountAmount || 0);
                    const displayDiscount = storeDiscount > 0 ? storeDiscount : discount;
                    
                    if (displayDiscount > 0) {
                      return (
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>Số tiền giảm:</span>
                          <span className="font-medium text-green-600">-{formatPrice(displayDiscount)}</span>
                        </div>
                      );
                    }
                    return null;
                  })()}
                  
                  {/* Chỉ hiển thị mã khuyến mãi nếu đó là mã của store (có storeDiscountAmount) - ĐẶT DƯỚI SỐ TIỀN GIẢM */}
                  {(() => {
                    const storePromotionCode = getStorePromotionCode(order);
                    const storeDiscount = parseFloat(order.storeDiscountAmount || 0);
                    
                    // Chỉ hiển thị nếu có store promotion
                    if (storePromotionCode && storeDiscount > 0) {
                      return (
                        <div className="flex justify-between items-center text-sm bg-blue-50 border border-blue-200 rounded-lg p-2 mt-2">
                          <span className="text-gray-700 flex items-center gap-1.5">
                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"/>
                            </svg>
                            <span className="font-medium">Mã khuyến mãi của store:</span>
                          </span>
                          <span className="font-bold text-blue-700 bg-white px-2 py-1 rounded border border-blue-300">
                            {storePromotionCode}
                          </span>
                        </div>
                      );
                    }
                    
                    return null;
                  })()}
                  <div className="flex justify-between items-center text-lg font-bold pt-3 border-t border-gray-200">
                    <span>Tổng cộng:</span>
                    <span className="text-red-600 text-xl">{formatPrice(totalPrice)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Info */}
            <div className="space-y-6">
              {/* Customer Info */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Thông tin khách hàng</h2>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-600">Họ tên:</span>
                    <p className="font-medium text-gray-900">{getCustomerName(order)}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Số điện thoại:</span>
                    <p className="font-medium text-gray-900">{getCustomerPhone(order)}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Địa chỉ:</span>
                    <p className="font-medium text-gray-900">{formatAddress(order)}</p>
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Phương thức thanh toán</h2>
                <p className="text-gray-700 mb-2">
                  {order.paymentMethod === 'COD' ? '💵 Thanh toán khi nhận hàng (COD)' : 
                   order.paymentMethod === 'VNPAY' ? '🏦 Thanh toán qua VNPay' :
                   order.paymentMethod === 'MOMO' ? '💳 Thanh toán qua MoMo' :
                   // Backward compatibility: Map các method cũ
                   order.paymentMethod === 'BANK_TRANSFER' ? '🏦 Thanh toán qua VNPay' :
                   order.paymentMethod === 'E_WALLET' ? '💳 Thanh toán qua MoMo' :
                   order.paymentMethod ? getPaymentMethodLabel(order.paymentMethod) : 'Chưa xác định'}
                </p>
                {order.paymentStatus && (
                  <p className="text-sm text-gray-600">
                    Trạng thái: <span className={`font-medium ${
                      order.paymentStatus === 'PAID' ? 'text-green-600' :
                      order.paymentStatus === 'FAILED' ? 'text-red-600' :
                      'text-yellow-600'
                    }`}>
                      {order.paymentStatus === 'PAID'
                        ? 'Đã thanh toán'
                        : order.paymentStatus === 'FAILED'
                          ? 'Thanh toán thất bại'
                          : 'Chưa thanh toán'}
                    </span>
                  </p>
                )}
              </div>

              {/* Order Note */}
              {order.note && (
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Ghi chú đơn hàng</h2>
                  <p className="text-gray-700 text-sm bg-gray-50 p-3 rounded-lg">
                    {order.note}
                  </p>
                </div>
              )}

              {/* Order Timeline */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Lịch sử đơn hàng</h2>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Đơn hàng được tạo</p>
                      <p className="text-xs text-gray-500">{formatDate(order.createdAt)}</p>
                    </div>
                  </div>
                  {order.confirmedAt && (
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">Đã xác nhận</p>
                        <p className="text-xs text-gray-500">{formatDate(order.confirmedAt)}</p>
                      </div>
                    </div>
                  )}
                  {order.shippedAt && (
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">Đã giao hàng</p>
                        <p className="text-xs text-gray-500">{formatDate(order.shippedAt)}</p>
                      </div>
                    </div>
                  )}
                  {order.deliveredAt && (
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">Đã giao thành công</p>
                        <p className="text-xs text-gray-500">{formatDate(order.deliveredAt)}</p>
                      </div>
                    </div>
                  )}
                  {order.cancelledAt && (
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">Đã hủy</p>
                        <p className="text-xs text-gray-500">{formatDate(order.cancelledAt)}</p>
                        {order.cancelReason && (
                          <p className="text-xs text-red-600 mt-1">Lý do: {order.cancelReason}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Shipment Info - Hiển thị khi đã bắt đầu giao hàng (SHIPPING hoặc DELIVERED) */}
              {/* Sau khi bấm "Bắt đầu giao hàng", status sẽ chuyển sang SHIPPING và ShipmentCard sẽ hiển thị */}
              {(order.status === 'SHIPPING' || order.status === 'DELIVERED') && (
                <ShipmentCard orderId={order.id} storeId={currentStore?.id} />
              )}
              

              {/* Actions */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Thao tác</h2>
                <div className="space-y-2">
                  {order.status === 'PENDING' && (
                    <button
                      onClick={handleConfirmClick}
                      disabled={actionLoading}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      ✅ Xác nhận đơn hàng
                    </button>
                  )}
                  
                  {order.status === 'CONFIRMED' && checkingShipment && (
                    <div className="w-full px-4 py-2 bg-gray-100 text-gray-600 rounded-lg flex items-center justify-center gap-2">
                      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Đang kiểm tra...
                    </div>
                  )}
                  {order.status === 'CONFIRMED' && !checkingShipment && hasShipment && (
                    <button
                      onClick={() => navigate('/store-dashboard/shipments')}
                      className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium flex items-center justify-center gap-2"
                      title="Đã tạo vận đơn"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                      </svg>
                      Đã tạo vận đơn
                    </button>
                  )}
                  
                  {order.status === 'SHIPPING' && (
                    <button
                      onClick={handleDeliverClick}
                      disabled={actionLoading}
                      className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      📦 Xác nhận đã giao
                    </button>
                  )}
                  
                  {order.status === 'DELIVERED' && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center gap-3 text-green-700">
                        <span className="text-2xl">🎉</span>
                        <div>
                          <p className="text-sm font-medium">Giao hàng thành công</p>
                          <p className="text-xs text-green-600 mt-1">
                            Đơn hàng đã được giao đến khách hàng
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {order.status === 'CANCELLED' && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-center gap-3 text-red-700">
                        <span className="text-2xl">❌</span>
                        <div>
                          <p className="text-sm font-medium">Đơn hàng đã bị hủy</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </StoreLayout>



      {/* Deliver Order Modal */}
      <ConfirmModal
        isOpen={showDeliverModal}
        onClose={() => setShowDeliverModal(false)}
        onConfirm={handleDeliver}
        title="Xác nhận giao hàng"
        message="Xác nhận đơn hàng đã giao thành công?"
        confirmText="Xác nhận"
        cancelText="Hủy"
        confirmColor="green"
        icon="📦"
      />
    </StoreStatusGuard>
  );
};

export default StoreOrderDetail;
