# HƯỚNG DẪN KIỂM TRA FLOW SHIPMENT

## 🎯 Mục tiêu
Kiểm tra xem sau khi Store confirm order, shipment có tự động hiển thị trong:
1. Trang StoreShipments (Store)
2. Trang ShipperDashboard (Shipper)

---

## 📋 CÁC BƯỚC KIỂM TRA

### BƯỚC 1: Chuẩn bị
1. **Mở 2 trình duyệt/tab:**
   - Tab 1: Store Dashboard (đăng nhập với tài khoản Store Owner)
   - Tab 2: Shipper Dashboard (đăng nhập với tài khoản Shipper)

2. **Mở Developer Tools (F12) ở cả 2 tab:**
   - Tab Console để xem logs
   - Tab Network để xem API calls

---

### BƯỚC 2: Kiểm tra trạng thái ban đầu

#### Trong Tab Store:
1. Vào trang **"Vận chuyển"** (`/store-dashboard/shipments`)
2. Ghi lại:
   - Số lượng shipments hiện tại
   - Stats (Đang lấy hàng, Đang giao, Đã giao, Thất bại)
3. Mở Console, xem logs:
   ```
   📦 [StoreShipments] Fetching shipments...
   ✅ [StoreShipments] Shipments loaded: ...
   📊 [StoreShipments] Total shipments: X
   ```

#### Trong Tab Shipper:
1. Vào trang **"Dashboard"** (`/shipper`)
2. Ghi lại:
   - Số lượng "Đơn chờ nhận" hiện tại
3. Mở Console, xem logs

---

### BƯỚC 3: Confirm Order

#### Trong Tab Store:
1. Vào trang **"Đơn hàng"** (`/store-dashboard/orders`)
2. Tìm một đơn hàng có status **"Chờ xác nhận"** (PENDING)
3. Bấm **"Xác nhận đơn hàng"**
4. Xác nhận trong popup
5. **Quan sát Console:**
   ```
   🔄 [StoreOrders] Invalidating shipments cache after confirm order...
   🔄 [StoreOrders] Retry refresh shipments (1s)...
   🔄 [StoreOrders] Retry refresh shipments (2s)...
   ```
6. **Quan sát Network tab:**
   - Xem có API call đến `/api/v1/b2c/orders/{orderId}/confirm` không
   - Xem có API call đến `/api/v1/b2c/shipments/store/{storeId}` không (sau 500ms, 1s, 2s)

---

### BƯỚC 4: Kiểm tra StoreShipments

#### Trong Tab Store:
1. **Chuyển sang tab "Vận chuyển"** (hoặc refresh trang)
2. **Kiểm tra Console:**
   ```
   📦 [StoreShipments] Fetching shipments...
   ✅ [StoreShipments] Shipments loaded: ...
   📦 [StoreShipments] Shipments updated: X items
   📊 [StoreShipments] Stats: { total: X, pickingUp: Y, ... }
   ```
3. **Kiểm tra UI:**
   - Stats card "Đang lấy hàng" có tăng lên không?
   - Danh sách shipments có hiển thị shipment mới không?
   - Shipment mới có status "Đang lấy hàng" không?
   - Shipper hiển thị "Chưa có shipper" không?

---

### BƯỚC 5: Kiểm tra ShipperDashboard

#### Trong Tab Shipper:
1. **Refresh trang** (hoặc chuyển tab rồi quay lại)
2. **Kiểm tra Console:**
   - Xem có API call đến `/api/v1/shipper/shipments/picking-up` không
3. **Kiểm tra UI:**
   - Stats card "Đơn chờ nhận" có tăng lên không?
   - Tab "Đơn chờ nhận" có hiển thị đơn mới không?
   - Đơn mới có status "Đang nhận hàng" không?

---

### BƯỚC 6: Test Shipper nhận đơn

#### Trong Tab Shipper:
1. Bấm **"Nhận đơn"** trên đơn hàng mới
2. **Kiểm tra Console:**
   - Xem có API call đến `/api/v1/shipper/order/{orderId}/pickup` không
3. **Kiểm tra UI:**
   - Đơn có biến mất khỏi "Đơn chờ nhận" không?
   - Stats "Đơn chờ nhận" có giảm không?

#### Trong Tab Store:
1. **Refresh trang "Vận chuyển"**
2. **Kiểm tra UI:**
   - Shipper có hiển thị tên shipper thay vì "Chưa có shipper" không?

---

## ✅ KẾT QUẢ MONG ĐỢI

### Sau khi Store confirm order:
- ✅ StoreShipments: Stats "Đang lấy hàng" tăng lên
- ✅ StoreShipments: Danh sách hiển thị shipment mới với status "Đang lấy hàng"
- ✅ StoreShipments: Shipper hiển thị "Chưa có shipper"
- ✅ ShipperDashboard: Stats "Đơn chờ nhận" tăng lên
- ✅ ShipperDashboard: Tab "Đơn chờ nhận" hiển thị đơn mới

### Sau khi Shipper nhận đơn:
- ✅ ShipperDashboard: Đơn biến mất khỏi "Đơn chờ nhận"
- ✅ StoreShipments: Shipper hiển thị tên shipper

---

## 🐛 NẾU KHÔNG HOẠT ĐỘNG

### Kiểm tra:
1. **Console có lỗi không?**
   - Nếu có lỗi, copy lỗi và báo lại

2. **Network tab:**
   - API `/api/v1/b2c/orders/{orderId}/confirm` có trả về success không?
   - API `/api/v1/b2c/shipments/store/{storeId}` có được gọi không?
   - Response của API shipments có chứa shipment mới không?

3. **Backend:**
   - Kiểm tra MongoDB xem shipment có được tạo không
   - Kiểm tra shipment có status `PICKING_UP` không
   - Kiểm tra shipment có `carrier` = null không

4. **Cache:**
   - Thử hard refresh (Ctrl+Shift+R)
   - Thử clear cache và reload
   - Thử mở Incognito mode

---

## 📝 GHI CHÚ

- Nếu shipment không hiển thị ngay, đợi 2-3 giây (có retry logic)
- Nếu vẫn không hiển thị, kiểm tra backend có tự động tạo shipment không
- Có thể cần kiểm tra backend logs để xem có lỗi gì không



