import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Button from '../ui/Button';

const MultiProductReview = ({ items, orderId, onComplete, onCancel }) => {
  const { user } = useAuth();
  const { success, error } = useToast();
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [reviews, setReviews] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const currentItem = items[currentItemIndex];
  const isLastItem = currentItemIndex === items.length - 1;
  const totalItems = items.length;
  
  // Helper: Get variant ID from order item (backend đã đổi productId → productVariantId)
  const getItemKey = (item) => item.productVariantId || item.productId || item.id;

  const handleRatingChange = (rating) => {
    const itemKey = getItemKey(currentItem);
    setReviews(prev => ({
      ...prev,
      [itemKey]: {
        ...prev[itemKey],
        rating
      }
    }));
  };

  const handleCommentChange = (comment) => {
    const itemKey = getItemKey(currentItem);
    setReviews(prev => ({
      ...prev,
      [itemKey]: {
        ...prev[itemKey],
        comment
      }
    }));
  };

  const handleImageUpload = (event) => {
    const files = Array.from(event.target.files);
    if (files.length > 0) {
      // Convert files to base64 for demo (in real app, upload to server)
      const imagePromises = files.map(file => {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.readAsDataURL(file);
        });
      });

      Promise.all(imagePromises).then(images => {
        const itemKey = getItemKey(currentItem);
        setReviews(prev => ({
          ...prev,
          [itemKey]: {
            ...prev[itemKey],
            images: [...(prev[itemKey]?.images || []), ...images]
          }
        }));
      });
    }
  };

  const removeImage = (index) => {
    const itemKey = getItemKey(currentItem);
    setReviews(prev => ({
      ...prev,
      [itemKey]: {
        ...prev[itemKey],
        images: prev[itemKey]?.images?.filter((_, i) => i !== index) || []
      }
    }));
  };

  const handleNext = () => {
    const itemKey = getItemKey(currentItem);
    const currentReview = reviews[itemKey];
    if (!currentReview?.rating) {
      error('Vui lòng chọn số sao đánh giá');
      return;
    }

    if (isLastItem) {
      handleSubmitAll();
    } else {
      setCurrentItemIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentItemIndex > 0) {
      setCurrentItemIndex(prev => prev - 1);
    }
  };

  const handleSubmitAll = async () => {
    setSubmitting(true);
    try {
      // Submit all reviews
      const { reviewService } = await import('../../services/reviewService');
      
      for (const [productId, reviewData] of Object.entries(reviews)) {
        const result = await reviewService.submitReview(productId, {
          ...reviewData,
          content: reviewData.comment || '', // Map comment to content, allow empty
          images: reviewData.images || [], // Include uploaded images
          userName: user?.name,
          verifiedPurchase: true,
          orderId: orderId
        });
        
        if (!result.success) {
          throw new Error(result.error || 'Gửi đánh giá thất bại');
        }
      }

      success(`🎉 Đã đánh giá thành công ${totalItems} sản phẩm!`);
      onComplete();
    } catch (err) {
      error('❌ Có lỗi khi gửi đánh giá: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = () => {
    const itemKey = getItemKey(currentItem);
    const currentRating = reviews[itemKey]?.rating || 0;
    
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => handleRatingChange(star)}
            className={`w-8 h-8 transition-colors ${
              star <= currentRating ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-300'
            }`}
          >
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
            </svg>
          </button>
        ))}
        <span className="ml-2 text-sm text-gray-600">
          {currentRating > 0 ? `${currentRating}/5 sao` : 'Chọn số sao'}
        </span>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                Đánh giá sản phẩm ({currentItemIndex + 1}/{totalItems})
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Đánh giá từng sản phẩm để hoàn thành đơn hàng
              </p>
            </div>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Product Info */}
        <div className="p-6 border-b bg-gray-50">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center overflow-hidden">
              {typeof currentItem.image === 'string' && currentItem.image.startsWith('http') ? (
                <img src={currentItem.image} alt={currentItem.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl">{currentItem.image}</span>
              )}
            </div>
            <div>
              <h4 className="font-medium text-gray-900">{currentItem.name}</h4>
              <p className="text-sm text-gray-600">Số lượng: {currentItem.quantity}</p>
              {currentItem.options && Object.keys(currentItem.options).length > 0 && (
                <div className="text-xs text-gray-500 mt-1">
                  {Object.entries(currentItem.options).map(([key, value], index) => (
                    <span key={key}>
                      {key}: {value}
                      {index < Object.keys(currentItem.options).length - 1 ? ' • ' : ''}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Review Form */}
        <div className="p-6">
          <div className="space-y-6">
            {/* Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Đánh giá tổng quan *
              </label>
              {renderStars()}
            </div>

            {/* Comment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bình luận (tùy chọn)
              </label>
              <textarea
                value={reviews[getItemKey(currentItem)]?.comment || ''}
                onChange={(e) => handleCommentChange(e.target.value)}
                placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm này... (không bắt buộc)"
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="mt-1 text-xs text-gray-500">
                Bình luận là tùy chọn, bạn có thể để trống
              </div>
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hình ảnh sản phẩm (tùy chọn)
              </label>
              
              {/* Upload Button */}
              <div className="mb-3">
                <input
                  type="file"
                  id={`image-upload-${getItemKey(currentItem)}`}
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <label
                  htmlFor={`image-upload-${getItemKey(currentItem)}`}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  📷 Thêm hình ảnh
                </label>
                <span className="ml-2 text-xs text-gray-500">
                  Tối đa 5 hình, định dạng JPG/PNG
                </span>
              </div>

              {/* Image Preview */}
              {reviews[getItemKey(currentItem)]?.images && reviews[getItemKey(currentItem)].images.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {reviews[getItemKey(currentItem)].images.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={image}
                        alt={`Review image ${index + 1}`}
                        className="w-full h-20 object-cover rounded-lg border border-gray-200"
                      />
                      <button
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {currentItemIndex > 0 && (
              <Button
                onClick={handlePrevious}
                variant="outline"
                disabled={submitting}
              >
                ← Trước
              </Button>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              onClick={onCancel}
              variant="outline"
              disabled={submitting}
            >
              Hủy
            </Button>
            <Button
              onClick={handleNext}
              disabled={submitting}
              loading={submitting}
            >
              {isLastItem ? 'Hoàn thành' : 'Tiếp theo →'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MultiProductReview;
