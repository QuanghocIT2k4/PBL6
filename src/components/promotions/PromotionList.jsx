import { useState } from 'react';
import PropTypes from 'prop-types';
import useSWR from 'swr';
import { 
  formatDiscountValue,
  formatCurrency,
  isPromotionValid,
  getPromotionErrorMessage,
} from '../../services/admin/promotionService';
import { 
  getStoreAvailablePromotions, 
  getPlatformAvailablePromotions 
} from '../../services/buyer/buyerPromotionService';

const PromotionList = ({ 
  orderTotal, 
  storeId, 
  productIds = [],
  onSelectPromotion,
  selectedCode = null,
}) => {
  const [showList, setShowList] = useState(false);
  // 🔥 FIX: Force store tab when storeId exists
  const [activeTab, setActiveTab] = useState('store'); // Always start with store tab
  

  // ✅ Fetch platform promotions
  const { data: platformData, isLoading: loadingPlatform } = useSWR(
    showList && orderTotal ? ['platform-promotions', orderTotal] : null,
    async () => {
      const result = await getPlatformAvailablePromotions({
        orderValue: orderTotal,
        page: 0,
        size: 20,
      });
      
      
      return result;
    },
    { revalidateOnFocus: false }
  );


  // ✅ Fetch store promotions - BỎ CHECK showList để fetch ngay khi có storeId
  const { data: storeData, isLoading: loadingStore, error: storeError } = useSWR(
    storeId && orderTotal > 0 ? ['store-promotions', storeId, orderTotal] : null,  // 🔥 FIX: Check orderTotal > 0
    async () => {
      const result = await getStoreAvailablePromotions(storeId, {
        orderValue: orderTotal, // 🔥 Back to real orderValue
        page: 0,
        size: 20,
      });
      
      
      return result;
    },
    { revalidateOnFocus: false }
  );

  // Get promotions based on active tab
  const getPromotions = () => {
    if (activeTab === 'platform') {
      if (!platformData?.success) {
        return [];
      }
      const data = platformData.data;
      // Handle different response structures
      if (Array.isArray(data)) {
        return data;
      } else if (data?.content && Array.isArray(data.content)) {
        return data.content;
      } else if (data && typeof data === 'object') {
        return data.content || data.promotions || data.items || [];
      }
      return [];
    } else {
      if (!storeData?.success) {
        return [];
      }
      
      const data = storeData.data;
      let promotions = [];
      
      if (Array.isArray(data)) {
        promotions = data;
      } else if (data && typeof data === 'object') {
        // 🔥 FIX: Paginated response structure
        promotions = data.content || data.data?.content || data.promotions || data.items || [];
      }
      
      return promotions;
    }
  };

  const promotions = getPromotions() || []; // ✅ Ensure always array
  const isLoading = activeTab === 'platform' ? loadingPlatform : loadingStore;


  const handleSelectPromotion = (promotion) => {
    if (isPromotionValid(promotion)) {
      const isStorePromotion = activeTab === 'store';
      onSelectPromotion(promotion, isStorePromotion);
      setShowList(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <div>
      {/* Button to toggle list */}
      <button
        onClick={() => setShowList(!showList)}
        className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center space-x-1 transition-colors"
      >
        <span>🎁</span>
        <span>{showList ? 'Ẩn mã khuyến mãi' : 'Xem mã khuyến mãi có sẵn'}</span>
        <span className="transform transition-transform">{showList ? '▲' : '▼'}</span>
      </button>

      {/* Promotion list modal/dropdown */}
      {showList && (
        <div className="mt-4 border-2 border-blue-200 rounded-xl bg-white shadow-2xl overflow-hidden">
          {/* Header with tabs */}
          <div className="bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 p-4">
            <h3 className="font-bold text-white text-lg mb-3">🎉 Mã khuyến mãi có sẵn</h3>
            <p className="text-xs text-white/90 mb-3">
              Chọn mã để áp dụng cho đơn hàng của bạn
            </p>
            
            {/* Tabs */}
            <div className="flex space-x-2">
              <button
                onClick={() => setActiveTab('platform')}
                className={`flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                  activeTab === 'platform'
                    ? 'bg-white text-purple-600 shadow-lg transform scale-105'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                🏪 Khuyến mãi sàn
              </button>
              {storeId && (
                <button
                  onClick={() => setActiveTab('store')}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                    activeTab === 'store'
                      ? 'bg-white text-purple-600 shadow-lg transform scale-105'
                      : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  🏬 Khuyến mãi cửa hàng
                </button>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                <p className="text-gray-500 mt-2">Đang tải mã khuyến mãi...</p>
              </div>
            ) : promotions.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <span className="text-5xl mb-3 block">🎫</span>
                <p className="font-medium">Không có mã khuyến mãi nào khả dụng</p>
                <p className="text-xs text-gray-400 mt-1">
                  {activeTab === 'platform' 
                    ? 'Hiện tại không có khuyến mãi sàn nào áp dụng cho đơn hàng của bạn'
                    : 'Cửa hàng này chưa có khuyến mãi nào áp dụng cho đơn hàng của bạn'}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Hãy quay lại sau để nhận ưu đãi! 💝
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {promotions.map((promotion) => {
                  const isValid = isPromotionValid(promotion);
                  const isSelected = selectedCode === promotion.code;
                  const errorMsg = !isValid ? getPromotionErrorMessage(promotion, orderTotal) : null;
                  const discount = promotion.discountType === 'PERCENTAGE' 
                    ? (orderTotal * promotion.discountValue) / 100
                    : promotion.discountValue;

                  return (
                    <div
                      key={promotion.id}
                      className={`p-4 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 transition-all duration-300 ${
                        isSelected ? 'bg-gradient-to-r from-blue-50 to-purple-50 border-l-4 border-blue-500' : ''
                      } ${!isValid ? 'opacity-60' : 'cursor-pointer'}`}
                      onClick={() => isValid && handleSelectPromotion(promotion)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          {/* Code and discount */}
                          <div className="flex items-center space-x-2 mb-2 flex-wrap">
                            <span className="font-mono font-bold text-blue-600 bg-gradient-to-r from-blue-100 to-purple-100 px-4 py-1.5 rounded-lg text-sm shadow-sm border border-blue-200">
                              {promotion.code}
                            </span>
                            <span className="text-xs bg-gradient-to-r from-green-400 to-emerald-500 text-white px-3 py-1 rounded-full font-bold shadow-md">
                              {formatDiscountValue(promotion)}
                            </span>
                            {isValid && (
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                                ✓ Áp dụng được
                              </span>
                            )}
                          </div>

                          {/* Description */}
                          <p className="text-sm text-gray-700 mb-2 font-medium">
                            {promotion.description || promotion.name || 'Giảm giá cho đơn hàng'}
                          </p>

                          {/* Discount amount preview */}
                          {isValid && discount > 0 && (
                            <div className="mb-2">
                              <span className="text-xs text-gray-600">Tiết kiệm: </span>
                              <span className="text-sm font-bold text-green-600">
                                {formatCurrency(discount)}
                              </span>
                            </div>
                          )}

                          {/* Conditions */}
                          <div className="flex flex-wrap gap-2 text-xs text-gray-500 mt-2">
                            {promotion.minOrderAmount > 0 && (
                              <span className="flex items-center space-x-1 bg-gray-100 px-2 py-1 rounded">
                                <span>📦</span>
                                <span>Đơn tối thiểu: {formatCurrency(promotion.minOrderAmount)}</span>
                              </span>
                            )}
                            <span className="flex items-center space-x-1 bg-gray-100 px-2 py-1 rounded">
                              <span>📅</span>
                              <span>HSD: {formatDate(promotion.endDate)}</span>
                            </span>
                            {promotion.maxUsageCount && (
                              <span className="flex items-center space-x-1 bg-gray-100 px-2 py-1 rounded">
                                <span>🎯</span>
                                <span>
                                  Còn: {promotion.maxUsageCount - (promotion.currentUsageCount || 0)} lượt
                                </span>
                              </span>
                            )}
                          </div>

                          {/* Error message */}
                          {errorMsg && (
                            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                              <p className="text-xs text-red-600 flex items-center space-x-1">
                                <span>⚠️</span>
                                <span>{errorMsg}</span>
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Select button */}
                        {isValid && (
                          <button
                            className={`ml-4 px-5 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all shadow-md ${
                              isSelected
                                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white transform scale-105'
                                : 'bg-gradient-to-r from-gray-200 to-gray-300 text-gray-700 hover:from-blue-500 hover:to-purple-500 hover:text-white hover:scale-105'
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectPromotion(promotion);
                            }}
                          >
                            {isSelected ? '✓ Đã chọn' : 'Chọn'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

PromotionList.propTypes = {
  orderTotal: PropTypes.number.isRequired,
  storeId: PropTypes.string,
  productIds: PropTypes.arrayOf(PropTypes.string),
  onSelectPromotion: PropTypes.func.isRequired,
  selectedCode: PropTypes.string,
};

export default PromotionList;
