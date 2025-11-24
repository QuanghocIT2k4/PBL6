import useSWR from 'swr';
import { getCategories, getProductVariantsByCategory } from '../services/common/productService';

// ✅ Icon mapping cho từng category name trong DB
const CATEGORY_ICONS = {
  'Phone': '📱',
  'Laptop': '💻',
  'Earphone': '🎧',
  'Loudspeaker': '🔊',
  'Watch': '⌚',
  'Camera': '📷',
  'TV': '📺',
  'Tablet': '📱',
  'Accessories': '🔌'
};

// ✅ Key mapping: Backend name → Frontend key
const NAME_TO_KEY = {
  'Phone': 'smartphones',
  'Laptop': 'laptops',
  'Earphone': 'audio',
  'Loudspeaker': 'loudspeaker',
  'Watch': 'watch',
  'Camera': 'camera',
  'TV': 'tv',
  'Tablet': 'tablets',
  'Accessories': 'accessories'
};

const categoriesFetcher = async () => {
  const result = await getCategories();
  
  if (!result.success) {
    console.error('❌ Failed to fetch categories:', result.message);
    throw new Error(result.message || 'Failed to fetch categories');
  }
  
  // ✅ Transform backend data sang frontend format VÀ lấy hình ảnh từ sản phẩm đầu tiên
  const transformedCategories = await Promise.all((result.data || []).map(async (cat) => {
    // ✅ Fetch 1 product variant đầu tiên từ category này để lấy hình ảnh
    let categoryImage = 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=220&q=80'; // Fallback
    
    try {
      const variantsResult = await getProductVariantsByCategory({ 
        categoryName: cat.name, 
        page: 0, 
        size: 1 
      });
      
      if (variantsResult.success && variantsResult.data) {
        // Backend trả về Page object, cần lấy content
        const variants = variantsResult.data.content || variantsResult.data;
        if (Array.isArray(variants) && variants.length > 0) {
          const firstVariant = variants[0];
          // Lấy primaryImage hoặc ảnh đầu tiên
          categoryImage = firstVariant.primaryImage || firstVariant.images?.[0] || categoryImage;
        }
      }
    } catch (error) {
      console.warn(`⚠️ Failed to fetch image for category ${cat.name}:`, error);
    }
    
    return {
      id: cat.id,
      name: cat.description || cat.name, // Hiển thị tiếng Việt (description) nếu có
      icon: CATEGORY_ICONS[cat.name] || '📦',
      key: NAME_TO_KEY[cat.name] || cat.name.toLowerCase(),
      apiName: cat.name, // Backend category name (English)
      image: categoryImage
    };
  }));

  // ✅ Thêm "Tất cả sản phẩm" ở đầu (với hình ảnh tổng hợp)
  const allCategories = [
    { 
      name: 'Tất cả sản phẩm', 
      icon: '📦', 
      key: 'all', 
      apiName: null,
      image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=220&q=80' 
    },
    ...transformedCategories
  ];
  
  return allCategories;
};

export const useCategories = () => {
  const { data: categories = [], error, isLoading } = useSWR(
    'categories-all',
    categoriesFetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 600000, // Cache 10 phút
      errorRetryCount: 2
    }
  );

  return { 
    categories, 
    loading: isLoading, 
    error: error?.message 
  };
};