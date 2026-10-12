import { Expense, HouseMember } from '../types';

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
 * Calculates net balances and debt simplification transfers for a house's unsettled expenses.
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

    // Split equally among participants
    const splitCount = exp.splitAmongUserIds.length || members.length;
    const sharePerPerson = exp.amount / splitCount;

    for (const splitUserId of exp.splitAmongUserIds) {
      if (balances[splitUserId]) {
        balances[splitUserId].fairShare += sharePerPerson;
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
