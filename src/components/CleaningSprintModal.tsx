import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Chore } from '../types';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Check,
  Flame,
  Award,
  Zap,
  Clock,
} from 'lucide-react';
import { Button } from './untitled/Button';
import { triggerHaptic } from '../utils/haptics';
import { playSuccessChime, playCoinSound } from '../utils/soundEffects';
import { fireCelebrationConfetti } from '../utils/confetti';

interface CleaningSprintModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CleaningSprintModal: React.FC<CleaningSprintModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { chores, rooms, completeChore, currentUser, soundEnabled } = useApp();

  const [secondsRemaining, setSecondsRemaining] = useState(15 * 60); // 15 minutes
  const [isActive, setIsActive] = useState(false);
  const [completedSprintChoreIds, setCompletedSprintChoreIds] = useState<string[]>([]);
  const [bonusXpEarned, setBonusXpEarned] = useState(0);

  // Pick up to 5 quick candidate chores
  const sprintCandidates = chores
    .filter((c) => (c.estimatedMinutes || 15) <= 20)
    .slice(0, 5);

  useEffect(() => {
    let interval: any = null;
    if (isActive && secondsRemaining > 0) {
      interval = setInterval(() => {
        setSecondsRemaining((sec) => sec - 1);
      }, 1000);
    } else if (secondsRemaining === 0 && isActive) {
      setIsActive(false);
      fireCelebrationConfetti();
      playSuccessChime(soundEnabled);
      triggerHaptic('success');
    }
    return () => clearInterval(interval);
  }, [isActive, secondsRemaining, soundEnabled]);

  if (!isOpen) return null;

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const totalSprintSeconds = 15 * 60;
  const progressPercent = ((totalSprintSeconds - secondsRemaining) / totalSprintSeconds) * 100;

  const handleStartPause = () => {
    triggerHaptic('medium');
    setIsActive(!isActive);
  };

  const handleReset = () => {
    triggerHaptic('light');
    setIsActive(false);
    setSecondsRemaining(15 * 60);
  };

  const handleCompleteSprintChore = (chore: Chore) => {
    if (completedSprintChoreIds.includes(chore.id)) return;

    const res = completeChore(chore.id);
    if (res.success) {
      const bonus = Math.round((res.earnedXp || chore.xpReward) * 0.5);
      setBonusXpEarned((prev) => prev + (res.earnedXp || chore.xpReward) + bonus);
      setCompletedSprintChoreIds((prev) => [...prev, chore.id]);
      fireCelebrationConfetti();
      playCoinSound(soundEnabled);
      triggerHaptic('success');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-gray-900 rounded-3xl border border-gray-800 p-6 space-y-5 shadow-u-xl text-white animate-u-scale relative overflow-hidden">
        {/* Ambient Glow */}
        <div className="pointer-events-none absolute -top-20 -right-20 w-60 h-60 rounded-full bg-brand-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 w-60 h-60 rounded-full bg-amber-500/15 blur-3xl" />

        {/* Header */}
        <div className="relative z-10 flex items-center justify-between pb-3 border-b border-gray-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-brand-600 text-white flex items-center justify-center shadow-u-glow">
              <Zap className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold font-display tracking-tight text-white">
                  Sprint Faxina Express
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-black bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  1.5x XP BÔNUS
                </span>
              </div>
              <p className="text-xs text-gray-400">
                15 minutos de foco total para transformar o ambiente
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Timer Display */}
        <div className="relative z-10 p-5 rounded-3xl bg-gray-950/60 border border-gray-800 text-center space-y-3">
          <div className="text-5xl sm:text-6xl font-black font-mono tracking-tight text-white drop-shadow-[0_0_20px_rgba(99,102,241,0.3)]">
            {timeFormatted}
          </div>

          {/* Progress bar */}
          <div className="w-full h-2 rounded-full bg-gray-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-brand-500 via-amber-500 to-emerald-500 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex items-center justify-center gap-3 pt-1">
            <button
              onClick={handleStartPause}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-2xl font-bold text-xs shadow-u-md transition-all active:scale-95 ${
                isActive
                  ? 'bg-amber-600 hover:bg-amber-500 text-white'
                  : 'bg-gradient-to-r from-brand-600 to-violet-600 hover:from-brand-500 hover:to-violet-500 text-white shadow-u-glow'
              }`}
            >
              {isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{isActive ? 'Pausar Sprint' : secondsRemaining === totalSprintSeconds ? 'Iniciar Sprint' : 'Continuar'}</span>
            </button>

            <button
              onClick={handleReset}
              className="p-2.5 rounded-2xl bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
              title="Reiniciar temporizador"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Sprint XP Earned counter */}
        {bonusXpEarned > 0 && (
          <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-500/20 via-brand-500/20 to-emerald-500/20 border border-amber-500/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-white">XP Acumulado no Sprint:</span>
            </div>
            <span className="font-mono font-black text-amber-400 text-sm">
              +{bonusXpEarned} XP
            </span>
          </div>
        )}

        {/* Micro-Tasks Checklist */}
        <div className="relative z-10 space-y-2.5">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 font-mono">
              Micro-Tarefas Sugeridas
            </h4>
            <span className="text-[10px] text-gray-500 font-mono">
              {completedSprintChoreIds.length}/{sprintCandidates.length} feitas
            </span>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {sprintCandidates.map((chore) => {
              const room = rooms.find((r) => r.id === chore.roomId);
              const isDone = completedSprintChoreIds.includes(chore.id);

              return (
                <div
                  key={chore.id}
                  className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                    isDone
                      ? 'bg-gray-950/40 border-gray-800 opacity-60'
                      : 'bg-gray-800/60 border-gray-700/80 hover:border-brand-500'
                  }`}
                >
                  <div className="min-w-0">
                    <p className={`text-xs font-bold truncate ${isDone ? 'line-through text-gray-500' : 'text-white'}`}>
                      {chore.title}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {room?.name} • ~{chore.estimatedMinutes || 15} min
                    </p>
                  </div>

                  <button
                    onClick={() => handleCompleteSprintChore(chore)}
                    disabled={isDone}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-[11px] transition-all flex-shrink-0 ${
                      isDone
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 cursor-default'
                        : 'bg-brand-600 hover:bg-brand-500 text-white shadow-u-xs active:scale-95'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{isDone ? 'Concluída' : `+${Math.round(chore.xpReward * 1.5)} XP`}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="pt-2 text-center">
          <button
            onClick={onClose}
            className="text-xs font-semibold text-gray-400 hover:text-white transition-colors"
          >
            Fechar Sprint
          </button>
        </div>
      </div>
    </div>
  );
};
