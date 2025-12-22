import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createReview, updateReview } from '../../services/buyer/reviewService';
import { useToast } from '../../context/ToastContext';

const reviewSchema = z.object({
  rating: z.number().min(1, 'Vui lòng chọn số sao đánh giá').max(5),
  comment: z.string().optional().default(''),
  images: z.array(z.string().url('URL hình ảnh không hợp lệ')).max(5, 'Tối đa 5 hình ảnh').optional().default([])
});

/**
 * ReviewForm Component - REDESIGNED
 * Beautiful, modern form for creating or editing reviews
 */
const ReviewForm = ({ productVariantId, orderId, existingReview = null, onSuccess, onCancel }) => {
  const { success, error: showError } = useToast();
  const [hoveredRating, setHoveredRating] = useState(0);
  const [uploadedImages, setUploadedImages] = useState([]); // State cho ảnh đã upload (File objects)
  const [existingImages, setExistingImages] = useState([]); // State cho ảnh hiện có từ review (URLs)
  const [uploading, setUploading] = useState(false); // State loading khi upload

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset
  } = useForm({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: existingReview?.rating || 0,
      comment: existingReview?.comment || '',
      images: existingReview?.images || []
    }
  });

  const rating = watch('rating');
  const comment = watch('comment');
  const images = watch('images');

  // Update form when existingReview changes
  useEffect(() => {
    if (existingReview) {
      reset({
        rating: existingReview.rating,
        comment: existingReview.comment || '',
        images: existingReview.images || []
      });
      
      // Load existing images from review
      const reviewImages = existingReview.images || 
                          existingReview.imageUrls || 
                          (existingReview.reviewImages ? existingReview.reviewImages.map(img => img?.url || img?.imageUrl || img?.image || img).filter(Boolean) : []);
      setExistingImages(reviewImages);
      setUploadedImages([]); // Reset uploaded images when editing
    } else {
      setExistingImages([]);
      setUploadedImages([]);
    }
  }, [existingReview, reset]);

  // Rating labels
  const ratingLabels = {
    1: 'Rất không hài lòng',
    2: 'Không hài lòng',
    3: 'Bình thường',
    4: 'Hài lòng',
    5: 'Rất hài lòng'
  };

  const onSubmit = async (data) => {
    console.log('📝 [ReviewForm] onSubmit called');
    console.log('📝 [ReviewForm] Existing review?', !!existingReview);
    console.log('📝 [ReviewForm] ProductVariantId:', productVariantId);
    console.log('📝 [ReviewForm] OrderId:', orderId);
    
    if (!existingReview) {
      if (!productVariantId) {
        showError('Thiếu thông tin sản phẩm. Vui lòng thử lại.');
        return;
      }
      if (!orderId) {
        showError('Vui lòng đánh giá từ trang đơn hàng của bạn.');
        return;
      }
      
      // ✅ Kiểm tra order status trước khi submit
      // DELIVERED tức là đã hoàn thành rồi
      // Lưu ý: Backend sẽ validate lại, nhưng check ở frontend để hiển thị thông báo sớm hơn
      try {
        const { getOrderById } = await import('../../services/buyer/orderService');
        const orderResult = await getOrderById(orderId);
        if (orderResult.success && orderResult.data) {
          const orderStatus = orderResult.data.status;
          console.log('📦 [ReviewForm] Order status:', orderStatus);
          console.log('📦 [ReviewForm] Full order data:', orderResult.data);
          
          // DELIVERED hoặc COMPLETED đều được coi là đã hoàn thành
          if (orderStatus !== 'DELIVERED' && orderStatus !== 'COMPLETED') {
            showError(`Đơn hàng chưa hoàn tất. Chỉ có thể đánh giá khi đơn hàng đã được giao (trạng thái hiện tại: ${orderStatus}).`);
            return;
          }
        }
      } catch (err) {
        console.warn('⚠️ [ReviewForm] Could not check order status:', err);
        // Tiếp tục submit, để backend validate
      }
    }

    // ✅ Gửi ảnh nếu có
    const reviewData = {
      rating: data.rating,
      comment: data.comment.trim(),
      ...((!existingReview && productVariantId) && { productVariantId }),
      ...((!existingReview && orderId) && { orderId }),
    };
    
    // ✅ Nếu có ảnh đã chọn (ảnh mới upload), thêm vào reviewData
    // Lưu ý: Khi chỉnh sửa, chỉ gửi ảnh mới upload, ảnh cũ sẽ được giữ lại từ backend
    if (uploadedImages.length > 0) {
      reviewData.imageFiles = uploadedImages.map(img => img.file);
      console.log('📷 Gửi ảnh mới:', uploadedImages.map(img => img.name));
    }

    try {
      console.log('📝 [ReviewForm] Submitting review with data:', reviewData);
      console.log('📝 [ReviewForm] Existing review?', !!existingReview);
      
      let result;
      if (existingReview) {
        console.log('📝 [ReviewForm] Updating review ID:', existingReview.id);
        result = await updateReview(existingReview.id, reviewData);
      } else {
        console.log('📝 [ReviewForm] Creating new review');
        result = await createReview(reviewData);
      }

      console.log('📝 [ReviewForm] Result:', result);

      if (result.success) {
        console.log('✅ [ReviewForm] Review submitted successfully');
        success(result.message || 'Đánh giá thành công!');
        onSuccess && onSuccess(result.data);
        
        if (!existingReview) {
          reset({
            rating: 0,
            comment: '',
            images: []
          });
        }
      } else {
        console.error('❌ [ReviewForm] Review submission failed:', result.error);
        showError(result.error || 'Không thể gửi đánh giá');
      }
    } catch (error) {
      console.error('❌ [ReviewForm] Exception caught:', error);
      showError('Đã xảy ra lỗi khi gửi đánh giá');
    }
  };

  // Handle file upload
  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    
    const currentImages = uploadedImages || [];
    const remainingSlots = 5 - (existingImages.length + currentImages.length);
    
    if (files.length > remainingSlots) {
      showError(`Chỉ có thể thêm ${remainingSlots} ảnh nữa (tối đa 5 ảnh)`);
      return;
    }
    
    // Validate file size (max 5MB each)
    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        showError(`Ảnh "${file.name}" vượt quá 5MB`);
        return;
      }
    }
    
    // Create preview URLs
    const newImages = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      name: file.name
    }));
    
    setUploadedImages([...currentImages, ...newImages]);
    
    // Clear input
    e.target.value = '';
  };

  const handleImageRemove = (index) => {
    // Revoke URL để tránh memory leak
    if (uploadedImages[index]?.preview) {
      URL.revokeObjectURL(uploadedImages[index].preview);
    }
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Rating Section */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-100">
        <label className="block text-lg font-bold text-gray-900 mb-4">
          Đánh giá của bạn
        </label>
        
        {/* Star Rating */}
        <div className="flex items-center justify-center gap-3 mb-4">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setValue('rating', star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              className="transition-all duration-200 transform hover:scale-110"
            >
              <svg
                className={`w-12 h-12 ${
                  star <= (hoveredRating || rating)
                    ? 'text-yellow-400 fill-yellow-400'
                    : 'text-gray-300'
                }`}
                fill={star <= (hoveredRating || rating) ? 'currentColor' : 'none'}
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                  d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                />
              </svg>
            </button>
          ))}
        </div>

        {/* Rating Label */}
        {rating > 0 && (
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600 mb-1">
              {ratingLabels[rating]}
            </p>
            <p className="text-sm text-gray-600">
              {rating} / 5 sao
            </p>
          </div>
        )}
      </div>

      {/* Comment Section */}
      <div>
        <label className="block text-sm font-bold text-gray-900 mb-3">
          Nhận xét của bạn
        </label>
        <textarea
          {...register('comment')}
          rows={5}
          className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 transition-all resize-none ${
            errors.comment ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : 'border-gray-200 focus:border-blue-500 focus:ring-blue-200'
          }`}
          placeholder="Chia sẻ cảm nhận của bạn về sản phẩm này..."
          disabled={isSubmitting}
        />
        {errors.comment && (
          <p className="mt-1 text-sm text-red-600">{errors.comment.message}</p>
        )}
        <div className="flex items-center justify-end mt-2">
          <p className="text-xs text-gray-500">
            {comment.length} ký tự
          </p>
        </div>
      </div>

      {/* Images Section */}
      <div>
        <label className="block text-sm font-bold text-gray-900 mb-3">
          Hình ảnh (Tùy chọn)
        </label>
        
        {/* Upload Button */}
        {(existingImages.length + uploadedImages.length) < 5 && (
          <div className="mb-4">
            <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-sm font-medium text-gray-600">
                📷 Chọn ảnh từ máy tính
              </span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
            <p className="text-xs text-gray-500 mt-2 text-center">
              PNG, JPG, GIF tối đa 5MB mỗi ảnh
            </p>
          </div>
        )}
        
        {/* Existing Images (when editing) */}
        {existingImages.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-gray-600 mb-2">Ảnh hiện có:</p>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
              {existingImages.map((imgUrl, index) => (
                <div key={index} className="relative group aspect-square">
                  <img
                    src={imgUrl}
                    alt={`Existing review ${index + 1}`}
                    className="w-full h-full object-cover rounded-lg border-2 border-gray-200"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity rounded-lg flex items-center justify-center">
                    <span className="text-white text-xs font-medium opacity-0 group-hover:opacity-100">
                      Ảnh hiện có
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Image Preview Grid - New uploaded images */}
        {uploadedImages.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-gray-600 mb-2">Ảnh mới thêm:</p>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
              {uploadedImages.map((img, index) => (
                <div key={index} className="relative group aspect-square">
                  <img
                    src={img.preview}
                    alt={`New review ${index + 1}`}
                    className="w-full h-full object-cover rounded-lg border-2 border-blue-300"
                  />
                  <button
                    type="button"
                    onClick={() => handleImageRemove(index)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 truncate rounded-b-lg">
                    {img.name}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <p className="text-xs text-gray-500">
          {existingImages.length + uploadedImages.length}/5 hình ảnh 
          {existingImages.length > 0 && ` (${existingImages.length} ảnh hiện có + ${uploadedImages.length} ảnh mới)`}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all disabled:opacity-50"
          >
            Hủy
          </button>
        )}
        
        <button
          type="submit"
          disabled={isSubmitting || rating === 0}
          className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Đang gửi...
            </span>
          ) : (
            <span>
              {existingReview ? 'Cập nhật đánh giá' : '✍️ Gửi đánh giá'}
            </span>
          )}
        </button>
      </div>
    </form>
  );
};

export default ReviewForm;
