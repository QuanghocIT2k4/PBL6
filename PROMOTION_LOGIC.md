# 🎯 PROMOTION LOGIC - ADMIN & STORE

## 📋 **PROMOTION STATUS (Theo Swagger)**

### **CÁC STATUS CÓ THỂ CÓ:**

**Backend DB (chỉ lưu 2 status):**
```
1. ACTIVE - Đang hoạt động
2. INACTIVE - Tạm dừng (bị deactivate)
```

**Frontend tự check thêm (dựa vào startDate/endDate):**
```
3. UPCOMING - Sắp diễn ra (startDate > now)
4. EXPIRED - Đã hết hạn (endDate < now)
```

**LƯU Ý:** 
- Backend KHÔNG có status "PAUSED" - chỉ có INACTIVE!
- Backend KHÔNG có UPCOMING/EXPIRED trong DB - Frontend phải tự check!

---

## 🔄 **QUY TRÌNH TẠO & QUẢN LÝ KHUYẾN MÃI**

### **1️⃣ STORE TẠO KHUYẾN MÃI MỚI:**

```
POST /api/v1/b2c/promotions
Body: {
  title: "...",
  code: "...",
  type: "PERCENTAGE" | "FIXED_AMOUNT",
  discountValue: 10,
  startDate: "2025-11-19T00:00:00",
  endDate: "2025-11-30T23:59:59",
  ...
}
  ↓
Response: {
  success: true,
  data: {
    id: "xxx",
    status: "INACTIVE",  ← MẶC ĐỊNH LÀ INACTIVE!
    ...
  }
}
```

**⚠️ QUAN TRỌNG:**
- Khi Store tạo promotion mới → Status mặc định = **INACTIVE**
- Store phải **ACTIVATE** thủ công để khuyến mãi hoạt động
- **KHÔNG TỰ ĐỘNG ACTIVE** khi tạo!

---

### **2️⃣ STORE ACTIVATE KHUYẾN MÃI:**

```
PUT /api/v1/b2c/promotions/{promotionId}/activate
  ↓
Status: INACTIVE → ACTIVE
  ↓
Khuyến mãi bắt đầu hoạt động (nếu trong thời gian startDate - endDate)
```

**Điều kiện để ACTIVATE:**
- ✅ Promotion phải có status = INACTIVE
- ✅ Thời gian hiện tại phải trong khoảng startDate - endDate
- ❌ Nếu đã quá endDate → Không thể activate (đã EXPIRED)

---

### **3️⃣ STORE DEACTIVATE KHUYẾN MÃI:**

```
PUT /api/v1/b2c/promotions/{promotionId}/deactivate
  ↓
Status: ACTIVE → INACTIVE
  ↓
Khuyến mãi tạm dừng (người dùng không thể sử dụng)
```

**Khi nào cần DEACTIVATE:**
- Muốn tạm dừng khuyến mãi trước thời hạn
- Sửa thông tin khuyến mãi
- Ngừng chương trình khuyến mãi

---

### **4️⃣ HẾT HẠN TỰ ĐỘNG (EXPIRED):**

```
Backend tự động check:
  ↓
Nếu endDate < now:
  Status → EXPIRED
  ↓
Khuyến mãi không thể sử dụng
Không thể ACTIVATE lại
```

**⚠️ VẤN ĐỀ HIỆN TẠI:**
- Frontend đang hiển thị promotion đã hết hạn nhưng vẫn status = ACTIVE/INACTIVE
- Backend có thể chưa tự động chuyển sang EXPIRED
- Cần kiểm tra xem backend có cronjob/scheduler để update status không

---

## 🔐 **PHÂN QUYỀN: ADMIN vs STORE**

### **STORE (B2C):**

**Có thể làm:**
- ✅ Tạo promotion mới (status = INACTIVE)
- ✅ Sửa promotion của mình
- ✅ Activate/Deactivate promotion của mình
- ✅ Xóa promotion của mình
- ✅ Xem danh sách promotion của mình (all/active/inactive/expired)

**Không thể làm:**
- ❌ Tạo platform promotion (chỉ admin)
- ❌ Sửa/xóa promotion của store khác
- ❌ Approve/Reject promotion (không cần admin duyệt)

**APIs:**
```
POST   /api/v1/b2c/promotions                        - Tạo mới
PUT    /api/v1/b2c/promotions/{id}                   - Sửa
DELETE /api/v1/b2c/promotions/{id}                   - Xóa
PUT    /api/v1/b2c/promotions/{id}/activate          - Kích hoạt
PUT    /api/v1/b2c/promotions/{id}/deactivate        - Tạm dừng
GET    /api/v1/b2c/promotions/store/{storeId}        - Tất cả
GET    /api/v1/b2c/promotions/store/{storeId}/active - Đang hoạt động
GET    /api/v1/b2c/promotions/store/{storeId}/inactive - Tạm dừng
GET    /api/v1/b2c/promotions/store/{storeId}/expired - Đã hết hạn
```

---

### **ADMIN:**

**Có thể làm:**
- ✅ Tạo **platform promotion** (áp dụng toàn hệ thống)
- ✅ Sửa/xóa bất kỳ promotion nào (store hoặc platform)
- ✅ Activate/Deactivate bất kỳ promotion nào
- ✅ Xem tất cả promotion của tất cả store
- ✅ Xem báo cáo promotion

