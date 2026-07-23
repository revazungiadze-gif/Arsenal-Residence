/**
 * app/(app)/leads/[id].tsx — ლიდის დეტალი (read-only).
 * ლიდის ველები + შენიშვნები (lead_notes). ჩაწერა ჯერ არ არის —
 * ის მომდევნო ეტაპზე ჩაირთვება, ბაზის უსაფრთხოების შემოწმების შემდეგ.
 */
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Badge, Card, EmptyState } from '@/components/ui';
import {
  LEAD_STATUS_COLORS,
  LEAD_STATUS_LABELS,
  PRIORITY_LABELS,
  type Lead,
  type LeadStatus,
} from '@/types/crm';
import { colors, font, spacing } from '@/theme';

interface Note {
  id: string;
  content: string | null;
  created_at: string | null;
}

export default function LeadDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [lead, setLead] = useState<Lead | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const [{ data: leadData }, { data: noteData }] = await Promise.all([
      supabase.from('leads').select('*').eq('id', id).single(),
      supabase
        .from('lead_notes')
        .select('id, content, created_at')
        .eq('lead_id', id)
        .order('created_at', { ascending: false }),
    ]);
    setLead(leadData ?? null);
    setNotes((noteData as Note[]) ?? []);
    setLoading(false);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (loading && !lead) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!lead) return <EmptyState text="ლიდი ვერ მოიძებნა" />;

  const status = (lead.status as LeadStatus) ?? 'new';

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
    >
      <View>
        <Text style={styles.name}>{lead.full_name}</Text>
        <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm }}>
          <Badge
            label={LEAD_STATUS_LABELS[status] ?? status}
            color={LEAD_STATUS_COLORS[status] ?? colors.textMuted}
          />
          {lead.priority ? (
            <Badge
              label={PRIORITY_LABELS[lead.priority] ?? lead.priority}
              color={colors.textMuted}
            />
          ) : null}
        </View>
      </View>

      <Card>
        <Field label="ტელეფონი" value={lead.phone} />
        <Field label="ელფოსტა" value={lead.email} />
        <Field label="წყარო" value={lead.source} />
        <Field
          label="ბიუჯეტი"
          value={
            lead.budget_min || lead.budget_max
              ? `${lead.budget_min ?? '—'} – ${lead.budget_max ?? '—'}`
              : null
          }
        />
        <Field label="ბინის კოდი" value={lead.apartment_code} />
        <Field label="შეხვედრა" value={fmt(lead.meeting_date)} />
        <Field label="შექმნილია" value={fmt(lead.created_at)} last />
      </Card>

      {lead.notes ? (
        <Card>
          <Text style={styles.sectionLabel}>ზოგადი შენიშვნა</Text>
          <Text style={styles.body}>{lead.notes}</Text>
        </Card>
      ) : null}

      <View>
        <Text style={styles.sectionTitle}>შენიშვნები ({notes.length})</Text>
        {notes.length === 0 ? (
          <EmptyState text="შენიშვნები არ არის" />
        ) : (
          <View style={{ gap: spacing.md }}>
            {notes.map((n) => (
              <Card key={n.id}>
                <Text style={styles.body}>{n.content}</Text>
                <Text style={styles.noteDate}>{fmt(n.created_at)}</Text>
              </Card>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

function Field({
  label,
  value,
  last,
}: {
  label: string;
  value: string | null | undefined;
  last?: boolean;
}) {
  return (
    <View style={[styles.field, !last && styles.fieldBorder]}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value || '—'}</Text>
    </View>
  );
}

function fmt(date: string | null | undefined): string | null {
  if (!date) return null;
  try {
    return new Date(date).toLocaleDateString('ka-GE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return date;
  }
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  name: { fontSize: font.size.xl, fontWeight: font.weight.bold, color: colors.text },
  field: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.md },
  fieldBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  fieldLabel: { fontSize: font.size.sm, color: colors.textMuted },
  fieldValue: {
    fontSize: font.size.md,
    color: colors.text,
    fontWeight: font.weight.medium,
    flexShrink: 1,
    textAlign: 'right',
    marginLeft: spacing.md,
  },
  sectionLabel: {
    fontSize: font.size.sm,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: font.size.lg,
    fontWeight: font.weight.semibold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  body: { fontSize: font.size.md, color: colors.text, lineHeight: 22 },
  noteDate: { fontSize: font.size.xs, color: colors.textMuted, marginTop: spacing.sm },
});
