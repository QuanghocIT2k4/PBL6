# QUY TRÌNH ĐẶT HÀNG KHI CÓ NHIỀU STORE KHÁC NHAU

## 📋 TỔNG QUAN

Khi người mua có giỏ hàng chứa sản phẩm từ **2 store khác nhau** và muốn checkout một lần, hệ thống sẽ tự động:
- **Tách thành 2 đơn hàng riêng** (mỗi store 1 đơn)
- **Thanh toán gộp 1 lần** (nếu online payment)
- **Xử lý độc lập** cho từng đơn từ xác nhận → vận chuyển → hoàn thành

---

## 🔄 QUY TRÌNH CHI TIẾT

### 1️⃣ GIAI ĐOẠN CHECKOUT (Người mua)

#### 1.1. Frontend xử lý

**Input:**
- Giỏ hàng có items từ 2 store khác nhau
- Ví dụ:
  - Store A: iPhone 17 (15.000.000₫)
  - Store B: Nothing Phone 3A (9.900.000₫)

**Xử lý:**
```
1. Frontend tự động nhóm items theo storeId
   ├── Store A: [iPhone 17]
   └── Store B: [Nothing Phone 3A]

2. Tính toán riêng cho mỗi store:
   ├── Store A:
   │   ├── productPrice: 15.000.000₫
   │   ├── shippingFee: 15.000₫ (tính theo tỉnh Store A → tỉnh Buyer)
   │   ├── storeDiscount: 100.000₫ (mã khuyến mãi Store A)
   │   ├── platformDiscount: 100.000₫ (mã khuyến mãi sàn)
   │   └── totalPrice: 14.815.000₫
   │
   └── Store B:
       ├── productPrice: 9.900.000₫
       ├── shippingFee: 15.000₫ (tính theo tỉnh Store B → tỉnh Buyer)
       ├── storeDiscount: 0₫ (không có mã store)
       ├── platformDiscount: 100.000₫ (mã khuyến mãi sàn)
       └── totalPrice: 9.815.000₫
```

**Mã khuyến mãi:**
- **Mã khuyến mãi sàn**: Áp dụng chung cho cả 2 đơn
- **Mã khuyến mãi store**: Mỗi store có thể có mã riêng

#### 1.2. Gửi request tạo đơn

**API Endpoint:** `POST /api/v1/buyer/orders/checkout`

**Request 1 - Đơn Store A:**
```json
{
  "selectedItems": [
    {
      "productVariantId": "variant_iphone_17",
      "quantity": 1
    }
  ],
  "paymentMethod": "VNPAY",
  "address": {
    "province": "Thành phố Hồ Chí Minh",
    "ward": "Phường Tân Khánh",
    "homeAddress": "123 Đường ABC",
    "phone": "0367238566"
  },
  "platformPromotions": {
    "orderPromotionCode": "NOEL25",
    "shippingPromotionCode": "MIENPHISHIPSAN",
    "applyShippingToStores": ["storeA_id"]
  },
  "storePromotions": {
    "storeA_id": "STORE_CODE_A"
  },
  "note": "Giao hàng giờ hành chính",
  "expectedDeliveryDate": "2025-01-15T00:00:00Z"
}
```

**Request 2 - Đơn Store B:**
```json
{
  "selectedItems": [
    {
      "productVariantId": "variant_nothing_phone",
      "quantity": 1
    }
  ],
  "paymentMethod": "VNPAY",
  "address": {
    "province": "Thành phố Hồ Chí Minh",
    "ward": "Phường Tân Khánh",
    "homeAddress": "123 Đường ABC",
    "phone": "0367238566"
  },
  "platformPromotions": {
    "orderPromotionCode": "NOEL25",
    "shippingPromotionCode": null
  },
  "storePromotions": null,
  "note": "Giao hàng giờ hành chính",
  "expectedDeliveryDate": "2025-01-16T00:00:00Z"
}
```

#### 1.3. Backend xử lý

**Tạo 2 đơn hàng riêng biệt:**

