import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import type { UserProfile as ExtendedUserProfile, Campus } from '@threadloop/shared';
import { supabase, DbUser, DbCampus } from '../lib/supabase';

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
      console.log('Auth0 user data:', JSON.stringify(auth0User, null, 2));

      // Check for email stored during login flow (for SAML users where IdP doesn't send email)
      const pendingEmail = sessionStorage.getItem('pending_auth_email');

      // Extract email from various possible locations in Auth0/SAML response
      // Fall back to the email the user entered before SAML redirect
      let email = auth0User.email
        || auth0User['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress']
        || auth0User.preferred_username
        || auth0User.upn
        || pendingEmail
        || '';

      // Clear the pending email after use
      if (pendingEmail) {
        sessionStorage.removeItem('pending_auth_email');
      }

      // Extract name from various possible locations
      const givenName = auth0User.given_name
        || auth0User['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname']
        || '';
      const familyName = auth0User.family_name
        || auth0User['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname']
        || '';
      const fullName = auth0User.name && auth0User.name.trim()
        ? auth0User.name
        : (givenName && familyName ? `${givenName} ${familyName}` : '')
        || email?.split('@')[0]
        || 'User';

      console.log('Extracted user info:', { email, givenName, familyName, fullName });

      // Determine auth provider and campus based on email domain
      const isSamlUser = auth0User.sub?.startsWith('samlp|') || auth0User.sub?.includes('Stanford-saml');
      const isStanfordUser = auth0User.sub?.includes('Stanford-saml') || email?.endsWith('@stanford.edu');
      const isBerkeleyUser = email?.endsWith('@berkeley.edu');
      const authProvider = isSamlUser ? 'stanford-saml' : 'auth0';

      // Determine campus ID based on email domain or SAML provider
      let campusId = '22222222-2222-2222-2222-222222222222'; // Default to Stanford
      if (isBerkeleyUser) {
        campusId = '33333333-3333-3333-3333-333333333333';
      }

      // Determine badges
      const badges: string[] = ['verified-student'];
      if (isStanfordUser) badges.push('stanford');
      if (isBerkeleyUser) badges.push('berkeley');

      // Try to get existing user from Supabase - first by auth0_id
      let { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('auth0_id', auth0User.sub)
        .maybeSingle();

      // If not found by auth0_id and we have an email, try finding by email
      if (!existingUser && email) {
        const { data: userByEmail, error: emailFetchError } = await supabase
          .from('users')
          .select('*')
          .eq('email', email)
          .maybeSingle();

        if (userByEmail && !emailFetchError) {
          console.log('Found existing user by email, updating auth0_id...');
          existingUser = userByEmail;
          // Update the auth0_id to the new format
          await supabase
            .from('users')
            .update({ auth0_id: auth0User.sub })
            .eq('id', userByEmail.id);
        }
      }

      let dbUser: DbUser;

      if (!existingUser && (!fetchError || fetchError.code === 'PGRST116')) {
        // User doesn't exist, create new user
        // If no email from SAML, generate a unique placeholder based on auth0 sub
        if (!email && isSamlUser) {
          // Create a unique email placeholder using a hash of the sub
          const subHash = auth0User.sub.split('|').pop()?.substring(0, 16) || Date.now().toString();
          email = `stanford-user-${subHash}@stanford.edu`;
          console.log('No email from SAML, using placeholder:', email);
        }

        console.log('Creating new user in Supabase...');
        const { data: newUser, error: insertError } = await supabase
          .from('users')
          .insert({
            auth0_id: auth0User.sub,
            email: email,
            email_verified: auth0User.email_verified || isSamlUser,
            campus_id: campusId,
            display_name: fullName,
            avatar_url: auth0User.picture || null,
            auth_provider: authProvider,
            badges: badges,
            last_login: new Date().toISOString(),
          })
          .select()
          .single();

        if (insertError) {
          console.error('Error creating user:', insertError);
          throw insertError;
        }
        dbUser = newUser;
        console.log('New user created:', dbUser);
      } else if (fetchError) {
        console.error('Error fetching user:', fetchError);
        throw fetchError;
      } else {
        // User exists, update last login
        console.log('Existing user found, updating last login...');
        const { data: updatedUser, error: updateError } = await supabase
          .from('users')
          .update({
            last_login: new Date().toISOString(),
            // Update auth0_id if it changed
            auth0_id: auth0User.sub,
          })
          .eq('id', existingUser.id)
          .select()
          .single();

        if (updateError) {
          console.error('Error updating user:', updateError);
          throw updateError;
        }
        dbUser = updatedUser;
      }

      // Get campus data from Supabase
      const { data: campusData, error: campusError } = await supabase
        .from('campuses')
        .select('*')
        .eq('id', dbUser.campus_id)
        .single();

      if (campusError) {
        console.error('Error fetching campus:', campusError);
      }

      // Convert DB user to app user format
      const appUser: ExtendedUserProfile = {
        id: dbUser.id,
        email: dbUser.email,
        emailVerified: dbUser.email_verified,
        campusId: dbUser.campus_id || '',
        displayName: dbUser.display_name,
        avatarUrl: dbUser.avatar_url || undefined,
        bio: dbUser.bio || undefined,
        authProvider: dbUser.auth_provider as any,
        lastLogin: new Date(dbUser.last_login),
        createdAt: new Date(dbUser.created_at),
        rating: Number(dbUser.rating) || 0,
        totalRatings: dbUser.total_ratings,
        swapCount: dbUser.swap_count,
        successfulSwaps: dbUser.successful_swaps,
        badges: dbUser.badges as any[],
        swapStreak: dbUser.swap_streak,
        averageResponseTime: dbUser.average_response_time,
        responseRate: Number(dbUser.response_rate) || 0,
        styleVibes: dbUser.style_vibes as any[],
        favoriteColors: dbUser.favorite_colors,
        sizingProfile: dbUser.sizing_profile || {},
        settings: dbUser.settings as any || {
          showProfile: true,
          allowMessages: true,
          shareStylePreferences: true,
          emailNotifications: true,
          pushNotifications: true
        }
      };

      setUser(appUser);

      // Convert DB campus to app campus format
      if (campusData) {
        const appCampus: Campus = {
          id: campusData.id,
          name: campusData.name,
          emailDomains: campusData.email_domains,
          location: campusData.location,
          lockerLocations: campusData.locker_locations || [],
          safeZones: campusData.safe_zones || []
        };
        setCampus(appCampus);
      }
    } catch (error) {
      console.error('Failed to sync user to backend:', error);
      // Don't set a fallback user with invalid ID - this prevents broken DB queries
      // The user will need to log in again or we need to fix the data issue
      setUser(null);

      // Show a user-friendly error message
      console.error('Unable to sync user. You may need to log out and log in again, or contact support if the issue persists.');
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
    const updatedUser = {
      ...user,
      styleVibes: profile.styleVibes as any,
      favoriteColors: profile.favoriteColors,
      sizingProfile: profile.sizingProfile || {}
    };
    setUser(updatedUser);

    // Mark quiz as completed
    localStorage.setItem('completed_style_quiz', 'true');

    // Save to Supabase
    try {
      const { error } = await supabase
        .from('users')
        .update({
          style_vibes: profile.styleVibes,
          favorite_colors: profile.favoriteColors,
          sizing_profile: profile.sizingProfile || {},
        })
        .eq('id', user.id);

      if (error) {
        console.error('Error saving style profile to Supabase:', error);
      } else {
        console.log('Style profile saved to Supabase');
      }
    } catch (error) {
      console.error('Failed to save style profile:', error);
    }
  };

  const updateProfile = async (updates: { displayName?: string; bio?: string; avatarUrl?: string }) => {
    if (!user) return;

    // Update local state
    setUser({
      ...user,
      ...updates
    });

    // Save to Supabase
    try {
      const dbUpdates: Record<string, any> = {};
      if (updates.displayName !== undefined) dbUpdates.display_name = updates.displayName;
      if (updates.bio !== undefined) dbUpdates.bio = updates.bio;
      if (updates.avatarUrl !== undefined) dbUpdates.avatar_url = updates.avatarUrl;

      const { error } = await supabase
        .from('users')
        .update(dbUpdates)
        .eq('id', user.id);

      if (error) {
        console.error('Error saving profile to Supabase:', error);
      } else {
        console.log('Profile saved to Supabase');
      }
    } catch (error) {
      console.error('Failed to save profile:', error);
    }
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
