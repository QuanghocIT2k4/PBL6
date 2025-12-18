# 🔄 QUY TRÌNH TRẢ HÀNG CHO ĐƠN COD (Cash on Delivery)

## 🎯 TỔNG QUAN

Đơn COD (Cash on Delivery) là đơn hàng thanh toán bằng tiền mặt khi nhận hàng. Khi trả hàng, cần thông tin ngân hàng để hoàn tiền vì không có giao dịch online.

---

## 📋 LUỒNG HOẠT ĐỘNG CHI TIẾT

### ✅ **BƯỚC 1: BUYER TẠO YÊU CẦU TRẢ HÀNG**

**Role:** Buyer  
**Trang:** `/orders/returns/new?orderId={orderId}` (ReturnRequestCreatePage)

**Điều kiện:**
- Order status = `DELIVERED`
- Order chưa `COMPLETED`
- Payment method = `COD`

**Hành động:**
1. Buyer vào trang đơn hàng
2. Buyer click "Trả hàng"
3. Buyer điền form:
   - **Lý do trả hàng** (bắt buộc): `DEFECTIVE_PRODUCT`, `WRONG_PRODUCT`, etc.
   - **Mô tả chi tiết** (tùy chọn)
   - **Upload ảnh/video minh chứng** (bắt buộc, tối thiểu 1 file)
   - **Thông tin ngân hàng** (bắt buộc cho COD):
     - Tên ngân hàng (`bankName`)
     - Số tài khoản (`bankAccountNumber`)
     - Tên chủ tài khoản (`bankAccountName`)

**API:**
```http
POST /api/v1/buyer/orders/{orderId}/return?reason=DEFECTIVE_PRODUCT&description=...&bankName=Vietcombank&bankAccountNumber=1234567890&bankAccountName=Nguyen Van A
Content-Type: multipart/form-data

evidenceFiles: [file1.jpg, file2.mp4]
```

**Kết quả:**
- ✅ ReturnRequest được tạo với status = `PENDING`
- ✅ Bank info được lưu trong ReturnRequest
- ✅ Store nhận được thông báo

**Lưu ý:**
- ⚠️ **COD bắt buộc nhập thông tin ngân hàng** để nhận tiền hoàn
- ⚠️ MOMO/VNPAY không cần bank info (hoàn tiền tự động qua payment gateway)

---

### ✅ **BƯỚC 2: STORE PHẢN HỒI YÊU CẦU TRẢ HÀNG**

**Role:** Store  
**Trang:** `/store-dashboard/returns` (StoreReturnRequestsPage)

#### **Trường hợp 2.1: Store chấp nhận**

**Hành động:**
1. Store xem chi tiết return request
2. Store click "Chấp nhận trả hàng"
3. Store xác nhận

**API:**
```http
PUT /api/v1/b2c/returns/store/{storeId}/returnRequest/{returnRequestId}/respond
Content-Type: multipart/form-data

dto: {
  "approved": true,
  "storeResponse": "Chấp nhận yêu cầu trả hàng"
}
```

**Kết quả:**
- ✅ ReturnRequest status: `PENDING` → `APPROVED` → `READY_TO_RETURN`
- ✅ Tạo Shipment mới với type = `RETURN`
- ✅ Shipment status = `READY_TO_PICK`
- ✅ Shipper nhận được thông báo có đơn trả hàng

#### **Trường hợp 2.2: Store từ chối**

**Hành động:**
1. Store click "Từ chối trả hàng"
2. Store nhập lý do từ chối (bắt buộc)
3. Store upload evidence files (tùy chọn)
4. Store xác nhận

**API:**
```http
PUT /api/v1/b2c/returns/store/{storeId}/returnRequest/{returnRequestId}/respond
Content-Type: multipart/form-data

dto: {
  "approved": false,
  "reason": "Lý do từ chối"
}
evidenceFiles: [evidence.jpg] (optional)
```

**Kết quả:**
- ✅ ReturnRequest status: `PENDING` → `REJECTED`
- ✅ Buyer có thể khiếu nại (tạo Dispute)

---

### ✅ **BƯỚC 3: SHIPPER LẤY HÀNG TỪ BUYER**

**Role:** Shipper  
**Trang:** `/shipper` (ShipperDashboard)

**Điều kiện:**
- ReturnRequest status = `READY_TO_RETURN`
- Shipment status = `READY_TO_PICK` hoặc `PICKING`

