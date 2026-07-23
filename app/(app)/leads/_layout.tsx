/**
 * app/(app)/leads/_layout.tsx — ლიდების სექციის stack (სია → დეტალი).
 */
import { Stack } from 'expo-router';
import { colors, font } from '@/theme';

export default function LeadsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.dark },
        headerTintColor: colors.textInverse,
        headerTitleStyle: { fontWeight: font.weight.semibold },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'ლიდები' }} />
      <Stack.Screen name="[id]" options={{ title: 'ლიდი' }} />
    </Stack>
  );
}
