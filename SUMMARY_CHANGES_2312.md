# 📝 Tóm Tắt Các Thay Đổi - 23/12/2025

## ✅ Đã Hoàn Thành

### 1. 🚫 Tính Năng Ban Shop

**File đã cập nhật:**
- `FE/src/services/admin/adminStoreService.js`

**Chức năng mới:**
- ✅ `banStore(storeId, reason)` - Ban cửa hàng và tự động hủy đơn PENDING
- ✅ `unbanStore(storeId)` - Gỡ ban cửa hàng

**Tài liệu:**
- `FE/BAN_STORE_FEATURE.md` - Chi tiết về tính năng ban shop

**Điều kiện ban:**
- Khi shop bị cảnh báo quá 5 lần trong 1 tháng về hàng trả về và đã hoàn tiền cho khách
- Tự động ban khi `returnWarningCount >= 5` trong cùng tháng

**Trường dữ liệu Store cần thêm (Backend):**
- `returnWarningCount: Number` - Số lần cảnh báo trong tháng hiện tại
- `lastWarningMonth: String` - Tháng của lần cảnh báo cuối (format: "yyyy-MM")

---

### 2. 🔍 API Search Product Variant cho B2C

**File đã cập nhật:**
- `FE/src/services/b2c/b2cProductService.js`

**Chức năng mới:**
- ✅ `searchProductVariantsByStore(storeId, params)` - Tìm kiếm product variant của store

**API Endpoint:**
```
GET /api/v1/b2c/product-variants/search/{storeId}
Query params:
  - name: string (bắt buộc) - Tên sản phẩm hoặc từ khóa
  - status: string (optional) - Lọc theo trạng thái
  - page: number (default: 0)
  - size: number (default: 20)
  - sortBy: string (default: 'createdAt')
  - sortDir: string (default: 'desc')
```

---

### 3. 💰 Sửa Lại Validation Hoàn Tiền 1 Phần

**File đã cập nhật:**
- `FE/src/services/admin/disputeService.js`

**Thay đổi:**
- ✅ Validation: `partialRefundAmount < productPrice - storeDiscountAmount - platformCommission`
- ✅ **Phí ship người mua chịu** (không được hoàn lại khi hoàn tiền 1 phần)
- ✅ Thêm validation chi tiết với thông báo lỗi rõ ràng

**Logic mới:**
```javascript
// Validation hoàn tiền 1 phần
const maxRefundAmount = productPrice - storeDiscountAmount - platformCommission;
if (partialRefundAmount >= maxRefundAmount) {
  // Error: Số tiền hoàn một phần phải nhỏ hơn maxRefundAmount
  // Phí ship người mua chịu
}
```

---

### 4. 📊 Cập Nhật Logic Xử Lý Tiền

**File đã tạo:**
- `FE/LOGIC_XU_LY_TIEN_UPDATED.md` - Logic xử lý tiền mới

**Thay đổi chính:**

#### Shop Nhận Tiền Khi Đơn Thành Công:
**CŨ:** `95% × (productPrice - storeDiscountAmount)` ❌ KHÔNG CỘNG shippingFee

**MỚI:** `95% × (productPrice - storeDiscountAmount) + shippingFee` ✅

#### Hoàn Tiền 1 Phần:
- **Phí ship người mua chịu** (không được hoàn lại)
- Validation: `partialRefundAmount < productPrice - storeDiscountAmount - platformCommission`

#### Các Trường Hợp Xử Lý Tiền:

1. **Đơn hàng thành công:**
   - Shop nhận: `95% × (productPrice - storeDiscountAmount) + shippingFee`
   - Admin nhận: `5% × (productPrice - storeDiscountAmount) - platformDiscountAmount`

2. **Shop nhận hàng trả về và xác nhận OK:**
   - Shop trừ: `95% × (productPrice - storeDiscountAmount) + shippingFee`
   - Khách nhận: `productPrice - storeDiscountAmount - platformDiscountAmount + shippingFee`
   - Admin: Cảnh báo shop 1 lần

