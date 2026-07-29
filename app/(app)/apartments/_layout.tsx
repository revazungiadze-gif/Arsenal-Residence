/**
 * app/(app)/apartments/_layout.tsx — ბინების stack (სია → დეტალი).
 */
import { Stack } from 'expo-router';
import { colors, font } from '@/theme';

export default function ApartmentsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.dark },
        headerTintColor: colors.textInverse,
        headerTitleStyle: { fontWeight: font.weight.semibold },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'ბინები' }} />
      <Stack.Screen name="[id]" options={{ title: 'ბინა' }} />
    </Stack>
  );
}
