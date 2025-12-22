# 🚚 Phân Tích Logic Phí Ship: Shop Nhận Hay Sàn Nhận?

## ❓ VẤN ĐỀ ĐƯỢC ĐẶT RA

**Câu hỏi:** "TIỀN SHIP LÀ SÀN NHẬN SAO SHOP LẠI NHẬN?"

---

## 🔍 KIỂM TRA LOGIC HIỆN TẠI

### Công Thức Hiện Tại:

```
Shop nhận = 95% × (productPrice - storeDiscountAmount) + shippingFee
Admin nhận = 5% × (productPrice - storeDiscountAmount) - platformDiscountAmount
```

**⚠️ VẤN ĐỀ:** Phí ship được cộng vào số tiền shop nhận, nhưng không có trong revenue của admin.

---

## 💡 PHÂN TÍCH 2 TRƯỜNG HỢP CÓ THỂ

### Trường Hợp 1: Phí Ship Là Của Shop (Logic Hiện Tại)

**Giả định:**
- Shop tự tính phí ship và thu từ khách hàng
- Shop giữ lại toàn bộ phí ship
- Sàn không liên quan đến phí ship

**Công thức:**
```
Shop nhận = 95% × (productPrice - storeDiscountAmount) + shippingFee ✅
Admin nhận = 5% × (productPrice - storeDiscountAmount) - platformDiscountAmount
```

**Ví dụ:**
- Product Price: 10,000,000 VND
- Shipping Fee: 50,000 VND
- Shop nhận: 95% × 10,000,000 + 50,000 = 9,550,000 VND ✅
- Admin nhận: 5% × 10,000,000 = 500,000 VND

**✅ Ưu điểm:**
- Shop tự quản lý phí ship
- Sàn không phải xử lý phí ship

**❌ Nhược điểm:**
- Nếu sàn tính phí ship thì shop không nên nhận

---

### Trường Hợp 2: Phí Ship Là Của Sàn (Logic Đề Xuất)

**Giả định:**
- Sàn tính phí ship và thu từ khách hàng
- Sàn giữ lại toàn bộ phí ship
- Shop không nhận phí ship

**Công thức ĐỀ XUẤT:**
```
Shop nhận = 95% × (productPrice - storeDiscountAmount) ❌ KHÔNG CỘNG shippingFee
Admin nhận = 5% × (productPrice - storeDiscountAmount) + shippingFee - platformDiscountAmount
```

**Ví dụ:**
- Product Price: 10,000,000 VND
- Shipping Fee: 50,000 VND
- Shop nhận: 95% × 10,000,000 = 9,500,000 VND ✅
- Admin nhận: 5% × 10,000,000 + 50,000 = 550,000 VND ✅

**✅ Ưu điểm:**
- Sàn kiểm soát phí ship
- Phù hợp nếu sàn là đơn vị tính và thu phí ship

**❌ Nhược điểm:**
- Cần sửa lại toàn bộ logic hiện tại

---

## 📊 SO SÁNH 2 TRƯỜNG HỢP

### Ví Dụ: Đơn 10 Triệu, Phí Ship 50k

| Trường Hợp | Shop Nhận | Admin Nhận | Tổng |
|------------|-----------|------------|------|
| **Logic Hiện Tại** (Shop nhận ship) | 9,550,000 | 500,000 | 10,050,000 |
| **Logic Đề Xuất** (Sàn nhận ship) | 9,500,000 | 550,000 | 10,050,000 |

**Tổng tiền:** Cả 2 trường hợp đều = 10,050,000 VND (10tr + 50k ship)

**Khác biệt:** Chỉ là cách phân chia giữa shop và sàn.

---

## 🔍 KIỂM TRA CODE HIỆN TẠI

### File: `buyer-BE/src/services/walletService.js`

```javascript
const calculateStoreReceiveAmount = (order) => {
  const productPrice = order.productPrice || order.totalPrice;
  const storeDiscountAmount = order.storeDiscountAmount || 0;
  const shippingFee = order.shippingFee || 0;

  // 95% của (productPrice - storeDiscountAmount) + shippingFee
  const storeReceiveAmount = 0.95 * (productPrice - storeDiscountAmount) + shippingFee;

  return Math.round(storeReceiveAmount);
};
```

**✅ Code hiện tại:** Shop nhận phí ship

---

## 💡 ĐỀ XUẤT SỬA LẠI (Nếu Phí Ship Là Của Sàn)

### 1. Sửa `calculateStoreReceiveAmount()`:

