import React, { useState, useRef } from 'react';
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
  Camera,
  Phone,
  MessageCircle,
  Scale,
  MapPin,
  X,
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
    updatePetPhoto,
    addPetWeightRecord,
    updateVetContact,
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
  const [showVetModal, setShowVetModal] = useState(false);

  // File ref for real pet photo upload
  const photoInputRef = useRef<HTMLInputElement>(null);

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

  // Vet form state
  const [vetName, setVetName] = useState(pet.vetContact?.name || '');
  const [vetPhone, setVetPhone] = useState(pet.vetContact?.phone || '');
  const [vetClinic, setVetClinic] = useState(pet.vetContact?.clinicName || '');
  const [vetAddress, setVetAddress] = useState(pet.vetContact?.address || '');

  // Weight form state
  const [newWeightInput, setNewWeightInput] = useState('');

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

  const handlePhotoUploadDirect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) {
      showToast('Imagem muito grande. Máximo 4MB.', 'warning');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      updatePetPhoto(pet.id, reader.result as string);
    };
    reader.readAsDataURL(file);
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

  const handleAddWeight = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(newWeightInput.replace(',', '.'));
    if (isNaN(parsed) || parsed <= 0) {
      showToast('Digite um peso válido.', 'warning');
      return;
    }
    addPetWeightRecord(pet.id, parsed);
    setNewWeightInput('');
  };

  const handleSaveVetContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vetName.trim() || !vetPhone.trim()) {
      showToast('Preencha nome e telefone do veterinário.', 'warning');
      return;
    }
    updateVetContact(pet.id, {
      name: vetName.trim(),
      phone: vetPhone.trim(),
      clinicName: vetClinic.trim() || undefined,
      address: vetAddress.trim() || undefined,
    });
    setShowVetModal(false);
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
            <div className="relative group cursor-pointer" onClick={() => photoInputRef.current?.click()}>
              <img
                src={pet.photoUrl}
                alt={pet.name}
                className="w-20 h-20 rounded-2xl object-cover ring-2 ring-white dark:ring-gray-700 shadow-u-sm"
              />
              <div className="absolute inset-0 bg-black/40 rounded-2xl flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-5 h-5" />
                <span className="text-[9px] font-bold mt-0.5">Trocar</span>
              </div>
              <input
                type="file"
                ref={photoInputRef}
                onChange={handlePhotoUploadDirect}
                accept="image/*"
                className="hidden"
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
                  Peneirar (+15 XP)
                </Button>
              </div>

              {/* Full Change */}
              <div className="p-3.5 rounded-xl bg-sand-50/50 dark:bg-gray-800/60 border border-sand-200/60 dark:border-gray-800 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    Troca Completa (8 dias)
                  </span>
                  <span
                    className={`text-lg font-black font-display block ${
                      isChangeUrgent ? 'text-error-600' : 'text-gray-900 dark:text-white'
                    }`}
                  >
                    {daysUntilFullChange <= 0 ? 'Hoje!' : `em ${daysUntilFullChange}d`}
                  </span>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 mb-3">
                    Última há {daysSinceFullChange} dias
                  </p>
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => fullChangeLitterBox(pet.id)}
                  className="w-full justify-center text-xs"
                >
                  Lavar Caixa (+40 XP)
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* === ADAPTATIVO: CÃO (Passeios & Banhos) === */}
        {isDog && (
          <div className="rounded-2xl bg-white dark:bg-gray-900 border border-sand-200 dark:border-gray-800 p-5 shadow-u-xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-brand-50 dark:bg-brand-950/60 border border-brand-200/50 text-brand-600 dark:text-brand-400 flex items-center justify-center">
                  <Footprints className="w-4 h-4 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider font-display">
                    Passeios & Higiene Canina
                  </h3>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">Metas diárias de caminhada e banho</p>
                </div>
              </div>

              <Badge variant={isWalkPending ? 'warning' : 'success'} size="sm" dot>
                {isWalkPending ? 'Meta Pendente' : 'Meta Atingida'}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Passeio */}
              <div className="p-3.5 rounded-xl bg-sand-50/50 dark:bg-gray-800/60 border border-sand-200/60 dark:border-gray-800 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    Passeios de Hoje
                  </span>
                  <span className="text-lg font-black font-display text-gray-900 dark:text-white block">
                    {walksToday} / {targetWalks}
                  </span>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 mb-3">
                    {hoursSinceWalk === 999 ? 'Sem registro hoje' : `Último há ${hoursSinceWalk}h`}
                  </p>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => walkDog(pet.id)}
                  className="w-full justify-center text-xs"
                >
                  Registrar Passeio (+25 XP)
                </Button>
              </div>

              {/* Banho */}
              <div className="p-3.5 rounded-xl bg-sand-50/50 dark:bg-gray-800/60 border border-sand-200/60 dark:border-gray-800 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    Banho & Tosa
                  </span>
                  <span
                    className={`text-lg font-black font-display block ${
                      isBathDue ? 'text-error-600' : 'text-gray-900 dark:text-white'
                    }`}
                  >
                    {daysSinceBath}d atrás
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
                  Banho Dado (+35 XP)
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* === ALIMENTAÇÃO & ESTOQUE DE RAÇÃO === */}
        <div className="rounded-2xl bg-white dark:bg-gray-900 border border-sand-200 dark:border-gray-800 p-5 shadow-u-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-brand-50 dark:bg-brand-950/60 border border-brand-200/50 text-brand-600 dark:text-brand-400 flex items-center justify-center">
                <Package className="w-4 h-4 stroke-[2.2]" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider font-display">
                  Alimentação & Despensa
                </h3>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">Controle do estoque de ração</p>
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

          {/* Sachês Úmidos */}
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

      {/* 4. Controle Veterinário & Saúde */}
      <div className="rounded-2xl bg-white dark:bg-gray-900 border border-sand-200 dark:border-gray-800 p-6 shadow-u-xs space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-50 dark:bg-brand-950/60 border border-brand-200/50 text-brand-600 dark:text-brand-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider font-display">
                Controle de Vacinas & Antiparasitários
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
              const isOverdue = daysToDue < 0;
              const isDueSoon = daysToDue <= 15 && daysToDue >= 0;

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
                      className={`text-xs font-bold font-display px-2 py-0.5 rounded-full inline-block ${
                        isOverdue
                          ? 'bg-error-50 text-error-700 dark:bg-error-950 dark:text-error-400'
                          : isDueSoon
                          ? 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
                          : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                      }`}
                    >
                      {isOverdue ? `Vencido há ${Math.abs(daysToDue)}d` : daysToDue === 0 ? 'Vence Hoje' : `Vence em ${daysToDue}d`}
                    </span>
                    <span className="text-[9px] text-gray-400 block mt-0.5">próxima dose</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 5. Emergência Veterinária & Histórico de Peso (Grid 2 cols) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Veterinário de Emergência Card */}
        <div className="rounded-2xl bg-white dark:bg-gray-900 border border-sand-200 dark:border-gray-800 p-5 shadow-u-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-error-50 dark:bg-error-950/60 border border-error-200/50 text-error-600 dark:text-error-400 flex items-center justify-center">
                <HeartPulse className="w-4 h-4 stroke-[2.2]" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider font-display">
                  Veterinário & Clínica 24h
                </h3>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">Atendimento de emergência</p>
              </div>
            </div>

            <button
              onClick={() => {
                setVetName(pet.vetContact?.name || '');
                setVetPhone(pet.vetContact?.phone || '');
                setVetClinic(pet.vetContact?.clinicName || '');
                setVetAddress(pet.vetContact?.address || '');
                setShowVetModal(true);
              }}
              className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{pet.vetContact ? 'Editar' : 'Cadastrar'}</span>
            </button>
          </div>

          {pet.vetContact ? (
            <div className="p-4 rounded-xl bg-sand-50/50 dark:bg-gray-800/40 border border-sand-200/60 dark:border-gray-800 space-y-3">
              <div>
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                    {pet.vetContact.name}
                  </h4>
                  {pet.vetContact.clinicName && (
                    <span className="text-[10px] font-semibold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/60 px-2 py-0.5 rounded">
                      {pet.vetContact.clinicName}
                    </span>
                  )}
                </div>
                {pet.vetContact.address && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    <span>{pet.vetContact.address}</span>
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-gray-200/50 dark:border-gray-700/50">
                <a
                  href={`tel:${pet.vetContact.phone.replace(/[^0-9+]/g, '')}`}
                  className="flex-1 py-2 px-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-u-xs transition-all active:scale-95"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Ligar Agora</span>
                </a>
                <a
                  href={`https://wa.me/${pet.vetContact.phone.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2 px-3 rounded-xl bg-success-600 hover:bg-success-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-u-xs transition-all active:scale-95"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-sand-50/40 dark:bg-gray-800/40 text-center text-gray-400 text-xs">
              Nenhum veterinário cadastrado para {pet.name}. Clique em cadastrar para ter acesso rápido em caso de urgência.
            </div>
          )}
        </div>

        {/* Histórico de Peso & Evolução Card */}
        <div className="rounded-2xl bg-white dark:bg-gray-900 border border-sand-200 dark:border-gray-800 p-5 shadow-u-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-brand-50 dark:bg-brand-950/60 border border-brand-200/50 text-brand-600 dark:text-brand-400 flex items-center justify-center">
                <Scale className="w-4 h-4 stroke-[2.2]" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider font-display">
                  Histórico de Peso
                </h3>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">Acompanhamento da massa corporal</p>
              </div>
            </div>
            {pet.weightKg && (
              <span className="text-sm font-black font-display text-gray-900 dark:text-white">
                {pet.weightKg} kg
              </span>
            )}
          </div>

          <form onSubmit={handleAddWeight} className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Novo peso (ex: 4.8)"
              value={newWeightInput}
              onChange={(e) => setNewWeightInput(e.target.value)}
              className="flex-1 px-3.5 py-2 rounded-xl bg-sand-50/60 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs text-gray-900 dark:text-white font-semibold focus:outline-none"
            />
            <Button variant="primary" size="sm" type="submit" className="text-xs">
              Registrar
            </Button>
          </form>

          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
            {(!pet.weightHistory || pet.weightHistory.length === 0) ? (
              <p className="text-xs text-gray-400 py-2 text-center">
                Nenhum histórico de pesagem anterior.
              </p>
            ) : (
              pet.weightHistory.map((w, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded-lg bg-sand-50/30 dark:bg-gray-800/30 text-xs border border-gray-100 dark:border-gray-800"
                >
                  <span className="text-gray-500 dark:text-gray-400 text-[11px]">
                    {new Date(w.date).toLocaleDateString('pt-BR')}
                  </span>
                  <span className="font-bold text-gray-900 dark:text-white">
                    {w.weightKg} kg
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 6. Feed Colaborativo de Atividades Recentes do Pet */}
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

      {/* MODAL: Adicionar / Editar Pet */}
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

      {/* MODAL: Adicionar Registro Veterinário */}
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

      {/* MODAL: Editar Contato do Veterinário */}
      {showVetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-u-xl border border-gray-200 dark:border-gray-800 p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-base font-bold font-display text-gray-900 dark:text-white">
                Veterinário de Emergência ({pet.name})
              </h3>
              <button
                onClick={() => setShowVetModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveVetContact} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Nome do Veterinário(a) *
                </label>
                <input
                  type="text"
                  value={vetName}
                  onChange={(e) => setVetName(e.target.value)}
                  placeholder="Ex: Dra. Camila Rocha"
                  className="w-full px-3.5 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Telefone / WhatsApp 24h *
                </label>
                <input
                  type="tel"
                  value={vetPhone}
                  onChange={(e) => setVetPhone(e.target.value)}
                  placeholder="(11) 98765-4321"
                  className="w-full px-3.5 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-xs font-mono focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Nome da Clínica ou Hospital
                </label>
                <input
                  type="text"
                  value={vetClinic}
                  onChange={(e) => setVetClinic(e.target.value)}
                  placeholder="Ex: Hospital Veterinário Santa Inês"
                  className="w-full px-3.5 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Endereço
                </label>
                <input
                  type="text"
                  value={vetAddress}
                  onChange={(e) => setVetAddress(e.target.value)}
                  placeholder="Ex: Av. Pompeia, 1200 - Perdizes"
                  className="w-full px-3.5 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-xs focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                <Button
                  type="button"
                  variant="tertiary"
                  size="sm"
                  onClick={() => setShowVetModal(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  Salvar Contato
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
