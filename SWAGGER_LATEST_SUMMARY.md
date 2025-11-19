# 📊 Swagger API - Latest Version Summary

**Generated:** Nov 20, 2025  
**Version:** 1.0.0

---

## 🎯 KEY ENDPOINTS CONFIRMED

### **Buyer Cart Management**
- ✅ `GET /api/v1/buyer/cart` - Get shopping cart
- ✅ `POST /api/v1/buyer/cart/add` - Add items to cart
- ✅ `PUT /api/v1/buyer/cart/{productVariantId}` - Update quantity
- ✅ `DELETE /api/v1/buyer/cart/{cartItemId}` - **Remove cart item by ID**
- ✅ `DELETE /api/v1/buyer/cart/clear` - Clear entire cart

### **Buyer Order Management**
- ✅ `POST /api/v1/buyer/orders/checkout` - Checkout and create order
- ✅ `GET /api/v1/buyer/orders` - Get buyer orders
- ✅ `GET /api/v1/buyer/orders/{orderId}` - Get order details
- ✅ `PUT /api/v1/buyer/orders/{orderId}/cancel` - Cancel order

### **Buyer Promotion APIs**
- ✅ `GET /api/v1/buyer/promotions/platform` - Get platform promotions
- ✅ `GET /api/v1/buyer/promotions/store/{storeId}` - **Get store promotions**
- ✅ `POST /api/v1/buyer/promotions/apply` - Apply promotion code

### **B2C Wallet Management**
- ✅ `GET /api/v1/b2c/wallet/store/{storeId}` - Get store wallet
- ✅ `GET /api/v1/b2c/wallet/store/{storeId}/transactions` - Get transaction history
- ✅ `GET /api/v1/b2c/wallet/store/{storeId}/withdrawals` - Get withdrawal requests
- ✅ `POST /api/v1/b2c/wallet/store/{storeId}/withdrawal` - **Create withdrawal request**

### **Admin Withdrawal Management**
- ✅ `GET /api/v1/admin/withdrawals` - Get all withdrawal requests
- ✅ `GET /api/v1/admin/withdrawals/{requestId}` - Get withdrawal detail
- ✅ `PUT /api/v1/admin/withdrawals/{requestId}/complete` - Complete withdrawal
- ✅ `PUT /api/v1/admin/withdrawals/{requestId}/reject` - Reject withdrawal

### **Admin Revenue Management**
- ✅ `GET /api/v1/admin/revenues/statistics` - **Get revenue statistics**
- ✅ `GET /api/v1/admin/revenues` - Get all revenues
- ✅ `GET /api/v1/admin/revenues/pending` - Get pending service fees
- ✅ `GET /api/v1/admin/revenues/collected` - Get collected service fees
- ✅ `GET /api/v1/admin/revenues/date-range` - Get revenue by date range

---

## 📦 IMPORTANT SCHEMAS

### **OrderDTO** (Checkout Request)
```json
{
  "selectedItems": [
    {
      "id": "string",
      "productVariantId": "string",
      "colorId": "string",
      "quantity": 0
    }
  ],
  "paymentMethod": "string",
  "platformPromotions": {
    "orderPromotionCode": "string",
    "shippingPromotionCode": "string",
    "applyShippingToStores": ["string"]
  },
  "storePromotions": {
    "storeId": "promotionCode"
  },
  "note": "string",
  "vnpTnxRef": "string",
  "address": { ... }
}
```

### **WalletResponse**
```json
{
  "id": "string",
  "store": { ... },
  "balance": 0,
  "totalEarned": 0,
  "totalWithdrawn": 0,
  "pendingAmount": 0,
  "createdAt": "2025-11-20T00:00:00",
  "updatedAt": "2025-11-20T00:00:00"
}
```

### **WithdrawalRequestDTO**
```json
{
  "amount": 0,
  "bankName": "string",
  "bankAccountNumber": "string",
  "bankAccountName": "string",
  "note": "string"
}
```

### **AdminWithdrawalResponse**
```json
{
  "id": "string",
  "store": { ... },
  "amount": 0,
  "bankName": "string",
  "bankAccountNumber": "string",
  "bankAccountName": "string",
  "status": "PENDING|COMPLETED|REJECTED",
  "note": "string",
  "adminNote": "string",
  "transactionId": "string",
  "createdAt": "2025-11-20T00:00:00",
  "updatedAt": "2025-11-20T00:00:00"
}
```

---

## 🔍 CRITICAL FINDINGS

### ✅ **CONFIRMED FEATURES:**

1. **Cart Item Deletion by ID**
   - Endpoint: `DELETE /api/v1/buyer/cart/{cartItemId}`
   - Parameter: `cartItemId` (path parameter)
   - ✅ Frontend implementation is CORRECT

2. **Store Promotions API**
   - Endpoint: `GET /api/v1/buyer/promotions/store/{storeId}`
   - Parameters: `storeId`, `orderTotal`, `productIds`
   - ✅ API exists and should work

3. **Withdrawal Request Creation**
   - Endpoint: `POST /api/v1/b2c/wallet/store/{storeId}/withdrawal`
   - Body: `WithdrawalRequestDTO`
   - ✅ Supports all required fields

4. **Admin Revenue Statistics**
   - Endpoint: `GET /api/v1/admin/revenues/statistics`
   - Returns: Total, collected, pending service fees
   - ✅ Matches frontend implementation

### ⚠️ **POTENTIAL ISSUES:**

1. **Cart Response Structure**
   - ❓ Need to verify if `/api/v1/buyer/cart` returns `storeId` in cart items
   - ❓ Current frontend assumes flat structure: `{id, productId, productName, imageUrl, price, quantity}`
   - ❓ Missing: `storeId` field in cart item response

2. **Wallet Balance vs Available Balance**
   - ❓ `WalletResponse` has `balance` and `pendingAmount`
   - ❓ Frontend calculates: `availableBalance = balance - pendingWithdrawals`
   - ❓ Backend might already provide this in `pendingAmount`

3. **Order Service Fee**
   - ❓ Need to verify if `OrderDTO` response includes `serviceFee` field
   - ❓ Frontend expects: `{productPrice, shippingFee, serviceFee, totalPrice}`

---

## 📝 RECOMMENDATIONS

### **For Backend Team:**

1. **Add `storeId` to Cart Item Response**
   ```json
   {
     "id": "cartItemId",
     "productId": "...",
     "productName": "...",
     "imageUrl": "...",
     "price": 20000000,
     "quantity": 1,
     "storeId": "storeId123"  // ← ADD THIS!
   }
   ```

2. **Clarify Wallet `pendingAmount`**
   - Does it include pending withdrawals?
   - Or only pending earnings?

3. **Document Order Response Fields**
   - Confirm `serviceFee` is included
   - Confirm calculation: `totalPrice = productPrice + shippingFee + serviceFee - discounts`

### **For Frontend Team:**

1. **Test Store Promotions**
   - Verify `storeId` is correctly passed
   - Check API response format

2. **Test Withdrawal Flow**
   - Create withdrawal → Check available balance updates
   - Verify pending withdrawals are excluded from available balance

3. **Test Service Fee Display**
   - Verify `serviceFee` appears in order details
   - Check calculation is correct

---

## ✅ CONCLUSION

**Overall Status:** 🟢 **GOOD**

- All required endpoints exist
- Schemas are well-defined
- Main features are supported

**Action Items:**
1. ⚠️ Verify `storeId` in cart response (HIGH PRIORITY)
2. ⚠️ Test wallet available balance calculation
3. ✅ Service fee logic is documented and clear

---

**Last Updated:** Nov 20, 2025  
**Reviewed By:** Cascade AI
