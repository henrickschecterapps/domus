import React from 'react';
import { useApp } from '../context/AppContext';
import { Trophy, Flame, RotateCcw } from 'lucide-react';
import { ActivityRing } from './ActivityRing';
import { Badge } from './untitled/Badge';

export const LeaderboardWidget: React.FC = () => {
  const { members, resetWeeklyLeaderboard } = useApp();

  const sortedMembers = [...members].sort((a, b) => b.weeklyXP - a.weeklyXP);
  const WEEKLY_GOAL_XP = 300;

  // Warm Editorial Sanctuary organic activity ring palette
  const ringColors = ['#C25E34', '#2E7D32', '#D97706', '#8C3F22'];

  return (
    <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 shadow-u-xs transition-colors">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-warning-50 dark:bg-warning-950/60 border border-warning-100 dark:border-warning-900/30 text-warning-600 dark:text-warning-400 flex items-center justify-center">
            <Trophy className="w-4 h-4 stroke-[2.2]" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider font-display">
              Anéis de Atividade & Ranking
            </h2>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">Meta semanal: {WEEKLY_GOAL_XP} XP</p>
          </div>
        </div>
        <button
          onClick={resetWeeklyLeaderboard}
          className="text-[11px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 flex items-center gap-1 transition-colors font-medium"
          title="Simular fechamento semanal (Domingo 23:59)"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset Semanal</span>
        </button>
      </div>

      <div className="space-y-3">
        {sortedMembers.map((member, index) => {
          const percentage = Math.round((member.weeklyXP / WEEKLY_GOAL_XP) * 100);
          const ringColor = ringColors[index % ringColors.length];

          return (
            <div
              key={member.userId}
              className="flex items-center gap-3.5 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800 shadow-u-xs"
            >
              {/* Activity Ring */}
              <ActivityRing
                percentage={percentage}
                size={48}
                strokeWidth={5}
                color={ringColor}
                backgroundColor={`${ringColor}20`}
              >
                <img
                  src={member.avatarUrl}
                  alt={member.displayName}
                  className="w-7 h-7 rounded-full object-cover"
                />
              </ActivityRing>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                      {member.displayName}
                    </span>
                    {member.streakDays && member.streakDays > 0 ? (
                      <Badge variant="warning" size="sm" icon={Flame}>
                        {member.streakDays}d
                      </Badge>
                    ) : null}
                  </div>

                  <span className="text-xs font-bold text-gray-900 dark:text-white">
                    {member.weeklyXP} <span className="text-[10px] font-normal text-gray-400">/ {WEEKLY_GOAL_XP} XP</span>
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                  <span className="truncate">{member.levelTitle || 'Residente'} • Nv. {member.level ?? (Math.floor(member.totalXP / 100) + 1)}</span>
                  <span className="text-[11px] font-semibold text-brand-600 dark:text-brand-400">
                    {percentage}% concluído
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
