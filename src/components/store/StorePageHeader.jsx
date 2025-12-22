import React from 'react';
import { useStoreContext } from '../../context/StoreContext';

const StorePageHeader = ({ title, subtitle, children, showStatus = true, icon = null }) => {
  const { currentStore } = useStoreContext();

  const getStatusColor = (status) => {
    const colors = {
      PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      APPROVED: 'bg-transparent text-gray-400 border-transparent',
      REJECTED: 'bg-red-100 text-red-800 border-red-300'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getStatusText = (status) => {
    const texts = {
      PENDING: 'Chờ duyệt',
      APPROVED: '',
      REJECTED: 'Đã từ chối'
    };
    return texts[status] || status;
  };

  // Default icon nếu không truyền vào
  const defaultIcon = (
    <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-400 rounded-xl flex items-center justify-center">
      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
      </svg>
    </div>
  );

  return (
    <div className="bg-gradient-to-r from-cyan-200 to-blue-200 rounded-2xl p-6 mb-6">
      <div className="relative bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
        <div className="flex items-center justify-between">
          {/* LEFT SIDE: Icon + Title + Subtitle */}
          <div className="flex items-center gap-4">
            {/* Icon */}
            {icon || defaultIcon}
            
            {/* Title & Subtitle */}
            <div>
              <h1 className="text-3xl font-bold">
                <span className="text-cyan-600">{title.split(' ')[0]}</span>{' '}
                <span className="text-blue-600">{title.split(' ').slice(1).join(' ')}</span>
              </h1>
              {subtitle && <p className="text-gray-600 mt-1">{subtitle}</p>}
            </div>
          </div>

          {/* RIGHT SIDE: Status Badge + Children (Buttons) */}
          <div className="flex items-center gap-3">
            {children}
            
            {showStatus && currentStore?.status && (
              <div className={`px-4 py-2 rounded-full text-sm font-medium border ${getStatusColor(currentStore.status)}`}>
                {getStatusText(currentStore.status)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StorePageHeader;
