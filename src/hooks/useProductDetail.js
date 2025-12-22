import useSWR from 'swr';
import { getProductById, getProductVariantById, getProductVariantsByCategory, getProductVariantsByCategoryAndBrand } from '../services/common/productService';

/**
 * ✅ SWR Fetchers
 */
const productDetailFetcher = async (productId) => {
  // ✅ Thử gọi variant API trước (vì URL thường là variant ID)
  try {
    const variantResult = await getProductVariantById(productId);
    if (variantResult.success && variantResult.data) {
      const variant = variantResult.data;

      // Nếu thiếu category/brand → cố gắng lấy từ product cha
      const hasCategory =
        variant?.category?.name ||
        variant?.categoryName ||
        variant?.category ||
        variant?.product?.category?.name ||
        variant?.product?.categoryName;
      const hasBrand =
        variant?.brand?.name ||
        variant?.brandName ||
        variant?.brand ||
        variant?.product?.brand?.name ||
        variant?.product?.brandName;

      if ((!hasCategory || !hasBrand) && variant?.productId) {
        try {
          const parentRes = await getProductById(
            typeof variant.productId === 'object'
              ? variant.productId?.id || variant.productId?._id || variant.productId?.$oid || variant.productId?.$id?.$oid
              : variant.productId
          );
          if (parentRes.success && parentRes.data) {
            const parent = parentRes.data;
            return {
              ...variant,
              product: parent,
              category: variant.category || parent.category,
              categoryName: variant.categoryName || parent.categoryName || parent.category?.name,
              brand: variant.brand || parent.brand,
              brandName: variant.brandName || parent.brandName || parent.brand?.name,
            };
          }
        } catch (err) {
          // Silent fail - parent product not required
        }
      }

      return variant;
    }
  } catch (variantError) {
    // Not a variant ID, trying product API
  }
  
  // ✅ Fallback: Thử gọi product API
  const result = await getProductById(productId);
  if (result.success && result.data) {
    return result.data;
  }
  throw new Error(result.error || 'Không tìm thấy sản phẩm');
};

const relatedProductsFetcher = async ({ categoryName, brandName, productId }) => {
  if (!categoryName) {
    return [];
  }
  
  let result;
  
  // ✅ Ưu tiên: Lấy sản phẩm cùng category VÀ brand (nếu có brand)
  if (brandName && brandName.trim() !== '') {
    result = await getProductVariantsByCategoryAndBrand(categoryName, brandName, {
      page: 0,
      size: 8,
      sortBy: 'createdAt',
      sortDir: 'desc',
    });
    
    if (result.success) {
      const data = result.data;
      const variants = data.content || data.data || data || [];
      
      // Filter out current variant
      const filtered = variants.filter(v => {
        return v.id !== productId && v.id !== String(productId);
      });
      
      // Nếu có đủ sản phẩm cùng brand, trả về
      if (filtered.length >= 4) {
        return filtered.slice(0, 4);
      }
    }
  }
  
  // ✅ Fallback: Lấy sản phẩm cùng category (không filter brand)
  result = await getProductVariantsByCategory({
    categoryName: categoryName,
    page: 0,
    size: 12,
    sortBy: 'createdAt',
    sortDir: 'desc',
  });
  
  if (result.success) {
    const data = result.data;
    const variants = data.content || data.data || data || [];
    
    // Filter out current variant
    const filtered = variants.filter(v => {
      return v.id !== productId && v.id !== String(productId);
    });
    
    // Nếu có brand, ưu tiên sản phẩm cùng brand
    if (brandName && brandName.trim() !== '') {
      const sameBrand = filtered.filter(v => {
        const vBrand = v.brand?.name || v.brandName || v.brand || v.product?.brand?.name || v.product?.brandName;
        return vBrand === brandName || String(vBrand).toLowerCase() === String(brandName).toLowerCase();
      });
      
      // Nếu có sản phẩm cùng brand, ưu tiên hiển thị
      if (sameBrand.length > 0) {
        const otherBrands = filtered.filter(v => {
          const vBrand = v.brand?.name || v.brandName || v.brand || v.product?.brand?.name || v.product?.brandName;
          return vBrand !== brandName && String(vBrand).toLowerCase() !== String(brandName).toLowerCase();
        });
        
        // Kết hợp: cùng brand trước, sau đó các brand khác
        return [...sameBrand, ...otherBrands].slice(0, 4);
      }
    }
    
    return filtered.slice(0, 4);
  }
  
  return [];
};

/**
 * ✅ Hook chính - Dùng SWR thay vì useState/useEffect
 * @param {string} productId - ID của sản phẩm
 */
export const useProductDetail = (productId) => {
  // ✅ Fetch product detail
  const { data: product, error: productError, isLoading: productLoading } = useSWR(
    productId ? ['product-detail', productId] : null,
    () => productDetailFetcher(productId),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000,
      revalidateIfStale: false,
      shouldRetryOnError: false,
    }
  );

  // ✅ Fetch related products (chỉ sau khi có product)
  // Cố gắng bắt càng nhiều kiểu field nhất có thể để tránh bị null
  const categoryName =
    product?.category?.name ||
    product?.categoryName ||
    product?.category ||
    product?.categoryKey ||
    product?.product?.category?.name ||
    product?.product?.categoryName ||
    product?.product?.category ||
    product?.product?.categoryKey;

  const brandName =
    product?.brand?.name ||
    product?.brandName ||
    product?.brand ||
    product?.product?.brand?.name ||
    product?.product?.brandName ||
    product?.product?.brand;
  
  const { data: relatedProducts, isLoading: relatedLoading } = useSWR(
    product && categoryName ? ['related-products', categoryName, brandName, productId] : null,
    () => relatedProductsFetcher({ categoryName, brandName, productId }),
    {
      revalidateOnFocus: false,
      dedupingInterval: 120000, // Cache 2 phút
    }
  );


  return {
    product: product || null,
    relatedProducts: relatedProducts || [],
    loading: productLoading,
    relatedLoading: relatedLoading,
    error: productError?.message,
  };
};