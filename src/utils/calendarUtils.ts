import { Chore, Expense, HouseEvent, Pet, Room } from '../types';

/**
 * Formats a timestamp into iCalendar UTC format (e.g., 20261015T120000Z)
 */
function formatIcsDate(timestamp: number): string {
  const d = new Date(timestamp);
  return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

/**
 * Generates an RFC 5545 iCalendar (.ics) string for a single event or a list of events.
 */
export function generateIcsContent(events: HouseEvent[], houseName: string = 'Domus'): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Domus//Smart Household Management//PT',
    `X-WR-CALNAME:${houseName} - Agenda Doméstica`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];

  events.forEach((event) => {
    const uid = `${event.id}@domus.home`;
    const dtstart = formatIcsDate(event.date);
    const dtend = formatIcsDate(event.endDate || event.date + 3600 * 1000);
    const now = formatIcsDate(Date.now());

    lines.push(
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${now}`,
      `DTSTART:${dtstart}`,
      `DTEND:${dtend}`,
      `SUMMARY:${event.title}`,
      `DESCRIPTION:${event.description || 'Compromisso doméstico do app Domus'}`,
      `CATEGORIES:${event.category.toUpperCase()}`,
      'STATUS:CONFIRMED',
      'END:VEVENT'
    );
  });

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

/**
 * Triggers native download or iOS/Android share sheet for the .ics file.
 */
export function exportEventsToCalendar(events: HouseEvent[], filename: string = 'agenda-domus.ics'): void {
  const icsContent = generateIcsContent(events);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });

  // If Mobile Web Share supports files, offer direct calendar open
  if (navigator.canShare && navigator.canShare({ files: [new File([blob], filename, { type: 'text/calendar' })] })) {
    const file = new File([blob], filename, { type: 'text/calendar' });
    navigator.share({
      files: [file],
      title: 'Agenda da Casa - Domus',
      text: 'Adicionar eventos domésticos ao calendário nativo',
    }).catch(() => {
      // Fallback to direct download
      triggerDownload(blob, filename);
    });
    return;
  }

  triggerDownload(blob, filename);
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Aggregates manual house events with automatic chores, pet schedules, and expenses.
 */
export function getUnifiedHouseEvents(
  manualEvents: HouseEvent[],
  chores: Chore[],
  rooms: Room[],
  petsInput: Pet | Pet[],
  expenses: Expense[] = [],
  now: number = Date.now()
): HouseEvent[] {
  const roomMap = new Map(rooms.map((r) => [r.id, r.name]));
  const aggregated: HouseEvent[] = [...manualEvents];
  const dayMs = 86_400_000;

  // 1. Chores with upcoming or overdue due dates
  chores.forEach((c) => {
    const nextDue = c.lastCompletedAt
      ? c.lastCompletedAt + c.frequencyDays * dayMs
      : now; // If never completed, due today

    // Only include in calendar if due within the next 30 days or overdue
    if (nextDue <= now + 30 * dayMs) {
      const roomName = roomMap.get(c.roomId) || 'Casa';
      aggregated.push({
        id: `auto_chore_${c.id}`,
        title: `Limpeza: ${c.title}`,
        description: `Ambiente: ${roomName} • Frequência: a cada ${c.frequencyDays} dias • Recompensa: +${c.xpReward} XP`,
        date: Math.max(now, nextDue),
        endDate: Math.max(now, nextDue) + 3600 * 1000,
        category: 'limpeza',
        createdByUserId: 'system',
        createdByName: 'Domus Rotina',
        source: 'chore',
        sourceId: c.id,
      });
    }
  });

  // 2. Pet Medical Records, Sand Change, Bath for all pets
  const petList: Pet[] = Array.isArray(petsInput) ? petsInput : (petsInput ? [petsInput] : []);

  petList.forEach((pet) => {
    // 2a. Pet Medical Records (vaccines, deworming)
    pet.medicalRecords?.forEach((med) => {
      if (med.nextDueDate) {
        aggregated.push({
          id: `auto_pet_med_${pet.id}_${med.id}`,
          title: `${pet.name}: ${med.name}`,
          description: `Dose veterinária programada para ${pet.name}.`,
          date: med.nextDueDate,
          endDate: med.nextDueDate + 3600 * 1000,
          category: 'pet',
          createdByUserId: 'system',
          createdByName: `${pet.name} Care`,
          source: 'pet',
          sourceId: med.id,
        });
      }
    });

    // 2b. Pet Full Sand Change (for cats)
    if (pet.litterBox) {
      const nextSandChange = pet.litterBox.lastFullChangeAt + pet.litterBox.fullChangeIntervalDays * dayMs;
      aggregated.push({
        id: `auto_pet_sand_change_${pet.id}`,
        title: `Troca de Areia: ${pet.name}`,
        description: `Ciclo de higienização completa da caixa de areia sanitária de ${pet.name}.`,
        date: Math.max(now, nextSandChange),
        endDate: Math.max(now, nextSandChange) + 3600 * 1000,
        category: 'pet',
        createdByUserId: 'system',
        createdByName: `${pet.name} Care`,
        source: 'pet',
        sourceId: pet.id,
      });
    }

    // 2c. Pet Bath (for dogs / hygiene)
    if (pet.bath) {
      const nextBath = pet.bath.lastBathAt + pet.bath.intervalDays * dayMs;
      aggregated.push({
        id: `auto_pet_bath_${pet.id}`,
        title: `Banho & Tosa: ${pet.name}`,
        description: `Ciclo de higiene e banho programado para ${pet.name}.`,
        date: Math.max(now, nextBath),
        endDate: Math.max(now, nextBath) + 3600 * 1000,
        category: 'pet',
        createdByUserId: 'system',
        createdByName: `${pet.name} Care`,
        source: 'pet',
        sourceId: pet.id,
      });
    }
  });

  // 3. Bills & Expenses with due dates
  expenses?.forEach((exp) => {
    if (exp.isSettled) return;

    if (exp.dueDate) {
      aggregated.push({
        id: `auto_expense_${exp.id}`,
        title: `Vencimento: ${exp.description}`,
        description: `Boleto / Conta da casa no valor de R$ ${exp.amount.toFixed(2)}${exp.barcode ? ' • Código de barras disponível' : ''}`,
        date: exp.dueDate,
        endDate: exp.dueDate + 3600 * 1000,
        category: 'contas',
        createdByUserId: exp.paidByUserId,
        createdByName: 'Financeiro Domus',
        source: 'expense',
        sourceId: exp.id,
      });
    } else if (exp.dueDay || (exp.isRecurring && exp.recurringDay)) {
      const dayNum = exp.dueDay || exp.recurringDay!;
      const currentDate = new Date(now);
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();
      let billDate = new Date(currentYear, currentMonth, dayNum, 10, 0, 0).getTime();
      if (billDate < now - dayMs) {
        billDate = new Date(currentYear, currentMonth + 1, dayNum, 10, 0, 0).getTime();
      }
      aggregated.push({
        id: `auto_expense_${exp.id}_${billDate}`,
        title: `Vencimento: ${exp.description}`,
        description: `Conta fixa mensal da casa (R$ ${exp.amount.toFixed(2)})${exp.barcode ? ' • Código de barras disponível' : ''}`,
        date: billDate,
        endDate: billDate + 3600 * 1000,
        category: 'contas',
        createdByUserId: exp.paidByUserId,
        createdByName: 'Financeiro Domus',
        source: 'expense',
        sourceId: exp.id,
      });
    }
  });

  // 4. Sort all by date ascending
  return aggregated.sort((a, b) => a.date - b.date);
}
