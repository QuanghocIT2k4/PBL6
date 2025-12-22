# 💰 Phân Tích Chi Tiết: Hoàn Trả Đơn 10 Triệu Có Mã Sàn 100K

## 📋 Thông Tin Đơn Hàng

### Giả Định:
- **Product Price (Giá gốc sản phẩm):** 10,000,000 VND
- **Store Discount (Mã giảm giá của shop):** 0 VND (không có mã shop)
- **Platform Discount (Mã giảm giá của sàn):** 100,000 VND ⭐
- **Shipping Fee (Phí ship):** 50,000 VND (giả định)

### Tính Toán Ban Đầu:

```
Tổng khách thanh toán = Product Price - Store Discount - Platform Discount + Shipping Fee
                     = 10,000,000 - 0 - 100,000 + 50,000
                     = 9,950,000 VND
```

### Tính Toán Cho Shop và Admin:

```
Base Amount (sau giảm giá shop) = Product Price - Store Discount
                                = 10,000,000 - 0
                                = 10,000,000 VND

Shop nhận = 95% × Base Amount ❌ KHÔNG CỘNG Shipping Fee
         = 95% × 10,000,000
         = 9,500,000 VND ✅

Hoa hồng sàn = 5% × Base Amount + Shipping Fee ✅
            = 5% × 10,000,000 + 50,000
            = 500,000 + 50,000
            = 550,000 VND ✅

Platform Discount Loss = 100,000 VND (Admin phải chịu)
```

### Trạng Thái Ví Ban Đầu:

**Shop Wallet:**
- Balance: 0 VND
- **PendingAmount: 9,500,000 VND** (tạm giữ khi tạo đơn) ⚠️ ĐÃ SỬA: KHÔNG CÓ SHIP

**Admin Revenue:**
- Revenue: 0 VND

**Khách Hàng:**
- Đã thanh toán: **9,950,000 VND**

---

## 🔄 CÁC TRƯỜNG HỢP HOÀN TRẢ

### Trường Hợp 1: Shop Xác Nhận Hàng Trả Về OK (Hoàn Tiền Cho Khách)

#### Mô Tả:
Shop nhận lại hàng trả về và xác nhận hàng không có vấn đề, đồng ý hoàn tiền.

#### Xử Lý Tiền:

**Shop:**
```
Trước:
  Balance: 0 VND
  PendingAmount: 9,550,000 VND

Sau khi trừ pendingAmount:
  Balance: 0 VND (không đổi)
  PendingAmount: 0 VND ✅
  
Trừ: -9,550,000 VND từ PendingAmount ✅
```

**Admin:**
```
Trước:
  Revenue: 0 VND

Sau khi cộng hoa hồng (tiền phạt):
  Revenue: 0 + 500,000 = 500,000 VND ✅
  
Chi tiết:
  + Hoa hồng (tiền phạt shop): +500,000 VND
  (KHÔNG trừ platform discount vì đây là tiền phạt shop)
```

**Khách Hàng:**
```
Trước:
  Balance: 0 VND (giả định)
  Đã thanh toán: 9,950,000 VND

Sau khi hoàn tiền:
  Balance: 0 + 9,950,000 = 9,950,000 VND ✅
  
Hoàn tiền: +9,950,000 VND (tổng số đã thanh toán)
```

#### ✅ Kết Quả:
- **Shop trừ:** 9,500,000 VND từ PendingAmount (KHÔNG CÓ SHIP) ✅
- **Admin nhận:** +450,000 VND (500k hoa hồng - 50k ship vì phải hoàn lại khách) ✅
- **Khách nhận:** +9,950,000 VND (hoàn tiền đầy đủ BAO GỒM CẢ PHÍ SHIP) ✅
- **Platform Discount:** KHÔNG được trừ lại (admin đã chịu lỗ 100k từ đầu)

#### 💡 Lưu Ý Quan Trọng:
- **Platform Discount (100k) KHÔNG được hoàn lại cho admin** vì đây là tiền phạt shop
- Admin nhận 450k (500k hoa hồng - 50k ship vì hoàn lại khách) nhưng đã mất 100k discount từ đầu → **Tổng lợi nhuận admin: 350k** ✅
- **Khách được hoàn CẢ phí ship** vì shop sai phải chịu ✅
- **Phí ship là của SÀN**, nhưng khi hoàn lại khách thì admin phải TRỪ phí ship ✅

---

### Trường Hợp 2: Admin Giải Quyết - Shop Thắng (Hoàn Tiền Cho Shop)

#### Mô Tả:
Admin giải quyết khiếu nại và quyết định shop thắng (hàng không có vấn đề).

#### Xử Lý Tiền:

**Shop:**
```
Trước:
  Balance: 0 VND
  PendingAmount: 9,500,000 VND ⚠️ ĐÃ SỬA: KHÔNG CÓ SHIP

Sau khi chuyển:
  Balance: 0 + 9,500,000 = 9,500,000 VND ✅
  PendingAmount: 0 VND ✅
```

