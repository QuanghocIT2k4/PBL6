/**
 * ================================================
 * SERVICES INDEX - Tập trung tất cả services
 * ================================================
 * Cấu trúc thư mục:
 * 
 * services/
 *   ├── common/      - APIs dùng chung (auth, product public, category, search)
 *   ├── buyer/       - APIs cho người mua (cart, order, review, address, comment)
 *   ├── b2c/         - APIs cho chủ cửa hàng B2C (store, product, order, promotion, analytics)
 *   └── admin/       - APIs cho quản trị viên (user, store approval, etc.)
 * 
 * Usage:
 *   import { api, authService } from '@/services/common';
 *   import { cartService, orderService } from '@/services/buyer';
 *   import { b2cStoreService, b2cAnalyticsService } from '@/services/b2c';
 *   import { userService } from '@/services/admin';
 */

// Export all services by category
export * as commonServices from './common';
export * as buyerServices from './buyer';
export * as b2cServices from './b2c';
export * as adminServices from './admin';

// Export commonly used services for convenience
export { default as api } from './common/api';
export * from './common/authService';
export * from './buyer/cartService';
export * from './buyer/orderService';



