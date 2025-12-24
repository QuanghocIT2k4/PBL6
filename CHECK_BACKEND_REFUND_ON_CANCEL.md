# 🔍 Kiểm Tra Backend: Hoàn Tiền Khi Khách Hủy Đơn Trước Khi Shop Xác Nhận

## 📋 Yêu Cầu

**Trường hợp:** Khách hàng hủy đơn trước khi shop xác nhận, đơn đã thanh toán bằng **MoMo**.

**Yêu cầu:** Backend phải **tự động hoàn tiền MoMo** cho khách hàng (100% số tiền đã thanh toán, bao gồm phí ship nếu đã thu).

---

## ✅ Logic Đã Được Mô Tả Trong Tài Liệu

File: `LOGIC_XU_LY_TIEN_UPDATED.md` - Phần "🆕 Trường hợp khách hủy trước khi shop xác nhận"

### Xử lý tiền (online):
- **Khách:** Hoàn lại **100% số tiền đã thanh toán** (bao gồm phí ship nếu đã thu).
- **Shop:** Giải phóng toàn bộ `pendingAmount` về 0, **không** chuyển sang `Balance`.
- **Admin (Sàn):** **Không** tính hoa hồng, **không** tạo revenue, **không** cảnh báo shop.

---

## 🔍 Cần Kiểm Tra Backend

### 1. API Cancel Order
**Endpoint:** `PUT /api/v1/buyer/orders/{orderId}/cancel`

**Cần kiểm tra:**
- [ ] Backend có **tự động kiểm tra** `paymentMethod = MOMO` và `paymentStatus = PAID` không?
- [ ] Backend có **tự động gọi API MoMo Refund** (`POST /api/v1/buyer/payments/momo/refund`) không?
- [ ] Backend có lưu `transId` từ payment MoMo để dùng cho refund không?
- [ ] Backend có cập nhật `paymentStatus = REFUNDED` sau khi refund thành công không?
- [ ] Backend có giải phóng `pendingAmount` của shop về 0 không?

### 2. API MoMo Refund
**Endpoint:** `POST /api/v1/buyer/payments/momo/refund`

**Request Body:**
```json
{
  "transId": 2820086739,  // Mã giao dịch MoMo từ payment thành công
  "amount": 50000,        // Số tiền hoàn (100% số tiền đã thanh toán)
  "description": "Hoàn tiền do khách hàng hủy đơn trước khi shop xác nhận"
}
```

**Cần kiểm tra:**
- [ ] Backend có endpoint này không?
- [ ] Backend có lưu `transId` vào database khi payment MoMo thành công không?
- [ ] Backend có validate `transId` và `amount` trước khi gọi MoMo API không?

### 3. Flow Xử Lý Khi Cancel

**Flow mong đợi:**

```
1. User gọi PUT /api/v1/buyer/orders/{orderId}/cancel
   │
   ├─ Backend kiểm tra:
   │  ├─ order.status = PENDING? ✅
   │  ├─ order.paymentMethod = MOMO? ✅
   │  └─ order.paymentStatus = PAID? ✅
   │
   ├─ Nếu đúng → Backend tự động:
   │  ├─ Lấy transId từ order/payment record
   │  ├─ Gọi POST /api/v1/buyer/payments/momo/refund
   │  │  └─ transId: order.transId
   │  │  └─ amount: order.totalPrice (hoặc order.totalAmount)
   │  │  └─ description: "Hoàn tiền do khách hàng hủy đơn"
   │  │
   │  ├─ Nếu refund thành công:
   │  │  ├─ Cập nhật order.paymentStatus = REFUNDED
   │  │  ├─ Cập nhật order.status = CANCELLED
   │  │  ├─ Giải phóng shop.pendingAmount về 0
   │  │  └─ Không tạo revenue cho admin
   │  │
   │  └─ Nếu refund thất bại:
   │     ├─ Log lỗi
   │     ├─ Có thể tạo RefundRequest để admin xử lý sau
   │     └─ Hoặc trả về lỗi cho FE
   │
   └─ Nếu COD → Chỉ cập nhật status = CANCELLED (không refund)
```