**Admin:**
```
Trước:
  Revenue: 0 VND

Sau khi cộng hoa hồng + phí ship và trừ discount:
  Revenue: 0 + 500,000 + 50,000 - 100,000 = 450,000 VND ✅
  
Chi tiết:
  + Hoa hồng: +500,000 VND
  + Phí ship (của sàn): +50,000 VND ✅
  - Platform Discount Loss: -100,000 VND
  = Tổng: +450,000 VND ✅
```

**Khách Hàng:**
```
Không thay đổi (shop thắng, không hoàn tiền)
Đã thanh toán: 9,950,000 VND (không được hoàn)
```

#### ✅ Kết Quả:
- **Shop nhận:** 9,500,000 VND (chuyển từ PendingAmount → Balance, KHÔNG CÓ SHIP) ✅
- **Admin nhận:** +450,000 VND (500k hoa hồng + 50k ship - 100k discount) ✅
- **Khách:** Không được hoàn tiền

---

### Trường Hợp 3: Admin Giải Quyết - Khách Thắng (Hoàn Tiền Cho Khách)

#### Mô Tả:
Admin giải quyết khiếu nại và quyết định khách thắng (hàng có vấn đề).

#### Xử Lý Tiền:

**Shop:**
```
Trước:
  Balance: 0 VND
  PendingAmount: 9,550,000 VND

Sau khi trừ pendingAmount:
  Balance: 0 VND (không đổi)
  PendingAmount: 0 VND ✅
  
Trừ: -9,550,000 VND từ PendingAmount ✅
```

**Admin:**
```
Trước:
  Revenue: 0 VND

Sau khi cộng hoa hồng (tiền phạt):
  Revenue: 0 + 500,000 = 500,000 VND ✅
  
Chi tiết:
  + Hoa hồng (tiền phạt shop): +500,000 VND
  (KHÔNG trừ platform discount vì đây là tiền phạt shop)
```

**Khách Hàng:**
```
Trước:
  Balance: 0 VND
  Đã thanh toán: 9,950,000 VND

Sau khi hoàn tiền đầy đủ:
  Balance: 0 + 9,950,000 = 9,950,000 VND ✅
  
Hoàn tiền: +9,950,000 VND (bao gồm cả shippingFee)
```

#### ✅ Kết Quả:
- **Shop trừ:** 9,550,000 VND từ PendingAmount
- **Admin nhận:** +500,000 VND (hoa hồng - tiền phạt)
- **Khách nhận:** +9,950,000 VND (hoàn tiền đầy đủ bao gồm shippingFee)

#### 💡 Lưu Ý Quan Trọng:
- **Platform Discount (100k) KHÔNG được hoàn lại cho admin** vì đây là tiền phạt shop
- Admin vẫn nhận 500k hoa hồng nhưng đã mất 100k discount từ đầu → **Tổng lợi nhuận admin: 400k**
- Khách được hoàn đầy đủ 9,950,000 VND (bao gồm cả shippingFee)

---

### Trường Hợp 4: Admin Giải Quyết - Hoàn Tiền Một Phần (Ví dụ: 2,000,000 VND)

#### Mô Tả:
Admin giải quyết khiếu nại và quyết định hoàn tiền một phần **2,000,000 VND** cho khách.

#### Tính Toán Validation:

```
Product Price: 10,000,000 VND
Store Discount: 0 VND
Platform Commission: 500,000 VND

Max Refund Amount = Product Price - Store Discount - Platform Commission
                 = 10,000,000 - 0 - 500,000
                 = 9,500,000 VND

Partial Refund Amount: 2,000,000 VND
Validation: 2,000,000 < 9,500,000 ✅ HỢP LỆ
```

#### Xử Lý Tiền:

**Khách Hàng:**
```
Trước:
  Balance: 0 VND

Sau khi hoàn tiền một phần:
  Balance: 0 + 2,000,000 = 2,000,000 VND ✅
  
Hoàn tiền: +2,000,000 VND
```

**Shop:**
```
Trước:
  Balance: 0 VND
  PendingAmount: 9,500,000 VND ⚠️ ĐÃ SỬA: KHÔNG CÓ SHIP

Sau khi xử lý:
  Trừ hoàn tiền: -2,000,000 VND từ PendingAmount
  Chuyển phần còn lại: +7,500,000 VND vào Balance ✅
  
  Balance: 0 + 7,500,000 = 7,500,000 VND ✅
  PendingAmount: 0 VND ✅
  
Chi tiết:
  - Trừ hoàn tiền: -2,000,000 VND
  - Chuyển vào Balance: +7,500,000 VND ✅
  = Tổng: +5,500,000 VND (so với ban đầu) ✅
```

**Admin:**
```
Trước:
  Revenue: 0 VND

Sau khi cộng hoa hồng + phí ship và trừ discount:
  Revenue: 0 + 500,000 + 50,000 - 100,000 = 450,000 VND ✅
  
Chi tiết:
  + Hoa hồng: +500,000 VND
  + Phí ship (của sàn): +50,000 VND ✅
  - Platform Discount Loss: -100,000 VND
  = Tổng: +450,000 VND ✅
```

