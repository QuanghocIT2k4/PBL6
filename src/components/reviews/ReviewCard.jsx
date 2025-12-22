import { memo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useSWR from 'swr';
import { getProductVariantById } from '../../services/common/productService';
import { getOrderById } from '../../services/buyer/orderService';

/**
 * Format time ago without external library
 * Hiển thị format tương đối: "X phút trước", "X giờ trước", etc.
 */
const formatTimeAgo = (dateString) => {
  if (!dateString) return '';
  
  const now = new Date();
  const past = new Date(dateString);
  const diffMs = now - past;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffWeek = Math.floor(diffDay / 7);
  const diffMonth = Math.floor(diffDay / 30);
  const diffYear = Math.floor(diffDay / 365);

  if (diffSec < 60) return 'Vừa xong';
  if (diffMin < 60) return `${diffMin} phút trước`;
  if (diffHour < 24) return `${diffHour} giờ trước`;
  if (diffDay < 7) return `${diffDay} ngày trước`;
  if (diffWeek < 4) return `${diffWeek} tuần trước`;
  if (diffMonth < 12) return `${diffMonth} tháng trước`;
  return `${diffYear} năm trước`;
};

/**
 * ReviewCard Component
 * Displays a single review with rating, comment, images, and user info
 */
const ReviewCard = ({ review, onEdit, onDelete, isOwner = false, isStoreView = false }) => {
  const navigate = useNavigate();
  const [showFullComment, setShowFullComment] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const {
    id,
    rating,
    comment,
    images = [],
    createdAt,
    updatedAt,
    user = {},
    product = {},
    productVariant = {},
    order = {},
  } = review;

  // Lấy ID từ DBRef hoặc object
  // DBRef format: { $ref: 'collection', $id: 'id' } hoặc string ID
  const productVariantId = 
    (typeof productVariant === 'string') ? productVariant :
    productVariant?.$id || 
    productVariant?.id || 
    productVariant?.oid ||
    review.productVariantId ||
    review.productVariant;
  
  const orderId = 
    (typeof order === 'string') ? order :
    order?.$id || 
    order?.id || 
    order?.oid ||
    review.orderId ||
    review.order;

  // Kiểm tra xem có phải DBRef không (chỉ có ID, không có name/image)
  const isProductVariantDBRef = productVariantId && !productVariant?.name && !productVariant?.variantName && !productVariant?.images;
  const isOrderDBRef = orderId && !order?.items && !order?.storeName && !order?.totalAmount;

  // Fetch thông tin chi tiết nếu là DBRef
  const { data: variantData } = useSWR(
    isProductVariantDBRef ? ['product-variant', productVariantId] : null,
    () => getProductVariantById(productVariantId),
    { revalidateOnFocus: false }
  );

  // ✅ Store owner không cần và không thể truy cập order details của buyer
  const { data: orderData } = useSWR(
    !isStoreView && isOrderDBRef ? ['order-detail', orderId] : null,
    () => getOrderById(orderId),
    { 
      revalidateOnFocus: false,
      onError: (error) => {
        // ✅ Chỉ log error nếu không phải 400/404 (order not found)
        if (error?.response?.status !== 400 && error?.response?.status !== 404) {
          console.error('Error fetching order:', error);
        }
      },
    }
  );

  // Merge data từ API với data từ review
  const finalProductVariant = variantData?.success ? variantData.data : productVariant;
  const finalOrder = orderData?.success ? orderData.data : order;

  // Lấy ID variant để navigate (ưu tiên từ finalProductVariant, sau đó từ review)
  const variantIdForNavigation = 
    finalProductVariant?.id ||
    finalProductVariant?._id ||
    productVariantId ||
    review.productVariantId ||
    null;

  // Handler để navigate đến trang chi tiết sản phẩm
  const handleProductClick = () => {
    if (variantIdForNavigation) {
      navigate(`/product/${variantIdForNavigation}`);
    }
  };

  // Lấy ảnh sản phẩm (ưu tiên variant, sau đó product, sau đó order item)
  const productImage =
    finalProductVariant?.images?.[0] ||
    finalProductVariant?.image ||
    product?.images?.[0] ||
    product?.image ||
    finalProductVariant?.product?.images?.[0] ||
    finalOrder?.items?.[0]?.image ||
    finalOrder?.items?.[0]?.productImage ||
    review.productImage ||
    null;

  // Lấy tên sản phẩm (ưu tiên variant, sau đó product, sau đó order item)
  const productName =
    finalProductVariant?.name ||
    finalProductVariant?.variantName ||
    finalProductVariant?.product?.name ||
    product?.name ||
    finalOrder?.items?.[0]?.variantName ||
    finalOrder?.items?.[0]?.productName ||
    finalOrder?.items?.[0]?.name ||
    review.productName ||
    review.productVariantName ||
    'Sản phẩm';

  // Lấy tên shop (ưu tiên từ review, sau đó product/store, sau đó order)
  const shopName =
    review.storeName ||
    review.shopName ||
    product?.storeName ||
    finalProductVariant?.storeName ||
    finalProductVariant?.store?.name ||
    product?.store?.name ||
    finalOrder?.storeName ||
    finalOrder?.shop?.name ||
    finalOrder?.store?.name ||
    'Cửa hàng';

  // Chuẩn hóa mảng ảnh từ nhiều định dạng trả về khác nhau
  const normalizedImages =
    (Array.isArray(images) && images.length > 0 && images) ||
    (Array.isArray(review.imageUrls) && review.imageUrls.length > 0 && review.imageUrls) ||
    (Array.isArray(review.reviewImages) && review.reviewImages.length > 0
      ? review.reviewImages
          .map((img) => img?.url || img?.imageUrl || img?.image || img)
          .filter(Boolean)
      : []);

  // Format date
  const timeAgo = formatTimeAgo(createdAt);
  const isEdited = updatedAt && updatedAt !== createdAt;

  // Truncate long comments
  const MAX_COMMENT_LENGTH = 300;
  const needsTruncation = comment && comment.length > MAX_COMMENT_LENGTH;
  const displayComment = needsTruncation && !showFullComment
    ? `${comment.substring(0, MAX_COMMENT_LENGTH)}...`
    : comment;

  return (
    <>
      <div className="bg-white border-b border-gray-200 p-6">
        {/* User Info & Rating */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            {/* Avatar */}
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.fullName || 'User'}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span>{(user.fullName || 'U')[0].toUpperCase()}</span>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold text-gray-900">
                  {user.fullName || user.name || user.username || 'Người dùng'}
                </p>
                {timeAgo && (
                  <span className="text-xs text-gray-500">
                    {timeAgo}
                    {isEdited && ' (đã chỉnh sửa)'}
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-2">
                {/* Stars */}
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                      key={star}
                      className={`w-4 h-4 ${
                        star <= rating ? 'text-yellow-400' : 'text-gray-300'
                      }`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                
              </div>
            </div>
          </div>

          {/* Edit/Delete Actions (only show if owner AND functions provided) */}
          {isOwner && (onEdit || onDelete) && (
            <div className="flex items-center space-x-2">
              {onEdit && (
                <button
                  onClick={() => onEdit(review)}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Sửa
                </button>
              )}
              {onEdit && onDelete && <span className="text-gray-300">|</span>}
              {onDelete && (
                <button
                  onClick={() => onDelete(id)}
                  className="text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  Xóa
                </button>
              )}
            </div>
          )}
        </div>

        {/* Comment */}
        {comment && (
          <div className="mb-3">
            <p className="text-gray-700 whitespace-pre-wrap">{displayComment}</p>
            {needsTruncation && (
              <button
                onClick={() => setShowFullComment(!showFullComment)}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium mt-1"
              >
                {showFullComment ? 'Thu gọn' : 'Xem thêm'}
              </button>
            )}
          </div>
        )}

        {/* Images */}
        {normalizedImages && normalizedImages.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {normalizedImages.map((image, index) => (
              <button
                key={index}
                onClick={() => setSelectedImage(image)}
                className="w-20 h-20 rounded-lg overflow-hidden border border-gray-200 hover:border-blue-500 transition-colors"
              >
                <img
                  src={image}
                  alt={`Review image ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Image Lightbox */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 text-white hover:text-gray-300"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img
            src={selectedImage}
            alt="Review"
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
};

ReviewCard.displayName = 'ReviewCard';

export default memo(ReviewCard);

