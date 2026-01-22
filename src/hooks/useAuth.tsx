/**
 * Authentication Hook
 * Provides user authentication state and methods
 */

import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

export type UserLevel = 'level_1' | 'level_2' | 'level_3' | 'level_4';

export interface UserProfile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  level: UserLevel;
  ai_uses_remaining: number;
  total_calculations: number;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  canUseAI: boolean;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  consumeAIUse: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      // Type assertion needed because profiles table is new and not in generated types yet
      const { data, error } = await (supabase as any)
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      if (data) {
        setProfile({
          id: data.id,
          user_id: data.user_id,
          display_name: data.display_name,
          avatar_url: data.avatar_url,
          level: data.level as UserLevel,
          ai_uses_remaining: data.ai_uses_remaining,
          total_calculations: data.total_calculations,
          created_at: data.created_at,
          updated_at: data.updated_at,
        });
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setProfile(null);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user?.id) {
      await fetchProfile(user.id);
    }
  }, [user?.id, fetchProfile]);

  // Initialize auth state
  useEffect(() => {
    // Set up auth state listener BEFORE checking session
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Use setTimeout to avoid Supabase deadlock
          setTimeout(() => fetchProfile(session.user.id), 0);
        } else {
          setProfile(null);
        }

        if (event === 'SIGNED_OUT') {
          setProfile(null);
        }
      }
    );

    // Check existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signUp = useCallback(async (email: string, password: string, displayName?: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            display_name: displayName || email.split('@')[0],
          },
        },
      });
      return { error };
    } catch (err) {
      return { error: err as Error };
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error };
    } catch (err) {
      return { error: err as Error };
    }
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
  }, []);

  const consumeAIUse = useCallback(async (): Promise<boolean> => {
    if (!user) return false;

    try {
      // Type assertion needed because function is new and not in generated types yet
      const { data, error } = await (supabase as any).rpc('consume_ai_use', {
        p_user_id: user.id,
      });

      if (error) throw error;

      // Refresh profile to get updated count
      await refreshProfile();
      return data as boolean;
    } catch (err) {
      console.error('Error consuming AI use:', err);
      return false;
    }
  }, [user, refreshProfile]);

  const canUseAI = profile?.level === 'level_4' || 
    (profile?.level === 'level_3' && (profile?.ai_uses_remaining ?? 0) > 0) ||
    (profile?.level === 'level_2' && (profile?.ai_uses_remaining ?? 0) > 0);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isLoading,
        isAuthenticated: !!user,
        canUseAI,
        signUp,
        signIn,
        signOut,
        refreshProfile,
        consumeAIUse,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default useAuth;
