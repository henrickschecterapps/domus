import { Expense, ExpenseCategory, ExpenseNature, ExpensePaymentStatus, HouseBudget, HouseMember } from '../types';

export interface MemberBalance {
  userId: string;
  displayName: string;
  totalPaid: number;
  fairShare: number;
  net: number; // positive = receives, negative = owes
}

export interface SettlementTransfer {
  fromUserId: string;
  fromName: string;
  toUserId: string;
  toName: string;
  amount: number;
}

/**
 * Calculates net balances and debt simplification transfers for a house's unsettled expenses,
 * supporting equal splits, percentage-based splits, and exact amount splits.
 */
export function calculateFinancialBalances(
  expenses: Expense[],
  members: HouseMember[]
): {
  balances: Record<string, MemberBalance>;
  settlements: SettlementTransfer[];
  totalHouseSpend: number;
} {
  const memberMap = new Map<string, HouseMember>();
  const balances: Record<string, MemberBalance> = {};

  members.forEach((m) => {
    memberMap.set(m.userId, m);
    balances[m.userId] = {
      userId: m.userId,
      displayName: m.displayName,
      totalPaid: 0,
      fairShare: 0,
      net: 0,
    };
  });

  let totalHouseSpend = 0;

  // Process only unsettled expenses
  const activeExpenses = expenses.filter((e) => !e.isSettled);

  for (const exp of activeExpenses) {
    totalHouseSpend += exp.amount;

    // Credit the payer
    if (balances[exp.paidByUserId]) {
      balances[exp.paidByUserId].totalPaid += exp.amount;
    }

    const splitUsers =
      exp.splitAmongUserIds && exp.splitAmongUserIds.length > 0
        ? exp.splitAmongUserIds
        : members.map((m) => m.userId);

    if (exp.splitType === 'exact' && exp.customSplits) {
      // Exact currency amount allocated per user
      for (const splitUserId of splitUsers) {
        const share = exp.customSplits[splitUserId] ?? 0;
        if (balances[splitUserId]) {
          balances[splitUserId].fairShare += share;
        }
      }
    } else if (exp.splitType === 'percentage' && exp.customSplits) {
      // Percentage of total allocated per user
      for (const splitUserId of splitUsers) {
        const pct = exp.customSplits[splitUserId] ?? 100 / splitUsers.length;
        const share = (exp.amount * pct) / 100;
        if (balances[splitUserId]) {
          balances[splitUserId].fairShare += share;
        }
      }
    } else {
      // Default: Equal split among participants
      const splitCount = splitUsers.length || members.length || 1;
      const sharePerPerson = exp.amount / splitCount;

      for (const splitUserId of splitUsers) {
        if (balances[splitUserId]) {
          balances[splitUserId].fairShare += sharePerPerson;
        }
      }
    }
  }

  // Calculate Net for each member: Net = TotalPaid - FairShare
  Object.values(balances).forEach((b) => {
    b.net = Number((b.totalPaid - b.fairShare).toFixed(2));
  });

  // Simplify debts into minimal pairwise settlements
  // Debtors (net < 0) and Creditors (net > 0)
  const debtors: { userId: string; name: string; amount: number }[] = [];
  const creditors: { userId: string; name: string; amount: number }[] = [];

  Object.values(balances).forEach((b) => {
    if (b.net < -0.01) {
      debtors.push({ userId: b.userId, name: b.displayName, amount: -b.net });
    } else if (b.net > 0.01) {
      creditors.push({ userId: b.userId, name: b.displayName, amount: b.net });
    }
  });

  const settlements: SettlementTransfer[] = [];

  let dIdx = 0;
  let cIdx = 0;

  while (dIdx < debtors.length && cIdx < creditors.length) {
    const debtor = debtors[dIdx];
    const creditor = creditors[cIdx];

    const payment = Math.min(debtor.amount, creditor.amount);

    if (payment > 0.01) {
      settlements.push({
        fromUserId: debtor.userId,
        fromName: debtor.name,
        toUserId: creditor.userId,
        toName: creditor.name,
        amount: Number(payment.toFixed(2)),
      });
    }

    debtor.amount -= payment;
    creditor.amount -= payment;

    if (debtor.amount <= 0.01) dIdx++;
    if (creditor.amount <= 0.01) cIdx++;
  }

  return { balances, settlements, totalHouseSpend };
}

export function formatCurrencyBRL(amount: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount);
}

// ==========================================
// PIX EMV BR CODE (BANCO CENTRAL DO BRASIL)
// ==========================================

