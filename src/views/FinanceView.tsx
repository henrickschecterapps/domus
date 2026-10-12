import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Expense, ExpenseCategory } from '../types';
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
} from 'lucide-react';
import { BottomSheet } from '../components/BottomSheet';

export const FinanceView: React.FC = () => {
  const {
    expenses,
    members,
    currentUser,
    addExpense,
    toggleExpenseSettled,
    deleteExpense,
  } = useApp();

  const [showAddSheet, setShowAddSheet] = useState(false);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paidByUserId, setPaidByUserId] = useState(currentUser.userId);
  const [category, setCategory] = useState<ExpenseCategory>('supermercado');
  const [splitWithAll, setSplitWithAll] = useState(true);
  const [selectedSplitUsers, setSelectedSplitUsers] = useState<string[]>(
    members.map((m) => m.userId)
  );

  const { balances, settlements, totalHouseSpend } = calculateFinancialBalances(
    expenses,
    members
  );

  const userBalance = balances[currentUser.userId] || {
    totalPaid: 0,
    fairShare: 0,
    net: 0,
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
    });

    setDescription('');
    setAmount('');
    setShowAddSheet(false);
  };

  return (
    <div className="space-y-4 pb-20 animate-in fade-in duration-200 w-full">
      {/* Net Balance Master Card (Untitled UI & Apple Wallet Infused) */}
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Fair Share Settlement Matrix */}
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
                <p className="text-[11px] text-gray-500 dark:text-gray-400">Algoritmo de compensação mínima</p>
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
            <div className="space-y-2">
              {settlements.map((settlement, idx) => {
                const isUserDebtor = settlement.fromUserId === currentUser.userId;
                const isUserCreditor = settlement.toUserId === currentUser.userId;

                return (
                  <div
                    key={idx}
                    className={`flex items-center justify-between p-3.5 rounded-xl border text-xs transition-colors ${
                      isUserDebtor
                        ? 'bg-error-50/70 dark:bg-error-950/40 border-error-200 dark:border-error-900/40'
                        : isUserCreditor
                        ? 'bg-success-50/70 dark:bg-success-950/40 border-success-200 dark:border-success-900/40'
                        : 'bg-gray-50 dark:bg-gray-800/40 border-gray-200/60 dark:border-gray-800'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-bold text-gray-900 dark:text-gray-100">{settlement.fromName}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
                      <span className="font-bold text-gray-900 dark:text-gray-100">{settlement.toName}</span>
                    </div>

                    <span className="font-black font-display text-warning-600 dark:text-warning-400 text-sm">
                      {formatCurrencyBRL(settlement.amount)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Expense History Feed */}
        <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 shadow-u-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider font-display">
              Histórico de Despesas Compartilhadas
            </h3>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {expenses.length} lançamentos
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

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right">
                      <span className="text-sm font-black font-display text-gray-900 dark:text-white block">
                        {formatCurrencyBRL(expense.amount)}
                      </span>
                      <button
                        onClick={() => toggleExpenseSettled(expense.id)}
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
        subtitle="Divisão justa entre moradores da casa"
      >
        <form onSubmit={handleCreateExpense} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
              Descrição
            </label>
            <input
              type="text"
              placeholder="Ex: Supermercado Mensal ou Conta de Luz"
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

          <div className="pt-1">
            <label className="flex items-center gap-2 text-xs font-medium text-gray-700 dark:text-gray-300 cursor-pointer mb-2">
              <input
                type="checkbox"
                checked={splitWithAll}
                onChange={(e) => setSplitWithAll(e.target.checked)}
                className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
              />
              <span>Divisão padrão 50/50 (entre todos os residentes)</span>
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
    </div>
  );
};
