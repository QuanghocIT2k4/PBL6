# 🛒 TEST PLAN - LUỒNG ĐẶT HÀNG CƠ BẢN

## 🎯 MỤC TIÊU
Test toàn bộ luồng từ khi người mua đặt hàng → Store xử lý → Shipper giao hàng → Người mua nhận hàng.

---

## 📋 LUỒNG HOẠT ĐỘNG

```
1. BUYER ĐẶT HÀNG
   ↓
   Order Status: PENDING
   
2. STORE XÁC NHẬN ĐƠN HÀNG
   ↓
   Order Status: CONFIRMED
   
3. STORE TẠO SHIPMENT
   ↓
   Shipment Status: READY_TO_PICK
   Order Status: SHIPPING (hoặc vẫn CONFIRMED)
   
4. SHIPPER NHẬN ĐƠN (PICK)
   ↓
   Shipment Status: PICKING → PICKED
   
5. SHIPPER BẮT ĐẦU GIAO HÀNG
   ↓
   Shipment Status: SHIPPING
   
6. SHIPPER HOÀN THÀNH GIAO HÀNG
   ↓
   Shipment Status: DELIVERED
   Order Status: DELIVERED
   
7. BUYER XÁC NHẬN NHẬN HÀNG (OPTIONAL)
   ↓
   Order Status: COMPLETED
```

---

## 🧪 TEST CASES CHI TIẾT

### ✅ **BƯỚC 1: BUYER ĐẶT HÀNG**

#### Test Case 1.1: Buyer tạo đơn hàng thành công
**Mục đích:** Đảm bảo buyer có thể đặt hàng

**Preconditions:**
- Buyer đã đăng nhập
- Có sản phẩm trong giỏ hàng hoặc chọn sản phẩm
- Có địa chỉ giao hàng

**Steps:**
1. Buyer chọn sản phẩm và thêm vào giỏ hàng
2. Buyer vào trang checkout
3. Buyer điền thông tin giao hàng
4. Buyer chọn phương thức thanh toán
5. Buyer click "Đặt hàng"

**Expected Results:**
- ✅ Đơn hàng được tạo thành công
- ✅ Order status = `PENDING`
- ✅ Order có các thông tin:
  - `buyer`: ID của buyer hiện tại
  - `store`: ID của store
  - `items`: Danh sách sản phẩm
  - `totalPrice`: Tổng tiền
  - `shippingAddress`: Địa chỉ giao hàng
  - `status`: `PENDING`
- ✅ Hiển thị thông báo thành công
- ✅ Redirect đến trang đơn hàng hoặc trang xác nhận

**API Test:**
```http
POST /api/v1/buyer/orders
Authorization: Bearer <buyer_token>
Content-Type: application/json

{
  "storeId": "store_123",
  "items": [
    {
      "productId": "product_123",
      "variantId": "variant_123",
      "quantity": 2,
      "price": 1000000
    }
  ],
  "shippingAddress": {
    "fullName": "Nguyễn Văn A",
    "phone": "0123456789",
    "address": "123 Đường ABC",
    "ward": "Phường XYZ",
    "district": "Quận 1",
    "city": "TP.HCM"
  },
  "paymentMethod": "COD"
}
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": "order_123",
    "status": "PENDING",
    "totalPrice": 2000000,
    "createdAt": "2024-12-14T10:00:00",
    ...
  }
}
```

**UI Test:**
- [ ] Form đặt hàng hiển thị đúng
- [ ] Validation hoạt động (required fields)
- [ ] Button "Đặt hàng" hoạt động
- [ ] Loading state hiển thị khi đang submit
- [ ] Success message hiển thị
- [ ] Redirect đúng trang

---

### ✅ **BƯỚC 2: STORE XÁC NHẬN ĐƠN HÀNG**

#### Test Case 2.1: Store xem danh sách đơn hàng mới
**Mục đích:** Store có thể xem đơn hàng mới

**Preconditions:**
- Store đã đăng nhập
- Có đơn hàng mới với status = `PENDING`

**Steps:**
1. Store đăng nhập
2. Store vào trang "Đơn hàng" (Orders)
3. Store xem danh sách đơn hàng

