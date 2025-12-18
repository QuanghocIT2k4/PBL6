# LUỒNG KHIẾU NẠI (DISPUTE FLOW)

## TỔNG QUAN

Có 2 loại khiếu nại:
1. **RETURN_REJECTION**: Khiếu nại từ chối trả hàng (Buyer khiếu nại khi Store từ chối yêu cầu trả hàng)
2. **RETURN_QUALITY**: Khiếu nại chất lượng hàng trả (Store khiếu nại khi hàng trả về không đạt chất lượng)

---

## 1. LUỒNG KHIẾU NẠI TỪ CHỐI TRẢ HÀNG (RETURN_REJECTION)

### Bước 1: Buyer tạo yêu cầu trả hàng
- **Role**: Buyer
- **API**: `POST /api/v1/buyer/orders/{orderId}/return`
- **Mô tả**: Buyer tạo yêu cầu trả hàng với lý do, mô tả, hình ảnh/video minh chứng

### Bước 2: Store phản hồi yêu cầu trả hàng
- **Role**: Store
- **API**: `PUT /api/v1/b2c/returns/store/{storeId}/returnRequest/{returnRequestId}/respond`
- **Body**: 
  - `approved`: true/false
  - `reason`: Lý do từ chối (nếu từ chối)
  - `evidenceFiles`: File đính kèm (tùy chọn)
- **Mô tả**: 
  - Nếu `approved = true` → Status chuyển sang `APPROVED` → Tiếp tục luồng trả hàng
  - Nếu `approved = false` → Status chuyển sang `REJECTED` → Buyer có thể khiếu nại

### Bước 3: Buyer tạo khiếu nại (nếu Store từ chối)
- **Role**: Buyer
- **API**: `POST /api/v1/buyer/orders/returns/{returnRequestId}/dispute`
- **Body** (multipart/form-data):
  - `content`: Nội dung khiếu nại
  - `attachmentFiles`: File đính kèm (ảnh/video)
- **Mô tả**: 
  - Buyer tạo khiếu nại khi Store từ chối yêu cầu trả hàng
  - Status của Return Request chuyển sang `DISPUTED`
  - Dispute được tạo với `disputeType = RETURN_REJECTION`, `status = OPEN`
  - **Admin tự động được thông báo và có thể vào xem ngay**

### Bước 4: Admin vào cuộc và xem cuộc trò chuyện
- **Role**: Admin
- **Trang**: `/admin-dashboard/disputes/{disputeId}` (AdminDisputeDetailPage)
- **API xem chi tiết**: `GET /api/v1/admin/disputes/{disputeId}`
- **Mô tả**: 
  - Admin có thể xem tất cả tin nhắn trao đổi giữa Buyer và Store
  - Admin có thể gửi tin nhắn để yêu cầu thêm thông tin hoặc giải thích
  - Admin xem được tất cả bằng chứng (ảnh/video) mà 2 bên đã gửi

### Bước 5: Buyer và Store trao đổi tin nhắn (CHAT)

**Cách hoạt động:**
- Buyer và Store vào trang **chi tiết khiếu nại** của mình để xem và gửi tin nhắn
- Tất cả tin nhắn được hiển thị trong cùng một danh sách (theo thời gian)
- Mỗi tin nhắn hiển thị: Tên người gửi, nội dung, thời gian, file đính kèm (nếu có)
- Cả 2 bên đều thấy tin nhắn của nhau trong real-time (sau khi refresh hoặc revalidate)

**Buyer gửi tin nhắn:**
- **Trang**: `/orders/disputes/{disputeId}` (BuyerDisputeDetailPage)
- **API**: `POST /api/v1/buyer/orders/disputes/{disputeId}/message`
- **Body** (multipart/form-data):
  - `content`: Nội dung tin nhắn (bắt buộc)
  - `attachmentFiles`: File đính kèm - ảnh/video (tùy chọn, tối đa 5 file)
- **Cách dùng**: 
  1. Buyer vào trang chi tiết khiếu nại
  2. Nhập nội dung vào textarea
  3. Chọn file đính kèm (nếu có)
  4. Bấm "Gửi tin nhắn"
  5. Tin nhắn được thêm vào danh sách, Store sẽ thấy khi vào trang của họ

