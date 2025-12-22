# 🔴 Các Lỗi Cần Backend Fix

## 📋 Tổng Quan
File này liệt kê các lỗi và vấn đề cần backend xử lý để frontend có thể hoạt động đầy đủ.

---

## 1. ⚠️ Admin Revenue cho đơn đã hủy/hoàn tiền

### Vấn đề:
- **Hiện tại**: Backend vẫn tạo `AdminRevenue` (SERVICE_FEE, SHIPPING_FEE) cho các đơn đã hủy (CANCELLED) hoặc đã hoàn tiền (REFUNDED, RETURNED)
- **Frontend**: Phải filter ra các đơn này, làm chậm load và không đúng nghiệp vụ
- **Database**: Các đơn đã hủy vẫn còn lưu revenue trong `Admin_Revenue` table

### Logic đúng:
- **KHÔNG NÊN** tạo revenue trong `Admin_Revenue` table cho đơn có status:
  - `CANCELLED` (Đã hủy)
  - `REFUNDED` (Đã hoàn tiền)
  - `RETURNED` (Đã trả hàng)
  - `PARTIAL_REFUND` (Hoàn tiền một phần)
- Nếu đơn bị hủy/hoàn tiền sau khi đã tạo revenue, cần **xóa hoặc revert** revenue đó

### Giải pháp đề xuất (Backend):

#### Option 1: Filter ở API (Khuyến nghị - nhanh nhất)
- API `/api/v1/admin/statistics/platform-commissions` chỉ trả về revenue của đơn hợp lệ
- API `/api/v1/admin/statistics/shipping-fees` chỉ trả về revenue của đơn hợp lệ
- Filter SQL: `WHERE order.status NOT IN ('CANCELLED', 'REFUNDED', 'RETURNED', 'PARTIAL_REFUND')`

#### Option 2: Không tạo revenue cho đơn đã hủy
- Khi tạo order, chỉ tạo revenue nếu order status hợp lệ
- Khi order bị hủy/hoàn tiền, xóa hoặc revert revenue tương ứng

### Impact:
- **Hiện tại**: Frontend phải fetch tất cả rồi filter → chậm, tốn băng thông, load lâu
- **Sau khi fix**: Backend chỉ trả về đơn hợp lệ → nhanh, đúng nghiệp vụ, không cần filter ở FE

### Frontend tạm thời:
- Đang filter ở FE để đảm bảo UI không hiển thị đơn không hợp lệ
- Sẽ bỏ filter khi backend fix

---

## 2. ❌ API Admin Xem Chi Tiết Đơn Hàng Không Tồn Tại

### Vấn đề:
- **API Endpoint**: `GET /api/v1/admin/orders/:orderId`
- **Lỗi hiện tại**: `500 Internal Server Error` - "No static resource api/v1/admin/orders/:orderId"
- **Vị trí**: Trang Admin Dispute Detail (`/admin-dashboard/disputes/:disputeId`)

### Mô tả:
Khi admin xem chi tiết khiếu nại, frontend cần hiển thị thông tin đơn hàng để tính toán số tiền hoàn tiền một phần. Tuy nhiên, API để lấy chi tiết đơn hàng chưa được implement.

### Dữ liệu cần thiết:
Để tính hoàn tiền một phần, cần các thông tin sau từ order:
- `productPrice` hoặc `totalPrice`: Tổng tiền sản phẩm
- `storeDiscountAmount`: Giảm giá của shop
- `platformCommission` hoặc `serviceFee`: Hoa hồng của sàn
- `shippingFee`: Phí ship (để hiển thị note "Người mua chịu")
- `platformDiscountAmount`: Giảm giá sàn (nếu có)

### Công thức tính:
```
Số tiền tối đa có thể hoàn một phần = productPrice - storeDiscountAmount - platformCommission
```

### Giải pháp đề xuất (chọn 1 trong 2):

#### Option 1: Implement API Admin Orders
- Tạo endpoint: `GET /api/v1/admin/orders/:orderId`
- Response cần có đầy đủ thông tin order như trên
- Admin có quyền xem bất kỳ order nào

#### Option 2: Thêm Order Detail vào Dispute Response
- Thêm field `order` (object) vào response của `GET /api/v1/admin/disputes/:disputeId`
- Object `order` cần có đầy đủ thông tin như trên
- Không cần gọi API riêng, tiết kiệm request

### Ưu tiên:
**Option 2** được khuyến nghị vì:
- Giảm số lượng API call
- Dữ liệu đã có sẵn trong dispute context
- Frontend không cần thêm logic phức tạp

