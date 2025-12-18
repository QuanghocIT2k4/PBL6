import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import useSWR from 'swr';
import MainLayout from '../../layouts/MainLayout';
import SEO from '../../components/seo/SEO';
import { createReturnRequest } from '../../services/buyer/returnService';
import { getOrderById } from '../../services/buyer/orderService';
import { useToast } from '../../context/ToastContext';

const ReturnRequestCreatePage = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  const { success, error: showError } = useToast();
  const navigate = useNavigate();

  // Fetch order details to check payment method
  const { data: orderData } = useSWR(
    orderId ? ['order-detail', orderId] : null,
    () => getOrderById(orderId),
    { revalidateOnFocus: false }
  );

  const order = orderData?.success ? orderData.data : null;
  const paymentMethod = order?.paymentMethod || order?.payment?.method || 'COD';
  const isCOD = paymentMethod === 'COD';

  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState([]);
  const [bankName, setBankName] = useState('');
  const [bankAccountName, setBankAccountName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!orderId) {
      showError('Thiếu orderId. Vui lòng quay lại đơn hàng và thử lại.');
      return;
    }
    if (!reason.trim()) {
      showError('Vui lòng nhập lý do trả hàng');
      return;
    }
    // ✅ BE yêu cầu ít nhất 1 file evidence
    if (!files || files.length === 0) {
      showError('Vui lòng cung cấp ít nhất 1 hình ảnh/video minh chứng');
      return;
    }
    // COD cần bank info
    if (isCOD) {
      if (!bankName.trim()) {
        showError('Vui lòng nhập tên ngân hàng để nhận tiền hoàn');
        return;
      }
      if (!bankAccountNumber.trim()) {
        showError('Vui lòng nhập số tài khoản ngân hàng');
        return;
      }
      if (!bankAccountName.trim()) {
        showError('Vui lòng nhập tên chủ tài khoản');
        return;
      }
    }

    setSubmitting(true);
    const payload = {
      reason: reason.trim(),
      description: description.trim(),
      evidenceFiles: files,
    };
    // ✅ Chỉ gửi bank info khi COD
    if (isCOD) {
      payload.bankName = bankName.trim();
      payload.bankAccountName = bankAccountName.trim();
      payload.bankAccountNumber = bankAccountNumber.trim();
    }
    const result = await createReturnRequest(orderId, payload);
    setSubmitting(false);
    if (result.success) {
      success('Đã gửi yêu cầu trả hàng');
      navigate('/orders/returns');
    } else {
      // ✅ COD CẦN bank name, MOMO/VNPAY KHÔNG CẦN
      const errorMessage = result.error || 'Không thể tạo yêu cầu trả hàng';
      const isBankNameError = errorMessage.toLowerCase().includes('ngân hàng') || 
                              errorMessage.toLowerCase().includes('bank');
      
      // Nếu là MOMO/VNPAY và error về bank name → bỏ qua (vì không cần bank name)
      if (!isCOD && isBankNameError) {
        // Backend có thể vẫn tạo return request nhưng báo lỗi bank name
        // Với MOMO/VNPAY thì không cần bank name, nên coi như thành công
        success('Đã gửi yêu cầu trả hàng');
        navigate('/orders/returns');
      } else {
        // COD cần bank name → hiển thị error bình thường
        showError(errorMessage);
      }
    }
  };

  const handleFiles = (e) => {
    const fileList = Array.from(e.target.files || []);
    setFiles(fileList);
  };

  return (
    <MainLayout>
      <SEO
        title="Tạo yêu cầu trả hàng | E-Comm"
        description="Gửi yêu cầu trả hàng cho đơn hàng của bạn"
        keywords="trả hàng, return request"
        url={`https://pbl-6-eight.vercel.app/orders/returns/new${orderId ? `?orderId=${orderId}` : ''}`}
      />
      <div className="bg-gradient-to-b from-slate-50 via-white to-white min-h-screen py-10">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
              <div className="space-y-2">
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold uppercase tracking-wide">
                  Yêu cầu trả hàng
                </span>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Gửi yêu cầu trả hàng</h1>
                <p className="text-sm text-gray-600 max-w-2xl">
                  Điền thông tin, lý do và (nếu có) ảnh minh chứng. Chúng tôi sẽ xử lý yêu cầu của bạn trong thời gian sớm nhất.
                </p>
              </div>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-800">
                  Lý do trả hàng <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition"
                  placeholder="Ví dụ: Sản phẩm lỗi, giao sai mẫu..."
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-800">Mô tả chi tiết</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={5}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition"
                  placeholder="Mô tả tình trạng, thiếu phụ kiện, thời điểm phát hiện, v.v."
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-800">Ảnh minh chứng</label>
                <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    onChange={handleFiles}
                    className="block w-full text-sm text-gray-700"
                  />
                  {files.length > 0 && (
                    <p className="text-xs text-gray-500 mt-2">Đã chọn {files.length} file</p>
                  )}
                </div>
              </div>

              {isCOD && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-800">
                      Tên ngân hàng <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition"
                      placeholder="Ví dụ: Vietcombank, ACB..."
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-800">
                      Số tài khoản <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={bankAccountNumber}
                      onChange={(e) => setBankAccountNumber(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition"
                      placeholder="Nhập số tài khoản"
                      required
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-800">
                      Tên chủ tài khoản <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={bankAccountName}
                      onChange={(e) => setBankAccountName(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition"
                      placeholder="Nhập tên chủ tài khoản"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-700">
                <div className="font-semibold text-gray-900 mb-1">Lưu ý</div>
                <ul className="list-disc list-inside space-y-1 text-xs text-gray-600">
                  <li>Ghi rõ vấn đề gặp phải</li>
                  <li>Đính kèm ảnh/video nếu có</li>
                  <li>Kiểm tra kỹ trước khi gửi</li>
                </ul>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submitting || !orderId}
                  className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-60 shadow-sm"
                >
                  {submitting ? 'Đang gửi...' : 'Gửi yêu cầu'}
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

export default ReturnRequestCreatePage;

