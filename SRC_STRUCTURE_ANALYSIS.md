# 📁 PHÂN TÍCH TOÀN BỘ CẤU TRÚC THƯ MỤC SRC TRONG FE

## 📋 TỔNG QUAN

Thư mục `src` là **core directory** chứa toàn bộ source code của ứng dụng React. Đây là nơi tập trung tất cả logic, components, pages, services và utilities.

**Cấu trúc tổng thể:**
```
src/
├── components/     - Reusable UI components
├── constants/      - Constant values và data
├── context/        - React Context API cho global state
├── hooks/          - Custom React hooks
├── layouts/        - Layout components cho các section
├── pages/          - Page components (routes)
├── routes/         - Route configuration files
├── services/        - API services và business logic
├── utils/          - Utility functions và helpers
├── App.jsx         - Root component và routing
├── main.jsx        - Entry point của ứng dụng
└── index.css       - Global styles
```

---

## 📂 1. THƯ MỤC COMPONENTS/

**Tác dụng:** Chứa tất cả các **reusable UI components** được sử dụng trong nhiều pages khác nhau.

### 1.1. `components/admin/`
**Tác dụng:** Components dành riêng cho Admin Dashboard

**Files:**
- **`AdminNotifications.jsx`** - Component hiển thị thông báo cho admin
- **`AdminSidebar.jsx`** - Sidebar navigation cho admin dashboard

---

### 1.2. `components/auth/`
**Tác dụng:** Authentication guards và protection components

**Files:**
- **`AdminAuthGuard.jsx`** - Bảo vệ routes admin, yêu cầu quyền admin
- **`SellerAuthGuard.jsx`** - Bảo vệ routes seller, yêu cầu quyền seller
- **`StoreAuthGuard.jsx`** - Bảo vệ routes store, yêu cầu quyền store owner

**Nhiệm vụ:** Kiểm tra authentication và authorization trước khi render protected routes

---

### 1.3. `components/cart/`
**Tác dụng:** Components liên quan đến giỏ hàng

**Files:**
- **`CartItem.jsx`** - Component hiển thị 1 item trong giỏ hàng (ảnh, tên, giá, số lượng, xóa)
- **`CartSummary.jsx`** - Component tổng kết giỏ hàng (tổng tiền, phí ship, discount, tổng thanh toán)

---

### 1.4. `components/checkout/`
**Tác dụng:** Components cho quá trình thanh toán

**Files:**
- **`AddressSelector.jsx`** - Component chọn địa chỉ giao hàng

---

### 1.5. `components/common/`
**Tác dụng:** Components dùng chung cho nhiều pages

**Files:**
- **`BrandsSection.jsx`** - Section hiển thị danh sách thương hiệu
- **`ProductSection.jsx`** - Section hiển thị danh sách sản phẩm (grid layout, skeleton loading)
- **`ProductSkeleton.jsx`** - Skeleton loading placeholder cho product cards

---

### 1.6. `components/forms/`
**Tác dụng:** Form components

**Files:**
- **`LoginForm.jsx`** - Form đăng nhập
- **`RegisterForm.jsx`** - Form đăng ký

---

### 1.7. `components/orders/`
**Tác dụng:** Components liên quan đến đơn hàng

**Files:**
- **`OrderCard.jsx`** - Card hiển thị thông tin đơn hàng (mã đơn, trạng thái, sản phẩm, tổng tiền)
- **`OrderList.jsx`** - Danh sách các đơn hàng
- **`OrderProgress.jsx`** - Progress bar hiển thị trạng thái đơn hàng (đang xử lý, đang giao, đã giao)
- **`OrderTrackingModal.jsx`** - Modal hiển thị chi tiết tracking đơn hàng

---

### 1.8. `components/products/`
**Tác dụng:** Components hiển thị thông tin sản phẩm

**Files:**
- **`ProductGallery.jsx`** - Gallery ảnh sản phẩm (main image + thumbnails)
- **`ProductInfo.jsx`** - Thông tin sản phẩm (tên, giá, mô tả, nút thêm vào giỏ)
- **`ProductSpecifications.jsx`** - Bảng thông số kỹ thuật sản phẩm
- **`ProductReviews.jsx`** - Danh sách đánh giá sản phẩm
- **`ProductComments.jsx`** - Component bình luận sản phẩm
- **`ReviewForm.jsx`** - Form viết đánh giá sản phẩm
- **`ShopInfo.jsx`** - Thông tin cửa hàng bán sản phẩm
- **`MultiProductReview.jsx`** - Component đánh giá nhiều sản phẩm cùng lúc

