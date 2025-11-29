# 🔍 SEO HIỂN THỊ NHƯ THẾ NÀO TRÊN TRANG WEB?

## 📌 TÓM TẮT: SEO CÓ 2 PHẦN

### 1️⃣ **PHẦN INVISIBLE (Không thấy trực tiếp)**
- Meta tags trong `<head>` (chỉ search engines đọc)
- Structured Data (JSON-LD) - chỉ bots đọc
- **→ Người dùng KHÔNG thấy, nhưng Google/Bing đọc được**

### 2️⃣ **PHẦN VISIBLE (Thấy trực tiếp)**
- Title trong tab browser
- Breadcrumbs (đường dẫn trang)
- Content trên trang
- **→ Người dùng THẤY được**

---

## 🎯 CHI TIẾT TỪNG PHẦN

### 1. **TITLE TAG** (Hiển thị trên tab browser)

**Code:**
```jsx
<SEO title="iPhone 15 Pro Max" ... />
```

**Hiển thị:**
- ✅ **Tab browser**: `iPhone 15 Pro Max | E-Commerce Platform`
- ✅ **Google Search Results**: 
  ```
  iPhone 15 Pro Max | E-Commerce Platform
  https://pbl-6-eight.vercel.app/product/123
  Mua iPhone 15 Pro Max với giá tốt nhất. Giao hàng nhanh...
  ```

**Vị trí:**
- Tab browser (góc trên cùng)
- Kết quả tìm kiếm Google (dòng đầu tiên)

---

### 2. **META DESCRIPTION** (Hiển thị trong Google Search)

**Code:**
```jsx
<SEO 
  description="Mua iPhone 15 Pro Max với giá tốt nhất. Giao hàng nhanh, thanh toán an toàn."
/>
```

**Hiển thị:**
- ✅ **Google Search Results** (dòng mô tả dưới title):
  ```
  iPhone 15 Pro Max | E-Commerce Platform
  https://pbl-6-eight.vercel.app/product/123
  Mua iPhone 15 Pro Max với giá tốt nhất. Giao hàng nhanh, thanh toán an toàn.
  ```

**Vị trí:**
- Kết quả tìm kiếm Google (dòng mô tả)
- Khi share lên Facebook/WhatsApp (preview)

---

### 3. **OPEN GRAPH IMAGE** (Hiển thị khi share)

**Code:**
```jsx
<SEO 
  image="https://example.com/product-image.jpg"
/>
```

**Hiển thị:**
- ✅ **Facebook Share**: Hiển thị ảnh preview
- ✅ **WhatsApp Share**: Hiển thị ảnh preview
- ✅ **Twitter/X Share**: Hiển thị ảnh preview

**Vị trí:**
- Khi share link lên mạng xã hội (preview card)

---

### 4. **BREADCRUMBS** (Đường dẫn trang - VISIBLE)

**Code:**
```jsx
// ProductDetail.jsx
<div className="bg-gray-50 py-4">
  <nav className="flex" aria-label="Breadcrumb">
    <ol className="flex items-center space-x-2 text-sm">
      <li>
        <button onClick={() => navigate('/')}>Trang chủ</button>
      </li>
      <li>›</li>
      <li>Điện thoại</li>
      <li>›</li>
      <li>iPhone 15 Pro Max</li>
    </ol>
  </nav>
</div>
```

**Hiển thị trên trang:**
```
Trang chủ › Điện thoại › iPhone 15 Pro Max
```

**Vị trí:**
- ✅ **Trên trang web**: Phần đầu trang (dưới header)
- ✅ **Google Search Results**: Có thể hiển thị breadcrumbs trong kết quả

**Structured Data (INVISIBLE):**
```json
{
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "name": "Trang chủ", "item": "/" },
    { "name": "Điện thoại", "item": "/products/smartphones" },
    { "name": "iPhone 15 Pro Max", "item": "/product/123" }
  ]
}
```
→ Google đọc để hiển thị breadcrumbs trong search results

---

### 5. **STRUCTURED DATA (JSON-LD)** (INVISIBLE - chỉ bots đọc)

**Code:**
```jsx
<ProductSchema product={product} store={store} />
```

