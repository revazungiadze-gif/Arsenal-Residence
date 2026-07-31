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
  fetchLeadInterests,
  fetchTeam,
  removeLeadInterest,
  updateLeadFields,
  updateLeadStatus,
  type LeadInterest,
} from '@/lib/leads';
import { addLeadInterest, fetchApartments, type ApartmentWithRefs } from '@/lib/apartments';
import { useAuth } from '@/context/AuthContext';
import { Badge, Button, Card, EmptyState } from '@/components/ui';
import {
  LEAD_SOURCES,
  LEAD_SOURCE_LABELS,
  LEAD_STATUSES,
  LEAD_STATUS_COLORS,
  LEAD_STATUS_LABELS,
  LOSS_REASONS,
  LOSS_REASON_LABELS,
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
  // დაკარგვის მიზეზის მოდალი — მიზეზი ბაზის enum-იდან + თავისუფალი შენიშვნა
  const [lossModal, setLossModal] = useState(false);
  const [lossReason, setLossReason] = useState('');
  const [lossNote, setLossNote] = useState('');
  // მინიჭების მოდალი
  const [assignModal, setAssignModal] = useState(false);
  const [team, setTeam] = useState<Profile[]>([]);
  // ინტერესები + ბინის მიბმის მოდალი
  const [interests, setInterests] = useState<LeadInterest[]>([]);
  const [aptModal, setAptModal] = useState(false);
  const [apartments, setApartments] = useState<ApartmentWithRefs[]>([]);
  // რედაქტირების მოდალი
  const [editModal, setEditModal] = useState(false);
  const [eName, setEName] = useState('');
  const [ePhone, setEPhone] = useState('');
  const [eEmail, setEEmail] = useState('');
  const [eSource, setESource] = useState('');
  const [eBudgetMin, setEBudgetMin] = useState('');
  const [eBudgetMax, setEBudgetMax] = useState('');
  const [eNotes, setENotes] = useState('');

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const [{ data: leadData }, { data: noteData }, interestData] = await Promise.all([
      supabase.from('leads').select('*').eq('id', id).single(),
      supabase
        .from('lead_notes')
        .select('id, content, created_at, user_id')
        .eq('lead_id', id)
        .order('created_at', { ascending: false }),
      fetchLeadInterests(id),
    ]);
    setLead(leadData ?? null);
    setNotes((noteData as Note[]) ?? []);
    setInterests(interestData);
    setLoading(false);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function onStatusTap(status: LeadStatus) {
    if (!lead || status === lead.status) return;
    // „არ აინტერესებს" ახალი უარყოფითი დახურვაა — მიზეზს ვკითხულობთ
    if (status === 'not_interested') {
      setLossReason('');
      setLossNote('');
      setLossModal(true);
      return;
    }
    await applyStatus(status);
  }

  async function applyStatus(status: LeadStatus, reason?: string, note?: string) {
    if (!lead) return;
    setSaving(true);
    const { error } = await updateLeadStatus(lead.id, status, reason, note);
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

  function openEdit() {
    if (!lead) return;
    setEName(lead.full_name ?? '');
    setEPhone(lead.phone ?? '');
    setEEmail(lead.email ?? '');
    setESource(lead.source ?? '');
    setEBudgetMin(lead.budget_min != null ? String(lead.budget_min) : '');
    setEBudgetMax(lead.budget_max != null ? String(lead.budget_max) : '');
    setENotes(lead.notes ?? '');
    setEditModal(true);
  }

  async function onSaveEdit() {
    if (!lead) return;
    const isMgmt = role ? CAN_ASSIGN.includes(role) : false;
    setSaving(true);
    const { error } = await updateLeadFields(lead.id, {
      // agent-ის ველები (ვების AGENT_FIELDS-ის სარკე)
      budget_min: eBudgetMin.trim() ? parseFloat(eBudgetMin) || null : null,
      budget_max: eBudgetMax.trim() ? parseFloat(eBudgetMax) || null : null,
      notes: eNotes.trim() || null,
      // მენეჯმენტის დამატებითი ველები (MANAGER_FIELDS)
      ...(isMgmt
        ? {
            full_name: eName.trim() || lead.full_name,
            phone: ePhone.trim() || null,
            email: eEmail.trim() || null,
            source: eSource.trim() || null,
          }
        : {}),
    });
    setSaving(false);
    if (error) {
      Alert.alert('შეცდომა', error);
      return;
    }
    setEditModal(false);
    load();
  }

  async function openAptPicker() {
    setApartments(await fetchApartments());
    setAptModal(true);
  }

  async function onLinkApartment(apt: ApartmentWithRefs) {
    if (!lead) return;
    setSaving(true);
    const { error } = await addLeadInterest(lead.id, apt);
    setSaving(false);
    setAptModal(false);
    if (error) {
      Alert.alert('შეცდომა', error);
      return;
    }
    load();
  }

  function onRemoveInterest(it: LeadInterest) {
    Alert.alert('ინტერესის მოხსნა', `${it.apartment_code ?? 'ბინა'} — მოიხსნას?`, [
      { text: 'არა', style: 'cancel' },
      {
        text: 'მოხსნა',
        style: 'destructive',
        onPress: async () => {
          const { error } = await removeLeadInterest(it.id);
          if (error) Alert.alert('შეცდომა', error);
          else load();
        },
      },
    ]);
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

  const status = (lead.status as LeadStatus) ?? 'to_contact';
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
      <Button title="✏️ ლიდის რედაქტირება" variant="outline" onPress={openEdit} />

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
        <Field
          label="წყარო"
          value={lead.source ? LEAD_SOURCE_LABELS[lead.source] ?? lead.source : null}
        />
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
        {(status as string) === 'lost' || status === 'not_interested' ? (
          <Field
            label="დაკარგვის მიზეზი"
            value={
              lead.loss_reason
                ? LOSS_REASON_LABELS[lead.loss_reason] ?? lead.loss_reason
                : null
            }
          />
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

      {/* დაინტერესებული ბინები */}
      <View>
        <Text style={styles.sectionTitle}>
          🏢 დაინტერესებული ბინები ({interests.length})
        </Text>
        <Card>
          <View style={styles.interestWrap}>
            {interests.map((it) => (
              <Pressable
                key={it.id}
                onLongPress={() => onRemoveInterest(it)}
                style={styles.interestChip}
              >
                <Text style={styles.interestText}>{it.apartment_code ?? '—'}</Text>
                <Text style={styles.interestX} onPress={() => onRemoveInterest(it)}>
                  {' '}✕
                </Text>
              </Pressable>
            ))}
            <Pressable style={styles.interestAdd} onPress={openAptPicker}>
              <Text style={styles.interestAddText}>＋ ბინის მიბმა</Text>
            </Pressable>
          </View>
        </Card>
      </View>

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
            {/* მიზეზი ბაზის დაშვებული სიიდან (leads_loss_reason_check) */}
            <View style={styles.lossChipWrap}>
              {LOSS_REASONS.map((r) => (
                <Pressable
                  key={r}
                  onPress={() => setLossReason(lossReason === r ? '' : r)}
                  style={[styles.lossChip, lossReason === r && styles.lossChipActive]}
                >
                  <Text
                    style={[
                      styles.lossChipText,
                      lossReason === r && styles.lossChipTextActive,
                    ]}
                  >
                    {LOSS_REASON_LABELS[r]}
                  </Text>
                </Pressable>
              ))}
            </View>
            <TextInput
              style={styles.noteInput}
              placeholder="დამატებითი კომენტარი (არასავალდებულო)"
              placeholderTextColor={colors.textMuted}
              value={lossNote}
              onChangeText={setLossNote}
              multiline
            />
            <View style={{ gap: spacing.sm }}>
              <Button
                title="დადასტურება"
                onPress={() =>
                  applyStatus('not_interested', lossReason || 'other', lossNote)
                }
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

      {/* ── მოდალი: ლიდის რედაქტირება ── */}
      <Modal visible={editModal} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <ScrollView keyboardShouldPersistTaps="handled">
              <Text style={styles.modalTitle}>ლიდის რედაქტირება</Text>

              {role && CAN_ASSIGN.includes(role) ? (
                <>
                  <TextInput
                    style={styles.noteInput}
                    value={eName}
                    onChangeText={setEName}
                    placeholder="სახელი და გვარი"
                    placeholderTextColor={colors.textMuted}
                  />
                  <TextInput
                    style={styles.noteInput}
                    value={ePhone}
                    onChangeText={setEPhone}
                    placeholder="ტელეფონი"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="phone-pad"
                  />
                  <TextInput
                    style={styles.noteInput}
                    value={eEmail}
                    onChangeText={setEEmail}
                    placeholder="ელფოსტა"
                    placeholderTextColor={colors.textMuted}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                  {/* წყარო — მხოლოდ ბაზის დაშვებული მნიშვნელობებიდან */}
                  <View style={styles.lossChipWrap}>
                    {LEAD_SOURCES.map((s) => (
                      <Pressable
                        key={s}
                        onPress={() => setESource(eSource === s ? '' : s)}
                        style={[
                          styles.lossChip,
                          eSource === s && styles.lossChipActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.lossChipText,
                            eSource === s && styles.lossChipTextActive,
                          ]}
                        >
                          {LEAD_SOURCE_LABELS[s]}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </>
              ) : (
                <Text style={styles.sectionLabel}>
                  (სახელს/კონტაქტს მხოლოდ მენეჯმენტი ცვლის — შენ შეგიძლია
                  ბიუჯეტი და შენიშვნა)
                </Text>
              )}

              <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                <TextInput
                  style={[styles.noteInput, { flex: 1 }]}
                  value={eBudgetMin}
                  onChangeText={setEBudgetMin}
                  placeholder="ბიუჯეტი: მინ"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                />
                <TextInput
                  style={[styles.noteInput, { flex: 1 }]}
                  value={eBudgetMax}
                  onChangeText={setEBudgetMax}
                  placeholder="მაქს"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                />
              </View>

              <TextInput
                style={styles.noteInput}
                value={eNotes}
                onChangeText={setENotes}
                placeholder="ზოგადი შენიშვნა"
                placeholderTextColor={colors.textMuted}
                multiline
              />

              <View style={{ gap: spacing.sm }}>
                <Button title="შენახვა" onPress={onSaveEdit} loading={saving} />
                <Button
                  title="გაუქმება"
                  variant="outline"
                  onPress={() => setEditModal(false)}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── მოდალი: ბინის მიბმა ── */}
      <Modal visible={aptModal} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>რომელი ბინა აინტერესებს?</Text>
            <ScrollView style={{ maxHeight: 380 }}>
              {apartments.map((a) => (
                <Pressable
                  key={a.id}
                  onPress={() => onLinkApartment(a)}
                  style={styles.teamRow}
                >
                  <Text style={styles.body}>🏢 {a.code}</Text>
                  <Text style={styles.teamRole}>
                    {a.price ? `${a.price.toLocaleString('ka-GE')} ${a.currency ?? ''}` : ''}
                    {a.status === 'available' ? ' · თავისუფალი' : a.status === 'reserved' ? ' · დაჯავშნული' : ' · გაყიდული'}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
            <Button title="გაუქმება" variant="outline" onPress={() => setAptModal(false)} />
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
  interestWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  interestChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    backgroundColor: colors.primary + '10',
  },
  interestText: { fontSize: font.size.sm, color: colors.primary, fontWeight: font.weight.semibold },
  interestX: { fontSize: font.size.sm, color: colors.danger },
  interestAdd: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.textMuted,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  interestAddText: { fontSize: font.size.sm, color: colors.textMuted },
  lossChipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  lossChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    backgroundColor: colors.bg,
  },
  lossChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  lossChipText: { fontSize: font.size.sm, color: colors.text },
  lossChipTextActive: { color: colors.textInverse, fontWeight: font.weight.bold },
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
