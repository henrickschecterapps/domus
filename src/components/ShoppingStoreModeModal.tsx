import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ShoppingItem, ShoppingAisleCategory } from '../types';
import { formatCurrencyBRL } from '../utils/financeMath';
import {
  X,
  Check,
  ShoppingCart,
  Plus,
  ArrowRight,
  Sparkles,
  ShoppingBag,
  DollarSign,
  Package,
  Layers,
} from 'lucide-react';
import { Button } from './untitled/Button';
import { triggerHaptic } from '../utils/haptics';
import { playSuccessChime, playCoinSound } from '../utils/soundEffects';

interface ShoppingStoreModeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AISLE_ORDER: { id: ShoppingAisleCategory; label: string; icon: string }[] = [
  { id: 'hortifruti', label: 'Hortifruti & Feira', icon: '🥦' },
  { id: 'padaria', label: 'Padaria & Pães', icon: '🥖' },
  { id: 'mercearia', label: 'Mercearia & Mantimentos', icon: '🥫' },
  { id: 'laticinios', label: 'Laticínios & Ovos', icon: '🧀' },
  { id: 'carnes', label: 'Carnes & Frios', icon: '🥩' },
  { id: 'bebidas', label: 'Bebidas', icon: '🥤' },
  { id: 'limpeza', label: 'Limpeza & Higiene', icon: '🧼' },
  { id: 'pet', label: 'Rações & Pet Care', icon: '🐾' },
  { id: 'outros', label: 'Outros Corredores', icon: '🛒' },
];

