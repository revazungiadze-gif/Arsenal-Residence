/**
 * src/theme/index.ts
 *
 * აპის ფერები — ვებ-CRM-ის ზუსტი პალიტრა (tailwind.config.ts-დან):
 *   brand.dark #1a1a1a · ბარათი #2a2a2a · teal #00B4A6 · gold #C9A84C
 *   ტექსტი: თეთრი / gray-400 #A0A0A0 · სტატუსები: 22C55E/EAB308/EF4444
 * აქცენტ-ფერები აქტიური კომპანიის ბრენდიდან მოდის (white-label).
 */
import { getActiveTenant } from '@/config/tenants';

const branding = getActiveTenant().branding;

export const colors = {
  primary: branding.primaryColor, // arsenal: teal #00B4A6
  gold: '#C9A84C',
  dark: branding.darkColor, // arsenal: #1a1a1a (ჰედერები/ტაბ-ბარი)

  bg: '#141414',
  card: '#1e1e1e',
  border: '#2e2e2e',
  inputBg: '#242424',

  text: '#FFFFFF',
  textMuted: '#A0A0A0',
  textInverse: '#FFFFFF',

  success: '#22C55E',
  danger: '#EF4444',
  warning: '#EAB308',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
};

export const font = {
  size: { xs: 12, sm: 14, md: 16, lg: 18, xl: 22, xxl: 28 },
  weight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
};