---

### 1.9. `components/profile/`
**Tác dụng:** Components cho trang profile

**Files:**
- **`PasswordChangeForm.jsx`** - Form đổi mật khẩu

---

### 1.10. `components/promotions/`
**Tác dụng:** Components liên quan đến khuyến mãi

**Files:**
- **`PromoCodeInput.jsx`** - Input nhập mã giảm giá
- **`PromotionList.jsx`** - Danh sách các chương trình khuyến mãi

---

### 1.11. `components/reviews/`
**Tác dụng:** Components cho hệ thống đánh giá

**Files:**
- **`ReviewCard.jsx`** - Card hiển thị 1 đánh giá (user, rating, nội dung, ảnh)
- **`ReviewForm.jsx`** - Form viết/chỉnh sửa đánh giá
- **`ReviewList.jsx`** - Danh sách các đánh giá
- **`ReviewStats.jsx`** - Thống kê đánh giá (tổng số, phân bố rating, % recommend)

---

### 1.12. `components/search/`
**Tác dụng:** Components cho tính năng tìm kiếm

**Files:**
- **`SearchBar.jsx`** - Thanh tìm kiếm (input + nút search)
- **`SearchFilters.jsx`** - Bộ lọc tìm kiếm (giá, danh mục, thương hiệu, rating)

---

### 1.13. `components/seller/`
**Tác dụng:** Components dành cho seller dashboard

**Files:**
- **`SellerHeader.jsx`** - Header component cho seller dashboard

---

### 1.14. `components/store/`
**Tác dụng:** Components dành cho store dashboard (B2C)

**Files:**
- **`StorePageHeader.jsx`** - Header component cho store pages
- **`StoreSelector.jsx`** - Component chọn cửa hàng (nếu user có nhiều store)
- **`StoreSidebar.jsx`** - Sidebar navigation cho store dashboard
- **`StoreStatusGuard.jsx`** - Component kiểm tra trạng thái store (active/inactive) trước khi render

---

### 1.15. `components/ui/`
**Tác dụng:** Basic UI components (reusable, generic)

**Files:**
- **`Button.jsx`** - Button component với variants (primary, secondary, outline), sizes, loading state
- **`Input.jsx`** - Input component với validation, error states
- **`Toast.jsx`** - Toast notification component (success, error, warning, info)

---

### 1.16. `components/ForgotPasswordForm.jsx`
**Tác dụng:** Form quên mật khẩu (gửi email reset)

---

## 📂 2. THƯ MỤC CONSTANTS/

**Tác dụng:** Chứa các constant values, static data không thay đổi

**Files:**
- **`sellersData.js`** - Dữ liệu mẫu về sellers (có thể là mock data)
- **`storeData.js`** - Dữ liệu mẫu về stores (có thể là mock data)

---

## 📂 3. THƯ MỤC CONTEXT/

**Tác dụng:** React Context API để quản lý **global state** cho toàn ứng dụng

**Files:**
- **`AuthContext.jsx`** - Context quản lý authentication state (user, token, login, logout, isAuthenticated)
- **`CartContext.jsx`** - Context quản lý giỏ hàng (items, addItem, removeItem, updateQuantity, clearCart)
- **`StoreContext.jsx`** - Context quản lý store state (currentStore, stores list, switchStore)
- **`ToastContext.jsx`** - Context quản lý toast notifications (showToast, hideToast, toast queue)

**Lợi ích:** 
- Tránh prop drilling
- State management đơn giản không cần Redux
- Dễ dàng truy cập state từ bất kỳ component nào

---

## 📂 4. THƯ MỤC HOOKS/

**Tác dụng:** Custom React hooks để tái sử dụng logic

**Files:**
- **`useCategories.js`** - Hook fetch danh sách categories
- **`useProductDetail.js`** - Hook fetch chi tiết sản phẩm + related products
- **`useProducts.js`** - Hook fetch danh sách sản phẩm với filters
- **`useProductVariants.js`** - Hook fetch product variants (biến thể sản phẩm)
- **`useProfile.js`** - Hook fetch và update user profile
- **`useReviews.js`** - Hook fetch và manage reviews
- **`useSearch.js`** - Hook xử lý tìm kiếm sản phẩm
- **`useStoreInfo.js`** - Hook fetch thông tin store
- **`useToast.js`** - Hook sử dụng toast notifications
- **`useVariants.js`** - Hook fetch variants (có thể là alias của useProductVariants)

