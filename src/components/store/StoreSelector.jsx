import React, { useState, useEffect } from 'react';
import { useStoreContext } from '../../context/StoreContext';

const StoreSelector = ({ onStoreChange }) => {
  const { currentStore, setCurrentStore, userStores } = useStoreContext();
  const [isOpen, setIsOpen] = useState(false);

  const handleStoreSelect = (store) => {
    setCurrentStore(store);
    setIsOpen(false);
    if (onStoreChange) {
      onStoreChange(store);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'APPROVED': return 'bg-transparent text-gray-400 border-transparent';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'REJECTED': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'APPROVED': return '';
      case 'PENDING': return 'Chờ duyệt';
      case 'REJECTED': return 'Bị từ chối';
      default: return 'Không xác định';
    }
  };

  if (!currentStore) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa chọn cửa hàng</h3>
          <p className="text-gray-500 mb-4">Vui lòng chọn một cửa hàng để tiếp tục</p>
          <button
            onClick={() => setIsOpen(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Chọn cửa hàng
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Current Store Display */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white rounded-lg border border-gray-200 p-4 hover:bg-gray-50 transition-colors text-left"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Store Logo */}
            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">
                {currentStore.name.charAt(0).toUpperCase()}
              </span>
            </div>
            
            {/* Store Info */}
            <div>
              <h3 className="font-semibold text-gray-900">{currentStore.name}</h3>
              <p className="text-sm text-gray-500">{currentStore.description}</p>
            </div>
          </div>
          
          {/* Status Badge */}
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(currentStore.status)}`}>
              {getStatusText(currentStore.status)}
            </span>
            <svg className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/>
            </svg>
          </div>
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg border border-gray-200 shadow-lg z-50 max-h-80 overflow-y-auto">
          <div className="p-2">
            <div className="px-3 py-2 text-sm font-medium text-gray-500 border-b border-gray-100 mb-2">
              Chọn cửa hàng ({userStores.length})
            </div>
            
            {userStores.map((store) => (
              <button
                key={store.id}
                onClick={() => handleStoreSelect(store)}
                className={`w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left ${
                  currentStore.id === store.id ? 'bg-green-50 border border-green-200' : ''
                }`}
              >
                {/* Store Logo */}
                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xs">
                    {store.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                
                {/* Store Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 truncate">{store.name}</h4>
                  <p className="text-sm text-gray-500 truncate">{store.description}</p>
                </div>
                
                {/* Status */}
                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(store.status)}`}>
                  {getStatusText(store.status)}
                </span>
                
                {/* Selected Indicator */}
                {currentStore.id === store.id && (
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                  </svg>
                )}
              </button>
            ))}
            
            {/* Add New Store Button */}
            <div className="mt-2 pt-2 border-t border-gray-100">
              <button
                onClick={() => {
                  setIsOpen(false);
                  // TODO: Navigate to create store page
                  console.log('Navigate to create store');
                }}
                className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left text-green-600"
              >
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium">Tạo cửa hàng mới</h4>
                  <p className="text-sm text-gray-500">Thêm cửa hàng vào tài khoản</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-transparent"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default StoreSelector;
