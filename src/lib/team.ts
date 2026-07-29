/**
 * src/lib/team.ts — გუნდი + პროფილი (ეტაპი 8).
 */
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types/crm';

type Result = { error: string | null };

export interface TeamMemberStats extends Profile {
  leadsCount: number;
  wonCount: number;
}

/** გუნდის წევრები აგენტ-სტატისტიკით (RLS: სრული სია მხოლოდ მენეჯმენტს) */
export async function fetchTeamStats(): Promise<TeamMemberStats[]> {
  const [{ data: profiles }, { data: leads }] = await Promise.all([
    supabase.from('profiles').select('*').order('full_name'),
    supabase.from('leads').select('assigned_to, status').limit(5000),
  ]);

  const counts: Record<string, { leads: number; won: number }> = {};
  for (const l of leads ?? []) {
    if (!l.assigned_to) continue;
    counts[l.assigned_to] ??= { leads: 0, won: 0 };
    counts[l.assigned_to].leads++;
    if (l.status === 'won') counts[l.assigned_to].won++;
  }

  return (profiles ?? []).map((p) => ({
    ...p,
    leadsCount: counts[p.id]?.leads ?? 0,
    wonCount: counts[p.id]?.won ?? 0,
  }));
}

/** საკუთარი პროფილის განახლება (role/is_active-ს ტრიგერი იცავს) */
export async function updateMyProfile(
  userId: string,
  patch: { full_name?: string; phone?: string }
): Promise<Result> {
  const { error } = await supabase
    .from('profiles')
    .update({
      ...(patch.full_name !== undefined ? { full_name: patch.full_name.trim() } : {}),
      ...(patch.phone !== undefined ? { phone: patch.phone.trim() || null } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);
  return { error: error?.message ?? null };
}

/** პაროლის შეცვლა (Supabase Auth) */
export async function changePassword(newPassword: string): Promise<Result> {
  if (newPassword.length < 8) {
    return { error: 'პაროლი მინიმუმ 8 სიმბოლო უნდა იყოს.' };
  }
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  return { error: error?.message ?? null };
}