**Lợi ích:**
- Tái sử dụng logic
- Tách biệt business logic khỏi UI
- Dễ test và maintain

---

## 📂 5. THƯ MỤC LAYOUTS/

**Tác dụng:** Layout components định nghĩa cấu trúc chung cho các section khác nhau

**Files:**
- **`AdminLayout.jsx`** - Layout cho admin dashboard (header + sidebar + content area)
- **`MainLayout.jsx`** - Layout cho trang chủ và public pages (header, footer, navigation)
- **`SellerLayout.jsx`** - Layout cho seller dashboard (header + sidebar + content)
- **`StoreLayout.jsx`** - Layout cho store dashboard (header + sidebar + content)

**Nhiệm vụ:** 
- Đảm bảo consistency về UI structure
- Chứa navigation, header, footer chung
- Wrapper cho các pages

---

## 📂 6. THƯ MỤC PAGES/

**Tác dụng:** Chứa các **page components** - mỗi file đại diện cho 1 route/page

### 6.1. `pages/admin/`
**Tác dụng:** Pages cho Admin Dashboard

**Files:**
- **`AdminDashboard.jsx`** - Trang dashboard tổng quan (stats, charts)
- **`AdminUsers.jsx`** - Quản lý users (danh sách, xem, edit, delete)
- **`AdminStores.jsx`** - Quản lý stores (duyệt store, approve/reject)
- **`AdminProducts.jsx`** - Quản lý products (duyệt sản phẩm)
- **`AdminVariants.jsx`** - Quản lý product variants
- **`AdminPromotions.jsx`** - Quản lý promotions (tạo, edit, delete khuyến mãi)

---

### 6.2. `pages/auth/`
**Tác dụng:** Authentication pages

**Files:**
- **`AuthPage.jsx`** - Trang đăng nhập/đăng ký (toggle giữa login và register)
- **`VerifyEmailPage.jsx`** - Trang xác thực email
- **`ResetPasswordPage.jsx`** - Trang reset mật khẩu (từ link trong email)

---

### 6.3. `pages/cart/`
**Tác dụng:** Pages liên quan đến giỏ hàng

**Files:**
- **`CartPage.jsx`** - Trang giỏ hàng (danh sách items, tổng tiền, nút checkout)

---

### 6.4. `pages/checkout/`
**Tác dụng:** Pages thanh toán

**Files:**
- **`CheckoutPage.jsx`** - Trang checkout (chọn địa chỉ, phương thức thanh toán, xác nhận đơn hàng)

---

### 6.5. `pages/home/`
**Tác dụng:** Trang chủ

**Files:**
- **`HomePage.jsx`** - Trang chủ (banner slider, categories, featured products, promotions)

---

### 6.6. `pages/orders/`
**Tác dụng:** Pages quản lý đơn hàng (cho buyer)

**Files:**
- **`OrdersPage.jsx`** - Danh sách đơn hàng của user
- **`OrderDetailPage.jsx`** - Chi tiết 1 đơn hàng (sản phẩm, trạng thái, tracking, tổng tiền)

---

### 6.7. `pages/products/`
**Tác dụng:** Pages hiển thị sản phẩm

**Files:**
- **`ProductDetail.jsx`** - Trang chi tiết sản phẩm (gallery, info, specs, reviews, related products)
- **`ProductList.jsx`** - Danh sách sản phẩm theo category (grid, filters, pagination)

---

### 6.8. `pages/profile/`
**Tác dụng:** Pages quản lý profile user

**Files:**
- **`ProfilePage.jsx`** - Trang profile chính (tabs: thông tin, đơn hàng, địa chỉ)
- **`ProfileHeader.jsx`** - Header của trang profile (avatar, tên, edit button)
- **`PersonalInfoForm.jsx`** - Form chỉnh sửa thông tin cá nhân

---

### 6.9. `pages/search/`
**Tác dụng:** Pages tìm kiếm

**Files:**
- **`SearchResults.jsx`** - Kết quả tìm kiếm (danh sách sản phẩm, filters, sort)

---

### 6.10. `pages/seller/`
**Tác dụng:** Pages cho Seller Dashboard (C2C - Consumer to Consumer)

