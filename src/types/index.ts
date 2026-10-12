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
}

export interface ChoreLog {
  id: string;
  choreId: string;
  roomId: string;
  completedBy: string;
  completedByName: string;
  completedAt: number;
  xpEarned: number;
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
}

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
}

export type ExpenseCategory = 'supermercado' | 'casa' | 'pet' | 'contas';

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

