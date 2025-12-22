# 📦 GIẢI THÍCH VỀ READY_TO_PICK VÀ SHIPMENT STATUS

## 🎯 READY_TO_PICK LÀ GÌ?

`READY_TO_PICK` là một **trạng thái (status)** của **Shipment** (Vận đơn).

### Định nghĩa:
- **READY_TO_PICK** = "Sẵn sàng lấy hàng"
- Đây là trạng thái **mặc định** khi Store tạo shipment mới
- Nghĩa là: Store đã chuẩn bị xong hàng, đóng gói xong, và sẵn sàng để Shipper đến lấy

---

## 📊 VỊ TRÍ TRONG DATABASE

### **Collection/Table:** `shipments`

### **Model:** `Shipment` (Mongoose Schema)

### **File:** `buyer-BE/src/models/Shipment.js`

### **Cấu trúc:**

```javascript
{
  _id: ObjectId("..."),                    // ID của shipment
  order: ObjectId("..."),                  // Reference đến Order
  store: ObjectId("..."),                  // Reference đến Store
  shipper: ObjectId("...") | null,         // Reference đến Shipper (null khi chưa có shipper nhận)
  status: "READY_TO_PICK",                 // ⭐ ĐÂY LÀ CHỖ CHỨA READY_TO_PICK
  pickupAddress: "123 Đường Store...",     // Địa chỉ lấy hàng
  deliveryAddress: "456 Đường Buyer...",    // Địa chỉ giao hàng
  failReason: "",                          // Lý do thất bại (nếu có)
  pickedAt: null,                          // Thời gian lấy hàng
  shippedAt: null,                         // Thời gian bắt đầu giao
  deliveredAt: null,                       // Thời gian giao thành công
  returnedAt: null,                        // Thời gian trả hàng
  createdAt: ISODate("..."),               // Thời gian tạo
  updatedAt: ISODate("...")                // Thời gian cập nhật
}
```

---

## 🔄 TẤT CẢ CÁC STATUS CỦA SHIPMENT

### **Enum values trong database:**

```javascript
status: {
  type: String,
  enum: [
    'READY_TO_PICK',      // ⭐ Sẵn sàng lấy hàng (mặc định)
    'PICKING',            // Đang lấy hàng
    'PICKED',             // Đã lấy hàng
    'SHIPPING',           // Đang vận chuyển
    'DELIVERED',          // Đã giao hàng thành công
    'DELIVERED_FAIL',     // Giao hàng thất bại
    'RETURNING',          // Đang trả hàng
    'RETURNED',           // Đã trả hàng
  ],
  default: 'READY_TO_PICK'  // ⭐ Giá trị mặc định
}
```

---

## 📈 FLOW CỦA SHIPMENT STATUS

### **Flow chính (thành công):**
```
READY_TO_PICK → PICKING → PICKED → SHIPPING → DELIVERED
```

### **Flow thất bại:**
```
SHIPPING → DELIVERED_FAIL → RETURNING → RETURNED
```

### **Chi tiết từng bước:**

1. **READY_TO_PICK** (Sẵn sàng lấy hàng)
   - Store vừa tạo shipment
   - Shipper chưa nhận đơn
   - `shipper` = `null`

2. **PICKING** (Đang lấy hàng)
   - Shipper đã nhận đơn
   - Shipper đang trên đường đến store
   - `shipper` = ObjectId của shipper
   - API: `PUT /api/v1/shipper/order/{orderId}/picking`

3. **PICKED** (Đã lấy hàng)
   - Shipper đã đến store và lấy hàng xong
   - `pickedAt` được set
   - API: `PUT /api/v1/shipper/shipment/{shipmentId}/picked`

4. **SHIPPING** (Đang vận chuyển)
   - Shipper đang trên đường giao hàng
   - `shippedAt` được set
   - API: `PUT /api/v1/shipper/shipment/{shipmentId}/shipping`

5. **DELIVERED** (Đã giao hàng thành công)
   - Shipper đã giao hàng cho buyer
   - `deliveredAt` được set
   - Order status cũng chuyển thành `DELIVERED`
   - API: `PUT /api/v1/shipper/shipment/{shipmentId}/delivered`

6. **DELIVERED_FAIL** (Giao hàng thất bại)
   - Shipper không thể giao hàng (khách không có nhà, địa chỉ sai, etc.)
   - `failReason` được lưu
   - API: `PUT /api/v1/shipper/shipment/{shipmentId}/delivered-fail`

7. **RETURNING** (Đang trả hàng)
   - Shipper đang trả hàng về store
   - API: `PUT /api/v1/shipper/shipment/{shipmentId}/returning`