**Files:**
- **`SellerDashboard.jsx`** - Dashboard tổng quan (stats, charts, recent orders)
- **`SellerProducts.jsx`** - Quản lý sản phẩm của seller
- **`SellerCreateProduct.jsx`** - Tạo sản phẩm mới
- **`SellerOrders.jsx`** - Quản lý đơn hàng
- **`SellerOrderDetail.jsx`** - Chi tiết đơn hàng
- **`SellerProfile.jsx`** - Profile của seller
- **`SellerShop.jsx`** - Thông tin shop của seller
- **`SellerAnalytics.jsx`** - Phân tích doanh số, sản phẩm bán chạy
- **`SellerReviews.jsx`** - Quản lý reviews nhận được
- **`SellerSettings.jsx`** - Cài đặt shop
- **`SellerChats.jsx`** - Chat với khách hàng
- **`SellerNotifications.jsx`** - Thông báo của seller

---

### 6.11. `pages/sellers/`
**Tác dụng:** Public pages về sellers

**Files:**
- **`SellersPage.jsx`** - Danh sách tất cả sellers
- **`SellerDetailPage.jsx`** - Trang chi tiết seller (thông tin shop, sản phẩm)

---

### 6.12. `pages/shop/`
**Tác dụng:** Pages về shop

**Files:**
- **`ShopPage.jsx`** - Trang shop (có thể là public shop view)

---

### 6.13. `pages/store/`
**Tác dụng:** Pages cho Store Dashboard (B2C - Business to Consumer)

**Files:**
- **`StoreDashboard.jsx`** - Dashboard tổng quan store
- **`StoreProducts.jsx`** - Quản lý sản phẩm của store
- **`StoreCreateProduct.jsx`** - Tạo sản phẩm mới
- **`StoreProductDetail.jsx`** - Chi tiết sản phẩm trong store dashboard
- **`StoreProductVariants.jsx`** - Quản lý variants của sản phẩm
- **`AddProductVariant.jsx`** - Thêm variant mới cho sản phẩm
- **`StoreVariants.jsx`** - Quản lý tất cả variants
- **`StoreOrders.jsx`** - Quản lý đơn hàng của store
- **`StoreOrderDetail.jsx`** - Chi tiết đơn hàng
- **`StorePromotions.jsx`** - Quản lý khuyến mãi
- **`StoreAnalytics.jsx`** - Phân tích doanh số, sản phẩm
- **`StoreProfile.jsx`** - Profile của store
- **`StoreChats.jsx`** - Chat với khách hàng
- **`StoreNotifications.jsx`** - Thông báo của store
- **`BecomeStoreOwner.jsx`** - Trang đăng ký trở thành store owner

---

### 6.14. `pages/stores/`
**Tác dụng:** Public pages về stores

**Files:**
- **`StoresPage.jsx`** - Danh sách tất cả stores
- **`StoreDetailPage.jsx`** - Trang chi tiết store (thông tin, sản phẩm)

---

## 📂 7. THƯ MỤC ROUTES/

**Tác dụng:** File cấu hình routing cho các section khác nhau

**Files:**
- **`AdminRoutes.jsx`** - Routes cho admin dashboard (`/admin-dashboard/*`)
  - `/` → AdminDashboard
  - `/users` → AdminUsers
  - `/stores` → AdminStores
  - `/products` → AdminProducts
  - `/variants` → AdminVariants
  - `/promotions` → AdminPromotions

- **`StoreRoutes.jsx`** - Routes cho store dashboard (`/store-dashboard/*`)
  - `/` → StoreDashboard
  - `/products` → StoreProducts
  - `/products/create` → StoreCreateProduct
  - `/products/:productId` → StoreProductDetail
  - `/product-variants` → StoreProductVariants
  - `/orders` → StoreOrders
  - `/promotions` → StorePromotions
  - `/analytics` → StoreAnalytics
  - `/notifications` → StoreNotifications
  - `/chats` → StoreChats

- **`SellerRoutes.jsx`** - Routes cho seller dashboard (`/seller-dashboard/*`)
  - `/` → SellerDashboard
  - `/products` → SellerProducts
  - `/products/add` → SellerCreateProduct
  - `/orders` → SellerOrders
  - `/chats` → SellerChats
  - `/analytics` → SellerAnalytics
  - `/reviews` → SellerReviews
  - `/settings` → SellerSettings
  - `/notifications` → SellerNotifications

