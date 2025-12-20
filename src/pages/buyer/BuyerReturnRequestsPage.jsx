import { useState } from 'react';
import { Link } from 'react-router-dom';
import useSWR from 'swr';
import MainLayout from '../../layouts/MainLayout';
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
      <div className="bg-gray-50 min-h-screen py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Yêu cầu trả hàng
              </h1>
              <p className="text-gray-600">Quản lý các yêu cầu trả hàng của bạn</p>
            </div>
            <Link
              to="/orders"
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
            >
              ← Quay lại đơn hàng
            </Link>
          </div>

          {/* Filters */}
          <div className="mb-6 flex gap-2 flex-wrap">
            <button
              onClick={() => setStatusFilter(null)}
              className={`px-4 py-2 rounded-lg transition ${
                statusFilter === null
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Tất cả
            </button>
            {['PENDING', 'APPROVED', 'REJECTED', 'RETURNING', 'RETURNED', 'REFUNDED'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-lg transition ${
                  statusFilter === status
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
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
            <div className="space-y-4">
              {returnRequests.map((request) => (
                <div
                  key={request.id || request._id}
                  className="bg-white rounded-lg shadow p-6 hover:shadow-md transition"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(
                            request.status
                          )}`}
                        >
                          {getStatusLabel(request.status)}
                        </span>
                        <span className="text-sm text-gray-500">
                          {formatDate(request.createdAt)}
                        </span>
                      </div>

                      <div className="mb-3">
                        <p className="text-sm text-gray-600 mb-1">
                          <span className="font-medium">Lý do:</span> {request.reason}
                        </p>
                        {request.description && (
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Mô tả:</span> {request.description}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4 text-sm">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
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
                        <div className="flex flex-col sm:items-end gap-1 sm:ml-auto">
                          {request.order && (
                            <Link
                              to={`/orders/${request.order.id || request.order._id || request.order}`}
                              className="text-blue-600 hover:underline"
                            >
                              Xem đơn hàng →
                            </Link>
                          )}

                          {/* Khiếu nại liên quan (nếu BE trả về) */}
                          {Array.isArray(request.relatedDisputes) && request.relatedDisputes.length > 0 && (
                            <div className="mt-1 text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded px-2 py-1">
                              <span className="font-medium">Khiếu nại liên quan:</span>{' '}
                              <span>{request.relatedDisputes.length} khiếu nại</span>
                              <div className="mt-1 space-y-0.5">
                                {request.relatedDisputes.slice(0, 2).map((d) => (
                                  <Link
                                    key={d.disputeId || d.id}
                                    to={`/orders/disputes/${d.disputeId || d.id || d}`}
                                    className="block text-blue-600 hover:underline"
                                  >
                                    #{String(d.disputeId || d.id || d).slice(-6)} – {d.disputeType || d.type || 'N/A'}
                                  </Link>
                                ))}
                                {request.relatedDisputes.length > 2 && (
                                  <span className="block text-[11px] text-gray-500">
                                    … và {request.relatedDisputes.length - 2} khiếu nại khác
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {request.storeResponse && (
                        <div className="mt-3 p-3 bg-gray-50 rounded">
                          <p className="text-sm text-gray-700">
                            <span className="font-medium">Phản hồi từ shop:</span>{' '}
                            {request.storeResponse}
                          </p>
                        </div>
                      )}

                      {request.status === 'REJECTED' && (
                        <div className="mt-3">
                          <Link
                            to={`/orders/returns/${request.id || request._id}/dispute`}
                            className="inline-block px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
                          >
                            Khiếu nại
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

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


