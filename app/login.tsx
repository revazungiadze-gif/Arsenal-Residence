/**
 * app/login.tsx — შესვლის ეკრანი.
 * იგივე Supabase auth, რასაც ვები. აქტიური კომპანიის ბრენდით.
 */
import { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Redirect } from 'expo-router';
import Constants from 'expo-constants';
import { useAuth } from '@/context/AuthContext';
import { getActiveTenant } from '@/config/tenants';
import { Button } from '@/components/ui';
import { colors, font, radius, spacing } from '@/theme';

export default function Login() {
  const { session, signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const tenant = getActiveTenant();

  if (session) return <Redirect href="/(app)/dashboard" />;

  async function onSubmit() {
    setError(null);
    if (!email || !password) {
      setError('შეავსე ელფოსტა და პაროლი.');
      return;
    }
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) setError(error);
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: tenant.branding.darkColor }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        {tenant.branding.logoAsset ? (
          <Image
            source={tenant.branding.logoAsset}
            style={styles.logo}
            resizeMode="contain"
          />
        ) : (
          <Text style={[styles.brand, { color: tenant.branding.primaryColor }]}>
            {tenant.branding.displayName}
          </Text>
        )}
        <Text style={styles.subtitle}>სიარემი · CRM</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>ელფოსტა</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          placeholder="you@example.com"
          placeholderTextColor="#94A3B8"
        />

        <Text style={styles.label}>პაროლი</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="password"
          placeholder="••••••••"
          placeholderTextColor="#94A3B8"
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={{ height: spacing.lg }} />
        <Button title="შესვლა" onPress={onSubmit} loading={loading} />
      </View>

      <Text style={styles.footer}>
        {tenant.branding.displayName} · მობილური CRM · v
        {Constants.expoConfig?.version ?? '?'}
      </Text>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: spacing.xl },
  header: { alignItems: 'center', marginBottom: spacing.xxl },
  logo: { width: 280, height: 90 },
  brand: { fontSize: font.size.xxl, fontWeight: font.weight.bold },
  subtitle: { color: '#94A3B8', fontSize: font.size.md, marginTop: spacing.xs },
  form: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.xl,
    gap: spacing.xs,
  },
  label: {
    fontSize: font.size.sm,
    fontWeight: font.weight.medium,
    color: colors.textMuted,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    fontSize: font.size.md,
    color: colors.text,
    backgroundColor: colors.inputBg,
  },
  error: { color: colors.danger, fontSize: font.size.sm, marginTop: spacing.md },
  footer: {
    textAlign: 'center',
    color: '#64748B',
    fontSize: font.size.xs,
    marginTop: spacing.xxl,
  },
});
