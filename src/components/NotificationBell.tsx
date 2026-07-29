/**
 * src/components/NotificationBell.tsx — ზარი ჰედერში, წაუკითხავის ბეჯით.
 * realtime-ზეა გამოწერილი — ახალი შეტყობინებისას ბეჯი მაშინვე იზრდება.
 */
import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import {
  fetchUnreadCount,
  subscribeToNotifications,
} from '@/lib/notifications';
import { useAuth } from '@/context/AuthContext';
import { colors, font } from '@/theme';

export function NotificationBell() {
  const { session } = useAuth();
  const [count, setCount] = useState(0);

  const refresh = useCallback(() => {
    fetchUnreadCount().then(setCount);
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  useEffect(() => {
    if (!session?.user) return;
    const unsubscribe = subscribeToNotifications(session.user.id, () =>
      setCount((c) => c + 1)
    );
    return unsubscribe;
  }, [session?.user?.id]);

  return (
    <Pressable
      hitSlop={12}
      style={styles.wrap}
      onPress={() => router.push('/(app)/notifications')}
    >
      <Text style={styles.bell}>🔔</Text>
      {count > 0 ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{count > 99 ? '99+' : count}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 12 },
  bell: { fontSize: 22 },
  badge: {
    position: 'absolute',
    top: -4,
    right: 4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: font.weight.bold,
  },
});
