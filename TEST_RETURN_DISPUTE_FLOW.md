# 🔄 TEST PLAN - LUỒNG TRẢ HÀNG VÀ KHIẾU NẠI

## 🎯 MỤC TIÊU
Test toàn bộ luồng trả hàng và khiếu nại từ khi buyer tạo return request → Store phản hồi → Dispute → Admin giải quyết.

---

## 📋 LUỒNG HOẠT ĐỘNG TỔNG QUAN

```
1. BUYER TẠO RETURN REQUEST
   ↓
   ReturnRequest Status: PENDING
   
2. STORE PHẢN HỒI
   ├─→ APPROVED → READY_TO_RETURN → RETURNING → RETURNED → REFUNDED
   └─→ REJECTED → DISPUTED (Buyer khiếu nại)
   
3. BUYER KHIẾU NẠI (Nếu bị từ chối)
   ↓
   Dispute Status: OPEN
   DisputeType: RETURN_REJECTION
   
4. ADMIN GIẢI QUYẾT DISPUTE
   ├─→ APPROVE_RETURN → READY_TO_RETURN → ... → REFUNDED
   └─→ REJECT_RETURN → CLOSED
   
5. STORE KHIẾU NẠI CHẤT LƯỢNG HÀNG TRẢ (Nếu có vấn đề)
   ↓
   Dispute Status: OPEN
   DisputeType: RETURN_QUALITY
   
6. ADMIN GIẢI QUYẾT DISPUTE CHẤT LƯỢNG
   ├─→ APPROVE_STORE → REFUND_TO_STORE
   └─→ REJECT_STORE → REFUNDED (cho buyer)
```

---

## 🧪 TEST CASES CHI TIẾT

### ✅ **BƯỚC 1: BUYER TẠO RETURN REQUEST**

#### Test Case 1.1: Buyer tạo return request thành công
**Mục đích:** Đảm bảo buyer có thể tạo return request với evidence files

**Preconditions:**
- Order status = `DELIVERED`
- Order chưa `COMPLETED`
- Buyer đã nhận hàng

**Steps:**
1. Buyer vào trang đơn hàng
2. Buyer xem đơn hàng với status = `DELIVERED`
3. Buyer click "Trả hàng"
4. Buyer điền form:
   - Chọn lý do trả hàng (DEFECTIVE_PRODUCT, WRONG_PRODUCT, etc.)
   - Nhập mô tả chi tiết
   - Upload 1-5 file ảnh/video minh chứng
5. Buyer click "Gửi yêu cầu"

**Expected Results:**
- ✅ ReturnRequest được tạo thành công
- ✅ ReturnRequest status = `PENDING`
- ✅ Files được upload lên Cloudinary
- ✅ `refundAmount` = tổng tiền đơn hàng
- ✅ Store nhận được thông báo

**API Test:**
```http
POST /api/v1/buyer/orders/{orderId}/return
Authorization: Bearer <buyer_token>
Content-Type: multipart/form-data

reason: DEFECTIVE_PRODUCT
description: Sản phẩm bị lỗi, không hoạt động
evidenceFiles: [file1.jpg, file2.mp4]
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": "return_123",
    "orderId": "order_123",
    "status": "PENDING",
    "reason": "DEFECTIVE_PRODUCT",
    "description": "Sản phẩm bị lỗi, không hoạt động",
    "evidenceFiles": [
      "https://cloudinary.com/.../file1.jpg",
      "https://cloudinary.com/.../file2.mp4"
    ],
    "refundAmount": 2000000,
    "createdAt": "2024-12-14T10:00:00"
  }
}
```

**UI Test:**
- [ ] Button "Trả hàng" hiển thị cho đơn DELIVERED
- [ ] Form trả hàng hiển thị đúng
- [ ] File upload hoạt động (chọn nhiều file)
- [ ] Validation hoạt động (required fields)
- [ ] Success message hiển thị
- [ ] Redirect đến trang return requests

---

#### Test Case 1.2: Upload evidence files - Test các trường hợp
**Mục đích:** Đảm bảo file upload hoạt động đúng

