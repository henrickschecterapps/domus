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
    <div className="u-card-interactive relative overflow-hidden flex flex-col sm:flex-row items-center sm:items-center gap-6 p-6 sm:p-7 rounded-3xl bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border border-gray-200/80 dark:border-gray-800/80 shadow-u-md hover:shadow-u-card-hover transition-all">
      {/* Ambient Atmospheric Glow Pool */}
      <div
        className={`pointer-events-none absolute -top-20 -left-20 w-56 h-56 rounded-full blur-3xl opacity-25 dark:opacity-20 transition-colors duration-700 ${
          clampedScore >= 80
            ? 'bg-success-500'
            : clampedScore >= 50
            ? 'bg-warning-500'
            : 'bg-brand-500'
        }`}
      />
      <div className="pointer-events-none absolute -bottom-16 -right-16 w-48 h-48 rounded-full bg-brand-500/10 dark:bg-brand-400/10 blur-3xl" />

      <div className="relative z-10 flex items-center justify-center flex-shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="rotate-[-90deg] drop-shadow-sm">
          <defs>
            <linearGradient id="botanicalGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2E7D32" />
              <stop offset="100%" stopColor="#4ADE80" />
            </linearGradient>
            <linearGradient id="amberGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#D97706" />
              <stop offset="100%" stopColor="#FBBF24" />
            </linearGradient>
            <linearGradient id="terracottaGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#C25E34" />
              <stop offset="100%" stopColor="#F97316" />
            </linearGradient>
          </defs>
          {/* Base Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            className="text-gray-100 dark:text-gray-800/90"
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
          <span className="text-[10px] uppercase font-bold tracking-widest text-gray-400 dark:text-gray-500 mt-1 font-mono">
            SCORE
          </span>
        </div>
      </div>

      <div className="relative z-10 flex-1 min-w-0 text-center sm:text-left">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-gray-100/80 dark:bg-gray-800/80 border border-gray-200/60 dark:border-gray-700/60 mb-2">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
            DIAGNÓSTICO EM TEMPO REAL
          </span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 mb-2">
          <h2 className="text-base sm:text-lg font-extrabold text-gray-900 dark:text-white tracking-tight font-display">
            {label}
          </h2>
          <div className="flex justify-center sm:justify-start">
            <Badge variant={badgeVariant} dot size="sm">
              {badgeText}
            </Badge>
          </div>
        </div>
        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed font-normal max-w-2xl">
          {sublabel || (clampedScore >= 80 ? 'Todos os cômodos estão sob controle, organizados e higienizados.' : clampedScore >= 50 ? 'Algumas rotinas estão acumuladas e requerem ação preventiva.' : 'Vários ambientes ultrapassaram o limite de tolerância sanitária.')}
        </p>
      </div>
    </div>
  );
};