**Nhiệm vụ:**
- Tổ chức routes theo từng module
- Bảo vệ routes với AuthGuard
- Dễ maintain và scale

---

## 📂 8. THƯ MỤC SERVICES/

**Tác dụng:** Chứa tất cả **API services** - logic gọi API và xử lý data

### 8.1. `services/common/`
**Tác dụng:** Services dùng chung cho tất cả users (public APIs)

**Files:**
- **`api.js`** - ⭐ **QUAN TRỌNG NHẤT** - Axios instance với interceptors
  - Base URL configuration
  - Request interceptor: tự động thêm JWT token
  - Response interceptor: xử lý lỗi, auto-retry, auto-logout khi 401
  - Export default `api` instance để tất cả services khác dùng

- **`authService.js`** - Services cho authentication (login, register, logout, refreshToken, verifyEmail, resetPassword)

- **`categoryService.js`** - Services fetch categories (getAllCategories, getCategoryByKey)

- **`productService.js`** - Services fetch products public (getProducts, getProductById, searchProducts)

- **`searchService.js`** - Services tìm kiếm (search, advancedSearch với filters)

- **`storeService.js`** - Services fetch stores public (getStores, getStoreById)

- **`brandService.js`** - Services fetch brands (getBrands, getBrandById)

- **`index.js`** - Export tất cả common services

---

### 8.2. `services/buyer/`
**Tác dụng:** Services cho **người mua** (buyer/customer)

**Files:**
- **`cartService.js`** - Services giỏ hàng (addToCart, removeFromCart, updateQuantity, getCart, clearCart)

- **`orderService.js`** - Services đơn hàng (createOrder, getOrders, getOrderById, cancelOrder, trackOrder)

- **`reviewService.js`** - Services đánh giá (createReview, updateReview, deleteReview, getReviews)

- **`addressService.js`** - Services địa chỉ (getAddresses, addAddress, updateAddress, deleteAddress, setDefaultAddress)

- **`commentService.js`** - Services bình luận (createComment, getComments, updateComment, deleteComment)

- **`index.js`** - Export tất cả buyer services

---

### 8.3. `services/b2c/`
**Tác dụng:** Services cho **chủ cửa hàng B2C** (store owner)

**Files:**
- **`b2cStoreService.js`** - Services quản lý store (createStore, updateStore, getStoreInfo, getStoreStats)

- **`b2cProductService.js`** - Services quản lý sản phẩm (createProduct, updateProduct, deleteProduct, getProducts, getProductVariants)

- **`b2cOrderService.js`** - Services quản lý đơn hàng (getOrders, getOrderById, updateOrderStatus, shipOrder)

- **`b2cPromotionService.js`** - Services quản lý khuyến mãi (createPromotion, updatePromotion, deletePromotion, getPromotions)

- **`b2cAnalyticsService.js`** - Services phân tích (getSalesStats, getProductStats, getInventoryAnalytics)

- **`index.js`** - Export tất cả b2c services

---

### 8.4. `services/admin/`
**Tác dụng:** Services cho **quản trị viên** (admin)

**Files:**
- **`adminUserService.js`** - Services quản lý users (getUsers, getUserById, updateUser, deleteUser, banUser)

- **`adminStoreService.js`** - Services quản lý stores (getStores, approveStore, rejectStore, suspendStore)

- **`adminProductService.js`** - Services quản lý products (getProducts, approveProduct, rejectProduct)

- **`adminVariantService.js`** - Services quản lý variants (getVariants, approveVariant, rejectVariant)

- **`adminPromotionService.js`** - Services quản lý promotions (getPromotions, approvePromotion, rejectPromotion)

- **`promotionService.js`** - Có thể là duplicate hoặc service khác

- **`userService.js`** - Có thể là duplicate hoặc service khác

- **`index.js`** - Export tất cả admin services

---

### 8.5. `services/index.js`
**Tác dụng:** Central export file - export tất cả services để dễ import

**Nội dung:**
- Export tất cả services theo category (commonServices, buyerServices, b2cServices, adminServices)
- Export commonly used services trực tiếp (api, authService, cartService, orderService)

---

## 📂 9. THƯ MỤC UTILS/

**Tác dụng:** Utility functions và helper functions