**Store gửi tin nhắn:**
- **Trang**: `/store-dashboard/returns/disputes/{disputeId}` (StoreDisputeDetailPage)
- **API**: `POST /api/v1/b2c/returns/store/{storeId}/disputes/{disputeId}/message`
- **Body** (multipart/form-data):
  - `content`: Nội dung tin nhắn (bắt buộc)
  - `attachmentFiles`: File đính kèm - ảnh/video (tùy chọn, tối đa 5 file)
- **Cách dùng**: 
  1. Store vào trang chi tiết khiếu nại từ "Yêu cầu trả hàng"
  2. Nhập nội dung vào textarea
  3. Chọn file đính kèm (nếu có)
  4. Bấm "Gửi tin nhắn"
  5. Tin nhắn được thêm vào danh sách, Buyer sẽ thấy khi vào trang của họ

**Hiển thị tin nhắn:**
- Tất cả tin nhắn được lưu trong `dispute.messages[]` array
- Mỗi message có: `senderType` (BUYER/STORE), `senderName`, `content`, `sentAt`, `attachments`
- Tin nhắn của Buyer hiển thị màu xanh dương (bg-blue-50)
- Tin nhắn của Store hiển thị màu xám (bg-gray-50)
- File đính kèm hiển thị dạng gallery (ảnh preview, video có icon play)

**Lưu ý**: 
- Buyer và Store có thể trao đổi tin nhắn **nhiều lần** để thương lượng, giải thích, đưa ra bằng chứng
- **Admin có thể xem tất cả tin nhắn này trong thời gian thực**
- Form gửi tin nhắn chỉ hiển thị khi `dispute.status !== 'CLOSED' && dispute.status !== 'RESOLVED'`

**Trường hợp 2 bên tự thống nhất:**

**1. Người mua thắng (Store đồng ý chấp nhận lại yêu cầu trả hàng):**
- Store vào trang "Yêu cầu trả hàng" → Tìm return request có status `DISPUTED`
- Store bấm "Chấp nhận" lại yêu cầu trả hàng
- **API**: `PUT /api/v1/b2c/returns/store/{storeId}/returnRequest/{returnRequestId}/respond` với `approved = true`
- **Kết quả**: Return Request chuyển sang `APPROVED` → Dispute tự động đóng (`CLOSED`) → Tiếp tục luồng trả hàng bình thường
- ✅ **CÓ API - TỰ ĐỘNG ĐÓNG**

**2. Người bán thắng (Buyer đồng ý giữ hàng, không trả hàng nữa):**
- Buyer gửi tin nhắn xác nhận rút khiếu nại
- Store gửi tin nhắn xác nhận đồng ý
- **API**: Chỉ có `POST /api/v1/buyer/orders/disputes/{disputeId}/message` và `POST /api/v1/b2c/returns/store/{storeId}/disputes/{disputeId}/message` (gửi tin nhắn)
- **Kết quả**: Dispute vẫn ở trạng thái `OPEN` → **CẦN ADMIN VÀO GIẢI QUYẾT** để đóng khiếu nại
- ❌ **KHÔNG CÓ API TỰ ĐÓNG - CẦN ADMIN**

**3. Không thống nhất được:**
- **Admin sẽ đưa ra quyết định cuối cùng** (Bước 6) → Admin đưa ra phán quyết dựa trên cuộc trò chuyện và bằng chứng

### Bước 6: Admin đưa ra phán quyết cuối cùng
- **Role**: Admin
- **Trang**: `/admin-dashboard/disputes/{disputeId}` (AdminDisputeDetailPage)
- **API xem danh sách**: `GET /api/v1/admin/disputes`
  - Query params: `page`, `size`, `disputeType` (RETURN_REJECTION, RETURN_QUALITY), `status` (OPEN, IN_REVIEW, RESOLVED, CLOSED)
- **API xem chi tiết**: `GET /api/v1/admin/disputes/{disputeId}`
- **API giải quyết**: 
  - `PUT /api/v1/admin/disputes/{disputeId}/resolve` (cho RETURN_REJECTION)
  - `PUT /api/v1/admin/disputes/{disputeId}/resolve-quality` (cho RETURN_QUALITY)
  - Body:
    - `decision`: Quyết định
      - RETURN_REJECTION: `APPROVE_RETURN` (Buyer thắng) hoặc `REJECT_RETURN` (Store thắng)
      - RETURN_QUALITY: `APPROVE_STORE` (Store thắng) hoặc `REJECT_STORE` (Buyer thắng)
    - `adminNote`: Ghi chú của Admin về quyết định
