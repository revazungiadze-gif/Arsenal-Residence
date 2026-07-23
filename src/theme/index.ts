/**
 * src/theme/index.ts
 *
 * აპის ფერები. აქცენტ-ფერები აქტიური კომპანიის ბრენდიდან მოდის
 * (white-label), დანარჩენი — ნეიტრალური პალიტრა.
 */
import { getActiveTenant } from '@/config/tenants';

const branding = getActiveTenant().branding;

export const colors = {
  primary: branding.primaryColor,
  dark: branding.darkColor,

  bg: '#F6F7F9',
  card: '#FFFFFF',
  border: '#E6E8EB',

  text: '#111827',
  textMuted: '#6B7280',
  textInverse: '#FFFFFF',

  success: '#22C55E',
  danger: '#EF4444',
  warning: '#F59E0B',
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
