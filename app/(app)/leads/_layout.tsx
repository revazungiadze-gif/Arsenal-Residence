/**
 * app/(app)/leads/_layout.tsx — ლიდების სექციის stack (სია → დეტალი → ახალი).
 * ჰედერში „＋" ღილაკი ახალი ლიდისთვის.
 */
import { Link, Stack } from 'expo-router';
import { Pressable, Text } from 'react-native';
import { colors, font } from '@/theme';

function AddLeadButton() {
  return (
    <Link href="/(app)/leads/new" asChild>
      <Pressable hitSlop={12} style={{ paddingHorizontal: 4 }}>
        <Text
          style={{
            color: colors.primary,
            fontSize: 30,
            fontWeight: font.weight.bold,
            lineHeight: 32,
          }}
        >
          ＋
        </Text>
      </Pressable>
    </Link>
  );
}

export default function LeadsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.dark },
        headerTintColor: colors.textInverse,
        headerTitleStyle: { fontWeight: font.weight.semibold },
      }}
    >
      <Stack.Screen
        name="index"
        options={{ title: 'ლიდები', headerRight: () => <AddLeadButton /> }}
      />
      <Stack.Screen name="[id]" options={{ title: 'ლიდი' }} />
      <Stack.Screen name="new" options={{ title: 'ახალი ლიდი' }} />
    </Stack>
  );
}