**Files:**
- **`attributeLabels.js`** - Mapping labels cho product attributes (ví dụ: "RAM" → "Bộ nhớ RAM")

- **`imageUtils.js`** - Utility functions xử lý ảnh (getProductGallery, validateImageUrl, getPlaceholderImage)

- **`sweetalert.js`** - Wrapper functions cho SweetAlert2 (showSuccess, showError, showConfirm, showLoading)

---

## 📄 10. CÁC FILE ROOT

### 10.1. `App.jsx`
**Tác dụng:** ⭐ **ROOT COMPONENT** - Component chính của ứng dụng

**Nhiệm vụ:**
- Setup React Router (BrowserRouter)
- Setup SWR Config (caching, revalidation)
- Setup Context Providers (AuthProvider, CartProvider, StoreProvider, ToastProvider)
- Định nghĩa tất cả routes chính:
  - Public routes: `/`, `/auth`, `/product/:id`, `/products/:category`, `/search`, `/cart`, `/checkout`
  - Protected routes: `/seller-dashboard/*`, `/store-dashboard/*`, `/admin-dashboard/*`
- Handle 404 → redirect về `/`

**Cấu trúc:**
```jsx
<SWRConfig>
  <AuthProvider>
    <CartProvider>
      <StoreProvider>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              {/* All routes */}
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </StoreProvider>
    </CartProvider>
  </AuthProvider>
</SWRConfig>
```

---

### 10.2. `main.jsx`
**Tác dụng:** ⭐ **ENTRY POINT** - File đầu tiên được chạy

**Nhiệm vụ:**
- Import global CSS (`index.css`)
- Import SweetAlert2 CSS
- Render `App` component vào DOM element `#root`
- Sử dụng React 18+ `createRoot` API

**Code:**
```jsx
import { createRoot } from 'react-dom/client'
import './index.css'
import 'sweetalert2/dist/sweetalert2.min.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(<App />)
```

---

### 10.3. `index.css`
**Tác dụng:** Global CSS stylesheet

**Nhiệm vụ:**
- Import Tailwind CSS directives (`@tailwind base/components/utilities`)
- Custom animations (slide-in-right, marquee, ticker, fadeIn)
- Custom utilities (line-clamp-2, scrollbar-hide)
- Global styles

---

## 🔄 LUỒNG HOẠT ĐỘNG

### 1. **Entry Point:**
```
main.jsx → App.jsx → Routes → Pages → Components
```

### 2. **Data Flow:**
```
Pages → Hooks → Services → API (axios) → Backend
```

### 3. **State Management:**
```
Context (AuthContext, CartContext, StoreContext, ToastContext)
  ↓
Components consume context
  ↓
Update state via context methods
```

### 4. **Component Hierarchy:**
```
App.jsx
  └── Routes
      └── Layout (MainLayout/AdminLayout/SellerLayout/StoreLayout)
          └── Page Component
              └── Components (reusable)
                  └── UI Components (Button, Input, Toast)
```

---

## 📊 TỔNG KẾT

### Số lượng files theo category:
- **Components:** ~50+ files
- **Pages:** ~40+ files
- **Services:** ~25+ files
- **Hooks:** 10 files
- **Context:** 4 files
- **Layouts:** 4 files
- **Routes:** 3 files
- **Utils:** 3 files
- **Constants:** 2 files

### Kiến trúc tổng thể:
- ✅ **Separation of Concerns:** Tách biệt rõ ràng components, pages, services, hooks
- ✅ **Reusability:** Components và hooks có thể tái sử dụng
- ✅ **Scalability:** Dễ dàng thêm features mới
- ✅ **Maintainability:** Code được tổ chức tốt, dễ maintain
- ✅ **Type Safety:** (Có thể cải thiện bằng TypeScript)

### Điểm mạnh:
1. Cấu trúc rõ ràng, dễ hiểu
2. Services được tách theo role (common, buyer, b2c, admin)
3. Custom hooks giúp tái sử dụng logic
4. Context API quản lý global state đơn giản
5. Centralized API configuration với interceptors

### Điểm cần cải thiện:
1. Có thể thêm TypeScript để type safety
2. Có thể thêm unit tests cho hooks và services
3. Có thể optimize bundle size với code splitting
4. Có thể thêm error boundaries

---

**Cập nhật lần cuối:** [Ngày hiện tại]
**Người phân tích:** AI Assistant
**Trạng thái:** ✅ Hoàn thành

