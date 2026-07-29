/**
 * app/(app)/bookings.tsx — ჯავშნები (ეტაპი 4).
 * agent: ითხოვს ჯავშანს (ლიდი + ხელმისაწვდომი ბინა).
 * admin/director: ამტკიცებს ან უარყოფს (მიზეზით) — ვების ლოგიკის სარკე.
 */
import { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import {
  BOOKING_STATUS_COLORS,
  BOOKING_STATUS_LABELS,
  createBooking,
  fetchAvailableApartments,
  fetchBookings,
  fetchMyLeads,
  reviewBooking,
  type BookingWithRefs,
} from '@/lib/bookings';
import { useAuth } from '@/context/AuthContext';
import { Badge, Button, Card, EmptyState } from '@/components/ui';
import type { Apartment, Lead } from '@/types/crm';
import { colors, font, radius, spacing } from '@/theme';

const CAN_REVIEW = ['admin', 'director'];

export default function Bookings() {
  const { session, role } = useAuth();
  const [bookings, setBookings] = useState<BookingWithRefs[]>([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<'pending' | 'all'>('pending');
  const [saving, setSaving] = useState(false);

  // ახალი ჯავშნის მოდალი
  const [modal, setModal] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [pickedLead, setPickedLead] = useState<Lead | null>(null);
  const [pickedApt, setPickedApt] = useState<Apartment | null>(null);
  const [note, setNote] = useState('');

  // უარყოფის მოდალი
  const [rejecting, setRejecting] = useState<BookingWithRefs | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setBookings(await fetchBookings());
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const visible = useMemo(
    () => bookings.filter((b) => (tab === 'pending' ? b.status === 'pending' : true)),
    [bookings, tab]
  );

  const canReview = role ? CAN_REVIEW.includes(role) : false;

  async function openModal() {
    setPickedLead(null);
    setPickedApt(null);
    setNote('');
    const [l, a] = await Promise.all([fetchMyLeads(), fetchAvailableApartments()]);
    setLeads(l);
    setApartments(a);
    setModal(true);
  }

  async function onCreate() {
    if (!pickedLead || !pickedApt || !session?.user) return;
    setSaving(true);
    const { error } = await createBooking({
      apartment_id: pickedApt.id,
      lead_id: pickedLead.id,
      note,
      requested_by: session.user.id,
    });
    setSaving(false);
    if (error) {
      Alert.alert('შეცდომა', error);
      return;
    }
    setModal(false);
    load();
  }

  async function onApprove(b: BookingWithRefs) {
    if (!session?.user) return;
    Alert.alert('დამტკიცება', `ბინა ${b.apartments?.code ?? ''} — დაჯავშნოს?`, [
      { text: 'გაუქმება', style: 'cancel' },
      {
        text: 'დამტკიცება',
        onPress: async () => {
          setSaving(true);
          const { error } = await reviewBooking(b, 'approve', session.user.id);
          setSaving(false);
          if (error) Alert.alert('შეცდომა', error);
          load();
        },
      },
    ]);
  }

  async function onCancel(b: BookingWithRefs) {
    if (!session?.user) return;
    Alert.alert(
      'ჯავშნის გაუქმება',
      `ბინა ${b.apartments?.code ?? ''} კვლავ ხელმისაწვდომი გახდება. გაუქმდეს?`,
      [
        { text: 'არა', style: 'cancel' },
        {
          text: 'გაუქმება',
          style: 'destructive',
          onPress: async () => {
            setSaving(true);
            const { error } = await reviewBooking(b, 'cancel', session.user.id);
            setSaving(false);
            if (error) Alert.alert('შეცდომა', error);
            load();
          },
        },
      ]
    );
  }

  async function onReject() {
    if (!rejecting || !session?.user) return;
    setSaving(true);
    const { error } = await reviewBooking(
      rejecting,
      'reject',
      session.user.id,
      rejectReason
    );
    setSaving(false);
    if (error) {
      Alert.alert('შეცდომა', error);
      return;
    }
    setRejecting(null);
    load();
  }

  return (
    <View style={styles.screen}>
      <View style={styles.tabs}>
        <TabBtn
          label={`მოლოდინში (${bookings.filter((b) => b.status === 'pending').length})`}
          active={tab === 'pending'}
          onPress={() => setTab('pending')}
        />
        <TabBtn label="ყველა" active={tab === 'all'} onPress={() => setTab('all')} />
      </View>

      <FlatList
        data={visible}
        keyExtractor={(b) => b.id}
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: 90 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        ListEmptyComponent={
          !loading ? <EmptyState text="ჯავშნები არ არის" /> : null
        }
        renderItem={({ item }) => (
          <Card>
            <View style={styles.rowTop}>
              <Text style={styles.aptCode}>🏢 {item.apartments?.code ?? '—'}</Text>
              <Badge
                label={BOOKING_STATUS_LABELS[item.status] ?? item.status}
                color={BOOKING_STATUS_COLORS[item.status] ?? colors.textMuted}
              />
            </View>
            <Text style={styles.leadName}>👤 {item.leads?.full_name ?? '—'}</Text>
            {item.apartments?.price ? (
              <Text style={styles.meta}>
                💰 {item.apartments.price} {item.apartments.currency ?? ''}
                {item.apartments.area ? ` · ${item.apartments.area} მ²` : ''}
              </Text>
            ) : null}
            {item.note ? <Text style={styles.note}>„{item.note}"</Text> : null}
            {item.status === 'rejected' && item.reject_reason ? (
              <Text style={styles.rejectReason}>მიზეზი: {item.reject_reason}</Text>
            ) : null}
            <Text style={styles.meta}>{fmt(item.created_at)}</Text>

            {canReview && item.status === 'pending' ? (
              <View style={styles.actions}>
                <Pressable
                  style={[styles.actionBtn, styles.approveBtn]}
                  disabled={saving}
                  onPress={() => onApprove(item)}
                >
                  <Text style={styles.actionBtnText}>✓ დამტკიცება</Text>
                </Pressable>
                <Pressable
                  style={[styles.actionBtn, styles.rejectBtn]}
                  disabled={saving}
                  onPress={() => {
                    setRejectReason('');
                    setRejecting(item);
                  }}
                >
                  <Text style={styles.actionBtnText}>✕ უარყოფა</Text>
                </Pressable>
              </View>
            ) : null}

            {canReview && item.status === 'approved' ? (
              <View style={styles.actions}>
                <Pressable
                  style={[styles.actionBtn, styles.cancelBtn]}
                  disabled={saving}
                  onPress={() => onCancel(item)}
                >
                  <Text style={styles.actionBtnText}>↩️ ჯავშნის გაუქმება</Text>
                </Pressable>
              </View>
            ) : null}
          </Card>
        )}
      />

      {role !== 'marketing' ? (
        <Pressable style={styles.fab} onPress={openModal}>
          <Text style={styles.fabText}>＋</Text>
        </Pressable>
      ) : null}

      {/* ── მოდალი: ახალი ჯავშნის მოთხოვნა ── */}
      <Modal visible={modal} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <ScrollView keyboardShouldPersistTaps="handled">
              <Text style={styles.modalTitle}>ჯავშნის მოთხოვნა</Text>

              <Text style={styles.label}>ლიდი *</Text>
              <View style={styles.pickBox}>
                <ScrollView style={{ maxHeight: 150 }} nestedScrollEnabled>
                  {leads.map((l) => (
                    <PickRow
                      key={l.id}
                      label={l.full_name}
                      sub={l.phone ?? undefined}
                      active={pickedLead?.id === l.id}
                      onPress={() => setPickedLead(l)}
                    />
                  ))}
                  {leads.length === 0 ? (
                    <Text style={styles.meta}>აქტიური ლიდი არ გაქვს</Text>
                  ) : null}
                </ScrollView>
              </View>

              <Text style={styles.label}>ბინა (ხელმისაწვდომი) *</Text>
              <View style={styles.pickBox}>
                <ScrollView style={{ maxHeight: 150 }} nestedScrollEnabled>
                  {apartments.map((a) => (
                    <PickRow
                      key={a.id}
                      label={a.code}
                      sub={`${a.price ?? '—'} ${a.currency ?? ''} · ${a.area ?? '—'} მ²`}
                      active={pickedApt?.id === a.id}
                      onPress={() => setPickedApt(a)}
                    />
                  ))}
                  {apartments.length === 0 ? (
                    <Text style={styles.meta}>ხელმისაწვდომი ბინა არ არის</Text>
                  ) : null}
                </ScrollView>
              </View>

              <Text style={styles.label}>შენიშვნა</Text>
              <TextInput
                style={styles.input}
                value={note}
                onChangeText={setNote}
                placeholder="არასავალდებულო..."
                placeholderTextColor={colors.textMuted}
                multiline
              />

              <View style={{ gap: spacing.sm, marginTop: spacing.md }}>
                <Button
                  title="მოთხოვნის გაგზავნა"
                  onPress={onCreate}
                  loading={saving}
                  disabled={!pickedLead || !pickedApt}
                />
                <Button title="გაუქმება" variant="outline" onPress={() => setModal(false)} />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── მოდალი: უარყოფის მიზეზი ── */}
      <Modal visible={!!rejecting} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>უარყოფის მიზეზი *</Text>
            <TextInput
              style={styles.input}
              value={rejectReason}
              onChangeText={setRejectReason}
              placeholder="მაგ. ბინა სხვა კლიენტს ეთანხმება..."
              placeholderTextColor={colors.textMuted}
              multiline
              autoFocus
            />
            <View style={{ gap: spacing.sm, marginTop: spacing.md }}>
              <Button
                title="უარყოფა"
                onPress={onReject}
                loading={saving}
                disabled={!rejectReason.trim()}
              />
              <Button title="გაუქმება" variant="outline" onPress={() => setRejecting(null)} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function PickRow({
  label,
  sub,
  active,
  onPress,
}: {
  label: string;
  sub?: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.pickRow, active && styles.pickRowActive]}
    >
      <Text style={[styles.pickLabel, active && { color: colors.primary }]}>
        {active ? '● ' : '○ '}
        {label}
      </Text>
      {sub ? <Text style={styles.meta}>{sub}</Text> : null}
    </Pressable>
  );
}

function TabBtn({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.tabBtn, active && styles.tabBtnActive]}>
      <Text style={[styles.tabBtnText, active && styles.tabBtnTextActive]}>{label}</Text>
    </Pressable>
  );
}

function fmt(date: string | null): string {
  if (!date) return '';
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
  tabs: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.lg,
    paddingBottom: spacing.sm,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    backgroundColor: colors.bg,
  },
  tabBtnActive: { backgroundColor: colors.dark, borderColor: colors.dark },
  tabBtnText: { fontSize: font.size.sm, color: colors.text },
  tabBtnTextActive: { color: colors.textInverse, fontWeight: font.weight.semibold },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  aptCode: { fontSize: font.size.lg, fontWeight: font.weight.bold, color: colors.text },
  leadName: { fontSize: font.size.md, color: colors.text, marginTop: spacing.xs },
  meta: { fontSize: font.size.xs, color: colors.textMuted, marginTop: 4 },
  note: { fontSize: font.size.sm, color: colors.text, fontStyle: 'italic', marginTop: 4 },
  rejectReason: { fontSize: font.size.sm, color: colors.danger, marginTop: 4 },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  actionBtn: {
    flex: 1,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  approveBtn: { backgroundColor: colors.success },
  rejectBtn: { backgroundColor: colors.danger },
  cancelBtn: { backgroundColor: colors.textMuted },
  actionBtnText: { color: '#fff', fontWeight: font.weight.semibold, fontSize: font.size.sm },
  fab: {
    position: 'absolute',
    right: spacing.xl,
    bottom: spacing.xl,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  fabText: { color: '#fff', fontSize: 28, lineHeight: 32, fontWeight: font.weight.bold },
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
    maxHeight: '88%',
  },
  modalTitle: {
    fontSize: font.size.lg,
    fontWeight: font.weight.bold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  label: {
    fontSize: font.size.sm,
    color: colors.textMuted,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  pickBox: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  pickRow: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.sm,
  },
  pickRowActive: { backgroundColor: colors.primary + '15' },
  pickLabel: { fontSize: font.size.md, color: colors.text },
  input: {
    minHeight: 60,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: font.size.md,
    color: colors.text,
    textAlignVertical: 'top',
  },
});
