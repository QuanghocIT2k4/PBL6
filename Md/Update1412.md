# Cập nhật hệ thống - 14/12/2024

## Quy trình hoàn tiền và Luồng thanh toán đơn hàng
- Sơ đồ: Quy trình vận chuyển.drawio - Google Drive (Cùng chung với sơ đồ quy trình vận chuyển)

---

## B2C Statistics

### API: Lấy sản phẩm bán chạy nhất

**Endpoint:** `GET /api/v1/b2c/statistics/variants/best-selling`

**Mô tả:** Lấy ra danh sách các variant (sản phẩm) bán chạy nhất trong khoảng thời gian được chỉ định.

**Query Parameters:**

| Tên | Loại | Bắt buộc | Mặc định | Mô tả |
|-----|------|----------|----------|-------|
| `storeId` | string | ✅ | - | ID của shop |
| `limit` | integer | ❌ | 10 | Số lượng variant muốn lấy |
| `period` | string | ❌ | MONTH | Kỳ thời gian: `WEEK`, `MONTH`, `YEAR`, `ALL` |

**Giá trị `period`:**
- `WEEK`: 7 ngày vừa qua
- `MONTH`: 30 ngày vừa qua
- `YEAR`: 365 ngày vừa qua
- `ALL`: Tất cả thời gian

**Authentication:** Bearer Token (JWT)

**Ví dụ Request:**
```http
GET /api/v1/b2c/statistics/variants/best-selling?storeId=6909ef08a2c07e8e4b1c3679&limit=10&period=MONTH
Authorization: Bearer <token>
```

**Ví dụ Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "variantId": "...",
      "productName": "...",
      "totalSold": 150,
      "revenue": 15000000,
      ...
    }
  ]
}
```

**Cách test trong Swagger:**
1. Mở Swagger UI: `https://technova-d3gferhtgdaaaedh.eastasia-01.azurewebsites.net/swagger-ui.html`
2. Tìm tag: **"Shop Statistics Management"**
3. Chọn endpoint: `GET /api/v1/b2c/statistics/variants/best-selling`
4. Bấm **"Authorize"** → Nhập Bearer Token
5. Điền parameters:
   - `storeId`: `6909ef08a2c07e8e4b1c3679` (hoặc store ID của bạn)
   - `limit`: `10`
   - `period`: `MONTH` (hoặc WEEK, YEAR, ALL)
6. Bấm **"Execute"**

**Cách test trong Postman:**
1. Method: **GET**
2. URL: `https://technova-d3gferhtgdaaaedh.eastasia-01.azurewebsites.net/api/v1/b2c/statistics/variants/best-selling`
3. **Params tab:**
   - `storeId`: `6909ef08a2c07e8e4b1c3679`
   - `limit`: `10`
   - `period`: `MONTH`
4. **Headers tab:**
   - `Authorization`: `Bearer {token}` (lấy từ `localStorage.getItem('token')`)
   - `Content-Type`: `application/json`
5. Bấm **"Send"**

---

## B2C Product

### Fix: Phương thức tạo product không nhận description

**Vấn đề:** API tạo product trước đây không nhận hoặc không lưu trường `description`.

**Đã sửa:** Backend đã cập nhật để nhận và lưu trường `description` khi tạo product.

**Endpoint:** `POST /api/v1/b2c/products`

**Request Body:**
```json
{
  "name": "Tên sản phẩm",
  "description": "Mô tả chi tiết sản phẩm", // ✅ Đã fix - giờ nhận được
  "categoryId": "...",
  ...
}
```

---

## Buyer Checkout (Thanh toán)

### Thay đổi phương thức thanh toán

**Trước đây:**
- `COD` (Cash on Delivery)
- `BANK_TRANSFER` (Chuyển khoản ngân hàng)
- `E_WALLET` (Ví điện tử)

**Hiện tại:**
- `COD` (Cash on Delivery - Thanh toán khi nhận hàng)
- `VNPAY` (Thanh toán qua VNPay)
- `MOMO` (Thanh toán qua MoMo)

