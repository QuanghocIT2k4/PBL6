import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useSWR from 'swr';
import StoreLayout from '../../layouts/StoreLayout';
import { useStoreContext } from '../../context/StoreContext';
import StoreStatusGuard from '../../components/store/StoreStatusGuard';
import { getStoreReturnRequests, getStoreReturnRequestDetail, respondToReturnRequest, confirmReturnOK, disputeQuality, getStoreDisputes } from '../../services/b2c/returnService';
import { useToast } from '../../context/ToastContext';
import { confirmAction } from '../../utils/sweetalert';
import ReturnRequestDetailModal from './components/ReturnRequestDetailModal';

const StoreReturnRequestsPage = () => {
  const { currentStore, userStores, selectStore, loading: storeLoading } = useStoreContext();
  // Auto-chọn chi nhánh nếu chưa chọn nhưng có danh sách store
  useEffect(() => {
    if (storeLoading) return;
    if (currentStore) return;
    if (!userStores || userStores.length === 0) return;

    const approved = userStores.find((s) => s.status === 'APPROVED');
    const fallback = approved || userStores[0];
    if (fallback) {
      selectStore(fallback.id || fallback.storeId);
    }
  }, [storeLoading, currentStore, userStores, selectStore]);
  const { success, error: showError } = useToast();
  const [statusFilter, setStatusFilter] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 10;
  const [processingId, setProcessingId] = useState(null);
  const [detailModal, setDetailModal] = useState({ open: false, loading: false, data: null });
  const [rejectModal, setRejectModal] = useState({
    open: false,
    returnRequestId: null,
    reason: '',
    evidenceFiles: [],
  });

  const storeKey = currentStore?.id || currentStore?.storeId;

  const { data, error, isLoading, mutate } = useSWR(
    storeKey ? ['store-return-requests', storeKey, statusFilter, currentPage] : null,
    () => getStoreReturnRequests(storeKey, { status: statusFilter, page: currentPage, size: pageSize }),
    { revalidateOnFocus: false }
  );

  // Fetch disputes để match với return requests
  const { data: disputesData } = useSWR(
    storeKey ? ['store-disputes', storeKey] : null,
    () => getStoreDisputes(storeKey, { page: 0, size: 1000 }),
    { revalidateOnFocus: false }
  );

  const returnRequests = data?.success ? (data.data?.content || data.data || []) : [];
  const totalPages = data?.data?.totalPages || 0;
  
  // Tạo map dispute theo returnRequestId
  const disputes = disputesData?.success ? (disputesData.data?.content || disputesData.data || []) : [];
  const disputeMap = new Map();
  disputes.forEach(dispute => {
    const returnRequestId = dispute.returnRequest?.id || dispute.returnRequest?._id || dispute.returnRequest;
    if (returnRequestId) {
      disputeMap.set(String(returnRequestId), dispute);
    }
  });

  // Đếm số lượng theo trạng thái để làm header
  const statusCounts = returnRequests.reduce(
    (acc, item) => {
      const key = item.status || 'UNKNOWN';
      acc[key] = (acc[key] || 0) + 1;
      acc.TOTAL = (acc.TOTAL || 0) + 1;
      return acc;
    },
    { TOTAL: 0 }
  );

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

  const handleRespond = async (returnRequestId, approved) => {
    if (!currentStore?.id) {
      showError('Không tìm thấy thông tin cửa hàng');
      return;
    }

    // Nếu từ chối → mở modal nhập lý do
    if (!approved) {
      setRejectModal({
        open: true,
        returnRequestId,
        reason: '',
        evidenceFiles: [],
      });
      return;
    }

    // Nếu chấp nhận → confirm và gọi API luôn
    const confirmed = await confirmAction('chấp nhận yêu cầu trả hàng này');
    if (!confirmed) return;

    setProcessingId(returnRequestId);
    try {
      const result = await respondToReturnRequest(currentStore.id, returnRequestId, {
        approved: true,
        storeResponse: 'Chấp nhận yêu cầu trả hàng',
      });

      if (result.success) {
        success('Đã chấp nhận yêu cầu trả hàng');
        mutate();
      } else {
        showError(result.error || 'Không thể phản hồi yêu cầu trả hàng');
      }
    } catch (err) {
      console.error('Error responding to return request:', err);
      showError('Có lỗi xảy ra khi phản hồi yêu cầu trả hàng');
    } finally {
      setProcessingId(null);
    }
  };

  const handleConfirmReject = async () => {
    const trimmedReason = rejectModal.reason.trim();
    if (!trimmedReason) {
      showError('Vui lòng cung cấp lý do từ chối');
      return;
    }

    if (!currentStore?.id) {
      showError('Không tìm thấy thông tin cửa hàng');
      return;
    }

    const returnRequestId = rejectModal.returnRequestId;
    const evidenceFiles = rejectModal.evidenceFiles || [];
    setRejectModal({
      open: false,
      returnRequestId: null,
      reason: '',
      evidenceFiles: [],
    });
    setProcessingId(returnRequestId);
    
    try {
      const result = await respondToReturnRequest(currentStore.id, returnRequestId, {
        approved: false,
        storeResponse: trimmedReason, // Đảm bảo đã trim và không empty
        reason: trimmedReason, // Gửi cả reason để đảm bảo BE nhận được
        evidenceFiles,
      });

      if (result.success) {
        success('Đã từ chối yêu cầu trả hàng');
        mutate();
      } else {
        showError(result.error || 'Không thể từ chối yêu cầu trả hàng');
      }
    } catch (err) {
      console.error('Error rejecting return request:', err);
      showError('Có lỗi xảy ra khi từ chối yêu cầu trả hàng');
    } finally {
      setProcessingId(null);
    }
  };

  const handleConfirmOK = async (returnRequestId) => {
    if (!currentStore?.id) {
      showError('Không tìm thấy thông tin cửa hàng');
      return;
    }

    const confirmed = await confirmAction('xác nhận hàng trả về không có vấn đề');
    if (!confirmed) return;

    setProcessingId(returnRequestId);
    try {
      const result = await confirmReturnOK(currentStore.id, returnRequestId);

      if (result.success) {
        success('Đã xác nhận hàng trả về không có vấn đề');
        mutate();
      } else {
        showError(result.error || 'Không thể xác nhận hàng trả về');
      }
    } catch (err) {
      console.error('Error confirming return OK:', err);
      showError('Có lỗi xảy ra khi xác nhận hàng trả về');
    } finally {
      setProcessingId(null);
    }
  };

  const handleOpenDetail = async (returnRequestId) => {
    if (!storeKey) return;
    setDetailModal({ open: true, loading: true, data: null });
    const result = await getStoreReturnRequestDetail(storeKey, returnRequestId);
    if (result.success) {
      setDetailModal({ open: true, loading: false, data: result.data });
    } else {
      setDetailModal({ open: false, loading: false, data: null });
      showError(result.error || 'Không thể tải chi tiết yêu cầu');
    }
  };

  if (storeLoading) {
    return (
      <StoreLayout>
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </StoreLayout>
    );
  }

  return (
    <StoreStatusGuard currentStore={currentStore} loading={storeLoading} pageName="yêu cầu trả hàng">
      <StoreLayout>
        <div className="bg-gray-50 min-h-screen py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-blue-600 uppercase">Yêu cầu trả hàng</p>
                <h1 className="text-2xl font-bold text-gray-900">Quản lý yêu cầu trả hàng từ khách</h1>
                <p className="text-sm text-gray-600">Xem, phản hồi và xử lý hoàn tiền</p>
              </div>
              <Link
                to="/store-dashboard/orders"
                className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg shadow-sm hover:bg-gray-100 transition"
              >
                ← Quay lại đơn hàng
              </Link>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {[
                { label: 'Tổng yêu cầu', value: statusCounts.TOTAL || 0, color: 'from-slate-200 to-slate-100', text: 'text-slate-800' },
                { label: 'Chờ xử lý', value: statusCounts.PENDING || 0, color: 'from-yellow-100 to-yellow-50', text: 'text-yellow-800' },
                { label: 'Đã chấp nhận', value: statusCounts.APPROVED || 0, color: 'from-blue-100 to-blue-50', text: 'text-blue-800' },
                { label: 'Chuẩn bị / Đang / Đã trả', value: (statusCounts.READY_TO_RETURN || 0) + (statusCounts.RETURNING || 0) + (statusCounts.RETURNED || 0), color: 'from-purple-100 to-purple-50', text: 'text-purple-800' },
                { label: 'Đã hoàn tiền', value: statusCounts.REFUNDED || 0, color: 'from-green-100 to-green-50', text: 'text-green-800' },
              ].map((card, idx) => (
                <div
                  key={idx}
                  className={`rounded-xl border border-gray-200 bg-gradient-to-br ${card.color} p-4 shadow-sm`}
                >
                  <p className="text-xs font-medium text-gray-500">{card.label}</p>
                  <p className={`text-2xl font-bold mt-1 ${card.text}`}>{card.value}</p>
                </div>
              ))}
            </div>

            {/* Filters */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-3 flex gap-2 flex-wrap">
              <button
                onClick={() => setStatusFilter(null)}
                className={`px-4 py-2 rounded-lg border transition ${
                  statusFilter === null
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
              >
                Tất cả
              </button>
              {['PENDING', 'APPROVED', 'READY_TO_RETURN', 'RETURNING', 'RETURNED', 'REFUNDED', 'REJECTED'].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-4 py-2 rounded-lg border transition ${
                    statusFilter === status
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {getStatusLabel(status)}
                </button>
              ))}
            </div>

            {/* Return Requests List */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4">
              {isLoading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  <p className="mt-2 text-gray-600">Đang tải...</p>
                </div>
              ) : returnRequests.length === 0 ? (
                <div className="text-center py-12">
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
                  {returnRequests.map((request) => {
                    // Tìm dispute liên quan đến return request này
                    const dispute = request.dispute || disputeMap.get(String(request.id || request._id));
                    const hasDispute = dispute && (request.status === 'DISPUTED' || request.status === 'RETURN_DISPUTED');
                    
                    return (
                      <div
                        key={request.id || request._id}
                        className="bg-gradient-to-br from-white to-slate-50 rounded-lg border border-gray-200 shadow-sm p-6 hover:shadow-md transition"
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

                            <div className="mb-3 space-y-1 text-sm text-gray-700">
                              <p>
                                <span className="font-semibold">Lý do:</span> {request.reason}
                              </p>
                              {request.description && (
                                <p>
                                  <span className="font-semibold">Mô tả:</span> {request.description}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center gap-4 text-sm mb-3">
                              <span className="text-gray-700">
                                <span className="font-semibold">Số tiền hoàn:</span>{' '}
                                <span className="text-green-600 font-bold">
                                  {formatCurrency(request.refundAmount || 0)}
                                </span>
                              </span>
                            </div>

                            {/* Action Buttons */}
                            {request.status === 'PENDING' && (
                              <div className="flex gap-2 mt-4">
                                <button
                                  onClick={() => handleRespond(request.id || request._id, true)}
                                  disabled={processingId === (request.id || request._id)}
                                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition disabled:opacity-50"
                                >
                                  Chấp nhận
                                </button>
                                <button
                                  onClick={() => handleRespond(request.id || request._id, false)}
                                  disabled={processingId === (request.id || request._id)}
                                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition disabled:opacity-50"
                                >
                                  Từ chối
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenDetail(request.id || request._id)}
                                  className="px-4 py-2 bg-white text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition"
                                >
                                  Xem chi tiết
                                </button>
                              </div>
                            )}

                            {request.status === 'RETURNED' && (
                              <div className="flex gap-2 mt-4">
                                <button
                                  onClick={() => handleConfirmOK(request.id || request._id)}
                                  disabled={processingId === (request.id || request._id)}
                                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition disabled:opacity-50"
                                >
                                  Xác nhận hàng OK
                                </button>
                                <Link
                                  to={`/store-dashboard/returns/${request.id || request._id}/dispute-quality`}
                                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
                                >
                                  Khiếu nại chất lượng
                                </Link>
                              </div>
                            )}

                            {hasDispute && (
                              <div className="flex gap-2 mt-4">
                                <Link
                                  to={`/store-dashboard/returns/disputes/${dispute.id || dispute._id || dispute}`}
                                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                                >
                                  Xem chi tiết khiếu nại
                                </Link>
                                <button
                                  type="button"
                                  onClick={() => handleOpenDetail(request.id || request._id)}
                                  className="px-4 py-2 bg-white text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition"
                                >
                                  Xem chi tiết yêu cầu
                                </button>
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
        </div>
      </StoreLayout>
      <ReturnRequestDetailModal
        open={detailModal.open}
        loading={detailModal.loading}
        data={detailModal.data}
        onClose={() => setDetailModal({ open: false, loading: false, data: null })}
      />

      {/* Reject Reason Modal */}
      {rejectModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Từ chối yêu cầu trả hàng</h3>
            <p className="text-sm text-gray-600 mb-4">
              Vui lòng nhập lý do từ chối yêu cầu trả hàng này và (tuỳ chọn) đính kèm hình ảnh / video minh chứng:
            </p>
            <textarea
              value={rejectModal.reason}
              onChange={(e) => setRejectModal({ ...rejectModal, reason: e.target.value })}
              placeholder="Nhập lý do từ chối..."
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
              autoFocus
            />

            {/* Upload minh chứng */}
            <div className="mt-4 space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Ảnh / video minh chứng (tối đa 5 file)
              </label>
              <input
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  const limited = files.slice(0, 5);
                  setRejectModal((prev) => ({
                    ...prev,
                    evidenceFiles: limited,
                  }));
                }}
                className="block w-full text-sm text-gray-900 file:mr-3 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100 cursor-pointer"
              />
              {rejectModal.evidenceFiles && rejectModal.evidenceFiles.length > 0 && (
                <ul className="text-xs text-gray-600 space-y-1">
                  {rejectModal.evidenceFiles.map((file, idx) => (
                    <li key={idx} className="flex items-center justify-between">
                      <span className="truncate max-w-xs">{file.name}</span>
                      <button
                        type="button"
                        className="text-red-500 hover:underline ml-2"
                        onClick={() =>
                          setRejectModal((prev) => ({
                            ...prev,
                            evidenceFiles: prev.evidenceFiles.filter((_, i) => i !== idx),
                          }))
                        }
                      >
                        Xoá
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() =>
                  setRejectModal({
                    open: false,
                    returnRequestId: null,
                    reason: '',
                    evidenceFiles: [],
                  })
                }
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmReject}
                disabled={!rejectModal.reason.trim() || processingId === rejectModal.returnRequestId}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {processingId === rejectModal.returnRequestId ? 'Đang xử lý...' : 'Xác nhận từ chối'}
              </button>
            </div>
          </div>
        </div>
      )}
    </StoreStatusGuard>
  );
};

export default StoreReturnRequestsPage;


