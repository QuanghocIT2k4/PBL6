# 📋 QUY TRÌNH SAU KHI NGƯỜI BÁN XÁC NHẬN ĐƠN HÀNG

## 🎯 TỔNG QUAN

Sau khi người bán (Store) xác nhận đơn hàng, quy trình sẽ diễn ra như sau:

```
1. STORE XÁC NHẬN ĐƠN HÀNG
   ↓
   Order Status: CONFIRMED
   
2. STORE TẠO SHIPMENT (Vận đơn)
   ↓
   Shipment Status: READY_TO_PICK
   Order Status: CONFIRMED (hoặc SHIPPING)
   
3. SHIPPER NHẬN ĐƠN (PICK)
   ↓
   Shipment Status: PICKING → PICKED
   
4. SHIPPER BẮT ĐẦU GIAO HÀNG
   ↓
   Shipment Status: SHIPPING
   
5. SHIPPER HOÀN THÀNH GIAO HÀNG
   ↓
   Shipment Status: DELIVERED
   Order Status: DELIVERED
   
6. BUYER XÁC NHẬN NHẬN HÀNG (OPTIONAL)
   ↓
   Order Status: COMPLETED
   
7. AUTO-COMPLETE (Nếu buyer không xác nhận sau 7 ngày)
   ↓
   Order Status: COMPLETED (tự động)
```

---

## 📝 CHI TIẾT TỪNG BƯỚC

### ✅ **BƯỚC 1: STORE XÁC NHẬN ĐƠN HÀNG**

**Hành động:**
- Store click button "Xác nhận đơn hàng" trên đơn hàng có status = `PENDING`

**API:**
```http
PUT /api/v1/b2c/orders/{orderId}/confirm?storeId={storeId}
Authorization: Bearer <store_token>
```

**Kết quả:**
- ✅ Order status chuyển từ `PENDING` → `CONFIRMED`
- ✅ `confirmedAt` được set
- ✅ Store có thể thấy button "Tạo/Giao vận đơn" (icon cyan)

**UI:**
- Trang: `/store-dashboard/orders`
- Button: "Xác nhận đơn hàng" (màu vàng) → Chuyển thành "Đã xác nhận" (màu xanh)
- Button mới xuất hiện: "Tạo/Giao vận đơn" (icon cyan - xe tải)

---

### ✅ **BƯỚC 2: STORE TẠO SHIPMENT (Vận đơn)**

**Hành động:**
- Store click icon cyan "Tạo/Giao vận đơn" trên đơn hàng đã xác nhận
- Store xác nhận trong popup

**API:**
```http
POST /api/v1/b2c/shipments/order/{orderId}
Authorization: Bearer <store_token>
```

**Kết quả:**
- ✅ Shipment được tạo thành công
- ✅ Shipment status = `READY_TO_PICK`
- ✅ Shipment có các thông tin:
  - `order`: ID của order
  - `store`: ID của store
  - `pickupAddress`: Địa chỉ lấy hàng (địa chỉ store)
  - `deliveryAddress`: Địa chỉ giao hàng (từ order)
  - `status`: `READY_TO_PICK`
- ✅ Shipper có thể thấy shipment mới trong danh sách "Sẵn sàng lấy hàng"

**UI:**
- Trang: `/store-dashboard/orders`
- Sau khi tạo thành công → Tự động chuyển đến `/store-dashboard/shipments`
- Trang Shipments hiển thị:
  - Card "Sẵn sàng lấy hàng" tăng số lượng
  - Shipment mới xuất hiện trong danh sách (nếu filter = "Tất cả" hoặc "Sẵn sàng lấy hàng")

**Lưu ý:**
- ⚠️ Store KHÔNG tự động tạo shipment khi xác nhận đơn hàng
- ⚠️ Store PHẢI click button "Tạo/Giao vận đơn" để tạo shipment
- ⚠️ Store KHÔNG thể chuyển shipment status sang `SHIPPING` (chỉ Shipper mới làm được)

---

### ✅ **BƯỚC 3: SHIPPER NHẬN ĐƠN (PICK)**

**Hành động:**
- Shipper đăng nhập
- Shipper vào trang Dashboard hoặc "Đơn chờ nhận"
- Shipper thấy danh sách shipments có status = `READY_TO_PICK`
- Shipper click "Nhận đơn" hoặc "Bắt đầu lấy hàng"

**API:**
```http
PUT /api/v1/shipper/order/{orderId}/picking
Authorization: Bearer <shipper_token>
```

