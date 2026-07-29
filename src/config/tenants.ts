/**
 * src/config/tenants.ts
 *
 * White-label / multi-tenant კონფიგურაცია.
 *
 * აპის "გული" ერთია — ყოველი კომპანია აქ ემატება ერთ ჩანაწერად:
 * თავისი Supabase პროექტით (ბექენდი) და ბრენდით. ახალი კომპანიის
 * დასამატებლად კოდის შეცვლა არ სჭირდება — მხოლოდ ახალი Tenant ობიექტი.
 *
 * არსენალი = პირველი (პილოტი). ის უკავშირდება არსებულ არსენალის
 * Supabase პროექტს — იმავე ბაზას, რომელსაც ვები იყენებს.
 */

export interface TenantBranding {
  /** კომპანიის სახელი (login/header-ზე ჩანს) */
  displayName: string;
  /** მთავარი ფერი (ღილაკები, აქცენტები) */
  primaryColor: string;
  /** მუქი ფონი (splash, header) */
  darkColor: string;
  /** ლოგოს URL ან require() — არასავალდებულო */
  logoUrl?: string;
}

export interface Tenant {
  /** უნიკალური იდენტიფიკატორი */
  id: string;
  /** კომპანიის Supabase პროექტის URL */
  supabaseUrl: string;
  /** კომპანიის Supabase anon (public) key */
  supabaseAnonKey: string;
  /** ბრენდირება */
  branding: TenantBranding;
  /**
   * ჩართული ფუნქციები (feature flags).
   * ვებ-CRM-ის `settings.role_features`-ის ანალოგი — კომპანია A-ს აქვს X,
   * B-ს არა. აქ მხოლოდ default-ებია; საბოლოო წყარო ბაზაა.
   */
  features?: Partial<Record<FeatureKey, boolean>>;
}

export type FeatureKey =
  | 'leads'
  | 'tasks'
  | 'bookings'
  | 'analytics'
  | 'marketing'
  | 'notifications'
  | 'ai_copilot';

/**
 * კონფიგი გარემოს ცვლადებიდან (EXPO_PUBLIC_*) იკითხება, რომ რეალური
 * გასაღებები კოდში/გითში არ მოხვდეს. ლოკალურად `.env`-ში ჩაწერე:
 *
 *   EXPO_PUBLIC_ARSENAL_SUPABASE_URL=https://xxxx.supabase.co
 *   EXPO_PUBLIC_ARSENAL_SUPABASE_ANON_KEY=eyJhbGci...
 */
// ⚠️ Expo env-ცვლადებს მხოლოდ სტატიკურ მიმართვას უსვამს ბანდლში —
// process.env[dynamicKey] ვერ მუშაობს, ამიტომ ყველა ცვლადი აქ, სახელით:
const ENV = {
  TENANT: process.env.EXPO_PUBLIC_TENANT ?? '',
  ARSENAL_URL: process.env.EXPO_PUBLIC_ARSENAL_SUPABASE_URL ?? '',
  ARSENAL_KEY: process.env.EXPO_PUBLIC_ARSENAL_SUPABASE_ANON_KEY ?? '',
};

export const TENANTS: Record<string, Tenant> = {
  arsenal: {
    id: 'arsenal',
    // Project URL — არსენალის Supabase პროექტი (nulcaugqpzfvletqpiev)
    supabaseUrl: ENV.ARSENAL_URL || 'https://nulcaugqpzfvletqpiev.supabase.co',
    // publishable/anon key — საჯარო გასაღები (.env-იდან იკითხება).
    // მონაცემებს RLS იცავს, არა ამ გასაღების დამალვა.
    supabaseAnonKey: ENV.ARSENAL_KEY,
    branding: {
      displayName: 'Arsenal Residence',
      primaryColor: '#C8A24B', // ოქროსფერი აქცენტი
      darkColor: '#0B1F3A', // მუქი ლურჯი
    },
    features: {
      leads: true,
      tasks: true,
      bookings: true,
      analytics: true,
      marketing: true,
      notifications: true,
      ai_copilot: true,
    },
  },

  // ── ახალი კომპანიის დამატება ასე ხდება ──────────────────────────────
  // (ჯერ ENV ობიექტს დაამატე COMPANYB_URL/COMPANYB_KEY სტატიკური მიმართვით)
  // companyB: {
  //   id: 'companyB',
  //   supabaseUrl: ENV.COMPANYB_URL,
  //   supabaseAnonKey: ENV.COMPANYB_KEY,
  //   branding: { displayName: 'Company B', primaryColor: '#2563EB', darkColor: '#0F172A' },
  //   features: { leads: true, tasks: true, notifications: true },
  // },
};

/**
 * აქტიური კომპანია. build-ისას EXPO_PUBLIC_TENANT-ით ირჩევა
 * (მაგ. `EXPO_PUBLIC_TENANT=arsenal`). default — arsenal.
 */
export const ACTIVE_TENANT_ID = ENV.TENANT || 'arsenal';

export function getActiveTenant(): Tenant {
  const tenant = TENANTS[ACTIVE_TENANT_ID];
  if (!tenant) {
    throw new Error(
      `[tenants] უცნობი კომპანია: "${ACTIVE_TENANT_ID}". შეამოწმე EXPO_PUBLIC_TENANT.`
    );
  }
  return tenant;
}

export function isFeatureEnabled(feature: FeatureKey): boolean {
  return getActiveTenant().features?.[feature] ?? false;
}
