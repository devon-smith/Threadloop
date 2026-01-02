import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import type { UserProfile as ExtendedUserProfile, Campus } from '@threadloop/shared';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  (import.meta.env.PROD ? `${window.location.origin}/api` : 'http://localhost:4000');

type AuthContextType = {
  user: ExtendedUserProfile | null;
  campus: Campus | null;
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user: auth0User, isAuthenticated, isLoading: auth0Loading, getAccessTokenSilently } = useAuth0();
  const [user, setUser] = useState<ExtendedUserProfile | null>(null);
  const [campus, setCampus] = useState<Campus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Sync Auth0 user to our backend when authenticated
  useEffect(() => {
    if (!auth0Loading) {
      if (isAuthenticated && auth0User) {
        syncUserToBackend(auth0User);
      } else {
        setUser(null);
        setCampus(null);
        setIsLoading(false);
      }
    }
  }, [isAuthenticated, auth0User, auth0Loading]);

  const syncUserToBackend = async (auth0User: any) => {
    try {
      console.log('Auth0 user:', auth0User);

      // Create or update user in backend (will eventually be Supabase)
      const email = auth0User.email;

      // For now, create a mock user profile from Auth0 data
      // TODO: Replace with actual backend API call
      const mockUser: ExtendedUserProfile = {
        id: auth0User.sub || '',
        email: email || '',
        emailVerified: auth0User.email_verified || false,
        campusId: '22222222-2222-2222-2222-222222222222', // Default to Stanford
        displayName: auth0User.name || email?.split('@')[0] || 'User',
        authProvider: 'auth0',
        lastLogin: new Date(),
        createdAt: new Date(),
        rating: 0,
        totalRatings: 0,
        swapCount: 0,
        successfulSwaps: 0,
        badges: ['verified-student'],
        swapStreak: 0,
        averageResponseTime: 0,
        responseRate: 0,
        styleVibes: [],
        favoriteColors: [],
        sizingProfile: {},
        settings: {
          showProfile: true,
          allowMessages: true,
          shareStylePreferences: true,
          emailNotifications: true,
          pushNotifications: true
        }
      };

      setUser(mockUser);

      // Mock campus data - TODO: Get from backend based on email domain
      const mockCampus: Campus = {
        id: '22222222-2222-2222-2222-222222222222',
        name: 'Stanford University',
        emailDomains: ['stanford.edu'],
        location: {
          city: 'Stanford',
          state: 'CA',
          coordinates: { lat: 37.4275, lng: -122.1697 }
        },
        lockerLocations: [],
        safeZones: []
      };

      setCampus(mockCampus);
    } catch (error) {
      console.error('Failed to sync user to backend:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (_email?: string) => {
    // Auth0 login is handled by Login.tsx via loginWithRedirect
    return { success: true };
  };

  const logout = async () => {
    // Auth0 logout is handled by useAuth0().logout()
    setUser(null);
    setCampus(null);
  };

  const updateStyleProfile = async (profile: AuthContextType['updateStyleProfile'] extends (arg: infer P) => any ? P : never) => {
    if (!user) return;

    // Update local state immediately
    setUser({
      ...user,
      styleVibes: profile.styleVibes as any,
      favoriteColors: profile.favoriteColors,
      sizingProfile: profile.sizingProfile || {}
    });

    // Mark quiz as completed
    localStorage.setItem('completed_style_quiz', 'true');

    // TODO: Send to backend/Supabase
    console.log('Style profile updated:', profile);
  };

  const updateProfile = async (updates: { displayName?: string; bio?: string; avatarUrl?: string }) => {
    if (!user) return;

    // Update local state
    setUser({
      ...user,
      ...updates
    });

    // TODO: Send to backend/Supabase
    console.log('Profile updated:', updates);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        campus,
        isLoading: auth0Loading || isLoading,
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
