import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager 
} from 'firebase/firestore';
import { GoogleAuthProvider, getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyCHR7AhHUc0iUb1iDAHzn_tazv9tbHNU-I',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'domus-db812.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'domus-db812',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'domus-db812.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '647692589493',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:647692589493:web:dce94f22d461cf5f18a1fc',
};

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  firebaseConfig.apiKey !== 'YOUR_API_KEY'
);

let app;
let db: any;
let auth: any;

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    try {
      db = initializeFirestore(app, {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager()
        })
      });
    } catch {
      db = getFirestore(app);
    }
    auth = getAuth(app);
  } catch (error) {
    console.warn('Firebase initialization failed, falling back to local offline store:', error);
  }
}

export { app, db, auth };
