/**
 * app/(app)/analytics.tsx — ანალიტიკა + მარკეტინგი + ბონუსები (ეტაპი 7).
 * agent ხედავს საკუთარ ჭრილს (RLS), მენეჯმენტი — მთლიანს.
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
import {
  fetchAnalytics,
  fetchBonuses,
  fetchMarketingStats,
  type AnalyticsData,
  type BonusData,
} from '@/lib/analytics';
import { useAuth } from '@/context/AuthContext';
import { Card } from '@/components/ui';
import {
  LEAD_STATUSES,
  LEAD_STATUS_COLORS,
  LEAD_STATUS_LABELS,
} from '@/types/crm';
import { colors, font, radius, spacing } from '@/theme';

export default function Analytics() {
  const { role } = useAuth();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [bonus, setBonus] = useState<BonusData | null>(null);
  const [loading, setLoading] = useState(false);

  const isMarketing = role === 'marketing';

  const load = useCallback(async () => {
    setLoading(true);
    if (isMarketing) {
      // marketing ლიდებს პირდაპირ ვერ კითხულობს — აგრეგატები RPC-დან
      setData(await fetchMarketingStats());
      setBonus(null);
    } else {
      const [a, b] = await Promise.all([fetchAnalytics(), fetchBonuses()]);
      setData(a);
      setBonus(b);
    }
    setLoading(false);
  }, [isMarketing]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const maxMonthly = Math.max(1, ...(data?.monthly.map((m) => m.count) ?? [1]));

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
    >
      {/* KPI */}
      <View style={styles.kpiRow}>
        <Kpi label="სულ ლიდი" value={`${data?.total ?? '—'}`} accent={colors.primary} />
        <Kpi label="კონვერსია" value={`${data?.conversion ?? '—'}%`} accent={colors.success} />
        <Kpi label="აქტიური" value={`${data?.active ?? '—'}`} accent={colors.warning} />
      </View>

      {/* Pipeline */}
      <Section title="პაიპლაინი">
        {data
          ? LEAD_STATUSES.map((s) => (
              <BarRow
                key={s}
                label={LEAD_STATUS_LABELS[s]}
                count={data.byStatus[s]}
                max={Math.max(1, data.total)}
                color={LEAD_STATUS_COLORS[s]}
              />
            ))
          : null}
      </Section>

      {/* თვიური დინამიკა */}
      <Section title="თვიური დინამიკა (ბოლო 6 თვე)">
        <View style={styles.monthRow}>
          {data?.monthly.map((m, i) => (
            <View key={i} style={styles.monthCol}>
              <Text style={styles.monthCount}>{m.count}</Text>
              <View
                style={[
                  styles.monthBar,
                  {
                    height: Math.max(6, (m.count / maxMonthly) * 80),
                    backgroundColor: colors.primary,
                  },
                ]}
              />
              <Text style={styles.monthLabel}>{m.label}</Text>
            </View>
          ))}
        </View>
      </Section>

      {/* წყაროები (მარკეტინგი) */}
      <Section title="ლიდების წყაროები">
        {data?.topSources.map((s, i) => (
          <BarRow
            key={i}
            label={s.source}
            count={s.count}
            max={Math.max(1, data.total)}
            color="#8B5CF6"
          />
        ))}
      </Section>

      {/* დაკარგვის მიზეზები */}
      {data && data.lossReasons.length > 0 ? (
        <Section title="დაკარგვის მიზეზები">
          {data.lossReasons.map((r, i) => (
            <BarRow
              key={i}
              label={r.reason}
              count={r.count}
              max={Math.max(1, data.lost)}
              color={colors.danger}
            />
          ))}
        </Section>
      ) : null}

      {/* ბონუსები (marketing-ს არ უჩანს) */}
      {isMarketing ? null : (
      <Section title={`ბონუსები · ${bonus?.monthLabel ?? ''}`}>
        {bonus && bonus.sales.length > 0 ? (
          <>
            {bonus.byAgent.map((a, i) => (
              <View key={i} style={styles.bonusRow}>
                <Text style={styles.bonusAgent}>
                  {i === 0 ? '🥇 ' : i === 1 ? '🥈 ' : i === 2 ? '🥉 ' : ''}
                  {a.agentName}
                </Text>
                <Text style={styles.bonusMeta}>
                  {a.salesCount} გაყიდვა · {a.totalBonus.toLocaleString('ka-GE')}
                </Text>
              </View>
            ))}
            <View style={[styles.bonusRow, styles.bonusTotal]}>
              <Text style={styles.bonusAgent}>ჯამი</Text>
              <Text style={[styles.bonusMeta, { color: colors.success }]}>
                {bonus.totalBonus.toLocaleString('ka-GE')}
              </Text>
            </View>
          </>
        ) : (
          <Text style={styles.empty}>
            ბონუსები ითვლება ჯავშნის ციკლით (მოთხოვნა → დამტკიცება) გაფორმებული
            გაყიდვებიდან — ასეთი ამ თვეში ჯერ არ არის. სრული გაყიდვები იხილე:
            მეტი → გარიგებები. ამიერიდან აპში დამტკიცებული ყოველი ჯავშანი აქ
            ავტომატურად აისახება.
          </Text>
        )}
      </Section>
      )}

      <Text style={styles.note}>
        ციფრები შენი როლის ხედვის ფარგლებშია — ზუსტად ისე, როგორც ვებში.
      </Text>
    </ScrollView>
  );
}

