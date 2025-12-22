import { useState } from 'react';
import useSWR from 'swr';
import ReviewCard from './ReviewCard';
import ReviewStats from './ReviewStats';
import { getProductVariantReviews, getProductVariantReviewStats, deleteReview } from '../../services/buyer/reviewService';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { confirmDelete } from '../../utils/sweetalert';

/**
 * ReviewList Component
 * Displays list of reviews with stats, filtering, and pagination
 */
const ReviewList = ({ productVariantId, onWriteReview, allowEdit = false, isStoreView = false }) => {
  const { user } = useAuth();
  const { success, error: showError } = useToast();
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedRating, setSelectedRating] = useState(null);
  const [hasImagesOnly, setHasImagesOnly] = useState(false);
  const pageSize = 10;

  // Fetch review stats
  const { data: statsData } = useSWR(
    productVariantId ? ['review-stats', productVariantId] : null,
    () => getProductVariantReviewStats(productVariantId),
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // Cache 1 minute
    }
  );

  // Fetch reviews
  const { data: reviewsData, error: reviewsError, mutate } = useSWR(
    productVariantId ? ['reviews', productVariantId, currentPage, selectedRating, hasImagesOnly] : null,
    () => getProductVariantReviews(productVariantId, {
      page: currentPage,
      size: pageSize,
      rating: selectedRating,
      hasImages: hasImagesOnly || null,
    }),
    {
      revalidateOnFocus: false,
      keepPreviousData: true,
    }
  );

  const stats = statsData?.success ? statsData.data : null;
  const reviews = reviewsData?.success ? (reviewsData.data?.content || reviewsData.data || []) : [];
  const totalPages = reviewsData?.data?.page?.totalPages || reviewsData?.data?.totalPages || 1;
  const totalReviews = reviewsData?.data?.page?.totalElements || reviewsData?.data?.totalElements || reviews.length;

  // Handle filter by rating
  const handleFilterByRating = (rating) => {
    setSelectedRating(rating);
    setCurrentPage(0); // Reset to first page
  };

  // Handle delete review
  const handleDelete = async (reviewId) => {
    const confirmed = await confirmDelete('đánh giá này');
    if (!confirmed) {
      return;
    }

    const result = await deleteReview(reviewId);
    if (result.success) {
      success(result.message);
      mutate(); // Refresh reviews list
    } else {
      showError(result.error);
    }
  };

  // Handle edit review
  const handleEdit = (review) => {
    // Open review form with existing data
    onWriteReview && onWriteReview(review);
  };

  // Loading state
  if (!reviewsData && !reviewsError) {
    return (
      <div className="bg-white rounded-lg p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Review Stats */}
      <ReviewStats
        stats={stats}
        onFilterByRating={handleFilterByRating}
        selectedRating={selectedRating}
      />

      {/* Filters & Actions */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Filter by images */}
            <button
              onClick={() => {
                setHasImagesOnly(!hasImagesOnly);
                setCurrentPage(0);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                hasImagesOnly
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📷 Có hình ảnh
            </button>

            {/* Active filters display */}
            {(selectedRating || hasImagesOnly) && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Đang lọc:</span>
                {selectedRating && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-yellow-100 text-yellow-800">
                    {selectedRating} ⭐
                    <button
                      onClick={() => handleFilterByRating(null)}
                      className="ml-2 hover:text-yellow-900"
                    >
                      ×
                    </button>
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {reviews.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-gray-400 text-6xl mb-4">💬</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Chưa có đánh giá nào
            </h3>
            <p className="text-gray-600">
              {selectedRating || hasImagesOnly
                ? 'Không tìm thấy đánh giá phù hợp với bộ lọc'
                : 'Chưa có đánh giá nào cho sản phẩm này'}
            </p>
          </div>
        ) : (
          <>
            {/* Review Cards */}
            {reviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                isOwner={user && user.id === review.user?.id}
                onEdit={allowEdit ? handleEdit : undefined}
                onDelete={allowEdit ? handleDelete : undefined}
                isStoreView={isStoreView}
              />
            ))}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-6 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    Hiển thị {currentPage * pageSize + 1} - {Math.min((currentPage + 1) * pageSize, totalReviews)} / {totalReviews} đánh giá
                  </p>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 0}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      ‹ Trước
                    </button>

                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i;
                      } else if (currentPage < 3) {
                        pageNum = i;
                      } else if (currentPage > totalPages - 3) {
                        pageNum = totalPages - 5 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-4 py-2 border rounded-md text-sm font-medium ${
                            currentPage === pageNum
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum + 1}
                        </button>
                      );
                    })}

                    <button
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage >= totalPages - 1}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Sau ›
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ReviewList;