**Kết quả:**
- ✅ Shipment status chuyển từ `READY_TO_PICK` → `PICKING`
- ✅ `shipper` được set = ID của shipper hiện tại
- ✅ `pickedAt` được set (nếu có)

**Tiếp theo:**
- Shipper đến store và lấy hàng
- Shipper click "Đã lấy hàng"

**API:**
```http
PUT /api/v1/shipper/shipment/{shipmentId}/picked
Authorization: Bearer <shipper_token>
```

**Kết quả:**
- ✅ Shipment status chuyển từ `PICKING` → `PICKED`

**UI:**
- Trang: `/shipper` (Shipper Dashboard)
- Shipper thấy đơn trong tab "Đơn chờ nhận"
- Sau khi nhận đơn → Đơn chuyển sang "Đang lấy hàng"

---

### ✅ **BƯỚC 4: SHIPPER BẮT ĐẦU GIAO HÀNG**

**Hành động:**
- Shipper đã lấy hàng xong (status = `PICKED`)
- Shipper click "Bắt đầu giao hàng" hoặc "Đang giao"

**API:**
```http
PUT /api/v1/shipper/shipment/{shipmentId}/shipping
Authorization: Bearer <shipper_token>
```

**Kết quả:**
- ✅ Shipment status chuyển từ `PICKED` → `SHIPPING`
- ✅ `shippingAt` được set (nếu có)
- ✅ Order status có thể chuyển thành `SHIPPING` (nếu chưa)

**UI:**
- Trang: `/shipper`
- Shipper thấy đơn trong tab "Đang giao"
- Store thấy shipment status = "Đang giao" trong trang Shipments

---

### ✅ **BƯỚC 5: SHIPPER HOÀN THÀNH GIAO HÀNG**

**Hành động:**
- Shipper đến địa chỉ khách hàng
- Shipper giao hàng cho khách
- Shipper click "Hoàn thành giao hàng" hoặc "Đã giao"

**API:**
```http
PUT /api/v1/shipper/shipment/{shipmentId}/delivered
Authorization: Bearer <shipper_token>
```

**Kết quả:**
- ✅ Shipment status chuyển từ `SHIPPING` → `DELIVERED`
- ✅ `deliveredAt` được set
- ✅ Order status chuyển từ `SHIPPING` (hoặc `CONFIRMED`) → `DELIVERED`
- ✅ Buyer nhận được thông báo đã nhận hàng
- ✅ Buyer có thể xem đơn hàng với status = `DELIVERED`
- ✅ Buyer có thể click "Hoàn tất" để chuyển thành `COMPLETED`

**UI:**
- Trang: `/shipper`
- Shipper thấy đơn trong tab "Lịch sử" với status "Đã giao"
- Store thấy shipment status = "Đã giao" trong trang Shipments
- Buyer thấy đơn hàng với status "Đã giao" và có button "Hoàn tất"

---

### ✅ **BƯỚC 6: BUYER XÁC NHẬN NHẬN HÀNG (OPTIONAL)**

**Hành động:**
- Buyer vào trang đơn hàng
- Buyer xem đơn hàng với status = `DELIVERED`
- Buyer click "Hoàn tất" hoặc "Xác nhận nhận hàng"

**API:**
```http
PUT /api/v1/buyer/orders/{orderId}/complete
Authorization: Bearer <buyer_token>
```

**Kết quả:**
- ✅ Order status chuyển từ `DELIVERED` → `COMPLETED`
- ✅ `completedAt` được set
- ✅ Buyer KHÔNG thể trả hàng sau khi `COMPLETED`
- ✅ Đơn hàng được đánh dấu hoàn tất

**UI:**
- Trang: `/orders` (Buyer)
- Button "Hoàn tất" hiển thị cho đơn DELIVERED
- Sau khi click → Status cập nhật thành "Hoàn tất"
- Button "Trả hàng" không hiển thị sau khi COMPLETED

---

### ✅ **BƯỚC 7: AUTO-COMPLETE (Nếu buyer không xác nhận)**

**Hành động:**
- Hệ thống tự động chạy (scheduled service/cron job)
- Kiểm tra các đơn hàng có:
  - Status = `DELIVERED`
  - `deliveredAt` > 7 ngày
  - Chưa `COMPLETED`

**Kết quả:**
- ✅ Order status tự động chuyển thành `COMPLETED`
- ✅ `completedAt` được set
- ✅ Buyer không thể trả hàng nữa

**Lưu ý:**
- ⚠️ Tính năng này cần scheduled service (cron job) chạy định kỳ
- ⚠️ Cần kiểm tra xem backend đã implement chưa

