import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useChat } from '../context/ChatContext';
import Button from '../components/ui/Button';
import SearchBar from '../components/search/SearchBar';
import NotificationContainer from '../components/notifications/NotificationContainer';

const MainLayout = ({ children }) => {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  const { getTotalItems, cartItems } = useCart();
  const { unreadCount } = useChat();
  const totalItems = getTotalItems();
  const distinctCount = cartItems.length;

  // Topbar marquee slogans
  const slogans = [
    '• Chào mừng thành viên mới – Đăng ký thành viên – Rinh quà ngay!',
    '• Công nghệ đỉnh cao, – Giá rẻ bất ngờ',
    '• Mua hàng online – Chuẩn từng ly – Nhận ngay tức thì!',
    '• Sản phẩm chính hãng – Xuất VAT đầy đủ – Bảo hành 12–36 tháng'
  ];
  const marqueeText = slogans.join('    ');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        {/* Top Bar - GIỮ NGUYÊN */}
        <div className="bg-blue-600 text-white text-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-10">
              {/* Left side */}
              <div className="flex items-center space-x-6 flex-nowrap overflow-hidden">
                <span className="hover:text-blue-200 cursor-pointer whitespace-nowrap">Kênh Người Bán</span>
                <span className="text-blue-200">|</span>
                <div className="flex items-center space-x-2">
                  <span className="whitespace-nowrap">Kết nối</span>
                  {/* Facebook */}
                  <a href="#" className="hover:text-blue-200" aria-label="Facebook">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </a>
                  {/* YouTube */}
                  <a href="#" className="hover:text-blue-200" aria-label="YouTube">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <rect x="2" y="6" width="20" height="12" rx="3" ry="3" strokeWidth="2"/>
                      <path d="M10 9l5 3-5 3V9z" fill="currentColor"/>
                    </svg>
                  </a>
                </div>
                <div className="hidden lg:block w-[520px] overflow-hidden">
                  <div className="relative w-full">
                    <div className="flex whitespace-nowrap animate-[ticker_22s_linear_infinite] will-change-transform text-sm">
                      <span className="mr-8 italic opacity-90">{marqueeText}</span>
                      <span className="mr-8 italic opacity-90" aria-hidden="true">{marqueeText}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right side */}
              <div className="flex items-center space-x-6 flex-nowrap">
                <div className="hidden md:flex items-center space-x-1 hover:text-blue-200 cursor-pointer">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h18l-2 13a2 2 0 01-2 1.7H7a2 2 0 01-2-1.7L3 3zm3 16a2 2 0 104 0m8 0a2 2 0 104 0"/>
                  </svg>
                  <span className="whitespace-nowrap">Tra cứu đơn</span>
                </div>
                <span className="hidden md:inline text-blue-200">|</span>
                <div className="hidden sm:flex items-center space-x-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M22 16.92V21a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.79 19.79 0 012.05 5.2 2 2 0 014 3h4.09a2 2 0 012 1.72 12.66 12.66 0 00.7 2.81 2 2 0 01-.45 2.11L9 11a16 16 0 006 6l1.36-1.36a2 2 0 012.11-.45 12.66 12.66 0 002.81.7A2 2 0 0122 16.92z"/>
                  </svg>
                  <a href="tel:18001234" className="hover:text-blue-200 whitespace-nowrap">Hotline: 1800 1234</a>
                </div>
                <div className="flex items-center space-x-1 hover:text-blue-200 cursor-pointer">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <span className="whitespace-nowrap">Hỗ Trợ</span>
                </div>
                {isAuthenticated ? (
                  <div className="flex items-center space-x-4">
                    {/* User Profile Link */}
                    <button
                      onClick={() => navigate('/profile')}
                      className="flex items-center space-x-2 hover:text-blue-200 cursor-pointer whitespace-nowrap"
                    >
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-xs font-bold">
                        {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <span>{user?.name}</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-4 flex-nowrap">
                    <button 
                      onClick={() => navigate('/auth?tab=register')}
                      className="hover:text-blue-200 whitespace-nowrap"
                    >
                      Đăng Ký
                    </button>
                    <span className="text-blue-200">|</span>
                    <button 
                      onClick={() => navigate('/auth?tab=login')}
                      className="hover:text-blue-200 whitespace-nowrap"
                    >
                      Đăng Nhập
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Header */}
        <div className="bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-20">
              {/* Logo & Navigation */}
              <div className="flex items-center space-x-8">
                <div 
                  className="flex items-center cursor-pointer"
                  onClick={() => navigate('/')}
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
                    </svg>
                  </div>
                  <h1 className="text-2xl font-bold">
                    <span className="text-blue-600">Tech</span>
                    <span className="text-purple-600">Store</span>
                  </h1>
                </div>
                
                {/* Navigation Links */}
                <nav className="hidden md:flex items-center space-x-6">
                  <button
                    onClick={() => navigate('/stores')}
                    className="text-gray-600 hover:text-blue-600 transition-colors font-medium"
                  >
                    Cửa hàng B2C
                  </button>
                </nav>
              </div>

              {/* Become Store Owner Button + Search Bar */}
              <div className="flex items-center flex-1 max-w-4xl mx-8 gap-4">
                {/* Button Trở thành chủ Store */}
                <button
                  onClick={() => {
                    if (!isAuthenticated) {
                      navigate('/auth?tab=login');
                      return;
                    }
                    navigate('/become-store-owner');
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-lg hover:from-orange-600 hover:to-pink-600 transition-all shadow-md hover:shadow-lg whitespace-nowrap font-medium"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
                  </svg>
                  <span className="hidden lg:inline">Trở thành chủ Store</span>
                  <span className="lg:hidden">Bán hàng</span>
                </button>
                
                {/* Search Bar */}
                <div className="flex-1">
                  <SearchBar />
                </div>
              </div>

              {/* Cart & Actions */}
              <div className="flex items-center space-x-4">
                {/* Notifications */}
                <NotificationContainer userType="buyer" />

                {/* Orders - standalone orders page */}
                <button className="relative p-2 text-gray-600 hover:text-blue-600 transition-colors" onClick={()=>navigate('/orders')}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                  </svg>
                </button>

                {/* Chat */}
                <button 
                  onClick={() => {
                    if (!isAuthenticated) {
                      navigate('/auth?tab=login');
                      return;
                    }
                    navigate('/chat');
                  }}
                  className="relative p-2 text-gray-600 hover:text-blue-600 transition-colors group"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  {isAuthenticated && unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                  
                  {/* Tooltip */}
                  <div className="absolute bottom-full right-0 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {isAuthenticated && unreadCount > 0 ? `${unreadCount} tin nhắn chưa đọc` : 'Chat'}
                  </div>
                </button>

                {/* Cart */}
                <button 
                  onClick={() => navigate('/cart')}
                  className="relative p-2 text-gray-600 hover:text-blue-600 transition-colors group"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 4M7 13v8a2 2 0 002 2h6a2 2 0 002-2v-8m-9 0V9a2 2 0 012-2h6a2 2 0 012 2v4.01"/>
                  </svg>
                  {distinctCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                      {distinctCount > 99 ? '99+' : distinctCount}
                    </span>
                  )}

                  {/* Tooltip */}
                  <div className="absolute bottom-full right-0 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {distinctCount > 0 ? `${distinctCount} sản phẩm khác nhau trong giỏ` : 'Giỏ hàng trống'}
                  </div>
                </button>

                {isAuthenticated && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={logout}
                    className="ml-2"
                  >
                    Đăng xuất
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer - CẢI THIỆN */}
      <footer className="bg-gray-800 text-white py-16 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            {/* Company Info */}
            <div className="lg:col-span-1">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                  </svg>
                </div>
                <h3 className="text-xl font-bold">TechStore</h3>
              </div>
              <p className="text-gray-300 text-sm mb-4 leading-relaxed">
                Nền tảng mua sắm công nghệ hàng đầu Việt Nam. Cam kết mang đến sản phẩm chính hãng với giá tốt nhất.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/>
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.746-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24.009c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001.012.001z"/>
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.746-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24.009c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001.012.001z"/>
                  </svg>
                </a>
              </div>
            </div>

            {/* Products */}
            <div>
              <h4 className="text-lg font-semibold mb-6 text-white">Sản phẩm</h4>
              <ul className="space-y-3 text-sm text-gray-300">
                <li><a href="#" className="hover:text-white transition-colors flex items-center"><span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>Điện thoại & Tablet</a></li>
                <li><a href="#" className="hover:text-white transition-colors flex items-center"><span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>Laptop & PC</a></li>
                <li><a href="#" className="hover:text-white transition-colors flex items-center"><span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>Âm thanh & Mic</a></li>
                <li><a href="#" className="hover:text-white transition-colors flex items-center"><span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>Camera & Đồng hồ</a></li>
                <li><a href="#" className="hover:text-white transition-colors flex items-center"><span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>Đồ gia dụng</a></li>
                <li><a href="#" className="hover:text-white transition-colors flex items-center"><span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>Phụ kiện</a></li>
                <li><a href="#" className="hover:text-white transition-colors flex items-center"><span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>Tivi</a></li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="text-lg font-semibold mb-6 text-white">Hỗ trợ</h4>
              <ul className="space-y-3 text-sm text-gray-300">
                <li><a href="#" className="hover:text-white transition-colors flex items-center"><span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>Trung tâm hỗ trợ</a></li>
                <li><a href="#" className="hover:text-white transition-colors flex items-center"><span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>Hướng dẫn mua hàng</a></li>
                <li><a href="#" className="hover:text-white transition-colors flex items-center"><span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>Chính sách đổi trả</a></li>
                <li><a href="#" className="hover:text-white transition-colors flex items-center"><span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>Bảo hành sản phẩm</a></li>
                <li><a href="#" className="hover:text-white transition-colors flex items-center"><span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>Liên hệ</a></li>
                <li><a href="#" className="hover:text-white transition-colors flex items-center"><span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>FAQ</a></li>
              </ul>
            </div>

            {/* Contact & Newsletter */}
            <div>
              <h4 className="text-lg font-semibold mb-6 text-white">Liên hệ</h4>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-blue-400 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                  <div>
                    <p className="text-sm text-gray-300">123 Nguyễn Huệ, Q1</p>
                    <p className="text-sm text-gray-300">TP. Hồ Chí Minh</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                  </svg>
                  <p className="text-sm text-gray-300">1900 1234</p>
                </div>
                <div className="flex items-center space-x-3">
                  <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                  </svg>
                  <p className="text-sm text-gray-300">support@techstore.vn</p>
                </div>
              </div>
              
              {/* Newsletter */}
              <div className="mt-6">
                <h5 className="text-md font-semibold mb-3 text-white">Đăng ký nhận tin</h5>
                <div className="flex">
                  <input 
                    type="email" 
                    placeholder="Email của bạn" 
                    className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-l-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  />
                  <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-r-lg transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="border-t border-gray-700 pt-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Payment Methods */}
              <div>
                <h5 className="text-md font-semibold mb-4 text-white">Phương thức thanh toán</h5>
                <div className="flex space-x-3">
                  <div className="w-12 h-8 bg-white rounded flex items-center justify-center">
                    <span className="text-xs font-bold text-blue-600">VISA</span>
                  </div>
                  <div className="w-12 h-8 bg-white rounded flex items-center justify-center">
                    <span className="text-xs font-bold text-red-600">MC</span>
                  </div>
                  <div className="w-12 h-8 bg-white rounded flex items-center justify-center">
                    <span className="text-xs font-bold text-blue-800">ATM</span>
                  </div>
                  <div className="w-12 h-8 bg-white rounded flex items-center justify-center">
                    <span className="text-xs font-bold text-green-600">COD</span>
                  </div>
                </div>
              </div>

              {/* Certifications */}
              <div>
                <h5 className="text-md font-semibold mb-4 text-white">Chứng nhận</h5>
                <div className="flex space-x-3">
                  <div className="w-12 h-8 bg-green-600 rounded flex items-center justify-center">
                    <span className="text-xs font-bold text-white">SSL</span>
                  </div>
                  <div className="w-12 h-8 bg-blue-600 rounded flex items-center justify-center">
                    <span className="text-xs font-bold text-white">ISO</span>
                  </div>
                  <div className="w-12 h-8 bg-purple-600 rounded flex items-center justify-center">
                    <span className="text-xs font-bold text-white">GDPR</span>
                  </div>
                </div>
              </div>

              {/* Business Hours */}
              <div>
                <h5 className="text-md font-semibold mb-4 text-white">Giờ làm việc</h5>
                <div className="text-sm text-gray-300 space-y-1">
                  <p>Thứ 2 - Thứ 6: 8:00 - 22:00</p>
                  <p>Thứ 7 - Chủ nhật: 9:00 - 21:00</p>
                  <p className="text-green-400">Hỗ trợ 24/7 online</p>
                </div>
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div className="mt-8 pt-8 border-t border-gray-700 text-center">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <p className="text-sm text-gray-300">
                &copy; 2024 TechStore. All rights reserved.
              </p>
              <div className="flex space-x-6 text-sm text-gray-300">
                <a href="#" className="hover:text-white transition-colors">Điều khoản sử dụng</a>
                <a href="#" className="hover:text-white transition-colors">Chính sách bảo mật</a>
                <a href="#" className="hover:text-white transition-colors">Cookie Policy</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;