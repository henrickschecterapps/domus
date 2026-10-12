import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PantryCategory, PantryItem, ShoppingItem } from '../types';
import {
  ShoppingCart,
  Package,
  Plus,
  Check,
  Trash2,
  Archive,
} from 'lucide-react';
import { SegmentedControl } from '../components/SegmentedControl';
import { BottomSheet } from '../components/BottomSheet';

export const PantryShoppingView: React.FC = () => {
  const {
    pantryItems,
    shoppingItems,
    currentUser,
    addPantryItem,
    updatePantryQuantity,
    deletePantryItem,
    addShoppingItem,
    toggleShoppingItemBought,
    moveShoppingItemToPantry,
    deleteShoppingItem,
    clearBoughtItems,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'shopping' | 'pantry'>('shopping');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Modals state
  const [showAddItemSheet, setShowAddItemSheet] = useState(false);
  const [itemName, setItemName] = useState('');
  const [itemCategory, setItemCategory] = useState<PantryCategory>('mercearia');
  const [itemQuantity, setItemQuantity] = useState('1');
  const [itemUnit, setItemUnit] = useState<any>('un');
  const [minQty, setMinQty] = useState('1');
  const [autoAdd, setAutoAdd] = useState(true);

  const categories: { id: string; label: string }[] = [
    { id: 'all', label: 'Todas' },
    { id: 'mercearia', label: 'Mercearia' },
    { id: 'limpeza', label: 'Limpeza' },
    { id: 'pet', label: 'Pet' },
    { id: 'hortifruti', label: 'Hortifruti' },
    { id: 'refrigerados', label: 'Refrigerados' },
  ];

  const filteredPantry = pantryItems.filter(
    (item) => selectedCategory === 'all' || item.category === selectedCategory
  );

  const filteredShopping = shoppingItems.filter(
    (item) => selectedCategory === 'all' || item.category === selectedCategory
  );

  const pendingShoppingCount = shoppingItems.filter((i) => !i.isBought).length;
  const boughtCount = shoppingItems.filter((i) => i.isBought).length;

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim()) return;

    if (activeTab === 'pantry') {
      addPantryItem({
        name: itemName.trim(),
        category: itemCategory,
        currentQuantity: parseFloat(itemQuantity) || 1,
        minQuantity: parseFloat(minQty) || 1,
        unit: itemUnit,
        autoAddToShopping: autoAdd,
      });
    } else {
      addShoppingItem({
        name: itemName.trim(),
        category: itemCategory,
        quantity: parseFloat(itemQuantity) || 1,
        unit: itemUnit,
        isBought: false,
        addedBy: currentUser.displayName,
      });
    }

    setItemName('');
    setShowAddItemSheet(false);
  };

  return (
    <div className="space-y-4 pb-20 animate-in fade-in duration-200 w-full">
      {/* Switcher Tab & Add Button */}
      <div className="p-2 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-u-xs flex items-center justify-between gap-3">
        <SegmentedControl
          className="flex-1"
          options={[
            { id: 'shopping', label: 'Lista de Compras', count: pendingShoppingCount, icon: ShoppingCart },
            { id: 'pantry', label: 'Despensa (Estoque)', count: pantryItems.length, icon: Package },
          ]}
          value={activeTab}
          onChange={(v) => setActiveTab(v)}
        />

        <button
          onClick={() => setShowAddItemSheet(true)}
          className="h-10 px-3.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white flex items-center gap-1.5 transition-all shadow-u-xs active:scale-95 flex-shrink-0 text-xs font-semibold"
          title={activeTab === 'pantry' ? 'Novo item na despensa' : 'Novo item de compra'}
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span className="hidden sm:inline">Adicionar</span>
        </button>
      </div>

      {/* Categories Filter Bar */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedCategory === cat.id
                ? 'bg-brand-600 text-white shadow-u-xs'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/60'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* TAB 1: LISTA DE COMPRAS */}
      {activeTab === 'shopping' && (
        <div className="space-y-3">
          {boughtCount > 0 && (
            <div className="flex justify-end">
              <button
                onClick={clearBoughtItems}
                className="text-xs text-gray-500 hover:text-error-600 flex items-center gap-1.5 transition-colors font-medium"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Limpar itens já comprados ({boughtCount})</span>
              </button>
            </div>
          )}

          {filteredShopping.length === 0 ? (
            <div className="py-14 text-center rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-u-xs">
              <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-950/60 border border-brand-200/50 dark:border-brand-800/40 text-brand-600 dark:text-brand-400 flex items-center justify-center mx-auto mb-3">
                <ShoppingCart className="w-6 h-6 stroke-[1.8]" />
              </div>
              <p className="text-sm font-bold text-gray-900 dark:text-white font-display">Lista de compras vazia</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Toque no botão Adicionar acima para registrar itens na lista.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {filteredShopping.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-center justify-between gap-3 p-4 rounded-xl border transition-all ${
                    item.isBought
                      ? 'bg-gray-50/60 dark:bg-gray-800/20 border-gray-200/50 dark:border-gray-800/40 opacity-60'
                      : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-u-xs hover:border-brand-300 dark:hover:border-brand-700/60'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    {/* Circle Checkbox */}
                    <button
                      onClick={() => toggleShoppingItemBought(item.id)}
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 active:scale-90 flex-shrink-0 ${
                        item.isBought
                          ? 'bg-success-600 border-success-600 text-white'
                          : 'border-gray-300 dark:border-gray-600 hover:border-brand-500 bg-transparent'
                      }`}
                    >
                      {item.isBought && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </button>

                    <div className="min-w-0">
                      <span
                        className={`text-xs font-bold block truncate transition-all ${
                          item.isBought
                            ? 'line-through text-gray-400 dark:text-gray-500'
                            : 'text-gray-900 dark:text-white'
                        }`}
                      >
                        {item.name}
                      </span>
                      <div className="flex items-center gap-2 text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                        <span className="font-bold text-brand-600 dark:text-brand-400 font-display">
                          {item.quantity} {item.unit}
                        </span>
                        <span>•</span>
                        <span className="capitalize">{item.category}</span>
                        {item.addedBy && (
                          <>
                            <span>•</span>
                            <span>por {item.addedBy}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {item.isBought && (
                      <button
                        onClick={() => moveShoppingItemToPantry(item.id)}
                        className="px-2.5 py-1 rounded-lg bg-success-50 dark:bg-success-950/60 hover:bg-success-100 text-success-700 dark:text-success-300 border border-success-200/60 dark:border-success-800/40 text-[11px] font-semibold flex items-center gap-1 transition-colors"
                        title="Guardar na despensa"
                      >
                        <Archive className="w-3 h-3" />
                        <span>Mover</span>
                      </button>
                    )}

                    <button
                      onClick={() => deleteShoppingItem(item.id)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-error-600 hover:bg-error-50 dark:hover:bg-error-950/40 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: DESPENSA (ESTOQUE) */}
      {activeTab === 'pantry' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {filteredPantry.map((item) => {
            const isLow = item.currentQuantity <= item.minQuantity;

            return (
              <div
                key={item.id}
                className="p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 flex items-center justify-between gap-3 shadow-u-xs"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-gray-900 dark:text-white truncate">
                      {item.name}
                    </h4>
                    {isLow && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-error-50 dark:bg-error-950/60 text-error-700 dark:text-error-300 border border-error-200/60 dark:border-error-900/40">
                        Baixo
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                    Mínimo: {item.minQuantity} {item.unit} •{' '}
                    <span className="capitalize">{item.category}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2.5 flex-shrink-0">
                  <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-800/80 p-1 rounded-xl border border-gray-200/60 dark:border-gray-700/60">
                    <button
                      onClick={() =>
                        updatePantryQuantity(item.id, item.currentQuantity - 1)
                      }
                      disabled={item.currentQuantity <= 0}
                      className="w-7 h-7 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-bold flex items-center justify-center text-xs disabled:opacity-30 shadow-xs hover:bg-gray-50"
                    >
                      -
                    </button>
                    <span className="text-xs font-extrabold font-display text-gray-900 dark:text-white w-12 text-center">
                      {item.currentQuantity} {item.unit}
                    </span>
                    <button
                      onClick={() =>
                        updatePantryQuantity(item.id, item.currentQuantity + 1)
                      }
                      className="w-7 h-7 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-bold flex items-center justify-center text-xs shadow-xs hover:bg-gray-50"
                    >
                      +
                    </button>
                  </div>

                  <button
                    onClick={() => deletePantryItem(item.id)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-error-600 hover:bg-error-50 dark:hover:bg-error-950/40 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Item BottomSheet */}
      <BottomSheet
        isOpen={showAddItemSheet}
        onClose={() => setShowAddItemSheet(false)}
        title={activeTab === 'pantry' ? 'Novo Item na Despensa' : 'Novo Item na Lista de Compras'}
        subtitle="Gerencie seu estoque doméstico de forma inteligente"
      >
        <form onSubmit={handleAddItem} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
              Nome do Item
            </label>
            <input
              type="text"
              placeholder="Ex: Café em pó ou Papel Toalha"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                Categoria
              </label>
              <select
                value={itemCategory}
                onChange={(e) => setItemCategory(e.target.value as any)}
                className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              >
                <option value="mercearia">Mercearia</option>
                <option value="limpeza">Limpeza</option>
                <option value="pet">Pet</option>
                <option value="hortifruti">Hortifruti</option>
                <option value="refrigerados">Refrigerados</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                Unidade
              </label>
              <select
                value={itemUnit}
                onChange={(e) => setItemUnit(e.target.value as any)}
                className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              >
                <option value="un">Unidade (un)</option>
                <option value="kg">Quilo (kg)</option>
                <option value="l">Litro (l)</option>
                <option value="pacote">Pacote</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                Quantidade
              </label>
              <input
                type="number"
                min="0.5"
                step="0.5"
                value={itemQuantity}
                onChange={(e) => setItemQuantity(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/30 font-display font-semibold"
              />
            </div>

            {activeTab === 'pantry' && (
              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                  Qtd. Mínima
                </label>
                <input
                  type="number"
                  min="1"
                  value={minQty}
                  onChange={(e) => setMinQty(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/30 font-display font-semibold"
                />
              </div>
            )}
          </div>

          {activeTab === 'pantry' && (
            <label className="flex items-center gap-2 text-xs font-medium text-gray-700 dark:text-gray-300 pt-1 cursor-pointer">
              <input
                type="checkbox"
                checked={autoAdd}
                onChange={(e) => setAutoAdd(e.target.checked)}
                className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
              />
              <span>Adicionar automaticamente às compras se acabar</span>
            </label>
          )}

          <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-100 dark:border-gray-800">
            <button
              type="button"
              onClick={() => setShowAddItemSheet(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-u-xs transition-all active:scale-95"
            >
              Salvar Item
            </button>
          </div>
        </form>
      </BottomSheet>
    </div>
  );
};
