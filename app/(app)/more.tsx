/**
 * app/(app)/more.tsx — პროფილი, კომპანია, გასვლა.
 */
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { getActiveTenant, isFeatureEnabled } from '@/config/tenants';
import { Button, Card } from '@/components/ui';
import { ROLE_LABELS } from '@/types/crm';
import { colors, font, spacing } from '@/theme';

const FUTURE_SECTIONS: { key: Parameters<typeof isFeatureEnabled>[0]; label: string }[] = [
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
        <Text style={styles.sectionTitle}>განყოფილებები</Text>
        <NavRow
          icon="🔔"
          label="შეტყობინებები"
          onPress={() => router.push('/(app)/notifications')}
        />
        {isFeatureEnabled('analytics') && role !== 'marketing' ? (
          <NavRow
            icon="📊"
            label="ანალიტიკა · მარკეტინგი · ბონუსები"
            onPress={() => router.push('/(app)/analytics')}
          />
        ) : null}
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
