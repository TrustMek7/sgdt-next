'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface User {
  id: string | number;
  email: string;
  name?: string;
  role?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // on mount, check existing session
    checkAuth();

    // listen for auth changes (login/logout)
    const { data: listener } = supabase?.auth.onAuthStateChange((_, session) => {
      if (session?.user) {
        const u = session.user;
        setIsAuthenticated(true);
        setUser({ id: u.id, email: u.email ?? '', name: u.user_metadata?.name });
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
    }) ?? { data: null };

    return () => {
      if (listener && typeof listener.subscription?.unsubscribe === 'function') {
        listener.subscription.unsubscribe();
      }
    };
  }, []);

  const checkAuth = async () => {
    setLoading(true);
    try {
      const { data } = await supabase!.auth.getSession();
      const session = data.session;
      if (session?.user) {
        const u = session.user;
        setIsAuthenticated(true);
        setUser({ id: u.id, email: u.email ?? '', name: u.user_metadata?.name });
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch (err) {
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    setLoading(true);
    try {
      const result = await supabase!.auth.signInWithPassword({ email, password });
      if (result.error) {
        return false;
      }
      if (result.data.session?.user) {
        const u = result.data.session.user;
        setIsAuthenticated(true);
        setUser({ id: u.id, email: u.email ?? '', name: u.user_metadata?.name });
        return true;
      }
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await supabase!.auth.signOut();
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, loading, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
