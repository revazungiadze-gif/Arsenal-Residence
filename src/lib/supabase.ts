/**
 * src/lib/supabase.ts
 *
 * Supabase client — უკავშირდება აქტიური კომპანიის ბექენდს.
 * არსენალისთვის ეს არსებული არსენალის Supabase პროექტია (იგივე ბაზა,
 * რასაც ვები იყენებს). ბექენდი უცვლელი რჩება — აპი მხოლოდ "ესაუბრება".
 *
 * სესია ინახება მოწყობილობაზე უსაფრთხოდ (expo-secure-store), რომ
 * მომხმარებელი ყოველ გახსნაზე თავიდან არ შედიოდეს.
 */
import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { getActiveTenant } from '@/config/tenants';
import type { Database } from '@/types/database';

const tenant = getActiveTenant();

/**
 * SecureStore-ზე დაფუძნებული storage adapter Supabase auth-ისთვის.
 * SecureStore-ს აქვს ზომის ლიმიტი (~2KB), ამიtom დიდ მნიშვნელობებს
 * ვჭრით ნაწილებად. web-ზე localStorage-ს ვუბრუნდებით.
 */
const ExpoSecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

if (!tenant.supabaseUrl || !tenant.supabaseAnonKey) {
  console.warn(
    '[supabase] Supabase URL ან anon key არ არის მითითებული. ' +
      'შეამოწმე .env ფაილი (EXPO_PUBLIC_*_SUPABASE_URL / _ANON_KEY).'
  );
}

export const supabase = createClient<Database>(
  tenant.supabaseUrl,
  tenant.supabaseAnonKey,
  {
    auth: {
      storage: Platform.OS === 'web' ? undefined : ExpoSecureStoreAdapter,
      autoRefreshToken: true,
      persistSession: true,
      // მობილურზე OAuth redirect URL-ს არ ვიყენებთ (email/password login)
      detectSessionInUrl: false,
    },
  }
);
