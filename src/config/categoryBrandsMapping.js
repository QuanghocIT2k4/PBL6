/**
 * MAPPING GIỮA CATEGORY VÀ BRANDS
 * Hardcode trong frontend để filter brands theo category
 */

export const CATEGORY_BRANDS_MAPPING = {
  // Điện thoại & Tablet
  'smartphones': ['Apple', 'Samsung', 'Xiaomi', 'OPPO', 'Vivo', 'Realme', 'Nokia', 'Huawei'],
  'dien-thoai': ['Apple', 'Samsung', 'Xiaomi', 'OPPO', 'Vivo', 'Realme', 'Nokia', 'Huawei'],
  'tablets': ['Apple', 'Samsung', 'Xiaomi', 'Lenovo', 'Huawei'],
  'tablet': ['Apple', 'Samsung', 'Xiaomi', 'Lenovo', 'Huawei'],
  
  // Laptop & PC
  'laptops': ['Dell', 'HP', 'Asus', 'Lenovo', 'Acer', 'MSI', 'Apple', 'LG'],
  'laptop': ['Dell', 'HP', 'Asus', 'Lenovo', 'Acer', 'MSI', 'Apple', 'LG'],
  'pc': ['Dell', 'HP', 'Asus', 'Lenovo', 'Acer', 'MSI'],
  
  // Âm thanh
  'audio': ['Sony', 'JBL', 'Apple', 'Samsung', 'Bose', 'Sennheiser', 'Audio-Technica'],
  'tai-nghe': ['Sony', 'JBL', 'Apple', 'Samsung', 'Bose', 'Sennheiser', 'Audio-Technica'],
  'loudspeaker': ['JBL', 'Sony', 'Bose', 'Harman Kardon', 'Marshall', 'LG'],
  'loa': ['JBL', 'Sony', 'Bose', 'Harman Kardon', 'Marshall', 'LG'],
  
  // Phụ kiện
  'accessories': ['Anker', 'Baseus', 'Ugreen', 'Belkin', 'Apple', 'Samsung', 'Xiaomi'],
  'sac-du-phong': ['Anker', 'Xiaomi', 'Samsung', 'Baseus', 'Aukey'],
  'cap-sac': ['Anker', 'Baseus', 'Ugreen', 'Belkin', 'Apple'],
  'op-lung': ['Spigen', 'UAG', 'Ringke', 'Nillkin', 'Apple'],
  
  // Đồng hồ & Thiết bị đeo
  'watch': ['Apple', 'Samsung', 'Xiaomi', 'Huawei', 'Garmin', 'Fitbit'],
  'dong-ho-thong-minh': ['Apple', 'Samsung', 'Xiaomi', 'Huawei', 'Garmin', 'Fitbit'],
  'vong-deo-tay': ['Xiaomi', 'Fitbit', 'Garmin', 'Samsung'],
  
  // Camera & Nhiếp ảnh
  'camera': ['Canon', 'Nikon', 'Sony', 'Fujifilm', 'Panasonic'],
  'may-quay-phim': ['Canon', 'Sony', 'Panasonic', 'Blackmagic'],
  
  // TV
  'tv': ['Samsung', 'LG', 'Sony', 'TCL', 'Xiaomi'],
  
  // Gaming
  'console': ['Sony', 'Microsoft', 'Nintendo'],
  'tay-cam-choi-game': ['Sony', 'Microsoft', 'Logitech', 'Razer'],
  
  // Gia dụng thông minh
  'robot-hut-bui': ['Xiaomi', 'Ecovacs', 'iRobot', 'Roborock'],
  'thiet-bi-nha-thong-minh': ['Xiaomi', 'Google', 'Amazon', 'TP-Link'],
  
  // Mặc định - nếu không match category nào
  'default': []
};

/**
 * Lấy danh sách brands theo category
 * @param {string} category - Category slug (VD: 'dien-thoai', 'laptop')
 * @returns {string[]} - Mảng brand names
 */
export const getBrandsByCategory = (category) => {
  if (!category || category === 'all') {
    return []; // Trả về empty array để hiển thị tất cả brands
  }
  
  // Normalize category (lowercase, remove accents nếu cần)
  const normalizedCategory = category.toLowerCase().trim();
  
  // Tìm brands cho category
  const brands = CATEGORY_BRANDS_MAPPING[normalizedCategory];
  
  if (brands && brands.length > 0) {
    console.log(`✅ Found ${brands.length} brands for category "${category}":`, brands);
    return brands;
  }
  
  console.log(`⚠️ No brands mapping found for category "${category}", using default`);
  return CATEGORY_BRANDS_MAPPING.default;
};

/**
 * Kiểm tra xem có mapping cho category không
 * @param {string} category 
 * @returns {boolean}
 */
export const hasCategoryMapping = (category) => {
  if (!category || category === 'all') return false;
  const normalizedCategory = category.toLowerCase().trim();
  return CATEGORY_BRANDS_MAPPING.hasOwnProperty(normalizedCategory);
};

export default CATEGORY_BRANDS_MAPPING;
