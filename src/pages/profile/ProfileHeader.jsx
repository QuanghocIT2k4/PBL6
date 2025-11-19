import { useState, useRef, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/ui/Button'; // ✅ SỬA: thêm đường dẫn đúng

const ProfileHeader = ({ profile, onAvatarUpload, updating }) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const { error: showError, success: showSuccess, info: showInfo } = useToast();

  // Debug: Log profile data
  useEffect(() => {
    console.log('👤 Profile data:', profile);
    console.log('🖼️ Avatar URL:', profile?.avatar);
    console.log('🖼️ Avatar exists:', !!profile?.avatar);
  }, [profile]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  // Convert PNG to JPG if needed
  const convertToJPG = (file) => {
    return new Promise((resolve) => {
      if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
        resolve(file);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          
          const ctx = canvas.getContext('2d');
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
          
          canvas.toBlob((blob) => {
            // Generate proper filename
            let newFilename = file.name.replace(/\.\w+$/, '.jpg');
            
            // If original name doesn't have extension, add .jpg
            if (!newFilename.endsWith('.jpg')) {
              newFilename = newFilename + '.jpg';
            }
            
            // Fallback if name is invalid
            if (!newFilename || newFilename === '.jpg') {
              newFilename = 'avatar_' + Date.now() + '.jpg';
            }
            
            console.log(' Converting:', file.name, ' ', newFilename);
            
            const jpgFile = new File([blob], newFilename, {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            resolve(jpgFile);
          }, 'image/jpeg', 0.9);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      showError('Vui lòng chọn file ảnh');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB
      showError('File ảnh phải nhỏ hơn 5MB');
      return;
    }

    setUploading(true);
    try {
      // Show info about file
      showInfo(`Đang xử lý ảnh: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`);
      
      // Convert PNG to JPG if needed
      const processedFile = await convertToJPG(file);
      
      if (processedFile.type !== file.type) {
        showInfo(`Đã chuyển đổi ${file.type} → ${processedFile.type}`);
      }
      
      console.log('📤 Uploading:', processedFile.type, processedFile.name);
      showInfo('Đang upload lên server...');
      
      const result = await onAvatarUpload(processedFile);
      
      console.log('📥 Upload result:', result);
      console.log('📥 Avatar URL:', result.data?.avatar || result.data?.avatarUrl);
      
      if (result.success) {
        showSuccess('Upload avatar thành công! Đang tải lại...');
        
        // Backend không trả về avatar URL đúng format
        // Phải reload để fetch lại profile từ API
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        console.error('❌ Upload failed:', result.error);
        showError(`Lỗi: ${result.error || 'Không thể upload ảnh'}`);
      }
    } catch (error) {
      console.error('❌ Exception:', error);
      showError(`Lỗi: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN').format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <div className="flex items-center space-x-6">
        {/* Avatar */}
        <div className="relative">
          <div 
            className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center cursor-pointer hover:bg-gray-300 transition-colors overflow-hidden"
            onClick={handleAvatarClick}
          >
            {profile?.avatar ? (
              <img 
                src={profile.avatar} 
                alt="Avatar" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  console.error('❌ Avatar load failed:', profile.avatar);
                  console.error('❌ Error event:', e);
                  // Fallback to initial
                  e.target.style.display = 'none';
                }}
                onLoad={() => {
                  console.log('✅ Avatar loaded successfully:', profile.avatar);
                }}
              />
            ) : null}
            
            {/* Fallback letter */}
            {!profile?.avatar && (
              <span className="text-3xl text-gray-600">
                {profile?.name?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            )}
            
            {/* Upload overlay */}
            {(uploading || updating) && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
              </div>
            )}
          </div>
          
          {/* Camera icon */}
          <button
            onClick={handleAvatarClick}
            disabled={uploading || updating}
            className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path>
            </svg>
          </button>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* User Info */}
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            {profile?.fullName || profile?.name || 'Chưa cập nhật tên'}
          </h1>
          <p className="text-gray-600 mb-2">{profile?.email}</p>
          
          {/* Stats */}
          <div className="flex items-center space-x-6 text-sm text-gray-500">
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
              </svg>
              <span>Thành viên từ {formatDate(profile?.stats?.memberSince || '2024-01-01')}</span>
            </div>
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 4M7 13v8a2 2 0 002 2h6a2 2 0 002-2v-8m-9 0V9a2 2 0 012-2h6a2 2 0 012 2v4.01"></path>
              </svg>
              <span>{profile?.stats?.totalOrders || 0} đơn hàng</span>
            </div>
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
              </svg>
              <span>{formatCurrency(profile?.stats?.totalSpent || 0)}đ đã chi tiêu</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;