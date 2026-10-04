import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  signInAnonymously,
} from 'firebase/auth';
import { auth, db } from '../firebase/config';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import type { UserProfile, UserRole } from '../types';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  isOffline: boolean;
  login: () => Promise<void>;
  loginGuest: () => Promise<void>;
  loginEmergencyBypass: () => void;
  logout: () => Promise<void>;
  hasRole: (role: UserRole) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const OFFLINE_KEY = 'mycohub.offlineUser';
// If Firebase never answers (blocked network, bad config), stop waiting after this long.
const AUTH_TIMEOUT_MS = 6000;
const ROLE_ORDER: UserRole[] = ['COLLECTOR', 'IDENTIFIER', 'CURATOR', 'ADMIN'];

const readOfflineUser = (): UserProfile | null => {
  try {
    const raw = localStorage.getItem(OFFLINE_KEY);
    return raw ? (JSON.parse(raw) as UserProfile) : null;
  } catch {
    return null;
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [offlineUser, setOfflineUser] = useState<UserProfile | null>(readOfflineUser);
  const [firebaseProfile, setFirebaseProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(() => !!auth && !readOfflineUser());

  // A Firebase account always wins over a local offline session.
  const user = firebaseProfile ?? offlineUser;

  const hasRole = (requiredRole: UserRole): boolean => {
    if (!user) return false;
    return ROLE_ORDER.indexOf(user.role) >= ROLE_ORDER.indexOf(requiredRole);
  };

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const timeout = setTimeout(() => setLoading(false), AUTH_TIMEOUT_MS);

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setFirebaseProfile(null);
        clearTimeout(timeout);
        setLoading(false);
        return;
      }

      const fallback: UserProfile = {
        id: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: firebaseUser.displayName || (firebaseUser.isAnonymous ? 'Guest Researcher' : 'Researcher'),
        role: 'COLLECTOR',
        joinedAt: new Date(),
      };

      try {
        if (!db) throw new Error('Firestore unavailable');
        const ref = doc(db, 'users', firebaseUser.uid);
        const userDoc = await getDoc(ref);
        if (userDoc.exists()) {
          setFirebaseProfile(userDoc.data() as UserProfile);
        } else {
          await setDoc(ref, fallback);
          setFirebaseProfile(fallback);
        }
      } catch (e) {
        console.error('Profile sync failed, using local profile:', e);
        setFirebaseProfile(fallback);
      }
      clearTimeout(timeout);
      setLoading(false);
    });

    return () => {
      clearTimeout(timeout);
      unsubscribe();
    };
  }, []);

  const login = async () => {
    if (!auth) throw new Error('Firebase Auth is not available');
    await signInWithPopup(auth, new GoogleAuthProvider());
  };

  const loginGuest = async () => {
    if (!auth) throw new Error('Firebase Auth is not available');
    await signInAnonymously(auth);
  };

  // Local-only session for when the cloud is unreachable. Records stay on this device.
  const loginEmergencyBypass = () => {
    const localUser: UserProfile = offlineUser ?? {
      id: 'local-' + Date.now(),
      email: '',
      displayName: 'Local Researcher',
      role: 'COLLECTOR',
      joinedAt: new Date(),
    };
    try {
      localStorage.setItem(OFFLINE_KEY, JSON.stringify(localUser));
    } catch {
      // Storage blocked: the session lasts until the page is closed.
    }
    setOfflineUser(localUser);
    setLoading(false);
  };

  const logout = async () => {
    try {
      if (auth?.currentUser) await signOut(auth);
    } catch (e) {
      console.error('Sign-out failed:', e);
    }
    try {
      localStorage.removeItem(OFFLINE_KEY);
    } catch {
      // ignore
    }
    setFirebaseProfile(null);
    setOfflineUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isOffline: !firebaseProfile && !!offlineUser,
        login,
        loginGuest,
        loginEmergencyBypass,
        logout,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