function formatTlv(id: string, value: string): string {
  const len = value.length.toString().padStart(2, '0');
  return `${id}${len}${value}`;
}

function normalizeAscii(text: string, maxLen: number): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .replace(/[^a-zA-Z0-9\s]/g, '') // apenas alfanuméricos e espaços
    .trim()
    .toUpperCase()
    .substring(0, maxLen);
}

function computeCrc16(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return (crc & 0xffff).toString(16).toUpperCase().padStart(4, '0');
}

export interface PixPayloadParams {
  pixKey: string;
  recipientName: string;
  city?: string;
  amount?: number;
  txid?: string;
  description?: string;
}

export function sanitizePixKey(key: string): string {
  const trimmed = key.trim();
  if (!trimmed) return '';

  // If email
  if (trimmed.includes('@')) {
    return trimmed.toLowerCase();
  }

  // If UUID / EVP key
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmed);
  if (isUuid) {
    return trimmed.toLowerCase();
  }

  const digitsOnly = trimmed.replace(/\D/g, '');

  // If explicit CPF format (contains . or -)
  if (trimmed.includes('.') || trimmed.includes('-')) {
    if (digitsOnly.length === 11) return digitsOnly;
  }

  // CNPJ
  if (digitsOnly.length === 14) {
    return digitsOnly;
  }

  // Phone international or national format
  if (trimmed.startsWith('+55')) {
    return `+55${digitsOnly.slice(2)}`;
  } else if (trimmed.startsWith('+')) {
    return `+${digitsOnly}`;
  } else if (digitsOnly.length === 10 || digitsOnly.length === 11) {
    // If not a CPF format, BACEN requires +55 prefix for phone keys
    return `+55${digitsOnly}`;
  }

  return trimmed;
}

/**
 * Generates an official Central Bank of Brazil (BACEN) EMV BR Code string (PIX Copia e Cola).
 * Works directly with Nubank, Itaú, Santander, Inter, BB, Mercado Pago, etc.
 */
export function generatePixPayload(params: PixPayloadParams): string {
  const { pixKey, recipientName, city = 'BRASILIA', amount, txid = '***', description } = params;

  // Clean PIX Key (if phone or cpf, sanitize according to BACEN spec)
  const cleanKey = sanitizePixKey(pixKey);

  // 00: Format Indicator
  let payload = formatTlv('00', '01');

  // 26: Merchant Account Information (PIX)
  const gui = formatTlv('00', 'br.gov.bcb.pix');
  const keyTlv = formatTlv('01', cleanKey);
  const descTlv = description ? formatTlv('02', normalizeAscii(description, 25)) : '';
  const merchantInfo = `${gui}${keyTlv}${descTlv}`;
  payload += formatTlv('26', merchantInfo);

  // 52: Merchant Category Code (0000 = ISO 18245)
  payload += formatTlv('52', '0000');

  // 53: Transaction Currency (986 = BRL)
  payload += formatTlv('53', '986');

  // 54: Transaction Amount (optional or formatted with 2 decimal places)
  if (amount && amount > 0) {
    payload += formatTlv('54', amount.toFixed(2));
  }

  // 58: Country Code
  payload += formatTlv('58', 'BR');

  // 59: Merchant / Recipient Name (max 25)
  const safeName = normalizeAscii(recipientName, 25) || 'RECEBEDOR DOMUS';
  payload += formatTlv('59', safeName);

  // 60: Merchant City (max 15)
  const safeCity = normalizeAscii(city, 15) || 'BRASILIA';
  payload += formatTlv('60', safeCity);

  // 62: Additional Data Field (txid, max 25)
  const cleanTxid = (txid || '***').replace(/[^a-zA-Z0-9]/g, '').substring(0, 25) || '***';
  const additionalData = formatTlv('05', cleanTxid);
  payload += formatTlv('62', additionalData);

  // 63: CRC16 Checksum
  payload += '6304';
  const crc = computeCrc16(payload);

  return `${payload}${crc}`;
}

// ==========================================
// ORÇAMENTO & TETO DE GASTOS (BUDGET STATUS)
// ==========================================

export interface BudgetStatus {
  monthlyTarget: number;
  totalSpent: number;
  remaining: number;
  percentageUsed: number;
  status: 'safe' | 'warning' | 'danger' | 'exceeded';
  categorySpending: Record<ExpenseCategory, number>;
  categoryLimits: Partial<Record<ExpenseCategory, number>>;
  daysLeftInMonth: number;
  projectedEndSpend: number;
  dailyRemainingBudget: number;
}