**Expected Results:**
- ✅ Hiển thị đơn hàng với status = `PENDING`
- ✅ Hiển thị thông tin:
  - Mã đơn hàng
  - Tên khách hàng
  - Sản phẩm
  - Tổng tiền
  - Ngày đặt hàng
- ✅ Có button "Xác nhận đơn hàng"

**API Test:**
```http
GET /api/v1/b2c/orders?status=PENDING&page=0&size=10
Authorization: Bearer <store_token>
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "content": [
      {
        "id": "order_123",
        "status": "PENDING",
        "buyer": {
          "fullName": "Nguyễn Văn A",
          "phone": "0123456789"
        },
        "items": [...],
        "totalPrice": 2000000,
        "createdAt": "2024-12-14T10:00:00"
      }
    ],
    "totalElements": 1,
    "totalPages": 1
  }
}
```

**UI Test:**
- [ ] Danh sách đơn hàng hiển thị đúng
- [ ] Status badge hiển thị "Chờ xác nhận" (màu vàng)
- [ ] Button "Xác nhận" hiển thị cho đơn PENDING

---

#### Test Case 2.2: Store xác nhận đơn hàng
**Mục đích:** Store có thể xác nhận đơn hàng

**Preconditions:**
- Store đã đăng nhập
- Có đơn hàng với status = `PENDING`

**Steps:**
1. Store vào trang đơn hàng
2. Store click vào đơn hàng cần xác nhận
3. Store xem chi tiết đơn hàng
4. Store click "Xác nhận đơn hàng"
5. Store xác nhận action

**Expected Results:**
- ✅ Order status chuyển từ `PENDING` → `CONFIRMED`
- ✅ Hiển thị thông báo thành công
- ✅ Đơn hàng không còn trong danh sách "Chờ xác nhận"
- ✅ Đơn hàng xuất hiện trong danh sách "Đã xác nhận"

**API Test:**
```http
PUT /api/v1/b2c/orders/{orderId}/confirm
Authorization: Bearer <store_token>
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": "order_123",
    "status": "CONFIRMED",
    "confirmedAt": "2024-12-14T10:30:00",
    ...
  },
  "message": "Đơn hàng đã được xác nhận"
}
```

**UI Test:**
- [ ] Button "Xác nhận" hoạt động
- [ ] Confirmation dialog hiển thị (nếu có)
- [ ] Status badge cập nhật thành "Đã xác nhận" (màu xanh)
- [ ] Success message hiển thị
- [ ] Danh sách đơn hàng cập nhật

---

#### Test Case 2.3: Store từ chối đơn hàng (nếu có)
**Mục đích:** Store có thể từ chối đơn hàng (nếu tính năng này có)

**Preconditions:**
- Store đã đăng nhập
- Có đơn hàng với status = `PENDING`

**Steps:**
1. Store click "Từ chối đơn hàng"
2. Store nhập lý do từ chối
3. Store xác nhận

**Expected Results:**
- ✅ Order status chuyển thành `CANCELLED`
- ✅ Buyer nhận được thông báo

**Note:** Kiểm tra xem có tính năng này không

---

### ✅ **BƯỚC 3: STORE TẠO SHIPMENT**

#### Test Case 3.1: Store tạo shipment cho đơn hàng
**Mục đích:** Store tạo shipment khi đã chuẩn bị xong hàng

**Preconditions:**
- Store đã đăng nhập
- Có đơn hàng với status = `CONFIRMED`
- Store đã chuẩn bị xong hàng

**Steps:**
1. Store vào trang đơn hàng
2. Store chọn đơn hàng đã xác nhận
3. Store click "Tạo đơn vận chuyển" hoặc "Giao cho shipper"
4. Store điền thông tin shipment (nếu cần)
5. Store xác nhận

**Expected Results:**
- ✅ Shipment được tạo thành công
- ✅ Shipment status = `READY_TO_PICK`
- ✅ Shipment có các thông tin:
  - `order`: ID của order
  - `store`: ID của store
  - `pickupAddress`: Địa chỉ lấy hàng (địa chỉ store)
  - `deliveryAddress`: Địa chỉ giao hàng (từ order)
  - `status`: `READY_TO_PICK`
