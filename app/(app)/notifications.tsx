/**
 * app/(app)/notifications.tsx — შეტყობინებები (ეტაპი 5).
 * წაუკითხავი გამოკვეთილია; შეხება → წაკითხულად; "ყველას წაკითხვა";
 * realtime — ახალი შეტყობინება მაშინვე ჩნდება სიაში.
 */
import { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import {
  NOTIFICATION_TYPE_ICONS,
  fetchNotifications,
  markAllRead,
  markRead,
  subscribeToNotifications,
} from '@/lib/notifications';
import { useAuth } from '@/context/AuthContext';
import { EmptyState } from '@/components/ui';
import type { NotificationRow } from '@/types/crm';
import { colors, font, radius, spacing } from '@/theme';

let notifCache: NotificationRow[] = [];

export default function Notifications() {
  const { session } = useAuth();
  const [items, setItems] = useState<NotificationRow[]>(notifCache);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (notifCache.length === 0) setLoading(true);
    notifCache = await fetchNotifications();
    setItems(notifCache);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  // realtime — ახალი შეტყობინება პირდაპირ სიის თავში
  useEffect(() => {
    if (!session?.user) return;
    const unsubscribe = subscribeToNotifications(session.user.id, (n) => {
      setItems((prev) => [n, ...prev]);
    });
    return unsubscribe;
  }, [session?.user?.id]);

  async function onTap(n: NotificationRow) {
    if (n.is_read) return;
    setItems((prev) =>
      prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x))
    );
    await markRead(n.id);
  }

  async function onMarkAll() {
    setItems((prev) => prev.map((x) => ({ ...x, is_read: true })));
    await markAllRead();
  }

  const unread = items.filter((n) => !n.is_read).length;

  return (
    <View style={styles.screen}>
      {unread > 0 ? (
        <Pressable style={styles.markAll} onPress={onMarkAll}>
          <Text style={styles.markAllText}>
            ✓ ყველას წაკითხულად მონიშვნა ({unread})
          </Text>
        </Pressable>
      ) : null}

      <FlatList
        data={items}
        keyExtractor={(n) => n.id}
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        ListEmptyComponent={
          !loading ? <EmptyState text="შეტყობინებები არ არის 🔕" /> : null
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => onTap(item)}
            style={[styles.row, !item.is_read && styles.rowUnread]}
          >
            <Text style={styles.icon}>
              {NOTIFICATION_TYPE_ICONS[item.type] ?? '🔔'}
            </Text>
            <View style={{ flex: 1 }}>
              <Text
                style={[styles.title, !item.is_read && styles.titleUnread]}
              >
                {item.title}
              </Text>
              {item.message ? (
                <Text style={styles.message}>{item.message}</Text>
              ) : null}
              <Text style={styles.date}>{fmt(item.created_at)}</Text>
            </View>
            {!item.is_read ? <View style={styles.dot} /> : null}
          </Pressable>
        )}
      />
    </View>
  );
}

function fmt(date: string): string {
  try {
    const d = new Date(date);
    const now = Date.now();
    const diffMin = Math.floor((now - d.getTime()) / 60000);
    if (diffMin < 1) return 'ახლახან';
    if (diffMin < 60) return `${diffMin} წთ წინ`;
    if (diffMin < 1440) return `${Math.floor(diffMin / 60)} სთ წინ`;
    return d.toLocaleDateString('ka-GE', { month: 'short', day: 'numeric' });
  } catch {
    return date;
  }
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  markAll: {
    margin: spacing.lg,
    marginBottom: 0,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
  },
  markAllText: { color: colors.primary, fontWeight: font.weight.semibold, fontSize: font.size.sm },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    alignItems: 'flex-start',
  },
  rowUnread: { borderColor: colors.primary, backgroundColor: colors.primary + '08' },
  icon: { fontSize: 22 },
  title: { fontSize: font.size.md, color: colors.text },
  titleUnread: { fontWeight: font.weight.bold },
  message: { fontSize: font.size.sm, color: colors.textMuted, marginTop: 2 },
  date: { fontSize: font.size.xs, color: colors.textMuted, marginTop: spacing.xs },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
    marginTop: 6,
  },
});
