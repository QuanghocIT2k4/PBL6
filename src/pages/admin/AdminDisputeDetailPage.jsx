import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import useSWR from 'swr';
import { getAdminDisputeDetail, addAdminDisputeMessage, resolveDispute, resolveQualityDispute } from '../../services/admin/disputeService';
import { getAdminOrderById } from '../../services/admin/adminOrderService';
import { incrementStoreWarning } from '../../services/admin/adminStoreService';
import { useToast } from '../../context/ToastContext';
import { confirmAction } from '../../utils/sweetalert';

const AdminDisputeDetailPage = () => {
  const { disputeId } = useParams();
  const navigate = useNavigate();
  const { success: showSuccess, error: showError } = useToast();
  const [messageContent, setMessageContent] = useState('');
  const [isSubmittingMessage, setIsSubmittingMessage] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [decision, setDecision] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [partialRefundAmount, setPartialRefundAmount] = useState('');
  const [isResolving, setIsResolving] = useState(false);
  const messagesEndRef = useRef(null);
  const infoSectionRef = useRef(null);
  const chatSectionRef = useRef(null);
  const [previewAttachment, setPreviewAttachment] = useState(null); // { url, type }

  // ✅ Helper: Format số với dấu chấm (100000 -> 100.000)
  const formatNumberWithDots = (value) => {
    if (!value) return '';
    // Loại bỏ tất cả ký tự không phải số
    const numericValue = value.toString().replace(/[^\d]/g, '');
    if (!numericValue) return '';
    // Format với dấu chấm
    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  // ✅ Helper: Parse số từ format có dấu chấm (100.000 -> 100000)
  const parseFormattedNumber = (value) => {
    if (!value) return '';
    return value.toString().replace(/\./g, '');
  };

  const { data, error, isLoading, mutate } = useSWR(
    ['admin-dispute-detail', disputeId],
    () => getAdminDisputeDetail(disputeId),
    { 
      revalidateOnFocus: true,
      refreshInterval: 5000, // Auto-refresh mỗi 5 giây để cập nhật tin nhắn mới
      dedupingInterval: 2000
    }
  );

  const dispute = data?.success ? data.data : null;
  
  // ✅ Lấy orderId từ dispute - dispute có orderId trực tiếp
  const orderId = dispute?.orderId || 
                  dispute?.returnRequest?.order?.id || 
                  dispute?.returnRequest?.order?._id || 
                  dispute?.returnRequest?.orderId ||
                  dispute?.returnRequest?.order ||
                  dispute?.order?.id ||
                  dispute?.order?._id ||
                  dispute?.order;
  
  // ✅ Gọi API lấy chi tiết đơn hàng nếu có orderId
  // ⚠️ LƯU Ý: API này có thể chưa được implement ở backend (xem BACKEND_ISSUES.md)
  const { data: orderData, error: orderError } = useSWR(
    orderId ? ['admin-order-detail', orderId] : null,
    () => getAdminOrderById(orderId),
    { 
      revalidateOnFocus: false,
      shouldRetryOnError: false // Không retry nếu API không tồn tại
    }
  );
  
  const orderDetail = orderData?.success ? orderData.data : null;

  const getStatusBadge = (status) => {
    const badges = {
      OPEN: 'bg-yellow-100 text-yellow-800',
      IN_REVIEW: 'bg-blue-100 text-blue-800',
      RESOLVED: 'bg-green-100 text-green-800',
      CLOSED: 'bg-gray-100 text-gray-800',
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status) => {
    const labels = {
      OPEN: 'Mở',
      IN_REVIEW: 'Đang xem xét',
      RESOLVED: 'Đã giải quyết',
      CLOSED: 'Đã đóng',
    };
    return labels[status] || status;
  };

  const getDisputeTypeLabel = (type) => {
    const labels = {
      RETURN_REJECTION: 'Khiếu nại từ chối trả hàng',
      RETURN_QUALITY: 'Khiếu nại chất lượng hàng trả',
    };
    return labels[type] || type;
  };

  const getDecisionLabel = (decision, disputeType, dispute = null) => {
    if (!decision) return '';
    
    // ✅ Xử lý PARTIAL_REFUND: Hiển thị số tiền
    if (decision === 'PARTIAL_REFUND') {
      let amount = null;
      if (dispute) {
        // Ưu tiên lấy từ dispute.partialRefundAmount
        amount = dispute.partialRefundAmount;
        // Nếu không có, lấy từ returnRequest.partialRefundToBuyer
        if (!amount && dispute.returnRequest?.partialRefundToBuyer) {
          amount = dispute.returnRequest.partialRefundToBuyer;
        }
      }
      
      if (amount && typeof amount === 'number' && amount > 0) {
        const formattedAmount = new Intl.NumberFormat('vi-VN', {
          style: 'currency',
          currency: 'VND'
        }).format(amount);
        return `Hoàn trả 1 phần (${formattedAmount})`;
      }
      return 'Hoàn trả 1 phần';
    }
    
    // Phân biệt theo loại khiếu nại để hiển thị đúng
    if (disputeType === 'RETURN_QUALITY') {
      // Store khiếu nại chất lượng hàng trả
      if (decision === 'APPROVE_STORE') {
        return 'Chấp nhận khiếu nại của store (không hoàn tiền)';
      }
      if (decision === 'REJECT_STORE') {
        return 'Từ chối khiếu nại của store (hàng trả về đạt)';
      }
    } else {
      // RETURN_REJECTION: Người mua khiếu nại từ chối trả hàng
      if (decision === 'APPROVE_RETURN') {
        return 'Chấp nhận khiếu nại của người mua (cho phép trả hàng)';
      }
      if (decision === 'REJECT_RETURN') {
        return 'Từ chối khiếu nại của người mua (từ chối trả hàng)';
      }
    }

    return decision || '';
  };

  const detectDisputeType = (dispute) => {
    let disputeType = dispute.disputeType || dispute.dispute_type || dispute.type;

    // 1) Ưu tiên thông tin từ ReturnRequest (nếu có)
    if (!disputeType && dispute.returnRequest) {
      const returnRequestStatus = dispute.returnRequest.status || dispute.returnRequestStatus;
      if (returnRequestStatus === 'DISPUTED') {
        disputeType = 'RETURN_REJECTION';
      } else if (returnRequestStatus === 'RETURN_DISPUTED') {
        disputeType = 'RETURN_QUALITY';
      }
    }

    // 2) Nếu vẫn chưa rõ, dựa vào tin nhắn đầu tiên
    if (!disputeType && Array.isArray(dispute.messages) && dispute.messages.length > 0) {
      const firstMsg = dispute.messages[0];
      const senderType = firstMsg.senderType || firstMsg.sender_type;
      if (senderType === 'BUYER') disputeType = 'RETURN_REJECTION';
      if (senderType === 'STORE') disputeType = 'RETURN_QUALITY';
    }

    // 3) Nếu BE không set gì và cũng không đoán được,
    // mặc định coi là RETURN_REJECTION (khiếu nại do Người mua khởi tạo)
    if (!disputeType) {
      disputeType = 'RETURN_REJECTION';
    }

    return disputeType;
  };

  // Auto-scroll behaviour: mặc định scroll xuống cuối cuộc trò chuyện khi có tin nhắn mới
  useEffect(() => {
    if (!dispute) return;

    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [dispute]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleDateString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch (e) {
      return 'N/A';
    }
  };

  const handleSubmitMessage = async (e) => {
    e.preventDefault();
    if (!messageContent.trim()) {
      showError('Vui lòng nhập nội dung tin nhắn');
      return;
    }

    setIsSubmittingMessage(true);
    const result = await addAdminDisputeMessage(disputeId, {
      content: messageContent,
    });

    if (result.success) {
      showSuccess('Đã gửi tin nhắn');
      setMessageContent('');
      mutate();
    } else {
      showError(result.error || 'Không thể gửi tin nhắn');
    }
    setIsSubmittingMessage(false);
  };

  const handleOpenResolveModal = () => {
    setDecision('');
    setAdminNote('');
    setPartialRefundAmount('');
    setShowResolveModal(true);
  };

  const handleResolve = async () => {
    if (!decision) {
      showError('Vui lòng chọn quyết định');
      return;
    }
    if (!adminNote || !adminNote.trim()) {
      showError('Vui lòng nhập lý do quyết định');
      return;
    }

    // Validate số tiền hoàn một phần (nếu chọn PARTIAL_REFUND)
    if (decision === 'PARTIAL_REFUND') {
      // ✅ Parse số từ format có dấu chấm
      const amountStr = parseFormattedNumber(partialRefundAmount);
      const amount = Number(amountStr);
      
      if (!partialRefundAmount || !amountStr || Number.isNaN(amount) || amount <= 0) {
        showError('Vui lòng nhập số tiền hoàn một phần hợp lệ (> 0)');
        return;
      }

      // ✅ VALIDATION: Số tiền hoàn một phần phải NHỎ HƠN tổng tiền gốc sản phẩm - giảm giá của shop - hoa hồng của sàn
      // Công thức: maxRefundAmount = productPrice - storeDiscountAmount - platformCommission
      // ⚠️ LƯU Ý: Phí ship người mua chịu, KHÔNG được hoàn
      // ✅ Ưu tiên dùng orderDetail từ API, fallback về order từ dispute
      const order = orderDetail || dispute?.returnRequest?.order;
      
      if (order) {
        const productPrice = parseFloat(order.productPrice || order.totalPrice || 0);
        const storeDiscountAmount = parseFloat(order.storeDiscountAmount || 0);
        const platformCommission = parseFloat(order.platformCommission || order.serviceFee || 0);
        
        // ✅ Số tiền tối đa có thể hoàn = Tổng tiền gốc sản phẩm - Giảm giá của shop - Hoa hồng của sàn
        // Phí ship người mua chịu, không được hoàn
        const maxRefundAmount = productPrice - storeDiscountAmount - platformCommission;
        
        // ✅ Validation: Số tiền hoàn một phần phải NHỎ HƠN (không bằng) maxRefundAmount
        if (amount >= maxRefundAmount) {
          showError(
            `Số tiền hoàn một phần (${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)}) ` +
            `phải NHỎ HƠN số tiền tối đa có thể hoàn ` +
            `(${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(maxRefundAmount)}). ` +
            `Công thức: Tổng tiền sản phẩm - Giảm giá shop - Hoa hồng sàn. ` +
            `Lưu ý: Phí ship người mua chịu, không được hoàn.`
          );
          return;
        }
      }
      // Nếu không có order data, vẫn cho phép submit (backend sẽ validate)
    }

    const confirmed = await confirmAction('giải quyết khiếu nại này');
    if (!confirmed) return;

    setIsResolving(true);
    try {
      // Xác định disputeType từ nhiều nguồn
      let disputeType = dispute.disputeType || dispute.dispute_type || dispute.type;
      
      // Xác định loại khiếu nại
      disputeType = detectDisputeType(dispute);
      let result;
      const decisionIsStore = decision === 'APPROVE_STORE' || decision === 'REJECT_STORE';
      const decisionIsReturn = decision === 'APPROVE_RETURN' || decision === 'REJECT_RETURN';
      const decisionIsPartialRefund = decision === 'PARTIAL_REFUND';

      // Chặn sai quyết định theo loại khiếu nại
      if (detectDisputeType(dispute) === 'RETURN_QUALITY' && decisionIsReturn) {
        showError('Đây là khiếu nại chất lượng hàng trả. Vui lòng chọn quyết định phù hợp (Chấp nhận/Từ chối hàng trả về/Hoàn tiền một phần).');
        setIsResolving(false);
        return;
      }
      if (detectDisputeType(dispute) === 'RETURN_REJECTION' && (decisionIsStore || decisionIsPartialRefund)) {
        showError('Đây là khiếu nại từ chối trả hàng. Vui lòng chọn quyết định phù hợp (Chấp nhận/Từ chối trả hàng).');
        setIsResolving(false);
        return;
      }

      if (decisionIsStore || decisionIsPartialRefund) {
        // Khiếu nại chất lượng hàng trả (store khởi tạo)
        const payload = {
          decision: decision,
          reason: adminNote,
        };
        
        // ⚠️ LOGIC CẢNH BÁO: Kiểm tra có return request không
        // Nếu store thắng (APPROVE_STORE) và có return request → Cần cộng cảnh báo
        const hasReturnRequest = dispute?.returnRequest || dispute?.returnRequestId;
        if (decision === 'APPROVE_STORE' && hasReturnRequest) {
          payload.hasReturnRequest = true; // Gửi flag để backend biết cần cộng cảnh báo
        }
        
        if (decision === 'PARTIAL_REFUND') {
          // ✅ Parse số từ format có dấu chấm trước khi gửi
          payload.partialRefundAmount = Number(parseFormattedNumber(partialRefundAmount));
        }
        result = await resolveQualityDispute(disputeId, payload);
      } else if (decisionIsReturn) {
        result = await resolveDispute(disputeId, { decision, reason: adminNote });
      } else {
        // Fallback theo disputeType nếu decision không thuộc hai nhóm trên
        if (detectDisputeType(dispute) === 'RETURN_QUALITY') {
          result = await resolveQualityDispute(disputeId, { decision, reason: adminNote });
        } else {
          result = await resolveDispute(disputeId, { decision, reason: adminNote });
        }
      }

      if (result.success) {
        const disputeType = detectDisputeType(dispute);
        const decisionLabel = getDecisionLabel(decision, disputeType);
        showSuccess(`Đã giải quyết khiếu nại: ${decisionLabel}`);
        
        // ⚠️ LOGIC CẢNH BÁO STORE: Nếu store thắng nhưng có return request → Cộng cảnh báo
        if (decision === 'APPROVE_STORE' && dispute?.returnRequest) {
          // Có return request → Store đã giao hàng lỗi → Cần cộng 1 cảnh báo
          const storeId = dispute?.store?.id || dispute?.store?._id || dispute?.storeId;
          if (storeId) {
            try {
              // Gọi API để cộng cảnh báo cho store
              const warningResult = await incrementStoreWarning(storeId, 
                `Giao hàng lỗi (có return request) dù thắng khiếu nại chất lượng đơn #${disputeId?.substring(0, 8)}`
              );
              
              if (warningResult.success) {
                setTimeout(() => {
                  showSuccess(`⚠️ Đã cộng 1 cảnh báo cho store vì đã giao hàng lỗi (có return request).`);
                }, 1500);
              } else {
                // Nếu API chưa tồn tại, backend sẽ tự động xử lý
                setTimeout(() => {
                  showSuccess(`⚠️ Lưu ý: Store đã giao hàng lỗi (có return request) nên sẽ bị cộng 1 cảnh báo (backend tự động xử lý).`);
                }, 1500);
              }
            } catch (err) {
              console.error('Error incrementing store warning:', err);
              // Backend sẽ tự động xử lý
            }
          }
        }
        
        setShowResolveModal(false);
        mutate();
        
        // Thông báo về luồng tiếp theo dựa trên quyết định
        if (decision === 'APPROVE_RETURN') {
          setTimeout(() => {
            showSuccess('Return Request đã được chấp nhận. Shipper sẽ lấy hàng từ Buyer và trả về Store.');
          }, 1000);
        } else if (decision === 'REJECT_RETURN') {
          setTimeout(() => {
            showSuccess('Return Request đã bị từ chối. Buyer sẽ giữ hàng và không được hoàn tiền.');
          }, 1000);
        }
      } else {
        showError(result.error || 'Không thể giải quyết khiếu nại');
      }
    } catch (err) {
      console.error('Error resolving dispute:', err);
      showError('Có lỗi xảy ra khi giải quyết khiếu nại');
    } finally {
      setIsResolving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <p className="mt-2 text-gray-600">Đang tải...</p>
      </div>
    );
  }

  if (error || !dispute) {
    return (
      <div className="bg-white rounded-lg shadow p-12 text-center">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Không tìm thấy khiếu nại</h3>
        <p className="text-gray-500 mb-4">{error || 'Khiếu nại không tồn tại'}</p>
        <Link
          to="/admin-dashboard/disputes"
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
        >
          Quay lại danh sách
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link
            to="/admin-dashboard/disputes"
            className="text-blue-500 hover:text-blue-600 mb-2 inline-block"
          >
            ← Quay lại danh sách
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Chi tiết khiếu nại #{disputeId?.substring(0, 8)}
          </h1>
          <p className="text-sm text-gray-600">
            Người khởi tạo khiếu nại:{' '}
            <span className="font-semibold">
              {detectDisputeType(dispute) === 'RETURN_QUALITY' ? 'Người bán' : 'Người mua'}
            </span>
          </p>
        </div>
        {dispute.status !== 'RESOLVED' && dispute.status !== 'CLOSED' && (
          <button
            onClick={handleOpenResolveModal}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
          >
            Giải quyết khiếu nại
          </button>
        )}
      </div>

      {/* Dispute Info */}
      <div ref={infoSectionRef} className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(dispute.status)}`}>
            {getStatusLabel(dispute.status)}
          </span>
          <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
            {getDisputeTypeLabel(dispute.disputeType || dispute.dispute_type)}
          </span>
          <span className="text-sm text-gray-500">
            Tạo lúc: {formatDate(dispute.createdAt)}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          {dispute.buyer && (
            <div>
              <p className="text-sm text-gray-600 mb-1">
                <span className="font-medium">Người mua:</span>{' '}
                {dispute.buyer.name || dispute.buyer.email || 'N/A'}
              </p>
            </div>
          )}
          {dispute.store && (
            <div>
              <p className="text-sm text-gray-600 mb-1">
                <span className="font-medium">Cửa hàng:</span>{' '}
                {dispute.store.storeName || dispute.store.name || 'N/A'}
              </p>
            </div>
          )}
          {dispute.returnRequest && (
            <div className="col-span-2">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Yêu cầu trả hàng:</span>{' '}
                <Link
                  to={`/admin-dashboard/returns/${dispute.returnRequest.id || dispute.returnRequest._id || dispute.returnRequest}`}
                  className="text-blue-500 hover:underline"
                >
                  #{String(dispute.returnRequest.id || dispute.returnRequest._id || dispute.returnRequest).substring(0, 8)}
                </Link>
              </p>
            </div>
          )}
        </div>

        {/* ✅ Chi tiết đơn hàng - Hiển thị để admin biết số tiền tối đa có thể hoàn */}
        {/* ✅ Ưu tiên dùng orderDetail từ API, fallback về order từ dispute */}
        {(() => {
          // Ưu tiên dùng orderDetail từ API (đầy đủ hơn), fallback về order từ dispute
          const order = orderDetail || dispute?.returnRequest?.order;
          
          if (!order) {
            // Không hiển thị gì nếu không có order data (xem BACKEND_ISSUES.md)
            return null;
          }
          
          const productPrice = parseFloat(order.productPrice || order.totalPrice || 0);
          const storeDiscountAmount = parseFloat(order.storeDiscountAmount || 0);
          const platformCommission = parseFloat(order.platformCommission || order.serviceFee || 0);
          const shippingFee = parseFloat(order.shippingFee || 0);
          const platformDiscountAmount = parseFloat(order.platformDiscountAmount || 0);
          
          // ✅ Số tiền tối đa có thể hoàn = Tổng tiền gốc sản phẩm - Giảm giá của shop - Hoa hồng của sàn
          // Công thức: maxRefundAmount = productPrice - storeDiscountAmount - platformCommission
          // ⚠️ LƯU Ý: Phí ship người mua chịu, KHÔNG được hoàn
          const maxRefundAmount = productPrice - storeDiscountAmount - platformCommission;
          
          // ✅ Lấy orderId từ order object (không conflict với orderId ở scope ngoài)
          const currentOrderId = order.id || order._id || order.orderId;
          const orderCode = currentOrderId ? String(currentOrderId).substring(0, 8).toUpperCase() : 'N/A';
          
          return (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-blue-900">💰 Chi tiết đơn hàng</h3>
                  {currentOrderId && (
                    <p className="text-xs text-gray-600 mt-1">
                      Mã đơn hàng: <span className="font-mono font-semibold">{orderCode}</span>
                    </p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-600">Tổng tiền sản phẩm:</span>
                  <span className="ml-2 font-semibold text-gray-900">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(productPrice)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Giảm giá của shop:</span>
                  <span className="ml-2 font-semibold text-red-600">
                    -{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(storeDiscountAmount)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Hoa hồng của sàn:</span>
                  <span className="ml-2 font-semibold text-orange-600">
                    -{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(platformCommission)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Phí ship:</span>
                  <span className="ml-2 font-semibold text-gray-700">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(shippingFee)}
                    <span className="text-xs text-gray-500 ml-1">(Người mua chịu)</span>
                  </span>
                </div>
                {platformDiscountAmount > 0 && (
                  <div className="col-span-2">
                    <span className="text-gray-600">Giảm giá sàn:</span>
                    <span className="ml-2 font-semibold text-purple-600">
                      -{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(platformDiscountAmount)}
                    </span>
                  </div>
                )}
                <div className="col-span-2 pt-2 border-t border-blue-300">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 font-medium">Số tiền tối đa có thể hoàn một phần:</span>
                    <span className="text-lg font-bold text-blue-700">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(maxRefundAmount)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    (= Tổng tiền sản phẩm - Giảm giá shop - Hoa hồng sàn)
                  </p>
                  <p className="text-xs text-red-600 mt-1 font-medium">
                    ⚠️ Lưu ý: Phí ship người mua chịu, không được hoàn.
                  </p>
                </div>
              </div>
            </div>
          );
        })()}

        {dispute.finalDecision && (
          <div className="mt-4 space-y-2">
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                <span className="font-medium">Kết quả khiếu nại:</span>{' '}
                {getDecisionLabel(dispute.finalDecision, detectDisputeType(dispute), dispute)}
              </p>
              {dispute.adminNote && (
                <p className="text-sm text-green-700 mt-1">{dispute.adminNote}</p>
              )}
            </div>

            {/* Admin xem rõ thông tin hoàn tiền 1 phần nếu có */}
            {(typeof dispute.partialRefundAmount === 'number' && dispute.partialRefundAmount > 0) ||
              (dispute.returnRequest &&
                (typeof dispute.returnRequest.partialRefundToBuyer === 'number' ||
                  typeof dispute.returnRequest.partialRefundToStore === 'number')) ? (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm">
                <p className="font-semibold text-emerald-800 mb-1">
                  Thông tin hoàn tiền một phần
                </p>
                {typeof dispute.partialRefundAmount === 'number' && dispute.partialRefundAmount > 0 && (
                  <p className="text-emerald-800">
                    <span className="font-medium">Tổng số tiền hoàn một phần:</span>{' '}
                    <span className="font-semibold">
                      {new Intl.NumberFormat('vi-VN', {
                        style: 'currency',
                        currency: 'VND',
                      }).format(dispute.partialRefundAmount)}
                    </span>
                  </p>
                )}
                {dispute.returnRequest &&
                  typeof dispute.returnRequest.partialRefundToBuyer === 'number' &&
                  dispute.returnRequest.partialRefundToBuyer > 0 && (
                    <p className="text-emerald-800">
                      <span className="font-medium">Hoàn cho người mua:</span>{' '}
                      <span className="font-semibold">
                        {new Intl.NumberFormat('vi-VN', {
                          style: 'currency',
                          currency: 'VND',
                        }).format(dispute.returnRequest.partialRefundToBuyer)}
                      </span>
                    </p>
                  )}
                {dispute.returnRequest &&
                  typeof dispute.returnRequest.partialRefundToStore === 'number' &&
                  dispute.returnRequest.partialRefundToStore > 0 && (
                    <p className="text-emerald-800">
                      <span className="font-medium">Hoàn lại cho cửa hàng:</span>{' '}
                      <span className="font-semibold">
                        {new Intl.NumberFormat('vi-VN', {
                          style: 'currency',
                          currency: 'VND',
                        }).format(dispute.returnRequest.partialRefundToStore)}
                      </span>
                    </p>
                  )}
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* Messages Chat */}
      <div ref={chatSectionRef} className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Cuộc trò chuyện</h2>
        
        <div className="space-y-4 max-h-96 overflow-y-auto mb-4 pb-4 border-b">
          {dispute.messages && dispute.messages.length > 0 ? (
            dispute.messages.map((message, index) => {
              const isAdmin = message.senderType === 'ADMIN';
              const isBuyer = message.senderType === 'BUYER';
              const isStore = message.senderType === 'STORE';
              const attachments =
                message.attachments ||
                message.attachmentUrls ||
                message.media ||
                [];
              
              return (
                <div
                  key={index}
                  className={`flex ${isAdmin ? 'justify-center' : isBuyer ? 'justify-start' : 'justify-end'}`}
                >
                  <div
                    className={`max-w-md px-4 py-2 rounded-lg ${
                      isAdmin
                        ? 'bg-yellow-50 border border-yellow-200'
                        : isBuyer
                        ? 'bg-blue-50 border border-blue-200'
                        : 'bg-gray-50 border border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {isAdmin && <span className="text-lg">👑</span>}
                      {isBuyer && <span className="text-lg">👤</span>}
                      {isStore && <span className="text-lg">🏪</span>}
                      <span className="text-xs font-medium text-gray-700">
                        {message.senderName || message.senderType}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatDate(message.sentAt || message.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-800 whitespace-pre-wrap">{message.content}</p>
                    {attachments && attachments.length > 0 && (
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        {attachments.map((att, idx) => {
                          const url =
                            typeof att === 'string'
                              ? att
                              : att.url || att.downloadUrl || att;
                          const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
                          const isVideo = /\.(mp4|webm|ogg)$/i.test(url);

                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() =>
                                setPreviewAttachment({
                                  url,
                                  type: isImage ? 'image' : isVideo ? 'video' : 'file',
                                })
                              }
                              className="relative block rounded-lg overflow-hidden border border-gray-200 hover:border-blue-400 transition bg-gray-50 cursor-zoom-in"
                            >
                              {isImage ? (
                                <img
                                  src={url}
                                  alt={`Attachment ${idx + 1}`}
                                  className="w-full h-28 object-contain bg-black/5 rounded"
                                />
                              ) : isVideo ? (
                                <div className="w-full h-28 flex items-center justify-center bg-black bg-opacity-60 text-white text-sm rounded">
                                  Video
                                </div>
                              ) : (
                                <div className="w-full h-28 flex items-center justify-center text-2xl rounded">
                                  📎
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-center text-gray-500 py-8">Chưa có tin nhắn nào</p>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Admin Message Form */}
        {dispute.status !== 'RESOLVED' && dispute.status !== 'CLOSED' && (
          <form onSubmit={handleSubmitMessage} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gửi tin nhắn (Admin)
              </label>
              <textarea
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="Nhập tin nhắn..."
              />
            </div>
            <button
              type="submit"
              disabled={isSubmittingMessage}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:opacity-50"
            >
              {isSubmittingMessage ? 'Đang gửi...' : 'Gửi tin nhắn'}
            </button>
          </form>
        )}
      </div>

      {/* Resolve Modal */}
      {showResolveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-bold mb-4">Giải quyết khiếu nại</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quyết định
                </label>
                <select
                  value={decision}
                  onChange={(e) => {
                    setDecision(e.target.value);
                    setPartialRefundAmount(''); // Reset partialRefundAmount khi thay đổi decision
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Chọn quyết định</option>
                  {(() => {
                    const disputeTypeDetected = detectDisputeType(dispute);
                    if (disputeTypeDetected === 'RETURN_QUALITY') {
                      // Khiếu nại chất lượng hàng trả (Store khởi tạo) – có 3 options theo backend
                      return (
                        <>
                          <option value="APPROVE_STORE">
                            Chấp nhận khiếu nại của store (hàng trả về không đạt)
                          </option>
                          <option value="REJECT_STORE">
                            Từ chối khiếu nại của store (hàng trả về đạt)
                          </option>
                          <option value="PARTIAL_REFUND">
                            Hoàn tiền một phần cho người mua
                          </option>
                        </>
                      );
                    }
                    // Khiếu nại từ chối trả hàng (Buyer khởi tạo)
                    return (
                      <>
                        <option value="APPROVE_RETURN">
                          Thành công (chấp nhận trả hàng)
                        </option>
                        <option value="REJECT_RETURN">
                          Thất bại (từ chối trả hàng)
                        </option>
                      </>
                    );
                  })()}
                </select>
              </div>

              {/* Nhập số tiền hoàn một phần khi chọn PARTIAL_REFUND */}
              {decision === 'PARTIAL_REFUND' && (
                <div>
                  <label
                    htmlFor="partialRefundAmount"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Số tiền hoàn một phần cho người mua (VND)
                  </label>
                  <input
                    type="text"
                    id="partialRefundAmount"
                    value={formatNumberWithDots(partialRefundAmount)}
                    onChange={(e) => {
                      // ✅ Parse và format lại với dấu chấm
                      const parsed = parseFormattedNumber(e.target.value);
                      setPartialRefundAmount(parsed);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Nhập số tiền hoàn một phần (VD: 1.000.000)"
                  />
                  {(() => {
                    // ✅ Ưu tiên dùng orderDetail từ API, fallback về order từ dispute
                    const order = orderDetail || dispute?.returnRequest?.order;
                    
                    if (!order) return null;
                    
                    const productPrice = parseFloat(order.productPrice || order.totalPrice || 0);
                    const storeDiscountAmount = parseFloat(order.storeDiscountAmount || 0);
                    const platformCommission = parseFloat(order.platformCommission || order.serviceFee || 0);
                    
                    // ✅ Số tiền tối đa có thể hoàn = Tổng tiền gốc sản phẩm - Giảm giá của shop - Hoa hồng của sàn
                    // Công thức: maxRefundAmount = productPrice - storeDiscountAmount - platformCommission
                    // ⚠️ LƯU Ý: Phí ship người mua chịu, KHÔNG được hoàn
                    const maxRefundAmount = productPrice - storeDiscountAmount - platformCommission;
                    
                    // ✅ Parse số tiền đã nhập để so sánh
                    const enteredAmount = Number(parseFormattedNumber(partialRefundAmount));
                    
                    return (
                      <div className="mt-2 space-y-1">
                        <p className="text-xs text-gray-500">
                          <span className="font-semibold">Lưu ý:</span> Phí ship người mua chịu, không được hoàn.
                        </p>
                        <p className="text-xs text-blue-600">
                          <span className="font-semibold">Số tiền tối đa có thể hoàn:</span>{' '}
                          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(maxRefundAmount)}
                          {' '}(= Tổng tiền gốc sản phẩm - Giảm giá shop - Hoa hồng sàn)
                        </p>
                        <p className="text-xs text-gray-600">
                          <span className="font-semibold">Công thức:</span> Số tiền hoàn một phần phải <strong>NHỎ HƠN</strong> số tiền tối đa trên.
                        </p>
                        {partialRefundAmount && enteredAmount >= maxRefundAmount && (
                          <p className="text-xs text-red-600 font-semibold">
                            ⚠️ Số tiền nhập phải NHỎ HƠN số tiền tối đa cho phép!
                          </p>
                        )}
                        {partialRefundAmount && enteredAmount <= 0 && (
                          <p className="text-xs text-red-600 font-semibold">
                            ⚠️ Số tiền hoàn một phần phải lớn hơn 0!
                          </p>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lý do quyết định <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={3}
                  placeholder="Nhập lý do quyết định (bắt buộc)..."
                  required
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleResolve}
                  disabled={(() => {
                    // Disable nếu thiếu decision hoặc adminNote
                    if (!decision || !adminNote?.trim() || isResolving) return true;
                    
                    // Nếu là PARTIAL_REFUND, kiểm tra số tiền hợp lệ
                    if (decision === 'PARTIAL_REFUND') {
                      // Kiểm tra số tiền đã nhập chưa
                      const amountStr = parseFormattedNumber(partialRefundAmount);
                      const amount = Number(amountStr);
                      
                      // Nếu chưa nhập số tiền hoặc số tiền không hợp lệ cơ bản
                      if (!partialRefundAmount || !amountStr || Number.isNaN(amount) || amount <= 0) {
                        return true; // Số tiền không hợp lệ
                      }
                      
                      // Kiểm tra giới hạn nếu có order data
                      const order = orderDetail || dispute?.returnRequest?.order;
                      if (order) {
                        const productPrice = parseFloat(order.productPrice || order.totalPrice || 0);
                        const storeDiscountAmount = parseFloat(order.storeDiscountAmount || 0);
                        const platformCommission = parseFloat(order.platformCommission || order.serviceFee || 0);
                        const maxRefundAmount = productPrice - storeDiscountAmount - platformCommission;
                        
                        // Số tiền phải NHỎ HƠN maxRefundAmount
                        if (amount >= maxRefundAmount) {
                          return true; // Vượt quá giới hạn
                        }
                      }
                      // Nếu không có order data, vẫn cho phép submit (backend sẽ validate)
                    }
                    
                    return false; // Cho phép submit
                  })()}
                  className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition disabled:opacity-50"
                >
                  {isResolving ? 'Đang xử lý...' : 'Xác nhận'}
                </button>
                <button
                  onClick={() => setShowResolveModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Preview attachment modal */}
      {previewAttachment && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
          onClick={() => setPreviewAttachment(null)}
        >
          <div
            className="relative max-w-4xl w-full max-h-[90vh] bg-black/80 rounded-lg overflow-hidden flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-3 right-3 text-white text-xl bg-black/60 rounded-full w-8 h-8 flex items-center justify-center hover:bg-black"
              onClick={() => setPreviewAttachment(null)}
            >
              ✕
            </button>
            {previewAttachment.type === 'image' && (
              <img
                src={previewAttachment.url}
                alt="Preview"
                className="max-w-full max-h-[85vh] object-contain"
              />
            )}
            {previewAttachment.type === 'video' && (
              <video
                src={previewAttachment.url}
                controls
                className="max-w-full max-h-[85vh] object-contain bg-black"
              />
            )}
            {previewAttachment.type === 'file' && (
              <a
                href={previewAttachment.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white underline"
              >
                Mở file
              </a>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default AdminDisputeDetailPage;

