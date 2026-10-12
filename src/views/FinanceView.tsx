import React, { useState, useRef, useEffect } from 'react';
import QRCode from 'qrcode';
import { useApp } from '../context/AppContext';
import { Expense, ExpenseCategory, HouseBudget, SplitType, ExpenseNature, ExpensePaymentStatus } from '../types';
import {
  calculateFinancialBalances,
  formatCurrencyBRL,
  generatePixPayload,
  calculateBudgetStatus,
  generateExpensesCsv,
  SettlementTransfer,
  getExpensePaymentStatus,
  getExpenseEffectiveDueDate,
  getDaysOverdueOrRemaining,
  calculateOverdueDebt,
  calculateFixedAndVariableTotals,
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
  Repeat,
  PieChart,
  Download,
  Printer,
  Sliders,
  AlertTriangle,
  AlertOctagon,
  TrendingUp,
  Percent,
  FileText,
  QrCode as QrCodeIcon,
  CreditCard,
  Sparkles,
  Barcode,
  Calendar,
  Clock,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import { BottomSheet } from '../components/BottomSheet';
import { Button } from '../components/untitled/Button';
import { Badge } from '../components/untitled/Badge';
import { triggerHaptic } from '../utils/haptics';
import { playCoinSound, playSuccessChime } from '../utils/soundEffects';

export const FinanceView: React.FC = () => {
  const {
    house,
    expenses,
    members,
    currentUser,
    addExpense,
    toggleExpenseSettled,
    deleteExpense,
    updateHouseBudget,
    showToast,
  } = useApp();

  const soundEnabled = currentUser.soundEnabled ?? true;
  const vibrationEnabled = currentUser.vibrationEnabled ?? true;

  // Add Expense Sheet State
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paidByUserId, setPaidByUserId] = useState(currentUser.userId);
  const [category, setCategory] = useState<ExpenseCategory>('supermercado');

  // Split configuration
  const [splitType, setSplitType] = useState<SplitType>('equal');
  const [splitWithAll, setSplitWithAll] = useState(true);
  const [selectedSplitUsers, setSelectedSplitUsers] = useState<string[]>(
    members.map((m) => m.userId)
  );
  const [customSplits, setCustomSplits] = useState<Record<string, number>>({});

  // Installment (Parcelamento)
  const [installments, setInstallments] = useState<number>(1);

  // Recurring bills & Due Date
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringDay, setRecurringDay] = useState(10);
  const [nature, setNature] = useState<ExpenseNature>('variable');
  const [dueDateMode, setDueDateMode] = useState<'none' | 'specific_date' | 'recurring_day'>('none');
  const [specificDueDate, setSpecificDueDate] = useState<string>('');
  const [dueDay, setDueDay] = useState<number>(10);
  const [barcode, setBarcode] = useState<string>('');

  // Filter Tab: 'all' | 'fixed' | 'variable' | 'overdue'
  const [activeFilterTab, setActiveFilterTab] = useState<'all' | 'fixed' | 'variable' | 'overdue'>('all');
  const [copiedBarcodeId, setCopiedBarcodeId] = useState<string | null>(null);

  // Receipt image attachment
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [viewingReceiptUrl, setViewingReceiptUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // PIX QR Code & Feedback Modal
  const [activePixSettlement, setActivePixSettlement] = useState<SettlementTransfer | null>(null);
  const [pixQrDataUrl, setPixQrDataUrl] = useState<string | null>(null);
  const [pixPayloadString, setPixPayloadString] = useState<string>('');
  const [copiedPixType, setCopiedPixType] = useState<'payload' | 'key' | null>(null);

  // Budget Modal State
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [budgetMonthlyTarget, setBudgetMonthlyTarget] = useState<string>(
    String(house.budget?.monthlyTarget || 3800)
  );
  const [budgetThreshold, setBudgetThreshold] = useState<string>(
    String(house.budget?.alertThresholdPercent || 80)
  );
  const [categoryTargetsInput, setCategoryTargetsInput] = useState<Record<ExpenseCategory, string>>({
    supermercado: String(house.budget?.categoryTargets?.supermercado || 1500),
    contas: String(house.budget?.categoryTargets?.contas || 1200),
    casa: String(house.budget?.categoryTargets?.casa || 600),
    pet: String(house.budget?.categoryTargets?.pet || 500),
  });

  // Report Modal State
  const [showReportModal, setShowReportModal] = useState(false);

  const now = Date.now();
  const overdueDebt = calculateOverdueDebt(expenses, now);
  const natureTotals = calculateFixedAndVariableTotals(expenses);

  // Financial calculations
  const { balances, settlements, totalHouseSpend } = calculateFinancialBalances(
    expenses,
    members
  );

  const userBalance = balances[currentUser.userId] || {
    userId: currentUser.userId,
    displayName: currentUser.displayName,
    totalPaid: 0,
    fairShare: 0,
    net: 0,
  };

  const budgetStatus = calculateBudgetStatus(expenses, house.budget);

  // Filtered expenses list
  const filteredExpenses = expenses.filter((e) => {
    if (activeFilterTab === 'all') return true;
    if (activeFilterTab === 'overdue') {
      return getExpensePaymentStatus(e, now) === 'overdue';
    }
    const isFixed =
      e.nature === 'fixed' ||
      (e.nature === undefined && (!!e.isRecurring || e.category === 'contas'));
    if (activeFilterTab === 'fixed') return isFixed;
    if (activeFilterTab === 'variable') return !isFixed;
    return true;
  });

  const fixedExpensesList = expenses.filter(
    (e) => e.nature === 'fixed' || (e.nature === undefined && (!!e.isRecurring || e.category === 'contas'))
  );
  const variableExpensesList = expenses.filter(
    (e) => !(e.nature === 'fixed' || (e.nature === undefined && (!!e.isRecurring || e.category === 'contas')))
  );

  const handleCopyBarcode = (expense: Expense) => {
    if (!expense.barcode) return;
    navigator.clipboard.writeText(expense.barcode.replace(/\s+/g, ''));
    setCopiedBarcodeId(expense.id);
    if (vibrationEnabled) triggerHaptic('light');
    showToast('Código de barras copiado para a área de transferência!', 'success');
    setTimeout(() => setCopiedBarcodeId(null), 2500);
  };

  // Sync split participants when member list changes
  useEffect(() => {
    if (splitWithAll) {
      setSelectedSplitUsers(members.map((m) => m.userId));
    }
  }, [members, splitWithAll]);

  // Generate PIX QR Code whenever activePixSettlement changes
  useEffect(() => {
    if (!activePixSettlement) {
      setPixQrDataUrl(null);
      setPixPayloadString('');
      return;
    }

    const creditor = members.find((m) => m.userId === activePixSettlement.toUserId);
    if (!creditor?.pixKey) {
      setPixQrDataUrl(null);
      setPixPayloadString('');
      return;
    }

    const payload = generatePixPayload({
      pixKey: creditor.pixKey,
      recipientName: creditor.displayName,
      amount: activePixSettlement.amount,
      description: 'Acerto Domus',
      city: 'SAO PAULO',
    });

    setPixPayloadString(payload);

    QRCode.toDataURL(payload, {
      width: 280,
      margin: 1,
      color: {
        dark: '#111827',
        light: '#FFFFFF',
      },
    })
      .then((url) => setPixQrDataUrl(url))
      .catch((err) => console.error('Erro ao gerar QR Code PIX:', err));
  }, [activePixSettlement, members]);

  // Handle Receipt Upload
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

  // Helper to initialize custom splits evenly
  const initializeEvenSplits = (type: SplitType, totalVal: number) => {
    const participants = splitWithAll ? members.map((m) => m.userId) : selectedSplitUsers;
    if (participants.length === 0) return;

    if (type === 'percentage') {
      const perUser = Number((100 / participants.length).toFixed(1));
      const initial: Record<string, number> = {};
      participants.forEach((uid) => {
        initial[uid] = perUser;
      });
      setCustomSplits(initial);
    } else if (type === 'exact') {
      const perUser = Number((totalVal / participants.length).toFixed(2));
      const initial: Record<string, number> = {};
      participants.forEach((uid) => {
        initial[uid] = perUser;
      });
      setCustomSplits(initial);
    }
  };

  // Handle Create Expense
  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanAmountStr = amount.replace(/[^\d.,]/g, '').replace(',', '.');
    const parsedAmount = parseFloat(cleanAmountStr);
    if (!description.trim() || isNaN(parsedAmount) || parsedAmount <= 0) {
      showToast('Insira uma descrição e valor válidos.', 'warning');
      return;
    }

    const splitAmong = splitWithAll ? members.map((m) => m.userId) : selectedSplitUsers;
    if (splitAmong.length === 0) {
      showToast('Selecione pelo menos um morador para a divisão.', 'warning');
      return;
    }

    // Validation for percentage splits
    if (splitType === 'percentage') {
      const totalPct = splitAmong.reduce((acc, uid) => acc + (customSplits[uid] || 0), 0);
      if (Math.abs(totalPct - 100) > 0.5) {
        showToast(`A soma das porcentagens deve dar 100% (atual: ${totalPct.toFixed(1)}%)`, 'warning');
        return;
      }
    }

    // Validation for exact splits
    if (splitType === 'exact') {
      const totalExact = splitAmong.reduce((acc, uid) => acc + (customSplits[uid] || 0), 0);
      if (Math.abs(totalExact - parsedAmount) > 0.1) {
        showToast(
          `A soma dos valores (R$ ${totalExact.toFixed(2)}) deve ser igual ao total da despesa (R$ ${parsedAmount.toFixed(2)})`,
          'warning'
        );
        return;
      }
    }

    let dueDateTimestamp: number | undefined = undefined;
    if (dueDateMode === 'specific_date' && specificDueDate) {
      const [y, m, d] = specificDueDate.split('-').map(Number);
      dueDateTimestamp = new Date(y, m - 1, d, 23, 59, 59, 999).getTime();
    }

    const isRec = dueDateMode === 'recurring_day' || isRecurring;
    const finalRecurringDay = dueDateMode === 'recurring_day' ? dueDay : (isRecurring ? recurringDay : undefined);

    addExpense(
      {
        description: description.trim(),
        amount: parsedAmount,
        paidByUserId,
        splitAmongUserIds: splitAmong,
        category,
        date: Date.now(),
        isSettled: false,
        receiptUrl: receiptUrl || undefined,
        isRecurring: isRec,
        recurringDay: finalRecurringDay,
        nature,
        dueDate: dueDateTimestamp,
        dueDay: dueDateMode === 'recurring_day' ? dueDay : undefined,
        barcode: barcode.trim() || undefined,
        splitType,
        customSplits: splitType !== 'equal' ? customSplits : undefined,
      },
      installments
    );

    if (soundEnabled) playCoinSound(soundEnabled);
    if (vibrationEnabled) triggerHaptic('medium');

    // Reset Form
    setDescription('');
    setAmount('');
    setReceiptUrl(null);
    setIsRecurring(false);
    setNature('variable');
    setDueDateMode('none');
    setSpecificDueDate('');
    setDueDay(10);
    setBarcode('');
    setInstallments(1);
    setSplitType('equal');
    setCustomSplits({});
    setShowAddSheet(false);
  };

  // Copy PIX Payload or Raw Key
  const handleCopyPixString = (textToCopy: string, type: 'payload' | 'key', label: string) => {
    navigator.clipboard.writeText(textToCopy);
    setCopiedPixType(type);
    if (vibrationEnabled) triggerHaptic('light');
    showToast(`${label} copiado!`, 'success');
    setTimeout(() => setCopiedPixType(null), 2500);
  };

  // Save Budget Configuration
  const handleSaveBudget = (e: React.FormEvent) => {
    e.preventDefault();
    const target = parseFloat(budgetMonthlyTarget.replace(',', '.'));
    const threshold = parseFloat(budgetThreshold);

    if (isNaN(target) || target <= 0) {
      showToast('Defina um teto mensal válido.', 'warning');
      return;
    }

    const catTargets: Partial<Record<ExpenseCategory, number>> = {};
    (Object.keys(categoryTargetsInput) as ExpenseCategory[]).forEach((cat) => {
      const val = parseFloat(categoryTargetsInput[cat].replace(',', '.'));
      if (!isNaN(val) && val >= 0) {
        catTargets[cat] = val;
      }
    });

    updateHouseBudget({
      monthlyTarget: target,
      alertThresholdPercent: isNaN(threshold) ? 80 : threshold,
      categoryTargets: catTargets,
    });

    setShowBudgetModal(false);
  };

  // Export CSV
  const handleExportCsv = () => {
    const csvContent = generateExpensesCsv(expenses, members);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const now = new Date();
    const fileName = `domus-despesas-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}.csv`;
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Planilha CSV exportada com sucesso!', 'success');
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
  const recurringExpenses = expenses.filter((e) => e.isRecurring);

  // Status badges & colors for Budget
  const getBudgetColorClass = () => {
    switch (budgetStatus.status) {
      case 'exceeded':
        return 'text-error-600 dark:text-error-400 bg-error-50 dark:bg-error-950/50 border-error-300 dark:border-error-900';
      case 'danger':
        return 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/50 border-orange-300 dark:border-orange-900';
      case 'warning':
        return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 border-amber-300 dark:border-amber-900';
      default:
        return 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-900';
    }
  };

  const getProgressBarColor = () => {
    switch (budgetStatus.status) {
      case 'exceeded':
        return 'bg-error-500';
      case 'danger':
        return 'bg-orange-500';
      case 'warning':
        return 'bg-amber-500';
      default:
        return 'bg-emerald-500';
    }
  };

  return (
    <div className="space-y-5 pb-20 animate-in fade-in duration-200 w-full">
      {/* Top Header Actions (Nova Despesa, Exportar CSV, Relatório, Ajustar Teto) */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold font-display text-gray-900 dark:text-white">
            Finanças & Orçamento
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Divisão inteligente, limites mensais e cobranças via PIX
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleExportCsv}
            icon={Download}
            title="Baixar planilha CSV para Excel/Sheets"
          >
            Exportar CSV
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowReportModal(true)}
            icon={FileText}
            title="Ver Relatório de Fechamento do Mês"
          >
            Relatório
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowAddSheet(true)}
            icon={Plus}
          >
            Nova Despesa
          </Button>
        </div>
      </div>

      {/* Critical Alert Banner: Dívidas da Casa (Boletos Vencidos) */}
      {overdueDebt.count > 0 && (
        <div className="rounded-2xl bg-gradient-to-r from-rose-50 via-red-50 to-orange-50 dark:from-rose-950/40 dark:via-red-950/30 dark:to-orange-950/20 border-2 border-rose-300 dark:border-rose-800/70 p-5 shadow-u-sm space-y-4 animate-in fade-in slide-in-from-top-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-u-xs animate-pulse flex-shrink-0">
                <AlertOctagon className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black text-rose-950 dark:text-rose-100 uppercase tracking-wider font-display">
                    Dívidas da Casa • {overdueDebt.count} {overdueDebt.count === 1 ? 'Boleto Vencido' : 'Boletos Vencidos'}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-600 text-white shadow-u-xs">
                    Urgente
                  </span>
                </div>
                <p className="text-xs text-rose-700 dark:text-rose-300 mt-0.5">
                  Total acumulado em atraso: <strong className="font-bold text-rose-900 dark:text-rose-100">{formatCurrencyBRL(overdueDebt.totalOverdue)}</strong>. Regularize para evitar juros e cortes.
                </p>
              </div>
            </div>

            <button
              onClick={() => setActiveFilterTab('overdue')}
              className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-u-xs active:scale-95"
            >
              Filtrar Boletos Vencidos
            </button>
          </div>

          {/* Overdue items cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
            {overdueDebt.overdueExpenses.map((bill) => {
              const daysInfo = getDaysOverdueOrRemaining(bill.dueDate || getExpenseEffectiveDueDate(bill, now) || now, now);
              return (
                <div
                  key={bill.id}
                  className="p-3.5 rounded-xl bg-white/95 dark:bg-gray-900/95 border border-rose-200 dark:border-rose-900/50 shadow-u-xs flex flex-col justify-between space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1 mb-0.5">
                        <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                        Atrasada há {daysInfo.days} {daysInfo.days === 1 ? 'dia' : 'dias'}
                      </span>
                      <h4 className="text-xs font-bold text-gray-900 dark:text-white truncate">
                        {bill.description}
                      </h4>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">
                        {bill.category} • Vencimento: {new Date(bill.dueDate || getExpenseEffectiveDueDate(bill, now) || now).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <span className="text-sm font-black font-display text-rose-600 dark:text-rose-400 whitespace-nowrap">
                      {formatCurrencyBRL(bill.amount)}
                    </span>
                  </div>

                  <div className="flex items-center justify-end gap-1.5 pt-1.5 border-t border-gray-100 dark:border-gray-800">
                    {bill.barcode && (
                      <button
                        onClick={() => handleCopyBarcode(bill)}
                        className="flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition-colors"
                        title="Copiar código de barras do boleto"
                      >
                        {copiedBarcodeId === bill.id ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Barcode className="w-3 h-3 text-gray-600 dark:text-gray-300" />
                        )}
                        <span>{copiedBarcodeId === bill.id ? 'Copiado' : 'Boleto'}</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        toggleExpenseSettled(bill.id);
                        if (soundEnabled) playSuccessChime(soundEnabled);
                      }}
                      className="text-[11px] font-bold px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-u-xs transition-colors"
                    >
                      Quitar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Net Balance Master Card & Monthly Budget Hero Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Net Balance Card */}
        <div className="rounded-2xl bg-gradient-to-br from-brand-600 via-brand-700 to-brand-800 text-white dark:bg-gray-900 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 border border-brand-500/20 dark:border-gray-800 p-6 shadow-u-md relative overflow-hidden transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white/15 dark:bg-brand-950/60 flex items-center justify-center">
                  <Wallet className="w-4 h-4 text-white stroke-[2.2]" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-brand-100 dark:text-gray-300">
                  Balanço Individual
                </span>
              </div>
              <span className="text-xs text-brand-100/90 dark:text-gray-400 font-medium">
                Pendente na casa: <strong className="text-white font-semibold">{formatCurrencyBRL(totalHouseSpend)}</strong>
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
                      ? 'text-white dark:text-emerald-400'
                      : userBalance.net < 0
                      ? 'text-rose-200 dark:text-rose-400'
                      : 'text-white'
                  }`}
                >
                  {formatCurrencyBRL(Math.abs(userBalance.net))}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/15 dark:border-gray-800 text-xs">
            <div>
              <span className="text-[11px] text-brand-200 dark:text-gray-400 block mb-0.5">
                Desembolsado por você:
              </span>
              <span className="font-bold text-white text-sm">
                {formatCurrencyBRL(userBalance.totalPaid)}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-brand-200 dark:text-gray-400 block mb-0.5">
                Sua cota justa calculada:
              </span>
              <span className="font-bold text-white text-sm">
                {formatCurrencyBRL(userBalance.fairShare)}
              </span>
            </div>
          </div>
        </div>

        {/* Monthly Budget Card */}
        <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 shadow-u-xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 stroke-[2.2]" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                  Teto Orçamentário do Mês
                </h3>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  {budgetStatus.daysLeftInMonth} dias restantes para fechar o mês
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowBudgetModal(true)}
              className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center gap-1 text-xs font-semibold"
              title="Ajustar teto e metas por categoria"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Ajustar Teto</span>
            </button>
          </div>

          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-2xl font-black font-display text-gray-900 dark:text-white">
                  {formatCurrencyBRL(budgetStatus.totalSpent)}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 ml-1.5 font-medium">
                  de {formatCurrencyBRL(budgetStatus.monthlyTarget)}
                </span>
              </div>
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${getBudgetColorClass()}`}>
                {budgetStatus.percentageUsed}% consumido
              </span>
            </div>

            {/* Visual Progress Bar */}
            <div className="h-3 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden p-0.5">
              <div
                className={`h-full ${getProgressBarColor()} rounded-full transition-all duration-500`}
                style={{ width: `${Math.min(100, budgetStatus.percentageUsed)}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400 pt-1">
              <span>
                Disponível:{' '}
                <strong className="text-gray-900 dark:text-white font-bold">
                  {formatCurrencyBRL(budgetStatus.remaining)}
                </strong>
              </span>
              <span>
                Diária sugerida:{' '}
                <strong className="text-gray-900 dark:text-white font-bold">
                  {formatCurrencyBRL(budgetStatus.dailyRemainingBudget)}/dia
                </strong>
              </span>
            </div>
          </div>

          {/* Budget status notice */}
          {budgetStatus.status === 'exceeded' && (
            <div className="p-2.5 rounded-xl bg-error-50 dark:bg-error-950/40 border border-error-200 dark:border-error-900/50 flex items-center gap-2 text-xs text-error-700 dark:text-error-300">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>Atenção: O orçamento total da casa foi estourado neste mês!</span>
            </div>
          )}
          {budgetStatus.status === 'danger' && (
            <div className="p-2.5 rounded-xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-900/50 flex items-center gap-2 text-xs text-orange-700 dark:text-orange-300">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>Alerta: Já foi consumido mais de 90% do orçamento mensal estipulado.</span>
            </div>
          )}
        </div>
      </div>

      {/* Mini-Dashboard: Contas Fixas vs Gastos Variáveis */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Contas Fixas */}
        <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 shadow-u-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 flex items-center gap-1.5">
              <Repeat className="w-3.5 h-3.5" />
              Contas Fixas do Mês
            </span>
            <div className="text-lg font-black font-display text-gray-900 dark:text-white">
              {formatCurrencyBRL(natureTotals.fixedTotal)}
            </div>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              Pendente: <strong className="text-brand-600 dark:text-brand-400">{formatCurrencyBRL(natureTotals.fixedPending)}</strong> • Quitado: {formatCurrencyBRL(natureTotals.fixedPaid)}
            </p>
          </div>
          <button
            onClick={() => setActiveFilterTab('fixed')}
            className="p-2 rounded-xl bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/60 dark:hover:bg-brand-900/60 text-brand-700 dark:text-brand-300 transition-colors"
            title="Filtrar contas fixas"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Gastos Variáveis */}
        <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 shadow-u-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" />
              Gastos Variáveis (Dia a Dia)
            </span>
            <div className="text-lg font-black font-display text-gray-900 dark:text-white">
              {formatCurrencyBRL(natureTotals.variableTotal)}
            </div>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              Pendente: <strong className="text-indigo-600 dark:text-indigo-400">{formatCurrencyBRL(natureTotals.variablePending)}</strong> • Acertado: {formatCurrencyBRL(natureTotals.variablePaid)}
            </p>
          </div>
          <button
            onClick={() => setActiveFilterTab('variable')}
            className="p-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 transition-colors"
            title="Filtrar gastos variáveis"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Dívidas / Inadimplência da Casa */}
        <div
          className={`rounded-2xl border p-4 shadow-u-xs flex items-center justify-between transition-colors ${
            overdueDebt.count > 0
              ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-300 dark:border-rose-900/60'
              : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800'
          }`}
        >
          <div className="space-y-1">
            <span
              className={`text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                overdueDebt.count > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {overdueDebt.count > 0 ? <AlertTriangle className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
              Dívidas & Boletos Vencidos
            </span>
            <div
              className={`text-lg font-black font-display ${
                overdueDebt.count > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-gray-900 dark:text-white'
              }`}
            >
              {formatCurrencyBRL(overdueDebt.totalOverdue)}
            </div>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              {overdueDebt.count > 0
                ? `${overdueDebt.count} ${overdueDebt.count === 1 ? 'boleto atrasado' : 'boletos atrasados'}`
                : 'Nenhum boleto em atraso 🎉'}
            </p>
          </div>
          <button
            onClick={() => setActiveFilterTab('overdue')}
            className={`p-2 rounded-xl transition-colors ${
              overdueDebt.count > 0
                ? 'bg-rose-600 hover:bg-rose-700 text-white'
                : 'bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 text-gray-400 hover:text-gray-600'
            }`}
            title="Ver contas atrasadas"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
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
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  Compensação mínima com Chave PIX e QR Code
                </p>
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
                  `Olá ${debtor?.displayName}! No Domus temos um acerto pendente de ${formatCurrencyBRL(
                    settlement.amount
                  )}. Segue minha chave Pix (${creditor?.pixKeyType || 'chave'}): ${creditorPixKey}`
                );

                return (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-xl border text-xs transition-colors space-y-2.5 ${
                      isUserDebtor
                        ? 'bg-rose-50/50 dark:bg-rose-950/30 border-rose-200/80 dark:border-rose-900/50'
                        : isUserCreditor
                        ? 'bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-200/80 dark:border-emerald-900/50'
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

                    {/* Quick action buttons: Open PIX QR Code Modal or WhatsApp Reminder */}
                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-gray-200/40 dark:border-gray-800/60">
                      {hasPix && (
                        <button
                          onClick={() => setActivePixSettlement(settlement)}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] shadow-u-xs transition-all active:scale-95"
                          title="Abrir QR Code PIX e Copia e Cola Oficial"
                        >
                          <QrCodeIcon className="w-3 h-3 text-white" />
                          <span>Pagar com PIX</span>
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

          {fixedExpensesList.length === 0 ? (
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 text-center text-gray-500 dark:text-gray-400 text-xs font-medium border border-gray-200/60 dark:border-gray-800">
              Nenhuma conta fixa cadastrada. Ao criar uma despesa, selecione "Conta Fixa da Casa".
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
              {fixedExpensesList.map((bill) => {
                const status = getExpensePaymentStatus(bill, now);
                const dueDateTs = getExpenseEffectiveDueDate(bill, now);
                const daysInfo = dueDateTs ? getDaysOverdueOrRemaining(dueDateTs, now) : null;

                return (
                  <div
                    key={bill.id}
                    className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                      bill.isSettled
                        ? 'bg-gray-50/50 dark:bg-gray-800/20 border-gray-200/40 dark:border-gray-800/40 opacity-60'
                        : status === 'overdue'
                        ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50'
                        : 'bg-sand-50/40 dark:bg-gray-800/40 border-gray-200/70 dark:border-gray-800'
                    }`}
                  >
                    <div className="min-w-0 pr-2 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                        <span className="text-xs font-bold text-gray-900 dark:text-white truncate">
                          {bill.description}
                        </span>

                        {status === 'overdue' && (
                          <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 flex items-center gap-0.5">
                            <AlertTriangle className="w-2.5 h-2.5" />
                            Atrasada ({daysInfo?.days}d)
                          </span>
                        )}

                        {status === 'due_today' && (
                          <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800 animate-pulse flex items-center gap-0.5">
                            <Clock className="w-2.5 h-2.5" />
                            Vence Hoje
                          </span>
                        )}

                        {status === 'upcoming' && (
                          <span className="text-[10px] font-semibold text-brand-700 dark:text-brand-300 bg-brand-100/70 dark:bg-brand-950/80 px-1.5 py-0.5 rounded">
                            {bill.dueDay ? `Todo dia ${bill.dueDay}` : `Vence em ${daysInfo?.days}d`}
                          </span>
                        )}

                        {bill.isSettled && (
                          <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                            Paga
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-gray-500 dark:text-gray-400">
                        {bill.category} • <strong className="text-gray-900 dark:text-white font-semibold">{formatCurrencyBRL(bill.amount)}</strong>
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {bill.barcode && (
                        <button
                          onClick={() => handleCopyBarcode(bill)}
                          className="p-1.5 rounded-lg text-gray-600 hover:text-gray-900 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-brand-400 transition-colors"
                          title="Copiar código de barras do boleto"
                        >
                          {copiedBarcodeId === bill.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Barcode className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}

                      <button
                        onClick={() => {
                          toggleExpenseSettled(bill.id);
                          if (soundEnabled) playSuccessChime(soundEnabled);
                        }}
                        className={`text-xs font-semibold px-2.5 py-1 rounded-lg border transition-all ${
                          bill.isSettled
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800'
                            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-brand-400'
                        }`}
                      >
                        {bill.isSettled ? 'Quitado' : 'Marcar Pago'}
                      </button>
                    </div>
                  </div>
                );
              })}
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
              const catLimit = house.budget?.categoryTargets?.[item.cat];

              return (
                <div key={item.cat} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600 dark:text-gray-400 font-medium">{item.label}</span>
                    <span className="font-bold text-gray-900 dark:text-white">
                      {formatCurrencyBRL(spent)}{' '}
                      <span className="text-[10px] text-gray-400 font-normal">
                        ({pct}%)
                        {catLimit ? ` • Limite: ${formatCurrencyBRL(catLimit)}` : ''}
                      </span>
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
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider font-display">
                Lançamentos ({filteredExpenses.length})
              </h3>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                {expenses.filter((e) => !e.isSettled).length} contas em aberto no total
              </p>
            </div>

            {/* Segmented Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveFilterTab('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  activeFilterTab === 'all'
                    ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-u-xs'
                    : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                }`}
              >
                Todas ({expenses.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilterTab('fixed')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  activeFilterTab === 'fixed'
                    ? 'bg-white dark:bg-gray-900 text-brand-700 dark:text-brand-300 shadow-u-xs'
                    : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                }`}
              >
                Fixas ({fixedExpensesList.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilterTab('variable')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  activeFilterTab === 'variable'
                    ? 'bg-white dark:bg-gray-900 text-indigo-700 dark:text-indigo-300 shadow-u-xs'
                    : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                }`}
              >
                Variáveis ({variableExpensesList.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilterTab('overdue')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                  activeFilterTab === 'overdue'
                    ? 'bg-rose-600 text-white shadow-u-xs'
                    : overdueDebt.count > 0
                    ? 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                    : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                }`}
              >
                <span>Atrasadas</span>
                {overdueDebt.count > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500 text-white font-black">
                    {overdueDebt.count}
                  </span>
                )}
              </button>
            </div>
          </div>

          <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
            {filteredExpenses.length === 0 ? (
              <div className="p-8 text-center rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-200/60 dark:border-gray-800 text-xs text-gray-500 dark:text-gray-400">
                Nenhuma despesa encontrada para o filtro selecionado.
              </div>
            ) : (
              filteredExpenses.map((expense) => {
                const payer = members.find((m) => m.userId === expense.paidByUserId);
                const status = getExpensePaymentStatus(expense, now);
                const dueDateTs = getExpenseEffectiveDueDate(expense, now);
                const daysInfo = dueDateTs ? getDaysOverdueOrRemaining(dueDateTs, now) : null;
                const isFixed =
                  expense.nature === 'fixed' ||
                  (expense.nature === undefined && (!!expense.isRecurring || expense.category === 'contas'));

                return (
                  <div
                    key={expense.id}
                    className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                      expense.isSettled
                        ? 'bg-gray-50/50 dark:bg-gray-800/20 border-gray-200/40 dark:border-gray-800/40 opacity-60'
                        : status === 'overdue'
                        ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40 shadow-u-xs'
                        : 'bg-white dark:bg-gray-900/80 border-gray-200/80 dark:border-gray-800 shadow-u-xs hover:border-brand-300 dark:hover:border-brand-700/60'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5 mb-1">
                        {/* Nature Badge */}
                        {isFixed ? (
                          <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 border border-brand-200/50 dark:border-brand-800/30">
                            Fixa
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium uppercase px-1.5 py-0.5 rounded bg-slate-100 dark:bg-gray-800 text-slate-600 dark:text-gray-400 border border-slate-200 dark:border-gray-700">
                            Variável
                          </span>
                        )}

                        {/* Category */}
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
                          {expense.category}
                        </span>

                        {/* Due Date & Overdue Badge */}
                        {status === 'overdue' && (
                          <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 flex items-center gap-0.5">
                            <AlertTriangle className="w-2.5 h-2.5 text-rose-600" />
                            Atrasada ({daysInfo?.days}d)
                          </span>
                        )}

                        {status === 'due_today' && (
                          <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800 animate-pulse flex items-center gap-0.5">
                            <Clock className="w-2.5 h-2.5 text-amber-600" />
                            Vence Hoje
                          </span>
                        )}

                        {status === 'upcoming' && daysInfo && (
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 flex items-center gap-0.5">
                            <Calendar className="w-2.5 h-2.5 text-sky-600" />
                            Vence em {daysInfo.days}d
                          </span>
                        )}

                        {expense.installment && (
                          <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-900/40">
                            {expense.installment.current}/{expense.installment.total}x
                          </span>
                        )}

                        {expense.splitType === 'percentage' && (
                          <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/40">
                            % Flexível
                          </span>
                        )}

                        {expense.splitType === 'exact' && (
                          <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/40">
                            R$ Exato
                          </span>
                        )}

                        {expense.isSettled && (
                          <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            Quitado
                          </span>
                        )}
                      </div>

                      <h4 className="text-xs font-bold text-gray-900 dark:text-white truncate">
                        {expense.description}
                      </h4>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                        Pago por <strong className="font-semibold text-gray-700 dark:text-gray-300">{payer?.displayName || 'Residente'}</strong> • {new Date(expense.date).toLocaleDateString('pt-BR')}
                        {dueDateTs ? ` • Vencimento: ${new Date(dueDateTs).toLocaleDateString('pt-BR')}` : ''}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {expense.barcode && (
                        <button
                          onClick={() => handleCopyBarcode(expense)}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold text-gray-700 hover:text-gray-900 dark:text-gray-200 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors shadow-u-xs"
                          title="Copiar código de barras do boleto"
                        >
                          {copiedBarcodeId === expense.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Barcode className="w-3.5 h-3.5 text-gray-600 dark:text-gray-300" />
                          )}
                          <span className="hidden sm:inline">
                            {copiedBarcodeId === expense.id ? 'Copiado' : 'Boleto'}
                          </span>
                        </button>
                      )}

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
              })
            )}
          </div>
        </div>
      </div>

      {/* Add Expense BottomSheet */}
      <BottomSheet
        isOpen={showAddSheet}
        onClose={() => setShowAddSheet(false)}
        title="Registrar Nova Despesa"
        subtitle="Divisão flexível, parcelamento em até 12x e chave PIX"
      >
        <form onSubmit={handleCreateExpense} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
              Descrição
            </label>
            <input
              type="text"
              placeholder="Ex: Supermercado Mensal, Sofá novo, Ração"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                Valor Total (R$)
              </label>
              <input
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  const clean = e.target.value.replace(/[^\d.,]/g, '').replace(',', '.');
                  const parsed = parseFloat(clean);
                  if (!isNaN(parsed) && parsed > 0 && splitType !== 'equal') {
                    initializeEvenSplits(splitType, parsed);
                  }
                }}
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
                <option value="casa">Casa & Manutenção</option>
                <option value="pet">Pet</option>
                <option value="contas">Contas & Serviços</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
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

            {/* Parcelamento de Compras (1x a 12x) */}
            <div>
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                Parcelamento (Cartão)
              </label>
              <select
                value={installments}
                onChange={(e) => setInstallments(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              >
                <option value={1}>À vista (1x)</option>
                <option value={2}>2x vezes</option>
                <option value={3}>3x vezes</option>
                <option value={4}>4x vezes</option>
                <option value={5}>5x vezes</option>
                <option value={6}>6x vezes</option>
                <option value={10}>10x vezes</option>
                <option value={12}>12x vezes</option>
              </select>
            </div>
          </div>

          {installments > 1 && (
            <div className="p-3 bg-purple-50/70 dark:bg-purple-950/40 rounded-xl border border-purple-200 dark:border-purple-900/50 flex items-center justify-between text-xs text-purple-800 dark:text-purple-300">
              <span className="flex items-center gap-1.5 font-semibold">
                <CreditCard className="w-4 h-4" />
                Compra parcelada:
              </span>
              <span className="font-bold">
                {installments}x de{' '}
                {formatCurrencyBRL((parseFloat(amount.replace(',', '.')) || 0) / installments)}
                /mês
              </span>
            </div>
          )}

          {/* Mode Selector for Split: Equal, Percentage, Exact */}
          <div className="space-y-2 pt-1 border-t border-gray-100 dark:border-gray-800">
            <span className="text-xs font-bold text-gray-800 dark:text-gray-200 block">
              Como será dividida a despesa?
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setSplitType('equal');
                }}
                className={`py-2 px-2.5 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1 border transition-all ${
                  splitType === 'equal'
                    ? 'bg-brand-50 dark:bg-brand-950/60 border-brand-500 text-brand-700 dark:text-brand-300 shadow-u-xs'
                    : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                }`}
              >
                <span>⚖️ Igual</span>
                <span className="text-[10px] font-normal opacity-80">50/50 automático</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSplitType('percentage');
                  const parsed = parseFloat(amount.replace(',', '.'));
                  initializeEvenSplits('percentage', parsed || 0);
                }}
                className={`py-2 px-2.5 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1 border transition-all ${
                  splitType === 'percentage'
                    ? 'bg-brand-50 dark:bg-brand-950/60 border-brand-500 text-brand-700 dark:text-brand-300 shadow-u-xs'
                    : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                }`}
              >
                <span>📊 Porcentagem</span>
                <span className="text-[10px] font-normal opacity-80">% por renda</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSplitType('exact');
                  const parsed = parseFloat(amount.replace(',', '.'));
                  initializeEvenSplits('exact', parsed || 0);
                }}
                className={`py-2 px-2.5 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1 border transition-all ${
                  splitType === 'exact'
                    ? 'bg-brand-50 dark:bg-brand-950/60 border-brand-500 text-brand-700 dark:text-brand-300 shadow-u-xs'
                    : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                }`}
              >
                <span>💵 Valor Exato</span>
                <span className="text-[10px] font-normal opacity-80">R$ individual</span>
              </button>
            </div>
          </div>

          {/* Division Members Selection / Dynamic Fields */}
          <div className="p-3 bg-sand-50/70 dark:bg-gray-800/60 rounded-xl border border-sand-200 dark:border-gray-700 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                Moradores Participantes
              </span>
              <label className="flex items-center gap-1.5 text-[11px] font-medium text-gray-600 dark:text-gray-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={splitWithAll}
                  onChange={(e) => {
                    setSplitWithAll(e.target.checked);
                    if (e.target.checked) {
                      setSelectedSplitUsers(members.map((m) => m.userId));
                    }
                  }}
                  className="rounded text-brand-600"
                />
                <span>Todos</span>
              </label>
            </div>

            {/* If splitType === 'equal' */}
            {splitType === 'equal' && (
              <div className="space-y-1.5">
                {members.map((m) => {
                  const isChecked = splitWithAll || selectedSplitUsers.includes(m.userId);
                  const parsedTotal = parseFloat(amount.replace(',', '.')) || 0;
                  const count = splitWithAll ? members.length : selectedSplitUsers.length || 1;
                  const shareEst = isChecked ? parsedTotal / count : 0;

                  return (
                    <label
                      key={m.userId}
                      className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-200/60 dark:border-gray-800 text-xs cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          disabled={splitWithAll}
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedSplitUsers([...selectedSplitUsers, m.userId]);
                            } else {
                              setSelectedSplitUsers(selectedSplitUsers.filter((id) => id !== m.userId));
                            }
                          }}
                          className="rounded text-brand-600"
                        />
                        <span className="font-semibold text-gray-800 dark:text-gray-200">{m.displayName}</span>
                      </div>
                      <span className="font-mono text-gray-500 dark:text-gray-400">
                        {isChecked ? formatCurrencyBRL(shareEst) : 'Não participa'}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}

            {/* If splitType === 'percentage' */}
            {splitType === 'percentage' && (
              <div className="space-y-2">
                {members.map((m) => {
                  const currentPct = customSplits[m.userId] ?? 0;
                  const parsedTotal = parseFloat(amount.replace(',', '.')) || 0;
                  const estimatedVal = (parsedTotal * currentPct) / 100;

                  return (
                    <div
                      key={m.userId}
                      className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-200/60 dark:border-gray-800 text-xs gap-3"
                    >
                      <span className="font-semibold text-gray-800 dark:text-gray-200 min-w-[90px]">
                        {m.displayName}
                      </span>
                      <div className="flex items-center gap-1.5 flex-1 justify-end">
                        <input
                          type="number"
                          step="1"
                          min="0"
                          max="100"
                          value={currentPct}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setCustomSplits({
                              ...customSplits,
                              [m.userId]: val,
                            });
                          }}
                          className="w-16 px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-right font-bold text-xs"
                        />
                        <span className="text-gray-500 font-semibold">%</span>
                        <span className="text-[11px] font-mono text-brand-600 dark:text-brand-400 w-20 text-right font-bold">
                          {formatCurrencyBRL(estimatedVal)}
                        </span>
                      </div>
                    </div>
                  );
                })}

                <div className="flex items-center justify-between pt-1 text-xs">
                  <span className="text-gray-500 dark:text-gray-400">
                    Soma das porcentagens:{' '}
                    <strong
                      className={`font-bold ${
                        Math.abs(
                          members.reduce((acc, m) => acc + (customSplits[m.userId] || 0), 0) - 100
                        ) < 0.1
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {members.reduce((acc, m) => acc + (customSplits[m.userId] || 0), 0).toFixed(1)}%
                    </strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => initializeEvenSplits('percentage', parseFloat(amount) || 0)}
                    className="text-[11px] font-semibold text-brand-600 dark:text-brand-400 hover:underline"
                  >
                    Dividir igualmente
                  </button>
                </div>
              </div>
            )}

            {/* If splitType === 'exact' */}
            {splitType === 'exact' && (
              <div className="space-y-2">
                {members.map((m) => {
                  const currentVal = customSplits[m.userId] ?? 0;

                  return (
                    <div
                      key={m.userId}
                      className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-200/60 dark:border-gray-800 text-xs gap-3"
                    >
                      <span className="font-semibold text-gray-800 dark:text-gray-200 min-w-[90px]">
                        {m.displayName}
                      </span>
                      <div className="flex items-center gap-1 flex-1 justify-end">
                        <span className="text-gray-400 font-semibold">R$</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={currentVal}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setCustomSplits({
                              ...customSplits,
                              [m.userId]: val,
                            });
                          }}
                          className="w-24 px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-right font-bold text-xs"
                        />
                      </div>
                    </div>
                  );
                })}

                <div className="flex items-center justify-between pt-1 text-xs">
                  <span className="text-gray-500 dark:text-gray-400">
                    Total distribuído:{' '}
                    <strong className="font-bold text-gray-900 dark:text-white">
                      {formatCurrencyBRL(
                        members.reduce((acc, m) => acc + (customSplits[m.userId] || 0), 0)
                      )}
                    </strong>
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      initializeEvenSplits('exact', parseFloat(amount.replace(',', '.')) || 0)
                    }
                    className="text-[11px] font-semibold text-brand-600 dark:text-brand-400 hover:underline"
                  >
                    Distribuir igualmente
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Natureza da Despesa: Fixa vs Variável */}
          <div className="space-y-2 pt-1 border-t border-gray-100 dark:border-gray-800">
            <span className="text-xs font-bold text-gray-800 dark:text-gray-200 block">
              Natureza da Despesa
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setNature('variable');
                  if (dueDateMode === 'recurring_day') setDueDateMode('none');
                }}
                className={`py-2 px-3 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-0.5 border transition-all ${
                  nature === 'variable'
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-700 dark:text-indigo-300 shadow-u-xs'
                    : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                }`}
              >
                <span>🛒 Gasto Variável</span>
                <span className="text-[10px] font-normal opacity-80">Mercado, compras, avulsos</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setNature('fixed');
                  if (dueDateMode === 'none') setDueDateMode('recurring_day');
                }}
                className={`py-2 px-3 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-0.5 border transition-all ${
                  nature === 'fixed'
                    ? 'bg-brand-50 dark:bg-brand-950/60 border-brand-500 text-brand-700 dark:text-brand-300 shadow-u-xs'
                    : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                }`}
              >
                <span>🏢 Conta Fixa da Casa</span>
                <span className="text-[10px] font-normal opacity-80">Aluguel, luz, condomínio, net</span>
              </button>
            </div>
          </div>

          {/* Vencimento & Boleto da Conta */}
          <div className="p-3.5 bg-sand-50/70 dark:bg-gray-800/60 rounded-xl border border-sand-200 dark:border-gray-700 space-y-3">
            <span className="text-xs font-bold text-gray-800 dark:text-gray-200 block">
              Data de Vencimento
            </span>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setDueDateMode('none')}
                className={`py-1.5 px-2 rounded-lg text-xs font-semibold border text-center transition-all ${
                  dueDateMode === 'none'
                    ? 'bg-white dark:bg-gray-900 border-brand-500 text-brand-700 dark:text-brand-300 shadow-u-xs font-bold'
                    : 'bg-transparent border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                }`}
              >
                Sem vencimento
              </button>
              <button
                type="button"
                onClick={() => setDueDateMode('recurring_day')}
                className={`py-1.5 px-2 rounded-lg text-xs font-semibold border text-center transition-all ${
                  dueDateMode === 'recurring_day'
                    ? 'bg-white dark:bg-gray-900 border-brand-500 text-brand-700 dark:text-brand-300 shadow-u-xs font-bold'
                    : 'bg-transparent border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                }`}
              >
                Dia fixo (Mês)
              </button>
              <button
                type="button"
                onClick={() => setDueDateMode('specific_date')}
                className={`py-1.5 px-2 rounded-lg text-xs font-semibold border text-center transition-all ${
                  dueDateMode === 'specific_date'
                    ? 'bg-white dark:bg-gray-900 border-brand-500 text-brand-700 dark:text-brand-300 shadow-u-xs font-bold'
                    : 'bg-transparent border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                }`}
              >
                Data exata
              </button>
            </div>

            {dueDateMode === 'recurring_day' && (
              <div className="flex items-center gap-2 pl-1 animate-in fade-in duration-150">
                <Clock className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                <span className="text-xs text-gray-600 dark:text-gray-400">Dia de vencimento todo mês:</span>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={dueDay}
                  onChange={(e) => setDueDay(Math.min(31, Math.max(1, Number(e.target.value))))}
                  className="w-16 px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs text-center font-bold"
                />
              </div>
            )}

            {dueDateMode === 'specific_date' && (
              <div className="flex items-center gap-2 pl-1 animate-in fade-in duration-150">
                <Calendar className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                <span className="text-xs text-gray-600 dark:text-gray-400">Data de vencimento:</span>
                <input
                  type="date"
                  value={specificDueDate}
                  onChange={(e) => setSpecificDueDate(e.target.value)}
                  className="px-2.5 py-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs font-semibold"
                />
              </div>
            )}

            {/* Linha Digitável / Código de barras do boleto */}
            <div className="pt-2 border-t border-gray-200/50 dark:border-gray-700/60 space-y-1">
              <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                <Barcode className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                <span>Código de Barras / Linha Digitável do Boleto (opcional)</span>
              </label>
              <input
                type="text"
                placeholder="Ex: 23793.38128 60074.120084 12000.654019 1 98760000082000"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs font-mono placeholder:font-sans"
              />
              <p className="text-[10px] text-gray-400">
                Cole a linha digitável do boleto para os moradores poderem copiar com 1 clique para pagar.
              </p>
            </div>
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

      {/* PIX QR Code & BR Code Copia e Cola Modal */}
      {activePixSettlement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative max-w-sm w-full bg-white dark:bg-gray-900 rounded-2xl shadow-u-xl border border-gray-200 dark:border-gray-800 p-5 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                  <QrCodeIcon className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                  Pagamento PIX Oficial
                </h3>
              </div>
              <button
                onClick={() => setActivePixSettlement(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-center space-y-1">
              <span className="text-xs text-gray-500 dark:text-gray-400 block">
                Transferência de {activePixSettlement.fromName} para:
              </span>
              <h4 className="text-base font-bold text-gray-900 dark:text-white">
                {activePixSettlement.toName}
              </h4>
              <div className="inline-block px-3 py-1 bg-emerald-50 dark:bg-emerald-950/50 rounded-full border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-mono font-bold text-lg">
                {formatCurrencyBRL(activePixSettlement.amount)}
              </div>
            </div>

            {/* QR Code Container */}
            <div className="p-4 bg-white rounded-2xl border border-gray-200 shadow-inner flex flex-col items-center justify-center">
              {pixQrDataUrl ? (
                <img
                  src={pixQrDataUrl}
                  alt="QR Code PIX Banco Central"
                  className="w-52 h-52 object-contain"
                />
              ) : (
                <div className="w-52 h-52 flex items-center justify-center text-xs text-gray-400">
                  Carregando QR Code...
                </div>
              )}
              <span className="text-[10px] text-gray-400 mt-2 font-medium">
                Abra o app do seu banco e aponte a câmera
              </span>
            </div>

            {/* Action buttons */}
            <div className="space-y-2 pt-1">
              {pixPayloadString && (
                <button
                  onClick={() =>
                    handleCopyPixString(pixPayloadString, 'payload', 'Código PIX Copia e Cola')
                  }
                  className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-u-xs flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  {copiedPixType === 'payload' ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                  <span>
                    {copiedPixType === 'payload'
                      ? 'Código Copiado com Sucesso!'
                      : 'Copiar PIX Copia e Cola Oficial'}
                  </span>
                </button>
              )}

              {/* Raw Key copy button */}
              {(() => {
                const cred = members.find((m) => m.userId === activePixSettlement.toUserId);
                if (!cred?.pixKey) return null;
                return (
                  <button
                    onClick={() => handleCopyPixString(cred.pixKey!, 'key', 'Chave PIX')}
                    className="w-full py-2 px-3 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-semibold text-xs transition-colors flex items-center justify-center gap-2"
                  >
                    {copiedPixType === 'key' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>
                      {copiedPixType === 'key'
                        ? 'Chave Copiada!'
                        : `Copiar Apenas a Chave (${cred.pixKeyType || 'PIX'}): ${cred.pixKey}`}
                    </span>
                  </button>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Budget Target & Categories Adjustment Modal */}
      {showBudgetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative max-w-md w-full bg-white dark:bg-gray-900 rounded-2xl shadow-u-xl border border-gray-200 dark:border-gray-800 p-5 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                  Configurar Teto Orçamentário
                </h3>
              </div>
              <button
                onClick={() => setShowBudgetModal(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBudget} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                  Teto Orçamentário Global da Casa (R$/mês)
                </label>
                <input
                  type="text"
                  value={budgetMonthlyTarget}
                  onChange={(e) => setBudgetMonthlyTarget(e.target.value)}
                  placeholder="3800.00"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm font-bold text-gray-900 dark:text-white font-display focus:ring-2 focus:ring-emerald-500/30"
                  required
                />
                <span className="text-[11px] text-gray-500 mt-1 block">
                  Limite máximo planejado para os gastos totais somados no mês.
                </span>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                  Alerta Amarelo de Atenção (% consumido)
                </label>
                <input
                  type="number"
                  min="50"
                  max="95"
                  value={budgetThreshold}
                  onChange={(e) => setBudgetThreshold(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs font-bold text-gray-900 dark:text-white"
                />
              </div>

              <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                <span className="text-xs font-bold text-gray-800 dark:text-gray-200 block">
                  Tetos Sugeridos por Categoria (Opcional)
                </span>

                <div className="grid grid-cols-2 gap-2.5">
                  {(
                    [
                      { label: 'Supermercado', cat: 'supermercado' },
                      { label: 'Contas & Serviços', cat: 'contas' },
                      { label: 'Casa & Reformas', cat: 'casa' },
                      { label: 'Cuidados Pet', cat: 'pet' },
                    ] as const
                  ).map((item) => (
                    <div key={item.cat}>
                      <span className="text-[11px] font-semibold text-gray-600 dark:text-gray-400 block mb-0.5">
                        {item.label}
                      </span>
                      <input
                        type="text"
                        value={categoryTargetsInput[item.cat]}
                        onChange={(e) =>
                          setCategoryTargetsInput({
                            ...categoryTargetsInput,
                            [item.cat]: e.target.value,
                          })
                        }
                        className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs font-bold text-gray-900 dark:text-white"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-100 dark:border-gray-800">
                <Button variant="secondary" size="sm" onClick={() => setShowBudgetModal(false)}>
                  Cancelar
                </Button>
                <Button variant="primary" size="sm" type="submit">
                  Salvar Orçamento
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Report Modal (Fechamento Mensal & Impressão / PDF) */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative max-w-2xl w-full max-h-[85vh] overflow-y-auto bg-white dark:bg-gray-900 rounded-2xl shadow-u-xl border border-gray-200 dark:border-gray-800 p-6 space-y-5 animate-in zoom-in-95 duration-150 print:p-0 print:border-none print:shadow-none">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800 print:hidden">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-brand-600" />
                <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider font-display">
                  Relatório de Fechamento Financeiro
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-200 text-xs font-semibold flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir / PDF</span>
                </button>
                <button
                  onClick={() => setShowReportModal(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Printable Statement Content */}
            <div className="space-y-4 text-xs text-gray-800 dark:text-gray-200">
              <div className="border-b border-gray-200 dark:border-gray-800 pb-3">
                <div className="flex justify-between items-baseline">
                  <h2 className="text-lg font-black font-display text-gray-900 dark:text-white">
                    {house.name || 'Domus Residence'}
                  </h2>
                  <span className="text-xs font-mono text-gray-500">
                    Emitido em: {new Date().toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  {house.address || 'Residência Compartilhada'} • {members.length} Moradores
                </p>
              </div>

              {/* Summary KPIs */}
              <div className="grid grid-cols-3 gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200/60 dark:border-gray-800">
                <div>
                  <span className="text-[10px] text-gray-500 block uppercase font-bold">Total Lançado</span>
                  <span className="text-sm font-black font-display text-gray-900 dark:text-white">
                    {formatCurrencyBRL(totalAllTime)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 block uppercase font-bold">Total em Aberto</span>
                  <span className="text-sm font-black font-display text-warning-600 dark:text-warning-400">
                    {formatCurrencyBRL(totalHouseSpend)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 block uppercase font-bold">Teto do Mês</span>
                  <span className="text-sm font-black font-display text-emerald-600 dark:text-emerald-400">
                    {formatCurrencyBRL(budgetStatus.monthlyTarget)}
                  </span>
                </div>
              </div>

              {/* Acertos Simplificados */}
              <div className="space-y-2">
                <h4 className="font-bold uppercase tracking-wider text-[11px] text-gray-700 dark:text-gray-300">
                  Compensação de Dívidas (Quem Paga Quem)
                </h4>
                {settlements.length === 0 ? (
                  <p className="text-gray-500 italic">Nenhum acerto pendente. Todas as contas equilibradas.</p>
                ) : (
                  <div className="space-y-1">
                    {settlements.map((s, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center p-2 rounded-lg bg-gray-50 dark:bg-gray-800/40 border border-gray-200/50 dark:border-gray-800"
                      >
                        <span>
                          <strong>{s.fromName}</strong> transfere para <strong>{s.toName}</strong>
                        </span>
                        <span className="font-bold font-mono text-warning-600 dark:text-warning-400">
                          {formatCurrencyBRL(s.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Balanço por Morador */}
              <div className="space-y-2">
                <h4 className="font-bold uppercase tracking-wider text-[11px] text-gray-700 dark:text-gray-300">
                  Balanço Líquido Individual
                </h4>
                <div className="space-y-1">
                  {members.map((m) => {
                    const mb = balances[m.userId] || { totalPaid: 0, fairShare: 0, net: 0 };
                    return (
                      <div
                        key={m.userId}
                        className="flex justify-between items-center p-2 rounded-lg border border-gray-100 dark:border-gray-800 text-xs"
                      >
                        <span className="font-semibold">{m.displayName}</span>
                        <div className="flex gap-4">
                          <span>Pago: {formatCurrencyBRL(mb.totalPaid)}</span>
                          <span>Cota: {formatCurrencyBRL(mb.fairShare)}</span>
                          <span
                            className={`font-bold ${
                              mb.net > 0 ? 'text-emerald-600' : mb.net < 0 ? 'text-rose-600' : ''
                            }`}
                          >
                            {mb.net > 0 ? `+${formatCurrencyBRL(mb.net)}` : formatCurrencyBRL(mb.net)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Categorias */}
              <div className="space-y-2">
                <h4 className="font-bold uppercase tracking-wider text-[11px] text-gray-700 dark:text-gray-300">
                  Despesas por Categoria
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {Object.entries(categoryTotals).map(([cat, total]) => (
                    <div
                      key={cat}
                      className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800/40 border border-gray-200/40 dark:border-gray-800 flex justify-between"
                    >
                      <span className="capitalize">{cat}:</span>
                      <span className="font-bold">{formatCurrencyBRL(total)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 dark:border-gray-800 print:hidden">
              <Button variant="secondary" size="sm" onClick={() => setShowReportModal(false)}>
                Fechar Relatório
              </Button>
            </div>
          </div>
        </div>
      )}

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
