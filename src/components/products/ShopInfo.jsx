import { useNavigate } from 'react-router-dom';
import { getFullImageUrl } from '../../utils/imageUtils';
import ChatButton from '../chat/ChatButton';

const ShopInfo = ({ shop, storeName, storeId, product }) => {
  const navigate = useNavigate();

  // ✅ Sử dụng shop từ API hoặc fallback sang storeName/storeId từ product
  // ✅ Nếu chỉ có storeId mà chưa có data, tạo object tạm với store ID
  const displayStore = shop || (storeName ? { name: storeName, id: storeId } : null) || (storeId ? { name: `Store #${storeId.slice(-8)}`, id: storeId } : null);
  
  // ✅ Get full image URL for logo
  const logoImageUrl = getFullImageUrl(displayStore?.logoUrl);

  const handleViewShop = () => {
    if (displayStore?.id) {
      navigate(`/store/${displayStore.id}`);
    }
  };

  const handleCallShop = () => {
    const phone = displayStore?.owner?.phone || displayStore?.phone;
    if (phone) {
      window.open(`tel:${phone.replace(/[^0-9+]/g, '')}`);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Shop Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center overflow-hidden">
            {logoImageUrl ? (
              <img 
                src={logoImageUrl} 
                alt={displayStore.name} 
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentElement.innerHTML = `<span class="text-white font-bold text-lg">${(displayStore?.name || 'S')[0]}</span>`;
                }}
              />
            ) : (
              <span className="text-white font-bold text-lg">{(displayStore?.name || 'S')[0]}</span>
            )}
          </div>
          <div>
            <button onClick={handleViewShop} className="text-lg font-bold text-gray-900 hover:text-blue-600 text-left">
              {displayStore?.name || 'Đang tải...'}
            </button>
            <div className="flex items-center space-x-1">
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => {
                  const rating = displayStore?.stats?.averageRating || displayStore?.averageRating || 0;
                  return (
                    <svg 
                      key={star} 
                      className={`w-4 h-4 ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
                      fill="currentColor" 
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                    </svg>
                  );
                })}
              </div>
              <span className="text-sm text-gray-600">
                ({displayStore?.stats?.totalReviews || displayStore?.totalReviews || 0} đánh giá)
              </span>
            </div>
          </div>
        </div>
        <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
          + Theo dõi
        </button>
      </div>

      {/* Shop Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-lg font-bold text-gray-900">
            {displayStore?.stats?.totalProducts || displayStore?.totalProducts || '0'}
          </div>
          <div className="text-sm text-gray-600">Sản phẩm</div>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-lg font-bold text-gray-900">
            {displayStore?.stats?.averageRating || displayStore?.averageRating || '0'}⭐
          </div>
          <div className="text-sm text-gray-600">Đánh giá</div>
        </div>
      </div>

      {/* Shop Info */}
      <div className="space-y-3 mb-6">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">📅 Tham gia:</span>
          <span className="font-medium">
            {displayStore?.createdAt ? new Date(displayStore.createdAt).getFullYear() : 'N/A'}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">📍 Địa chỉ:</span>
          <span className="font-medium">
            {displayStore?.address?.suggestedName || displayStore?.address?.homeAddress || 'N/A'}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">📞 Liên hệ:</span>
          <span className="font-medium">
            {displayStore?.owner?.phone || displayStore?.phone || 'N/A'}
          </span>
        </div>
      </div>

      {/* Policies - Hiển thị nếu có từ API */}
      {displayStore?.policies && displayStore.policies.length > 0 && (
        <div className="space-y-3 mb-6">
          <h3 className="font-medium text-gray-900">Chính sách bán hàng</h3>
          <div className="space-y-2 text-sm">
            {displayStore.policies.map((policy, index) => (
              <div key={index} className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span className="text-gray-700">{policy}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Contact Buttons */}
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleViewShop}
            className="flex items-center justify-center px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
            </svg>
            Xem Shop
          </button>
          <ChatButton
            storeId={displayStore?.id}
            storeName={displayStore?.name}
            productId={product?.id}
            productName={product?.name}
            type="BUYER_SELLER"
            className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
            </svg>
            Chat Ngay
          </ChatButton>
        </div>
        
        {(displayStore?.owner?.phone || displayStore?.phone) && (
          <button
            onClick={handleCallShop}
            className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
            </svg>
            📞 Gọi điện: {displayStore?.owner?.phone || displayStore?.phone}
          </button>
        )}
      </div>

      {/* Promotions - Hiển thị nếu có từ API */}
      {displayStore?.promotions && displayStore.promotions.length > 0 && (
        <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <h3 className="font-medium text-yellow-900 mb-2">🎁 Ưu đãi từ shop</h3>
          <ul className="text-sm text-yellow-800 space-y-1">
            {displayStore.promotions.map((promo, index) => (
              <li key={index}>• {promo}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ShopInfo;