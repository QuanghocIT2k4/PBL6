# 🔄 Hướng Dẫn Reset Số Lần Cảnh Báo Vi Phạm (Violation Warning Count)

## 📋 Tổng Quan

Số lần cảnh báo vi phạm (`returnWarningCount`) được lưu trong **Store model** với 2 trường:
- `returnWarningCount`: Số lần cảnh báo trong tháng hiện tại (Number)
- `lastWarningMonth`: Tháng của lần cảnh báo cuối (String, format: "yyyy-MM")

---

## 🔍 Cách Reset

### **Cách 1: Qua Admin API (Nếu Backend đã implement)**

#### **Frontend Service:**
Đã thêm function `resetStoreWarning` vào `FE/src/services/admin/adminStoreService.js`:

```javascript
import { resetStoreWarning } from '../../services/admin/adminStoreService';

// Reset warning count cho store
const result = await resetStoreWarning(storeId);
if (result.success) {
  console.log('Đã reset số lần cảnh báo thành công');
} else {
  console.error('Lỗi:', result.error);
}
```

#### **API Endpoint (Cần Backend implement):**
```
PUT /api/v1/admin/stores/{storeId}/reset-warning
```

**Request:**
- Method: `PUT`
- Path: `/api/v1/admin/stores/{storeId}/reset-warning`
- Headers: `Authorization: Bearer {admin_token}`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "store_id",
    "returnWarningCount": 0,
    "lastWarningMonth": null
  },
  "message": "Reset số lần cảnh báo thành công"
}
```

---

### **Cách 2: Reset Trực Tiếp Trong Database (MongoDB)**

#### **Bước 1: Kết nối MongoDB**
```bash
# Sử dụng MongoDB Compass hoặc MongoDB Shell
mongosh "mongodb://localhost:27017/your_database_name"
```

#### **Bước 2: Reset Warning Count**
```javascript
// Reset về 0 và xóa lastWarningMonth
db.stores.updateOne(
  { _id: ObjectId("store_id_here") },
  { 
    $set: { 
      returnWarningCount: 0,
      lastWarningMonth: null
    } 
  }
);

// Hoặc reset tất cả stores (CẨN THẬN!)
db.stores.updateMany(
  {},
  { 
    $set: { 
      returnWarningCount: 0,
      lastWarningMonth: null
    } 
  }
);
```

#### **Bước 3: Xác nhận**
```javascript
// Kiểm tra kết quả
db.stores.findOne(
  { _id: ObjectId("store_id_here") },
  { returnWarningCount: 1, lastWarningMonth: 1 }
);
```

---

### **Cách 3: Qua Swagger UI (Nếu có API)**

1. Mở Swagger UI: `http://localhost:8080/swagger-ui.html`
2. Tìm endpoint: `PUT /api/v1/admin/stores/{storeId}/reset-warning`
3. Nhập `storeId` và click "Execute"
4. Kiểm tra response

---

### **Cách 4: Qua Browser Console (Frontend)**

Mở Browser Console (F12) và chạy:

```javascript
// Import service (nếu chưa có)
import { resetStoreWarning } from './src/services/admin/adminStoreService';

// Reset warning cho store cụ thể
const storeId = "your_store_id_here";
resetStoreWarning(storeId)
  .then(result => {
    if (result.success) {
      console.log('✅ Đã reset thành công:', result.data);
      // Refresh trang để cập nhật UI
      window.location.reload();
    } else {
      console.error('❌ Lỗi:', result.error);
    }
  })
  .catch(err => console.error('❌ Lỗi:', err));
```

---

## ⚠️ Lưu Ý Quan Trọng

1. **CHỈ DÙNG CHO TESTING:**
   - Function `resetStoreWarning` chỉ nên dùng trong môi trường development/testing
   - Không nên expose API này trong production (hoặc cần authentication/admin role rất chặt chẽ)

2. **Reset Tự Động:**
   - Backend tự động reset `returnWarningCount` về 1 khi sang tháng mới
   - `lastWarningMonth` được cập nhật theo tháng hiện tại

3. **Xóa Notifications:**
   - Sau khi reset warning count, có thể cần xóa các notification cảnh báo cũ
   - Hoặc đánh dấu chúng là "đã đọc" để không hiển thị nữa

---

## 🔧 Backend Implementation (Nếu chưa có)

Nếu backend chưa có API reset warning, cần implement:

```javascript
// Backend Controller
// PUT /api/v1/admin/stores/:storeId/reset-warning
exports.resetStoreWarning = async (req, res) => {
  try {
    const { storeId } = req.params;
    
    const store = await Store.findById(storeId);
    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy cửa hàng',
      });
    }

    // Reset warning count
    store.returnWarningCount = 0;
    store.lastWarningMonth = null;
    await store.save();

    return res.json({
      success: true,
      data: {
        id: store._id,
        returnWarningCount: store.returnWarningCount,
        lastWarningMonth: store.lastWarningMonth,
      },
      message: 'Reset số lần cảnh báo thành công',
    });
  } catch (error) {
    console.error('Reset warning error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi reset số lần cảnh báo',
    });
  }
};
```

---

## 📝 Checklist

- [ ] Backend đã implement API `PUT /api/v1/admin/stores/{storeId}/reset-warning`
- [ ] Frontend đã có function `resetStoreWarning` trong `adminStoreService.js`
- [ ] Đã test reset warning count qua API
- [ ] Đã test reset warning count qua database (nếu cần)
- [ ] Đã xóa/đánh dấu đọc các notification cảnh báo cũ (nếu cần)

---

**Ngày tạo:** 23/12/2025  
**Mục đích:** Testing các trường hợp trả hàng


