import React from 'react';
import { getOrderCode } from '../../../utils/displayCodeUtils';

const getStatusLabel = (status) => {
  switch (status) {
    case 'PENDING':
      return 'Chờ xử lý';
    case 'APPROVED':
      return 'Đã chấp nhận';
    case 'REJECTED':
      return 'Đã từ chối';
    case 'RETURNING':
      return 'Đang trả hàng';
    case 'RETURNED':
      return 'Đã trả hàng';
    case 'REFUNDED':
      return 'Đã hoàn tiền';
    default:
      return status || 'Không xác định';
  }
};

const ReturnRequestDetailModal = ({ open, loading, data, onClose }) => {
  if (!open) return null;

  const fullId = data?.id || data?._id || '';
  const shortId = fullId ? fullId.slice(-6) : '';

  const media =
    data?.evidenceMedia ||
    data?.evidenceImages ||
    data?.evidenceFiles ||
    data?.evidenceUrls ||
    data?.evidences ||
    data?.attachments ||
    [];

  const renderMedia = (item, idx) => {
    const url = item?.url || item;
    if (!url) return null;
    const isVideo = /\.(mp4|mov|webm|ogg)$/i.test(url);
    if (isVideo) {
      return (
        <video
          key={idx}
          controls
          className="w-full max-w-xs rounded-lg border border-gray-200 shadow-sm bg-black"
        >
          <source src={url} />
          Trình duyệt không hỗ trợ video.
        </video>
      );
    }
    return (
      <img
        key={idx}
        src={url}
        alt={`evidence-${idx}`}
        className="w-full max-w-xs rounded-lg border border-gray-200 shadow-sm object-cover"
      />
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Chi tiết yêu cầu trả hàng {shortId && <span className="text-sm text-gray-500">#{shortId}</span>}
            </h3>
            {fullId && <p className="text-[11px] text-gray-400">ID đầy đủ: {fullId}</p>}
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100"
          >
            ✕
          </button>
        </div>

        {loading ? (
          <div className="p-6 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p className="mt-2 text-gray-600 text-sm">Đang tải...</p>
          </div>
        ) : (
          <div className="p-6 space-y-4 text-sm text-gray-800">
            {data && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <p className="text-xs text-gray-500 uppercase font-semibold">Mã yêu cầu</p>
                  <p className="mt-1 font-medium break-all">{shortId ? `#${shortId}` : 'N/A'}</p>
                </div>
                {data.order && (
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                    <p className="text-xs text-gray-500 uppercase font-semibold">Đơn hàng</p>
                    <p className="mt-1 font-medium break-all">
                      {(() => {
                        const orderId = data.orderNumber || data.order?.id || data.order?.orderId || data.order;
                        return orderId ? getOrderCode(orderId) : 'N/A';
                      })()}
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <p className="text-xs text-gray-500 uppercase font-semibold">Lý do</p>
                <p className="mt-1 font-medium">{data?.reason || 'N/A'}</p>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <p className="text-xs text-gray-500 uppercase font-semibold">Trạng thái</p>
                <p className="mt-1 font-medium">{getStatusLabel(data?.status)}</p>
              </div>
            </div>

            {data?.description && (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <p className="text-xs text-gray-500 uppercase font-semibold">Mô tả</p>
                <p className="mt-1">{data.description}</p>
              </div>
            )}

            {/* Thông tin hoàn tiền 1 phần (nếu có) */}
            {(typeof data?.partialRefundToBuyer === 'number' && data.partialRefundToBuyer > 0) ||
              (typeof data?.partialRefundToStore === 'number' && data.partialRefundToStore > 0) ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-1">
                <p className="text-xs text-emerald-700 uppercase font-semibold">
                  Thông tin hoàn tiền một phần
                </p>
                {typeof data.partialRefundToBuyer === 'number' && data.partialRefundToBuyer > 0 && (
                  <p className="text-sm text-emerald-800">
                    <span className="font-medium">Hoàn cho người mua:</span>{' '}
                    <span className="font-semibold">
                      {new Intl.NumberFormat('vi-VN', {
                        style: 'currency',
                        currency: 'VND',
                      }).format(data.partialRefundToBuyer)}
                    </span>
                  </p>
                )}
                {typeof data.partialRefundToStore === 'number' && data.partialRefundToStore > 0 && (
                  <p className="text-sm text-emerald-800">
                    <span className="font-medium">Hoàn lại cho cửa hàng:</span>{' '}
                    <span className="font-semibold">
                      {new Intl.NumberFormat('vi-VN', {
                        style: 'currency',
                        currency: 'VND',
                      }).format(data.partialRefundToStore)}
                    </span>
                  </p>
                )}
              </div>
            ) : null}

            {(media && media.length > 0) && (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <p className="text-xs text-gray-500 uppercase font-semibold mb-3">Ảnh/Video minh chứng</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {media.map((item, idx) => renderMedia(item, idx))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReturnRequestDetailModal;

