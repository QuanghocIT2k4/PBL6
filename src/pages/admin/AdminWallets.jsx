import { useState, useEffect } from 'react';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import { useToast } from '../../context/ToastContext';
import Swal from 'sweetalert2';
import {
  getAllWithdrawalRequests,
  approveWithdrawal,
  completeWithdrawal,
  rejectWithdrawal,
  formatCurrency,
  getWithdrawalStatusBadge,
} from '../../services/admin/adminWalletService';
import { refundPayment } from '../../services/buyer/paymentService';

const AdminWallets = () => {
  const { success, error: showError } = useToast();
  
  const [loading, setLoading] = useState(true);
  
  // Withdrawal requests
  const [withdrawals, setWithdrawals] = useState([]);
  const [withdrawalFilter, setWithdrawalFilter] = useState('PENDING'); // ALL, PENDING, APPROVED, REJECTED
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [approveNote, setApproveNote] = useState('');
  const [completeNote, setCompleteNote] = useState('');
  const [processing, setProcessing] = useState(false);
  
  // Refund form
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundForm, setRefundForm] = useState({
    orderId: '',
    amount: '',
    transactionDate: '',
    createdBy: '',
    ipAddress: '',
    transactionType: '02', // 02 = Full refund, 03 = Partial refund
  });

  useEffect(() => {
    loadData();
  }, [withdrawalFilter]);

  const loadData = async () => {
    setLoading(true);
    
    try {
      const result = await getAllWithdrawalRequests({
        page: 0,
        size: 20,
        status: withdrawalFilter === 'ALL' ? undefined : withdrawalFilter,
      });
      
      if (result.success) {
        setWithdrawals(result.data.content || result.data || []);
      }
    } catch (err) {
      console.error('Error loading data:', err);
      showError('Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedWithdrawal) return;
    
    setProcessing(true);
    
    try {
      const result = await approveWithdrawal(selectedWithdrawal.id, approveNote);
      
      if (result.success) {
        success('Đã duyệt yêu cầu rút tiền!');
        setShowApproveModal(false);
        setApproveNote('');
        setSelectedWithdrawal(null);
        loadData();
      } else {
        showError(result.error);
      }
    } catch (err) {
      console.error('Error approving withdrawal:', err);
      showError('Không thể duyệt yêu cầu');
    } finally {
      setProcessing(false);
    }
  };

  const handleComplete = async () => {
    if (!selectedWithdrawal) return;
    
    setProcessing(true);
    
    try {
      const result = await completeWithdrawal(selectedWithdrawal.id, completeNote);
      
      if (result.success) {
        success('Đã hoàn tất chuyển tiền!');
        setShowCompleteModal(false);
        setCompleteNote('');
        setSelectedWithdrawal(null);
        loadData();
      } else {
        showError(result.error);
      }
    } catch (err) {
      console.error('Error completing withdrawal:', err);
      showError('Không thể hoàn tất rút tiền');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedWithdrawal || !rejectReason.trim()) {
      showError('Vui lòng nhập lý do từ chối');
      return;
    }
    
    setProcessing(true);
    
    try {
      const result = await rejectWithdrawal(selectedWithdrawal.id, rejectReason);
      
      if (result.success) {
        success('Đã từ chối yêu cầu rút tiền!');
        setShowRejectModal(false);
        setRejectReason('');
        setSelectedWithdrawal(null);
        loadData();
      } else {
        showError(result.error);
      }
    } catch (err) {
      console.error('Error rejecting withdrawal:', err);
      showError('Không thể từ chối yêu cầu');
    } finally {
      setProcessing(false);
    }
  };

  const handleRefund = async () => {
    // Validation
    if (!refundForm.orderId.trim()) {
      showError('Vui lòng nhập Order ID');
      return;
    }
    
    if (!refundForm.amount || parseFloat(refundForm.amount) <= 0) {
      showError('Vui lòng nhập số tiền hợp lệ');
      return;
    }
    
    if (!refundForm.transactionDate.trim()) {
      showError('Vui lòng nhập ngày giao dịch (format: yyyyMMddHHmmss)');
      return;
    }
    
    if (!refundForm.createdBy.trim()) {
      showError('Vui lòng nhập tên người tạo');
      return;
    }
    
    setProcessing(true);
    
    try {
      const result = await refundPayment({
        transaction_type: refundForm.transactionType,
        order_id: refundForm.orderId,
        amount: parseFloat(refundForm.amount),
        transaction_date: refundForm.transactionDate,
        created_by: refundForm.createdBy,
        ip_address: refundForm.ipAddress || '127.0.0.1',
      });
      
      if (result.success) {
        success('Hoàn tiền thành công!');
        setShowRefundModal(false);
        setRefundForm({
          orderId: '',
          amount: '',
          transactionDate: '',
          createdBy: '',
          ipAddress: '',
          transactionType: '02',
        });
      } else {
        showError(result.error);
      }
    } catch (err) {
      console.error('Error processing refund:', err);
      showError('Không thể hoàn tiền');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader 
        icon="💰"
        title="Quản lý Ví & Rút tiền"
        subtitle="Xử lý yêu cầu rút tiền của cửa hàng"
      />
      <div className="space-y-6">
      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Withdrawal Requests */}
      {!loading && (
        <div>
          {/* Filter */}
          <div className="mb-6 flex gap-3">
            {['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'COMPLETED'].map((status) => (
              <button
                key={status}
                onClick={() => setWithdrawalFilter(status)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  withdrawalFilter === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status === 'ALL' ? 'Tất cả' : getWithdrawalStatusBadge(status).text}
              </button>
            ))}
          </div>

          {/* Table */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cửa hàng</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Số tiền</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngân hàng</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thời gian</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hành động</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {withdrawals.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                      Không có yêu cầu rút tiền nào
                    </td>
                  </tr>
                ) : (
                  withdrawals.map((wd) => {
                    const badge = getWithdrawalStatusBadge(wd.status);
                    return (
                      <tr key={wd.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <p className="text-sm font-medium text-gray-900">{wd.store?.name || wd.storeName || 'N/A'}</p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-bold text-gray-900">
                            {formatCurrency(wd.amount)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-900">{wd.bankName}</p>
                          <p className="text-xs text-gray-500">{wd.bankAccountNumber}</p>
                          <p className="text-xs text-gray-500">{wd.bankAccountName}</p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${badge.color}`}>
                            {badge.icon} {badge.text}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(wd.createdAt).toLocaleString('vi-VN')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex gap-2">
                            {wd.status === 'PENDING' && (
                              <>
                                <button
                                  onClick={() => {
                                    setSelectedWithdrawal(wd);
                                    setShowApproveModal(true);
                                  }}
                                  className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                >
                                  ✅ Duyệt
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedWithdrawal(wd);
                                    setShowRejectModal(true);
                                  }}
                                  className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                                >
                                  ❌ Từ chối
                                </button>
                              </>
                            )}
                            {wd.status === 'APPROVED' && (
                              <button
                                onClick={() => {
                                  setSelectedWithdrawal(wd);
                                  setShowCompleteModal(true);
                                }}
                                className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                              >
                                💰 Hoàn tất
                              </button>
                            )}
                            <button
                              onClick={() => {
                                Swal.fire({
                                  title: 'Chi tiết yêu cầu rút tiền',
                                  html: `
                                    <div class="text-left space-y-2">
                                      <p><strong>Cửa hàng:</strong> ${wd.store?.name || wd.storeName || 'N/A'}</p>
                                      <p><strong>Số tiền:</strong> ${formatCurrency(wd.amount)}</p>
                                      <p><strong>Ngân hàng:</strong> ${wd.bankName}</p>
                                      <p><strong>Số TK:</strong> ${wd.bankAccountNumber}</p>
                                      <p><strong>Chủ TK:</strong> ${wd.bankAccountName}</p>
                                      <p><strong>Trạng thái:</strong> ${wd.status}</p>
                                      <p><strong>Thời gian:</strong> ${new Date(wd.createdAt).toLocaleString('vi-VN')}</p>
                                      <p><strong>Ghi chú:</strong> ${wd.note || 'Không có'}</p>
                                    </div>
                                  `,
                                  icon: 'info',
                                  confirmButtonText: 'OK'
                                });
                              }}
                              className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              👁️ Xem
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Approve Modal */}
      {showApproveModal && selectedWithdrawal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">✅ Duyệt yêu cầu rút tiền</h2>
            
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Cửa hàng: <span className="font-semibold">{selectedWithdrawal.storeName}</span></p>
              <p className="text-sm text-gray-600 mb-2">Số tiền: <span className="font-semibold text-green-600">{formatCurrency(selectedWithdrawal.amount)}</span></p>
              <p className="text-sm text-gray-600 mb-2">Ngân hàng: <span className="font-semibold">{selectedWithdrawal.bankName}</span></p>
              <p className="text-sm text-gray-600">Số TK: <span className="font-semibold">{selectedWithdrawal.bankAccountNumber}</span></p>
              <p className="text-sm text-gray-600">Chủ TK: <span className="font-semibold">{selectedWithdrawal.bankAccountName}</span></p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ghi chú admin (tùy chọn)
              </label>
              <textarea
                value={approveNote}
                onChange={(e) => setApproveNote(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="VD: Đã kiểm tra thông tin tài khoản, OK..."
                rows="3"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowApproveModal(false);
                  setApproveNote('');
                  setSelectedWithdrawal(null);
                }}
                disabled={processing}
                className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={handleApprove}
                disabled={processing}
                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {processing ? 'Đang xử lý...' : 'Xác nhận duyệt'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedWithdrawal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">❌ Từ chối yêu cầu rút tiền</h2>
            
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Cửa hàng: <span className="font-semibold">{selectedWithdrawal.storeName}</span></p>
              <p className="text-sm text-gray-600">Số tiền: <span className="font-semibold text-red-600">{formatCurrency(selectedWithdrawal.amount)}</span></p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lý do từ chối <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Nhập lý do từ chối..."
                rows="4"
                required
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                  setSelectedWithdrawal(null);
                }}
                disabled={processing}
                className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={handleReject}
                disabled={processing}
                className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {processing ? 'Đang xử lý...' : 'Xác nhận từ chối'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Complete Modal */}
      {showCompleteModal && selectedWithdrawal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">💰 Hoàn tất chuyển tiền</h2>
            
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Cửa hàng: <span className="font-semibold">{selectedWithdrawal.storeName}</span></p>
              <p className="text-sm text-gray-600 mb-2">Số tiền: <span className="font-semibold text-blue-600">{formatCurrency(selectedWithdrawal.amount)}</span></p>
              <p className="text-sm text-gray-600 mb-2">Ngân hàng: <span className="font-semibold">{selectedWithdrawal.bankName}</span></p>
              <p className="text-sm text-gray-600">Số TK: <span className="font-semibold">{selectedWithdrawal.bankAccountNumber}</span></p>
              <p className="text-sm text-gray-600">Chủ TK: <span className="font-semibold">{selectedWithdrawal.bankAccountName}</span></p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ghi chú admin (tùy chọn)
              </label>
              <textarea
                value={completeNote}
                onChange={(e) => setCompleteNote(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="VD: Đã chuyển tiền vào tài khoản ngày 22/11/2025..."
                rows="3"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCompleteModal(false);
                  setCompleteNote('');
                  setSelectedWithdrawal(null);
                }}
                disabled={processing}
                className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={handleComplete}
                disabled={processing}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {processing ? 'Đang xử lý...' : 'Xác nhận hoàn tất'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Refund Modal */}
      {showRefundModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">↩️ Hoàn tiền VNPay</h2>
            
            <form onSubmit={(e) => { e.preventDefault(); handleRefund(); }}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Order ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={refundForm.orderId}
                  onChange={(e) => setRefundForm({ ...refundForm, orderId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Nhập Order ID"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số tiền hoàn <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={refundForm.amount}
                  onChange={(e) => setRefundForm({ ...refundForm, amount: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Nhập số tiền"
                  min="0"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Loại hoàn tiền <span className="text-red-500">*</span>
                </label>
                <select
                  value={refundForm.transactionType}
                  onChange={(e) => setRefundForm({ ...refundForm, transactionType: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="02">02 - Hoàn toàn bộ</option>
                  <option value="03">03 - Hoàn một phần</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ngày giao dịch <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={refundForm.transactionDate}
                  onChange={(e) => setRefundForm({ ...refundForm, transactionDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="yyyyMMddHHmmss (VD: 20251118200000)"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Format: yyyyMMddHHmmss (VD: 20251118200000)
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Người tạo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={refundForm.createdBy}
                  onChange={(e) => setRefundForm({ ...refundForm, createdBy: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Tên admin"
                  required
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  IP Address (tùy chọn)
                </label>
                <input
                  type="text"
                  value={refundForm.ipAddress}
                  onChange={(e) => setRefundForm({ ...refundForm, ipAddress: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="127.0.0.1"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowRefundModal(false);
                    setRefundForm({
                      orderId: '',
                      amount: '',
                      transactionDate: '',
                      createdBy: '',
                      ipAddress: '',
                      transactionType: '02',
                    });
                  }}
                  disabled={processing}
                  className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {processing ? 'Đang xử lý...' : 'Xác nhận hoàn tiền'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default AdminWallets;
