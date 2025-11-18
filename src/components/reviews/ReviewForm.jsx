import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createReview, updateReview } from '../../services/buyer/reviewService';
import { useToast } from '../../context/ToastContext';

const reviewSchema = z.object({
  rating: z.number().min(1, 'Vui lòng chọn số sao đánh giá').max(5),
  comment: z.string().min(10, 'Nhận xét phải có ít nhất 10 ký tự').trim(),
  images: z.array(z.string().url('URL hình ảnh không hợp lệ')).max(5, 'Tối đa 5 hình ảnh').optional().default([])
});

/**
 * ReviewForm Component - REDESIGNED
 * Beautiful, modern form for creating or editing reviews
 */
const ReviewForm = ({ productVariantId, orderId, existingReview = null, onSuccess, onCancel }) => {
  const { success, error: showError } = useToast();
  const [hoveredRating, setHoveredRating] = useState(0);

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
    if (!existingReview) {
      if (!productVariantId) {
        showError('Thiếu thông tin sản phẩm. Vui lòng thử lại.');
        return;
      }
      if (!orderId) {
        showError('Vui lòng đánh giá từ trang đơn hàng của bạn.');
        return;
      }
    }

    const reviewData = {
      rating: data.rating,
      comment: data.comment.trim(),
      images: data.images || [],
      ...((!existingReview && productVariantId) && { productVariantId }),
      ...((!existingReview && orderId) && { orderId }),
    };

    try {
      let result;
      if (existingReview) {
        result = await updateReview(existingReview.id, reviewData);
      } else {
        result = await createReview(reviewData);
      }

      if (result.success) {
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
        showError(result.error || 'Không thể gửi đánh giá');
      }
    } catch (error) {
      showError('Đã xảy ra lỗi khi gửi đánh giá');
    }
  };

  const handleImageUrlAdd = () => {
    const url = prompt('Nhập URL hình ảnh:');
    if (url && url.trim()) {
      const currentImages = images || [];
      if (currentImages.length >= 5) {
        showError('Tối đa 5 hình ảnh');
        return;
      }
      setValue('images', [...currentImages, url.trim()]);
    }
  };

  const handleImageRemove = (index) => {
    const currentImages = images || [];
    setValue('images', currentImages.filter((_, i) => i !== index));
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
          Nhận xét của bạn <span className="text-red-500">*</span>
        </label>
        <textarea
          {...register('comment')}
          rows={5}
          className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 transition-all resize-none ${
            errors.comment ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : 'border-gray-200 focus:border-blue-500 focus:ring-blue-200'
          }`}
          placeholder="Chia sẻ cảm nhận của bạn về sản phẩm này... (Bắt buộc)"
          disabled={isSubmitting}
        />
        {errors.comment && (
          <p className="mt-1 text-sm text-red-600">{errors.comment.message}</p>
        )}
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-gray-500">
            Tối thiểu 10 ký tự
          </p>
          <p className={`text-xs ${comment.length >= 10 ? 'text-green-600' : 'text-gray-400'}`}>
            {comment.length} ký tự
          </p>
        </div>
      </div>

      {/* Images Section */}
      <div>
        <label className="block text-sm font-bold text-gray-900 mb-3">
          Hình ảnh (Tùy chọn)
        </label>
        
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-3">
          {(images || []).map((img, index) => (
            <div key={index} className="relative group aspect-square">
              <img
                src={img}
                alt={`Review ${index + 1}`}
                className="w-full h-full object-cover rounded-lg border-2 border-gray-200"
              />
              <button
                type="button"
                onClick={() => handleImageRemove(index)}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
          
          {(images || []).length < 5 && (
            <button
              type="button"
              onClick={handleImageUrlAdd}
              className="aspect-square border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all flex flex-col items-center justify-center text-gray-400 hover:text-blue-500"
            >
              <svg className="w-8 h-8 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-xs font-medium">Thêm ảnh</span>
            </button>
          )}
        </div>
        
        <p className="text-xs text-gray-500">
          Tối đa 5 hình ảnh. Click "Thêm ảnh" để thêm URL hình ảnh.
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
          disabled={isSubmitting || rating === 0 || !comment.trim()}
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
