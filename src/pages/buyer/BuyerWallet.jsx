import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../layouts/MainLayout';
import { useToast } from '../../context/ToastContext';
import Swal from 'sweetalert2';
import {
  getWalletInfo,
  getWalletTransactions,
  getWithdrawalRequests,
  createWithdrawalRequest,
  formatCurrency,
  getTransactionTypeBadge,
  getWithdrawalStatusBadge,
  formatDateTime,
  validateWithdrawalAmount,
} from '../../services/buyer/buyerWalletService';

/**
 * BuyerWallet Page
 * Quản lý ví điện tử của buyer
 */
const BuyerWallet = () => {
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [withdrawalRequests, setWithdrawalRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // overview, transactions, withdrawals
  
  // Pagination
  const [transactionPage, setTransactionPage] = useState(0);
  const [transactionTotalPages, setTransactionTotalPages] = useState(0);
  const [withdrawalPage, setWithdrawalPage] = useState(0);
  const [withdrawalTotalPages, setWithdrawalTotalPages] = useState(0);
  
  // Withdrawal form
  const [showWithdrawalForm, setShowWithdrawalForm] = useState(false);
  const [withdrawalForm, setWithdrawalForm] = useState({
    amount: '',
    bankName: '',
    bankAccountNumber: '',
    bankAccountName: '',
    note: '',
  });
  const [submitting, setSubmitting] = useState(false);
  
  useEffect(() => {
    loadWalletData();
  }, []);
  
  useEffect(() => {
    if (activeTab === 'transactions') {
      loadTransactions();
    } else if (activeTab === 'withdrawals') {
      loadWithdrawalRequests();
    }
  }, [activeTab, transactionPage, withdrawalPage]);
  
  const loadWalletData = async () => {
    setLoading(true);
    try {
      const result = await getWalletInfo();
      if (result.success) {
        setWallet(result.data);
      } else {
        showError(result.error);
      }
    } catch (err) {
      console.error('Error loading wallet:', err);
      showError('Không thể tải thông tin ví');
    } finally {
      setLoading(false);
    }
  };
  
  const loadTransactions = async () => {
    try {
      const result = await getWalletTransactions({
        page: transactionPage,
        size: 10,
      });
      
      if (result.success) {
        const data = result.data;
        setTransactions(data.content || data.transactions || []);
        setTransactionTotalPages(data.totalPages || 0);
      } else {
        showError(result.error);
      }
    } catch (err) {
      console.error('Error loading transactions:', err);
      showError('Không thể tải lịch sử giao dịch');
    }
  };
  
  const loadWithdrawalRequests = async () => {
    try {
      const result = await getWithdrawalRequests({
        page: withdrawalPage,
        size: 10,
      });
      
      if (result.success) {
        const data = result.data;
        setWithdrawalRequests(data.content || data.requests || []);
        setWithdrawalTotalPages(data.totalPages || 0);
      } else {
        showError(result.error);
      }
    } catch (err) {
      console.error('Error loading withdrawal requests:', err);
      showError('Không thể tải danh sách yêu cầu rút tiền');
    }
  };
  
  const handleWithdrawalSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    const amount = parseFloat(withdrawalForm.amount.replace(/[^0-9]/g, ''));
    const validation = validateWithdrawalAmount(amount, wallet?.balance || 0);
    
    if (!validation.valid) {
      showError(validation.message);
      return;
    }
    
    if (!withdrawalForm.bankName.trim()) {
      showError('Vui lòng nhập tên ngân hàng');
      return;
    }
    
    if (!withdrawalForm.bankAccountNumber.trim()) {
      showError('Vui lòng nhập số tài khoản');
      return;
    }
    
    if (!withdrawalForm.bankAccountName.trim()) {
      showError('Vui lòng nhập tên chủ tài khoản');
      return;
    }
    
    // Confirm
    const confirmed = await Swal.fire({
      title: 'Xác nhận rút tiền',
      html: `
        <div class="text-left space-y-2">
          <p><strong>Số tiền:</strong> ${formatCurrency(amount)}</p>
          <p><strong>Ngân hàng:</strong> ${withdrawalForm.bankName}</p>
          <p><strong>Số TK:</strong> ${withdrawalForm.bankAccountNumber}</p>
          <p><strong>Chủ TK:</strong> ${withdrawalForm.bankAccountName}</p>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Xác nhận',
      cancelButtonText: 'Hủy',
      confirmButtonColor: '#3B82F6',
    });
    
    if (!confirmed.isConfirmed) return;
    
    setSubmitting(true);
    try {
      const result = await createWithdrawalRequest({
        amount,
        bankName: withdrawalForm.bankName,
        bankAccountNumber: withdrawalForm.bankAccountNumber,
        bankAccountName: withdrawalForm.bankAccountName,
        note: withdrawalForm.note,
      });
      
      if (result.success) {
        success(result.message);
        setShowWithdrawalForm(false);
        setWithdrawalForm({
          amount: '',
          bankName: '',
          bankAccountNumber: '',
          bankAccountName: '',
          note: '',
        });
        loadWalletData();
        loadWithdrawalRequests();
      } else {
        showError(result.error);
      }
    } catch (err) {
      console.error('Error creating withdrawal request:', err);
      showError('Không thể tạo yêu cầu rút tiền');
    } finally {
      setSubmitting(false);
    }
  };
  
  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Ví của tôi</h1>
          <p className="text-gray-600 mt-1">Nhận tiền hoàn từ đơn hàng hủy/trả và rút về ngân hàng</p>
        </div>
        
        {/* Balance Card */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-8 text-white mb-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm mb-2">Số dư khả dụng</p>
              <p className="text-4xl font-bold">{formatCurrency(wallet?.balance || 0)}</p>
              <p className="text-blue-100 text-xs mt-2 italic">💡 Số dư từ tiền hoàn đơn hàng hủy/trả</p>
            </div>
            <div className="text-6xl opacity-20">💰</div>
          </div>
          
          <div className="mt-6 flex gap-4">
            <button
              onClick={() => setShowWithdrawalForm(true)}
              disabled={!wallet?.balance || wallet.balance <= 0}
              className="px-6 py-3 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              💸 Rút tiền
            </button>
            <button
              onClick={() => navigate('/orders')}
              className="px-6 py-3 bg-blue-600 bg-opacity-30 text-white rounded-lg font-medium hover:bg-opacity-40 transition-colors"
            >
              📦 Đơn hàng
            </button>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <div className="flex gap-8 px-6">
              {[
                { key: 'overview', label: 'Tổng quan', icon: '📊' },
                { key: 'transactions', label: 'Lịch sử giao dịch', icon: '📜' },
                { key: 'withdrawals', label: 'Yêu cầu rút tiền', icon: '💸' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`py-4 px-2 font-medium text-sm border-b-2 transition-colors ${
                    activeTab === tab.key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Stats Cards */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">↩️</span>
                </div>
              </div>
              <p className="text-gray-600 text-sm">Tổng hoàn tiền</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(wallet?.totalRefund || 0)}
              </p>
              <p className="text-xs text-gray-500 mt-2">Từ đơn hàng hủy/trả</p>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">💸</span>
                </div>
              </div>
              <p className="text-gray-600 text-sm">Đã rút</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(wallet?.totalWithdrawn || 0)}
              </p>
              <p className="text-xs text-gray-500 mt-2">Rút về ngân hàng</p>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">⏳</span>
                </div>
              </div>
              <p className="text-gray-600 text-sm">Đang chờ rút</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(wallet?.pendingWithdrawal || 0)}
              </p>
              <p className="text-xs text-gray-500 mt-2">Yêu cầu chờ duyệt</p>
            </div>
          </div>
        )}
        
        {activeTab === 'transactions' && (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            {transactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4">
                <div className="text-6xl mb-4">📜</div>
                <p className="text-gray-500 text-center text-lg">Chưa có giao dịch nào</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Thời gian
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Loại giao dịch
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Số tiền
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Số dư sau GD
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Ghi chú
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {transactions.map((transaction) => {
                        const typeBadge = getTransactionTypeBadge(transaction.type);
                        const isNegative = ['PAYMENT', 'WITHDRAWAL'].includes(transaction.type);
                        
                        return (
                          <tr key={transaction.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatDateTime(transaction.createdAt)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${typeBadge.bgColor} ${typeBadge.textColor}`}>
                                {typeBadge.icon} {typeBadge.text}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`text-sm font-semibold ${isNegative ? 'text-red-600' : 'text-green-600'}`}>
                                {isNegative ? '-' : '+'}{formatCurrency(transaction.amount)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatCurrency(transaction.balanceAfter)}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              {transaction.note || '-'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                
                {/* Pagination */}
                {transactionTotalPages > 1 && (
                  <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                    <button
                      onClick={() => setTransactionPage((p) => Math.max(0, p - 1))}
                      disabled={transactionPage === 0}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Trang trước
                    </button>
                    <span className="text-sm text-gray-700">
                      Trang {transactionPage + 1} / {transactionTotalPages}
                    </span>
                    <button
                      onClick={() => setTransactionPage((p) => Math.min(transactionTotalPages - 1, p + 1))}
                      disabled={transactionPage >= transactionTotalPages - 1}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Trang sau
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
        
        {activeTab === 'withdrawals' && (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            {withdrawalRequests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4">
                <div className="text-6xl mb-4">💸</div>
                <p className="text-gray-500 text-center text-lg">Chưa có yêu cầu rút tiền nào</p>
                <button
                  onClick={() => setShowWithdrawalForm(true)}
                  className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Tạo yêu cầu rút tiền
                </button>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Thời gian
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Số tiền
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Ngân hàng
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Số TK
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Trạng thái
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Ghi chú
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {withdrawalRequests.map((request) => {
                        const statusBadge = getWithdrawalStatusBadge(request.status);
                        
                        return (
                          <tr key={request.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatDateTime(request.createdAt)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm font-semibold text-orange-600">
                                {formatCurrency(request.amount)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {request.bankName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {request.bankAccountNumber}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${statusBadge.bgColor} ${statusBadge.textColor}`}>
                                {statusBadge.icon} {statusBadge.text}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              {request.note || '-'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                
                {/* Pagination */}
                {withdrawalTotalPages > 1 && (
                  <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                    <button
                      onClick={() => setWithdrawalPage((p) => Math.max(0, p - 1))}
                      disabled={withdrawalPage === 0}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Trang trước
                    </button>
                    <span className="text-sm text-gray-700">
                      Trang {withdrawalPage + 1} / {withdrawalTotalPages}
                    </span>
                    <button
                      onClick={() => setWithdrawalPage((p) => Math.min(withdrawalTotalPages - 1, p + 1))}
                      disabled={withdrawalPage >= withdrawalTotalPages - 1}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Trang sau
                    </button>
                  </div>
                )}
              </>
            )}
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
                    type="text"
                    value={withdrawalForm.amount}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, '');
                      const formatted = value ? Number(value).toLocaleString('vi-VN') : '';
                      setWithdrawalForm({ ...withdrawalForm, amount: formatted });
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nhập số tiền"
                    required
                  />
                  <div className="mt-2 p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm text-green-700 font-medium">
                      💳 Số dư khả dụng: <span className="font-bold">{formatCurrency(wallet?.balance || 0)}</span>
                    </p>
                  </div>
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
                    value={withdrawalForm.bankAccountNumber}
                    onChange={(e) => setWithdrawalForm({ ...withdrawalForm, bankAccountNumber: e.target.value })}
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
                    value={withdrawalForm.bankAccountName}
                    onChange={(e) => setWithdrawalForm({ ...withdrawalForm, bankAccountName: e.target.value })}
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
    </MainLayout>
  );
};

export default BuyerWallet;
