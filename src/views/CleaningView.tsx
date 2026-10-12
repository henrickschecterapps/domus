import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { RoomCard } from '../components/RoomCard';
import { RoomModal } from '../components/RoomModal';
import { Room, RoomStatusLevel } from '../types';
import { calculateChoreUrgency } from '../utils/cleaningMath';
import { Sparkles } from 'lucide-react';
import { SegmentedControl } from '../components/SegmentedControl';
import { Badge } from '../components/untitled/Badge';

export const CleaningView: React.FC = () => {
  const { rooms, chores } = useApp();
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
            9 Ambientes Mapeados
          </Badge>
        </div>

        {/* Untitled UI Segmented Filter */}
        <SegmentedControl
          options={[
            { id: 'all', label: 'Todos', count: 9 },
            { id: 'urgent', label: 'Urgentes', count: urgentCount },
            { id: 'warning', label: 'Atenção', count: warningCount },
            { id: 'clean', label: 'Limpos', count: cleanCount },
          ]}
          value={filter}
          onChange={(v) => setFilter(v)}
        />
      </div>

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
