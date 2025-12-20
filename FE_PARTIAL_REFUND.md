## Tài liệu FE – Hoàn tiền 1 phần, trả hàng, khiếu nại & khuyến mãi

### 1. Dispute chất lượng hàng trả về – `admin/disputes/{disputeId}/resolve-quality` ✅ (ĐÃ LÀM)

- **Endpoint**: `PUT /api/v1/admin/disputes/{disputeId}/resolve-quality`
- **Body**: `ReturnQualityDecisionDTO`
  - `decision`: `"APPROVE_STORE"` | `"REJECT_STORE"` | `"PARTIAL_REFUND"`
  - `reason`: string
  - `partialRefundAmount`: number (bắt buộc khi `decision = PARTIAL_REFUND`)
- **Ý nghĩa**:
  - `APPROVE_STORE`: đồng ý với store → hoàn tiền cho store, buyer không được hoàn.
  - `REJECT_STORE`: đồng ý với buyer → hoàn tiền toàn bộ cho buyer.
  - `PARTIAL_REFUND`: **hoàn tiền một phần cho buyer**, phần còn lại trả về cho store.
  - Back‑end đảm bảo **mỗi ReturnRequest/Dispute chỉ được PARTIAL_REFUND đúng 1 lần**.

### 2. Field mới trong ReturnRequest

- BE bổ sung **2 field** trên DTO trả về cho các API ReturnRequest:
  - `partialRefundToBuyer`: số tiền hoàn cho buyer khi hoàn 1 phần.
  - `partialRefundToStore`: số tiền hoàn lại cho store khi hoàn 1 phần.
- Các API có ReturnRequest (buyer & store) đều có thể trả về hai field này:
  - `GET /api/v1/buyer/orders/returns`
  - `GET /api/v1/buyer/orders/returns/{returnRequestId}`
  - `GET /api/v1/b2c/returns/store/{storeId}`
  - `GET /api/v1/b2c/returns/store/{storeId}/returnRequest/{returnRequestId}`
- **FE cần**:
  - Đọc hai field trên nếu có.
  - Hiển thị rõ: tổng tiền hàng, tiền hoàn cho buyer, tiền trả lại cho store.

### 3. Dispute detail cho buyer & store

- Buyer:
  - `GET /api/v1/buyer/orders/disputes`
  - `GET /api/v1/buyer/orders/disputes/{disputeId}`
- Store (B2C):
  - `GET /api/v1/b2c/returns/store/{storeId}/disputes`
  - `GET /api/v1/b2c/returns/store/{storeId}/disputes/{disputeId}`
- BE đã trả về thêm thông tin hoàn tiền (trong ReturnRequest gốc + createdDisputes/relatedDisputes).
- **FE cần**:
  - Khi xem chi tiết dispute, nếu có `partialRefundAmount` hoặc `partialRefundToBuyer/Store` thì show rõ trong phần kết quả xử lý.

### 4. ReturnRequest hiển thị danh sách khiếu nại liên quan

- Các API:
  - Buyer:
    - `GET /api/v1/buyer/orders/returns`
    - `GET /api/v1/buyer/orders/returns/{returnRequestId}`
  - Store:
    - `GET /api/v1/b2c/returns/store/{storeId}`
    - `GET /api/v1/b2c/returns/store/{storeId}/returnRequest/{returnRequestId}`
- **Dữ liệu mới** (tên trường có thể là `createdDisputes`, `relatedDisputes` – FE phải log để kiểm tra):
  - Mảng các dispute liên quan: `disputeId`, `disputeType`, `status`, `finalDecision`, `messageCount`, …
- **FE cần**:
  - Ở màn danh sách + chi tiết yêu cầu trả hàng: thêm section nhỏ “Khiếu nại liên quan”, liệt kê và link sang trang dispute detail tương ứng (buyer/store).

### 5. Đổi `hasReturnRequest` → `returnRequestId` trong Order ✅ (ĐANG ÁP DỤNG DẦN)

