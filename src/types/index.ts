export type RoomStatusLevel = 'clean' | 'warning' | 'urgent';

export interface HouseMember {
  userId: string;
  displayName: string;
  avatarUrl?: string;
  role: 'admin' | 'member' | 'guest';
  weeklyXP: number;
  totalXP: number;
  streakDays?: number;
  levelTitle?: string;
  level?: number;
  email?: string;
  phone?: string;
  pixKeyType?: 'cpf' | 'email' | 'phone' | 'random';
  pixKey?: string;
  assignedRoomId?: string;
  color?: string;
  soundEnabled?: boolean;
  vibrationEnabled?: boolean;
}

export interface EmergencyContact {
  id: string;
  name: string;
  category: 'portaria' | 'sindico' | 'zelador' | 'encanador' | 'eletricista' | 'chaveiro' | 'vet' | 'outro';
  phone: string;
  notes?: string;
}

export interface HouseReward {
  id: string;
  title: string;
  description: string;
  requiredXP: number;
  claimedByUserId?: string;
  claimedAt?: number;
}

export interface HouseNote {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  color: 'yellow' | 'pink' | 'blue' | 'green' | 'amber';
  isPinned: boolean;
  createdAt: number;
}

export interface House {
  id: string;
  name: string;
  inviteCode: string;
  createdAt: number;
  houseScore: number; // 0 to 100
  members: HouseMember[];
  address?: string;
  weeklyGoalXP?: number;
  rulesNotes?: string;
  wifiSsid?: string;
  wifiPassword?: string;
  emergencyContacts?: EmergencyContact[];
  rewards?: HouseReward[];
  notes?: HouseNote[];
  budget?: HouseBudget;
}

export interface HouseBudget {
  monthlyTarget: number; // e.g. 3500
  categoryTargets?: Partial<Record<ExpenseCategory, number>>;
  alertThresholdPercent?: number; // default 80
}

export interface Room {
  id: string; // e.g. "sala", "cozinha"
  name: string; // Display name
  order: number;
  statusScore: number; // 0 to 100
  statusLevel: RoomStatusLevel;
  lastCleanedAt: number | null;
  icon?: string;
}

export interface Chore {
  id: string;
  roomId: string;
  title: string;
  frequencyDays: number;
  lastCompletedAt: number | null;
  lastCompletedBy: {
    userId: string;
    displayName: string;
  } | null;
  assignedTo: string | null;
  xpReward: number;
  urgencyScore: number; // Calculated dynamic value (0.0 to 2.0+)
  statusLevel: RoomStatusLevel;
  rotationUserIds?: string[];
  currentRotationIndex?: number;
  estimatedMinutes?: number;
  difficulty?: 'facil' | 'medio' | 'pesado';
  completionProofUrl?: string;
}

export interface ChoreLog {
  id: string;
  choreId: string;
  roomId: string;
  completedBy: string;
  completedByName: string;
  completedAt: number;
  xpEarned: number;
  proofUrl?: string;
}

export interface MedicalRecord {
  id: string;
  type: 'vaccine' | 'deworming' | 'flea_treatment' | 'medication';
  name: string;
  administeredAt: number;
  nextDueDate: number;
}

export interface PetCareLog {
  id: string;
  petId: string;
  actionType: 'scoop' | 'litter_change' | 'walk' | 'feed' | 'sachet' | 'med' | 'bath';
  title: string;
  performedByUserId: string;
  performedByName: string;
  performedAt: number;
  xpEarned: number;
}

export interface PetWeightRecord {
  date: number;
  weightKg: number;
}

export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0=Domingo, 1=Segunda, ..., 6=Sábado

export interface PetDutySchedule {
  weeklyAssignment: Record<DayOfWeek, string>; // Day -> userId
  todayOverrideUserId?: string;
  lastOverrideDate?: string; // "YYYY-MM-DD"
}

export type PetDutyPeriod = 'morning' | 'afternoon' | 'night';

export interface PetDailyDuty {
  id: string;
  petId: string;
  period: PetDutyPeriod;
  title: string;
  description?: string;
  dateStr: string; // "YYYY-MM-DD"
  completedAt?: number;
  completedByUserId?: string;
  completedByName?: string;
  xpReward: number;
  targetTime?: string; // ex: "08:00"
}

