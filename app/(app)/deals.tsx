/**
 * app/(app)/deals.tsx — გარიგებები (გაყიდვების ისტორია).
 * დამტკიცებული ჯავშნები = გაყიდვები: ბინა, ფასი, კლიენტი, აგენტი, თარიღი.
 */
import { useCallback, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { fetchDeals, type Deal } from '@/lib/deals';
import { Card, EmptyState } from '@/components/ui';
import { colors, font, spacing } from '@/theme';

export default function Deals() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [totalValue, setTotalValue] = useState(0);
  const [currency, setCurrency] = useState('$');
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetchDeals();
    setDeals(res.deals);
    setTotalValue(res.totalValue);
    setCurrency(res.currency);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <View style={styles.screen}>
      <View style={styles.summary}>
        <Text style={styles.summaryText}>
          💼 სულ <Text style={styles.strong}>{deals.length}</Text> გარიგება ·
          ჯამური ღირებულება{' '}
          <Text style={styles.strong}>
            {totalValue.toLocaleString('ka-GE')} {currency}
          </Text>
        </Text>
      </View>

      <FlatList
        data={deals}
        keyExtractor={(d) => d.id}
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        ListEmptyComponent={
          !loading ? <EmptyState text="გარიგებები ჯერ არ არის" /> : null
        }
        renderItem={({ item }) => (
          <Card>
            <View style={styles.row}>
              <Text style={styles.apt}>🏢 {item.aptCode}</Text>
              <Text style={styles.price}>
                {item.price != null
                  ? `${item.price.toLocaleString('ka-GE')} ${item.currency ?? ''}`
                  : '—'}
              </Text>
            </View>
            <Text style={styles.meta}>👤 კლიენტი: {item.leadName}</Text>
            <Text style={styles.meta}>🤝 აგენტი: {item.agentName}</Text>
            <Text style={styles.date}>{fmt(item.reviewedAt)}</Text>
          </Card>
        )}
      />
    </View>
  );
}

function fmt(date: string | null): string {
  if (!date) return '';
  try {
    return new Date(date).toLocaleDateString('ka-GE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return date;
  }
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  summary: {
    padding: spacing.lg,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  summaryText: { fontSize: font.size.sm, color: colors.text },
  strong: { fontWeight: font.weight.bold, color: colors.primary },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  apt: { fontSize: font.size.md, fontWeight: font.weight.bold, color: colors.text },
  price: { fontSize: font.size.md, fontWeight: font.weight.bold, color: colors.success },
  meta: { fontSize: font.size.sm, color: colors.text, marginTop: 4 },
  date: { fontSize: font.size.xs, color: colors.textMuted, marginTop: spacing.sm },
});