export function calculateBudgetStatus(
  expenses: Expense[],
  budget?: HouseBudget,
  referenceDate: Date = new Date()
): BudgetStatus {
  const currentMonth = referenceDate.getMonth();
  const currentYear = referenceDate.getFullYear();

  // Filter current month expenses
  const monthExpenses = expenses.filter((e) => {
    const expDate = new Date(e.date);
    return expDate.getMonth() === currentMonth && expDate.getFullYear() === currentYear;
  });

  const categorySpending: Record<ExpenseCategory, number> = {
    supermercado: 0,
    casa: 0,
    pet: 0,
    contas: 0,
  };

  let totalSpent = 0;
  for (const exp of monthExpenses) {
    totalSpent += exp.amount;
    if (categorySpending[exp.category] !== undefined) {
      categorySpending[exp.category] += exp.amount;
    }
  }

  const monthlyTarget = budget?.monthlyTarget && budget.monthlyTarget > 0 ? budget.monthlyTarget : 3500;
  const remaining = Math.max(0, monthlyTarget - totalSpent);
  const percentageUsed = monthlyTarget > 0 ? Math.round((totalSpent / monthlyTarget) * 100) : 0;

  let status: 'safe' | 'warning' | 'danger' | 'exceeded' = 'safe';
  if (percentageUsed >= 100) {
    status = 'exceeded';
  } else if (percentageUsed >= 90) {
    status = 'danger';
  } else if (percentageUsed >= (budget?.alertThresholdPercent || 70)) {
    status = 'warning';
  }

  // Days left in current month calculation
  const totalDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const currentDay = referenceDate.getDate();
  const daysLeftInMonth = Math.max(1, totalDaysInMonth - currentDay);

  const averageDailySpendSoFar = currentDay > 0 ? totalSpent / currentDay : 0;
  const projectedEndSpend = totalSpent + averageDailySpendSoFar * daysLeftInMonth;
  const dailyRemainingBudget = remaining > 0 ? remaining / daysLeftInMonth : 0;

  return {
    monthlyTarget,
    totalSpent,
    remaining,
    percentageUsed,
    status,
    categorySpending,
    categoryLimits: budget?.categoryTargets || {},
    daysLeftInMonth,
    projectedEndSpend,
    dailyRemainingBudget,
  };
}

// ==========================================
// EXPORTAÇÃO CSV DE DESPESAS
// ==========================================

export function generateExpensesCsv(expenses: Expense[], members: HouseMember[]): string {
  const memberMap = new Map<string, string>();
  members.forEach((m) => memberMap.set(m.userId, m.displayName));

  const headers = [
    'ID',
    'Data',
    'Descrição',
    'Categoria',
    'Valor (R$)',
    'Pago Por',
    'Divisão',
    'Parcelamento',
    'Status',
    'Observações',
  ];

  const rows = expenses.map((exp) => {
    const dateStr = new Date(exp.date).toLocaleDateString('pt-BR');
    const payerName = memberMap.get(exp.paidByUserId) || 'Desconhecido';
    
    let splitSummary = 'Todos os moradores';
    if (exp.splitType === 'exact' && exp.customSplits) {
      splitSummary = `Valores exatos (${Object.entries(exp.customSplits)
        .map(([uid, val]) => `${memberMap.get(uid) || uid}: R$ ${val.toFixed(2)}`)
        .join('; ')})`;
    } else if (exp.splitType === 'percentage' && exp.customSplits) {
      splitSummary = `Porcentagem (${Object.entries(exp.customSplits)
        .map(([uid, pct]) => `${memberMap.get(uid) || uid}: ${pct}%`)
        .join('; ')})`;
    } else if (exp.splitAmongUserIds && exp.splitAmongUserIds.length > 0) {
      splitSummary = exp.splitAmongUserIds.map((uid) => memberMap.get(uid) || uid).join(', ');
    }

    const installmentInfo = exp.installment
      ? `Parcela ${exp.installment.current}/${exp.installment.total}`
      : 'À vista';

    const statusStr = exp.isSettled ? 'Quitado' : 'Em Aberto';
    const notesStr = exp.notes ? `"${exp.notes.replace(/"/g, '""')}"` : '';
    const descStr = `"${exp.description.replace(/"/g, '""')}"`;

    return [
      exp.id,
      dateStr,
      descStr,
      exp.category,
      exp.amount.toFixed(2).replace('.', ','),
      `"${payerName}"`,
      `"${splitSummary}"`,
      installmentInfo,
      statusStr,
      notesStr,
    ].join(';');
  });

  // UTF-8 with BOM for Excel compatibility
  return '\uFEFF' + [headers.join(';'), ...rows].join('\r\n');
}

