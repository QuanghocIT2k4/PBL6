# 🚫 Tính Năng Ban Shop

## 📋 Tổng Quan

Tính năng ban shop được kích hoạt tự động khi shop bị khiếu nại về hàng trả về và đã hoàn tiền cho khách **quá 5 lần trong 1 tháng**.

---

## 🔄 Điều Kiện Ban Shop

### Kích Hoạt Tự Động:
- Khi shop nhận hàng trả về và xác nhận hàng OK (hoàn tiền cho khách) → Cảnh báo 1 lần
- Khi admin giải quyết khiếu nại và khách thắng (hoàn tiền cho khách) → Cảnh báo 1 lần
- **Cảnh báo quá 5 lần trong 1 tháng → Ban shop tự động**

### Cơ Chế Cảnh Báo:
- Mỗi lần hoàn tiền cho khách (shop xác nhận OK hoặc khách thắng) → Tăng `returnWarningCount` lên 1
- Nếu tháng hiện tại khác `lastWarningMonth` → Reset `returnWarningCount` về 1 và cập nhật `lastWarningMonth`
- Nếu `returnWarningCount >= 5` trong cùng tháng → Ban shop tự động

---

## 🚫 Chức Năng Bị Hạn Chế Khi Shop Bị Ban

Khi shop bị ban, các chức năng sau sẽ bị **CHẶN**:

1. ❌ **Xác nhận đơn hàng mới** (confirm Order)
2. ❌ **Tạo/cập nhật sản phẩm** (product, variant)
3. ❌ **Tạo khuyến mãi mới của shop** (promotions)
4. ❌ **Tạo yêu cầu rút tiền** (withdrawal)
5. ❌ **Cập nhật thông tin shop** (logo, banner, địa chỉ,…)
6. ❌ **Khách hàng thanh toán** với shop bị ban đó (chặn ở checkout)
7. ✅ **Tự động hủy** tất cả các đơn hàng PENDING của shop

---

## ✅ Chức Năng Vẫn Có Thể Sử Dụng

Khi shop bị ban, các chức năng sau vẫn **HOẠT ĐỘNG BÌNH THƯỜNG**:

1. ✅ **Xem đơn hàng, thống kê**
2. ✅ **Xử lý đơn hàng đang giao** (đơn hàng đã được xác nhận trước khi ban)
3. ✅ **Xử lý yêu cầu trả hàng**
4. ✅ **Xem ví** (không thể rút tiền)
5. ✅ **Chat với khách hàng**

---

## 📊 Trường Dữ Liệu Store

### Thêm 2 Trường Mới:

```javascript
{
  returnWarningCount: Number,  // Số lần cảnh báo về hàng trả về trong tháng hiện tại
  lastWarningMonth: String     // Tháng của lần cảnh báo cuối (format: "yyyy-MM", ví dụ: "2025-12")
}
```

### Logic Cập Nhật:

```javascript
// Khi hoàn tiền cho khách (shop xác nhận OK hoặc khách thắng)
const currentMonth = new Date().toISOString().slice(0, 7); // "2025-12"

if (store.lastWarningMonth !== currentMonth) {
  // Tháng mới → Reset về 1
  store.returnWarningCount = 1;
  store.lastWarningMonth = currentMonth;
} else {
  // Cùng tháng → Tăng lên 1
  store.returnWarningCount += 1;
}

// Kiểm tra ban tự động
if (store.returnWarningCount >= 5) {
  // Ban shop tự động
  banStore(store.id, "Tự động ban: Quá 5 lần cảnh báo về hàng trả về trong tháng");
}
```

---

## 🔧 API Endpoints

### 1. Ban Store
```
PUT /api/v1/admin/stores/{storeId}/ban
Query params:
  - reason: string (bắt buộc) - Lý do ban cửa hàng
```

**Chức năng:**
- Ban một cửa hàng
- Tự động hủy tất cả các đơn hàng đang ở trạng thái PENDING của cửa hàng đó
- Thay đổi trạng thái store thành BANNED

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "store_id",
    "status": "BANNED",
    "bannedAt": "2025-12-23T10:00:00Z",
    "banReason": "Lý do ban"
  },
  "message": "Ban cửa hàng thành công. Tất cả đơn hàng PENDING đã được hủy tự động."
}
```

### 2. Unban Store
```
PUT /api/v1/admin/stores/{storeId}/unban
```

**Chức năng:**
- Gỡ ban cho một cửa hàng đã bị ban trước đó
- Khôi phục trạng thái về APPROVED
- Sau khi unban, cửa hàng có thể thực hiện lại tất cả các chức năng bình thường

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "store_id",
    "status": "APPROVED",
    "unbannedAt": "2025-12-23T10:00:00Z"
  },
  "message": "Gỡ ban cửa hàng thành công"
}
```

---

## 🔍 Frontend Implementation

### Service Functions

Đã bổ sung vào `FE/src/services/admin/adminStoreService.js`:

```javascript
/**
 * Ban store
 * PUT /api/v1/admin/stores/{storeId}/ban
 */
export const banStore = async (storeId, reason) => {
  // Implementation
};

/**
 * Unban store
 * PUT /api/v1/admin/stores/{storeId}/unban
 */
export const unbanStore = async (storeId) => {
  // Implementation
};
```

### Sử Dụng:

```javascript
import { banStore, unbanStore } from '../../services/admin/adminStoreService';

// Ban store
const result = await banStore(storeId, "Lý do ban cửa hàng");
if (result.success) {
  // Hiển thị thông báo thành công
}

// Unban store
const result = await unbanStore(storeId);
if (result.success) {
  // Hiển thị thông báo thành công
}
```

---

## ⚠️ Lưu Ý Quan Trọng

1. **Ban Tự Động:**
   - Khi `returnWarningCount >= 5` trong cùng tháng → Ban tự động
   - Backend cần implement logic tự động ban khi cập nhật `returnWarningCount`

2. **Reset Cảnh Báo:**
   - Mỗi tháng mới, `returnWarningCount` sẽ được reset về 1
   - `lastWarningMonth` được cập nhật theo tháng hiện tại

3. **Chặn Thanh Toán:**
   - Frontend cần kiểm tra trạng thái store trước khi cho phép checkout
   - Nếu store bị ban → Hiển thị thông báo và không cho phép thanh toán

4. **Hủy Đơn Hàng PENDING:**
   - Khi ban store, backend tự động hủy tất cả đơn hàng PENDING
   - Frontend cần hiển thị thông báo cho shop về việc đơn hàng bị hủy

---

## 📝 Checklist Implementation

### Backend:
- [ ] Thêm 2 trường `returnWarningCount` và `lastWarningMonth` vào Store model
- [ ] Implement logic tăng cảnh báo khi hoàn tiền cho khách
- [ ] Implement logic ban tự động khi `returnWarningCount >= 5`
- [ ] Implement API ban store (hủy đơn PENDING)
- [ ] Implement API unban store
- [ ] Chặn các chức năng bị hạn chế khi store bị ban
- [ ] Chặn thanh toán với store bị ban

### Frontend:
- [x] Bổ sung API ban/unban store vào `adminStoreService.js`
- [ ] Tạo UI ban/unban store trong Admin Store Management
- [ ] Hiển thị trạng thái BANNED trong danh sách store
- [ ] Chặn checkout với store bị ban
- [ ] Hiển thị cảnh báo khi store gần bị ban (4/5 cảnh báo)

---

**Ngày tạo:** 23/12/2025




