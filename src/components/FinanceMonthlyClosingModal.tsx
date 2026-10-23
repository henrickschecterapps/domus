import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../context/AppContext';
import {
  generateMonthlyWhatsAppReport,
  formatMonthKeyLabel,
  filterExpensesByMonth,
  formatCurrencyBRL,
} from '../utils/financeMath';
import { X, MessageCircle, Copy, Check, Lock, Sparkles, Send } from 'lucide-react';
import { Button } from './untitled/Button';

interface FinanceMonthlyClosingModalProps {
  isOpen: boolean;
  onClose: () => void;
  monthKey: string;
}

export const FinanceMonthlyClosingModal: React.FC<FinanceMonthlyClosingModalProps> = ({
  isOpen,
  onClose,
  monthKey,
}) => {
  const { house, expenses, members, closeMonth, showToast } = useApp();
  const [copied, setCopied] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || typeof document === 'undefined') return null;

  const monthLabel = formatMonthKeyLabel(monthKey);
  const monthExpenses = filterExpensesByMonth(expenses, monthKey);
  const totalSpend = monthExpenses.reduce((acc, e) => acc + e.amount, 0);

  const reportText = generateMonthlyWhatsAppReport(
    monthKey,
    expenses,
    members,
    house.name
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(reportText);
    setCopied(true);
    showToast('Relatório copiado para a área de transferência!', 'success');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSendWhatsApp = () => {
    const encoded = encodeURIComponent(reportText);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  const handleConfirmClosing = () => {
    setIsClosing(true);
    try {
      closeMonth(monthKey);
      onClose();
    } finally {
      setIsClosing(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-150 overflow-hidden">
      <div className="w-full max-w-lg max-h-[88dvh] sm:max-h-[85vh] overflow-y-auto bg-white dark:bg-gray-900 rounded-3xl shadow-u-xl border border-gray-200 dark:border-gray-800 p-5 sm:p-6 space-y-4 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-50 dark:bg-brand-950/70 text-brand-600 dark:text-brand-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold font-display text-gray-900 dark:text-white">
                Fechamento do Mês • {monthLabel}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Resumo consolidado pronto para compartilhar com os moradores
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick summary chips */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200/60 dark:border-gray-800">
            <span className="text-[10px] uppercase font-mono font-bold text-gray-400">
              Total do Período
            </span>
            <p className="text-base font-black font-display text-gray-900 dark:text-white mt-0.5">
              {formatCurrencyBRL(totalSpend)}
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200/60 dark:border-gray-800">
            <span className="text-[10px] uppercase font-mono font-bold text-gray-400">
              Lançamentos
            </span>
            <p className="text-base font-black font-display text-gray-900 dark:text-white mt-0.5">
              {monthExpenses.length} contas
            </p>
          </div>
        </div>

        {/* Formatted Text Preview */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            Mensagem Formatada para WhatsApp
          </label>
          <div className="relative">
            <textarea
              readOnly
              rows={8}
              value={reportText}
              className="w-full p-3.5 rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-800/40 text-gray-800 dark:text-gray-200 font-mono text-[11px] leading-relaxed resize-none focus:outline-none"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-xs font-bold text-gray-700 dark:text-gray-300 transition-colors shadow-u-xs"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-success-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copiado!' : 'Copiar Texto'}</span>
            </button>

            <button
              onClick={handleSendWhatsApp}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-success-600 hover:bg-success-700 text-white text-xs font-bold transition-all shadow-u-xs active:scale-95"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Abrir WhatsApp</span>
            </button>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={handleConfirmClosing}
            disabled={isClosing}
            className="gap-1.5"
            title="Congela o balanço do mês e marca as despesas como quitadas"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Salvar Snapshot</span>
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
};
