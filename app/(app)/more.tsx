/**
 * app/(app)/more.tsx — პროფილი, კომპანია, გასვლა.
 */
import { useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { getActiveTenant, isFeatureEnabled } from '@/config/tenants';
import { changePassword, updateMyProfile } from '@/lib/team';
import { Button, Card } from '@/components/ui';
import { ROLE_LABELS } from '@/types/crm';
import { colors, font, radius, spacing } from '@/theme';

const MGMT = ['admin', 'director', 'sales_manager'];

export default function More() {
  const { profile, role, session, signOut } = useAuth();
  const tenant = getActiveTenant();

  // პროფილის რედაქტირება
  const [editModal, setEditModal] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  // პაროლის შეცვლა
  const [passModal, setPassModal] = useState(false);
  const [pass1, setPass1] = useState('');
  const [pass2, setPass2] = useState('');
  const [saving, setSaving] = useState(false);

  function openEdit() {
    setName(profile?.full_name ?? '');
    setPhone(profile?.phone ?? '');
    setEditModal(true);
  }

  async function onSaveProfile() {
    if (!session?.user) return;
    setSaving(true);
    const { error } = await updateMyProfile(session.user.id, {
      full_name: name,
      phone,
    });
    setSaving(false);
    if (error) {
      Alert.alert('შეცდომა', error);
      return;
    }
    setEditModal(false);
    Alert.alert('✅ შენახულია', 'ცვლილება ვებშიც აისახება.');
  }

  async function onChangePassword() {
    if (pass1 !== pass2) {
      Alert.alert('პაროლები არ ემთხვევა');
      return;
    }
    setSaving(true);
    const { error } = await changePassword(pass1);
    setSaving(false);
    if (error) {
      Alert.alert('შეცდომა', error);
      return;
    }
    setPass1('');
    setPass2('');
    setPassModal(false);
    Alert.alert('✅ პაროლი შეიცვალა');
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}>
      <Card>
        <Text style={styles.name}>{profile?.full_name || 'მომხმარებელი'}</Text>
        <Text style={styles.muted}>{session?.user.email}</Text>
        {role ? <Text style={styles.role}>{ROLE_LABELS[role]}</Text> : null}
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>კომპანია</Text>
        <Text style={styles.body}>{tenant.branding.displayName}</Text>
        <Text style={styles.muted}>tenant: {tenant.id}</Text>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>განყოფილებები</Text>
        <NavRow
          icon="🔔"
          label="შეტყობინებები"
          onPress={() => router.push('/(app)/notifications')}
        />
        {isFeatureEnabled('analytics') ? (
          <NavRow
            icon="📊"
            label={
              role === 'marketing'
                ? 'მარკეტინგის დეშბორდი'
                : 'ანალიტიკა · მარკეტინგი · ბონუსები'
            }
            onPress={() => router.push('/(app)/analytics')}
          />
        ) : null}
        {role !== 'marketing' ? (
          <NavRow
            icon="💼"
            label="გარიგებები (გაყიდვები)"
            onPress={() => router.push('/(app)/deals')}
          />
        ) : null}
        {isFeatureEnabled('ai_copilot') && role !== 'marketing' ? (
          <NavRow
            icon="🤖"
            label="AI კოპილოტი — ვისზე ვიმუშაო დღეს?"
            onPress={() => router.push('/(app)/ai')}
          />
        ) : null}
        {role && MGMT.includes(role) ? (
          <NavRow
            icon="👥"
            label="გუნდი"
            onPress={() => router.push('/(app)/team')}
          />
        ) : null}
        <NavRow icon="✏️" label="პროფილის რედაქტირება" onPress={openEdit} />
        <NavRow
          icon="🔑"
          label="პაროლის შეცვლა"
          onPress={() => {
            setPass1('');
            setPass2('');
            setPassModal(true);
          }}
        />
      </Card>

      <Button title="გასვლა" variant="outline" onPress={signOut} />
      <Text style={styles.version}>სიარემი მობილური · v0.1.0</Text>

      {/* ── მოდალი: პროფილის რედაქტირება ── */}
      <Modal visible={editModal} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>პროფილის რედაქტირება</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="სახელი და გვარი"
              placeholderTextColor={colors.textMuted}
            />
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="ტელეფონი"
              placeholderTextColor={colors.textMuted}
              keyboardType="phone-pad"
            />
            <View style={{ gap: spacing.sm, marginTop: spacing.md }}>
              <Button title="შენახვა" onPress={onSaveProfile} loading={saving} />
              <Button title="გაუქმება" variant="outline" onPress={() => setEditModal(false)} />
            </View>
          </View>
        </View>
      </Modal>

      {/* ── მოდალი: პაროლის შეცვლა ── */}
      <Modal visible={passModal} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>პაროლის შეცვლა</Text>
            <TextInput
              style={styles.input}
              value={pass1}
              onChangeText={setPass1}
              placeholder="ახალი პაროლი (მინ. 8 სიმბოლო)"
              placeholderTextColor={colors.textMuted}
              secureTextEntry
            />
            <TextInput
              style={styles.input}
              value={pass2}
              onChangeText={setPass2}
              placeholder="გაიმეორე პაროლი"
              placeholderTextColor={colors.textMuted}
              secureTextEntry
            />
            <View style={{ gap: spacing.sm, marginTop: spacing.md }}>
              <Button
                title="შეცვლა"
                onPress={onChangePassword}
                loading={saving}
                disabled={pass1.length < 8}
              />
              <Button title="გაუქმება" variant="outline" onPress={() => setPassModal(false)} />
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

function NavRow({
  icon,
  label,
  onPress,
}: {
  icon: string;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.navRow}>
      <Text style={styles.navIcon}>{icon}</Text>
      <Text style={styles.navLabel}>{label}</Text>
      <Text style={styles.navArrow}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  navIcon: { fontSize: 20 },
  navLabel: { flex: 1, fontSize: font.size.md, color: colors.text },
  navArrow: { fontSize: font.size.xl, color: colors.textMuted },
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
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    fontSize: font.size.md,
    color: colors.text,
  },
  screen: { flex: 1, backgroundColor: colors.bg },
  name: { fontSize: font.size.lg, fontWeight: font.weight.bold, color: colors.text },
  role: { fontSize: font.size.sm, color: colors.primary, marginTop: spacing.xs, fontWeight: font.weight.semibold },
  muted: { fontSize: font.size.sm, color: colors.textMuted, marginTop: 2 },
  sectionTitle: { fontSize: font.size.sm, color: colors.textMuted, marginBottom: spacing.sm },
  body: { fontSize: font.size.md, color: colors.text },
  futureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  pill: { fontSize: font.size.xs, fontWeight: font.weight.semibold, paddingHorizontal: spacing.md, paddingVertical: 2, borderRadius: 999, overflow: 'hidden' },
  pillOn: { color: colors.success, backgroundColor: colors.success + '1A' },
  pillOff: { color: colors.textMuted, backgroundColor: colors.border },
  version: { textAlign: 'center', fontSize: font.size.xs, color: colors.textMuted, marginTop: spacing.md },
});
