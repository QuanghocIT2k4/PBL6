import React, { useState } from 'react';
import useSWR from 'swr';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import { getAllUsers, banUser, unbanUser } from '../../services/admin/adminUserService';
import { useToast } from '../../context/ToastContext';

const AdminUsers = () => {
  const { showToast } = useToast();
  const [currentPage, setCurrentPage] = useState(0);
  const [roleFilter, setRoleFilter] = useState(null);
  const [statusFilter, setStatusFilter] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [banReason, setBanReason] = useState('');
  const [banDuration, setBanDuration] = useState('PERMANENT');
  const [showBanModal, setShowBanModal] = useState(false);
  const pageSize = 50; // Tăng lên 50 users mỗi trang

  // Fetch users
  const { data: usersData, error, isLoading, mutate } = useSWR(
    ['admin-users', currentPage, roleFilter, statusFilter],
    () => getAllUsers({
      page: currentPage,
      size: pageSize,
      role: roleFilter,
      status: statusFilter,
    }),
    { revalidateOnFocus: false }
  );

  const users = usersData?.success ? (usersData.data?.content || usersData.data || []) : [];
  const totalPages = usersData?.data?.totalPages || 0;
  const totalElements = usersData?.data?.totalElements || 0;

  // Debug: Log để xem structure của user object
  React.useEffect(() => {
    if (users.length > 0) {
      console.log('📊 Total users loaded:', users.length);
      console.log('Sample user object:', users[0]);
      console.log('User roles field:', users[0].roles);
      
      // 🔍 Tìm user quang3072004@gmail.com
      const quangUser = users.find(u => u.email === 'quang3072004@gmail.com');
      if (quangUser) {
        console.log('🔍 FOUND quang3072004@gmail.com:');
        console.log('  - Roles:', quangUser.roles);
        console.log('  - Full data:', JSON.stringify(quangUser, null, 2));
      }
    }
  }, [users]);

  // Filter by search and role (client-side backup)
  const filteredUsers = users.filter(user => {
    // Filter by role (client-side backup nếu backend không filter)
    if (roleFilter) {
      const userRoles = user.roles || (user.role ? [user.role] : []);
      if (!userRoles.includes(roleFilter)) {
        return false;
      }
    }
    
    // Filter by search
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      user.username?.toLowerCase().includes(search) ||
      user.email?.toLowerCase().includes(search) ||
      user.fullName?.toLowerCase().includes(search)
    );
  });

  // Handle ban user
  const handleBanUser = async () => {
    if (!selectedUser || !banReason.trim()) {
      showToast('Vui lòng nhập lý do ban', 'error');
      return;
    }

    const result = await banUser({
      userId: selectedUser.id,
      reason: banReason,
      duration: banDuration,
    });

    if (result.success) {
      showToast('Ban người dùng thành công', 'success');
      setShowBanModal(false);
      setSelectedUser(null);
      setBanReason('');
      mutate();
    } else {
      showToast(result.error, 'error');
    }
  };

  // Handle unban user
  const handleUnbanUser = async (userId) => {
    const result = await unbanUser(userId);

    if (result.success) {
      showToast('Gỡ ban người dùng thành công', 'success');
      mutate();
    } else {
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

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex flex-wrap gap-4 mb-4">
            {/* Role Filter */}
            <div className="flex gap-2">
              <button
                onClick={() => { setRoleFilter(null); setCurrentPage(0); }}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  roleFilter === null ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Tất cả
              </button>
              <button
                onClick={() => { setRoleFilter('USER'); setCurrentPage(0); }}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  roleFilter === 'USER' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                👤 User
              </button>
              <button
                onClick={() => { setRoleFilter('ADMIN'); setCurrentPage(0); }}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  roleFilter === 'ADMIN' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                👑 Admin
              </button>
            </div>
          </div>

          {/* Search */}
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm theo username, email, tên..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
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
                    {filteredUsers.map((user) => (
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
                                // ✅ Ưu tiên hiển thị: ADMIN > USER
                                const priorityOrder = ['ADMIN', 'USER'];
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
                                      'bg-blue-100 text-blue-800'
                                    }`}
                                  >
                                    {primaryRole === 'ADMIN' ? '👑 Admin' : '👤 User'}
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
                          {user.isBanned ? (
                            <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-bold">
                              ❌ Đã ban
                            </span>
                          ) : (
                            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold">
                              ✅ Hoạt động
                            </span>
                          )}
                        </td>
                        {/* <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(user.createdAt)}
                        </td> */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {!user.roles?.includes('ADMIN') && (
                            user.isBanned ? (
                              <button
                                onClick={() => handleUnbanUser(user.id)}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                              >
                                Gỡ ban
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  setSelectedUser(user);
                                  setShowBanModal(true);
                                }}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                              >
                                Ban
                              </button>
                            )
                          )}
                        </td>
                      </tr>
                    ))}
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Thời hạn</label>
                <select
                  value={banDuration}
                  onChange={(e) => setBanDuration(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                >
                  <option value="TEMPORARY">Tạm thời (7 ngày)</option>
                  <option value="PERMANENT">Vĩnh viễn</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowBanModal(false);
                  setSelectedUser(null);
                  setBanReason('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={handleBanUser}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
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