```javascript
const calculateStoreReceiveAmount = (order) => {
  const productPrice = order.productPrice || order.totalPrice;
  const storeDiscountAmount = order.storeDiscountAmount || 0;
  // ❌ BỎ shippingFee khỏi công thức shop nhận
  // const shippingFee = order.shippingFee || 0;

  // 95% của (productPrice - storeDiscountAmount) - KHÔNG CỘNG shippingFee
  const storeReceiveAmount = 0.95 * (productPrice - storeDiscountAmount);

  return Math.round(storeReceiveAmount);
};
```

### 2. Sửa `calculatePlatformCommission()`:

```javascript
const calculatePlatformCommission = (order) => {
  const productPrice = order.productPrice || order.totalPrice;
  const storeDiscountAmount = order.storeDiscountAmount || 0;
  const shippingFee = order.shippingFee || 0;

  // 5% của (productPrice - storeDiscountAmount) + shippingFee
  const commission = 0.05 * (productPrice - storeDiscountAmount) + shippingFee;

  return Math.round(commission);
};
```

### 3. Cập Nhật Tất Cả Công Thức:

**Trường hợp đơn hàng thành công:**
```
Shop nhận = 0.95 × (productPrice - storeDiscountAmount) ❌ KHÔNG CỘNG shippingFee
Admin nhận = 0.05 × (productPrice - storeDiscountAmount) + shippingFee - platformDiscountAmount
```

**Trường hợp shop xác nhận return OK:**
```
Shop trừ = 0.95 × (productPrice - storeDiscountAmount) ❌ KHÔNG CỘNG shippingFee
Admin nhận = 0.05 × (productPrice - storeDiscountAmount) + shippingFee (tiền phạt)
```

**Trường hợp shop thắng dispute:**
```
Shop nhận = 0.95 × (productPrice - storeDiscountAmount) ❌ KHÔNG CỘNG shippingFee
Admin nhận = 0.05 × (productPrice - storeDiscountAmount) + shippingFee - platformDiscountAmount
```

**Trường hợp khách thắng dispute:**
```
Shop trừ = 0.95 × (productPrice - storeDiscountAmount) ❌ KHÔNG CỘNG shippingFee
Khách nhận = productPrice - storeDiscountAmount - platformDiscountAmount + shippingFee ✅
Admin nhận = 0.05 × (productPrice - storeDiscountAmount) + shippingFee (tiền phạt)
```

**Trường hợp hoàn tiền một phần:**
```
Shop nhận = [0.95 × (productPrice - storeDiscountAmount)] - partialRefundAmount ❌ KHÔNG CỘNG shippingFee
Admin nhận = 0.05 × (productPrice - storeDiscountAmount) + shippingFee - platformDiscountAmount
```

---

## 📝 VÍ DỤ CỤ THỂ VỚI LOGIC MỚI

### Đơn Hàng: 10 Triệu, Phí Ship 50k, Mã Sàn 100k

**Tính Toán:**

```
Base Amount = 10,000,000 - 0 = 10,000,000 VND

Shop nhận = 95% × 10,000,000 = 9,500,000 VND ✅
Admin nhận = 5% × 10,000,000 + 50,000 - 100,000 = 450,000 VND ✅
```

**Khi đơn thành công:**
- Shop: +9,500,000 VND
- Admin: +450,000 VND (500k hoa hồng + 50k ship - 100k discount)
- Khách đã thanh toán: 9,950,000 VND

**Khi shop xác nhận return OK:**
- Shop: -9,500,000 VND (trừ từ PendingAmount)
- Admin: +550,000 VND (500k hoa hồng + 50k ship - tiền phạt)
- Khách: +9,950,000 VND (hoàn đầy đủ)

---

## ✅ KẾT LUẬN VÀ ĐỀ XUẤT

### Câu Hỏi Cần Làm Rõ:

1. **Phí ship do ai tính?**
   - Shop tự tính và thu từ khách?
   - Hay sàn tính và thu từ khách?

2. **Phí ship thuộc về ai?**
   - Shop giữ lại?
   - Hay sàn giữ lại?

### Đề Xuất:

**Nếu phí ship là của sàn:**
- ✅ Sửa lại công thức: Shop KHÔNG nhận shippingFee
- ✅ Cộng shippingFee vào revenue của admin
- ✅ Cập nhật tất cả các trường hợp xử lý tiền

**Nếu phí ship là của shop:**
- ✅ Giữ nguyên logic hiện tại
- ✅ Shop nhận shippingFee như công thức hiện tại

---

## 🔧 CẦN XÁC NHẬN

**Vui lòng xác nhận:**
1. Phí ship do ai tính? (Shop hay Sàn?)
2. Phí ship thuộc về ai? (Shop hay Sàn?)
3. Có cần sửa lại logic không?

---

**Ngày phân tích:** 26/12/2024  
**Trạng thái:** ⚠️ CẦN XÁC NHẬN LOGIC NGHIỆP VỤ


