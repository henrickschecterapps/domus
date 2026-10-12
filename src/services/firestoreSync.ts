import { db, isFirebaseConfigured } from './firebase';
import { doc, getDoc, setDoc, onSnapshot, collection, query, where, getDocs } from 'firebase/firestore';
import { House, HouseMember, Room, Chore, ChoreLog, Pet, PantryItem, ShoppingItem, Expense, HouseEvent } from '../types';

export interface CloudHouseData {
  house: House;
  members: HouseMember[];
  rooms: Room[];
  chores: Chore[];
  choreLogs: ChoreLog[];
  pets: Pet[];
  selectedPetId?: string;
  pantryItems: PantryItem[];
  shoppingItems: ShoppingItem[];
  expenses: Expense[];
  events: HouseEvent[];
  updatedAt: number;
}

/**
 * Recursively cleans undefined fields from objects/arrays so Firestore never rejects payloads
 */
export function sanitizeForFirestore<T>(data: T): T {
  try {
    return JSON.parse(JSON.stringify(data));
  } catch (err) {
    console.error('Failed to sanitize data for Firestore:', err);
    return data;
  }
}

/**
 * Uploads full state snapshot to Firestore under houses/{houseId}
 */
export async function syncFullHouseToFirestore(data: Omit<CloudHouseData, 'updatedAt'>): Promise<boolean> {
  if (!isFirebaseConfigured || !db || !data?.house?.id) return false;

  try {
    const houseDocRef = doc(db, 'houses', data.house.id);
    const cleanPayload = sanitizeForFirestore({
      ...data,
      updatedAt: Date.now(),
    });

    await setDoc(houseDocRef, cleanPayload, { merge: true });
    return true;
  } catch (error) {
    console.warn('Firestore sync failed, local-first mode retained:', error);
    return false;
  }
}

/**
 * Subscribes to real-time updates for a specific house
 */
export function subscribeToCloudHouse(
  houseId: string,
  onRemoteUpdate: (data: CloudHouseData) => void
): (() => void) | null {
  if (!isFirebaseConfigured || !db) return null;

  try {
    const houseDocRef = doc(db, 'houses', houseId);
    const unsubscribe = onSnapshot(
      houseDocRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const remoteData = snapshot.data() as CloudHouseData;
          onRemoteUpdate(remoteData);
        }
      },
      (error) => {
        console.warn('Firestore snapshot error (using offline state):', error);
      }
    );
    return unsubscribe;
  } catch (error) {
    console.warn('Failed to subscribe to Cloud House:', error);
    return null;
  }
}

/**
 * Loads a house by invite code from Firestore
 */
export async function findHouseByInviteCodeInFirestore(inviteCode: string): Promise<CloudHouseData | null> {
  if (!isFirebaseConfigured || !db) return null;

  try {
    const cleanCode = inviteCode.trim().toUpperCase();
    const housesRef = collection(db, 'houses');
    const q = query(housesRef, where('house.inviteCode', '==', cleanCode));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      return querySnapshot.docs[0].data() as CloudHouseData;
    }
    return null;
  } catch (error) {
    console.warn('Firestore query by invite code failed:', error);
    return null;
  }
}

/**
 * Loads a house directly by houseId from Firestore
 */
export async function fetchHouseByIdFromFirestore(houseId: string): Promise<CloudHouseData | null> {
  if (!isFirebaseConfigured || !db || !houseId) return null;

  try {
    const houseDocRef = doc(db, 'houses', houseId);
    const snap = await getDoc(houseDocRef);
    if (snap.exists()) {
      return snap.data() as CloudHouseData;
    }
    return null;
  } catch (error) {
    console.warn('Firestore fetch by houseId failed:', error);
    return null;
  }
}