- Order response mới từ BE:
  - Bỏ `hasReturnRequest: boolean`.
  - Thêm `returnRequestId: string | null`.
- Các API:
  - Buyer:
    - `GET /api/v1/buyer/orders`
    - `GET /api/v1/buyer/orders/{orderId}`
  - Store:
    - `GET /api/v1/b2c/orders`
    - `GET /api/v1/b2c/orders/{orderId}`
- **Rule FE**:
  - Chỗ nào trước đây check `hasReturnRequest === true` thì đổi sang `!!return.returnRequestId`.
  - Một số màn hình (buyer OrderCard, OrderDetail, store OrderDetail) cần:
    - Ẩn/hiện nút “Trả hàng / Hoàn tất / Đánh giá” dựa trên `returnRequestId`.
    - Đi đến chi tiết yêu cầu trả hàng khi có `returnRequestId`.
  - Lưu ý: **chỉ đơn mới** sau khi deploy BE mới chắc chắn có field này; với đơn cũ có thể null → FE phải fallback an toàn.

### 6. API đếm trạng thái trả hàng cho store – `b2c/returns/store/{storeId}/count-by-status` ✅ (ĐÃ DÙNG Ở STORE)

- **Endpoint**: `GET /api/v1/b2c/returns/store/{storeId}/count-by-status`
- **Response dự kiến**:
  - `pending`: số lượng ReturnRequest có status `PENDING`.
  - `approved`: số lượng với status `APPROVED`, `READY_TO_RETURN`.
  - `returning`: `RETURNING`, `RETURNED`, `RETURN_DISPUTED`.
  - `refunded`: `REFUNDED`, `PARTIAL_REFUND`, `REFUND_TO_STORE`.
  - `total`: tổng các nhóm trên (pending + approved + returning + refunded).
  - **Không tính vào total nhưng vẫn trả về**:
    - `rejected`: `REJECTED`.
    - `disputed`: `DISPUTED`.
    - `closed`: `CLOSED`.
- **FE cần**:
  - Ở trang quản lý yêu cầu trả hàng của store: dùng API này để render các ô thống kê trạng thái (Tổng yêu cầu, Chờ xử lý, Đang trả hàng, Đã hoàn tiền, …).
  - Map màu sắc/label giống thiết kế hiện tại.

---

### 7. Khuyến mãi – usageLimitPerUser & promotion_usages

- Collection `promotion_usages` trong Mongo:
  - 1 document tương ứng 1 cặp **(promotion, user)**.
  - Field `usageCount` thể hiện số lần user đó đã dùng mã.
  - Hiện tại thực tế có nhiều record `usageCount > 1` → BE **chưa khóa** theo `usageLimitPerUser`.
- Promotion schema:
  - `usageLimitPerUser: 1` nghĩa là **mỗi user chỉ được dùng 1 lần** cho toàn bộ thời gian sống của promotion.
- FE cần lưu ý:
  - FE **không tự chặn** số lần dùng theo `usageLimitPerUser`, chỉ hiển thị thông tin, validate cơ bản (ngày hết hạn, giá trị đơn hàng).
  - Quy tắc “1 user 1 lần” **phải do BE check** khi:
    - Validate mã (`/api/v1/promotions/validate/{promotionId}` hoặc các API validate khác nếu có).
    - Áp mã trong quá trình checkout.
  - Khi BE fix:
    - Nếu BE trả về lỗi kiểu `"PROMOTION_USAGE_LIMIT_EXCEEDED"` (hoặc message tương đương), FE hiển thị thông báo kiểu:  
      > "Bạn đã sử dụng mã khuyến mãi này đủ số lần cho phép."
    - Ở lịch sử đơn hàng và chi tiết đơn, FE vẫn chỉ đọc các field giảm giá hiện có (`discountAmount`, `appliedPromotion`, `promotionCode`...) như đã implement.



