import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { BottomSheet } from './BottomSheet';
import { HouseEvent, EventCategory } from '../types';
import { getUnifiedHouseEvents, exportEventsToCalendar } from '../utils/calendarUtils';
import {
  Calendar as CalendarIcon,
  Plus,
  Share2,
  Trash2,
  Clock,
  Sparkles,
  CheckCircle2,
  Download,
} from 'lucide-react';

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CalendarModal: React.FC<CalendarModalProps> = ({ isOpen, onClose }) => {
  const { events, chores, rooms, pet, pets, expenses, currentUser, addHouseEvent, deleteHouseEvent, showToast } = useApp();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAddForm, setShowAddForm] = useState(false);

  // New event form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState(() => {
    const tomorrow = new Date(Date.now() + 86_400_000);
    return tomorrow.toISOString().slice(0, 10);
  });
  const [eventTime, setEventTime] = useState('10:00');
  const [category, setCategory] = useState<EventCategory>('rotina');

  const now = Date.now();
  const dayMs = 86_400_000;

  const unifiedEvents = getUnifiedHouseEvents(events, chores, rooms, pets || (pet ? [pet] : []), expenses, now);

  const filteredEvents = unifiedEvents.filter(
    (e) => selectedCategory === 'all' || e.category === selectedCategory
  );

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const [year, month, day] = eventDate.split('-').map(Number);
    const [hours, minutes] = eventTime.split(':').map(Number);
    const eventTimestamp = new Date(year, month - 1, day, hours, minutes).getTime();

    addHouseEvent({
      title: title.trim(),
      description: description.trim() || undefined,
      date: eventTimestamp,
      endDate: eventTimestamp + 3600 * 1000,
      category,
      createdByUserId: currentUser.userId,
      createdByName: currentUser.displayName,
      source: 'manual',
    });

    setTitle('');
    setDescription('');
    setShowAddForm(false);
  };

  const handleExportAll = () => {
    exportEventsToCalendar(filteredEvents, 'agenda-domus.ics');
    showToast('Arquivo de agenda (.ics) gerado para o Apple/Google Calendar!', 'success');
  };

  const categories: { id: string; label: string }[] = [
    { id: 'all', label: 'Todos' },
    { id: 'rotina', label: 'Rotinas' },
    { id: 'limpeza', label: 'Limpeza' },
    { id: 'pet', label: 'Pet' },
    { id: 'contas', label: 'Contas' },
    { id: 'social', label: 'Social' },
    { id: 'manutencao', label: 'Manutenção' },
  ];

  const getCategoryBadgeClass = (cat: HouseEvent['category']) => {
    switch (cat) {
      case 'limpeza': return 'bg-[#34C759]/15 text-[#248A3D] dark:text-[#30D158]';
      case 'pet': return 'bg-[#FF9500]/15 text-[#C93400] dark:text-[#FF9F0A]';
      case 'contas': return 'bg-[#FF3B30]/15 text-[#D70015] dark:text-[#FF453A]';
      case 'social': return 'bg-[#AF52DE]/15 text-[#AF52DE]';
      case 'manutencao': return 'bg-[#007AFF]/15 text-[#007AFF]';
      default: return 'bg-slate-500/15 text-slate-500';
    }
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Agenda Compartilhada da Casa"
      subtitle={`${unifiedEvents.length} compromissos e rotinas sincronizados`}
    >
      <div className="space-y-4">
        {/* Top Actions: Export Button + Add Event Button */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleExportAll}
            className="py-2.5 px-3 rounded-2xl bg-slate-100 dark:bg-[#2C2C2E] hover:bg-slate-200 dark:hover:bg-white/10 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95"
          >
            <Download className="w-3.5 h-3.5 text-[#007AFF]" />
            <span>Exportar (.ics)</span>
          </button>

          <button
            onClick={() => setShowAddForm(true)}
            className="py-2.5 px-3 rounded-2xl bg-[#007AFF] hover:bg-[#0051A8] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Novo Evento</span>
          </button>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === c.id
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold'
                  : 'bg-slate-100 dark:bg-[#2C2C2E] text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/5'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Add Event Form */}
        {showAddForm && (
          <form
            onSubmit={handleCreateEvent}
            className="p-4 rounded-2xl bg-slate-50 dark:bg-[#2C2C2E] border border-slate-200/60 dark:border-white/5 space-y-3"
          >
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#007AFF]">
              Novo Compromisso Doméstico
            </h4>

            <div>
              <input
                type="text"
                placeholder="Título (ex: Visita do encanador ou Jantar)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-[10px] text-gray-500 dark:text-gray-400 block mb-1">Data</label>
                <input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/30 font-display font-semibold"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] text-gray-500 dark:text-gray-400 block mb-1">Horário</label>
                <input
                  type="time"
                  value={eventTime}
                  onChange={(e) => setEventTime(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/30 font-display font-semibold"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] text-gray-500 dark:text-gray-400 block mb-1">Categoria</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              >
                <option value="rotina">Rotina Doméstica</option>
                <option value="limpeza">Limpeza / Faxina</option>
                <option value="pet">Pet / Veterinário</option>
                <option value="contas">Contas / Pagamentos</option>
                <option value="social">Social / Recepção</option>
                <option value="manutencao">Manutenção Predial</option>
              </select>
            </div>

            <div>
              <input
                type="text"
                placeholder="Observações adicionais (opcional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-gray-100 dark:border-gray-800">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1.5 rounded-xl text-xs text-gray-500 hover:text-gray-900 dark:hover:text-white font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-u-xs transition-all active:scale-95"
              >
                Salvar Evento
              </button>
            </div>
          </form>
        )}

        {/* Events List */}
        <div className="space-y-2.5">
          {filteredEvents.length === 0 ? (
            <div className="py-8 text-center text-gray-400">
              <CalendarIcon className="w-8 h-8 mx-auto text-gray-300 dark:text-gray-600 mb-2 stroke-[1.5]" />
              <p className="text-xs font-bold text-gray-700 dark:text-gray-300 font-display">
                Nenhum evento agendado para esta categoria.
              </p>
            </div>
          ) : (
            filteredEvents.map((event) => {
              const eventDateObj = new Date(event.date);
              const isToday =
                eventDateObj.toDateString() === new Date().toDateString();
              const dateString = eventDateObj.toLocaleDateString('pt-BR', {
                weekday: 'short',
                day: '2-digit',
                month: 'short',
              });
              const timeString = eventDateObj.toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={event.id}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#2C2C2E]/60 border border-slate-100 dark:border-white/5 flex items-center justify-between gap-3 shadow-sm"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded-full ${getCategoryBadgeClass(event.category)}`}>
                        {event.category}
                      </span>
                      {isToday && (
                        <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-[#007AFF]/15 text-[#007AFF]">
                          Hoje
                        </span>
                      )}
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
                        {dateString} • {timeString}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {event.title}
                    </h4>

                    {event.description && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                        {event.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => exportEventsToCalendar([event], `${event.title}.ics`)}
                      className="p-2 rounded-xl text-slate-400 hover:text-[#007AFF] hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
                      title="Adicionar ao Apple / Google Calendar"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>

                    {event.source === 'manual' && (
                      <button
                        onClick={() => deleteHouseEvent(event.id)}
                        className="p-2 text-slate-400 hover:text-[#FF3B30] transition-colors"
                        title="Excluir evento"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </BottomSheet>
  );
};
