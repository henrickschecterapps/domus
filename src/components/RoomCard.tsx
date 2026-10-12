import React from 'react';
import { Room } from '../types';
import { humanizeTimestamp } from '../utils/cleaningMath';
import {
  Sofa,
  UtensilsCrossed,
  Shirt,
  BedDouble,
  Monitor,
  Bed,
  Bath,
  ShowerHead,
  DoorClosed,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Badge, BadgeVariant } from './untitled/Badge';

interface RoomCardProps {
  room: Room;
  totalChores: number;
  urgentChoresCount: number;
  onClick: () => void;
}

const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  Sofa,
  UtensilsCrossed,
  Shirt,
  BedDouble,
  Monitor,
  Bed,
  Bath,
  ShowerHead,
  DoorClosed,
};

export const RoomCard: React.FC<RoomCardProps> = ({
  room,
  totalChores,
  urgentChoresCount,
  onClick,
}) => {
  const IconComponent = (room.icon && ICON_MAP[room.icon]) || Sparkles;

  let badgeVariant: BadgeVariant = 'success';
  let badgeText = 'Limpo';
  let progressBarColor = 'bg-success-500';

  if (room.statusLevel === 'urgent' || room.statusScore < 50) {
    badgeVariant = 'error';
    badgeText = 'Urgente';
    progressBarColor = 'bg-error-500';
  } else if (room.statusLevel === 'warning' || room.statusScore < 80) {
    badgeVariant = 'warning';
    badgeText = 'Atenção';
    progressBarColor = 'bg-warning-500';
  }

  return (
    <div
      onClick={onClick}
      className="group relative flex flex-col justify-between p-4 sm:p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-brand-300 dark:hover:border-brand-700/60 transition-all duration-200 cursor-pointer shadow-u-xs hover:shadow-u-sm active:scale-[0.99]"
    >
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-950/60 border border-brand-100 dark:border-brand-900/30 flex items-center justify-center text-brand-600 dark:text-brand-400 group-hover:scale-105 transition-transform shadow-u-xs">
            <IconComponent className="w-5 h-5 stroke-[2]" />
          </div>
          <Badge variant={badgeVariant} dot size="sm">
            {badgeText}
          </Badge>
        </div>

        <h3 className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors leading-tight">
          {room.name}
        </h3>

        <div className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400 mt-1.5">
          <Clock className="w-3 h-3 flex-shrink-0 text-gray-400" />
          <span className="truncate">{humanizeTimestamp(room.lastCleanedAt)}</span>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1.5">
          <span>{urgentChoresCount > 0 ? `${urgentChoresCount} pendente(s)` : `${totalChores} rotinas`}</span>
          <span className="font-bold text-gray-900 dark:text-white">{room.statusScore}%</span>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${progressBarColor}`}
            style={{ width: `${room.statusScore}%` }}
          />
        </div>
      </div>
    </div>
  );
};
