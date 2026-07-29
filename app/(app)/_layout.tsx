/**
 * app/(app)/_layout.tsx — ავტორიზებული ზონა.
 * Tab ნავიგაცია + guard (უავტორიზაციო მომხმარებელი login-ზე გადადის).
 */
import { Redirect, Tabs } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { isFeatureEnabled } from '@/config/tenants';
import { NotificationBell } from '@/components/NotificationBell';
import { colors, font } from '@/theme';

/** მარტივი ტექსტური ტაბ-იконა (გარე icon-პაკეტის გარეშე) */
function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  return (
    <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>{label}</Text>
  );
}

export default function AppLayout() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!session) return <Redirect href="/login" />;

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.dark },
        headerTintColor: colors.textInverse,
        headerTitleStyle: { fontWeight: font.weight.semibold },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontSize: 10 },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'მთავარი',
          headerRight: () => <NotificationBell />,
          tabBarIcon: ({ focused }) => <TabIcon label="📊" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="leads"
        options={{
          title: 'ლიდები',
          href: isFeatureEnabled('leads') ? undefined : null,
          // leads-ს საკუთარი Stack-ჰედერი აქვს — Tabs-ისას ვმალავთ (ორმაგი ჰედერი)
          headerShown: false,
          tabBarIcon: ({ focused }) => <TabIcon label="👥" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: 'დავალებები',
          href: isFeatureEnabled('tasks') ? undefined : null,
          headerShown: true,
          headerTitle: 'დავალებები',
          tabBarIcon: ({ focused }) => <TabIcon label="📋" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: 'ჯავშნები',
          href: isFeatureEnabled('bookings') ? undefined : null,
          headerShown: true,
          headerTitle: 'ჯავშნები',
          tabBarIcon: ({ focused }) => <TabIcon label="🔖" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="apartments"
        options={{
          title: 'ბინები',
          headerShown: false, // საკუთარი Stack-ჰედერი აქვს
          tabBarIcon: ({ focused }) => <TabIcon label="🏢" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: 'ანალიტიკა',
          // ტაბ-ბარში არ ჩანს — „მეტი"-დან იხსნება
          href: null,
          headerShown: true,
          headerTitle: 'ანალიტიკა',
        }}
      />
      <Tabs.Screen
        name="deals"
        options={{
          title: 'გარიგებები',
          href: null, // „მეტი"-დან იხსნება
          headerShown: true,
          headerTitle: '💼 გარიგებები',
        }}
      />
      <Tabs.Screen
        name="ai"
        options={{
          title: 'AI კოპილოტი',
          href: null, // „მეტი"-დან იხსნება
          headerShown: true,
          headerTitle: '🤖 AI კოპილოტი',
        }}
      />
      <Tabs.Screen
        name="team"
        options={{
          title: 'გუნდი',
          href: null, // „მეტი"-დან იხსნება
          headerShown: true,
          headerTitle: 'გუნდი',
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'შეტყობინებები',
          // ტაბ-ბარში არ ჩანს — ზარიდან (🔔) იხსნება
          href: null,
          headerShown: true,
          headerTitle: 'შეტყობინებები',
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'მეტი',
          tabBarIcon: ({ focused }) => <TabIcon label="⋯" focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.dark },
});