3. **Admin giải quyết - Shop thắng:**
   - Shop nhận: `95% × (productPrice - storeDiscountAmount) + shippingFee`
   - Admin nhận: `5% × (productPrice - storeDiscountAmount) - platformDiscountAmount`

4. **Admin giải quyết - Hoàn tiền 1 phần:**
   - Khách nhận: `partialRefundAmount` (KHÔNG BAO GỒM phí ship)
   - Shop nhận: `[95% × (productPrice - storeDiscountAmount) + shippingFee] - partialRefundAmount`
   - Admin nhận: `5% × (productPrice - storeDiscountAmount) - platformDiscountAmount`

5. **Admin giải quyết - Khách thắng:**
   - Shop trừ: `95% × (productPrice - storeDiscountAmount) + shippingFee`
   - Khách nhận: `productPrice - storeDiscountAmount - platformDiscountAmount + shippingFee`
   - Admin: Cảnh báo shop 1 lần

---

## 📋 Checklist Backend Cần Implement

### 1. Store Model:
- [ ] Thêm `returnWarningCount: Number` (default: 0)
- [ ] Thêm `lastWarningMonth: String` (format: "yyyy-MM")

### 2. Ban Store Logic:
- [ ] Implement logic tăng `returnWarningCount` khi hoàn tiền cho khách
- [ ] Implement logic reset `returnWarningCount` khi sang tháng mới
- [ ] Implement logic ban tự động khi `returnWarningCount >= 5`
- [ ] Implement API ban store (hủy đơn PENDING)
- [ ] Implement API unban store

### 3. Chặn Chức Năng Khi Bị Ban:
- [ ] Chặn xác nhận đơn hàng mới
- [ ] Chặn tạo/cập nhật sản phẩm
- [ ] Chặn tạo khuyến mãi
- [ ] Chặn tạo yêu cầu rút tiền
- [ ] Chặn cập nhật thông tin shop
- [ ] Chặn thanh toán với shop bị ban

### 4. Logic Xử Lý Tiền:
- [ ] Cập nhật: Shop nhận phí ship khi đơn thành công
- [ ] Cập nhật: Shop trừ phí ship khi hoàn tiền cho khách
- [ ] Cập nhật: Hoàn tiền 1 phần (phí ship người mua chịu)
- [ ] Cập nhật: Cảnh báo shop khi hoàn tiền cho khách

### 5. API Search Product Variant:
- [ ] Implement `GET /api/v1/b2c/product-variants/search/{storeId}`

---

## 🔍 Files Đã Thay Đổi

1. ✅ `FE/src/services/admin/adminStoreService.js`
   - Thêm `banStore()` và `unbanStore()`

2. ✅ `FE/src/services/b2c/b2cProductService.js`
   - Thêm `searchProductVariantsByStore()`

3. ✅ `FE/src/services/admin/disputeService.js`
   - Cập nhật `resolveQualityDispute()` với validation hoàn tiền 1 phần

4. ✅ `FE/LOGIC_XU_LY_TIEN_UPDATED.md` (MỚI)
   - Tài liệu logic xử lý tiền mới

5. ✅ `FE/BAN_STORE_FEATURE.md` (MỚI)
   - Tài liệu tính năng ban shop

6. ✅ `FE/SUMMARY_CHANGES_2312.md` (MỚI)
   - File này - Tóm tắt các thay đổi

---

## 📝 Ghi Chú

- Tất cả các thay đổi đã được implement ở **Frontend** (service functions)
- Backend cần implement các API và logic tương ứng
- Validation hoàn tiền 1 phần đã được thêm vào frontend, backend cũng cần validate lại
- Logic xử lý tiền mới đã được cập nhật trong tài liệu, backend cần cập nhật theo

---

**Ngày cập nhật:** 23/12/2025




