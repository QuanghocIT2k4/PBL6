/**
 * DISPLAY CODE UTILITIES
 * Chuyển đổi ID dạng UUID/hash thành mã hiển thị thân thiện với user
 */

/**
 * Generate a deterministic hash from string
 * @param {string} str - Input string
 * @returns {number} Hash number
 */
const hashString = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
};

/**
 * Generate display code from ID with random 4-digit number (deterministic)
 * @param {string} id - UUID hoặc ID dạng hash
 * @param {string} prefix - Prefix viết tắt (VD, DH, SP, CH, etc.)
 * @returns {string} Display code (VD: "VD1234")
 */
export const generateDisplayCode = (id, prefix) => {
  if (!id) return 'N/A';
  
  // Tạo hash từ ID để đảm bảo cùng một ID luôn tạo ra cùng một mã
  const hash = hashString(String(id));
  
  // Lấy 4 số cuối từ hash (đảm bảo là 4 chữ số)
  const randomNum = (hash % 10000).toString().padStart(4, '0');
  
  return `${prefix}${randomNum}`;
};

/**
 * Shipment ID → Mã vận đơn
 * VD: "69233e0b-..." → "VD1234"
 */
export const getShipmentCode = (shipmentId) => {
  return generateDisplayCode(shipmentId, 'VD');
};

/**
 * Order ID → Mã đơn hàng hiển thị
 * VD: "6942ba94f5bd3d765c8dd3cb" → "DH1234"
 */
export const getOrderCode = (orderId) => {
  if (!orderId) return 'N/A';

  // Một số nơi có thể truyền object Mongo-like, xử lý nhẹ cho an toàn
  let raw = orderId;
  if (typeof raw === 'object' && raw !== null) {
    raw =
      raw.id ??
      raw._id ??
      raw.$oid ??
      (raw.$id && (raw.$id.$oid || raw.$id)) ??
      raw.toString?.();
  }

  return generateDisplayCode(String(raw), 'DH');
};

/**
 * Product ID → Mã sản phẩm
 * VD: "658c42eb-..." → "SP658C42EB"
 */
export const getProductCode = (productId) => {
  return generateDisplayCode(productId, 'SP', 8);
};

/**
 * Product Variant ID → Mã biến thể
 * VD: "658c42eb-..." → "BT658C42EB"
 */
export const getVariantCode = (variantId) => {
  return generateDisplayCode(variantId, 'BT', 8);
};

/**
 * Store ID → Mã cửa hàng
 * VD: "store123-..." → "CH123"
 */
export const getStoreCode = (storeId) => {
  return generateDisplayCode(storeId, 'CH', 8);
};

/**
 * User ID → Mã người dùng
 * VD: "user456-..." → "ND456"
 */
export const getUserCode = (userId) => {
  return generateDisplayCode(userId, 'ND', 8);
};

/**
 * Promotion ID → Mã khuyến mãi
 * VD: "promo789-..." → "KM789"
 */
export const getPromotionCode = (promotionId) => {
  return generateDisplayCode(promotionId, 'KM', 8);
};

/**
 * Review ID → Mã đánh giá
 * VD: "review123-..." → "DG123"
 */
export const getReviewCode = (reviewId) => {
  return generateDisplayCode(reviewId, 'DG', 8);
};

/**
 * Transaction ID → Mã giao dịch
 * VD: "trans456-..." → "GD456"
 */
export const getTransactionCode = (transactionId) => {
  return generateDisplayCode(transactionId, 'GD', 8);
};

/**
 * Withdrawal ID → Mã rút tiền
 * VD: "withdraw789-..." → "RT789"
 */
export const getWithdrawalCode = (withdrawalId) => {
  return generateDisplayCode(withdrawalId, 'RT', 8);
};

/**
 * Format full display code with label
 * VD: getDisplayCodeWithLabel('69233e0b...', 'VD', 'Mã vận đơn')
 * → "Mã vận đơn: VD69233E0B"
 */
export const getDisplayCodeWithLabel = (id, prefix, label) => {
  const code = generateDisplayCode(id, prefix);
  return `${label}: ${code}`;
};
