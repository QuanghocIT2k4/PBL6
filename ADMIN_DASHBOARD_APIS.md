# 📊 ADMIN DASHBOARD - APIs Đã Dùng và Chưa Dùng

## ✅ APIs ĐÃ ĐƯỢC DÙNG TRONG DASHBOARD

### 1. Overview Statistics
- ✅ `GET /api/v1/admin/statistics/overview` 
  - **Service:** `getOverviewStatistics()`
  - **Dùng trong:** `AdminDashboard.jsx`
  - **Hiển thị:** Tổng số cửa hàng chờ duyệt, sản phẩm chờ duyệt, biến thể chờ duyệt, người dùng, khuyến mãi

### 2. Revenue Chart Data
- ✅ `GET /api/v1/admin/statistics/chart-data?period={WEEK|MONTH|YEAR}`
  - **Service:** `getRevenueChartData(period)`
  - **Dùng trong:** `AdminRevenue.jsx` - Biểu đồ doanh thu trong trang Revenue chi tiết
  - **Hiển thị:** Biểu đồ doanh thu theo thời gian (Tuần/Tháng/Năm)
  - **Lưu ý:** Đã xóa khỏi Dashboard để tránh trùng lặp, chỉ giữ ở trang Revenue

### 3. Fallback APIs (Dùng khi overview không có)
- ✅ `GET /api/v1/admin/stores/pending` - Lấy số cửa hàng chờ duyệt
- ✅ `GET /api/v1/admin/products/pending` - Lấy số sản phẩm chờ duyệt
- ✅ `GET /api/v1/admin/product-variants/pending` - Lấy số biến thể chờ duyệt
- ✅ `GET /api/v1/admin/users` - Lấy số người dùng
- ✅ `GET /api/v1/admin/promotions` - Lấy số khuyến mãi

---

## ⚠️ APIs CHƯA ĐƯỢC DÙNG TRONG DASHBOARD

### 1. Revenue Statistics (Tổng doanh thu)
- ✅ `GET /api/v1/admin/statistics/revenue`
  - **Service:** `getRevenueStatistics()` - ✅ Đã có trong `adminStatisticsService.js`
  - **Dùng trong:** 
    - `AdminDashboard.jsx` - ✅ **Đã thêm** - 3 cards hiển thị tổng doanh thu
    - `AdminRevenue.jsx` - Đang dùng trong trang Revenue
  - **Hiển thị:**
    - Tổng phí dịch vụ (Service Fees)
    - Tổng tiền lỗ giảm giá (Platform Discount Losses)
    - Doanh thu ròng (Net Revenue = Service Fees - Discount Losses)

### 2. Service Fees (Danh sách phí dịch vụ)
- ✅ `GET /api/v1/admin/statistics/service-fees?page=0&size=10&sortBy=createdAt&sortDir=desc`
  - **Service:** `getServiceFees(params)` - ✅ Đã có trong `adminStatisticsService.js`
  - **Dùng trong:** `AdminRevenue.jsx` - Tab "Phí Dịch Vụ"
  - **Hiển thị:** Bảng danh sách các phí dịch vụ đã thu từ các đơn hàng

### 3. Platform Discount Losses (Danh sách tiền lỗ)
- ✅ `GET /api/v1/admin/statistics/platform-discount-losses?page=0&size=10&sortBy=createdAt&sortDir=desc`
  - **Service:** `getPlatformDiscountLosses(params)` - ✅ Đã có trong `adminStatisticsService.js`
  - **Dùng trong:** `AdminRevenue.jsx` - Tab "Tiền Lỗ Giảm Giá"
  - **Hiển thị:** Bảng danh sách các khoản tiền lỗ từ giảm giá sàn

### 4. Revenue by Date Range (Doanh thu theo khoảng thời gian)
- ✅ `GET /api/v1/admin/statistics/date-range?startDate=2025-11-01&endDate=2025-11-30&page=0&size=10`
  - **Service:** `getRevenueByDateRange(params)` - ✅ Đã có trong `adminStatisticsService.js`
  - **Dùng trong:** `AdminRevenue.jsx` - Tab "Theo Ngày"
  - **Hiển thị:** Bộ lọc theo khoảng thời gian tùy chọn

### 5. Shipper Statistics (Thống kê shipper)
- ✅ `GET /api/v1/admin/shipper/statistics`
  - **Service:** `getShipperStatistics()` - ✅ Đã có trong `adminShipperService.js`
  - **Dùng trong:** `AdminShippers.jsx` - Trang quản lý shipper
  - **Hiển thị:** Thống kê về shipper (số lượng, đơn hàng đã giao, v.v.)

---

## 💡 ĐỀ XUẤT THÊM VÀO DASHBOARD

### 1. Thêm Card Tổng Doanh Thu
```jsx
// Sử dụng getRevenueStatistics()
- Tổng phí dịch vụ: XXX đ
- Tổng tiền lỗ: XXX đ  
- Doanh thu ròng: XXX đ
```

### 2. Thêm Bảng Top Service Fees
```jsx
// Sử dụng getServiceFees({ page: 0, size: 5 })
- Hiển thị 5 phí dịch vụ lớn nhất
- Có thể click "Xem tất cả" để chuyển sang trang Revenue
```

### 3. Thêm Bộ Lọc Theo Khoảng Thời Gian
```jsx
// Sử dụng getRevenueByDateRange()
- Date picker để chọn startDate và endDate
- Hiển thị doanh thu trong khoảng thời gian đó
```

### 4. Thêm Thống Kê Shipper
```jsx
// Cần implement getShipperStatistics() trước
- Tổng số shipper
- Số đơn hàng đã giao trong tháng
- Tỷ lệ hoàn thành
```

---

## 📋 TÓM TẮT

| API | Service | Dashboard | Revenue Page | Shipper Page | Ghi chú |
|-----|---------|-----------|--------------|--------------|---------|
| `/statistics/overview` | ✅ | ✅ | ❌ | ❌ | Đang dùng trong Dashboard |
| `/statistics/revenue` | ✅ | ✅ | ✅ | ❌ | **Đã thêm vào Dashboard** - 3 cards doanh thu |
| `/statistics/chart-data` | ✅ | ❌ | ✅ | ❌ | **Chỉ dùng trong Revenue page** (đã xóa khỏi Dashboard) |
| `/statistics/service-fees` | ✅ | ❌ | ✅ | ❌ | Đang dùng trong Revenue page - Tab "Phí Dịch Vụ" |
| `/statistics/platform-discount-losses` | ✅ | ❌ | ✅ | ❌ | Đang dùng trong Revenue page - Tab "Tiền Lỗ Giảm Giá" |
| `/statistics/date-range` | ✅ | ❌ | ✅ | ❌ | Đang dùng trong Revenue page - Tab "Theo Ngày" |
| `/shipper/statistics` | ✅ | ❌ | ❌ | ✅ | Đang dùng trong AdminShippers page |

---

## ✅ KẾT LUẬN

**TẤT CẢ API THỐNG KÊ ĐÃ ĐƯỢC GẮN HẾT!** 🎉

- ✅ **7/7 APIs** đã được implement và sử dụng
- ✅ **Dashboard** (`/admin-dashboard`): Dùng 2 APIs (overview, revenue)
- ✅ **Revenue Page** (`/admin-dashboard/revenue`): Dùng 6 APIs (revenue, chart-data, service-fees, platform-discount-losses, date-range)
- ✅ **Shipper Page** (`/admin-dashboard/shippers`): Dùng 1 API (shipper/statistics)

**Không còn API nào chưa được sử dụng!**

