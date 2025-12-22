MA# ⚠️ LOGIC CẢNH BÁO STORE KHI THẮNG KHIẾU NẠI CHẤT LƯỢNG

## 🔍 VẤN ĐỀ

Khi store thắng khiếu nại chất lượng (APPROVE_STORE) nhưng trước đó đã có **return request** (người mua trả hàng), thì store vẫn phải bị **cộng 1 cảnh báo** vì đã giao hàng lỗi cho khách.

### **Tình huống:**
1. Store giao hàng lỗi → Người mua tạo return request
2. Store nhận hàng trả về và khởi kiện chất lượng (RETURN_QUALITY)
3. Admin giải quyết: **APPROVE_STORE** (Store thắng - hàng kém chất lượng do người mua)
4. **VẪN PHẢI CỘNG 1 CẢNH BÁO** vì store đã giao hàng lỗi (dẫn đến return request)

---

## ✅ LOGIC ĐÚNG

### **Khi giải quyết khiếu nại chất lượng (RETURN_QUALITY):**

```javascript
// Khi resolve quality dispute
if (decision === 'APPROVE_STORE') {
  // Store thắng khiếu nại chất lượng
  
  // ✅ KIỂM TRA: Có return request liên quan không?
  if (dispute.returnRequest || order.hasReturnRequest) {
    // Có return request → Store đã giao hàng lỗi
    // → VẪN PHẢI CỘNG 1 CẢNH BÁO
    
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
      banStore(store.id, "Tự động ban: Quá 5 lần cảnh báo về hàng trả về trong tháng");
    }
    
    // Tạo notification cảnh báo cho store
    await createNotification(store.id, {
      type: 'VIOLATION_WARNING',
      title: 'Cảnh báo vi phạm',
      message: `Bạn đã giao hàng lỗi (có return request) dù thắng khiếu nại chất lượng. Số lần cảnh báo: ${store.returnWarningCount}/5`
    });
  }
  // Nếu KHÔNG có return request → Không cộng cảnh báo (store không có lỗi)
}
```

---

## 📋 TÓM TẮT

### **Các trường hợp cộng cảnh báo:**

1. ✅ **Store xác nhận hàng OK** (hoàn tiền cho khách) → Cộng 1 cảnh báo
2. ✅ **Khách thắng khiếu nại** (hoàn tiền cho khách) → Cộng 1 cảnh báo
3. ✅ **Store thắng khiếu nại chất lượng NHƯNG có return request** → Cộng 1 cảnh báo
   - **Lý do:** Store đã giao hàng lỗi (dẫn đến return request)

### **Các trường hợp KHÔNG cộng cảnh báo:**

1. ❌ **Store thắng khiếu nại chất lượng KHÔNG có return request** → Không cộng cảnh báo
   - **Lý do:** Store không có lỗi, hàng kém chất lượng do người mua

---

## 🔧 CẦN SỬA BACKEND

### **File cần sửa:**
- `resolveQualityDispute()` - Khi quyết định APPROVE_STORE

### **Logic kiểm tra:**
```javascript
// Khi resolve quality dispute với APPROVE_STORE
if (decision === 'APPROVE_STORE') {
  // Kiểm tra có return request không
  const hasReturnRequest = dispute.returnRequest || order.returnRequestId;
  
  if (hasReturnRequest) {
    // Có return request → Store đã giao hàng lỗi → Cộng cảnh báo
    await incrementStoreWarning(storeId, {
      reason: 'Giao hàng lỗi (có return request) dù thắng khiếu nại chất lượng'
    });
  }
  // Nếu không có return request → Không cộng cảnh báo
}
```

---

## 📝 FRONTEND ĐÃ SỬA

1. ✅ Thêm comment trong `disputeService.js` về logic cảnh báo
2. ✅ Thêm thông báo trong `AdminDisputeDetailPage.jsx` khi store thắng nhưng có return request

---

**Ngày tạo:** 23/12/2025  
**Trạng thái:** ⚠️ CẦN SỬA BACKEND

