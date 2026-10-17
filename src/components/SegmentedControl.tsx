import React from 'react';

interface SegmentOption<T extends string> {
  id: T;
  label: string;
  count?: number;
  icon?: React.FC<{ className?: string }>;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className = '',
}: SegmentedControlProps<T>) {
  return (
    <div
      className={`p-1 bg-gray-100/90 dark:bg-gray-800/80 rounded-2xl flex items-center gap-1 border border-gray-200/70 dark:border-gray-700/60 ${className}`}
    >
      {options.map((opt) => {
        const isActive = value === opt.id;
        const Icon = opt.icon;

        return (
          <button
            key={opt.id}
            onClick={() => onChange(opt.id)}
            className={`flex-1 py-2 px-3 rounded-xl text-xs transition-all duration-200 ease-spring flex items-center justify-center gap-1.5 select-none active:scale-[0.98] ${
              isActive
                ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-u-sm border border-gray-200/60 dark:border-gray-700/60 font-bold'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium border border-transparent'
            }`}
          >
            {Icon && <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-brand-600 dark:text-brand-400' : ''}`} />}
            <span>{opt.label}</span>
            {opt.count !== undefined && (
              <span
                className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full font-bold transition-colors ${
                  isActive
                    ? 'bg-brand-50 dark:bg-brand-950/80 text-brand-700 dark:text-brand-300 border border-brand-200/60 dark:border-brand-800/40'
                    : 'bg-gray-200/70 dark:bg-gray-700/70 text-gray-600 dark:text-gray-400'
                }`}
              >
                {opt.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

