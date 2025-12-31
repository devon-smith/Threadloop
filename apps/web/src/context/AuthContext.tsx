import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { UserProfile as ExtendedUserProfile, Campus } from '@threadloop/shared';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  (import.meta.env.PROD ? `${window.location.origin}/api` : 'http://localhost:4000');

type AuthContextType = {
  user: ExtendedUserProfile | null;
  campus: Campus | null;
  sessionId: string | null;
  isLoading: boolean;
  login: (email?: string) => Promise<{ success: boolean; error?: string }>;
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

async function readJsonResponse(response: Response) {
  const contentType = response.headers.get('content-type') ?? '';
  const text = await response.text();

  if (!contentType.includes('application/json')) {
    throw new Error(`Non-JSON response (HTTP ${response.status}). ${text ? text.slice(0, 200) : ''}`);
  }

  try {
    return text ? JSON.parse(text) : null;
  } catch {
    throw new Error(`Failed to parse JSON response (HTTP ${response.status}).`);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ExtendedUserProfile | null>(null);
  const [campus, setCampus] = useState<Campus | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from server-side session on mount
  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, { credentials: 'include' });

      const data = await readJsonResponse(response);
      if (data.success && data.data) {
        setUser(data.data);
        setSessionId('active');

        // Fetch campus info
        const campusResponse = await fetch(`${API_BASE_URL}/auth/campuses`, { credentials: 'include' });
        const campusData = await readJsonResponse(campusResponse);
        if (campusData.success) {
          const userCampus = campusData.data.find((c: Campus) => c.id === data.data.campusId);
          if (userCampus) setCampus(userCampus);
        }
      } else {
        setUser(null);
        setCampus(null);
        setSessionId(null);
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
      setUser(null);
      setCampus(null);
      setSessionId(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (_email?: string) => {
    // Redirect-based login via Auth0
    window.location.href = `${API_BASE_URL}/auth/login`;
    return { success: true };
  };

  const logout = async () => {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, { method: 'POST', credentials: 'include' });
    } catch (error) {
      console.error('Logout error:', error);
    }

    setUser(null);
    setCampus(null);
    setSessionId(null);
  };

  const updateStyleProfile = async (profile: AuthContextType['updateStyleProfile'] extends (arg: infer P) => any ? P : never) => {
    const response = await fetch(`${API_BASE_URL}/auth/style-profile`, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(profile)
    });

    const data = await readJsonResponse(response);
    if (data.success && data.data) {
      setUser(data.data);
    }
  };

  const updateProfile = async (updates: { displayName?: string; bio?: string; avatarUrl?: string }) => {
    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updates)
    });

    const data = await readJsonResponse(response);
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