// ==========================================
// CONTAS FIXAS, VARIÁVEIS, VENCIMENTO & DÍVIDAS
// ==========================================

/**
 * Resolves the effective due timestamp for an expense.
 * If expense.dueDate is provided, returns it.
 * If expense.dueDay (or legacy expense.recurringDay) is provided, computes the due date in the current/relevant month.
 */
export function getExpenseEffectiveDueDate(expense: Expense, now = Date.now()): number | null {
  if (expense.dueDate) {
    return expense.dueDate;
  }
  const day = expense.dueDay || (expense.isRecurring ? expense.recurringDay : undefined);
  if (day) {
    const nowDate = new Date(now);
    const year = nowDate.getFullYear();
    const month = nowDate.getMonth();
    // Due date at 23:59:59 of that day
    return new Date(year, month, day, 23, 59, 59, 999).getTime();
  }
  return null;
}

/**
 * Calculates current payment status:
 * - 'paid': if already settled
 * - 'overdue': if unpaid and due date was before today
 * - 'due_today': if unpaid and due date is today
 * - 'upcoming': if unpaid and due date is in future
 * - 'no_due_date': if unpaid and has no due date
 */
export function getExpensePaymentStatus(expense: Expense, now = Date.now()): ExpensePaymentStatus {
  if (expense.isSettled) {
    return 'paid';
  }

  const effectiveDueDate = getExpenseEffectiveDueDate(expense, now);
  if (!effectiveDueDate) {
    return 'no_due_date';
  }

  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);

  if (effectiveDueDate < startOfToday.getTime()) {
    return 'overdue';
  } else if (effectiveDueDate <= endOfToday.getTime()) {
    return 'due_today';
  } else {
    return 'upcoming';
  }
}

/**
 * Returns days remaining or days overdue.
 */
export function getDaysOverdueOrRemaining(dueDate: number, now = Date.now()): {
  days: number;
  isOverdue: boolean;
  isToday: boolean;
} {
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);

  if (dueDate >= startOfToday.getTime() && dueDate <= endOfToday.getTime()) {
    return { days: 0, isOverdue: false, isToday: true };
  }

  const msDiff = dueDate - now;
  const dayMs = 86_400_000;
  if (msDiff < 0) {
    const days = Math.max(1, Math.ceil(Math.abs(msDiff) / dayMs));
    return { days, isOverdue: true, isToday: false };
  } else {
    const days = Math.max(1, Math.ceil(msDiff / dayMs));
    return { days, isOverdue: false, isToday: false };
  }
}

export interface OverdueDebtSummary {
  totalOverdue: number;
  count: number;
  overdueExpenses: Expense[];
}

/**
 * Filters all unpaid expenses that are past due.
 */
export function calculateOverdueDebt(expenses: Expense[], now = Date.now()): OverdueDebtSummary {
  const overdueExpenses = expenses.filter((e) => getExpensePaymentStatus(e, now) === 'overdue');
  const totalOverdue = overdueExpenses.reduce((sum, e) => sum + e.amount, 0);
  return {
    totalOverdue,
    count: overdueExpenses.length,
    overdueExpenses,
  };
}

export interface NatureTotalsSummary {
  fixedTotal: number;
  variableTotal: number;
  fixedPaid: number;
  fixedPending: number;
  variablePaid: number;
  variablePending: number;
}

/**
 * Computes totals for Fixed vs Variable expenses.
 */
export function calculateFixedAndVariableTotals(expenses: Expense[]): NatureTotalsSummary {
  let fixedTotal = 0;
  let variableTotal = 0;
  let fixedPaid = 0;
  let fixedPending = 0;
  let variablePaid = 0;
  let variablePending = 0;

  expenses.forEach((e) => {
    // If nature is explicitly 'fixed' OR is recurring/contas, consider fixed
    const isFixed =
      e.nature === 'fixed' ||
      (e.nature === undefined && (!!e.isRecurring || e.category === 'contas'));

    if (isFixed) {
      fixedTotal += e.amount;
      if (e.isSettled) fixedPaid += e.amount;
      else fixedPending += e.amount;
    } else {
      variableTotal += e.amount;
      if (e.isSettled) variablePaid += e.amount;
      else variablePending += e.amount;
    }
  });

  return {
    fixedTotal,
    variableTotal,
    fixedPaid,
    fixedPending,
    variablePaid,
    variablePending,
  };
}
