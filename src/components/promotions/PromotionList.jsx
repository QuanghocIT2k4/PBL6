import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import useSWR from 'swr';
import { 
  formatDiscountValue,
  formatCurrency,
  isPromotionValid,
  getPromotionErrorMessage,
  calculateDiscount,
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
  // ✅ Tự động mở showList nếu có storeId (store promotions) hoặc để false cho platform (người dùng tự mở)
  const [showList, setShowList] = useState(storeId ? true : false); // ✅ Tự động mở cho store promotions
  // ✅ Mặc định tab platform nếu không có storeId, tab store nếu có storeId
  const [activeTab, setActiveTab] = useState(storeId ? 'store' : 'platform');
  
  // ✅ Đảm bảo activeTab đúng khi storeId thay đổi
  // ✅ Khi có storeId: chỉ hiển thị store promotions (không có tab platform)
  // ✅ Khi không có storeId: chỉ hiển thị platform promotions
  useEffect(() => {
    if (!storeId && activeTab === 'store') {
      console.log('🔧 [PromotionList] Fixing activeTab: storeId is null but activeTab is store, switching to platform');
      setActiveTab('platform');
    } else if (storeId && activeTab === 'platform') {
      // Khi có storeId, luôn dùng tab store (không có tab platform)
      console.log('🔧 [PromotionList] Fixing activeTab: storeId exists but activeTab is platform, switching to store');
      setActiveTab('store');
    }
  }, [storeId, activeTab]);
  
  // ✅ Tự động mở showList khi có storeId (để fetch ngay)
  useEffect(() => {
    if (storeId && !showList) {
      console.log('🔧 [PromotionList] Auto-opening showList for store promotions');
      setShowList(true);
    }
  }, [storeId]);

  // ✅ Fetch platform promotions - CHỈ KHI KHÔNG CÓ storeId (vì khi có storeId thì chỉ hiển thị store promotions)
  const { data: platformData, isLoading: loadingPlatform, error: platformError } = useSWR(
    !storeId && showList && orderTotal ? ['platform-promotions', orderTotal] : null,
    async () => {
      console.log('🔍 [PromotionList] ===== FETCHING PLATFORM PROMOTIONS =====');
      console.log('🔍 [PromotionList] showList:', showList);
      console.log('🔍 [PromotionList] orderTotal:', orderTotal);
      console.log('🔍 [PromotionList] Calling getPlatformAvailablePromotions with:', {
        orderValue: orderTotal,
        page: 0,
        size: 100
      });
      
      const result = await getPlatformAvailablePromotions({
        orderValue: orderTotal,
        page: 0,
        size: 100, // ✅ Tăng size lên 100 để lấy tất cả promotions
      });
      
      console.log('🔍 [PromotionList] ===== PLATFORM PROMOTIONS RESULT =====');
      console.log('🔍 [PromotionList] Full result:', result);
      console.log('🔍 [PromotionList] result.success:', result?.success);
      console.log('🔍 [PromotionList] result.error:', result?.error);
      console.log('🔍 [PromotionList] result.data:', result?.data);
      console.log('🔍 [PromotionList] result.data type:', typeof result?.data);
      console.log('🔍 [PromotionList] result.data isArray:', Array.isArray(result?.data));
      console.log('🔍 [PromotionList] result.data.content:', result?.data?.content);
      console.log('🔍 [PromotionList] result.data.content type:', typeof result?.data?.content);
      console.log('🔍 [PromotionList] result.data.content isArray:', Array.isArray(result?.data?.content));
      console.log('🔍 [PromotionList] result.data.content length:', result?.data?.content?.length);
      if (result?.data?.content && result.data.content.length > 0) {
        console.log('🔍 [PromotionList] First promotion:', result.data.content[0]);
      }
      console.log('🔍 [PromotionList] =========================================');
      
      return result;
    },
    { revalidateOnFocus: false }
  );
  
  console.log('🔍 [PromotionList] useSWR platformData:', platformData);
  console.log('🔍 [PromotionList] useSWR loadingPlatform:', loadingPlatform);
  console.log('🔍 [PromotionList] useSWR platformError:', platformError);


  // ✅ Fetch store promotions - TỰ ĐỘNG FETCH KHI CÓ storeId VÀ orderTotal > 0 (không cần showList)
  const swrKey = storeId && orderTotal > 0 ? ['store-promotions', storeId, orderTotal, productIds?.join(',')] : null;
  console.log('🔍 [PromotionList] ===== STORE PROMOTIONS SWR KEY =====');
  console.log('🔍 [PromotionList] showList:', showList);
  console.log('🔍 [PromotionList] storeId:', storeId);
  console.log('🔍 [PromotionList] orderTotal:', orderTotal);
  console.log('🔍 [PromotionList] orderTotal > 0:', orderTotal > 0);
  console.log('🔍 [PromotionList] productIds:', productIds);
  console.log('🔍 [PromotionList] swrKey:', swrKey);
  console.log('🔍 [PromotionList] =====================================');
  
  const { data: storeData, isLoading: loadingStore, error: storeError } = useSWR(
    swrKey, // ✅ Tự động fetch khi có storeId và orderTotal > 0
    async () => {
      console.log('🔍 [PromotionList] ===== FETCHING STORE PROMOTIONS =====');
      console.log('🔍 [PromotionList] storeId:', storeId);
      console.log('🔍 [PromotionList] orderTotal:', orderTotal);
      console.log('🔍 [PromotionList] Calling getStoreAvailablePromotions with:', {
        storeId,
        orderValue: orderTotal,
        page: 0,
        size: 20
      });
      
      const result = await getStoreAvailablePromotions(storeId, {
        orderValue: orderTotal, // 🔥 Back to real orderValue
        page: 0,
        size: 20,
      });
      
      console.log('🔍 [PromotionList] ===== STORE PROMOTIONS RESULT =====');
      console.log('🔍 [PromotionList] Full result:', result);
      console.log('🔍 [PromotionList] result.success:', result?.success);
      console.log('🔍 [PromotionList] result.error:', result?.error);
      console.log('🔍 [PromotionList] result.data:', result?.data);
      console.log('🔍 [PromotionList] result.data type:', typeof result?.data);
      console.log('🔍 [PromotionList] result.data isArray:', Array.isArray(result?.data));
      console.log('🔍 [PromotionList] result.data.content:', result?.data?.content);
      console.log('🔍 [PromotionList] result.data.content type:', typeof result?.data?.content);
      console.log('🔍 [PromotionList] result.data.content isArray:', Array.isArray(result?.data?.content));
      console.log('🔍 [PromotionList] result.data.content length:', result?.data?.content?.length);
      if (result?.data?.content && result.data.content.length > 0) {
        console.log('🔍 [PromotionList] First store promotion:', result.data.content[0]);
      }
      console.log('🔍 [PromotionList] =====================================');
      
      return result;
    },
    { revalidateOnFocus: false }
  );
  
  console.log('🔍 [PromotionList] useSWR storeData:', storeData);
  console.log('🔍 [PromotionList] useSWR loadingStore:', loadingStore);
  console.log('🔍 [PromotionList] useSWR storeError:', storeError);

  // Get promotions based on active tab
  const getPromotions = () => {
    console.log('🔍 [PromotionList] ===== getPromotions CALLED =====');
    console.log('🔍 [PromotionList] activeTab:', activeTab);
    console.log('🔍 [PromotionList] platformData:', platformData);
    console.log('🔍 [PromotionList] storeData:', storeData);
    
    if (activeTab === 'platform') {
      console.log('🔍 [PromotionList] Processing PLATFORM promotions...');
      if (!platformData) {
        console.log('⚠️ [PromotionList] platformData is null/undefined');
        return [];
      }
      if (!platformData?.success) {
        console.log('⚠️ [PromotionList] Platform data not success:', platformData);
        console.log('⚠️ [PromotionList] Platform error:', platformData?.error);
        return [];
      }
      const data = platformData.data;
      console.log('🔍 [PromotionList] Platform data object:', data);
      console.log('🔍 [PromotionList] Platform data type:', typeof data);
      console.log('🔍 [PromotionList] Platform data isArray:', Array.isArray(data));
      console.log('🔍 [PromotionList] Platform data keys:', data ? Object.keys(data) : 'null');
      
      // Handle different response structures
      let promotions = [];
      if (Array.isArray(data)) {
        console.log('✅ [PromotionList] Data is array, using directly');
        promotions = data;
      } else if (data?.content && Array.isArray(data.content)) {
        console.log('✅ [PromotionList] Data has content array');
        promotions = data.content;
      } else if (data && typeof data === 'object') {
        console.log('✅ [PromotionList] Data is object, extracting from content/promotions/items');
        promotions = data.content || data.promotions || data.items || [];
        console.log('🔍 [PromotionList] Extracted from:', {
          'data.content': data.content,
          'data.promotions': data.promotions,
          'data.items': data.items,
          'final promotions': promotions
        });
      }
      
      console.log('✅ [PromotionList] Final platform promotions:', promotions);
      console.log('✅ [PromotionList] Platform promotions count:', promotions.length);
      if (promotions.length > 0) {
        console.log('✅ [PromotionList] First platform promotion:', promotions[0]);
      }
      console.log('🔍 [PromotionList] ================================');
      
      return promotions;
    } else {
      console.log('🔍 [PromotionList] Processing STORE promotions...');
      if (!storeData) {
        console.log('⚠️ [PromotionList] storeData is null/undefined');
        return [];
      }
      if (!storeData?.success) {
        console.log('⚠️ [PromotionList] Store data not success:', storeData);
        console.log('⚠️ [PromotionList] Store error:', storeData?.error);
        return [];
      }
      
      const data = storeData.data;
      console.log('🔍 [PromotionList] Store data object:', data);
      console.log('🔍 [PromotionList] Store data type:', typeof data);
      console.log('🔍 [PromotionList] Store data isArray:', Array.isArray(data));
      console.log('🔍 [PromotionList] Store data keys:', data ? Object.keys(data) : 'null');
      
      let promotions = [];
      
      if (Array.isArray(data)) {
        console.log('✅ [PromotionList] Store data is array, using directly');
        promotions = data;
      } else if (data && typeof data === 'object') {
        console.log('✅ [PromotionList] Store data is object, extracting from content/promotions/items');
        // 🔥 FIX: Paginated response structure
        promotions = data.content || data.data?.content || data.promotions || data.items || [];
        console.log('🔍 [PromotionList] Extracted from:', {
          'data.content': data.content,
          'data.data?.content': data.data?.content,
          'data.promotions': data.promotions,
          'data.items': data.items,
          'final promotions': promotions
        });
      }
      
      console.log('✅ [PromotionList] Final store promotions:', promotions);
      console.log('✅ [PromotionList] Store promotions count:', promotions.length);
      if (promotions.length > 0) {
        console.log('✅ [PromotionList] First store promotion:', promotions[0]);
      }
      console.log('🔍 [PromotionList] ================================');
      
      return promotions;
    }
  };

  const promotions = getPromotions() || []; // ✅ Ensure always array
  const isLoading = activeTab === 'platform' ? loadingPlatform : loadingStore;
  
  // ✅ Debug log để kiểm tra
  console.log('🔍 [PromotionList] ===== RENDER DEBUG =====');
  console.log('🔍 [PromotionList] activeTab:', activeTab);
  console.log('🔍 [PromotionList] storeId:', storeId);
  console.log('🔍 [PromotionList] promotions:', promotions);
  console.log('🔍 [PromotionList] promotions.length:', promotions.length);
  console.log('🔍 [PromotionList] isLoading:', isLoading);
  console.log('🔍 [PromotionList] showList:', showList);
  console.log('🔍 [PromotionList] =========================');


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
            {/* ✅ Khi có storeId: chỉ hiển thị tab "Khuyến mãi cửa hàng" (đã có khuyến mãi sàn ở trên) */}
            {/* ✅ Khi không có storeId: chỉ hiển thị tab "Khuyến mãi sàn" */}
            {storeId ? (
              <div className="flex space-x-2">
                <button
                  className="flex-1 px-4 py-2 rounded-lg font-medium text-sm bg-white text-purple-600 shadow-lg"
                  disabled
                >
                  🏬 Khuyến mãi cửa hàng
                </button>
              </div>
            ) : (
              <div className="flex space-x-2">
                <button
                  className="flex-1 px-4 py-2 rounded-lg font-medium text-sm bg-white text-purple-600 shadow-lg"
                  disabled
                >
                  🏪 Khuyến mãi sàn
                </button>
              </div>
            )}
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
                  const discount = calculateDiscount(promotion, orderTotal);

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
