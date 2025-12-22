# 💰 Ví Dụ Cụ Thể: Xử Lý Tiền Với Khuyến Mãi Sàn

## 📋 Thông Tin Đơn Hàng Mẫu

### Giả Định:
- **Product Price (Giá gốc sản phẩm):** 2,000,000 VND
- **Store Discount (Mã giảm giá của shop):** 100,000 VND
- **Platform Discount (Mã giảm giá của sàn):** 200,000 VND ⭐
- **Shipping Fee (Phí ship):** 50,000 VND

### Tính Toán Cơ Bản:
```
Tổng khách thanh toán = Product Price - Store Discount - Platform Discount + Shipping Fee
                     = 2,000,000 - 100,000 - 200,000 + 50,000
                     = 1,750,000 VND
```

### Tính Toán Cho Shop và Admin:
```
Base Amount (sau giảm giá shop) = Product Price - Store Discount
                                = 2,000,000 - 100,000
                                = 1,900,000 VND

Shop nhận = 95% × Base Amount + Shipping Fee
         = 95% × 1,900,000 + 50,000
         = 1,805,000 + 50,000
         = 1,855,000 VND

Hoa hồng sàn = 5% × Base Amount
            = 5% × 1,900,000
            = 95,000 VND

Platform Discount Loss = 200,000 VND (Admin phải chịu)
```

---

## 📊 Trạng Thái Ví Ban Đầu

### Shop Wallet:
- **Balance:** 5,000,000 VND
- **PendingAmount:** 1,855,000 VND (tạm giữ khi tạo đơn)

### Admin Revenue:
- **Tổng Revenue:** 10,000,000 VND

### Khách Hàng Wallet:
- **Balance:** 3,000,000 VND
- **Đã thanh toán:** 1,750,000 VND (cho đơn hàng này)

---

## 🎯 Trường Hợp 1: ✅ Đơn Hàng Thành Công

### Mô Tả:
Khách hàng nhận hàng và xác nhận hoàn tất đơn hàng.

### Xử Lý Tiền:

#### Shop:
```
Trước:
  Balance: 5,000,000 VND
  PendingAmount: 1,855,000 VND

Sau khi chuyển:
  Balance: 5,000,000 + 1,855,000 = 6,855,000 VND ✅
  PendingAmount: 0 VND ✅
```

#### Admin:
```
Trước:
  Revenue: 10,000,000 VND

Sau khi cộng hoa hồng và trừ discount:
  Revenue: 10,000,000 + 95,000 - 200,000 = 9,895,000 VND ✅
  
Chi tiết:
  + Hoa hồng: +95,000 VND
  - Platform Discount Loss: -200,000 VND
  = Tổng: -105,000 VND (lỗ do discount lớn hơn hoa hồng)
```

#### Khách Hàng:
```
Không thay đổi (đã thanh toán xong)
```

### ✅ Kết Quả:
- Shop nhận: **1,855,000 VND** (đúng công thức)
- Admin nhận: **-105,000 VND** (lỗ do discount sàn lớn)
- Khách đã thanh toán: **1,750,000 VND**

---

## 🔄 Trường Hợp 2: Shop Xác Nhận Hàng Trả Về OK

### Mô Tả:
Shop nhận lại hàng trả về và xác nhận hàng không có vấn đề, đồng ý hoàn tiền.

### Xử Lý Tiền:

#### Shop:
```
Trước:
  Balance: 5,000,000 VND
  PendingAmount: 1,855,000 VND

Sau khi trừ pendingAmount:
  Balance: 5,000,000 VND (không đổi)
  PendingAmount: 0 VND ✅
  
Trừ: -1,855,000 VND từ PendingAmount ✅
```

#### Admin:
```
Trước:
  Revenue: 10,000,000 VND

Sau khi cộng hoa hồng (tiền phạt):
  Revenue: 10,000,000 + 95,000 = 10,095,000 VND ✅
  
Chi tiết:
  + Hoa hồng (tiền phạt shop): +95,000 VND
  (Không trừ platform discount vì đây là tiền phạt)
```