- **API gửi tin nhắn**: `POST /api/v1/admin/disputes/{disputeId}/message`
  - Body (multipart/form-data):
    - `content`: Nội dung tin nhắn
    - `attachmentFiles`: File đính kèm (tùy chọn)
- **Mô tả**: 
  - Admin xem tất cả khiếu nại trong danh sách (`/admin-dashboard/disputes`)
  - Admin vào trang chi tiết để xem cuộc trò chuyện giữa Buyer và Store
  - Admin có thể gửi tin nhắn để yêu cầu thêm thông tin hoặc giải thích
  - Admin đưa ra quyết định cuối cùng dựa trên cuộc trò chuyện và bằng chứng
  - Status của Dispute chuyển sang `RESOLVED` hoặc `CLOSED`
  - Nếu quyết định có lợi cho Buyer → Return Request có thể được tiếp tục

---

## 2. LUỒNG KHIẾU NẠI CHẤT LƯỢNG HÀNG TRẢ (RETURN_QUALITY)

### Bước 1: Buyer trả hàng về Store
- **Role**: Buyer
- **Mô tả**: Sau khi Store chấp nhận yêu cầu trả hàng, Buyer gửi hàng về Store

### Bước 2: Store nhận hàng trả về
- **Role**: Store
- **API**: `PUT /api/v1/b2c/returns/store/{storeId}/returnRequest/{returnRequestId}/confirm-ok`
- **Mô tả**: 
  - Store xác nhận hàng trả về đạt yêu cầu → Tiếp tục hoàn tiền
  - Hoặc Store có thể khiếu nại chất lượng hàng trả

### Bước 3: Store tạo khiếu nại chất lượng (nếu hàng không đạt)
- **Role**: Store
- **API**: `POST /api/v1/b2c/returns/store/{storeId}/returnRequest/{returnRequestId}/dispute-quality`
- **Body** (multipart/form-data):
  - `reason`: Lý do khiếu nại
  - `description`: Mô tả chi tiết
  - `evidenceFiles`: File đính kèm (ảnh/video minh chứng)
- **Mô tả**: 
  - Store tạo khiếu nại khi hàng trả về không đạt chất lượng
  - Status của Return Request chuyển sang `RETURN_DISPUTED`
  - Dispute được tạo với `disputeType = RETURN_QUALITY`, `status = OPEN`
  - **Admin tự động được thông báo và có thể vào xem ngay**

### Bước 4: Admin vào cuộc và xem cuộc trò chuyện
- **Role**: Admin
- **Trang**: `/admin-dashboard/disputes/{disputeId}` (AdminDisputeDetailPage)
- **API xem chi tiết**: `GET /api/v1/admin/disputes/{disputeId}`
- **Mô tả**: 
  - Admin có thể xem tất cả tin nhắn trao đổi giữa Store và Buyer
  - Admin có thể gửi tin nhắn để yêu cầu thêm thông tin hoặc giải thích
  - Admin xem được tất cả bằng chứng (ảnh/video) mà 2 bên đã gửi

### Bước 5: Store và Buyer trao đổi tin nhắn (CHAT)

**Cách hoạt động:** (Tương tự như RETURN_REJECTION)
- Store và Buyer vào trang **chi tiết khiếu nại** của mình để xem và gửi tin nhắn
- Tất cả tin nhắn được hiển thị trong cùng một danh sách (theo thời gian)
- Mỗi tin nhắn hiển thị: Tên người gửi, nội dung, thời gian, file đính kèm (nếu có)

**Store gửi tin nhắn:**
- **Trang**: `/store-dashboard/returns/disputes/{disputeId}` (StoreDisputeDetailPage)
- **API**: `POST /api/v1/b2c/returns/store/{storeId}/disputes/{disputeId}/message`
- **Body** (multipart/form-data):
  - `content`: Nội dung tin nhắn (bắt buộc)
  - `attachmentFiles`: File đính kèm - ảnh/video (tùy chọn)

**Buyer gửi tin nhắn:**
- **Trang**: `/orders/disputes/{disputeId}` (BuyerDisputeDetailPage)
- **API**: `POST /api/v1/buyer/orders/disputes/{disputeId}/message`
- **Body** (multipart/form-data):
  - `content`: Nội dung tin nhắn (bắt buộc)
  - `attachmentFiles`: File đính kèm - ảnh/video (tùy chọn)

