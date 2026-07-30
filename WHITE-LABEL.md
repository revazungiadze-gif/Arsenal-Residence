# 🏷️ White-Label — ახალი კომპანიის დამატება

ეს აპი ისეა აწყობილი, რომ **ერთი კოდი ბევრ კომპანიას ემსახუროს**: ყოველ
კომპანიას აქვს საკუთარი Supabase ბექენდი (სრული იზოლაცია) და ბრენდი.
არსენალი = პილოტი. ახალი კომპანიის დამატება ≈ 30 წუთი.

---

## ნაბიჯი 1 — ახალი Supabase პროექტი

1. supabase.com → New project (კომპანიის სახელით)
2. შექმენი იგივე ცხრილები, რაც არსენალს აქვს (leads, profiles, tasks,
   apartments, blocks, floors, booking_requests, notifications, ...).
   უმარტივესი გზა: არსენალის ბაზის სქემის ექსპორტი → იმპორტი.
3. SQL Editor-ში გაუშვი ამ რეპოს სკრიპტები **ზუსტად ამ თანმიმდევრობით**:
   1. `supabase/mobile-rls.sql` (კითხვის წესები + mobile_get_role)
   2. `supabase/mobile-rls-write.sql` (ლიდების ჩაწერა)
   3. `supabase/mobile-rls-all.sql` (დავალებები, ჯავშნები, პროფილები...)
   4. `supabase/mobile-realtime.sql` (შეტყობინებების realtime)
   5. `supabase/mobile-marketing-stats.sql` (მარკეტინგის აგრეგატები)
4. Authentication → Users → შექმენი კომპანიის მომხმარებლები;
   `profiles` ცხრილში მიანიჭე როლები (admin/director/sales_manager/agent/marketing)

## ნაბიჯი 2 — კომპანიის ჩაწერა აპის კონფიგში

`src/config/tenants.ts` → `TENANTS` ობიექტში დაამატე:

```ts
// 1) ENV ობიექტში (სტატიკური მიმართვით!):
const ENV = {
  // ...არსებულს ნუ შეეხები...
  COMPANYB_URL: process.env.EXPO_PUBLIC_COMPANYB_SUPABASE_URL ?? '',
  COMPANYB_KEY: process.env.EXPO_PUBLIC_COMPANYB_SUPABASE_ANON_KEY ?? '',
};

// 2) TENANTS-ში:
companyB: {
  id: 'companyB',
  supabaseUrl: ENV.COMPANYB_URL || 'https://XXXX.supabase.co',
  supabaseAnonKey: ENV.COMPANYB_KEY || 'sb_publishable_...',
  branding: {
    displayName: 'Company B',
    primaryColor: '#2563EB',   // კომპანიის ფერი
    darkColor: '#0F172A',
  },
  features: { leads: true, tasks: true, bookings: true, analytics: true,
              marketing: true, notifications: true, ai_copilot: true },
},
```

> გასაღები: Supabase → Project Settings → API Keys → **Publishable key**
> (`sb_publishable_...`). ის საჯაროა — კოდში ჩაწერა უსაფრთხოა.

## ნაბიჯი 3 — ბრენდირებული build

```bash
# რომელი კომპანიის აპი აეწყოს, EXPO_PUBLIC_TENANT წყვეტს:
EXPO_PUBLIC_TENANT=companyB eas build --platform android --profile preview
```

- აპის სახელი/ფერები/ბექენდი ავტომატურად კომპანიისაა
- ცალკე აპ-სახელი/ხატულა გინდა? `app.json`-ში შეცვალე `name`, `icon`,
  `android.package`, `ios.bundleIdentifier` (თითო კომპანიაზე თითო app id)

## ნაბიჯი 4 — შემოწმების სია

- [ ] login კომპანიის იუზერით
- [ ] ლიდის შექმნა/სტატუსის ცვლა — ბაზაში ინახება
- [ ] agent მხოლოდ საკუთარს ხედავს; marketing — ლიდებს ვერა
- [ ] ჯავშნის ციკლი: მოთხოვნა → დამტკიცება → ბინა reserved
- [ ] 🔔 შეტყობინება realtime-ში მოდის

---

**შენიშვნა:** SQL სკრიპტები იდემპოტენტურია (re-run უსაფრთხოა) და
არცერთი არ თიშავს/რთავს RLS-ს — მხოლოდ `mobile_` წესებს ამატებს.
