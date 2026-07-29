/**
 * app/(app)/ai.tsx — AI კოპილოტი (ეტაპი 9).
 * პრიორიტეტიზებული ლიდები ქულით, შემდეგი ნაბიჯით და მზა follow-up
 * ტექსტით — ერთი დაჭერით იგზავნება SMS/WhatsApp-ში.
 */
import { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Linking,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import {
  URGENCY_COLORS,
  URGENCY_LABELS,
  fetchCopilotLeads,
  type CopilotLead,
} from '@/lib/copilot';
import { Card, EmptyState } from '@/components/ui';
import { LEAD_STATUS_LABELS, type LeadStatus } from '@/types/crm';
import { colors, font, radius, spacing } from '@/theme';

export default function AiCopilot() {
  const [items, setItems] = useState<CopilotLead[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setItems(await fetchCopilotLeads());
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const highCount = useMemo(
    () => items.filter((i) => i.urgency === 'high').length,
    [items]
  );

  function send(kind: 'sms' | 'wa', item: CopilotLead) {
    const phone = item.lead.phone?.replace(/[^\d+]/g, '');
    if (!phone) {
      Alert.alert('ტელეფონი არ არის მითითებული');
      return;
    }
    const text = encodeURIComponent(item.followUp);
    const url =
      kind === 'sms'
        ? `sms:${phone}${text ? `&body=${text}` : ''}`
        : `https://wa.me/${phone.replace(/^\+/, '')}?text=${text}`;
    Linking.openURL(url).catch(() => Alert.alert('ვერ გაიხსნა'));
  }

  return (
    <View style={styles.screen}>
      <View style={styles.summary}>
        <Text style={styles.summaryText}>
          🤖 დღეს ფოკუსში: <Text style={styles.summaryStrong}>{highCount}</Text>{' '}
          სასწრაფო ლიდი · სულ {items.length} აქტიური
        </Text>
      </View>

      <FlatList
        data={items}
        keyExtractor={(i) => i.lead.id}
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        ListEmptyComponent={
          !loading ? <EmptyState text="აქტიური ლიდები არ არის 🎉" /> : null
        }
        renderItem={({ item }) => (
          <Card>
            <Pressable onPress={() => router.push(`/(app)/leads/${item.lead.id}`)}>
              <View style={styles.head}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                  <View
                    style={[styles.dot, { backgroundColor: URGENCY_COLORS[item.urgency] }]}
                  />
                  <Text style={styles.name} numberOfLines={1}>
                    {item.lead.full_name}
                  </Text>
                </View>
                <View style={[styles.scoreBadge, { borderColor: URGENCY_COLORS[item.urgency] }]}>
                  <Text style={[styles.scoreText, { color: URGENCY_COLORS[item.urgency] }]}>
                    {item.score}
                  </Text>
                </View>
              </View>
              <Text style={styles.meta}>
                {LEAD_STATUS_LABELS[item.lead.status as LeadStatus] ?? item.lead.status} ·{' '}
                {URGENCY_LABELS[item.urgency]}
              </Text>
              <Text style={styles.action}>👉 {item.nextAction}</Text>
            </Pressable>

            <View style={styles.followUpBox}>
              <Text style={styles.followUpLabel}>მზა შეტყობინება:</Text>
              <Text style={styles.followUpText}>{item.followUp}</Text>
              <View style={styles.btnRow}>
                <SmallBtn label="✉️ SMS-ით" onPress={() => send('sms', item)} />
                <SmallBtn label="💬 WhatsApp-ით" onPress={() => send('wa', item)} />
              </View>
            </View>
          </Card>
        )}
      />
    </View>
  );
}

function SmallBtn({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable style={styles.smallBtn} onPress={onPress}>
      <Text style={styles.smallBtnText}>{label}</Text>
    </Pressable>
  );
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
  summaryStrong: { fontWeight: font.weight.bold, color: colors.danger },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dot: { width: 10, height: 10, borderRadius: 5 },
  name: { fontSize: font.size.md, fontWeight: font.weight.bold, color: colors.text, flexShrink: 1 },
  scoreBadge: {
    borderWidth: 1.5,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 2,
  },
  scoreText: { fontSize: font.size.sm, fontWeight: font.weight.bold },
  meta: { fontSize: font.size.xs, color: colors.textMuted, marginTop: 4 },
  action: {
    fontSize: font.size.sm,
    color: colors.text,
    fontWeight: font.weight.semibold,
    marginTop: spacing.sm,
  },
  followUpBox: {
    marginTop: spacing.md,
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  followUpLabel: { fontSize: font.size.xs, color: colors.textMuted, marginBottom: 4 },
  followUpText: { fontSize: font.size.sm, color: colors.text, lineHeight: 20 },
  btnRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  smallBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  smallBtnText: { fontSize: font.size.xs, fontWeight: font.weight.semibold, color: colors.primary },
});
