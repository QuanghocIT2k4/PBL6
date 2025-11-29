import { Helmet } from 'react-helmet-async';

/**
 * Structured Data Component - JSON-LD cho SEO
 * Hỗ trợ: Product, Organization, BreadcrumbList, WebSite
 */

// Organization Schema (cho homepage)
export const OrganizationSchema = () => {
  const siteUrl = window.location.origin;
  
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "E-Commerce Platform",
    "url": siteUrl,
    "logo": `${siteUrl}/logo.png`,
    "description": "Nền tảng thương mại điện tử hàng đầu, cung cấp sản phẩm công nghệ chất lượng cao với giá tốt nhất.",
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+84-1800-1234",
      "contactType": "customer service",
      "areaServed": "VN",
      "availableLanguage": "Vietnamese"
    },
    "sameAs": [
      "https://www.facebook.com/yourpage",
      "https://www.youtube.com/yourchannel"
    ]
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
    </Helmet>
  );
};

// Product Schema (cho ProductDetail)
export const ProductSchema = ({ product, store, reviews = null, reviewStats = null }) => {
  const siteUrl = window.location.origin;
  
  if (!product) return null;

  // Prepare images array
  let images = [];
  if (product.images && Array.isArray(product.images)) {
    images = product.images;
  } else if (product.image) {
    images = [product.image];
  } else if (product.primaryImageUrl) {
    images = [product.primaryImageUrl];
  }

  // Ensure images are full URLs
  images = images.map(img => img.startsWith('http') ? img : `${siteUrl}${img}`);

  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "description": product.description || `${product.name} - Sản phẩm chất lượng cao`,
    "image": images.length > 0 ? images : undefined,
    "sku": product.sku || product.id?.toString(),
    "mpn": product.mpn || product.id?.toString(),
    "brand": {
      "@type": "Brand",
      "name": product.brand || store?.name || "E-Commerce Platform"
    },
    "category": product.categoryKey || product.category || "Electronics",
    "offers": {
      "@type": "Offer",
      "url": `${siteUrl}/product/${product.id}`,
      "priceCurrency": "VND",
      "price": product.price || 0,
      "priceValidUntil": new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 year from now
      "availability": product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "itemCondition": "https://schema.org/NewCondition",
      "seller": {
        "@type": store ? "LocalBusiness" : "Organization",
        "name": store?.name || "E-Commerce Platform",
        ...(store?.id && { "url": `${siteUrl}/store/${store.id}` })
      }
    }
  };

  // Add aggregateRating if available
  if (product.rating || reviewStats?.averageRating) {
    const rating = product.rating || reviewStats?.averageRating || 0;
    const reviewCount = product.reviewCount || reviewStats?.totalReviews || 0;
    
    if (rating > 0 && reviewCount > 0) {
      schema.aggregateRating = {
        "@type": "AggregateRating",
        "ratingValue": rating,
        "reviewCount": reviewCount,
        "bestRating": 5,
        "worstRating": 1
      };
    }
  }

  // Add individual reviews if available (first 5 reviews)
  if (reviews && Array.isArray(reviews) && reviews.length > 0) {
    schema.review = reviews.slice(0, 5).map(review => ({
      "@type": "Review",
      "author": {
        "@type": "Person",
        "name": review.user?.fullName || review.buyerName || "Khách hàng"
      },
      "datePublished": review.createdAt || review.createdDate || new Date().toISOString(),
      "reviewBody": review.comment || review.content || "",
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": review.rating || 5,
        "bestRating": 5,
        "worstRating": 1
      },
      ...(review.images && review.images.length > 0 && {
        "associatedMedia": review.images.map(img => ({
          "@type": "ImageObject",
          "contentUrl": img.startsWith('http') ? img : `${siteUrl}${img}`
        }))
      })
    }));
  }

  // Remove undefined fields
  Object.keys(schema).forEach(key => {
    if (schema[key] === undefined || (Array.isArray(schema[key]) && schema[key].length === 0)) {
      delete schema[key];
    }
  });

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
    </Helmet>
  );
};

// BreadcrumbList Schema
export const BreadcrumbSchema = ({ items }) => {
  if (!items || items.length === 0) return null;

  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url
    }))
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
    </Helmet>
  );
};

// WebSite Schema (cho homepage)
export const WebSiteSchema = () => {
  const siteUrl = window.location.origin;
  
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "E-Commerce Platform",
    "url": siteUrl,
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${siteUrl}/search?q={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
    </Helmet>
  );
};

// LocalBusiness Schema (cho StoreDetailPage)
export const LocalBusinessSchema = ({ store }) => {
  const siteUrl = window.location.origin;
  
  if (!store) return null;

  const schema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": store.name,
    "description": store.description || `${store.name} - Cửa hàng công nghệ uy tín`,
    "url": `${siteUrl}/store/${store.id}`,
    "logo": store.logoUrl ? (store.logoUrl.startsWith('http') ? store.logoUrl : `${siteUrl}${store.logoUrl}`) : undefined,
    "image": store.logoUrl ? (store.logoUrl.startsWith('http') ? store.logoUrl : `${siteUrl}${store.logoUrl}`) : undefined,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": store.address?.homeAddress || "",
      "addressLocality": store.address?.ward || "",
      "addressRegion": store.address?.province || "",
      "addressCountry": "VN"
    },
    "telephone": store.owner?.phone || "",
    "email": store.owner?.email || "",
    "priceRange": "$$",
    "openingHours": "Mo-Su 08:00-22:00"
  };

  // Remove undefined fields
  Object.keys(schema).forEach(key => {
    if (schema[key] === undefined || (typeof schema[key] === 'object' && Object.keys(schema[key]).length === 0)) {
      delete schema[key];
    }
  });

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
    </Helmet>
  );
};

