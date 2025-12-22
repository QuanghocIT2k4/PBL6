# 🔄 SO SÁNH API ENDPOINTS - XML vs TEST_PLAN vs SWAGGER

## 📊 BẢNG SO SÁNH

| Chức năng | XML (DrawIO) | TEST_ORDER_FLOW.md | Swagger 1412 | Ghi chú |
|-----------|--------------|-------------------|--------------|---------|
| **Shipper nhận đơn (pick)** | `PUT /api/v1/shipper/orders/{orderId}/picking` | `PUT /api/v1/shipper/shipments/{shipmentId}/pick` | `PUT /api/v1/shipper/order/{orderId}/picking` | ⚠️ XML và Swagger dùng `orderId`, TEST_PLAN dùng `shipmentId` |
| **Shipper xác nhận đã lấy hàng** | `PUT /api/v1/shipper/shipment/{shipmentId}/picked` | `PUT /api/v1/shipper/shipments/{shipmentId}/picked` | `PUT /api/v1/shipper/shipment/{shipmentId}/picked` | ⚠️ TEST_PLAN dùng số nhiều `/shipments/`, còn lại dùng số ít `/shipment/` |
| **Shipper bắt đầu giao hàng** | `PUT /api/v1/shipper/shipment/{shipmentId}/shipping` | `PUT /api/v1/shipper/shipments/{shipmentId}/start-shipping` | `PUT /api/v1/shipper/shipment/{shipmentId}/shipping` | ⚠️ TEST_PLAN dùng `/start-shipping`, còn lại dùng `/shipping` |
| **Shipper hoàn thành giao hàng** | `PUT /api/v1/shipper/shipment/{shipmentId}/delivered` | `PUT /api/v1/shipper/shipments/{shipmentId}/complete` | `PUT /api/v1/shipper/shipment/{shipmentId}/delivered` | ⚠️ TEST_PLAN dùng `/complete`, còn lại dùng `/delivered` |
| **Shipper giao hàng thất bại** | `PUT /api/v1/shipper/shipment/{shipmentId}/fail` | `PUT /api/v1/shipper/shipments/{shipmentId}/fail` | `PUT /api/v1/shipper/shipment/{shipmentId}/fail` | ⚠️ TEST_PLAN dùng số nhiều `/shipments/` |
| **Shipper trả hàng về shop** | `PUT /api/v1/shipper/shipment/{shipmentId}/returning` | ❌ Chưa có | `PUT /api/v1/shipper/shipment/{shipmentId}/returning` | ⚠️ TEST_PLAN thiếu |
| **Shipper xác nhận đã trả hàng** | `PUT /api/v1/shipper/shipment/{shipmentId}/returned` | ❌ Chưa có | `PUT /api/v1/shipper/shipment/{shipmentId}/returned` | ⚠️ TEST_PLAN thiếu |
| **Shipper xem đơn cần lấy** | ❌ Không có | `GET /api/v1/shipper/shipments?status=READY_TO_PICK` | `GET /api/v1/shipper/shipments/ready-to-pickup` | ⚠️ Khác nhau |

---

## ✅ KẾT LUẬN

### **API Endpoints đúng theo Swagger 1412:**

1. **Shipper nhận đơn:**
   - `PUT /api/v1/shipper/order/{orderId}/picking` (dùng `orderId`)

2. **Shipper xác nhận đã lấy hàng:**
   - `PUT /api/v1/shipper/shipment/{shipmentId}/picked` (số ít `/shipment/`)

3. **Shipper bắt đầu giao hàng:**
   - `PUT /api/v1/shipper/shipment/{shipmentId}/shipping` (số ít `/shipment/`)

4. **Shipper hoàn thành giao hàng:**
   - `PUT /api/v1/shipper/shipment/{shipmentId}/delivered` (số ít `/shipment/`, dùng `/delivered`)

5. **Shipper giao hàng thất bại:**
   - `PUT /api/v1/shipper/shipment/{shipmentId}/fail` (số ít `/shipment/`, request body là string)

6. **Shipper trả hàng về shop:**
   - `PUT /api/v1/shipper/shipment/{shipmentId}/returning` (số ít `/shipment/`)

7. **Shipper xác nhận đã trả hàng:**
   - `PUT /api/v1/shipper/shipment/{shipmentId}/returned` (số ít `/shipment/`)

8. **Shipper xem đơn cần lấy:**
   - `GET /api/v1/shipper/shipments/ready-to-pickup` (số nhiều `/shipments/`)

---

## 🔧 CẦN CẬP NHẬT

**TEST_ORDER_FLOW.md cần sửa:**
1. ✅ Đổi `/shipments/` → `/shipment/` (số ít) cho các PUT endpoints
2. ✅ Đổi `/start-shipping` → `/shipping`
3. ✅ Đổi `/complete` → `/delivered`
4. ✅ Đổi `/pick` → `/picking` và dùng `orderId` thay vì `shipmentId`
5. ✅ Thêm test case cho `/returning` và `/returned`
6. ✅ Cập nhật endpoint GET danh sách shipments

**XML và Swagger đã đồng bộ với nhau!**





