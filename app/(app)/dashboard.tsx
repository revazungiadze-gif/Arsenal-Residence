/**
 * app/(app)/dashboard.tsx — მთავარი დაფა (read-only).
 * KPI-ები არსებული ბაზიდან: ლიდები სტატუსების ჭრილში.
 * RLS თავად ზღუდავს — agent ხედავს მხოლოდ თავის ლიდებს.
 */
import { useCallback, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Card } from '@/components/ui';
import {
  LEAD_STATUSES,
  LEAD_STATUS_COLORS,
  LEAD_STATUS_LABELS,
  ROLE_LABELS,
  type LeadStatus,
} from '@/types/crm';
import { colors, font, spacing } from '@/theme';

type Counts = Record<LeadStatus, number>;

const emptyCounts = () =>
  LEAD_STATUSES.reduce((acc, s) => ({ ...acc, [s]: 0 }), {} as Counts);

export default function Dashboard() {
  const { profile, role } = useAuth();
  const [counts, setCounts] = useState<Counts>(emptyCounts());
  const [total, setTotal] = useState(0);
  const [apt, setApt] = useState({ available: 0, reserved: 0, sold: 0 });
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    // თითო სტატუსზე count(head) — მსუბუქი მოთხოვნა (მონაცემებს არ ეწევა)
    const next = emptyCounts();
    let sum = 0;
    const aptNext = { available: 0, reserved: 0, sold: 0 };
    await Promise.all([
      ...LEAD_STATUSES.map(async (status) => {
        const { count } = await supabase
          .from('leads')
          .select('*', { count: 'exact', head: true })
          .eq('status', status);
        next[status] = count ?? 0;
        sum += count ?? 0;
      }),
      ...(['available', 'reserved', 'sold'] as const).map(async (s) => {
        const { count } = await supabase
          .from('apartments')
          .select('*', { count: 'exact', head: true })
          .eq('status', s);
        aptNext[s] = count ?? 0;
      }),
    ]);
    setCounts(next);
    setTotal(sum);
    setApt(aptNext);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const activeLeads = total - counts.won - counts.lost;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ padding: spacing.lg }}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
    >
      <Text style={styles.greeting}>
        გამარჯობა{profile?.full_name ? `, ${profile.full_name}` : ''} 👋
      </Text>
      {role ? <Text style={styles.roleText}>{ROLE_LABELS[role]}</Text> : null}

      {/* ზედა KPI-ები */}
      <View style={styles.kpiRow}>
        <KpiTile label="სულ ლიდი" value={total} accent={colors.primary} />
        <KpiTile label="აქტიური" value={activeLeads} accent={colors.warning} />
        <KpiTile label="მოგებული" value={counts.won} accent={colors.success} />
      </View>

      {/* ინვენტარის მდგომარეობა */}
      <Text style={styles.sectionTitle}>ბინების ინვენტარი</Text>
      <View style={styles.kpiRow}>
        <KpiTile label="თავისუფალი" value={apt.available} accent={colors.success} />
        <KpiTile label="დაჯავშნული" value={apt.reserved} accent={colors.warning} />
        <KpiTile label="გაყიდული" value={apt.sold} accent={colors.danger} />
      </View>

      {/* pipeline სტატუსების ჭრილში */}
      <Text style={styles.sectionTitle}>ლიდების პაიპლაინი</Text>
      <Card>
        {LEAD_STATUSES.map((status, i) => (
          <View
            key={status}
            style={[styles.pipeRow, i > 0 && styles.pipeRowBorder]}
          >
            <View style={styles.pipeLeft}>
              <View
                style={[styles.dot, { backgroundColor: LEAD_STATUS_COLORS[status] }]}
              />
              <Text style={styles.pipeLabel}>{LEAD_STATUS_LABELS[status]}</Text>
            </View>
            <Text style={styles.pipeCount}>{counts[status]}</Text>
          </View>
        ))}
      </Card>

      <Text style={styles.note}>
        მონაცემები რეალურ დროშია — ჩამოქაჩე გასაახლებლად.
      </Text>
    </ScrollView>
  );
}

function KpiTile({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <Card style={styles.kpiTile}>
      <Text style={[styles.kpiValue, { color: accent }]}>{value}</Text>
      <Text style={styles.kpiLabel}>{label}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  greeting: { fontSize: font.size.xl, fontWeight: font.weight.bold, color: colors.text },
  roleText: { fontSize: font.size.sm, color: colors.textMuted, marginTop: 2 },
  kpiRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  kpiTile: { flex: 1, alignItems: 'center', paddingVertical: spacing.lg },
  kpiValue: { fontSize: font.size.xxl, fontWeight: font.weight.bold },
  kpiLabel: { fontSize: font.size.xs, color: colors.textMuted, marginTop: spacing.xs },
  sectionTitle: {
    fontSize: font.size.lg,
    fontWeight: font.weight.semibold,
    color: colors.text,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  pipeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  pipeRowBorder: { borderTopWidth: 1, borderTopColor: colors.border },
  pipeLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  dot: { width: 10, height: 10, borderRadius: 5 },
  pipeLabel: { fontSize: font.size.md, color: colors.text },
  pipeCount: { fontSize: font.size.md, fontWeight: font.weight.semibold, color: colors.text },
  note: {
    fontSize: font.size.xs,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});
