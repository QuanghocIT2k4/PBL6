# 🚀 HƯỚNG DẪN DEPLOY LÊN VERCEL

## 📋 CÁCH 1: Deploy qua Vercel CLI (Nhanh nhất)

### Bước 1: Cài đặt Vercel CLI
```bash
npm install -g vercel
```

### Bước 2: Login vào Vercel
```bash
vercel login
```
- Sẽ mở browser để đăng nhập bằng GitHub/Email

### Bước 3: Deploy
```bash
cd FE
vercel
```

**Khi hỏi:**
- Set up and deploy? → **Y**
- Which scope? → Chọn account của bạn
- Link to existing project? → **N** (lần đầu)
- Project name? → Nhấn Enter (dùng tên mặc định) hoặc đặt tên
- Directory? → **./** (hoặc Enter)
- Override settings? → **N**

### Bước 4: Deploy Production
```bash
vercel --prod
```

✅ **Xong!** Bạn sẽ nhận được URL như: `https://your-project.vercel.app`

---

## 📋 CÁCH 2: Deploy qua GitHub (Khuyến nghị)

### Bước 1: Push code lên GitHub
```bash
# Nếu chưa có git repo
cd FE
git init
git add .
git commit -m "Initial commit"

# Tạo repo trên GitHub, sau đó:
git remote add origin https://github.com/your-username/your-repo.git
git push -u origin main
```

### Bước 2: Kết nối với Vercel
1. Vào https://vercel.com
2. Đăng nhập bằng GitHub
3. Click **"Add New Project"**
4. Chọn repository của bạn
5. Vercel tự động detect Vite → Click **"Deploy"**

### Bước 3: Cấu hình Environment Variables (Nếu cần)
- Vào Project Settings → Environment Variables
- Thêm `VITE_API_URL` nếu backend URL khác default

✅ **Xong!** Mỗi lần push code lên GitHub, Vercel tự động deploy!

---

## ⚙️ CẤU HÌNH SAU KHI DEPLOY

### 1. Cập nhật Sitemap.xml với domain thực tế
Sau khi deploy, bạn sẽ có URL như: `https://your-project.vercel.app`

Cập nhật file `public/sitemap.xml`:
- Thay `https://yourdomain.com` → `https://your-project.vercel.app`

### 2. Cập nhật robots.txt
File `public/robots.txt` đã có sẵn, chỉ cần đảm bảo domain đúng.

### 3. Environment Variables (Nếu cần)
Nếu backend URL khác, thêm vào Vercel:
- Project Settings → Environment Variables
- Key: `VITE_API_URL`
- Value: `https://your-backend-url.com`

---

## 🔍 KIỂM TRA SAU KHI DEPLOY

### 1. Test Website
- Truy cập URL Vercel
- Kiểm tra các trang hoạt động

### 2. Test SEO
- View Page Source → Kiểm tra meta tags
- Facebook Debugger: https://developers.facebook.com/tools/debug/
- Google Search Console: Submit sitemap

### 3. Test API
- Đảm bảo API calls hoạt động
- Kiểm tra CORS nếu có lỗi

---

## 📝 LƯU Ý

### ✅ Đã được setup:
- `vercel.json` - Config routing cho SPA
- Build command: `npm run build`
- Output directory: `dist`
- Rewrites cho React Router

### ⚠️ Cần lưu ý:
- **Backend URL**: Đảm bảo backend đã deploy và CORS cho phép domain Vercel
- **Environment Variables**: Thêm `VITE_API_URL` nếu cần
- **Sitemap**: Cập nhật domain sau khi deploy

---

## 🎯 TIPS

1. **Custom Domain**: Vercel cho phép thêm custom domain miễn phí
2. **Preview Deployments**: Mỗi PR tạo preview URL tự động
3. **Analytics**: Có thể bật Vercel Analytics để track performance
4. **SSL**: Vercel tự động cung cấp SSL certificate

---

## 🆘 TROUBLESHOOTING

### Lỗi: "Cannot GET /product/123"
→ Đảm bảo `vercel.json` có rewrites đúng

### Lỗi: API không hoạt động
→ Kiểm tra CORS trên backend
→ Kiểm tra `VITE_API_URL` environment variable

### Lỗi: Build failed
→ Kiểm tra `package.json` có script `build`
→ Kiểm tra dependencies có lỗi không

---

**Chúc bạn deploy thành công! 🎉**


