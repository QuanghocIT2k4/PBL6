import { searchProductVariants } from './productService';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const searchService = {
  // Search products by query
  async searchProducts(query, filters = {}) {
    await delay(300); // Simulate API delay
    
    // ✅ Dùng API thay vì mock data
    const result = await searchProductVariants(query, {
      page: 0,
      size: 100,
      sortBy: filters.sortBy === 'price-asc' || filters.sortBy === 'price-desc' ? 'price' : 'createdAt',
      sortDir: filters.sortBy === 'price-asc' ? 'asc' : 'desc'
    });
    
    if (!result.success) {
      return [];
    }

    let results = result.data || [];

    // Filter by search query
    if (query) {
      results = results.filter(product => 
        product.name.toLowerCase().includes(query.toLowerCase()) ||
        product.badge?.toLowerCase().includes(query.toLowerCase())
      );
    }

    // Filter by category
    if (filters.category && filters.category !== 'all') {
      results = results.filter(product => product.category === filters.category);
    }

    // Filter by price range
    if (filters.minPrice) {
      results = results.filter(product => {
        const price = typeof product.price === 'string' 
          ? parseInt(product.price.replace(/\./g, ''))
          : parseInt(product.price);
        const minPrice = parseInt(filters.minPrice);
        return price >= minPrice;
      });
    }

    if (filters.maxPrice) {
      results = results.filter(product => {
        const price = typeof product.price === 'string' 
          ? parseInt(product.price.replace(/\./g, ''))
          : parseInt(product.price);
        const maxPrice = parseInt(filters.maxPrice);
        return price <= maxPrice;
      });
    }

    // Advanced filters (mock)
    if (filters.brands && filters.brands.length > 0) {
      results = results.filter(p => filters.brands.some(b => p.name.toLowerCase().includes(b.toLowerCase())));
    }
    if (filters.cpu && filters.cpu.length > 0) {
      results = results.filter(p => filters.cpu.some(c => p.name.toLowerCase().includes(c.toLowerCase())));
    }
    if (filters.ram && filters.ram.length > 0) {
      results = results.filter(p => filters.ram.some(r => p.badge?.toLowerCase().includes(r.toLowerCase()) || p.name.toLowerCase().includes(r.toLowerCase())));
    }

    // Sort results
    if (filters.sortBy) {
      results.sort((a, b) => {
        switch (filters.sortBy) {
          case 'price-asc':
            const priceA = typeof a.price === 'string' 
              ? parseInt(a.price.replace(/\./g, ''))
              : parseInt(a.price);
            const priceB = typeof b.price === 'string' 
              ? parseInt(b.price.replace(/\./g, ''))
              : parseInt(b.price);
            return priceA - priceB;
          case 'price-desc':
            const priceA2 = typeof a.price === 'string' 
              ? parseInt(a.price.replace(/\./g, ''))
              : parseInt(a.price);
            const priceB2 = typeof b.price === 'string' 
              ? parseInt(b.price.replace(/\./g, ''))
              : parseInt(b.price);
            return priceB2 - priceA2;
          case 'name':
            return a.name.localeCompare(b.name);
          default:
            return 0;
        }
      });
    }

    return {
      success: true,
      data: {
        products: results,
        total: results.length,
        query: query,
        filters: filters
      }
    };
  },

  // Get search suggestions
  async getSearchSuggestions(query) {
    await delay(100);
    
    // TODO: Replace with real API
    // const response = await fetch(`${API_BASE_URL}/search/suggestions?q=${query}`);
    
    const allProducts = [
      ...PRODUCT_LISTS.featured,
      ...PRODUCT_LISTS.laptops,
      ...PRODUCT_LISTS.smartphones,
      ...PRODUCT_LISTS.audio
    ];

    const suggestions = allProducts
      .filter(product => 
        product.name.toLowerCase().includes(query.toLowerCase())
      )
      .slice(0, 5)
      .map(product => product.name);

    return {
      success: true,
      data: suggestions
    };
  }
};