**Test Cases:**
1. ✅ **Upload ảnh hợp lệ:**
   - Format: JPEG, PNG, WebP
   - Size: < 30MB
   - Expected: Upload thành công

2. ✅ **Upload video hợp lệ:**
   - Format: MP4, MPEG, MOV, AVI, WebM
   - Size: < 100MB
   - Expected: Upload thành công

3. ❌ **Upload file quá lớn:**
   - Ảnh > 30MB → Error: "File quá lớn"
   - Video > 100MB → Error: "File quá lớn"

4. ❌ **Upload file không đúng format:**
   - File .txt, .pdf → Error: "File không đúng định dạng"

5. ✅ **Upload nhiều file (1-5 files):**
   - Upload 5 files → Thành công
   - Upload 6 files → Error: "Tối đa 5 files"

---

#### Test Case 1.3: Không thể trả hàng đơn đã COMPLETED
**Mục đích:** Đảm bảo không thể trả hàng sau khi đã hoàn tất

**Preconditions:**
- Order status = `COMPLETED`

**Steps:**
1. Buyer xem đơn hàng với status = `COMPLETED`
2. Buyer tìm button "Trả hàng"

**Expected Results:**
- ✅ Button "Trả hàng" không hiển thị
- ✅ Hoặc button disabled với tooltip "Không thể trả hàng đơn đã hoàn tất"

---

#### Test Case 1.4: Không thể trả hàng đơn chưa DELIVERED
**Mục đích:** Đảm bảo chỉ có thể trả hàng khi đã nhận hàng

**Preconditions:**
- Order status = `PENDING`, `CONFIRMED`, hoặc `SHIPPING`

**Steps:**
1. Buyer thử gọi API tạo return request

**Expected Results:**
- ✅ API trả về lỗi 400
- ✅ Message: "Chỉ có thể trả hàng đơn hàng đã giao"

---

#### Test Case 1.5: Buyer xem danh sách return requests
**Mục đích:** Buyer có thể xem tất cả return requests của mình

**Steps:**
1. Buyer vào trang "Yêu cầu trả hàng"
2. Buyer xem danh sách return requests

**Expected Results:**
- ✅ Hiển thị tất cả return requests của buyer
- ✅ Hiển thị status, lý do, ngày tạo
- ✅ Có thể filter theo status

**API Test:**
```http
GET /api/v1/buyer/orders/returns?status=PENDING&page=0&size=10
Authorization: Bearer <buyer_token>
```

**UI Test:**
- [ ] Danh sách return requests hiển thị đúng
- [ ] Status badges hiển thị đúng màu
- [ ] Filter theo status hoạt động
- [ ] Pagination hoạt động

---

#### Test Case 1.6: Buyer xem chi tiết return request
**Mục đích:** Buyer có thể xem chi tiết một return request

**Steps:**
1. Buyer click vào một return request
2. Buyer xem chi tiết

**Expected Results:**
- ✅ Hiển thị đầy đủ thông tin:
  - Order details
  - Reason, description
  - Evidence files (ảnh/video)
  - Status, timeline
  - Store response (nếu có)

**API Test:**
```http
GET /api/v1/buyer/orders/returns/{returnRequestId}
Authorization: Bearer <buyer_token>
```

---

### ✅ **BƯỚC 2: STORE PHẢN HỒI RETURN REQUEST**

#### Test Case 2.1: Store xem danh sách return requests
**Mục đích:** Store có thể xem tất cả return requests của store mình

**Steps:**
1. Store đăng nhập
2. Store vào trang "Yêu cầu trả hàng"
3. Store xem danh sách return requests

**Expected Results:**
- ✅ Hiển thị tất cả return requests của store
- ✅ Hiển thị status, buyer info, ngày tạo
- ✅ Có thể filter theo status

**API Test:**
```http
GET /api/v1/b2c/returns/store/{storeId}?status=PENDING&page=0&size=10
Authorization: Bearer <store_token>
```

