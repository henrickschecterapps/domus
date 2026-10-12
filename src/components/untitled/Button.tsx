import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'destructive';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.FC<{ className?: string }>;
  iconPosition?: 'left' | 'right';
  children?: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-brand-600 hover:bg-brand-700 text-white border border-brand-600 shadow-u-xs focus:ring-4 focus:ring-brand-500/15',
  secondary:
    'bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-700 shadow-u-xs focus:ring-4 focus:ring-gray-400/15',
  tertiary:
    'hover:bg-gray-100 dark:hover:bg-gray-800/80 text-gray-600 dark:text-gray-300 focus:ring-4 focus:ring-gray-400/10',
  destructive:
    'bg-error-600 hover:bg-error-700 text-white border border-error-600 shadow-u-xs focus:ring-4 focus:ring-error-500/15',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs font-semibold rounded-lg gap-1.5',
  md: 'px-3.5 py-2 text-sm font-semibold rounded-lg gap-2',
  lg: 'px-4.5 py-2.5 text-base font-semibold rounded-xl gap-2',
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'secondary',
  size = 'md',
  icon: Icon,
  iconPosition = 'left',
  children,
  className = '',
  disabled,
  ...props
}) => {
  return (
    <button
      disabled={disabled}
      className={`inline-flex items-center justify-center font-medium transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none select-none ${
        variantStyles[variant]
      } ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {Icon && iconPosition === 'left' && <Icon className="w-4 h-4 flex-shrink-0" />}
      {children}
      {Icon && iconPosition === 'right' && <Icon className="w-4 h-4 flex-shrink-0" />}
    </button>
  );
};
