import { useEffect, useState, useRef } from 'react';
import * as buyerCommentService from '../../services/buyer/commentService';
import * as storeCommentService from '../../services/b2c/commentService';
import { getStoreById } from '../../services/common/storeService';
import { useAuth } from '../../context/AuthContext';
import { useStoreContext } from '../../context/StoreContext';
import { confirmDelete, errorAlert } from '../../utils/sweetalert';

/**
 * Format time ago in Vietnamese
 * @param {string|Date} dateString - Date string or Date object
 * @returns {string} Formatted time ago string
 */
const formatTimeAgo = (dateString) => {
  if (!dateString) return '';
  
  const now = new Date();
  const past = new Date(dateString);
  const diffMs = now - past;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffWeek = Math.floor(diffDay / 7);
  const diffMonth = Math.floor(diffDay / 30);
  const diffYear = Math.floor(diffDay / 365);

  if (diffSec < 60) return 'Vừa xong';
  if (diffMin < 60) return `${diffMin} phút trước`;
  if (diffHour < 24) return `${diffHour} giờ trước`;
  if (diffDay < 7) return `${diffDay} ngày trước`;
  if (diffWeek < 4) return `${diffWeek} tuần trước`;
  if (diffMonth < 12) return `${diffMonth} tháng trước`;
  return `${diffYear} năm trước`;
};