**UI Test:**
- [ ] Danh sách return requests hiển thị đúng
- [ ] Status badges hiển thị đúng màu
- [ ] Filter theo status hoạt động

---

#### Test Case 2.2: Store chấp nhận trả hàng
**Mục đích:** Store chấp nhận return request và tạo shipment trả hàng

**Preconditions:**
- ReturnRequest status = `PENDING`

**Steps:**
1. Store xem chi tiết return request
2. Store click "Chấp nhận trả hàng"
3. Store xác nhận

**Expected Results:**
- ✅ ReturnRequest status chuyển từ `PENDING` → `APPROVED` → `READY_TO_RETURN`
- ✅ Tạo Shipment mới với type = `RETURN`
- ✅ Shipment status = `READY_TO_PICK`
- ✅ Buyer nhận được thông báo

**API Test:**
```http
PUT /api/v1/b2c/returns/store/{storeId}/returnRequest/{returnRequestId}/respond
Authorization: Bearer <store_token>
Content-Type: application/json

{
  "storeResponse": "APPROVED"
}
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": "return_123",
    "status": "READY_TO_RETURN",
    "shipment": {
      "id": "shipment_return_123",
      "type": "RETURN",
      "status": "READY_TO_PICK"
    }
  }
}
```

**UI Test:**
- [ ] Button "Chấp nhận" hoạt động
- [ ] Status cập nhật thành "Sẵn sàng trả hàng"
- [ ] Success message hiển thị

---

#### Test Case 2.3: Store từ chối trả hàng
**Mục đích:** Store từ chối return request với lý do

**Preconditions:**
- ReturnRequest status = `PENDING`

**Steps:**
1. Store xem chi tiết return request
2. Store click "Từ chối trả hàng"
3. Store nhập lý do từ chối
4. Store upload evidence files (optional)
5. Store xác nhận

**Expected Results:**
- ✅ ReturnRequest status chuyển từ `PENDING` → `REJECTED`
- ✅ `rejectReason` được lưu
- ✅ Buyer có thể tạo Dispute

**API Test:**
```http
PUT /api/v1/b2c/returns/store/{storeId}/returnRequest/{returnRequestId}/respond
Authorization: Bearer <store_token>
Content-Type: application/json

{
  "storeResponse": "REJECTED",
  "rejectReason": "Sản phẩm không thuộc diện trả hàng",
  "evidenceFiles": ["evidence.jpg"]
}
```

**UI Test:**
- [ ] Button "Từ chối" hoạt động
- [ ] Form nhập lý do hiển thị
- [ ] Status cập nhật thành "Đã từ chối"
- [ ] Buyer có thể khiếu nại

---

#### Test Case 2.4: Store xác nhận nhận hàng trả về (OK)
**Mục đích:** Store xác nhận đã nhận hàng trả về và không có vấn đề

**Preconditions:**
- ReturnRequest status = `RETURNED`
- Store đã nhận hàng trả về

**Steps:**
1. Store xem chi tiết return request
2. Store click "Xác nhận nhận hàng OK"
3. Store xác nhận

**Expected Results:**
- ✅ ReturnRequest status chuyển từ `RETURNED` → `REFUNDED`
- ✅ Refund cho buyer
- ✅ ReturnRequest = `CLOSED`

**API Test:**
```http
PUT /api/v1/b2c/returns/store/{storeId}/returnRequest/{returnRequestId}/confirm-ok
Authorization: Bearer <store_token>
```

---

### ✅ **BƯỚC 3: BUYER KHIẾU NẠI (Nếu bị từ chối)**

#### Test Case 3.1: Buyer tạo dispute khi bị từ chối
**Mục đích:** Buyer khiếu nại khi store từ chối trả hàng

**Preconditions:**
- ReturnRequest status = `REJECTED`

**Steps:**
1. Buyer xem return request bị từ chối
2. Buyer click "Khiếu nại"
3. Buyer nhập nội dung khiếu nại
4. Buyer upload evidence files (optional)
5. Buyer gửi khiếu nại

