# 📊 SWAGGER API CHANGES - 27/11/2024

## 🆕 **THAY ĐỔI CHÍNH:**

### **1. ✅ ADMIN STATISTICS - ĐỔI ENDPOINT**
**Trước (26/11):** `/api/v1/admin/revenue/*`  
**Sau (27/11):** `/api/v1/admin/statistics/*`

### **2. 🆕 SHOP STATISTICS - NHÓM API MỚI**
**Tag mới:** `Shop Statistics Management`  
**Endpoints:** `/api/v1/b2c/statistics/*`

### **3. ❌ BỎ 2 API CŨ:**
- ❌ `/api/v1/b2c/orders/statistics?storeId={storeId}`
- ❌ `/api/v1/b2c/order/revenue?storeId={storeId}`

### **4. ✅ USER REGISTRATION - THÊM FIELDS**
**Thêm vào `UserRegisterDTO`:**
- `phone` (optional)
- `dateOfBirth` (optional, type: `date` - chỉ ngày/tháng/năm)

### **5. ✅ USER PROFILE - API MỚI**
**Endpoint:** `PUT /api/v1/users/profile`  
**DTO:** `UpdateUserDTO`
- `fullName` (required)
- `phone` (required)
- `dateOfBirth` (required, type: `date`)

---

## 📋 **CHI TIẾT THAY ĐỔI:**

### **1️⃣ ADMIN STATISTICS APIs (Đổi từ /admin/revenue)**

| Endpoint Cũ (26/11) | Endpoint Mới (27/11) | Mô tả |
|---------------------|----------------------|-------|
| ❌ Không có | ✅ `GET /api/v1/admin/statistics/overview` | Tổng quan thống kê |
| ✅ `GET /api/v1/admin/revenue/service-fees` | ✅ `GET /api/v1/admin/statistics/service-fees` | Danh sách phí dịch vụ |
| ✅ `GET /api/v1/admin/revenue/revenue` | ✅ `GET /api/v1/admin/statistics/revenue` | Tổng doanh thu |
| ✅ `GET /api/v1/admin/revenue/platform-discount-losses` | ✅ `GET /api/v1/admin/statistics/platform-discount-losses` | Tổng lỗ từ giảm giá |
| ✅ `GET /api/v1/admin/revenue/date-range` | ✅ `GET /api/v1/admin/statistics/date-range` | Doanh thu theo khoảng thời gian |
| ✅ `GET /api/v1/admin/revenue/chart-data` | ✅ `GET /api/v1/admin/statistics/chart-data` | Dữ liệu biểu đồ |

**Tổng:** 6 endpoints (5 đổi tên, 1 mới)

---

### **2️⃣ SHOP STATISTICS APIs (MỚI - Thay thế 2 API cũ)**

#### **🆕 APIs Mới:**

| Endpoint | Method | Mô tả |
|----------|--------|-------|
| `GET /api/v1/b2c/statistics/overview` | GET | **Tổng quan thống kê shop** |
| `GET /api/v1/b2c/statistics/revenue/chart-data` | GET | **Biểu đồ doanh thu** |
| `GET /api/v1/b2c/statistics/orders/count-by-status` | GET | **Số lượng đơn hàng theo trạng thái** |
| `GET /api/v1/b2c/statistics/orders/chart-data` | GET | **Biểu đồ đơn hàng** |
| `GET /api/v1/b2c/statistics/variant/count-by-stock-status` | GET | **Số lượng variant theo trạng thái stock** |

**Tổng:** 5 endpoints mới

#### **Parameters chung:**
- `storeId` (query, required) - ID của cửa hàng
- `period` (query) - WEEK/MONTH/YEAR (cho chart-data)

---

### **3️⃣ USER REGISTRATION - Thêm Fields**

#### **Schema: `UserRegisterDTO`**

**Trước (26/11):**
```json
{
  "email": "string",
  "password": "string",
  "retype_password": "string",
  "full_name": "string"
}
```

**Sau (27/11):**
```json
{
  "email": "string",
  "password": "string",
  "retype_password": "string",
  "full_name": "string",
  "phone": "string",           // ← MỚI (optional)
  "dateOfBirth": "2000-01-01"  // ← MỚI (optional, format: date)
}
```

---

### **4️⃣ USER PROFILE - API Cập Nhật**

#### **🆕 Endpoint Mới:**
```
PUT /api/v1/users/profile
```

#### **Schema: `UpdateUserDTO`**
```json
{
  "fullName": "string",        // required
  "phone": "string",           // required
  "dateOfBirth": "2000-01-01"  // required, format: date
}
```

#### **Mô tả:**
- Cập nhật thông tin user hiện tại
- Tất cả fields đều **required**
- `dateOfBirth`: Chỉ ngày/tháng/năm (không có giờ/phút/giây)

---

## 🔧 **FRONTEND CẦN CẬP NHẬT:**

### **1. Admin Revenue Service → Admin Statistics Service**

**File:** `src/services/admin/adminRevenueService.js`  
**→ Đổi tên:** `src/services/admin/adminStatisticsService.js`