**Lưu ý:** 
- `BANK_TRANSFER` và `E_WALLET` đã được thay thế bằng `VNPAY` và `MOMO`
- Cần cập nhật frontend để sử dụng các giá trị mới

---

## Cách dùng MoMo

**Tài liệu chi tiết:** 
- Link: [E-Commerce/MOMO_REFUND_API_GUIDE.md at NgocHuy · ngochuytech/E-Commerce](https://github.com/ngochuytech/E-Commerce/blob/NgocHuy/MOMO_REFUND_API_GUIDE.md)
- File local: `FE/Md/MOMO_REFUND_API_GUIDE.md`

### Tạo thanh toán MoMo
```http
POST /api/v1/buyer/payments/momo/create_payment_request
Content-Type: application/json

{
  "amount": 50000  // Số tiền (VND), kiểu number
}
```

### Kiểm tra trạng thái thanh toán
```http
GET /api/v1/buyer/payments/momo/check_status/{orderId}
```

### Hoàn tiền MoMo
```http
POST /api/v1/buyer/payments/momo/refund
Content-Type: application/json

{
  "orderId": "MOMO1702537200000",
  "amount": 50000,
  "description": "Hoàn tiền đơn hàng"
}
```

**Lưu ý quan trọng:**
- `amount` phải là kiểu **number**, không phải string
- Đơn vị: **VND** (Việt Nam Đồng)

---

## Hoàn trả thanh toán

### Quy tắc hoàn tiền

1. **Nếu thanh toán bằng chuyển khoản (VNPAY/MoMo):**
   - **Bắt buộc dùng MoMo** để hoàn tiền
   - Hoàn tiền tự động khi:
     - Store chấp nhận yêu cầu trả hàng
     - Admin giải quyết khiếu nại có lợi cho buyer
     - Đơn hàng bị hủy sau khi đã thanh toán

2. **Nếu thanh toán bằng COD:**
   - Không cần hoàn tiền (chưa thu tiền)

3. **Hoàn tiền tự động:**
   - Hệ thống tự động xử lý hoàn tiền cho người mua
   - Không cần thao tác thủ công
   - Thời gian xử lý: Tùy theo phương thức thanh toán (thường 1-3 ngày làm việc)

### Luồng hoàn tiền

```
Đơn hàng đã thanh toán (VNPAY/MoMo)
    ↓
Yêu cầu trả hàng được chấp nhận
    ↓
Hệ thống tự động gọi MoMo Refund API
    ↓
Tiền được hoàn về tài khoản buyer
```

---

## Tổng kết các thay đổi

| Mục | Thay đổi | Trạng thái | Ghi chú |
|-----|---------|------------|---------|
| B2C Statistics | Thêm API best-selling variants | ✅ **ĐÃ HOÀN THÀNH** | - Đã thêm function `getBestSellingVariants()` vào `shopStatisticsService.js`<br>- Đã tích hợp vào Dashboard với UI hiển thị top 10 sản phẩm<br>- Hỗ trợ filter theo period (WEEK/MONTH/YEAR/ALL)<br>- Hiển thị số lượng bán và doanh thu |
| B2C Product | Fix không nhận description | ✅ **HOÀN THÀNH** | Backend đã fix, frontend không cần thay đổi (đã có field description) |
| Payment Methods | Đổi từ BANK_TRANSFER/E_WALLET sang VNPAY/MOMO | ✅ **ĐÃ HOÀN THÀNH** | - Đã xóa BANK_TRANSFER khỏi checkout UI<br>- Đã cập nhật `getPaymentMethodLabel()` để map cũ sang mới<br>- Đã cập nhật `CheckoutPage.jsx` và `StoreOrderDetail.jsx`<br>- Giữ backward compatibility cho đơn hàng cũ |
| MoMo Integration | Tích hợp thanh toán và hoàn tiền MoMo | ✅ **ĐÃ HOÀN THÀNH** | - Đã tạo `momoPaymentService.js` với đầy đủ functions<br>- Đã tích hợp vào `CheckoutPage.jsx`<br>- Hỗ trợ: create payment, check status, refund, check refund status |
| Auto Refund | Hoàn tiền tự động cho buyer | ✅ **HOÀN THÀNH** | Backend tự động xử lý, frontend đã có service để refund nếu cần |

---

## Chi tiết implementation

### ✅ ĐÃ HOÀN THÀNH: B2C Statistics - Best Selling Variants

**Files đã thay đổi:**
1. `FE/src/services/b2c/shopStatisticsService.js`
   - Thêm function `getBestSellingVariants(storeId, limit, period)`
   - Xử lý nhiều format response từ backend
   - Error handling và logging

2. `FE/src/pages/store/StoreDashboard.jsx`
   - Import và sử dụng `getBestSellingVariants`
   - Thêm section "Sản phẩm bán chạy" với UI đẹp
   - Filter buttons cho period (Tuần/Tháng/Năm/Tất cả)
   - Hiển thị top 10 sản phẩm với:
     - Rank badges (🥇🥈🥉)
     - Product images
     - Product names và variant names
     - Số lượng đã bán
     - Doanh thu (nếu có)
   - Responsive grid layout (1/2/3 columns)
   - Loading states và error handling

**Tính năng:**
- ✅ Fetch top 10 sản phẩm bán chạy từ API
- ✅ Filter theo period (WEEK/MONTH/YEAR/ALL)
- ✅ Hiển thị rank, ảnh, tên, số lượng bán, doanh thu
- ✅ Responsive design
- ✅ Error handling và empty states

---

### ✅ ĐÃ HOÀN THÀNH: Payment Methods - VNPAY/MOMO

**Files đã thay đổi:**
1. `FE/src/services/buyer/orderService.js`
   - Cập nhật `getPaymentMethodLabel()` để map `BANK_TRANSFER` → `VNPAY`, `E_WALLET` → `MOMO`
   - Giữ backward compatibility cho đơn hàng cũ

2. `FE/src/pages/checkout/CheckoutPage.jsx`
   - Xóa radio button `BANK_TRANSFER`
   - Chỉ hiển thị: COD, VNPAY, MOMO
   - Xóa logic chuyển `VNPAY` thành `BANK_TRANSFER`
   - Cải thiện UI với icons và hover effects

3. `FE/src/pages/store/StoreOrderDetail.jsx`
   - Cập nhật hiển thị payment method
   - Map các method cũ sang mới để backward compatibility
   - Import và sử dụng `getPaymentMethodLabel()`

**Tính năng:**
- ✅ Chỉ hiển thị 3 payment methods: COD, VNPAY, MOMO
- ✅ Backward compatibility với đơn hàng cũ (BANK_TRANSFER, E_WALLET)
- ✅ UI/UX cải thiện với icons

---

### ✅ ĐÃ HOÀN THÀNH: MoMo Integration

**Files đã tạo/thay đổi:**
1. `FE/src/services/buyer/momoPaymentService.js` (MỚI)
   - `createMoMoPayment(amount)` - Tạo payment request
   - `checkMoMoPaymentStatus(orderId)` - Kiểm tra trạng thái thanh toán
   - `refundMoMoPayment(refundData)` - Hoàn tiền
   - `checkMoMoRefundStatus(orderId)` - Kiểm tra trạng thái hoàn tiền
   - Xử lý nhiều format response từ backend
   - Error handling đầy đủ

2. `FE/src/pages/checkout/CheckoutPage.jsx`
   - Import `createMoMoPayment`
   - Thêm logic xử lý MoMo payment tương tự VNPay
   - Redirect user đến MoMo payment gateway
   - Error handling và user feedback

**Tính năng:**
- ✅ Tạo MoMo payment request
- ✅ Redirect đến MoMo gateway
- ✅ Hỗ trợ check payment status
- ✅ Hỗ trợ refund (có thể dùng sau)
- ✅ Error handling đầy đủ

---

### ✅ HOÀN THÀNH: B2C Product & Auto Refund

**B2C Product - Fix description:**
- Backend đã fix, frontend không cần thay đổi (đã có field description trong form)

**Auto Refund:**
- Backend tự động xử lý hoàn tiền
- Frontend đã có service `refundMoMoPayment()` nếu cần refund thủ công