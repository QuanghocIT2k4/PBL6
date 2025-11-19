import { useCart } from '../../context/CartContext';
import Button from '../ui/Button';

const CartSummary = ({ onCheckout }) => {
  const { 
    cartItems, 
    getSelectedTotalItems, 
    getSelectedTotalPrice, 
    getSelectedTotalSavings, 
    formatPrice 
  } = useCart();

  const totalItems = getSelectedTotalItems();
  const totalPrice = getSelectedTotalPrice();
  const totalSavings = getSelectedTotalSavings();
  const shippingFee = 30000; // Luôn tính phí vận chuyển 30k
  const finalTotal = totalPrice + shippingFee;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-4">
      <h2 className="text-xl font-bold text-gray-900 mb-4">
        Tóm tắt đơn hàng
      </h2>

      {/* Order Summary */}
      <div className="space-y-3 text-sm">
        <div className="flex justify-between">
          <span>Tạm tính ({totalItems} sản phẩm):</span>
          <span>{formatPrice(totalPrice)}đ</span>
        </div>
        
        {totalSavings > 0 && (
          <div className="flex justify-between text-green-600">
            <span>Tiết kiệm:</span>
            <span>-{formatPrice(totalSavings)}đ</span>
          </div>
        )}

        <div className="flex justify-between">
          <span>Phí vận chuyển:</span>
          <span>{formatPrice(shippingFee)}đ</span>
        </div>

        <div className="border-t pt-3">
          <div className="flex justify-between font-bold text-lg">
            <span>Tổng cộng:</span>
            <span className="text-red-600">{formatPrice(finalTotal)}đ</span>
          </div>
        </div>
      </div>

      {/* Checkout Button */}
      <Button
        onClick={onCheckout}
        className="w-full mt-6"
        size="lg"
        disabled={cartItems.length === 0}
      >
        Đặt hàng
      </Button>

      {/* Promotions */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-medium text-blue-900 mb-2">Ưu đãi thêm:</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>✓ Đổi trả trong 7 ngày</li>
          <li>✓ Bảo hành chính hãng</li>
        </ul>
      </div>

      {/* Voucher Section */}
      <div className="mt-4">
        <div className="flex space-x-2">
          <input
            type="text"
            placeholder="Nhập mã giảm giá"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Button variant="outline" size="sm">
            Áp dụng
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CartSummary;