# 💰 Logic Xử Lý Tiền - Backend Reference

## 📋 Tổng Quan
File này mô tả logic xử lý tiền cho các trường hợp đơn hàng, để backend implement đúng nghiệp vụ.

---

## 1. ✅ Trường hợp đơn hàng thành công (Shop nhận tiền)

### Mô tả:
Khi đơn hàng được giao thành công và khách hàng xác nhận nhận hàng.

### Xử lý tiền:

**Shop:**
- Chuyển tiền từ `pendingAmount` → `Balance`
- Số tiền = **95% × (số tiền gốc sản phẩm - mã giảm giá của shop)**
- ⚠️ **KHÔNG nhận phí ship** (phí ship là của sàn)

**Admin (Sàn):**
- Cộng **5% tiền hoa hồng + phí ship** vào revenue
- Trừ **số tiền giảm của mã giảm giá của sàn** nếu có (tạo `PLATFORM_DISCOUNT_LOSS`)

### Công thức:
```
Shop nhận = 0.95 × (productPrice - storeDiscountAmount) ❌ KHÔNG CỘNG shippingFee
Admin nhận = 0.05 × (productPrice - storeDiscountAmount) + shippingFee - platformDiscountAmount (nếu có)
```

---

## 2. 🔄 Trường hợp shop nhận hàng trả về và xác nhận hàng không có vấn đề (Hoàn tiền cho khách)

### Mô tả:
Shop nhận lại hàng trả về từ khách và xác nhận hàng không có vấn đề gì, đồng ý hoàn tiền.

### Xử lý tiền:

**Shop:**
- Trừ số tiền chờ (`pendingAmount`) ở ví
- Số tiền trừ = **95% × (số tiền gốc sản phẩm - mã giảm giá của shop)**
- ⚠️ **KHÔNG trừ phí ship** (phí ship là của sàn)

**Admin (Sàn):**
- Cộng **5% tiền hoa hồng** (Đóng vai trò là tiền phạt của shop vì giao hàng sai)
- ⚠️ **TRỪ phí ship** (vì phải hoàn lại phí ship cho khách)

**Khách:**
- Nhận lại số tiền đã thanh toán **BAO GỒM CẢ PHÍ SHIP** ✅

### Công thức:
```
Shop trừ = 0.95 × (productPrice - storeDiscountAmount) ❌ KHÔNG CỘNG shippingFee
Khách nhận = productPrice - storeDiscountAmount - platformDiscountAmount (nếu có) + shippingFee ✅
Admin nhận = 0.05 × (productPrice - storeDiscountAmount) - shippingFee (tiền phạt - trừ ship vì hoàn lại khách)
```

---

## 3. ✅ Trường hợp admin giải quyết hàng trả về và shop thắng (Hoàn tiền cho shop)

### Mô tả:
Admin giải quyết khiếu nại và quyết định shop thắng (hàng không có vấn đề).

### Xử lý tiền:

**Shop:**
- Chuyển tiền từ `pendingAmount` → `Balance`
- Số tiền = **95% × (số tiền gốc sản phẩm - mã giảm giá của shop)**
- ⚠️ **KHÔNG nhận phí ship** (phí ship là của sàn)

**Admin (Sàn):**
- Cộng **5% tiền hoa hồng + phí ship**
- Trừ **số tiền giảm của mã giảm giá của sàn** nếu có

### Công thức:
```
Shop nhận = 0.95 × (productPrice - storeDiscountAmount) ❌ KHÔNG CỘNG shippingFee
Admin nhận = 0.05 × (productPrice - storeDiscountAmount) + shippingFee - platformDiscountAmount (nếu có)
```

---

## 4. ⚖️ Trường hợp admin giải quyết hàng trả về và hoàn tiền một phần

### Mô tả:
Admin giải quyết khiếu nại và quyết định hoàn tiền một phần cho khách.

### Xử lý tiền:

**Khách:**
- Nhận phần số tiền mà admin đã đề ra (`partialRefundAmount`)

**Shop:**
- Trừ số tiền hoàn cho khách từ `pendingAmount` của ví shop
- Chuyển tiền từ `pendingAmount` → `Balance`
- Số tiền chuyển = **[95% × (số tiền gốc sản phẩm - mã giảm giá của shop)] - Số tiền hoàn trả một phần cho khách**
- ⚠️ **KHÔNG có phí ship** trong công thức (phí ship là của sàn)

**Admin (Sàn):**
- Cộng **5% tiền hoa hồng + phí ship**
- Trừ **số tiền giảm của mã giảm giá của sàn** nếu có

### Công thức:
```
Khách nhận = partialRefundAmount
Shop nhận = [0.95 × (productPrice - storeDiscountAmount)] - partialRefundAmount ❌ KHÔNG CỘNG shippingFee
Admin nhận = 0.05 × (productPrice - storeDiscountAmount) + shippingFee - platformDiscountAmount (nếu có)
```