**Đơn hàng 1 (Store A):**
```json
{
  "id": "order_001",
  "storeId": "storeA_id",
  "status": "PENDING",
  "paymentStatus": "PENDING",
  "productPrice": 15000000,
  "shippingFee": 15000,
  "storeDiscountAmount": 100000,
  "platformDiscountAmount": 100000,
  "totalPrice": 14815000,
  "paymentMethod": "VNPAY"
}
```

**Đơn hàng 2 (Store B):**
```json
{
  "id": "order_002",
  "storeId": "storeB_id",
  "status": "PENDING",
  "paymentStatus": "PENDING",
  "productPrice": 9900000,
  "shippingFee": 15000,
  "storeDiscountAmount": 0,
  "platformDiscountAmount": 100000,
  "totalPrice": 9815000,
  "paymentMethod": "VNPAY"
}
```

#### 1.4. Thanh toán

**Nếu `paymentMethod = VNPAY` hoặc `MOMO`:**

1. Frontend tính tổng:
   ```
   totalAmount = order_001.totalPrice + order_002.totalPrice
   totalAmount = 14.815.000₫ + 9.815.000₫ = 24.630.000₫
   ```

2. Gọi payment gateway **1 lần duy nhất**:
   ```javascript
   {
     amount: 24630000,
     orderIds: ["order_001", "order_002"],
     orderInfo: "Thanh toán 2 đơn hàng (ORDER001, ORDER002)"
   }
   ```

3. Backend liên kết:
   - 1 giao dịch thanh toán (`transactionId`)
   - Nhiều order (`orderIds[]`)
   - Khi thanh toán thành công → Cả 2 đơn chuyển `paymentStatus: COMPLETED`

**Nếu `paymentMethod = COD`:**
- Không cần thanh toán online
- Cả 2 đơn ở trạng thái `PENDING`, chờ store xác nhận
- Shipper sẽ thu tiền khi giao hàng

---

### 2️⃣ GIAI ĐOẠN STORE XÁC NHẬN (Store Owner)

#### 2.1. Store nhận thông báo

**Store A nhận notification:**
```json
{
  "type": "NEW_ORDER",
  "message": "Bạn có đơn hàng mới #ORDER001",
  "orderId": "order_001",
  "storeId": "storeA_id"
}
```

**Store B nhận notification:**
```json
{
  "type": "NEW_ORDER",
  "message": "Bạn có đơn hàng mới #ORDER002",
  "orderId": "order_002",
  "storeId": "storeB_id"
}
```

**Lưu ý:** Mỗi store chỉ nhận thông báo về đơn hàng của mình.

#### 2.2. Store xem chi tiết đơn

**API:** `GET /api/v1/b2c/orders/{orderId}?storeId={storeId}`

**Store A xem đơn của mình:**
```json
{
  "id": "order_001",
  "storeId": "storeA_id",
  "status": "PENDING",
  "orderItems": [
    {
      "productVariantId": "variant_iphone_17",
      "quantity": 1,
      "price": 15000000
    }
  ],
  "productPrice": 15000000,
  "shippingFee": 15000,
  "storeDiscountAmount": 100000,
  "platformDiscountAmount": 100000,
  "totalPrice": 14815000,
  "buyerPaidTotal": 14815000,
  "storeReceiveTotal": 14915000, // = buyerPaidTotal + platformDiscount
  "address": {...},
  "paymentMethod": "VNPAY",
  "paymentStatus": "COMPLETED"
}
```

**Giải thích:**
- **Tổng tiền người mua trả**: 14.815.000₫ (đã trừ cả store discount và platform discount)
- **Giảm giá từ mã store**: 100.000₫ (Store A chịu)
- **Giảm giá từ mã sàn**: 100.000₫ (Sàn chịu, sẽ bù vào ví store)
- **Tổng cộng store nhận**: 14.915.000₫ (14.815.000₫ từ người mua + 100.000₫ sàn bù)

#### 2.3. Store xác nhận đơn

**API:** `PUT /api/v1/b2c/orders/{orderId}/confirm`

**Mỗi store xác nhận đơn của mình độc lập:**

**Store A xác nhận:**
- `order_001.status` → `CONFIRMED`
- Trừ tồn kho Store A
- Tạo `Shipment` cho `order_001`

**Store B xác nhận:**
- `order_002.status` → `CONFIRMED`
- Trừ tồn kho Store B
- Tạo `Shipment` cho `order_002`

