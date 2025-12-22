# ✅ CHECKLIST API - LUỒNG ĐẶT HÀNG

## 📋 DANH SÁCH API CẦN THIẾT CHO LUỒNG ĐẶT HÀNG

### 🔵 **BƯỚC 1: BUYER ĐẶT HÀNG**

#### ✅ API Cần có:
1. **POST /api/v1/buyer/orders/checkout** - Buyer checkout và tạo đơn hàng
   - **Status:** ✅ CÓ trong Swagger
   - **Mô tả:** Tạo đơn hàng từ giỏ hàng
   - **Request:** Cart items, shipping address, payment method
   - **Response:** Order với status = `PENDING`

2. **GET /api/v1/buyer/orders** - Buyer xem danh sách đơn hàng
   - **Status:** ✅ CÓ trong Swagger
   - **Mô tả:** Lấy danh sách đơn hàng của buyer
   - **Query params:** `status`, `page`, `size`

3. **GET /api/v1/buyer/orders/{orderId}** - Buyer xem chi tiết đơn hàng
   - **Status:** ✅ CÓ trong Swagger
   - **Mô tả:** Lấy chi tiết một đơn hàng

---

### 🟢 **BƯỚC 2: STORE XÁC NHẬN ĐƠN HÀNG**

#### ✅ API Cần có:
1. **GET /api/v1/b2c/orders** - Store xem danh sách đơn hàng
   - **Status:** ✅ CÓ trong Swagger
   - **Mô tả:** Lấy danh sách đơn hàng của store
   - **Query params:** `status`, `page`, `size`

2. **GET /api/v1/b2c/orders/{orderId}** - Store xem chi tiết đơn hàng
   - **Status:** ✅ CÓ trong Swagger
   - **Mô tả:** Lấy chi tiết một đơn hàng

3. **PUT /api/v1/b2c/orders/{orderId}/confirm** - Store xác nhận đơn hàng
   - **Status:** ✅ CÓ trong Swagger
   - **Mô tả:** Xác nhận đơn hàng, chuyển status từ `PENDING` → `CONFIRMED`

4. **PUT /api/v1/b2c/orders/{orderId}/cancel** - Store hủy đơn hàng (optional)
   - **Status:** ✅ CÓ trong Swagger
   - **Mô tả:** Store hủy đơn hàng

---

### 🟡 **BƯỚC 3: STORE TẠO SHIPMENT**

#### ✅ API Cần có:
1. **POST /api/v1/b2c/shipments/order/{orderId}** - Store tạo shipment
   - **Status:** ✅ CÓ trong Swagger
   - **Mô tả:** Tạo shipment cho đơn hàng đã xác nhận
   - **Request:** `pickupAddress`, `note` (optional)
   - **Response:** Shipment với status = `READY_TO_PICK`

2. **GET /api/v1/b2c/shipments/store/{storeId}** - Store xem danh sách shipments
   - **Status:** ✅ CÓ trong Swagger
   - **Mô tả:** Lấy danh sách shipments của store
   - **Query params:** `status`, `page`, `size`

3. **GET /api/v1/b2c/shipments/store/{storeId}/count-by-status** - Store xem số lượng shipments theo status
   - **Status:** ✅ CÓ trong Swagger
   - **Mô tả:** Đếm số lượng shipments theo từng status

---

### 🟠 **BƯỚC 4: SHIPPER NHẬN ĐƠN (PICK)**

#### ✅ API Cần có:
1. **GET /api/v1/shipper/shipments/ready-to-pickup** - Shipper xem danh sách đơn cần lấy
   - **Status:** ✅ CÓ trong Swagger
   - **Mô tả:** Lấy danh sách shipments có status = `READY_TO_PICK`
   - **Query params:** `page`, `size`

2. **GET /api/v1/shipper/shipments/{orderId}** - Shipper xem chi tiết shipment
   - **Status:** ✅ CÓ trong Swagger
   - **Mô tả:** Lấy chi tiết shipment theo orderId

3. **PUT /api/v1/shipper/order/{orderId}/picking** - Shipper nhận đơn (bắt đầu lấy hàng)
   - **Status:** ✅ CÓ trong Swagger
   - **Mô tả:** Shipper bắt đầu lấy hàng, chuyển status từ `READY_TO_PICK` → `PICKING`
   - **Note:** Dùng `orderId` chứ không phải `shipmentId`

4. **PUT /api/v1/shipper/shipment/{shipmentId}/picked** - Shipper xác nhận đã lấy hàng
   - **Status:** ✅ CÓ trong Swagger
   - **Mô tả:** Shipper xác nhận đã lấy hàng từ store, chuyển status từ `PICKING` → `PICKED`

---

### 🔴 **BƯỚC 5: SHIPPER BẮT ĐẦU GIAO HÀNG**

#### ✅ API Cần có:
1. **PUT /api/v1/shipper/shipment/{shipmentId}/shipping** - Shipper bắt đầu giao hàng
   - **Status:** ✅ CÓ trong Swagger
   - **Mô tả:** Shipper bắt đầu vận chuyển, chuyển status từ `PICKED` → `SHIPPING`
   - **Note:** Dùng `/shipment/` (số ít), không phải `/shipments/`

---

### 🟣 **BƯỚC 6: SHIPPER HOÀN THÀNH GIAO HÀNG**

