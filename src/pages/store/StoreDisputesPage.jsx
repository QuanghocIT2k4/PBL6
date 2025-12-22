import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useSWR from 'swr';
import StoreLayout from '../../layouts/StoreLayout';
import { useStoreContext } from '../../context/StoreContext';
import StoreStatusGuard from '../../components/store/StoreStatusGuard';
import { getStoreDisputes } from '../../services/b2c/returnService';
import { useToast } from '../../context/ToastContext';
import SEO from '../../components/seo/SEO';
import { getOrderCode } from '../../utils/displayCodeUtils';

const StoreDisputesPage = () => {
  const { currentStore, userStores, selectStore, loading: storeLoading } = useStoreContext();
  
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

  const { error: showError } = useToast();
  const [currentPage, setCurrentPage] = useState(0);
  const [disputeTypeFilter, setDisputeTypeFilter] = useState(null); // null = tất cả, 'RETURN_QUALITY' = store khiếu nại, 'RETURN_REJECTION' = buyer khiếu nại
  const pageSize = 10;

  const storeKey = currentStore?.id || currentStore?.storeId;

  const { data, error, isLoading, mutate } = useSWR(
    storeKey ? ['store-disputes-list', storeKey, currentPage] : null,
    () => getStoreDisputes(storeKey, { page: currentPage, size: pageSize }),
    { revalidateOnFocus: false }
  );

  // Tự suy luận loại khiếu nại nếu BE không set disputeType
  // Dựa vào 2 API resolve khác nhau:
  // - RETURN_REJECTION: /api/v1/admin/disputes/{disputeId}/resolve (khách hàng khiếu nại từ chối trả hàng)
  // - RETURN_QUALITY: /api/v1/admin/disputes/{disputeId}/resolve-quality (khiếu nại về chất lượng sản phẩm)
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

  // Filter disputes theo disputeType nếu có filter - sử dụng detectDisputeType để đảm bảo chính xác
  const allDisputes = data?.success ? (data.data?.content || data.data || []) : [];
  const disputes = disputeTypeFilter
    ? allDisputes.filter((d) => {
        const detectedType = detectDisputeType(d);
        return detectedType === disputeTypeFilter;
      })
    : allDisputes;
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

  const getDecisionLabel = (decision, dispute = null) => {
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
    
    // Store nhìn thấy rõ: chấp nhận / từ chối khiếu nại + ý nghĩa
    if (decision === 'APPROVE_RETURN') {
      return 'Chấp nhận khiếu nại của người mua (cho phép trả hàng)';
    }
    if (decision === 'REJECT_RETURN') {
      return 'Từ chối khiếu nại của người mua (từ chối trả hàng)';
    }
    if (decision === 'APPROVE_STORE') {
      return 'Khiếu nại thành công (hàng trả về không đạt)';
    }
    if (decision === 'REJECT_STORE') {
      return 'Khiếu nại thất bại (hàng trả về đạt)';
    }
    return decision;
  };

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
    <StoreLayout>
      <StoreStatusGuard currentStore={currentStore}>
        <SEO
          title="Khiếu nại | Store Dashboard"
          description="Quản lý khiếu nại của cửa hàng"
          keywords="khiếu nại, dispute, store"
        />
        <div className="space-y-6">
          {/* Header */}
          <div className="mb-8">
            <div className="relative bg-gradient-to-r from-cyan-200 to-blue-200 rounded-2xl p-6">
              {/* Status Badge - Top Right trong khung xanh dương */}
              {currentStore?.status && currentStore.status !== 'APPROVED' && (
                <div className="absolute top-4 right-4 z-10">
                  <div className={`px-4 py-2 rounded-full text-sm font-medium border shadow-md ${
                    currentStore.status === 'PENDING'
                      ? 'bg-yellow-100 text-yellow-800 border-yellow-300'
                      : currentStore.status === 'REJECTED'
                      ? 'bg-red-100 text-red-800 border-red-300'
                      : 'bg-gray-100 text-gray-800 border-gray-300'
                  }`}>
                    {currentStore.status === 'PENDING'
                      ? 'Chờ duyệt'
                      : currentStore.status === 'REJECTED'
                      ? 'Đã từ chối'
                      : currentStore.status}
                  </div>
                </div>
              )}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-400 rounded-xl flex items-center justify-center">
                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold">
                        <span className="text-cyan-600">Khiếu</span>{' '}
                        <span className="text-blue-600">nại</span>
                      </h1>
                      <p className="text-gray-600 mt-1">Quản lý và trao đổi với khách hàng về khiếu nại</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Link
                      to="/store-dashboard/returns"
                      className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg shadow-sm hover:bg-gray-100 transition"
                    >
                      ← Quay lại yêu cầu trả hàng
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

          {/* Tabs phân loại khiếu nại */}
          <div className="mb-6 bg-gradient-to-r from-white to-gray-50 rounded-2xl shadow-lg border border-gray-200 p-4">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setDisputeTypeFilter(null);
                  setCurrentPage(0);
                }}
                className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                  disputeTypeFilter === null
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md shadow-blue-200 transform scale-105'
                    : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 hover:shadow-sm'
                }`}
              >
                Tất cả
              </button>
              <button
                type="button"
                onClick={() => {
                  setDisputeTypeFilter('RETURN_QUALITY');
                  setCurrentPage(0);
                }}
                className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                  disputeTypeFilter === 'RETURN_QUALITY'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md shadow-blue-200 transform scale-105'
                    : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 hover:shadow-sm'
                }`}
              >
                Khiếu nại về chất lượng sản phẩm
              </button>
              <button
                type="button"
                onClick={() => {
                  setDisputeTypeFilter('RETURN_REJECTION');
                  setCurrentPage(0);
                }}
                className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                  disputeTypeFilter === 'RETURN_REJECTION'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md shadow-blue-200 transform scale-105'
                    : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 hover:shadow-sm'
                }`}
              >
                Khách hàng khiếu nại từ chối trả hàng
              </button>
            </div>
          </div>

          {/* Disputes List */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-lg p-6">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <p className="mt-2 text-gray-600">Đang tải...</p>
            </div>
          ) : disputes.length === 0 ? (
            <div className="p-12 text-center">
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
                {disputeTypeFilter
                  ? disputeTypeFilter === 'RETURN_QUALITY'
                    ? 'Bạn chưa có khiếu nại về chất lượng sản phẩm nào.'
                    : 'Bạn chưa có khiếu nại từ khách hàng về từ chối trả hàng nào.'
                  : 'Bạn chưa có khiếu nại nào.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {disputes.map((dispute) => {
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
                    className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-3 mb-3">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(
                            dispute.status
                          )}`}
                        >
                          {getStatusLabel(dispute.status)}
                        </span>
                        <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                          {getDisputeTypeLabel(detectDisputeType(dispute))}
                        </span>
                        <span className="text-sm text-gray-500">
                          {formatDate(dispute.createdAt)}
                        </span>
                        {orderCode && (
                          <span className="text-xs font-semibold text-blue-600">
                            Đơn hàng #{orderCode}
                          </span>
                        )}
                      </div>

                      <div className="mb-3">
                        <p className="text-sm text-gray-600 mb-2">
                          <span className="font-medium">Số tin nhắn:</span>{' '}
                          {dispute.messages?.length || 0}
                        </p>
                        {dispute.finalDecision && (
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Quyết định:</span>{' '}
                            <span className="font-semibold">{getDecisionLabel(dispute.finalDecision, dispute)}</span>
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <Link
                          to={`/store-dashboard/returns/disputes/${dispute.id || dispute._id}`}
                          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm"
                        >
                          Xem chi tiết & Chat
                        </Link>

                        {orderId && (
                          <Link
                            to={`/store-dashboard/orders/${orderId}`}
                            className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm font-semibold"
                          >
                            Xem chi tiết đơn hàng #{orderCode}
                          </Link>
                        )}

                        {dispute.returnRequest && (
                          <Link
                            to={`/store-dashboard/returns/${dispute.returnRequest.id || dispute.returnRequest._id || dispute.returnRequest}`}
                            className="text-sm text-blue-600 hover:underline"
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
      </div>
      </StoreStatusGuard>
    </StoreLayout>
  );
};

export default StoreDisputesPage;