**Lưu ý:** Store A và Store B có thể xác nhận vào thời điểm khác nhau.

---

### 3️⃣ GIAI ĐOẠN VẬN CHUYỂN (Shipper)

#### 3.1. Shipper nhận đơn

**Mỗi đơn có shipment riêng:**

**Shipment 1 (Store A):**
```json
{
  "id": "shipment_001",
  "orderId": "order_001",
  "storeId": "storeA_id",
  "status": "PICKING_UP",
  "pickupAddress": {
    "province": "Hà Nội",
    "address": "Địa chỉ Store A"
  },
  "deliveryAddress": {
    "province": "Thành phố Hồ Chí Minh",
    "address": "123 Đường ABC"
  }
}
```

**Shipment 2 (Store B):**
```json
{
  "id": "shipment_002",
  "orderId": "order_002",
  "storeId": "storeB_id",
  "status": "PICKING_UP",
  "pickupAddress": {
    "province": "Đà Nẵng",
    "address": "Địa chỉ Store B"
  },
  "deliveryAddress": {
    "province": "Thành phố Hồ Chí Minh",
    "address": "123 Đường ABC"
  }
}
```

**Lưu ý:**
- Shipper có thể nhận 1 hoặc cả 2 shipment (tùy phân công)
- Mỗi shipment có địa chỉ lấy hàng khác nhau (từ store tương ứng)
- Địa chỉ giao hàng giống nhau (cùng người mua)

#### 3.2. Shipper cập nhật trạng thái

**API:** `PUT /api/v1/shipper/shipments/{shipmentId}/status`

**Quy trình:**
```
PICKING_UP → SHIPPING → DELIVERED
```

**Khi `status = DELIVERED`:**
- Đơn hàng tương ứng chuyển `status: DELIVERED`
- Nếu đã thanh toán online → `paymentStatus: COMPLETED`
- Nếu COD → `paymentStatus: PENDING` (chờ shipper thu tiền)

**Lưu ý:** Mỗi shipment được cập nhật độc lập, có thể giao hàng vào thời điểm khác nhau.

---

### 4️⃣ GIAI ĐOẠN HOÀN THÀNH (Người mua nhận hàng)

#### 4.1. Người mua nhận hàng

**Tình huống:**
- Có thể nhận **2 lần** (nếu 2 shipper khác nhau)
- Hoặc nhận **1 lần** (nếu cùng shipper giao cả 2 đơn)

**Mỗi đơn được xử lý độc lập.**

#### 4.2. Người mua xác nhận nhận hàng

**API:** `PUT /api/v1/buyer/orders/{orderId}/complete`

**Người mua xác nhận từng đơn:**

**Xác nhận đơn 1:**
- `order_001.status` → `COMPLETED`
- Nếu COD → `paymentStatus: COMPLETED` (shipper đã thu tiền)
- Cộng tiền vào ví Store A

**Xác nhận đơn 2:**
- `order_002.status` → `COMPLETED`
- Nếu COD → `paymentStatus: COMPLETED` (shipper đã thu tiền)
- Cộng tiền vào ví Store B

**Sau khi xác nhận:**
- Cho phép đánh giá sản phẩm
- Đơn hàng hoàn tất

#### 4.3. Thanh toán cho store

**Nếu đã thanh toán online (VNPay/MoMo):**
- Tiền đã được chuyển vào ví store khi đơn `COMPLETED`
- **Store A nhận:**
  ```
  order_001.totalPrice + order_001.platformDiscountAmount
  = 14.815.000₫ + 100.000₫
  = 14.915.000₫
  ```
- **Store B nhận:**
  ```
  order_002.totalPrice + order_002.platformDiscountAmount
  = 9.815.000₫ + 100.000₫
  = 9.915.000₫
  ```

**Nếu COD:**
- Shipper thu tiền từ người mua
- Tiền được chuyển vào ví store sau khi đơn `COMPLETED`
- **Store A nhận:** 14.815.000₫ (không có platform discount bù vì COD)
- **Store B nhận:** 9.815.000₫ (không có platform discount bù vì COD)

---

## 🔑 ĐIỂM QUAN TRỌNG

