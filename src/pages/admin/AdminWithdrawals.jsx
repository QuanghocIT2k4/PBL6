import { useState, useEffect } from 'react';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import { useToast } from '../../context/ToastContext';
import Swal from 'sweetalert2';
import {
  getStoreWithdrawals,
  approveStoreWithdrawal,
  rejectStoreWithdrawal,
  formatCurrency,
  getWithdrawalStatusBadge,
} from '../../services/admin/adminWalletService';

const AdminWithdrawals = () => {
  const { success, error: showError } = useToast();
  
  const [loading, setLoading] = useState(true);
  
  // Store withdrawals
  const [storeWithdrawals, setStoreWithdrawals] = useState([]);
  const [storeFilter, setStoreFilter] = useState('PENDING');
  
  // Modal states
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [approveNote, setApproveNote] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadData();
  }, [storeFilter]);

  const loadData = async () => {
    setLoading(true);
    
    try {
      const result = await getStoreWithdrawals({
        page: 0,
        size: 20,
        status: storeFilter === 'ALL' ? undefined : storeFilter,
      });
      
      if (result.success) {
        setStoreWithdrawals(result.data.content || result.data || []);
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
    
    // Kiểm tra trạng thái trước khi duyệt
    if (selectedWithdrawal.status !== 'PENDING') {
      showError(`Yêu cầu này đã ở trạng thái "${selectedWithdrawal.status}", không thể duyệt!`);
      setShowApproveModal(false);
      loadData();
      return;
    }
    
    setProcessing(true);
    
    try {
      const result = await approveStoreWithdrawal(selectedWithdrawal.id, approveNote);
      
      if (result.success) {
        success(result.message || 'Đã duyệt yêu cầu rút tiền!');
        setShowApproveModal(false);
        setApproveNote('');
        setSelectedWithdrawal(null);
        loadData();
      } else {
        showError(result.error || 'Không thể duyệt yêu cầu');
        // Refresh data để cập nhật trạng thái mới nhất
        loadData();
        setShowApproveModal(false);
        setSelectedWithdrawal(null);
      }
    } catch (err) {
      console.error('Error approving withdrawal:', err);
      showError('Không thể duyệt yêu cầu');
      // Refresh data
      loadData();
      setShowApproveModal(false);
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
      const result = await rejectStoreWithdrawal(selectedWithdrawal.id, rejectReason);
      
      if (result.success) {
        success(result.message || 'Đã từ chối yêu cầu rút tiền!');
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


  return (
    <div className="space-y-6">
      <AdminPageHeader 
        icon="💰"
        title="Quản lý Rút tiền"
        subtitle="Xử lý yêu cầu rút tiền của cửa hàng"
      />

      <div className="bg-white rounded-lg shadow-md p-6">
        {/* Status Filter */}
        <div className="flex gap-3 mb-6">
          {['ALL', 'PENDING', 'REJECTED', 'COMPLETED'].map((status) => (
            <button
              key={status}
              onClick={() => setStoreFilter(status)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                storeFilter === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status === 'ALL' ? 'Tất cả' : getWithdrawalStatusBadge(status).text}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* Table */}
        {!loading && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Cửa hàng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Số tiền</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngân hàng</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thời gian</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hành động</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {storeWithdrawals.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                      Không có yêu cầu rút tiền nào
                    </td>
                  </tr>
                ) : (
                  storeWithdrawals.map((wd) => {
                    const badge = getWithdrawalStatusBadge(wd.status);
                    return (
                      <tr key={wd.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <p className="text-sm font-medium text-gray-900">
                            {wd.store?.name || wd.storeName || 'N/A'}
                          </p>
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
                              className="px-3 py-1 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
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
        )}
      </div>

      {/* Approve Modal */}
      {showApproveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold mb-4">Duyệt yêu cầu rút tiền</h3>
            <p className="text-sm text-gray-600 mb-4">
              Số tiền: <span className="font-bold">{formatCurrency(selectedWithdrawal?.amount)}</span>
            </p>
            <textarea
              value={approveNote}
              onChange={(e) => setApproveNote(e.target.value)}
              placeholder="Ghi chú (tùy chọn)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4"
              rows="3"
            />
            <div className="flex gap-3">
              <button
                onClick={handleApprove}
                disabled={processing}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {processing ? 'Đang xử lý...' : '✅ Xác nhận duyệt'}
              </button>
              <button
                onClick={() => {
                  setShowApproveModal(false);
                  setApproveNote('');
                  setSelectedWithdrawal(null);
                }}
                disabled={processing}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 disabled:opacity-50"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold mb-4">Từ chối yêu cầu rút tiền</h3>
            <p className="text-sm text-gray-600 mb-4">
              Số tiền: <span className="font-bold">{formatCurrency(selectedWithdrawal?.amount)}</span>
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Lý do từ chối (bắt buộc)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4"
              rows="3"
              required
            />
            <div className="flex gap-3">
              <button
                onClick={handleReject}
                disabled={processing || !rejectReason.trim()}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {processing ? 'Đang xử lý...' : '❌ Xác nhận từ chối'}
              </button>
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                  setSelectedWithdrawal(null);
                }}
                disabled={processing}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 disabled:opacity-50"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminWithdrawals;
