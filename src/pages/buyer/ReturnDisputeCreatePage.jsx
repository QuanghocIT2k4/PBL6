import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import MainLayout from '../../layouts/MainLayout';
import SEO from '../../components/seo/SEO';
import { createDispute } from '../../services/buyer/returnService';
import { useToast } from '../../context/ToastContext';

const ReturnDisputeCreatePage = () => {
  const { returnRequestId } = useParams();
  const { success, error: showError } = useToast();
  const navigate = useNavigate();

  const [content, setContent] = useState('');
  const [files, setFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const handleFiles = (e) => {
    const selected = Array.from(e.target.files || []);
    if (selected.length === 0) return;

    // Gộp với các file đã chọn trước (nếu có) và giới hạn tối đa 5 file
    setFiles((prev) => {
      const merged = [...prev, ...selected];
      return merged.slice(0, 5);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!returnRequestId) {
      showError('Thiếu ID yêu cầu trả hàng. Vui lòng quay lại và thử lại.');
      return;
    }
    if (!content.trim()) {
      showError('Vui lòng nhập nội dung khiếu nại');
      return;
    }

    setSubmitting(true);
    const result = await createDispute(returnRequestId, {
      content: content.trim(),
      attachmentFiles: files,
    });
    setSubmitting(false);

    if (result.success) {
      success('Đã gửi khiếu nại');
      navigate('/orders/disputes');
    } else {
      showError(result.error || 'Không thể tạo khiếu nại');
    }
  };

  return (
    <MainLayout>
      <SEO
        title="Gửi khiếu nại | E-Comm"
        description="Gửi khiếu nại về yêu cầu trả hàng của bạn"
        keywords="khiếu nại, trả hàng, return dispute"
        url={`https://pbl-6-eight.vercel.app/orders/returns/${returnRequestId || ''}/dispute`}
      />
      <div className="bg-gradient-to-b from-slate-50 via-white to-white min-h-screen py-10">
        <div className="max-w-3xl mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sm:p-8">
            <div className="mb-6">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 text-orange-700 text-xs font-semibold uppercase tracking-wide">
                Khiếu nại
              </span>
              <h1 className="mt-2 text-2xl sm:text-3xl font-bold text-gray-900">
                Gửi khiếu nại về yêu cầu trả hàng
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                Nếu bạn không đồng ý với phản hồi của shop, hãy mô tả rõ lý do và đính kèm minh chứng (nếu có).
              </p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-800">
                  Nội dung khiếu nại <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={6}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 shadow-sm transition"
                  placeholder="Mô tả lý do bạn không đồng ý với phản hồi của shop, tình trạng sản phẩm, trao đổi trước đó, v.v."
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-800">
                  Ảnh / video minh chứng (tối đa 5 file, nếu có)
                </label>
                <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-600 space-y-2">
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    onChange={handleFiles}
                    className="block w-full text-sm text-gray-700"
                  />
                  {files.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs text-gray-500">
                        Đã chọn {files.length} / 5 file:
                      </p>
                      <ul className="text-xs text-gray-600 space-y-0.5">
                        {files.map((file, idx) => (
                          <li key={idx} className="flex items-center justify-between gap-2">
                            <span className="truncate max-w-xs">{file.name}</span>
                            <button
                              type="button"
                              className="text-red-500 hover:underline"
                              onClick={() =>
                                setFiles((prev) => prev.filter((_, i) => i !== idx))
                              }
                            >
                              Xoá
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submitting || !returnRequestId}
                  className="px-5 py-2.5 bg-orange-600 text-white rounded-xl hover:bg-orange-700 disabled:opacity-60 shadow-sm"
                >
                  {submitting ? 'Đang gửi...' : 'Gửi khiếu nại'}
                </button>
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 shadow-sm"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default ReturnDisputeCreatePage;


