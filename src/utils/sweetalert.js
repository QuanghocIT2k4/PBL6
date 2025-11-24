import Swal from 'sweetalert2';

/**
 * ================================================
 * SWEETALERT2 HELPERS - Modern Alerts & Confirms
 * ================================================
 * Thay thế cho window.confirm() và window.alert()
 * với giao diện đẹp, hiện đại
 */

/**
 * Confirm Dialog - Hiện đại hơn window.confirm()
 * @param {Object} options - Config options
 * @param {string} options.title - Tiêu đề
 * @param {string} options.text - Nội dung chi tiết
 * @param {string} options.icon - 'warning', 'error', 'success', 'info', 'question'
 * @param {string} options.confirmButtonText - Text nút xác nhận
 * @param {string} options.cancelButtonText - Text nút hủy
 * @returns {Promise<boolean>} true nếu user click confirm, false nếu cancel
 */
export const confirmDialog = async ({
  title = 'Bạn có chắc chắn?',
  text = '',
  icon = 'warning',
  confirmButtonText = 'Xác nhận',
  cancelButtonText = 'Hủy',
  confirmButtonColor = '#3085d6',
  cancelButtonColor = '#d33',
}) => {
  const result = await Swal.fire({
    title,
    text,
    icon,
    showCancelButton: true,
    confirmButtonColor,
    cancelButtonColor,
    confirmButtonText,
    cancelButtonText,
    reverseButtons: true, // Đặt nút Cancel bên trái
    customClass: {
      confirmButton: 'swal-confirm-btn',
      cancelButton: 'swal-cancel-btn',
    },
  });

  return result.isConfirmed;
};

/**
 * Success Alert
 * @param {string} title - Tiêu đề
 * @param {string} text - Nội dung
 */
export const successAlert = async (title = 'Thành công!', text = '') => {
  return Swal.fire({
    title,
    text,
    icon: 'success',
    confirmButtonText: 'OK',
    confirmButtonColor: '#10b981',
    timer: 2000,
    timerProgressBar: true,
  });
};

/**
 * Error Alert
 * @param {string} title - Tiêu đề
 * @param {string} text - Nội dung
 */
export const errorAlert = async (title = 'Lỗi!', text = '') => {
  return Swal.fire({
    title,
    text,
    icon: 'error',
    confirmButtonText: 'OK',
    confirmButtonColor: '#ef4444',
  });
};

/**
 * Info Alert
 * @param {string} title - Tiêu đề
 * @param {string} text - Nội dung
 */
export const infoAlert = async (title = 'Thông báo', text = '') => {
  return Swal.fire({
    title,
    text,
    icon: 'info',
    confirmButtonText: 'OK',
    confirmButtonColor: '#3b82f6',
  });
};

/**
 * Toast Notification - Nhẹ nhàng, không block UI
 * @param {Object} options
 * @param {string} options.icon - 'success', 'error', 'warning', 'info'
 * @param {string} options.title - Nội dung toast
 * @param {number} options.timer - Thời gian hiển thị (ms)
 */
export const showToast = ({ icon = 'success', title, timer = 3000 }) => {
  const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.addEventListener('mouseenter', Swal.stopTimer);
      toast.addEventListener('mouseleave', Swal.resumeTimer);
    },
  });

  return Toast.fire({
    icon,
    title,
  });
};

/**
 * Loading Alert - Hiển thị khi đang xử lý
 * @param {string} title - Tiêu đề
 * @param {string} text - Nội dung
 */
export const showLoading = (title = 'Đang xử lý...', text = 'Vui lòng chờ') => {
  Swal.fire({
    title,
    text,
    allowOutsideClick: false,
    allowEscapeKey: false,
    showConfirmButton: false,
    didOpen: () => {
      Swal.showLoading();
    },
  });
};

/**
 * Close Loading
 */
export const closeLoading = () => {
  Swal.close();
};

/**
 * ================================================
 * SHORTHAND FUNCTIONS - Dễ dùng hơn
 * ================================================
 */

/**
 * Confirm Delete - Xác nhận xóa
 * @param {string} itemName - Tên item cần xóa (VD: "sản phẩm này", "đơn hàng #123")
 */
export const confirmDelete = async (itemName = 'mục này') => {
  return confirmDialog({
    title: 'Xác nhận xóa',
    text: `Bạn có chắc chắn muốn xóa ${itemName}?`,
    icon: 'warning',
    confirmButtonText: 'Xóa',
    cancelButtonText: 'Hủy',
    confirmButtonColor: '#ef4444',
  });
};

/**
 * Confirm Cancel Order - Xác nhận hủy đơn hàng
 * @param {string} orderNumber - Số đơn hàng
 */
export const confirmCancelOrder = async (orderNumber) => {
  return confirmDialog({
    title: 'Xác nhận hủy đơn',
    text: `Bạn có chắc chắn muốn hủy đơn hàng ${orderNumber}?`,
    icon: 'warning',
    confirmButtonText: 'Hủy đơn',
    cancelButtonText: 'Quay lại',
    confirmButtonColor: '#ef4444',
  });
};

/**
 * Confirm Action - Xác nhận hành động chung
 * @param {string} actionName - Tên hành động (VD: "xác nhận đơn hàng", "duyệt sản phẩm")
 */
export const confirmAction = async (actionName) => {
  return confirmDialog({
    title: 'Xác nhận',
    text: `Bạn có chắc chắn muốn ${actionName}?`,
    icon: 'question',
    confirmButtonText: 'Xác nhận',
    cancelButtonText: 'Hủy',
  });
};

/**
 * Toast helper object - Shorthand for common toasts
 */
export const toast = {
  success: (message) => showToast({ icon: 'success', title: message }),
  error: (message) => showToast({ icon: 'error', title: message }),
  warning: (message) => showToast({ icon: 'warning', title: message }),
  info: (message) => showToast({ icon: 'info', title: message }),
};

export default {
  confirmDialog,
  successAlert,
  errorAlert,
  infoAlert,
  showToast,
  showLoading,
  closeLoading,
  confirmDelete,
  confirmCancelOrder,
  confirmAction,
  toast,
};
