import React, { createContext, useContext, useState, useCallback } from 'react';
import Toast from '../components/ui/Toast';

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toast, setToast] = useState(null);

  const showToast = useCallback((messageOrType, typeOrMessage = 'info', duration = 3000) => {
    // Smart detection: if first param is a valid type, swap them
    const validTypes = ['success', 'error', 'warning', 'info'];
    let finalMessage, finalType;
    
    if (validTypes.includes(messageOrType)) {
      // Old format: showToast(type, message)
      finalType = messageOrType;
      finalMessage = typeOrMessage;
    } else {
      // New format: showToast(message, type)
      finalMessage = messageOrType;
      finalType = validTypes.includes(typeOrMessage) ? typeOrMessage : 'info';
    }
    
    setToast({ type: finalType, message: finalMessage, duration });
  }, []);

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  const value = {
    toast,
    showToast,
    hideToast,
    // Convenience methods
    success: useCallback((message, duration) => showToast('success', message, duration), [showToast]),
    error: useCallback((message, duration) => showToast('error', message, duration), [showToast]),
    warning: useCallback((message, duration) => showToast('warning', message, duration), [showToast]),
    info: useCallback((message, duration) => showToast('info', message, duration), [showToast])
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast && <Toast type={toast.type} message={toast.message} duration={toast.duration} onClose={hideToast} />}
    </ToastContext.Provider>
  );
};

