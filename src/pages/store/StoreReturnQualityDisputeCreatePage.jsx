import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import useSWR from 'swr';
import StoreLayout from '../../layouts/StoreLayout';
import StoreStatusGuard from '../../components/store/StoreStatusGuard';
import { useStoreContext } from '../../context/StoreContext';
import { useToast } from '../../context/ToastContext';
import { getStoreReturnRequestDetail, disputeQuality } from '../../services/b2c/returnService';

const StoreReturnQualityDisputeCreatePage = () => {
  const navigate = useNavigate();
  const { returnRequestId } = useParams();
  const { currentStore } = useStoreContext();
  const { success: showSuccess, error: showError } = useToast();

  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Lấy thông tin yêu cầu trả hàng để hiển thị ngắn gọn
  const { data, isLoading } = useSWR(
    currentStore?.id && returnRequestId
      ? ['store-return-request-detail-quality', currentStore.id, returnRequestId]
      : null,
    () => getStoreReturnRequestDetail(currentStore.id, returnRequestId),
    { revalidateOnFocus: false }
  );

  const returnRequest = data?.success ? (data.data || data) : null;

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files || []);
    setFiles(selected);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentStore?.id) {
      showError('Không xác định được cửa hàng');
      return;
    }
    if (!reason.trim()) {
      showError('Vui lòng nhập lý do khiếu nại');
      return;
    }
    if (files.length === 0) {
      showError('Vui lòng đính kèm ít nhất 1 hình ảnh / video minh chứng');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await disputeQuality(currentStore.id, returnRequestId, {
        reason: reason.trim(),
        description: description.trim(),
        evidenceFiles: files,
      });

      if (result.success) {
        showSuccess('Đã tạo khiếu nại chất lượng hàng trả');
        // Sau khi tạo khiếu nại, chuyển sang trang khiếu nại của Store
        navigate('/store-dashboard/disputes');
      } else {
        showError(result.error || 'Không thể tạo khiếu nại chất lượng');
      }
    } catch (err) {
      console.error('Error creating quality dispute:', err);
      showError('Có lỗi xảy ra khi tạo khiếu nại chất lượng');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <StoreLayout>
      <StoreStatusGuard currentStore={currentStore}>
        <div className="bg-gray-50 min-h-screen py-6">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">
                  Khiếu nại chất lượng hàng trả
                </h1>
                <p className="text-gray-600 text-sm">
                  Gửi khiếu nại tới Admin nếu hàng trả về không đúng tình trạng ban đầu.
                </p>
              </div>
              <Link
                to="/store-dashboard/returns"
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm"
              >
                ← Quay lại yêu cầu trả hàng
              </Link>
            </div>

            {/* Thông tin yêu cầu trả hàng */}
            <div className="mb-6">
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                {isLoading ? (
                  <p className="text-sm text-gray-500">Đang tải thông tin yêu cầu trả hàng...</p>
                ) : returnRequest ? (
                  <div className="space-y-1 text-sm text-gray-700">
                    <p>
                      <span className="font-semibold">Lý do trả hàng:</span>{' '}
                      {returnRequest.reason}
                    </p>
                    {returnRequest.description && (
                      <p>
                        <span className="font-semibold">Mô tả của khách:</span>{' '}
                        {returnRequest.description}
                      </p>
                    )}
                    <p>
                      <span className="font-semibold">Số tiền hoàn dự kiến:</span>{' '}
                      <span className="text-green-600 font-bold">
                        {new Intl.NumberFormat('vi-VN', {
                          style: 'currency',
                          currency: 'VND',
                        }).format(returnRequest.refundAmount || 0)}
                      </span>
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-red-500">
                    Không thể tải thông tin yêu cầu trả hàng. Bạn vẫn có thể tiếp tục gửi khiếu nại,
                    nhưng nên kiểm tra lại sau.
                  </p>
                )}
              </div>
            </div>

            {/* Form khiếu nại */}
            <form
              onSubmit={handleSubmit}
              className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lý do khiếu nại <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Ví dụ: Hàng trả về bị hư hỏng, thiếu phụ kiện, đổi sang hàng khác..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mô tả chi tiết
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Mô tả rõ tình trạng hàng nhận lại, phần nào bị hỏng, thiếu gì, so sánh với lúc giao cho khách..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hình ảnh / Video minh chứng <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Nên chụp rõ tình trạng sản phẩm, bao bì, phụ kiện đi kèm để Admin có đủ thông tin
                  đánh giá.
                </p>
                {files.length > 0 && (
                  <p className="mt-1 text-xs text-gray-600">
                    Đã chọn <span className="font-semibold">{files.length}</span> file.
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm rounded-lg bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50"
                >
                  {isSubmitting ? 'Đang gửi...' : 'Gửi khiếu nại chất lượng'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </StoreStatusGuard>
    </StoreLayout>
  );
};

export default StoreReturnQualityDisputeCreatePage;


