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
    'u-btn-shine bg-gradient-to-b from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white border border-brand-600/90 shadow-u-glow hover:shadow-u-glow-lg hover:-translate-y-[1px] focus:ring-4 focus:ring-brand-500/20',
  secondary:
    'bg-white dark:bg-gray-900 hover:bg-gray-50/90 dark:hover:bg-gray-800/90 text-gray-700 dark:text-gray-200 border border-gray-200/90 dark:border-gray-700/80 hover:border-brand-300/60 dark:hover:border-brand-700/50 shadow-u-xs hover:shadow-u-sm hover:-translate-y-[1px] focus:ring-4 focus:ring-gray-400/15',
  tertiary:
    'hover:bg-gray-100/80 dark:hover:bg-gray-800/80 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white focus:ring-4 focus:ring-gray-400/10',
  destructive:
    'u-btn-shine bg-gradient-to-b from-error-500 to-error-600 hover:from-error-600 hover:to-error-700 text-white border border-error-600 shadow-u-sm hover:shadow-u-md hover:-translate-y-[1px] focus:ring-4 focus:ring-error-500/20',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs font-semibold rounded-xl gap-1.5',
  md: 'px-3.5 py-2 text-sm font-semibold rounded-xl gap-2',
  lg: 'px-4.5 py-2.5 text-base font-semibold rounded-2xl gap-2',
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
      className={`group/btn inline-flex items-center justify-center font-medium transition-all duration-200 ease-spring active:scale-[0.97] active:translate-y-0 disabled:opacity-50 disabled:pointer-events-none select-none ${
        variantStyles[variant]
      } ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {Icon && iconPosition === 'left' && (
        <Icon className="w-4 h-4 flex-shrink-0 transition-transform duration-200 ease-spring group-hover/btn:scale-110" />
      )}
      {children}
      {Icon && iconPosition === 'right' && (
        <Icon className="w-4 h-4 flex-shrink-0 transition-transform duration-200 ease-spring group-hover/btn:translate-x-0.5" />
      )}
    </button>
  );
};

