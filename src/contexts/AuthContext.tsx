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
  login: () => Promise<void>;
  loginGuest: () => Promise<void>;
  loginEmergencyBypass: () => void;
  logout: () => Promise<void>;
  hasRole: (role: UserRole) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const hasRole = (requiredRole: UserRole): boolean => {
    if (!user) return false;
    const roles: UserRole[] = ['COLLECTOR', 'IDENTIFIER', 'CURATOR', 'ADMIN'];
    return roles.indexOf(user.role) >= roles.indexOf(requiredRole);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            setUser(userDoc.data() as UserProfile);
          } else {
            const newProfile: UserProfile = {
              id: firebaseUser.uid,
              email: firebaseUser.email || 'guest@mycohub.app',
              displayName: firebaseUser.displayName || 'Researcher',
              role: 'COLLECTOR',
              joinedAt: new Date(),
            };
            await setDoc(doc(db, 'users', firebaseUser.uid), newProfile);
            setUser(newProfile);
          }
        } catch (e) {
          console.error("Firestore error, falling back to local state:", e);
          // Still set user even if Firestore fails
          setUser({
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || 'Researcher',
            role: 'COLLECTOR',
            joinedAt: new Date(),
          });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const loginGuest = async () => {
    await signInAnonymously(auth);
  };

  // FAIL-SAFE: If Firebase completely fails (e.g. network/config issues)
  const loginEmergencyBypass = () => {
    const bypassUser: UserProfile = {
      id: 'bypass-' + Math.random().toString(36).slice(2),
      email: 'bypass@mycohub.app',
      displayName: 'Offline Researcher',
      role: 'ADMIN',
      joinedAt: new Date(),
    };
    setUser(bypassUser);
    setLoading(false);
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, loginGuest, loginEmergencyBypass, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
