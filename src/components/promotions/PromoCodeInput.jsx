import { useState } from 'react';
import PropTypes from 'prop-types';
import useSWR from 'swr';
import { 
  calculateDiscount,
  formatDiscountValue,
  formatCurrency,
  isPromotionValid,
} from '../../services/admin/promotionService';
import { 
  getStoreAvailablePromotions, 
  getPlatformAvailablePromotions 
} from '../../services/buyer/buyerPromotionService';

const PromoCodeInput = ({ 
  orderTotal, 
  storeId, 
  productIds = [], 
  onApplySuccess,
  onRemove,
  appliedPromotion = null,
}) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ✅ Fetch platform promotions
  const { data: platformData } = useSWR(
    orderTotal ? ['platform-promotions-for-input', orderTotal] : null,
    () => getPlatformAvailablePromotions({
      orderValue: orderTotal,
      page: 0,
      size: 100,
    }),
    { revalidateOnFocus: false }
  );

  // ✅ Fetch store promotions
  const { data: storeData } = useSWR(
    orderTotal && storeId ? ['store-promotions-for-input', storeId, orderTotal] : null,
    () => getStoreAvailablePromotions(storeId, {
      orderValue: orderTotal,
      page: 0,
      size: 100,
    }),
    { revalidateOnFocus: false }
  );

  // Get all available promotions (platform + store)
  const getAllPromotions = () => {
    const promotions = [];
    
    // Add platform promotions
    if (platformData?.success) {
      const data = platformData.data;
      let platformPromos = [];
      if (Array.isArray(data)) {
        platformPromos = data;
      } else if (data?.content && Array.isArray(data.content)) {
        platformPromos = data.content;
      }
      console.log('🏪 [PromoCodeInput] Platform promotions:', platformPromos.length, platformPromos.map(p => p.code));
      promotions.push(...platformPromos);
    } else {
      console.log('⚠️ [PromoCodeInput] Platform data not available:', platformData);
    }
    
    // Add store promotions
    if (storeData?.success) {
      const data = storeData.data;
      let storePromos = [];
      if (Array.isArray(data)) {
        storePromos = data;
      } else if (data?.content && Array.isArray(data.content)) {
        storePromos = data.content;
      }
      console.log('🏬 [PromoCodeInput] Store promotions:', storePromos.length, storePromos.map(p => p.code));
      promotions.push(...storePromos);
    } else {
      console.log('⚠️ [PromoCodeInput] Store data not available:', {
        storeData,
        storeId,
        hasStoreId: !!storeId
      });
    }
    
    console.log('📋 [PromoCodeInput] All promotions:', promotions.length, promotions.map(p => ({ code: p.code, type: p.type || 'unknown' })));
    
    return promotions;
  };

  const handleApply = async () => {
    if (!code.trim()) {
      setError('Vui lòng nhập mã khuyến mãi');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const upperCode = code.trim().toUpperCase();
      
      // ✅ Tìm promotion trong danh sách available promotions
      const allPromotions = getAllPromotions();
      console.log('🔍 [PromoCodeInput] Searching for code:', upperCode);
      console.log('🔍 [PromoCodeInput] Total available promotions:', allPromotions.length);
      console.log('🔍 [PromoCodeInput] Available codes:', allPromotions.map(p => p.code));
      
      // Tìm trong platform promotions trước
      let foundPromotion = null;
      let foundIn = null;
      
      // Check platform promotions
      if (platformData?.success) {
        const data = platformData.data;
        const platformPromos = Array.isArray(data) ? data : (data?.content || []);
        foundPromotion = platformPromos.find(p => p.code?.toUpperCase() === upperCode);
        if (foundPromotion) {
          foundIn = 'platform';
          console.log('✅ [PromoCodeInput] Found in platform promotions');
        }
      }
      
      // Check store promotions nếu chưa tìm thấy
      if (!foundPromotion && storeData?.success) {
        const data = storeData.data;
        const storePromos = Array.isArray(data) ? data : (data?.content || []);
        foundPromotion = storePromos.find(p => p.code?.toUpperCase() === upperCode);
        if (foundPromotion) {
          foundIn = 'store';
          console.log('✅ [PromoCodeInput] Found in store promotions');
        }
      }
      
      if (!foundPromotion) {
        console.error('❌ [PromoCodeInput] Code not found:', {
          code: upperCode,
          platformCount: platformData?.success ? (Array.isArray(platformData.data) ? platformData.data.length : platformData.data?.content?.length || 0) : 0,
          storeCount: storeData?.success ? (Array.isArray(storeData.data) ? storeData.data.length : storeData.data?.content?.length || 0) : 0,
          platformData,
          storeData
        });
        setError(`Mã ${upperCode} không tồn tại hoặc không khả dụng`);
        setLoading(false);
        return;
      }
      
      console.log('✅ [PromoCodeInput] Found promotion:', {
        code: foundPromotion.code,
        foundIn,
        promotion: foundPromotion
      });
      
      // ✅ Validate promotion
      if (!isPromotionValid(foundPromotion)) {
        setError(`Mã ${upperCode} không còn hiệu lực hoặc đã hết hạn`);
        setLoading(false);
        return;
      }
      
      // ✅ Check min order value
      const minOrderValue = foundPromotion.minOrderValue || foundPromotion.minOrderAmount || 0;
      if (orderTotal < minOrderValue) {
        setError(`Đơn hàng tối thiểu ${formatCurrency(minOrderValue)}`);
        setLoading(false);
        return;
      }
      
      // ✅ Calculate discount
      const discount = calculateDiscount(foundPromotion, orderTotal);
      console.log('✅ [PromoCodeInput] Found and validated promotion:', {
        code: foundPromotion.code,
        discount,
        foundIn,
        promotion: foundPromotion
      });
      
      onApplySuccess({
        promotion: foundPromotion,
        discount,
        code: upperCode,
        isStorePromotion: foundIn === 'store', // ✅ Lưu thông tin là store hay platform
      });
      
      setCode('');
    } catch (err) {
      console.error('❌ [PromoCodeInput] Error applying code:', err);
      setError(err.message || 'Có lỗi xảy ra khi áp dụng mã');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = () => {
    setCode('');
    setError('');
    onRemove();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleApply();
    }
  };

  // Nếu đã apply promotion
  if (appliedPromotion) {
    const discount = calculateDiscount(appliedPromotion.promotion, orderTotal);
    
    return (
      <div className="bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 border-2 border-green-300 rounded-xl p-4 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2 flex-wrap">
              <span className="text-2xl">🎉</span>
              <span className="font-mono font-bold text-green-700 bg-white px-3 py-1 rounded-lg shadow-sm border border-green-200">
                {appliedPromotion.code}
              </span>
              <span className="text-xs bg-gradient-to-r from-green-400 to-emerald-500 text-white px-3 py-1 rounded-full font-bold shadow-md">
                {formatDiscountValue(appliedPromotion.promotion)}
              </span>
            </div>
            <p className="text-sm text-gray-700 font-medium mb-1">
              {appliedPromotion.promotion.description || 'Giảm giá đơn hàng'}
            </p>
            <p className="text-base font-bold text-green-600 flex items-center space-x-1">
              <span>💰</span>
              <span>Tiết kiệm: {formatCurrency(discount)}</span>
            </p>
          </div>
          <button
            onClick={handleRemove}
            className="ml-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium text-sm transition-all shadow-md hover:scale-105"
          >
            ✕ Xóa
          </button>
        </div>
      </div>
    );
  }

  // Chưa apply promotion - hiển thị input
  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-gray-700 flex items-center space-x-2">
        <span>🎁</span>
        <span>Mã khuyến mãi (nếu có)</span>
      </label>
      <div className="flex space-x-2">
        <input
          type="text"
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase());
            setError('');
          }}
          onKeyPress={handleKeyPress}
          placeholder="Nhập mã khuyến mãi"
          className="flex-1 px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all shadow-sm"
          disabled={loading}
        />
        <button
          onClick={handleApply}
          disabled={loading || !code.trim()}
          className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed font-medium shadow-md hover:shadow-lg transition-all transform hover:scale-105"
        >
          {loading ? (
            <span className="flex items-center space-x-1">
              <span className="animate-spin">⏳</span>
              <span>Đang kiểm tra...</span>
            </span>
          ) : (
            'Áp dụng'
          )}
        </button>
      </div>
      {error && (
        <div className="p-2 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600 flex items-center space-x-1">
            <span>⚠️</span>
            <span>{error}</span>
          </p>
        </div>
      )}
    </div>
  );
};

PromoCodeInput.propTypes = {
  orderTotal: PropTypes.number.isRequired,
  storeId: PropTypes.string,
  productIds: PropTypes.arrayOf(PropTypes.string),
  onApplySuccess: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
  appliedPromotion: PropTypes.shape({
    code: PropTypes.string.isRequired,
    promotion: PropTypes.object.isRequired,
    discount: PropTypes.number.isRequired,
  }),
};

export default PromoCodeInput;

