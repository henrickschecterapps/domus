import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxHeight?: string;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxHeight = 'max-h-[90vh]',
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-gray-950/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Sheet Modal */}
      <div
        className={`relative z-10 w-full sm:max-w-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-t-3xl sm:rounded-2xl border border-gray-200 dark:border-gray-800 shadow-u-xl flex flex-col ${maxHeight} overflow-hidden animate-in slide-in-from-bottom-6 duration-250 ease-out`}
      >
        {/* Drag Handle */}
        <div className="pt-3 pb-1 flex justify-center sm:hidden">
          <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-700" />
        </div>

        {/* Sheet Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <div className="min-w-0 pr-4">
            <h2 className="text-base sm:text-lg font-bold tracking-tight text-gray-900 dark:text-white truncate">
              {title}
            </h2>
            {subtitle && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate font-normal">
                {subtitle}
              </p>
            )}
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-gray-900 dark:hover:text-white flex items-center justify-center transition-all active:scale-95 shadow-u-xs"
            aria-label="Fechar"
            title="Fechar"
          >
            <X className="w-4 h-4 stroke-[2.2]" />
          </button>
        </div>

        {/* Sheet Content */}
        <div className="p-6 overflow-y-auto flex-1 overscroll-contain safe-bottom">
          {children}
        </div>
      </div>
    </div>
  );
};
