# 🔍 Báo Cáo Kiểm Tra: FE Đã Gắn API & Backend Cần Implement

## ✅ KIỂM TRA CODE FRONTEND

### 1. ✅ Trường Hợp: Đơn Hàng Thành Công (Complete Order)

**File:** `FE/src/components/orders/OrderCard.jsx`

**Code:**
```377:400:FE/src/components/orders/OrderCard.jsx
const handleCompleteClick = async () => {
  try {
    const result = await completeOrder(order.id);
    if (result.success) {
      success('Đơn hàng đã được xác nhận hoàn tất');
      
      // ✅ Mutate order detail cache để cập nhật status ngay lập tức
      if (mutateDetail) {
        // Nếu đã expanded (đã fetch detail), mutate detail cache
        await mutateDetail(async () => {
          const updatedOrder = await getOrderById(order.id);
          return updatedOrder;
        }, false); // false = không revalidate ngay, chỉ update cache
      } else {
        // Nếu chưa expanded, vẫn mutate để khi expand sẽ có data mới
        await swrMutate(['order-detail', order.id], async () => {
          const updatedOrder = await getOrderById(order.id);
          return updatedOrder;
        }, false);
      }
      
      // ✅ Mutate order list để refresh danh sách (quan trọng nhất)
      if (onRefresh) {
```

**API Call:** `PUT /api/v1/buyer/orders/{orderId}/complete`

**Service:** `FE/src/services/buyer/orderService.js`
```60:75:FE/src/services/buyer/orderService.js
export const completeOrder = async (orderId) => {
  try {
    const response = await api.put(`/api/v1/buyer/orders/${orderId}/complete`);

    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error) {
    console.error('Error completing order:', error);
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Không thể xác nhận hoàn tất đơn hàng',
    };
  }
};
```

**✅ KẾT LUẬN:** FE đã gắn API call đúng. Backend cần implement logic xử lý tiền.

---

### 2. ✅ Trường Hợp: Shop Xác Nhận Hàng Trả Về OK

**File:** `FE/src/pages/store/StoreReturnRequestsPage.jsx`

**Code:**
```224:249:FE/src/pages/store/StoreReturnRequestsPage.jsx
const handleConfirmOK = async (returnRequestId) => {
  if (!currentStore?.id) {
    showError('Không tìm thấy thông tin cửa hàng');
    return;
  }

  const confirmed = await confirmAction('xác nhận hàng trả về không có vấn đề');
  if (!confirmed) return;

  setProcessingId(returnRequestId);
  try {
    const result = await confirmReturnOK(currentStore.id, returnRequestId);

    if (result.success) {
      success('Đã xác nhận hàng trả về không có vấn đề');
      mutate();
    } else {
      showError(result.error || 'Không thể xác nhận hàng trả về');
    }
  } catch (err) {
    console.error('Error confirming return OK:', err);
    showError('Có lỗi xảy ra khi xác nhận hàng trả về');
  } finally {
    setProcessingId(null);
  }
};
```

**API Call:** `PUT /api/v1/b2c/returns/store/{storeId}/returnRequest/{returnRequestId}/confirm-ok`

**Service:** `FE/src/services/b2c/returnService.js`
```128:145:FE/src/services/b2c/returnService.js
export const confirmReturnOK = async (storeId, returnRequestId) => {
  try {
    const response = await api.put(
      `/api/v1/b2c/returns/store/${storeId}/returnRequest/${returnRequestId}/confirm-ok`
    );

    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error) {
    console.error('Error confirming return OK:', error);
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Không thể xác nhận hàng trả về',
    };
  }
};
```

**✅ KẾT LUẬN:** FE đã gắn API call đúng. Backend cần implement logic xử lý tiền.

---

### 3. ✅ Trường Hợp: Admin Giải Quyết Dispute

**File:** `FE/src/pages/admin/AdminDisputeDetailPage.jsx`