**Expected Results:**
- ✅ Dispute được tạo thành công
- ✅ Dispute status = `OPEN`
- ✅ DisputeType = `RETURN_REJECTION`
- ✅ ReturnRequest status = `DISPUTED`
- ✅ Admin nhận được thông báo

**API Test:**
```http
POST /api/v1/buyer/orders/returns/{returnRequestId}/dispute
Authorization: Bearer <buyer_token>
Content-Type: multipart/form-data

content: Tôi không đồng ý với quyết định từ chối của store
evidenceFiles: [evidence.jpg]
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": "dispute_123",
    "returnRequestId": "return_123",
    "disputeType": "RETURN_REJECTION",
    "status": "OPEN",
    "content": "Tôi không đồng ý với quyết định từ chối của store",
    "createdAt": "2024-12-14T11:00:00"
  }
}
```

**UI Test:**
- [ ] Button "Khiếu nại" hiển thị cho return request REJECTED
- [ ] Form khiếu nại hiển thị đúng
- [ ] Success message hiển thị
- [ ] Dispute xuất hiện trong danh sách disputes

---

#### Test Case 3.2: Buyer gửi message trong dispute
**Mục đích:** Buyer thêm tin nhắn/bằng chứng vào dispute

**Preconditions:**
- Dispute status = `OPEN`

**Steps:**
1. Buyer xem chi tiết dispute
2. Buyer nhập tin nhắn
3. Buyer upload evidence files (optional)
4. Buyer gửi

**Expected Results:**
- ✅ Message được thêm vào dispute
- ✅ Files được upload (nếu có)

**API Test:**
```http
POST /api/v1/buyer/orders/disputes/{disputeId}/message
Authorization: Bearer <buyer_token>
Content-Type: multipart/form-data

content: Đây là bằng chứng mới
evidenceFiles: [new_evidence.jpg]
```

---

#### Test Case 3.3: Buyer xem danh sách disputes
**Mục đích:** Buyer có thể xem tất cả disputes của mình

**Steps:**
1. Buyer vào trang "Khiếu nại"
2. Buyer xem danh sách disputes

**Expected Results:**
- ✅ Hiển thị tất cả disputes của buyer
- ✅ Hiển thị status, type, ngày tạo
- ✅ Có thể filter theo status, type

**API Test:**
```http
GET /api/v1/buyer/orders/disputes?status=OPEN&page=0&size=10
Authorization: Bearer <buyer_token>
```

**UI Test:**
- [ ] Danh sách disputes hiển thị đúng
- [ ] Status badges hiển thị đúng màu
- [ ] Filter hoạt động

---

### ✅ **BƯỚC 4: STORE KHIẾU NẠI CHẤT LƯỢNG HÀNG TRẢ**

#### Test Case 4.1: Store khiếu nại hàng trả về có vấn đề
**Mục đích:** Store khiếu nại khi nhận hàng trả về bị hư hỏng/không đúng

**Preconditions:**
- ReturnRequest status = `RETURNED`
- Store đã nhận hàng trả về
- Hàng có vấn đề (hư hỏng, không đúng, etc.)

**Steps:**
1. Store xem chi tiết return request
2. Store click "Khiếu nại chất lượng hàng trả"
3. Store nhập lý do và mô tả
4. Store upload evidence files (ảnh/video minh chứng)
5. Store gửi khiếu nại

**Expected Results:**
- ✅ Dispute được tạo thành công
- ✅ Dispute status = `OPEN`
- ✅ DisputeType = `RETURN_QUALITY`
- ✅ ReturnRequest `storeDisputedReturnedGoods` = true
- ✅ ReturnRequest status = `RETURN_DISPUTED`
- ✅ Admin nhận được thông báo

