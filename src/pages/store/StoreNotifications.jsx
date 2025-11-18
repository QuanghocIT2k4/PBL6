import React from 'react';
import StoreLayout from '../../layouts/StoreLayout';
import StoreStatusGuard from '../../components/store/StoreStatusGuard';
import { useStoreContext } from '../../context/StoreContext';

const StoreNotifications = () => {
  const { currentStore, loading: storeLoading } = useStoreContext();

  return (
    <StoreStatusGuard currentStore={currentStore} pageName="thông báo" loading={storeLoading}>
      <StoreLayout>
        <div className="space-y-6">
                <div>
            <h1 className="text-2xl font-bold text-gray-900">Thông báo</h1>
            <p className="text-gray-600 mt-1">Quản lý thông báo và cập nhật từ hệ thống</p>
        </div>

          <div className="bg-white rounded-xl border border-gray-200 p-12 shadow-sm text-center">
            <div className="text-6xl mb-4">🔔</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Chức năng đang phát triển</h2>
            <p className="text-gray-600">
              Tính năng thông báo sẽ được cập nhật trong phiên bản tiếp theo
            </p>
        </div>
      </div>
    </StoreLayout>
    </StoreStatusGuard>
  );
};

export default StoreNotifications;
