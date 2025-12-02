import { Helmet } from 'react-helmet-async';

/**
 * SEO Component - Reusable component để thêm meta tags cho SEO
 * 
 * @param {string} title - Page title
 * @param {string} description - Meta description
 * @param {string} keywords - Meta keywords (optional)
 * @param {string} image - OG image URL (optional)
 * @param {string} url - Canonical URL (optional)
 * @param {string} type - OG type (default: 'website')
 */
const SEO = ({
  title,
  description,
  keywords = '',
  image = '',
  url = '',
  type = 'website'
}) => {
  const siteName = 'E-Commerce Platform';
  const siteUrl = window.location.origin;
  const fullTitle = title ? `${title} | ${siteName}` : siteName;
  const fullUrl = url ? `${siteUrl}${url}` : window.location.href;
  const ogImage = image || `${siteUrl}/og-image.jpg`; // Default OG image

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <link rel="canonical" href={fullUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:site_name" content={siteName} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={fullUrl} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {/* Additional Meta Tags */}
      <meta name="robots" content="index, follow" />
      <meta name="language" content="Vietnamese" />
      <meta name="author" content={siteName} />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta httpEquiv="Content-Language" content="vi" />
    </Helmet>
  );
};

export default SEO;


