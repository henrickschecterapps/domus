import React from 'react';
import { Badge, BadgeVariant } from './untitled/Badge';

interface ScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  sublabel?: string;
}

export const ScoreRing: React.FC<ScoreRingProps> = ({
  score,
  size = 100,
  strokeWidth = 8,
  label = 'Score Geral da Residência',
  sublabel,
}) => {
  const clampedScore = Math.max(0, Math.min(100, Math.round(score)));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clampedScore / 100) * circumference;

  let strokeGradientId = 'botanicalGradient';
  let textColor = 'text-success-600 dark:text-success-400';
  let badgeText = 'Ambientes em Harmonia';
  let badgeVariant: BadgeVariant = 'success';

  if (clampedScore < 50) {
    strokeGradientId = 'terracottaGradient';
    textColor = 'text-brand-600 dark:text-brand-400';
    badgeText = 'Atenção Crítica';
    badgeVariant = 'error';
  } else if (clampedScore < 80) {
    strokeGradientId = 'amberGradient';
    textColor = 'text-warning-600 dark:text-warning-400';
    badgeText = 'Requer Manutenção';
    badgeVariant = 'warning';
  }

  return (
    <div className="flex flex-col sm:flex-row items-center sm:items-center gap-6 p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-u-xs transition-all">
      <div className="relative flex items-center justify-center flex-shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="rotate-[-90deg]">
          <defs>
            <linearGradient id="botanicalGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2E7D32" />
              <stop offset="100%" stopColor="#43A047" />
            </linearGradient>
            <linearGradient id="amberGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#D97706" />
              <stop offset="100%" stopColor="#F59E0B" />
            </linearGradient>
            <linearGradient id="terracottaGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#C25E34" />
              <stop offset="100%" stopColor="#E07A52" />
            </linearGradient>
          </defs>
          {/* Base Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            className="text-gray-100 dark:text-gray-800/80"
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Progress Ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={`url(#${strokeGradientId})`}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            fill="none"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className={`text-3xl font-extrabold tracking-tight font-display ${textColor} leading-none`}>
            {clampedScore}
          </span>
          <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 dark:text-gray-500 mt-1 font-display">
            %
          </span>
        </div>
      </div>

      <div className="flex-1 min-w-0 text-center sm:text-left">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
          <span className="text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider font-display">
            {label}
          </span>
          <Badge variant={badgeVariant} dot size="sm">
            {badgeText}
          </Badge>
        </div>
        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed font-normal">
          {sublabel || (clampedScore >= 80 ? 'Todos os cômodos estão sob controle, organizados e higienizados.' : clampedScore >= 50 ? 'Algumas rotinas estão acumuladas e requerem ação preventiva.' : 'Vários ambientes ultrapassaram o limite de tolerância sanitária.')}
        </p>
      </div>
    </div>
  );
};
