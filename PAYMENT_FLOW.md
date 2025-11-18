# 💳 VNPAY PAYMENT INTEGRATION - FLOW & IMPLEMENTATION PLAN

## 📋 OVERVIEW

Backend đã implement VNPay payment gateway với 3 APIs chính:
1. **Create Payment URL** - Tạo link thanh toán VNPay
2. **Query Payment** - Kiểm tra trạng thái thanh toán
3. **Refund Payment** - Hoàn tiền (admin only)
---

## 🔄 PAYMENT FLOW (User Journey)

### **BƯỚC 1: CHECKOUT (Tạo đơn hàng)**
```
User ở trang Cart → Click "Thanh toán"
  ↓
Trang Checkout:
  - Chọn sản phẩm từ cart (selectedItems)
  - Nhập địa chỉ giao hàng (address)
  - Chọn phương thức thanh toán (paymentMethod)
    • COD (Cash on Delivery) - Thanh toán khi nhận hàng
    • VNPAY - Thanh toán online qua VNPay
  - Áp dụng mã giảm giá (optional)
  - Ghi chú đơn hàng (optional)
  ↓
Click "Đặt hàng"
  ↓
POST /api/v1/buyer/orders/checkout
Body: {
  selectedItems: [...],
  paymentMethod: "VNPAY" hoặc "COD",
  address: {...},
  platformPromotions: {...},
  storePromotions: {...},
  note: "..."
}
  ↓
Response: {
  success: true,
  data: {
    orderId: "xxx",
    totalAmount: 1000000,
    ...
  }
}
```

### **BƯỚC 2A: NẾU CHỌN COD**
```
Order created với status = PENDING
  ↓
Redirect về trang "Đơn hàng của tôi"
  ↓
Chờ store xác nhận → CONFIRMED → SHIPPING → DELIVERED
```

### **BƯỚC 2B: NẾU CHỌN VNPAY**
```
Order created với status = PENDING
  ↓
Tự động gọi API tạo payment URL:
POST /api/v1/buyer/payments/create_payment_url
Body: {
  amount: 1000000,
  bankCode: "NCB" (optional - ngân hàng cụ thể),
  language: "vn" (vn hoặc en)
}
  ↓
Response: {
  success: true,
  data: {
    paymentUrl: "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?..."
  }
}
  ↓
Redirect user đến paymentUrl (VNPay website)
  ↓
User nhập thông tin thẻ/tài khoản trên VNPay
  ↓
VNPay xử lý thanh toán
  ↓
VNPay redirect về frontend với query params:
  - vnp_ResponseCode (00 = success)
  - vnp_TxnRef (mã giao dịch)
  - vnp_Amount
  - vnp_TransactionNo
  - ...
```

### **BƯỚC 3: XỬ LÝ KẾT QUẢ THANH TOÁN**
```
Frontend nhận callback từ VNPay
  ↓
Parse query params
  ↓
Gọi API query để verify:
POST /api/v1/buyer/payments/query
Body: {
  vnp_TxnRef: "...",
  vnp_TransDate: "..."
}
  ↓
Response: {
  success: true,
  data: {
    status: "SUCCESS" hoặc "FAILED",
    amount: 1000000,
    ...
  }
}
  ↓
Nếu SUCCESS:
  - Hiển thị "Thanh toán thành công!"
  - Order status tự động update (backend handle)
  - Redirect về trang "Đơn hàng của tôi"
  ↓
Nếu FAILED:
  - Hiển thị "Thanh toán thất bại!"
  - Order vẫn ở status PENDING
  - User có thể thử thanh toán lại hoặc hủy đơn
```

---

## 🎯 IMPLEMENTATION PLAN

### **PHASE 1: CHECKOUT PAGE (Ưu tiên cao)**

**Files cần tạo/sửa:**
1. `src/pages/checkout/CheckoutPage.jsx` - Trang checkout chính
2. `src/services/buyer/orderService.js` - API checkout
3. `src/services/buyer/paymentService.js` - API payment

**Chức năng:**
- ✅ Hiển thị sản phẩm đã chọn từ cart
- ✅ Form nhập địa chỉ giao hàng
- ✅ Chọn payment method (COD/VNPAY)
- ✅ Tính tổng tiền (sản phẩm + ship - giảm giá)
- ✅ Nút "Đặt hàng"
- ✅ Handle checkout API call

