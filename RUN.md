# 📱 როგორ გავუშვა აპი ტელეფონზე (Expo Go)

მარტივი, ნაბიჯ-ნაბიჯ ინსტრუქცია.

## წინაპირობა (ერთჯერადი)

**კომპიუტერზე:** [Node.js](https://nodejs.org) — „LTS" ვერსია.
**ტელეფონზე:** უფასო აპი **Expo Go** (App Store / Google Play).

## ნაბიჯები

გახსენი ტერმინალი (Mac: Terminal, Windows: PowerShell) და გაუშვი:

```bash
git clone -b claude/siaremi-mobile-app-dturpk https://github.com/revazungiadze-gif/Arsenal-Residence.git
cd Arsenal-Residence
npm install
npx expo start
```

ბოლო ბრძანების შემდეგ ტერმინალში გამოჩნდება **QR კოდი**.

## QR-ის სკანირება

- **iPhone** → კამერა მიმართე QR-ს → დააჭირე შეტყობინებას
- **Android** → Expo Go → „Scan QR code" → მიმართე

აპი ჩაიტვირთება → შედი CRM-ის ელფოსტა/პაროლით → ცოცხალი ლიდები. 🎉

> კონფიგი (Supabase URL + anon key) კოდშია ჩაშენებული — `.env` არ გჭირდება.

## თუ რამე ვერ იმუშავა

| პრობლემა | გამოსავალი |
|---|---|
| „ვერ დაუკავშირდა" სკანირების მერე | კომპიუტერი და ტელეფონი ერთ **Wi-Fi**-ზე |
| მაინც არ იტვირთება | `npx expo start` ნაცვლად → `npx expo start --tunnel` |
| `git` არ გაქვს | GitHub-იდან ZIP-ად ჩამოტვირთე ბრენჩი `claude/siaremi-mobile-app-dturpk` |
