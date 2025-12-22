import api from '../common/api';

/**
 * ================================================
 * PROVINCE SERVICE - API CALLS
 * ================================================
 * Service để gọi API provinces.open-api.vn để lấy thông tin tỉnh/vùng
 */

const PROVINCES_API_BASE = 'https://provinces.open-api.vn/api';

/**
 * Get all divisions (provinces, districts, wards)
 * @returns {Promise} List of divisions
 */
export const getAllDivisions = async () => {
  try {
    const response = await fetch(`${PROVINCES_API_BASE}/v2/divisions`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return {
      success: true,
      data: data,
    };
  } catch (error) {
    console.error('Error fetching divisions:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Get all provinces from local JSON file (to avoid CORS)
 * @returns {Promise} List of all provinces
 */
export const getProvinces = async () => {
  try {
    // Sử dụng file JSON local để tránh CORS
    const response = await fetch('/vietnam-provinces.json');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const jsonData = await response.json();
    
    // Extract provinces từ structure { province: [...] }
    const provinces = jsonData.province || jsonData.provinces || jsonData || [];
    
    // Map sang format chuẩn với code và name
    const formattedProvinces = provinces.map(p => ({
      code: p.idProvince || p.code || p.id,
      name: p.name || p.provinceName || p.province,
      ...p
    }));
    
    return {
      success: true,
      data: formattedProvinces,
    };
  } catch (error) {
    console.error('Error fetching provinces:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Get districts by province code from local JSON
 * Note: File JSON chỉ có province và commune, không có district riêng
 * Nên tạm thời trả về empty array hoặc có thể group commune theo district nếu cần
 * @param {string} provinceCode - Province code
 * @returns {Promise} List of districts
 */
export const getDistrictsByProvince = async (provinceCode) => {
  try {
    // File JSON local không có district riêng, nên tạm thời trả về empty
    // Hoặc có thể group commune theo district nếu có thông tin trong tên
    // Để đơn giản, tạm thời trả về empty array
    return {
      success: true,
      data: [],
    };
  } catch (error) {
    console.error('Error fetching districts:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Get wards (communes) by province code from local JSON
 * File JSON có commune với idProvince, nên dùng provinceCode để filter
 * @param {string} provinceCode - Province code (vì file JSON không có district riêng)
 * @returns {Promise} List of wards/communes
 */
export const getWardsByDistrict = async (provinceCode) => {
  try {
    // Load file JSON local
    const response = await fetch('/vietnam-provinces.json');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const jsonData = await response.json();
    
    // Filter communes theo provinceCode
    const communes = jsonData.commune || jsonData.communes || [];
    const filteredCommunes = communes.filter(c => 
      (c.idProvince || c.provinceCode) === provinceCode
    );
    
    // Map sang format chuẩn
    const formattedWards = filteredCommunes.map(c => ({
      code: c.idCommune || c.code || c.id,
      name: c.name || c.communeName || c.commune,
      ...c
    }));
    
    return {
      success: true,
      data: formattedWards,
    };
  } catch (error) {
    console.error('Error fetching wards:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Get provinces by region
 * @param {string} region - Region code (Bắc, Trung, Nam)
 * @returns {Promise} List of provinces in region
 */
export const getProvincesByRegion = async (region) => {
  try {
    const response = await fetch(`${PROVINCES_API_BASE}/v2/divisions?region=${region}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return {
      success: true,
      data: data,
    };
  } catch (error) {
    console.error('Error fetching provinces by region:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Get province by code
 * @param {string} code - Province code
 * @returns {Promise} Province data
 */
export const getProvinceByCode = async (code) => {
  try {
    const response = await fetch(`${PROVINCES_API_BASE}/v2/divisions/${code}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return {
      success: true,
      data: data,
    };
  } catch (error) {
    console.error('Error fetching province by code:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Map province name to region
 * @param {string} provinceName - Province name
 * @returns {string} Region code (Bắc, Trung, Nam)
 */
export const getProvinceRegion = (provinceName) => {
  if (!provinceName) return null;
  
  const name = provinceName.toLowerCase();
  
  // ✅ Vùng Bắc (14 tỉnh/thành phố) - Theo file JSON 34 tỉnh
  const bacProvinces = [
    'hà nội', 'hải phòng', 'hưng yên', 'ninh bình',
    'bắc ninh', 'quảng ninh', 'lạng sơn', 'cao bằng',
    'thái nguyên', 'tuyên quang', 'lào cai', 'điện biên', 'sơn la', 'lai châu',
    'phú thọ'
  ];
  
  // ✅ Vùng Trung (12 tỉnh/thành phố) - Theo file JSON 34 tỉnh
  const trungProvinces = [
    'thanh hóa', 'nghệ an', 'hà tĩnh', 'quảng trị', 'huế',
    'đà nẵng', 'quảng ngãi', 'gia lai', 'khánh hòa',
    'đắk lắk', 'lâm đồng'
  ];
  
  // ✅ Vùng Nam (8 tỉnh/thành phố) - Theo file JSON 34 tỉnh
  const namProvinces = [
    'tây ninh', 'đồng nai', 'hồ chí minh', 'tp. hồ chí minh', 'tp hcm', 'tp.hcm',
    'đồng tháp', 'vĩnh long', 'an giang', 'cần thơ', 'cà mau'
  ];
  
  if (bacProvinces.some(p => name.includes(p))) {
    return 'Bắc';
  }
  if (trungProvinces.some(p => name.includes(p))) {
    return 'Trung';
  }
  if (namProvinces.some(p => name.includes(p))) {
    return 'Nam';
  }
  
  return null;
};

/**
 * Calculate shipping fee based on provinces and weight
 * 
 * QUY TẮC TÍNH PHÍ SHIP:
 * 1. CÙNG TỈNH: Tên tỉnh giống nhau (VD: Đà Nẵng → Đà Nẵng) → 15,000đ
 * 2. CÙNG VÙNG: Cùng vùng Bắc, hoặc cùng vùng Trung, hoặc cùng vùng Nam → 30,000đ
 *    - VD: Hà Nội (Bắc) → Hải Phòng (Bắc) = Cùng vùng Bắc
 *    - VD: Đà Nẵng (Trung) → Quảng Nam (Trung) = Cùng vùng Trung
 *    - VD: TP.HCM (Nam) → Cần Thơ (Nam) = Cùng vùng Nam
 * 3. VÙNG LÂN CẬN: Bắc ↔ Trung hoặc Trung ↔ Nam → 45,000đ
 *    - VD: Hà Nội (Bắc) → Đà Nẵng (Trung) = Vùng lân cận
 *    - VD: Đà Nẵng (Trung) → TP.HCM (Nam) = Vùng lân cận
 * 4. VÙNG XA: Bắc ↔ Nam (bỏ qua Trung) → 60,000đ
 *    - VD: Hà Nội (Bắc) → TP.HCM (Nam) = Vùng xa
 * 5. PHỤ PHÍ: 5,000đ/kg (sau 1kg đầu, mặc định 1sp = 500g)
 *    - VD: 1.5kg = 1kg đầu (miễn phí) + 0.5kg phụ phí = 2,500đ
 * 
 * @param {string} fromProvince - Tên tỉnh của store (VD: "Thành phố Đà Nẵng")
 * @param {string} toProvince - Tên tỉnh của buyer (VD: "Thành phố Hồ Chí Minh")
 * @param {number} weight - Trọng lượng tính bằng kg (mặc định 0.5kg/sp)
 * @returns {number} Phí ship tính bằng VNĐ
 */
export const calculateShippingFee = (fromProvince, toProvince, weight = 0.5) => {
  if (!fromProvince || !toProvince) {
    return 30000; // Default fee nếu thiếu thông tin
  }
  
  // Chuẩn hóa tên tỉnh (chuyển về chữ thường, bỏ khoảng trắng thừa)
  const from = fromProvince.toLowerCase().trim();
  const to = toProvince.toLowerCase().trim();
  
  // ============================================
  // 1. CÙNG TỈNH: So sánh tên tỉnh (case-insensitive)
  // ============================================
  if (from === to) {
    const baseFee = 15000; // Phí cơ bản cùng tỉnh
    const extraWeight = Math.max(0, weight - 1); // Trọng lượng sau 1kg đầu
    const extraFee = extraWeight * 5000; // 5,000đ/kg
    return baseFee + extraFee;
  }
  
  // ============================================
  // 2. XÁC ĐỊNH VÙNG: Bắc, Trung, hoặc Nam
  // ============================================
  const fromRegion = getProvinceRegion(fromProvince);
  const toRegion = getProvinceRegion(toProvince);
  
  if (!fromRegion || !toRegion) {
    return 30000; // Default nếu không xác định được vùng
  }
  
  // ============================================
  // 3. CÙNG VÙNG: Cùng vùng Bắc, Trung, hoặc Nam
  // ============================================
  if (fromRegion === toRegion) {
    const baseFee = 30000; // Phí cơ bản cùng vùng
    const extraWeight = Math.max(0, weight - 1);
    const extraFee = extraWeight * 5000;
    return baseFee + extraFee;
  }
  
  // ============================================
  // 4. VÙNG LÂN CẬN: Bắc ↔ Trung hoặc Trung ↔ Nam
  // ============================================
  if (
    (fromRegion === 'Bắc' && toRegion === 'Trung') ||
    (fromRegion === 'Trung' && toRegion === 'Bắc') ||
    (fromRegion === 'Trung' && toRegion === 'Nam') ||
    (fromRegion === 'Nam' && toRegion === 'Trung')
  ) {
    const baseFee = 45000; // Phí cơ bản vùng lân cận
    const extraWeight = Math.max(0, weight - 1);
    const extraFee = extraWeight * 5000;
    return baseFee + extraFee;
  }
  
  // ============================================
  // 5. VÙNG XA: Bắc ↔ Nam (bỏ qua Trung)
  // ============================================
  if (
    (fromRegion === 'Bắc' && toRegion === 'Nam') ||
    (fromRegion === 'Nam' && toRegion === 'Bắc')
  ) {
    const baseFee = 60000; // Phí cơ bản vùng xa
    const extraWeight = Math.max(0, weight - 1);
    const extraFee = extraWeight * 5000;
    return baseFee + extraFee;
  }
  
  // Default fallback
  return 30000;
};

/**
 * Calculate expected delivery date based on provinces and regions
 * 
 * QUY TẮC TÍNH NGÀY GIAO DỰ KIẾN:
 * 1. CÙNG TỈNH: Tên tỉnh giống nhau → 1 ngày
 * 2. CÙNG VÙNG: Cùng vùng Bắc, hoặc cùng vùng Trung, hoặc cùng vùng Nam → 2 ngày
 * 3. VÙNG LÂN CẬN: Bắc ↔ Trung hoặc Trung ↔ Nam → 3 ngày
 * 4. VÙNG XA: Bắc ↔ Nam (bỏ qua Trung) → 5 ngày
 * 
 * @param {string} fromProvince - Tên tỉnh của store (VD: "Thành phố Đà Nẵng")
 * @param {string} toProvince - Tên tỉnh của buyer (VD: "Thành phố Hồ Chí Minh")
 * @param {Date} startDate - Ngày bắt đầu tính (mặc định là hôm nay)
 * @returns {Date} Ngày giao dự kiến
 */
export const calculateExpectedDeliveryDate = (fromProvince, toProvince, startDate = new Date()) => {
  if (!fromProvince || !toProvince) {
    // Default: 3 ngày nếu thiếu thông tin
    const defaultDate = new Date(startDate);
    defaultDate.setDate(defaultDate.getDate() + 3);
    return defaultDate;
  }
  
  // Chuẩn hóa tên tỉnh (chuyển về chữ thường, bỏ khoảng trắng thừa, loại bỏ "tỉnh", "thành phố")
  const normalizeProvinceName = (name) => {
    return name.toLowerCase()
      .trim()
      .replace(/^(tỉnh|thành phố|tp\.?)\s+/i, '') // Loại bỏ "Tỉnh", "Thành phố", "TP."
      .replace(/\s+/g, ' '); // Chuẩn hóa khoảng trắng
  };
  
  const from = normalizeProvinceName(fromProvince);
  const to = normalizeProvinceName(toProvince);
  
  let daysToAdd = 3; // Default: 3 ngày
  
  // ============================================
  // 1. CÙNG TỈNH: So sánh tên tỉnh đã chuẩn hóa
  // ============================================
  if (from === to) {
    daysToAdd = 1; // ✅ Cùng tỉnh: 1 ngày
  } else {
    // ============================================
    // 2. XÁC ĐỊNH VÙNG: Bắc, Trung, hoặc Nam
    // ============================================
    const fromRegion = getProvinceRegion(fromProvince);
    const toRegion = getProvinceRegion(toProvince);
    
    if (!fromRegion || !toRegion) {
      daysToAdd = 3; // Default nếu không xác định được vùng
    } else if (fromRegion === toRegion) {
      // ============================================
      // 3. CÙNG VÙNG: Cùng vùng Bắc, Trung, hoặc Nam
      // ============================================
      daysToAdd = 2; // ✅ Cùng vùng: 2 ngày
    } else if (
      // ============================================
      // 4. VÙNG LÂN CẬN: Bắc ↔ Trung hoặc Trung ↔ Nam
      // ============================================
      (fromRegion === 'Bắc' && toRegion === 'Trung') ||
      (fromRegion === 'Trung' && toRegion === 'Bắc') ||
      (fromRegion === 'Trung' && toRegion === 'Nam') ||
      (fromRegion === 'Nam' && toRegion === 'Trung')
    ) {
      daysToAdd = 3; // ✅ Vùng lân cận: 3 ngày
    } else if (
      // ============================================
      // 5. VÙNG XA: Bắc ↔ Nam (bỏ qua Trung)
      // ============================================
      (fromRegion === 'Bắc' && toRegion === 'Nam') ||
      (fromRegion === 'Nam' && toRegion === 'Bắc')
    ) {
      daysToAdd = 5; // ✅ Vùng xa: 5 ngày
    }
  }
  
  // Tính ngày giao dự kiến
  const expectedDate = new Date(startDate);
  expectedDate.setDate(expectedDate.getDate() + daysToAdd);
  
  return expectedDate;
};

export default {
  getAllDivisions,
  getProvinces,
  getDistrictsByProvince,
  getWardsByDistrict,
  getProvincesByRegion,
  getProvinceByCode,
  getProvinceRegion,
  calculateShippingFee,
  calculateExpectedDeliveryDate,
};