**Hành động:**
1. Shipper vào tab "Đơn chờ nhận"
2. Shipper thấy đơn trả hàng (có badge "ĐƠN TRẢ HÀNG VỀ SHOP")
3. Shipper click "Nhận đơn"
4. Shipper đến địa chỉ Buyer để lấy hàng
5. Shipper click "Đã lấy hàng (trả)"

**API:**
```http
PUT /api/v1/shipper/shipment/{shipmentId}/picking
PUT /api/v1/shipper/shipment/{shipmentId}/picked
```

**Kết quả:**
- ✅ Shipment status: `READY_TO_PICK` → `PICKING` → `PICKED`
- ✅ Shipper chuyển sang tab "Đơn đang nhận/giao"

---

### ✅ **BƯỚC 4: SHIPPER TRẢ HÀNG VỀ STORE**

**Role:** Shipper  
**Trang:** `/shipper` (ShipperDashboard)

**Điều kiện:**
- Shipment status = `PICKED`

**Hành động:**
1. Shipper vào tab "Đơn đang nhận/giao"
2. Shipper thấy đơn trả hàng với status `PICKED`
3. Shipper click "Bắt đầu trả hàng"
4. Shipper giao hàng về địa chỉ Store
5. Shipper click "Xác nhận đã trả hàng"

**API:**
```http
PUT /api/v1/shipper/shipment/{shipmentId}/returning
PUT /api/v1/shipper/shipment/{shipmentId}/returned
```

**Kết quả:**
- ✅ Shipment status: `PICKED` → `RETURNING` → `RETURNED`
- ✅ ReturnRequest status: `READY_TO_RETURN` → `RETURNED`
- ✅ Shipper chuyển sang tab "Lịch sử giao hàng"
- ✅ Store nhận được thông báo đã nhận hàng trả về

---

### ✅ **BƯỚC 5: STORE XÁC NHẬN NHẬN HÀNG**

**Role:** Store  
**Trang:** `/store-dashboard/returns` (StoreReturnRequestsPage)

**Điều kiện:**
- ReturnRequest status = `RETURNED`
- Store đã kiểm tra hàng trả về

#### **Trường hợp 5.1: Store xác nhận hàng OK**

**Hành động:**
1. Store xem chi tiết return request
2. Store kiểm tra hàng trả về
3. Store click "Xác nhận hàng OK"

**API:**
```http
PUT /api/v1/b2c/returns/store/{storeId}/returnRequest/{returnRequestId}/confirm-ok
```

**Kết quả:**
- ✅ ReturnRequest status: `RETURNED` → `REFUNDED`
- ✅ Tạo RefundRequest với:
  - `paymentMethod` = `COD`
  - `status` = `PENDING` (cần Admin xử lý)
  - `bankName`, `bankAccountNumber`, `bankAccountName` từ ReturnRequest
- ✅ Admin nhận được thông báo có refund request cần xử lý

#### **Trường hợp 5.2: Store khiếu nại chất lượng hàng trả**

**Hành động:**
1. Store click "Khiếu nại chất lượng hàng trả"
2. Store nhập lý do và mô tả
3. Store upload evidence files (ảnh/video)
4. Store gửi khiếu nại

**API:**
```http
POST /api/v1/b2c/returns/store/{storeId}/returnRequest/{returnRequestId}/dispute-quality
Content-Type: multipart/form-data

reason: Hàng bị hư hỏng
description: Mô tả chi tiết
evidenceFiles: [damaged.jpg]
```

**Kết quả:**
- ✅ Dispute được tạo với `disputeType = RETURN_QUALITY`
- ✅ ReturnRequest status: `RETURNED` → `RETURN_DISPUTED`
- ✅ Admin nhận được thông báo

---

### ✅ **BƯỚC 6: ADMIN XỬ LÝ HOÀN TIỀN (CHO COD)**

**Role:** Admin  
**Trang:** `/admin-dashboard/refunds` (AdminRefundsPage)

**Điều kiện:**
- RefundRequest status = `PENDING`
- Payment method = `COD`
- ReturnRequest status = `REFUNDED`

**Hành động:**
1. Admin vào trang "Hoàn tiền"
2. Admin xem danh sách refund requests
3. Admin tìm refund request có `paymentMethod = COD`
4. Admin click "Xử lý"
5. Admin chọn:
   - **Duyệt hoàn tiền** (Approve):
     - Nhập `refundTransactionId` (mã giao dịch chuyển khoản)
     - Nhập `adminNote` (ghi chú)
   - **Từ chối** (Reject):
     - Nhập `rejectionReason` (lý do từ chối)