**Code:**
```214:346:FE/src/pages/admin/AdminDisputeDetailPage.jsx
const handleResolve = async () => {
  if (!decision) {
    showError('Vui lòng chọn quyết định');
    return;
  }
  if (!adminNote || !adminNote.trim()) {
    showError('Vui lòng nhập lý do quyết định');
    return;
  }

  // Validate số tiền hoàn một phần (nếu chọn PARTIAL_REFUND)
  if (decision === 'PARTIAL_REFUND') {
    // ✅ Parse số từ format có dấu chấm
    const amountStr = parseFormattedNumber(partialRefundAmount);
    const amount = Number(amountStr);
    
    if (!partialRefundAmount || !amountStr || Number.isNaN(amount) || amount <= 0) {
      showError('Vui lòng nhập số tiền hoàn một phần hợp lệ (> 0)');
      return;
    }

    // ✅ VALIDATION: Số tiền hoàn một phần phải NHỎ HƠN tổng tiền gốc sản phẩm - giảm giá của shop - hoa hồng của sàn
    // Công thức: maxRefundAmount = productPrice - storeDiscountAmount - platformCommission
    // ⚠️ LƯU Ý: Phí ship người mua chịu, KHÔNG được hoàn
    // ✅ Ưu tiên dùng orderDetail từ API, fallback về order từ dispute
    const order = orderDetail || dispute?.returnRequest?.order;
    
    if (order) {
      const productPrice = parseFloat(order.productPrice || order.totalPrice || 0);
      const storeDiscountAmount = parseFloat(order.storeDiscountAmount || 0);
      const platformCommission = parseFloat(order.platformCommission || order.serviceFee || 0);
      
      // ✅ Số tiền tối đa có thể hoàn = Tổng tiền gốc sản phẩm - Giảm giá của shop - Hoa hồng của sàn
      // Phí ship người mua chịu, không được hoàn
      const maxRefundAmount = productPrice - storeDiscountAmount - platformCommission;
      
      // ✅ Validation: Số tiền hoàn một phần phải NHỎ HƠN (không bằng) maxRefundAmount
      if (amount >= maxRefundAmount) {
        showError(
          `Số tiền hoàn một phần (${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)}) ` +
          `phải NHỎ HƠN số tiền tối đa có thể hoàn ` +
          `(${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(maxRefundAmount)}). ` +
          `Công thức: Tổng tiền sản phẩm - Giảm giá shop - Hoa hồng sàn. ` +
          `Lưu ý: Phí ship người mua chịu, không được hoàn.`
        );
        return;
      }
      
      if (amount <= 0) {
        showError('Số tiền hoàn một phần phải lớn hơn 0');
        return;
      }
    } else {
      showError('Không thể lấy thông tin đơn hàng để tính toán số tiền hoàn một phần');
      return;
    }
  }

  const confirmed = await confirmAction('giải quyết khiếu nại này');
  if (!confirmed) return;

  setIsResolving(true);
  try {
    // Xác định disputeType từ nhiều nguồn
    let disputeType = dispute.disputeType || dispute.dispute_type || dispute.type;
    
    // Xác định loại khiếu nại
    disputeType = detectDisputeType(dispute);
    let result;
    const decisionIsStore = decision === 'APPROVE_STORE' || decision === 'REJECT_STORE';
    const decisionIsReturn = decision === 'APPROVE_RETURN' || decision === 'REJECT_RETURN';

    // Chặn sai quyết định theo loại khiếu nại
    if (detectDisputeType(dispute) === 'RETURN_QUALITY' && decisionIsReturn) {
      showError('Đây là khiếu nại chất lượng hàng trả. Vui lòng chọn quyết định phù hợp (Chấp nhận/Từ chối hàng trả về).');
      setIsResolving(false);
      return;
    }
    if (detectDisputeType(dispute) === 'RETURN_REJECTION' && decisionIsStore) {
      showError('Đây là khiếu nại từ chối trả hàng. Vui lòng chọn quyết định phù hợp (Chấp nhận/Từ chối trả hàng).');
      setIsResolving(false);
      return;
    }

    if (decisionIsStore || decision === 'PARTIAL_REFUND') {
      // Khiếu nại chất lượng hàng trả (store khởi tạo) + hoàn tiền 1 phần
      const payload = {
        decision,
        reason: adminNote,
      };
      if (decision === 'PARTIAL_REFUND') {
        // ✅ Parse số từ format có dấu chấm trước khi gửi
        payload.partialRefundAmount = Number(parseFormattedNumber(partialRefundAmount));
      }
      result = await resolveQualityDispute(disputeId, payload);
    } else if (decisionIsReturn) {
      result = await resolveDispute(disputeId, { decision, reason: adminNote });
    } else {
      // Fallback theo disputeType nếu decision không thuộc hai nhóm trên
      if (detectDisputeType(dispute) === 'RETURN_QUALITY') {
        result = await resolveQualityDispute(disputeId, { decision, reason: adminNote });
      } else {
        result = await resolveDispute(disputeId, { decision, reason: adminNote });
      }
    }

    if (result.success) {
      const disputeType = detectDisputeType(dispute);
      const decisionLabel = getDecisionLabel(decision, disputeType);
      showSuccess(`Đã giải quyết khiếu nại: ${decisionLabel}`);
      setShowResolveModal(false);
      mutate();
      
      // Thông báo về luồng tiếp theo dựa trên quyết định
      if (decision === 'APPROVE_RETURN') {
        setTimeout(() => {
          showSuccess('Return Request đã được chấp nhận. Shipper sẽ lấy hàng từ Buyer và trả về Store.');
        }, 1000);
      } else if (decision === 'REJECT_RETURN') {
        setTimeout(() => {
          showSuccess('Return Request đã bị từ chối. Buyer sẽ giữ hàng và không được hoàn tiền.');
        }, 1000);
      }
    } else {
      showError(result.error || 'Không thể giải quyết khiếu nại');
    }
  } catch (err) {
    console.error('Error resolving dispute:', err);
    showError('Có lỗi xảy ra khi giải quyết khiếu nại');
  } finally {
    setIsResolving(false);
  }
};
```

