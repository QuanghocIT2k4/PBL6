/**
 * DISPLAY CODE UTILITIES
 * Chuyển đổi ID dạng UUID/hash thành mã hiển thị thân thiện với user
 */

/**
 * Generate display code from ID
 * @param {string} id - UUID hoặc ID dạng hash
 * @param {string} prefix - Prefix viết tắt (VD, DH, SP, CH, etc.)
 * @param {number} length - Số ký tự lấy từ ID (default: 8)
 * @returns {string} Display code (VD: "VD69233E0B")
 */
export const generateDisplayCode = (id, prefix, length = 8) => {
  if (!id) return 'N/A';
  
  // Loại bỏ dấu gạch ngang nếu là UUID
  const cleanId = id.replace(/-/g, '');
  
  // Lấy N ký tự đầu và uppercase
  const shortId = cleanId.substring(0, length).toUpperCase();
  
  return `${prefix}${shortId}`;
};

/**
 * Shipment ID → Mã vận đơn
 * VD: "69233e0b-..." → "VD69233E0B"
 */
export const getShipmentCode = (shipmentId) => {
  return generateDisplayCode(shipmentId, 'VD', 8);
};

/**
 * Order ID → Mã đơn hàng
 * VD: "69233170-..." → "DH69233170"
 */
export const getOrderCode = (orderId) => {
  return generateDisplayCode(orderId, 'DH', 8);
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
