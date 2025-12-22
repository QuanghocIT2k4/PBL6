# 💰 Logic Xử Lý Tiền - Cập Nhật Mới (23/12/2025)

## 📋 Tổng Quan
File này mô tả logic xử lý tiền **MỚI** cho các trường hợp đơn hàng, đã được cập nhật theo yêu cầu mới.

---

## ⚠️ THAY ĐỔI QUAN TRỌNG

### 1. Shop Nhận Tiền Khi Đơn Thành Công
**CŨ:** Shop nhận = 95% × (số tiền gốc sản phẩm - mã giảm giá của shop) ❌ KHÔNG CỘNG shippingFee

**MỚI:** Shop nhận = **95% × (số tiền gốc sản phẩm - mã giảm giá của shop) + phí ship** ✅

### 2. Hoàn Tiền 1 Phần
**CŨ:** Validation: `partialRefundAmount < productPrice - storeDiscountAmount - platformCommission`

**MỚI:** 
- Validation: `partialRefundAmount < productPrice - storeDiscountAmount - platformCommission`
- **Phí ship người mua chịu** (không được hoàn lại khi hoàn tiền 1 phần)

---

## 1. ✅ Trường hợp đơn hàng thành công (Shop nhận tiền)

### Mô tả:
Khi đơn hàng được giao thành công và khách hàng xác nhận nhận hàng.

### Xử lý tiền:

**Shop:**
- Chuyển tiền từ `pendingAmount` → `Balance`
- Số tiền = **95% × (số tiền gốc sản phẩm - mã giảm giá của shop) + phí ship** ✅

**Admin (Sàn):**
- Cộng **5% tiền hoa hồng**. Trừ số tiền giảm của mã giảm giá của sàn nếu có.

### Công thức:
```
Shop nhận = 0.95 × (productPrice - storeDiscountAmount) + shippingFee ✅
Admin nhận = 0.05 × (productPrice - storeDiscountAmount) - platformDiscountAmount (nếu có)
```

---

## 2. 🔄 Trường hợp shop nhận hàng trả về và xác nhận hàng không có vấn đề (Hoàn tiền cho khách)

### Mô tả:
Shop nhận lại hàng trả về từ khách và xác nhận hàng không có vấn đề gì, đồng ý hoàn tiền.

### Xử lý tiền:

**Shop:**
- Trừ số tiền chờ (`pendingAmount`) ở ví
- Số tiền trừ = **95% × (số tiền gốc sản phẩm - mã giảm giá của shop) + phí ship** (ban đầu)

**Khách:**
- Nhận lại số tiền đã thanh toán **BAO GỒM CẢ PHÍ SHIP** ✅

**Admin (Sàn):**
- Cảnh báo shop: 1 lần (Cảnh báo quá 5 lần trong 1 tháng là ban)
- **Chịu phí ship trả hàng** (đơn giản hóa, lâu lâu mới có) ✅

### Công thức:
```
Shop trừ = 0.95 × (productPrice - storeDiscountAmount) + shippingFee
Khách nhận = productPrice - storeDiscountAmount - platformDiscountAmount (nếu có) + shippingFee ✅
Admin: Cảnh báo shop 1 lần
```

---

## 3. ✅ Trường hợp admin giải quyết hàng trả về và shop thắng (Hoàn tiền cho shop)

### Mô tả:
Admin giải quyết khiếu nại và quyết định shop thắng (hàng không có vấn đề).

### Xử lý tiền:

**Shop:**
- Chuyển tiền từ `pendingAmount` → `Balance`
- Số tiền = **95% × (số tiền gốc sản phẩm - mã giảm giá của shop) + phí ship** ✅

**Admin (Sàn):**
- Cộng **5% tiền hoa hồng**. Trừ số tiền giảm của mã giảm giá của sàn nếu có.

### Công thức:
```
Shop nhận = 0.95 × (productPrice - storeDiscountAmount) + shippingFee ✅
Admin nhận = 0.05 × (productPrice - storeDiscountAmount) - platformDiscountAmount (nếu có)
```

---

## 4. ⚖️ Trường hợp admin giải quyết hàng trả về và hoàn tiền một phần

### Mô tả:
Admin giải quyết khiếu nại và quyết định hoàn tiền một phần cho khách.

### Xử lý tiền:

**Khách:**
- Nhận phần số tiền mà admin đã đề ra (`partialRefundAmount`)
- **Phí ship người mua chịu** (không được hoàn lại) ⚠️

**Shop:**
- Trừ số tiền hoàn cho khách từ `pendingAmount` của ví shop
- Chuyển tiền từ `pendingAmount` → `Balance`
- Số tiền chuyển = **[95% × (số tiền gốc sản phẩm - mã giảm giá của shop) + phí ship] - Số tiền hoàn trả một phần cho khách**

**Admin (Sàn):**
- Cộng **5% tiền hoa hồng**. Trừ số tiền giảm của mã giảm giá của sàn nếu có.

### Công thức:
```
Khách nhận = partialRefundAmount (KHÔNG BAO GỒM phí ship) ⚠️
Shop nhận = [0.95 × (productPrice - storeDiscountAmount) + shippingFee] - partialRefundAmount ✅
Admin nhận = 0.05 × (productPrice - storeDiscountAmount) - platformDiscountAmount (nếu có)
```

