import { useState, useEffect } from 'react';

/**
 * ✅ Custom hook để debounce value
 * Giúp giảm số lần gọi API khi user đang typing
 * 
 * @param {any} value - Giá trị cần debounce
 * @param {number} delay - Thời gian delay (ms)
 * @returns {any} - Giá trị đã debounce
 * 
 * @example
 * const [searchTerm, setSearchTerm] = useState('');
 * const debouncedSearchTerm = useDebounce(searchTerm, 500);
 * 
 * useEffect(() => {
 *   // Gọi API với debouncedSearchTerm
 *   searchAPI(debouncedSearchTerm);
 * }, [debouncedSearchTerm]);
 */
export const useDebounce = (value, delay = 500) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Set timeout để update debouncedValue sau delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup: Clear timeout nếu value thay đổi trước khi delay hết
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

export default useDebounce;
