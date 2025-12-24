import { useState } from 'react';
import { Link } from 'react-router-dom';
import useSWR from 'swr';
import { getAdminDisputes } from '../../services/admin/disputeService';
import { useToast } from '../../context/ToastContext';
import { getOrderCode } from '../../utils/displayCodeUtils';

const AdminDisputesPage = () => {
  const { error: showError } = useToast();
  const [statusFilter, setStatusFilter] = useState(null);
  const [disputeTypeFilter, setDisputeTypeFilter] = useState(null);
  // Tab: BUYER_DISPUTES (RETURN_REJECTION) | STORE_DISPUTES (RETURN_QUALITY)
  const [initiatorTab, setInitiatorTab] = useState('BUYER_DISPUTES');
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 10;

  const { data, error, isLoading, mutate } = useSWR(
    ['admin-disputes', statusFilter, disputeTypeFilter, currentPage],
    () => getAdminDisputes({ status: statusFilter, disputeType: disputeTypeFilter, page: currentPage, size: pageSize }),
    { revalidateOnFocus: false }
  );

  const disputes = data?.success ? (data.data?.content || data.data || []) : [];
  const totalPages = data?.data?.totalPages || 0;

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
      RETURN_REJECTION: 'Khiếu nại người mua (bị từ chối trả hàng)',
      RETURN_QUALITY: 'Khiếu nại cửa hàng (chất lượng hàng trả về)',
    };
    return labels[type] || type;
  };

  // Tự suy luận loại khiếu nại nếu BE không set disputeType
  const detectDisputeType = (dispute) => {
    let type = dispute.disputeType || dispute.dispute_type || dispute.type;

    // 1) Ưu tiên thông tin từ ReturnRequest (nếu có)
    if (!type && dispute.returnRequest) {
      const rrStatus = dispute.returnRequest.status || dispute.returnRequestStatus;
      if (rrStatus === 'DISPUTED') type = 'RETURN_REJECTION';
      else if (rrStatus === 'RETURN_DISPUTED') type = 'RETURN_QUALITY';
    }

    // 2) Nếu vẫn chưa rõ, dựa vào tin nhắn đầu tiên
    if (!type && Array.isArray(dispute.messages) && dispute.messages.length > 0) {
      const firstMsg = dispute.messages[0];
      const senderType = firstMsg.senderType || firstMsg.sender_type;
      if (senderType === 'BUYER') type = 'RETURN_REJECTION';
      if (senderType === 'STORE') type = 'RETURN_QUALITY';
    }

    // 3) Mặc định cuối cùng: người mua khiếu nại
    const finalType = type || 'RETURN_REJECTION';
    return finalType;
  };

  // Với màn danh sách, ưu tiên hiển thị theo tab đang chọn
  const getInitiatorLabel = (dispute, initiatorTab) => {
    // Ưu tiên: xác định theo dữ liệu thực tế
    const type = detectDisputeType(dispute);
    if (type === 'RETURN_QUALITY') return 'Người bán';
    if (type === 'RETURN_REJECTION') return 'Người mua';
    // Fallback: theo tab đang chọn
    return initiatorTab === 'STORE_DISPUTES' ? 'Người bán' : 'Người mua';
  };

  // Kết quả khiếu nại: Phân biệt theo loại khiếu nại
  const getComplaintResult = (dispute) => {
    const decision = dispute.finalDecision;
    if (!decision) return null;

    const disputeType = detectDisputeType(dispute);

    // ✅ Xử lý PARTIAL_REFUND: Hiển thị số tiền
    if (decision === 'PARTIAL_REFUND') {
      let amount = null;
      // Ưu tiên lấy từ dispute.partialRefundAmount
      amount = dispute.partialRefundAmount;
      // Nếu không có, lấy từ returnRequest.partialRefundToBuyer
      if (!amount && dispute.returnRequest?.partialRefundToBuyer) {
        amount = dispute.returnRequest.partialRefundToBuyer;
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

    // Phân biệt theo loại khiếu nại
    if (disputeType === 'RETURN_QUALITY') {
      // Store khiếu nại chất lượng hàng trả
      if (decision === 'APPROVE_STORE') {
        return 'Khiếu nại thành công (hàng trả về không đạt)';
      }
      if (decision === 'REJECT_STORE') {
        return 'Khiếu nại thất bại (hàng trả về đạt)';
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

    return decision;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  // Helper lấy ID từ DBRef / object
  const getIdFromRef = (ref) => {
    if (!ref) return null;
    if (typeof ref === 'string' || typeof ref === 'number') return String(ref);
    return String(ref.$id || ref._id || ref.id || ref.$oid || ref);
  };


  if (error) {
    showError('Không thể tải danh sách khiếu nại');
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Hero header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-teal-200 via-cyan-200 to-blue-200 p-[1px] shadow-lg">
        <div className="relative bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/60">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-blue-500 text-white flex items-center justify-center shadow-md">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm uppercase tracking-wide text-teal-700 font-semibold mb-1">Admin dashboard</p>
                <h1 className="text-3xl font-bold text-gray-900">Quản lý khiếu nại</h1>
                <p className="text-gray-700 mt-1">Giải quyết các khiếu nại giữa người mua và cửa hàng với giao diện rõ ràng, dễ quét.</p>
              </div>
            </div>

            {/* Tabs phân loại người khởi tạo khiếu nại */}
            <div className="inline-flex rounded-xl border border-gray-200 bg-white/80 shadow-sm overflow-hidden text-sm">
              <button
                type="button"
                onClick={() => {
                  setInitiatorTab('BUYER_DISPUTES');
                  setDisputeTypeFilter('RETURN_REJECTION');
                  setCurrentPage(0);
                }}
                className={`px-4 py-2 transition-all ${
                  initiatorTab === 'BUYER_DISPUTES'
                    ? 'bg-blue-500 text-white shadow-inner font-semibold'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                Người mua
              </button>
              <button
                type="button"
                onClick={() => {
                  setInitiatorTab('STORE_DISPUTES');
                  setDisputeTypeFilter('RETURN_QUALITY');
                  setCurrentPage(0);
                }}
                className={`px-4 py-2 transition-all ${
                  initiatorTab === 'STORE_DISPUTES'
                    ? 'bg-blue-500 text-white shadow-inner font-semibold'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                Cửa hàng
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
        <p className="text-sm font-semibold text-gray-800 mb-3">Trạng thái xử lý</p>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => {
              setStatusFilter(null);
              // Reset dispute type theo tab hiện tại
              setDisputeTypeFilter(
                initiatorTab === 'STORE_DISPUTES' ? 'RETURN_QUALITY' : 'RETURN_REJECTION'
              );
            }}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${
              statusFilter === null && disputeTypeFilter === null
                ? 'bg-blue-500 text-white border-blue-500 shadow-sm shadow-blue-200'
                : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:bg-blue-50'
            }`}
          >
            Tất cả
          </button>
          {['OPEN', 'IN_REVIEW', 'RESOLVED'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                statusFilter === status
                  ? 'bg-blue-500 text-white border-blue-500 shadow-sm shadow-blue-200'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:bg-blue-50'
              }`}
            >
              {getStatusLabel(status)}
            </button>
          ))}
        </div>
      </div>

      {/* Disputes List */}
      {isLoading ? (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 text-center">
          <div className="inline-block animate-spin rounded-full h-9 w-9 border-b-2 border-blue-500"></div>
          <p className="mt-3 text-gray-600 font-medium">Đang tải danh sách khiếu nại...</p>
        </div>
      ) : disputes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-12 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="mt-3 text-base font-semibold text-gray-900">Chưa có khiếu nại</h3>
          <p className="mt-1 text-sm text-gray-500">
            Hiện tại không có khiếu nại nào cần xử lý.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {disputes.map((dispute) => {
            const orderId = getIdFromRef(
              dispute.order ||
                dispute.orderId ||
                dispute.orderRef ||
                dispute.returnRequest?.order
            );
            const orderCode = orderId ? getOrderCode(orderId) : null;

            return (
              <div
                key={dispute.id || dispute._id}
                className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all p-6"
              >
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(
                          dispute.status
                        )}`}
                      >
                        {getStatusLabel(dispute.status)}
                      </span>
                      <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-semibold">
                        {getDisputeTypeLabel(dispute.disputeType)}
                      </span>
                      <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold">
                        {getInitiatorLabel(dispute, initiatorTab)}
                      </span>
                      <span className="text-sm text-gray-500 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-green-400"></span>
                        {formatDate(dispute.createdAt)}
                      </span>
                      <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                        {dispute.messages?.length || 0} tin nhắn
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-700">
                      <p className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">Số tin nhắn:</span>
                        {dispute.messages?.length || 0}
                      </p>
                      <p className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">Khởi tạo:</span>
                        {getInitiatorLabel(dispute, initiatorTab)}
                      </p>
                      {orderId && (
                        <p className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900">Đơn hàng:</span>
                          <span className="font-mono text-blue-600">{orderCode}</span>
                        </p>
                      )}
                      {dispute.buyer && (
                        <p className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900">Người mua:</span>
                          {dispute.buyer.name || dispute.buyer.email || 'N/A'}
                        </p>
                      )}
                      {dispute.store && (
                        <p className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900">Cửa hàng:</span>
                          {dispute.store.storeName || dispute.store.name || 'N/A'}
                        </p>
                      )}
                      {dispute.finalDecision && (
                        <p className="flex items-center gap-2 md:col-span-2">
                          <span className="font-semibold text-gray-900">Kết quả:</span>
                          <span className="font-semibold text-green-700">
                            {getComplaintResult(dispute) || dispute.finalDecision}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <Link
                      to={`/admin-dashboard/disputes/${dispute.id || dispute._id}`}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm font-semibold shadow-sm"
                    >
                      Xem & xử lý khiếu nại
                    </Link>
                    {/* Button xem chi tiết đơn hàng liên quan (nếu có) */}
                    {orderId && (
                      <Link
                        to={`/admin-dashboard/orders/${orderId}`}
                        state={{ from: 'disputes' }}
                        className="px-4 py-2 text-sm font-semibold bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors"
                      >
                        Xem chi tiết đơn hàng #{orderCode}
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                disabled={currentPage === 0}
                className="px-4 py-2 bg-white rounded-lg border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 shadow-sm"
              >
                Trước
              </button>
              <span className="px-4 py-2 text-gray-800 font-semibold rounded-lg bg-white border border-gray-200 shadow-sm">
                Trang {currentPage + 1} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={currentPage >= totalPages - 1}
                className="px-4 py-2 bg-white rounded-lg border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 shadow-sm"
              >
                Sau
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminDisputesPage;


