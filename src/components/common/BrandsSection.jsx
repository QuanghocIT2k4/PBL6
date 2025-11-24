import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllBrands } from '../../services/common/productService';

/**
 * ================================================
 * BRANDS SECTION COMPONENT
 * ================================================
 * Hiển thị section "Thương hiệu nổi tiếng" với data từ API
 * 
 * @example
 * <BrandsSection />
 */

// Icon mapping cho brands
const BRAND_ICONS = {
  'Apple': '🍎',
  'Samsung': '📱',
  'ASUS': '💻',
  'MSI': '🎮',
  'Sony': '🎧',
  'Intel': '⚡',
  'Google': '🔍',
  'Microsoft': '🪟',
  'HP': '🖥️',
  'Dell': '💻',
  'Lenovo': '💻',
  'Acer': '💻',
  'LG': '📺',
  'Panasonic': '📹',
  'Canon': '📷',
  'Nikon': '📷',
  'Bose': '🔊',
  'JBL': '🔊',
  'Xiaomi': '📱',
  'OPPO': '📱',
  'Vivo': '📱',
  'OnePlus': '📱',
  'Huawei': '📱',
  'Razer': '🎮',
  'Logitech': '🖱️',
  'Corsair': '⌨️',
};

// Color mapping cho brands
const BRAND_COLORS = [
  'from-gray-100 to-gray-200',
  'from-blue-100 to-blue-200',
  'from-red-100 to-red-200',
  'from-purple-100 to-purple-200',
  'from-green-100 to-green-200',
  'from-yellow-100 to-yellow-200',
  'from-orange-100 to-orange-200',
  'from-pink-100 to-pink-200',
];

const BrandsSection = () => {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    try {
      setLoading(true);
      const result = await getAllBrands();
      
      if (result.success && result.data) {
        // Giới hạn 18 brands (3 hàng x 6 cột)
        const limitedBrands = result.data.slice(0, 18);
        setBrands(limitedBrands);
      } else {
        // Fallback: dùng brands hardcoded
        setBrands([
          { name: 'Apple' }, { name: 'Samsung' }, { name: 'ASUS' },
          { name: 'MSI' }, { name: 'Sony' }, { name: 'Intel' },
          { name: 'Google' }, { name: 'Microsoft' }, { name: 'HP' },
          { name: 'Dell' }, { name: 'Lenovo' }, { name: 'Acer' },
          { name: 'LG' }, { name: 'Canon' }, { name: 'Nikon' },
          { name: 'Bose' }, { name: 'JBL' }, { name: 'Xiaomi' },
        ]);
      }
    } catch (error) {
      console.error('❌ Exception loading brands:', error);
      // Fallback
      setBrands([
        { name: 'Apple' }, { name: 'Samsung' }, { name: 'ASUS' },
        { name: 'MSI' }, { name: 'Sony' }, { name: 'Dell' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleBrandClick = (brandName) => {
    // Map brand → category phù hợp nhất
    const brandToCategoryMap = {
      'Apple': 'smartphones',
      'Samsung': 'smartphones',
      'Xiaomi': 'smartphones',
      'OPPO': 'smartphones',
      'Vivo': 'smartphones',
      'OnePlus': 'smartphones',
      'Google': 'smartphones',
      'Realme': 'smartphones',
      'Nothing': 'smartphones',
      'Dell': 'laptops',
      'ASUS': 'laptops',
      'HP': 'laptops',
      'Lenovo': 'laptops',
      'Acer': 'laptops',
      'MSI': 'laptops',
      'Microsoft': 'laptops',
      'Razer': 'laptops',
      'Sony': 'audio',
      'Bose': 'audio',
      'JBL': 'audio',
      'Marshall': 'audio',
      'Sennheiser': 'audio',
      'LG': 'loudspeaker',
      'Canon': 'camera',
      'Nikon': 'camera',
      'Panasonic': 'camera',
    };
    
    // Lấy category phù hợp, mặc định là 'laptops' nếu không tìm thấy
    const targetCategory = brandToCategoryMap[brandName] || 'laptops';
    
    // Navigate đến category phù hợp và tự động filter theo brand
    navigate(`/products/${targetCategory}`, { state: { selectedBrand: brandName } });
  };

  if (loading) {
    return (
      <section className="py-8 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Thương hiệu nổi tiếng
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {[...Array(18)].map((_, index) => (
              <div key={index} className="flex flex-col items-center p-6 border border-gray-200 rounded-xl animate-pulse">
                <div className="w-16 h-16 rounded-full bg-gray-200 mb-3"></div>
                <div className="h-4 w-16 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-8 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Thương hiệu nổi tiếng
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {brands.map((brand, index) => {
            const brandName = brand.name || brand;
            const icon = BRAND_ICONS[brandName] || '🏷️';
            const color = BRAND_COLORS[index % BRAND_COLORS.length];

            return (
              <div
                key={brand.id || index}
                onClick={() => handleBrandClick(brandName)}
                className="flex flex-col items-center p-6 border border-gray-200 rounded-xl hover:shadow-lg transition-all duration-300 cursor-pointer hover:scale-105 bg-gradient-to-br hover:from-blue-50 hover:to-purple-50"
              >
                <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${color} flex items-center justify-center mb-3 shadow-md`}>
                  <span className="text-2xl">{icon}</span>
                </div>
                <span className="text-sm font-semibold text-gray-700 hover:text-blue-600 transition-colors text-center">
                  {brandName}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default BrandsSection;

