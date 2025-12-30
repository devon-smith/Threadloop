import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { UserProfile as ExtendedUserProfile, Campus } from '@threadloop/shared';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000';

type AuthContextType = {
  user: ExtendedUserProfile | null;
  campus: Campus | null;
  sessionId: string | null;
  isLoading: boolean;
  login: (email: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateStyleProfile: (profile: {
    styleVibes: string[];
    favoriteColors: string[];
    sizingProfile?: {
      topSize?: string;
      bottomSize?: string;
      shoeSize?: string;
      dressSize?: string;
    };
  }) => Promise<void>;
  updateProfile: (updates: { displayName?: string; bio?: string; avatarUrl?: string }) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ExtendedUserProfile | null>(null);
  const [campus, setCampus] = useState<Campus | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load session from localStorage on mount
  useEffect(() => {
    const storedSessionId = localStorage.getItem('threadloop_session');
    if (storedSessionId) {
      fetchCurrentUser(storedSessionId);
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchCurrentUser = async (sessionId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${sessionId}`
        }
      });

      const data = await response.json();
      if (data.success && data.data) {
        setUser(data.data);
        setSessionId(sessionId);

        // Fetch campus info
        const campusResponse = await fetch(`${API_BASE_URL}/auth/campuses`);
        const campusData = await campusResponse.json();
        if (campusData.success) {
          const userCampus = campusData.data.find((c: Campus) => c.id === data.data.campusId);
          if (userCampus) setCampus(userCampus);
        }
      } else {
        localStorage.removeItem('threadloop_session');
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
      localStorage.removeItem('threadloop_session');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (data.success && data.data) {
        setUser(data.data.user);
        setCampus(data.data.campus);
        setSessionId(data.data.sessionId);
        localStorage.setItem('threadloop_session', data.data.sessionId);
        return { success: true };
      } else {
        return { success: false, error: data.error || 'Login failed' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const logout = async () => {
    if (sessionId) {
      try {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${sessionId}`
          }
        });
      } catch (error) {
        console.error('Logout error:', error);
      }
    }

    setUser(null);
    setCampus(null);
    setSessionId(null);
    localStorage.removeItem('threadloop_session');
  };

  const updateStyleProfile = async (profile: AuthContextType['updateStyleProfile'] extends (arg: infer P) => any ? P : never) => {
    if (!sessionId) throw new Error('Not authenticated');

    const response = await fetch(`${API_BASE_URL}/auth/style-profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sessionId}`
      },
      body: JSON.stringify(profile)
    });

    const data = await response.json();
    if (data.success && data.data) {
      setUser(data.data);
    }
  };

  const updateProfile = async (updates: { displayName?: string; bio?: string; avatarUrl?: string }) => {
    if (!sessionId) throw new Error('Not authenticated');

    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sessionId}`
      },
      body: JSON.stringify(updates)
    });

    const data = await response.json();
    if (data.success && data.data) {
      setUser(data.data);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        campus,
        sessionId,
        isLoading,
        login,
        logout,
        updateStyleProfile,
        updateProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
