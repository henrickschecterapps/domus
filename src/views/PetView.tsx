import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Sparkles,
  ShoppingBag,
  Plus,
  Package,
  HeartPulse,
  Calendar,
  ShieldCheck,
} from 'lucide-react';
import { MedicalRecord } from '../types';
import { BottomSheet } from '../components/BottomSheet';

export const PetView: React.FC = () => {
  const {
    pet,
    scoopLitterBox,
    fullChangeLitterBox,
    updatePetStock,
    addPetFoodToShopping,
    addPetMedicalRecord,
  } = useApp();

  const [showAddMedSheet, setShowAddMedSheet] = useState(false);
  const [medName, setMedName] = useState('');
  const [medType, setMedType] = useState<MedicalRecord['type']>('vaccine');
  const [nextDueDays, setNextDueDays] = useState('30');

  const now = Date.now();
  const dayMs = 86_400_000;

  // Litter box math
  const hoursSinceScoop = Math.floor((now - pet.litterBox.lastScoopedAt) / (3600 * 1000));
  const isScoopUrgent = hoursSinceScoop >= 24;

  const daysSinceFullChange = Math.floor((now - pet.litterBox.lastFullChangeAt) / dayMs);
  const daysUntilFullChange = pet.litterBox.fullChangeIntervalDays - daysSinceFullChange;
  const isChangeUrgent = daysUntilFullChange <= 0;

  // Food math
  const estimatedDaysRemaining = Math.max(
    0,
    Math.floor(pet.feeding.currentStockGrams / (pet.feeding.dailyConsumptionGrams || 1))
  );
  const isFoodLow =
    estimatedDaysRemaining <= 3 ||
    pet.feeding.currentStockGrams <= pet.feeding.minStockAlertThreshold;

  const isSachetsLow = pet.feeding.sachetStockCount <= 3;

  const handleCreateMedRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!medName.trim()) return;

    addPetMedicalRecord({
      name: medName.trim(),
      type: medType,
      administeredAt: Date.now(),
      nextDueDate: Date.now() + (parseInt(nextDueDays) || 30) * dayMs,
    });

    setMedName('');
    setShowAddMedSheet(false);
  };

  return (
    <div className="space-y-4 pb-20 animate-in fade-in duration-200 w-full">
      {/* Profile Card */}
      <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 shadow-u-xs">
        <div className="flex items-center gap-5">
          <img
            src={pet.photoUrl}
            alt={pet.name}
            className="w-20 h-20 rounded-2xl object-cover ring-2 ring-gray-100 dark:ring-gray-800 shadow-u-xs"
          />
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">{pet.name}</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800/40">
                Felina
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-1">{pet.breed}</p>
            <div className="flex items-center gap-3 mt-2 text-xs text-gray-600 dark:text-gray-300">
              <span className="flex items-center gap-1.5 font-semibold text-success-600 dark:text-success-400">
                <HeartPulse className="w-4 h-4" />
                Saudável & Vacinada
              </span>
              <span>•</span>
              <span className="text-gray-500 dark:text-gray-400">1 ano e 6 meses</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Caixa de Areia (Litter Box) Module */}
        <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 shadow-u-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-brand-50 dark:bg-brand-950/60 border border-brand-100 dark:border-brand-900/30 text-brand-600 dark:text-brand-400 flex items-center justify-center">
                <Sparkles className="w-4 h-4 stroke-[2.2]" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                  Caixa de Areia Higiênica
                </h3>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">Rotinas de descarte e troca</p>
              </div>
            </div>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                isScoopUrgent || isChangeUrgent
                  ? 'bg-error-50 dark:bg-error-950/60 text-error-700 dark:text-error-300 border-error-200 dark:border-error-800/40'
                  : 'bg-success-50 dark:bg-success-950/60 text-success-700 dark:text-success-300 border-success-200 dark:border-success-800/40'
              }`}
            >
              {isScoopUrgent || isChangeUrgent ? 'Atenção Necessária' : 'Em Dia'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Daily Scoop */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#2C2C2E]/60 border border-slate-100 dark:border-white/5 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Recolhimento Diário
                </span>
                <span
                  className={`text-lg font-black block ${
                    isScoopUrgent ? 'text-[#FF3B30]' : 'text-[#34C759]'
                  }`}
                >
                  {hoursSinceScoop}h atrás
                </span>
                <p className="text-[10px] text-slate-400 mt-0.5 mb-3">
                  {isScoopUrgent ? 'Passou de 24h' : 'Recolhido hoje'}
                </p>
              </div>

              <button
                onClick={scoopLitterBox}
                className="w-full py-2 rounded-xl bg-[#007AFF] hover:bg-[#0051A8] text-white font-bold text-xs shadow-sm transition-all active:scale-95 flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Recolhi (+10 XP)</span>
              </button>
            </div>

            {/* Full Change */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#2C2C2E]/60 border border-slate-100 dark:border-white/5 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Troca Total de Areia
                </span>
                <span
                  className={`text-lg font-black block ${
                    isChangeUrgent ? 'text-[#FF3B30]' : 'text-[#FF9500]'
                  }`}
                >
                  {daysSinceFullChange} dias
                </span>
                <p className="text-[10px] text-slate-400 mt-0.5 mb-3">
                  {daysUntilFullChange <= 0 ? 'Vencida!' : `Restam ~${daysUntilFullChange}d`}
                </p>
              </div>

              <button
                onClick={fullChangeLitterBox}
                className="w-full py-2 rounded-xl bg-[#FF9500] hover:bg-[#C93400] text-white font-bold text-xs shadow-sm transition-all active:scale-95 flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Troquei (+30 XP)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Food Stock Cards */}
        <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 shadow-u-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-success-50 dark:bg-success-950/60 border border-success-200/50 dark:border-success-800/40 text-success-600 dark:text-success-400 flex items-center justify-center">
                <Package className="w-4 h-4 stroke-[2.2]" />
              </div>
              <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider font-display">
                Alimentação & Estoque
              </h3>
            </div>
          </div>

          {/* Dry Food */}
          <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200/60 dark:border-gray-800 space-y-2.5">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider bg-brand-50 dark:bg-brand-950/60 px-2 py-0.5 rounded border border-brand-200/50 dark:border-brand-800/30">
                  Ração Seca
                </span>
                <h4 className="text-xs font-bold text-gray-900 dark:text-white mt-1.5">{pet.feeding.foodBrand}</h4>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                  Consumo: {pet.feeding.dailyConsumptionGrams}g/dia • Restante:{' '}
                  <strong className={isFoodLow ? 'text-error-600' : 'text-success-600 dark:text-success-400'}>
                    {estimatedDaysRemaining} dias
                  </strong>
                </p>
              </div>
              <div className="text-right">
                <span className="text-base font-black font-display text-gray-900 dark:text-white">
                  {pet.feeding.currentStockGrams}g
                </span>
                <span className="text-[10px] text-gray-400 block">em estoque</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 gap-2">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => updatePetStock(-pet.feeding.dailyConsumptionGrams, 0)}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600 shadow-xs hover:bg-gray-50"
                >
                  -1 dia
                </button>
                <button
                  onClick={() => updatePetStock(1000, 0)}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600 shadow-xs hover:bg-gray-50"
                >
                  +1kg
                </button>
              </div>

              {isFoodLow && (
                <button
                  onClick={() => addPetFoodToShopping('dry')}
                  className="px-3 py-1.5 rounded-xl bg-error-600 hover:bg-error-700 text-white text-xs font-bold flex items-center gap-1 shadow-u-xs active:scale-95 transition-all"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Pedir Ração</span>
                </button>
              )}
            </div>
          </div>

          {/* Sachets */}
          <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200/60 dark:border-gray-800 flex items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold text-warning-700 dark:text-warning-300 uppercase tracking-wider bg-warning-50 dark:bg-warning-950/60 px-2 py-0.5 rounded border border-warning-200/50 dark:border-warning-800/30">
                Sachês Úmidos
              </span>
              <div className="flex items-baseline gap-1.5 mt-1.5">
                <span
                  className={`text-base font-black font-display ${
                    isSachetsLow ? 'text-warning-600 dark:text-warning-400' : 'text-gray-900 dark:text-white'
                  }`}
                >
                  {pet.feeding.sachetStockCount} unidades
                </span>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">1 sachê a cada 2 dias</p>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-white dark:bg-gray-750 p-1 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xs">
                <button
                  onClick={() => updatePetStock(0, -1)}
                  disabled={pet.feeding.sachetStockCount <= 0}
                  className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold flex items-center justify-center text-xs disabled:opacity-40"
                >
                  -
                </button>
                <button
                  onClick={() => updatePetStock(0, 1)}
                  className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold flex items-center justify-center text-xs"
                >
                  +
                </button>
              </div>

              {isSachetsLow && (
                <button
                  onClick={() => addPetFoodToShopping('sachet')}
                  className="px-3 py-1.5 rounded-xl bg-warning-600 hover:bg-warning-700 text-white text-xs font-bold flex items-center gap-1 shadow-u-xs"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Pedir</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Medical Timeline */}
      <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 shadow-u-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-50 dark:bg-brand-950/60 border border-brand-200/50 dark:border-brand-800/40 text-brand-600 dark:text-brand-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 stroke-[2.2]" />
            </div>
            <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider font-display">
              Controle Veterinário
            </h3>
          </div>
          <button
            onClick={() => setShowAddMedSheet(true)}
            className="text-xs text-brand-600 dark:text-brand-400 hover:text-brand-700 font-bold flex items-center gap-1 px-3 py-1.5 rounded-lg bg-brand-50 dark:bg-brand-950/60 border border-brand-200/60 dark:border-brand-800/40 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Adicionar</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {pet.medicalRecords.map((med) => {
            const daysToDue = Math.ceil((med.nextDueDate - now) / dayMs);
            const isDueSoon = daysToDue <= 15;

            return (
              <div
                key={med.id}
                className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200/60 dark:border-gray-800 flex items-center justify-between gap-3 shadow-u-xs"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-700 px-2 py-0.5 rounded border border-gray-200 dark:border-gray-600">
                      {med.type === 'vaccine' ? 'Vacina' : med.type === 'deworming' ? 'Vermífugo' : 'Medicamento'}
                    </span>
                    {isDueSoon && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-warning-50 dark:bg-warning-950/60 text-warning-700 dark:text-warning-300 border border-warning-200/60 dark:border-warning-800/40">
                        Próxima dose
                      </span>
                    )}
                  </div>
                  <h4 className="text-xs font-bold text-gray-900 dark:text-white truncate">{med.name}</h4>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                    Aplicado: {new Date(med.administeredAt).toLocaleDateString('pt-BR')}
                  </p>
                </div>

                <div className="text-right flex-shrink-0">
                  <span
                    className={`text-xs font-bold font-display ${
                      daysToDue < 0
                        ? 'text-error-600'
                        : isDueSoon
                        ? 'text-warning-600 dark:text-warning-400'
                        : 'text-success-600 dark:text-success-400'
                    }`}
                  >
                    {daysToDue < 0 ? 'Vencido' : daysToDue === 0 ? 'Hoje' : `em ${daysToDue} dias`}
                  </span>
                  <span className="text-[11px] text-gray-400 block mt-0.5">
                    {new Date(med.nextDueDate).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Record Bottom Sheet */}
      <BottomSheet
        isOpen={showAddMedSheet}
        onClose={() => setShowAddMedSheet(false)}
        title="Registrar Vacina ou Vermífugo"
        subtitle="Mantenha o histórico veterinário da Bayonetta atualizado"
      >
        <form onSubmit={handleCreateMedRecord} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
              Tipo de Cuidado
            </label>
            <select
              value={medType}
              onChange={(e) => setMedType(e.target.value as any)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            >
              <option value="vaccine">Vacina</option>
              <option value="deworming">Vermífugo</option>
              <option value="flea_treatment">Antipulgas</option>
              <option value="medication">Outro Medicamento</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
              Nome do Medicamento
            </label>
            <input
              type="text"
              placeholder="Ex: Vacina V5 ou Drontal"
              value={medName}
              onChange={(e) => setMedName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
              Próxima dose em quantos dias?
            </label>
            <input
              type="number"
              min="1"
              max="365"
              value={nextDueDays}
              onChange={(e) => setNextDueDays(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/30 font-display font-semibold"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-100 dark:border-gray-800">
            <button
              type="button"
              onClick={() => setShowAddMedSheet(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-u-xs transition-all active:scale-95"
            >
              Salvar Registro
            </button>
          </div>
        </form>
      </BottomSheet>
    </div>
  );
};