- ✅ Order status có thể chuyển thành `SHIPPING` (hoặc vẫn `CONFIRMED`)
- ✅ Shipper có thể thấy shipment mới

**API Test:**
```http
POST /api/v1/b2c/shipments/order/{orderId}
Authorization: Bearer <store_token>
Content-Type: application/json

{
  "pickupAddress": "123 Đường Store, Quận 1, TP.HCM",
  "note": "Hàng dễ vỡ, cẩn thận"
}
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": "shipment_123",
    "orderId": "order_123",
    "status": "READY_TO_PICK",
    "pickupAddress": "123 Đường Store, Quận 1, TP.HCM",
    "deliveryAddress": "123 Đường ABC, Quận 1, TP.HCM",
    "createdAt": "2024-12-14T11:00:00",
    ...
  }
}
```

**UI Test:**
- [ ] Button "Tạo đơn vận chuyển" hiển thị cho đơn CONFIRMED
- [ ] Form tạo shipment hiển thị đúng
- [ ] Success message hiển thị
- [ ] Shipment được tạo và hiển thị trong danh sách

---

### ✅ **BƯỚC 4: SHIPPER NHẬN ĐƠN (PICK)**

#### Test Case 4.1: Shipper xem danh sách đơn cần lấy
**Mục đích:** Shipper có thể xem đơn cần lấy hàng

**Preconditions:**
- Shipper đã đăng nhập
- Có shipment với status = `READY_TO_PICK`

**Steps:**
1. Shipper đăng nhập
2. Shipper vào trang "Đơn hàng" hoặc "Dashboard"
3. Shipper xem danh sách đơn cần lấy

**Expected Results:**
- ✅ Hiển thị danh sách shipments với status = `READY_TO_PICK`
- ✅ Hiển thị thông tin:
  - Mã đơn hàng
  - Địa chỉ lấy hàng
  - Địa chỉ giao hàng
  - Tên khách hàng
  - Số điện thoại
- ✅ Có button "Nhận đơn" hoặc "Bắt đầu lấy hàng"

**API Test:**
```http
GET /api/v1/shipper/shipments?status=READY_TO_PICK
Authorization: Bearer <shipper_token>
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "content": [
      {
        "id": "shipment_123",
        "orderId": "order_123",
        "status": "READY_TO_PICK",
        "pickupAddress": "123 Đường Store, Quận 1, TP.HCM",
        "deliveryAddress": "123 Đường ABC, Quận 1, TP.HCM",
        "order": {
          "buyer": {
            "fullName": "Nguyễn Văn A",
            "phone": "0123456789"
          }
        }
      }
    ]
  }
}
```

**UI Test:**
- [ ] Danh sách shipments hiển thị đúng
- [ ] Status badge hiển thị "Chờ lấy hàng"
- [ ] Button "Nhận đơn" hiển thị

---

#### Test Case 4.2: Shipper nhận đơn (pick)
**Mục đích:** Shipper nhận đơn và bắt đầu lấy hàng

**Preconditions:**
- Shipper đã đăng nhập
- Có shipment với status = `READY_TO_PICK`

**Steps:**
1. Shipper click "Nhận đơn" hoặc "Bắt đầu lấy hàng"
2. Shipper xác nhận action

**Expected Results:**
- ✅ Shipment status chuyển từ `READY_TO_PICK` → `PICKING`
- ✅ `shipper` được set = ID của shipper hiện tại
- ✅ `pickedAt` được set (nếu có)
- ✅ Shipper có thể thấy đơn trong danh sách "Đang lấy hàng"

**API Test:**
```http
PUT /api/v1/shipper/order/{orderId}/picking
Authorization: Bearer <shipper_token>
```