**Endpoints cần sửa:**
```javascript
// CŨ:
GET /api/v1/admin/revenue/service-fees
GET /api/v1/admin/revenue/revenue
GET /api/v1/admin/revenue/platform-discount-losses
GET /api/v1/admin/revenue/date-range
GET /api/v1/admin/revenue/chart-data

// MỚI:
GET /api/v1/admin/statistics/overview          // ← THÊM MỚI
GET /api/v1/admin/statistics/service-fees
GET /api/v1/admin/statistics/revenue
GET /api/v1/admin/statistics/platform-discount-losses
GET /api/v1/admin/statistics/date-range
GET /api/v1/admin/statistics/chart-data
```

---

### **2. Shop Statistics Service (MỚI)**

**File:** `src/services/b2c/shopStatisticsService.js` ← **TẠO MỚI**

**Endpoints:**
```javascript
GET /api/v1/b2c/statistics/overview?storeId={storeId}
GET /api/v1/b2c/statistics/revenue/chart-data?storeId={storeId}&period={period}
GET /api/v1/b2c/statistics/orders/count-by-status?storeId={storeId}
GET /api/v1/b2c/statistics/orders/chart-data?storeId={storeId}&period={period}
GET /api/v1/b2c/statistics/variant/count-by-stock-status?storeId={storeId}
```

**Thay thế:**
- ❌ `/api/v1/b2c/orders/statistics?storeId={storeId}`
- ❌ `/api/v1/b2c/order/revenue?storeId={storeId}`

---

### **3. Auth Service - Registration**

**File:** `src/services/common/authService.js`

**Function:** `register()`

**Cập nhật:**
```javascript
// CŨ:
export const register = async ({ fullName, email, password, confirmPassword }) => {
  const response = await api.post('/api/v1/users/register', {
    full_name: fullName,
    email: email,
    password: password,
    retype_password: confirmPassword,
  });
  // ...
};

// MỚI:
export const register = async ({ 
  fullName, 
  email, 
  password, 
  confirmPassword,
  phone,        // ← THÊM (optional)
  dateOfBirth   // ← THÊM (optional)
}) => {
  const response = await api.post('/api/v1/users/register', {
    full_name: fullName,
    email: email,
    password: password,
    retype_password: confirmPassword,
    phone: phone,                    // ← THÊM
    dateOfBirth: dateOfBirth,        // ← THÊM (format: YYYY-MM-DD)
  });
  // ...
};
```

---

### **4. Auth Service - Update Profile (MỚI)**

**File:** `src/services/common/authService.js`

**Function mới:**
```javascript
/**
 * UPDATE USER PROFILE
 * PUT /api/v1/users/profile
 */
export const updateProfile = async ({ fullName, phone, dateOfBirth }) => {
  try {
    const response = await api.put('/api/v1/users/profile', {
      fullName: fullName,
      phone: phone,
      dateOfBirth: dateOfBirth, // format: YYYY-MM-DD
    });
    
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
};
```

---

### **5. Pages cần cập nhật:**

#### **Admin:**
- ✅ `src/pages/admin/AdminRevenue.jsx` → Đổi tên `AdminStatistics.jsx`
- ✅ Update imports: `adminRevenueService` → `adminStatisticsService`
- ✅ Update API calls: `/admin/revenue/*` → `/admin/statistics/*`

#### **Store:**
- ✅ `src/pages/store/StoreAnalytics.jsx` (nếu có)
- ✅ Tạo mới hoặc update để dùng `/api/v1/b2c/statistics/*`

#### **Auth:**
- ✅ `src/pages/auth/AuthPage.jsx` - Thêm fields `phone` và `dateOfBirth` vào form đăng ký
- ✅ `src/pages/profile/ProfilePage.jsx` - Thêm form cập nhật profile

---

## 📊 **TỔNG KẾT:**

### **Thay đổi:**
- ✅ **6 endpoints** đổi tên: `/admin/revenue/*` → `/admin/statistics/*`
- ✅ **1 endpoint** mới: `GET /admin/statistics/overview`
- ✅ **5 endpoints** mới: `/b2c/statistics/*` (thay thế 2 API cũ)
- ✅ **2 fields** mới trong registration: `phone`, `dateOfBirth`
- ✅ **1 API** mới: `PUT /users/profile`

### **Files cần tạo/sửa:**
1. ✅ Đổi tên: `adminRevenueService.js` → `adminStatisticsService.js`
2. ✅ Tạo mới: `shopStatisticsService.js`
3. ✅ Cập nhật: `authService.js` (register + updateProfile)
4. ✅ Cập nhật: `AuthPage.jsx` (form đăng ký)
5. ✅ Cập nhật: `ProfilePage.jsx` (form cập nhật)
6. ✅ Đổi tên: `AdminRevenue.jsx` → `AdminStatistics.jsx`

---

## 🎯 **PRIORITY:**

### **HIGH:**
1. ✅ Đổi Admin Revenue → Admin Statistics (đang dùng)
2. ✅ Tạo Shop Statistics Service (thay thế API cũ)

### **MEDIUM:**
3. ✅ Thêm phone/dateOfBirth vào registration
4. ✅ Tạo API updateProfile

### **LOW:**
5. ✅ Update UI forms

---

**Anh muốn em bắt đầu implement từ đâu ạ?** 🚀
