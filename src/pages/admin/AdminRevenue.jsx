import React, { useState, useEffect } from 'react';
import useSWR from 'swr';
import AdminLayout from '../../layouts/AdminLayout';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import Chart from '../../components/charts/Chart';
import { getOrderCode } from '../../utils/displayCodeUtils';
// ✅ TESTING: Dùng API mới với enhanced logging
import {
  getOverviewStatistics,
  getRevenueStatistics,
  getServiceFees,
  getPlatformDiscountLosses,
  getRevenueByDateRange,
  getRevenueChartData,
  formatCurrency,
  formatDateForAPI,
  getDateRange,
  getRevenueTypeBadge,
  getPeriodLabel,
} from '../../services/admin/adminStatisticsService';

const AdminRevenue = () => {
  // States
  const [statistics, setStatistics] = useState(null);
  const [revenues, setRevenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filter states
  const [activeTab, setActiveTab] = useState('serviceFee'); // 'serviceFee', 'platformLoss', 'dateRange'
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  
  // Date range filter
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [quickPeriod, setQuickPeriod] = useState('');

  // Sorting
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortDir, setSortDir] = useState('desc');

  // Chart period
  const [chartPeriod, setChartPeriod] = useState('MONTH');
  // Chart type: 'netRevenue' | 'serviceFees' | 'discountLosses'
  const [chartType, setChartType] = useState('netRevenue');

  // Fetch chart data
  const { data: revenueChartData } = useSWR(
    ['admin-revenue-chart', chartPeriod],
    () => getRevenueChartData(chartPeriod),
    { revalidateOnFocus: false }
  );

  // Load statistics on mount
  useEffect(() => {
    loadStatistics();
  }, []);

  // Load revenues when filters change
  useEffect(() => {
    loadRevenues();
  }, [activeTab, currentPage, sortBy, sortDir]);

  const loadStatistics = async () => {
    const result = await getRevenueStatistics();
    if (result.success) {
      setStatistics(result.data);
    } else {
      console.error('Error loading statistics:', result.error);
    }
  };

  const loadRevenues = async () => {
    setLoading(true);
    setError(null);

    let result;
    const params = { page: currentPage, size: pageSize, sortBy, sortDir };

    try {
      switch (activeTab) {
        case 'serviceFee':
          result = await getServiceFees(params);
          break;
        case 'platformLoss':
          result = await getPlatformDiscountLosses(params);
          break;
        case 'dateRange':
          if (startDate && endDate) {
            result = await getRevenueByDateRange({
              startDate,
              endDate,
              page: currentPage,
              size: pageSize,
            });
          } else {
            setError('Vui lòng chọn khoảng thời gian');
            setLoading(false);
            return;
          }
          break;
        default:
          result = await getServiceFees(params);
      }

      if (result.success) {
        const data = result.data;
        const revenueList = data.revenues || data.content || [];
        
        setRevenues(revenueList);
        setTotalPages(data.totalPages || Math.ceil((data.total || 0) / pageSize));
        setTotalElements(data.total || data.totalElements || 0);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Có lỗi xảy ra khi tải dữ liệu');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickPeriod = (period) => {
    setQuickPeriod(period);
    const { startDate: start, endDate: end } = getDateRange(period);
    setStartDate(start);
    setEndDate(end);
    setActiveTab('dateRange');
    setCurrentPage(0);
  };

  const handleDateRangeSearch = () => {
    if (startDate && endDate) {
      setActiveTab('dateRange');
      setCurrentPage(0);
      loadRevenues();
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('vi-VN');
  };

  // Prepare chart data - xử lý structure từ API
  let revenueChartFormatted = [];
  
  if (revenueChartData?.success && revenueChartData.data) {
    let chartData = revenueChartData.data;
    
    // Case 1: Nếu là array, lấy phần tử đầu tiên (vì service có thể wrap object vào array)
    if (Array.isArray(chartData) && chartData.length > 0) {
      // Nếu array có 1 phần tử và phần tử đó là object có netRevenue/serviceFees
      if (chartData.length === 1 && typeof chartData[0] === 'object') {
        chartData = chartData[0];
      } else {
        // Nếu array có nhiều phần tử, map trực tiếp
        revenueChartFormatted = chartData.map((item) => {
          if (item.netRevenue && Array.isArray(item.netRevenue)) {
            const labels = item.labels || item.netRevenue.map((_, idx) => {
              if (chartPeriod === 'MONTH') return `Tháng ${idx + 1}`;
              if (chartPeriod === 'WEEK') return `Tuần ${idx + 1}`;
              if (chartPeriod === 'YEAR') return `Năm ${idx + 1}`;
              return `Period ${idx + 1}`;
            });
            return item.netRevenue.map((value, idx) => ({
              label: labels[idx] || `Period ${idx + 1}`,
              value: value || 0,
            }));
          } else if (item.serviceFees && Array.isArray(item.serviceFees)) {
            const labels = item.labels || item.serviceFees.map((_, idx) => {
              if (chartPeriod === 'MONTH') return `Tháng ${idx + 1}`;
              if (chartPeriod === 'WEEK') return `Tuần ${idx + 1}`;
              if (chartPeriod === 'YEAR') return `Năm ${idx + 1}`;
              return `Period ${idx + 1}`;
            });
            return item.serviceFees.map((value, idx) => ({
              label: labels[idx] || `Period ${idx + 1}`,
              value: value || 0,
            }));
          } else {
            return {
              label: item.label || item.period || item.month || item.date || item.name || item.time || 'N/A',
              value: item.totalRevenue || item.revenue || item.total || item.amount || item.value || item.count || 0,
            };
          }
        }).flat();
      }
    }
    
    // Case 2: Nếu là object có arrays (netRevenue, serviceFees, discountLosses)
    if (!Array.isArray(chartData)) {
      // Chọn array dựa trên chartType
      let selectedArray = null;
      let chartTitle = '';
      
      if (chartType === 'netRevenue' && chartData.netRevenue && Array.isArray(chartData.netRevenue)) {
        selectedArray = chartData.netRevenue;
        chartTitle = 'Doanh Thu Ròng';
      } else if (chartType === 'serviceFees' && chartData.serviceFees && Array.isArray(chartData.serviceFees)) {
        selectedArray = chartData.serviceFees;
        chartTitle = 'Phí Dịch Vụ';
      } else if (chartType === 'discountLosses' && chartData.discountLosses && Array.isArray(chartData.discountLosses)) {
        selectedArray = chartData.discountLosses;
        chartTitle = 'Tiền Lỗ Giảm Giá';
      } else if (chartData.netRevenue && Array.isArray(chartData.netRevenue)) {
        // Fallback: ưu tiên netRevenue
        selectedArray = chartData.netRevenue;
        chartTitle = 'Doanh Thu Ròng';
      } else if (chartData.serviceFees && Array.isArray(chartData.serviceFees)) {
        // Fallback: serviceFees
        selectedArray = chartData.serviceFees;
        chartTitle = 'Phí Dịch Vụ';
      }
      
      if (selectedArray) {
        const labels = chartData.labels || selectedArray.map((_, idx) => {
          if (chartPeriod === 'MONTH') return `Tháng ${idx + 1}`;
          if (chartPeriod === 'WEEK') return `Tuần ${idx + 1}`;
          if (chartPeriod === 'YEAR') return `Năm ${idx + 1}`;
          return `Period ${idx + 1}`;
        });
        
        revenueChartFormatted = selectedArray.map((value, idx) => ({
          label: labels[idx] || `Period ${idx + 1}`,
          value: value || 0,
        }));
      }
    }
    // Case 4: Object thông thường (fallback)
    else if (!Array.isArray(chartData) && revenueChartFormatted.length === 0) {
      revenueChartFormatted = [{
        label: chartData.label || chartData.period || chartData.month || chartData.date || chartData.name || chartData.time || 'N/A',
        value: chartData.totalRevenue || chartData.revenue || chartData.total || chartData.amount || chartData.value || chartData.count || 0,
      }];
    }
  }

  // Removed getStatusBadge - now using getRevenueTypeBadge from service

  return (
    <div className="space-y-6">
      <AdminPageHeader 
        icon="📊"
        title="Thống Kê Doanh Thu"
        subtitle="Theo dõi phí dịch vụ và thống kê doanh thu nền tảng"
      />
      <div className="space-y-6">
        {/* Statistics Cards - VER 1.0 */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Service Fees */}
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 p-3 rounded-xl">
                  <span className="text-2xl">💰</span>
                </div>
                <span className="text-sm font-medium opacity-90">Phí Dịch Vụ</span>
              </div>
              <div className="text-3xl font-bold mb-2">
                {formatCurrency(statistics.totalServiceFee || 0)}
              </div>
              <div className="text-sm opacity-90">
                Thu từ shop
              </div>
            </div>

            {/* Platform Discount Loss */}
            <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-6 text-white shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 p-3 rounded-xl">
                  <span className="text-2xl">📉</span>
                </div>
                <span className="text-sm font-medium opacity-90">Tiền Lỗ Giảm Giá</span>
              </div>
              <div className="text-3xl font-bold mb-2">
                {formatCurrency(statistics.totalPlatformDiscountLoss || 0)}
              </div>
              <div className="text-sm opacity-90">
                Sàn chịu
              </div>
            </div>

            {/* Net Revenue */}
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 p-3 rounded-xl">
                  <span className="text-2xl">📊</span>
                </div>
                <span className="text-sm font-medium opacity-90">Doanh Thu Ròng</span>
              </div>
              <div className="text-3xl font-bold mb-2">
                {formatCurrency((statistics.totalServiceFee || 0) - (statistics.totalPlatformDiscountLoss || 0))}
              </div>
              <div className="text-sm opacity-90">
                = Phí DV - Lỗ GG
              </div>
            </div>
          </div>
        )}

        {/* Revenue Chart */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="mb-4">
            <h3 className="text-xl font-bold text-gray-900">Doanh thu theo thời gian</h3>
            <p className="text-sm text-gray-500 mt-1">
              Phân tích doanh thu theo {chartPeriod === 'WEEK' ? 'tuần' : chartPeriod === 'MONTH' ? 'tháng' : 'năm'}
            </p>
          </div>
          
          {/* Chart Type Selector */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setChartType('netRevenue')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                chartType === 'netRevenue'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📊 Doanh Thu Ròng
            </button>
            <button
              onClick={() => setChartType('serviceFees')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                chartType === 'serviceFees'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              💰 Phí Dịch Vụ
            </button>
            <button
              onClick={() => setChartType('discountLosses')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                chartType === 'discountLosses'
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📉 Tiền Lỗ
            </button>
          </div>

          {/* Period Selector */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setChartPeriod('WEEK')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                chartPeriod === 'WEEK'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Tuần
            </button>
            <button
              onClick={() => setChartPeriod('MONTH')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                chartPeriod === 'MONTH'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Tháng
            </button>
            <button
              onClick={() => setChartPeriod('YEAR')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                chartPeriod === 'YEAR'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Năm
            </button>
          </div>
          <Chart
            type="bar"
            data={revenueChartFormatted}
            valueKey="value"
            labelKey="label"
            formatValue={formatCurrency}
            color="blue"
            height="200px"
            className="border-0 shadow-none p-0"
          />
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          {/* Tab Filters - VER 2.0 (27/11/2024) */}
          <div className="flex flex-wrap gap-3 mb-6">
            <button
              onClick={() => { setActiveTab('serviceFee'); setCurrentPage(0); }}
              className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                activeTab === 'serviceFee'
                  ? 'bg-green-500 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              💰 Phí Dịch Vụ
            </button>
            <button
              onClick={() => { setActiveTab('platformLoss'); setCurrentPage(0); }}
              className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                activeTab === 'platformLoss'
                  ? 'bg-red-500 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📉 Tiền Lỗ Giảm Giá
            </button>
            <button
              onClick={() => setActiveTab('dateRange')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                activeTab === 'dateRange'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📅 Theo Ngày
            </button>
          </div>

          {/* Date Range Filter */}
          {activeTab === 'dateRange' && (
            <div className="border-t pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Từ Ngày
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Đến Ngày
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={handleDateRangeSearch}
                    disabled={!startDate || !endDate}
                    className="w-full px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold transition-colors"
                  >
                    🔍 Tìm Kiếm
                  </button>
                </div>
              </div>

              {/* Quick Period Buttons */}
              <div className="flex flex-wrap gap-2">
                <span className="text-sm text-gray-600 mr-2 self-center">Nhanh:</span>
                {['today', 'week', 'month', 'year'].map((period) => (
                  <button
                    key={period}
                    onClick={() => handleQuickPeriod(period)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      quickPeriod === period
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {period === 'today' && '📅 Hôm Nay'}
                    {period === 'week' && '📅 7 Ngày'}
                    {period === 'month' && '📅 30 Ngày'}
                    {period === 'year' && '📅 1 Năm'}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Revenue Table */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800">
                Danh Sách Phí Dịch Vụ
              </h2>
              <div className="text-sm text-gray-600">
                Tổng: <span className="font-bold text-purple-600">{totalElements}</span> bản ghi
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="text-6xl mb-4">❌</div>
                <div className="text-xl font-semibold text-gray-700 mb-2">Có lỗi xảy ra</div>
                <div className="text-gray-600">{error}</div>
              </div>
            </div>
          ) : revenues.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="text-6xl mb-4">📭</div>
                <div className="text-xl font-semibold text-gray-700 mb-2">Không có dữ liệu</div>
                <div className="text-gray-600">Chưa có phí dịch vụ nào</div>
              </div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Order ID
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Cửa Hàng
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Loại
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Số Tiền
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Tổng Đơn
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Ngày Tạo
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {revenues.map((revenue) => {
                      // 🔍 DEBUG: Log revenue structure để tìm field tên cửa hàng
                      if (revenue.revenueType === 'SERVICE_FEE') {
                        console.log('🔍 [Revenue] SERVICE_FEE structure:', {
                          id: revenue.id,
                          shop: revenue.shop,
                          store: revenue.store,
                          storeName: revenue.storeName,
                          shopName: revenue.shopName,
                          order: revenue.order,
                          fullRevenue: revenue
                        });
                      }
                      
                      const typeBadge = getRevenueTypeBadge(revenue.revenueType);
                      const orderTotal = revenue.order?.totalPrice || 0;
                      const shopName = revenue.shop?.name || 
                                       revenue.store?.name || 
                                       revenue.storeName || 
                                       revenue.shopName || 
                                       revenue.order?.store?.name ||
                                       revenue.order?.storeName ||
                                       '-';
                      
                      return (
                        <tr key={revenue.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-mono text-purple-600 font-medium">
                              {getOrderCode(revenue.order?.id)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {shopName}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${typeBadge.bgColor} ${typeBadge.textColor}`}>
                              {typeBadge.icon} {typeBadge.text}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className={`text-sm font-bold ${revenue.revenueType === 'SERVICE_FEE' ? 'text-green-600' : 'text-red-600'}`}>
                              {revenue.revenueType === 'SERVICE_FEE' ? '+' : '-'}{formatCurrency(revenue.amount || 0)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-semibold text-gray-900">
                              {orderTotal > 0 ? formatCurrency(orderTotal) : '-'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-600">
                              {formatDate(revenue.createdAt)}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Trang {currentPage + 1} / {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                      disabled={currentPage === 0}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                    >
                      ← Trước
                    </button>
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                      disabled={currentPage >= totalPages - 1}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                    >
                      Sau →
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminRevenue;