**APIs:**
```
POST   /api/v1/admin/promotions                      - Tạo platform promo
PUT    /api/v1/admin/promotions/{id}                 - Sửa bất kỳ
DELETE /api/v1/admin/promotions/{id}                 - Xóa bất kỳ
PUT    /api/v1/admin/promotions/{id}/activate        - Kích hoạt bất kỳ
PUT    /api/v1/admin/promotions/{id}/deactivate      - Tạm dừng bất kỳ
GET    /api/v1/admin/promotions/reports/active       - Tất cả đang hoạt động
GET    /api/v1/admin/promotions/reports/inactive     - Tất cả tạm dừng
GET    /api/v1/admin/promotions/reports/expired      - Tất cả hết hạn
```

---

## 🐛 **VẤN ĐỀ CẦN FIX**

### **1. Status mặc định khi tạo mới:**

**HIỆN TẠI:**
```javascript
// Frontend không set status khi tạo
POST /api/v1/b2c/promotions
Body: {
  title: "...",
  // Không có status field
}
  ↓
Backend tự set status = INACTIVE
```

**GIẢI PHÁP:**
- ✅ Giữ nguyên logic backend (mặc định INACTIVE)
- ✅ Frontend hiển thị badge "PAUSED" cho status INACTIVE
- ✅ Sau khi tạo xong, hiển thị toast: "Khuyến mãi đã tạo! Nhấn 'Kích hoạt' để bắt đầu"

---

### **2. Promotion hết hạn không tự động chuyển EXPIRED:**

**VẤN ĐỀ:**
```
Promotion có endDate = 13/11/2025 (đã qua)
Nhưng status vẫn = ACTIVE/INACTIVE
Không tự động chuyển sang EXPIRED
```

**NGUYÊN NHÂN:**
- Backend có thể chưa có scheduler/cronjob để check endDate
- Hoặc chỉ check khi user cố gắng sử dụng promotion

**GIẢI PHÁP:**

**Option A - Frontend check (tạm thời):**
```javascript
// Trong component
const isExpired = (promo) => {
  return new Date(promo.endDate) < new Date();
};

// Hiển thị
{isExpired(promo) ? (
  <span className="badge-expired">HẾT HẠN</span>
) : promo.status === 'ACTIVE' ? (
  <span className="badge-active">ACTIVE</span>
) : (
  <span className="badge-inactive">PAUSED</span>
)}
```

**Option B - Backend fix (đúng cách):**
```
Backend cần implement:
1. Cronjob chạy mỗi ngày 00:00
2. Check tất cả promotion có endDate < now
3. Update status → EXPIRED
4. Hoặc: Check realtime khi GET promotions
```

---

## ✅ **RECOMMENDED FIXES**

### **1. Sửa Frontend hiển thị status:**

```javascript
// StorePromotions.jsx & AdminPromotions.jsx
const getPromotionStatus = (promo) => {
  const now = new Date();
  const startDate = new Date(promo.startDate);
  const endDate = new Date(promo.endDate);

  // Check if expired (endDate < now)
  if (endDate < now) {
    return {
      label: 'EXPIRED',
      color: 'from-red-500 to-pink-500',
      isExpired: true
    };
  }

  // Check if upcoming (startDate > now)
  if (startDate > now) {
    return {
      label: 'UPCOMING',
      color: 'from-yellow-500 to-orange-500',
      isExpired: false
    };
  }
  
  // Check active/inactive (trong thời gian startDate - endDate)
  if (promo.status === 'ACTIVE') {
    return {
      label: 'ACTIVE',
      color: 'from-green-500 to-emerald-500',
      isExpired: false
    };
  }
  
  return {
    label: 'INACTIVE',
    color: 'from-gray-400 to-gray-500',
    isExpired: false
  };
};
```

### **2. Thêm toast sau khi tạo promotion:**

```javascript
const handleCreate = async (e) => {
  e.preventDefault();
  setCreating(true);
  
  const result = await createPromotion(currentStore.id, formData);
  
  if (result.success) {
    showSuccess('Khuyến mãi đã được tạo! Nhấn nút "Kích hoạt" để bắt đầu.');
    setShowCreateModal(false);
    resetForm();
    mutate();
  } else {
    showError(result.error);
  }
  
  setCreating(false);
};
```

### **3. Disable activate button nếu đã hết hạn:**

```javascript
{isExpired(promo) ? (
  <button disabled className="opacity-50 cursor-not-allowed">
    Đã hết hạn
  </button>
) : promo.status === 'INACTIVE' ? (
  <button onClick={() => handleActivate(promo.id)}>
    Kích hoạt
  </button>
) : (
  <button onClick={() => handleDeactivate(promo.id)}>
    Tạm dừng
  </button>
)}
```

---

## 📊 **SUMMARY**

| Trạng thái | Mô tả | Có thể activate? | Người dùng dùng được? |
|------------|-------|------------------|----------------------|
| **ACTIVE** | Đang hoạt động | ❌ (đã active) | ✅ Có |
| **INACTIVE** | Tạm dừng | ✅ Có | ❌ Không |
| **EXPIRED** | Hết hạn | ❌ Không | ❌ Không |

**Flow chuẩn:**
```
CREATE → INACTIVE → ACTIVATE → ACTIVE → (endDate) → EXPIRED
              ↓                    ↓
         DEACTIVATE ←──────────────┘
```