**Note:** Theo Swagger, API này dùng `orderId` chứ không phải `shipmentId`. Hoặc có thể có API khác dùng `shipmentId`.

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": "shipment_123",
    "status": "PICKING",
    "shipper": {
      "id": "shipper_123",
      "fullName": "Shipper A"
    },
    "pickedAt": "2024-12-14T11:30:00",
    ...
  }
}
```

**UI Test:**
- [ ] Button "Nhận đơn" hoạt động
- [ ] Status cập nhật thành "Đang lấy hàng"
- [ ] Đơn không còn trong danh sách "Chờ lấy hàng"

---

#### Test Case 4.3: Shipper xác nhận đã lấy hàng (picked)
**Mục đích:** Shipper xác nhận đã lấy hàng từ store

**Preconditions:**
- Shipment status = `PICKING`

**Steps:**
1. Shipper đến store và lấy hàng
2. Shipper click "Đã lấy hàng" hoặc "Xác nhận lấy hàng"

**Expected Results:**
- ✅ Shipment status chuyển từ `PICKING` → `PICKED`
- ✅ `pickedAt` được set (nếu chưa có)

**API Test:**
```http
PUT /api/v1/shipper/shipment/{shipmentId}/picked
Authorization: Bearer <shipper_token>
```

**Note:** Theo Swagger, API này là `/shipment/` (số ít) chứ không phải `/shipments/` (số nhiều). Status chuyển từ `PICKING` → `PICKED`.

---

### ✅ **BƯỚC 5: SHIPPER BẮT ĐẦU GIAO HÀNG**

#### Test Case 5.1: Shipper bắt đầu giao hàng
**Mục đích:** Shipper bắt đầu giao hàng đến khách

**Preconditions:**
- Shipment status = `PICKED` (hoặc `PICKING`)

**Steps:**
1. Shipper click "Bắt đầu giao hàng" hoặc "Đang giao"
2. Shipper xác nhận

**Expected Results:**
- ✅ Shipment status chuyển thành `SHIPPING`
- ✅ `shippingAt` được set (nếu có)
- ✅ Order status có thể chuyển thành `SHIPPING` (nếu chưa)

**API Test:**
```http
PUT /api/v1/shipper/shipment/{shipmentId}/shipping
Authorization: Bearer <shipper_token>
```

**Note:** Theo Swagger, API này là `/shipment/{shipmentId}/shipping` (số ít), không phải `/shipments/{shipmentId}/start-shipping`. Status chuyển từ `PICKED` → `SHIPPING`.

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": "shipment_123",
    "status": "SHIPPING",
    "shippingAt": "2024-12-14T12:00:00",
    ...
  }
}
```

**UI Test:**
- [ ] Button "Bắt đầu giao hàng" hoạt động
- [ ] Status cập nhật thành "Đang giao"
- [ ] Order status cập nhật (nếu có)

---

### ✅ **BƯỚC 6: SHIPPER HOÀN THÀNH GIAO HÀNG**

#### Test Case 6.1: Shipper hoàn thành giao hàng thành công
**Mục đích:** Shipper xác nhận đã giao hàng thành công

**Preconditions:**
- Shipment status = `SHIPPING`
- Shipper đã giao hàng đến khách

**Steps:**
1. Shipper đến địa chỉ khách hàng
2. Shipper giao hàng cho khách
3. Shipper click "Hoàn thành giao hàng" hoặc "Đã giao"
4. Shipper xác nhận

**Expected Results:**
- ✅ Shipment status chuyển từ `SHIPPING` → `DELIVERED`
- ✅ `deliveredAt` được set
- ✅ Order status chuyển từ `SHIPPING` (hoặc `CONFIRMED`) → `DELIVERED`
- ✅ Buyer nhận được thông báo đã nhận hàng
- ✅ Buyer có thể xem đơn hàng với status = `DELIVERED`
- ✅ Buyer có thể click "Hoàn tất" để chuyển thành `COMPLETED`

**API Test:**
```http
PUT /api/v1/shipper/shipment/{shipmentId}/delivered
Authorization: Bearer <shipper_token>
```

