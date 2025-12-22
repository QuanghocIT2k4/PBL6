const ProductSpecifications = ({ product }) => {
  // ✅ LẤY SPECIFICATIONS TỪ API
  // Lưu ý: Attributes nằm ở ProductVariant (variant), không phải Product cha
  // Về mặt logic: Tất cả variants của cùng một product (ví dụ: iPhone 15 Pro Max) 
  // nên có thông số kỹ thuật giống nhau (chipset, RAM, camera, pin...)
  // Chỉ khác nhau về màu sắc, dung lượng lưu trữ
  const getSpecifications = () => {
    // ✅ Lấy từ variant (attributes nằm ở variant)
    if (product?.attributes && Object.keys(product.attributes).length > 0) {
      return product.attributes;
    }
    
    // Fallback: Hiển thị thông tin cơ bản
    return {
      'Brand': product?.brandName || product?.brand || 'N/A',
      'Model': product?.name || 'N/A',
      'Category': product?.categoryName || product?.category || 'N/A',
      'Price': product?.price ? `${product.price.toLocaleString('vi-VN')}đ` : 'N/A',
      'Availability': product?.stock > 0 ? 'Còn hàng' : 'Hết hàng',
      'Stock': product?.stock || 0,
      'Warranty': '12 tháng',
      'Origin': 'Chính hãng',
      'Condition': 'Mới 100%',
      'Description': product?.description || 'N/A'
    };
  };

  const specifications = getSpecifications();

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Thông số kỹ thuật</h2>
      
      <div className="overflow-hidden">
        <table className="w-full">
          <tbody>
            {Object.entries(specifications).map(([key, value], index) => (
              <tr 
                key={key} 
                className={`border-b border-gray-100 last:border-b-0 ${
                  index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                }`}
              >
                <td className="py-3 px-4 text-sm font-medium text-gray-600 w-1/3">
                  {key}
                </td>
                <td className="py-3 px-4 text-sm text-gray-900">
                  {key === 'Công nghệ màn hình' && value === 'OLED' ? (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {value}
                    </span>
                  ) : key.toLowerCase().includes('camera') && value.includes('MP') ? (
                    <span className="font-medium text-purple-700">{value}</span>
                  ) : key.toLowerCase().includes('pin') || key.toLowerCase().includes('battery') ? (
                    <span className="font-medium text-green-700">{value}</span>
                  ) : (
                    value
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Additional Info */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-medium text-blue-900 mb-2">📋 Lưu ý quan trọng</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Thông số có thể thay đổi tùy theo phiên bản</li>
          <li>• Kiểm tra kỹ thông số trước khi mua</li>
          <li>• Liên hệ tư vấn nếu có thắc mắc</li>
        </ul>
      </div>
    </div>
  );
};

export default ProductSpecifications;