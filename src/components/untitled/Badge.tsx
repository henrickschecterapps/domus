import React from 'react';

export type BadgeVariant = 'brand' | 'gray' | 'success' | 'warning' | 'error' | 'blue';
export type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  className?: string;
  icon?: React.FC<{ className?: string }>;
  title?: string;
}

const variantStyles: Record<BadgeVariant, { bg: string; text: string; border: string; dot: string }> = {
  brand: {
    bg: 'bg-brand-50 dark:bg-brand-900/30',
    text: 'text-brand-700 dark:text-brand-300',
    border: 'border-brand-200 dark:border-brand-800/40',
    dot: 'bg-brand-500',
  },
  gray: {
    bg: 'bg-gray-50 dark:bg-gray-800/60',
    text: 'text-gray-700 dark:text-gray-300',
    border: 'border-gray-200 dark:border-gray-700/60',
    dot: 'bg-gray-500',
  },
  success: {
    bg: 'bg-success-50 dark:bg-success-900/30',
    text: 'text-success-700 dark:text-success-300',
    border: 'border-success-200 dark:border-success-800/40',
    dot: 'bg-success-500',
  },
  warning: {
    bg: 'bg-warning-50 dark:bg-warning-900/30',
    text: 'text-warning-700 dark:text-warning-300',
    border: 'border-warning-200 dark:border-warning-800/40',
    dot: 'bg-warning-500',
  },
  error: {
    bg: 'bg-error-50 dark:bg-error-900/30',
    text: 'text-error-700 dark:text-error-300',
    border: 'border-error-200 dark:border-error-800/40',
    dot: 'bg-error-500',
  },
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-900/30',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-200 dark:border-blue-800/40',
    dot: 'bg-blue-500',
  },
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-[11px]',
  md: 'px-2.5 py-0.5 text-xs',
  lg: 'px-3 py-1 text-sm',
};

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'gray',
  size = 'md',
  dot = false,
  className = '',
  icon: Icon,
  title,
}) => {
  const v = variantStyles[variant];

  return (
    <span
      title={title}
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${v.bg} ${v.text} ${v.border} ${sizeStyles[size]} ${className} transition-colors`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${v.dot} flex-shrink-0 animate-pulse`} />}
      {Icon && <Icon className="w-3.5 h-3.5 flex-shrink-0" />}
      <span>{children}</span>
    </span>
  );
};