function Kpi({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <Card style={styles.kpi}>
      <Text style={[styles.kpiValue, { color: accent }]}>{value}</Text>
      <Text style={styles.kpiLabel}>{label}</Text>
    </Card>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Card>{children}</Card>
    </View>
  );
}

function BarRow({
  label,
  count,
  max,
  color,
}: {
  label: string;
  count: number;
  max: number;
  color: string;
}) {
  return (
    <View style={styles.barRow}>
      <View style={styles.barHead}>
        <Text style={styles.barLabel} numberOfLines={1}>
          {label}
        </Text>
        <Text style={styles.barCount}>{count}</Text>
      </View>
      <View style={styles.barTrack}>
        <View
          style={[
            styles.barFill,
            { width: `${Math.max(2, (count / max) * 100)}%`, backgroundColor: color },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  kpiRow: { flexDirection: 'row', gap: spacing.md },
  kpi: { flex: 1, alignItems: 'center', paddingVertical: spacing.lg },
  kpiValue: { fontSize: font.size.xl, fontWeight: font.weight.bold },
  kpiLabel: { fontSize: font.size.xs, color: colors.textMuted, marginTop: spacing.xs },
  sectionTitle: {
    fontSize: font.size.lg,
    fontWeight: font.weight.semibold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  barRow: { marginBottom: spacing.md },
  barHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  barLabel: { fontSize: font.size.sm, color: colors.text, flex: 1, marginRight: spacing.md },
  barCount: { fontSize: font.size.sm, fontWeight: font.weight.semibold, color: colors.text },
  barTrack: {
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.bg,
    overflow: 'hidden',
  },
  barFill: { height: 8, borderRadius: radius.pill },
  monthRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingTop: spacing.md,
  },
  monthCol: { alignItems: 'center', flex: 1, gap: 4 },
  monthBar: { width: 22, borderRadius: 6 },
  monthCount: { fontSize: font.size.xs, color: colors.textMuted },
  monthLabel: { fontSize: font.size.xs, color: colors.textMuted },
  bonusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  bonusTotal: { borderBottomWidth: 0, paddingTop: spacing.md },
  bonusAgent: { fontSize: font.size.md, color: colors.text, fontWeight: font.weight.medium },
  bonusMeta: { fontSize: font.size.md, color: colors.text, fontWeight: font.weight.semibold },
  empty: { fontSize: font.size.sm, color: colors.textMuted },
  note: {
    fontSize: font.size.xs,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
});
