# 🔧 BACKEND XỬ LÝ CỘNG CẢNH BÁO - CHI TIẾT

## 📋 TỔNG QUAN

Backend cần xử lý **TỰ ĐỘNG** cộng cảnh báo cho store khi:
1. ✅ Store chấp nhận trả hàng (confirm-ok) → Cộng 1 cảnh báo NGAY LẬP TỨC
2. ✅ Admin giải quyết khiếu nại và khách thắng → Cộng 1 cảnh báo
3. ✅ Store thắng khiếu nại chất lượng NHƯNG có return request → Cộng 1 cảnh báo

---

## 🗄️ DATABASE SCHEMA

### Store Model - Thêm 2 trường:

```java
@Document(collection = "stores")
public class Store {
    // ... các trường khác
    
    @Field("returnWarningCount")
    private Integer returnWarningCount = 0;  // Số lần cảnh báo trong tháng hiện tại
    
    @Field("lastWarningMonth")
    private String lastWarningMonth;  // Format: "yyyy-MM" (ví dụ: "2025-12")
    
    // ... các trường khác
}
```

---

## 🔄 LOGIC CỘNG CẢNH BÁO

### **Hàm Helper - Increment Warning Count:**

```java
@Service
public class StoreWarningService {
    
    /**
     * Tăng số lần cảnh báo cho store
     * @param storeId - ID của store
     * @param reason - Lý do cảnh báo (để ghi vào log/notification)
     * @return Store đã được cập nhật
     */
    public Store incrementStoreWarning(String storeId, String reason) {
        Store store = storeRepository.findById(storeId)
            .orElseThrow(() -> new EntityNotFoundException("Store not found: " + storeId));
        
        // Lấy tháng hiện tại (format: "yyyy-MM")
        String currentMonth = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy-MM"));
        
        // Kiểm tra tháng
        if (store.getLastWarningMonth() == null || 
            !store.getLastWarningMonth().equals(currentMonth)) {
            // Tháng mới → Reset về 1
            store.setReturnWarningCount(1);
            store.setLastWarningMonth(currentMonth);
        } else {
            // Cùng tháng → Tăng lên 1
            store.setReturnWarningCount(store.getReturnWarningCount() + 1);
        }
        
        // Lưu vào database
        store = storeRepository.save(store);
        
        // ✅ Kiểm tra ban tự động
        if (store.getReturnWarningCount() >= 5) {
            // Ban store tự động
            banStoreAutomatically(storeId, 
                "Tự động ban: Quá 5 lần cảnh báo về hàng trả về trong tháng " + currentMonth);
        }
        
        // ✅ Tạo notification cảnh báo cho store
        createWarningNotification(storeId, store.getReturnWarningCount(), reason);
        
        return store;
    }
    
    /**
     * Ban store tự động khi quá 5 cảnh báo
     */
    private void banStoreAutomatically(String storeId, String reason) {
        // Gọi service ban store
        storeService.banStore(storeId, reason);
        
        // Tạo notification ban cho store
        notificationService.createStoreNotification(storeId, {
            type: "STORE_BANNED",
            title: "Cửa hàng bị ban tự động",
            message: "Cửa hàng của bạn đã bị ban tự động do quá 5 lần cảnh báo về hàng trả về trong tháng."
        });
    }
    
    /**
     * Tạo notification cảnh báo cho store
     */
    private void createWarningNotification(String storeId, Integer currentCount, String reason) {
        notificationService.createStoreNotification(storeId, {
            type: "VIOLATION_WARNING",
            title: "Cảnh báo vi phạm",
            message: String.format(
                "Bạn đã bị cảnh báo về hàng trả về. Đây là lần thứ %d trong tháng. " +
                "Nếu đạt 5 lần cảnh báo, cửa hàng sẽ bị ban tự động. " +
                "Lý do: %s",
                currentCount,
                reason
            )
        });
    }
}
```

---

## 📍 CÁC ĐIỂM CẦN GỌI `incrementStoreWarning()`

### **1. Khi Store Chấp Nhận Trả Hàng (Confirm OK)**

**Endpoint:** `PUT /api/v1/b2c/returns/store/{storeId}/returnRequest/{returnRequestId}/confirm-ok`

**Controller/Service:**

```java
@RestController
@RequestMapping("/api/v1/b2c/returns")
public class B2CReturnController {
    
    @Autowired
    private StoreWarningService storeWarningService;
    
    @PutMapping("/store/{storeId}/returnRequest/{returnRequestId}/confirm-ok")
    public ResponseEntity<?> confirmReturnOK(
            @PathVariable String storeId,
            @PathVariable String returnRequestId) {
        
        // 1. Xử lý hoàn tiền cho buyer
        // ... logic hoàn tiền
        
        // 2. Trừ tiền từ store wallet
        // ... logic trừ tiền
        
        // 3. ✅ CỘNG 1 CẢNH BÁO NGAY LẬP TỨC
        storeWarningService.incrementStoreWarning(
            storeId,
            "Xác nhận hàng trả về không có vấn đề (return request #" + returnRequestId + ")"
        );
        
        // 4. Cập nhật return request status
        // ... logic cập nhật status
        
        return ResponseEntity.ok().build();
    }
}
```

