import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  User 
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, googleProvider, db, isFirebaseConfigured } from './firebase';

export interface AuthResult {
  success: boolean;
  user?: User;
  error?: string;
}

export interface UserHouseMapping {
  userId: string;
  houseId: string;
  email?: string;
  displayName?: string;
  updatedAt: number;
}

/**
 * Trigger Google OAuth popup sign-in
 */
export async function loginWithGoogle(): Promise<AuthResult> {
  if (!isFirebaseConfigured || !auth) {
    return {
      success: false,
      error: 'Firebase não está configurado ou inicializado.',
    };
  }

  try {
    const result = await signInWithPopup(auth, googleProvider);
    return {
      success: true,
      user: result.user,
    };
  } catch (err: any) {
    console.error('Erro no login com Google:', err);
    let message = 'Falha ao autenticar com o Google.';
    if (err.code === 'auth/popup-closed-by-user') {
      message = 'Janela de login fechada antes da conclusão.';
    } else if (err.code === 'auth/cancelled-popup-request') {
      message = 'Requisição de login cancelada.';
    } else if (err.code === 'auth/network-request-failed') {
      message = 'Falha de rede. Verifique sua conexão com a internet.';
    } else if (err.code === 'auth/unauthorized-domain') {
      message = 'Domínio atual não autorizado no console do Firebase. Adicione localhost / vercel.app nos domínios autorizados do Firebase Auth.';
    } else if (err.message) {
      message = err.message;
    }
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Sign out current authenticated user
 */
export async function logoutFromGoogle(): Promise<boolean> {
  if (!auth) return false;
  try {
    await signOut(auth);
    return true;
  } catch (err) {
    console.error('Erro ao sair da conta:', err);
    return false;
  }
}

/**
 * Listen for real-time authentication state changes
 */
export function listenToAuthChanges(
  callback: (user: User | null) => void
): (() => void) {
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}

/**
 * Associate a user's Google UID with a specific house in Firestore
 */
export async function linkUserToHouse(
  userId: string,
  houseId: string,
  email?: string,
  displayName?: string
): Promise<boolean> {
  if (!isFirebaseConfigured || !db) return false;

  try {
    const userDocRef = doc(db, 'users', userId);
    await setDoc(
      userDocRef,
      {
        userId,
        houseId,
        email: email || '',
        displayName: displayName || '',
        updatedAt: Date.now(),
      },
      { merge: true }
    );
    return true;
  } catch (err) {
    console.warn('Falha ao associar usuário ao lar no Firestore:', err);
    return false;
  }
}

/**
 * Retrieve user's linked houseId from Firestore
 */
export async function getUserHouseId(userId: string): Promise<string | null> {
  if (!isFirebaseConfigured || !db) return null;

  try {
    const userDocRef = doc(db, 'users', userId);
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      const data = snap.data() as UserHouseMapping;
      return data.houseId || null;
    }
    return null;
  } catch (err) {
    console.warn('Falha ao buscar lar do usuário no Firestore:', err);
    return null;
  }
}
