/**
 * app/(app)/more.tsx — პროფილი, კომპანია, გასვლა.
 */
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { getActiveTenant, isFeatureEnabled } from '@/config/tenants';
import { Button, Card } from '@/components/ui';
import { ROLE_LABELS } from '@/types/crm';
import { colors, font, spacing } from '@/theme';

const FUTURE_SECTIONS: { key: Parameters<typeof isFeatureEnabled>[0]; label: string }[] = [
  { key: 'tasks', label: 'დავალებები' },
  { key: 'bookings', label: 'ჯავშნები' },
  { key: 'analytics', label: 'ანალიტიკა' },
  { key: 'marketing', label: 'მარკეტინგი' },
  { key: 'notifications', label: 'შეტყობინებები' },
  { key: 'ai_copilot', label: 'AI კოპილოტი' },
];

export default function More() {
  const { profile, role, session, signOut } = useAuth();
  const tenant = getActiveTenant();

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
        <Text style={styles.sectionTitle}>მალე დაემატება</Text>
        {FUTURE_SECTIONS.map((s) => (
          <View key={s.key} style={styles.futureRow}>
            <Text style={styles.body}>{s.label}</Text>
            <Text style={[styles.pill, isFeatureEnabled(s.key) ? styles.pillOn : styles.pillOff]}>
              {isFeatureEnabled(s.key) ? 'ჩართული' : 'გამორთული'}
            </Text>
          </View>
        ))}
      </Card>

      <Button title="გასვლა" variant="outline" onPress={signOut} />
      <Text style={styles.version}>სიარემი მობილური · v0.1.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
