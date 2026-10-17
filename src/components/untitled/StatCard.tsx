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
      className={`u-card-interactive relative overflow-hidden p-4 sm:p-5 rounded-2xl bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border border-gray-200/80 dark:border-gray-800/80 shadow-u-sm hover:shadow-u-card-hover text-left w-full group ${
        onClick ? 'cursor-pointer active:scale-[0.98]' : ''
      } ${className}`}
    >
      {/* Subtle Ambient Corner Glow on Hover */}
      <div className="pointer-events-none absolute -top-12 -right-12 w-28 h-28 rounded-full bg-brand-500/[0.06] dark:bg-brand-400/[0.08] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="relative z-10 flex items-center justify-between gap-2 mb-2.5">
        <span className="text-xs sm:text-sm font-semibold text-gray-500 dark:text-gray-400 truncate tracking-tight">
          {title}
        </span>
        {Icon && (
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-u-xs ${iconBgColor} ${iconColor} group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300 ease-spring`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="relative z-10 flex items-baseline justify-between gap-2">
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
        <p className="relative z-10 text-xs text-gray-500 dark:text-gray-400 mt-2.5 truncate font-medium flex items-center gap-1">
          <span>{subtitle}</span>
          {onClick && (
            <span className="inline-block opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 text-brand-600 dark:text-brand-400 font-bold">
              →
            </span>
          )}
        </p>
      )}
    </Component>
  );
};