**API Calls:**
- `PUT /api/v1/admin/disputes/{disputeId}/resolve` (cho RETURN_REJECTION)
- `PUT /api/v1/admin/disputes/{disputeId}/resolve-quality` (cho RETURN_QUALITY)

**Service:** `FE/src/services/admin/disputeService.js`
```69:121:FE/src/services/admin/disputeService.js
export const resolveDispute = async (disputeId, data) => {
  try {
    // API yêu cầu reason thay vì adminNote
    const payload = {
      decision: data.decision,
      reason: data.reason || data.adminNote || '',
    };
    const response = await api.put(`/api/v1/admin/disputes/${disputeId}/resolve`, payload);

    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error) {
    console.error('Error resolving dispute:', error);
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Không thể giải quyết khiếu nại',
    };
  }
};

/**
 * Resolve quality dispute (for RETURN_QUALITY type)
 * @param {string} disputeId - Dispute ID
 * @param {object} data - Decision data (decision: APPROVE_STORE | REJECT_STORE, reason)
 * @returns {Promise} Resolved dispute
 */
export const resolveQualityDispute = async (disputeId, data) => {
  try {
    // API yêu cầu reason thay vì adminNote
    const payload = {
      decision: data.decision,
      reason: data.reason || data.adminNote || '',
    };
    // ✅ Thêm partialRefundAmount nếu có (cho PARTIAL_REFUND decision)
    if (data.partialRefundAmount !== undefined && data.partialRefundAmount !== null) {
      payload.partialRefundAmount = Number(data.partialRefundAmount);
    }
    const response = await api.put(`/api/v1/admin/disputes/${disputeId}/resolve-quality`, payload);

    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error) {
    console.error('Error resolving quality dispute:', error);
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Không thể giải quyết khiếu nại chất lượng',
    };
  }
};
```

**✅ KẾT LUẬN:** 
- FE đã gắn API call đúng ✅
- FE đã validate số tiền hoàn một phần đúng ✅
- Backend cần implement logic xử lý tiền ⚠️

---

## 📊 TỔNG HỢP KIỂM TRA FE

| Trường Hợp | Component | API Call | Service | Validation | Trạng Thái |
|------------|-----------|----------|---------|------------|------------|
| **1. Complete Order** | OrderCard.jsx | ✅ | ✅ | ✅ | ✅ ĐÃ GẮN |
| **2. Confirm Return OK** | StoreReturnRequestsPage.jsx | ✅ | ✅ | ✅ | ✅ ĐÃ GẮN |
| **3. Resolve Dispute** | AdminDisputeDetailPage.jsx | ✅ | ✅ | ✅ | ✅ ĐÃ GẮN |
| **4. Resolve Quality Dispute** | AdminDisputeDetailPage.jsx | ✅ | ✅ | ✅ | ✅ ĐÃ GẮN |
| **5. Partial Refund** | AdminDisputeDetailPage.jsx | ✅ | ✅ | ✅ | ✅ ĐÃ GẮN |

