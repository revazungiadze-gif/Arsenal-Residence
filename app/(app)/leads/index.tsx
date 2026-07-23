/**
 * app/(app)/leads/index.tsx — ლიდების სია (read-only).
 * ძებნა + სტატუსით ფილტრი. RLS ზღუდავს ხილვადობას როლის მიხედვით.
 */
import { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Link, useFocusEffect } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Badge, EmptyState } from '@/components/ui';
import {
  LEAD_STATUSES,
  LEAD_STATUS_COLORS,
  LEAD_STATUS_LABELS,
  type Lead,
  type LeadStatus,
} from '@/types/crm';
import { colors, font, radius, spacing } from '@/theme';

export default function LeadsList() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<LeadStatus | 'all'>('all');

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);
    setLeads(data ?? []);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return leads.filter((l) => {
      if (filter !== 'all' && l.status !== filter) return false;
      if (!q) return true;
      return (
        l.full_name?.toLowerCase().includes(q) ||
        l.phone?.toLowerCase().includes(q) ||
        l.email?.toLowerCase().includes(q)
      );
    });
  }, [leads, query, filter]);

  return (
    <View style={styles.screen}>
      <View style={styles.controls}>
        <TextInput
          style={styles.search}
          placeholder="ძებნა — სახელი, ტელეფონი, ელფოსტა"
          placeholderTextColor={colors.textMuted}
          value={query}
          onChangeText={setQuery}
        />
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={['all', ...LEAD_STATUSES] as const}
          keyExtractor={(s) => s}
          contentContainerStyle={{ gap: spacing.sm, paddingVertical: spacing.sm }}
          renderItem={({ item }) => {
            const active = filter === item;
            const label = item === 'all' ? 'ყველა' : LEAD_STATUS_LABELS[item];
            return (
              <Pressable
                onPress={() => setFilter(item)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {label}
                </Text>
              </Pressable>
            );
          }}
        />
      </View>

      <FlatList
        data={visible}
        keyExtractor={(l) => l.id}
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        ListEmptyComponent={
          !loading ? <EmptyState text="ლიდები არ მოიძებნა" /> : null
        }
        renderItem={({ item }) => <LeadRow lead={item} />}
      />
    </View>
  );
}

function LeadRow({ lead }: { lead: Lead }) {
  const status = (lead.status as LeadStatus) ?? 'new';
  return (
    <Link href={`/(app)/leads/${lead.id}`} asChild>
      <Pressable style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{lead.full_name}</Text>
          <Text style={styles.meta}>
            {lead.phone || lead.email || 'კონტაქტი არ არის'}
          </Text>
        </View>
        <Badge
          label={LEAD_STATUS_LABELS[status] ?? status}
          color={LEAD_STATUS_COLORS[status] ?? colors.textMuted}
        />
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  controls: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  search: {
    height: 44,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    fontSize: font.size.md,
    color: colors.text,
  },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg,
  },
  chipActive: { backgroundColor: colors.dark, borderColor: colors.dark },
  chipText: { fontSize: font.size.sm, color: colors.text },
  chipTextActive: { color: colors.textInverse, fontWeight: font.weight.semibold },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  name: { fontSize: font.size.md, fontWeight: font.weight.semibold, color: colors.text },
  meta: { fontSize: font.size.sm, color: colors.textMuted, marginTop: 2 },
});