**UI Design:**
```
┌─────────────────────────────────────┐
│  THANH TOÁN                         │
├─────────────────────────────────────┤
│  📦 Sản phẩm đã chọn (3 items)      │
│  ┌───────────────────────────────┐  │
│  │ [Img] Product 1  x2  200,000₫ │  │
│  │ [Img] Product 2  x1  150,000₫ │  │
│  └───────────────────────────────┘  │
├─────────────────────────────────────┤
│  📍 Địa chỉ giao hàng               │
│  [Tên người nhận]                   │
│  [Số điện thoại]                    │
│  [Địa chỉ chi tiết]                 │
├─────────────────────────────────────┤
│  💳 Phương thức thanh toán          │
│  ○ COD - Thanh toán khi nhận hàng   │
│  ● VNPay - Thanh toán online        │
├─────────────────────────────────────┤
│  💰 Tổng cộng                       │
│  Tạm tính:        350,000₫         │
│  Phí ship:         30,000₫         │
│  Giảm giá:        -50,000₫         │
│  ─────────────────────────          │
│  Tổng:            330,000₫         │
├─────────────────────────────────────┤
│  [← Quay lại]  [Đặt hàng →]        │
└─────────────────────────────────────┘
```

---

### **PHASE 2: PAYMENT SERVICE (Ưu tiên cao)**

**File: `src/services/buyer/paymentService.js`**

```javascript
import api from '../common/api';

/**
 * 1. TẠO PAYMENT URL
 * POST /api/v1/buyer/payments/create_payment_url
 */
export const createPaymentUrl = async (paymentData) => {
  try {
    const response = await api.post('/api/v1/buyer/payments/create_payment_url', {
      amount: paymentData.amount,
      bankCode: paymentData.bankCode || '', // Optional
      language: paymentData.language || 'vn',
    });
    
    return {
      success: true,
      data: response.data.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || 'Không thể tạo link thanh toán',
    };
  }
};

/**
 * 2. QUERY PAYMENT STATUS
 * POST /api/v1/buyer/payments/query
 */
export const queryPayment = async (queryData) => {
  try {
    const response = await api.post('/api/v1/buyer/payments/query', queryData);
    
    return {
      success: true,
      data: response.data.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || 'Không thể kiểm tra thanh toán',
    };
  }
};

/**
 * 3. REFUND PAYMENT (Admin only)
 * POST /api/v1/buyer/payments/refund
 */
export const refundPayment = async (refundData) => {
  try {
    const response = await api.post('/api/v1/buyer/payments/refund', refundData);
    
    return {
      success: true,
      data: response.data.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || 'Không thể hoàn tiền',
    };
  }
};
```

---

### **PHASE 3: PAYMENT CALLBACK PAGE (Ưu tiên cao)**

**File: `src/pages/payment/PaymentCallback.jsx`**

```javascript
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { queryPayment } from '../../services/buyer/paymentService';
import { useToast } from '../../hooks/useToast';

const PaymentCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [status, setStatus] = useState('processing'); // processing, success, failed
  
  useEffect(() => {
    verifyPayment();
  }, []);
  
  const verifyPayment = async () => {
    // Parse VNPay response params
    const vnp_ResponseCode = searchParams.get('vnp_ResponseCode');
    const vnp_TxnRef = searchParams.get('vnp_TxnRef');
    const vnp_TransDate = searchParams.get('vnp_TransactionDate');
    
    // Quick check
    if (vnp_ResponseCode === '00') {
      // Success - verify với backend
      const result = await queryPayment({
        vnp_TxnRef,
        vnp_TransDate,
      });
      
      if (result.success && result.data.status === 'SUCCESS') {
        setStatus('success');
        toast?.success('Thanh toán thành công!');
        
        // Redirect sau 2s
        setTimeout(() => {
          navigate('/orders');
        }, 2000);
      } else {
        setStatus('failed');
        toast?.error('Xác thực thanh toán thất bại!');
      }
    } else {
      // Failed
      setStatus('failed');
      toast?.error('Thanh toán thất bại!');
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center">
      {status === 'processing' && (
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang xác thực thanh toán...</p>
        </div>
      )}
      
      {status === 'success' && (
        <div className="text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-green-600">Thanh toán thành công!</h2>
          <p className="text-gray-600 mt-2">Đang chuyển đến trang đơn hàng...</p>
        </div>
      )}
      
      {status === 'failed' && (
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-red-600">Thanh toán thất bại!</h2>
          <p className="text-gray-600 mt-2">Vui lòng thử lại</p>
          <button
            onClick={() => navigate('/orders')}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg"
          >
            Về trang đơn hàng
          </button>
        </div>
      )}
    </div>
  );
};

export default PaymentCallback;
```