**✅ KẾT LUẬN CHUNG:** FE đã gắn đầy đủ các API calls và validation cần thiết.

---

## ⚠️ BACKEND CẦN IMPLEMENT

### 1. Complete Order API (`PUT /api/v1/buyer/orders/{orderId}/complete`)

**Logic cần implement:**

```javascript
// 1. Tính số tiền shop nhận
const storeReceiveAmount = 0.95 * (productPrice - storeDiscountAmount) + shippingFee;

// 2. Chuyển từ pendingAmount → Balance
await walletService.transferPendingToBalance(storeId, storeReceiveAmount, orderId);

// 3. Cộng hoa hồng cho admin
const platformCommission = 0.05 * (productPrice - storeDiscountAmount);
await adminService.addRevenue({
  orderId,
  amount: platformCommission,
  type: 'COMMISSION',
  description: `Hoa hồng từ đơn hàng ${orderId}`
});

// 4. Trừ platformDiscountAmount nếu có
if (platformDiscountAmount > 0) {
  await adminService.addRevenue({
    orderId,
    amount: -platformDiscountAmount,
    type: 'PLATFORM_DISCOUNT_LOSS',
    description: `Giảm giá sàn cho đơn hàng ${orderId}`
  });
}
```

**Code hiện tại:** `buyer-BE/src/controllers/orderController.js`
- ✅ Đã có code tính `storeReceiveAmount`
- ✅ Đã gọi `transferToStoreWallet()`
- ❌ **THIẾU:** Không có code cộng hoa hồng cho admin
- ❌ **THIẾU:** Không có code trừ `platformDiscountAmount`
- ❌ **THIẾU:** Không có code chuyển từ `pendingAmount` → `Balance` (chỉ gọi API B2C)

---

### 2. Confirm Return OK API (`PUT /api/v1/b2c/returns/store/{storeId}/returnRequest/{returnRequestId}/confirm-ok`)

**Logic cần implement:**

```javascript
// 1. Tính số tiền cần trừ từ shop
const refundAmount = 0.95 * (productPrice - storeDiscountAmount) + shippingFee;

// 2. Trừ pendingAmount từ ví shop
await walletService.subtractPendingAmount(storeId, refundAmount, returnRequestId);

// 3. Cộng hoa hồng cho admin (tiền phạt)
const platformCommission = 0.05 * (productPrice - storeDiscountAmount);
await adminService.addRevenue({
  returnRequestId,
  amount: platformCommission,
  type: 'PENALTY_COMMISSION',
  description: `Tiền phạt shop từ return request ${returnRequestId}`
});

// 4. Hoàn tiền cho khách
await buyerService.refundToBuyer({
  userId: order.userId,
  amount: totalPaidAmount, // Tổng số tiền khách đã thanh toán
  orderId: order.id,
  returnRequestId: returnRequestId
});
```

**Code hiện tại:** ❌ **KHÔNG TÌM THẤY** backend code xử lý endpoint này.

---

### 3. Resolve Dispute API (`PUT /api/v1/admin/disputes/{disputeId}/resolve`)

**Logic cần implement:**

**Trường hợp: APPROVE_RETURN (Khách thắng)**
```javascript
// 1. Trừ pendingAmount từ shop
const refundAmount = 0.95 * (productPrice - storeDiscountAmount) + shippingFee;
await walletService.subtractPendingAmount(storeId, refundAmount, disputeId);

// 2. Cộng hoa hồng cho admin (tiền phạt)
const platformCommission = 0.05 * (productPrice - storeDiscountAmount);
await adminService.addRevenue({
  disputeId,
  amount: platformCommission,
  type: 'PENALTY_COMMISSION',
  description: `Tiền phạt shop từ dispute ${disputeId}`
});

// 3. Hoàn tiền đầy đủ cho khách
const totalRefund = productPrice - storeDiscountAmount - platformDiscountAmount + shippingFee;
await buyerService.refundToBuyer({
  userId: order.userId,
  amount: totalRefund,
  orderId: order.id,
  disputeId: disputeId
});
```