#### ✅ Kết Quả:
- **Shop nhận:** 7,500,000 VND (9,500,000 - 2,000,000, KHÔNG CÓ SHIP) ✅
- **Admin nhận:** +450,000 VND (500k hoa hồng + 50k ship - 100k discount) ✅
- **Khách nhận:** +2,000,000 VND (hoàn tiền một phần)
- **Shipping Fee:** KHÔNG được hoàn (người mua chịu, nhưng phí ship là của sàn) ✅

---

## 📊 BẢNG SO SÁNH TẤT CẢ TRƯỜNG HỢP

| Trường Hợp | Shop Nhận/Trừ | Admin Nhận/Trừ | Khách Nhận | Platform Discount | Ghi Chú |
|------------|---------------|----------------|------------|-------------------|---------|
| **1. Shop xác nhận return OK** | -9,500,000 ✅ | +450,000 ✅ | +9,950,000 ✅ | ❌ Không trừ lại | Tiền phạt - trừ ship vì hoàn khách |
| **2. Shop thắng dispute** | +9,500,000 ✅ | +450,000 ✅ | 0 | ✅ Trừ 100k | Đơn thành công + ship |
| **3. Khách thắng dispute** | -9,500,000 ✅ | +450,000 ✅ | +9,950,000 ✅ | ❌ Không trừ lại | Tiền phạt - trừ ship vì hoàn khách |
| **4. Hoàn tiền một phần (2tr)** | +7,500,000 ✅ | +450,000 ✅ | +2,000,000 | ✅ Trừ 100k | Phần còn lại shop nhận |

---

## 🔍 PHÂN TÍCH CHI TIẾT VỀ PLATFORM DISCOUNT

### ⚠️ QUAN TRỌNG: Platform Discount chỉ được trừ khi:

1. ✅ **Đơn hàng thành công** (Shop nhận tiền)
2. ✅ **Shop thắng dispute** (Shop nhận tiền)
3. ✅ **Hoàn tiền một phần** (Shop vẫn nhận một phần tiền)

### ❌ Platform Discount KHÔNG được trừ khi:

1. ❌ **Shop xác nhận return OK** (Tiền phạt shop)
2. ❌ **Khách thắng dispute** (Tiền phạt shop)

### 💡 Lý Do:

- **Khi shop bị phạt:** Platform discount là lỗ của admin từ đầu, không liên quan đến việc shop bị phạt
- **Khi shop nhận tiền:** Platform discount là chi phí admin phải chịu để thu hút khách hàng, nên được trừ vào revenue

---

## 💰 TỔNG KẾT TÀI CHÍNH CHO ADMIN

### Trường Hợp Shop Bị Phạt (Return OK hoặc Khách Thắng):
```
Hoa hồng nhận: +500,000 VND
Phí ship phải hoàn lại khách: -50,000 VND ✅ (TRỪ vì hoàn lại)
Platform Discount đã mất: -100,000 VND (từ khi tạo đơn)
─────────────────────────────────
Tổng lợi nhuận: +350,000 VND ✅
```

### Trường Hợp Shop Nhận Tiền (Thành công hoặc Shop Thắng):
```
Hoa hồng nhận: +500,000 VND
Phí ship nhận: +50,000 VND ✅
Platform Discount Loss: -100,000 VND
─────────────────────────────────
Tổng lợi nhuận: +450,000 VND ✅
```

### Trường Hợp Hoàn Tiền Một Phần:
```
Hoa hồng nhận: +500,000 VND
Phí ship nhận: +50,000 VND ✅
Platform Discount Loss: -100,000 VND
─────────────────────────────────
Tổng lợi nhuận: +450,000 VND ✅
```

**✅ KẾT LUẬN:** 
- Khi shop nhận tiền: Admin có lợi nhuận **+450,000 VND** (500k hoa hồng + 50k ship - 100k discount) ✅
- Khi shop bị phạt: Admin có lợi nhuận **+350,000 VND** (500k hoa hồng - 50k ship vì hoàn lại khách - 100k discount) ✅

---

## 📝 CÔNG THỨC TỔNG QUÁT

### Khi Shop Nhận Tiền:
```
Admin Revenue = Platform Commission + Shipping Fee - Platform Discount Loss
             = 5% × (Product Price - Store Discount) + Shipping Fee - Platform Discount Amount
             ✅ Phí ship là của SÀN
```

### Khi Shop Bị Phạt:
```
Admin Revenue = Platform Commission - Shipping Fee (phải hoàn lại khách)
             = 5% × (Product Price - Store Discount) - Shipping Fee
             ✅ Phí ship phải hoàn lại cho khách → TRỪ khỏi revenue
             
Lưu ý: Platform Discount KHÔNG được trừ lại
```

---

**Ngày phân tích:** 26/12/2024  
**Cập nhật:** 26/12/2024 - Đã sửa logic phí ship (phí ship là của SÀN)  
**Trạng thái:** ✅ HOÀN THÀNH - ĐÃ SỬA THEO LOGIC MỚI

