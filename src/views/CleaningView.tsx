import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { RoomCard } from '../components/RoomCard';
import { RoomModal } from '../components/RoomModal';
import { Room, RoomStatusLevel } from '../types';
import { calculateChoreUrgency } from '../utils/cleaningMath';
import { Sparkles, Gift } from 'lucide-react';
import { SegmentedControl } from '../components/SegmentedControl';
import { Badge } from '../components/untitled/Badge';

export const CleaningView: React.FC = () => {
  const { rooms, chores, house, currentUser, claimHouseReward } = useApp();
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [filter, setFilter] = useState<'all' | RoomStatusLevel>('all');

  const now = Date.now();

  const cleanCount = rooms.filter((r) => r.statusLevel === 'clean').length;
  const warningCount = rooms.filter((r) => r.statusLevel === 'warning').length;
  const urgentCount = rooms.filter((r) => r.statusLevel === 'urgent').length;

  const filteredRooms = rooms.filter((room) => {
    if (filter === 'all') return true;
    return room.statusLevel === filter;
  });

  return (
    <div className="space-y-5 pb-20 animate-in fade-in duration-200 w-full">
      {/* Header & Filter Controls */}
      <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-u-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-50 dark:bg-brand-950/60 border border-brand-100 dark:border-brand-900/30 text-brand-600 dark:text-brand-400 flex items-center justify-center shadow-u-xs">
              <Sparkles className="w-5 h-5 stroke-[2]" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider font-display">
                Cômodos & Gestão de Ambientes
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Monitore o índice de higiene e as rotinas preventivas
              </p>
            </div>
          </div>
          <Badge variant="brand" size="md">
            {rooms.length} Ambientes Mapeados
          </Badge>
        </div>

        {/* Untitled UI Segmented Filter */}
        <SegmentedControl
          options={[
            { id: 'all', label: 'Todos', count: rooms.length },
            { id: 'urgent', label: 'Urgentes', count: urgentCount },
            { id: 'warning', label: 'Atenção', count: warningCount },
            { id: 'clean', label: 'Limpos', count: cleanCount },
          ]}
          value={filter}
          onChange={(v) => setFilter(v)}
        />
      </div>

      {/* Active House Rewards showcase banner */}
      {(house.rewards || []).length > 0 && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-brand-500/10 to-emerald-500/10 border border-amber-200/60 dark:border-amber-900/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-u-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-900 dark:text-white">
                Recompensas Ativas do Lar ({house.rewards?.length})
              </h4>
              <p className="text-[11px] text-gray-600 dark:text-gray-400">
                Seu saldo: <strong className="text-amber-600 dark:text-amber-400 font-bold">{currentUser.totalXP} XP</strong>. Conclua tarefas para resgatar folga de louça ou mimos da casa!
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-1 sm:pb-0">
            {(house.rewards || []).slice(0, 3).map((reward) => {
              const canClaim = currentUser.totalXP >= reward.requiredXP;
              return (
                <button
                  key={reward.id}
                  onClick={() => canClaim && claimHouseReward(reward.id, currentUser.userId)}
                  disabled={!canClaim}
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-xl border flex items-center gap-1.5 transition-all flex-shrink-0 ${
                    canClaim
                      ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600 shadow-u-xs active:scale-95 cursor-pointer'
                      : 'bg-white/60 dark:bg-gray-800/60 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 cursor-default'
                  }`}
                  title={reward.description}
                >
                  <span>{reward.title}</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-black/10 dark:bg-white/10 font-bold">
                    {reward.requiredXP} XP
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Rooms Grid: responsive 2 to 5 columns on wide monitors */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {filteredRooms.map((room) => {
          const roomChores = chores.filter((c) => c.roomId === room.id);
          const urgentChores = roomChores.filter((c) => {
            const { urgencyRatio } = calculateChoreUrgency(c, now);
            return urgencyRatio > 1.0;
          }).length;

          return (
            <RoomCard
              key={room.id}
              room={room}
              totalChores={roomChores.length}
              urgentChoresCount={urgentChores}
              onClick={() => setSelectedRoom(room)}
            />
          );
        })}
      </div>

      {/* Room Detail BottomSheet */}
      {selectedRoom && (
        <RoomModal
          room={selectedRoom}
          onClose={() => setSelectedRoom(null)}
        />
      )}
    </div>
  );
};
