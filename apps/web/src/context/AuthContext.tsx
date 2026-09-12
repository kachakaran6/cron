import React, { createContext, useContext, useState, useEffect } from 'react';

export interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (name: string, email: string, pass: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('samast_cron_auth');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return null; }
    }
    return { id: 'usr_default_1', email: 'admin@samast.pro', name: 'Infrastructure Admin' };
  });

  const login = async (email: string, pass: string) => {
    const mockUser: User = {
      id: 'usr_' + Date.now(),
      email,
      name: email.split('@')[0] || 'User',
    };
    setUser(mockUser);
    localStorage.setItem('samast_cron_auth', JSON.stringify(mockUser));
  };

  const register = async (name: string, email: string, pass: string) => {
    const newUser: User = {
      id: 'usr_' + Date.now(),
      email,
      name: name || email.split('@')[0],
    };
    setUser(newUser);
    localStorage.setItem('samast_cron_auth', JSON.stringify(newUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('samast_cron_auth');
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
