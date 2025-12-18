# 🔍 DEBUG - SHIPMENT KHÔNG HIỂN THỊ

## 🐛 VẤN ĐỀ
Sau khi tạo shipment thành công, không thấy shipment trong trang "Vận chuyển".

## ✅ ĐÃ SỬA

### 1. Thêm logging chi tiết
- ✅ Log khi tạo shipment
- ✅ Log khi fetch shipments
- ✅ Log khi parse data
- ✅ Log status của từng shipment

### 2. Cải thiện cache refresh
- ✅ Force refresh ngay sau khi tạo
- ✅ Retry refresh sau 500ms và 2000ms
- ✅ Invalidate cả shipments và stats

### 3. Xử lý nhiều format response
- ✅ Kiểm tra `content`, `shipments`, hoặc array trực tiếp
- ✅ Đảm bảo luôn là array trước khi render

## 🔍 CÁCH DEBUG

### Bước 1: Mở Console (F12)
1. Mở Developer Tools (F12)
2. Chuyển sang tab "Console"
3. Tạo shipment mới
4. Xem các logs:

```
📦 [createShipmentForOrder] Creating shipment for order: ...
✅ [createShipmentForOrder] Full response: ...
✅ [createShipmentForOrder] Shipment ID: ...
✅ [createShipmentForOrder] Shipment status: ...
🔄 [StoreOrders] Refreshing shipments cache...
📦 [StoreShipments] Fetching shipments...
✅ [StoreShipments] Shipments loaded: ...
📊 [StoreShipments] Total shipments: ...
```

### Bước 2: Kiểm tra API Response
1. Chuyển sang tab "Network"
2. Tìm request `POST /api/v1/b2c/shipments/order/{orderId}`
3. Xem Response:
   - Shipment có được tạo không?
   - Status là gì? (có thể là `READY_TO_PICK`)
   - Shipment ID là gì?

4. Tìm request `GET /api/v1/b2c/shipments/store/{storeId}`
5. Xem Response:
   - Có shipments trong response không?
   - Format là `content` hay `shipments`?
   - Status của shipments là gì?

### Bước 3: Kiểm tra Filter
1. Đảm bảo đang ở filter "Tất cả" (all)
2. Thử click vào filter "Sẵn sàng lấy hàng" (READY_TO_PICK)
3. Xem có shipments không

### Bước 4: Kiểm tra Stats
1. Xem card "Sẵn sàng lấy hàng" có tăng số không
2. Nếu stats tăng nhưng list không có → Vấn đề ở filter/parsing
3. Nếu stats không tăng → Vấn đề ở API hoặc cache

## 🚨 CÁC NGUYÊN NHÂN CÓ THỂ

### 1. Backend chưa lưu shipment
- **Kiểm tra:** Xem API POST có trả về 200 không
- **Giải pháp:** Đợi vài giây rồi refresh lại

### 2. Status không match
- **Kiểm tra:** Shipment có status `READY_TO_PICK` không?
- **Giải pháp:** Đảm bảo filter "Tất cả" hoặc "Sẵn sàng lấy hàng"

### 3. API response format khác
- **Kiểm tra:** Xem response có `content` hay `shipments`?
- **Giải pháp:** Code đã xử lý cả 2 format

### 4. Cache không refresh
- **Kiểm tra:** Click button "Làm mới" xem có shipments không
- **Giải pháp:** Code đã force refresh nhiều lần

### 5. Store ID không đúng
- **Kiểm tra:** Console log `currentStore?.id`
- **Giải pháp:** Đảm bảo store ID đúng

## 📝 CHECKLIST DEBUG

- [ ] Mở Console (F12)
- [ ] Tạo shipment mới
- [ ] Xem logs trong Console
- [ ] Kiểm tra Network tab → POST request
- [ ] Kiểm tra Network tab → GET request
- [ ] Xem response format
- [ ] Kiểm tra shipment status
- [ ] Thử filter "Sẵn sàng lấy hàng"
- [ ] Click "Làm mới" button
- [ ] Kiểm tra stats cards có tăng không

## 🎯 KẾT LUẬN

Sau khi làm theo các bước trên, gửi lại:
1. Console logs (copy/paste)
2. Network response của POST và GET requests
3. Screenshot của trang Shipments

Từ đó sẽ biết chính xác vấn đề ở đâu!


