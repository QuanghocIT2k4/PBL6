import React, { useState } from 'react';
import useSWR from 'swr';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import { getAllUsers, banUser, unbanUser } from '../../services/admin/adminUserService';
import { useToast } from '../../context/ToastContext';

const AdminUsers = () => {
  const { showToast } = useToast();
  const [currentPage, setCurrentPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [banReason, setBanReason] = useState('');
  const [banType, setBanType] = useState('PERMANENT');
  const [banDays, setBanDays] = useState(30);
  const [showBanModal, setShowBanModal] = useState(false);
  const pageSize = 50; // Tăng lên 50 users mỗi trang

  // Fetch users
  const { data: usersData, error, isLoading, mutate } = useSWR(
    ['admin-users', currentPage, searchTerm],
    () => getAllUsers({
      page: currentPage,
      size: pageSize,
      userName: searchTerm || null,
      userEmail: searchTerm || null,
      userPhone: searchTerm || null,
    }),
    { revalidateOnFocus: false }
  );

  // ✅ Dùng isActive từ backend (không cần localStorage nữa)
  let users = usersData?.success ? (usersData.data?.content || usersData.data || []) : [];
  
  const totalPages = usersData?.data?.totalPages || 0;
  const totalElements = usersData?.data?.totalElements || 0;

  // Không cần filter client-side nữa vì backend đã filter
  const filteredUsers = users;

  // Handle ban user
  const handleBanUser = async () => {
    if (!selectedUser || !banReason.trim()) {
      showToast('Vui lòng nhập lý do ban', 'error');
      return;
    }

    // Validate TEMPORARY phải có durationDays
    if (banType === 'TEMPORARY' && (!banDays || banDays < 1)) {
      showToast('Vui lòng nhập số ngày ban (tối thiểu 1 ngày)', 'error');
      return;
    }

    const banData = {
      userId: selectedUser.id,
      reason: banReason,
      banType: banType,
    };

    // Chỉ thêm durationDays nếu là TEMPORARY
    if (banType === 'TEMPORARY') {
      banData.durationDays = parseInt(banDays);
    }

    console.log('🔵 [BAN] Sending ban request:', banData);
    const result = await banUser(banData);
    console.log('🔵 [BAN] Result:', result);

    if (result.success) {
      showToast('Ban người dùng thành công', 'success');
      console.log('✅ [BAN] Success! Updating local state...');
      
      setShowBanModal(false);
      setSelectedUser(null);
      setBanReason('');
      setBanType('PERMANENT');
      setBanDays(30);
      
      // ✅ UPDATE LOCAL STATE với active = false
      mutate(
        (currentData) => {
          if (!currentData?.data?.content) return currentData;
          
          return {
            ...currentData,
            data: {
              ...currentData.data,
              content: currentData.data.content.map(user => 
                user.id === selectedUser.id 
                  ? { ...user, active: false } // ← Backend set active = false
                  : user
              )
            }
          };
        },
        false
      );
      
      console.log('✅ [BAN] Local state updated!');
    } else {
      console.error('❌ [BAN] Failed:', result.error);
      showToast(result.error, 'error');
    }
  };

  // Handle unban user
  const handleUnbanUser = async (userId) => {
    console.log('🟢 [UNBAN] Sending unban request for user:', userId);
    const result = await unbanUser(userId);
    console.log('🟢 [UNBAN] Result:', result);

    if (result.success) {
      showToast('Gỡ ban người dùng thành công', 'success');
      console.log('✅ [UNBAN] Success! Updating local state...');
      
      // ✅ UPDATE LOCAL STATE với active = true
      mutate(
        (currentData) => {
          if (!currentData?.data?.content) return currentData;
          
          return {
            ...currentData,
            data: {
              ...currentData.data,
              content: currentData.data.content.map(user => 
                user.id === userId 
                  ? { ...user, active: true } // ← Backend set active = true
                  : user
              )
            }
          };
        },
        false
      );
      
      console.log('✅ [UNBAN] Local state updated!');
    } else {
      console.error('❌ [UNBAN] Failed:', result.error);
      showToast(result.error, 'error');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <AdminPageHeader 
        icon="👥"
        title="Quản lý Người dùng"
        subtitle="Quản lý tất cả người dùng trong hệ thống"
      />

      <div className="bg-white rounded-2xl p-6 shadow-sm">

        {/* Search */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="🔍 Tìm kiếm theo tên, email, số điện thoại..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div className="text-sm text-gray-600">
              Tổng: <span className="font-bold text-purple-600">{totalElements}</span> users
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-600">
              <p>Không thể tải danh sách người dùng</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>Không tìm thấy người dùng nào</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Username</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Họ tên</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vai trò</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                      {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày tạo</th> */}
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredUsers.map((user) => {
                      
                      return (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                              {user.avatar ? (
                                <img src={user.avatar} alt={user.username} className="w-full h-full rounded-full object-cover" />
                              ) : (
                                <span className="text-lg">👤</span>
                              )}
                            </div>
                            <span className="font-medium text-gray-900">{user.username}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.fullName || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-wrap gap-1">
                            {(() => {
                              // Xử lý cả roles (array) và role (string)
                              const userRoles = user.roles || (user.role ? [user.role] : []);
                              
                              if (userRoles.length > 0) {
                                // ✅ Ưu tiên hiển thị: ADMIN > SHIPPER > USER
                                const priorityOrder = ['ADMIN', 'SHIPPER', 'USER'];
                                const sortedRoles = [...userRoles].sort((a, b) => {
                                  const indexA = priorityOrder.indexOf(a);
                                  const indexB = priorityOrder.indexOf(b);
                                  return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
                                });
                                
                                // Chỉ hiển thị role ưu tiên nhất (role đầu tiên sau khi sort)
                                const primaryRole = sortedRoles[0];
                                
                                return (
                                  <span
                                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                                      primaryRole === 'ADMIN' ? 'bg-red-100 text-red-800' :
                                      primaryRole === 'SHIPPER' ? 'bg-teal-100 text-teal-800' :
                                      'bg-blue-100 text-blue-800'
                                    }`}
                                  >
                                    {primaryRole === 'ADMIN' ? '👑 Admin' : 
                                     primaryRole === 'SHIPPER' ? '🚚 Shipper' : 
                                     '👤 User'}
                                  </span>
                                );
                              } else {
                                return (
                                  <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-bold">
                                    N/A
                                  </span>
                                );
                              }
                            })()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {user.active === false ? (
                            <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-bold">
                              ❌ Đã ban
                            </span>
                          ) : user.active === true ? (
                            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold">
                              ✅ Hoạt động
                            </span>
                          ) : (
                            <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-bold">
                              ⚠️ Không rõ (active = {String(user.active)})
                            </span>
                          )}
                        </td>
                        {/* <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(user.createdAt)}
                        </td> */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {!user.roles?.includes('ADMIN') && (
                            user.active === false ? (
                              <button
                                onClick={() => handleUnbanUser(user.id)}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                              >
                                Gỡ ban
                              </button>
                            ) : user.active === true ? (
                              <button
                                onClick={() => {
                                  setSelectedUser(user);
                                  setShowBanModal(true);
                                }}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                              >
                                Ban
                              </button>
                            ) : (
                              <span className="text-xs text-gray-500">
                                ⚠️ active = {String(user.active)}
                              </span>
                            )
                          )}
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Trang <span className="font-medium">{currentPage + 1}</span> / <span className="font-medium">{totalPages}</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                      disabled={currentPage === 0}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                    >
                      ← Trước
                    </button>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                      disabled={currentPage >= totalPages - 1}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                    >
                      Sau →
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Ban Modal */}
      {showBanModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Ban người dùng</h2>
            <p className="text-gray-600 mb-4">
              Bạn đang ban: <span className="font-bold">{selectedUser?.username}</span>
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lý do ban <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  placeholder="Nhập lý do ban..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Loại ban <span className="text-red-500">*</span>
                </label>
                <select
                  value={banType}
                  onChange={(e) => setBanType(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                >
                  <option value="TEMPORARY">Tạm thời</option>
                  <option value="PERMANENT">Vĩnh viễn</option>
                </select>
              </div>

              {banType === 'TEMPORARY' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Số ngày ban <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={banDays}
                    onChange={(e) => setBanDays(e.target.value)}
                    min="1"
                    max="365"
                    placeholder="Nhập số ngày (1-365)"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    User sẽ tự động được unban sau {banDays} ngày
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowBanModal(false);
                  setSelectedUser(null);
                  setBanReason('');
                  setBanType('PERMANENT');
                  setBanDays(30);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={handleBanUser}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
              >
                Xác nhận ban
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
