import { useState, useEffect, useCallback } from 'react';
import { reviewService } from '../services/buyer/reviewService';

export const useReviews = (productId) => {
  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Fetch reviews
  const fetchReviews = useCallback(async (page = 0, filter = 'all', sortBy = 'newest') => {
    try {
      setLoading(true);
      setError(null);
      
      // ❌ REMOVED: getProductReviews() - API không tồn tại trong Swagger
      // API chỉ support product-variant reviews, không có product reviews
      // TODO: Refactor to use productVariantId instead of productId
      throw new Error('getProductReviews API không tồn tại. Vui lòng dùng getProductVariantReviews với productVariantId.');
      
      if (result.success) {
        setReviews(result.data.reviews);
        setSummary(result.data.summary);
        setPagination(result.data.pagination);
      } else {
        setError('Không thể tải đánh giá');
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching reviews:', err);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  // Submit new review
  const submitReview = async (reviewData) => {
    try {
      setSubmitting(true);
      // ❌ REMOVED: submitReview() - API không tồn tại
      // TODO: Use createReview() from reviewService với productVariantId
      throw new Error('submitReview API không tồn tại. Vui lòng dùng createReview với productVariantId.');
      
      if (result.success) {
        // Add new review to the beginning of the list
        setReviews(prev => [result.data, ...prev]);
        
        // Update summary
        setSummary(prev => ({
          ...prev,
          totalReviews: prev.totalReviews + 1,
          // Recalculate average rating
          averageRating: ((prev.averageRating * prev.totalReviews) + reviewData.rating) / (prev.totalReviews + 1)
        }));
        
        return result;
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  // Reply to review
  const replyToReview = async (reviewId, replyData) => {
    try {
      // ❌ REMOVED: replyToReview() - API không tồn tại trong Swagger
      throw new Error('replyToReview API không tồn tại.');
      
      if (result.success) {
        // Add reply to the specific review
        setReviews(prev => prev.map(review => 
          review.id === reviewId 
            ? { ...review, replies: [...review.replies, result.data] }
            : review
        ));
        
        return result;
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      throw err;
    }
  };

  // Mark review as helpful
  const markHelpful = async (reviewId, isHelpful) => {
    try {
      // ❌ REMOVED: markReviewHelpful() - API không tồn tại trong Swagger
      throw new Error('markReviewHelpful API không tồn tại.');
      
      if (result.success) {
        setReviews(prev => prev.map(review => 
          review.id === reviewId 
            ? { 
                ...review, 
                helpful: result.data.newHelpfulCount,
                notHelpful: result.data.newNotHelpfulCount
              }
            : review
        ));
        
        return result;
      }
    } catch (err) {
      console.error('Error marking review helpful:', err);
    }
  };

  // Initial fetch
  useEffect(() => {
    if (productId) {
      fetchReviews();
    }
  }, [productId, fetchReviews]);

  return {
    reviews,
    summary,
    pagination,
    loading,
    error,
    submitting,
    fetchReviews,
    submitReview,
    replyToReview,
    markHelpful
  };
};