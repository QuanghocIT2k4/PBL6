import { useCart } from '../../context/CartContext';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAttributeLabel } from '../../utils/attributeLabels';

const CartItem = ({ item }) => {
  const { updateQuantity, removeFromCart, formatPrice, toggleItemSelected } = useCart();
  const navigate = useNavigate();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const handleGoDetail = () => {
    if (item?.product?.id != null) {
      navigate(`/product/${item.product.id}`);
    }
  };

  const handleQuantityChange = async (newQuantity) => {
    if (newQuantity > 0 && !isUpdating) {
      setIsUpdating(true);
      try {
        // Optimistic update - UI cập nhật ngay lập tức
        updateQuantity(item.id, newQuantity);
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error('Error updating quantity:', error);
      } finally {
        setIsUpdating(false);
      }
    }
  };

  const handleRemove = async () => {
    if (!isRemoving) {
      setIsRemoving(true);
      try {
        // ✅ Gọi API xóa (đã tích hợp backend trong CartContext)
        await removeFromCart(item.id);
      } catch (error) {
        console.error('Error removing item:', error);
      } finally {
        setIsRemoving(false);
      }
    }
  };

  // ✅ Handle trường hợp product hoặc price undefined
  const itemPrice = item.product?.price 
    ? (typeof item.product.price === 'number' 
        ? item.product.price 
        : parseInt(item.product.price.replace(/\./g, '')) || 0)
    : 0; // Fallback nếu không có price
  const totalPrice = itemPrice * item.quantity;

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: isRemoving ? 0 : 1, x: 0 }}
      exit={{ opacity: 0, x: 20, scale: 0.95 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className={`flex items-center space-x-4 bg-white p-4 rounded-lg shadow-sm border ${isUpdating || isRemoving ? 'opacity-60' : ''}`}
    >
      {/* Select Checkbox */}
      <input
        type="checkbox"
        checked={item.selected !== false}
        onChange={() => toggleItemSelected(item.id)}
        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
      />
      {/* Product Image (click to detail) */}
      <button
        type="button"
        onClick={handleGoDetail}
        className="w-20 h-20 bg-gray-100 rounded-md flex items-center justify-center flex-shrink-0 hover:ring-2 hover:ring-blue-200 transition"
        aria-label="Xem chi tiết sản phẩm"
      >
        {(() => {
          // ✅ Ưu tiên: image > primaryImage > images[0]
          const imageUrl = item.product.image || item.product.primaryImage || (item.product.images && item.product.images[0]);
          
          if (imageUrl && (imageUrl.startsWith('http') || imageUrl.startsWith('/'))) {
            return (
              <img
                src={imageUrl}
                alt={item.product.name}
                className="w-full h-full object-cover rounded-md"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.style.display = 'none';
                  e.target.parentElement.innerHTML = '<span class="text-2xl">📦</span>';
                }}
              />
            );
          } else {
            return <span className="text-2xl">{imageUrl || '📦'}</span>;
          }
        })()}
      </button>

      {/* Product Info */}
      <div className="flex-1 min-w-0">
        <button
          type="button"
          onClick={handleGoDetail}
          className="font-medium text-gray-900 truncate text-left hover:text-blue-600"
          aria-label="Xem chi tiết sản phẩm"
        >
          {item.product.name}
        </button>
        
        {/* ✅ DYNAMIC OPTIONS - Tự động hiển thị tất cả attributes */}
        {item.options && Object.keys(item.options).length > 0 && (
          <div className="text-sm text-gray-500 mt-1">
            {Object.entries(item.options)
              .filter(([key, value]) => value && value !== 'default')
              .map(([key, value], index, array) => (
                <span key={key}>
                  {getAttributeLabel(key)}: {value}
                  {index < array.length - 1 && <span> • </span>}
                </span>
              ))
            }
          </div>
        )}

        <div className="flex items-center justify-between mt-2">
          {/* Price */}
          <div className="flex items-center space-x-2">
            <span className="font-bold text-red-600">
              {itemPrice?.toLocaleString('vi-VN')}đ
            </span>
          </div>
        </div>
      </div>

      {/* Quantity Controls với Framer Motion */}
      <div className="flex items-center space-x-2 flex-shrink-0">
        <motion.button
          onClick={() => handleQuantityChange(item.quantity - 1)}
          disabled={item.quantity <= 1 || isUpdating}
          whileHover={item.quantity > 1 && !isUpdating ? { scale: 1.1 } : {}}
          whileTap={item.quantity > 1 && !isUpdating ? { scale: 0.9 } : {}}
          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          -
        </motion.button>
        <motion.span 
          className="w-8 text-center font-medium"
          key={item.quantity}
          initial={{ scale: 1.2 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          {isUpdating ? '...' : item.quantity}
        </motion.span>
        <motion.button
          onClick={() => handleQuantityChange(item.quantity + 1)}
          disabled={isUpdating}
          whileHover={!isUpdating ? { scale: 1.1 } : {}}
          whileTap={!isUpdating ? { scale: 0.9 } : {}}
          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          +
        </motion.button>
      </div>

      {/* Total Price */}
      <div className="text-right flex-shrink-0 min-w-[100px]">
        <div className="font-bold text-lg text-red-600">
          {totalPrice?.toLocaleString('vi-VN')}đ
        </div>
        <motion.button
          onClick={handleRemove}
          disabled={isRemoving}
          whileHover={!isRemoving ? { scale: 1.05 } : {}}
          whileTap={!isRemoving ? { scale: 0.95 } : {}}
          className="text-sm text-red-500 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isRemoving ? 'Đang xóa...' : 'Xóa'}
        </motion.button>
      </div>
    </motion.div>
  );
};

export default CartItem;