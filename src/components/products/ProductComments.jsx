import { useEffect, useState } from 'react';
import { commentService } from '../../services/buyer/commentService';
import { useAuth } from '../../context/AuthContext';

const ProductComments = ({ productId }) => {
  const [comments, setComments] = useState([]);
  const [content, setContent] = useState('');
  const { user, isAuthenticated } = useAuth();
  const [replyTo, setReplyTo] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    const res = await commentService.getComments(productId);
    if (res.success) setComments(res.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, [productId]);

  const handleAdd = async () => {
    if (!isAuthenticated) return;
    if (!content.trim()) return;
    setSubmitting(true);
    const res = await commentService.addComment(productId, { content, userName: user?.name || 'Khách', userId: user?.id });
    if (res.success) {
      setContent('');
      await load();
    }
    setSubmitting(false);
  };

  const handleReply = async (parentId) => {
    if (!isAuthenticated) return;
    if (!replyContent.trim()) return;
    setSubmitting(true);
    const res = await commentService.addComment(productId, { content: replyContent, parentId, userName: user?.name || 'Khách', userId: user?.id });
    if (res.success) {
      setReplyTo(null);
      setReplyContent('');
      await load();
    }
    setSubmitting(false);
  };

  const handleDelete = async (commentId) => {
    if (!isAuthenticated) return;
    if (!window.confirm('Xóa bình luận này?')) return;
    
    const res = await commentService.deleteComment(productId, commentId, user?.id);
    if (res.success) {
      await load();
    } else {
      alert(res.error || 'Không thể xóa bình luận');
    }
  };

  const roots = comments.filter(c => !c.parentId);
  const childrenOf = (id) => comments.filter(c => c.parentId === id);

  // Expand/collapse replies
  const [expanded, setExpanded] = useState({}); // id -> boolean
  const toggle = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Bình luận</h2>

      {/* New comment */}
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
            <div className="flex justify-end mt-2">
              <button onClick={handleAdd} disabled={submitting || !content.trim()} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
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

      {/* List */}
      {loading ? (
        <div className="text-gray-500">Đang tải bình luận...</div>
      ) : roots.length === 0 ? (
        <div className="text-gray-500">Chưa có bình luận nào</div>
      ) : (
        <div className="space-y-6">
          {roots.map(c => (
            <div key={c.id} className="">
              <div className="flex items-start space-x-3">
                <div className="w-9 h-9 bg-gray-200 rounded-full flex items-center justify-center">{c.user.avatar}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-gray-900">{c.user.name}</div>
                    {isAuthenticated && String(c.user?.id) === String(user?.id) && (
                      <button onClick={()=>handleDelete(c.id)} className="text-xs text-red-600 hover:underline">Xóa</button>
                    )}
                  </div>
                  <div className="text-gray-700 mt-1 whitespace-pre-wrap">{c.content}</div>
                  <div className="text-xs text-gray-500 mt-1">{new Date(c.createdAt).toLocaleString('vi-VN')}</div>
                  <div className="mt-2">
                    {isAuthenticated ? (
                      <button className="text-sm text-blue-600 hover:underline" onClick={()=> setReplyTo(replyTo===c.id ? null : c.id)}>Trả lời</button>
                    ) : (
                      <span className="text-sm text-gray-500">Đăng nhập để trả lời</span>
                    )}
                  </div>

                  {/* replies */}
                  <div className="mt-3 space-y-4">
                    {childrenOf(c.id).slice(0, expanded[c.id] ? undefined : 1).map(r => (
                      <div key={r.id} className="pl-4 border-l">
                        <div className="flex items-start space-x-3">
                          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">{r.user.avatar}</div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <div className="font-medium text-gray-900">{r.user.name}</div>
                              {isAuthenticated && String(r.user?.id) === String(user?.id) && (
                                <button onClick={()=>handleDelete(r.id)} className="text-xs text-red-600 hover:underline">Xóa</button>
                              )}
                            </div>
                            <div className="text-gray-700 mt-1 whitespace-pre-wrap">{r.content}</div>
                            <div className="text-xs text-gray-500 mt-1">{new Date(r.createdAt).toLocaleString('vi-VN')}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {childrenOf(c.id).length > 1 && (
                      <button
                        className="text-sm text-blue-600 hover:underline"
                        onClick={()=> toggle(c.id)}
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
                      <div className="flex justify-end mt-2 space-x-2">
                        <button onClick={()=> setReplyTo(null)} className="px-3 py-1.5 border rounded">Hủy</button>
                        <button onClick={()=> handleReply(c.id)} disabled={submitting || !replyContent.trim()} className="px-3 py-1.5 bg-blue-600 text-white rounded disabled:opacity-50">Gửi</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductComments;


