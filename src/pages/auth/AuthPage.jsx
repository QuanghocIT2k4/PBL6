import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import LoginForm from '../../components/forms/LoginForm';
import RegisterForm from '../../components/forms/RegisterForm';
import ForgotPasswordForm from '../../components/ForgotPasswordForm';
import SEO from '../../components/seo/SEO';

const AuthPage = () => {
  const [searchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab'); // Lấy ?tab=register hoặc ?tab=login
  const [currentView, setCurrentView] = useState(tabFromUrl || 'login'); // Default login nếu không có tab
  
  // Cập nhật currentView khi URL thay đổi
  useEffect(() => {
    if (tabFromUrl) {
      setCurrentView(tabFromUrl);
    }
  }, [tabFromUrl]);

  switch (currentView) {
    case 'login':
      return (
        <>
          <SEO 
            title="Đăng nhập | E-Comm"
            description="Đăng nhập vào tài khoản của bạn để mua sắm và quản lý đơn hàng."
            keywords="đăng nhập, login, tài khoản"
            url="https://pbl-6-eight.vercel.app/auth?tab=login"
          />
          <LoginForm 
            onSwitchToSignUp={() => setCurrentView('register')}
            onSwitchToForgotPassword={() => setCurrentView('forgot')}
          />
        </>
      );
    case 'register':
      return (
        <>
          <SEO 
            title="Đăng ký | E-Comm"
            description="Tạo tài khoản mới để bắt đầu mua sắm và nhận nhiều ưu đãi hấp dẫn."
            keywords="đăng ký, register, tạo tài khoản"
            url="https://pbl-6-eight.vercel.app/auth?tab=register"
          />
          <RegisterForm 
            onSwitchToLogin={() => setCurrentView('login')}
          />
        </>
      );
    case 'forgot':
      return (
        <>
          <SEO 
            title="Quên mật khẩu | E-Comm"
            description="Khôi phục mật khẩu của bạn bằng email đã đăng ký."
            keywords="quên mật khẩu, forgot password, khôi phục mật khẩu"
            url="https://pbl-6-eight.vercel.app/auth?tab=forgot"
          />
          <ForgotPasswordForm 
            onBackToLogin={() => setCurrentView('login')}
          />
        </>
      );
    default:
      return (
        <>
          <SEO 
            title="Đăng nhập | E-Comm"
            description="Đăng nhập vào tài khoản của bạn để mua sắm và quản lý đơn hàng."
            keywords="đăng nhập, login, tài khoản"
            url="https://pbl-6-eight.vercel.app/auth"
          />
          <LoginForm 
            onSwitchToSignUp={() => setCurrentView('register')}
            onSwitchToForgotPassword={() => setCurrentView('forgot')}
          />
        </>
      );
  }
};

export default AuthPage;