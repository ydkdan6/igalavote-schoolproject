import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type UserRole = 'admin' | 'voter' | null;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userRole: UserRole;
  loading: boolean;
  signUp: (email: string, password: string, profileData: ProfileData) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

interface ProfileData {
  name: string;
  department: string;
  registration_number: string;
  phone_number: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);
  const lastUserIdRef = useRef<string | null>(null);

  const fetchUserRole = async (userId: string): Promise<UserRole> => {
    console.log('🔍 Fetching role for user:', userId);
    try {
      console.log('🔍 Starting query...');
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);
      
      console.log('🔍 Query completed:', { error, dataLength: data?.length });
      
      if (error) {
        console.error('❌ Error fetching user role:', error);
        console.error('❌ Error details:', JSON.stringify(error, null, 2));
        return 'voter';
      }
      
      console.log('✅ Role data received:', data);
      
      // Handle multiple roles - prioritize admin
      if (!data || data.length === 0) {
        console.log('⚠️ No roles found, defaulting to voter');
        return 'voter';
      }
      
      // If user has admin role, use that; otherwise use the first role
      const roles = data.map(r => r.role);
      console.log('✅ User roles:', roles);
      
      const role = roles.includes('admin') ? 'admin' : (roles[0] as UserRole);
      console.log('✅ Final role selected:', role);
      return role;
    } catch (error) {
      console.error('❌ Exception fetching user role:', error);
      return 'voter';
    }
  };

  useEffect(() => {
    console.log('🚀 Auth context initializing...');
    let mounted = true;
    let isInitialized = false;

    // Initial session check
    const initializeAuth = async () => {
      console.log('📋 Starting initializeAuth...');
      try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log('📋 Session retrieved:', session ? 'Yes' : 'No', session?.user?.email);
        
        if (!mounted) {
          console.log('⚠️ Component unmounted, stopping initialization');
          return;
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          console.log('👤 User exists, fetching role...');
          lastUserIdRef.current = session.user.id;
          const role = await fetchUserRole(session.user.id);
          if (mounted) {
            console.log('✅ Setting role:', role);
            setUserRole(role);
          }
        } else {
          console.log('👤 No user found');
        }
      } catch (error) {
        console.error('❌ Error initializing auth:', error);
      } finally {
        if (mounted) {
          console.log('✅ Setting loading to FALSE in initializeAuth');
          setLoading(false);
          isInitialized = true;
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state changed:', event, 'User:', session?.user?.email, 'Last User ID:', lastUserIdRef.current, 'isInitialized:', isInitialized);
        
        if (!mounted) {
          console.log('⚠️ Component unmounted, ignoring auth change');
          return;
        }
        
        // On page reload, SIGNED_IN fires before initializeAuth completes
        // Ignore it if we haven't initialized yet
        if (event === 'SIGNED_IN' && !isInitialized) {
          console.log('⚠️ Ignoring SIGNED_IN during initialization');
          return;
        }
        
        // Ignore duplicate SIGNED_IN events for the same user
        if (event === 'SIGNED_IN' && session?.user?.id === lastUserIdRef.current && isInitialized) {
          console.log('⚠️ Ignoring duplicate SIGNED_IN event for same user');
          return;
        }
        
        // Ignore TOKEN_REFRESHED events - these don't require refetching the role
        if (event === 'TOKEN_REFRESHED') {
          console.log('⚠️ Token refreshed, keeping existing role');
          setSession(session);
          return;
        }
        
        // Only show loading for actual auth changes
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
          setLoading(true);
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          console.log('👤 User logged in, fetching role...');
          lastUserIdRef.current = session.user.id;
          
          try {
            const role = await fetchUserRole(session.user.id);
            console.log('✅ User role fetched:', role);
            if (mounted) {
              setUserRole(role);
              console.log('✅ Setting loading to FALSE after role fetch');
              setLoading(false);
            }
          } catch (error) {
            console.error('❌ Error fetching role on auth change:', error);
            if (mounted) {
              setUserRole('voter');
              console.log('✅ Setting loading to FALSE after error');
              setLoading(false);
            }
          }
        } else {
          console.log('👤 User logged out');
          lastUserIdRef.current = null;
          setUserRole(null);
          setLoading(false);
        }
      }
    );

    return () => {
      console.log('🧹 Cleaning up auth context');
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Debug: Log state changes
  useEffect(() => {
    console.log('📊 State update - Loading:', loading, 'User:', user?.email, 'Role:', userRole);
  }, [loading, user, userRole]);

  const signUp = async (email: string, password: string, profileData: ProfileData) => {
    console.log('📝 Signing up:', email);
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl
        }
      });

      if (error) {
        console.error('❌ Signup error:', error);
        return { error };
      }

      if (data.user) {
        console.log('✅ User created, creating profile...');
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            user_id: data.user.id,
            email,
            name: profileData.name,
            department: profileData.department,
            registration_number: profileData.registration_number,
            phone_number: profileData.phone_number,
          });

        if (profileError) {
          console.error('❌ Profile creation error:', profileError);
          return { error: new Error(profileError.message) };
        }

        console.log('✅ Profile created successfully');
      }

      return { error: null };
    } catch (error) {
      console.error('❌ Signup exception:', error);
      return { error: error as Error };
    }
  };

  const signIn = async (email: string, password: string) => {
    console.log('🔐 Signing in:', email);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error('❌ Sign in error:', error);
        return { error };
      }
      
      console.log('✅ Sign in successful, onAuthStateChange will handle role fetch');
      return { error: null };
    } catch (error) {
      console.error('❌ Sign in exception:', error);
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    console.log('👋 Signing out');
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setUserRole(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, userRole, loading, signUp, signIn, signOut }}>
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