**Route cần thêm trong App.jsx:**
```javascript
<Route path="/payment/callback" element={<PaymentCallback />} />
```

---

### **PHASE 4: UPDATE CHECKOUT FLOW**

**File: `src/pages/checkout/CheckoutPage.jsx`**

```javascript
const handleCheckout = async () => {
  // 1. Create order
  const orderResult = await checkout(orderData);
  
  if (!orderResult.success) {
    toast?.error('Không thể tạo đơn hàng');
    return;
  }
  
  // 2. Nếu chọn VNPay → tạo payment URL
  if (paymentMethod === 'VNPAY') {
    const paymentResult = await createPaymentUrl({
      amount: totalAmount,
      language: 'vn',
    });
    
    if (paymentResult.success) {
      // Redirect đến VNPay
      window.location.href = paymentResult.data.paymentUrl;
    } else {
      toast?.error('Không thể tạo link thanh toán');
    }
  } else {
    // COD → redirect về orders
    toast?.success('Đặt hàng thành công!');
    navigate('/orders');
  }
};
```

---

## 📊 APIS SUMMARY

### **1. Checkout Order**
```
POST /api/v1/buyer/orders/checkout
Auth: Required
Body: {
  selectedItems: [
    { variantId: "xxx", quantity: 2 }
  ],
  paymentMethod: "VNPAY" | "COD",
  address: {
    province: "...",
    ward: "...",
    homeAddress: "..."
  },
  platformPromotions: {...},
  storePromotions: {...},
  note: "..."
}
Response: {
  success: true,
  data: {
    orderId: "xxx",
    totalAmount: 1000000,
    ...
  }
}
```

### **2. Create Payment URL**
```
POST /api/v1/buyer/payments/create_payment_url
Auth: Required
Body: {
  amount: 1000000,
  bankCode: "NCB" (optional),
  language: "vn" | "en"
}
Response: {
  success: true,
  data: {
    paymentUrl: "https://sandbox.vnpayment.vn/..."
  }
}
```

### **3. Query Payment**
```
POST /api/v1/buyer/payments/query
Auth: Required
Body: {
  vnp_TxnRef: "...",
  vnp_TransDate: "..."
}
Response: {
  success: true,
  data: {
    status: "SUCCESS" | "FAILED",
    amount: 1000000,
    ...
  }
}
```

---

## 🎯 RECOMMENDED IMPLEMENTATION ORDER

### **BẮT ĐẦU TỪ ĐÂY:**

1. **Tạo Payment Service** ✅ (Dễ, độc lập)
   - File: `paymentService.js`
   - 3 functions: createPaymentUrl, queryPayment, refundPayment

2. **Tạo Payment Callback Page** ✅ (Dễ, quan trọng)
   - File: `PaymentCallback.jsx`
   - Handle VNPay redirect
   - Verify payment status

3. **Update Checkout Page** ⚠️ (Trung bình, phụ thuộc cart)
   - Thêm payment method selector
   - Handle VNPay flow
   - Integrate với payment service

4. **Testing** 🧪
   - Test COD flow
   - Test VNPay sandbox
   - Test payment callback

---

## 🚀 NEXT STEPS

**BẠN MUỐN BẮT ĐẦU TỪ ĐÂU?**

**Option A:** Tạo Payment Service trước (nhanh, dễ) ✅ RECOMMENDED
**Option B:** Tạo Checkout Page trước (phức tạp hơn)
**Option C:** Tạo Payment Callback Page trước (cần test VNPay)

**GỢI Ý:** Làm theo thứ tự 1 → 2 → 3 → 4 để dễ test và debug!