---

## ⚠️ Các Trường Hợp Cần Xử Lý

### Case 1: Đơn COD
- **Không cần refund** vì chưa thu tiền.
- Chỉ cập nhật `status = CANCELLED`.

### Case 2: Đơn MoMo - Chưa thanh toán (UNPAID)
- **Không cần refund** vì chưa thu tiền.
- Chỉ cập nhật `status = CANCELLED`.

### Case 3: Đơn MoMo - Đã thanh toán (PAID)
- **Cần refund** → Gọi MoMo Refund API.
- Hoàn lại 100% số tiền đã thanh toán.

### Case 4: Đơn VNPay - Đã thanh toán (PAID)
- **Cần refund** → Gọi VNPay Refund API (nếu có).
- Hoàn lại 100% số tiền đã thanh toán.

---

## 📝 Checklist Cho Backend Dev

### Database Schema
- [ ] Order có field `transId` để lưu mã giao dịch MoMo không?
- [ ] Order có field `paymentStatus` (PAID/UNPAID/REFUNDED) không?
- [ ] Payment record có lưu `transId` từ MoMo response không?

### API Implementation
- [ ] `PUT /api/v1/buyer/orders/{orderId}/cancel` có logic tự động refund không?
- [ ] Có service xử lý MoMo Refund không?
- [ ] Có xử lý lỗi khi refund thất bại không?
- [ ] Có log đầy đủ cho việc refund không?

### Business Logic
- [ ] Có validate order.status = PENDING trước khi refund không?
- [ ] Có validate paymentMethod và paymentStatus trước khi refund không?
- [ ] Có giải phóng pendingAmount của shop không?
- [ ] Có cập nhật paymentStatus = REFUNDED sau khi refund thành công không?

---

## 🧪 Test Cases Cần Kiểm Tra

### Test Case 1: Cancel Order MoMo - Đã PAID
1. Tạo đơn hàng với paymentMethod = MOMO
2. Thanh toán MoMo thành công → paymentStatus = PAID
3. Gọi API cancel order
4. **Kỳ vọng:** 
   - Backend tự động gọi MoMo Refund API
   - order.paymentStatus = REFUNDED
   - order.status = CANCELLED
   - shop.pendingAmount giảm về 0

### Test Case 2: Cancel Order MoMo - Chưa PAID
1. Tạo đơn hàng với paymentMethod = MOMO
2. Chưa thanh toán → paymentStatus = UNPAID
3. Gọi API cancel order
4. **Kỳ vọng:**
   - Không gọi MoMo Refund API
   - order.status = CANCELLED
   - shop.pendingAmount giảm về 0

### Test Case 3: Cancel Order COD
1. Tạo đơn hàng với paymentMethod = COD
2. Gọi API cancel order
3. **Kỳ vọng:**
   - Không gọi refund API nào
   - order.status = CANCELLED
   - shop.pendingAmount giảm về 0

---

## 📌 Kết Luận

**Cần Backend xác nhận:**
1. ✅ Backend đã implement logic tự động refund khi cancel order MoMo chưa?
2. ✅ Backend có lưu `transId` từ MoMo payment để dùng cho refund không?
3. ✅ Backend có xử lý trường hợp refund thất bại không?
4. ✅ Backend có cập nhật đầy đủ các trạng thái (order.status, paymentStatus, pendingAmount) không?

**Nếu chưa implement:**
- Backend cần bổ sung logic tự động refund trong API `PUT /api/v1/buyer/orders/{orderId}/cancel`
- Backend cần đảm bảo lưu `transId` khi payment MoMo thành công
- Backend cần xử lý các trường hợp lỗi khi refund

---

**Ngày tạo:** 23/12/2025  
**Mục đích:** Kiểm tra và xác nhận backend đã xử lý đúng logic hoàn tiền khi khách hủy đơn trước khi shop xác nhận.


