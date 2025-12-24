const ProductSpecifications = ({ product }) => {
  // ✅ Trích màu sắc từ mảng colors (luôn ưu tiên hiển thị)
  const getColorSpec = () => {
    const colors =
      product?.colors ||
      product?.colorOptions ||
      product?.productColors ||
      product?.attributes?.colors;

    if (Array.isArray(colors) && colors.length > 0) {
      const names = colors
        .map((c) => c?.colorName || c?.name)
        .filter(Boolean);
      if (names.length > 0) {
        return names.join(', ');
      }
    }
    return null;
  };

  // ✅ Hiển thị toàn bộ fields attributes (không lọc), thêm màu nếu có
  const getSpecifications = () => {
    const attrs = product?.attributes && Object.keys(product.attributes).length > 0
      ? { ...product.attributes }
      : {};

    const colorSpec = getColorSpec();
    if (colorSpec && !attrs['Màu sắc']) {
      attrs['Màu sắc'] = colorSpec;
    }

    // Nếu không có attributes, fallback tối thiểu
    if (Object.keys(attrs).length === 0) {
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
      };
    }

    return attrs;
  };

  const specifications = getSpecifications();

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Thông số kỹ thuật</h2>
      
      {specifications ? (
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
                    ) : key.toLowerCase().includes('camera') && typeof value === 'string' && value.includes('MP') ? (
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
      ) : (
        <p className="text-sm text-gray-500">Thông số sẽ cập nhật khi có dữ liệu.</p>
      )}

      {/* Additional Info */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-medium text-blue-900 mb-2">📋 Lưu ý quan trọng</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Thông số hiển thị đã được lọc ngắn gọn theo danh mục.</li>
          <li>• Kiểm tra kỹ bộ nhớ và màu sắc trước khi đặt mua.</li>
          <li>• Liên hệ tư vấn nếu có thắc mắc.</li>
        </ul>
      </div>
    </div>
  );
};

export default ProductSpecifications;