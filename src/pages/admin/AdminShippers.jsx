import React, { useState, useMemo } from 'react';
import useSWR from 'swr';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import { 
  getAllShippers, 
  activateShipper, 
  resetShipperPassword,
  getShipperStatistics,
  createShipper 
} from '../../services/admin/adminShipperService';
import { useToast } from '../../context/ToastContext';

const AdminShippers = () => {
  const { showToast } = useToast();
  const [currentPage, setCurrentPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedShipper, setSelectedShipper] = useState(null);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    email: '',
    password: '',
    retypePassword: '',
    fullName: '',
    phone: '',
    dateOfBirth: '',
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [creating, setCreating] = useState(false);
  const pageSize = 20;

  // Fetch shippers
  const { data: shippersData, error, isLoading, mutate } = useSWR(
    ['admin-shippers', currentPage, searchTerm, statusFilter],
    () => getAllShippers({
      page: currentPage,
      size: pageSize,
      name: searchTerm || null,
      email: searchTerm || null,
      phone: searchTerm || null,
      status: statusFilter || null,
    }),
    { revalidateOnFocus: false }
  );

  // Fetch statistics
  const { data: statsData } = useSWR('admin-shipper-stats', getShipperStatistics);

  let shippers = shippersData?.success ? (shippersData.data?.content || shippersData.data || []) : [];
  const totalPages = shippersData?.data?.totalPages || 0;
  const totalElements = shippersData?.data?.totalElements || 0;
  const rawStats = statsData?.success ? statsData.data : null;

  // ✅ Chuẩn hoá & fallback thống kê shipper nếu BE chưa trả đúng key
  const stats = useMemo(() => {
    const getVal = (obj, keys) => {
      for (const key of keys) {
        if (obj && obj[key] !== undefined && obj[key] !== null) {
          const num = Number(obj[key]);
          if (!Number.isNaN(num)) return num;
        }
      }
      return 0;
    };

    // Đếm lại từ danh sách hiện tại (đảm bảo đúng với bảng)
    const derivedTotal = totalElements || shippers.length;
    const derivedActive = shippers.filter((s) => {
      const status = typeof s.status === 'string' ? s.status.toUpperCase() : s.status;
      return s.active === true || status === 'ACTIVE';
    }).length;
    const derivedBanned = shippers.filter((s) => {
      const status = typeof s.status === 'string' ? s.status.toUpperCase() : s.status;
      return s.active === false || status === 'BANNED';
    }).length;

    // Lấy thêm thông tin khác từ API nếu có (ví dụ tổng đơn giao hàng)
    const apiTotal = rawStats ? getVal(rawStats, ['totalShippers', 'total', 'totalCount']) : 0;
    const apiTotalShipments = rawStats ? getVal(rawStats, ['totalShipments', 'shipments', 'totalDeliveries']) : 0;

    return {
      // Tổng shipper: ưu tiên API nếu có, ngược lại dùng derived
      totalShippers: apiTotal || derivedTotal,
      // Số shipper hoạt động / bị ban: luôn lấy theo dữ liệu bảng để khớp với filter & badge
      activeShippers: derivedActive,
      bannedShippers: derivedBanned,
      totalShipments: apiTotalShipments,
    };
  }, [rawStats, shippers, totalElements]);

  // Handle activate shipper
  const handleActivateShipper = async (shipperId) => {
    const result = await activateShipper(shipperId);
    if (result.success) {
      showToast('Kích hoạt tài khoản shipper thành công!', 'success');
      mutate();
    } else {
      showToast(result.error, 'error');
    }
  };

  // Handle reset password
  const handleResetPassword = async () => {
    if (!selectedShipper) return;
    
    const result = await resetShipperPassword(selectedShipper.id);
    if (result.success) {
      showToast('Reset mật khẩu thành công! Mật khẩu mới đã được gửi.', 'success');
      setShowResetPasswordModal(false);
      setSelectedShipper(null);
    } else {
      showToast(result.error, 'error');
    }
  };

  // Handle create shipper
  const handleCreateShipper = async () => {
    // Validation
    if (!createForm.email || !createForm.password || !createForm.fullName || !createForm.dateOfBirth) {
      showToast('Vui lòng điền đầy đủ thông tin bắt buộc', 'error');
      return;
    }

    if (createForm.password !== createForm.retypePassword) {
      showToast('Mật khẩu xác nhận không khớp', 'error');
      return;
    }

    setCreating(true);
    try {
      const shipperData = {
        email: createForm.email,
        password: createForm.password,
        fullName: createForm.fullName,
        dateOfBirth: createForm.dateOfBirth,
        ...(createForm.phone && { phone: createForm.phone }),
      };

      const result = await createShipper(shipperData, avatarFile);
      if (result.success) {
        showToast('Tạo tài khoản shipper thành công!', 'success');
        setShowCreateModal(false);
        setCreateForm({
          email: '',
          password: '',
          retypePassword: '',
          fullName: '',
          phone: '',
          dateOfBirth: '',
        });
        setAvatarFile(null);
        mutate(); // Refresh list
      } else {
        showToast(result.error, 'error');
      }
    } catch (error) {
      showToast('Có lỗi xảy ra khi tạo shipper', 'error');
    } finally {
      setCreating(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
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
        icon="🚚"
        title="Quản lý Shipper"
        subtitle="Quản lý tất cả tài khoản shipper trong hệ thống"
        action={
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-xl hover:from-teal-700 hover:to-emerald-700 font-bold transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
          >
            <span className="text-xl">➕</span>
            Tạo Shipper Mới
          </button>
        }
      />

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div className="text-2xl font-bold text-blue-600">{stats.totalShippers || 0}</div>
            <div className="text-sm text-gray-600">Tổng số Shipper</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div className="text-2xl font-bold text-green-600">{stats.activeShippers || 0}</div>
            <div className="text-sm text-gray-600">Shipper hoạt động</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div className="text-2xl font-bold text-red-600">{stats.bannedShippers || 0}</div>
            <div className="text-sm text-gray-600">Shipper bị ban</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div className="text-2xl font-bold text-purple-600">{stats.totalShipments || 0}</div>
            <div className="text-sm text-gray-600">Tổng đơn giao hàng</div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl p-6 shadow-sm">
        {/* Search and Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="🔍 Tìm kiếm theo tên, email, số điện thoại..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div className="w-full md:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="active">Hoạt động</option>
                <option value="banned">Bị ban</option>
              </select>
            </div>
            <div className="text-sm text-gray-600 flex items-center">
              Tổng: <span className="font-bold text-purple-600 ml-1">{totalElements}</span> shippers
            </div>
          </div>
        </div>

        {/* Shippers Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-600">
              <p>Không thể tải danh sách shipper</p>
            </div>
          ) : shippers.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>Không tìm thấy shipper nào</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Shipper</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Số điện thoại</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {shippers.map((shipper) => (
                      <tr key={shipper.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                              {shipper.avatar ? (
                                <img src={shipper.avatar} alt={shipper.name} className="w-full h-full rounded-full object-cover" />
                              ) : (
                                <span className="text-lg">🚚</span>
                              )}
                            </div>
                            <span className="font-medium text-gray-900">{shipper.name || shipper.fullName || 'N/A'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{shipper.email || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{shipper.phone || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {shipper.active === false || shipper.status === 'banned' ? (
                            <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-bold">
                              ❌ Bị ban
                            </span>
                          ) : shipper.active === true || shipper.status === 'active' ? (
                            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold">
                              ✅ Hoạt động
                            </span>
                          ) : (
                            <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-bold">
                              ⚠️ Chờ kích hoạt
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex gap-2">
                            {shipper.active === false || shipper.status === 'banned' ? (
                              <button
                                onClick={() => handleActivateShipper(shipper.id)}
                                className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 text-xs font-medium"
                              >
                                Kích hoạt
                              </button>
                            ) : null}
                            <button
                              onClick={() => {
                                setSelectedShipper(shipper);
                                setShowResetPasswordModal(true);
                              }}
                              className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs font-medium"
                            >
                              Reset mật khẩu
                            </button>
                          </div>
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

      {/* Reset Password Modal */}
      {showResetPasswordModal && selectedShipper && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold mb-4">Reset mật khẩu</h3>
            <p className="text-gray-600 mb-4">
              Bạn có chắc chắn muốn reset mật khẩu cho shipper <strong>{selectedShipper.name || selectedShipper.email}</strong>?
              Mật khẩu mới sẽ được tạo tự động và gửi đến email của shipper.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowResetPasswordModal(false);
                  setSelectedShipper(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={handleResetPassword}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Shipper Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 my-8">
            <h3 className="text-xl font-bold mb-6">Tạo tài khoản Shipper mới</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="shipper@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Họ và tên <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={createForm.fullName}
                  onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Nguyễn Văn A"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Số điện thoại
                </label>
                <input
                  type="tel"
                  value={createForm.phone}
                  onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="0912345678"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ngày sinh <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={createForm.dateOfBirth}
                  onChange={(e) => setCreateForm({ ...createForm, dateOfBirth: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mật khẩu <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Mật khẩu"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Xác nhận mật khẩu <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={createForm.retypePassword}
                  onChange={(e) => setCreateForm({ ...createForm, retypePassword: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Nhập lại mật khẩu"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Avatar (Tùy chọn)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setAvatarFile(e.target.files[0])}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setCreateForm({
                    email: '',
                    password: '',
                    retypePassword: '',
                    fullName: '',
                    phone: '',
                    dateOfBirth: '',
                  });
                  setAvatarFile(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={creating}
              >
                Hủy
              </button>
              <button
                onClick={handleCreateShipper}
                disabled={creating}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {creating ? 'Đang tạo...' : 'Tạo Shipper'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminShippers;