### 1. Tách đơn hàng

- ✅ **Frontend tự động tách** khi checkout (nhóm items theo `storeId`)
- ✅ **Backend tạo 2 đơn riêng biệt** (mỗi đơn có `id`, `storeId` riêng)
- ✅ **Mỗi đơn có `shipmentId` riêng** (quản lý vận chuyển độc lập)

### 2. Thanh toán

- ✅ **Chỉ thanh toán 1 lần** (nếu online payment)
- ✅ **Backend liên kết 1 giao dịch với nhiều order** qua `orderIds[]`
- ✅ **Người mua chỉ trả 1 lần** tổng tiền của cả 2 đơn

### 3. Vận chuyển

- ✅ **Mỗi đơn có shipment riêng** (có thể giao cùng lúc hoặc khác thời điểm)
- ✅ **Mỗi store tự quản lý shipment** của mình
- ✅ **Shipper có thể nhận 1 hoặc cả 2 shipment** (tùy phân công)

### 4. Ví store

- ✅ **Mỗi store có ví riêng** (`/api/v1/b2c/wallet/store/{storeId}`)
- ✅ **Tiền được cộng vào ví khi đơn `COMPLETED`**
- ✅ **Sàn bù tiền mã khuyến mãi sàn** vào ví store (chỉ khi online payment)

### 5. Thông báo

- ✅ **Mỗi role nhận notification riêng:**
  - **Buyer**: Thông báo về cả 2 đơn
  - **Store A**: Chỉ thông báo về đơn của Store A
  - **Store B**: Chỉ thông báo về đơn của Store B
  - **Shipper**: Thông báo về shipment được phân công

---

## 📊 SƠ ĐỒ QUY TRÌNH

```
┌─────────────────────────────────────────────────────────────┐
│                    CHECKOUT (Người mua)                      │
│  Giỏ hàng: Store A + Store B                                │
│  ↓                                                           │
│  Frontend tách thành 2 nhóm                                 │
│  ↓                                                           │
│  POST /api/v1/buyer/orders/checkout (2 lần)                │
│  ├── Đơn 1: Store A                                         │
│  └── Đơn 2: Store B                                         │
│  ↓                                                           │
│  Thanh toán 1 lần (nếu online)                              │
│  └── Payment Gateway với orderIds: [order1, order2]         │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│              STORE CONFIRM (Store Owner)                     │
│  Store A xác nhận đơn 1 → CONFIRMED                         │
│  Store B xác nhận đơn 2 → CONFIRMED                         │
│  ↓                                                           │
│  Tạo Shipment cho mỗi đơn                                    │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│              SHIPPER PICKUP (Shipper)                       │
│  Shipment 1: PICKING_UP → SHIPPING → DELIVERED             │
│  Shipment 2: PICKING_UP → SHIPPING → DELIVERED             │
│  (Có thể giao cùng lúc hoặc khác thời điểm)                 │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│              DELIVERY (Người mua)                           │
│  Nhận đơn 1 → Xác nhận COMPLETE                             │
│  Nhận đơn 2 → Xác nhận COMPLETE                             │
│  ↓                                                           │
│  Tiền vào ví Store A + Store B                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 📝 TÓM TẮT QUY TRÌNH

1. **CHECKOUT** → Tạo 2 đơn riêng → Thanh toán 1 lần (nếu online)
2. **STORE CONFIRM** → Mỗi store xác nhận đơn của mình
3. **SHIPPER PICKUP** → Mỗi đơn có shipment riêng
4. **DELIVERY** → Giao hàng độc lập (có thể khác thời điểm)
5. **COMPLETE** → Người mua xác nhận từng đơn
6. **SETTLEMENT** → Tiền vào ví từng store riêng

---

## 🎯 KẾT LUẬN

Đây là cách hoạt động theo **logic Shopee**: 
- ✅ **Tách đơn theo store** (mỗi store quản lý đơn riêng)
- ✅ **Thanh toán gộp 1 lần** (người mua chỉ trả 1 lần)
- ✅ **Xử lý độc lập** (mỗi đơn có lifecycle riêng)
- ✅ **Linh hoạt** (có thể giao hàng khác thời điểm)

