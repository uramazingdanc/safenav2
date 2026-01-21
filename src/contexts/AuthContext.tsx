import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type UserRole = 'admin' | 'moderator' | 'user';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  userRole: UserRole | null;
  isAdmin: boolean;
  signUp: (email: string, password: string, metadata?: { full_name?: string; phone_number?: string; barangay?: string }) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<UserRole | null>(null);

  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching user role:', error);
        return null;
      }

      const roles = (data ?? []).map((r) => r.role as UserRole);

      if (roles.includes('admin')) return 'admin';
      if (roles.includes('moderator')) return 'moderator';
      return 'user';
    } catch (err) {
      console.error('Error in fetchUserRole:', err);
      return null;
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);

        const shouldRefetchRole = event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'PASSWORD_RECOVERY';
        setSession(session);
        setUser(session?.user ?? null);

        if (shouldRefetchRole) {
          // IMPORTANT: when signing in (or similar), role is unknown until fetched.
          // Otherwise UI can redirect using a stale role.
          setLoading(true);
          setUserRole(null);
        }
        
        // Defer role fetch with setTimeout to prevent deadlock
        if (shouldRefetchRole && session?.user) {
          setTimeout(async () => {
            const role = await fetchUserRole(session.user.id);
            console.log('User role fetched:', role);
            setUserRole(role);
            setLoading(false);
          }, 0);
        } else if (!session?.user) {
          setUserRole(null);
          setLoading(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      console.log('Existing session check:', session?.user?.email);
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        const role = await fetchUserRole(session.user.id);
        console.log('Initial role fetched:', role);
        setUserRole(role);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (
    email: string, 
    password: string, 
    metadata?: { full_name?: string; phone_number?: string; barangay?: string }
  ) => {
    try {
      const redirectUrl = `${window.location.origin}/dashboard`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: metadata
        }
      });

      if (error) throw error;

      // Update profile with additional info after signup
      if (metadata && user) {
        await supabase
          .from('profiles')
          .update({
            full_name: metadata.full_name,
            phone_number: metadata.phone_number,
            barangay: metadata.barangay
          })
          .eq('user_id', user.id);
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setUserRole(null);
  };

  const isAdmin = userRole === 'admin' || userRole === 'moderator';

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      userRole,
      isAdmin,
      signUp,
      signIn,
      signOut
    }}>
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
