import React from 'react';
import { Badge, BadgeVariant } from './Badge';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  badgeText?: string;
  badgeVariant?: BadgeVariant;
  badgeDot?: boolean;
  icon?: React.FC<{ className?: string }>;
  iconColor?: string;
  iconBgColor?: string;
  onClick?: () => void;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  badgeText,
  badgeVariant = 'gray',
  badgeDot = false,
  icon: Icon,
  iconColor = 'text-brand-600 dark:text-brand-400',
  iconBgColor = 'bg-brand-50 dark:bg-brand-950/50 border border-brand-100 dark:border-brand-900/30',
  onClick,
  className = '',
}) => {
  const Component = onClick ? 'button' : 'div';

  return (
    <Component
      onClick={onClick}
      className={`p-4 sm:p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800/80 shadow-u-xs hover:shadow-u-sm transition-all duration-200 text-left w-full group ${
        onClick ? 'cursor-pointer hover:border-gray-300 dark:hover:border-gray-700 active:scale-[0.99]' : ''
      } ${className}`}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">
          {title}
        </span>
        {Icon && (
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBgColor} ${iconColor} group-hover:scale-105 transition-transform`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <span className="text-2xl sm:text-3xl font-extrabold tracking-tight font-display text-gray-900 dark:text-white leading-none">
          {value}
        </span>

        {badgeText && (
          <Badge variant={badgeVariant} dot={badgeDot} size="sm">
            {badgeText}
          </Badge>
        )}
      </div>

      {subtitle && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 truncate font-normal">
          {subtitle}
        </p>
      )}
    </Component>
  );
};
