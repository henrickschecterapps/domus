import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  House,
  HouseEvent,
  HouseMember,
  Room,
  Chore,
  ChoreLog,
  Pet,
  PantryItem,
  ShoppingItem,
  Expense,
  MedicalRecord,
} from '../types';
import {
  DEFAULT_HOUSE,
  DEFAULT_MEMBERS,
  createInitialRooms,
  createInitialChores,
  createInitialPet,
  createInitialPantry,
  createInitialShoppingList,
  createInitialExpenses,
  createInitialEvents,
} from '../data/seedData';
import {
  calculateChoreUrgency,
  calculateRoomScore,
  calculateHouseScore,
  checkChoreCooldown,
  calculateXpReward,
} from '../utils/cleaningMath';
import { fireCelebrationConfetti } from '../utils/confetti';

interface ToastNotification {
  id: string;
  type: 'success' | 'warning' | 'info' | 'error';
  message: string;
}

interface AppContextType {
  house: House;
  currentUser: HouseMember;
  members: HouseMember[];
  rooms: Room[];
  chores: Chore[];
  choreLogs: ChoreLog[];
  pet: Pet;
  pantryItems: PantryItem[];
  shoppingItems: ShoppingItem[];
  expenses: Expense[];
  toasts: ToastNotification[];
  removeToast: (id: string) => void;
  showToast: (message: string, type?: 'success' | 'warning' | 'info' | 'error') => void;
  switchUser: (userId: string) => void;
  // Chore actions
  completeChore: (choreId: string) => { success: boolean; earnedXp?: number; reason?: string };
  addChore: (roomId: string, title: string, frequencyDays: number, xpReward: number) => void;
  resetChoreTimer: (choreId: string, hoursAgo?: number) => void;
  // Pet actions
  scoopLitterBox: () => void;
  fullChangeLitterBox: () => void;
  updatePetStock: (dryFoodDeltaGrams: number, sachetDelta: number) => void;
  addPetFoodToShopping: (itemType: 'dry' | 'sachet') => void;
  addPetMedicalRecord: (record: Omit<MedicalRecord, 'id'>) => void;
  // Pantry actions
  addPantryItem: (item: Omit<PantryItem, 'id'>) => void;
  updatePantryQuantity: (id: string, newQuantity: number) => void;
  deletePantryItem: (id: string) => void;
  // Shopping actions
  addShoppingItem: (item: Omit<ShoppingItem, 'id' | 'createdAt'>) => void;
  toggleShoppingItemBought: (id: string) => void;
  moveShoppingItemToPantry: (id: string) => void;
  deleteShoppingItem: (id: string) => void;
  clearBoughtItems: () => void;
  // Expense actions
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  toggleExpenseSettled: (id: string) => void;
  deleteExpense: (id: string) => void;
  // Calendar Event actions
  events: HouseEvent[];
  addHouseEvent: (event: Omit<HouseEvent, 'id'>) => void;
  deleteHouseEvent: (id: string) => void;
  // House & Admin actions
  updateHouseDetails: (details: Partial<Pick<House, 'name' | 'address' | 'weeklyGoalXP' | 'rulesNotes'>>) => void;
  regenerateInviteCode: () => string;
  addMember: (name: string, role: 'admin' | 'member' | 'guest', avatarUrl?: string, email?: string) => void;
  updateMemberRole: (userId: string, role: 'admin' | 'member' | 'guest') => void;
  removeMember: (userId: string) => boolean;
  addRoom: (name: string, icon?: string) => void;
  updateRoom: (roomId: string, name: string, icon?: string) => void;
  deleteRoom: (roomId: string) => void;
  createNewHouse: (houseName: string, adminName: string) => void;
  joinHouseWithCode: (inviteCode: string, memberName: string) => boolean;
  exportHouseData: () => string;
  importHouseData: (jsonContent: string) => { success: boolean; message?: string };
  resetWeeklyLeaderboard: () => void;
  resetAllToSeed: () => void;
  theme: 'dark' | 'light' | 'system';
  setTheme: (theme: 'dark' | 'light' | 'system') => void;
}

