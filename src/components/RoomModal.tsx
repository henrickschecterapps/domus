import React, { useState } from 'react';
import { Room } from '../types';
import { useApp } from '../context/AppContext';
import {
  calculateChoreUrgency,
  humanizeTimestamp,
  checkChoreCooldown,
} from '../utils/cleaningMath';
import { BottomSheet } from './BottomSheet';
import { SegmentedControl } from './SegmentedControl';
import { Check, Clock, Plus, AlertTriangle, ShieldAlert, Search } from 'lucide-react';

interface RoomModalProps {
  room: Room;
  onClose: () => void;
}

export const RoomModal: React.FC<RoomModalProps> = ({ room, onClose }) => {
  const { chores, completeChore, addChore, resetChoreTimer } = useApp();
  const [tab, setTab] = useState<'pending' | 'completed'>('pending');
  const [search, setSearch] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDays, setNewDays] = useState('7');
  const [newXp, setNewXp] = useState('25');

  const now = Date.now();
  const roomChores = chores.filter((c) => c.roomId === room.id);

  const pendingChores = roomChores.filter((c) => {
    const cooldown = checkChoreCooldown(c.lastCompletedAt, now);
    return !cooldown.isBlocked;
  });

  const completedChores = roomChores.filter((c) => {
    const cooldown = checkChoreCooldown(c.lastCompletedAt, now);
    return cooldown.isBlocked;
  });

  const activeList = (tab === 'pending' ? pendingChores : completedChores).filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreateChore = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    addChore(room.id, newTitle.trim(), parseInt(newDays) || 7, parseInt(newXp) || 25);
    setNewTitle('');
    setShowAddForm(false);
  };

  return (
    <BottomSheet
      isOpen={true}
      onClose={onClose}
      title={room.name}
      subtitle={`${room.statusScore}% Saúde do Ambiente • ${roomChores.length} tarefas`}
    >
      <div className="space-y-4">
        {/* iOS Segmented Control */}
        <SegmentedControl
          options={[
            { id: 'pending', label: 'Pendentes', count: pendingChores.length },
            { id: 'completed', label: 'Concluídas Recentemente', count: completedChores.length },
          ]}
          value={tab}
          onChange={(v) => setTab(v)}
        />

        {/* Search filter if more than 3 chores */}
        {roomChores.length > 3 && (
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar tarefas neste cômodo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#2C2C2E] border border-black/5 dark:border-white/5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
            />
          </div>
        )}

        {/* Chores List */}
        <div className="space-y-2.5">
          {activeList.length === 0 ? (
            <div className="py-8 text-center text-slate-400">
              <Check className="w-8 h-8 mx-auto text-[#34C759] mb-2" />
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {tab === 'pending' ? 'Tudo em dia nesta seção!' : 'Nenhuma tarefa em pausa recente.'}
              </p>
            </div>
          ) : (
            activeList.map((chore) => {
              const { urgencyRatio } = calculateChoreUrgency(chore, now);
              const isOverdue = urgencyRatio > 1.0;
              const cooldown = checkChoreCooldown(chore.lastCompletedAt, now);
              const xpWithBonus = isOverdue ? Math.round(chore.xpReward * 1.5) : chore.xpReward;

              return (
                <div
                  key={chore.id}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#2C2C2E]/60 border border-slate-100 dark:border-white/5 flex flex-col justify-between gap-3 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                          A cada {chore.frequencyDays} {chore.frequencyDays === 1 ? 'dia' : 'dias'}
                        </span>
                        {isOverdue && (
                          <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-[#FF3B30]/15 text-[#FF3B30] flex items-center gap-1">
                            <AlertTriangle className="w-2.5 h-2.5" />
                            Atrasada
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        {chore.title}
                      </h3>

                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {chore.lastCompletedBy
                          ? `Por ${chore.lastCompletedBy.displayName} (${humanizeTimestamp(chore.lastCompletedAt, now)})`
                          : humanizeTimestamp(chore.lastCompletedAt, now)}
                      </p>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span className="text-xs font-black text-[#FF9500] block">
                        +{xpWithBonus} XP
                      </span>
                      {isOverdue && (
                        <span className="text-[9px] text-[#FF9500] font-bold">
                          Bônus 1.5x
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions & Cooldown */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200/50 dark:border-white/5">
                    {cooldown.isBlocked ? (
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                        <ShieldAlert className="w-3.5 h-3.5 text-[#FF9500]" />
                        <span className="text-[11px]">
                          Pausa ({cooldown.remainingMinutes} min)
                        </span>
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        {isOverdue ? 'Precisa de ação' : 'Em conformidade'}
                      </span>
                    )}

                    <div className="flex items-center gap-2">
                      {/* Simulate delay */}
                      <button
                        onClick={() => resetChoreTimer(chore.id, chore.frequencyDays * 24 + 12)}
                        className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 px-2 py-1 rounded-lg bg-slate-200/60 dark:bg-white/5"
                        title="Simular atraso para testar algoritmo"
                      >
                        Atrasar
                      </button>

                      {/* iOS Style Action Button */}
                      <button
                        disabled={cooldown.isBlocked}
                        onClick={() => completeChore(chore.id)}
                        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 ${
                          cooldown.isBlocked
                            ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                            : isOverdue
                            ? 'bg-[#FF3B30] hover:bg-[#D70015] text-white shadow-sm'
                            : 'bg-[#34C759] hover:bg-[#248A3D] text-white shadow-sm'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>{cooldown.isBlocked ? 'Em pausa' : 'Concluir'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Add Chore section */}
        {showAddForm ? (
          <form onSubmit={handleCreateChore} className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200/60 dark:border-gray-800 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 font-display">
              Nova Tarefa para {room.name}
            </h4>
            <div>
              <input
                type="text"
                placeholder="Título (ex: Limpar espelhos)"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-gray-750 border border-gray-200 dark:border-gray-700 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-[10px] text-gray-500 dark:text-gray-400 block mb-1">Frequência (dias)</label>
                <input
                  type="number"
                  min="1"
                  max="90"
                  value={newDays}
                  onChange={(e) => setNewDays(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-gray-750 border border-gray-200 dark:border-gray-700 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/30 font-display font-semibold"
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-500 dark:text-gray-400 block mb-1">XP Recompensa</label>
                <input
                  type="number"
                  min="5"
                  max="100"
                  value={newXp}
                  onChange={(e) => setNewXp(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-gray-750 border border-gray-200 dark:border-gray-700 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/30 font-display font-semibold"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2.5 pt-2 border-t border-gray-200/60 dark:border-gray-750">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1.5 rounded-xl text-xs text-gray-500 hover:text-gray-900 dark:hover:text-white font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-u-xs transition-all active:scale-95"
              >
                Adicionar
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setShowAddForm(true)}
            className="w-full py-3 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-800 hover:border-brand-400 text-gray-500 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar Tarefa a este Cômodo</span>
          </button>
        )}
      </div>
    </BottomSheet>
  );
};
