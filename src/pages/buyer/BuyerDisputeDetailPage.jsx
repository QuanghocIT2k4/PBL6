import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import useSWR from 'swr';
import MainLayout from '../../layouts/MainLayout';
import { getDisputeDetail, addDisputeMessage } from '../../services/buyer/disputeService';
import { useToast } from '../../context/ToastContext';
import SEO from '../../components/seo/SEO';
import { confirmAction } from '../../utils/sweetalert';

const BuyerDisputeDetailPage = () => {
  const { disputeId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { success: showSuccess, error: showError } = useToast();
  const [messageContent, setMessageContent] = useState('');
  const [attachmentFiles, setAttachmentFiles] = useState([]);
  const [previewAttachment, setPreviewAttachment] = useState(null); // { url, type }
  const infoSectionRef = useRef(null);
  const chatSectionRef = useRef(null);

  // Xác định view mode: 'detail' | 'chat' (mặc định chat)
  const searchParams = new URLSearchParams(location.search);
  const viewMode = searchParams.get('view') === 'detail' ? 'detail' : 'chat';

  const { data, error, isLoading, mutate } = useSWR(
    ['buyer-dispute-detail', disputeId],
    () => getDisputeDetail(disputeId),
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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    setAttachmentFiles(files);
  };

  const handleSubmitMessage = async (e) => {
    e.preventDefault();
    if (!messageContent.trim()) {
      showError('Vui lòng nhập nội dung tin nhắn');
      return;
    }

    const result = await addDisputeMessage(disputeId, {
      content: messageContent,
      attachmentFiles,
    });

    if (result.success) {
      showSuccess('Đã gửi tin nhắn');
      setMessageContent('');
      setAttachmentFiles([]);
      // Refresh ngay lập tức để hiển thị tin nhắn mới
      mutate();
      // Scroll xuống tin nhắn cuối cùng
      setTimeout(() => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      }, 100);
    } else {
      showError(result.error || 'Không thể gửi tin nhắn');
    }
  };

  // Scroll theo query ?view=detail|chat
  useEffect(() => {
    if (!dispute) return;

    if (viewMode === 'chat' && chatSectionRef.current) {
      chatSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (viewMode === 'detail' && infoSectionRef.current) {
      infoSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [dispute, viewMode]);

  if (error || (data && !data.success)) {
    return (
      <MainLayout>
        <div className="bg-gray-50 min-h-screen py-6">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <p className="text-red-600">
                {error || (data && data.error) || 'Không thể tải chi tiết khiếu nại'}
              </p>
              <Link
                to="/orders/disputes"
                className="mt-4 inline-block px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
              >
                Quay lại danh sách khiếu nại
              </Link>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <SEO
        title="Chi tiết khiếu nại | E-Comm"
        description="Xem chi tiết khiếu nại của bạn"
        keywords="khiếu nại, chi tiết khiếu nại"
        url={`https://pbl-6-eight.vercel.app/orders/disputes/${disputeId}`}
      />
      <div className="bg-gray-50 min-h-screen py-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Chi tiết khiếu nại</h1>
              <p className="text-gray-600">Xem và quản lý khiếu nại của bạn</p>
            </div>
            <Link
              to="/orders/disputes"
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
            >
              ← Quay lại
            </Link>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <p className="mt-2 text-gray-600">Đang tải...</p>
            </div>
          ) : dispute ? (
            <div className="space-y-6">
              {/* Dispute Info Card */}
              <div ref={infoSectionRef} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center gap-3 mb-4">
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
                </div>

                <div className="space-y-3 text-sm">
                  {dispute.returnRequest && (
                    <div>
                      <span className="font-semibold text-gray-700">Yêu cầu trả hàng:</span>{' '}
                      <Link
                        to={`/orders/returns/${dispute.returnRequest.id || dispute.returnRequest._id || dispute.returnRequest}`}
                        className="text-blue-600 hover:underline"
                      >
                        Xem chi tiết →
                      </Link>
                    </div>
                  )}
                  {dispute.finalDecision && (
                    <div className="space-y-2">
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <span className="font-semibold text-gray-700">Kết quả:</span>{' '}
                        <span className="font-semibold text-green-700">
                          {getComplaintResult(dispute) || dispute.finalDecision}
                        </span>
                      </div>

                      {/* Nếu có thông tin hoàn tiền một phần thì show rõ cho buyer */}
                      {(typeof dispute.partialRefundAmount === 'number' && dispute.partialRefundAmount > 0) ||
                        (dispute.returnRequest &&
                          typeof dispute.returnRequest.partialRefundToBuyer === 'number' &&
                          dispute.returnRequest.partialRefundToBuyer > 0) ? (
                        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm">
                          <p className="font-semibold text-emerald-800 mb-1">
                            Thông tin hoàn tiền một phần
                          </p>
                          {typeof dispute.partialRefundAmount === 'number' && dispute.partialRefundAmount > 0 && (
                            <p className="text-emerald-800">
                              <span className="font-medium">Số tiền hoàn một phần cho bạn:</span>{' '}
                              <span className="font-semibold">
                                {formatCurrency(dispute.partialRefundAmount)}
                              </span>
                            </p>
                          )}
                          {dispute.returnRequest &&
                            typeof dispute.returnRequest.partialRefundToBuyer === 'number' &&
                            dispute.returnRequest.partialRefundToBuyer > 0 && (
                              <p className="text-emerald-800">
                                <span className="font-medium">Đã ghi nhận vào yêu cầu trả hàng:</span>{' '}
                                <span className="font-semibold">
                                  {formatCurrency(dispute.returnRequest.partialRefundToBuyer)}
                                </span>
                              </p>
                            )}
                        </div>
                      ) : null}
                    </div>
                  )}
                  
                  {/* Thông báo khi 2 bên tự thống nhất */}
                  {dispute.status === 'OPEN' && dispute.disputeType === 'RETURN_REJECTION' && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800 mb-2">
                        💡 <strong>Lưu ý:</strong> Nếu bạn và cửa hàng đã thống nhất:
                      </p>
                      <ul className="text-xs text-yellow-700 space-y-1 list-disc list-inside">
                        <li><strong>Người mua thắng:</strong> Yêu cầu cửa hàng chấp nhận lại yêu cầu trả hàng (cửa hàng sẽ bấm "Chấp nhận" trong trang "Yêu cầu trả hàng")</li>
                        <li><strong>Người bán thắng:</strong> Gửi tin nhắn xác nhận rút khiếu nại, sau đó Admin sẽ vào giải quyết để đóng khiếu nại</li>
                      </ul>
                      <button
                        onClick={async () => {
                          const confirmed = await confirmAction('gửi tin nhắn xác nhận rút khiếu nại và giữ hàng? Admin sẽ vào giải quyết để đóng khiếu nại');
                          if (confirmed) {
                            const result = await addDisputeMessage(disputeId, {
                              content: 'Tôi đồng ý rút khiếu nại và giữ hàng. Cảm ơn cửa hàng đã giải thích.',
                              attachmentFiles: [],
                            });
                            if (result.success) {
                              showSuccess('Đã gửi tin nhắn xác nhận rút khiếu nại. Vui lòng chờ Admin giải quyết.');
                              mutate();
                            } else {
                              showError(result.error || 'Không thể gửi tin nhắn');
                            }
                          }
                        }}
                        className="mt-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition text-sm"
                      >
                        Gửi tin nhắn xác nhận rút khiếu nại
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Messages Section - luôn hiển thị, nhưng nút Xem chi tiết / Xem đoạn chat chỉ scroll tới phần tương ứng */}
              <div ref={chatSectionRef} className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Tin nhắn ({dispute.messages?.length || 0})
                </h2>

                {dispute.messages && dispute.messages.length > 0 ? (
                  <div className="space-y-4 mb-6 max-h-96 overflow-y-auto" id="messages-container">
                    {dispute.messages.map((message, index) => {
                      // BE trả về senderType, không phải sender
                      const senderType = message.senderType || message.sender;
                      const isBuyer = senderType === 'BUYER';
                      const isAdmin = senderType === 'ADMIN';
                      const senderName = message.senderName || (isBuyer ? 'Bạn' : isAdmin ? 'Admin' : 'Cửa hàng');
                      const sentAt = message.sentAt || message.createdAt;

                      let containerClasses = 'p-4 rounded-lg border max-w-[80%]';
                      let nameClasses = 'text-xs font-medium';
                      let prefix = '';

                      if (isAdmin) {
                        containerClasses += ' bg-yellow-50 border-yellow-200 mx-auto';
                        nameClasses += ' text-yellow-800';
                        prefix = '👑 Admin - ';
                      } else if (isBuyer) {
                        containerClasses += ' bg-blue-50 border-blue-200 ml-auto';
                        nameClasses += ' text-blue-700';
                        prefix = '👤 ';
                      } else {
                        containerClasses += ' bg-gray-50 border-gray-200 mr-auto';
                        nameClasses += ' text-gray-700';
                        prefix = '🏪 ';
                      }

                      const attachments =
                        message.attachments ||
                        message.attachmentUrls ||
                        message.media ||
                        [];

                      return (
                        <div key={index} className={containerClasses}>
                          <div className="flex items-center justify-between mb-2">
                            <span className={nameClasses}>
                              {prefix}{senderName}
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatDate(sentAt)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-800 whitespace-pre-wrap break-words">{message.content}</p>

                          {/* File đính kèm theo từng tin nhắn */}
                          {attachments && attachments.length > 0 && (
                            <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                              {attachments.map((att, i) => {
                                const url =
                                  typeof att === 'string'
                                    ? att
                                    : att.url || att.downloadUrl || att;
                                const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
                                const isVideo = /\.(mp4|webm|ogg)$/i.test(url);

                                return (
                                  <button
                                    key={i}
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
                                        alt={`Attachment ${i + 1}`}
                                        className="w-full h-28 object-contain bg-black/5"
                                      />
                                    ) : isVideo ? (
                                      <div className="w-full h-28 flex items-center justify-center bg-black bg-opacity-60 text-white text-sm">
                                        Video
                                      </div>
                                    ) : (
                                      <div className="w-full h-28 flex items-center justify-center text-2xl">
                                        📎
                                      </div>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm mb-6">Chưa có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện!</p>
                )}

                {/* Hiển thị attachments ở root level của dispute */}
                {dispute.attachments && dispute.attachments.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Hình ảnh / Video đính kèm:</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {dispute.attachments.map((attachment, idx) => {
                        const url = typeof attachment === 'string' ? attachment : (attachment.url || attachment);
                        const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
                        const isVideo = /\.(mp4|webm|ogg)$/i.test(url);
                        
                        return (
                          <div key={idx} className="relative group">
                            {isImage ? (
                              <button
                                type="button"
                                onClick={() => setPreviewAttachment({ url, type: 'image' })}
                                className="block aspect-square rounded-lg overflow-hidden border border-gray-200 hover:border-blue-400 transition cursor-zoom-in bg-black/5"
                              >
                                <img
                                  src={url}
                                  alt={`Attachment ${idx + 1}`}
                                  className="w-full h-full object-contain"
                                />
                              </button>
                            ) : isVideo ? (
                              <button
                                type="button"
                                onClick={() => setPreviewAttachment({ url, type: 'video' })}
                                className="block aspect-square rounded-lg overflow-hidden border border-gray-200 hover:border-blue-400 transition bg-gray-100 flex items-center justify-center cursor-zoom-in"
                              >
                                <span className="text-white text-2xl bg-black/50 px-3 py-1 rounded-full">
                                  ▶
                                </span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setPreviewAttachment({ url, type: 'file' })}
                                className="block aspect-square rounded-lg overflow-hidden border border-gray-200 hover:border-blue-400 transition bg-gray-100 flex items-center justify-center cursor-zoom-in"
                              >
                                <span className="text-gray-600 text-3xl">📎</span>
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Add Message Form */}
                {dispute.status !== 'CLOSED' && dispute.status !== 'RESOLVED' && (
                  <form onSubmit={handleSubmitMessage} className="border-t pt-4">
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Gửi tin nhắn
                      </label>
                      <textarea
                        value={messageContent}
                        onChange={(e) => setMessageContent(e.target.value)}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Nhập nội dung tin nhắn..."
                      />
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Đính kèm file (tùy chọn)
                      </label>
                      <input
                        type="file"
                        multiple
                        accept="image/*,video/*"
                        onChange={handleFileChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      {attachmentFiles.length > 0 && (
                        <p className="mt-2 text-sm text-gray-600">
                          Đã chọn {attachmentFiles.length} file
                        </p>
                      )}
                    </div>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                    >
                      Gửi tin nhắn
                    </button>
                  </form>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>

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
    </MainLayout>
  );
};

export default BuyerDisputeDetailPage;

