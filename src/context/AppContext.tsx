import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  House,
  HouseEvent,
  HouseMember,
  Room,
  Chore,
  ChoreLog,
  Pet,
  PetCareLog,
  PantryItem,
  ShoppingItem,
  Expense,
  HouseBudget,
  MedicalRecord,
  EmergencyContact,
  HouseReward,
  HouseNote,
  PetWeightRecord,
  PetDutySchedule,
  PetDutyPeriod,
  PetDailyDuty,
  PetCustomReminder,
} from '../types';
import {
  DEFAULT_HOUSE,
  DEFAULT_MEMBERS,
  createInitialRooms,
  createInitialChores,
  createInitialPet,
  createInitialPets,
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
import { isFirebaseConfigured } from '../services/firebase';
import { 
  syncFullHouseToFirestore, 
  subscribeToCloudHouse,
  findHouseByInviteCodeInFirestore,
  fetchHouseByIdFromFirestore 
} from '../services/firestoreSync';
import { User as FirebaseUser } from 'firebase/auth';
import { 
  loginWithGoogle, 
  logoutFromGoogle, 
  listenToAuthChanges, 
  linkUserToHouse, 
  getUserHouseId 
} from '../services/authService';
import { triggerHaptic } from '../utils/haptics';
import { playSoftPop, playSuccessChime, playCoinSound } from '../utils/soundEffects';

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
  pets: Pet[];
  pet: Pet;
  selectedPetId: string;
  setSelectedPetId: (id: string) => void;
  addPet: (pet: Omit<Pet, 'id'>) => void;
  updatePet: (id: string, updates: Partial<Pet>) => void;
  deletePet: (id: string) => void;
  updatePetPhoto: (petId: string, photoUrl: string) => void;
  addPetWeightRecord: (petId: string, weightKg: number) => void;
  updateVetContact: (petId: string, vetContact: Pet['vetContact']) => void;
  pantryItems: PantryItem[];
  shoppingItems: ShoppingItem[];
  expenses: Expense[];
  toasts: ToastNotification[];
  removeToast: (id: string) => void;
  showToast: (message: string, type?: 'success' | 'warning' | 'info' | 'error') => void;
  switchUser: (userId: string) => void;
  // Member & Profile actions
  updateMemberProfile: (userId: string, data: Partial<HouseMember>) => void;
  // Chore actions
  completeChore: (choreId: string, proofUrl?: string) => { success: boolean; earnedXp?: number; reason?: string };
  addChore: (roomId: string, title: string, frequencyDays: number, xpReward: number, difficulty?: 'facil' | 'medio' | 'pesado', estimatedMinutes?: number) => void;
  resetChoreTimer: (choreId: string, hoursAgo?: number) => void;
  // Pet actions
  scoopLitterBox: (petId?: string) => void;
  fullChangeLitterBox: (petId?: string) => void;
  walkDog: (petId?: string) => void;
  bathDog: (petId?: string) => void;
  updatePetStock: (dryFoodDeltaGrams: number, sachetDelta: number, petId?: string) => void;
  addPetFoodToShopping: (itemType: 'dry' | 'sachet' | 'litter', petId?: string) => void;
  addPetMedicalRecord: (record: Omit<MedicalRecord, 'id'>, petId?: string, expenseAmount?: number) => void;
  logPetCareAction: (petId: string, actionType: PetCareLog['actionType'], title: string, xpReward: number) => void;
  updatePetDutySchedule: (petId: string, schedule: Partial<PetDutySchedule>) => void;
  overrideTodayPetDuty: (petId: string, userId: string) => void;
  completePetDailyDuty: (petId: string, period: PetDutyPeriod, title: string, xpReward: number) => void;
  addPetReminder: (petId: string, reminder: Omit<PetCustomReminder, 'id'>, syncToCalendar?: boolean) => void;
  togglePetReminder: (petId: string, reminderId: string) => void;
  deletePetReminder: (petId: string, reminderId: string) => void;
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
  addExpense: (expense: Omit<Expense, 'id'>, totalInstallments?: number) => void;
  updateExpense: (id: string, updates: Partial<Expense>) => void;
  toggleExpenseSettled: (id: string) => void;
  deleteExpense: (id: string) => void;
  updateHouseBudget: (budget: Partial<HouseBudget>) => void;
  // Calendar Event actions
  events: HouseEvent[];
  addHouseEvent: (event: Omit<HouseEvent, 'id'>) => void;
  deleteHouseEvent: (id: string) => void;
  // Authentication & Session
  authUser: FirebaseUser | null;
  isAuthLoading: boolean;
  isOfflineDemo: boolean;
  signInWithGoogle: () => Promise<boolean>;
  logout: () => Promise<void>;
  bypassAuthToDemo: () => void;
  // House & Admin actions
  updateHouseDetails: (details: Partial<Pick<House, 'name' | 'address' | 'weeklyGoalXP' | 'rulesNotes'>>) => void;
  regenerateInviteCode: () => string;
  addMember: (name: string, role: 'admin' | 'member' | 'guest', avatarUrl?: string, email?: string) => void;
  updateMemberRole: (userId: string, role: 'admin' | 'member' | 'guest') => void;
  removeMember: (userId: string) => boolean;
  addRoom: (name: string, icon?: string) => void;
  updateRoom: (roomId: string, name: string, icon?: string) => void;
  deleteRoom: (roomId: string) => void;
  createNewHouse: (houseName: string, adminName?: string) => Promise<void> | void;
  joinHouseWithCode: (inviteCode: string, memberName?: string) => Promise<boolean> | boolean;
  exportHouseData: () => string;
  importHouseData: (jsonContent: string) => { success: boolean; message?: string };
  resetWeeklyLeaderboard: () => void;
  // House Wi-Fi, Emergency, Rewards, Notes
  updateWifiDetails: (wifiSsid: string, wifiPassword: string) => void;
  addEmergencyContact: (contact: Omit<EmergencyContact, 'id'>) => void;
  deleteEmergencyContact: (contactId: string) => void;
  addHouseNote: (note: Omit<HouseNote, 'id' | 'createdAt'>) => void;
  deleteHouseNote: (noteId: string) => void;
  togglePinHouseNote: (noteId: string) => void;
  addHouseReward: (reward: Omit<HouseReward, 'id'>) => void;
  claimHouseReward: (rewardId: string, userId: string) => void;
  deleteHouseReward: (rewardId: string) => void;
  // Sensory & System
  theme: 'dark' | 'light' | 'system';
  setTheme: (theme: 'dark' | 'light' | 'system') => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  vibrationEnabled: boolean;
  setVibrationEnabled: (enabled: boolean) => void;
  isFirebaseConnected: boolean;
  syncToCloudNow: () => Promise<boolean>;
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
  const [pets, setPets] = useState<Pet[]>(() => {
    const saved = loadFromStorage<Pet[]>('pets', []);
    if (saved && saved.length > 0) return saved;
    const legacy = loadFromStorage<Pet | null>('pet', null);
    if (legacy) {
      const defaults = createInitialPets();
      const rest = defaults.filter((d) => d.id !== legacy.id);
      return [legacy, ...rest];
    }
    return createInitialPets();
  });
  const [selectedPetId, setSelectedPetId] = useState<string>(() => {
    return loadFromStorage('selectedPetId', 'pet_bayonetta');
  });
  const [pantryItems, setPantryItems] = useState<PantryItem[]>(() => loadFromStorage('pantry', createInitialPantry()));
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>(() => loadFromStorage('shopping', createInitialShoppingList()));
  const [expenses, setExpenses] = useState<Expense[]>(() => loadFromStorage('expenses', createInitialExpenses()));
  const [events, setEvents] = useState<HouseEvent[]>(() => loadFromStorage('events', createInitialEvents()));
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const [authUser, setAuthUser] = useState<FirebaseUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [isOfflineDemo, setIsOfflineDemo] = useState<boolean>(() => {
    return loadFromStorage('isOfflineDemo', false);
  });
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

  const [soundEnabled, setSoundEnabledState] = useState<boolean>(() => {
    return loadFromStorage('soundEnabled', true);
  });
  const [vibrationEnabled, setVibrationEnabledState] = useState<boolean>(() => {
    return loadFromStorage('vibrationEnabled', true);
  });

  const setSoundEnabled = (enabled: boolean) => {
    saveToStorage('soundEnabled', enabled);
    setSoundEnabledState(enabled);
    if (enabled) playSoftPop(true);
  };

  const setVibrationEnabled = (enabled: boolean) => {
    saveToStorage('vibrationEnabled', enabled);
    setVibrationEnabledState(enabled);
    if (enabled) triggerHaptic('light');
  };

  const fallbackMember: HouseMember = {
    userId: currentUserId || 'user_1',
    displayName: 'Morador',
    email: '',
    role: 'member',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
    totalXP: 0,
    weeklyXP: 0,
    streakDays: 1,
    color: '#C25E34',
    pixKeyType: 'random',
  };

  const currentUser = members.find((m) => m.userId === currentUserId) || members[0] || fallbackMember;
  const pet = pets.find((p) => p.id === selectedPetId) || pets[0] || createInitialPet();

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

  // Listen for Google Auth changes
  useEffect(() => {
    const unsub = listenToAuthChanges(async (firebaseUser) => {
      setAuthUser(firebaseUser);
      setIsAuthLoading(false);

      if (firebaseUser) {
        // 1. Try to find user's house in Firestore
        try {
          const remoteHouseId = await getUserHouseId(firebaseUser.uid);
          if (remoteHouseId && remoteHouseId !== house.id) {
            const cloudHouse = await fetchHouseByIdFromFirestore(remoteHouseId);
            if (cloudHouse) {
              setHouse(cloudHouse.house);
              setMembers(cloudHouse.members);
              setRooms(cloudHouse.rooms);
              setChores(cloudHouse.chores);
              setChoreLogs(cloudHouse.choreLogs);
              setPets(cloudHouse.pets);
              if (cloudHouse.selectedPetId) setSelectedPetId(cloudHouse.selectedPetId);
              setPantryItems(cloudHouse.pantryItems);
              setShoppingItems(cloudHouse.shoppingItems);
              setExpenses(cloudHouse.expenses);
              setEvents(cloudHouse.events);
            }
          }
        } catch (e) {
          console.warn('Erro ao carregar casa remota:', e);
        }

        // 2. Link with member list
        setMembers((prevMembers) => {
          const found = prevMembers.find(
            (m) =>
              m.userId === firebaseUser.uid ||
              (firebaseUser.email && m.email && m.email.toLowerCase() === firebaseUser.email.toLowerCase())
          );
          if (found) {
            setCurrentUserId(firebaseUser.uid);
            return prevMembers.map((m) =>
              m.userId === found.userId
                ? {
                    ...m,
                    userId: firebaseUser.uid,
                    displayName: firebaseUser.displayName || m.displayName,
                    avatarUrl: firebaseUser.photoURL || m.avatarUrl,
                    email: firebaseUser.email || m.email,
                  }
                : m
            );
          }
          return prevMembers;
        });
      }
    });

    return () => unsub();
  }, [house.id]);

  const signInWithGoogle = async (): Promise<boolean> => {
    const res = await loginWithGoogle();
    if (res.success && res.user) {
      setAuthUser(res.user);
      setIsOfflineDemo(false);
      saveToStorage('isOfflineDemo', false);
      showToast(`Bem-vindo, ${res.user.displayName || 'Usuário'}!`, 'success');
      return true;
    }
    if (res.error) {
      showToast(res.error, 'error');
    }
    return false;
  };

  const logout = async () => {
    await logoutFromGoogle();
    setAuthUser(null);
    setIsOfflineDemo(false);
    saveToStorage('isOfflineDemo', false);
    showToast('Você saiu da sua conta Google.', 'info');
  };

  const bypassAuthToDemo = () => {
    setIsOfflineDemo(true);
    saveToStorage('isOfflineDemo', true);
    showToast('Acessando em modo demonstração offline.', 'info');
  };

  // Save changes to local persistent storage
  useEffect(() => { saveToStorage('house', house); }, [house]);
  useEffect(() => { saveToStorage('members', members); }, [members]);
  useEffect(() => { saveToStorage('currentUserId', currentUserId); }, [currentUserId]);
  useEffect(() => { saveToStorage('rooms', rooms); }, [rooms]);
  useEffect(() => { saveToStorage('chores', chores); }, [chores]);
  useEffect(() => { saveToStorage('choreLogs', choreLogs); }, [choreLogs]);
  useEffect(() => { saveToStorage('pets', pets); }, [pets]);
  useEffect(() => { saveToStorage('selectedPetId', selectedPetId); }, [selectedPetId]);
  useEffect(() => { saveToStorage('pantry', pantryItems); }, [pantryItems]);
  useEffect(() => { saveToStorage('shopping', shoppingItems); }, [shoppingItems]);
  useEffect(() => { saveToStorage('expenses', expenses); }, [expenses]);
  useEffect(() => { saveToStorage('events', events); }, [events]);

  // Real-time Cloud Synchronization (Firebase Firestore)
  const isCloudSyncSuppressedRef = useRef(false);
  const lastCloudSyncTimestampRef = useRef(0);

  // 1. Inbound: Subscribe to Cloud Updates if Firebase is configured
  useEffect(() => {
    if (!isFirebaseConfigured || !house?.id) return;

    const unsubscribe = subscribeToCloudHouse(house.id, (remoteData) => {
      if (remoteData.updatedAt && remoteData.updatedAt <= lastCloudSyncTimestampRef.current) return;

      isCloudSyncSuppressedRef.current = true;
      if (remoteData.house) setHouse(remoteData.house);
      if (Array.isArray(remoteData.members)) setMembers(remoteData.members);
      if (Array.isArray(remoteData.rooms)) setRooms(remoteData.rooms);
      if (Array.isArray(remoteData.chores)) setChores(remoteData.chores);
      if (Array.isArray(remoteData.choreLogs)) setChoreLogs(remoteData.choreLogs);
      if (Array.isArray(remoteData.pets) && remoteData.pets.length > 0) {
        setPets(remoteData.pets);
        if (remoteData.selectedPetId) setSelectedPetId(remoteData.selectedPetId);
      }
      if (Array.isArray(remoteData.pantryItems)) setPantryItems(remoteData.pantryItems);
      if (Array.isArray(remoteData.shoppingItems)) setShoppingItems(remoteData.shoppingItems);
      if (Array.isArray(remoteData.expenses)) setExpenses(remoteData.expenses);
      if (Array.isArray(remoteData.events)) setEvents(remoteData.events);

      setTimeout(() => {
        isCloudSyncSuppressedRef.current = false;
      }, 500);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [house.id]);

  // 2. Outbound: Debounced auto-push to Cloud on local mutations
  useEffect(() => {
    if (!isFirebaseConfigured || isCloudSyncSuppressedRef.current) return;

    const timer = setTimeout(() => {
      lastCloudSyncTimestampRef.current = Date.now();
      syncFullHouseToFirestore({
        house,
        members,
        rooms,
        chores,
        choreLogs,
        pets,
        selectedPetId,
        pantryItems,
        shoppingItems,
        expenses,
        events,
      });
    }, 2000);

    return () => clearTimeout(timer);
  }, [house, members, rooms, chores, choreLogs, pets, selectedPetId, pantryItems, shoppingItems, expenses, events]);

  const syncToCloudNow = async (): Promise<boolean> => {
    if (!isFirebaseConfigured) {
      showToast('Firebase ainda não conectado. Seus dados estão salvos localmente.', 'info');
      return false;
    }
    const success = await syncFullHouseToFirestore({
      house,
      members,
      rooms,
      chores,
      choreLogs,
      pets,
      selectedPetId,
      pantryItems,
      shoppingItems,
      expenses,
      events,
    });
    if (success) {
      showToast('Dados sincronizados com o Firestore na nuvem!', 'success');
    }
    return success;
  };

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

  const completeChore = (choreId: string, proofUrl?: string) => {
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

    // Rotation: advance to next member in line if rotation is set
    let nextRotationIndex = chore.currentRotationIndex;
    let nextAssignedTo = chore.assignedTo;
    if (chore.rotationUserIds && chore.rotationUserIds.length > 0) {
      nextRotationIndex = ((chore.currentRotationIndex || 0) + 1) % chore.rotationUserIds.length;
      nextAssignedTo = chore.rotationUserIds[nextRotationIndex];
    }

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
          currentRotationIndex: nextRotationIndex,
          assignedTo: nextAssignedTo,
          completionProofUrl: proofUrl || c.completionProofUrl,
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
      proofUrl,
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
    playSuccessChime(soundEnabled);
    triggerHaptic('success');

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

  const addChore = (
    roomId: string,
    title: string,
    frequencyDays: number,
    xpReward: number,
    difficulty: 'facil' | 'medio' | 'pesado' = 'medio',
    estimatedMinutes = 20
  ) => {
    const memberIds = members.map((m) => m.userId);
    const newChore: Chore = {
      id: 'chore_' + Date.now(),
      roomId,
      title,
      frequencyDays,
      lastCompletedAt: null,
      lastCompletedBy: null,
      assignedTo: memberIds[0] || null,
      xpReward,
      urgencyScore: 2.0,
      statusLevel: 'urgent',
      difficulty,
      estimatedMinutes,
      rotationUserIds: memberIds,
      currentRotationIndex: 0,
    };

    const updated = [...chores, newChore];
    setChores(updated);
    refreshScores(updated);
    playSoftPop(soundEnabled);
    triggerHaptic('light');
    showToast('Nova tarefa adicionada!', 'success');
  };

  // Pet Actions & Multi-Pet Management
  const addPet = (petData: Omit<Pet, 'id'>) => {
    const newId = 'pet_' + Date.now();
    const newPet: Pet = {
      ...petData,
      id: newId,
      careLogs: [],
      medicalRecords: petData.medicalRecords || [],
    };
    setPets((prev) => [...prev, newPet]);
    setSelectedPetId(newId);
    showToast(`Pet "${newPet.name}" cadastrado na família!`, 'success');
  };

  const updatePet = (id: string, updates: Partial<Pet>) => {
    setPets((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          return { ...p, ...updates };
        }
        return p;
      })
    );
    showToast('Dados do pet atualizados!', 'info');
  };

  const deletePet = (id: string) => {
    if (pets.length <= 1) {
      showToast('A casa deve manter ao menos um pet cadastrado.', 'warning');
      return;
    }
    const petToDelete = pets.find((p) => p.id === id);
    setPets((prev) => prev.filter((p) => p.id !== id));
    if (selectedPetId === id) {
      const remaining = pets.find((p) => p.id !== id);
      if (remaining) setSelectedPetId(remaining.id);
    }
    showToast(`Pet "${petToDelete?.name || ''}" removido.`, 'info');
  };

  const updatePetPhoto = (petId: string, photoUrl: string) => {
    updatePet(petId, { photoUrl });
    playSoftPop(soundEnabled);
    showToast('Foto do pet atualizada!', 'success');
  };

  const addPetWeightRecord = (petId: string, weightKg: number) => {
    setPets((prev) =>
      prev.map((p) => {
        if (p.id === petId) {
          const history = p.weightHistory || [];
          return {
            ...p,
            weightKg,
            weightHistory: [...history, { date: Date.now(), weightKg }],
          };
        }
        return p;
      })
    );
    playSoftPop(soundEnabled);
    triggerHaptic('light');
    showToast(`Peso de ${weightKg}kg registrado para o pet!`, 'success');
  };

  const updateVetContact = (petId: string, vetContact: Pet['vetContact']) => {
    updatePet(petId, { vetContact });
    showToast('Contato do veterinário atualizado!', 'success');
  };

  const logPetCareAction = (petId: string, actionType: PetCareLog['actionType'], title: string, xpReward: number) => {
    const now = Date.now();
    const log: PetCareLog = {
      id: 'log_' + Date.now(),
      petId,
      actionType,
      title,
      performedByUserId: currentUser.userId,
      performedByName: currentUser.displayName,
      performedAt: now,
      xpEarned: xpReward,
    };

    setPets((prev) =>
      prev.map((p) => {
        if (p.id === petId) {
          return {
            ...p,
            careLogs: [log, ...(p.careLogs || [])].slice(0, 30),
          };
        }
        return p;
      })
    );

    if (xpReward > 0) {
      setMembers((prev) =>
        prev.map((m) =>
          m.userId === currentUser.userId
            ? { ...m, weeklyXP: m.weeklyXP + xpReward, totalXP: m.totalXP + xpReward }
            : m
        )
      );
      fireCelebrationConfetti();
    }
  };

  const scoopLitterBox = (petId?: string) => {
    const targetId = petId || selectedPetId;
    const targetPet = pets.find((p) => p.id === targetId) || pet;
    const now = Date.now();

    setPets((prev) =>
      prev.map((p) => {
        if (p.id === targetId && p.litterBox) {
          return {
            ...p,
            litterBox: {
              ...p.litterBox,
              lastScoopedAt: now,
            },
          };
        }
        return p;
      })
    );

    logPetCareAction(targetId, 'scoop', `Recolhimento da caixa de areia (${targetPet.name})`, 10);
    showToast(`Caixa de areia de ${targetPet.name} limpa! +10 XP`, 'success');
  };

  const fullChangeLitterBox = (petId?: string) => {
    const targetId = petId || selectedPetId;
    const targetPet = pets.find((p) => p.id === targetId) || pet;
    const now = Date.now();

    setPets((prev) =>
      prev.map((p) => {
        if (p.id === targetId && p.litterBox) {
          return {
            ...p,
            litterBox: {
              ...p.litterBox,
              lastScoopedAt: now,
              lastFullChangeAt: now,
            },
          };
        }
        return p;
      })
    );

    logPetCareAction(targetId, 'litter_change', `Troca total de areia higiênica (${targetPet.name})`, 30);
    showToast(`Troca total de areia de ${targetPet.name} realizada! +30 XP`, 'success');
  };

  const walkDog = (petId?: string) => {
    const targetId = petId || selectedPetId;
    const targetPet = pets.find((p) => p.id === targetId) || pet;
    const now = Date.now();

    setPets((prev) =>
      prev.map((p) => {
        if (p.id === targetId && p.walks) {
          return {
            ...p,
            walks: {
              ...p.walks,
              lastWalkAt: now,
              walksToday: (p.walks.walksToday || 0) + 1,
            },
          };
        }
        return p;
      })
    );

    logPetCareAction(targetId, 'walk', `Passeio diário com ${targetPet.name}`, 25);
    showToast(`Passeio com ${targetPet.name} concluído! +25 XP`, 'success');
  };

  const bathDog = (petId?: string) => {
    const targetId = petId || selectedPetId;
    const targetPet = pets.find((p) => p.id === targetId) || pet;
    const now = Date.now();

    setPets((prev) =>
      prev.map((p) => {
        if (p.id === targetId && p.bath) {
          return {
            ...p,
            bath: {
              ...p.bath,
              lastBathAt: now,
            },
          };
        }
        return p;
      })
    );

    logPetCareAction(targetId, 'bath', `Banho e higiene de ${targetPet.name}`, 35);
    showToast(`Banho de ${targetPet.name} registrado! +35 XP`, 'success');
  };

  const updatePetStock = (dryFoodDeltaGrams: number, sachetDelta: number, petId?: string) => {
    const targetId = petId || selectedPetId;
    const targetPet = pets.find((p) => p.id === targetId) || pet;

    setPets((prev) =>
      prev.map((p) => {
        if (p.id === targetId) {
          const newStock = Math.max(0, p.feeding.currentStockGrams + dryFoodDeltaGrams);
          const newSachets = Math.max(0, (p.feeding.sachetStockCount || 0) + sachetDelta);
          return {
            ...p,
            feeding: {
              ...p.feeding,
              currentStockGrams: newStock,
              sachetStockCount: newSachets,
            },
          };
        }
        return p;
      })
    );

    if (dryFoodDeltaGrams < 0) {
      logPetCareAction(targetId, 'feed', `Alimentou ${targetPet.name} (-${Math.abs(dryFoodDeltaGrams)}g)`, 10);
    } else if (sachetDelta < 0) {
      logPetCareAction(targetId, 'sachet', `Serviu sachê para ${targetPet.name}`, 5);
    }

    showToast(`Estoque de ${targetPet.name} atualizado`, 'info');
  };

  const addPetFoodToShopping = (itemType: 'dry' | 'sachet' | 'litter', petId?: string) => {
    const targetId = petId || selectedPetId;
    const targetPet = pets.find((p) => p.id === targetId) || pet;

    const itemName =
      itemType === 'dry'
        ? `Ração ${targetPet.feeding.foodBrand} (${targetPet.name})`
        : itemType === 'sachet'
        ? `Sachês úmidos (${targetPet.name})`
        : `Areia sanitária para ${targetPet.name}`;

    const existing = shoppingItems.find((s) => !s.isBought && s.name.toLowerCase() === itemName.toLowerCase());
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

  const addPetMedicalRecord = (record: Omit<MedicalRecord, 'id'>, petId?: string, expenseAmount?: number) => {
    const targetId = petId || selectedPetId;
    const targetPet = pets.find((p) => p.id === targetId) || pet;
    const newRecord: MedicalRecord = {
      ...record,
      id: 'med_' + Date.now(),
    };

    setPets((prev) =>
      prev.map((p) => {
        if (p.id === targetId) {
          return {
            ...p,
            medicalRecords: [newRecord, ...p.medicalRecords],
          };
        }
        return p;
      })
    );

    logPetCareAction(targetId, 'med', `${record.name} aplicado em ${targetPet.name}`, 20);

    // Integre com Finanças caso haja valor informado
    if (expenseAmount && expenseAmount > 0) {
      const newExpense: Expense = {
        id: 'exp_pet_' + Date.now(),
        description: `Veterinário: ${record.name} (${targetPet.name})`,
        amount: expenseAmount,
        paidByUserId: currentUser.userId,
        splitAmongUserIds: members.map((m) => m.userId),
        date: Date.now(),
        category: 'pet',
        isSettled: false,
      };
      setExpenses((prev) => [newExpense, ...prev]);
      showToast(`Despesa de R$ ${expenseAmount.toFixed(2)} dividida entre os moradores!`, 'success');
    }

    showToast('Registro médico veterinário salvo!', 'success');
  };

  const updatePetDutySchedule = (petId: string, scheduleUpdate: Partial<PetDutySchedule>) => {
    setPets((prev) =>
      prev.map((p) => {
        if (p.id === petId) {
          const currentSchedule = p.dutySchedule || {
            weeklyAssignment: {
              0: 'user_1',
              1: 'user_1',
              2: 'user_2',
              3: 'user_1',
              4: 'user_2',
              5: 'user_1',
              6: 'user_2',
            },
          };
          return {
            ...p,
            dutySchedule: {
              ...currentSchedule,
              ...scheduleUpdate,
              weeklyAssignment: {
                ...currentSchedule.weeklyAssignment,
                ...(scheduleUpdate.weeklyAssignment || {}),
              },
            },
          };
        }
        return p;
      })
    );
    showToast('Escala de tutores atualizada com sucesso!', 'success');
  };

  const overrideTodayPetDuty = (petId: string, userId: string) => {
    const targetUser = members.find((m) => m.userId === userId) || currentUser;
    const targetPet = pets.find((p) => p.id === petId) || pet;
    const todayStr = new Date().toISOString().split('T')[0];

    setPets((prev) =>
      prev.map((p) => {
        if (p.id === petId) {
          const currentSchedule = p.dutySchedule || {
            weeklyAssignment: {
              0: 'user_1',
              1: 'user_1',
              2: 'user_2',
              3: 'user_1',
              4: 'user_2',
              5: 'user_1',
              6: 'user_2',
            },
          };
          return {
            ...p,
            dutySchedule: {
              ...currentSchedule,
              todayOverrideUserId: userId,
              lastOverrideDate: todayStr,
            },
          };
        }
        return p;
      })
    );

    triggerHaptic('medium');
    playSuccessChime(soundEnabled);
    showToast(`${targetUser.displayName} assumiu o plantão de ${targetPet.name} hoje!`, 'success');
  };

  const completePetDailyDuty = (petId: string, period: PetDutyPeriod, title: string, xpReward: number) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const targetPet = pets.find((p) => p.id === petId) || pet;
    const dutyId = `duty_${petId}_${todayStr}_${period}`;

    const newDuty: PetDailyDuty = {
      id: dutyId,
      petId,
      period,
      title,
      dateStr: todayStr,
      completedAt: Date.now(),
      completedByUserId: currentUser.userId,
      completedByName: currentUser.displayName,
      xpReward,
    };

    setPets((prev) =>
      prev.map((p) => {
        if (p.id === petId) {
          const currentDuties = p.duties || [];
          const filtered = currentDuties.filter((d) => !(d.dateStr === todayStr && d.period === period));
          return {
            ...p,
            duties: [newDuty, ...filtered],
          };
        }
        return p;
      })
    );

    // Award XP to currentUser
    setMembers((prev) =>
      prev.map((m) => {
        if (m.userId === currentUser.userId) {
          return {
            ...m,
            weeklyXP: m.weeklyXP + xpReward,
            totalXP: m.totalXP + xpReward,
          };
        }
        return m;
      })
    );

    // Log in Pet Care Feed
    logPetCareAction(
      petId,
      period === 'morning' ? 'feed' : period === 'afternoon' ? 'walk' : 'scoop',
      `${title} (${targetPet.name})`,
      xpReward
    );

    triggerHaptic('success');
    playCoinSound(soundEnabled);
    fireCelebrationConfetti();
    showToast(`Turno "${title}" concluído! +${xpReward} XP`, 'success');
  };

  const addPetReminder = (
    petId: string,
    reminder: Omit<PetCustomReminder, 'id'>,
    syncToCalendar: boolean = true
  ) => {
    const newId = 'rem_' + Date.now();
    const newReminder: PetCustomReminder = {
      ...reminder,
      id: newId,
      petId,
    };

    setPets((prev) =>
      prev.map((p) => {
        if (p.id === petId) {
          return {
            ...p,
            reminders: [...(p.reminders || []), newReminder],
          };
        }
        return p;
      })
    );

    if (syncToCalendar) {
      const [hours, minutes] = reminder.time.split(':').map(Number);
      const eventDate = new Date();
      eventDate.setHours(hours || 8, minutes || 0, 0, 0);

      const targetPet = pets.find((p) => p.id === petId) || pet;
      const newEvent: HouseEvent = {
        id: 'event_pet_' + Date.now(),
        title: `🐾 ${reminder.title} (${targetPet.name})`,
        description: `Lembrete diário programado às ${reminder.time}`,
        date: eventDate.getTime(),
        category: 'pet',
        createdByUserId: currentUser.userId,
        createdByName: currentUser.displayName,
        assignedToUserId: reminder.assignedToUserId,
        source: 'pet',
        sourceId: newId,
      };
      setEvents((prev) => [...prev, newEvent]);
    }

    showToast(`Lembrete "${reminder.title}" adicionado!`, 'success');
  };

  const togglePetReminder = (petId: string, reminderId: string) => {
    setPets((prev) =>
      prev.map((p) => {
        if (p.id === petId) {
          return {
            ...p,
            reminders: (p.reminders || []).map((r) =>
              r.id === reminderId ? { ...r, isEnabled: !r.isEnabled } : r
            ),
          };
        }
        return p;
      })
    );
    showToast('Lembrete atualizado', 'info');
  };

  const deletePetReminder = (petId: string, reminderId: string) => {
    setPets((prev) =>
      prev.map((p) => {
        if (p.id === petId) {
          return {
            ...p,
            reminders: (p.reminders || []).filter((r) => r.id !== reminderId),
          };
        }
        return p;
      })
    );
    setEvents((prev) => prev.filter((e) => e.sourceId !== reminderId));
    showToast('Lembrete removido', 'info');
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
          if (isBought) {
            playSoftPop(soundEnabled);
            triggerHaptic('light');
          }
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
      // Check if an existing pantry item has the same normalized name
      setPantryItems((prev) => {
        const normalizedName = item.name.trim().toLowerCase();
        const existing = prev.find((p) => p.name.trim().toLowerCase() === normalizedName);
        if (existing) {
          return prev.map((p) =>
            p.id === existing.id
              ? { ...p, currentQuantity: p.currentQuantity + item.quantity }
              : p
          );
        }
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
        return [...prev, newPantry];
      });
    }

    // Mark as bought and remove from active list
    setShoppingItems((prev) => prev.filter((s) => s.id !== id));
    fireCelebrationConfetti();
    playSuccessChime(soundEnabled);
    triggerHaptic('medium');
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
  const addExpense = (expense: Omit<Expense, 'id'>, totalInstallments: number = 1) => {
    if (totalInstallments > 1) {
      const count = Math.min(Math.max(2, totalInstallments), 24);
      const groupId = 'inst_' + Date.now();
      const perInstallmentAmount = Number((expense.amount / count).toFixed(2));
      const newExpensesList: Expense[] = [];

      for (let i = 1; i <= count; i++) {
        const installmentDate = new Date(expense.date);
        installmentDate.setMonth(installmentDate.getMonth() + (i - 1));

        // Adjust last installment to prevent penny rounding discrepancies
        const installmentAmount =
          i === count
            ? Number((expense.amount - perInstallmentAmount * (count - 1)).toFixed(2))
            : perInstallmentAmount;

        // Custom splits adjusted for installments if exact mode
        let adjustedCustomSplits = expense.customSplits;
        if (expense.splitType === 'exact' && expense.customSplits) {
          adjustedCustomSplits = {};
          for (const [uid, userTotal] of Object.entries(expense.customSplits)) {
            const userPart = Number((userTotal / count).toFixed(2));
            adjustedCustomSplits[uid] =
              i === count
                ? Number((userTotal - userPart * (count - 1)).toFixed(2))
                : userPart;
          }
        }

        newExpensesList.push({
          ...expense,
          id: `exp_${Date.now()}_${i}`,
          description: `${expense.description} (${i}/${count})`,
          amount: installmentAmount,
          date: installmentDate.getTime(),
          customSplits: adjustedCustomSplits,
          installment: {
            current: i,
            total: count,
            groupId,
          },
        });
      }

      setExpenses((prev) => [...newExpensesList, ...prev]);
      playCoinSound(soundEnabled);
      triggerHaptic('medium');
      showToast(`Compra parcelada em ${count}x registrada com sucesso!`, 'success');
      return;
    }

    const newExpense: Expense = {
      ...expense,
      id: 'exp_' + Date.now(),
    };
    setExpenses((prev) => [newExpense, ...prev]);
    playCoinSound(soundEnabled);
    triggerHaptic('medium');
    showToast(`Despesa "${expense.description}" registrada!`, 'success');
  };

  const updateHouseBudget = (budgetUpdate: Partial<HouseBudget>) => {
    setHouse((prev) => {
      const currentBudget: HouseBudget = prev.budget || {
        monthlyTarget: 3800,
        alertThresholdPercent: 80,
        categoryTargets: {
          supermercado: 1500,
          contas: 1200,
          casa: 600,
          pet: 500,
        },
      };
      const updatedBudget: HouseBudget = {
        ...currentBudget,
        ...budgetUpdate,
        categoryTargets: {
          ...(currentBudget.categoryTargets || {}),
          ...(budgetUpdate.categoryTargets || {}),
        },
      };
      return {
        ...prev,
        budget: updatedBudget,
      };
    });
    showToast('Teto orçamentário atualizado!', 'success');
  };

  const toggleExpenseSettled = (id: string) => {
    setExpenses((prev) =>
      prev.map((exp) => {
        if (exp.id === id) {
          const nextState = !exp.isSettled;
          if (nextState) {
            playCoinSound(soundEnabled);
            triggerHaptic('success');
            fireCelebrationConfetti();
          } else {
            triggerHaptic('light');
          }
          return { ...exp, isSettled: nextState };
        }
        return exp;
      })
    );
    showToast('Status da despesa atualizado', 'info');
  };

  const updateExpense = (id: string, updates: Partial<Expense>) => {
    setExpenses((prev) =>
      prev.map((exp) => (exp.id === id ? { ...exp, ...updates } : exp))
    );
    showToast('Despesa atualizada com sucesso', 'success');
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

  const createNewHouse = async (houseName: string, adminName?: string) => {
    const trimmedHouse = houseName.trim() || 'Minha Casa';
    const trimmedAdmin = adminName?.trim() || authUser?.displayName || 'Administrador';
    const uid = authUser?.uid || 'user_' + Date.now();
    const email = authUser?.email || undefined;
    const photo = authUser?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(trimmedAdmin)}`;

    const adminUser: HouseMember = {
      userId: uid,
      displayName: trimmedAdmin,
      email,
      role: 'admin',
      weeklyXP: 0,
      totalXP: 0,
      avatarUrl: photo,
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

    const initialChoresList: Chore[] = [
      { id: 'chore_' + Date.now() + '_1', roomId: initialRoomsList[0].id, title: 'Organizar sala e tirar pó', frequencyDays: 3, lastCompletedAt: Date.now(), lastCompletedBy: { userId: adminUser.userId, displayName: adminUser.displayName }, assignedTo: null, xpReward: 25, urgencyScore: 0, statusLevel: 'clean' },
      { id: 'chore_' + Date.now() + '_2', roomId: initialRoomsList[1].id, title: 'Lavar louça e limpar bancada', frequencyDays: 1, lastCompletedAt: Date.now(), lastCompletedBy: { userId: adminUser.userId, displayName: adminUser.displayName }, assignedTo: null, xpReward: 15, urgencyScore: 0, statusLevel: 'clean' },
      { id: 'chore_' + Date.now() + '_3', roomId: initialRoomsList[3].id, title: 'Higienizar banheiro e box', frequencyDays: 4, lastCompletedAt: Date.now(), lastCompletedBy: { userId: adminUser.userId, displayName: adminUser.displayName }, assignedTo: null, xpReward: 35, urgencyScore: 0, statusLevel: 'clean' },
    ];

    setHouse(newHouse);
    setMembers([adminUser]);
    setCurrentUserId(adminUser.userId);
    setRooms(initialRoomsList);
    setChores(initialChoresList);
    setChoreLogs([]);
    const freshPets = createInitialPets();
    setPets(freshPets);
    setSelectedPetId(freshPets[0].id);
    setPantryItems([]);
    setShoppingItems([]);
    setExpenses([]);
    setEvents([]);
    fireCelebrationConfetti();
    showToast(`Lar "${trimmedHouse}" criado com sucesso!`, 'success');

    // Link user to house in Firestore
    if (authUser) {
      await linkUserToHouse(authUser.uid, newHouse.id, authUser.email || undefined, trimmedAdmin);
    }
    await syncFullHouseToFirestore({
      house: newHouse,
      members: [adminUser],
      rooms: initialRoomsList,
      chores: initialChoresList,
      choreLogs: [],
      pets: freshPets,
      selectedPetId: freshPets[0].id,
      pantryItems: [],
      shoppingItems: [],
      expenses: [],
      events: [],
    });
  };

  const joinHouseWithCode = async (inviteCode: string, memberName?: string): Promise<boolean> => {
    const cleanCode = inviteCode.trim().toUpperCase();
    const displayName = memberName?.trim() || authUser?.displayName || 'Novo Morador';
    const uid = authUser?.uid || 'user_' + Date.now();
    const email = authUser?.email || undefined;
    const avatarUrl = authUser?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(displayName)}`;

    // 1. Try local house first
    if (cleanCode === house.inviteCode.toUpperCase()) {
      const existing = members.find((m) => m.userId === uid || (email && m.email === email));
      if (existing) {
        setCurrentUserId(existing.userId);
        showToast(`Bem-vindo de volta, ${existing.displayName}!`, 'success');
        if (authUser) linkUserToHouse(authUser.uid, house.id, email, displayName);
        return true;
      }
      const newMember: HouseMember = {
        userId: uid,
        displayName,
        email,
        avatarUrl,
        role: 'member',
        weeklyXP: 0,
        totalXP: 0,
        levelTitle: 'Residente',
        level: 1,
      };
      setMembers((prev) => [...prev, newMember]);
      setHouse((prev) => ({ ...prev, members: [...prev.members, newMember] }));
      setCurrentUserId(uid);
      if (authUser) linkUserToHouse(authUser.uid, house.id, email, displayName);
      showToast(`Você ingressou em "${house.name}"!`, 'success');
      return true;
    }

    // 2. Query Firestore by invite code
    try {
      const remote = await findHouseByInviteCodeInFirestore(cleanCode);
      if (remote) {
        const existingInRemote = remote.members.find((m) => m.userId === uid || (email && m.email === email));
        let updatedMembers = [...remote.members];
        if (!existingInRemote) {
          const newMember: HouseMember = {
            userId: uid,
            displayName,
            email,
            avatarUrl,
            role: 'member',
            weeklyXP: 0,
            totalXP: 0,
            levelTitle: 'Residente',
            level: 1,
          };
          updatedMembers.push(newMember);
        }
        setHouse(remote.house);
        setMembers(updatedMembers);
        setCurrentUserId(uid);
        setRooms(remote.rooms);
        setChores(remote.chores);
        setChoreLogs(remote.choreLogs);
        setPets(remote.pets);
        if (remote.selectedPetId) setSelectedPetId(remote.selectedPetId);
        setPantryItems(remote.pantryItems);
        setShoppingItems(remote.shoppingItems);
        setExpenses(remote.expenses);
        setEvents(remote.events);

        if (authUser) {
          await linkUserToHouse(authUser.uid, remote.house.id, email, displayName);
        }
        showToast(`Conectado à residência "${remote.house.name}"!`, 'success');
        return true;
      }
    } catch (e) {
      console.warn('Erro ao buscar casa remota:', e);
    }

    showToast(`Código de convite ${cleanCode} não encontrado.`, 'error');
    return false;
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
      pets,
      selectedPetId,
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
      if (Array.isArray(data.pets) && data.pets.length > 0) {
        setPets(data.pets);
        setSelectedPetId(data.selectedPetId || data.pets[0].id);
      } else if (data.pet) {
        setPets([data.pet]);
        setSelectedPetId(data.pet.id);
      }
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

  const updateMemberProfile = (userId: string, data: Partial<HouseMember>) => {
    setMembers((prev) =>
      prev.map((m) => {
        if (m.userId === userId) {
          return { ...m, ...data };
        }
        return m;
      })
    );
    showToast('Perfil do morador atualizado!', 'success');
  };

  const updateWifiDetails = (wifiSsid: string, wifiPassword: string) => {
    setHouse((prev) => ({
      ...prev,
      wifiSsid,
      wifiPassword,
    }));
    playSoftPop(soundEnabled);
    triggerHaptic('light');
    showToast('Dados de Wi-Fi atualizados!', 'success');
  };

  const addEmergencyContact = (contact: Omit<EmergencyContact, 'id'>) => {
    const newContact: EmergencyContact = {
      ...contact,
      id: 'contact_' + Date.now(),
    };
    setHouse((prev) => ({
      ...prev,
      emergencyContacts: [...(prev.emergencyContacts || []), newContact],
    }));
    playSoftPop(soundEnabled);
    triggerHaptic('light');
    showToast(`Contato "${contact.name}" adicionado!`, 'success');
  };

  const deleteEmergencyContact = (contactId: string) => {
    setHouse((prev) => ({
      ...prev,
      emergencyContacts: (prev.emergencyContacts || []).filter((c) => c.id !== contactId),
    }));
    showToast('Contato removido.', 'info');
  };

  const addHouseNote = (note: Omit<HouseNote, 'id' | 'createdAt'>) => {
    const newNote: HouseNote = {
      ...note,
      id: 'note_' + Date.now(),
      createdAt: Date.now(),
    };
    setHouse((prev) => ({
      ...prev,
      notes: [newNote, ...(prev.notes || [])],
    }));
    playSoftPop(soundEnabled);
    triggerHaptic('medium');
    showToast('Recado fixado no mural!', 'success');
  };

  const deleteHouseNote = (noteId: string) => {
    setHouse((prev) => ({
      ...prev,
      notes: (prev.notes || []).filter((n) => n.id !== noteId),
    }));
    showToast('Recado removido.', 'info');
  };

  const togglePinHouseNote = (noteId: string) => {
    setHouse((prev) => ({
      ...prev,
      notes: (prev.notes || []).map((n) => (n.id === noteId ? { ...n, isPinned: !n.isPinned } : n)),
    }));
  };

  const addHouseReward = (reward: Omit<HouseReward, 'id'>) => {
    const newReward: HouseReward = {
      ...reward,
      id: 'rew_' + Date.now(),
    };
    setHouse((prev) => ({
      ...prev,
      rewards: [...(prev.rewards || []), newReward],
    }));
    playSoftPop(soundEnabled);
    triggerHaptic('light');
    showToast(`Recompensa "${reward.title}" cadastrada!`, 'success');
  };

  const claimHouseReward = (rewardId: string, userId: string) => {
    const reward = (house.rewards || []).find((r) => r.id === rewardId);
    const member = members.find((m) => m.userId === userId);
    if (!reward || !member) return;

    if (member.weeklyXP < reward.requiredXP) {
      showToast(`${member.displayName} precisa de ${reward.requiredXP} XP nesta semana para resgatar.`, 'warning');
      return;
    }

    setHouse((prev) => ({
      ...prev,
      rewards: (prev.rewards || []).map((r) =>
        r.id === rewardId
          ? { ...r, claimedByUserId: userId, claimedAt: Date.now() }
          : r
      ),
    }));
    fireCelebrationConfetti();
    playSuccessChime(soundEnabled);
    triggerHaptic('success');
    showToast(`Parabéns! ${member.displayName} conquistou: ${reward.title}! 🎉`, 'success');
  };

  const deleteHouseReward = (rewardId: string) => {
    setHouse((prev) => ({
      ...prev,
      rewards: (prev.rewards || []).filter((r) => r.id !== rewardId),
    }));
    showToast('Recompensa removida.', 'info');
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
        pantryItems,
        shoppingItems,
        expenses,
        toasts,
        removeToast,
        showToast,
        switchUser,
        updateMemberProfile,
        completeChore,
        addChore,
        resetChoreTimer,
        scoopLitterBox,
        fullChangeLitterBox,
        walkDog,
        bathDog,
        updatePetStock,
        addPetFoodToShopping,
        addPetMedicalRecord,
        logPetCareAction,
        updatePetDutySchedule,
        overrideTodayPetDuty,
        completePetDailyDuty,
        addPetReminder,
        togglePetReminder,
        deletePetReminder,
        addPantryItem,
        updatePantryQuantity,
        deletePantryItem,
        addShoppingItem,
        toggleShoppingItemBought,
        moveShoppingItemToPantry,
        deleteShoppingItem,
        clearBoughtItems,
        addExpense,
        updateExpense,
        toggleExpenseSettled,
        deleteExpense,
        updateHouseBudget,
        events,
        addHouseEvent,
        deleteHouseEvent,
        authUser,
        isAuthLoading,
        isOfflineDemo,
        signInWithGoogle,
        logout,
        bypassAuthToDemo,
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
        updateWifiDetails,
        addEmergencyContact,
        deleteEmergencyContact,
        addHouseNote,
        deleteHouseNote,
        togglePinHouseNote,
        addHouseReward,
        claimHouseReward,
        deleteHouseReward,
        theme,
        setTheme,
        soundEnabled,
        setSoundEnabled,
        vibrationEnabled,
        setVibrationEnabled,
        isFirebaseConnected: isFirebaseConfigured,
        syncToCloudNow,
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
