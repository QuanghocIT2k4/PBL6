import React, { useState, useEffect } from 'react';
import useSWR from 'swr';
import AdminLayout from '../../layouts/AdminLayout';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import { getOrderCode } from '../../utils/displayCodeUtils';
import Chart from '../../components/charts/Chart';
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
  const [activeTab, setActiveTab] = useState('serviceFee'); // 'serviceFee' (platformCommission), 'platformLoss', 'dateRange'
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

  // Chart period state
  const [chartPeriod, setChartPeriod] = useState('MONTH');
  
  // Chart type state - chọn loại biểu đồ
  const [chartType, setChartType] = useState('serviceFee'); // 'serviceFee' (platformCommission), 'discountLoss', 'netRevenue'

  // Fetch chart data
  const { data: chartData } = useSWR(
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
          // Tab "Phí Hoa Hồng Nền Tảng" - lấy theo platformCommission
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

  // Removed getStatusBadge - now using getRevenueTypeBadge from service

  // Format chart data - kiểm tra xem API có trả về cả 3 loại không
  let formattedServiceFeeData = [];
  let formattedDiscountLossData = [];
  let formattedNetRevenueData = [];
  
  if (chartData?.success && chartData.data) {
    const rawData = Array.isArray(chartData.data) ? chartData.data : [chartData.data];
    
    // Handle different data structures
    rawData.forEach((item) => {
      // Kiểm tra xem có cả 3 loại không
      // serviceFees: tên cũ; platformCommissions/platformCommission: tên mới
      const platformCommissionArray =
        item.platformCommissions ||
        item.platformCommission ||
        item.serviceFees ||
        null;

      const hasServiceFees = platformCommissionArray && Array.isArray(platformCommissionArray);
      const hasDiscountLosses = item.discountLosses && Array.isArray(item.discountLosses);
      const hasPlatformDiscountLosses = item.platformDiscountLosses && Array.isArray(item.platformDiscountLosses);
      const hasNetRevenue = item.netRevenue && Array.isArray(item.netRevenue);
      
      const labels = item.labels || platformCommissionArray?.map((_, idx) => {
        if (chartPeriod === 'MONTH') return `Tháng ${idx + 1}`;
        if (chartPeriod === 'WEEK') return `Tuần ${idx + 1}`;
        if (chartPeriod === 'YEAR') return `Năm ${idx + 1}`;
        return `Kỳ ${idx + 1}`;
      }) || [];
      
      // Hoa hồng nền tảng (trước đây là Phí Dịch Vụ)
      if (hasServiceFees) {
        formattedServiceFeeData = platformCommissionArray.map((value, idx) => ({
          label: labels[idx] || `Kỳ ${idx + 1}`,
          value: value || 0,
        }));
      }
      
      // Tiền Lỗ Giảm Giá
      const discountLossArray = hasDiscountLosses ? item.discountLosses : 
                                hasPlatformDiscountLosses ? item.platformDiscountLosses : null;
      if (discountLossArray) {
        formattedDiscountLossData = discountLossArray.map((value, idx) => ({
          label: labels[idx] || `Kỳ ${idx + 1}`,
          value: value || 0,
        }));
      }
      
      // Doanh Thu Ròng
      if (hasNetRevenue) {
        formattedNetRevenueData = item.netRevenue.map((value, idx) => ({
          label: labels[idx] || `Kỳ ${idx + 1}`,
          value: value || 0,
        }));
      } else if (hasServiceFees && discountLossArray) {
        // Tính toán từ platformCommission - discountLosses
        formattedNetRevenueData = platformCommissionArray.map((commission, idx) => {
          const discountLoss = discountLossArray[idx] || 0;
          return {
            label: labels[idx] || `Kỳ ${idx + 1}`,
            value: (commission || 0) - (discountLoss || 0),
          };
        });
      }
      
      // Fallback: chỉ có serviceFees / platformCommission dưới dạng values
      if (!hasServiceFees && item.values && Array.isArray(item.values)) {
        const fallbackLabels = item.labels || item.values.map((_, idx) => {
          if (chartPeriod === 'MONTH') return `Tháng ${idx + 1}`;
          if (chartPeriod === 'WEEK') return `Tuần ${idx + 1}`;
          if (chartPeriod === 'YEAR') return `Năm ${idx + 1}`;
          return `Kỳ ${idx + 1}`;
        });
        
        formattedServiceFeeData = item.values.map((value, idx) => ({
          label: fallbackLabels[idx] || `Kỳ ${idx + 1}`,
          value: value || 0,
        }));
      } else if (!hasServiceFees && Array.isArray(item)) {
        formattedServiceFeeData = item.map((val, idx) => ({
          label: chartPeriod === 'MONTH' ? `Tháng ${idx + 1}` : 
                 chartPeriod === 'WEEK' ? `Tuần ${idx + 1}` : 
                 `Năm ${idx + 1}`,
          value: val || 0,
        }));
      }
    });
  }
  

  return (
    <div className="space-y-6">
      <AdminPageHeader 
        icon="📊"
        title="Thống Kê Doanh Thu"
        subtitle="Theo dõi phí dịch vụ và thống kê doanh thu nền tảng"
      />
      <div className="space-y-6">
        {/* Revenue Chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Biểu đồ Doanh Thu</h2>
              <p className="text-sm text-gray-600">Theo dõi doanh thu theo thời gian</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setChartPeriod('WEEK')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  chartPeriod === 'WEEK'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Tuần
              </button>
              <button
                onClick={() => setChartPeriod('MONTH')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  chartPeriod === 'MONTH'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Tháng
              </button>
              <button
                onClick={() => setChartPeriod('YEAR')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  chartPeriod === 'YEAR'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Năm
              </button>
            </div>
          </div>
          
          {/* Chart Type Selector */}
          <div className="flex gap-2 mb-6 flex-wrap">
            <button
              onClick={() => setChartType('serviceFee')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                chartType === 'serviceFee'
                  ? 'bg-green-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              💰 Phí Dịch Vụ
            </button>
            {formattedDiscountLossData.length > 0 && (
              <button
                onClick={() => setChartType('discountLoss')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  chartType === 'discountLoss'
                    ? 'bg-red-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                📉 Tiền Lỗ Giảm Giá
              </button>
            )}
            {formattedNetRevenueData.length > 0 && (
              <button
                onClick={() => setChartType('netRevenue')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  chartType === 'netRevenue'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                📊 Doanh Thu Ròng
              </button>
            )}
          </div>
          
          {/* Chart Container với scroll */}
          <div className="w-full overflow-x-auto overflow-y-visible pb-4">
            <div className="min-w-full" style={{ minHeight: '600px' }}>
              {/* Render chart based on selected type */}
              {chartType === 'serviceFee' && formattedServiceFeeData.length > 0 && (
                <Chart
                  data={formattedServiceFeeData}
                  type="bar"
                  height="600px"
                  color="green"
                  valueKey="value"
                  labelKey="label"
                  formatValue={(val) => formatCurrency(val)}
                  title="Phí Dịch Vụ"
                  subtitle={`Theo ${chartPeriod === 'WEEK' ? 'tuần' : chartPeriod === 'MONTH' ? 'tháng' : 'năm'}`}
                />
              )}
              
              {chartType === 'discountLoss' && formattedDiscountLossData.length > 0 && (
                <Chart
                  data={formattedDiscountLossData}
                  type="bar"
                  height="600px"
                  color="red"
                  valueKey="value"
                  labelKey="label"
                  formatValue={(val) => formatCurrency(val)}
                  title="Tiền Lỗ Giảm Giá"
                  subtitle={`Theo ${chartPeriod === 'WEEK' ? 'tuần' : chartPeriod === 'MONTH' ? 'tháng' : 'năm'}`}
                />
              )}
              
              {chartType === 'netRevenue' && formattedNetRevenueData.length > 0 && (
                <Chart
                  data={formattedNetRevenueData}
                  type="bar"
                  height="600px"
                  color="blue"
                  valueKey="value"
                  labelKey="label"
                  formatValue={(val) => formatCurrency(val)}
                  title="Doanh Thu Ròng"
                  subtitle={`Theo ${chartPeriod === 'WEEK' ? 'tuần' : chartPeriod === 'MONTH' ? 'tháng' : 'năm'}`}
                />
              )}
              
              {chartType === 'serviceFee' && formattedServiceFeeData.length === 0 && (
                <div className="flex items-center justify-center h-64 text-gray-500">
                  <p>Chưa có dữ liệu Phí Dịch Vụ</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Statistics Cards - VER 2.0 - Updated với các field mới */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            {/* Platform Commission */}
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 p-3 rounded-xl">
                  <span className="text-2xl">💰</span>
                </div>
                <span className="text-sm font-medium opacity-90">Hoa Hồng Nền Tảng</span>
              </div>
              <div className="text-3xl font-bold mb-2">
                {formatCurrency(statistics.totalPlatformCommission || statistics.totalServiceFee || 0)}
              </div>
              <div className="text-sm opacity-90">
                {statistics.platformCommissionCount || 0} đơn hàng
              </div>
            </div>

            {/* Shipping Fees */}
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 p-3 rounded-xl">
                  <span className="text-2xl">🚚</span>
                </div>
                <span className="text-sm font-medium opacity-90">Phí Vận Chuyển</span>
              </div>
              <div className="text-3xl font-bold mb-2">
                {formatCurrency(statistics.totalShippingFee || 0)}
              </div>
              <div className="text-sm opacity-90">
                {statistics.shippingFeeCount || 0} đơn hàng
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
                {formatCurrency(
                  (statistics.totalPlatformCommission || statistics.totalServiceFee || 0) - 
                  (statistics.totalPlatformDiscountLoss || 0)
                )}
              </div>
              <div className="text-sm opacity-90">
                = HH - Lỗ GG
              </div>
            </div>

            {/* Total Revenue */}
            <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl p-6 text-white shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 p-3 rounded-xl">
                  <span className="text-2xl">💵</span>
                </div>
                <span className="text-sm font-medium opacity-90">Tổng Doanh Thu</span>
              </div>
              <div className="text-3xl font-bold mb-2">
                {formatCurrency(
                  (statistics.totalPlatformCommission || statistics.totalServiceFee || 0) + 
                  (statistics.totalShippingFee || 0) - 
                  (statistics.totalPlatformDiscountLoss || 0)
                )}
              </div>
              <div className="text-sm opacity-90">
                HH + VC - Lỗ GG
              </div>
            </div>
          </div>
        )}

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
