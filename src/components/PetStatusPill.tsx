import React from 'react';
import { useApp } from '../context/AppContext';
import { Sparkles, AlertTriangle, CheckCircle2, ChevronRight } from 'lucide-react';
import { Badge } from './untitled/Badge';

interface PetStatusPillProps {
  onNavigateToPet?: () => void;
}

export const PetStatusPill: React.FC<PetStatusPillProps> = ({ onNavigateToPet }) => {
  const { pets, pet, scoopLitterBox, walkDog } = useApp();
  const now = Date.now();

  const isCat = pet.species === 'cat';
  const isDog = pet.species === 'dog';

  // Cat litter metrics
  const hoursSinceScoop = pet.litterBox
    ? Math.floor((now - pet.litterBox.lastScoopedAt) / (3600 * 1000))
    : 0;
  const isScoopUrgent = isCat && pet.litterBox ? hoursSinceScoop >= 24 : false;

  // Dog walk metrics
  const walksToday = pet.walks?.walksToday || 0;
  const targetWalks = pet.walks?.targetWalksPerDay || 2;
  const isWalkPending = isDog && walksToday < targetWalks;

  const isUrgent = isScoopUrgent || (isDog && walksToday === 0);

  return (
    <div
      className={`rounded-2xl border p-4 transition-all shadow-u-xs ${
        isUrgent
          ? 'bg-warning-25 dark:bg-warning-950/20 border-warning-200 dark:border-warning-900/40 text-gray-900 dark:text-white'
          : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div
          onClick={onNavigateToPet}
          className="flex items-center gap-3 cursor-pointer min-w-0 flex-1 group"
        >
          <div className="relative flex-shrink-0">
            <img
              src={pet.photoUrl}
              alt={pet.name}
              className="w-12 h-12 rounded-xl object-cover ring-2 ring-gray-100 dark:ring-gray-800 group-hover:scale-105 transition-transform"
            />
            <span
              className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-gray-900 ${
                isUrgent ? 'bg-error-500' : 'bg-success-500'
              }`}
            />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-900 dark:text-white">{pet.name}</span>
              <span className="text-[11px] text-gray-500 dark:text-gray-400">({pet.breed || (isCat ? 'Gato' : 'Cão')})</span>
              <Badge variant={isUrgent ? 'warning' : 'success'} size="sm" dot>
                {isUrgent ? 'Atenção' : 'Em Dia'}
              </Badge>
            </div>
            <p className="text-xs font-medium truncate mt-1">
              {isCat ? (
                isScoopUrgent ? (
                  <span className="text-warning-700 dark:text-warning-300 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 text-warning-500" />
                    Areia pendente (há {hoursSinceScoop}h)
                  </span>
                ) : (
                  <span className="text-success-700 dark:text-success-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 text-success-500" />
                    Areia limpa hoje
                  </span>
                )
              ) : isDog ? (
                isWalkPending ? (
                  <span className="text-warning-700 dark:text-warning-300 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 text-warning-500" />
                    {walksToday}/{targetWalks} passeios hoje
                  </span>
                ) : (
                  <span className="text-success-700 dark:text-success-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 text-success-500" />
                    Passeios concluídos hoje
                  </span>
                )
              ) : (
                <span className="text-success-700 dark:text-success-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 text-success-500" />
                  Cuidados em dia
                </span>
              )}
            </p>
          </div>
        </div>

        {isCat && isScoopUrgent ? (
          <button
            onClick={() => scoopLitterBox(pet.id)}
            className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-warning-600 hover:bg-warning-700 text-white font-semibold text-xs shadow-u-xs transition-all active:scale-95 flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Recolher</span>
          </button>
        ) : isDog && isWalkPending ? (
          <button
            onClick={() => walkDog(pet.id)}
            className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs shadow-u-xs transition-all active:scale-95 flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Passear</span>
          </button>
        ) : (
          <button
            onClick={onNavigateToPet}
            className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 px-2 py-1 transition-colors flex items-center gap-0.5"
          >
            <span>Ver Pet</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