**API:**
```http
PUT /api/v1/admin/refunds/{refundRequestId}/process
Content-Type: application/json

{
  "decision": "APPROVE", // hoặc "REJECT"
  "refundTransactionId": "1234567890", // (nếu APPROVE)
  "adminNote": "Đã chuyển khoản vào tài khoản",
  "rejectionReason": "Lý do từ chối" // (nếu REJECT)
}
```

**Kết quả:**
- ✅ Nếu APPROVE:
  - RefundRequest status: `PENDING` → `COMPLETED`
  - `refundTransactionId` được lưu
  - Buyer nhận được thông báo đã hoàn tiền
- ✅ Nếu REJECT:
  - RefundRequest status: `PENDING` → `REJECTED`
  - Buyer nhận được thông báo bị từ chối hoàn tiền

**Lưu ý:**
- ⚠️ **COD cần Admin xử lý thủ công** vì không có payment gateway tự động
- ⚠️ Admin cần chuyển khoản vào tài khoản Buyer (theo bank info đã cung cấp)
- ⚠️ Admin nhập `refundTransactionId` để xác nhận đã chuyển khoản

---

## 🔄 SO SÁNH COD VÀ ONLINE PAYMENT (MOMO/VNPAY)

| Bước | COD | MOMO/VNPAY |
|------|-----|------------|
| **Tạo Return Request** | ✅ Cần bank info | ❌ Không cần bank info |
| **Store chấp nhận** | ✅ Tạo Shipment | ✅ Tạo Shipment |
| **Shipper lấy hàng** | ✅ Giống nhau | ✅ Giống nhau |
| **Shipper trả hàng** | ✅ Giống nhau | ✅ Giống nhau |
| **Store xác nhận OK** | ✅ Tạo RefundRequest (PENDING) | ✅ Tự động hoàn tiền (COMPLETED) |
| **Hoàn tiền** | ⚠️ **Cần Admin xử lý** | ✅ **Tự động qua payment gateway** |

---

## 📊 STATUS FLOW CHO COD

```
ReturnRequest:
PENDING → APPROVED → READY_TO_RETURN → RETURNED → REFUNDED

Shipment (Return):
READY_TO_PICK → PICKING → PICKED → RETURNING → RETURNED

RefundRequest (COD):
PENDING → COMPLETED (Admin approve)
       → REJECTED (Admin reject)
```

---

## ⚠️ LƯU Ý QUAN TRỌNG

1. **Bank Info (COD):**
   - ✅ Bắt buộc nhập khi tạo return request
   - ✅ Được lưu trong ReturnRequest
   - ✅ Được copy sang RefundRequest
   - ✅ Admin dùng để chuyển khoản hoàn tiền

2. **Refund Process (COD):**
   - ⚠️ Không tự động như MOMO/VNPAY
   - ⚠️ Cần Admin vào xử lý thủ công
   - ⚠️ Admin chuyển khoản vào tài khoản Buyer
   - ⚠️ Admin nhập `refundTransactionId` để xác nhận

3. **Timeline:**
   - Buyer tạo return request: **Ngày 1**
   - Store chấp nhận: **Ngày 1-2**
   - Shipper lấy hàng: **Ngày 2-3**
   - Shipper trả hàng về Store: **Ngày 3-4**
   - Store xác nhận: **Ngày 4-5**
   - Admin xử lý hoàn tiền: **Ngày 5-7** (tùy Admin)

---

## 🎯 TÓM TẮT

**Quy trình trả hàng COD:**
1. Buyer tạo return request (có bank info)
2. Store chấp nhận → Tạo shipment
3. Shipper lấy hàng từ Buyer
4. Shipper trả hàng về Store
5. Store xác nhận hàng OK → Tạo RefundRequest (PENDING)
6. **Admin xử lý hoàn tiền** → Chuyển khoản vào tài khoản Buyer → Nhập refundTransactionId → COMPLETED

**Điểm khác biệt chính với MOMO/VNPAY:**
- ✅ COD cần bank info khi tạo return request
- ⚠️ COD cần Admin xử lý hoàn tiền thủ công
- ✅ MOMO/VNPAY hoàn tiền tự động qua payment gateway

