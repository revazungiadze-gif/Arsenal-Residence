/**
 * app/(app)/apartments/[id].tsx — ბინის დეტალი (ეტაპი 6).
 * ფოტოები, მახასიათებლები, ლიდის ინტერესის მიბმა.
 */
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import {
  APT_STATUS_COLORS,
  APT_STATUS_LABELS,
  addLeadInterest,
  fetchActiveLeads,
  fetchApartmentImages,
  fmtPrice,
  type ApartmentImage,
} from '@/lib/apartments';
import { useAuth } from '@/context/AuthContext';
import { Badge, Button, Card, EmptyState } from '@/components/ui';
import type { Apartment, Lead } from '@/types/crm';
import { colors, font, radius, spacing } from '@/theme';

export default function ApartmentDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { role } = useAuth();
  const [apt, setApt] = useState<Apartment | null>(null);
  const [images, setImages] = useState<ApartmentImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [leadModal, setLeadModal] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const [{ data: aptData }, imgs] = await Promise.all([
      supabase.from('apartments').select('*').eq('id', id).single(),
      fetchApartmentImages(id),
    ]);
    setApt(aptData ?? null);
    setImages(imgs);
    setLoading(false);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  function onChangeStatus(next: 'available' | 'reserved' | 'sold') {
    if (!apt) return;
    const labels = { available: 'თავისუფალი', reserved: 'დაჯავშნული', sold: 'გაყიდული' };
    Alert.alert('სტატუსის შეცვლა', `${apt.code} → ${labels[next]}?`, [
      { text: 'გაუქმება', style: 'cancel' },
      {
        text: 'შეცვლა',
        onPress: async () => {
          setSaving(true);
          const { error } = await supabase
            .from('apartments')
            .update({ status: next, updated_at: new Date().toISOString() })
            .eq('id', apt.id);
          setSaving(false);
          if (error) Alert.alert('შეცდომა', error.message);
          load();
        },
      },
    ]);
  }

  async function openLeadPicker() {
    setLeads(await fetchActiveLeads());
    setLeadModal(true);
  }

  async function onPickLead(lead: Lead) {
    if (!apt) return;
    setSaving(true);
    const { error } = await addLeadInterest(lead.id, apt);
    setSaving(false);
    setLeadModal(false);
    if (error) {
      Alert.alert('შეცდომა', error);
      return;
    }
    Alert.alert('✅ მიება', `${lead.full_name} ← ${apt.code}`);
  }

  if (loading && !apt) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!apt) return <EmptyState text="ბინა ვერ მოიძებნა" />;

  const status = apt.status ?? 'available';

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
    >
      <View style={styles.headRow}>
        <Text style={styles.code}>🏢 {apt.code}</Text>
        <Badge
          label={APT_STATUS_LABELS[status] ?? status}
          color={APT_STATUS_COLORS[status] ?? colors.textMuted}
        />
      </View>
      <Text style={styles.price}>{fmtPrice(apt)}</Text>

      {images.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            {images.map((img) => (
              <Image
                key={img.id}
                source={{ uri: img.url }}
                style={styles.photo}
                resizeMode="cover"
              />
            ))}
          </View>
        </ScrollView>
      ) : null}

      <Card>
        <Field label="ფართი" value={apt.area != null ? `${apt.area} მ²` : null} />
        <Field label="საძინებლები" value={apt.bedrooms != null ? `${apt.bedrooms}` : null} />
        <Field label="აივანი" value={apt.balcony == null ? null : apt.balcony ? 'კი' : 'არა'} />
        <Field label="პარკინგი" value={apt.parking == null ? null : apt.parking ? 'კი' : 'არა'} />
        <Field label="ხედი" value={apt.facing} />
        <Field
          label="განვადება"
          value={apt.installment_eligible ? 'შესაძლებელია' : 'არა'}
        />
        <Field label="ნახვები საიტზე" value={`${apt.view_count}`} last />
      </Card>

      {role !== 'marketing' ? (
        <Button title="👤 ლიდის ინტერესის მიბმა" onPress={openLeadPicker} loading={saving} />
      ) : null}

      {/* სტატუსის შეცვლა — მხოლოდ admin/director (გაყიდვის დაფიქსირება) */}
      {role === 'admin' || role === 'director' ? (
        <Card>
          <Text style={styles.sectionLabel}>სტატუსის შეცვლა</Text>
          <View style={styles.statusRow}>
            {(['available', 'reserved', 'sold'] as const).map((s) => {
              const active = status === s;
              const c = APT_STATUS_COLORS[s];
              return (
                <Pressable
                  key={s}
                  disabled={saving || active}
                  onPress={() => onChangeStatus(s)}
                  style={[
                    styles.statusChip,
                    { borderColor: c },
                    active && { backgroundColor: c },
                  ]}
                >
                  <Text style={[styles.statusChipText, { color: active ? '#fff' : c }]}>
                    {APT_STATUS_LABELS[s]}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Card>
      ) : null}

      {/* ── მოდალი: ლიდის არჩევა ── */}
      <Modal visible={leadModal} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>რომელი ლიდი ინტერესდება?</Text>
            <ScrollView style={{ maxHeight: 380 }}>
              {leads.map((l) => (
                <Pressable
                  key={l.id}
                  onPress={() => onPickLead(l)}
                  style={styles.leadRow}
                >
                  <Text style={styles.leadName}>{l.full_name}</Text>
                  <Text style={styles.meta}>{l.phone ?? l.email ?? ''}</Text>
                </Pressable>
              ))}
              {leads.length === 0 ? (
                <EmptyState text="აქტიური ლიდი არ გაქვს" />
              ) : null}
            </ScrollView>
            <Button title="გაუქმება" variant="outline" onPress={() => setLeadModal(false)} />
          </View>
        </View>
      </Modal>
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

const styles = StyleSheet.create({
  sectionLabel: { fontSize: font.size.sm, color: colors.textMuted, marginBottom: spacing.sm },
  statusRow: { flexDirection: 'row', gap: spacing.sm },
  statusChip: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    backgroundColor: colors.card,
  },
  statusChipText: { fontSize: font.size.sm, fontWeight: font.weight.semibold },
  screen: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  headRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  code: { fontSize: font.size.xl, fontWeight: font.weight.bold, color: colors.text },
  price: { fontSize: font.size.xl, fontWeight: font.weight.bold, color: colors.primary },
  photo: { width: 260, height: 170, borderRadius: radius.lg, backgroundColor: colors.border },
  field: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.md },
  fieldBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  fieldLabel: { fontSize: font.size.sm, color: colors.textMuted },
  fieldValue: { fontSize: font.size.md, color: colors.text, fontWeight: font.weight.medium },
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
    gap: spacing.md,
    maxHeight: '85%',
  },
  modalTitle: { fontSize: font.size.lg, fontWeight: font.weight.bold, color: colors.text },
  leadRow: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  leadName: { fontSize: font.size.md, color: colors.text, fontWeight: font.weight.medium },
  meta: { fontSize: font.size.sm, color: colors.textMuted, marginTop: 2 },
});
