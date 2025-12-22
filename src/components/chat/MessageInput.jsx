import React, { useState, useRef } from 'react';

/**
 * MessageInput Component
 * Input để gửi tin nhắn với emoji, file upload
 */
const MessageInput = ({ 
  onSendMessage, 
  onTyping,
  disabled = false,
  placeholder = 'Nhập tin nhắn...'
}) => {
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [selectedImages, setSelectedImages] = useState([]);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);

  const emojis = ['😊', '😂', '❤️', '👍', '🎉', '😍', '🔥', '💯', '✨', '🙏'];

  const handleInputChange = (e) => {
    setMessage(e.target.value);
    onTyping?.();
  };

  const handleSend = () => {
    const trimmedMessage = message.trim();
    // ✅ Cho phép gửi nếu có message hoặc có file/image
    if ((!trimmedMessage && selectedFiles.length === 0 && selectedImages.length === 0) || disabled) return;

    // ✅ Gửi message kèm files và images
    onSendMessage(trimmedMessage, {
      files: selectedFiles,
      images: selectedImages
    });
    
    setMessage('');
    setSelectedFiles([]);
    setSelectedImages([]);
    inputRef.current?.focus();
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(prev => [...prev, ...files]);
    e.target.value = ''; // Reset input
  };

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files).filter(file => file.type.startsWith('image/'));
    setSelectedImages(prev => [...prev, ...files]);
    e.target.value = ''; // Reset input
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const removeImage = (index) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleEmojiClick = (emoji) => {
    setMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

  return (
    <div className="border-t bg-white p-4">
      <div className="flex items-end gap-2">
        {/* Emoji picker button */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={disabled}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>

          {/* Emoji picker dropdown */}
          {showEmojiPicker && (
            <div className="absolute bottom-full mb-2 left-0 bg-white rounded-lg shadow-lg border p-2 grid grid-cols-5 gap-1">
              {emojis.map((emoji, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleEmojiClick(emoji)}
                  className="text-2xl hover:bg-gray-100 rounded p-1 transition-colors"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* File upload button */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          multiple
          className="hidden"
          accept="*/*"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          disabled={disabled}
          title="Đính kèm file"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
        </button>

        {/* Image upload button */}
        <input
          type="file"
          ref={imageInputRef}
          onChange={handleImageSelect}
          multiple
          className="hidden"
          accept="image/*"
        />
        <button
          type="button"
          onClick={() => imageInputRef.current?.click()}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          disabled={disabled}
          title="Gửi hình ảnh"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </button>

        {/* Text input */}
        <div className="flex-1">
          <textarea
            ref={inputRef}
            value={message}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            style={{ minHeight: '40px', maxHeight: '120px' }}
          />
        </div>

        {/* Send button */}
        <button
          type="button"
          onClick={handleSend}
          disabled={(!message.trim() && selectedFiles.length === 0 && selectedImages.length === 0) || disabled}
          className={`p-2 rounded-lg transition-colors ${
            (message.trim() || selectedFiles.length > 0 || selectedImages.length > 0) && !disabled
              ? 'bg-blue-500 text-white hover:bg-blue-600'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>

      {/* Selected files preview */}
      {(selectedFiles.length > 0 || selectedImages.length > 0) && (
        <div className="mt-2 flex flex-wrap gap-2">
          {selectedImages.map((file, index) => (
            <div key={`img-${index}`} className="relative">
              <img
                src={URL.createObjectURL(file)}
                alt={`Preview ${index + 1}`}
                className="w-16 h-16 object-cover rounded border"
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
          {selectedFiles.map((file, index) => (
            <div key={`file-${index}`} className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded border text-sm">
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-gray-700 truncate max-w-[150px]">{file.name}</span>
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="text-red-500 hover:text-red-700"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Character count (optional) */}
      {message.length > 0 && (
        <div className="text-xs text-gray-500 mt-1 text-right">
          {message.length} ký tự
        </div>
      )}
    </div>
  );
};

export default MessageInput;
