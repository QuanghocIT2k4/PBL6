import React, { useState } from 'react';
import { formatMessageTime } from '../../services/chat/chatService';

/**
 * MessageBubble Component
 * Hiển thị 1 tin nhắn dạng bubble
 */
const MessageBubble = ({ 
  message, 
  isOwn, 
  showAvatar = true,
  onDelete,
  recipientAvatar = null, // Avatar của người nhận (để hiển thị khi đã đọc)
  isLastOwnMessage = false // Chỉ tin nhắn cuối cùng mới hiển thị icon đã đọc
}) => {
  const [showMenu, setShowMenu] = useState(false);

  const handleDelete = () => {
    if (window.confirm('Bạn có chắc muốn xóa tin nhắn này?')) {
      onDelete(message.id);
    }
    setShowMenu(false);
  };

  // Render product link
  if (message.type === 'PRODUCT_LINK' && message.productInfo) {
    return (
      <div className={`flex gap-2 mb-6 ${isOwn ? 'justify-end' : 'justify-start'}`}>
        {!isOwn && showAvatar && (
          <img
            src={message.senderAvatar || '/default-avatar.png'}
            alt={message.senderName}
            className="w-8 h-8 rounded-full flex-shrink-0"
            onError={(e) => { e.target.src = '/default-avatar.png'; }}
          />
        )}
        
        <div className={`max-w-md ${isOwn ? 'items-end' : 'items-start'}`}>
          {!isOwn && (
            <p className="text-xs text-gray-600 mb-1">{message.senderName}</p>
          )}
          
          <div className={`rounded-lg p-3 ${isOwn ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}>
            <p className="text-sm mb-2">{message.content}</p>
            
            {/* Product Card */}
            <div className="bg-white rounded-lg p-3 border">
              <div className="flex gap-3">
                <img
                  src={message.productInfo.imageUrl}
                  alt={message.productInfo.productName}
                  className="w-16 h-16 rounded object-cover"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-gray-900 truncate">
                    {message.productInfo.productName}
                  </h4>
                  <p className="text-sm font-semibold text-blue-600 mt-1">
                    {message.productInfo.price?.toLocaleString('vi-VN')}đ
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <p className="text-xs text-gray-500 mt-1">
            {formatMessageTime(message.sentAt)}
          </p>
        </div>
      </div>
    );
  }

  // Render image message
  if (message.type === 'IMAGE') {
    return (
      <div className={`flex gap-2 mb-6 ${isOwn ? 'justify-end' : 'justify-start'}`}>
        {!isOwn && showAvatar && (
          <img
            src={message.senderAvatar || '/default-avatar.png'}
            alt={message.senderName}
            className="w-8 h-8 rounded-full flex-shrink-0"
            onError={(e) => { e.target.src = '/default-avatar.png'; }}
          />
        )}
        
        <div className={`max-w-md ${isOwn ? 'items-end' : 'items-start'}`}>
          {!isOwn && (
            <p className="text-xs text-gray-600 mb-1">{message.senderName}</p>
          )}
          
          <div className={`rounded-lg overflow-hidden ${isOwn ? 'bg-blue-500' : 'bg-gray-100'}`}>
            {message.content && (
              <p className={`text-sm p-3 ${isOwn ? 'text-white' : 'text-gray-900'}`}>
                {message.content}
              </p>
            )}
            {message.attachments?.map((url, index) => (
              <img
                key={index}
                src={url}
                alt="Attachment"
                className="w-full max-w-xs cursor-pointer hover:opacity-90"
                onClick={() => window.open(url, '_blank')}
              />
            ))}
          </div>
          
          <p className="text-xs text-gray-500 mt-1">
            {formatMessageTime(message.sentAt)}
          </p>
        </div>
      </div>
    );
  }

  // Render system message
  if (message.type === 'SYSTEM') {
    return (
      <div className="flex justify-center mb-6">
        <div className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">
          {message.content}
        </div>
      </div>
    );
  }

  // Render deleted message
  if (message.status === 'DELETED') {
    return (
      <div className={`flex gap-2 mb-6 ${isOwn ? 'justify-end' : 'justify-start'}`}>
        {!isOwn && showAvatar && (
          <img
            src={message.senderAvatar || '/default-avatar.png'}
            alt={message.senderName}
            className="w-8 h-8 rounded-full flex-shrink-0"
            onError={(e) => { e.target.src = '/default-avatar.png'; }}
          />
        )}
        
        <div className={`max-w-md ${isOwn ? 'items-end' : 'items-start'}`}>
          <div className="bg-gray-100 rounded-lg px-4 py-2 italic text-gray-500 text-sm">
            Tin nhắn đã bị xóa
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {formatMessageTime(message.sentAt)}
          </p>
        </div>
      </div>
    );
  }

  // Render text message (default)
  return (
    <div className={`flex gap-2 mb-6 ${isOwn ? 'justify-end' : 'justify-start'}`}>
      {!isOwn && showAvatar && (
        <img
          src={message.senderAvatar || '/default-avatar.png'}
          alt={message.senderName}
          className="w-8 h-8 rounded-full flex-shrink-0"
          onError={(e) => { e.target.src = '/default-avatar.png'; }}
        />
      )}
      
      <div className={`max-w-md ${isOwn ? 'items-end' : 'items-start'}`}>
        {!isOwn && (
          <p className="text-xs text-gray-600 mb-1">{message.senderName}</p>
        )}
        
        <div className="relative group">
          {/* Reply indicator */}
          {message.replyToMessageId && (
            <div className={`text-xs mb-2 pb-2 border-b ${isOwn ? 'border-blue-400' : 'border-gray-300'}`}>
              <span className="opacity-75">↩️ Trả lời</span>
            </div>
          )}
          
          <div className={`rounded-lg px-4 py-2 max-w-md break-words relative ${isOwn ? 'bg-blue-500 text-white rounded-br-none' : 'bg-gray-100'}`}>
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              
              {/* Attachments */}
              {message.attachments && message.attachments.length > 0 && (
                <div className="mt-2 space-y-1">
                  {message.attachments.map((attachment, index) => (
                    <a
                      key={index}
                      href={attachment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center gap-2 text-xs underline ${isOwn ? 'text-blue-100' : 'text-blue-600'}`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                      File đính kèm {index + 1}
                    </a>
                  ))}
                </div>
              )}
              
              {/* Read status icon - Chỉ hiển thị ở tin nhắn cuối cùng */}
              {isOwn && message.status === 'READ' && isLastOwnMessage && (
                <div className="absolute -bottom-5 right-0">
                  {recipientAvatar ? (
                    <img
                      src={recipientAvatar}
                      alt="Đã đọc"
                      className="w-4 h-4 rounded-full border-2 border-white object-cover bg-white shadow-md"
                      title="Đã đọc"
                      onError={(e) => { 
                        e.target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-4 h-4 bg-white rounded-full shadow-md flex items-center justify-center">
                      <svg 
                        className="w-3 h-3 text-blue-500" 
                        fill="currentColor" 
                        viewBox="0 0 20 20"
                        title="Đã đọc"
                      >
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
              )}
          </div>
          
          {/* Message menu */}
          {isOwn && message.status !== 'DELETED' && (
            <div className="absolute right-0 top-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1 hover:bg-gray-200 rounded"
              >
                <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
              </button>
              
              {showMenu && (
                <div className="absolute right-0 mt-1 bg-white rounded-lg shadow-lg border py-1 z-10">
                  <button
                    onClick={handleDelete}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                  >
                    Xóa tin nhắn
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Time - Chỉ hiển thị khi CHƯA đọc */}
        {(!isOwn || message.status !== 'READ') && (
          <p className="text-xs text-gray-500 mt-1">
            {formatMessageTime(message.sentAt)}
          </p>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;
