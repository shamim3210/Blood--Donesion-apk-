# BloodSearch — Enterprise Emergency Blood Donor & Transfusion Dispatch Platform

A production-grade, white-label full-stack web, PWA, and Android APK-ready emergency blood donor matching and multi-channel alert platform built with **React 19, TypeScript, Tailwind CSS 4, Express, and Firebase (Authentication + Zero-Trust Firestore)**.

---

## Key Commercial Modules Included

1. **Smart Donor Search & Priority Ranking**: Filter across all 64 districts by blood group, urgency, required time window, and GPS/manual distance. Ranks verified, recently active donors first and automatically demotes unreached attempts.
2. **Low-Friction Direct Contact & Privacy Consent**: Instant **Call** and **WhatsApp** actions for opted-in donors, paired with masked phone protection (`01712 •••• 78`) and structured consent requests for private donors.
3. **Concurrent Emergency Broadcast & 5-Tier Radius Escalation**: Alerts multiple compatible donors simultaneously via real-time in-app alerts, browser notifications, and optional server-side **SMS (`TWILIO` / `WEBHOOK_BD`)** and **FCM Web Push** gateways. Automatically expands search radius (`5 km → 15 km → 40 km → 85 km → Nationwide`) when no response is received.
4. **Full Request Lifecycle Tracking**: Tracks `Searching → Donors Notified → Responses Received → Contact Attempted → Donor Confirmed → Fulfilled` (plus `Cancelled` and `Expired`, which immediately halt future alerts).
5. **Institutional Admin & Blood Bank Suite**: Live blood unit inventory by group, verified donor badges, scam report moderation, global megaphone broadcasts, sub-admin invite locks, and tamper-evident audit logs.
6. **Instant White-Label Rebranding**: Customize Brand Name, Tagline, Organization Name, Hotline, Super Admin Email, and Clean Blank Database Mode via `.env` or the built-in **Commercial & White-Label Studio**.

---

## Quick Buyer Installation Guide (English)

### 1. Install Dependencies
```bash
npm install
```

### 2. Connect Your Firebase Project
1. Create a project at [console.firebase.google.com](https://console.firebase.google.com/).
2. Enable **Authentication → Sign-in method → Google** (and add your production domain under *Settings → Authorized domains*).
3. Create a **Cloud Firestore** database.
4. Copy `firebase-applet-config.example.json` to `firebase-applet-config.json` and paste your Firebase Web App SDK configuration.

### 3. Configure White-Label Branding & Super Admin
1. Copy `.env.example` to `.env` and set your organization details:
   ```env
   VITE_BRAND_NAME="YourBrandName"
   VITE_BRAND_TAGLINE="FIND BLOOD. SAVE LIFE."
   VITE_ORG_NAME="Your Hospital or Foundation"
   VITE_SUPER_ADMIN_EMAIL="your-admin@gmail.com"
   VITE_DEFAULT_REAL_ONLY_MODE="true"
   ```
2. Ensure `isBootstrappedSuperAdmin()` in `firestore.rules` matches your `VITE_SUPER_ADMIN_EMAIL`, then deploy the security rules:
   ```bash
   npx firebase-tools deploy --only firestore:rules
   ```

### 4. Run Tests, Build & Launch
```bash
npm test          # Runs automated emergency dispatch, security & ranking test suites
npm run build     # Builds production frontend bundle
npm start         # Starts full-stack Express + SPA production server on port 3000
```

### 5. Generate Clean Buyer Handover Package (For Sellers)
Before zipping the project for a client or marketplace buyer, run:
```bash
npm run package:buyer -- --admin="buyer@organization.com" --brand="BuyerBrand"
```
This creates a `./buyer-release` folder stripped of all seller keys, `.env` secrets, `.git`, and `node_modules`, pre-configured with the buyer's Super Admin email and brand name.

---

## ক্রেতা সেটআপ ও হস্তান্তর নির্দেশিকা (বাংলা সংক্ষিপ্ত গাইড)

১. **প্যাকেজ তৈরি (বিক্রেতার জন্য):** প্রজেক্ট বিক্রি বা ডেলিভারি দেওয়ার আগে টার্মিনালে চালান:
   ```bash
   npm run package:buyer -- --admin="buyer@gmail.com" --brand="HospitalBlood"
   ```
   এতে আপনার ব্যক্তিগত Firebase কী বা গোপন তথ্য ছাড়াই `buyer-release/` ফোল্ডারে পরিচ্ছন্ন সোর্স কোড তৈরি হবে।

২. **নতুন Firebase সংযোগ (ক্রেতার জন্য):** ক্রেতা নিজের Firebase Console থেকে প্রজেক্ট খুলে `firebase-applet-config.json` ফাইলে নিজের Web SDK কী বসাবে এবং Google Sign-In অন করবে।

৩. **সিকিউরিটি রুলস ও ব্র্যান্ডিং:** `.env` ফাইলে প্রতিষ্ঠানের নাম (`VITE_BRAND_NAME`), সুপার অ্যাডমিন ইমেইল (`VITE_SUPER_ADMIN_EMAIL`) এবং ক্লিন ডাটাবেস মোড (`VITE_DEFAULT_REAL_ONLY_MODE="true"`) বসিয়ে `npx firebase-tools deploy --only firestore:rules` কমান্ড চালালেই সম্পূর্ণ সিস্টেম লাইভ হয়ে যাবে।
