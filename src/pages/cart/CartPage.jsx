import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import MainLayout from '../../layouts/MainLayout';
import CartItem from '../../components/cart/CartItem';
import CartSummary from '../../components/cart/CartSummary';
import Button from '../../components/ui/Button';
import SEO from '../../components/seo/SEO';

const CartPage = () => {
  const navigate = useNavigate();
  const { cartItems, clearCart, getTotalItems, selectAll, getSelectedItems } = useCart();
  const totalItems = getTotalItems();
  const distinctItems = cartItems.length; // Số lượng items riêng biệt
  
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
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="space-y-4">
              {cartItems.map((item) => (
                <CartItem key={item.id} item={item} />
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