# ✅ CHECKLIST: CHUẨN BỊ DEPLOY FE LÊN VERCEL

## 📋 TRƯỚC KHI DEPLOY

### ✅ 1. Kiểm tra Backend đã deploy
- [x] Backend URL: `https://e-commerce-raq1.onrender.com`
- [ ] Kiểm tra Swagger UI hoạt động: `https://e-commerce-raq1.onrender.com/swagger-ui.html`
- [ ] Test API endpoints hoạt động

### ✅ 2. Kiểm tra CORS trên Backend
**QUAN TRỌNG:** Backend phải cho phép CORS từ domain Vercel

Cần đảm bảo Backend có config CORS:
```java
// Backend cần cho phép:
- Origin: https://your-project.vercel.app (sẽ có sau khi deploy)
- Hoặc: Origin: * (cho phép tất cả - chỉ dùng cho dev)
- Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS
- Headers: Authorization, Content-Type
```

**Nếu chưa có:** Cần thêm CORS config vào Backend trước khi deploy FE.

### ✅ 3. Kiểm tra FE code
- [x] `vercel.json` đã có
- [x] `package.json` có script `build`
- [x] API base URL đã config: `VITE_API_URL` hoặc default
- [x] SEO đã setup

---

## 🚀 DEPLOY LÊN VERCEL

### Bước 1: Deploy FE
Chọn 1 trong 2 cách:

#### Cách 1: Vercel CLI (Nhanh)
```bash
cd FE
npm install -g vercel
vercel login
vercel
vercel --prod
```

#### Cách 2: GitHub (Khuyến nghị)
1. Push code lên GitHub
2. Vào https://vercel.com
3. Import project từ GitHub
4. Deploy

### Bước 2: Setup Environment Variable
Sau khi deploy, vào Vercel Dashboard:
1. Project Settings → Environment Variables
2. Thêm:
   - **Key:** `VITE_API_URL`
   - **Value:** `https://e-commerce-raq1.onrender.com`
   - **Environment:** Production, Preview, Development (chọn tất cả)
3. Redeploy để áp dụng

### Bước 3: Cập nhật CORS trên Backend
Sau khi có URL Vercel (ví dụ: `https://your-project.vercel.app`):

**Cần thêm vào Backend CORS config:**
```java
@CrossOrigin(origins = {
    "http://localhost:5173",  // Local dev
    "https://your-project.vercel.app"  // Vercel production
})
```

Hoặc nếu dùng Spring Security:
```java
.allowedOrigins("http://localhost:5173", "https://your-project.vercel.app")
```

---

## ✅ SAU KHI DEPLOY

### 1. Test Website
- [ ] Truy cập URL Vercel
- [ ] Kiểm tra trang chủ load được
- [ ] Test login/register
- [ ] Test API calls hoạt động

### 2. Test CORS
- [ ] Mở Browser Console (F12)
- [ ] Kiểm tra không có lỗi CORS
- [ ] Test các API calls

### 3. Cập nhật SEO
- [ ] Cập nhật `sitemap.xml` với domain Vercel
- [ ] Cập nhật `robots.txt` với domain Vercel

### 4. Submit lên Google
- [ ] Google Search Console: Submit sitemap
- [ ] Test SEO với Facebook Debugger

---

## 🆘 TROUBLESHOOTING

### Lỗi CORS
**Triệu chứng:** `Access to fetch at '...' from origin '...' has been blocked by CORS policy`

**Giải pháp:**
1. Kiểm tra Backend CORS config
2. Đảm bảo Backend cho phép domain Vercel
3. Kiểm tra `VITE_API_URL` trong Vercel Environment Variables

### Lỗi API không hoạt động
**Triệu chứng:** API calls fail, 404 hoặc timeout

**Giải pháp:**
1. Kiểm tra `VITE_API_URL` đúng chưa
2. Kiểm tra Backend đang chạy
3. Kiểm tra network tab trong Browser DevTools

### Lỗi Routing (Cannot GET /product/123)
**Triệu chứng:** Refresh page bị 404

**Giải pháp:**
- Đã có `vercel.json` với rewrites → Nên không có lỗi này
- Nếu vẫn lỗi, kiểm tra lại `vercel.json`

---

## 📝 TÓM TẮT CẦN LÀM

1. ✅ **FE đã sẵn sàng:** Code, config đã xong
2. ⚠️ **Cần kiểm tra Backend CORS:** Đảm bảo cho phép domain Vercel
3. 🚀 **Deploy FE lên Vercel**
4. ⚙️ **Setup Environment Variable:** `VITE_API_URL` trên Vercel
5. ✅ **Test và cập nhật SEO**

---

**Lưu ý quan trọng:** 
- Backend CORS là bước QUAN TRỌNG nhất
- Nếu Backend không cho phép CORS từ Vercel domain → FE không thể gọi API được


