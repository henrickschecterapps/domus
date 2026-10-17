import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ScoreRing } from '../components/ScoreRing';
import { QuickCleanWidget } from '../components/QuickCleanWidget';
import { PetStatusPill } from '../components/PetStatusPill';
import { LeaderboardWidget } from '../components/LeaderboardWidget';
import { CalendarWidget } from '../components/CalendarWidget';
import { CalendarModal } from '../components/CalendarModal';
import { StatCard } from '../components/untitled/StatCard';
import {
  Activity,
  Sparkles,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Wifi,
  Copy,
  Check,
  Phone,
  MessageCircle,
  Pin,
  Plus,
  Trash2,
  StickyNote,
  X,
} from 'lucide-react';
import { Button } from '../components/untitled/Button';
import { Badge } from '../components/untitled/Badge';
import { HouseNote } from '../types';

interface DashboardViewProps {
  onNavigateTab: (tab: 'dashboard' | 'cleaning' | 'pet' | 'pantry' | 'finance') => void;
}

const NOTE_COLORS: Record<
  HouseNote['color'],
  { bg: string; border: string; text: string; dot: string; label: string }
> = {
  yellow: {
    bg: 'bg-amber-50 dark:bg-amber-950/50',
    border: 'border-amber-200 dark:border-amber-800/60',
    text: 'text-amber-950 dark:text-amber-100',
    dot: 'bg-amber-400',
    label: 'Amarelo',
  },
  pink: {
    bg: 'bg-rose-50 dark:bg-rose-950/50',
    border: 'border-rose-200 dark:border-rose-800/60',
    text: 'text-rose-950 dark:text-rose-100',
    dot: 'bg-rose-400',
    label: 'Rosa',
  },
  blue: {
    bg: 'bg-sky-50 dark:bg-sky-950/50',
    border: 'border-sky-200 dark:border-sky-800/60',
    text: 'text-sky-950 dark:text-sky-100',
    dot: 'bg-sky-400',
    label: 'Azul',
  },
  green: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/50',
    border: 'border-emerald-200 dark:border-emerald-800/60',
    text: 'text-emerald-950 dark:text-emerald-100',
    dot: 'bg-emerald-400',
    label: 'Verde',
  },
  amber: {
    bg: 'bg-orange-50 dark:bg-orange-950/50',
    border: 'border-orange-200 dark:border-orange-800/60',
    text: 'text-orange-950 dark:text-orange-100',
    dot: 'bg-orange-400',
    label: 'Laranja',
  },
};

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigateTab }) => {
  const {
    house,
    rooms,
    chores,
    choreLogs,
    currentUser,
    addHouseNote,
    deleteHouseNote,
    togglePinHouseNote,
    showToast,
  } = useApp();

  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [showAddNoteModal, setShowAddNoteModal] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [noteColor, setNoteColor] = useState<HouseNote['color']>('yellow');
  const [copiedWifi, setCopiedWifi] = useState(false);

  const cleanRooms = rooms.filter((r) => r.statusLevel === 'clean').length;
  const warningRooms = rooms.filter((r) => r.statusLevel === 'warning').length;
  const urgentRooms = rooms.filter((r) => r.statusLevel === 'urgent').length;

  const handleCopyWifi = () => {
    if (!house.wifiPassword) return;
    navigator.clipboard.writeText(house.wifiPassword);
    setCopiedWifi(true);
    showToast('Senha do Wi-Fi copiada!', 'success');
    setTimeout(() => setCopiedWifi(false), 2000);
  };

  const handlePostNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim()) {
      showToast('Digite a mensagem do recado.', 'warning');
      return;
    }
    addHouseNote({
      authorId: currentUser.userId,
      authorName: currentUser.displayName,
      content: noteContent.trim(),
      color: noteColor,
      isPinned: false,
    });
    setNoteContent('');
    setShowAddNoteModal(false);
  };

  const notes = house.notes || [];
  const sortedNotes = [...notes].sort((a, b) => {
    if (a.isPinned === b.isPinned) return b.createdAt - a.createdAt;
    return a.isPinned ? -1 : 1;
  });

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-200 w-full">
      {/* Global House Health Score Ring */}
      <ScoreRing
        score={house.houseScore}
        label="Score Geral da Residência"
        sublabel={
          house.houseScore >= 80
            ? 'Todos os ambientes estão sob controle, limpos e com rotinas em dia.'
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
          subtitle={`de ${rooms.length} ambientes totais`}
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
          subtitle="rotinas acumulando"
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

      {/* Central Domus: Wi-Fi Rápido & Mural da Geladeira */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Wi-Fi & Contatos de Emergência (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Wi-Fi Card */}
          {house.wifiSsid && (
            <div className="u-card-interactive p-5 rounded-2xl bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border border-gray-200/80 dark:border-gray-800/80 shadow-u-sm hover:shadow-u-card-hover space-y-3.5">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800/80 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-brand-50 dark:bg-brand-950/70 border border-brand-100 dark:border-brand-900/40 text-brand-600 dark:text-brand-400 flex items-center justify-center shadow-u-xs">
                    <Wifi className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-brand-600 dark:text-brand-400 block leading-none mb-0.5">
                      CONECTIVIDADE
                    </span>
                    <h4 className="text-xs font-extrabold text-gray-900 dark:text-white uppercase tracking-wider font-display">
                      Wi-Fi da Casa
                    </h4>
                  </div>
                </div>
                <Badge variant="brand" size="sm">Visitas</Badge>
              </div>

              <div className="p-3 rounded-xl bg-gray-50/90 dark:bg-gray-800/50 border border-gray-200/60 dark:border-gray-700/50 flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                    {house.wifiSsid}
                  </p>
                  <p className="text-[11px] text-gray-400 font-mono tracking-widest mt-0.5">
                    ••••••••••••
                  </p>
                </div>
                <span className="w-2 h-2 rounded-full bg-success-500 animate-pulse flex-shrink-0" title="Rede ativa" />
              </div>

              <Button
                variant="secondary"
                size="sm"
                onClick={handleCopyWifi}
                className="w-full justify-center text-xs flex items-center gap-1.5"
              >
                {copiedWifi ? <Check className="w-3.5 h-3.5 text-success-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedWifi ? 'Senha Copiada!' : 'Copiar Senha do Wi-Fi'}</span>
              </Button>
            </div>
          )}

          {/* Quick Emergency Contacts */}
          {(house.emergencyContacts || []).length > 0 && (
            <div className="u-card-interactive p-5 rounded-2xl bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border border-gray-200/80 dark:border-gray-800/80 shadow-u-sm hover:shadow-u-card-hover space-y-3.5">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800/80 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-error-50 dark:bg-error-950/70 border border-error-100 dark:border-error-900/40 text-error-600 dark:text-error-400 flex items-center justify-center shadow-u-xs">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-error-600 dark:text-error-400 block leading-none mb-0.5">
                      ACIONAMENTO RÁPIDO
                    </span>
                    <h4 className="text-xs font-extrabold text-gray-900 dark:text-white uppercase tracking-wider font-display">
                      Emergência & Portaria
                    </h4>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-semibold text-gray-400 px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800">
                  1-CLIQUE
                </span>
              </div>

              <div className="space-y-2">
                {(house.emergencyContacts || []).slice(0, 3).map((contact) => (
                  <div
                    key={contact.id}
                    className="p-2.5 rounded-xl bg-gray-50/90 dark:bg-gray-800/50 border border-gray-200/60 dark:border-gray-700/60 hover:border-brand-300/60 dark:hover:border-brand-700/60 transition-colors flex items-center justify-between"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                        {contact.name}
                      </p>
                      <span className="text-[10px] text-gray-500 dark:text-gray-400 font-mono">
                        {contact.phone}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <a
                        href={`tel:${contact.phone.replace(/[^0-9+]/g, '')}`}
                        className="p-1.5 text-gray-500 hover:text-brand-600 rounded-lg hover:bg-brand-50 dark:hover:bg-brand-950/40 transition-colors"
                        title="Ligar"
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </a>
                      <a
                        href={`https://wa.me/${contact.phone.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 text-success-600 hover:text-success-700 rounded-lg hover:bg-success-50 dark:hover:bg-success-950/40 transition-colors"
                        title="WhatsApp"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Mural da Geladeira - Recados Digitais (8 cols) */}
        <div className="lg:col-span-8 u-card-interactive p-5 sm:p-6 rounded-2xl bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border border-gray-200/80 dark:border-gray-800/80 shadow-u-sm hover:shadow-u-card-hover space-y-4 bg-architectural-grid">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800/80 pb-3.5 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xs rounded-xl px-2 -mx-2">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/70 border border-amber-200/60 dark:border-amber-800/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-u-xs">
                <StickyNote className="w-4 h-4 stroke-[2.2]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs sm:text-sm font-extrabold text-gray-900 dark:text-white uppercase tracking-wider font-display">
                    Mural da Geladeira
                  </h3>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40">
                    {sortedNotes.length} {sortedNotes.length === 1 ? 'NOTA' : 'NOTAS'}
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  Recados magnéticos, avisos rápidos e carinho da casa
                </p>
              </div>
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowAddNoteModal(true)}
              className="flex items-center gap-1.5 text-xs py-1.5 px-3"
            >
              <Plus className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Colar Recado</span>
            </Button>
          </div>

          {sortedNotes.length === 0 ? (
            <div className="py-10 px-4 text-center rounded-2xl bg-gray-50/80 dark:bg-gray-800/40 border border-dashed border-gray-200 dark:border-gray-700/80">
              <StickyNote className="w-7 h-7 text-amber-500/60 mx-auto mb-2" />
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                O mural está limpinho!
              </p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                Deixe um recado carinhoso ou aviso importante para quem passar pela cozinha.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
              {sortedNotes.map((note) => {
                const colorConfig = NOTE_COLORS[note.color] || NOTE_COLORS.yellow;

                return (
                  <div
                    key={note.id}
                    className={`group/note relative p-4 rounded-2xl border shadow-u-xs hover:shadow-u-md flex flex-col justify-between transition-all duration-200 ease-spring hover:-translate-y-1 ${colorConfig.bg} ${colorConfig.border} ${colorConfig.text}`}
                  >
                    {/* Magnetic Pin Top Indicator */}
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className={`w-2 h-2 rounded-full ${colorConfig.dot} flex-shrink-0`} />
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider opacity-80 truncate">
                          {note.authorName}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => togglePinHouseNote(note.id)}
                          className={`p-1 rounded-lg transition-colors ${
                            note.isPinned
                              ? 'text-amber-600 dark:text-amber-400 font-bold bg-black/5 dark:bg-white/10'
                              : 'opacity-40 hover:opacity-100'
                          }`}
                          title={note.isPinned ? 'Desafixar' : 'Fixar no topo'}
                        >
                          <Pin className="w-3 h-3 fill-current" />
                        </button>
                        <button
                          onClick={() => deleteHouseNote(note.id)}
                          className="p-1 opacity-40 hover:opacity-100 hover:text-error-600 rounded-lg transition-colors"
                          title="Remover recado"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <p className="text-xs leading-relaxed whitespace-pre-wrap font-medium mb-3">
                      {note.content}
                    </p>

                    <div className="pt-2 border-t border-black/5 dark:border-white/10 text-[9px] font-mono opacity-65 flex items-center justify-between">
                      <span>{note.isPinned ? '📌 FIXADO' : 'RECADO'}</span>
                      <span>{new Date(note.createdAt).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
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
            <div className="u-card-interactive rounded-2xl bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border border-gray-200/80 dark:border-gray-800/80 p-5 shadow-u-sm hover:shadow-u-card-hover">
              <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-gray-100 dark:border-gray-800/80">
                <div className="flex items-center gap-2 text-gray-900 dark:text-white">
                  <div className="w-7 h-7 rounded-lg bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center">
                    <Activity className="w-3.5 h-3.5" />
                  </div>
                  <h3 className="text-xs font-extrabold uppercase tracking-wider font-display">Atividades Recentes</h3>
                </div>
                <span className="text-[10px] font-mono font-bold text-gray-400 uppercase">Histórico</span>
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
                      <span className="font-mono text-warning-700 dark:text-warning-300 font-bold text-[11px] flex-shrink-0 bg-warning-50 dark:bg-warning-950/60 px-2.5 py-0.5 rounded-full border border-warning-200 dark:border-warning-900/40">
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

      {/* MODAL: Adicionar Recado no Mural da Geladeira */}
      {showAddNoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-u-xl border border-gray-200 dark:border-gray-800 p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-base font-bold font-display text-gray-900 dark:text-white">
                Colar Recado no Mural da Geladeira
              </h3>
              <button
                onClick={() => setShowAddNoteModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handlePostNote} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Mensagem do Recado *
                </label>
                <textarea
                  rows={3}
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Ex: Fiz o café fresco! O bolo na despensa é para todos comerem :)"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-xs focus:ring-2 focus:ring-amber-500/20 focus:outline-none resize-none font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Cor do Post-it
                </label>
                <div className="flex items-center gap-2">
                  {Object.entries(NOTE_COLORS).map(([colorKey, cfg]) => (
                    <button
                      key={colorKey}
                      type="button"
                      onClick={() => setNoteColor(colorKey as any)}
                      className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all ${
                        noteColor === colorKey
                          ? 'border-brand-500 scale-110 shadow-xs'
                          : 'border-transparent opacity-80 hover:opacity-100'
                      } ${cfg.bg}`}
                    >
                      <span className={`w-3 h-3 rounded-full ${cfg.dot}`} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                <Button
                  type="button"
                  variant="tertiary"
                  size="sm"
                  onClick={() => setShowAddNoteModal(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  Fixar Recado
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Full Shared Calendar Modal */}
      <CalendarModal
        isOpen={showCalendarModal}
        onClose={() => setShowCalendarModal(false)}
      />
    </div>
  );
};
