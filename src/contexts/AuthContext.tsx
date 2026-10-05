import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithCredential,
  GoogleAuthProvider,
  signOut,
  signInAnonymously,
} from 'firebase/auth';
import { Capacitor } from '@capacitor/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { auth, db } from '../firebase/config';
import { roleAtLeast, roleFromClaims } from '../utils/roles';
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

  const hasRole = (requiredRole: UserRole): boolean => roleAtLeast(user?.role, requiredRole);

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

      // The role is taken from the ID token's custom claims, never from the
      // profile document, so a user cannot promote themselves.
      let role: UserRole = 'COLLECTOR';
      try {
        role = roleFromClaims((await firebaseUser.getIdTokenResult()).claims);
      } catch (e) {
        console.warn('Could not read role claims; using COLLECTOR:', e);
      }

      try {
        if (!db) throw new Error('Firestore unavailable');
        const ref = doc(db, 'users', firebaseUser.uid);
        const userDoc = await getDoc(ref);
        if (userDoc.exists()) {
          setFirebaseProfile({ ...(userDoc.data() as UserProfile), role });
        } else {
          // Security rules only accept new profiles with the base role.
          await setDoc(ref, fallback);
          setFirebaseProfile({ ...fallback, role });
        }
      } catch (e) {
        console.error('Profile sync failed, using local profile:', e);
        setFirebaseProfile({ ...fallback, role });
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
    if (Capacitor.isNativePlatform()) {
      // Popups don't work in the Android WebView: sign in natively, then hand
      // the Google ID token to the Firebase JS SDK (skipNativeAuth in capacitor.config.ts).
      const result = await FirebaseAuthentication.signInWithGoogle();
      const idToken = result.credential?.idToken;
      if (!idToken) throw new Error('Google sign-in returned no ID token');
      await signInWithCredential(auth, GoogleAuthProvider.credential(idToken));
      return;
    }
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
      if (Capacitor.isNativePlatform()) await FirebaseAuthentication.signOut();
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
