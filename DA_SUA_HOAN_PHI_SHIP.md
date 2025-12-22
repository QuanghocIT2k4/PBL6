# ✅ ĐÃ SỬA LOGIC: KHÁCH ĐƯỢC HOÀN CẢ PHÍ SHIP KHI HOÀN TRẢ

## 📋 VẤN ĐỀ

**Câu hỏi:** "MẸ MÀY KHÁCH HOÀN TRẢ MÀ KHÁCH PHẢI TỐN TIỀN SHIP À?"

**Vấn đề:** Logic cũ nói "phí ship người mua chịu, không được hoàn" → **SAI!**

**Giải pháp:** Khi khách hoàn trả hàng (shop sai), khách **PHẢI được hoàn CẢ phí ship**.

---

## 🔧 LOGIC MỚI

### Khi Khách Hoàn Trả Hàng (Shop Sai):

**Khách:**
- ✅ Nhận lại số tiền đã thanh toán **BAO GỒM CẢ PHÍ SHIP**
- Công thức: `productPrice - storeDiscountAmount - platformDiscountAmount + shippingFee`

**Shop:**
- Trừ `pendingAmount` = 95% × (productPrice - storeDiscountAmount)
- ⚠️ **KHÔNG trừ phí ship** (phí ship là của sàn)

**Admin:**
- Cộng hoa hồng = 5% × (productPrice - storeDiscountAmount)
- ⚠️ **TRỪ phí ship** (vì phải hoàn lại cho khách)
- Công thức: `0.05 × (productPrice - storeDiscountAmount) - shippingFee`

---

## 📊 VÍ DỤ: Đơn 10 Triệu, Ship 50k, Mã Sàn 100k

### Trường Hợp: Shop Xác Nhận Return OK

**Trước (SAI):**
```
Admin nhận: +550,000 VND (500k hoa hồng + 50k ship) ❌
Khách nhận: +9,950,000 VND (có ship nhưng admin không trừ)
```

**Sau (ĐÚNG):**
```
Admin nhận: +450,000 VND (500k hoa hồng - 50k ship vì hoàn lại khách) ✅
Khách nhận: +9,950,000 VND (BAO GỒM CẢ PHÍ SHIP) ✅
```

**Giải thích:**
- Admin nhận 500k hoa hồng (tiền phạt shop)
- Nhưng phải TRỪ 50k ship vì hoàn lại cho khách
- → Tổng: 450k

---

## ✅ CÁC FILE ĐÃ SỬA

### 1. `FE/LOGIC_XU_LY_TIEN.md`

#### Trường hợp 2: Shop xác nhận return OK
```
❌ TRƯỚC: Admin nhận = 0.05 × (productPrice - storeDiscountAmount) + shippingFee
✅ SAU:   Admin nhận = 0.05 × (productPrice - storeDiscountAmount) - shippingFee
```

#### Trường hợp 5: Khách thắng dispute
```
❌ TRƯỚC: Admin nhận = 0.05 × (productPrice - storeDiscountAmount) + shippingFee
✅ SAU:   Admin nhận = 0.05 × (productPrice - storeDiscountAmount) - shippingFee
```

### 2. `FE/PHAN_TICH_HOAN_TRA_10TRIEU_MA_SAN.md`

Đã cập nhật tất cả các ví dụ:
- Admin TRỪ phí ship khi hoàn lại khách
- Khách được hoàn CẢ phí ship

---

## 📝 CÔNG THỨC TỔNG QUÁT MỚI

### Khi Shop Nhận Tiền (Đơn thành công hoặc Shop thắng):
```
Shop nhận = 0.95 × (productPrice - storeDiscountAmount)
Admin nhận = 0.05 × (productPrice - storeDiscountAmount) + shippingFee - platformDiscountAmount
```

### Khi Shop Bị Phạt (Return OK hoặc Khách thắng):
```
Shop trừ = 0.95 × (productPrice - storeDiscountAmount)
Khách nhận = productPrice - storeDiscountAmount - platformDiscountAmount + shippingFee ✅
Admin nhận = 0.05 × (productPrice - storeDiscountAmount) - shippingFee ✅ (TRỪ vì hoàn lại khách)
```

---

## 💡 LƯU Ý QUAN TRỌNG

1. **Phí ship là của SÀN** (sàn quản lý đội ngũ shipper)
2. **Khi đơn thành công:** Admin nhận phí ship vào revenue
3. **Khi khách hoàn trả:** Admin phải TRỪ phí ship (hoàn lại cho khách)
4. **Khách luôn được hoàn CẢ phí ship** khi shop sai

---

## ⚠️ CẦN IMPLEMENT BACKEND

Backend cần sửa logic khi:
1. Shop xác nhận return OK
2. Admin giải quyết dispute - Khách thắng

**Code cần sửa:**
```javascript
// Khi hoàn tiền cho khách
const platformCommission = 0.05 * (productPrice - storeDiscountAmount);
const adminRevenue = platformCommission - shippingFee; // TRỪ ship vì hoàn lại khách

// Hoàn tiền cho khách (BAO GỒM CẢ PHÍ SHIP)
const refundToBuyer = productPrice - storeDiscountAmount - platformDiscountAmount + shippingFee;
```

---

**Ngày sửa:** 26/12/2024  
**Trạng thái:** ✅ ĐÃ SỬA LOGIC - KHÁCH ĐƯỢC HOÀN CẢ PHÍ SHIP


