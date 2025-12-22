# ❌ VẤN ĐỀ LOGIC TRANH CHẤP VỚI ĐƠN COD CHƯA COMPLETE

## 🔍 VẤN ĐỀ 1: Transaction được tạo khi DELIVERED (SAI)

Khi đơn hàng COD mới **DELIVERED** (chưa COMPLETED), logic đang tạo transaction "Tiền chờ từ đơn hàng" ngay lập tức.

### **Logic đúng:**
- **Khi DELIVERED**: Chỉ cộng vào `pendingAmount` (tiền chờ) → **KHÔNG tạo transaction**
- **Khi COMPLETED**: Chuyển từ `pendingAmount` → `Balance` → **Tạo transaction**

### **Logic hiện tại (SAI):**
```
Khi đơn hàng DELIVERED:
  ❌ Tạo transaction: "+14.515.000 ₫"
     → "Tiền chờ từ đơn hàng #DH2726 (COD - đã giao hàng)"
     ❌ SAI: Chưa complete thì không nên tạo transaction
```

### **Logic đúng:**
```
Khi đơn hàng DELIVERED:
  ✅ Chỉ cộng vào pendingAmount (tiền chờ)
  ✅ KHÔNG tạo transaction

Khi đơn hàng COMPLETED:
  ✅ Chuyển từ pendingAmount → Balance
  ✅ Tạo transaction: "+14.515.000 ₫"
     → "Tiền từ đơn hàng #DH2726 (COD - đã hoàn tất)"
```

---

## 🔍 VẤN ĐỀ 2: Logic tranh chấp với đơn COD chưa complete

Khi giải quyết tranh chấp với đơn hàng **COD chưa complete** (tiền còn ở `pendingAmount`), logic xử lý transaction đang **SAI**.

### **Tình huống:**
- Đơn hàng COD #DH6824: 14.415.000 ₫
- Đơn hàng **chưa complete** → Tiền vẫn ở `pendingAmount` (tiền chờ)
- Store **chưa nhận được tiền vào Balance**
- Admin giải quyết tranh chấp: **PARTIAL_REFUND**
  - Hoàn 10.000.000 ₫ cho buyer
  - Store giữ lại 4.415.000 ₫

### **Logic hiện tại (SAI):**
```
1. Transaction: "-4.415.000 ₫" 
   → "Hoàn tiền từ tranh chấp đơn #DH6824 - Store thắng kiện (giữ lại 4,415,000 ₫)"
   ❌ SAI: Store chưa nhận tiền vào Balance thì trừ gì?

2. Transaction: "-10.000.000 ₫"
   → "Trừ tiền hoàn cho buyer từ tranh chấp đơn #DH6824 - Hoàn một phần 10,000,000 ₫"
   ✅ Đúng: Trừ từ pendingAmount để hoàn cho buyer

3. Transaction: "+14.415.000 ₫"
   → "Tiền chờ từ đơn hàng #DH6824 (COD - đã giao hàng)"
   ❌ SAI: Không nên tạo transaction này khi mới DELIVERED
```

### **Logic đúng nên là:**
```
Từ pendingAmount 14.415.000 ₫:
  - Trừ 10.000.000 ₫ từ pendingAmount để hoàn cho buyer
  - Còn lại 4.415.000 ₫ trong pendingAmount
  - Khi đơn COMPLETED: Chuyển 4.415.000 ₫ từ pendingAmount → Balance

Kết quả: CHỈ CÓ 1 TRANSACTION KHI COMPLETED:
  - Transaction: "+4.415.000 ₫"
    → "Tiền từ tranh chấp đơn #DH6824 - Store thắng kiện (giữ lại 4.415.000 ₫)"
    (Chỉ tạo khi đơn COMPLETED, không tạo khi mới DELIVERED)
```

---

## ✅ LOGIC ĐÚNG CẦN SỬA

### **Khi giải quyết tranh chấp PARTIAL_REFUND với đơn COD chưa complete:**