#### Khách Hàng:
```
Trước:
  Balance: 3,000,000 VND

Sau khi hoàn tiền:
  Balance: 3,000,000 + 1,750,000 = 4,750,000 VND ✅
  
Hoàn tiền: +1,750,000 VND (tổng số đã thanh toán)
```

### ✅ Kết Quả:
- Shop trừ: **1,855,000 VND** từ PendingAmount (đúng công thức)
- Admin nhận: **+95,000 VND** (hoa hồng - tiền phạt)
- Khách nhận: **+1,750,000 VND** (hoàn tiền đầy đủ)

---

## ✅ Trường Hợp 3: Admin Giải Quyết - Shop Thắng

### Mô Tả:
Admin giải quyết khiếu nại và quyết định shop thắng (hàng không có vấn đề).

### Xử Lý Tiền:

#### Shop:
```
Trước:
  Balance: 5,000,000 VND
  PendingAmount: 1,855,000 VND

Sau khi chuyển:
  Balance: 5,000,000 + 1,855,000 = 6,855,000 VND ✅
  PendingAmount: 0 VND ✅
```

#### Admin:
```
Trước:
  Revenue: 10,000,000 VND

Sau khi cộng hoa hồng và trừ discount:
  Revenue: 10,000,000 + 95,000 - 200,000 = 9,895,000 VND ✅
  
Chi tiết:
  + Hoa hồng: +95,000 VND
  - Platform Discount Loss: -200,000 VND
  = Tổng: -105,000 VND
```

#### Khách Hàng:
```
Không thay đổi (shop thắng, không hoàn tiền)
```

### ✅ Kết Quả:
- Shop nhận: **1,855,000 VND** (đúng công thức)
- Admin nhận: **-105,000 VND** (lỗ do discount sàn)
- Khách: Không thay đổi

---

## ⚖️ Trường Hợp 4: Admin Giải Quyết - Hoàn Tiền Một Phần

### Mô Tả:
Admin giải quyết khiếu nại và quyết định hoàn tiền một phần **500,000 VND** cho khách.

### Xử Lý Tiền:

#### Shop:
```
Trước:
  Balance: 5,000,000 VND
  PendingAmount: 1,855,000 VND

Sau khi xử lý:
  Trừ hoàn tiền: -500,000 VND từ PendingAmount
  Chuyển phần còn lại: +1,355,000 VND vào Balance
  
  Balance: 5,000,000 + 1,355,000 = 6,355,000 VND ✅
  PendingAmount: 0 VND ✅
  
Chi tiết:
  - Trừ hoàn tiền: -500,000 VND
  - Chuyển vào Balance: +1,355,000 VND
  = Tổng: +855,000 VND (so với ban đầu)
```

#### Admin:
```
Trước:
  Revenue: 10,000,000 VND

Sau khi cộng hoa hồng và trừ discount:
  Revenue: 10,000,000 + 95,000 - 200,000 = 9,895,000 VND ✅
  
Chi tiết:
  + Hoa hồng: +95,000 VND
  - Platform Discount Loss: -200,000 VND
  = Tổng: -105,000 VND
```

#### Khách Hàng:
```
Trước:
  Balance: 3,000,000 VND

Sau khi hoàn tiền một phần:
  Balance: 3,000,000 + 500,000 = 3,500,000 VND ✅
  
Hoàn tiền: +500,000 VND
```

### ✅ Kết Quả:
- Shop nhận: **1,355,000 VND** (1,855,000 - 500,000)
- Admin nhận: **-105,000 VND** (lỗ do discount sàn)
- Khách nhận: **+500,000 VND** (hoàn tiền một phần)

### 📝 Validation:
```
partialRefundAmount (500,000) < productPrice - storeDiscountAmount - platformCommission
500,000 < 2,000,000 - 100,000 - 95,000
500,000 < 1,805,000 ✅ Hợp lệ
```

---

## ❌ Trường Hợp 5: Admin Giải Quyết - Khách Thắng

### Mô Tả:
Admin giải quyết khiếu nại và quyết định khách thắng (hàng có vấn đề).

### Xử Lý Tiền:

#### Shop:
```
Trước:
  Balance: 5,000,000 VND
  PendingAmount: 1,855,000 VND

Sau khi trừ pendingAmount:
  Balance: 5,000,000 VND (không đổi)
  PendingAmount: 0 VND ✅
  
Trừ: -1,855,000 VND từ PendingAmount ✅
```

#### Admin:
```
Trước:
  Revenue: 10,000,000 VND

Sau khi cộng hoa hồng (tiền phạt):
  Revenue: 10,000,000 + 95,000 = 10,095,000 VND ✅
  
Chi tiết:
  + Hoa hồng (tiền phạt shop): +95,000 VND
  (Không trừ platform discount vì đây là tiền phạt)
```

#### Khách Hàng:
```
Trước:
  Balance: 3,000,000 VND

Sau khi hoàn tiền đầy đủ:
  Balance: 3,000,000 + 1,750,000 = 4,750,000 VND ✅
  
Hoàn tiền: +1,750,000 VND (bao gồm cả shippingFee)
```

### ✅ Kết Quả:
- Shop trừ: **1,855,000 VND** từ PendingAmount (đúng công thức)
- Admin nhận: **+95,000 VND** (hoa hồng - tiền phạt)
- Khách nhận: **+1,750,000 VND** (hoàn tiền đầy đủ bao gồm shippingFee)

---

## 📊 Tổng Hợp So Sánh

| Trường Hợp | Shop Nhận/Trừ | Admin Nhận/Trừ | Khách Nhận | Ghi Chú |
|------------|---------------|----------------|------------|---------|
| **1. Đơn thành công** | +1,855,000 | -105,000 | 0 | Lỗ do discount sàn lớn |
| **2. Shop xác nhận return OK** | -1,855,000 | +95,000 | +1,750,000 | Tiền phạt shop |
| **3. Shop thắng dispute** | +1,855,000 | -105,000 | 0 | Giống trường hợp 1 |
| **4. Hoàn tiền một phần** | +1,355,000 | -105,000 | +500,000 | Trừ hoàn tiền từ shop |
| **5. Khách thắng dispute** | -1,855,000 | +95,000 | +1,750,000 | Giống trường hợp 2 |

---

## 🔍 Lưu Ý Quan Trọng

### 1. Platform Discount (Khuyến Mãi Sàn):
- ⚠️ **Chỉ được trừ** khi đơn hàng thành công hoặc shop thắng dispute
- ❌ **KHÔNG được trừ** khi shop bị phạt (trường hợp 2 và 5)
- 💡 Lý do: Đây là tiền phạt shop, không liên quan đến discount sàn

### 2. Shipping Fee:
- ✅ **Luôn được cộng** vào số tiền shop nhận
- ✅ **Được hoàn** cho khách khi hoàn tiền đầy đủ (trường hợp 2 và 5)
- ❌ **KHÔNG được hoàn** khi hoàn tiền một phần (trường hợp 4)

### 3. PendingAmount:
- 📌 **Luôn được tạo** khi đơn hàng được tạo
- ✅ **Chuyển → Balance** khi shop nhận tiền (trường hợp 1, 3, 4)
- ❌ **Bị trừ** khi hoàn tiền cho khách (trường hợp 2, 5)

### 4. Hoa Hồng Sàn:
- 💰 **Luôn là 5%** của (productPrice - storeDiscountAmount)
- ✅ **Được cộng** trong mọi trường hợp
- ⚠️ **Đóng vai trò tiền phạt** khi shop bị phạt (trường hợp 2 và 5)

---

## ✅ Kết Luận

Ví dụ trên minh họa rõ ràng cách xử lý tiền trong các trường hợp khác nhau, đặc biệt là trường hợp có **khuyến mãi sàn (Platform Discount)**.

**Điểm quan trọng:**
- Platform Discount chỉ được trừ khi đơn thành công/shop thắng
- Platform Discount không được trừ khi shop bị phạt
- Công thức tính toán nhất quán trong mọi trường hợp

---

**Ngày tạo:** 26/12/2024  
**Trạng thái:** ✅ HOÀN THÀNH



