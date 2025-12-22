import { useState } from 'react';
import { Link } from 'react-router-dom';
import useSWR from 'swr';
import MainLayout from '../../layouts/MainLayout';
import { getMyDisputes } from '../../services/buyer/disputeService';
import { useToast } from '../../context/ToastContext';
import SEO from '../../components/seo/SEO';
import { getOrderCode } from '../../utils/displayCodeUtils';

const BuyerDisputesPage = () => {
  const { error: showError } = useToast();
  const [currentPage, setCurrentPage] = useState(0);
  const [disputeTypeFilter, setDisputeTypeFilter] = useState('RETURN_REJECTION'); // Mặc định: khiếu nại từ chối trả hàng
  const pageSize = 10;

  const { data, error, isLoading } = useSWR(
    ['buyer-disputes', currentPage],
    () => getMyDisputes({ page: currentPage, size: pageSize }),
    { revalidateOnFocus: false }
  );

  // Tự suy luận loại khiếu nại nếu BE không set disputeType
  // Dựa vào 2 API resolve khác nhau:
  // - RETURN_REJECTION: /api/v1/admin/disputes/{disputeId}/resolve (người mua khiếu nại từ chối trả hàng)
  // - RETURN_QUALITY: /api/v1/admin/disputes/{disputeId}/resolve-quality (store khiếu nại chất lượng sản phẩm)
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

  // Filter disputes theo disputeType - dựa vào disputeType từ backend
  const allDisputes = data?.success ? (data.data?.content || data.data || []) : [];
  const filteredDisputes = allDisputes.filter((dispute) => {
    const detectedType = detectDisputeType(dispute);
    return detectedType === disputeTypeFilter;
  });
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
      RETURN_REJECTION: 'Khiếu nại từ chối trả hàng',
      RETURN_QUALITY: 'Khiếu nại chất lượng hàng trả',
    };
    return labels[type] || type;
  };

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
    <MainLayout>
      <SEO
        title="Khiếu nại của tôi | E-Comm"
        description="Xem và quản lý các khiếu nại của bạn"
        keywords="khiếu nại, tranh chấp, giải quyết khiếu nại"
        url="https://pbl-6-eight.vercel.app/orders/disputes"
      />
      <div className="bg-gray-50 min-h-screen py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between border-b border-gray-200 pb-4">
            <div>
              <h1 className="text-3xl font-semibold text-gray-900 mb-1">
                Khiếu nại của tôi
              </h1>
              <p className="text-sm text-gray-500">
                Quản lý các khiếu nại về yêu cầu trả hàng
              </p>
            </div>
            <Link
              to="/orders"
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              ← Quay lại đơn hàng
            </Link>
          </div>

          {/* Tabs: phân loại loại khiếu nại */}
          <div className="mb-6">
            <div className="inline-flex rounded-md border border-gray-300 bg-white overflow-hidden text-sm">
              <button
                type="button"
                onClick={() => {
                  setDisputeTypeFilter('RETURN_REJECTION');
                  setCurrentPage(0);
                }}
                className={`px-4 py-2 border-r border-gray-300 transition-colors ${
                  disputeTypeFilter === 'RETURN_REJECTION'
                    ? 'bg-gray-900 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Khiếu nại từ chối trả hàng
              </button>
              <button
                type="button"
                onClick={() => {
                  setDisputeTypeFilter('RETURN_QUALITY');
                  setCurrentPage(0);
                }}
                className={`px-4 py-2 transition-colors ${
                  disputeTypeFilter === 'RETURN_QUALITY'
                    ? 'bg-gray-900 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Store khiếu nại chất lượng sản phẩm
              </button>
            </div>
          </div>

          {/* Disputes List */}
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <p className="mt-2 text-gray-600">Đang tải...</p>
            </div>
          ) : filteredDisputes.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
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
              <h3 className="mt-2 text-sm font-medium text-gray-900">Chưa có khiếu nại</h3>
              <p className="mt-1 text-sm text-gray-500">
                {disputeTypeFilter === 'RETURN_QUALITY'
                  ? 'Bạn chưa có khiếu nại về chất lượng sản phẩm từ cửa hàng nào.'
                  : 'Bạn chưa có khiếu nại từ chối trả hàng nào.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredDisputes.map((dispute) => {
                const orderId =
                  getIdFromRef(
                    dispute.order ||
                      dispute.orderId ||
                      dispute.orderRef ||
                      dispute.returnRequest?.order
                  );
                const orderCode = orderId ? getOrderCode(orderId) : null;

                return (
                  <div
                    key={dispute.id || dispute._id}
                    className="bg-white border border-gray-200 rounded-lg p-5 hover:border-gray-300 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-3 mb-4">
                        <span
                          className={`px-2.5 py-1 rounded text-xs font-medium ${getStatusBadge(
                            dispute.status
                          )}`}
                        >
                          {getStatusLabel(dispute.status)}
                        </span>
                        <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                          {getDisputeTypeLabel(detectDisputeType(dispute))}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatDate(dispute.createdAt)}
                        </span>
                        {orderCode && (
                          <span className="text-xs font-semibold text-blue-600">
                            Đơn hàng #{orderCode}
                          </span>
                        )}
                      </div>

                      <div className="mb-4 space-y-1">
                        <p className="text-sm text-gray-700">
                          <span className="font-medium text-gray-900">Số tin nhắn:</span>{' '}
                          {dispute.messages?.length || 0}
                        </p>
                        {dispute.finalDecision && (
                          <p className="text-sm text-gray-700">
                            <span className="font-medium text-gray-900">Kết quả:</span>{' '}
                            <span className="font-semibold text-gray-900">
                              {getComplaintResult(dispute) || dispute.finalDecision}
                            </span>
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-gray-100">
                        {/* Button xem chi tiết khiếu nại */}
                        <Link
                          to={`/orders/disputes/${dispute.id || dispute._id}`}
                          className="px-4 py-2 text-sm bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors"
                        >
                          Xem chi tiết khiếu nại
                        </Link>

                        {/* Button xem chi tiết đơn hàng liên quan (nếu có) */}
                        {orderId && (
                          <Link
                            to={`/orders/${orderId}`}
                            className="px-4 py-2 text-sm font-semibold bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                          >
                            Xem chi tiết đơn hàng #{orderCode}
                          </Link>
                        )}

                        {/* Link tới yêu cầu trả hàng (nếu có) */}
                        {dispute.returnRequest && (
                          <Link
                            to={`/orders/returns/${dispute.returnRequest.id || dispute.returnRequest._id || dispute.returnRequest}`}
                            className="text-sm text-gray-600 hover:text-gray-900 hover:underline"
                          >
                            Xem yêu cầu trả hàng
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
              })}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-6">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                    disabled={currentPage === 0}
                    className="px-4 py-2 bg-white rounded-lg border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Trước
                  </button>
                  <span className="px-4 py-2 text-gray-700">
                    Trang {currentPage + 1} / {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={currentPage >= totalPages - 1}
                    className="px-4 py-2 bg-white rounded-lg border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Sau
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default BuyerDisputesPage;


