import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import StoreLayout from '../../layouts/StoreLayout';
import Swal from 'sweetalert2';
import {
  getStoreWallet,
  getWithdrawalRequests,
  createWithdrawalRequest,
  getWithdrawalRequestDetail,
  formatCurrency,
  getWithdrawalStatusBadge,
} from '../../services/b2c/walletService';

const StoreWallet = () => {
  const { storeId } = useParams();
  const { success, error: showError } = useToast();
  
  const [wallet, setWallet] = useState(null);
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // overview, withdrawals
  
  // Withdrawal form
  const [showWithdrawalForm, setShowWithdrawalForm] = useState(false);
  const [withdrawalForm, setWithdrawalForm] = useState({
    amount: '',
    bankName: '',
    bankAccount: '',
    accountHolder: '',
    note: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadWalletData();
  }, [storeId]);

  const loadWalletData = async () => {
    setLoading(true);
    
    try {
      // Load wallet info
      const walletResult = await getStoreWallet(storeId);
      if (walletResult.success) {
        setWallet(walletResult.data);
      }
      
      // Load withdrawal requests
      const wdResult = await getWithdrawalRequests(storeId, { page: 0, size: 10 });
      if (wdResult.success) {
        const wdData = wdResult.data?.content || wdResult.data;
        setWithdrawals(Array.isArray(wdData) ? wdData : []);
      } else {
        setWithdrawals([]);
      }
    } catch (err) {
      console.error('Error loading wallet data:', err);
      showError('Không thể tải thông tin ví');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdrawalSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!withdrawalForm.amount || parseFloat(withdrawalForm.amount) <= 0) {
      showError('Vui lòng nhập số tiền hợp lệ');
      return;
    }
    
    if (parseFloat(withdrawalForm.amount) > wallet?.balance) {
      showError('Số tiền rút vượt quá số dư khả dụng');
      return;
    }
    
    if (!withdrawalForm.bankName || !withdrawalForm.bankAccount || !withdrawalForm.accountHolder) {
      showError('Vui lòng nhập đầy đủ thông tin ngân hàng');
      return;
    }
    
    setSubmitting(true);
    
    try {
      const result = await createWithdrawalRequest(storeId, {
        amount: parseFloat(withdrawalForm.amount),
        bankName: withdrawalForm.bankName,
        bankAccount: withdrawalForm.bankAccount,
        accountHolder: withdrawalForm.accountHolder,
        note: withdrawalForm.note,
      });
      
      console.log('💰 Withdrawal request result:', result);
      
      if (result.success) {
        success('Tạo yêu cầu rút tiền thành công! Chờ admin duyệt.');
        setShowWithdrawalForm(false);
        setWithdrawalForm({
          amount: '',
          bankName: '',
          bankAccount: '',
          accountHolder: '',
          note: '',
        });
        
        // Wait a bit before reloading to ensure backend has saved
        setTimeout(() => {
          loadWalletData(); // Reload data
        }, 500);
      } else {
        console.error('❌ Withdrawal request failed:', result.error);
        showError(result.error);
      }
    } catch (err) {
      console.error('Error creating withdrawal:', err);
      showError('Không thể tạo yêu cầu rút tiền');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">💰 Ví của tôi</h1>
        <p className="text-gray-600">Quản lý số dư và giao dịch</p>
      </div>

      {/* Wallet Overview Card */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-8 text-white mb-8 shadow-xl">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-blue-100 mb-2">Số dư khả dụng</p>
            <h2 className="text-4xl font-bold mb-4">{formatCurrency(wallet?.balance || 0)}</h2>
            <div className="flex gap-6 text-sm">
              <div>
                <p className="text-blue-100">Tổng thu nhập</p>
                <p className="font-semibold">{formatCurrency(wallet?.totalEarned || 0)}</p>
              </div>
              <div>
                <p className="text-blue-100">Đã rút</p>
                <p className="font-semibold">{formatCurrency(wallet?.totalWithdrawn || 0)}</p>
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowWithdrawalForm(true)}
            className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
          >
            💸 Rút tiền
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <div className="flex gap-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-4 px-2 font-medium transition-colors ${
              activeTab === 'overview'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            📊 Tổng quan
          </button>
          <button
            onClick={() => setActiveTab('withdrawals')}
            className={`pb-4 px-2 font-medium transition-colors ${
              activeTab === 'withdrawals'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            💸 Yêu cầu rút tiền
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-600 font-medium">Chờ duyệt</h3>
              <span className="text-2xl">⏳</span>
            </div>
            <p className="text-2xl font-bold text-yellow-600">
              {withdrawals.filter(w => w.status === 'PENDING').length}
            </p>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-600 font-medium">Đã duyệt</h3>
              <span className="text-2xl">✅</span>
            </div>
            <p className="text-2xl font-bold text-green-600">
              {withdrawals.filter(w => ['APPROVED', 'COMPLETED'].includes(w.status)).length}
            </p>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-600 font-medium">Bị từ chối</h3>
              <span className="text-2xl">❌</span>
            </div>
            <p className="text-2xl font-bold text-red-600">
              {withdrawals.filter(w => w.status === 'REJECTED').length}
            </p>
          </div>
        </div>
      )}

      {activeTab === 'withdrawals' && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
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
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                    Chưa có yêu cầu rút tiền nào
                  </td>
                </tr>
              ) : (
                withdrawals.map((wd) => {
                  const badge = getWithdrawalStatusBadge(wd.status);
                  return (
                    <tr key={wd.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-semibold text-gray-900">
                          {formatCurrency(wd.amount)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-900">{wd.bankName}</p>
                        <p className="text-xs text-gray-500">{wd.bankAccount}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${badge.color}`}>
                          {badge.text}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(wd.createdAt).toLocaleString('vi-VN')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={async () => {
                            const result = await getWithdrawalRequestDetail(storeId, wd.id);
                            if (result.success) {
                              Swal.fire({
                                title: 'Chi tiết yêu cầu rút tiền',
                                html: `
                                  <div class="text-left space-y-2">
                                    <p><strong>Số tiền:</strong> ${formatCurrency(result.data.amount)}</p>
                                    <p><strong>Ngân hàng:</strong> ${result.data.bankName}</p>
                                    <p><strong>Số TK:</strong> ${result.data.bankAccount}</p>
                                    <p><strong>Chủ TK:</strong> ${result.data.accountHolder}</p>
                                    <p><strong>Trạng thái:</strong> ${result.data.status}</p>
                                    <p><strong>Ghi chú:</strong> ${result.data.note || 'Không có'}</p>
                                  </div>
                                `,
                                icon: 'info',
                                confirmButtonText: 'OK'
                              });
                            } else {
                              showError(result.error);
                            }
                          }}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          👁️ Xem
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Withdrawal Form Modal */}
      {showWithdrawalForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">💸 Rút tiền</h2>
              <button
                onClick={() => setShowWithdrawalForm(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleWithdrawalSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số tiền rút
                </label>
                <input
                  type="number"
                  value={withdrawalForm.amount}
                  onChange={(e) => setWithdrawalForm({ ...withdrawalForm, amount: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nhập số tiền"
                  min="0"
                  max={wallet?.balance || 0}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Số dư khả dụng: {formatCurrency(wallet?.balance || 0)}
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tên ngân hàng
                </label>
                <input
                  type="text"
                  value={withdrawalForm.bankName}
                  onChange={(e) => setWithdrawalForm({ ...withdrawalForm, bankName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="VD: Vietcombank"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số tài khoản
                </label>
                <input
                  type="text"
                  value={withdrawalForm.bankAccount}
                  onChange={(e) => setWithdrawalForm({ ...withdrawalForm, bankAccount: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nhập số tài khoản"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tên chủ tài khoản
                </label>
                <input
                  type="text"
                  value={withdrawalForm.accountHolder}
                  onChange={(e) => setWithdrawalForm({ ...withdrawalForm, accountHolder: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nhập tên chủ tài khoản"
                  required
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ghi chú (tùy chọn)
                </label>
                <textarea
                  value={withdrawalForm.note}
                  onChange={(e) => setWithdrawalForm({ ...withdrawalForm, note: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ghi chú thêm..."
                  rows="3"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowWithdrawalForm(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Đang xử lý...' : 'Tạo yêu cầu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const StoreWalletWithLayout = () => {
  return (
    <StoreLayout>
      <StoreWallet />
    </StoreLayout>
  );
};

export default StoreWalletWithLayout;
