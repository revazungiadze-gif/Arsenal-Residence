/**
 * app/(app)/leads/new.tsx — ახალი ლიდის დამატება.
 * agent-ის ლიდი ავტომატურად საკუთარ თავზე მიება (RLS-იც ამას ითხოვს);
 * მენეჯმენტს შეუძლია მიუნიჭებელიც შექმნას (მერე გაანაწილებს).
 */
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { createLead } from '@/lib/leads';
import { useAuth } from '@/context/AuthContext';
import { Button, Card } from '@/components/ui';
import { colors, font, radius, spacing } from '@/theme';

const SOURCES = ['შემომავალი ზარი', 'Facebook', 'Instagram', 'საიტი', 'რეკომენდაცია', 'სხვა'];

export default function NewLead() {
  const { session, role } = useAuth();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [source, setSource] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  async function onSave() {
    if (!fullName.trim()) {
      Alert.alert('შეავსე სახელი');
      return;
    }
    if (!session?.user) return;

    setSaving(true);
    const { error } = await createLead({
      full_name: fullName,
      phone,
      email,
      source: source || 'mobile_app',
      notes,
      // agent → ყოველთვის საკუთარ თავზე; მენეჯმენტიც თავიდან თავის თავზე,
      // მერე დეტალიდან გადაანაწილებს
      assigned_to: session.user.id,
    });
    setSaving(false);

    if (error) {
      Alert.alert('შეცდომა', error);
      return;
    }
    router.back();
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}
        keyboardShouldPersistTaps="handled"
      >
        <Card>
          <L label="სახელი და გვარი *" />
          <TextInput
            style={styles.input}
            value={fullName}
            onChangeText={setFullName}
            placeholder="მაგ. გიორგი ბერიძე"
            placeholderTextColor={colors.textMuted}
          />

          <L label="ტელეფონი" />
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholder="+995 5XX XX XX XX"
            placeholderTextColor={colors.textMuted}
          />

          <L label="ელფოსტა" />
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="name@example.com"
            placeholderTextColor={colors.textMuted}
          />

          <L label="წყარო" />
          <View style={styles.sourceWrap}>
            {SOURCES.map((s) => (
              <Text
                key={s}
                onPress={() => setSource(source === s ? '' : s)}
                style={[styles.sourceChip, source === s && styles.sourceChipActive]}
              >
                {s}
              </Text>
            ))}
          </View>

          <L label="შენიშვნა" />
          <TextInput
            style={[styles.input, styles.multiline]}
            value={notes}
            onChangeText={setNotes}
            multiline
            placeholder="დამატებითი ინფორმაცია..."
            placeholderTextColor={colors.textMuted}
          />
        </Card>

        <Button title="ლიდის შენახვა" onPress={onSave} loading={saving} />
        <Button title="გაუქმება" variant="outline" onPress={() => router.back()} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function L({ label }: { label: string }) {
  return <Text style={styles.label}>{label}</Text>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  label: {
    fontSize: font.size.sm,
    fontWeight: font.weight.medium,
    color: colors.textMuted,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: font.size.md,
    color: colors.text,
    backgroundColor: '#FFF',
  },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
  sourceWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  sourceChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    fontSize: font.size.sm,
    color: colors.text,
    overflow: 'hidden',
    backgroundColor: colors.bg,
  },
  sourceChipActive: {
    backgroundColor: colors.dark,
    borderColor: colors.dark,
    color: colors.textInverse,
  },
});