8. **RETURNED** (Đã trả hàng)
   - Shipper đã trả hàng về store
   - `returnedAt` được set
   - Order status chuyển thành `CANCELLED`
   - API: `PUT /api/v1/shipper/shipment/{shipmentId}/returned`

---

## 🔍 CÁCH KIỂM TRA TRONG DATABASE

### **MongoDB Query:**

```javascript
// Tìm tất cả shipments có status = READY_TO_PICK
db.shipments.find({ status: "READY_TO_PICK" })

// Tìm shipments của một store cụ thể
db.shipments.find({ 
  store: ObjectId("store_id_here"),
  status: "READY_TO_PICK" 
})

// Đếm số lượng shipments READY_TO_PICK
db.shipments.countDocuments({ status: "READY_TO_PICK" })

// Tìm shipments chưa có shipper nhận
db.shipments.find({ 
  status: "READY_TO_PICK",
  shipper: null 
})
```

### **Mongoose Query (Backend):**

```javascript
// Tìm shipments READY_TO_PICK
const readyShipments = await Shipment.find({ 
  status: 'READY_TO_PICK' 
}).populate('order store');

// Tìm shipments của store chưa có shipper
const storeShipments = await Shipment.find({
  store: storeId,
  status: 'READY_TO_PICK',
  shipper: null
});
```

---

## 📝 VÍ DỤ DOCUMENT TRONG DATABASE

### **Khi Store tạo shipment mới:**

```json
{
  "_id": ObjectId("67890abcdef1234567890123"),
  "order": ObjectId("12345abcdef1234567890123"),
  "store": ObjectId("store123abcdef123456789"),
  "shipper": null,                                    // ⚠️ Chưa có shipper
  "status": "READY_TO_PICK",                          // ⭐ Status mặc định
  "pickupAddress": "123 Đường Store, Quận 1, TP.HCM",
  "deliveryAddress": "456 Đường Buyer, Quận 2, TP.HCM",
  "failReason": "",
  "pickedAt": null,
  "shippedAt": null,
  "deliveredAt": null,
  "returnedAt": null,
  "createdAt": ISODate("2024-12-14T10:00:00Z"),
  "updatedAt": ISODate("2024-12-14T10:00:00Z")
}
```

### **Sau khi Shipper nhận đơn:**

```json
{
  "_id": ObjectId("67890abcdef1234567890123"),
  "order": ObjectId("12345abcdef1234567890123"),
  "store": ObjectId("store123abcdef123456789"),
  "shipper": ObjectId("shipper123abcdef123456"),      // ✅ Đã có shipper
  "status": "PICKING",                                // ✅ Đã chuyển status
  "pickupAddress": "123 Đường Store, Quận 1, TP.HCM",
  "deliveryAddress": "456 Đường Buyer, Quận 2, TP.HCM",
  "failReason": "",
  "pickedAt": null,
  "shippedAt": null,
  "deliveredAt": null,
  "returnedAt": null,
  "createdAt": ISODate("2024-12-14T10:00:00Z"),
  "updatedAt": ISODate("2024-12-14T10:30:00Z")       // ✅ Updated
}
```

---

## 🎯 TÓM TẮT

| Thuộc tính | Giá trị |
|------------|---------|
| **Collection** | `shipments` |
| **Field** | `status` |
| **Type** | `String` (enum) |
| **Giá trị** | `"READY_TO_PICK"` |
| **Mặc định** | ✅ Yes (khi tạo mới) |
| **Ý nghĩa** | Store đã chuẩn bị xong hàng, sẵn sàng để Shipper lấy |
| **File model** | `buyer-BE/src/models/Shipment.js` |
| **Dòng code** | Line 23, 32 |

---

## ⚠️ LƯU Ý

1. **READY_TO_PICK là status mặc định:**
   - Khi Store tạo shipment, status tự động = `READY_TO_PICK`
   - Không cần set thủ công

2. **Shipper phải nhận đơn:**
   - Shipper phải gọi API `PUT /api/v1/shipper/order/{orderId}/picking`
   - Status mới chuyển từ `READY_TO_PICK` → `PICKING`

3. **Store không thể thay đổi status:**
   - Store chỉ tạo shipment với status `READY_TO_PICK`
   - Chỉ Shipper mới có quyền thay đổi status của shipment

4. **Index trong database:**
   - Có index trên field `status` để query nhanh
   - Có index trên `order`, `store`, `shipper` để join nhanh

---

## 🔗 LIÊN KẾT

- **Model file:** `buyer-BE/src/models/Shipment.js`
- **Test plan:** `FE/TEST_ORDER_FLOW.md`
- **Quy trình:** `FE/QUY_TRINH_SAU_KHI_STORE_XAC_NHAN.md`
- **API docs:** `FE/Md/NEW_APIS_DOCUMENTATION.md`