**⚠️ LƯU Ý:** 
- Phải cộng cảnh báo **NGAY LẬP TỨC** khi store chấp nhận trả hàng
- **BẤT KỂ** sau đó store có khiếu nại chất lượng và thắng hay không

---

### **2. Khi Admin Giải Quyết Khiếu Nại - Khách Thắng**

**Endpoint:** `PUT /api/v1/admin/disputes/{disputeId}/resolve`

**Controller/Service:**

```java
@RestController
@RequestMapping("/api/v1/admin/disputes")
public class AdminDisputeController {
    
    @Autowired
    private StoreWarningService storeWarningService;
    
    @PutMapping("/{disputeId}/resolve")
    public ResponseEntity<?> resolveDispute(
            @PathVariable String disputeId,
            @RequestBody DisputeDecisionDTO decisionDTO) {
        
        Dispute dispute = disputeService.getDisputeById(disputeId);
        String storeId = dispute.getStoreId();
        
        // Nếu quyết định là APPROVE_RETURN (Khách thắng)
        if (decisionDTO.getDecision().equals("APPROVE_RETURN")) {
            // 1. Xử lý hoàn tiền cho buyer
            // ... logic hoàn tiền
            
            // 2. Trừ tiền từ store wallet
            // ... logic trừ tiền
            
            // 3. ✅ CỘNG 1 CẢNH BÁO
            storeWarningService.incrementStoreWarning(
                storeId,
                "Khách thắng khiếu nại từ chối trả hàng (dispute #" + disputeId + ")"
            );
        }
        
        // ... logic khác
        
        return ResponseEntity.ok().build();
    }
}
```

---

### **3. Khi Admin Giải Quyết Khiếu Nại Chất Lượng - Store Thắng NHƯNG Có Return Request**

**Endpoint:** `PUT /api/v1/admin/disputes/{disputeId}/resolve-quality`

**Controller/Service:**

```java
@RestController
@RequestMapping("/api/v1/admin/disputes")
public class AdminDisputeController {
    
    @Autowired
    private StoreWarningService storeWarningService;
    
    @PutMapping("/{disputeId}/resolve-quality")
    public ResponseEntity<?> resolveQualityDispute(
            @PathVariable String disputeId,
            @RequestBody ReturnQualityDecisionDTO decisionDTO) {
        
        Dispute dispute = disputeService.getDisputeById(disputeId);
        String storeId = dispute.getStoreId();
        
        // Nếu quyết định là APPROVE_STORE (Store thắng)
        if (decisionDTO.getDecision().equals("APPROVE_STORE")) {
            // ✅ KIỂM TRA: Có return request liên quan không?
            ReturnRequest returnRequest = dispute.getReturnRequest();
            boolean hasReturnRequest = (returnRequest != null);
            
            if (hasReturnRequest) {
                // Có return request → Store đã giao hàng lỗi
                // → VẪN PHẢI CỘNG 1 CẢNH BÁO
                storeWarningService.incrementStoreWarning(
                    storeId,
                    "Giao hàng lỗi (có return request) dù thắng khiếu nại chất lượng (dispute #" + disputeId + ")"
                );
            }
            // Nếu KHÔNG có return request → Không cộng cảnh báo (store không có lỗi)
        }
        
        // ... logic khác
        
        return ResponseEntity.ok().build();
    }
}
```

**⚠️ LƯU Ý:**
- Chỉ cộng cảnh báo khi store thắng **VÀ** có return request
- Nếu không có return request → Không cộng cảnh báo (store không có lỗi)

---

## 🔄 FLOW CHI TIẾT

### **Scenario 1: Store Chấp Nhận Trả Hàng**

```
1. Store bấm "Chấp nhận" (confirm-ok)
   ↓
2. Backend nhận request: PUT /api/v1/b2c/returns/store/{storeId}/returnRequest/{returnRequestId}/confirm-ok
   ↓
3. Xử lý hoàn tiền cho buyer
   ↓
4. Trừ tiền từ store wallet
   ↓
5. ✅ GỌI: storeWarningService.incrementStoreWarning(storeId, reason)
   ↓
6. Kiểm tra tháng hiện tại vs lastWarningMonth
   - Nếu khác tháng → returnWarningCount = 1, lastWarningMonth = currentMonth
   - Nếu cùng tháng → returnWarningCount += 1
   ↓
7. Lưu vào database
   ↓
8. Kiểm tra returnWarningCount >= 5?
   - Nếu CÓ → Ban store tự động
   - Nếu KHÔNG → Tạo notification cảnh báo
   ↓
9. Tạo notification cho store
   ↓
10. Return response thành công
```

### **Scenario 2: Admin Giải Quyết - Khách Thắng**

