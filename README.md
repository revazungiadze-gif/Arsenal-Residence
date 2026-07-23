# სიარემი — მობილური CRM 📱

არსენალი რეზიდენსის სიარემის (CRM) მობილური აპლიკაცია — **iOS + Android ერთი კოდით**.
აშენებულია **white-label** პრინციპით: აპის გული ერთია, ყოველი კომპანია თავის
ბექენდს (Supabase) და ბრენდს აბამს. **არსენალი = პირველი (პილოტი).**

---

## 🏗️ არქიტექტურა

```
        ┌─────────────────────────┐
        │   ერთი მობილური აპი      │  Expo (React Native)
        │   (white-label core)     │
        └───────────┬─────────────┘
                    │ tenant config-ით ირჩევა ბექენდი
        ┌───────────┼───────────┬───────────┐
        ▼           ▼           ▼           ▼
   არსენალი     კომპ. B     კომპ. C      ...
   Supabase     Supabase    Supabase
```

- **არსენალის აპი** უკავშირდება **არსებულ არსენალის Supabase პროექტს** — იმავე
  ბაზას, რასაც ვები. ბექენდი უცვლელი რჩება; აპი მხოლოდ "ესაუბრება".
- **ახალი კომპანია** = ახალი ჩანაწერი `src/config/tenants.ts`-ში + მისი Supabase
  URL/key. აპის კოდი იგივე რჩება.

### ტექნოლოგიები
| | |
|---|---|
| Framework | Expo (React Native) + expo-router |
| ენა | TypeScript |
| ბექენდი | Supabase (იგივე, რასაც ვები იყენებს) |
| Auth | Supabase Auth (email/password) + SecureStore |

---

## 📁 სტრუქტურა

```
app/                       # ეკრანები (expo-router, file-based)
  _layout.tsx              # root — AuthProvider
  index.tsx                # auth-ის მიხედვით გადამისამართება
  login.tsx                # შესვლა
  (app)/                   # ავტორიზებული ზონა (tabs + guard)
    dashboard.tsx          # KPI-ები, pipeline
    leads/                 # ლიდების სია + დეტალი
    more.tsx               # პროფილი, კომპანია, გასვლა
src/
  config/tenants.ts        # ⭐ white-label კონფიგი (კომპანიები)
  lib/supabase.ts          # Supabase client (აქტიური კომპანიის ბექენდი)
  context/AuthContext.tsx  # სესია + როლი
  types/database.ts        # ბაზის ტიპები (ვებ-CRM-იდან)
  types/crm.ts             # როლები, სტატუსები, ლეიბლები
  theme/                   # ფერები (ბრენდიდან)
  components/ui.tsx        # Button, Card, Badge...
```

---

## 🚀 გაშვება

```bash
# 1. დამოკიდებულებები
npm install

# 2. გარემოს ცვლადები
cp .env.example .env
#   → ჩაწერე არსენალის Supabase URL და anon key

# 3. გაშვება
npx expo start
#   → დაასკანერე QR კოდი Expo Go აპლიკაციით (iOS/Android)
```

> **Supabase-ის მონაცემები საიდან:** Supabase დაფა → Project Settings → API →
> `Project URL` და `anon public` key. (⚠️ `service_role` key **არასდროს** ჩასვა
> მობილურ აპში.)

---

## 🔐 უსაფრთხოება

- აპი მხოლოდ **anon key**-ს იყენებს — ყველა წვდომას ბაზის **RLS** წესები ზღუდავს
  (agent ხედავს მხოლოდ თავის ლიდებს და ა.შ., ზუსტად როგორც ვებზე).
- სესია ინახება **SecureStore**-ში (დაშიფრული მოწყობილობის საცავი).
- `.env` **გითში არ იტვირთება**.

---

## ✅ ამ ეტაპზე გაკეთებული (v0.1 — read-only)

- [x] White-label tenant კონფიგი
- [x] Supabase კავშირი + უსაფრთხო სესია
- [x] შესვლა (Supabase Auth)
- [x] Dashboard — ლიდების KPI + pipeline
- [x] ლიდების სია (ძებნა + სტატუსით ფილტრი)
- [x] ლიდის დეტალი + შენიშვნები

## 🛣️ შემდეგი ეტაპები

- [ ] ჩაწერა (ახალი ლიდი, სტატუსის ცვლა, შენიშვნა) — RLS-ის შემოწმების შემდეგ
- [ ] დავალებები (tasks) და ჯავშნები (bookings)
- [ ] Push-შეტყობინებები
- [ ] ანალიტიკა / მარკეტინგი
- [ ] AI კოპილოტი
- [ ] ბრენდის ლოგოები, splash/icon

> ⚠️ **მნიშვნელოვანი:** ჩაწერის ფუნქციები (write) მხოლოდ მას შემდეგ ჩაირთვება,
> რაც ცოცხალ ბაზაზე RLS/წვდომა შემოწმდება. ამ ვერსიაში აპი **მხოლოდ კითხულობს**.
