import React from 'react';
import { useApp } from '../context/AppContext';
import { calculateChoreUrgency, humanizeTimestamp, checkChoreCooldown } from '../utils/cleaningMath';
import { Zap, Check, Clock } from 'lucide-react';
import { Badge } from './untitled/Badge';

export const QuickCleanWidget: React.FC = () => {
  const { chores, rooms, completeChore } = useApp();
  const now = Date.now();

  const roomMap = new Map(rooms.map((r) => [r.id, r.name]));

  // Find top 3 most urgent chores
  const choresWithUrgency = chores.map((c) => {
    const { urgencyRatio, statusLevel } = calculateChoreUrgency(c, now);
    const cooldown = checkChoreCooldown(c.lastCompletedAt, now);
    return {
      ...c,
      currentUrgencyRatio: urgencyRatio,
      currentStatusLevel: statusLevel,
      cooldown,
    };
  });

  const urgentChores = choresWithUrgency
    .filter((c) => c.currentUrgencyRatio > 0.8)
    .sort((a, b) => b.currentUrgencyRatio - a.currentUrgencyRatio)
    .slice(0, 3);

  return (
    <div className="u-card-interactive rounded-2xl bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border border-gray-200/80 dark:border-gray-800/80 p-5 shadow-u-sm hover:shadow-u-card-hover transition-all">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100 dark:border-gray-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-error-50 dark:bg-error-950/60 border border-error-100 dark:border-error-900/30 text-error-600 dark:text-error-400 flex items-center justify-center shadow-u-xs">
            <Zap className="w-4 h-4 fill-current" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-error-600 dark:text-error-400 block leading-none mb-0.5">
              AÇÃO IMEDIATA
            </span>
            <h2 className="text-xs font-extrabold text-gray-900 dark:text-white uppercase tracking-wider font-display">
              Limpeza Rápida Prioritária
            </h2>
          </div>
        </div>
        <Badge variant={urgentChores.length > 0 ? 'error' : 'success'} size="sm" dot>
          {urgentChores.length} pendentes
        </Badge>
      </div>

      {urgentChores.length === 0 ? (
        <div className="py-7 text-center text-gray-400 rounded-xl bg-gray-50/70 dark:bg-gray-800/30 border border-dashed border-gray-200/70 dark:border-gray-700/60">
          <div className="w-10 h-10 rounded-full bg-success-50 dark:bg-success-950/60 border border-success-200 dark:border-success-900/40 text-success-600 flex items-center justify-center mx-auto mb-2 shadow-u-xs">
            <Check className="w-5 h-5 stroke-[2.5]" />
          </div>
          <p className="text-xs font-bold text-gray-800 dark:text-gray-200">Tudo em dia!</p>
          <p className="text-[11px] text-gray-500 mt-0.5">Nenhuma tarefa crítica pendente no momento.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {urgentChores.map((chore) => {
            const isOverdue = chore.currentUrgencyRatio > 1.0;
            const xpWithBonus = isOverdue ? Math.round(chore.xpReward * 1.5) : chore.xpReward;
            const roomName = roomMap.get(chore.roomId) || 'Geral';

            return (
              <div
                key={chore.id}
                className="group/item flex items-center justify-between gap-3 p-3.5 rounded-xl bg-gray-50/90 dark:bg-gray-800/50 border border-gray-200/70 dark:border-gray-700/60 hover:border-brand-300/70 dark:hover:border-brand-700/60 transition-all shadow-u-xs"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                      {roomName}
                    </span>
                    {isOverdue && (
                      <Badge variant="error" size="sm">
                        Atrasada
                      </Badge>
                    )}
                  </div>
                  <h3 className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate">
                    {chore.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {humanizeTimestamp(chore.lastCompletedAt, now)}
                    </span>
                    <span>•</span>
                    <span className="font-mono text-warning-600 dark:text-warning-400 font-bold">
                      +{xpWithBonus} XP {isOverdue && '(1.5x)'}
                    </span>
                  </div>
                </div>

                <button
                  disabled={chore.cooldown.isBlocked}
                  onClick={() => completeChore(chore.id)}
                  className={`u-btn-shine flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 ease-spring active:scale-95 shadow-u-xs ${
                    chore.cooldown.isBlocked
                      ? 'bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                      : isOverdue
                      ? 'bg-gradient-to-b from-error-500 to-error-600 hover:from-error-600 hover:to-error-700 text-white'
                      : 'bg-gradient-to-b from-success-500 to-success-600 hover:from-success-600 hover:to-success-700 text-white'
                  }`}
                  title={chore.cooldown.isBlocked ? chore.cooldown.reason : 'Marcar como concluída'}
                >
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>{chore.cooldown.isBlocked ? 'Em pausa' : 'Concluir'}</span>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

