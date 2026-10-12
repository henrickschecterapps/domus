import React from 'react';
import { useApp } from '../context/AppContext';
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 max-w-sm w-full px-4 pointer-events-none">
      {toasts.map((toast) => {
        let iconColor = 'text-brand-600 dark:text-brand-400';
        let Icon = Info;

        if (toast.type === 'success') {
          iconColor = 'text-success-600 dark:text-success-400';
          Icon = CheckCircle2;
        } else if (toast.type === 'warning') {
          iconColor = 'text-warning-600 dark:text-warning-400';
          Icon = AlertTriangle;
        } else if (toast.type === 'error') {
          iconColor = 'text-error-600 dark:text-error-400';
          Icon = XCircle;
        }

        return (
          <div
            key={toast.id}
            className="pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-800 shadow-u-lg backdrop-blur-md transition-all animate-in slide-in-from-top-3 duration-200"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Icon className={`w-4 h-4 flex-shrink-0 ${iconColor} stroke-[2.2]`} />
              <p className="text-xs font-semibold leading-snug break-words truncate">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