**API Test:**
```http
POST /api/v1/b2c/returns/store/{storeId}/returnRequest/{returnRequestId}/dispute-quality
Authorization: Bearer <store_token>
Content-Type: multipart/form-data

reason: Hàng bị hư hỏng nghiêm trọng
description: Hàng trả về bị vỡ, không còn nguyên vẹn
evidenceFiles: [damaged_product.jpg, video.mp4]
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": "dispute_456",
    "returnRequestId": "return_123",
    "disputeType": "RETURN_QUALITY",
    "status": "OPEN",
    "reason": "Hàng bị hư hỏng nghiêm trọng",
    "createdAt": "2024-12-14T12:00:00"
  }
}
```

**UI Test:**
- [ ] Button "Khiếu nại chất lượng" hiển thị cho return request RETURNED
- [ ] Form khiếu nại hiển thị đúng
- [ ] File upload hoạt động
- [ ] Success message hiển thị

---

#### Test Case 4.2: Store gửi message trong dispute
**Mục đích:** Store thêm tin nhắn/bằng chứng vào dispute

**Preconditions:**
- Dispute status = `OPEN`

**Steps:**
1. Store xem chi tiết dispute
2. Store nhập tin nhắn
3. Store upload evidence files (optional)
4. Store gửi

**Expected Results:**
- ✅ Message được thêm vào dispute

**API Test:**
```http
POST /api/v1/b2c/returns/store/{storeId}/disputes/{disputeId}/message
Authorization: Bearer <store_token>
Content-Type: multipart/form-data

content: Bằng chứng mới về hàng hư hỏng
evidenceFiles: [new_evidence.jpg]
```

---

### ✅ **BƯỚC 5: ADMIN GIẢI QUYẾT DISPUTE**

#### Test Case 5.1: Admin xem danh sách disputes
**Mục đích:** Admin có thể xem tất cả disputes

**Steps:**
1. Admin đăng nhập
2. Admin vào trang "Khiếu nại"
3. Admin xem danh sách disputes

**Expected Results:**
- ✅ Hiển thị tất cả disputes
- ✅ Hiển thị status, type, ngày tạo
- ✅ Có thể filter theo status, type

**API Test:**
```http
GET /api/v1/admin/disputes?status=OPEN&disputeType=RETURN_REJECTION&page=0&size=10
Authorization: Bearer <admin_token>
```

**UI Test:**
- [ ] Danh sách disputes hiển thị đúng
- [ ] Status badges hiển thị đúng màu
- [ ] Filter hoạt động

---

#### Test Case 5.2: Admin xem chi tiết dispute
**Mục đích:** Admin có thể xem đầy đủ thông tin dispute

**Steps:**
1. Admin click vào một dispute
2. Admin xem chi tiết

**Expected Results:**
- ✅ Hiển thị đầy đủ thông tin:
  - ReturnRequest details
  - Dispute type, status
  - Messages từ buyer/store
  - Evidence files
  - Timeline

**API Test:**
```http
GET /api/v1/admin/disputes/{disputeId}
Authorization: Bearer <admin_token>
```

---

#### Test Case 5.3: Admin giải quyết dispute RETURN_REJECTION - Chấp nhận buyer
**Mục đích:** Admin chấp nhận khiếu nại của buyer, cho phép trả hàng

**Preconditions:**
- Dispute status = `OPEN`
- DisputeType = `RETURN_REJECTION`

**Steps:**
1. Admin xem chi tiết dispute
2. Admin xem xét evidence
3. Admin click "Giải quyết"
4. Admin chọn "Chấp nhận trả hàng" (APPROVE_RETURN)
5. Admin nhập lý do quyết định
6. Admin xác nhận

**Expected Results:**
- ✅ Dispute status chuyển từ `OPEN` → `RESOLVED`
- ✅ ReturnRequest status chuyển từ `DISPUTED` → `READY_TO_RETURN`
- ✅ Tạo Shipment mới cho việc trả hàng
- ✅ Buyer và Store nhận được thông báo

**API Test:**
```http
PUT /api/v1/admin/disputes/{disputeId}/resolve
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "decision": "APPROVE_RETURN",
  "adminNote": "Buyer có lý, chấp nhận trả hàng"
}
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": "dispute_123",
    "status": "RESOLVED",
    "returnRequest": {
      "id": "return_123",
      "status": "READY_TO_RETURN"
    }
  },
  "message": "Khiếu nại đã được giải quyết"
}
```