```javascript
// 1. Kiểm tra trạng thái đơn hàng
if (order.status !== 'COMPLETED' && order.paymentMethod === 'COD') {
  // Đơn COD chưa complete → Tiền còn ở pendingAmount (tiền chờ)
  // Store chưa nhận tiền vào Balance
  
  // 2. Tính toán số tiền
  const totalPendingAmount = order.productPrice; // 14.415.000 ₫ (đang ở pendingAmount)
  const partialRefundToBuyer = 10.000.000 ₫; // Từ admin nhập
  const storeKeepAmount = totalPendingAmount - partialRefundToBuyer; // 4.415.000 ₫
  
  // 3. Trừ từ pendingAmount để hoàn cho buyer
  await subtractPendingAmount(storeId, partialRefundToBuyer, {
    type: 'PARTIAL_REFUND_TO_BUYER',
    orderId: orderId,
    description: `Trừ tiền hoàn cho buyer từ tranh chấp đơn #${orderCode} - Hoàn một phần ${partialRefundToBuyer} ₫`
  });
  
  // 4. Hoàn tiền cho buyer
  await refundToBuyer(orderId, partialRefundToBuyer, {
    type: 'PARTIAL_REFUND',
    description: `Hoàn tiền một phần từ tranh chấp đơn #${orderCode} - ${partialRefundToBuyer} ₫`
  });
  
  // 5. Cập nhật pendingAmount còn lại (4.415.000 ₫)
  // Khi đơn COMPLETED, sẽ chuyển từ pendingAmount → Balance và tạo transaction
  
  // ✅ KẾT QUẢ: 
  // - KHÔNG tạo transaction ngay lúc này
  // - Chỉ trừ pendingAmount để hoàn cho buyer
  // - Khi đơn COMPLETED, mới chuyển pendingAmount còn lại → Balance và tạo transaction
}
```

### **Khi giải quyết tranh chấp PARTIAL_REFUND với đơn COD đã complete:**

```javascript
// 1. Kiểm tra trạng thái đơn hàng
if (order.status === 'COMPLETED' && order.paymentMethod === 'COD') {
  // Đơn COD đã complete → Store đã nhận tiền vào ví
  
  // 2. Tính toán số tiền
  const totalAmount = order.productPrice; // 14.415.000 ₫
  const partialRefundToBuyer = 10.000.000 ₫; // Từ admin nhập
  const storeKeepAmount = totalAmount - partialRefundToBuyer; // 4.415.000 ₫
  const storeRefundAmount = totalAmount - storeKeepAmount; // 10.000.000 ₫ (phần cần trừ)
  
  // 3. Trừ tiền từ ví store (phần cần hoàn cho buyer)
  await subtractFromStoreWallet(storeId, storeRefundAmount, {
    type: 'PARTIAL_REFUND_TO_BUYER',
    orderId: orderId,
    description: `Trừ tiền hoàn cho buyer từ tranh chấp đơn #${orderCode} - Hoàn một phần ${storeRefundAmount} ₫`
  });
  
  // 4. Hoàn tiền cho buyer
  await refundToBuyer(orderId, partialRefundToBuyer, {
    type: 'PARTIAL_REFUND',
    description: `Hoàn tiền một phần từ tranh chấp đơn #${orderCode} - ${partialRefundToBuyer} ₫`
  });
  
  // ✅ KẾT QUẢ: CÓ 1 TRANSACTION TRỪ TIỀN TỪ VÍ STORE
}
```

---

## 📋 TÓM TẮT

### **Vấn đề 1: Transaction được tạo khi DELIVERED**
- ❌ Logic hiện tại tạo transaction "Tiền chờ từ đơn hàng" khi đơn mới DELIVERED
- ✅ **Đúng**: Khi DELIVERED → Chỉ cộng vào `pendingAmount`, KHÔNG tạo transaction
- ✅ **Đúng**: Khi COMPLETED → Chuyển từ `pendingAmount` → `Balance`, tạo transaction

### **Vấn đề 2: Logic tranh chấp với đơn COD chưa complete**
- ❌ Logic hiện tại tạo transaction "Trừ tiền" cho store dù store chưa nhận tiền vào Balance
- ❌ Tạo nhiều transaction không cần thiết

### **Giải pháp:**
- ✅ **Khi DELIVERED**: Chỉ cộng vào `pendingAmount`, KHÔNG tạo transaction
- ✅ **Khi COMPLETED**: Chuyển từ `pendingAmount` → `Balance`, tạo transaction
- ✅ **Đơn COD chưa complete + tranh chấp**: Trừ từ `pendingAmount` để hoàn buyer, KHÔNG tạo transaction
- ✅ **Đơn COD đã complete + tranh chấp**: Trừ tiền từ Balance (đã nhận) để hoàn cho buyer
- ✅ **Đơn Online**: Tương tự đơn COD đã complete (store đã nhận tiền khi complete)

---

## 🔧 CẦN SỬA BACKEND

### **File cần sửa:**
1. **Khi đơn hàng DELIVERED:**
   - `completeOrder()` hoặc `updateOrderStatus()` - Khi status = DELIVERED
   - Chỉ cộng vào `pendingAmount`, KHÔNG tạo transaction

2. **Khi đơn hàng COMPLETED:**
   - `completeOrder()` - Khi status = COMPLETED
   - Chuyển từ `pendingAmount` → `Balance`
   - Tạo transaction "Tiền từ đơn hàng #XXX (COD - đã hoàn tất)"

3. **Khi giải quyết tranh chấp:**
   - `resolveQualityDispute()` - Xử lý logic theo trạng thái đơn hàng
   - Kiểm tra `order.status` và `order.paymentMethod` trước khi tạo transaction

### **Logic kiểm tra:**

#### **1. Khi đơn hàng DELIVERED:**
```javascript
if (order.status === 'DELIVERED' && order.paymentMethod === 'COD') {
  // Chỉ cộng vào pendingAmount
  await addToPendingAmount(storeId, storeReceiveAmount, orderId);
  // ❌ KHÔNG tạo transaction ở đây
}
```

#### **2. Khi đơn hàng COMPLETED:**
```javascript
if (order.status === 'COMPLETED' && order.paymentMethod === 'COD') {
  // Chuyển từ pendingAmount → Balance
  await transferPendingToBalance(storeId, pendingAmount, orderId);
  // ✅ Tạo transaction ở đây
  await createTransaction(storeId, {
    type: 'ORDER_COMPLETED',
    amount: pendingAmount,
    description: `Tiền từ đơn hàng #${orderCode} (COD - đã hoàn tất)`
  });
}
```

#### **3. Khi giải quyết tranh chấp:**
```javascript
if (order.status !== 'COMPLETED' && order.paymentMethod === 'COD') {
  // Đơn COD chưa complete → Tiền còn ở pendingAmount
  // Trừ từ pendingAmount, KHÔNG tạo transaction
  await subtractPendingAmount(storeId, refundAmount, orderId);
} else {
  // Đơn đã complete hoặc Online → Trừ tiền từ Balance
  // Store đã nhận tiền rồi
  await subtractFromBalance(storeId, refundAmount, orderId);
  // ✅ Tạo transaction trừ tiền
}
```

---

**Ngày phát hiện:** 23/12/2025  
**Trạng thái:** ❌ CẦN SỬA BACKEND

