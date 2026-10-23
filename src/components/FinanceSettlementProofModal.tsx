import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { SettlementTransfer, formatCurrencyBRL } from '../utils/financeMath';
import { X, Upload, Camera, Check, ArrowRight, Image as ImageIcon, Trash2 } from 'lucide-react';
import { Button } from './untitled/Button';

interface FinanceSettlementProofModalProps {
  isOpen: boolean;
  settlement: SettlementTransfer | null;
  onClose: () => void;
  monthKey?: string;
}

export const FinanceSettlementProofModal: React.FC<FinanceSettlementProofModalProps> = ({
  isOpen,
  settlement,
  onClose,
  monthKey,
}) => {
  const { settleUpWithProof, showToast } = useApp();
  const [proofPhotoData, setProofPhotoData] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen || !settlement) return null;

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      showToast('Imagem muito grande. Máximo 3MB.', 'warning');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setProofPhotoData(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      settleUpWithProof(
        settlement.fromUserId,
        settlement.toUserId,
        settlement.amount,
        proofPhotoData || undefined,
        monthKey,
        notes.trim() || undefined
      );
      setProofPhotoData(null);
      setNotes('');
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl shadow-u-xl border border-gray-200 dark:border-gray-800 p-6 space-y-5 animate-u-scale">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
          <div>
            <h3 className="text-base font-bold font-display text-gray-900 dark:text-white">
              Liquidar Acerto PIX
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Registre a transferência e anexe o comprovante bancário
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Transfer details pill */}
        <div className="p-4 rounded-2xl bg-brand-50/70 dark:bg-brand-950/40 border border-brand-200/60 dark:border-brand-800/60 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-bold text-gray-900 dark:text-white text-xs truncate">
              {settlement.fromName}
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400 flex-shrink-0" />
            <span className="font-bold text-gray-900 dark:text-white text-xs truncate">
              {settlement.toName}
            </span>
          </div>
          <span className="font-mono font-black text-brand-700 dark:text-brand-300 text-sm">
            {formatCurrencyBRL(settlement.amount)}
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Upload Proof */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Comprovante de Transferência / PIX (Opcional)
            </label>

            {proofPhotoData ? (
              <div className="relative rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <img
                  src={proofPhotoData}
                  alt="Comprovante"
                  className="w-full h-44 object-contain bg-black/5"
                />
                <button
                  type="button"
                  onClick={() => setProofPhotoData(null)}
                  className="absolute top-2 right-2 p-1.5 rounded-xl bg-error-600 text-white shadow-u-xs hover:bg-error-700 transition-colors"
                  title="Remover anexo"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-brand-500 dark:hover:border-brand-500 rounded-2xl p-4 text-center bg-gray-50/50 dark:bg-gray-800/30 transition-colors group"
              >
                <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center mx-auto mb-2 group-hover:scale-105 transition-transform">
                  <Camera className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-gray-800 dark:text-gray-200">
                  Toque para anexar print ou foto
                </p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                  PNG, JPG ou WebP até 3MB
                </p>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoUpload}
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Observação (Opcional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Pago via Nubank às 14:30"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
            <Button type="button" variant="tertiary" size="sm" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSubmitting}
              className="gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Confirmar Quitação</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