**UI Test:**
- [ ] Button "Giải quyết" hoạt động
- [ ] Form chọn quyết định hiển thị
- [ ] Status cập nhật thành "Đã giải quyết"
- [ ] ReturnRequest chuyển sang "Sẵn sàng trả hàng"

---

#### Test Case 5.4: Admin giải quyết dispute RETURN_REJECTION - Từ chối buyer
**Mục đích:** Admin từ chối khiếu nại của buyer, giữ nguyên quyết định của store

**Preconditions:**
- Dispute status = `OPEN`
- DisputeType = `RETURN_REJECTION`

**Steps:**
1. Admin chọn "Từ chối trả hàng" (REJECT_RETURN)
2. Admin nhập lý do
3. Admin xác nhận

**Expected Results:**
- ✅ Dispute status = `RESOLVED`
- ✅ ReturnRequest status = `CLOSED`
- ✅ Không refund cho buyer

**API Test:**
```http
PUT /api/v1/admin/disputes/{disputeId}/resolve
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "decision": "REJECT_RETURN",
  "adminNote": "Store có lý, từ chối trả hàng"
}
```

---

#### Test Case 5.5: Admin giải quyết dispute RETURN_QUALITY - Chấp nhận store
**Mục đích:** Admin chấp nhận khiếu nại của store về chất lượng hàng trả

**Preconditions:**
- Dispute status = `OPEN`
- DisputeType = `RETURN_QUALITY`

**Steps:**
1. Admin chọn "Chấp nhận store" (APPROVE_STORE)
2. Admin nhập lý do
3. Admin xác nhận

**Expected Results:**
- ✅ Dispute status = `RESOLVED`
- ✅ ReturnRequest status = `REFUND_TO_STORE`
- ✅ Refund cho store (tiền hoàn về ví store)
- ✅ Buyer không được refund

**API Test:**
```http
PUT /api/v1/admin/disputes/{disputeId}/resolve-quality
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "decision": "APPROVE_STORE",
  "adminNote": "Hàng trả về có vấn đề, chấp nhận khiếu nại của store"
}
```

---

#### Test Case 5.6: Admin giải quyết dispute RETURN_QUALITY - Từ chối store
**Mục đích:** Admin từ chối khiếu nại của store, refund cho buyer

**Preconditions:**
- Dispute status = `OPEN`
- DisputeType = `RETURN_QUALITY`

**Steps:**
1. Admin chọn "Từ chối store" (REJECT_STORE)
2. Admin nhập lý do
3. Admin xác nhận

**Expected Results:**
- ✅ Dispute status = `RESOLVED`
- ✅ ReturnRequest status = `REFUNDED`
- ✅ Refund cho buyer
- ✅ Store không được refund

**API Test:**
```http
PUT /api/v1/admin/disputes/{disputeId}/resolve-quality
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "decision": "REJECT_STORE",
  "adminNote": "Hàng trả về không có vấn đề, refund cho buyer"
}
```

---

#### Test Case 5.7: Admin gửi message trong dispute
**Mục đích:** Admin thêm tin nhắn vào dispute

**Preconditions:**
- Dispute status = `OPEN` hoặc `IN_REVIEW`

**Steps:**
1. Admin xem chi tiết dispute
2. Admin nhập tin nhắn
3. Admin upload evidence files (optional)
4. Admin gửi

**Expected Results:**
- ✅ Message được thêm vào dispute
- ✅ Buyer và Store nhận được thông báo

**API Test:**
```http
POST /api/v1/admin/disputes/{disputeId}/message
Authorization: Bearer <admin_token>
Content-Type: multipart/form-data

content: Admin đang xem xét, vui lòng chờ
evidenceFiles: [admin_note.jpg]
```

---

## 🔄 END-TO-END TEST SCENARIOS

