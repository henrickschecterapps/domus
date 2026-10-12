import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Calendar as CalendarIcon, Clock, ChevronRight, Share2 } from 'lucide-react';
import { getUnifiedHouseEvents, exportEventsToCalendar } from '../utils/calendarUtils';
import { HouseEvent } from '../types';
import { Badge, BadgeVariant } from './untitled/Badge';

interface CalendarWidgetProps {
  onOpenFullCalendar: () => void;
}

export const CalendarWidget: React.FC<CalendarWidgetProps> = ({ onOpenFullCalendar }) => {
  const { events, chores, rooms, pet, pets, expenses } = useApp();
  const [selectedDayOffset, setSelectedDayOffset] = useState<number>(0);

  const now = Date.now();
  const dayMs = 86_400_000;

  // Build unified schedule
  const unifiedEvents = getUnifiedHouseEvents(events, chores, rooms, pets || (pet ? [pet] : []), expenses, now);

  // Generate 7 upcoming days strip
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now + i * dayMs);
    const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    const dayEnd = dayStart + dayMs;

    const dayEvents = unifiedEvents.filter((e) => e.date >= dayStart && e.date < dayEnd);

    return {
      offset: i,
      date: d,
      dayNumber: d.getDate(),
      dayName: i === 0 ? 'Hoje' : d.toLocaleDateString('pt-BR', { weekday: 'short' }).slice(0, 3),
      eventCount: dayEvents.length,
      events: dayEvents,
    };
  });

  const selectedDay = days.find((d) => d.offset === selectedDayOffset) || days[0];

  const getCategoryBadgeVariant = (category: HouseEvent['category']): BadgeVariant => {
    switch (category) {
      case 'limpeza': return 'success';
      case 'pet': return 'warning';
      case 'contas': return 'error';
      case 'social': return 'brand';
      case 'manutencao': return 'blue';
      default: return 'gray';
    }
  };

  return (
    <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 shadow-u-xs transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-brand-50 dark:bg-brand-950/60 border border-brand-100 dark:border-brand-900/30 text-brand-600 dark:text-brand-400 flex items-center justify-center">
            <CalendarIcon className="w-4 h-4 stroke-[2.2]" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
              Agenda & Compromissos
            </h2>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">Próximos 7 dias sincronizados</p>
          </div>
        </div>

        <button
          onClick={onOpenFullCalendar}
          className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 flex items-center gap-0.5 transition-colors"
        >
          <span>Ver Completa</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 7-Day Untitled UI Calendar Strip */}
      <div className="grid grid-cols-7 gap-1 p-1 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-200/60 dark:border-gray-700/60 mb-4">
        {days.map((d) => {
          const isSelected = d.offset === selectedDayOffset;
          return (
            <button
              key={d.offset}
              onClick={() => setSelectedDayOffset(d.offset)}
              className={`flex flex-col items-center py-2 rounded-lg transition-all duration-150 ${
                isSelected
                  ? 'bg-brand-600 text-white shadow-u-xs font-bold'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700/60'
              }`}
            >
              <span className="text-[10px] uppercase font-semibold tracking-tighter opacity-80">
                {d.dayName}
              </span>
              <span className="text-sm font-bold mt-0.5">{d.dayNumber}</span>
              <div className="flex gap-0.5 mt-1 h-1.5 items-center justify-center">
                {d.eventCount > 0 && (
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isSelected ? 'bg-white' : 'bg-brand-600 dark:bg-brand-400'
                    }`}
                  />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Day Agenda Items */}
      <div className="space-y-2.5">
        {selectedDay.events.length === 0 ? (
          <div className="py-6 text-center text-gray-400">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Nenhum compromisso marcado para {selectedDay.dayName.toLowerCase()}.
            </p>
          </div>
        ) : (
          selectedDay.events.slice(0, 3).map((event) => (
            <div
              key={event.id}
              className="flex items-center justify-between gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 transition-all shadow-u-xs"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant={getCategoryBadgeVariant(event.category)} size="sm">
                    {event.category}
                  </Badge>
                  <span className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-1 font-medium">
                    <Clock className="w-3 h-3 text-gray-400" />
                    {new Date(event.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <h4 className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                  {event.title}
                </h4>
              </div>

              <button
                onClick={() => exportEventsToCalendar([event], `${event.title}.ics`)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                title="Exportar para Apple/Google Calendar"
              >
                <Share2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}

        {selectedDay.events.length > 3 && (
          <button
            onClick={onOpenFullCalendar}
            className="w-full text-center text-xs font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 pt-1"
          >
            + mais {selectedDay.events.length - 3} itens neste dia
          </button>
        )}
      </div>
    </div>
  );
};