### ⚠️ Validation:
- Số tiền hoàn một phần phải **NHỎ HƠN** tổng tiền gốc sản phẩm - giảm giá của shop - hoa hồng của sàn
- Công thức: `partialRefundAmount < productPrice - storeDiscountAmount - platformCommission`
- **Phí ship người mua chịu** (không được hoàn lại khi hoàn tiền 1 phần) ⚠️

---

## 5. ❌ Trường hợp admin giải quyết hàng trả về và khách thắng (Hoàn tiền cho khách)

### Mô tả:
Admin giải quyết khiếu nại và quyết định khách thắng (hàng có vấn đề).

### Xử lý tiền:

**Shop:**
- Trừ số tiền `pendingAmount` của ví shop
- Số tiền trừ = **95% × (số tiền gốc sản phẩm - mã giảm giá của shop) + phí ship**

**Khách:**
- Nhận số tiền gốc ban đầu khách thanh toán, **BAO GỒM CẢ PHÍ SHIP** ✅

**Admin (Sàn):**
- Cảnh báo shop 1 lần (Cảnh báo quá 5 lần trong 1 tháng là ban)
- **Chịu phí ship trả hàng** (đơn giản hóa, lâu lâu mới có) ✅

### Công thức:
```
Shop trừ = 0.95 × (productPrice - storeDiscountAmount) + shippingFee
Khách nhận = productPrice - storeDiscountAmount - platformDiscountAmount (nếu có) + shippingFee ✅
Admin: Cảnh báo shop 1 lần
```

---

## 📝 Lưu Ý Quan Trọng

### 1. Phí Ship:
- ✅ **Shop nhận phí ship** khi đơn hàng thành công hoặc shop thắng khiếu nại
- ✅ **Shop trừ phí ship ban đầu** khi hoàn tiền cho khách (shop xác nhận return OK hoặc khách thắng)
- ✅ **Admin chịu phí ship trả hàng** (đơn giản hóa, lâu lâu mới có, nếu shop trả hàng quá 5 lần/tháng → Shop bị khóa)
- ⚠️ **Khi hoàn tiền 1 phần, phí ship người mua chịu** (không được hoàn lại)

### 2. Hoa Hồng Sàn:
- Luôn là **5%** của (số tiền gốc sản phẩm - mã giảm giá của shop)
- Công thức: `platformCommission = 0.05 × (productPrice - storeDiscountAmount)`
- ⚠️ **Phí ship không tính vào hoa hồng** (phí ship shop nhận/trừ trực tiếp)

### 3. Mã Giảm Giá:
- **Mã giảm giá của shop**: Trừ vào số tiền shop nhận
- **Mã giảm giá của sàn**: Trừ vào revenue của admin (tạo `PLATFORM_DISCOUNT_LOSS`)

### 4. Pending Amount:
- Số tiền tạm giữ trong ví shop khi đơn hàng được tạo
- Chuyển sang `Balance` khi đơn thành công hoặc shop thắng
- Trừ khỏi `pendingAmount` khi hoàn tiền cho khách

### 5. Cảnh Báo Shop:
- Khi shop nhận hàng trả về và xác nhận OK → Cảnh báo 1 lần
- Khi khách thắng khiếu nại → Cảnh báo 1 lần
- **Cảnh báo quá 5 lần trong 1 tháng → Ban shop tự động**

### 6. Validation Hoàn Tiền 1 Phần:
- `partialRefundAmount < productPrice - storeDiscountAmount - platformCommission`
- Phí ship người mua chịu (không được hoàn lại)

---

## 🔍 Kiểm Tra Lại

Cần kiểm tra lại các trường hợp sau:
- [x] Số tiền vào ví shop khi đơn hàng thành công (bao gồm phí ship)
- [x] Phí hoa hồng của sàn khi đơn hàng thành công
- [x] Số tiền vào ví shop khi shop thắng khiếu nại (bao gồm phí ship)
- [x] Số tiền trừ khỏi ví shop khi khách thắng khiếu nại (bao gồm phí ship)
- [x] Số tiền hoàn một phần cho khách (không bao gồm phí ship)
- [x] Số tiền shop nhận khi hoàn tiền một phần (trừ đi số tiền hoàn)
- [x] Phí hoa hồng của sàn trong các trường hợp khác nhau
- [x] Cảnh báo shop khi hoàn tiền cho khách

---

## 📌 API Endpoints Cần Kiểm Tra

1. **Tạo đơn hàng**: Tính toán và tạo `pendingAmount`
2. **Đơn hàng thành công**: Chuyển `pendingAmount` → `Balance` (bao gồm phí ship), tạo revenue cho admin
3. **Hoàn tiền**: Xử lý theo các trường hợp trên (bao gồm phí ship)
4. **Hoàn tiền một phần**: Validate và xử lý theo công thức (phí ship người mua chịu)
5. **Giải quyết khiếu nại**: Xử lý tiền theo quyết định của admin (bao gồm phí ship)
6. **Cảnh báo shop**: Tăng `returnWarningCount`, cập nhật `lastWarningMonth`
7. **Ban shop**: Khi `returnWarningCount >= 5` trong cùng tháng

---

**Ngày tạo:** 22/12/2025  
**Cập nhật:** 23/12/2025

