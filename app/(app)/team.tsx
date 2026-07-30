/**
 * app/(app)/team.tsx — გუნდი (ეტაპი 8, მენეჯმენტისთვის).
 * წევრები როლით/სტატუსით + ლიდების და გაყიდვების სტატისტიკა.
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
import { fetchTeamStats, type TeamMemberStats } from '@/lib/team';
import { Badge, Card, EmptyState } from '@/components/ui';
import { ROLE_LABELS, dbRoleToAppRole } from '@/types/crm';
import { colors, font, spacing } from '@/theme';

let teamCache: TeamMemberStats[] = [];

export default function Team() {
  const [members, setMembers] = useState<TeamMemberStats[]>(teamCache);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (teamCache.length === 0) setLoading(true);
    teamCache = await fetchTeamStats();
    setMembers(teamCache);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <View style={styles.screen}>
      <FlatList
        data={members}
        keyExtractor={(m) => m.id}
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        ListEmptyComponent={!loading ? <EmptyState text="გუნდი ვერ ჩაიტვირთა" /> : null}
        renderItem={({ item }) => {
          const role = dbRoleToAppRole(item.role);
          return (
            <Card>
              <View style={styles.head}>
                <Text style={styles.name}>
                  {item.full_name || '(უსახელო)'}
                  {!item.is_active ? '  ⏸️' : ''}
                </Text>
                <Badge label={ROLE_LABELS[role]} color={colors.primary} />
              </View>
              {item.phone ? <Text style={styles.meta}>📞 {item.phone}</Text> : null}
              <View style={styles.statsRow}>
                <Stat label="ლიდი" value={item.leadsCount} />
                <Stat label="მოგებული" value={item.wonCount} accent={colors.success} />
                <Stat
                  label="კონვერსია"
                  value={
                    item.leadsCount > 0
                      ? `${Math.round((item.wonCount / item.leadsCount) * 100)}%`
                      : '—'
                  }
                  accent={colors.warning}
                />
              </View>
            </Card>
          );
        }}
      />
    </View>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number | string;
  accent?: string;
}) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, accent ? { color: accent } : null]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: font.size.md, fontWeight: font.weight.bold, color: colors.text },
  meta: { fontSize: font.size.sm, color: colors.textMuted, marginTop: 4 },
  statsRow: {
    flexDirection: 'row',
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: font.size.lg, fontWeight: font.weight.bold, color: colors.text },
  statLabel: { fontSize: font.size.xs, color: colors.textMuted, marginTop: 2 },
});
