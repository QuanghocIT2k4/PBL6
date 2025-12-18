import { useState } from 'react';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getOrderCode } from '../../utils/displayCodeUtils';
import useSWR from 'swr';
import OrderCard from './OrderCard';
import { getMyOrders, cancelOrder } from '../../services/buyer/orderService';
import { useToast } from '../../context/ToastContext';
import { confirmCancelOrder } from '../../utils/sweetalert';

/**
 * OrderList Component
 * Displays list of user's orders with filtering and pagination
 */
const OrderList = () => {
  const { success, error: showError } = useToast();
  const [currentPage, setCurrentPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState(null);
  const pageSize = 10;

  // Fetch orders
  const { data: ordersData, error: ordersError, mutate } = useSWR(
    ['my-orders', currentPage, statusFilter],
    () => getMyOrders({
      page: currentPage,
      size: pageSize,
      status: statusFilter,
    }),
    {
      revalidateOnFocus: false,
      keepPreviousData: true,
    }
  );

  const orders = ordersData?.success ? (ordersData.data?.content || ordersData.data || []) : [];
  const totalPages = ordersData?.data?.page?.totalPages || ordersData?.data?.totalPages || 1;
  const totalOrders = ordersData?.data?.page?.totalElements || ordersData?.data?.totalElements || orders.length;

  // Handle cancel order
  const handleCancel = async (order) => {
    const confirmed = await confirmCancelOrder(getOrderCode(order.id));
    if (!confirmed) return;

    const result = await cancelOrder(order.id);
    if (result.success) {
      // Check if order was paid
      const isPaid = order.paymentStatus === 'PAID' || order.payment?.status === 'PAID';
      
      if (isPaid) {
        success('Đơn hàng đã được hủy. Tiền sẽ được hoàn lại vào tài khoản ngân hàng của bạn trong 1-3 ngày làm việc.');
      } else {
        success(result.message);
      }
      
      mutate(); // Refresh orders list
    } else {
      showError(result.error);
    }
  };

  // Status filter options
  const statusFilters = [
    { value: null, label: 'Tất cả', icon: '📋' },
    { value: 'PENDING', label: 'Chờ xác nhận', icon: '⏳' },
    { value: 'CONFIRMED', label: 'Đã xác nhận', icon: '✓' },
    { value: 'SHIPPING', label: 'Đang giao', icon: '🚚' },
    { value: 'DELIVERED', label: 'Đã giao', icon: '✅' },
    { value: 'CANCELLED', label: 'Đã hủy', icon: '❌' },
    { value: 'RETURNED', label: 'Đã trả hàng / Hoàn tiền', icon: '↩️' },
  ];

  // Loading state
  if (!ordersData && !ordersError) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-6 bg-gray-200 rounded w-1/3"></div>
              <div className="h-20 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded w-1/4"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Status Filter Tabs - Shopee Style */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="flex items-center border-b border-gray-200 overflow-x-auto">
          {statusFilters.map((filter) => (
            <button
              key={filter.value || 'all'}
              onClick={() => {
                setStatusFilter(filter.value);
                setCurrentPage(0);
              }}
              className={`flex-shrink-0 px-6 py-3 text-sm font-medium transition-colors relative ${
                statusFilter === filter.value
                  ? 'text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span className="mr-2">{filter.icon}</span>
              {filter.label}
              {statusFilter === filter.value && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      {ordersError ? (
        <div className="bg-red-50 rounded-lg border border-red-200 p-6 text-center">
          <div className="text-red-600 text-5xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold text-red-900 mb-2">
            Không thể tải danh sách đơn hàng
          </h3>
          <p className="text-red-700">{ordersError.message}</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <div className="text-gray-400 text-6xl mb-4">📦</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {statusFilter ? 'Không có đơn hàng nào' : 'Chưa có đơn hàng'}
          </h3>
          <p className="text-gray-600 mb-6">
            {statusFilter 
              ? `Không tìm thấy đơn hàng với trạng thái "${statusFilters.find(f => f.value === statusFilter)?.label}"`
              : 'Bạn chưa có đơn hàng nào. Hãy bắt đầu mua sắm!'
            }
          </p>
          {!statusFilter && (
            <button
              onClick={() => window.location.href = '/'}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Khám phá sản phẩm
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Order Cards */}
          <div className="space-y-4">
            {orders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onCancel={handleCancel}
                onRefresh={mutate}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Hiển thị {currentPage * pageSize + 1} - {Math.min((currentPage + 1) * pageSize, totalOrders)} / {totalOrders} đơn hàng
                </p>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 0}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ‹ Trước
                  </button>

                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i;
                    } else if (currentPage < 3) {
                      pageNum = i;
                    } else if (currentPage > totalPages - 3) {
                      pageNum = totalPages - 5 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-4 py-2 border rounded-md text-sm font-medium ${
                          currentPage === pageNum
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum + 1}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage >= totalPages - 1}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Sau ›
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default OrderList;

