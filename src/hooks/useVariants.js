import { useState, useEffect } from 'react';

// ✅ VARIANT TEMPLATES THEO CATEGORY - Áp dụng cho TẤT CẢ sản phẩm trong category
const VARIANT_TEMPLATES_BY_CATEGORY = {
  // ========== ĐIỆN THOẠI & TABLET ==========
  'smartphones': {
    attributes: {
      color: ['Đen', 'Trắng', 'Xanh Dương', 'Hồng'],
      storage: ['64GB', '128GB', '256GB', '512GB', '1TB']
    },
    priceModifiers: {
      storage: {
        '64GB': 0,
        '128GB': 2000000,
        '256GB': 5000000,
        '512GB': 8000000,
        '1TB': 12000000
      }
    }
  },

  // ========== LAPTOP ==========
  'laptops': {
    attributes: {
      ram: ['8GB', '16GB', '32GB', '64GB'],
      storage: ['256GB SSD', '512GB SSD', '1TB SSD', '2TB SSD'],
      color: ['Bạc', 'Xám', 'Vàng Đồng', 'Đen']
    },
    priceModifiers: {
      ram: {
        '8GB': 0,
        '16GB': 4000000,
        '32GB': 8000000,
        '64GB': 15000000
      },
      storage: {
        '256GB SSD': 0,
        '512GB SSD': 3000000,
        '1TB SSD': 6000000,
        '2TB SSD': 10000000
      }
    }
  },

  // ========== PC GAMING & COMPONENTS ==========
  'pc': {
    attributes: {
      cpu: ['Intel i5', 'Intel i7', 'Intel i9', 'AMD Ryzen 5', 'AMD Ryzen 7', 'AMD Ryzen 9'],
      gpu: ['RTX 4060', 'RTX 4070', 'RTX 4080', 'RTX 4090'],
      ram: ['16GB', '32GB', '64GB', '128GB'],
      storage: ['512GB SSD', '1TB SSD', '2TB SSD', '4TB SSD']
    }
  },

  // ========== TAI NGHE & AUDIO ==========
  'audio': {
    attributes: {
      color: ['Đen', 'Trắng', 'Bạc', 'Xanh Navy'],
      connectivity: ['Wireless', 'Wired', 'Bluetooth 5.3']
    }
  },

  // ========== CAMERA ==========
  'camera': {
    attributes: {
      type: ['Body Only', 'Kit 18-55mm', 'Kit 24-70mm', 'Kit 70-200mm'],
      color: ['Đen', 'Bạc']
    },
    priceModifiers: {
      type: {
        'Body Only': 0,
        'Kit 18-55mm': 5000000,
        'Kit 24-70mm': 15000000,
        'Kit 70-200mm': 25000000
      }
    }
  },

  // ========== TIVI ==========
  'tv': {
    attributes: {
      size: ['32 inch', '43 inch', '50 inch', '55 inch', '65 inch', '75 inch', '85 inch'],
      resolution: ['Full HD', '4K UHD', '8K'],
      panel: ['LED', 'QLED', 'OLED', 'Mini-LED']
    },
    priceModifiers: {
      size: {
        '32 inch': 0,
        '43 inch': 3000000,
        '50 inch': 6000000,
        '55 inch': 9000000,
        '65 inch': 15000000,
        '75 inch': 25000000,
        '85 inch': 40000000
      },
      panel: {
        'LED': 0,
        'QLED': 5000000,
        'OLED': 15000000,
        'Mini-LED': 20000000
      }
    }
  },

  // ========== ĐỒNG HỒ THÔNG MINH ==========
  'watch': {
    attributes: {
      size: ['40mm', '42mm', '44mm', '46mm', '49mm'],
      material: ['Nhôm', 'Thép', 'Titan'],
      band: ['Sport Band', 'Leather', 'Metal', 'Silicone']
    },
    priceModifiers: {
      material: {
        'Nhôm': 0,
        'Thép': 3000000,
        'Titan': 8000000
      }
    }
  },

  // ========== PHỤ KIỆN ==========
  'accessories': {
    attributes: {
      color: ['Đen', 'Trắng', 'Xanh', 'Đỏ', 'Hồng'],
      type: ['Standard', 'Premium', 'Pro']
    }
  }
};

