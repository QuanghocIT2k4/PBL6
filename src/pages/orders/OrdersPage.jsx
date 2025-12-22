import { useNavigate } from 'react-router-dom';
import MainLayout from '../../layouts/MainLayout';
import OrderList from '../../components/orders/OrderList';
import SEO from '../../components/seo/SEO';

/**
 * OrdersPage Component
 * Displays user's order history with full info in list view
 */
const OrdersPage = () => {
  const navigate = useNavigate();

  return (
    <MainLayout>
      <SEO 
        title="Đơn hàng của tôi | E-Comm"
        description="Xem lịch sử đơn hàng, theo dõi trạng thái giao hàng và quản lý đơn hàng của bạn."
        keywords="đơn hàng, lịch sử đơn hàng, theo dõi đơn hàng, quản lý đơn hàng"
        url="https://pbl-6-eight.vercel.app/orders"
      />
      <div className="bg-gray-50 min-h-screen py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Page Header - Simple */}
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Đơn hàng của tôi
            </h1>
            <button
              onClick={() => navigate('/reviews/my')}
              className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all shadow-md hover:shadow-lg flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
              Lịch sử đánh giá
            </button>
          </div>

          {/* Orders List - Full info in cards */}
          <OrderList />
        </div>
      </div>
    </MainLayout>
  );
};

export default OrdersPage;
