import React, { useState } from 'react';
import useSWR from 'swr';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import { useToast } from '../../context/ToastContext';
import { confirmAction } from '../../utils/sweetalert';
import { getOrderCode } from '../../utils/displayCodeUtils';
import { getAdminOrderById } from '../../services/admin/adminOrderService';
import {
  getAdminRefunds,
  getAdminRefundDetail,
  processRefundRequest,
  getRefundStatistics,
} from '../../services/admin/refundService';

const AdminRefundsPage = () => {
  const { success, error: showError } = useToast();
  const [statusFilter, setStatusFilter] = useState(null); // PENDING | COMPLETED | REJECTED
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 10;
  const [processingId, setProcessingId] = useState(null);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [selectedRefund, setSelectedRefund] = useState(null);
  const [action, setAction] = useState('APPROVE');
  const [refundTransactionId, setRefundTransactionId] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  // Fetch refunds list
  const { data, error, isLoading, mutate } = useSWR(
    ['admin-refunds', statusFilter, currentPage],
    () => getAdminRefunds({ status: statusFilter, page: currentPage, size: pageSize }),
    { revalidateOnFocus: false }
  );

  const refunds = data?.success ? (data.data?.content || data.data || []) : [];
  const totalPages = data?.data?.totalPages || 0;

  // Fetch statistics
  const { data: statsData } = useSWR('admin-refunds-stats', getRefundStatistics, {
    revalidateOnFocus: false,
  });

  const stats = statsData?.data || statsData || {};

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount || 0);
  };

  const getStatusBadge = (status) => {
    const map = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      COMPLETED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
    };
    return map[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status) => {
    const map = {
      PENDING: 'Chờ xử lý',
      COMPLETED: 'Đã hoàn tất',
      REJECTED: 'Đã từ chối',
    };
    return map[status] || status;
  };

  // ✅ Label cho phương thức hoàn tiền (refund method), không phải payment method của đơn hàng
  const getRefundMethodLabel = (method) => {
    const map = {
      MOMO: 'MoMo tự xử lý',
      VNPAY: 'VNPay tự xử lý',
      WALLET: 'Ví sàn tự xử lý',
      BANK_TRANSFER: 'Chuyển khoản ngân hàng',
      COD: 'Chuyển khoản ngân hàng', // COD hoàn tiền bằng chuyển khoản
    };
    return map[method] || method || 'Không rõ';
  };

  // ✅ Lấy phương thức hoàn tiền từ refund object (refund.paymentMethod là phương thức HOÀN TIỀN, không phải payment method của đơn)
  const getRefundMethod = (refund) => {
    // refund.paymentMethod là phương thức HOÀN TIỀN (refund method)
    // - BANK_TRANSFER: Admin chuyển khoản thủ công (cho COD)
    // - MOMO: MoMo tự động hoàn tiền
    // - VNPAY: VNPay tự động hoàn tiền
    if (refund.paymentMethod) return refund.paymentMethod;
    if (refund.payment_method) return refund.payment_method;
    return null;
  };

  const handleOpenProcessModal = async (refund) => {
    setProcessingId(refund.id || refund._id);
    try {
      const detailResult = await getAdminRefundDetail(refund.id || refund._id);
      if (detailResult.success) {
        setSelectedRefund(detailResult.data);
      } else {
        setSelectedRefund(refund);
        showError(detailResult.error || 'Không thể tải chi tiết yêu cầu hoàn tiền');
      }
    } catch (err) {
      console.error('Error fetching refund detail:', err);
      setSelectedRefund(refund);
    } finally {
      setProcessingId(null);
      setAction('APPROVE');
      setRefundTransactionId('');
      setAdminNote('');
      setRejectionReason('');
      setShowProcessModal(true);
    }
  };

  const handleProcessRefund = async () => {
    if (!selectedRefund) return;

    if (action === 'APPROVE' && !refundTransactionId) {
      showError('Vui lòng nhập mã giao dịch hoàn tiền (refundTransactionId)');
      return;
    }

    if (action === 'REJECT' && !rejectionReason) {
      showError('Vui lòng nhập lý do từ chối hoàn tiền');
      return;
    }

    const confirmed = await confirmAction(
      action === 'APPROVE' ? 'duyệt hoàn tiền cho yêu cầu này' : 'từ chối yêu cầu hoàn tiền này'
    );
    if (!confirmed) return;

    const refundRequestId = selectedRefund.id || selectedRefund._id;
    setProcessingId(refundRequestId);
    try {
      const result = await processRefundRequest({
        refundRequestId,
        action,
        refundTransactionId: action === 'APPROVE' ? refundTransactionId : null,
        adminNote,
        rejectionReason: action === 'REJECT' ? rejectionReason : null,
      });

      if (result.success) {
        success(action === 'APPROVE' ? 'Đã duyệt hoàn tiền thành công' : 'Đã từ chối yêu cầu hoàn tiền');
        setShowProcessModal(false);
        mutate();
      } else {
        showError(result.error || 'Không thể xử lý yêu cầu hoàn tiền');
      }
    } catch (err) {
      console.error('Error processing refund request:', err);
      showError('Có lỗi xảy ra khi xử lý yêu cầu hoàn tiền');
    } finally {
      setProcessingId(null);
    }
  };

  if (error) {
    showError('Không thể tải danh sách yêu cầu hoàn tiền');
  }

  return (
    <div className="bg-gray-50 min-h-screen py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AdminPageHeader
          title="Quản lý hoàn tiền"
          description="Theo dõi và xử lý các yêu cầu hoàn tiền cho người mua"
        />

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <p className="text-xs font-medium text-gray-500">Tổng yêu cầu</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">{stats.TOTAL || 0}</p>
          </div>
          <div className="bg-white rounded-xl border border-yellow-200 p-4 shadow-sm">
            <p className="text-xs font-medium text-yellow-800">Đang chờ xử lý</p>
            <p className="mt-2 text-2xl font-bold text-yellow-600">{stats.PENDING || 0}</p>
          </div>
          <div className="bg-white rounded-xl border border-green-200 p-4 shadow-sm">
            <p className="text-xs font-medium text-green-800">Đã hoàn tất</p>
            <p className="mt-2 text-2xl font-bold text-green-600">{stats.COMPLETED || 0}</p>
          </div>
          <div className="bg-white rounded-xl border border-red-200 p-4 shadow-sm">
            <p className="text-xs font-medium text-red-800">Đã từ chối</p>
            <p className="mt-2 text-2xl font-bold text-red-600">{stats.REJECTED || 0}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex gap-2 flex-wrap">
          <button
            onClick={() => setStatusFilter(null)}
            className={`px-4 py-2 rounded-lg transition ${
              statusFilter === null ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Tất cả
          </button>
          {['PENDING', 'COMPLETED', 'REJECTED'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-lg transition ${
                statusFilter === status ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {getStatusLabel(status)}
            </button>
          ))}
        </div>

        {/* Refund list */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          {isLoading ? (
            <div className="py-12 text-center text-gray-500">Đang tải danh sách yêu cầu hoàn tiền...</div>
          ) : refunds.length === 0 ? (
            <div className="py-12 text-center text-gray-500">Không có yêu cầu hoàn tiền nào.</div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {refunds.map((refund) => (
                <li key={refund.id || refund._id} className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusBadge(
                          refund.status
                        )}`}
                      >
                        {getStatusLabel(refund.status)}
                      </span>
                      <span className="text-xs text-gray-500">{formatDate(refund.createdAt)}</span>
                    </div>
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold">Đơn hàng:</span>{' '}
                      <span className="font-mono">{getOrderCode(refund.orderId || refund.order_id)}</span>
                    </p>
                    {(refund.buyerName || refund.buyer_name || refund.buyer?.name || refund.buyer?.fullName || refund.buyerEmail) && (
                      <p className="text-sm text-gray-600">
                        <span className="font-semibold">Người mua:</span>{' '}
                        {refund.buyerName || 
                         refund.buyer_name || 
                         refund.buyer?.name || 
                         refund.buyer?.fullName || 
                         refund.buyer?.full_name ||
                         refund.buyerEmail}
                      </p>
                    )}
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold">Số tiền hoàn:</span>{' '}
                      <span className="text-green-600 font-bold">
                        {formatCurrency(refund.refundAmount || refund.amount || 0)}
                      </span>
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-semibold">Phương thức hoàn trả:</span>{' '}
                      {getRefundMethodLabel(getRefundMethod(refund))}
                      {refund.status === 'COMPLETED' && (refund.refundTransactionId || refund.refund_transaction_id) && (
                        <span className="text-xs text-gray-500 ml-1">
                          · Mã hoàn tiền: {refund.refundTransactionId || refund.refund_transaction_id}
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {refund.status === 'PENDING' ? (
                      <button
                        onClick={() => handleOpenProcessModal(refund)}
                        disabled={processingId === (refund.id || refund._id)}
                        className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
                      >
                        Xử lý
                      </button>
                    ) : (
                      <button
                        disabled
                        className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 bg-gray-50 text-gray-400 cursor-default"
                      >
                        Đã xử lý
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                Trang <span className="font-semibold">{currentPage + 1}</span> /{' '}
                <span className="font-semibold">{totalPages}</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                  disabled={currentPage === 0}
                  className="px-3 py-1 rounded border border-gray-300 text-sm hover:bg-gray-50 disabled:opacity-50"
                >
                  ← Trước
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={currentPage >= totalPages - 1}
                  className="px-3 py-1 rounded border border-gray-300 text-sm hover:bg-gray-50 disabled:opacity-50"
                >
                  Sau →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Process Modal */}
        {showProcessModal && selectedRefund && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6">
              <h3 className="text-lg font-semibold mb-4">Xử lý yêu cầu hoàn tiền</h3>
              <div className="mb-4 text-sm text-gray-600 flex items-center gap-2 flex-wrap">
                <span>Đơn: </span>
                <span className="font-mono">{getOrderCode(selectedRefund.orderId || selectedRefund.order_id)}</span>
                {' • '}
                <span>Hoàn trả: {getRefundMethodLabel(getRefundMethod(selectedRefund))}</span>
              </div>

              {/* ✅ Hiển thị thông tin ngân hàng khi hoàn tiền bằng BANK_TRANSFER (Admin chuyển khoản thủ công) */}
              {getRefundMethod(selectedRefund) === 'BANK_TRANSFER' && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs font-semibold text-blue-900 mb-2">🏦 Thông tin tài khoản nhận hoàn tiền</p>
                  <p className="text-xs text-blue-700 mb-2">
                    <strong>Lưu ý:</strong> Đơn COD thanh toán bằng tiền mặt. Đây là thông tin tài khoản Buyer để Admin chuyển khoản hoàn tiền.
                  </p>
                  <div className="text-sm text-gray-700 space-y-0.5">
                    <p><span className="font-semibold">{selectedRefund.bankName || selectedRefund.bank_name || 'N/A'}</span></p>
                    <p className="font-mono">{selectedRefund.bankAccountNumber || selectedRefund.bank_account_number || 'N/A'}</p>
                    <p>{selectedRefund.bankAccountName || selectedRefund.bank_account_name || 'N/A'}</p>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quyết định</label>
                  <select
                    value={action}
                    onChange={(e) => setAction(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="APPROVE">Duyệt hoàn tiền</option>
                    <option value="REJECT">Từ chối yêu cầu hoàn tiền</option>
                  </select>
                </div>

                {action === 'APPROVE' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mã giao dịch <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={refundTransactionId}
                      onChange={(e) => setRefundTransactionId(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={
                        getRefundMethod(selectedRefund) === 'BANK_TRANSFER'
                          ? "Mã chuyển khoản ngân hàng (sau khi đã chuyển tiền)"
                          : "Mã giao dịch từ MoMo/VNPay (tự động sau khi hoàn tiền)"
                      }
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      {getRefundMethod(selectedRefund) === 'BANK_TRANSFER' ? (
                        <>Mã giao dịch ngân hàng sau khi Admin đã chuyển khoản vào tài khoản Buyer</>
                      ) : (
                        <>Mã giao dịch do cổng thanh toán (MoMo/VNPay) trả về sau khi hoàn tiền thành công</>
                      )}
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
                  <textarea
                    rows={2}
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="(Tùy chọn)"
                  />
                </div>

                {action === 'REJECT' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Lý do từ chối</label>
                    <textarea
                      rows={2}
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder="Nhập lý do từ chối hoàn tiền (sẽ hiển thị cho người dùng)"
                    />
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <button
                  onClick={() => setShowProcessModal(false)}
                  className="px-4 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  onClick={handleProcessRefund}
                  disabled={processingId === (selectedRefund.id || selectedRefund._id)}
                  className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  Lưu quyết định
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminRefundsPage;