### ⚠️ Validation (Frontend):
- Số tiền hoàn một phần phải **NHỎ HƠN** tổng tiền gốc sản phẩm - giảm giá của shop - hoa hồng của sàn
- Công thức: `partialRefundAmount < productPrice - storeDiscountAmount - platformCommission`
- ⚠️ **Phí ship có thể được hoàn** tùy quyết định của admin (thường được hoàn nếu shop sai)

---

## 5. ❌ Trường hợp admin giải quyết hàng trả về và khách thắng (Hoàn tiền cho khách)

### Mô tả:
Admin giải quyết khiếu nại và quyết định khách thắng (hàng có vấn đề).

### Xử lý tiền:

**Shop:**
- Trừ số tiền `pendingAmount` của ví shop
- Số tiền trừ = **95% × (số tiền gốc sản phẩm - mã giảm giá của shop)**
- ⚠️ **KHÔNG trừ phí ship** (phí ship là của sàn)

**Khách:**
- Nhận số tiền gốc ban đầu khách thanh toán, **BAO GỒM CẢ PHÍ SHIP** ✅

**Admin (Sàn):**
- Cộng **5% tiền hoa hồng** (Đóng vai trò là tiền phạt của shop vì giao hàng sai)
- ⚠️ **TRỪ phí ship** (vì phải hoàn lại phí ship cho khách)

### Công thức:
```
Shop trừ = 0.95 × (productPrice - storeDiscountAmount) ❌ KHÔNG CỘNG shippingFee
Khách nhận = productPrice - storeDiscountAmount - platformDiscountAmount (nếu có) + shippingFee ✅
Admin nhận = 0.05 × (productPrice - storeDiscountAmount) - shippingFee (tiền phạt - trừ ship vì hoàn lại khách)
```

---

## 📝 Lưu Ý Quan Trọng

### 1. Phí Ship:
- ⚠️ **Phí ship là của SÀN** (sàn quản lý đội ngũ shipper)
- Shop **KHÔNG nhận phí ship** trong mọi trường hợp
- Admin nhận phí ship vào revenue khi đơn thành công
- ⚠️ **Khi khách hoàn trả hàng, khách được hoàn CẢ phí ship** (shop sai phải chịu)
- Admin phải **TRỪ phí ship** khỏi revenue khi hoàn lại cho khách
- Khi hoàn tiền một phần, admin có thể quyết định hoàn phí ship tùy trường hợp
- Khi hoàn tiền toàn bộ (shop xác nhận return OK hoặc khách thắng), phí ship **PHẢI được hoàn lại cho khách**

### 2. Hoa Hồng Sàn:
- Luôn là **5%** của (số tiền gốc sản phẩm - mã giảm giá của shop) **+ phí ship**
- Công thức: `platformCommission = 0.05 × (productPrice - storeDiscountAmount) + shippingFee`
- ⚠️ **Phí ship là của sàn**, được cộng vào revenue của admin

### 3. Mã Giảm Giá:
- **Mã giảm giá của shop**: Trừ vào số tiền shop nhận
- **Mã giảm giá của sàn**: Trừ vào revenue của admin (tạo `PLATFORM_DISCOUNT_LOSS`)

### 4. Pending Amount:
- Số tiền tạm giữ trong ví shop khi đơn hàng được tạo
- Chuyển sang `Balance` khi đơn thành công hoặc shop thắng
- Trừ khỏi `pendingAmount` khi hoàn tiền cho khách

### 5. Validation:
- Frontend đã validate số tiền hoàn một phần
- Backend cần validate lại để đảm bảo tính toàn vẹn dữ liệu

---

## 🔍 Kiểm Tra Lại

Cần kiểm tra lại các trường hợp sau:
- [ ] Số tiền vào ví shop khi đơn hàng thành công
- [ ] Phí hoa hồng của sàn khi đơn hàng thành công
- [ ] Số tiền vào ví shop khi shop thắng khiếu nại
- [ ] Số tiền trừ khỏi ví shop khi khách thắng khiếu nại
- [ ] Số tiền hoàn một phần cho khách
- [ ] Số tiền shop nhận khi hoàn tiền một phần
- [ ] Phí hoa hồng của sàn trong các trường hợp khác nhau

---

## 📌 API Endpoints Cần Kiểm Tra

1. **Tạo đơn hàng**: Tính toán và tạo `pendingAmount`
2. **Đơn hàng thành công**: Chuyển `pendingAmount` → `Balance`, tạo revenue cho admin
3. **Hoàn tiền**: Xử lý theo các trường hợp trên
4. **Hoàn tiền một phần**: Validate và xử lý theo công thức
5. **Giải quyết khiếu nại**: Xử lý tiền theo quyết định của admin

---

**Ngày tạo:** 22/12/2025  
**Cập nhật:** 22/12/2025

