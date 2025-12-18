# 📋 KẾ HOẠCH TEST - CÁC TÍNH NĂNG MỚI

## 🎯 MỤC TIÊU
Test các tính năng mới được thêm vào hệ thống dựa trên:
- `Update1412.md` - Các thay đổi mới nhất
- `NEW_APIS_DOCUMENTATION.md` - API mới
- `RETURN_DISPUTE_MODELS_GUIDE.md` - Models mới
- `Quy trình vận chuyển.drawio.xml` - Workflow

---

## 📊 THỨ TỰ TEST THEO ĐỘ ƯU TIÊN

### 🔴 **PRIORITY 1: CORE ORDER FLOW (Test trước tiên)**

#### 1.1. Order Status Flow - Hoàn tất đơn hàng
**Mục đích:** Đảm bảo flow cơ bản hoạt động đúng

**Test Cases:**
1. ✅ **Buyer xác nhận hoàn tất đơn hàng**
   - **API:** `PUT /api/v1/buyer/orders/{orderId}/complete`
   - **Precondition:** Order status = `DELIVERED`
   - **Expected:** 
     - Order status chuyển thành `COMPLETED`
     - `completedAt` được set
     - Không thể trả hàng sau khi `COMPLETED`
   - **Test trên UI:** Button "Hoàn tất" trong `OrderCard.jsx`

2. ✅ **Auto-complete sau 7 ngày**
   - **Precondition:** Order `DELIVERED` > 7 ngày, buyer chưa xác nhận
   - **Expected:** Hệ thống tự động set status = `COMPLETED`
   - **Note:** Cần test scheduled service (cron job)

3. ❌ **Không thể complete order chưa DELIVERED**
   - **Precondition:** Order status = `PENDING`, `CONFIRMED`, `SHIPPING`
   - **Expected:** API trả về lỗi 400

---

### 🟠 **PRIORITY 2: RETURN REQUEST FLOW (Test tiếp theo)**

#### 2.1. Buyer tạo yêu cầu trả hàng
**Mục đích:** Đảm bảo buyer có thể tạo return request

**Test Cases:**
1. ✅ **Tạo return request thành công**
   - **API:** `POST /api/v1/buyer/orders/{orderId}/return`
   - **Precondition:** Order status = `DELIVERED`, chưa `COMPLETED`
   - **Request:**
     - `reason`: `DEFECTIVE_PRODUCT`, `WRONG_PRODUCT`, etc.
     - `description`: Mô tả chi tiết
     - `evidenceFiles`: Upload 1-5 file (ảnh/video)
   - **Expected:**
     - ReturnRequest được tạo với status = `PENDING`
     - Files được upload lên Cloudinary
     - `refundAmount` = tổng tiền đơn hàng
   - **Test trên UI:** Button "Trả hàng" trong `OrderCard.jsx` → `BuyerReturnRequestsPage.jsx`

2. ✅ **Upload evidence files**
   - **Test:** Upload ảnh (JPEG, PNG, WebP) và video (MP4, MPEG, MOV, AVI, WebM)
   - **Test:** Upload nhiều file (1-5 files)
   - **Test:** File quá lớn (>30MB ảnh, >100MB video) → Error
   - **Test:** File không đúng format → Error

3. ❌ **Không thể trả hàng đơn đã COMPLETED**
   - **Precondition:** Order status = `COMPLETED`
   - **Expected:** Button "Trả hàng" không hiển thị hoặc disabled

4. ❌ **Không thể trả hàng đơn chưa DELIVERED**
   - **Precondition:** Order status = `PENDING`, `CONFIRMED`, `SHIPPING`
   - **Expected:** API trả về lỗi 400

#### 2.2. Buyer xem danh sách return requests
**Test Cases:**
1. ✅ **Xem danh sách return requests của buyer**
   - **API:** `GET /api/v1/buyer/return-requests`
   - **Expected:** Hiển thị tất cả return requests của buyer hiện tại
   - **Test trên UI:** `BuyerReturnRequestsPage.jsx`

2. ✅ **Xem chi tiết return request**
   - **API:** `GET /api/v1/buyer/return-requests/{returnRequestId}`
   - **Expected:** Hiển thị đầy đủ thông tin, evidence media, status

---

### 🟡 **PRIORITY 3: STORE RESPONSE FLOW**

#### 3.1. Store phản hồi return request
**Test Cases:**
1. ✅ **Store chấp nhận trả hàng**
   - **API:** `PUT /api/v1/b2c/return-requests/{returnRequestId}/approve`
   - **Precondition:** ReturnRequest status = `PENDING`
   - **Expected:**
     - Status chuyển thành `APPROVED`
     - Tạo Shipment với type = `RETURN`
     - Status chuyển thành `READY_TO_RETURN`

