import { useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import MainLayout from '../../layouts/MainLayout';
import CartItem from '../../components/cart/CartItem';
import CartSummary from '../../components/cart/CartSummary';
import Button from '../../components/ui/Button';
import SEO from '../../components/seo/SEO';
import { getProductVariantById } from '../../services/common/productService';

const CartPage = () => {
  const navigate = useNavigate();
  const { cartItems, clearCart, getTotalItems, selectAll, getSelectedItems, setItemSelected } = useCart();
  const totalItems = getTotalItems();
  const distinctItems = cartItems.length; // Số lượng items riêng biệt

  // Map cartItemId -> { storeId, storeName } đã resolve (từ cart API hoặc variant API)
  const [storeInfoMap, setStoreInfoMap] = useState({});

  // 🔍 Nếu cart API không trả storeId/storeName, gọi thêm API variant để lấy
  useEffect(() => {
    const loadStoreInfoForCart = async () => {
      const missingItems = cartItems.filter((item) => {
        const product = item.product || {};
        const hasStoreFromProduct =
          product.storeId ||
          product.store?.id ||
          product.storeName ||
          product.store?.name;
        const hasStoreFromMap = !!storeInfoMap[item.id];
        return !hasStoreFromProduct && !hasStoreFromMap;
      });

      if (missingItems.length === 0) return;

      const variantIdToCartItemIds = {};
      missingItems.forEach((item) => {
        const variantId = item.productVariantId || item.product?.id;
        if (!variantId) return;
        if (!variantIdToCartItemIds[variantId]) {
          variantIdToCartItemIds[variantId] = [];
        }
        variantIdToCartItemIds[variantId].push(item.id);
      });

      const variantIds = Object.keys(variantIdToCartItemIds);
      if (variantIds.length === 0) return;

      const newStoreInfo = { ...storeInfoMap };

      for (const variantId of variantIds) {
        try {
          const result = await getProductVariantById(variantId);
          if (result?.success && result.data) {
            const store = result.data.store || {};
            const resolvedStoreId = store.id || null;
            const resolvedStoreName = store.storeName || store.name || null;

            console.log('🏪[CartPage] Resolved store from variant API:', {
              variantId,
              resolvedStoreId,
              resolvedStoreName,
            });

            variantIdToCartItemIds[variantId].forEach((cartItemId) => {
              newStoreInfo[cartItemId] = {
                storeId: resolvedStoreId,
                storeName: resolvedStoreName,
              };
            });
          }
        } catch (e) {
          console.error('❌[CartPage] Failed to load variant for cart store info:', {
            variantId,
            error: e,
          });
        }
      }

      setStoreInfoMap(newStoreInfo);
    };

    if (cartItems.length > 0) {
      loadStoreInfoForCart();
    }
  }, [cartItems, storeInfoMap]);

  // ✅ Group items theo store thực tế (không hard-code TechStore)
  const groupedItems = useMemo(() => {
    const groups = {};

    cartItems.forEach((item) => {
      const product = item.product || {};

      const fromMap = storeInfoMap[item.id] || {};

      const storeId =
        product.storeId ||
        product.store?.id ||
        item.storeId ||
        item.store?.id ||
        fromMap.storeId ||
        'unknown';

      const storeName =
        product.storeName ||
        product.store?.storeName ||
        product.store?.name ||
        item.storeName ||
        item.store?.storeName ||
        item.store?.name ||
        fromMap.storeName ||
        (storeId && storeId !== 'unknown'
          ? `Cửa hàng #${String(storeId).slice(-6)}`
          : 'Cửa hàng chưa xác định');

      console.log('🛒[CartPage] Grouping item by store:', {
        cartItemId: item.id,
        productVariantId: item.productVariantId || product.id,
        productName: product.name,
        storeId,
        storeName,
        productStoreId: product.storeId,
        productStoreName: product.storeName,
        rawStoreObj: product.store,
        fromMap,
      });

      if (!groups[storeId]) {
        groups[storeId] = {
          storeId,
          storeName,
          items: [],
        };
      }

      groups[storeId].items.push(item);
    });

    // Chuyển object thành array để map
    return Object.values(groups);
  }, [cartItems, storeInfoMap]);
  
  // ✅ Toast notification
  const { warning, success } = useToast();

  const handleContinueShopping = () => {
    navigate('/');
  };

  const handleCheckout = () => {
    // TODO: Navigate to checkout page
    const selected = getSelectedItems();
    if (selected.length === 0) {
      warning('⚠️ Vui lòng chọn ít nhất 1 sản phẩm để thanh toán.');
      return;
    }
    navigate('/checkout');
  };

  const handleClearCart = async () => {
    if (window.confirm('Bạn có chắc muốn xóa tất cả sản phẩm khỏi giỏ hàng?')) {
      await clearCart();
      success('🗑️ Đã xóa tất cả sản phẩm khỏi giỏ hàng');
    }
  };

  // Empty cart state
  if (cartItems.length === 0) {
    return (
      <MainLayout>
        <SEO 
          title="Giỏ hàng | E-Comm"
          description="Xem và quản lý giỏ hàng của bạn. Thêm sản phẩm yêu thích vào giỏ hàng và thanh toán dễ dàng."
          keywords="giỏ hàng, shopping cart, mua sắm online, thanh toán"
          url="https://pbl-6-eight.vercel.app/cart"
        />
        <div className="max-w-4xl mx-auto px-4 py-16">
          <div className="text-center">
            <div className="w-24 h-24 mx-auto mb-4 text-gray-300">
              <svg fill="currentColor" viewBox="0 0 24 24">
                <path d="M7 4V2C7 1.45 7.45 1 8 1H16C16.55 1 17 1.45 17 2V4H20C20.55 4 21 4.45 21 5S20.55 6 20 6H19V19C19 20.1 18.1 21 17 21H7C5.9 21 5 20.1 5 19V6H4C3.45 6 3 5.55 3 5S3.45 4 4 4H7ZM9 3V4H15V3H9ZM7 6V19H17V6H7Z"/>
                <path d="M9 8V17H11V8H9ZM13 8V17H15V8H13Z"/>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Giỏ hàng của bạn đang trống
            </h2>
            <p className="text-gray-600 mb-8">
              Hãy thêm một số sản phẩm vào giỏ hàng để tiếp tục mua sắm
            </p>
            <Button onClick={handleContinueShopping}>
              Tiếp tục mua sắm
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <SEO 
        title="Giỏ hàng | E-Comm"
        description={`Giỏ hàng của bạn có ${distinctItems} sản phẩm. Xem chi tiết và thanh toán ngay.`}
        keywords="giỏ hàng, shopping cart, mua sắm online, thanh toán, đặt hàng"
        url="https://pbl-6-eight.vercel.app/cart"
      />
      {/* Breadcrumb */}
      <div className="bg-gray-50 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2 text-sm">
              <li>
                <button
                  onClick={() => navigate('/')}
                  className="text-gray-500 hover:text-gray-700"
                >
                  Trang chủ
                </button>
              </li>
              <li>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                </svg>
              </li>
              <li>
                <span className="text-gray-900 font-medium">Giỏ hàng</span>
              </li>
            </ol>
          </nav>
        </div>
      </div>

      {/* Cart Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Giỏ hàng ({distinctItems} sản phẩm)
          </h1>
          <div className="flex space-x-4 items-center">
            <label className="flex items-center space-x-2">
              <input type="checkbox" onChange={(e) => selectAll(e.target.checked)} className="w-4 h-4" />
              <span>Chọn tất cả</span>
            </label>
            <Button
              variant="outline"
              onClick={handleContinueShopping}
            >
              Tiếp tục mua sắm
            </Button>
            <Button
              variant="outline"
              onClick={handleClearCart}
              className="text-red-600 border-red-300 hover:bg-red-50"
            >
              Xóa tất cả
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items - Grouped by Store */}
          <div className="lg:col-span-2">
            <div className="space-y-6">
              {groupedItems.map((group) => (
                <div key={group.storeId} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  {/* Store Header */}
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <input 
                        type="checkbox" 
                        checked={group.items.length > 0 && group.items.every(it => it.selected !== false)}
                        onChange={(e) => {
                          group.items.forEach(it => setItemSelected(it.id, e.target.checked));
                        }}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                      />
                      <div className="flex items-center space-x-2">
                        <span className="text-xl">🏪</span>
                        <button 
                          onClick={() => navigate(`/store/${group.storeId}`)}
                          className="font-bold text-gray-800 hover:text-blue-600 transition flex items-center gap-1"
                        >
                          {group.storeName}
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Store Items */}
                  <div className="divide-y divide-gray-100">
                    {group.items.map((item) => (
                      <CartItem key={item.id} item={item} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cart Summary */}
          <div className="lg:col-span-1">
            <CartSummary onCheckout={handleCheckout} />
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default CartPage;