**Lưu ý**: 
- Store và Buyer có thể trao đổi tin nhắn **nhiều lần** để thương lượng, giải thích, đưa ra bằng chứng
- **Admin có thể xem tất cả tin nhắn này trong thời gian thực**
- Form gửi tin nhắn chỉ hiển thị khi `dispute.status !== 'CLOSED' && dispute.status !== 'RESOLVED'`

**Trường hợp 2 bên tự thống nhất:**

**1. Người bán thắng (Store xác nhận hàng OK):**
- Store vào trang "Yêu cầu trả hàng" → Tìm return request có status `RETURN_DISPUTED`
- Store bấm "Xác nhận hàng OK"
- **API**: `PUT /api/v1/b2c/returns/store/{storeId}/returnRequest/{returnRequestId}/confirm-ok`
- **Kết quả**: Return Request chuyển sang `RETURNED` → Dispute tự động đóng (`CLOSED`) → Tiếp tục hoàn tiền cho Buyer
- ✅ **CÓ API - TỰ ĐỘNG ĐÓNG**

**2. Người mua thắng (Store chấp nhận hàng trả về không đạt):**
- Store và Buyer trao đổi, Store đồng ý hàng trả về không đạt
- **API**: Chỉ có API gửi tin nhắn, không có API để tự đóng dispute
- **Kết quả**: Dispute vẫn ở trạng thái `OPEN` → **CẦN ADMIN VÀO GIẢI QUYẾT** để đóng khiếu nại
- ❌ **KHÔNG CÓ API TỰ ĐÓNG - CẦN ADMIN**

**3. Không thống nhất được:**
- **Admin sẽ đưa ra quyết định cuối cùng** (Bước 6) → Admin đưa ra phán quyết dựa trên cuộc trò chuyện và bằng chứng

### Bước 6: Admin đưa ra phán quyết cuối cùng
- **Role**: Admin
- **Trang**: `/admin-dashboard/disputes/{disputeId}` (AdminDisputeDetailPage)
- **API xem danh sách**: `GET /api/v1/admin/disputes?disputeType=RETURN_QUALITY`
- **API xem chi tiết**: `GET /api/v1/admin/disputes/{disputeId}`
- **API giải quyết**: `PUT /api/v1/admin/disputes/{disputeId}/resolve-quality`
  - Body:
    - `decision`: Quyết định (`APPROVE_STORE` - Store thắng, `REJECT_STORE` - Buyer thắng)
    - `adminNote`: Ghi chú của Admin về quyết định
- **API gửi tin nhắn**: `POST /api/v1/admin/disputes/{disputeId}/message`
  - Body (multipart/form-data):
    - `content`: Nội dung tin nhắn
    - `attachmentFiles`: File đính kèm (tùy chọn)
- **Mô tả**: 
  - Admin xem tất cả khiếu nại chất lượng trong danh sách (`/admin-dashboard/disputes`)
  - Admin vào trang chi tiết để xem cuộc trò chuyện giữa Store và Buyer
  - Admin có thể gửi tin nhắn để yêu cầu thêm thông tin hoặc giải thích
  - Admin đưa ra quyết định cuối cùng dựa trên cuộc trò chuyện và bằng chứng
  - Nếu quyết định có lợi cho Store → Có thể từ chối hoàn tiền hoặc yêu cầu Buyer trả lại hàng đúng chất lượng

---

## 3. API XEM DANH SÁCH VÀ CHI TIẾT

### Buyer
- **Xem danh sách khiếu nại**: `GET /api/v1/buyer/orders/disputes`
  - Query params: `page`, `size`
- **Xem chi tiết**: Dùng API list và filter theo ID (không có API GET chi tiết riêng)

### Store
- **Xem danh sách khiếu nại**: `GET /api/v1/b2c/returns/store/{storeId}/disputes`
  - Query params: `page`, `size`
- **Xem chi tiết**: Dùng API list và filter theo ID (không có API GET chi tiết riêng)

### Admin
- **Xem danh sách tất cả khiếu nại**: `GET /api/v1/admin/disputes`
  - Query params: `page`, `size`, `disputeType` (RETURN_REJECTION, RETURN_QUALITY)
- **Xem chi tiết**: `GET /api/v1/admin/disputes/{disputeId}`

---

