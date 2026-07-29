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
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) {
        // რეალური მიზეზის ჩვენება — რომ ქსელის პრობლემა credentials-ის
        // შეცდომაში არ აგვერიოს
        const msg = error.message || '';
        if (msg.includes('Invalid login credentials')) {
          return { error: 'ელფოსტა ან პაროლი არასწორია.' };
        }
        if (msg.includes('Email not confirmed')) {
          return { error: 'ელფოსტა დაუდასტურებელია (Supabase → Auth → Users).' };
        }
        if (msg.toLowerCase().includes('disabled')) {
          return { error: 'Email-ით შესვლა გამორთულია Supabase-ში: ' + msg };
        }
        return { error: 'Auth შეცდომა: ' + msg };
      }
      return { error: null };
    } catch (e) {
      // fetch-ის ჩავარდნა = ქსელის პრობლემა, არა არასწორი პაროლი
      return {
        error:
          'ქსელის შეცდომა — Supabase-მდე ვერ მივიდა მოთხოვნა: ' +
          (e instanceof Error ? e.message : String(e)),
      };
    }
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
