import { useState } from 'react';
import { Link } from 'react-router-dom';
import useSWR from 'swr';
import { getAdminDisputes } from '../../services/admin/disputeService';
import { useToast } from '../../context/ToastContext';

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

  // Kết quả khiếu nại: Chấp nhận khiếu nại / Từ chối khiếu nại
  const getComplaintResult = (dispute) => {
    const decision = dispute.finalDecision;
    if (!decision) return null;

    const type = dispute.disputeType || dispute.dispute_type || dispute.type;

    // Nhóm quyết định theo ý nghĩa chung
    const acceptCodes = ['APPROVE_RETURN', 'REJECT_STORE'];
    const rejectCodes = ['REJECT_RETURN', 'APPROVE_STORE'];

    if (acceptCodes.includes(decision)) return 'Chấp nhận khiếu nại';
    if (rejectCodes.includes(decision)) return 'Từ chối khiếu nại';

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


  if (error) {
    showError('Không thể tải danh sách khiếu nại');
  }

  return (
    <>
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Quản lý khiếu nại
        </h1>
        <p className="text-gray-600 mb-4">Giải quyết các khiếu nại giữa người mua và cửa hàng</p>

        {/* Tabs phân loại người khởi tạo khiếu nại */}
        <div className="inline-flex rounded-lg border border-gray-200 bg-white overflow-hidden text-sm mb-2">
          <button
            type="button"
            onClick={() => {
              setInitiatorTab('BUYER_DISPUTES');
              setDisputeTypeFilter('RETURN_REJECTION');
              setCurrentPage(0);
            }}
            className={`px-4 py-2 border-r border-gray-200 ${
              initiatorTab === 'BUYER_DISPUTES'
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
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
            className={`px-4 py-2 ${
              initiatorTab === 'STORE_DISPUTES'
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Cửa hàng
          </button>
        </div>
      </div>

          {/* Filters */}
          <div className="mb-6 flex gap-2 flex-wrap">
            <button
              onClick={() => {
                setStatusFilter(null);
                // Reset dispute type theo tab hiện tại
                setDisputeTypeFilter(
                  initiatorTab === 'STORE_DISPUTES' ? 'RETURN_QUALITY' : 'RETURN_REJECTION'
                );
              }}
              className={`px-4 py-2 rounded-lg transition ${
                statusFilter === null && disputeTypeFilter === null
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Tất cả
            </button>
            {['OPEN', 'IN_REVIEW', 'RESOLVED'].map((status) => (
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
            {/* Không cần nút filter loại khiếu nại nữa vì tab trên đã phân tách */}
          </div>

          {/* Disputes List */}
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <p className="mt-2 text-gray-600">Đang tải...</p>
            </div>
          ) : disputes.length === 0 ? (
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
                Hiện tại không có khiếu nại nào cần xử lý.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {disputes.map((dispute) => (
                <div
                  key={dispute.id || dispute._id}
                  className="bg-white rounded-lg shadow p-6 hover:shadow-md transition"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(
                            dispute.status
                          )}`}
                        >
                          {getStatusLabel(dispute.status)}
                        </span>
                        <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                          {getDisputeTypeLabel(dispute.disputeType)}
                        </span>
                        <span className="text-sm text-gray-500">
                          {formatDate(dispute.createdAt)}
                        </span>
                      </div>

                      <div className="mb-3">
                        <p className="text-sm text-gray-600 mb-1">
                          <span className="font-medium">Số tin nhắn:</span>{' '}
                          {dispute.messages?.length || 0}
                        </p>
                        <p className="text-sm text-gray-600 mb-1">
                          <span className="font-medium">Người khởi tạo khiếu nại:</span>{' '}
                          {getInitiatorLabel(dispute, initiatorTab)}
                        </p>
                        {dispute.buyer && (
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Người mua:</span>{' '}
                            {dispute.buyer.name || dispute.buyer.email || 'N/A'}
                          </p>
                        )}
                        {dispute.store && (
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Cửa hàng:</span>{' '}
                            {dispute.store.storeName || dispute.store.name || 'N/A'}
                          </p>
                        )}
                        {dispute.finalDecision && (
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Kết quả:</span>{' '}
                            <span className="font-semibold">{getComplaintResult(dispute) || dispute.finalDecision}</span>
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 mt-2">
                        {/* Gộp chi tiết + đoạn chat vào cùng một màn */}
                        <Link
                          to={`/admin-dashboard/disputes/${dispute.id || dispute._id}`}
                          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm"
                        >
                          Xem & xử lý khiếu nại
                        </Link>
                      </div>
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

    </>
  );
};

export default AdminDisputesPage;