const STORAGE_KEY_PREFIX = 'domus_pwa_';

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(STORAGE_KEY_PREFIX + key, JSON.stringify(data));
  } catch (e) {
    console.error('Storage save failed:', e);
  }
}

const THEME_STORAGE_KEY = 'domus_active_theme';

function loadThemeFromStorage(): 'dark' | 'light' | 'system' {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'dark' || saved === '"dark"') return 'dark';
    if (saved === 'system' || saved === '"system"') return 'system';
    if (saved === 'light' || saved === '"light"') return 'light';
    // Clean legacy keys if any
    localStorage.removeItem('domus_pwa_theme');
    localStorage.removeItem('domus_app_theme_v2');
    localStorage.setItem(THEME_STORAGE_KEY, 'light');
    return 'light';
  } catch {}
  return 'light';
}

function applyThemeToDOM(targetTheme: 'dark' | 'light' | 'system') {
  const isDark =
    targetTheme === 'dark' ||
    (targetTheme === 'system' && typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);

  if (typeof document !== 'undefined') {
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
      if (document.body) document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
      if (document.body) document.body.classList.remove('dark');
    }
  }
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [house, setHouse] = useState<House>(() => loadFromStorage('house', DEFAULT_HOUSE));
  const [members, setMembers] = useState<HouseMember[]>(() => loadFromStorage('members', DEFAULT_MEMBERS));
  const [currentUserId, setCurrentUserId] = useState<string>(() => loadFromStorage('currentUserId', 'user_1'));
  const [rooms, setRooms] = useState<Room[]>(() => loadFromStorage('rooms', createInitialRooms()));
  const [chores, setChores] = useState<Chore[]>(() => loadFromStorage('chores', createInitialChores()));
  const [choreLogs, setChoreLogs] = useState<ChoreLog[]>(() => loadFromStorage('choreLogs', []));
  const [pet, setPet] = useState<Pet>(() => loadFromStorage('pet', createInitialPet()));
  const [pantryItems, setPantryItems] = useState<PantryItem[]>(() => loadFromStorage('pantry', createInitialPantry()));
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>(() => loadFromStorage('shopping', createInitialShoppingList()));
  const [expenses, setExpenses] = useState<Expense[]>(() => loadFromStorage('expenses', createInitialExpenses()));
  const [events, setEvents] = useState<HouseEvent[]>(() => loadFromStorage('events', createInitialEvents()));
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const [theme, setThemeState] = useState<'dark' | 'light' | 'system'>(() => {
    const initial = loadThemeFromStorage();
    applyThemeToDOM(initial);
    return initial;
  });

  // Sync theme with DOM and listen for system preference changes
  useEffect(() => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {}
    applyThemeToDOM(theme);

    if (theme === 'system' && typeof window !== 'undefined' && window.matchMedia) {
      const media = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = () => applyThemeToDOM('system');
      media.addEventListener('change', listener);
      return () => media.removeEventListener('change', listener);
    }
  }, [theme]);

  const setTheme = (newTheme: 'dark' | 'light' | 'system') => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
      localStorage.removeItem('domus_pwa_theme');
      localStorage.removeItem('domus_app_theme_v2');
    } catch {}
    applyThemeToDOM(newTheme);
    setThemeState(newTheme);
  };

  const currentUser = members.find((m) => m.userId === currentUserId) || members[0];

  const showToast = useCallback((message: string, type: 'success' | 'warning' | 'info' | 'error' = 'info') => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Save changes to local persistent storage
  useEffect(() => { saveToStorage('house', house); }, [house]);
  useEffect(() => { saveToStorage('members', members); }, [members]);
  useEffect(() => { saveToStorage('currentUserId', currentUserId); }, [currentUserId]);
  useEffect(() => { saveToStorage('rooms', rooms); }, [rooms]);
  useEffect(() => { saveToStorage('chores', chores); }, [chores]);
  useEffect(() => { saveToStorage('choreLogs', choreLogs); }, [choreLogs]);
  useEffect(() => { saveToStorage('pet', pet); }, [pet]);
  useEffect(() => { saveToStorage('pantry', pantryItems); }, [pantryItems]);
  useEffect(() => { saveToStorage('shopping', shoppingItems); }, [shoppingItems]);
  useEffect(() => { saveToStorage('expenses', expenses); }, [expenses]);
  useEffect(() => { saveToStorage('events', events); }, [events]);

  // Recalculate room & house health scores whenever chores change
  const refreshScores = useCallback((updatedChores: Chore[]) => {
    const now = Date.now();
    const updatedRooms = rooms.map((room) => {
      const roomChores = updatedChores.filter((c) => c.roomId === room.id);
      const { score, statusLevel } = calculateRoomScore(roomChores, now);
      
      // Compute lastCleanedAt from latest chore completed
      let latestCleaned = room.lastCleanedAt;
      roomChores.forEach((c) => {
        if (c.lastCompletedAt && (!latestCleaned || c.lastCompletedAt > latestCleaned)) {
          latestCleaned = c.lastCompletedAt;
        }
      });

      return {
        ...room,
        statusScore: score,
        statusLevel,
        lastCleanedAt: latestCleaned,
      };
    });

    const houseScore = calculateHouseScore(updatedRooms.map((r) => r.statusScore));

    setRooms(updatedRooms);
    setHouse((prev) => ({ ...prev, houseScore }));
  }, [rooms]);

  const switchUser = (userId: string) => {
    setCurrentUserId(userId);
    const user = members.find((m) => m.userId === userId);
    if (user) {
      showToast(`Alternado para ${user.displayName}`, 'info');
    }
  };

  const completeChore = (choreId: string) => {
    const chore = chores.find((c) => c.id === choreId);
    if (!chore) return { success: false, reason: 'Chore not found' };

    const now = Date.now();
    const cooldownCheck = checkChoreCooldown(chore.lastCompletedAt, now);
    if (cooldownCheck.isBlocked) {
      showToast(`${cooldownCheck.reason} (aguarde ${cooldownCheck.remainingMinutes} min)`, 'warning');
      return { success: false, reason: cooldownCheck.reason };
    }

    const { urgencyRatio } = calculateChoreUrgency(chore, now);
    const { earnedXp, isOverdueBonus } = calculateXpReward(chore.xpReward, urgencyRatio);

    // Update chore optimistically
    const updatedChores = chores.map((c) => {
      if (c.id === choreId) {
        return {
          ...c,
          lastCompletedAt: now,
          lastCompletedBy: {
            userId: currentUser.userId,
            displayName: currentUser.displayName,
          },
          urgencyScore: 0,
          statusLevel: 'clean' as const,
        };
      }
      return c;
    });

    setChores(updatedChores);

    // Log completion
    const newLog: ChoreLog = {
      id: 'log_' + Date.now(),
      choreId: chore.id,
      roomId: chore.roomId,
      completedBy: currentUser.userId,
      completedByName: currentUser.displayName,
      completedAt: now,
      xpEarned: earnedXp,
    };
    setChoreLogs((prev) => [newLog, ...prev]);

    // Award XP to current user
    setMembers((prev) =>
      prev.map((m) => {
        if (m.userId === currentUser.userId) {
          return {
            ...m,
            weeklyXP: m.weeklyXP + earnedXp,
            totalXP: m.totalXP + earnedXp,
          };
        }
        return m;
      })
    );

    refreshScores(updatedChores);
    fireCelebrationConfetti();

    if (isOverdueBonus) {
      showToast(`Tarefa urgente salva! +${earnedXp} XP (Bônus 1.5x)`, 'success');
    } else {
      showToast(`"${chore.title}" concluída! +${earnedXp} XP`, 'success');
    }

    return { success: true, earnedXp };
  };

  const resetChoreTimer = (choreId: string, hoursAgo: number = 0) => {
    const targetTimestamp = hoursAgo === 0 ? null : Date.now() - hoursAgo * 3600 * 1000;
    const updatedChores = chores.map((c) => {
      if (c.id === choreId) {
        const { urgencyRatio, statusLevel } = calculateChoreUrgency(
          { frequencyDays: c.frequencyDays, lastCompletedAt: targetTimestamp },
          Date.now()
        );
        return {
          ...c,
          lastCompletedAt: targetTimestamp,
          urgencyScore: urgencyRatio,
          statusLevel,
        };
      }
      return c;
    });
    setChores(updatedChores);
    refreshScores(updatedChores);
    showToast('Tempo da tarefa atualizado para demonstração', 'info');
  };

  const addChore = (roomId: string, title: string, frequencyDays: number, xpReward: number) => {
    const newChore: Chore = {
      id: 'chore_' + Date.now(),
      roomId,
      title,
      frequencyDays,
      lastCompletedAt: null,
      lastCompletedBy: null,
      assignedTo: null,
      xpReward,
      urgencyScore: 2.0,
      statusLevel: 'urgent',
    };

    const updated = [...chores, newChore];
    setChores(updated);
    refreshScores(updated);
    showToast('Nova tarefa adicionada!', 'success');
  };

  // Pet Actions
  const scoopLitterBox = () => {
    const now = Date.now();
    setPet((prev) => ({
      ...prev,
      litterBox: {
        ...prev.litterBox,
        lastScoopedAt: now,
      },
    }));

    // Award 10 XP
    setMembers((prev) =>
      prev.map((m) =>
        m.userId === currentUser.userId
          ? { ...m, weeklyXP: m.weeklyXP + 10, totalXP: m.totalXP + 10 }
          : m
      )
    );
    fireCelebrationConfetti();
    showToast('Caixa de areia limpa! +10 XP', 'success');
  };

  const fullChangeLitterBox = () => {
    const now = Date.now();
    setPet((prev) => ({
      ...prev,
      litterBox: {
        ...prev.litterBox,
        lastScoopedAt: now,
        lastFullChangeAt: now,
      },
    }));

    // Award 30 XP
    setMembers((prev) =>
      prev.map((m) =>
        m.userId === currentUser.userId
          ? { ...m, weeklyXP: m.weeklyXP + 30, totalXP: m.totalXP + 30 }
          : m
      )
    );
    fireCelebrationConfetti();
    showToast('Troca completa de areia realizada! +30 XP', 'success');
  };

  const updatePetStock = (dryFoodDeltaGrams: number, sachetDelta: number) => {
    setPet((prev) => {
      const newStock = Math.max(0, prev.feeding.currentStockGrams + dryFoodDeltaGrams);
      const newSachets = Math.max(0, prev.feeding.sachetStockCount + sachetDelta);
      return {
        ...prev,
        feeding: {
          ...prev.feeding,
          currentStockGrams: newStock,
          sachetStockCount: newSachets,
        },
      };
    });
    showToast('Estoque da Bayonetta atualizado', 'info');
  };

  const addPetFoodToShopping = (itemType: 'dry' | 'sachet') => {
    const itemName =
      itemType === 'dry'
        ? `Ração ${pet.feeding.foodBrand}`
        : 'Sachês de Gato (Caixa/Pack)';

    // Check if item already exists
    const existing = shoppingItems.find((s) => !s.isBought && s.name.toLowerCase().includes(itemType === 'dry' ? 'ração' : 'sachê'));
    if (existing) {
      showToast('Item já está presente na lista de compras!', 'info');
      return;
    }

    const newItem: ShoppingItem = {
      id: 'shop_pet_' + Date.now(),
      name: itemName,
      category: 'pet',
      quantity: 1,
      unit: 'pacote',
      isBought: false,
      addedBy: currentUser.displayName,
      createdAt: Date.now(),
    };

    setShoppingItems((prev) => [newItem, ...prev]);
    showToast(`${itemName} adicionado à Lista de Compras!`, 'success');
  };

  const addPetMedicalRecord = (record: Omit<MedicalRecord, 'id'>) => {
    const newRecord: MedicalRecord = {
      ...record,
      id: 'med_' + Date.now(),
    };
    setPet((prev) => ({
      ...prev,
      medicalRecords: [newRecord, ...prev.medicalRecords],
    }));
    showToast('Registro médico veterinário salvo!', 'success');
  };

  // Pantry Actions
  const addPantryItem = (item: Omit<PantryItem, 'id'>) => {
    const newItem: PantryItem = {
      ...item,
      id: 'pantry_' + Date.now(),
    };
    setPantryItems((prev) => [...prev, newItem]);
    showToast(`"${item.name}" adicionado à despensa`, 'success');
  };

  const updatePantryQuantity = (id: string, newQuantity: number) => {
    setPantryItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const qty = Math.max(0, newQuantity);
          // If low quantity and auto-add is true, ensure it's in shopping list
          if (qty <= item.minQuantity && item.autoAddToShopping) {
            const alreadyInList = shoppingItems.some((s) => s.fromPantryId === id && !s.isBought);
            if (!alreadyInList) {
              const shoppingItem: ShoppingItem = {
                id: 'shop_auto_' + Date.now(),
                name: item.name,
                category: item.category,
                quantity: Math.max(1, item.minQuantity - qty + 1),
                unit: item.unit,
                isBought: false,
                addedBy: 'Domus Auto',
                fromPantryId: item.id,
                createdAt: Date.now(),
              };
              setShoppingItems((sPrev) => [shoppingItem, ...sPrev]);
              showToast(`Estoque baixo: "${item.name}" adicionado à lista de compras!`, 'warning');
            }
          }
          return { ...item, currentQuantity: qty };
        }
        return item;
      })
    );
  };

  const deletePantryItem = (id: string) => {
    setPantryItems((prev) => prev.filter((i) => i.id !== id));
    showToast('Item removido da despensa', 'info');
  };

  // Shopping Actions
  const addShoppingItem = (item: Omit<ShoppingItem, 'id' | 'createdAt'>) => {
    const newItem: ShoppingItem = {
      ...item,
      id: 'shop_' + Date.now(),
      createdAt: Date.now(),
    };
    setShoppingItems((prev) => [newItem, ...prev]);
    showToast(`"${item.name}" adicionado à lista de compras`, 'success');
  };

  const toggleShoppingItemBought = (id: string) => {
    setShoppingItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const isBought = !item.isBought;
          return { ...item, isBought };
        }
        return item;
      })
    );
  };

  const moveShoppingItemToPantry = (id: string) => {
    const item = shoppingItems.find((s) => s.id === id);
    if (!item) return;

    if (item.fromPantryId) {
      // Increment existing pantry item
      setPantryItems((prev) =>
        prev.map((p) =>
          p.id === item.fromPantryId
            ? { ...p, currentQuantity: p.currentQuantity + item.quantity }
            : p
        )
      );
    } else {
      // Create new pantry item
      const newPantry: PantryItem = {
        id: 'pantry_' + Date.now(),
        name: item.name,
        category: (item.category as any) || 'mercearia',
        currentQuantity: item.quantity,
        minQuantity: 1,
        unit: (item.unit as any) || 'un',
        autoAddToShopping: true,
      };
      setPantryItems((prev) => [...prev, newPantry]);
    }

    // Mark as bought and remove from active list
    setShoppingItems((prev) => prev.filter((s) => s.id !== id));
    fireCelebrationConfetti();
    showToast(`"${item.name}" movido para a despensa!`, 'success');
  };

  const deleteShoppingItem = (id: string) => {
    setShoppingItems((prev) => prev.filter((s) => s.id !== id));
  };

  const clearBoughtItems = () => {
    setShoppingItems((prev) => prev.filter((s) => !s.isBought));
    showToast('Itens comprados limpos', 'info');
  };

  // Expense Actions
  const addExpense = (expense: Omit<Expense, 'id'>) => {
    const newExpense: Expense = {
      ...expense,
      id: 'exp_' + Date.now(),
    };
    setExpenses((prev) => [newExpense, ...prev]);
    showToast(`Despesa "${expense.description}" registrada!`, 'success');
  };

  const toggleExpenseSettled = (id: string) => {
    setExpenses((prev) =>
      prev.map((exp) =>
        exp.id === id ? { ...exp, isSettled: !exp.isSettled } : exp
      )
    );
    showToast('Status da despesa atualizado', 'info');
  };

  const deleteExpense = (id: string) => {
    setExpenses((prev) => prev.filter((exp) => exp.id !== id));
    showToast('Despesa removida', 'info');
  };

  // Calendar Event Actions
  const addHouseEvent = (event: Omit<HouseEvent, 'id'>) => {
    const newEvent: HouseEvent = {
      ...event,
      id: 'event_' + Date.now(),
    };
    setEvents((prev) => [...prev, newEvent]);
    showToast(`Evento "${event.title}" adicionado à agenda!`, 'success');
  };

  const deleteHouseEvent = (id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
    showToast('Evento removido da agenda', 'info');
  };

  const resetWeeklyLeaderboard = () => {
    setMembers((prev) =>
      prev.map((m) => ({
        ...m,
        weeklyXP: 0,
      }))
    );
    showToast('Ranking semanal reiniciado (Semana Nova!)', 'info');
  };

  // House & Admin Actions
  const updateHouseDetails = (details: Partial<Pick<House, 'name' | 'address' | 'weeklyGoalXP' | 'rulesNotes'>>) => {
    setHouse((prev) => ({
      ...prev,
      ...details,
    }));
    showToast('Dados do lar atualizados!', 'success');
  };

  const regenerateInviteCode = (): string => {
    const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase();
    const newCode = `DOMUS-${randomHex}`;
    setHouse((prev) => ({ ...prev, inviteCode: newCode }));
    showToast(`Novo código de convite gerado: ${newCode}`, 'info');
    return newCode;
  };

  const addMember = (name: string, role: 'admin' | 'member' | 'guest', avatarUrl?: string, email?: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const newMember: HouseMember = {
      userId: 'user_' + Date.now(),
      displayName: trimmed,
      role,
      weeklyXP: 0,
      totalXP: 0,
      email: email?.trim(),
      avatarUrl: avatarUrl?.trim() || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(trimmed)}`,
      levelTitle: role === 'admin' ? 'Administrador' : role === 'member' ? 'Residente' : 'Convidado',
      level: 1,
    };
    setMembers((prev) => [...prev, newMember]);
    setHouse((prev) => ({ ...prev, members: [...prev.members, newMember] }));
    showToast(`Morador "${trimmed}" adicionado!`, 'success');
  };

  const updateMemberRole = (userId: string, role: 'admin' | 'member' | 'guest') => {
    setMembers((prev) =>
      prev.map((m) => {
        if (m.userId === userId) {
          return {
            ...m,
            role,
            levelTitle: role === 'admin' ? 'Administrador' : role === 'member' ? 'Residente' : 'Convidado',
          };
        }
        return m;
      })
    );
    showToast('Permissão de acesso atualizada!', 'info');
  };

  const removeMember = (userId: string): boolean => {
    if (members.length <= 1) {
      showToast('A casa precisa ter pelo menos um morador.', 'warning');
      return false;
    }
    const memberToRemove = members.find((m) => m.userId === userId);
    if (!memberToRemove) return false;

    // If removing currently logged in user, switch to another member first
    if (userId === currentUserId) {
      const remaining = members.find((m) => m.userId !== userId);
      if (remaining) {
        setCurrentUserId(remaining.userId);
      }
    }

    setMembers((prev) => prev.filter((m) => m.userId !== userId));
    setHouse((prev) => ({ ...prev, members: prev.members.filter((m) => m.userId !== userId) }));
    showToast(`Morador "${memberToRemove.displayName}" removido da casa.`, 'info');
    return true;
  };

  const addRoom = (name: string, icon?: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const newRoom: Room = {
      id: 'room_' + Date.now(),
      name: trimmed,
      order: rooms.length + 1,
      statusScore: 100,
      statusLevel: 'clean',
      lastCleanedAt: Date.now(),
      icon: icon || 'Home',
    };
    const updatedRooms = [...rooms, newRoom];
    setRooms(updatedRooms);
    const houseScore = calculateHouseScore(updatedRooms.map((r) => r.statusScore));
    setHouse((prev) => ({ ...prev, houseScore }));
    showToast(`Cômodo "${trimmed}" criado!`, 'success');
  };

  const updateRoom = (roomId: string, name: string, icon?: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setRooms((prev) =>
      prev.map((r) => {
        if (r.id === roomId) {
          return { ...r, name: trimmed, icon: icon || r.icon };
        }
        return r;
      })
    );
    showToast('Cômodo atualizado!', 'info');
  };

  const deleteRoom = (roomId: string) => {
    const roomToDelete = rooms.find((r) => r.id === roomId);
    if (!roomToDelete) return;
    const remainingRooms = rooms.filter((r) => r.id !== roomId);
    setRooms(remainingRooms);
    setChores((prev) => prev.filter((c) => c.roomId !== roomId));
    const houseScore = calculateHouseScore(remainingRooms.map((r) => r.statusScore));
    setHouse((prev) => ({ ...prev, houseScore }));
    showToast(`Cômodo "${roomToDelete.name}" e tarefas removidos.`, 'info');
  };

  const createNewHouse = (houseName: string, adminName: string) => {
    const trimmedHouse = houseName.trim() || 'Minha Casa';
    const trimmedAdmin = adminName.trim() || 'Administrador';
    const adminUser: HouseMember = {
      userId: 'user_' + Date.now(),
      displayName: trimmedAdmin,
      role: 'admin',
      weeklyXP: 0,
      totalXP: 0,
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(trimmedAdmin)}`,
      levelTitle: 'Administrador',
      level: 1,
    };
    const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase();
    const newHouse: House = {
      id: 'house_' + Date.now(),
      name: trimmedHouse,
      inviteCode: `DOMUS-${randomHex}`,
      createdAt: Date.now(),
      houseScore: 100,
      members: [adminUser],
      weeklyGoalXP: 500,
      rulesNotes: 'Regras de convivência do lar:\n- Manter as áreas comuns limpas e organizadas.\n- Respeitar horários de silêncio.',
    };

    const initialRoomsList: Room[] = [
      { id: 'sala_' + Date.now(), name: 'Sala de Estar', order: 1, statusScore: 100, statusLevel: 'clean', lastCleanedAt: Date.now(), icon: 'Sofa' },
      { id: 'cozinha_' + Date.now(), name: 'Cozinha', order: 2, statusScore: 100, statusLevel: 'clean', lastCleanedAt: Date.now(), icon: 'UtensilsCrossed' },
      { id: 'quarto_' + Date.now(), name: 'Quarto', order: 3, statusScore: 100, statusLevel: 'clean', lastCleanedAt: Date.now(), icon: 'Bed' },
      { id: 'banheiro_' + Date.now(), name: 'Banheiro Social', order: 4, statusScore: 100, statusLevel: 'clean', lastCleanedAt: Date.now(), icon: 'Bath' },
    ];

    setHouse(newHouse);
    setMembers([adminUser]);
    setCurrentUserId(adminUser.userId);
    setRooms(initialRoomsList);
    setChores([
      { id: 'chore_' + Date.now() + '_1', roomId: initialRoomsList[0].id, title: 'Organizar sala e tirar pó', frequencyDays: 3, lastCompletedAt: Date.now(), lastCompletedBy: { userId: adminUser.userId, displayName: adminUser.displayName }, assignedTo: null, xpReward: 25, urgencyScore: 0, statusLevel: 'clean' },
      { id: 'chore_' + Date.now() + '_2', roomId: initialRoomsList[1].id, title: 'Lavar louça e limpar bancada', frequencyDays: 1, lastCompletedAt: Date.now(), lastCompletedBy: { userId: adminUser.userId, displayName: adminUser.displayName }, assignedTo: null, xpReward: 15, urgencyScore: 0, statusLevel: 'clean' },
      { id: 'chore_' + Date.now() + '_3', roomId: initialRoomsList[3].id, title: 'Higienizar banheiro e box', frequencyDays: 4, lastCompletedAt: Date.now(), lastCompletedBy: { userId: adminUser.userId, displayName: adminUser.displayName }, assignedTo: null, xpReward: 35, urgencyScore: 0, statusLevel: 'clean' },
    ]);
    setChoreLogs([]);
    setPet(createInitialPet());
    setPantryItems([]);
    setShoppingItems([]);
    setExpenses([]);
    setEvents([]);
    fireCelebrationConfetti();
    showToast(`Lar "${trimmedHouse}" criado com sucesso!`, 'success');
  };

  const joinHouseWithCode = (inviteCode: string, memberName: string): boolean => {
    const cleanCode = inviteCode.trim().toUpperCase();
    const cleanName = memberName.trim() || 'Novo Morador';
    
    if (cleanCode === house.inviteCode.toUpperCase()) {
      const existing = members.find((m) => m.displayName.toLowerCase() === cleanName.toLowerCase());
      if (existing) {
        setCurrentUserId(existing.userId);
        showToast(`Bem-vindo de volta, ${existing.displayName}!`, 'success');
        return true;
      }
      addMember(cleanName, 'member');
      return true;
    }

    showToast(`Código ${cleanCode} verificado! Conectando à residência...`, 'success');
    addMember(cleanName, 'member');
    return true;
  };

  const exportHouseData = (): string => {
    const payload = {
      version: 1,
      exportedAt: Date.now(),
      house,
      members,
      rooms,
      chores,
      choreLogs,
      pet,
      pantryItems,
      shoppingItems,
      expenses,
      events,
    };
    return JSON.stringify(payload, null, 2);
  };

  const importHouseData = (jsonContent: string): { success: boolean; message?: string } => {
    try {
      const data = JSON.parse(jsonContent);
      if (!data.house || !Array.isArray(data.members) || !Array.isArray(data.rooms)) {
        return { success: false, message: 'Arquivo JSON inválido para a estrutura do Domus.' };
      }
      setHouse(data.house);
      setMembers(data.members);
      if (data.members.length > 0) {
        setCurrentUserId(data.members[0].userId);
      }
      setRooms(data.rooms);
      setChores(data.chores || []);
      setChoreLogs(data.choreLogs || []);
      if (data.pet) setPet(data.pet);
      if (data.pantryItems) setPantryItems(data.pantryItems);
      if (data.shoppingItems) setShoppingItems(data.shoppingItems);
      if (data.expenses) setExpenses(data.expenses);
      if (data.events) setEvents(data.events);

      fireCelebrationConfetti();
      showToast('Dados do lar restaurados com sucesso!', 'success');
      return { success: true };
    } catch {
      return { success: false, message: 'Erro ao interpretar o arquivo JSON.' };
    }
  };

  const resetAllToSeed = () => {
    setHouse(DEFAULT_HOUSE);
    setMembers(DEFAULT_MEMBERS);
    setCurrentUserId('user_1');
    setRooms(createInitialRooms());
    setChores(createInitialChores());
    setChoreLogs([]);
    setPet(createInitialPet());
    setPantryItems(createInitialPantry());
    setShoppingItems(createInitialShoppingList());
    setExpenses(createInitialExpenses());
    setEvents(createInitialEvents());
    showToast('Dados restaurados para o padrão inicial', 'success');
  };

  return (
    <AppContext.Provider
      value={{
        house,
        currentUser,
        members,
        rooms,
        chores,
        choreLogs,
        pet,
        pantryItems,
        shoppingItems,
        expenses,
        toasts,
        removeToast,
        showToast,
        switchUser,
        completeChore,
        addChore,
        resetChoreTimer,
        scoopLitterBox,
        fullChangeLitterBox,
        updatePetStock,
        addPetFoodToShopping,
        addPetMedicalRecord,
        addPantryItem,
        updatePantryQuantity,
        deletePantryItem,
        addShoppingItem,
        toggleShoppingItemBought,
        moveShoppingItemToPantry,
        deleteShoppingItem,
        clearBoughtItems,
        addExpense,
        toggleExpenseSettled,
        deleteExpense,
        events,
        addHouseEvent,
        deleteHouseEvent,
        updateHouseDetails,
        regenerateInviteCode,
        addMember,
        updateMemberRole,
        removeMember,
        addRoom,
        updateRoom,
        deleteRoom,
        createNewHouse,
        joinHouseWithCode,
        exportHouseData,
        importHouseData,
        resetWeeklyLeaderboard,
        resetAllToSeed,
        theme,
        setTheme,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
