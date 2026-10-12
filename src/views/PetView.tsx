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
  Cat,
  Dog,
  Footprints,
  Bath,
  Clock,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Edit3,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { MedicalRecord, Pet } from '../types';
import { Button } from '../components/untitled/Button';
import { Badge } from '../components/untitled/Badge';

// Photo presets for easy and fast pet creation
const PHOTO_PRESETS = [
  { label: 'Gato Siamês / SRD', url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&auto=format&fit=crop&q=80' },
  { label: 'Gato Laranja', url: 'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=400&auto=format&fit=crop&q=80' },
  { label: 'Gato Branco/Preto', url: 'https://images.unsplash.com/photo-1533738363-b7f9aef128ce?w=400&auto=format&fit=crop&q=80' },
  { label: 'Golden Retriever', url: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=400&auto=format&fit=crop&q=80' },
  { label: 'Bulldog Francês', url: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=400&auto=format&fit=crop&q=80' },
  { label: 'Vira-lata Caramelo', url: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=400&auto=format&fit=crop&q=80' },
];

export const PetView: React.FC = () => {
  const {
    pets,
    pet,
    selectedPetId,
    setSelectedPetId,
    addPet,
    updatePet,
    deletePet,
    scoopLitterBox,
    fullChangeLitterBox,
    walkDog,
    bathDog,
    updatePetStock,
    addPetFoodToShopping,
    addPetMedicalRecord,
    showToast,
  } = useApp();

  // Modals
  const [showAddMedSheet, setShowAddMedSheet] = useState(false);
  const [showPetModal, setShowPetModal] = useState(false);
  const [editingPet, setEditingPet] = useState<Pet | null>(null);

  // Medical Record form state
  const [medName, setMedName] = useState('');
  const [medType, setMedType] = useState<MedicalRecord['type']>('vaccine');
  const [nextDueDays, setNextDueDays] = useState('30');
  const [medCost, setMedCost] = useState('');

  // Pet quick creation/edition form state
  const [formName, setFormName] = useState('');
  const [formSpecies, setFormSpecies] = useState<'cat' | 'dog' | 'other'>('cat');
  const [formBreed, setFormBreed] = useState('');
  const [formPhoto, setFormPhoto] = useState(PHOTO_PRESETS[0].url);
  const [formFoodBrand, setFormFoodBrand] = useState('');
  const [formDailyGrams, setFormDailyGrams] = useState('70');
  const [formStockGrams, setFormStockGrams] = useState('3000');

  const now = Date.now();
  const dayMs = 86_400_000;

  // Active pet helpers
  const isCat = pet.species === 'cat';
  const isDog = pet.species === 'dog';

  // Litter box metrics (for cats)
  const hoursSinceScoop = pet.litterBox
    ? Math.floor((now - pet.litterBox.lastScoopedAt) / (3600 * 1000))
    : 0;
  const isScoopUrgent = pet.litterBox ? hoursSinceScoop >= 24 : false;

  const daysSinceFullChange = pet.litterBox
    ? Math.floor((now - pet.litterBox.lastFullChangeAt) / dayMs)
    : 0;
  const daysUntilFullChange = pet.litterBox
    ? pet.litterBox.fullChangeIntervalDays - daysSinceFullChange
    : 0;
  const isChangeUrgent = pet.litterBox ? daysUntilFullChange <= 0 : false;

  // Walk metrics (for dogs)
  const walksToday = pet.walks?.walksToday || 0;
  const targetWalks = pet.walks?.targetWalksPerDay || 2;
  const hoursSinceWalk = pet.walks?.lastWalkAt
    ? Math.floor((now - pet.walks.lastWalkAt) / (3600 * 1000))
    : 999;
  const isWalkPending = walksToday < targetWalks;

  // Bath metrics (for dogs)
  const daysSinceBath = pet.bath?.lastBathAt
    ? Math.floor((now - pet.bath.lastBathAt) / dayMs)
    : 0;
  const bathInterval = pet.bath?.intervalDays || 15;
  const isBathDue = daysSinceBath >= bathInterval;

  // Food stock metrics
  const dailyGrams = pet.feeding?.dailyConsumptionGrams || 1;
  const currentGrams = pet.feeding?.currentStockGrams || 0;
  const estimatedDaysRemaining = Math.max(0, Math.floor(currentGrams / dailyGrams));
  const isFoodLow =
    estimatedDaysRemaining <= 4 ||
    currentGrams <= (pet.feeding?.minStockAlertThreshold || 500);

  const sachetCount = pet.feeding?.sachetStockCount ?? 0;
  const isSachetsLow = isCat && sachetCount <= 3;

  const handleOpenNewPetModal = () => {
    setEditingPet(null);
    setFormName('');
    setFormSpecies('cat');
    setFormBreed('');
    setFormPhoto(PHOTO_PRESETS[0].url);
    setFormFoodBrand('PremieR');
    setFormDailyGrams('65');
    setFormStockGrams('5000');
    setShowPetModal(true);
  };

  const handleOpenEditPetModal = (targetPet: Pet) => {
    setEditingPet(targetPet);
    setFormName(targetPet.name);
    setFormSpecies(targetPet.species);
    setFormBreed(targetPet.breed || '');
    setFormPhoto(targetPet.photoUrl || PHOTO_PRESETS[0].url);
    setFormFoodBrand(targetPet.feeding.foodBrand || '');
    setFormDailyGrams(String(targetPet.feeding.dailyConsumptionGrams || 65));
    setFormStockGrams(String(targetPet.feeding.currentStockGrams || 3000));
    setShowPetModal(true);
  };

  const handleSavePet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      showToast('Digite o nome do pet.', 'warning');
      return;
    }

    const daily = parseInt(formDailyGrams) || 70;
    const stock = parseInt(formStockGrams) || 3000;

    if (editingPet) {
      updatePet(editingPet.id, {
        name: formName.trim(),
        species: formSpecies,
        breed: formBreed.trim() || undefined,
        photoUrl: formPhoto,
        feeding: {
          ...editingPet.feeding,
          foodBrand: formFoodBrand.trim() || 'Ração Padrão',
          dailyConsumptionGrams: daily,
          currentStockGrams: stock,
        },
      });
    } else {
      const newPetData: Omit<Pet, 'id'> = {
        name: formName.trim(),
        species: formSpecies,
        breed: formBreed.trim() || undefined,
        photoUrl: formPhoto,
        feeding: {
          foodBrand: formFoodBrand.trim() || (formSpecies === 'cat' ? 'PremieR Gatos' : 'Golden Cães'),
          packageWeightGrams: stock,
          currentStockGrams: stock,
          dailyConsumptionGrams: daily,
          sachetStockCount: formSpecies === 'cat' ? 6 : undefined,
          minStockAlertThreshold: daily * 5,
        },
        litterBox:
          formSpecies === 'cat'
            ? {
                lastScoopedAt: Date.now() - 6 * 3600 * 1000,
                lastFullChangeAt: Date.now() - 2 * dayMs,
                scoopIntervalHours: 24,
                fullChangeIntervalDays: 8,
              }
            : undefined,
        walks:
          formSpecies === 'dog'
            ? {
                lastWalkAt: Date.now() - 4 * 3600 * 1000,
                walksToday: 1,
                targetWalksPerDay: 2,
              }
            : undefined,
        bath:
          formSpecies === 'dog'
            ? {
                lastBathAt: Date.now() - 5 * dayMs,
                intervalDays: 15,
              }
            : undefined,
        medicalRecords: [],
        careLogs: [],
      };
      addPet(newPetData);
    }

    setShowPetModal(false);
  };

  const handleCreateMedRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!medName.trim()) return;

    const costNumber = parseFloat(medCost.replace(',', '.')) || undefined;

    addPetMedicalRecord(
      {
        name: medName.trim(),
        type: medType,
        administeredAt: Date.now(),
        nextDueDate: Date.now() + (parseInt(nextDueDays) || 30) * dayMs,
      },
      pet.id,
      costNumber
    );

    setMedName('');
    setMedCost('');
    setShowAddMedSheet(false);
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-200 w-full max-w-6xl mx-auto">
      {/* 1. Carrossel de Miniaturas dos Pets no Topo */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-sand-200 dark:border-gray-800 shadow-u-xs">
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 font-display">
              Pets da Família
            </span>
            <Badge variant="brand" size="sm">
              {pets.length} {pets.length === 1 ? 'Pet' : 'Pets'}
            </Badge>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleOpenNewPetModal}
            className="flex items-center gap-1.5 text-xs py-1 px-3"
          >
            <Plus className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
            <span>Adicionar Pet</span>
          </Button>
        </div>

        {/* Horizontal Pet Selector Carousel */}
        <div className="flex items-center gap-3 overflow-x-auto pb-1 pt-0.5 no-scrollbar">
          {pets.map((p) => {
            const isSelected = p.id === pet.id;
            const pIsCat = p.species === 'cat';
            const pIsDog = p.species === 'dog';

            // Quick status summary for thumbnail badge
            let quickStatus = 'Tudo em dia';
            let isUrgent = false;

            if (pIsCat && p.litterBox) {
              const hSince = Math.floor((now - p.litterBox.lastScoopedAt) / (3600 * 1000));
              if (hSince >= 24) {
                quickStatus = 'Areia pendente';
                isUrgent = true;
              }
            } else if (pIsDog && p.walks) {
              if (p.walks.walksToday < (p.walks.targetWalksPerDay || 2)) {
                quickStatus = `${p.walks.walksToday}/${p.walks.targetWalksPerDay} passeios`;
              }
            }

            return (
              <button
                key={p.id}
                onClick={() => setSelectedPetId(p.id)}
                className={`flex items-center gap-3 p-2.5 pr-4 rounded-2xl border transition-all duration-200 text-left flex-shrink-0 ${
                  isSelected
                    ? 'border-brand-500 bg-brand-50/70 dark:bg-brand-950/60 shadow-u-sm ring-1 ring-brand-500/30'
                    : 'border-sand-200 dark:border-gray-800 bg-sand-50/40 dark:bg-gray-800/40 hover:bg-white dark:hover:bg-gray-800'
                }`}
              >
                <div className="relative">
                  <img
                    src={p.photoUrl}
                    alt={p.name}
                    className="w-12 h-12 rounded-xl object-cover ring-2 ring-white dark:ring-gray-700 shadow-xs"
                  />
                  <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center shadow-xs">
                    {pIsCat ? (
                      <Cat className="w-3 h-3 text-brand-600" />
                    ) : pIsDog ? (
                      <Dog className="w-3 h-3 text-brand-600" />
                    ) : (
                      <Sparkles className="w-3 h-3 text-brand-600" />
                    )}
                  </span>
                </div>

                <div className="min-w-[90px]">
                  <p className="text-xs font-bold text-gray-900 dark:text-white leading-tight font-display">
                    {p.name}
                  </p>
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 block truncate">
                    {p.breed || (pIsCat ? 'Gato' : 'Cão')}
                  </span>
                  <span
                    className={`text-[9px] font-semibold block mt-0.5 ${
                      isUrgent ? 'text-error-600' : 'text-success-600 dark:text-success-400'
                    }`}
                  >
                    {quickStatus}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Hero Profile Card do Pet Ativo */}
      <div className="rounded-2xl bg-gradient-to-br from-sand-100/80 via-white to-brand-50/30 dark:from-gray-900 dark:via-gray-900/90 dark:to-gray-800/60 border border-sand-200 dark:border-gray-800 p-6 shadow-u-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div className="flex items-center gap-5">
            <div className="relative">
              <img
                src={pet.photoUrl}
                alt={pet.name}
                className="w-20 h-20 rounded-2xl object-cover ring-2 ring-white dark:ring-gray-700 shadow-u-sm"
              />
              <span className="absolute -bottom-1.5 -right-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-500 text-white shadow-xs">
                {isCat ? 'Felino' : isDog ? 'Canino' : 'Pet'}
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold font-display text-gray-900 dark:text-white tracking-tight">
                  {pet.name}
                </h1>
                {pet.weightKg && (
                  <Badge variant="gray" size="sm">
                    {pet.weightKg} kg
                  </Badge>
                )}
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                {pet.breed || (isCat ? 'Felino Doméstico' : 'Canino')} • {isCat ? 'Módulo Felino' : 'Módulo Canino'}
              </p>
              <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-300 pt-0.5">
                <span className="flex items-center gap-1 font-semibold text-success-600 dark:text-success-400">
                  <HeartPulse className="w-3.5 h-3.5" />
                  Saudável & Acompanhado
                </span>
                <span>•</span>
                <span className="text-gray-500 dark:text-gray-400">
                  Consumo: {pet.feeding?.dailyConsumptionGrams || 70}g/dia
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleOpenEditPetModal(pet)}
              className="flex items-center gap-1.5 text-xs"
            >
              <Edit3 className="w-3.5 h-3.5 text-gray-500" />
              <span>Editar</span>
            </Button>
            {pets.length > 1 && (
              <button
                onClick={() => deletePet(pet.id)}
                className="p-2 text-gray-400 hover:text-error-600 rounded-xl hover:bg-error-50 dark:hover:bg-error-950/40 transition-colors"
                title="Excluir este pet"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. Módulos Adaptativos por Espécie */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* === ADAPTATIVO: GATO (Caixa de Areia) === */}
        {isCat && pet.litterBox && (
          <div className="rounded-2xl bg-white dark:bg-gray-900 border border-sand-200 dark:border-gray-800 p-5 shadow-u-xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-brand-50 dark:bg-brand-950/60 border border-brand-200/50 text-brand-600 dark:text-brand-400 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider font-display">
                    Caixa de Areia Higiênica
                  </h3>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">Rotinas de recolhimento e descarte</p>
                </div>
              </div>

              <Badge
                variant={isScoopUrgent || isChangeUrgent ? 'error' : 'success'}
                size="sm"
                dot
              >
                {isScoopUrgent || isChangeUrgent ? 'Atenção' : 'Em Dia'}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Daily Scoop */}
              <div className="p-3.5 rounded-xl bg-sand-50/50 dark:bg-gray-800/60 border border-sand-200/60 dark:border-gray-800 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    Recolhimento Diário
                  </span>
                  <span
                    className={`text-lg font-black font-display block ${
                      isScoopUrgent ? 'text-error-600' : 'text-success-600 dark:text-success-400'
                    }`}
                  >
                    {hoursSinceScoop}h atrás
                  </span>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 mb-3">
                    {isScoopUrgent ? 'Passou de 24h!' : 'Em dia hoje'}
                  </p>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => scoopLitterBox(pet.id)}
                  className="w-full justify-center text-xs"
                >
                  <Sparkles className="w-3.5 h-3.5 mr-1" />
                  <span>Recolhi (+10 XP)</span>
                </Button>
              </div>

              {/* Full Change */}
              <div className="p-3.5 rounded-xl bg-sand-50/50 dark:bg-gray-800/60 border border-sand-200/60 dark:border-gray-800 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    Troca Total
                  </span>
                  <span
                    className={`text-lg font-black font-display block ${
                      isChangeUrgent ? 'text-error-600' : 'text-warning-600'
                    }`}
                  >
                    {daysSinceFullChange} dias
                  </span>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 mb-3">
                    {daysUntilFullChange <= 0 ? 'Troca vencida!' : `Restam ~${daysUntilFullChange} dias`}
                  </p>
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => fullChangeLitterBox(pet.id)}
                  className="w-full justify-center text-xs text-brand-700 dark:text-brand-300"
                >
                  <Sparkles className="w-3.5 h-3.5 mr-1" />
                  <span>Troquei (+30 XP)</span>
                </Button>
              </div>
            </div>

            <div className="pt-1 flex justify-end">
              <button
                onClick={() => addPetFoodToShopping('litter', pet.id)}
                className="text-xs text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1 font-medium"
              >
                <ShoppingBag className="w-3 h-3" />
                <span>Pedir areia na Lista de Compras</span>
              </button>
            </div>
          </div>
        )}

        {/* === ADAPTATIVO: CÃO (Passeios & Banho) === */}
        {isDog && (
          <div className="rounded-2xl bg-white dark:bg-gray-900 border border-sand-200 dark:border-gray-800 p-5 shadow-u-xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-brand-50 dark:bg-brand-950/60 border border-brand-200/50 text-brand-600 dark:text-brand-400 flex items-center justify-center">
                  <Footprints className="w-4 h-4 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider font-display">
                    Passeios Diários & Higiene
                  </h3>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">Atividades externas e bem-estar</p>
                </div>
              </div>

              <Badge
                variant={isWalkPending ? 'warning' : 'success'}
                size="sm"
                dot
              >
                {isWalkPending ? `${walksToday}/${targetWalks} Passeios` : 'Meta Atingida'}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Daily Walk */}
              <div className="p-3.5 rounded-xl bg-sand-50/50 dark:bg-gray-800/60 border border-sand-200/60 dark:border-gray-800 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    Passeios Hoje
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-black font-display text-gray-900 dark:text-white">
                      {walksToday}
                    </span>
                    <span className="text-xs text-gray-500">de {targetWalks}</span>
                  </div>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 mb-3">
                    {hoursSinceWalk < 24 ? `Último há ${hoursSinceWalk}h` : 'Nenhum hoje'}
                  </p>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => walkDog(pet.id)}
                  className="w-full justify-center text-xs"
                >
                  <Footprints className="w-3.5 h-3.5 mr-1" />
                  <span>Passear (+25 XP)</span>
                </Button>
              </div>

              {/* Bath & Grooming */}
              <div className="p-3.5 rounded-xl bg-sand-50/50 dark:bg-gray-800/60 border border-sand-200/60 dark:border-gray-800 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    Banho & Tosa
                  </span>
                  <span
                    className={`text-lg font-black font-display block ${
                      isBathDue ? 'text-error-600' : 'text-success-600 dark:text-success-400'
                    }`}
                  >
                    {daysSinceBath} dias
                  </span>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 mb-3">
                    Intervalo de {bathInterval} dias
                  </p>
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => bathDog(pet.id)}
                  className="w-full justify-center text-xs"
                >
                  <Bath className="w-3.5 h-3.5 mr-1" />
                  <span>Banho (+35 XP)</span>
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* === ALIMENTAÇÃO & ESTOQUE (Ambos) === */}
        <div className="rounded-2xl bg-white dark:bg-gray-900 border border-sand-200 dark:border-gray-800 p-5 shadow-u-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-success-50 dark:bg-success-950/60 border border-success-200/50 text-success-600 dark:text-success-400 flex items-center justify-center">
                <Package className="w-4 h-4 stroke-[2.2]" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider font-display">
                  Alimentação & Estoque
                </h3>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">Consumo diário e alertas de compra</p>
              </div>
            </div>

            <Badge variant={isFoodLow ? 'error' : 'success'} size="sm" dot>
              {isFoodLow ? 'Estoque Baixo' : 'Abastecido'}
            </Badge>
          </div>

          {/* Ração Seca */}
          <div className="p-3.5 rounded-xl bg-sand-50/50 dark:bg-gray-800/60 border border-sand-200/60 dark:border-gray-800 space-y-2.5">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold text-brand-700 dark:text-brand-300 uppercase tracking-wider bg-brand-50 dark:bg-brand-950 px-2 py-0.5 rounded">
                  Ração Seca
                </span>
                <h4 className="text-xs font-bold text-gray-900 dark:text-white mt-1.5">
                  {pet.feeding?.foodBrand}
                </h4>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                  Consumo: {dailyGrams}g/dia • Restante:{' '}
                  <strong className={isFoodLow ? 'text-error-600' : 'text-success-600 dark:text-success-400'}>
                    {estimatedDaysRemaining} dias
                  </strong>
                </p>
              </div>
              <div className="text-right">
                <span className="text-base font-black font-display text-gray-900 dark:text-white">
                  {(currentGrams / 1000).toFixed(1)} kg
                </span>
                <span className="text-[10px] text-gray-400 block">{currentGrams}g</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 gap-2">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => updatePetStock(-dailyGrams, 0, pet.id)}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600 shadow-xs hover:bg-gray-50"
                  title="Registrar porção diária servida (+10 XP)"
                >
                  -1 porção (+10 XP)
                </button>
                <button
                  onClick={() => updatePetStock(1000, 0, pet.id)}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600 shadow-xs hover:bg-gray-50"
                >
                  +1 kg
                </button>
              </div>

              {isFoodLow && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => addPetFoodToShopping('dry', pet.id)}
                  className="flex items-center gap-1 text-xs"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Pedir Ração</span>
                </Button>
              )}
            </div>
          </div>

          {/* Sachês Úmidos (se configurado ou gato) */}
          {(isCat || pet.feeding?.sachetStockCount !== undefined) && (
            <div className="p-3.5 rounded-xl bg-sand-50/50 dark:bg-gray-800/60 border border-sand-200/60 dark:border-gray-800 flex items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold text-warning-700 dark:text-warning-300 uppercase tracking-wider bg-warning-50 dark:bg-warning-950 px-2 py-0.5 rounded">
                  Sachês Úmidos
                </span>
                <div className="flex items-baseline gap-1.5 mt-1.5">
                  <span
                    className={`text-base font-black font-display ${
                      isSachetsLow ? 'text-warning-600' : 'text-gray-900 dark:text-white'
                    }`}
                  >
                    {sachetCount} unidades
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 bg-white dark:bg-gray-750 p-1 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xs">
                  <button
                    onClick={() => updatePetStock(0, -1, pet.id)}
                    disabled={sachetCount <= 0}
                    className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold flex items-center justify-center text-xs disabled:opacity-40"
                    title="Servir sachê (+5 XP)"
                  >
                    -
                  </button>
                  <button
                    onClick={() => updatePetStock(0, 1, pet.id)}
                    className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold flex items-center justify-center text-xs"
                  >
                    +
                  </button>
                </div>

                {isSachetsLow && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => addPetFoodToShopping('sachet', pet.id)}
                    className="text-xs"
                  >
                    <ShoppingBag className="w-3.5 h-3.5 mr-1" />
                    <span>Pedir</span>
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. Controle Veterinário & Finanças */}
      <div className="rounded-2xl bg-white dark:bg-gray-900 border border-sand-200 dark:border-gray-800 p-6 shadow-u-xs space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-50 dark:bg-brand-950/60 border border-brand-200/50 text-brand-600 dark:text-brand-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider font-display">
                Controle Veterinário & Saúde
              </h3>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Vacinas, vermífugos e despesas médicas de {pet.name}
              </p>
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowAddMedSheet(true)}
            className="flex items-center gap-1.5 text-xs py-1 px-3"
          >
            <Plus className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
            <span>Novo Registro</span>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {pet.medicalRecords?.length === 0 ? (
            <p className="text-xs text-gray-400 col-span-3 py-4 text-center">
              Nenhuma vacina ou vermífugo registrado para {pet.name}.
            </p>
          ) : (
            pet.medicalRecords?.map((med) => {
              const daysToDue = Math.ceil((med.nextDueDate - now) / dayMs);
              const isDueSoon = daysToDue <= 15;

              return (
                <div
                  key={med.id}
                  className="p-3.5 rounded-xl bg-sand-50/40 dark:bg-gray-800/50 border border-sand-200/60 dark:border-gray-800 flex items-center justify-between gap-3 shadow-xs"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-700 px-2 py-0.5 rounded border border-gray-200 dark:border-gray-600">
                        {med.type === 'vaccine'
                          ? 'Vacina'
                          : med.type === 'deworming'
                          ? 'Vermífugo'
                          : med.type === 'flea_treatment'
                          ? 'Antipulgas'
                          : 'Medicamento'}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-gray-900 dark:text-white truncate">
                      {med.name}
                    </h4>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      Aplicado: {new Date(med.administeredAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <span
                      className={`text-xs font-bold font-display ${
                        daysToDue < 0
                          ? 'text-error-600'
                          : isDueSoon
                          ? 'text-warning-600'
                          : 'text-success-600 dark:text-success-400'
                      }`}
                    >
                      {daysToDue < 0 ? 'Vencido' : daysToDue === 0 ? 'Hoje' : `em ${daysToDue}d`}
                    </span>
                    <span className="text-[9px] text-gray-400 block mt-0.5">próxima dose</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 5. Feed Colaborativo de Atividades Recentes do Pet */}
      <div className="rounded-2xl bg-white dark:bg-gray-900 border border-sand-200 dark:border-gray-800 p-6 shadow-u-xs space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider font-display">
              Feed de Cuidados & Histórico Recente
            </h3>
          </div>
          <span className="text-[11px] text-gray-400">Atividades realizadas</span>
        </div>

        <div className="space-y-2.5">
          {(!pet.careLogs || pet.careLogs.length === 0) ? (
            <p className="text-xs text-gray-400 py-3 text-center">
              Nenhuma atividade registrada recentemente para {pet.name}.
            </p>
          ) : (
            pet.careLogs.slice(0, 6).map((log) => {
              const minutesAgo = Math.floor((now - log.performedAt) / 60000);
              const timeDisplay =
                minutesAgo < 60
                  ? `${minutesAgo}m atrás`
                  : minutesAgo < 1440
                  ? `${Math.floor(minutesAgo / 60)}h atrás`
                  : `${Math.floor(minutesAgo / 1440)}d atrás`;

              return (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-sand-50/30 dark:bg-gray-800/40"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold text-xs">
                      {log.actionType === 'walk' ? (
                        <Footprints className="w-4 h-4" />
                      ) : log.actionType === 'scoop' || log.actionType === 'litter_change' ? (
                        <Sparkles className="w-4 h-4" />
                      ) : log.actionType === 'bath' ? (
                        <Bath className="w-4 h-4" />
                      ) : (
                        <Package className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-900 dark:text-white">
                        {log.title}
                      </p>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">
                        Por <strong className="text-gray-700 dark:text-gray-300 font-semibold">{log.performedByName}</strong> • {timeDisplay}
                      </p>
                    </div>
                  </div>

                  <span className="text-xs font-mono font-bold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/60 px-2 py-0.5 rounded">
                    +{log.xpEarned} XP
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* MODAL: Adicionar / Editar Pet (Ficha Simples e Rápida) */}
      {showPetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-u-xl border border-gray-200 dark:border-gray-800 p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold font-display text-gray-900 dark:text-white">
              {editingPet ? `Editar ${editingPet.name}` : 'Cadastrar Novo Pet'}
            </h3>

            <form onSubmit={handleSavePet} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Nome do Pet *
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ex: Bayonetta, Apollo, Luna"
                  className="w-full px-3.5 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Espécie
                  </label>
                  <select
                    value={formSpecies}
                    onChange={(e) => setFormSpecies(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-xs font-semibold focus:outline-none"
                  >
                    <option value="cat">Gato (Módulo Felino)</option>
                    <option value="dog">Cão (Módulo Canino)</option>
                    <option value="other">Outro Pet</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Raça (opcional)
                  </label>
                  <input
                    type="text"
                    value={formBreed}
                    onChange={(e) => setFormBreed(e.target.value)}
                    placeholder="Ex: Golden, SRD, Siamês"
                    className="w-full px-3.5 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-xs focus:outline-none"
                  />
                </div>
              </div>

              {/* Photo presets selector */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Foto do Pet
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-2">
                  {PHOTO_PRESETS.map((preset) => (
                    <button
                      type="button"
                      key={preset.url}
                      onClick={() => setFormPhoto(preset.url)}
                      className={`relative rounded-xl overflow-hidden aspect-square border-2 transition-all ${
                        formPhoto === preset.url
                          ? 'border-brand-500 ring-2 ring-brand-500/30 scale-105'
                          : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={preset.url} alt={preset.label} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
                <input
                  type="url"
                  value={formPhoto}
                  onChange={(e) => setFormPhoto(e.target.value)}
                  placeholder="Ou cole a URL de uma imagem personalizada"
                  className="w-full px-3.5 py-1.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-xs focus:outline-none"
                />
              </div>

              {/* Quick food info */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Marca da Ração
                  </label>
                  <input
                    type="text"
                    value={formFoodBrand}
                    onChange={(e) => setFormFoodBrand(e.target.value)}
                    placeholder="Ex: PremieR, Golden, Royal Canin"
                    className="w-full px-3.5 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Consumo Diário (gramas)
                  </label>
                  <input
                    type="number"
                    value={formDailyGrams}
                    onChange={(e) => setFormDailyGrams(e.target.value)}
                    placeholder="Ex: 65"
                    className="w-full px-3.5 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100 dark:border-gray-800">
                <Button
                  type="button"
                  variant="tertiary"
                  size="sm"
                  onClick={() => setShowPetModal(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  {editingPet ? 'Salvar Alterações' : 'Cadastrar Pet'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Adicionar Registro Veterinário & Lançamento em Finanças */}
      {showAddMedSheet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-u-xl border border-gray-200 dark:border-gray-800 p-6 space-y-4">
            <h3 className="text-base font-bold font-display text-gray-900 dark:text-white">
              Novo Registro Veterinário ({pet.name})
            </h3>

            <form onSubmit={handleCreateMedRecord} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Nome da Vacina / Medicamento *
                </label>
                <input
                  type="text"
                  value={medName}
                  onChange={(e) => setMedName(e.target.value)}
                  placeholder="Ex: Vacina V10, Drontal, Simparic"
                  className="w-full px-3.5 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Tipo
                  </label>
                  <select
                    value={medType}
                    onChange={(e) => setMedType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-xs font-semibold focus:outline-none"
                  >
                    <option value="vaccine">Vacina</option>
                    <option value="deworming">Vermífugo</option>
                    <option value="flea_treatment">Antipulgas</option>
                    <option value="medication">Medicamento</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Próxima Dose (dias)
                  </label>
                  <input
                    type="number"
                    value={nextDueDays}
                    onChange={(e) => setNextDueDays(e.target.value)}
                    placeholder="Ex: 30, 180, 365"
                    className="w-full px-3.5 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-xs focus:outline-none"
                  />
                </div>
              </div>

              {/* Integração direta com Finanças */}
              <div className="p-3.5 rounded-xl bg-brand-50/60 dark:bg-brand-950/40 border border-brand-200/60 dark:border-brand-800/40 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-brand-800 dark:text-brand-300">
                  <DollarSign className="w-4 h-4 text-brand-600" />
                  <span>Dividir Custo com a Casa (Finanças)</span>
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  Informe o valor pago para lançar automaticamente a divisão nas finanças dos moradores:
                </p>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-semibold text-gray-400">R$</span>
                  <input
                    type="text"
                    value={medCost}
                    onChange={(e) => setMedCost(e.target.value)}
                    placeholder="0,00 (opcional)"
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-xs font-semibold focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                <Button
                  type="button"
                  variant="tertiary"
                  size="sm"
                  onClick={() => setShowAddMedSheet(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  Salvar Registro (+20 XP)
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
