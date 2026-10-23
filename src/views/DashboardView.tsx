import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../context/AppContext';
import { QuickCleanWidget } from '../components/QuickCleanWidget';
import { PetStatusPill } from '../components/PetStatusPill';
import { LeaderboardWidget } from '../components/LeaderboardWidget';
import { CalendarWidget } from '../components/CalendarWidget';
import { CalendarModal } from '../components/CalendarModal';
import { CleaningSprintModal } from '../components/CleaningSprintModal';
import { requestNotificationPermission, getNotificationPermission, checkAndTriggerHouseAlerts } from '../utils/notifications';
import { getExpensePaymentStatus, formatCurrencyBRL } from '../utils/financeMath';
import {
  Activity,
  Sparkles,
  Sun,
  Bell,
  Zap,
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
  Wallet,
  ShoppingBag,
  Cat,
  ArrowUpRight,
  Flame,
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
    expenses,
    pet,
    members,
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
  const [showSprintModal, setShowSprintModal] = useState(false);
  const [notifPermission, setNotifPermission] = useState<'granted' | 'denied' | 'default' | 'unsupported'>(() => getNotificationPermission());

  const now = Date.now();
  const todayDayOfWeek = new Date().getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6;
  const petDutyUserId = pet?.dutySchedule?.todayOverrideUserId || pet?.dutySchedule?.weeklyAssignment?.[todayDayOfWeek];
  const petDutyMember = members.find((m) => m.userId === petDutyUserId);
  const isMyPetDutyToday = petDutyUserId === currentUser.userId;

  const cleanRooms = rooms.filter((r) => r.statusLevel === 'clean').length;
  const warningRooms = rooms.filter((r) => r.statusLevel === 'warning').length;
  const urgentRooms = rooms.filter((r) => r.statusLevel === 'urgent').length;
  const clampedScore = Math.max(0, Math.min(100, Math.round(house.houseScore)));
  const billsDueToday = expenses.filter((e) => !e.isSettled && getExpensePaymentStatus(e, now) === 'due_today');
  const overdueBills = expenses.filter((e) => !e.isSettled && getExpensePaymentStatus(e, now) === 'overdue');

  useEffect(() => {
    checkAndTriggerHouseAlerts(
      house.name,
      billsDueToday.length,
      overdueBills.length,
      isMyPetDutyToday,
      pet?.name || 'Pet',
      urgentRooms
    );
  }, [house.name, billsDueToday.length, overdueBills.length, isMyPetDutyToday, pet?.name, urgentRooms]);

  const handleToggleNotifications = async () => {
    const granted = await requestNotificationPermission();
    setNotifPermission(granted ? 'granted' : 'denied');
    if (granted) {
      showToast('Notificações no navegador ativadas com sucesso!', 'success');
    } else {
      showToast('Permissão de notificações não concedida.', 'warning');
    }
  };

  const handleShareBriefingWhatsApp = () => {
    const dateFormatted = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
    let msg = `☀️ *BOM DIA, CASA! • RESUMO DO DIA* ☀️\n`;
    msg += `📍 *Residência:* ${house.name}\n`;
    msg += `📅 *${dateFormatted}*\n\n`;

    msg += `💳 *Finanças & Boletos:*\n`;
    if (billsDueToday.length > 0) {
      msg += `• ⚠️ ${billsDueToday.length} conta(s) vencem HOJE: ${billsDueToday.map((b) => `${b.description} (${formatCurrencyBRL(b.amount)})`).join(', ')}\n`;
    } else if (overdueBills.length > 0) {
      msg += `• 🚨 ${overdueBills.length} conta(s) em atraso na casa.\n`;
    } else {
      msg += `• ✨ Nenhuma conta vencendo hoje! Tudo em dia.\n`;
    }

    msg += `\n🐾 *Área Pet (${pet?.name || 'Pet'}):*\n`;
    if (petDutyMember) {
      msg += `• Responsável de hoje: *${petDutyMember.displayName}* 🐶\n`;
    } else {
      msg += `• Turno livre / rotativo da casa.\n`;
    }

    msg += `\n🧹 *Higiene & Cômodos:*\n`;
    msg += `• Score da Casa: *${clampedScore}/100* (${cleanRooms} limpos, ${urgentRooms} urgentes)\n\n`;
    msg += `📲 *Acompanhe tudo no Domus App:* https://henrickschecterapps.github.io/domus/\n`;
    msg += `Tenham um ótimo dia! ✨`;

    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };



  const ringSize = 112;
  const ringStroke = 9;
  const ringRadius = (ringSize - ringStroke) / 2;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference - (clampedScore / 100) * ringCircumference;

  const firstName = currentUser.displayName?.split(' ')[0] || 'Morador';

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
    <div className="space-y-5 pb-20 animate-in fade-in duration-200 w-full">
      {/* Immersive Ultraviolet Hero Card */}
      <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#1E1B4B] via-[#312E81] to-[#0F172A] text-white p-6 sm:p-7 shadow-u-xl border border-indigo-400/25">
        {/* Ambient Neon Orbs inside Hero */}
        <div className="pointer-events-none absolute -top-24 -right-16 w-80 h-80 rounded-full bg-violet-500/30 blur-[80px]" />
        <div className="pointer-events-none absolute -bottom-24 -left-16 w-72 h-72 rounded-full bg-brand-400/25 blur-[75px]" />
        <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-40 rounded-full bg-emerald-400/10 blur-[90px]" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Left: Personalized Greeting + Status Narrative */}
          <div className="flex flex-col sm:flex-row items-center sm:items-center gap-5 text-center sm:text-left">
            {/* Neon Score Ring */}
            <div className="relative flex items-center justify-center flex-shrink-0" style={{ width: ringSize, height: ringSize }}>
              <svg width={ringSize} height={ringSize} className="rotate-[-90deg] drop-shadow-[0_0_16px_rgba(99,102,241,0.45)]">
                <defs>
                  <linearGradient id="heroEmeraldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#10B981" />
                    <stop offset="100%" stopColor="#34D399" />
                  </linearGradient>
                  <linearGradient id="heroAmberGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#F59E0B" />
                    <stop offset="100%" stopColor="#FBBF24" />
                  </linearGradient>
                  <linearGradient id="heroCrimsonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#F43F5E" />
                    <stop offset="100%" stopColor="#FB7185" />
                  </linearGradient>
                </defs>
                <circle
                  cx={ringSize / 2}
                  cy={ringSize / 2}
                  r={ringRadius}
                  stroke="rgba(255,255,255,0.12)"
                  strokeWidth={ringStroke}
                  fill="none"
                />
                <circle
                  cx={ringSize / 2}
                  cy={ringSize / 2}
                  r={ringRadius}
                  stroke={
                    clampedScore >= 80
                      ? 'url(#heroEmeraldGrad)'
                      : clampedScore >= 50
                      ? 'url(#heroAmberGrad)'
                      : 'url(#heroCrimsonGrad)'
                  }
                  strokeWidth={ringStroke}
                  strokeDasharray={ringCircumference}
                  strokeDashoffset={ringOffset}
                  strokeLinecap="round"
                  fill="none"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-3xl font-extrabold font-display tracking-tight text-white leading-none">
                  {clampedScore}
                </span>
                <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-indigo-200/80 mt-1">
                  SCORE
                </span>
              </div>
            </div>

            {/* Greeting & Summary */}
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15">
                <span
                  className={`w-2 h-2 rounded-full animate-pulse ${
                    clampedScore >= 80
                      ? 'bg-emerald-400'
                      : clampedScore >= 50
                      ? 'bg-amber-400'
                      : 'bg-rose-400'
                  }`}
                />
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-indigo-100">
                  {clampedScore >= 80
                    ? 'AMBIENTES EM HARMONIA'
                    : clampedScore >= 50
                    ? 'MANUTENÇÃO PREVENTIVA'
                    : 'ATENÇÃO PRIORITÁRIA'}
                </span>
                <span className="text-[10px] font-mono text-indigo-200/80 border-l border-white/15 pl-2 flex items-center gap-1">
                  <Flame className="w-3 h-3 text-amber-400" />
                  {currentUser.weeklyXP} XP
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-white leading-tight">
                Olá, {firstName} 👋
              </h2>

              <p className="text-xs sm:text-sm text-indigo-100/85 leading-relaxed">
                {clampedScore >= 80
                  ? 'Todos os ambientes da casa estão sob controle, limpos e com as rotinas em dia.'
                  : clampedScore >= 50
                  ? 'Existem cômodos acumulando tarefas nesta semana. Que tal concluir uma limpeza rápida e ganhar XP?'
                  : 'Múltiplos ambientes ultrapassaram o limite ideal e precisam de cuidado hoje.'}
              </p>
            </div>
          </div>

          {/* Right: 3 Integrated Glass Sub-Cards for Room Health */}
          <div className="grid grid-cols-3 gap-2.5 sm:gap-3 lg:w-[410px] flex-shrink-0">
            <button
              onClick={() => onNavigateTab('cleaning')}
              className="group text-left p-3.5 rounded-2xl bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/15 hover:border-emerald-400/50 transition-all duration-200 active:scale-95"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-7 h-7 rounded-xl bg-emerald-400/20 text-emerald-300 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-indigo-200/50 group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </div>
              <div className="text-2xl font-extrabold font-display text-white leading-none">
                {cleanRooms}
              </div>
              <div className="text-[11px] font-semibold text-indigo-100/90 mt-1 truncate">
                Limpos
              </div>
              <div className="text-[9px] font-mono text-emerald-300/90 uppercase tracking-wider mt-0.5">
                de {rooms.length} total
              </div>
            </button>

            <button
              onClick={() => onNavigateTab('cleaning')}
              className="group text-left p-3.5 rounded-2xl bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/15 hover:border-amber-400/50 transition-all duration-200 active:scale-95"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-7 h-7 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-indigo-200/50 group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </div>
              <div className="text-2xl font-extrabold font-display text-white leading-none">
                {warningRooms}
              </div>
              <div className="text-[11px] font-semibold text-indigo-100/90 mt-1 truncate">
                Em Atenção
              </div>
              <div className="text-[9px] font-mono text-amber-300/90 uppercase tracking-wider mt-0.5">
                acumulando
              </div>
            </button>

            <button
              onClick={() => onNavigateTab('cleaning')}
              className="group text-left p-3.5 rounded-2xl bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/15 hover:border-rose-400/50 transition-all duration-200 active:scale-95"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-7 h-7 rounded-xl bg-rose-400/20 text-rose-300 flex items-center justify-center">
                  <AlertCircle className="w-4 h-4" />
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-indigo-200/50 group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </div>
              <div className="text-2xl font-extrabold font-display text-white leading-none">
                {urgentRooms}
              </div>
              <div className="text-[11px] font-semibold text-indigo-100/90 mt-1 truncate">
                Urgentes
              </div>
              <div className="text-[9px] font-mono text-rose-300/90 uppercase tracking-wider mt-0.5">
                {urgentRooms > 0 ? 'ação hoje' : 'zerado'}
              </div>
            </button>
          </div>
        </div>
      </div>


      {/* Phase 5: Morning Briefing Card & WhatsApp Broadcast */}
      <div className="u-card-interactive p-4 sm:p-5 rounded-3xl bg-white/95 dark:bg-gray-900/95 border border-gray-200/80 dark:border-gray-800/80 shadow-u-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center justify-center flex-shrink-0 shadow-u-xs">
            <Sun className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-extrabold text-gray-900 dark:text-white font-display">
                Briefing Diário do Lar
              </h3>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/60">
                {new Date().toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })}
              </span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
              {billsDueToday.length > 0 ? `💳 ${billsDueToday.length} conta(s) a pagar hoje • ` : ''}
              {petDutyMember ? `🐾 Turno do Pet: ${petDutyMember.displayName} • ` : ''}
              {urgentRooms > 0 ? `🧹 ${urgentRooms} cômodo(s) urgente(s)` : '✨ Todos os cômodos em ordem'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleShareBriefingWhatsApp}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-success-600 hover:bg-success-700 text-white font-bold text-xs shadow-u-xs transition-all active:scale-95"
            title="Enviar o resumo pronto no grupo do WhatsApp da casa"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>Enviar no WhatsApp</span>
          </button>

          <button
            onClick={handleToggleNotifications}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all active:scale-95 ${
              notifPermission === 'granted'
                ? 'bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 border-brand-200/60'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 border-gray-200 dark:border-gray-700'
            }`}
            title="Receber avisos de contas a vencer e turnos do pet"
          >
            <Bell className="w-3.5 h-3.5" />
            <span>{notifPermission === 'granted' ? 'Notificações Ativas' : 'Ativar Notificações'}</span>
          </button>
        </div>
      </div>

      {/* 1-Touch Quick Action Bar (Bento Pills) */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-2.5">
        <button
          onClick={() => setShowSprintModal(true)}
          className="u-card-interactive flex items-center gap-2.5 p-3 rounded-2xl bg-amber-500/10 dark:bg-amber-950/40 border border-amber-500/30 shadow-u-xs hover:shadow-u-md text-left transition-all active:scale-95"
        >
          <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0 shadow-u-xs">
            <Zap className="w-4 h-4 fill-current" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-gray-900 dark:text-white truncate">Sprint 15 min</p>
            <p className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold truncate">1.5x XP Bônus</p>
          </div>
        </button>

        <button
          onClick={() => onNavigateTab('cleaning')}
          className="u-card-interactive flex items-center gap-2.5 p-3 rounded-2xl bg-white/95 dark:bg-gray-900/95 border border-gray-200/80 dark:border-gray-800/80 shadow-u-xs hover:shadow-u-md text-left transition-all active:scale-95"
        >
          <div className="w-8 h-8 rounded-xl bg-brand-50 dark:bg-brand-950/80 text-brand-600 dark:text-brand-400 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-4 h-4 stroke-[2.2]" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-gray-900 dark:text-white truncate">Limpar Cômodos</p>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">+XP & Check-in</p>
          </div>
        </button>

        <button
          onClick={() => onNavigateTab('finance')}
          className="u-card-interactive flex items-center gap-2.5 p-3 rounded-2xl bg-white/95 dark:bg-gray-900/95 border border-gray-200/80 dark:border-gray-800/80 shadow-u-xs hover:shadow-u-md text-left transition-all active:scale-95"
        >
          <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
            <Wallet className="w-4 h-4 stroke-[2.2]" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-gray-900 dark:text-white truncate">Finanças & PIX</p>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">Contas & Rateio</p>
          </div>
        </button>

        <button
          onClick={() => onNavigateTab('pantry')}
          className="u-card-interactive flex items-center gap-2.5 p-3 rounded-2xl bg-white/95 dark:bg-gray-900/95 border border-gray-200/80 dark:border-gray-800/80 shadow-u-xs hover:shadow-u-md text-left transition-all active:scale-95"
        >
          <div className="w-8 h-8 rounded-xl bg-violet-50 dark:bg-violet-950/80 text-violet-600 dark:text-violet-400 flex items-center justify-center flex-shrink-0">
            <ShoppingBag className="w-4 h-4 stroke-[2.2]" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-gray-900 dark:text-white truncate">Despensa & Lista</p>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">Reposição rápida</p>
          </div>
        </button>

        <button
          onClick={() => onNavigateTab('pet')}
          className="u-card-interactive flex items-center gap-2.5 p-3 rounded-2xl bg-white/95 dark:bg-gray-900/95 border border-gray-200/80 dark:border-gray-800/80 shadow-u-xs hover:shadow-u-md text-left transition-all active:scale-95"
        >
          <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0">
            <Cat className="w-4 h-4 stroke-[2.2]" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-gray-900 dark:text-white truncate">Área Pet</p>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">Turnos & Saúde</p>
          </div>
        </button>

        <button
          onClick={() => setShowAddNoteModal(true)}
          className="col-span-2 sm:col-span-1 u-card-interactive flex items-center gap-2.5 p-3 rounded-2xl bg-gradient-to-r from-brand-600 to-violet-600 text-white shadow-u-glow text-left transition-all active:scale-95"
        >
          <div className="w-8 h-8 rounded-xl bg-white/20 text-white flex items-center justify-center flex-shrink-0">
            <Plus className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-white truncate">Colar Recado</p>
            <p className="text-[10px] text-indigo-100 truncate">Mural da Geladeira</p>
          </div>
        </button>
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
      {showAddNoteModal && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-150 overflow-hidden">
          <div className="w-full max-w-md max-h-[88dvh] sm:max-h-[85vh] overflow-y-auto bg-white dark:bg-gray-900 rounded-2xl shadow-u-xl border border-gray-200 dark:border-gray-800 p-5 sm:p-6 space-y-4 animate-in zoom-in-95 duration-150">
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
        </div>,
        document.body
      )}

      {/* Phase 5: Cleaning Sprint Modal */}
      <CleaningSprintModal isOpen={showSprintModal} onClose={() => setShowSprintModal(false)} />

      {/* Full Shared Calendar Modal */}
      <CalendarModal
        isOpen={showCalendarModal}
        onClose={() => setShowCalendarModal(false)}
      />
    </div>
  );
};
