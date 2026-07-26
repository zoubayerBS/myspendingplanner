import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import {
  AuthUser,
  UserProfile,
  signin,
  signup,
  getUserProfile,
  getSavedUser,
  clearAuth,
} from '../db/auth';

interface AuthContextType {
  user: AuthUser | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name: string) => Promise<{ ok: boolean; needsActivation?: boolean }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  error: null,
  login: async () => false,
  register: async () => ({ ok: false }),
  logout: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = getSavedUser();
    if (saved) {
      getUserProfile(saved.id)
        .then((p) => {
          if (p && p.isActive) {
            setUser(saved);
            setProfile(p);
          } else {
            clearAuth();
          }
        })
        .catch(() => {
          clearAuth();
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setError(null);
    try {
      const u = await signin(email, password);
      setUser(u);
      const p = await getUserProfile(u.id);
      setProfile(p);
      return true;
    } catch (e: any) {
      setError(e.message || 'Erreur de connexion');
      return false;
    }
  };

  const register = async (email: string, password: string, name: string): Promise<{ ok: boolean; needsActivation?: boolean }> => {
    setError(null);
    try {
      await signup(email, password, name);
      return { ok: true, needsActivation: true };
    } catch (e: any) {
      setError(e.message || "Erreur d'inscription");
      return { ok: false };
    }
  };

  const logout = () => {
    clearAuth();
    setUser(null);
    setProfile(null);
    setError(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, error, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
