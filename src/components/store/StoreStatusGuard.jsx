import React from 'react';
import { Link } from 'react-router-dom';
import StoreLayout from '../../layouts/StoreLayout';

const StoreStatusGuard = ({ children, currentStore, pageName = 'chức năng này', noSidebar = false, loading = false }) => {
  // Hiển thị loading nếu đang tải
  if (loading) {
    return (
      <StoreLayout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </StoreLayout>
    );
  }

  // Hiển thị thông báo nếu không có chi nhánh được chọn
  if (!currentStore) {
    return (
      <StoreLayout>
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa chọn chi nhánh</h3>
          <p className="text-gray-500 mb-4">Vui lòng chọn một chi nhánh để sử dụng {pageName}</p>
          <Link
            to="/store/management"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Chọn chi nhánh
          </Link>
        </div>
      </StoreLayout>
    );
  }

  // Hiển thị thông báo nếu store đang chờ duyệt
  if (currentStore.status === 'PENDING') {
    const content = (
      <div className="text-center py-12">
        <div className="w-20 h-20 mx-auto mb-6 bg-yellow-100 rounded-full flex items-center justify-center">
          <svg className="w-10 h-10 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"/>
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-4">Chi nhánh đang chờ duyệt</h3>
        <p className="text-gray-600 mb-6 text-lg">
          <strong>{currentStore.branchName}</strong> đang chờ Admin duyệt. 
          Bạn sẽ có thể sử dụng {pageName} sau khi chi nhánh được duyệt.
        </p>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-lg mx-auto">
          <p className="text-yellow-800 font-medium">
            <strong>Thông báo:</strong> {pageName.charAt(0).toUpperCase() + pageName.slice(1)} sẽ được mở khi cửa hàng được duyệt thành công.
          </p>
        </div>
      </div>
    );

    if (noSidebar) {
      return (
        <div className="min-h-screen bg-gray-50">
          {content}
        </div>
      );
    }

    return <StoreLayout>{content}</StoreLayout>;
  }

  // Hiển thị thông báo nếu store bị từ chối
  if (currentStore.status === 'REJECTED') {
    const content = (
      <div className="text-center py-12">
        <div className="w-20 h-20 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
          <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-4">Chi nhánh bị từ chối</h3>
        <p className="text-gray-600 mb-6 text-lg">
          <strong>{currentStore.branchName}</strong> đã bị Admin từ chối. 
          Vui lòng liên hệ Admin để được hỗ trợ hoặc tạo chi nhánh mới.
        </p>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-lg mx-auto mb-6">
          <p className="text-red-800 font-medium">
            <strong>Thông báo:</strong> {pageName.charAt(0).toUpperCase() + pageName.slice(1)} sẽ được mở khi cửa hàng được duyệt thành công.
          </p>
        </div>
        <div className="flex gap-4 justify-center">
          <Link
            to="/store/management"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
          >
            Quản lý chi nhánh
          </Link>
          <button
            onClick={async () => {
              const { infoAlert } = await import('../../utils/sweetalert');
              await infoAlert('Thông báo', 'Chức năng liên hệ Admin sẽ được implement sau');
            }}
            className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
          >
            Liên hệ Admin
          </button>
        </div>
      </div>
    );

    if (noSidebar) {
      return (
        <div className="min-h-screen bg-gray-50">
          {content}
        </div>
      );
    }

    return <StoreLayout>{content}</StoreLayout>;
  }

  // Nếu store đã được duyệt, hiển thị nội dung bình thường
  return children;
};

export default StoreStatusGuard;

