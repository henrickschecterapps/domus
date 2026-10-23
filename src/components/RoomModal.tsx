import React, { useState, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Room, Chore } from '../types';
import { useApp } from '../context/AppContext';
import {
  calculateChoreUrgency,
  humanizeTimestamp,
  checkChoreCooldown,
} from '../utils/cleaningMath';
import { BottomSheet } from './BottomSheet';
import { SegmentedControl } from './SegmentedControl';
import {
  Check,
  Clock,
  Plus,
  AlertTriangle,
  ShieldAlert,
  Search,
  RotateCw,
  Camera,
  Image as ImageIcon,
  X,
  Sparkles,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
} from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';
import { playSuccessChime } from '../utils/soundEffects';
import { getSuggestedChoresForRoom, SuggestedChoreTemplate } from '../data/suggestedChores';

interface RoomModalProps {
  room: Room;
  onClose: () => void;
}

export const RoomModal: React.FC<RoomModalProps> = ({ room, onClose }) => {
  const {
    chores,
    completeChore,
    addChore,
    updateChore,
    deleteChore,
    resetChoreTimer,
    members,
    currentUser,
    showToast,
  } = useApp();

  const [tab, setTab] = useState<'pending' | 'completed'>('pending');
  const [search, setSearch] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // New chore form state
  const [newTitle, setNewTitle] = useState('');
  const [newDays, setNewDays] = useState('7');
  const [newXp, setNewXp] = useState('25');
  const [newDifficulty, setNewDifficulty] = useState<'facil' | 'medio' | 'pesado'>('medio');
  const [newMinutes, setNewMinutes] = useState('20');

  // Edit chore state
  const [editingChore, setEditingChore] = useState<Chore | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDays, setEditDays] = useState('7');
  const [editXp, setEditXp] = useState('25');
  const [editDifficulty, setEditDifficulty] = useState<'facil' | 'medio' | 'pesado'>('medio');
  const [editMinutes, setEditMinutes] = useState('20');
  const [editAssignedTo, setEditAssignedTo] = useState<string>('');

  // Delete chore confirmation modal state
  const [deletingChore, setDeletingChore] = useState<Chore | null>(null);

  // Proof photo completion modal state
  const [completingChoreId, setCompletingChoreId] = useState<string | null>(null);
  const [proofPhotoData, setProofPhotoData] = useState<string | null>(null);
  const [viewingProofUrl, setViewingProofUrl] = useState<string | null>(null);
  const proofInputRef = useRef<HTMLInputElement>(null);

  const now = Date.now();
  const roomChores = chores.filter((c) => c.roomId === room.id);

  // Suggested chores catalog specifically for this room
  const suggestedTemplates = useMemo(() => {
    return getSuggestedChoresForRoom(room);
  }, [room]);

  const isTemplateAdded = (templateTitle: string) => {
    return roomChores.some(
      (c) => c.title.trim().toLowerCase() === templateTitle.trim().toLowerCase()
    );
  };

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
    addChore(
      room.id,
      newTitle.trim(),
      parseInt(newDays) || 7,
      parseInt(newXp) || 25,
      newDifficulty,
      parseInt(newMinutes) || 20
    );
    setNewTitle('');
    setShowAddForm(false);
  };

  const handleAddSuggestedChore = (template: SuggestedChoreTemplate) => {
    addChore(
      room.id,
      template.title,
      template.frequencyDays,
      template.xpReward,
      template.difficulty,
      template.estimatedMinutes
    );
  };

  const handleCustomizeSuggestedChore = (template: SuggestedChoreTemplate) => {
    setNewTitle(template.title);
    setNewDays(String(template.frequencyDays));
    setNewXp(String(template.xpReward));
    setNewDifficulty(template.difficulty);
    setNewMinutes(String(template.estimatedMinutes));
    setShowAddForm(true);
    setShowSuggestions(false);
  };

  const handleStartEdit = (chore: Chore) => {
    setEditingChore(chore);
    setEditTitle(chore.title);
    setEditDays(String(chore.frequencyDays));
    setEditXp(String(chore.xpReward));
    setEditDifficulty(chore.difficulty || 'medio');
    setEditMinutes(String(chore.estimatedMinutes || 20));
    setEditAssignedTo(chore.assignedTo || '');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingChore || !editTitle.trim()) return;
    updateChore(editingChore.id, {
      title: editTitle.trim(),
      frequencyDays: parseInt(editDays) || 7,
      xpReward: parseInt(editXp) || 25,
      difficulty: editDifficulty,
      estimatedMinutes: parseInt(editMinutes) || 20,
      assignedTo: editAssignedTo || null,
    });
    setEditingChore(null);
  };

  const handleConfirmDelete = () => {
    if (!deletingChore) return;
    deleteChore(deletingChore.id);
    setDeletingChore(null);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      showToast('Imagem muito grande. Máximo 3MB.', 'warning');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setProofPhotoData(reader.result as string);
      showToast('Foto comprovante pronta!', 'success');
    };
    reader.readAsDataURL(file);
  };

  const handleConfirmCompletion = () => {
    if (!completingChoreId) return;
    completeChore(completingChoreId, proofPhotoData || undefined);
    setCompletingChoreId(null);
    setProofPhotoData(null);
  };

  return (
    <BottomSheet
      isOpen={true}
      onClose={onClose}
      title={room.name}
      subtitle={`${room.statusScore}% Saúde do Ambiente • ${roomChores.length} tarefas cadastradas`}
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

        {/* Smart Room Suggestions Card & Drawer */}
        <div className="rounded-2xl border border-brand-200/80 dark:border-brand-900/60 bg-gradient-to-r from-brand-50/70 via-indigo-50/40 to-violet-50/70 dark:from-brand-950/40 dark:via-indigo-950/30 dark:to-violet-950/40 overflow-hidden shadow-u-xs transition-all">
          <button
            type="button"
            onClick={() => setShowSuggestions(!showSuggestions)}
            className="w-full p-3.5 flex items-center justify-between text-left transition-colors hover:bg-brand-100/40 dark:hover:bg-brand-900/20"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-violet-600 text-white flex items-center justify-center shadow-u-glow flex-shrink-0">
                <Sparkles className="w-4 h-4 stroke-[2.2]" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-extrabold text-gray-900 dark:text-white uppercase tracking-wider font-display">
                    Sugestões para {room.name}
                  </h4>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-brand-500/15 text-brand-700 dark:text-brand-300">
                    {suggestedTemplates.length} disponíveis
                  </span>
                </div>
                <p className="text-[11px] text-gray-600 dark:text-gray-400 truncate">
                  Tarefas recomendadas com 1 toque para adicionar a este cômodo
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-brand-600 dark:text-brand-400 text-xs font-bold pl-2 flex-shrink-0">
              <span className="hidden xs:inline">{showSuggestions ? 'Ocultar' : 'Explorar'}</span>
              {showSuggestions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </button>

          {showSuggestions && (
            <div className="p-3.5 pt-0 space-y-2 border-t border-brand-100/80 dark:border-brand-900/40 max-h-72 overflow-y-auto pr-1">
              {suggestedTemplates.map((template) => {
                const added = isTemplateAdded(template.title);

                return (
                  <div
                    key={template.id}
                    className={`p-3 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                      added
                        ? 'bg-white/40 dark:bg-gray-900/30 border-gray-200/50 dark:border-gray-800/60 opacity-75'
                        : 'bg-white dark:bg-gray-900 border-brand-100 dark:border-gray-800 shadow-u-xs hover:border-brand-300 dark:hover:border-brand-700'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5 mb-1">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                          A cada {template.frequencyDays} {template.frequencyDays === 1 ? 'dia' : 'dias'}
                        </span>
                        <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
                          ⏱ {template.estimatedMinutes} min •{' '}
                          {template.difficulty === 'facil'
                            ? 'Fácil'
                            : template.difficulty === 'pesado'
                            ? 'Pesado'
                            : 'Médio'}
                        </span>
                        <span className="text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400">
                          +{template.xpReward} XP
                        </span>
                      </div>
                      <h5 className="text-xs font-bold text-gray-900 dark:text-white">
                        {template.title}
                      </h5>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                        {template.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0 self-end sm:self-center">
                      {added ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Adicionada</span>
                        </span>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => handleCustomizeSuggestedChore(template)}
                            className="px-2.5 py-1 rounded-xl text-[11px] font-medium text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            title="Personalizar antes de adicionar"
                          >
                            Ajustar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAddSuggestedChore(template)}
                            className="flex items-center gap-1 px-3 py-1 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-u-xs transition-all active:scale-95"
                          >
                            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                            <span>Adicionar</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Search filter if more than 3 chores */}
        {roomChores.length > 3 && (
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar tarefas neste cômodo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#2C2C2E] border border-black/5 dark:border-white/5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        )}

        {/* Chores List */}
        <div className="space-y-2.5">
          {activeList.length === 0 ? (
            <div className="py-8 text-center text-slate-400 rounded-2xl bg-gray-50/60 dark:bg-gray-800/20 border border-dashed border-gray-200 dark:border-gray-800">
              <Check className="w-8 h-8 mx-auto text-[#34C759] mb-2" />
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {tab === 'pending' ? 'Tudo em dia nesta seção!' : 'Nenhuma tarefa em pausa recente.'}
              </p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                Use as sugestões acima ou crie uma nova tarefa abaixo.
              </p>
            </div>
          ) : (
            activeList.map((chore) => {
              const { urgencyRatio } = calculateChoreUrgency(chore, now);
              const isOverdue = urgencyRatio > 1.0;
              const cooldown = checkChoreCooldown(chore.lastCompletedAt, now);
              const xpWithBonus = isOverdue ? Math.round(chore.xpReward * 1.5) : chore.xpReward;

              // Rotation resident determination
              const currentTurnIndex = chore.currentRotationIndex ?? 0;
              const turnUserId = chore.rotationUserIds?.[currentTurnIndex] || chore.assignedTo;
              const turnMember = members.find((m) => m.userId === turnUserId);
              const isMyTurn = turnUserId === currentUser.userId;

              return (
                <div
                  key={chore.id}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#2C2C2E]/60 border border-slate-100 dark:border-white/5 flex flex-col justify-between gap-3 shadow-sm hover:border-brand-300/40 dark:hover:border-brand-700/40 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5 mb-1">
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                          A cada {chore.frequencyDays} {chore.frequencyDays === 1 ? 'dia' : 'dias'}
                        </span>

                        {/* Difficulty & Time Pill */}
                        <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 bg-sand-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
                          ⏱ {chore.estimatedMinutes || 20} min •{' '}
                          {chore.difficulty === 'facil'
                            ? 'Fácil'
                            : chore.difficulty === 'pesado'
                            ? 'Pesado'
                            : 'Médio'}
                        </span>

                        {/* Rotation turn badge */}
                        {turnMember && (
                          <span
                            className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1 ${
                              isMyTurn
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 ring-1 ring-amber-300/80 dark:ring-amber-700/80'
                                : 'bg-sand-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                            }`}
                          >
                            <RotateCw className="w-2.5 h-2.5" />
                            Vez de: {isMyTurn ? 'Você!' : turnMember.displayName}
                          </span>
                        )}

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

                      {/* Resident Responsibility badge */}
                      {chore.assignedTo && (
                        <div className="mt-1 flex items-center gap-1.5">
                          {chore.assignedTo === currentUser.userId ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-brand-500/20 text-brand-700 dark:text-brand-300 border border-brand-500/40">
                              ⭐ Sua Vez Esta Semana
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                              👤 Vez de: {members.find((m) => m.userId === chore.assignedTo)?.displayName || 'Morador'}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* XP & Quick Edit/Delete Actions */}
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className="text-xs font-black text-[#FF9500] block">
                        +{xpWithBonus} XP
                      </span>
                      {isOverdue && (
                        <span className="text-[9px] text-[#FF9500] font-bold">
                          Bônus 1.5x
                        </span>
                      )}

                      <div className="flex items-center gap-1 mt-1">
                        <button
                          onClick={() => handleStartEdit(chore)}
                          className="p-1.5 text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950/50 rounded-lg transition-colors"
                          title="Editar esta tarefa"
                          aria-label="Editar tarefa"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingChore(chore)}
                          className="p-1.5 text-gray-400 hover:text-error-600 dark:hover:text-error-400 hover:bg-error-50 dark:hover:bg-error-950/50 rounded-lg transition-colors"
                          title="Excluir esta tarefa"
                          aria-label="Excluir tarefa"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Actions & Cooldown */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200/50 dark:border-white/5">
                    <div className="flex items-center gap-2">
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

                      {/* View Completion Proof Photo */}
                      {chore.completionProofUrl && (
                        <button
                          onClick={() => setViewingProofUrl(chore.completionProofUrl || null)}
                          className="flex items-center gap-1 text-[10px] text-brand-600 dark:text-brand-400 font-semibold hover:underline"
                        >
                          <ImageIcon className="w-3 h-3" />
                          <span>Ver Foto</span>
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Simulate delay */}
                      <button
                        onClick={() => resetChoreTimer(chore.id, chore.frequencyDays * 24 + 12)}
                        className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 px-2 py-1 rounded-lg bg-slate-200/60 dark:bg-white/5"
                        title="Simular atraso para testar algoritmo"
                      >
                        Atrasar
                      </button>

                      {/* Photo Proof trigger / Direct Complete button */}
                      <button
                        disabled={cooldown.isBlocked}
                        onClick={() => {
                          setCompletingChoreId(chore.id);
                          setProofPhotoData(null);
                        }}
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

        {/* Add Custom Chore section */}
        {showAddForm ? (
          <form onSubmit={handleCreateChore} className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200/60 dark:border-gray-800 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 font-display">
              Nova Tarefa Personalizada para {room.name}
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

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-[10px] text-gray-500 dark:text-gray-400 block mb-1">Dificuldade</label>
                <select
                  value={newDifficulty}
                  onChange={(e) => setNewDifficulty(e.target.value as any)}
                  className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-gray-750 border border-gray-200 dark:border-gray-700 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/30 font-medium"
                >
                  <option value="facil">Fácil (Rápida)</option>
                  <option value="medio">Médio (Padrão)</option>
                  <option value="pesado">Pesado (Faxina)</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] text-gray-500 dark:text-gray-400 block mb-1">Tempo Estimado (min)</label>
                <input
                  type="number"
                  min="5"
                  max="180"
                  step="5"
                  value={newMinutes}
                  onChange={(e) => setNewMinutes(e.target.value)}
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
          <div className="flex flex-col sm:flex-row gap-2 pt-1">
            <button
              onClick={() => setShowAddForm(true)}
              className="flex-1 py-2.5 px-3 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-brand-400 text-gray-600 dark:text-gray-300 hover:text-brand-600 dark:hover:text-brand-400 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Criar Tarefa Manual</span>
            </button>
            <button
              onClick={() => setShowSuggestions(true)}
              className="py-2.5 px-3 rounded-xl bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/60 dark:hover:bg-brand-900/60 text-brand-700 dark:text-brand-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              <span>Abrir Sugestões</span>
            </button>
          </div>
        )}
      </div>

      {/* MODAL: Editar Tarefa Existente */}
      {editingChore && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-gray-900/70 backdrop-blur-sm animate-in fade-in duration-150 overflow-hidden">
          <div className="w-full max-w-md max-h-[88dvh] sm:max-h-[85vh] overflow-y-auto bg-white dark:bg-gray-900 rounded-3xl shadow-u-xl border border-gray-200 dark:border-gray-800 p-5 sm:p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-brand-50 dark:bg-brand-950/70 text-brand-600 dark:text-brand-400 flex items-center justify-center">
                  <Pencil className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold font-display text-gray-900 dark:text-white">
                    Editar Tarefa
                  </h3>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    {room.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingChore(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5">
              <div>
                <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300 block mb-1">
                  Título da Tarefa *
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 block mb-1">
                    Frequência (dias)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="90"
                    value={editDays}
                    onChange={(e) => setEditDays(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/30 font-display font-semibold"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 block mb-1">
                    XP Recompensa
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="150"
                    value={editXp}
                    onChange={(e) => setEditXp(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/30 font-display font-semibold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 block mb-1">
                    Dificuldade
                  </label>
                  <select
                    value={editDifficulty}
                    onChange={(e) => setEditDifficulty(e.target.value as any)}
                    className="w-full px-3 py-1.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                  >
                    <option value="facil">Fácil (Rápida)</option>
                    <option value="medio">Médio (Padrão)</option>
                    <option value="pesado">Pesado (Faxina)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 block mb-1">
                    Tempo Estimado (min)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="180"
                    step="5"
                    value={editMinutes}
                    onChange={(e) => setEditMinutes(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/30 font-display font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 block mb-1">
                  Morador Designado / Rotação
                </label>
                <select
                  value={editAssignedTo}
                  onChange={(e) => setEditAssignedTo(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                >
                  <option value="">Livre / Rotação Automática da Casa</option>
                  {members.map((m) => (
                    <option key={m.userId} value={m.userId}>
                      {m.displayName} {m.userId === currentUser.userId ? '(Você)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setEditingChore(null)}
                  className="px-3.5 py-1.5 rounded-xl text-xs text-gray-500 hover:text-gray-900 dark:hover:text-white font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-u-xs transition-all active:scale-95"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL: Confirmação de Exclusão de Tarefa */}
      {deletingChore && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-gray-900/70 backdrop-blur-sm animate-in fade-in duration-150 overflow-hidden">
          <div className="w-full max-w-sm max-h-[88dvh] sm:max-h-[85vh] overflow-y-auto bg-white dark:bg-gray-900 rounded-3xl shadow-u-xl border border-gray-200 dark:border-gray-800 p-5 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-error-50 dark:bg-error-950/60 border border-error-100 dark:border-error-900/40 text-error-600 dark:text-error-400 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <h3 className="text-sm font-bold font-display text-gray-900 dark:text-white">
                  Excluir Tarefa?
                </h3>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  Esta ação não poderá ser desfeita
                </p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200/60 dark:border-gray-800 text-xs">
              <p className="font-bold text-gray-900 dark:text-white">
                {deletingChore.title}
              </p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                {room.name} • A cada {deletingChore.frequencyDays} dias • {deletingChore.xpReward} XP
              </p>
            </div>

            <p className="text-xs text-gray-600 dark:text-gray-400">
              A tarefa será removida do cômodo e deixará de impactar os cálculos de saúde e pontuação da casa.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-gray-100 dark:border-gray-800">
              <button
                type="button"
                onClick={() => setDeletingChore(null)}
                className="px-3.5 py-2 text-xs font-semibold text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-error-600 hover:bg-error-700 text-white font-bold text-xs shadow-u-xs transition-all active:scale-95"
              >
                Sim, Excluir Tarefa
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Completion Modal with Optional Photo Proof */}
      {completingChoreId && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-gray-900/70 backdrop-blur-sm animate-in fade-in duration-150 overflow-hidden">
          <div className="w-full max-w-sm max-h-[88dvh] sm:max-h-[85vh] overflow-y-auto bg-white dark:bg-gray-900 rounded-2xl shadow-u-xl border border-gray-200 dark:border-gray-800 p-5 space-y-4 animate-in zoom-in-95 duration-150">
            <div>
              <h3 className="text-sm font-bold font-display text-gray-900 dark:text-white">
                Confirmar Conclusão
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Você pode anexar uma foto como comprovante para a casa ou concluir diretamente.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-sand-50/70 dark:bg-gray-800/60 border border-sand-200 dark:border-gray-700 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                  Foto Comprovante (opcional)
                </span>
                <button
                  type="button"
                  onClick={() => proofInputRef.current?.click()}
                  className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>{proofPhotoData ? 'Trocar foto' : 'Tirar / Anexar Foto'}</span>
                </button>
                <input
                  type="file"
                  ref={proofInputRef}
                  onChange={handlePhotoUpload}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              {proofPhotoData && (
                <div className="relative inline-block mt-2">
                  <img
                    src={proofPhotoData}
                    alt="Comprovante"
                    className="w-24 h-24 object-cover rounded-xl border border-gray-200 dark:border-gray-700 shadow-u-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setProofPhotoData(null)}
                    className="absolute -top-1.5 -right-1.5 p-1 rounded-full bg-error-600 text-white shadow-u-xs hover:bg-error-700"
                    title="Remover foto"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-1 border-t border-gray-100 dark:border-gray-800">
              <button
                type="button"
                onClick={() => {
                  setCompletingChoreId(null);
                  setProofPhotoData(null);
                }}
                className="px-3.5 py-2 text-xs font-semibold text-gray-500 hover:text-gray-900 dark:hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmCompletion}
                className="px-4 py-2 rounded-xl bg-success-600 hover:bg-success-700 text-white font-bold text-xs shadow-u-xs transition-all active:scale-95 flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Concluir Tarefa (+XP)</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Fullscreen Proof Photo Viewer */}
      {viewingProofUrl && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-gray-900/80 backdrop-blur-sm animate-in fade-in duration-150 overflow-hidden">
          <div className="relative max-w-lg w-full max-h-[88dvh] sm:max-h-[85vh] overflow-y-auto bg-white dark:bg-gray-900 rounded-2xl shadow-u-xl border border-gray-200 dark:border-gray-800 p-4 space-y-3 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-800">
              <span className="text-xs font-bold text-gray-900 dark:text-white">
                Comprovante da Tarefa
              </span>
              <button
                onClick={() => setViewingProofUrl(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-auto rounded-xl flex items-center justify-center bg-sand-50 dark:bg-gray-950 p-2">
              <img
                src={viewingProofUrl}
                alt="Comprovante de conclusão"
                className="max-w-full max-h-[65vh] object-contain rounded-lg"
              />
            </div>
            <div className="flex justify-end pt-1">
              <button
                onClick={() => setViewingProofUrl(null)}
                className="px-4 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-xs font-semibold text-gray-700 dark:text-gray-300"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </BottomSheet>
  );
};
