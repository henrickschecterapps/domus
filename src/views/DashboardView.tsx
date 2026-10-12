import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ScoreRing } from '../components/ScoreRing';
import { QuickCleanWidget } from '../components/QuickCleanWidget';
import { PetStatusPill } from '../components/PetStatusPill';
import { LeaderboardWidget } from '../components/LeaderboardWidget';
import { CalendarWidget } from '../components/CalendarWidget';
import { CalendarModal } from '../components/CalendarModal';
import { StatCard } from '../components/untitled/StatCard';
import { Activity, Sparkles, AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react';

interface DashboardViewProps {
  onNavigateTab: (tab: 'dashboard' | 'cleaning' | 'pet' | 'pantry' | 'finance') => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigateTab }) => {
  const { house, rooms, chores, choreLogs } = useApp();
  const [showCalendarModal, setShowCalendarModal] = useState(false);

  const cleanRooms = rooms.filter((r) => r.statusLevel === 'clean').length;
  const warningRooms = rooms.filter((r) => r.statusLevel === 'warning').length;
  const urgentRooms = rooms.filter((r) => r.statusLevel === 'urgent').length;

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-200 w-full">
      {/* Global House Health Score Ring */}
      <ScoreRing
        score={house.houseScore}
        label="Score Geral da Residência"
        sublabel={
          house.houseScore >= 80
            ? 'Todos os 9 cômodos estão sob controle, limpos e com rotinas em dia.'
            : house.houseScore >= 50
            ? 'Existem ambientes acumulando urgência que merecem atenção nesta semana.'
            : 'Múltiplos cômodos ultrapassaram o limite de tolerância sanitária.'
        }
      />

      {/* Untitled UI Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Cômodos Limpos"
          value={cleanRooms}
          subtitle="de 9 ambientes totais"
          badgeText="Em dia"
          badgeVariant="success"
          badgeDot
          icon={CheckCircle2}
          iconColor="text-success-600 dark:text-success-400"
          iconBgColor="bg-success-50 dark:bg-success-950/50 border border-success-100 dark:border-success-900/30"
          onClick={() => onNavigateTab('cleaning')}
        />

        <StatCard
          title="Em Atenção"
          value={warningRooms}
          subtitle="rotinas atrasando"
          badgeText="Alerta"
          badgeVariant="warning"
          badgeDot
          icon={AlertTriangle}
          iconColor="text-warning-600 dark:text-warning-400"
          iconBgColor="bg-warning-50 dark:bg-warning-950/50 border border-warning-100 dark:border-warning-900/30"
          onClick={() => onNavigateTab('cleaning')}
        />

        <StatCard
          title="Urgentes"
          value={urgentRooms}
          subtitle="precisam de ação hoje"
          badgeText={urgentRooms > 0 ? "Ação Prioritária" : "Zero pendências"}
          badgeVariant={urgentRooms > 0 ? "error" : "success"}
          badgeDot={urgentRooms > 0}
          icon={AlertCircle}
          iconColor="text-error-600 dark:text-error-400"
          iconBgColor="bg-error-50 dark:bg-error-950/50 border border-error-100 dark:border-error-900/30"
          onClick={() => onNavigateTab('cleaning')}
        />
      </div>

      {/* Grid: 1 col on mobile, 2 on tablet, 3 on large desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 items-start">
        {/* Column 1: Quick Clean & Pet Widget */}
        <div className="space-y-5">
          <QuickCleanWidget />
          <PetStatusPill onNavigateToPet={() => onNavigateTab('pet')} />
        </div>

        {/* Column 2: Agenda & Calendário Inteligente */}
        <div className="space-y-5">
          <CalendarWidget onOpenFullCalendar={() => setShowCalendarModal(true)} />
        </div>

        {/* Column 3: Weekly Leaderboard & Recent Activity */}
        <div className="space-y-5 md:col-span-2 xl:col-span-1">
          <LeaderboardWidget />

          {choreLogs.length > 0 && (
            <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 shadow-u-xs">
              <div className="flex items-center gap-2 mb-3.5 text-gray-900 dark:text-white">
                <Activity className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider">Atividades Recentes</h3>
              </div>
              <div className="space-y-2.5">
                {choreLogs.slice(0, 4).map((log) => {
                  const chore = chores.find((c) => c.id === log.choreId);
                  const room = rooms.find((r) => r.id === log.roomId);
                  return (
                    <div
                      key={log.id}
                      className="flex items-center justify-between text-xs py-2 border-b border-gray-100 dark:border-gray-800/80 last:border-none"
                    >
                      <div className="min-w-0 pr-2">
                        <p className="text-gray-900 dark:text-gray-100 font-semibold truncate">
                          {chore?.title || 'Tarefa concluída'}
                        </p>
                        <span className="text-[11px] text-gray-500 dark:text-gray-400">
                          {room?.name} • por <span className="font-medium text-gray-700 dark:text-gray-300">{log.completedByName}</span>
                        </span>
                      </div>
                      <span className="text-warning-600 dark:text-warning-400 font-bold text-xs flex-shrink-0 bg-warning-50 dark:bg-warning-950/60 px-2 py-0.5 rounded-full border border-warning-200 dark:border-warning-900/40">
                        +{log.xpEarned} XP
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Full Shared Calendar Modal */}
      <CalendarModal
        isOpen={showCalendarModal}
        onClose={() => setShowCalendarModal(false)}
      />
    </div>
  );
};