**HTML Generated:**
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "iPhone 15 Pro Max",
  "price": 24990000,
  "image": "https://...",
  "aggregateRating": {
    "ratingValue": 4.5,
    "reviewCount": 120
  }
}
</script>
```

**Hiển thị:**
- ❌ **Trên trang web**: KHÔNG thấy (ẩn trong code)
- ✅ **Google Search Results**: Hiển thị Rich Snippets:
  ```
  ⭐⭐⭐⭐ 4.5 (120 đánh giá)
  💰 24.990.000đ
  📦 Còn hàng
  ```

**Vị trí:**
- Kết quả tìm kiếm Google (Rich Snippets với sao, giá, đánh giá)

---

### 6. **META KEYWORDS** (INVISIBLE)

**Code:**
```jsx
<SEO keywords="iPhone 15 Pro Max, điện thoại, smartphone, Apple" />
```

**Hiển thị:**
- ❌ **Trên trang web**: KHÔNG thấy
- ⚠️ **Google**: Không dùng nữa (nhưng vẫn có trong code)

---

### 7. **CANONICAL URL** (INVISIBLE)

**Code:**
```jsx
<SEO url="/product/123" />
```

**HTML Generated:**
```html
<link rel="canonical" href="https://pbl-6-eight.vercel.app/product/123" />
```

**Hiển thị:**
- ❌ **Trên trang web**: KHÔNG thấy
- ✅ **Google**: Đọc để biết URL chính thức (tránh duplicate content)

---

## 🔍 CÁCH KIỂM TRA SEO TRÊN TRANG WEB

### **Cách 1: View Page Source (Ctrl+U)**

1. Mở trang web
2. Nhấn `Ctrl + U` (hoặc chuột phải → View Page Source)
3. Tìm trong `<head>`:
   ```html
   <title>iPhone 15 Pro Max | E-Commerce Platform</title>
   <meta name="description" content="Mua iPhone 15 Pro Max...">
   <meta property="og:title" content="iPhone 15 Pro Max...">
   <script type="application/ld+json">...</script>
   ```

### **Cách 2: DevTools (F12)**

1. Mở trang web
2. Nhấn `F12` (DevTools)
3. Tab **Elements** → Tìm `<head>` → Xem meta tags
4. Tab **Console** → Gõ: `document.querySelector('title')` → Xem title

### **Cách 3: Kiểm tra Structured Data**

1. Mở: https://search.google.com/test/rich-results
2. Nhập URL trang web
3. Xem kết quả Structured Data

### **Cách 4: Kiểm tra Open Graph (Facebook)**

1. Mở: https://developers.facebook.com/tools/debug/
2. Nhập URL trang web
3. Xem preview khi share lên Facebook

---

## 📊 SO SÁNH: TRANG WEB CỦA BẠN vs SHOPEE/TIKI

### **Trang chủ (HomePage)**

**Bạn:**
- ✅ Title: "E-Commerce Platform - Mua sắm công nghệ online"
- ✅ Description: "E-Commerce Platform - Mua sắm công nghệ online với giá tốt nhất..."
- ✅ Organization Schema (JSON-LD)
- ✅ WebSite Schema với SearchAction

**Shopee/Tiki:**
- ✅ Tương tự (có title, description, structured data)

---

### **Trang sản phẩm (ProductDetail)**

**Bạn:**
- ✅ Title: "iPhone 15 Pro Max | E-Commerce Platform"
- ✅ Description: "Mua iPhone 15 Pro Max với giá tốt nhất..."
- ✅ Product Schema với price, rating, reviews
- ✅ Breadcrumbs: "Trang chủ › Điện thoại › iPhone 15 Pro Max"
- ✅ OG Image: Ảnh sản phẩm

**Shopee/Tiki:**
- ✅ Tương tự (có đầy đủ như trên)

**Khác biệt:**
- Shopee/Tiki có thêm Video Schema (nếu có video)
- Shopee/Tiki có FAQ Schema (câu hỏi thường gặp)

---

### **Trang cửa hàng (StoreDetailPage)**

**Bạn:**
- ✅ Title: "Tên cửa hàng | E-Commerce Platform"
- ✅ LocalBusiness Schema (JSON-LD)
- ✅ Address, Phone, Email trong schema

**Shopee/Tiki:**
- ✅ Tương tự (có LocalBusiness schema)

---

## 🎯 TÓM TẮT: SEO HIỂN THỊ Ở ĐÂU?

| SEO Element | Hiển thị trên trang web? | Hiển thị ở đâu? |
|------------|-------------------------|----------------|
| **Title** | ✅ CÓ | Tab browser, Google Search |
| **Description** | ❌ KHÔNG | Google Search (dòng mô tả) |
| **Keywords** | ❌ KHÔNG | Không dùng nữa |
| **OG Image** | ❌ KHÔNG | Facebook/WhatsApp share preview |
| **Breadcrumbs** | ✅ CÓ | Trên trang web (phần đầu) |
| **Structured Data** | ❌ KHÔNG | Google Rich Snippets |
| **Canonical URL** | ❌ KHÔNG | Chỉ Google đọc |

---

## ✅ KẾT LUẬN

**SEO của bạn đã đầy đủ và hiển thị đúng như các sàn TMDT:**
- ✅ Title hiển thị trên tab browser
- ✅ Description hiển thị trong Google Search
- ✅ Breadcrumbs hiển thị trên trang web
- ✅ Structured Data giúp Google hiển thị Rich Snippets
- ✅ OG Image hiển thị khi share lên mạng xã hội

**→ SEO hoạt động tốt và đúng chuẩn! 🎉**

