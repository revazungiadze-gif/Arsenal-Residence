/**
 * src/context/AuthContext.tsx
 *
 * ავტორიზაციის მდგომარეობა მთელ აპში.
 * იყენებს Supabase Auth-ს (იგივე, რასაც ვები) — email/password.
 * შესვლის შემდეგ იტვირთება `profiles` ჩანაწერი (role-ისთვის).
 */
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { dbRoleToAppRole, type AppRole, type Profile } from '@/types/crm';

interface AuthState {
  session: Session | null;
  profile: Profile | null;
  role: AppRole | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // profiles ჩანაწერის ჩატვირთვა (role-ისთვის)
  async function loadProfile(userId: string) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    setProfile(data ?? null);
  }

  useEffect(() => {
    let active = true;

    // საწყისი სესია (SecureStore-იდან)
    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      setSession(data.session);
      if (data.session?.user) await loadProfile(data.session.user.id);
      setLoading(false);
    });

    // სესიის ცვლილებებზე რეაქცია (login/logout/refresh)
    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, next) => {
      setSession(next);
      if (next?.user) {
        await loadProfile(next.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    // ვებ-CRM-ის მსგავსად — ზოგადი შეტყობინება (user enumeration-ის თავიდან ასაცილებლად)
    if (error) return { error: 'ელფოსტა ან პაროლი არასწორია.' };
    return { error: null };
  }

  async function signOut() {
    await supabase.auth.signOut();
    setProfile(null);
  }

  const value = useMemo<AuthState>(
    () => ({
      session,
      profile,
      role: profile ? dbRoleToAppRole(profile.role) : null,
      loading,
      signIn,
      signOut,
    }),
    [session, profile, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth უნდა იყოს AuthProvider-ის შიგნით');
  return ctx;
}