## 4. TRẠNG THÁI (STATUS) CỦA DISPUTE

- **OPEN**: Mở (khiếu nại mới được tạo)
- **IN_REVIEW**: Đang xem xét (Admin đang xử lý)
- **RESOLVED**: Đã giải quyết (Admin đã đưa ra quyết định)
- **CLOSED**: Đã đóng (khiếu nại đã kết thúc)

---

## 5. TRẠNG THÁI CỦA RETURN REQUEST KHI CÓ KHIẾU NẠI

- **DISPUTED**: Đang khiếu nại (khiếu nại từ chối trả hàng)
- **RETURN_DISPUTED**: Tranh chấp chất lượng (khiếu nại chất lượng hàng trả)

---

## 6. TÓM TẮT LUỒNG

### RETURN_REJECTION Flow:
```
Buyer tạo Return Request 
  → Store từ chối (REJECTED)
    → Buyer tạo Dispute (DISPUTED, status = OPEN)
      → Admin vào cuộc ngay, xem cuộc trò chuyện
      → Buyer/Store trao đổi tin nhắn (Admin xem được)
        → [Nếu thống nhất] → Tự giải quyết (CLOSED)
        → [Nếu KHÔNG thống nhất] → Admin đưa ra phán quyết (RESOLVED/CLOSED)
```

### RETURN_QUALITY Flow:
```
Buyer trả hàng về Store
  → Store nhận hàng
    → Store khiếu nại chất lượng (RETURN_DISPUTED, status = OPEN)
      → Admin vào cuộc ngay, xem cuộc trò chuyện
      → Store/Buyer trao đổi tin nhắn (Admin xem được)
        → [Nếu thống nhất] → Tự giải quyết (CLOSED)
        → [Nếu KHÔNG thống nhất] → Admin đưa ra phán quyết (RESOLVED/CLOSED)
```

**Quan trọng**: 
- **Admin vào cuộc ngay khi có khiếu nại** và có thể xem tất cả cuộc trò chuyện giữa Buyer và Store trong thời gian thực
- Admin chỉ đưa ra phán quyết cuối cùng khi Buyer và Store **KHÔNG thể tự thống nhất** sau khi trao đổi tin nhắn
- Nếu 2 bên tự giải quyết được thì không cần Admin can thiệp

---

## 7. CÁC FILE CODE LIÊN QUAN

### Buyer:
- `FE/src/services/buyer/disputeService.js` - API calls cho Buyer
- `FE/src/services/buyer/returnService.js` - API tạo dispute (createDispute)
- `FE/src/pages/buyer/BuyerDisputesPage.jsx` - Trang danh sách khiếu nại
- `FE/src/pages/buyer/BuyerDisputeDetailPage.jsx` - Trang chi tiết khiếu nại
- `FE/src/pages/buyer/ReturnDisputeCreatePage.jsx` - Trang tạo khiếu nại

### Store:
- `FE/src/services/b2c/returnService.js` - API calls cho Store (getStoreDisputes, addStoreDisputeMessage, disputeQuality)
- `FE/src/pages/store/StoreReturnRequestsPage.jsx` - Trang yêu cầu trả hàng (hiển thị button "Xem chi tiết khiếu nại")
- `FE/src/pages/store/StoreDisputeDetailPage.jsx` - Trang chi tiết khiếu nại

### Admin:
- `FE/src/services/admin/disputeService.js` - API calls cho Admin (getAdminDisputes, getAdminDisputeDetail, resolveDispute, resolveQualityDispute, addAdminDisputeMessage)
- `FE/src/pages/admin/AdminDisputesPage.jsx` - Trang danh sách khiếu nại
- `FE/src/pages/admin/AdminDisputeDetailPage.jsx` - Trang chi tiết khiếu nại (xem cuộc trò chuyện và đưa ra phán quyết)

---

## 8. GHI CHÚ QUAN TRỌNG

1. **Dispute ID**: Có thể lấy từ:
   - `request.dispute` trong Return Request response
   - Hoặc fetch danh sách disputes và match theo `returnRequestId`

2. **Attachments**: Tất cả API gửi tin nhắn đều hỗ trợ đính kèm file (ảnh/video)

3. **Multipart/form-data**: Các API tạo dispute và gửi tin nhắn đều dùng `multipart/form-data`

4. **Admin Resolution**: Chỉ Admin mới có quyền giải quyết khiếu nại cuối cùng

