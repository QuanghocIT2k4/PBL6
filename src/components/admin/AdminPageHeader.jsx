import React from 'react';

/**
 * Admin Page Header Component
 * Unified header design for all admin pages with teal theme
 * Giống Store Dashboard nhưng màu teal thay vì cyan
 */
const AdminPageHeader = ({ icon, title, subtitle, action }) => {
  return (
    <div className="bg-gradient-to-r from-teal-200 to-emerald-200 rounded-2xl p-6">
      <div className="relative bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-4xl">{icon}</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">{title}</h1>
              <p className="text-gray-600 text-base mt-1">{subtitle}</p>
            </div>
          </div>
          {action && (
            <div>{action}</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPageHeader;