```
1. Admin chọn "Chấp nhận trả hàng" (APPROVE_RETURN)
   ↓
2. Backend nhận request: PUT /api/v1/admin/disputes/{disputeId}/resolve
   ↓
3. Xử lý hoàn tiền cho buyer
   ↓
4. Trừ tiền từ store wallet
   ↓
5. ✅ GỌI: storeWarningService.incrementStoreWarning(storeId, reason)
   ↓
6. (Tương tự như Scenario 1)
```

### **Scenario 3: Admin Giải Quyết - Store Thắng NHƯNG Có Return Request**

```
1. Admin chọn "Store thắng" (APPROVE_STORE)
   ↓
2. Backend nhận request: PUT /api/v1/admin/disputes/{disputeId}/resolve-quality
   ↓
3. ✅ KIỂM TRA: dispute.returnRequest != null?
   ↓
4. Nếu CÓ return request:
   - ✅ GỌI: storeWarningService.incrementStoreWarning(storeId, reason)
   - (Tương tự như Scenario 1)
   ↓
5. Nếu KHÔNG có return request:
   - Không cộng cảnh báo
   - Store không có lỗi
```

---

## 🚫 LOGIC BAN TỰ ĐỘNG

### **Khi `returnWarningCount >= 5`:**

```java
private void banStoreAutomatically(String storeId, String reason) {
    // 1. Ban store
    Store store = storeService.banStore(storeId, reason);
    
    // 2. Tự động hủy tất cả đơn hàng PENDING
    List<Order> pendingOrders = orderService.getPendingOrdersByStore(storeId);
    for (Order order : pendingOrders) {
        orderService.cancelOrder(order.getId(), "Đơn hàng bị hủy do cửa hàng bị ban");
    }
    
    // 3. Tạo notification ban cho store
    notificationService.createStoreNotification(storeId, {
        type: "STORE_BANNED",
        title: "Cửa hàng bị ban tự động",
        message: "Cửa hàng của bạn đã bị ban tự động do quá 5 lần cảnh báo về hàng trả về trong tháng."
    });
    
    // 4. Tạo notification cho admin
    notificationService.createAdminNotification({
        type: "STORE_AUTO_BANNED",
        title: "Cửa hàng bị ban tự động",
        message: String.format("Cửa hàng %s đã bị ban tự động: %s", store.getName(), reason),
        storeId: storeId
    });
}
```

---

## 📝 CHECKLIST IMPLEMENTATION

### **Backend Cần Làm:**

- [ ] **1. Thêm 2 trường vào Store Model:**
  - [ ] `returnWarningCount: Integer` (default: 0)
  - [ ] `lastWarningMonth: String` (format: "yyyy-MM")

- [ ] **2. Tạo StoreWarningService:**
  - [ ] Hàm `incrementStoreWarning(storeId, reason)`
  - [ ] Logic kiểm tra tháng hiện tại vs lastWarningMonth
  - [ ] Logic reset về 1 khi sang tháng mới
  - [ ] Logic tăng lên 1 khi cùng tháng
  - [ ] Logic ban tự động khi >= 5
  - [ ] Tạo notification cảnh báo

- [ ] **3. Gọi incrementStoreWarning() trong các endpoint:**
  - [ ] `PUT /api/v1/b2c/returns/store/{storeId}/returnRequest/{returnRequestId}/confirm-ok`
  - [ ] `PUT /api/v1/admin/disputes/{disputeId}/resolve` (khi APPROVE_RETURN)
  - [ ] `PUT /api/v1/admin/disputes/{disputeId}/resolve-quality` (khi APPROVE_STORE và có return request)

- [ ] **4. Implement logic ban tự động:**
  - [ ] Hàm `banStoreAutomatically(storeId, reason)`
  - [ ] Tự động hủy đơn hàng PENDING
  - [ ] Tạo notification ban cho store
  - [ ] Tạo notification cho admin

- [ ] **5. Chặn các chức năng khi store bị ban:**
  - [ ] Xác nhận đơn hàng mới
  - [ ] Tạo/cập nhật sản phẩm
  - [ ] Tạo khuyến mãi
  - [ ] Tạo yêu cầu rút tiền
  - [ ] Cập nhật thông tin shop
  - [ ] Chặn thanh toán với shop bị ban

---

## ⚠️ LƯU Ý QUAN TRỌNG

1. **Cộng cảnh báo NGAY LẬP TỨC:**
   - Khi store chấp nhận trả hàng → Cộng ngay, không đợi khiếu nại
   - Bất kể sau đó có khiếu nại chất lượng hay không

2. **Kiểm tra return request:**
   - Chỉ cộng cảnh báo khi store thắng khiếu nại chất lượng **VÀ** có return request
   - Nếu không có return request → Không cộng cảnh báo

3. **Reset theo tháng:**
   - Mỗi tháng mới, `returnWarningCount` reset về 1
   - `lastWarningMonth` được cập nhật theo tháng hiện tại

4. **Ban tự động:**
   - Khi `returnWarningCount >= 5` trong cùng tháng → Ban tự động
   - Tự động hủy tất cả đơn hàng PENDING
   - Tạo notification cho store và admin

---

**Ngày tạo:** 23/12/2025  
**Trạng thái:** ⚠️ CẦN BACKEND IMPLEMENT

