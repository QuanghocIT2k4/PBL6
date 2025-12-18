import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import useSWR from 'swr';
import { searchProductVariants } from '../../services/common/productService';

/**
 * ✅ SWR Fetcher cho Suggestions (Debounced)
 * 🎯 Dùng searchProductVariants vì Product không có ảnh và giá
 */
const suggestionsFetcher = async (keyword) => {
  if (!keyword || keyword.length < 2) return [];
  
  try {
    const result = await searchProductVariants({
      name: keyword.trim(),
      page: 0,
      size: 5,
    });

    if (result.success && result.data) {
      const data = result.data;
      let products = [];
      
      // ✅ Xử lý nhiều format response
      if (data.content && Array.isArray(data.content)) {
        products = data.content;
      } else if (Array.isArray(data)) {
        products = data;
      } else {
        console.warn('⚠️ Unexpected suggestions data format:', data);
        return [];
      }
      
      return products.map(p => {
        const storeName =
          p.storeName ||
          p.store?.storeName ||
          p.store?.name ||
          p.store_name ||
          null;

        return {
          id: p.id || p.productId || p.product?.id, // ✅ Ưu tiên variant ID (để navigate đến variant detail)
          variantId: p.id, // Giữ variantId
          productId: p.productId || p.product?.id, // Giữ productId nếu cần
          name: p.name || p.productName || 'Sản phẩm không tên',
          image: p.images?.[0] || p.image || p.primaryImage,
          storeName,
        };
      });
    }
    
    return [];
  } catch (error) {
    console.error('❌ Error fetching suggestions:', error);
    return [];
  }
};

const SearchBar = ({ onSearch, className = "" }) => {
  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const searchRef = useRef(null);
  const prevPathnameRef = useRef(location.pathname);

  // ✅ Sync query từ URL khi vào trang search
  useEffect(() => {
    if (location.pathname === '/search') {
      const urlQuery = searchParams.get('q') || '';
      setQuery(urlQuery);
    }
  }, [location.pathname, searchParams]);

  // ✅ Reset query khi về trang chủ
  useEffect(() => {
    const prevPathname = prevPathnameRef.current;
    prevPathnameRef.current = location.pathname;
    
    // Chỉ reset khi navigate từ trang khác về home (không phải khi mount)
    if (location.pathname === '/' && prevPathname !== '/' && prevPathname !== '') {
      setQuery('');
      setShowSuggestions(false);
    }
  }, [location.pathname]);

  // ✅ Debounce query (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // ✅ SWR Hook cho suggestions
  const { data: suggestions = [] } = useSWR(
    debouncedQuery.length >= 2 ? ['suggestions', debouncedQuery] : null,
    () => suggestionsFetcher(debouncedQuery),
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    }
  );

  // Show/hide suggestions based on query
  useEffect(() => {
    setShowSuggestions(query.length >= 2 && suggestions.length > 0);
  }, [query, suggestions]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      setShowSuggestions(false);
      if (onSearch) {
        onSearch(query);
      } else {
        navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      }
    } else {
      // ✅ Nếu query rỗng, về trang chủ
      navigate('/');
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setShowSuggestions(false);
    setQuery('');
    navigate(`/product/${suggestion.id}`);
  };

  // ✅ Clear suggestions khi navigate về home
  useEffect(() => {
    if (location.pathname === '/') {
      setShowSuggestions(false);
    }
  }, [location.pathname]);

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      <form onSubmit={handleSubmit} className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tìm kiếm sản phẩm..."
          className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
        </button>
      </form>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-y-auto">
          {suggestions.map((suggestion) => (
            <div
              key={suggestion.id}
              onClick={() => handleSuggestionClick(suggestion)}
              className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
            >
              {suggestion.image && (
                <img
                  src={suggestion.image}
                  alt={suggestion.name}
                  className="w-12 h-12 object-cover rounded"
                />
              )}
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{suggestion.name}</p>
                {suggestion.storeName && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    Cửa hàng: <span className="font-medium">{suggestion.storeName}</span>
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
