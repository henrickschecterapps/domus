import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../context/AppContext';
import { Pet, PetTreatment } from '../types';
import {
  HeartPulse,
  Plus,
  Check,
  Clock,
  Trash2,
  AlertCircle,
  ShieldCheck,
  Sparkles,
  X,
  Pill,
} from 'lucide-react';
import { Button } from './untitled/Button';
import { triggerHaptic } from '../utils/haptics';

interface PetTreatmentsSectionProps {
  pet: Pet;
}

export const PetTreatmentsSection: React.FC<PetTreatmentsSectionProps> = ({ pet }) => {
  const { addPetTreatment, administerPetDose, deletePetTreatment, currentUser } = useApp();

  const [showAddModal, setShowAddModal] = useState(false);
  const [medName, setMedName] = useState('');
  const [dosage, setDosage] = useState('1 comprimido');
  const [frequencyHours, setFrequencyHours] = useState('12');
  const [durationDays, setDurationDays] = useState('7');
  const [firstDoseTime, setFirstDoseTime] = useState('08:00');
  const [notes, setNotes] = useState('');

  const treatments = pet.treatments || [];

  const today = new Date();
  const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const handleCreateTreatment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!medName.trim()) return;

    const freq = parseInt(frequencyHours, 10) || 12;
    const dur = parseInt(durationDays, 10) || 7;

    // Calculate daily times based on frequency
    const dailyTimes: string[] = [];
    const [startH, startM] = firstDoseTime.split(':').map(Number);
    const timesPerDay = Math.floor(24 / freq);

    for (let i = 0; i < timesPerDay; i++) {
      const h = (startH + i * freq) % 24;
      dailyTimes.push(`${String(h).padStart(2, '0')}:${String(startM || 0).padStart(2, '0')}`);
    }

    addPetTreatment(pet.id, {
      petId: pet.id,
      medName: medName.trim(),
      dosage: dosage.trim(),
      frequencyHours: freq,
      startDate: Date.now(),
      durationDays: dur,
      dailyTimes,
      isActive: true,
      notes: notes.trim() || undefined,
    });

    setMedName('');
    setShowAddModal(false);
  };

  return (
    <div className="rounded-3xl bg-white/95 dark:bg-gray-900/95 border border-gray-200/80 dark:border-gray-800/80 p-5 sm:p-6 shadow-u-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200/60 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 flex items-center justify-center shadow-u-xs">
            <HeartPulse className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-extrabold text-gray-900 dark:text-white uppercase tracking-wider font-display">
                Tratamentos Ativos & Remédios
              </h3>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200/50">
                ANTI-DOSE DUPLA
              </span>
            </div>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              Controle de doses diárias com carimbo de quem aplicou
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-u-xs transition-all active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Novo Remédio</span>
        </button>
      </div>

      {/* Treatments list */}
      {treatments.length === 0 ? (
        <div className="p-6 text-center rounded-2xl bg-gray-50/60 dark:bg-gray-800/30 border border-dashed border-gray-200 dark:border-gray-800">
          <HeartPulse className="w-8 h-8 text-rose-400/60 mx-auto mb-2" />
          <p className="text-xs font-bold text-gray-700 dark:text-gray-300">
            Nenhum tratamento ativo no momento!
          </p>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
            Se o pet precisar tomar antibiótico, colírio ou anti-inflamatório, cadastre aqui para a casa controlar as doses.
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {treatments.map((t) => {
            const todayDoses = t.history?.[dateStr] || [];

            return (
              <div
                key={t.id}
                className="p-4 rounded-2xl bg-gray-50/90 dark:bg-gray-800/40 border border-gray-200/80 dark:border-gray-700/80 space-y-3 shadow-u-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-extrabold text-gray-900 dark:text-white font-display">
                        {t.medName}
                      </h4>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 border border-brand-200/50">
                        {t.dosage} • a cada {t.frequencyHours}h
                      </span>
                    </div>
                    {t.notes && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {t.notes}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => deletePetTreatment(pet.id, t.id)}
                    className="p-1.5 text-gray-400 hover:text-error-600 transition-colors"
                    title="Excluir tratamento"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Doses Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-gray-200/60 dark:border-gray-700/60">
                  {t.dailyTimes.map((doseTime) => {
                    const doneDose = todayDoses.find((d) => d.time === doseTime && d.administeredAt);

                    if (doneDose) {
                      const timeStr = new Date(doneDose.administeredAt!).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      });

                      return (
                        <div
                          key={doseTime}
                          className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800/60 text-center"
                        >
                          <div className="flex items-center justify-center gap-1 text-emerald-700 dark:text-emerald-300 font-mono font-bold text-xs">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            <span>{doseTime}</span>
                          </div>
                          <span className="text-[10px] font-medium text-emerald-800 dark:text-emerald-400 block mt-0.5 truncate">
                            {doneDose.administeredByName} ({timeStr})
                          </span>
                        </div>
                      );
                    }

                    return (
                      <button
                        key={doseTime}
                        onClick={() => administerPetDose(pet.id, t.id, doseTime)}
                        className="p-2.5 rounded-xl bg-white dark:bg-gray-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-gray-300 dark:border-gray-600 hover:border-rose-400 text-center transition-all active:scale-95 group"
                      >
                        <span className="font-mono font-bold text-xs text-gray-800 dark:text-gray-200 group-hover:text-rose-600 block">
                          ⏰ {doseTime}
                        </span>
                        <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 block mt-0.5">
                          Dar Dose
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Treatment Modal */}
      {showAddModal && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-150 overflow-hidden">
          <div className="w-full max-w-md max-h-[88dvh] sm:max-h-[85vh] overflow-y-auto bg-white dark:bg-gray-900 rounded-3xl shadow-u-xl border border-gray-200 dark:border-gray-800 p-5 sm:p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-base font-bold font-display text-gray-900 dark:text-white">
                Cadastrar Tratamento para {pet.name}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTreatment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Nome do Medicamento *
                </label>
                <input
                  type="text"
                  value={medName}
                  onChange={(e) => setMedName(e.target.value)}
                  placeholder="Ex: Amoxicilina 250mg, Colírio Tobramicina..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs text-gray-900 dark:text-white outline-none focus:border-rose-500 font-medium"
                  required
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Dosagem
                  </label>
                  <input
                    type="text"
                    value={dosage}
                    onChange={(e) => setDosage(e.target.value)}
                    placeholder="Ex: 1 comprimido, 5 gotas"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs text-gray-900 dark:text-white outline-none focus:border-rose-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Frequência
                  </label>
                  <select
                    value={frequencyHours}
                    onChange={(e) => setFrequencyHours(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs text-gray-900 dark:text-white outline-none font-medium"
                  >
                    <option value="6">A cada 6 horas (4x/dia)</option>
                    <option value="8">A cada 8 horas (3x/dia)</option>
                    <option value="12">A cada 12 horas (2x/dia)</option>
                    <option value="24">A cada 24 horas (1x/dia)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Duração (dias)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={durationDays}
                    onChange={(e) => setDurationDays(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs text-gray-900 dark:text-white outline-none font-mono font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Horário da 1ª Dose
                  </label>
                  <input
                    type="time"
                    value={firstDoseTime}
                    onChange={(e) => setFirstDoseTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs text-gray-900 dark:text-white outline-none font-mono font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Recomendações da Receita (Opcional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Dar logo após a ração ou misturado com sachê"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs text-gray-900 dark:text-white outline-none font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                <Button type="button" variant="tertiary" size="sm" onClick={() => setShowAddModal(false)}>
                  Cancelar
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  Salvar Tratamento
                </Button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