#### ✅ API Cần có:
1. **PUT /api/v1/shipper/shipment/{shipmentId}/delivered** - Shipper hoàn thành giao hàng thành công
   - **Status:** ✅ CÓ trong Swagger
   - **Mô tả:** Shipper xác nhận đã giao hàng thành công, chuyển status từ `SHIPPING` → `DELIVERED`
   - **Note:** Dùng `/delivered`, không phải `/complete`

2. **PUT /api/v1/shipper/shipment/{shipmentId}/fail** - Shipper báo giao hàng thất bại
   - **Status:** ✅ CÓ trong Swagger
   - **Mô tả:** Shipper báo giao hàng thất bại, chuyển status từ `SHIPPING` → `DELIVERED_FAIL`
   - **Request Body:** String (lý do thất bại), không phải object
   - **Note:** Sau khi fail, có thể chuyển sang `/returning` và `/returned`

3. **PUT /api/v1/shipper/shipment/{shipmentId}/returning** - Shipper bắt đầu trả hàng về shop (nếu fail)
   - **Status:** ✅ CÓ trong Swagger
   - **Mô tả:** Shipper bắt đầu trả hàng về shop, chuyển status từ `DELIVERED_FAIL` → `RETURNING`

4. **PUT /api/v1/shipper/shipment/{shipmentId}/returned** - Shipper xác nhận đã trả hàng về shop
   - **Status:** ✅ CÓ trong Swagger
   - **Mô tả:** Shipper xác nhận đã trả hàng về shop, chuyển status từ `RETURNING` → `RETURNED`

---

### 🟤 **BƯỚC 7: BUYER XÁC NHẬN NHẬN HÀNG (OPTIONAL)**

#### ✅ API Cần có:
1. **PUT /api/v1/buyer/orders/{orderId}/complete** - Buyer xác nhận hoàn tất đơn hàng
   - **Status:** ✅ CÓ trong Swagger
   - **Mô tả:** Buyer xác nhận đã nhận hàng và hoàn tất, chuyển status từ `DELIVERED` → `COMPLETED`

2. **GET /api/v1/buyer/orders/{orderId}** - Buyer xem lại chi tiết đơn hàng
   - **Status:** ✅ CÓ trong Swagger (đã có ở bước 1)

---

### 📊 **API BỔ SUNG (HỖ TRỢ)**

#### ✅ API Khác:
1. **GET /api/v1/shipper/history** - Shipper xem lịch sử shipments
   - **Status:** ✅ CÓ trong Swagger
   - **Mô tả:** Lấy lịch sử shipments của shipper

2. **PUT /api/v1/buyer/orders/{orderId}/cancel** - Buyer hủy đơn hàng
   - **Status:** ✅ CÓ trong Swagger
   - **Mô tả:** Buyer hủy đơn hàng (chỉ khi status = `PENDING`)

3. **GET /api/v1/b2c/orders/store/{storeId}/count-by-status** - Store xem số lượng đơn hàng theo status
   - **Status:** ✅ CÓ trong Swagger
   - **Mô tả:** Đếm số lượng đơn hàng theo từng status

---

## ✅ KẾT LUẬN

### **TẤT CẢ API ĐÃ ĐỦ! ✅**

**Tổng số API cần thiết:** 20 APIs
- ✅ **20/20 APIs có trong Swagger** (100%)
- ✅ **0 API thiếu**

### **CÁC API CHÍNH:**

| Bước | API Endpoint | Method | Status |
|------|-------------|--------|--------|
| 1. Buyer đặt hàng | `/api/v1/buyer/orders/checkout` | POST | ✅ |
| 1. Buyer xem đơn | `/api/v1/buyer/orders` | GET | ✅ |
| 2. Store xem đơn | `/api/v1/b2c/orders` | GET | ✅ |
| 2. Store xác nhận | `/api/v1/b2c/orders/{orderId}/confirm` | PUT | ✅ |
| 3. Store tạo shipment | `/api/v1/b2c/shipments/order/{orderId}` | POST | ✅ |
| 4. Shipper xem đơn | `/api/v1/shipper/shipments/ready-to-pickup` | GET | ✅ |
| 4. Shipper nhận đơn | `/api/v1/shipper/order/{orderId}/picking` | PUT | ✅ |
| 4. Shipper xác nhận lấy | `/api/v1/shipper/shipment/{shipmentId}/picked` | PUT | ✅ |
| 5. Shipper bắt đầu giao | `/api/v1/shipper/shipment/{shipmentId}/shipping` | PUT | ✅ |
| 6. Shipper hoàn thành | `/api/v1/shipper/shipment/{shipmentId}/delivered` | PUT | ✅ |
| 6. Shipper thất bại | `/api/v1/shipper/shipment/{shipmentId}/fail` | PUT | ✅ |
| 7. Buyer hoàn tất | `/api/v1/buyer/orders/{orderId}/complete` | PUT | ✅ |

---

## ⚠️ LƯU Ý QUAN TRỌNG

1. **Endpoint path:**
   - ✅ Dùng `/shipment/` (số ít) cho các PUT endpoints của shipper
   - ✅ Dùng `/shipments/` (số nhiều) cho GET endpoints

2. **Parameter:**
   - ✅ `/picking` dùng `orderId`, không phải `shipmentId`
   - ✅ Các endpoint khác dùng `shipmentId`

3. **Request Body:**
   - ✅ `/fail` nhận string, không phải object

4. **Status Transitions:**
   - ✅ Tất cả status transitions đều đúng theo workflow

---

## 🎯 SẴN SÀNG TEST!

**Tất cả API đã có đủ trong Swagger, có thể bắt đầu test luồng đặt hàng!**