**Trường hợp: REJECT_RETURN (Shop thắng)**
```javascript
// 1. Chuyển pendingAmount → Balance
const storeReceiveAmount = 0.95 * (productPrice - storeDiscountAmount) + shippingFee;
await walletService.transferPendingToBalance(storeId, storeReceiveAmount, disputeId);

// 2. Cộng hoa hồng cho admin
const platformCommission = 0.05 * (productPrice - storeDiscountAmount);
await adminService.addRevenue({
  disputeId,
  amount: platformCommission,
  type: 'COMMISSION',
  description: `Hoa hồng từ dispute ${disputeId}`
});

// 3. Trừ platformDiscountAmount nếu có
if (platformDiscountAmount > 0) {
  await adminService.addRevenue({
    disputeId,
    amount: -platformDiscountAmount,
    type: 'PLATFORM_DISCOUNT_LOSS',
    description: `Giảm giá sàn cho dispute ${disputeId}`
  });
}
```

**Code hiện tại:** ❌ **KHÔNG TÌM THẤY** backend code xử lý endpoint này.

---

### 4. Resolve Quality Dispute API (`PUT /api/v1/admin/disputes/{disputeId}/resolve-quality`)

**Logic cần implement:**

**Trường hợp: APPROVE_STORE (Shop thắng)**
```javascript
// Giống REJECT_RETURN ở trên
```

**Trường hợp: REJECT_STORE (Khách thắng)**
```javascript
// Giống APPROVE_RETURN ở trên
```

**Trường hợp: PARTIAL_REFUND (Hoàn tiền một phần)**
```javascript
// 1. Trừ partialRefundAmount từ pendingAmount
await walletService.subtractPendingAmount(storeId, partialRefundAmount, disputeId);

// 2. Chuyển phần còn lại từ pendingAmount → Balance
const remainingAmount = (0.95 * (productPrice - storeDiscountAmount) + shippingFee) - partialRefundAmount;
await walletService.transferPendingToBalance(storeId, remainingAmount, disputeId);

// 3. Cộng hoa hồng cho admin
const platformCommission = 0.05 * (productPrice - storeDiscountAmount);
await adminService.addRevenue({
  disputeId,
  amount: platformCommission,
  type: 'COMMISSION',
  description: `Hoa hồng từ dispute ${disputeId}`
});

// 4. Trừ platformDiscountAmount nếu có
if (platformDiscountAmount > 0) {
  await adminService.addRevenue({
    disputeId,
    amount: -platformDiscountAmount,
    type: 'PLATFORM_DISCOUNT_LOSS',
    description: `Giảm giá sàn cho dispute ${disputeId}`
  });
}

// 5. Hoàn tiền một phần cho khách
await buyerService.refundToBuyer({
  userId: order.userId,
  amount: partialRefundAmount,
  orderId: order.id,
  disputeId: disputeId
});
```

**Code hiện tại:** ❌ **KHÔNG TÌM THẤY** backend code xử lý endpoint này.

---

## 📝 TỔNG KẾT

### ✅ FE ĐÃ LÀM:
1. ✅ Gắn đầy đủ các API calls
2. ✅ Validate dữ liệu trước khi gửi
3. ✅ Xử lý response và hiển thị thông báo
4. ✅ Validate số tiền hoàn một phần đúng công thức

### ❌ BACKEND CẦN LÀM:
1. ❌ Implement logic xử lý tiền trong `completeOrder()`
2. ❌ Implement logic xử lý tiền trong `confirmReturnOK()`
3. ❌ Implement logic xử lý tiền trong `resolveDispute()`
4. ❌ Implement logic xử lý tiền trong `resolveQualityDispute()`
5. ❌ Tạo các service functions:
   - `transferPendingToBalance()` - Chuyển từ pendingAmount → Balance
   - `subtractPendingAmount()` - Trừ pendingAmount
   - `addRevenue()` - Cộng revenue cho admin
   - `refundToBuyer()` - Hoàn tiền cho khách

---

**Ngày kiểm tra:** 26/12/2024  
**Trạng thái:** ⚠️ FE ĐÃ GẮN ĐẦY ĐỦ - BACKEND CẦN IMPLEMENT LOGIC TIỀN