// ✅ HÀM GENERATE VARIANTS TỰ ĐỘNG DỰA TRÊN CATEGORY
const generateVariantsForProduct = (product) => {
  if (!product) return [];

  // Lấy category key (smartphones, laptops, tv, etc.)
  const categoryKey = product.categoryKey || product.category?.toLowerCase();
  const template = VARIANT_TEMPLATES_BY_CATEGORY[categoryKey];

  if (!template) {
    console.warn(`No variant template found for category: ${categoryKey}`);
    return [];
  }

  const { attributes, priceModifiers = {} } = template;
  const attributeKeys = Object.keys(attributes);
  
  // Nếu không có attributes, return empty
  if (attributeKeys.length === 0) return [];

  // Generate tất cả combinations của attributes (giới hạn để tránh quá nhiều)
  const variants = [];
  const firstKey = attributeKeys[0];
  const firstValues = attributes[firstKey];

  // Chỉ generate một số variants đại diện (không generate hết combinations)
  // Ví dụ: Chỉ lấy 2-3 giá trị đầu của mỗi attribute
  firstValues.slice(0, 3).forEach((value, index) => {
    const variantAttrs = { [firstKey]: value };
    
    // Thêm giá trị đầu tiên của các attributes khác
    attributeKeys.slice(1).forEach(key => {
      variantAttrs[key] = attributes[key][0];
    });

    // Tính giá dựa trên price modifiers
    let variantPrice = parseFloat(product.price?.toString().replace(/[^\d]/g, '') || 0);
    
    Object.entries(variantAttrs).forEach(([key, val]) => {
      if (priceModifiers[key] && priceModifiers[key][val]) {
        variantPrice += priceModifiers[key][val];
      }
    });

    variants.push({
      id: `${product.id}-variant-${index}`,
      productId: product.id,
      attributes: variantAttrs,
      price: variantPrice,
      stock: Math.floor(Math.random() * 30) + 5, // Random stock 5-35
      sku: `${product.id}-${Object.values(variantAttrs).join('-').substring(0, 20)}`
    });
  });

  return variants;
};

// Một số thuộc tính chỉ để hiển thị (không tạo variant mới)
const NON_VARIANT_ATTRS = ['color'];

// Simulate network delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const useVariants = (product) => {
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchVariants = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Simulate API call
        await delay(100);
        
        // ✅ GENERATE VARIANTS DỰA TRÊN CATEGORY CỦA PRODUCT
        const productVariants = generateVariantsForProduct(product);
        setVariants(productVariants);
        
        console.log(`📦 Generated ${productVariants.length} variants for product:`, product?.name, 'Category:', product?.categoryKey || product?.category);
        
      } catch (err) {
        setError(err.message);
        console.error('Error fetching variants:', err);
      } finally {
        setLoading(false);
      }
    };

    if (product) {
      fetchVariants();
    } else {
      setVariants([]);
      setLoading(false);
    }
  }, [product]);

  // ✅ Helper: Get attribute keys từ TEMPLATE (không phải từ variants)
  const getAttributeKeys = () => {
    if (!product) return [];
    const categoryKey = product.categoryKey || product.category?.toLowerCase();
    const template = VARIANT_TEMPLATES_BY_CATEGORY[categoryKey];
    return template ? Object.keys(template.attributes) : [];
  };

  // ✅ Helper: Get TẤT CẢ values có thể có từ TEMPLATE
  const getAttributeValues = (attributeKey) => {
    if (!product) return [];
    const categoryKey = product.categoryKey || product.category?.toLowerCase();
    const template = VARIANT_TEMPLATES_BY_CATEGORY[categoryKey];
    return template?.attributes[attributeKey] || [];
  };

  const getColorValues = () => getAttributeValues('color');

  // ✅ Helper: Find hoặc generate variant by attributes
  const findVariantByAttributes = (selectedAttributes) => {
    // Bỏ qua các thuộc tính chỉ hiển thị (color) khi xác định variant
    const variantAttrs = Object.entries(selectedAttributes || {}).filter(
      ([key]) => !NON_VARIANT_ATTRS.includes(key)
    );

    // Thử tìm variant đã generate
    let variant = variants.find(variant => {
      return variantAttrs.every(
        ([key, value]) => variant.attributes[key] === value
      );
    });

    // Nếu không tìm thấy, generate on-the-fly
    if (!variant && product) {
      const categoryKey = product.categoryKey || product.category?.toLowerCase();
      const template = VARIANT_TEMPLATES_BY_CATEGORY[categoryKey];
      
      if (template) {
        // Tính giá dựa trên price modifiers
        let variantPrice = parseFloat(product.price?.toString().replace(/[^\d]/g, '') || 0);
        
        variantAttrs.forEach(([key, val]) => {
          if (template.priceModifiers?.[key]?.[val]) {
            variantPrice += template.priceModifiers[key][val];
          }
        });

        variant = {
          id: `${product.id}-${Object.values(selectedAttributes).join('-')}`,
          productId: product.id,
          attributes: { ...selectedAttributes },
          price: variantPrice,
          stock: Math.floor(Math.random() * 30) + 5,
          sku: `${product.id}-CUSTOM`
        };
      }
    }

    return variant;
  };

  return {
    variants,
    loading,
    error,
    getAttributeKeys,
    getAttributeValues,
    getColorValues,
    findVariantByAttributes
  };
};