### Scenario 1: Happy Path - Trả hàng thành công
1. Buyer nhận hàng (Order = `DELIVERED`)
2. Buyer tạo return request với evidence
3. Store chấp nhận return request
4. Shipper nhận hàng trả về (Shipment = `READY_TO_PICK` → `PICKED`)
5. Shipper trả hàng về store (Shipment = `RETURNING` → `RETURNED`)
6. Store xác nhận nhận hàng OK
7. Refund cho buyer
8. ReturnRequest status = `REFUNDED` → `CLOSED`

### Scenario 2: Store từ chối → Buyer khiếu nại → Admin chấp nhận buyer
1. Buyer tạo return request
2. Store từ chối với lý do
3. Buyer tạo dispute (RETURN_REJECTION)
4. Admin xem và giải quyết: APPROVE_RETURN
5. ReturnRequest chuyển sang READY_TO_RETURN
6. Shipper lấy hàng trả về
7. Store nhận hàng và xác nhận OK
8. Refund cho buyer

### Scenario 3: Store từ chối → Buyer khiếu nại → Admin từ chối buyer
1. Buyer tạo return request
2. Store từ chối
3. Buyer tạo dispute
4. Admin giải quyết: REJECT_RETURN
5. ReturnRequest = `CLOSED`
6. Không refund cho buyer

### Scenario 4: Store khiếu nại chất lượng hàng trả → Admin chấp nhận store
1. Buyer trả hàng
2. Store nhận hàng trả về
3. Store khiếu nại hàng có vấn đề (RETURN_QUALITY)
4. Admin xem và giải quyết: APPROVE_STORE
5. ReturnRequest = `REFUND_TO_STORE`
6. Refund cho store

### Scenario 5: Store khiếu nại chất lượng hàng trả → Admin từ chối store
1. Buyer trả hàng
2. Store nhận hàng trả về
3. Store khiếu nại hàng có vấn đề
4. Admin giải quyết: REJECT_STORE
5. ReturnRequest = `REFUNDED`
6. Refund cho buyer

---

## 📝 CHECKLIST TEST

### ✅ Backend APIs
- [ ] Tất cả endpoints trả về đúng status code
- [ ] File upload hoạt động (Cloudinary)
- [ ] Status transitions đúng workflow
- [ ] Validation đúng (required fields, enum values)
- [ ] Authentication/Authorization đúng
- [ ] Business logic đúng (refund, shipment creation)

### ✅ Frontend UI
- [ ] Tất cả pages render đúng
- [ ] File upload UI hoạt động
- [ ] Forms submit đúng
- [ ] Status badges hiển thị đúng
- [ ] Error handling hiển thị đúng
- [ ] Navigation links hoạt động

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
   - Race conditions

3. **Authorization:**
   - Buyer chỉ thấy return requests/disputes của mình
   - Store chỉ thấy return requests của store mình
   - Admin có quyền xem tất cả

4. **Refund Logic:**
   - Refund đúng số tiền
   - Refund đúng người nhận
   - Refund không bị duplicate

---

## 📅 THỜI GIAN TEST ƯỚC TÍNH

- **Bước 1 (Buyer tạo return):** 1-2 giờ
- **Bước 2 (Store phản hồi):** 1-2 giờ
- **Bước 3 (Buyer khiếu nại):** 1 giờ
- **Bước 4 (Store khiếu nại chất lượng):** 1 giờ
- **Bước 5 (Admin giải quyết):** 2-3 giờ
- **End-to-End Scenarios:** 2-3 giờ

**Tổng:** ~8-12 giờ

---

## 🎯 KẾT LUẬN

**Test theo thứ tự:**
1. ✅ Buyer tạo return request (Bước 1)
2. ✅ Store phản hồi (Bước 2)
3. ✅ Buyer khiếu nại (Bước 3)
4. ✅ Store khiếu nại chất lượng (Bước 4)
5. ✅ Admin giải quyết (Bước 5)
6. ✅ End-to-End Scenarios

**Sau khi test xong luồng này, test tích hợp với luồng shipment (shipper lấy hàng trả về).**