2. ✅ **Store từ chối trả hàng**
   - **API:** `PUT /api/v1/b2c/return-requests/{returnRequestId}/reject`
   - **Request:**
     - `rejectReason`: Lý do từ chối
     - `evidenceFiles`: Ảnh/video minh chứng (optional)
   - **Expected:**
     - Status chuyển thành `REJECTED`
     - Buyer có thể tạo Dispute

3. ✅ **Store xem danh sách return requests**
   - **API:** `GET /api/v1/b2c/return-requests`
   - **Test trên UI:** `StoreReturnRequestsPage.jsx`

---

### 🟢 **PRIORITY 4: DISPUTE FLOW**

#### 4.1. Buyer tạo dispute khi bị từ chối
**Test Cases:**
1. ✅ **Tạo dispute khi return bị từ chối**
   - **API:** `POST /api/v1/buyer/return-requests/{returnRequestId}/dispute`
   - **Precondition:** ReturnRequest status = `REJECTED`
   - **Request:**
     - `disputeType`: `RETURN_REJECTION`
     - `description`: Mô tả
     - `evidenceFiles`: Ảnh/video (optional)
   - **Expected:**
     - Dispute được tạo với status = `OPEN`
     - ReturnRequest status = `DISPUTED`

2. ✅ **Buyer gửi message trong dispute**
   - **API:** `POST /api/v1/buyer/disputes/{disputeId}/messages`
   - **Expected:** Message được thêm vào dispute

3. ✅ **Buyer xem danh sách disputes**
   - **API:** `GET /api/v1/buyer/disputes`
   - **Test trên UI:** `BuyerDisputesPage.jsx`

#### 4.2. Store khiếu nại chất lượng hàng trả về
**Test Cases:**
1. ✅ **Store khiếu nại hàng trả về có vấn đề**
   - **API:** `POST /api/v1/b2c/return-requests/{returnRequestId}/dispute-quality`
   - **Precondition:** ReturnRequest status = `RETURNED`
   - **Request:**
     - `reason`: Lý do
     - `description`: Mô tả
     - `evidenceFiles`: Ảnh/video minh chứng
   - **Expected:**
     - ReturnRequest `storeDisputedReturnedGoods` = true
     - Tạo Dispute với `disputeType` = `RETURN_QUALITY`
     - Status = `RETURN_DISPUTED`

---

### 🔵 **PRIORITY 5: ADMIN DISPUTE RESOLUTION**

#### 5.1. Admin giải quyết dispute
**Test Cases:**
1. ✅ **Admin xem danh sách disputes**
   - **API:** `GET /api/v1/admin/disputes`
   - **Test trên UI:** `AdminDisputesPage.jsx`

2. ✅ **Admin xem chi tiết dispute**
   - **API:** `GET /api/v1/admin/disputes/{disputeId}`
   - **Expected:** Hiển thị đầy đủ thông tin, messages, evidence

3. ✅ **Admin giải quyết dispute - Chấp nhận return**
   - **API:** `PUT /api/v1/admin/disputes/{disputeId}/resolve`
   - **Request:**
     - `decision`: `APPROVE_RETURN` hoặc `REJECT_RETURN`
     - `reason`: Lý do quyết định
   - **Expected:**
     - Dispute status = `RESOLVED`
     - ReturnRequest được cập nhật theo quyết định
     - Nếu APPROVE: Refund cho buyer
     - Nếu REJECT: ReturnRequest status = `CLOSED`

4. ✅ **Admin giải quyết dispute chất lượng hàng trả**
   - **Request:**
     - `decision`: `APPROVE_STORE` hoặc `REJECT_STORE`
   - **Expected:**
     - Nếu APPROVE_STORE: ReturnRequest status = `REFUND_TO_STORE`
     - Nếu REJECT_STORE: ReturnRequest status = `REFUNDED` (refund cho buyer)

---

### 🟣 **PRIORITY 6: SHIPMENT MANAGEMENT**

#### 6.1. Store tạo shipment
**Test Cases:**
1. ✅ **Store tạo shipment cho order**
   - **API:** `POST /api/v1/b2c/shipments/order/{orderId}`
   - **Precondition:** Order status = `CONFIRMED`
   - **Expected:**
     - Shipment được tạo với status = `READY_TO_PICK`
     - Order status có thể chuyển thành `SHIPPING`

#### 6.2. Shipper quản lý shipment
**Test Cases:**
1. ✅ **Shipper xem danh sách shipments**
   - **API:** `GET /api/v1/shipper/shipments`
   - **Expected:** Hiển thị shipments có status = `READY_TO_PICK`

2. ✅ **Shipper nhận đơn (pick)**
   - **API:** `PUT /api/v1/shipper/shipments/{shipmentId}/pick`
   - **Expected:** Status chuyển thành `PICKING` → `PICKED`

