import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../layouts/MainLayout';
import ReviewCard from '../../components/reviews/ReviewCard';
import ReviewForm from '../../components/reviews/ReviewForm';
import { getBuyerReviews, updateReview } from '../../services/buyer/reviewService';
import { useToast } from '../../context/ToastContext';
import useSWR from 'swr';
import SEO from '../../components/seo/SEO';

/**
 * MyReviewsPage Component
 * Displays user's review history with edit and delete functionality
 */
const MyReviewsPage = () => {
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  const [currentPage, setCurrentPage] = useState(0);
  const [activeTab, setActiveTab] = useState('reviewed'); // 'pending' hoặc 'reviewed'
  const [editingReview, setEditingReview] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const pageSize = 20;

  // Fetch reviews - Sort từ mới nhất đến trễ nhất
  const { data: reviewsData, error: reviewsError, mutate } = useSWR(
    ['my-reviews', currentPage],
    () => getBuyerReviews({
      page: currentPage,
      size: pageSize,
      sortBy: 'createdAt',
      sortDir: 'desc', // Sắp xếp từ mới nhất đến trễ nhất
    }),
    {
      revalidateOnFocus: false,
      keepPreviousData: true,
    }
  );

  const reviews = reviewsData?.success ? (reviewsData.data?.content || reviewsData.data || []) : [];
  const totalPages = reviewsData?.data?.page?.totalPages || reviewsData?.data?.totalPages || 1;
  const totalReviews = reviewsData?.data?.page?.totalElements || reviewsData?.data?.totalElements || reviews.length;

  // Filter reviews based on active tab
  let filteredReviews = activeTab === 'reviewed' 
    ? reviews.filter(review => review.rating && review.rating > 0)
    : reviews.filter(review => !review.rating || review.rating === 0);

  // ✅ Đảm bảo sắp xếp từ mới nhất đến cũ nhất (desc theo createdAt)
  filteredReviews = [...filteredReviews].sort((a, b) => {
    const dateA = new Date(a.createdAt || a.created_at || 0);
    const dateB = new Date(b.createdAt || b.created_at || 0);
    return dateB - dateA; // Mới nhất trước (desc)
  });

  // Handle edit review
  const handleEdit = (review) => {
    setEditingReview(review);
    setShowReviewModal(true);
  };

  // Handle review update success
  const handleReviewSuccess = () => {
    setShowReviewModal(false);
    setEditingReview(null);
    success('Đánh giá đã được cập nhật thành công!');
    mutate(); // Refresh reviews list
  };

  // Loading state
  if (!reviewsData && !reviewsError) {
    return (
      <MainLayout>
        <SEO 
          title="Đánh giá của tôi | E-Comm"
          description="Xem và quản lý lịch sử đánh giá sản phẩm của bạn."
          keywords="đánh giá, lịch sử đánh giá, review"
          url="https://pbl-6-eight.vercel.app/reviews/my"
        />
        <div className="bg-gray-50 min-h-screen py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="animate-pulse space-y-4">
                    <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-20 bg-gray-200 rounded"></div>
                    <div className="h-10 bg-gray-200 rounded w-1/4"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <SEO 
        title="Đánh giá của tôi | E-Comm"
        description="Xem và quản lý lịch sử đánh giá sản phẩm của bạn."
        keywords="đánh giá, lịch sử đánh giá, review"
        url="https://pbl-6-eight.vercel.app/reviews/my"
      />
      <div className="bg-gray-50 min-h-screen py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Page Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Đánh giá của tôi
              </h1>
              <p className="text-sm text-gray-600">
                Quản lý và chỉnh sửa các đánh giá bạn đã viết
              </p>
            </div>
            <button
              onClick={() => navigate('/orders')}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              ← Quay lại đơn hàng
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="bg-white border border-gray-200 rounded-lg mb-6">
            <div className="flex items-center border-b border-gray-200">
              <button
                onClick={() => {
                  setActiveTab('pending');
                  setCurrentPage(0);
                }}
                className={`flex-1 px-6 py-3 text-sm font-medium transition-colors relative ${
                  activeTab === 'pending'
                    ? 'text-purple-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Chưa đánh giá
                {activeTab === 'pending' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600"></div>
                )}
              </button>
              <button
                onClick={() => {
                  setActiveTab('reviewed');
                  setCurrentPage(0);
                }}
                className={`flex-1 px-6 py-3 text-sm font-medium transition-colors relative ${
                  activeTab === 'reviewed'
                    ? 'text-purple-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Đã đánh giá
                {activeTab === 'reviewed' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600"></div>
                )}
              </button>
            </div>
          </div>

          {/* Reviews List */}
          {reviewsError ? (
            <div className="bg-red-50 rounded-lg border border-red-200 p-6 text-center">
              <div className="text-red-600 text-5xl mb-4">⚠️</div>
              <h3 className="text-lg font-semibold text-red-900 mb-2">
                Không thể tải danh sách đánh giá
              </h3>
              <p className="text-red-700">{reviewsError.message}</p>
            </div>
          ) : filteredReviews.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <div className="text-gray-400 text-6xl mb-4">💬</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {activeTab === 'reviewed' ? 'Chưa có đánh giá nào' : 'Không có sản phẩm cần đánh giá'}
              </h3>
              <p className="text-gray-600 mb-6">
                {activeTab === 'reviewed' 
                  ? 'Bạn chưa đánh giá sản phẩm nào.'
                  : 'Tất cả sản phẩm đã được đánh giá.'}
              </p>
              <button
                onClick={() => navigate('/orders')}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Xem đơn hàng của tôi
              </button>
            </div>
          ) : (
            <>
              {/* Review Cards */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                {filteredReviews.map((review) => (
                  <ReviewCard
                    key={review.id}
                    review={review}
                    isOwner={true}
                    onEdit={handleEdit}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="bg-white rounded-lg border border-gray-200 p-6 mt-4">
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
                                ? 'bg-purple-600 text-white border-purple-600'
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

      {/* Edit Review Modal */}
      {showReviewModal && editingReview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-slideUp">
            <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-4 flex items-center justify-between">
              <div className="text-white">
                <h3 className="text-xl font-black">✍️ Chỉnh sửa đánh giá</h3>
                <p className="text-sm text-purple-100 mt-1">
                  {editingReview.product?.name || editingReview.productVariant?.name || 'Sản phẩm'}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowReviewModal(false);
                  setEditingReview(null);
                }}
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              <ReviewForm
                existingReview={editingReview}
                onSuccess={handleReviewSuccess}
                onCancel={() => {
                  setShowReviewModal(false);
                  setEditingReview(null);
                }}
              />
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </MainLayout>
  );
};

export default MyReviewsPage;