export interface PetCustomReminder {
  id: string;
  petId: string;
  title: string;
  time: string; // "HH:MM"
  assignedToUserId?: string;
  daysOfWeek?: DayOfWeek[];
  isEnabled: boolean;
  category: 'food' | 'walk' | 'litter' | 'med' | 'hygiene';
}

export interface Pet {
  id: string;
  name: string; // e.g. "Bayonetta", "Apollo"
  species: 'cat' | 'dog' | 'other';
  photoUrl?: string;
  breed?: string;
  birthDate?: string;
  weightKg?: number;
  litterBox?: {
    lastScoopedAt: number;
    lastFullChangeAt: number;
    scoopIntervalHours: number; // default 24h
    fullChangeIntervalDays: number; // default 7-10 days
  };
  walks?: {
    lastWalkAt: number;
    walksToday: number;
    targetWalksPerDay: number; // default 2 or 3
  };
  bath?: {
    lastBathAt: number;
    intervalDays: number; // default 15-30 days
  };
  feeding: {
    foodBrand: string;
    packageWeightGrams: number;
    currentStockGrams: number;
    dailyConsumptionGrams: number;
    sachetStockCount?: number;
    minStockAlertThreshold: number;
  };
  medicalRecords: MedicalRecord[];
  careLogs?: PetCareLog[];
  vetContact?: {
    name: string;
    phone: string;
    clinicName?: string;
    address?: string;
  };
  weightHistory?: PetWeightRecord[];
  dutySchedule?: PetDutySchedule;
  duties?: PetDailyDuty[];
  reminders?: PetCustomReminder[];
}

export type PantryCategory = 'mercearia' | 'limpeza' | 'pet' | 'hortifruti' | 'refrigerados';
export type PantryUnit = 'un' | 'kg' | 'l' | 'pacote';

export interface PantryItem {
  id: string;
  name: string;
  category: PantryCategory;
  currentQuantity: number;
  minQuantity: number;
  unit: PantryUnit;
  autoAddToShopping: boolean;
  expirationDate?: number;
}

export type ShoppingAisleCategory = 'hortifruti' | 'carnes' | 'laticinios' | 'mercearia' | 'limpeza' | 'bebidas' | 'padaria' | 'pet' | 'outros';

export interface ShoppingItem {
  id: string;
  name: string;
  category: PantryCategory | string;
  quantity: number;
  unit: PantryUnit | string;
  isBought: boolean;
  addedBy: string;
  fromPantryId?: string;
  createdAt: number;
  estimatedPrice?: number;
  aisleCategory?: ShoppingAisleCategory;
}

export type ExpenseCategory = 'supermercado' | 'casa' | 'pet' | 'contas';
export type SplitType = 'equal' | 'percentage' | 'exact';

export interface ExpenseInstallment {
  current: number; // e.g. 1
  total: number;   // e.g. 6
  groupId: string; // id comum entre as parcelas
}

export type ExpenseNature = 'fixed' | 'variable';

export type ExpensePaymentStatus = 'paid' | 'overdue' | 'due_today' | 'upcoming' | 'no_due_date';

export interface Expense {
  id: string;
  description: string;
  amount: number; // in BRL float or cents
  paidByUserId: string;
  splitAmongUserIds: string[];
  date: number;
  category: ExpenseCategory;
  receiptUrl?: string;
  isSettled: boolean;
  isRecurring?: boolean;
  recurringDay?: number;
  nature?: ExpenseNature; // 'fixed' ou 'variable'
  dueDate?: number; // timestamp exato de vencimento
  dueDay?: number; // dia fixo recorrente (1-31)
  barcode?: string; // Linha digitável ou código de barras do boleto
  notes?: string;
  splitType?: SplitType;
  customSplits?: Record<string, number>; // userId -> porcentagem (0-100) ou valor exato (BRL)
  installment?: ExpenseInstallment;
}

export type EventCategory = 'rotina' | 'limpeza' | 'pet' | 'contas' | 'social' | 'manutencao';

export interface HouseEvent {
  id: string;
  title: string;
  description?: string;
  date: number; // timestamp
  endDate?: number;
  category: EventCategory;
  createdByUserId: string;
  createdByName: string;
  assignedToUserId?: string;
  source?: 'manual' | 'chore' | 'pet' | 'expense';
  sourceId?: string;
}

export type AppTheme = 'dark' | 'light' | 'system';