**Note:** Theo Swagger, API này là `/shipment/{shipmentId}/delivered` (số ít), không phải `/shipments/{shipmentId}/complete`. Status chuyển từ `SHIPPING` → `DELIVERED`.

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": "shipment_123",
    "status": "DELIVERED",
    "deliveredAt": "2024-12-14T14:00:00",
    "order": {
      "id": "order_123",
      "status": "DELIVERED",
      ...
    }
  }
}
```

**UI Test:**
- [ ] Button "Hoàn thành giao hàng" hoạt động
- [ ] Shipment status cập nhật thành "Đã giao"
- [ ] Order status cập nhật thành "Đã giao"
- [ ] Buyer thấy đơn hàng với status "Đã giao"
- [ ] Buyer có button "Hoàn tất" để chuyển thành COMPLETED

---

#### Test Case 6.2: Shipper giao hàng thất bại
**Mục đích:** Shipper báo giao hàng thất bại

**Preconditions:**
- Shipment status = `SHIPPING`

**Steps:**
1. Shipper không thể giao hàng (khách không có nhà, địa chỉ sai, etc.)
2. Shipper click "Giao hàng thất bại"
3. Shipper nhập lý do thất bại
4. Shipper xác nhận

**Expected Results:**
- ✅ Shipment status chuyển thành `DELIVERED_FAIL`
- ✅ `failReason` được lưu
- ✅ Order status có thể vẫn `SHIPPING` hoặc chuyển về `CONFIRMED`
- ✅ Store nhận được thông báo

**API Test:**
```http
PUT /api/v1/shipper/shipment/{shipmentId}/fail
Authorization: Bearer <shipper_token>
Content-Type: application/json

"Khách hàng không có nhà, không liên lạc được"
```

**Note:** Theo Swagger, API này là `/shipment/{shipmentId}/fail` (số ít), và request body là string (lý do thất bại), không phải object. Status chuyển từ `SHIPPING` → `DELIVERED_FAIL`.

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": "shipment_123",
    "status": "DELIVERED_FAIL",
    "failReason": "Khách hàng không có nhà, không liên lạc được",
    ...
  }
}
```

**UI Test:**
- [ ] Button "Giao hàng thất bại" hoạt động
- [ ] Form nhập lý do hiển thị
- [ ] Status cập nhật thành "Giao hàng thất bại"

---

### ✅ **BƯỚC 7: BUYER XÁC NHẬN NHẬN HÀNG (OPTIONAL)**

#### Test Case 7.1: Buyer xác nhận hoàn tất đơn hàng
**Mục đích:** Buyer xác nhận đã nhận hàng và hoàn tất đơn

**Preconditions:**
- Order status = `DELIVERED`
- Buyer đã nhận hàng

**Steps:**
1. Buyer vào trang đơn hàng
2. Buyer xem đơn hàng với status = `DELIVERED`
3. Buyer click "Hoàn tất" hoặc "Xác nhận nhận hàng"
4. Buyer xác nhận

**Expected Results:**
- ✅ Order status chuyển từ `DELIVERED` → `COMPLETED`
- ✅ `completedAt` được set
- ✅ Buyer không thể trả hàng sau khi `COMPLETED`
- ✅ Đơn hàng được đánh dấu hoàn tất

**API Test:**
```http
PUT /api/v1/buyer/orders/{orderId}/complete
Authorization: Bearer <buyer_token>
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": "order_123",
    "status": "COMPLETED",
    "completedAt": "2024-12-14T15:00:00",
    ...
  },
  "message": "Đơn hàng đã được xác nhận hoàn tất"
}
```

**UI Test:**
- [ ] Button "Hoàn tất" hiển thị cho đơn DELIVERED
- [ ] Button hoạt động đúng
- [ ] Status cập nhật thành "Hoàn tất"
- [ ] Button "Trả hàng" không hiển thị sau khi COMPLETED

---

## 🔄 END-TO-END TEST SCENARIO

### Scenario: Luồng hoàn chỉnh từ đặt hàng đến nhận hàng

**Preconditions:**
- Có 3 tài khoản: Buyer, Store, Shipper
- Store có sản phẩm
- Buyer có địa chỉ giao hàng

**Steps:**

1. **Buyer đặt hàng**
   - Buyer đăng nhập
   - Buyer chọn sản phẩm và thêm vào giỏ
   - Buyer checkout và đặt hàng
   - ✅ Order được tạo với status = `PENDING`

2. **Store xác nhận đơn hàng**
   - Store đăng nhập
   - Store xem đơn hàng mới
   - Store xác nhận đơn hàng
   - ✅ Order status = `CONFIRMED`

