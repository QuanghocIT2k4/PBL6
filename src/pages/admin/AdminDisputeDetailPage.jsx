import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import useSWR from 'swr';
import { getAdminDisputeDetail, addAdminDisputeMessage, resolveDispute, resolveQualityDispute } from '../../services/admin/disputeService';
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
  const [isResolving, setIsResolving] = useState(false);
  const messagesEndRef = useRef(null);
  const infoSectionRef = useRef(null);
  const chatSectionRef = useRef(null);
  const [previewAttachment, setPreviewAttachment] = useState(null); // { url, type }

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

  const getDecisionLabel = (decision) => {
    // Map quyết định sang: Chấp nhận khiếu nại / Từ chối khiếu nại
    const acceptCodes = ['APPROVE_RETURN', 'REJECT_STORE'];
    const rejectCodes = ['REJECT_RETURN', 'APPROVE_STORE'];

    if (acceptCodes.includes(decision)) return 'Chấp nhận khiếu nại';
    if (rejectCodes.includes(decision)) return 'Từ chối khiếu nại';

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

    const confirmed = await confirmAction('giải quyết khiếu nại này');
    if (!confirmed) return;

    setIsResolving(true);
    try {
      // Xác định disputeType từ nhiều nguồn
      let disputeType = dispute.disputeType || dispute.dispute_type || dispute.type;
      
      // Xác định loại khiếu nại
      disputeType = detectDisputeType(dispute);
      
      console.log('🔍 [AdminDisputeDetailPage] Resolving dispute:', {
        disputeId,
        disputeType,
        decision,
        hasReason: !!adminNote,
        returnRequestStatus: dispute.returnRequest?.status,
      });

      let result;
      const decisionIsStore = decision === 'APPROVE_STORE' || decision === 'REJECT_STORE';
      const decisionIsReturn = decision === 'APPROVE_RETURN' || decision === 'REJECT_RETURN';

      // Chặn sai quyết định theo loại khiếu nại
      if (detectDisputeType(dispute) === 'RETURN_QUALITY' && decisionIsReturn) {
        showError('Đây là khiếu nại chất lượng hàng trả. Vui lòng chọn quyết định phù hợp (Chấp nhận/Từ chối hàng trả về).');
        setIsResolving(false);
        return;
      }
      if (detectDisputeType(dispute) === 'RETURN_REJECTION' && decisionIsStore) {
        showError('Đây là khiếu nại từ chối trả hàng. Vui lòng chọn quyết định phù hợp (Chấp nhận/Từ chối trả hàng).');
        setIsResolving(false);
        return;
      }

      if (decisionIsStore) {
        result = await resolveQualityDispute(disputeId, { decision, reason: adminNote });
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
        const decisionLabel = getDecisionLabel(decision);
        showSuccess(`Đã giải quyết khiếu nại: ${decisionLabel}`);
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

        {dispute.finalDecision && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800">
              <span className="font-medium">Kết quả khiếu nại:</span>{' '}
              {getDecisionLabel(dispute.finalDecision)}
            </p>
            {dispute.adminNote && (
              <p className="text-sm text-green-700 mt-1">{dispute.adminNote}</p>
            )}
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
                  onChange={(e) => setDecision(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Chọn quyết định</option>
                  {(() => {
                    const disputeType = dispute.disputeType || dispute.dispute_type || dispute.type;
                    const isReturnRejection = disputeType === 'RETURN_REJECTION' || 
                                             disputeType === 'ReturnRejection' ||
                                             dispute.returnRequest?.status === 'DISPUTED' ||
                                             (!disputeType && !dispute.dispute_type && !dispute.type); // Mặc định cho test
                    
                    if (detectDisputeType(dispute) === 'RETURN_QUALITY') {
                      return (
                        <>
                          <option value="APPROVE_STORE">
                            Khiếu nại thành công (hàng trả về không đạt)
                          </option>
                          <option value="REJECT_STORE">
                            Khiếu nại thất bại (hàng trả về đạt)
                          </option>
                        </>
                      );
                    }
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
                  disabled={!decision || !adminNote?.trim() || isResolving}
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