---

## 🔄 TRƯỜNG HỢP GIAO HÀNG THẤT BẠI

### **Shipper báo giao hàng thất bại:**

**Hành động:**
- Shipper không thể giao hàng (khách không có nhà, địa chỉ sai, etc.)
- Shipper click "Giao hàng thất bại"
- Shipper nhập lý do thất bại

**API:**
```http
PUT /api/v1/shipper/shipment/{shipmentId}/fail
Authorization: Bearer <shipper_token>
Content-Type: application/json

"Khách hàng không có nhà, không liên lạc được"
```

**Kết quả:**
- ✅ Shipment status chuyển từ `SHIPPING` → `DELIVERED_FAIL`
- ✅ `failReason` được lưu
- ✅ Order status có thể vẫn `SHIPPING` hoặc chuyển về `CONFIRMED`
- ✅ Store nhận được thông báo

**Tiếp theo:**
- Shipper có thể trả hàng về store:
  - `PUT /api/v1/shipper/shipment/{shipmentId}/returning` → Status = `RETURNING`
  - `PUT /api/v1/shipper/shipment/{shipmentId}/returned` → Status = `RETURNED`
- Order status chuyển thành `CANCELLED`

---

## 📊 BẢNG TÓM TẮT STATUS

### **Order Status Flow:**
```
PENDING → CONFIRMED → SHIPPING → DELIVERED → COMPLETED
                              ↓
                          CANCELLED (nếu fail)
```

### **Shipment Status Flow:**
```
READY_TO_PICK → PICKING → PICKED → SHIPPING → DELIVERED
                                      ↓
                                 DELIVERED_FAIL → RETURNING → RETURNED
```

---

## 🎯 AI LÀM GÌ Ở TỪNG BƯỚC

### **STORE (Người bán):**
1. ✅ Xác nhận đơn hàng (`PENDING` → `CONFIRMED`)
2. ✅ Tạo shipment (`READY_TO_PICK`)
3. ❌ KHÔNG thể chuyển shipment status sang `SHIPPING` (chỉ Shipper mới làm được)
4. ✅ Xem danh sách shipments
5. ✅ Xem chi tiết shipment

### **SHIPPER:**
1. ✅ Xem danh sách shipments `READY_TO_PICK`
2. ✅ Nhận đơn (`READY_TO_PICK` → `PICKING` → `PICKED`)
3. ✅ Bắt đầu giao hàng (`PICKED` → `SHIPPING`)
4. ✅ Hoàn thành giao hàng (`SHIPPING` → `DELIVERED`)
5. ✅ Báo giao hàng thất bại (`SHIPPING` → `DELIVERED_FAIL`)
6. ✅ Trả hàng về store (`DELIVERED_FAIL` → `RETURNING` → `RETURNED`)

### **BUYER (Người mua):**
1. ✅ Xem đơn hàng với status `DELIVERED`
2. ✅ Xác nhận hoàn tất (`DELIVERED` → `COMPLETED`)
3. ✅ Tạo return request (nếu cần trả hàng, chỉ khi `DELIVERED` và chưa `COMPLETED`)

---

## ⚠️ LƯU Ý QUAN TRỌNG

1. **Store KHÔNG tự động tạo shipment:**
   - Store phải click button "Tạo/Giao vận đơn" sau khi xác nhận đơn hàng
   - Shipment không tự động tạo khi confirm order

2. **Store KHÔNG thể chuyển shipment status sang SHIPPING:**
   - Chỉ Shipper mới có quyền chuyển shipment status sang `SHIPPING`
   - Store chỉ tạo shipment và để shipper xử lý

3. **Order status và Shipment status độc lập:**
   - Order status có thể là `CONFIRMED` trong khi Shipment status là `SHIPPING`
   - Order status chỉ chuyển sang `DELIVERED` khi Shipper hoàn thành giao hàng

4. **Auto-complete sau 7 ngày:**
   - Nếu buyer không xác nhận sau 7 ngày, hệ thống tự động set `COMPLETED`
   - Cần scheduled service chạy định kỳ

---

## 🧪 TEST THEO QUY TRÌNH

1. ✅ Store xác nhận đơn hàng
2. ✅ Store tạo shipment
3. ✅ Shipper nhận đơn
4. ✅ Shipper bắt đầu giao hàng
5. ✅ Shipper hoàn thành giao hàng
6. ✅ Buyer xác nhận hoàn tất

**File test plan chi tiết:** `FE/TEST_ORDER_FLOW.md`





