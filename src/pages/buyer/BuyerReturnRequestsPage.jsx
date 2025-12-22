import { useState } from 'react';
import { Link } from 'react-router-dom';
import useSWR from 'swr';
import MainLayout from '../../layouts/MainLayout';
import { getOrderCode } from '../../utils/displayCodeUtils';
import { getMyReturnRequests } from '../../services/buyer/returnService';
import { useToast } from '../../context/ToastContext';
import SEO from '../../components/seo/SEO';

const BuyerReturnRequestsPage = () => {
  const { error: showError } = useToast();
  const [statusFilter, setStatusFilter] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 10;

  const { data, error, isLoading, mutate } = useSWR(
    ['buyer-return-requests', statusFilter, currentPage],
    () => getMyReturnRequests({ status: statusFilter, page: currentPage, size: pageSize }),
    { revalidateOnFocus: false }
  );

  const returnRequests = data?.success ? (data.data?.content || data.data || []) : [];
  const totalPages = data?.data?.totalPages || 0;

  const getStatusBadge = (status) => {
    const badges = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      APPROVED: 'bg-blue-100 text-blue-800',
      REJECTED: 'bg-red-100 text-red-800',
      DISPUTED: 'bg-orange-100 text-orange-800',
      READY_TO_RETURN: 'bg-purple-100 text-purple-800',
      RETURNING: 'bg-indigo-100 text-indigo-800',
      RETURNED: 'bg-gray-100 text-gray-800',
      RETURN_DISPUTED: 'bg-pink-100 text-pink-800',
      REFUNDED: 'bg-green-100 text-green-800',
      REFUND_TO_STORE: 'bg-teal-100 text-teal-800',
      PARTIAL_REFUND: 'bg-cyan-100 text-cyan-800',
      CLOSED: 'bg-gray-100 text-gray-800',
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status) => {
    const labels = {
      PENDING: 'Chờ xử lý',
      APPROVED: 'Đã chấp nhận',
      REJECTED: 'Đã từ chối',
      DISPUTED: 'Đang khiếu nại',
      READY_TO_RETURN: 'Sẵn sàng trả hàng',
      RETURNING: 'Đang trả hàng',
      RETURNED: 'Đã trả hàng',
      RETURN_DISPUTED: 'Tranh chấp chất lượng',
      REFUNDED: 'Đã hoàn tiền',
      REFUND_TO_STORE: 'Hoàn tiền cho shop',
      PARTIAL_REFUND: 'Hoàn tiền một phần',
      CLOSED: 'Đã đóng',
    };
    return labels[status] || status;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
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
    showError('Không thể tải danh sách yêu cầu trả hàng');
  }

  return (
    <MainLayout>
      <SEO
        title="Yêu cầu trả hàng | E-Comm"
        description="Xem và quản lý các yêu cầu trả hàng của bạn"
        keywords="trả hàng, hoàn tiền, yêu cầu trả hàng"
        url="https://pbl-6-eight.vercel.app/orders/returns"
      />
      <div className="bg-gray-50 min-h-screen py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between border-b border-gray-200 pb-4">
            <div>
              <h1 className="text-3xl font-semibold text-gray-900 mb-1">
                Yêu cầu trả hàng
              </h1>
              <p className="text-sm text-gray-500">Quản lý các yêu cầu trả hàng của bạn</p>
            </div>
            <Link
              to="/orders"
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              ← Quay lại đơn hàng
            </Link>
          </div>

          {/* Filters */}
          <div className="mb-6 flex gap-2 flex-wrap">
            <button
              onClick={() => setStatusFilter(null)}
              className={`px-4 py-2 text-sm rounded-md border transition-colors ${
                statusFilter === null
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              Tất cả
            </button>
            {['PENDING', 'APPROVED', 'REJECTED', 'RETURNING', 'RETURNED', 'REFUNDED'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 text-sm rounded-md border transition-colors ${
                  statusFilter === status
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {getStatusLabel(status)}
              </button>
            ))}
          </div>

          {/* Return Requests List */}
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <p className="mt-2 text-gray-600">Đang tải...</p>
            </div>
          ) : returnRequests.length === 0 ? (
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
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">Chưa có yêu cầu trả hàng</h3>
              <p className="mt-1 text-sm text-gray-500">
                Bạn chưa có yêu cầu trả hàng nào.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {returnRequests.map((request) => {
                const orderId = getIdFromRef(request.order || request.orderId || request.orderRef);
                const orderCode = orderId ? getOrderCode(orderId) : null;

                return (
                  <div
                    key={request.id || request._id}
                    className="bg-white border border-gray-200 rounded-lg p-5 hover:border-gray-300 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-3 mb-2">
                          <span
                            className={`px-2.5 py-1 rounded text-xs font-medium ${getStatusBadge(
                              request.status
                            )}`}
                          >
                            {getStatusLabel(request.status)}
                          </span>
                          {orderCode && (
                            <Link
                              to={`/orders/${orderId}`}
                              className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                            >
                              Đơn hàng #{orderCode}
                            </Link>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">
                          Tạo lúc: {formatDate(request.createdAt)}
                        </span>

                      <div className="mb-4 space-y-1">
                        <p className="text-sm text-gray-700">
                          <span className="font-medium text-gray-900">Lý do:</span> {request.reason}
                        </p>
                        {request.description && (
                          <p className="text-sm text-gray-700">
                            <span className="font-medium text-gray-900">Mô tả:</span> {request.description}
                          </p>
                        )}
                      </div>

                        <div className="space-y-3">
                        {/* Thông tin tiền hoàn */}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm">
                          <span className="text-gray-600">
                            <span className="font-medium">Số tiền hoàn dự kiến:</span>{' '}
                            <span className="text-gray-900 font-semibold">
                              {formatCurrency(request.refundAmount || 0)}
                            </span>
                          </span>
                          {typeof request.partialRefundToBuyer === 'number' && request.partialRefundToBuyer > 0 && (
                            <span className="text-gray-600">
                              <span className="font-medium">Hoàn tiền một phần cho bạn:</span>{' '}
                              <span className="text-green-600 font-bold">
                                {formatCurrency(request.partialRefundToBuyer)}
                              </span>
                            </span>
                          )}
                        </div>

                        {/* Khiếu nại liên quan */}
                        {Array.isArray(request.relatedDisputes) && request.relatedDisputes.length > 0 && (
                          <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-sm font-medium text-gray-900">
                                Khiếu nại liên quan:
                              </span>
                              <span className="text-sm text-gray-600">
                                {request.relatedDisputes.length} {request.relatedDisputes.length === 1 ? 'khiếu nại' : 'khiếu nại'}
                              </span>
                            </div>
                            <div className="space-y-1">
                              {request.relatedDisputes.slice(0, 3).map((d) => {
                                const disputeId = d.disputeId || d.id || d;
                                const disputeType = d.disputeType || d.type || '';
                                
                                // ✅ Chuyển đổi disputeType sang tiếng Việt
                                const getDisputeTypeLabel = (type) => {
                                  const typeMap = {
                                    'RETURN_QUALITY': 'Tranh chấp chất lượng',
                                    'RETURN_REJECTION': 'Khiếu nại từ chối trả hàng',
                                    'RETURN_QUALITY_DISPUTE': 'Tranh chấp chất lượng',
                                    'RETURN_REJECTION_DISPUTE': 'Khiếu nại từ chối trả hàng',
                                  };
                                  return typeMap[type] || 'Khiếu nại';
                                };
                                
                                const disputeTypeLabel = getDisputeTypeLabel(disputeType);
                                
                                return (
                                  <Link
                                    key={disputeId}
                                    to={`/orders/disputes/${disputeId}`}
                                    className="block text-sm text-gray-700 hover:text-gray-900 hover:underline"
                                  >
                                    #{String(disputeId).slice(-8)} - {disputeTypeLabel}
                                  </Link>
                                );
                              })}
                              {request.relatedDisputes.length > 3 && (
                                <span className="block text-xs text-gray-500 mt-1">
                                  … và {request.relatedDisputes.length - 3} khiếu nại khác
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Button xem chi tiết đơn hàng */}
                        {orderId && (
                          <div className="pt-2">
                            <Link
                              to={`/orders/${orderId}`}
                              className="inline-flex items-center px-4 py-2 text-sm font-semibold bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors"
                            >
                              Xem chi tiết đơn hàng #{orderCode}
                            </Link>
                          </div>
                        )}
                      </div>

                      {request.storeResponse && (
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <p className="text-sm text-gray-700">
                            <span className="font-medium text-gray-900">Phản hồi từ shop:</span>{' '}
                            {request.storeResponse}
                          </p>
                        </div>
                      )}

                      {request.status === 'REJECTED' && (
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <Link
                            to={`/orders/returns/${request.id || request._id}/dispute`}
                            className="inline-block px-4 py-2 text-sm bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors"
                          >
                            Khiếu nại
                          </Link>
                        </div>
                      )}
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

export default BuyerReturnRequestsPage;