3. **Store tạo shipment**
   - Store chuẩn bị xong hàng
   - Store tạo shipment
   - ✅ Shipment được tạo với status = `READY_TO_PICK`

4. **Shipper nhận đơn**
   - Shipper đăng nhập
   - Shipper xem đơn cần lấy
   - Shipper nhận đơn
   - ✅ Shipment status = `PICKING` → `PICKED`

5. **Shipper bắt đầu giao hàng**
   - Shipper click "Bắt đầu giao hàng"
   - ✅ Shipment status = `SHIPPING`

6. **Shipper hoàn thành giao hàng**
   - Shipper đến địa chỉ khách
   - Shipper giao hàng
   - Shipper click "Hoàn thành giao hàng"
   - ✅ Shipment status = `DELIVERED`
   - ✅ Order status = `DELIVERED`

7. **Buyer xác nhận nhận hàng**
   - Buyer xem đơn hàng
   - Buyer click "Hoàn tất"
   - ✅ Order status = `COMPLETED`

**Expected Final State:**
- Order status = `COMPLETED`
- Shipment status = `DELIVERED`
- Buyer đã nhận hàng
- Store đã giao hàng
- Shipper đã hoàn thành

---

## 📝 CHECKLIST TEST

### ✅ Backend APIs
- [ ] Tất cả endpoints trả về đúng status code
- [ ] Order status transitions đúng
- [ ] Shipment status transitions đúng
- [ ] Validation đúng (required fields)
- [ ] Authentication/Authorization đúng
- [ ] Business logic đúng

### ✅ Frontend UI
- [ ] Tất cả pages render đúng
- [ ] Status badges hiển thị đúng màu và text
- [ ] Buttons hoạt động đúng
- [ ] Forms submit đúng
- [ ] Error handling hiển thị đúng
- [ ] Loading states hiển thị đúng

### ✅ Integration
- [ ] Frontend gọi đúng API endpoints
- [ ] Data flow từ API → UI đúng
- [ ] State management đúng (SWR cache)
- [ ] Real-time updates (nếu có)

### ✅ User Experience
- [ ] Buyer có thể theo dõi đơn hàng
- [ ] Store có thể quản lý đơn hàng
- [ ] Shipper có thể quản lý shipment
- [ ] Thông báo hiển thị đúng

---

## 🚨 CÁC LỖI THƯỜNG GẶP CẦN KIỂM TRA

1. **Status Transitions:**
   - Chuyển status không đúng workflow
   - Missing required fields khi chuyển status
   - Race conditions (2 requests cùng lúc)

2. **Authorization:**
   - Buyer chỉ thấy đơn hàng của mình
   - Store chỉ thấy đơn hàng của store mình
   - Shipper chỉ thấy shipments được assign

3. **Data Validation:**
   - Required fields
   - Data types đúng
   - Enum values đúng

4. **UI/UX:**
   - Buttons disabled khi không đúng status
   - Status badges hiển thị đúng
   - Error messages rõ ràng

---

## 📅 THỜI GIAN TEST ƯỚC TÍNH

- **Bước 1 (Buyer đặt hàng):** 30 phút
- **Bước 2 (Store xác nhận):** 30 phút
- **Bước 3 (Store tạo shipment):** 30 phút
- **Bước 4 (Shipper nhận đơn):** 30 phút
- **Bước 5 (Shipper giao hàng):** 30 phút
- **Bước 6 (Shipper hoàn thành):** 30 phút
- **Bước 7 (Buyer xác nhận):** 30 phút
- **End-to-End Scenario:** 1 giờ

**Tổng:** ~4-5 giờ

---

## 🎯 KẾT LUẬN

**Test theo thứ tự:**
1. ✅ Buyer đặt hàng (Bước 1)
2. ✅ Store xác nhận (Bước 2)
3. ✅ Store tạo shipment (Bước 3)
4. ✅ Shipper nhận đơn (Bước 4)
5. ✅ Shipper giao hàng (Bước 5-6)
6. ✅ Buyer xác nhận (Bước 7)
7. ✅ End-to-End Scenario

**Sau khi test xong luồng này, mới test các tính năng trả hàng/khiếu nại.**

