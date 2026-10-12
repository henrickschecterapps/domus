import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { ExpenseCategory } from '../types';
import {
  calculateFinancialBalances,
  formatCurrencyBRL,
} from '../utils/financeMath';
import {
  Wallet,
  Plus,
  ArrowRight,
  Trash2,
  Users,
  Copy,
  Check,
  MessageCircle,
  Paperclip,
  X,
  Calendar,
  PieChart,
  Repeat,
  CheckCircle2,
  Clock,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { BottomSheet } from '../components/BottomSheet';
import { Button } from '../components/untitled/Button';
import { Badge } from '../components/untitled/Badge';
import { triggerHaptic } from '../utils/haptics';
import { playCoinSound, playSuccessChime } from '../utils/soundEffects';

export const FinanceView: React.FC = () => {
  const {
    expenses,
    members,
    currentUser,
    addExpense,
    toggleExpenseSettled,
    deleteExpense,
    showToast,
  } = useApp();

  const soundEnabled = currentUser.soundEnabled ?? true;
  const vibrationEnabled = currentUser.vibrationEnabled ?? true;

  const [showAddSheet, setShowAddSheet] = useState(false);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paidByUserId, setPaidByUserId] = useState(currentUser.userId);
  const [category, setCategory] = useState<ExpenseCategory>('supermercado');
  const [splitWithAll, setSplitWithAll] = useState(true);
  const [selectedSplitUsers, setSelectedSplitUsers] = useState<string[]>(
    members.map((m) => m.userId)
  );

  // Recurring bills
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringDay, setRecurringDay] = useState(10);

  // Receipt image attachment
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [viewingReceiptUrl, setViewingReceiptUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // PIX feedback
  const [copiedPixTarget, setCopiedPixTarget] = useState<string | null>(null);

  const { balances, settlements, totalHouseSpend } = calculateFinancialBalances(
    expenses,
    members
  );

  const userBalance = balances[currentUser.userId] || {
    totalPaid: 0,
    fairShare: 0,
    net: 0,
  };

  const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      showToast('Imagem muito grande. Máximo 3MB.', 'warning');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setReceiptUrl(reader.result as string);
      showToast('Comprovante anexado!', 'success');
    };
    reader.readAsDataURL(file);
  };

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount.replace(',', '.'));
    if (!description.trim() || isNaN(parsedAmount) || parsedAmount <= 0) return;

    const splitAmong = splitWithAll ? members.map((m) => m.userId) : selectedSplitUsers;

    addExpense({
      description: description.trim(),
      amount: parsedAmount,
      paidByUserId,
      splitAmongUserIds: splitAmong,
      category,
      date: Date.now(),
      isSettled: false,
      receiptUrl: receiptUrl || undefined,
      isRecurring,
      recurringDay: isRecurring ? recurringDay : undefined,
    });

    if (soundEnabled) playCoinSound(soundEnabled);
    if (vibrationEnabled) triggerHaptic('medium');

    setDescription('');
    setAmount('');
    setReceiptUrl(null);
    setIsRecurring(false);
    setShowAddSheet(false);
    showToast('Despesa registrada com sucesso!', 'success');
  };

  const handleCopyPix = (pixKey: string, creditorName: string) => {
    navigator.clipboard.writeText(pixKey);
    setCopiedPixTarget(pixKey);
    if (vibrationEnabled) triggerHaptic('light');
    showToast(`Chave Pix de ${creditorName} copiada!`, 'success');
    setTimeout(() => setCopiedPixTarget(null), 2500);
  };

  // Category totals
  const categoryTotals: Record<ExpenseCategory, number> = {
    supermercado: 0,
    casa: 0,
    pet: 0,
    contas: 0,
  };

  expenses.forEach((e) => {
    categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
  });

  const totalAllTime = Object.values(categoryTotals).reduce((a, b) => a + b, 0);

  // Recurring bills
  const recurringExpenses = expenses.filter((e) => e.isRecurring);

  return (
    <div className="space-y-5 pb-20 animate-in fade-in duration-200 w-full">
      {/* Net Balance Master Card */}
      <div className="rounded-2xl bg-gradient-to-br from-brand-600 via-brand-700 to-brand-800 text-white dark:bg-gray-900 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 border border-brand-500/20 dark:border-gray-800 p-6 shadow-u-md relative overflow-hidden transition-all">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/15 dark:bg-brand-950/60 flex items-center justify-center">
              <Wallet className="w-4 h-4 text-white stroke-[2.2]" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-brand-100 dark:text-gray-300">
              Balanço Financeiro Individual
            </span>
          </div>
          <span className="text-xs text-brand-100/90 dark:text-gray-400 font-medium">
            Total em aberto: <strong className="text-white font-semibold">{formatCurrencyBRL(totalHouseSpend)}</strong>
          </span>
        </div>

        <div className="my-4">
          <span className="text-xs text-brand-200 dark:text-gray-400 block mb-1">
            {userBalance.net > 0
              ? 'Você tem a receber dos moradores'
              : userBalance.net < 0
              ? 'Você precisa transferir aos moradores'
              : 'Seu saldo está perfeitamente equilibrado'}
          </span>
          <div className="flex items-baseline gap-2">
            <span
              className={`text-3xl sm:text-4xl font-bold tracking-tight ${
                userBalance.net > 0
                  ? 'text-white dark:text-success-400'
                  : userBalance.net < 0
                  ? 'text-error-200 dark:text-error-400'
                  : 'text-white'
              }`}
            >
              {formatCurrencyBRL(Math.abs(userBalance.net))}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-white/15 dark:border-gray-800 text-xs">
          <div>
            <span className="text-[11px] text-brand-200 dark:text-gray-400 block mb-0.5">Total desembolsado por você:</span>
            <span className="font-bold text-white text-sm">
              {formatCurrencyBRL(userBalance.totalPaid)}
            </span>
          </div>
          <div>
            <span className="text-[11px] text-brand-200 dark:text-gray-400 block mb-0.5">Sua cota justa calculada:</span>
            <span className="font-bold text-white text-sm">
              {formatCurrencyBRL(userBalance.fairShare)}
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Settlements & Recurring Bills */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Fair Share Settlement Matrix with 1-click PIX & WhatsApp */}
        <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 shadow-u-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-brand-50 dark:bg-brand-950/60 border border-brand-100 dark:border-brand-900/30 text-brand-600 dark:text-brand-400 flex items-center justify-center">
                <Users className="w-4 h-4 stroke-[2.2]" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                  Acerto Simplificado de Contas
                </h3>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">Compensação mínima com Chave PIX</p>
              </div>
            </div>
            <button
              onClick={() => setShowAddSheet(true)}
              className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800/40 shadow-u-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nova Despesa</span>
            </button>
          </div>

          {settlements.length === 0 ? (
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 text-center text-gray-500 dark:text-gray-400 text-xs font-medium border border-gray-200/60 dark:border-gray-800">
              🎉 Todas as contas estão 100% equilibradas e quitadas!
            </div>
          ) : (
            <div className="space-y-3">
              {settlements.map((settlement, idx) => {
                const isUserDebtor = settlement.fromUserId === currentUser.userId;
                const isUserCreditor = settlement.toUserId === currentUser.userId;
                const creditor = members.find((m) => m.userId === settlement.toUserId);
                const debtor = members.find((m) => m.userId === settlement.fromUserId);

                const hasPix = !!creditor?.pixKey;
                const debtorPhoneClean = debtor?.phone ? debtor.phone.replace(/[^0-9]/g, '') : null;
                const creditorPixKey = creditor?.pixKey || '';

                const whatsappMsg = encodeURIComponent(
                  `Olá ${debtor?.displayName}! No Domus temos um acerto pendente de ${formatCurrencyBRL(settlement.amount)}. Segue minha chave Pix (${creditor?.pixKeyType || 'chave'}): ${creditorPixKey}`
                );

                return (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-xl border text-xs transition-colors space-y-2.5 ${
                      isUserDebtor
                        ? 'bg-error-50/50 dark:bg-error-950/30 border-error-200/80 dark:border-error-900/50'
                        : isUserCreditor
                        ? 'bg-success-50/50 dark:bg-success-950/30 border-success-200/80 dark:border-success-900/50'
                        : 'bg-gray-50 dark:bg-gray-800/40 border-gray-200/60 dark:border-gray-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-bold text-gray-900 dark:text-gray-100">{settlement.fromName}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
                        <span className="font-bold text-gray-900 dark:text-gray-100">{settlement.toName}</span>
                      </div>

                      <span className="font-black font-display text-warning-600 dark:text-warning-400 text-sm">
                        {formatCurrencyBRL(settlement.amount)}
                      </span>
                    </div>

                    {/* Quick action buttons: Copy PIX or WhatsApp Reminder */}
                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-gray-200/40 dark:border-gray-800/60">
                      {hasPix && (
                        <button
                          onClick={() => handleCopyPix(creditorPixKey, creditor?.displayName || 'Credor')}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] shadow-u-xs transition-all active:scale-95"
                          title="Copiar Chave PIX"
                        >
                          {copiedPixTarget === creditorPixKey ? (
                            <Check className="w-3 h-3 text-white" />
                          ) : (
                            <Copy className="w-3 h-3 text-white" />
                          )}
                          <span>{copiedPixTarget === creditorPixKey ? 'PIX Copiado!' : 'Copiar PIX'}</span>
                        </button>
                      )}

                      {isUserCreditor && debtorPhoneClean && (
                        <a
                          href={`https://wa.me/55${debtorPhoneClean}?text=${whatsappMsg}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-success-600 hover:bg-success-700 text-white font-semibold text-[11px] shadow-u-xs transition-all active:scale-95"
                          title="Enviar lembrete amigável no WhatsApp com sua chave PIX"
                        >
                          <MessageCircle className="w-3 h-3 text-white" />
                          <span>Cobrar no WhatsApp</span>
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Section: Contas Recorrentes / Fixas do Lar */}
        <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 shadow-u-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-brand-50 dark:bg-brand-950/60 border border-brand-100 dark:border-brand-900/30 text-brand-600 dark:text-brand-400 flex items-center justify-center">
                <Repeat className="w-4 h-4 stroke-[2.2]" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                  Contas Fixas & Recorrentes
                </h3>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">Vencimentos mensais do lar</p>
              </div>
            </div>
            <Badge variant="brand" size="sm">Todo Mês</Badge>
          </div>

          {recurringExpenses.length === 0 ? (
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 text-center text-gray-500 dark:text-gray-400 text-xs font-medium border border-gray-200/60 dark:border-gray-800">
              Nenhuma conta fixa cadastrada. Marque "Conta Recorrente" ao criar uma despesa.
            </div>
          ) : (
            <div className="space-y-2.5">
              {recurringExpenses.map((bill) => (
                <div
                  key={bill.id}
                  className="p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-sand-50/40 dark:bg-gray-800/40 flex items-center justify-between"
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-gray-900 dark:text-white truncate">
                        {bill.description}
                      </span>
                      <span className="text-[10px] font-semibold text-brand-700 dark:text-brand-300 bg-brand-100/70 dark:bg-brand-950/80 px-1.5 py-0.5 rounded">
                        Dia {bill.recurringDay || 10}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                      {bill.category} • {formatCurrencyBRL(bill.amount)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => {
                        toggleExpenseSettled(bill.id);
                        if (soundEnabled) playSuccessChime(soundEnabled);
                      }}
                      className={`text-xs font-semibold px-2.5 py-1 rounded-lg border transition-all ${
                        bill.isSettled
                          ? 'bg-success-50 text-success-700 border-success-200 dark:bg-success-950/60 dark:text-success-400 dark:border-success-800'
                          : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-brand-400'
                      }`}
                    >
                      {bill.isSettled ? 'Quitado' : 'Marcar Pago'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Category Breakdown & Expense History Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Category Breakdown Card (1 col) */}
        <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 shadow-u-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PieChart className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider font-display">
                Gastos por Categoria
              </h3>
            </div>
            <span className="text-xs font-mono font-bold text-gray-700 dark:text-gray-300">
              {formatCurrencyBRL(totalAllTime)}
            </span>
          </div>

          <div className="space-y-3 pt-1">
            {(
              [
                { label: 'Supermercado', cat: 'supermercado', color: 'bg-brand-500' },
                { label: 'Casa & Manutenção', cat: 'casa', color: 'bg-indigo-500' },
                { label: 'Cuidados Pet', cat: 'pet', color: 'bg-amber-500' },
                { label: 'Contas & Serviços', cat: 'contas', color: 'bg-emerald-500' },
              ] as const
            ).map((item) => {
              const spent = categoryTotals[item.cat];
              const pct = totalAllTime > 0 ? Math.round((spent / totalAllTime) * 100) : 0;

              return (
                <div key={item.cat} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600 dark:text-gray-400 font-medium">{item.label}</span>
                    <span className="font-bold text-gray-900 dark:text-white">
                      {formatCurrencyBRL(spent)} <span className="text-[10px] text-gray-400 font-normal">({pct}%)</span>
                    </span>
                  </div>
                  <div className="h-2 w-full bg-sand-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${item.color} rounded-full transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Expense History Feed (2 cols) */}
        <div className="md:col-span-2 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 shadow-u-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider font-display">
              Histórico de Lançamentos ({expenses.length})
            </h3>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {expenses.filter((e) => !e.isSettled).length} pendentes
            </span>
          </div>

          <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
            {expenses.map((expense) => {
              const payer = members.find((m) => m.userId === expense.paidByUserId);

              return (
                <div
                  key={expense.id}
                  className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                    expense.isSettled
                      ? 'bg-gray-50/50 dark:bg-gray-800/20 border-gray-200/40 dark:border-gray-800/40 opacity-60'
                      : 'bg-white dark:bg-gray-900/80 border-gray-200/80 dark:border-gray-800 shadow-u-xs hover:border-brand-300 dark:hover:border-brand-700/60'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/60 px-2 py-0.5 rounded border border-brand-200/50 dark:border-brand-800/30">
                        {expense.category}
                      </span>
                      {expense.isRecurring && (
                        <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/40">
                          Recorrente
                        </span>
                      )}
                      {expense.isSettled && (
                        <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                          Quitado
                        </span>
                      )}
                    </div>
                    <h4 className="text-xs font-bold text-gray-900 dark:text-white truncate">
                      {expense.description}
                    </h4>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                      Pago por <strong className="font-semibold text-gray-700 dark:text-gray-300">{payer?.displayName || 'Residente'}</strong> • {expense.splitAmongUserIds.length} moradores
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {expense.receiptUrl && (
                      <button
                        onClick={() => setViewingReceiptUrl(expense.receiptUrl || null)}
                        className="p-1.5 rounded-lg text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-950/40 border border-brand-200/60 dark:border-brand-800/60 transition-colors"
                        title="Ver comprovante anexado"
                      >
                        <Paperclip className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <div className="text-right">
                      <span className="text-sm font-black font-display text-gray-900 dark:text-white block">
                        {formatCurrencyBRL(expense.amount)}
                      </span>
                      <button
                        onClick={() => {
                          toggleExpenseSettled(expense.id);
                          if (soundEnabled) playSuccessChime(soundEnabled);
                        }}
                        className="text-[11px] font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 underline mt-0.5"
                      >
                        {expense.isSettled ? 'Reabrir' : 'Quitar'}
                      </button>
                    </div>

                    <button
                      onClick={() => deleteExpense(expense.id)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-error-600 hover:bg-error-50 dark:hover:bg-error-950/40 transition-colors"
                      title="Excluir despesa"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Add Expense BottomSheet */}
      <BottomSheet
        isOpen={showAddSheet}
        onClose={() => setShowAddSheet(false)}
        title="Registrar Nova Despesa"
        subtitle="Divisão justa com chave PIX e comprovante"
      >
        <form onSubmit={handleCreateExpense} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
              Descrição
            </label>
            <input
              type="text"
              placeholder="Ex: Supermercado Mensal, Conta de Luz, Ração"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                Valor (R$)
              </label>
              <input
                type="text"
                placeholder="0,00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/30 font-display font-semibold"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                Categoria
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              >
                <option value="supermercado">Supermercado</option>
                <option value="casa">Casa</option>
                <option value="pet">Pet</option>
                <option value="contas">Contas</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
              Quem pagou?
            </label>
            <select
              value={paidByUserId}
              onChange={(e) => setPaidByUserId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            >
              {members.map((m) => (
                <option key={m.userId} value={m.userId}>
                  {m.displayName}
                </option>
              ))}
            </select>
          </div>

          {/* Recurring bill toggle */}
          <div className="p-3 bg-sand-50/70 dark:bg-gray-800/60 rounded-xl border border-sand-200 dark:border-gray-700 space-y-2">
            <label className="flex items-center gap-2 text-xs font-semibold text-gray-800 dark:text-gray-200 cursor-pointer">
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
              />
              <span>Conta Fixa Recorrente (vence todo mês)</span>
            </label>

            {isRecurring && (
              <div className="flex items-center gap-2 pl-6 animate-in fade-in duration-150">
                <span className="text-xs text-gray-600 dark:text-gray-400">Dia do vencimento:</span>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={recurringDay}
                  onChange={(e) => setRecurringDay(Number(e.target.value))}
                  className="w-16 px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs text-center font-bold"
                />
              </div>
            )}
          </div>

          {/* Receipt Attachment */}
          <div className="p-3 bg-sand-50/70 dark:bg-gray-800/60 rounded-xl border border-sand-200 dark:border-gray-700 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                Foto do Comprovante (opcional)
              </span>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
              >
                <Paperclip className="w-3.5 h-3.5" />
                <span>{receiptUrl ? 'Trocar foto' : 'Anexar comprovante'}</span>
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleReceiptUpload}
                accept="image/*"
                className="hidden"
              />
            </div>

            {receiptUrl && (
              <div className="relative inline-block mt-2">
                <img
                  src={receiptUrl}
                  alt="Comprovante"
                  className="w-20 h-20 object-cover rounded-xl border border-gray-200 dark:border-gray-700 shadow-u-xs"
                />
                <button
                  type="button"
                  onClick={() => setReceiptUrl(null)}
                  className="absolute -top-1.5 -right-1.5 p-1 rounded-full bg-error-600 text-white shadow-u-xs hover:bg-error-700"
                  title="Remover"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          <div className="pt-1">
            <label className="flex items-center gap-2 text-xs font-medium text-gray-700 dark:text-gray-300 cursor-pointer mb-2">
              <input
                type="checkbox"
                checked={splitWithAll}
                onChange={(e) => setSplitWithAll(e.target.checked)}
                className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
              />
              <span>Divisão padrão (entre todos os residentes)</span>
            </label>

            {!splitWithAll && (
              <div className="space-y-1.5 pl-6">
                {members.map((m) => (
                  <label key={m.userId} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                    <input
                      type="checkbox"
                      checked={selectedSplitUsers.includes(m.userId)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedSplitUsers([...selectedSplitUsers, m.userId]);
                        } else {
                          setSelectedSplitUsers(
                            selectedSplitUsers.filter((id) => id !== m.userId)
                          );
                        }
                      }}
                      className="rounded text-brand-600 focus:ring-brand-500"
                    />
                    <span>{m.displayName}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-100 dark:border-gray-800">
            <button
              type="button"
              onClick={() => setShowAddSheet(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-u-xs transition-all active:scale-95"
            >
              Adicionar Despesa
            </button>
          </div>
        </form>
      </BottomSheet>

      {/* Fullscreen Receipt Modal Viewer */}
      {viewingReceiptUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative max-w-lg w-full bg-white dark:bg-gray-900 rounded-2xl shadow-u-xl border border-gray-200 dark:border-gray-800 p-4 space-y-3 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-800">
              <span className="text-xs font-bold text-gray-900 dark:text-white">
                Comprovante da Despesa
              </span>
              <button
                onClick={() => setViewingReceiptUrl(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-auto rounded-xl flex items-center justify-center bg-sand-50 dark:bg-gray-950 p-2">
              <img
                src={viewingReceiptUrl}
                alt="Comprovante de pagamento"
                className="max-w-full max-h-[65vh] object-contain rounded-lg"
              />
            </div>
            <div className="flex justify-end pt-1">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setViewingReceiptUrl(null)}
              >
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
