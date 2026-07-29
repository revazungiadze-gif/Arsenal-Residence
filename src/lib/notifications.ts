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
 *
 * ⚠️ არხის სახელი უნიკალურია თითო გამომწერზე — ერთი და იმავე სახელის
 * არხზე ხელახლა .on() დამატება supabase-ში crash-ს იწვევს (ზარი +
 * შეტყობინებების ეკრანი ერთდროულად რომ იწერდნენ, ზუსტად ეს ხდებოდა).
 * try/catch იმისთვისაა, რომ realtime-ის ვერცერთი პრობლემა აპს არ აგდებდეს.
 */
let channelSeq = 0;

export function subscribeToNotifications(
  userId: string,
  onNew: (n: NotificationRow) => void
): () => void {
  try {
    const channel = supabase
      .channel(`notifications:${userId}:${++channelSeq}`)
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
      try {
        supabase.removeChannel(channel);
      } catch {
        // ignore
      }
    };
  } catch (e) {
    console.warn('[notifications] realtime მიუწვდომელია:', e);
    return () => {};
  }
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
