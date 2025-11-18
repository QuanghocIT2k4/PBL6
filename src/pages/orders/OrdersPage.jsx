import MainLayout from '../../layouts/MainLayout';
import OrderList from '../../components/orders/OrderList';

/**
 * OrdersPage Component
 * Displays user's order history with full info in list view
 */
const OrdersPage = () => {

  return (
    <MainLayout>
      <div className="bg-gray-50 min-h-screen py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Page Header - Simple */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Đơn hàng của tôi
            </h1>
          </div>

          {/* Orders List - Full info in cards */}
          <OrderList />
        </div>
      </div>
    </MainLayout>
  );
};

export default OrdersPage;
