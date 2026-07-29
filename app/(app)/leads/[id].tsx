/**
 * app/(app)/leads/[id].tsx — ლიდის დეტალი (ეტაპი 2: ჩაწერაც).
 * სტატუსის ცვლა (+ დაკარგვის მიზეზი), შენიშვნის დამატება,
 * დარეკვა/SMS/WhatsApp, მინიჭება (მენეჯმენტს).
 */
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import {
  addLeadNote,
  assignLead,
  deleteLeadNote,
  fetchTeam,
  updateLeadStatus,
} from '@/lib/leads';
import { useAuth } from '@/context/AuthContext';
import { Badge, Button, Card, EmptyState } from '@/components/ui';
import {
  LEAD_STATUSES,
  LEAD_STATUS_COLORS,
  LEAD_STATUS_LABELS,
  PRIORITY_LABELS,
  ROLE_LABELS,
  dbRoleToAppRole,
  type Lead,
  type LeadStatus,
  type Profile,
} from '@/types/crm';
import { colors, font, radius, spacing } from '@/theme';

interface Note {
  id: string;
  content: string | null;
  created_at: string | null;
  user_id: string | null;
}

const CAN_ASSIGN = ['admin', 'director', 'sales_manager'];

export default function LeadDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session, role } = useAuth();
  const [lead, setLead] = useState<Lead | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // შენიშვნის ფორმა
  const [noteText, setNoteText] = useState('');
  // დაკარგვის მიზეზის მოდალი
  const [lossModal, setLossModal] = useState(false);
  const [lossReason, setLossReason] = useState('');
  // მინიჭების მოდალი
  const [assignModal, setAssignModal] = useState(false);
  const [team, setTeam] = useState<Profile[]>([]);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const [{ data: leadData }, { data: noteData }] = await Promise.all([
      supabase.from('leads').select('*').eq('id', id).single(),
      supabase
        .from('lead_notes')
        .select('id, content, created_at, user_id')
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

  async function onStatusTap(status: LeadStatus) {
    if (!lead || status === lead.status) return;
    if (status === 'lost') {
      setLossReason('');
      setLossModal(true);
      return;
    }
    await applyStatus(status);
  }

  async function applyStatus(status: LeadStatus, reason?: string) {
    if (!lead) return;
    setSaving(true);
    const { error } = await updateLeadStatus(lead.id, status, reason);
    setSaving(false);
    if (error) {
      Alert.alert('შეცდომა', error);
      return;
    }
    setLossModal(false);
    load();
  }

  async function onAddNote() {
    if (!lead || !session?.user || !noteText.trim()) return;
    setSaving(true);
    const { error } = await addLeadNote(lead.id, noteText, session.user.id);
    setSaving(false);
    if (error) {
      Alert.alert('შეცდომა', error);
      return;
    }
    setNoteText('');
    load();
  }

  async function openAssign() {
    setTeam(await fetchTeam());
    setAssignModal(true);
  }

  async function onAssign(userId: string | null) {
    if (!lead) return;
    setSaving(true);
    const { error } = await assignLead(lead.id, userId);
    setSaving(false);
    setAssignModal(false);
    if (error) {
      Alert.alert('შეცდომა', error);
      return;
    }
    load();
  }

  function onDeleteNote(n: Note) {
    Alert.alert('შენიშვნის წაშლა', 'დარწმუნებული ხარ?', [
      { text: 'არა', style: 'cancel' },
      {
        text: 'წაშლა',
        style: 'destructive',
        onPress: async () => {
          const { error } = await deleteLeadNote(n.id);
          if (error) Alert.alert('შეცდომა', error);
          else load();
        },
      },
    ]);
  }

  function contact(kind: 'tel' | 'sms' | 'wa') {
    const phone = lead?.phone?.replace(/[^\d+]/g, '');
    if (!phone) {
      Alert.alert('ტელეფონი არ არის მითითებული');
      return;
    }
    const url =
      kind === 'tel'
        ? `tel:${phone}`
        : kind === 'sms'
          ? `sms:${phone}`
          : `https://wa.me/${phone.replace(/^\+/, '')}`;
    Linking.openURL(url).catch(() => Alert.alert('ვერ გაიხსნა', url));
  }

  if (loading && !lead) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!lead) return <EmptyState text="ლიდი ვერ მოიძებნა" />;

  const status = (lead.status as LeadStatus) ?? 'new';
  const canAssign = role ? CAN_ASSIGN.includes(role) : false;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
      keyboardShouldPersistTaps="handled"
    >
      {/* სათაური */}
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

      {/* კონტაქტის ღილაკები */}
      <View style={styles.contactRow}>
        <ContactBtn label="📞 დარეკვა" onPress={() => contact('tel')} />
        <ContactBtn label="✉️ SMS" onPress={() => contact('sms')} />
        <ContactBtn label="💬 WhatsApp" onPress={() => contact('wa')} />
      </View>

      {/* სტატუსის შეცვლა */}
      <View>
        <Text style={styles.sectionTitle}>სტატუსი</Text>
        <View style={styles.statusWrap}>
          {LEAD_STATUSES.map((s) => {
            const active = s === status;
            const c = LEAD_STATUS_COLORS[s];
            return (
              <Pressable
                key={s}
                disabled={saving}
                onPress={() => onStatusTap(s)}
                style={[
                  styles.statusChip,
                  { borderColor: c },
                  active && { backgroundColor: c },
                ]}
              >
                <Text
                  style={[
                    styles.statusChipText,
                    { color: active ? '#fff' : c },
                  ]}
                >
                  {LEAD_STATUS_LABELS[s]}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* ძირითადი ველები */}
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
        {status === 'lost' ? (
          <Field label="დაკარგვის მიზეზი" value={lead.loss_reason} />
        ) : null}
        <Field label="შექმნილია" value={fmt(lead.created_at)} last />
      </Card>

      {/* მინიჭება (მხოლოდ მენეჯმენტი) */}
      {canAssign ? (
        <Button
          title="👤 მინიჭება თანამშრომელზე"
          variant="outline"
          onPress={openAssign}
        />
      ) : null}

      {lead.notes ? (
        <Card>
          <Text style={styles.sectionLabel}>ზოგადი შენიშვნა</Text>
          <Text style={styles.body}>{lead.notes}</Text>
        </Card>
      ) : null}

      {/* შენიშვნები */}
      <View>
        <Text style={styles.sectionTitle}>შენიშვნები ({notes.length})</Text>

        <Card style={{ marginBottom: spacing.md }}>
          <TextInput
            style={styles.noteInput}
            placeholder="ახალი შენიშვნა..."
            placeholderTextColor={colors.textMuted}
            value={noteText}
            onChangeText={setNoteText}
            multiline
          />
          <Button
            title="დამატება"
            onPress={onAddNote}
            loading={saving}
            disabled={!noteText.trim()}
          />
        </Card>

        {notes.length === 0 ? (
          <EmptyState text="შენიშვნები არ არის" />
        ) : (
          <View style={{ gap: spacing.md }}>
            {notes.map((n) => {
              const canDelete =
                n.user_id === session?.user.id ||
                role === 'admin' ||
                role === 'director';
              return (
                <Card key={n.id}>
                  <View style={styles.noteHead}>
                    <Text style={[styles.body, { flex: 1 }]}>{n.content}</Text>
                    {canDelete ? (
                      <Pressable hitSlop={8} onPress={() => onDeleteNote(n)}>
                        <Text style={styles.noteDelete}>🗑️</Text>
                      </Pressable>
                    ) : null}
                  </View>
                  <Text style={styles.noteDate}>{fmt(n.created_at)}</Text>
                </Card>
              );
            })}
          </View>
        )}
      </View>

      {/* ── მოდალი: დაკარგვის მიზეზი ── */}
      <Modal visible={lossModal} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>რატომ დაიკარგა ლიდი?</Text>
            <TextInput
              style={styles.noteInput}
              placeholder="მიზეზი (ფასი, კონკურენტი, ლოკაცია...)"
              placeholderTextColor={colors.textMuted}
              value={lossReason}
              onChangeText={setLossReason}
              multiline
              autoFocus
            />
            <View style={{ gap: spacing.sm }}>
              <Button
                title="დადასტურება"
                onPress={() => applyStatus('lost', lossReason)}
                loading={saving}
              />
              <Button
                title="გაუქმება"
                variant="outline"
                onPress={() => setLossModal(false)}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* ── მოდალი: მინიჭება ── */}
      <Modal visible={assignModal} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>ვის მიენიჭოს ლიდი?</Text>
            <ScrollView style={{ maxHeight: 360 }}>
              {team.map((p) => (
                <Pressable
                  key={p.id}
                  onPress={() => onAssign(p.id)}
                  style={[
                    styles.teamRow,
                    lead.assigned_to === p.id && styles.teamRowActive,
                  ]}
                >
                  <Text style={styles.body}>
                    {p.full_name || p.id.slice(0, 8)}
                  </Text>
                  <Text style={styles.teamRole}>
                    {ROLE_LABELS[dbRoleToAppRole(p.role)]}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
            <Button
              title="გაუქმება"
              variant="outline"
              onPress={() => setAssignModal(false)}
            />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

function ContactBtn({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.contactBtn}>
      <Text style={styles.contactBtnText}>{label}</Text>
    </Pressable>
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
  contactRow: { flexDirection: 'row', gap: spacing.sm },
  contactBtn: {
    flex: 1,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  contactBtnText: { fontSize: font.size.sm, fontWeight: font.weight.semibold, color: colors.text },
  statusWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  statusChip: {
    borderWidth: 1.5,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    backgroundColor: colors.card,
  },
  statusChipText: { fontSize: font.size.sm, fontWeight: font.weight.semibold },
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
  sectionLabel: { fontSize: font.size.sm, color: colors.textMuted, marginBottom: spacing.sm },
  sectionTitle: {
    fontSize: font.size.lg,
    fontWeight: font.weight.semibold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  body: { fontSize: font.size.md, color: colors.text, lineHeight: 22 },
  noteDate: { fontSize: font.size.xs, color: colors.textMuted, marginTop: spacing.sm },
  noteHead: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  noteDelete: { fontSize: 16, opacity: 0.7 },
  noteInput: {
    minHeight: 70,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: font.size.md,
    color: colors.text,
    marginBottom: spacing.md,
    textAlignVertical: 'top',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  modalCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.xl,
    gap: spacing.sm,
  },
  modalTitle: {
    fontSize: font.size.lg,
    fontWeight: font.weight.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  teamRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  teamRowActive: { backgroundColor: colors.primary + '15' },
  teamRole: { fontSize: font.size.xs, color: colors.textMuted },
});
