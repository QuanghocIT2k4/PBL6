import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import StoreSidebar from '../components/store/StoreSidebar';
import { useStoreContext } from '../context/StoreContext';
import { useChat } from '../context/ChatContext';
import NotificationContainer from '../components/notifications/NotificationContainer';

const StoreLayout = ({ children }) => {
  const [showStoreSwitcher, setShowStoreSwitcher] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { currentStore, userStores, selectStore, loading } = useStoreContext();
  const { unreadCount } = useChat();

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Only close if clicking outside the container and not on a button inside
      if (showUserMenu && !event.target.closest('.user-menu-container')) {
        setShowUserMenu(false);
      }
      if (showStoreSwitcher && !event.target.closest('.store-switcher-container')) {
        setShowStoreSwitcher(false);
      }
    };

    if (showUserMenu || showStoreSwitcher) {
      document.addEventListener('click', handleClickOutside);
      return () => {
        document.removeEventListener('click', handleClickOutside);
      };
    }
  }, [showUserMenu, showStoreSwitcher]);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <StoreSidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Navigation */}
        <header className="bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-white">
                {currentStore ? `${currentStore.storeName || currentStore.name}` : 'Store Management'}
              </h1>
              <p className="text-sm text-blue-100">
                {currentStore ? 'Quản lý chi nhánh của bạn' : 'Chọn chi nhánh để tiếp tục'}
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Store Switcher */}
                  <div className="relative store-switcher-container">
                    <button 
                      onClick={() => setShowStoreSwitcher(!showStoreSwitcher)}
                      className="flex items-center space-x-2 px-3 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors"
                    >
                  <span className="text-sm font-medium text-white">
                    {currentStore ? currentStore.name : 'Chọn chi nhánh'}
                  </span>
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/>
                  </svg>
                </button>
                
                {showStoreSwitcher && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    <div className="p-3 border-b border-gray-200">
                      <h3 className="text-sm font-medium text-gray-900">Chọn chi nhánh</h3>
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                      {userStores.map((branch) => (
                        <button
                          key={branch.id}
                          onClick={() => {
                            selectStore(branch.id);
                            setShowStoreSwitcher(false);
                          }}
                          className={`w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors ${
                            currentStore?.id === branch.id ? 'bg-green-50 text-green-700' : 'text-gray-700'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg flex items-center justify-center">
                              <span className="text-white font-bold text-xs">
                                {branch.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-medium">{branch.name}</p>
                              <p className="text-xs text-gray-500">
                                {typeof branch.address === 'string' 
                                  ? branch.address 
                                  : (branch.address?.homeAddress || branch.address?.suggestedName || '') + 
                                    (branch.address?.ward ? `, ${branch.address.ward}` : '') +
                                    (branch.address?.province ? `, ${branch.address.province}` : '')
                                }
                              </p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                    <div className="p-3 border-t border-gray-200 space-y-2">
                      <Link
                        to="/store-dashboard/management"
                        className="flex items-center justify-center gap-2 w-full px-3 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white text-sm font-semibold rounded-lg hover:from-green-600 hover:to-green-700 transition-all shadow-sm hover:shadow-md"
                        onClick={() => setShowStoreSwitcher(false)}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/>
                        </svg>
                        Thêm store mới
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* Notifications */}
              {currentStore && (
                <NotificationContainer 
                  userType="store" 
                  storeId={currentStore.id} 
                />
              )}

              {/* Chat Icon with Badge */}
              {currentStore && (
                <button
                  onClick={() => navigate('/store-dashboard/chats')}
                  className="relative p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                  title="Chat với khách hàng"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  
                  {/* Unread Badge */}
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
              )}

              {/* User Info */}
              <div className="relative user-menu-container">
                <button 
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-3 hover:bg-white hover:bg-opacity-20 rounded-lg px-3 py-2 transition-colors"
                >
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">Q</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-white">Quang Nguyễn</p>
                    <p className="text-xs text-blue-100">Store Manager</p>
                  </div>
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/>
                  </svg>
                </button>
                
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-100 z-[9999] overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 border-b border-gray-100">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
                          <span className="text-white font-bold text-lg">Q</span>
                        </div>
                        <div>
                          <p className="text-base font-semibold text-gray-900">Quang Nguyễn</p>
                          <p className="text-sm text-gray-600">Store Manager</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="py-2">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setShowUserMenu(false);
                          console.log('Navigate to profile');
                        }}
                        className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-all duration-200 cursor-pointer group"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                            <svg className="w-4 h-4 text-gray-500 group-hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                            </svg>
                          </div>
                          <span className="font-medium">Thông tin cá nhân</span>
                        </div>
                      </button>
                      
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setShowUserMenu(false);
                          console.log('Navigate to change password');
                        }}
                        className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 transition-all duration-200 cursor-pointer group"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-green-100 transition-colors">
                            <svg className="w-4 h-4 text-gray-500 group-hover:text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/>
                            </svg>
                          </div>
                          <span className="font-medium">Đổi mật khẩu</span>
                        </div>
                      </button>
                      
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setShowUserMenu(false);
                          console.log('Navigate to account settings');
                        }}
                        className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-all duration-200 cursor-pointer group"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-purple-100 transition-colors">
                            <svg className="w-4 h-4 text-gray-500 group-hover:text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                            </svg>
                          </div>
                          <span className="font-medium">Cài đặt tài khoản</span>
                        </div>
                      </button>
                    </div>
                    
                    <div className="border-t border-gray-100 py-2">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setShowUserMenu(false);
                          console.log('Logout');
                        }}
                        className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-200 cursor-pointer group"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center group-hover:bg-red-200 transition-colors">
                            <svg className="w-4 h-4 text-red-500 group-hover:text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                            </svg>
                          </div>
                          <span className="font-medium">Đăng xuất</span>
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default StoreLayout;