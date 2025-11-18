import useSWR from 'swr';
import { getStoreById } from '../services/common/storeService';

/**
 * ✅ Hook để fetch store info từ storeId
 * @param {string} storeId - ID của store
 * @returns {object} { store, loading, error }
 */
export const useStoreInfo = (storeId) => {
  const { data, error, isLoading } = useSWR(
    storeId ? ['store-info', storeId] : null,
    () => getStoreById(storeId),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 300000, // Cache 5 phút
      revalidateIfStale: false,
      shouldRetryOnError: true,
    }
  );


  return {
    store: data?.success ? data.data : null,
    loading: isLoading,
    error: error?.message || (data?.success === false ? data.error : null),
  };
};

export default useStoreInfo;

