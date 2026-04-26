import React, { createContext, useContext, useState, useEffect } from 'react';
import type { UserProfile, UserRole } from '../types';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Helper to check role hierarchy
  const hasRole = (requiredRole: UserRole): boolean => {
    if (!user) return false;
    const roles: UserRole[] = ['COLLECTOR', 'IDENTIFIER', 'CURATOR', 'ADMIN'];
    const userRoleIndex = roles.indexOf(user.role);
    const requiredRoleIndex = roles.indexOf(requiredRole);
    return userRoleIndex >= requiredRoleIndex;
  };

  useEffect(() => {
    // Mocking auth check with full profile
    const mockUser: UserProfile = {
      id: '1',
      email: 'dr.fungi@university.edu',
      displayName: 'Dr. Fungi',
      role: 'CURATOR',
      institutionalAffiliation: 'National Herbarium',
      orcidId: '0000-0002-1825-0097',
      specialization: ['Agaricales', 'Microscopy'],
      joinedAt: new Date(),
    };

    setTimeout(() => {
      setUser(mockUser);
      setLoading(false);
    }, 1000);
  }, []);

  const login = async (email: string) => {
    // Simulate ORCID/SSO login
    setUser({
      id: Math.random().toString(),
      email,
      displayName: email.split('@')[0],
      role: 'COLLECTOR',
      joinedAt: new Date(),
    });
  };

  const logout = async () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
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
