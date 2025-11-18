import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getProductGallery } from '../../utils/imageUtils';

const ProductGallery = ({ product, images = [] }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // ✅ LẤY IMAGES TỪ API
  let galleryImages = images;
  
  // Nếu không có images prop, lấy từ product
  if (galleryImages.length === 0 && product) {
    // Ưu tiên imageUrls từ ProductVariant API
    if (product.imageUrls && Array.isArray(product.imageUrls) && product.imageUrls.length > 0) {
      galleryImages = product.imageUrls;
    }
    // Fallback: primaryImageUrl
    else if (product.primaryImageUrl) {
      galleryImages = [product.primaryImageUrl];
    }
    // Fallback: image field
    else if (product.image) {
      galleryImages = [product.image];
    }
    // Fallback: images array
    else if (product.images && Array.isArray(product.images) && product.images.length > 0) {
      galleryImages = product.images;
    }
    // Last resort: getProductGallery util
    else {
      galleryImages = getProductGallery(product.id, product.category);
    }
  }
  
  // Final fallback: placeholder image
  if (galleryImages.length === 0) {
    galleryImages = ['https://via.placeholder.com/600x600?text=No+Image'];
  }

  return (
    <div className="space-y-4">
      {/* Main Image với Framer Motion */}
      <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden shadow-lg relative">
        <AnimatePresence mode="wait">
          <motion.img
            key={currentImageIndex}
            src={galleryImages[currentImageIndex]}
            alt={`${product?.name || 'Product'} - Image ${currentImageIndex + 1}`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="w-full h-full object-cover"
            loading="lazy"
            whileHover={{ scale: 1.05 }}
          />
        </AnimatePresence>
      </div>

      {/* Thumbnail Images với Framer Motion */}
      {galleryImages.length > 1 && (
        <div className="flex space-x-3 overflow-x-auto pb-2">
          {galleryImages.map((image, index) => (
            <motion.button
              key={index}
              onClick={() => setCurrentImageIndex(index)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className={`flex-shrink-0 w-20 h-20 bg-gray-100 rounded-lg overflow-hidden border-2 ${
                currentImageIndex === index 
                  ? 'border-blue-500 shadow-lg' 
                  : 'border-transparent hover:border-gray-300'
              }`}
            >
              <motion.img
                src={image}
                alt={`${product?.name || 'Product'} thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
                loading="lazy"
                animate={currentImageIndex === index ? { scale: 1.05 } : { scale: 1 }}
                transition={{ duration: 0.2 }}
              />
            </motion.button>
          ))}
        </div>
      )}

      {/* Image Counter & Actions */}
      <div className="flex items-center justify-between text-sm text-gray-500">
        <div>
          {currentImageIndex + 1} / {galleryImages.length}
        </div>
        
        {/* Navigation Arrows với Framer Motion */}
        {galleryImages.length > 1 && (
          <div className="flex space-x-2">
            <motion.button
              onClick={() => setCurrentImageIndex(
                currentImageIndex === 0 ? galleryImages.length - 1 : currentImageIndex - 1
              )}
              whileHover={{ scale: 1.1, backgroundColor: "#f3f4f6" }}
              whileTap={{ scale: 0.9 }}
              className="p-2 rounded-full hover:bg-gray-100"
              aria-label="Previous image"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
              </svg>
            </motion.button>
            <motion.button
              onClick={() => setCurrentImageIndex(
                currentImageIndex === galleryImages.length - 1 ? 0 : currentImageIndex + 1
              )}
              whileHover={{ scale: 1.1, backgroundColor: "#f3f4f6" }}
              whileTap={{ scale: 0.9 }}
              className="p-2 rounded-full hover:bg-gray-100"
              aria-label="Next image"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </motion.button>
          </div>
        )}
      </div>

      {/* Zoom Hint */}
      <div className="text-center">
        <span className="text-xs text-gray-400 flex items-center justify-center">
          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"></path>
          </svg>
          Hover để phong to
        </span>
      </div>
    </div>
  );
};

export default ProductGallery;