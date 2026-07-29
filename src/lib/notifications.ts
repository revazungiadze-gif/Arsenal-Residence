/**
 * src/lib/notifications.ts — შეტყობინებები (ეტაპი 5).
 * კითხვა + წაკითხულად მონიშვნა + realtime გამოწერა (Supabase channel).
 * RLS: მომხმარებელი მხოლოდ საკუთარს ხედავს/ცვლის.
 */
import { supabase } from '@/lib/supabase';
import type { NotificationRow } from '@/types/crm';

type Result = { error: string | null };

export async function fetchNotifications(): Promise<NotificationRow[]> {
  const { data } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);
  return data ?? [];
}

export async function fetchUnreadCount(): Promise<number> {
  const { count } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('is_read', false);
  return count ?? 0;
}

export async function markRead(id: string): Promise<Result> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('id', id);
  return { error: error?.message ?? null };
}

export async function markAllRead(): Promise<Result> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('is_read', false);
  return { error: error?.message ?? null };
}

/**
 * Realtime გამოწერა — ახალი შეტყობინება ბაზაში ჩავარდნისთანავე მოდის.
 * აბრუნებს გაუქმების ფუნქციას (unmount-ზე გამოსაძახებელი).
 */
export function subscribeToNotifications(
  userId: string,
  onNew: (n: NotificationRow) => void
): () => void {
  const channel = supabase
    .channel(`notifications:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => onNew(payload.new as NotificationRow)
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/** ტიპის მიხედვით პატარა ვიზუალი */
export const NOTIFICATION_TYPE_ICONS: Record<string, string> = {
  success: '✅',
  warning: '⚠️',
  error: '❌',
  info: 'ℹ️',
  task: '📋',
  lead: '👤',
  booking: '🔖',
};