3. ✅ **Shipper bắt đầu giao hàng**
   - **API:** `PUT /api/v1/shipper/shipments/{shipmentId}/start-shipping`
   - **Expected:** Status chuyển thành `SHIPPING`

4. ✅ **Shipper hoàn thành giao hàng**
   - **API:** `PUT /api/v1/shipper/shipments/{shipmentId}/complete`
   - **Expected:** 
     - Status chuyển thành `DELIVERED`
     - Order status chuyển thành `DELIVERED`

5. ✅ **Shipper giao hàng thất bại**
   - **API:** `PUT /api/v1/shipper/shipments/{shipmentId}/fail`
   - **Request:** `failReason`: Lý do thất bại
   - **Expected:** Status chuyển thành `DELIVERED_FAIL`

6. ✅ **Shipper xử lý return shipment**
   - **API:** `PUT /api/v1/shipper/shipments/{shipmentId}/return`
   - **Expected:** Status chuyển thành `RETURNING` → `RETURNED`

---

## 🧪 TEST SCENARIOS (End-to-End)

### Scenario 1: Happy Path - Trả hàng thành công
1. Buyer nhận hàng (Order = `DELIVERED`)
2. Buyer tạo return request với evidence
3. Store chấp nhận return request
4. Shipper nhận hàng trả về
5. Store xác nhận nhận hàng trả
6. Refund cho buyer
7. ReturnRequest status = `REFUNDED`

### Scenario 2: Store từ chối → Buyer khiếu nại → Admin giải quyết
1. Buyer tạo return request
2. Store từ chối với lý do
3. Buyer tạo dispute
4. Admin xem và giải quyết dispute
5. Nếu admin chấp nhận: Refund cho buyer
6. Nếu admin từ chối: ReturnRequest = `CLOSED`

### Scenario 3: Store khiếu nại chất lượng hàng trả
1. Buyer trả hàng
2. Store nhận hàng trả về
3. Store khiếu nại hàng có vấn đề
4. Admin xem và giải quyết
5. Nếu approve store: Refund cho store
6. Nếu reject store: Refund cho buyer

---

## 📝 CHECKLIST TEST

### ✅ Backend APIs
- [ ] Tất cả endpoints trả về đúng status code
- [ ] Validation đúng (required fields, enum values)
- [ ] Authentication/Authorization đúng
- [ ] File upload hoạt động (Cloudinary)
- [ ] Business logic đúng (status transitions)
- [ ] Database models đúng structure

### ✅ Frontend UI
- [ ] Tất cả pages render đúng
- [ ] Navigation links hoạt động
- [ ] Forms submit đúng
- [ ] File upload UI hoạt động
- [ ] Status badges hiển thị đúng
- [ ] Error handling hiển thị đúng

### ✅ Integration
- [ ] Frontend gọi đúng API endpoints
- [ ] Data flow từ API → UI đúng
- [ ] State management đúng (SWR cache)
- [ ] Real-time updates (nếu có)

---

## 🚨 CÁC LỖI THƯỜNG GẶP CẦN KIỂM TRA

1. **File Upload:**
   - File quá lớn
   - File không đúng format
   - Upload nhiều file
   - Cloudinary connection

2. **Status Transitions:**
   - Chuyển status không đúng workflow
   - Missing required fields khi chuyển status
   - Race conditions (2 requests cùng lúc)

3. **Authorization:**
   - Buyer chỉ thấy return requests của mình
   - Store chỉ thấy return requests của store mình
   - Admin có quyền xem tất cả

4. **Data Validation:**
   - Enum values đúng
   - Required fields
   - Data types đúng

---

## 📅 THỜI GIAN TEST ƯỚC TÍNH

- **Priority 1 (Core Order Flow):** 1-2 giờ
- **Priority 2 (Return Request):** 2-3 giờ
- **Priority 3 (Store Response):** 1-2 giờ
- **Priority 4 (Dispute):** 2-3 giờ
- **Priority 5 (Admin Resolution):** 1-2 giờ
- **Priority 6 (Shipment):** 1-2 giờ
- **End-to-End Scenarios:** 2-3 giờ

**Tổng:** ~12-17 giờ

---

## 🎯 KẾT LUẬN

**Bắt đầu test theo thứ tự:**
1. ✅ Order Complete Flow (Priority 1)
2. ✅ Return Request Creation (Priority 2)
3. ✅ Store Response (Priority 3)
4. ✅ Dispute Flow (Priority 4)
5. ✅ Admin Resolution (Priority 5)
6. ✅ Shipment Management (Priority 6)

**Sau đó test End-to-End Scenarios để đảm bảo toàn bộ flow hoạt động đúng.**