export const ShoppingStoreModeModal: React.FC<ShoppingStoreModeModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    shoppingItems,
    toggleShoppingItemBought,
    checkoutShoppingTrip,
    addShoppingItem,
    currentUser,
    soundEnabled,
  } = useApp();

  const [showCheckoutConfirm, setShowCheckoutConfirm] = useState(false);
  const [actualSpendInput, setActualSpendInput] = useState('');
  const [moveItemsToPantry, setMoveItemsToPantry] = useState(true);
  const [quickItemName, setQuickItemName] = useState('');
  const [quickItemAisle, setQuickItemAisle] = useState<ShoppingAisleCategory>('mercearia');
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  if (!isOpen) return null;

  const boughtItems = shoppingItems.filter((i) => i.isBought);
  const pendingItems = shoppingItems.filter((i) => !i.isBought);

  const cartEstimatedTotal = boughtItems.reduce((acc, item) => {
    return acc + (item.estimatedPrice || 0) * (item.quantity || 1);
  }, 0);

  const pendingEstimatedTotal = pendingItems.reduce((acc, item) => {
    return acc + (item.estimatedPrice || 0) * (item.quantity || 1);
  }, 0);

  const totalForecast = cartEstimatedTotal + pendingEstimatedTotal;

  const handleToggle = (id: string) => {
    triggerHaptic('medium');
    playSuccessChime(soundEnabled);
    toggleShoppingItemBought(id);
  };

  const handleOpenCheckout = () => {
    setActualSpendInput(cartEstimatedTotal > 0 ? cartEstimatedTotal.toFixed(2) : '');
    setShowCheckoutConfirm(true);
  };

  const handleConfirmCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    const finalAmount = parseFloat(actualSpendInput.replace(',', '.')) || cartEstimatedTotal;
    checkoutShoppingTrip(finalAmount, 'supermercado', moveItemsToPantry);
    setShowCheckoutConfirm(false);
    onClose();
  };

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickItemName.trim()) return;

    addShoppingItem({
      name: quickItemName.trim(),
      category: 'mercearia',
      aisleCategory: quickItemAisle,
      quantity: 1,
      unit: 'un',
      isBought: false,
      addedBy: currentUser.displayName,
    });
    setQuickItemName('');
    setShowQuickAdd(false);
    triggerHaptic('light');
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gray-950 text-white animate-in fade-in duration-200">
      {/* Top Header Bar */}
      <header className="p-4 bg-gray-900/90 backdrop-blur-xl border-b border-gray-800 flex items-center justify-between safe-top">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-500 to-violet-600 text-white flex items-center justify-center shadow-u-glow">
            <ShoppingCart className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold font-display tracking-tight text-white">
                Modo Mercado
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-brand-500/20 text-brand-300 border border-brand-500/40">
                AO VIVO
              </span>
            </div>
            <p className="text-xs text-gray-400">
              {boughtItems.length} de {shoppingItems.length} itens no carrinho
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowQuickAdd(!showQuickAdd)}
            className="p-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-brand-400 transition-colors"
            title="Adicionar item rápido"
          >
            <Plus className="w-5 h-5" />
          </button>
          <button
            onClick={onClose}
            className="p-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
            title="Fechar Modo Mercado"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Quick Add Form Dropdown */}
      {showQuickAdd && (
        <form onSubmit={handleQuickAdd} className="p-4 bg-gray-900 border-b border-gray-800 space-y-3 animate-in slide-in-from-top-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={quickItemName}
              onChange={(e) => setQuickItemName(e.target.value)}
              placeholder="Ex: Café em pó, Queijo prato..."
              className="flex-1 px-4 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-sm text-white placeholder-gray-500 outline-none focus:border-brand-500"
              autoFocus
            />
            <select
              value={quickItemAisle}
              onChange={(e) => setQuickItemAisle(e.target.value as any)}
              className="px-3 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-xs text-gray-300 outline-none"
            >
              {AISLE_ORDER.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.icon} {a.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowQuickAdd(false)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-400 hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs"
            >
              Adicionar
            </button>
          </div>
        </form>
      )}

      {/* Main Scrollable Aisle List */}
      <main className="flex-1 overflow-y-auto p-4 space-y-6 pb-36">
        {shoppingItems.length === 0 ? (
          <div className="text-center py-20 text-gray-500 space-y-2">
            <ShoppingCart className="w-12 h-12 mx-auto text-gray-700" />
            <p className="text-sm font-semibold">Sua lista de compras está vazia!</p>
            <p className="text-xs">Toque no botão + acima para adicionar itens.</p>
          </div>
        ) : (
          AISLE_ORDER.map((aisle) => {
            const aisleItems = shoppingItems.filter(
              (i) => (i.aisleCategory || 'mercearia') === aisle.id
            );
            if (aisleItems.length === 0) return null;

            return (
              <div key={aisle.id} className="space-y-2.5">
                <div className="flex items-center justify-between pb-1.5 border-b border-gray-800">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{aisle.icon}</span>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-300 font-display">
                      {aisle.label}
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono text-gray-500 font-semibold">
                    {aisleItems.filter((i) => i.isBought).length}/{aisleItems.length}
                  </span>
                </div>

                <div className="space-y-2">
                  {aisleItems.map((item) => {
                    const isBought = item.isBought;
                    return (
                      <div
                        key={item.id}
                        onClick={() => handleToggle(item.id)}
                        className={`cursor-pointer p-4 rounded-2xl border transition-all duration-150 flex items-center justify-between gap-3 active:scale-[0.98] select-none ${
                          isBought
                            ? 'bg-gray-900/40 border-gray-800/60 opacity-60'
                            : 'bg-gray-900 border-gray-700/80 hover:border-brand-500/70 shadow-u-xs'
                        }`}
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          {/* Large touch-target checkbox */}
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all flex-shrink-0 ${
                              isBought
                                ? 'bg-emerald-500 text-white shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                                : 'border-2 border-gray-600 bg-gray-800/80 text-transparent'
                            }`}
                          >
                            <Check className="w-4 h-4 stroke-[3]" />
                          </div>

                          <div className="min-w-0">
                            <p
                              className={`text-sm font-bold truncate ${
                                isBought ? 'line-through text-gray-500' : 'text-white'
                              }`}
                            >
                              {item.name}
                            </p>
                            <p className="text-xs text-gray-400">
                              {item.quantity} {item.unit}
                              {item.estimatedPrice ? ` • ~${formatCurrencyBRL(item.estimatedPrice * item.quantity)}` : ''}
                            </p>
                          </div>
                        </div>

                        {item.estimatedPrice ? (
                          <span
                            className={`font-mono text-xs font-bold ${
                              isBought ? 'text-gray-500' : 'text-brand-300'
                            }`}
                          >
                            {formatCurrencyBRL(item.estimatedPrice * item.quantity)}
                          </span>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </main>

      {/* Fixed Bottom Cart Status Bar */}
      <footer className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-2xl border-t border-gray-800 p-4 safe-bottom space-y-3 z-50">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase font-bold text-gray-400 block">
              Subtotal no Carrinho:
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black font-display text-emerald-400">
                {formatCurrencyBRL(cartEstimatedTotal)}
              </span>
              <span className="text-xs text-gray-400 font-medium">
                ({boughtItems.length} {boughtItems.length === 1 ? 'item' : 'itens'})
              </span>
            </div>
          </div>

          <button
            onClick={handleOpenCheckout}
            disabled={boughtItems.length === 0}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm shadow-[0_0_20px_rgba(16,185,129,0.35)] transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span>Passar no Caixa</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </footer>

      {/* Checkout Confirmation Modal */}
      {showCheckoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-gray-900 rounded-3xl border border-gray-800 p-6 space-y-5 animate-u-scale">
            <div className="flex items-center justify-between pb-3 border-b border-gray-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold font-display text-white">
                    Finalizar Compras do Mercado
                  </h3>
                  <p className="text-xs text-gray-400">
                    {boughtItems.length} itens marcados como comprados
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCheckoutConfirm(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmCheckout} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  Valor Total Pago no Caixa (R$) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 font-mono text-sm">
                    R$
                  </span>
                  <input
                    type="text"
                    value={actualSpendInput}
                    onChange={(e) => setActualSpendInput(e.target.value)}
                    placeholder="0,00"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white font-mono font-bold text-lg outline-none focus:border-emerald-500"
                    required
                    autoFocus
                  />
                </div>
                <p className="text-[11px] text-gray-500 mt-1">
                  Estimado pela lista: {formatCurrencyBRL(cartEstimatedTotal)}. Ajuste com o valor real da nota se desejar.
                </p>
              </div>

              {/* Automation Checkbox: Move to Pantry */}
              <label className="p-3.5 rounded-2xl bg-gray-800/60 border border-gray-700 flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={moveItemsToPantry}
                  onChange={(e) => setMoveItemsToPantry(e.target.checked)}
                  className="mt-0.5 rounded text-emerald-500 focus:ring-emerald-500"
                />
                <div className="text-xs">
                  <span className="font-bold text-white block">
                    Abastecer Estoque da Despensa
                  </span>
                  <span className="text-gray-400 text-[11px]">
                    Transfere automaticamente os {boughtItems.length} itens comprados para a Despensa e limpa a lista.
                  </span>
                </div>
              </label>

              {/* Finance Automation Info */}
              <div className="p-3.5 rounded-2xl bg-brand-950/40 border border-brand-800/60 text-xs text-brand-200 flex items-center gap-2.5">
                <DollarSign className="w-4 h-4 text-brand-400 flex-shrink-0" />
                <span>
                  O valor será lançado em <strong>Finanças</strong> como despesa de Supermercado e dividido igualmente entre todos os moradores.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowCheckoutConfirm(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white"
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs shadow-u-sm"
                >
                  Confirmar e Concluir
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