const ProductComments = ({ productVariantId, productId, isStoreView = false }) => {
  // ✅ Sử dụng productVariantId (theo API) hoặc fallback về productId
  const variantId = productVariantId || productId;
  
  const [comments, setComments] = useState([]);
  const [replies, setReplies] = useState({}); // { commentId: [reply1, reply2, ...] }
  const [storeInfo, setStoreInfo] = useState({}); // { storeId: { name, logo, ... } }
  const [content, setContent] = useState('');
  const [selectedImages, setSelectedImages] = useState([]);
  const [replyImages, setReplyImages] = useState({}); // parentId -> images[]
  const { user, isAuthenticated } = useAuth();
  const { currentStore } = useStoreContext();
  
  // ✅ Xác định xem có phải store owner không
  const isStoreOwner = isStoreView && currentStore?.id;
  const storeId = currentStore?.id;
  const [replyTo, setReplyTo] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [editingId, setEditingId] = useState(null); // Comment ID đang được edit
  const [editContent, setEditContent] = useState(''); // Nội dung đang edit
  const [editImages, setEditImages] = useState([]); // Images đang edit
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [totalComments, setTotalComments] = useState(0);
  const [avatarErrors, setAvatarErrors] = useState(new Set()); // Track failed avatars
  const imageInputRef = useRef(null);
  const replyImageInputRefs = useRef({});
  // ✅ Expand/collapse replies - phải khai báo trước khi dùng trong useEffect
  const [expanded, setExpanded] = useState({}); // id -> boolean

  // ✅ Fetch store info
  const fetchStoreInfo = async (storeId) => {
    if (!storeId || storeInfo[storeId]) return; // Đã có rồi thì không fetch lại
    
    try {
      const res = await getStoreById(storeId);
      if (res.success) {
        const store = res.data;
        setStoreInfo(prev => ({
          ...prev,
          [storeId]: {
            name: store.name || store.storeName,
            logo: store.logo || store.logoUrl,
            id: store.id || store._id,
          },
        }));
      }
    } catch (error) {
      console.error('Error fetching store info:', error);
    }
  };

  // ✅ Fetch replies cho một comment cụ thể
  const loadReplies = async (commentId) => {
    if (!commentId) return;
    
    // ✅ Normalize commentId (có thể là string, object, hoặc DBRef)
    const normalizedId = typeof commentId === 'string' 
      ? commentId 
      : (commentId?.id || commentId?._id || commentId?.$id || commentId);
    
    if (!normalizedId) {
      console.warn('Invalid commentId for loadReplies:', commentId);
      return;
    }
    
    try {
      const res = await buyerCommentService.getRepliesByComment(normalizedId);
      if (res.success) {
        const repliesList = res.data || [];
        setReplies(prev => ({
          ...prev,
          [normalizedId]: repliesList,
        }));
        
        // ✅ Fetch store info cho các reply có commentType === "STORE"
        repliesList.forEach(reply => {
          if (reply.commentType === 'STORE' || reply.store) {
            const storeId = typeof reply.store === 'string' 
              ? reply.store 
              : (reply.store?.id || reply.store?._id || reply.store?.$id);
            if (storeId && !storeInfo[storeId]) {
              fetchStoreInfo(storeId);
            }
          }
        });
      }
    } catch (error) {
      console.error('Error loading replies:', error);
    }
  };

  // ✅ Fetch replies cho tất cả comments
  const loadAllReplies = async (commentsList) => {
    const repliesPromises = commentsList.map(comment => {
      const commentId = comment.id || comment._id;
      if (commentId) {
        return loadReplies(commentId);
      }
      return Promise.resolve();
    });
    await Promise.all(repliesPromises);
  };

  const load = async (pageNum = 0) => {
    if (!variantId) return;
    
    setLoading(true);
    try {
      // ✅ Store owner và buyer đều dùng API chung để xem comments
      const res = await buyerCommentService.getCommentsByProductVariant(variantId, {
        page: pageNum,
        size: 10,
        sortBy: 'createdAt',
        sortDir: 'desc',
      });
      
      if (res.success) {
        const data = res.data;
        const commentsList = data.content || data.data || data || [];
        const total = data.totalElements || commentsList.length;
        
        if (pageNum === 0) {
          setComments(commentsList);
          // ✅ Fetch replies cho tất cả comments sau khi load xong
          await loadAllReplies(commentsList);
        } else {
          setComments(prev => [...prev, ...commentsList]);
          // ✅ Fetch replies cho comments mới
          await loadAllReplies(commentsList);
        }
        
        setTotalComments(total);
        setHasMore(commentsList.length === 10 && (pageNum + 1) * 10 < total);
        setPage(pageNum);
      } else {
        await errorAlert('Lỗi', res.error || 'Không thể tải bình luận');
      }
    } catch (error) {
      console.error('Error loading comments:', error);
      await errorAlert('Lỗi', 'Không thể tải bình luận');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    if (variantId) {
      load(0);
    }
  }, [variantId]);

  const handleAdd = async () => {
    if (!isAuthenticated) {
      await errorAlert('Thông báo', 'Vui lòng đăng nhập để bình luận');
      return;
    }
    if (!content.trim()) {
      await errorAlert('Thông báo', 'Nội dung bình luận không được để trống');
      return;
    }
    if (!variantId) {
      await errorAlert('Lỗi', 'Thiếu thông tin sản phẩm');
      return;
    }
    
    // ✅ Store owner không thể tạo comment mới, chỉ có thể reply
    if (isStoreOwner) {
      await errorAlert('Thông báo', 'Người bán chỉ có thể trả lời bình luận, không thể tạo bình luận mới');
      return;
    }
    
    setSubmitting(true);
    try {
      const res = await buyerCommentService.createComment({
        productVariantId: variantId,
        content: content.trim(),
        images: selectedImages, // ✅ Thêm images
      });
      
      if (res.success) {
        setContent('');
        setSelectedImages([]); // ✅ Clear images
        await load(0); // Reload from first page
      } else {
        await errorAlert('Lỗi', res.error || 'Không thể thêm bình luận');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      await errorAlert('Lỗi', 'Không thể thêm bình luận');
    } finally {
      setSubmitting(false);
    }
  };

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files).filter(file => file.type.startsWith('image/'));
    setSelectedImages(prev => [...prev, ...files].slice(0, 5)); // Max 5 images
    e.target.value = '';
  };

  const handleReplyImageSelect = (parentId, e) => {
    const files = Array.from(e.target.files).filter(file => file.type.startsWith('image/'));
    setReplyImages(prev => ({
      ...prev,
      [parentId]: [...(prev[parentId] || []), ...files].slice(0, 5) // Max 5 images
    }));
    e.target.value = '';
  };

  const removeImage = (index) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeReplyImage = (parentId, index) => {
    setReplyImages(prev => ({
      ...prev,
      [parentId]: (prev[parentId] || []).filter((_, i) => i !== index)
    }));
  };

  const handleReply = async (parentId) => {
    if (!isAuthenticated) {
      await errorAlert('Thông báo', 'Vui lòng đăng nhập để trả lời');
      return;
    }
    if (!replyContent.trim()) {
      await errorAlert('Thông báo', 'Nội dung phản hồi không được để trống');
      return;
    }
    if (!variantId) {
      await errorAlert('Lỗi', 'Thiếu thông tin sản phẩm');
      return;
    }
    
    setSubmitting(true);
    try {
      let res;
      
      // ✅ Normalize parentId trước khi gọi API
      const normalizedParentId = typeof parentId === 'string' 
        ? parentId 
        : (parentId?.id || parentId?._id || parentId?.$id || parentId);
      
      if (!normalizedParentId) {
        await errorAlert('Lỗi', 'Không tìm thấy comment cha');
        setSubmitting(false);
        return;
      }
      
      // ✅ Lấy images cho reply này
      const replyImagesList = replyImages[parentId] || [];
      
      // ✅ Store owner dùng API B2C, buyer dùng API buyer
      if (isStoreOwner && storeId) {
        res = await storeCommentService.createStoreComment(storeId, {
          productVariantId: variantId,
          content: replyContent.trim(),
          parentCommentId: normalizedParentId, // ✅ Dùng normalized ID
          images: replyImagesList, // ✅ Thêm images
        });
      } else {
        res = await buyerCommentService.createComment({
          productVariantId: variantId,
          content: replyContent.trim(),
          parentCommentId: normalizedParentId, // ✅ Dùng normalized ID
          images: replyImagesList, // ✅ Thêm images
        });
      }
      
      if (res.success) {
        setReplyTo(null);
        setReplyContent('');
        // ✅ Clear images cho reply này
        setReplyImages(prev => {
          const newState = { ...prev };
          delete newState[parentId];
          return newState;
        });
        // ✅ Normalize parentId trước khi dùng
        const normalizedParentId = typeof parentId === 'string' 
          ? parentId 
          : (parentId?.id || parentId?._id || parentId?.$id || parentId);
        
        // ✅ Tự động expand parent comment TRƯỚC khi reload để đảm bảo hiển thị
        if (normalizedParentId) {
          setExpanded(prev => ({ ...prev, [normalizedParentId]: true }));
          // ✅ Fetch lại replies cho parent comment này (không cần reload toàn bộ)
          await loadReplies(normalizedParentId);
        }
      } else {
        await errorAlert('Lỗi', res.error || 'Không thể thêm phản hồi');
      }
    } catch (error) {
      console.error('Error replying to comment:', error);
      await errorAlert('Lỗi', 'Không thể thêm phản hồi');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (comment) => {
    // ✅ Bắt đầu edit mode
    const commentId = comment.id || comment._id;
    setEditingId(commentId);
    setEditContent(comment.content || '');
    setEditImages([]); // Reset images (có thể thêm logic để hiển thị images hiện tại nếu cần)
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditContent('');
    setEditImages([]);
  };

  const handleUpdate = async (commentId, parentId = null) => {
    if (!isAuthenticated) {
      await errorAlert('Thông báo', 'Vui lòng đăng nhập');
      return;
    }
    if (!editContent.trim()) {
      await errorAlert('Thông báo', 'Nội dung bình luận không được để trống');
      return;
    }
    
    setSubmitting(true);
    try {
      let res;
      
      // ✅ Store owner dùng API B2C, buyer dùng API buyer
      if (isStoreOwner && storeId) {
        res = await storeCommentService.updateStoreComment(storeId, commentId, {
          content: editContent.trim(),
          images: editImages,
        });
      } else {
        res = await buyerCommentService.updateComment(commentId, {
          content: editContent.trim(),
          images: editImages,
        });
      }
      
      if (res.success) {
        setEditingId(null);
        setEditContent('');
        setEditImages([]);
        // ✅ Reload để cập nhật UI
        if (parentId) {
          // Nếu là reply, reload replies của parent comment
          await loadReplies(parentId);
        } else {
          // Nếu là top-level comment, reload toàn bộ
          await load(0);
        }
      } else {
        await errorAlert('Lỗi', res.error || 'Không thể cập nhật bình luận');
      }
    } catch (error) {
      console.error('Error updating comment:', error);
      await errorAlert('Lỗi', 'Không thể cập nhật bình luận');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId) => {
    if (!isAuthenticated) return;
    
    const confirmed = await confirmDelete('bình luận này');
    if (!confirmed) return;
    
    try {
      let res;
      
      // ✅ Store owner dùng API B2C, buyer dùng API buyer
      if (isStoreOwner && storeId) {
        res = await storeCommentService.deleteStoreComment(storeId, commentId);
      } else {
        res = await buyerCommentService.deleteComment(commentId);
      }
      
      if (res.success) {
        await load(0); // Reload from first page
      } else {
        await errorAlert('Lỗi', res.error || 'Không thể xóa bình luận');
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      await errorAlert('Lỗi', 'Không thể xóa bình luận');
    }
  };

  // ✅ Parse comments structure từ API
  // API có thể trả về nested structure hoặc flat structure
  const roots = comments.filter(c => !c.parentCommentId && !c.parentId);
  // ✅ Lấy replies từ state riêng (đã fetch riêng)
  const childrenOf = (id) => {
    // ✅ Normalize commentId (có thể là string, object, hoặc DBRef)
    const commentId = typeof id === 'string' 
      ? id 
      : (id?.id || id?._id || id?.$id || id);
    return commentId ? (replies[commentId] || []) : [];
  };
  
  // ✅ Auto-fetch replies khi expand nếu chưa có
  useEffect(() => {
    const rootIds = roots.map(c => c.id || c._id).filter(Boolean);
    rootIds.forEach(commentId => {
      if (expanded[commentId] && (!replies[commentId] || replies[commentId].length === 0)) {
        loadReplies(commentId);
      }
    });
    // ✅ Chỉ phụ thuộc vào expanded và replies, không phụ thuộc vào roots (để tránh vòng lặp)
  }, [expanded, replies]);

  // ✅ Toggle expand/collapse
  const toggle = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Bình luận</h2>

      {/* New comment */}
      {/* Input - Chỉ hiển thị cho buyer, store owner không thể tạo comment mới */}
      {!isStoreOwner && (
        <div className="mb-6">
          {isAuthenticated ? (
            <>
              <textarea
                value={content}
                onChange={(e)=>setContent(e.target.value)}
                placeholder="Viết bình luận của bạn..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              
              {/* Upload images button */}
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="file"
                  ref={imageInputRef}
                  onChange={handleImageSelect}
                  multiple
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded hover:bg-gray-50 flex items-center gap-1"
                  disabled={selectedImages.length >= 5}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Thêm ảnh ({selectedImages.length}/5)
                </button>
              </div>

              {/* Preview selected images */}
              {selectedImages.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedImages.map((file, index) => (
                    <div key={index} className="relative">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Preview ${index + 1}`}
                        className="w-20 h-20 object-cover rounded border"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end mt-2">
                <button 
                  onClick={handleAdd} 
                  disabled={submitting || (!content.trim() && selectedImages.length === 0)} 
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  Gửi bình luận
                </button>
              </div>
            </>
          ) : (
            <div className="text-gray-600 text-sm bg-gray-50 border border-gray-200 rounded p-3">
              Vui lòng đăng nhập để bình luận.
            </div>
          )}
        </div>
      )}
      
      {/* Thông báo cho store owner */}
      {isStoreOwner && (
        <div className="mb-6 text-gray-600 text-sm bg-blue-50 border border-blue-200 rounded p-3">
          💬 Bạn có thể trả lời các bình luận của khách hàng bằng cách nhấn nút "Trả lời" bên dưới mỗi bình luận.
        </div>
      )}

      {/* List */}
      {loading && page === 0 ? (
        <div className="text-gray-500">Đang tải bình luận...</div>
      ) : roots.length === 0 && !loading ? (
        <div className="text-gray-500">Chưa có bình luận nào</div>
      ) : (
        <div className="space-y-6">
          {roots.map(c => (
            <div key={c.id} className="">
              <div className="flex items-start space-x-3">
                <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {c.user?.avatar && !avatarErrors.has(c.id) ? (
                    <img
                      src={c.user.avatar}
                      alt={c.user?.name || c.user?.fullName || 'User'}
                      className="w-full h-full object-cover"
                      onError={() => {
                        setAvatarErrors(prev => new Set(prev).add(c.id));
                      }}
                    />
                  ) : (
                    <span className="text-white font-semibold text-sm">
                      {(c.user?.name || c.user?.fullName || c.userName || 'U')[0].toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">
                        {c.user?.name || c.user?.fullName || c.userName || 'Người dùng'}
                      </span>
                      {c.createdAt && (
                        <span className="text-xs text-gray-500">
                          {formatTimeAgo(c.createdAt)}
                        </span>
                      )}
                    </div>
                    {isAuthenticated && (
                      (c.user?.id === user?.id || String(c.user?.id) === String(user?.id)) && (
                        <div className="flex items-center gap-2">
                          {editingId === c.id ? null : (
                            <>
                              <button onClick={()=>handleEdit(c)} className="text-xs text-blue-600 hover:underline">Chỉnh sửa</button>
                              <button onClick={()=>handleDelete(c.id)} className="text-xs text-red-600 hover:underline">Xóa</button>
                            </>
                          )}
                        </div>
                      )
                    )}
                  </div>
                  {editingId === c.id ? (
                    <div className="mt-2">
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <div className="flex items-center justify-end gap-2 mt-2">
                        <button
                          onClick={handleCancelEdit}
                          className="px-3 py-1.5 text-sm border rounded hover:bg-gray-50"
                          disabled={submitting}
                        >
                          Hủy
                        </button>
                        <button
                          onClick={() => handleUpdate(c.id, null)}
                          disabled={submitting || !editContent.trim()}
                          className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                        >
                          Lưu
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-gray-700 mt-1 whitespace-pre-wrap">{c.content}</div>
                  )}
                  {/* Display images if available */}
                  {c.images && c.images.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {c.images.map((img, idx) => (
                        <img 
                          key={idx} 
                          src={typeof img === 'string' ? img : URL.createObjectURL(img)} 
                          alt={`Bình luận ${idx + 1}`}
                          className="w-20 h-20 object-cover rounded border"
                        />
                      ))}
                    </div>
                  )}
                  <div className="mt-2">
                    {isAuthenticated ? (
                      <button className="text-sm text-blue-600 hover:underline" onClick={()=> setReplyTo(replyTo===c.id ? null : c.id)}>Trả lời</button>
                    ) : (
                      <span className="text-sm text-gray-500">Đăng nhập để trả lời</span>
                    )}
                  </div>

                  {/* replies */}
                  <div className="mt-3 space-y-4">
                    {childrenOf(c.id).slice(0, expanded[c.id] ? undefined : 1).map(r => {
                      // ✅ Kiểm tra xem có phải store reply không
                      const isStoreReply = r.commentType === 'STORE' || r.store;
                      const replyStoreId = isStoreReply 
                        ? (typeof r.store === 'string' ? r.store : (r.store?.id || r.store?._id || r.store?.$id))
                        : null;
                      const store = replyStoreId ? storeInfo[replyStoreId] : null;
                      
                      // ✅ Nếu là store reply và chưa có store info, fetch ngay
                      if (isStoreReply && replyStoreId && !store) {
                        fetchStoreInfo(replyStoreId);
                      }
                      
                      // ✅ Xác định avatar và name để hiển thị
                      const displayAvatar = isStoreReply && store 
                        ? store.logo 
                        : (isStoreReply ? null : r.user?.avatar);
                      const displayName = isStoreReply && store 
                        ? store.name 
                        : (r.user?.name || r.user?.fullName || r.userName || 'Người dùng');
                      const displayInitial = isStoreReply && store 
                        ? (store.name?.[0] || 'S').toUpperCase()
                        : ((r.user?.name || r.user?.fullName || r.userName || 'U')[0].toUpperCase());
                      
                      return (
                      <div key={r.id} className="pl-4 border-l">
                        <div className="flex items-start space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {displayAvatar && !avatarErrors.has(r.id) ? (
                              <img
                                src={displayAvatar}
                                alt={displayName}
                                className="w-full h-full object-cover"
                                onError={() => {
                                  setAvatarErrors(prev => new Set(prev).add(r.id));
                                }}
                              />
                            ) : (
                              <span className="text-white font-semibold text-xs">
                                {displayInitial}
                              </span>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-900">
                                  {displayName}
                                </span>
                                {r.createdAt && (
                                  <span className="text-xs text-gray-500">
                                    {formatTimeAgo(r.createdAt)}
                                  </span>
                                )}
                              </div>
                              {isAuthenticated && (
                                (isStoreReply && replyStoreId === currentStore?.id) || 
                                (!isStoreReply && (r.user?.id === user?.id || String(r.user?.id) === String(user?.id)))
                              ) && (
                                  <div className="flex items-center gap-2">
                                    {editingId === r.id ? null : (
                                      <>
                                        <button onClick={()=>handleEdit(r)} className="text-xs text-blue-600 hover:underline">Chỉnh sửa</button>
                                        <button onClick={()=>handleDelete(r.id)} className="text-xs text-red-600 hover:underline">Xóa</button>
                                      </>
                                    )}
                                  </div>
                                )
                              }
                            </div>
                            {editingId === r.id ? (
                              <div className="mt-2">
                                <textarea
                                  value={editContent}
                                  onChange={(e) => setEditContent(e.target.value)}
                                  rows={3}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <div className="flex items-center justify-end gap-2 mt-2">
                                  <button
                                    onClick={handleCancelEdit}
                                    className="px-3 py-1.5 text-sm border rounded hover:bg-gray-50"
                                    disabled={submitting}
                                  >
                                    Hủy
                                  </button>
                                  <button
                                    onClick={() => {
                                      const parentId = typeof c.id === 'string' ? c.id : (c.id?.id || c.id?._id || c.id);
                                      handleUpdate(r.id, parentId);
                                    }}
                                    disabled={submitting || !editContent.trim()}
                                    className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                                  >
                                    Lưu
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="text-gray-700 mt-1 whitespace-pre-wrap">{r.content}</div>
                            )}
                            {/* Display images if available */}
                            {r.images && r.images.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-2">
                                {r.images.map((img, idx) => (
                                  <img 
                                    key={idx} 
                                    src={typeof img === 'string' ? img : URL.createObjectURL(img)} 
                                    alt={`Phản hồi ${idx + 1}`}
                                    className="w-20 h-20 object-cover rounded border"
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      );
                    })}
                    {childrenOf(c.id).length > 1 && (
                      <button
                        className="text-sm text-blue-600 hover:underline"
                        onClick={() => {
                          toggle(c.id);
                          // ✅ Nếu đang expand và chưa có replies, fetch ngay
                          if (!expanded[c.id] && (!replies[c.id] || replies[c.id].length === 0)) {
                            loadReplies(c.id);
                          }
                        }}
                      >
                        {expanded[c.id] ? 'Thu gọn phản hồi' : `Xem tất cả phản hồi (${childrenOf(c.id).length})`}
                      </button>
                    )}
                  </div>

                  {replyTo === c.id && (
                    <div className="mt-3">
                      <textarea
                        value={replyContent}
                        onChange={(e)=>setReplyContent(e.target.value)}
                        placeholder="Phản hồi của bạn..."
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      
                      {/* Upload images button for reply */}
                      <div className="mt-2 flex items-center gap-2">
                        <input
                          type="file"
                          ref={(el) => {
                            if (el) replyImageInputRefs.current[c.id] = el;
                          }}
                          onChange={(e) => handleReplyImageSelect(c.id, e)}
                          multiple
                          accept="image/*"
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => replyImageInputRefs.current[c.id]?.click()}
                          className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded hover:bg-gray-50 flex items-center gap-1"
                          disabled={(replyImages[c.id] || []).length >= 5}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          Thêm ảnh ({(replyImages[c.id] || []).length}/5)
                        </button>
                      </div>

                      {/* Preview selected images for reply */}
                      {replyImages[c.id] && replyImages[c.id].length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {replyImages[c.id].map((file, index) => (
                            <div key={index} className="relative">
                              <img
                                src={URL.createObjectURL(file)}
                                alt={`Preview ${index + 1}`}
                                className="w-20 h-20 object-cover rounded border"
                              />
                              <button
                                type="button"
                                onClick={() => removeReplyImage(c.id, index)}
                                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex justify-end mt-2 space-x-2">
                        <button 
                          onClick={() => {
                            setReplyTo(null);
                            setReplyContent('');
                            setReplyImages(prev => {
                              const newState = { ...prev };
                              delete newState[c.id];
                              return newState;
                            });
                          }} 
                          className="px-3 py-1.5 border rounded"
                        >
                          Hủy
                        </button>
                        <button 
                          onClick={()=> handleReply(c.id)} 
                          disabled={submitting || (!replyContent.trim() && (!replyImages[c.id] || replyImages[c.id].length === 0))} 
                          className="px-3 py-1.5 bg-blue-600 text-white rounded disabled:opacity-50"
                        >
                          Gửi
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Load more button */}
      {hasMore && !loading && (
        <div className="mt-4 text-center">
          <button
            onClick={() => load(page + 1)}
            className="px-4 py-2 text-blue-600 hover:text-blue-800 border border-blue-600 rounded hover:bg-blue-50"
          >
            Xem thêm bình luận
          </button>
        </div>
      )}
      
      {loading && page > 0 && (
        <div className="mt-4 text-center text-gray-500">Đang tải thêm...</div>
      )}
      
    </div>
  );
};

export default ProductComments;


