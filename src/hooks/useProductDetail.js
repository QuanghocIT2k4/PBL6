import useSWR from 'swr';
import { getProductById, getProductVariantById, getProductVariantsByCategory } from '../services/common/productService';

/**
 * ✅ SWR Fetchers
 */
const productDetailFetcher = async (productId) => {
  // ✅ Thử gọi variant API trước (vì URL thường là variant ID)
  try {
    const variantResult = await getProductVariantById(productId);
    if (variantResult.success && variantResult.data) {
      console.log('✅ Found product variant:', variantResult.data);
      return variantResult.data;
    }
  } catch (variantError) {
    console.warn('⚠️ Not a variant ID, trying product API:', variantError);
  }
  
  // ✅ Fallback: Thử gọi product API
  const result = await getProductById(productId);
  if (result.success && result.data) {
    console.log('✅ Found product:', result.data);
    return result.data;
  }
  throw new Error(result.error || 'Không tìm thấy sản phẩm');
};

const relatedProductsFetcher = async ({ categoryName, productId }) => {
  if (!categoryName) return [];
  
  // ✅ Dùng product-variants API (có ảnh + giá)
  const result = await getProductVariantsByCategory(categoryName, {
    page: 0,
    size: 5,
  });
  
  if (result.success) {
    const data = result.data;
    const variants = data.content || data || [];
    // Filter out current product's variants
    return variants.filter(v => {
      const variantProductId = v.productId || v.product?.id;
      return variantProductId !== productId && variantProductId !== String(productId);
    }).slice(0, 4);
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
  const categoryName = product?.category?.name || product?.categoryName;
  
  const { data: relatedProducts, isLoading: relatedLoading } = useSWR(
    product && categoryName ? ['related-products', categoryName, productId] : null,
    () => relatedProductsFetcher({ categoryName, productId }),
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