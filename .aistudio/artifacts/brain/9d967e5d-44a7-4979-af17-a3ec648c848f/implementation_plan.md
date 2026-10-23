# BloodSearch (রক্ত সন্ধান) - Bangladesh Emergency Blood Donation & Donor Network

A comprehensive, production-grade emergency blood donation and donor search web application built for Bangladesh. Features a modern frosted glassmorphic UI engineered for flawless contrast in both Dark and Light modes, responsive across mobile phones (iPhone/Android) and desktop monitors, with intelligent blood group compatibility, 1-tap SOS emergency broadcasting, privacy-first phone masking, donation eligibility screening, and bilingual support (Bangla/English).

## User Review & Critical Decisions

> [!IMPORTANT]
> The following architectural decisions have been synthesized from your clarifying responses:

- **Universal Multi-Device Layout**: Responsive touch-first mobile experience (with ergonomic bottom navigation bar and touch targets $\ge 44\text{px}$) that seamlessly scales to full-width desktop dashboard layouts (1440px multi-column grid with Bangladesh district metrics and fast search), plus an interactive "Phone View Preview" toggle for rapid mobile testing on any screen.
- **Dual-Engine Persistence & Mock Data**: Pre-loaded with realistic Bangladesh donor data across 8 divisions and 64 districts (Dhaka, Chittagong, Sylhet, Rajshahi, Khulna, Barisal, Rangpur, Mymensingh) with working local persistence (`localStorage`), live response state updates, and modular adapter architecture ready for Firebase Firestore.
- **Frosted Glassmorphism with Strict Legibility**: Custom glass surface styling featuring `backdrop-blur-xl`, subtle translucent boundary borders, and meticulously calibrated typography ensuring zero washed-out text in both dark mode (`#0a0f1d` deep canvas) and light mode (`#f8fafc` crisp canvas).

---

## 1. Overview & Core Concept

### What It Does
BloodSearch solves the critical challenge of finding compatible blood donors quickly across Bangladesh during medical emergencies, accidents, and surgeries. Users can instantly locate voluntary donors by blood group, division, district, and upazila, initiate 1-tap Emergency SOS broadcasts, verify blood compatibility, check donation eligibility, and connect safely with donors through privacy-protected phone masking.

### Target Audience & Persona
- **Patients & Relatives**: Needing immediate, compatible blood units at hospitals (e.g. DMCH, BSMMU, Apollo, CMH, or district sadar hospitals).
- **Voluntary Donors**: Youth, university students, and regular donors managing their availability status, last donation date, and donor badges.
- **Emergency Coordinators & Blood Clubs**: University donation clubs (Badhan, Red Crescent, Sandhani) coordinating bulk drives and verifying donors.

### Key Value Delivered
- **Rapid Matching**: 3-second filter by compatible donor groups (e.g., finding O- and B- for a B- patient automatically).
- **Security & Privacy**: Donors' phone numbers are masked by default to prevent harassment; contact details reveal safely upon genuine interest or SOS acceptance.
- **Trust & Verification**: Verified donor badges, donation count tracking, eligibility checklist, and community review ratings.

---

## 2. User Experience & Visual Design

### Aesthetic Direction & Theme Tokens
The interface utilizes an authentic medical-grade frosted glass aesthetic with Crimson Blood accents:

- **Color Distribution (60-30-10 Rule)**:
  - **60% Canvas**:
    - *Dark Mode*: `#0a0f1d` (deep midnight obsidian) with ambient crimson/sapphire radial light diffusion.
    - *Light Mode*: `#f8fafc` (clean winter frost neutral) with soft crimson ambient glow.
  - **30% Structural Surfaces**:
    - *Dark Mode Glass*: `rgba(15, 23, 42, 0.72)` with `backdrop-blur-xl`, `border border-white/10`, and soft shadows.
    - *Light Mode Glass*: `rgba(255, 255, 255, 0.78)` with `backdrop-blur-xl`, `border border-slate-900/10`, and crisp elevation.
  - **10% Accent Intent**:
    - Primary Crimson: `#e11d48` (rose-600) / `#f43f5e` (rose-500) for SOS and blood group badges.
    - Emerald Green: `#10b981` (emerald-500) for "Available to Donate" and verified status.
    - Amber: `#f59e0b` (amber-500) for pending verification or critical requests.
- **Typography & Readability**:
  - Display Font: `Plus Jakarta Sans` for clean, confident modern headers.
  - Data & Metrics: `font-mono tabular-nums` for units, phone numbers, and countdown timers.
  - Text Contrast: Meticulously tested against WCAG AA standards; zero low-contrast text on glass backdrops.
- **Zero-Pill Metadata**:
  - Tags and metadata formatted as clean text with typographic separators (`Dhaka Sadar · O Positive · 4 Donations · 12 min ago`).

### Key Views & Screens
1. **Find Donors (ডোনার খুঁজুন)**:
   - Search by Blood Group (with auto-expand to all compatible groups).
   - Division, District, and Upazila cascaded dropdowns.
   - Banglish & Bengali search query matching (e.g. "Dhanmondi", "ধানমন্ডি", "Mirpur").
   - Donor cards with availability indicator, distance/location, last donation date, rating, and masked phone button.
2. **Emergency SOS Broadcast (জরুরি রক্তের আবেদন)**:
   - 1-click critical broadcast modal with hospital name, blood group, units needed, required time, and patient status.
   - Real-time "I Can Donate" response action with live responder counter.
   - Direct WhatsApp / Facebook / Web Share link generation with pre-filled emergency template.
3. **Blood Compatibility Matrix (কম্প্যাটিবিলিটি চার্ট)**:
   - Interactive matrix tool: select recipient blood group $\rightarrow$ visual highlight of all compatible donor types with red cell and plasma rules.
4. **Eligibility Pre-Screening Checklist (রক্তদানের যোগ্যতা যাচাই)**:
   - 6-step interactive questionnaire (Age $\ge 18$, Weight $\ge 45\text{kg}$, Last donation $> 90$ days, recent antibiotics, hemoglobin, etc.) giving immediate clear green/amber guidance.
5. **Donor Profile & Security Center (প্রোফাইল ও নিরাপত্তা)**:
   - Availability toggle (Available / Resting).
   - Masked phone reveal logs, donor badges (Bronze/Silver/Gold/Hero), donation history tracker, and privacy settings.
6. **Mobile App Preview Mode Toggle**:
   - Floating switch allowing the user to view the app in a realistic iPhone/Android mobile frame or full responsive desktop mode.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Responsive Layout with Desktop + Mobile Simulator Toggle**
  - *Approach*: Built responsive with Tailwind CSS (`md:`, `lg:` breakpoints) and bottom navigation bar on mobile viewports; plus a top bar device switcher to toggle an simulated iPhone frame on desktop for easy client presentations.
  - *Why*: Allows the user to inspect both the smartphone experience and full desktop widescreen workflow without resizing browser windows.
- **Decision 2: Phone Masking & Privacy Architecture**
  - *Approach*: Donor phone numbers appear masked (`+880 17•• ••••89`). Clicking "Call Donor" requires a 1-tap confirmation with rate limiting and audit log tracking.
  - *Why*: Directly solves the real-world problem in Bangladesh where female and student voluntary donors face harassment from public phone disclosure.
- **Decision 3: Complete Bangladesh Geographic Directory**
  - *Approach*: Bundled offline district and upazila dataset covering all 8 divisions and prominent upazilas so search works instantly with zero latency.
  - *Why*: Network conditions in hospital basements or rural districts in Bangladesh are frequently slow; instant client-side filtering ensures emergency speed.

---

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        BloodSearch Web App                             │
├────────────────────────────────────────────────────────────────────────┤
│  Top Bar: Brand Wordmark · SOS Quick Action · Lang (বাং/EN) · Theme    │
├───────────────────┬────────────────────────────────────────────────────┤
│  Desktop Sidebar  │                   Main Content Area                │
│  (or Mobile Tabs) │  ┌──────────────────────────────────────────────┐  │
│  • Find Donors    │  │  Emergency Live Feed Banner (Urgent Ticker)   │  │
│  • SOS Broadcast  │  ├──────────────────────────────────────────────┤  │
│  • Compatibility  │  │  Active View:                                │  │
│  • Eligibility    │  │  - Donor Grid / Geo Filter & Sorting         │  │
│  • My Requests    │  │  - Interactive SOS Form & Live Responders    │  │
│  • Security Audit │  │  - Blood Matrix Matrix & Eligibility Tool    │  │
│                   │  └──────────────────────────────────────────────┘  │
└───────────────────┴────────────────────────────────────────────────────┘
                                   │
               ┌───────────────────┴───────────────────┐
               ▼                                       ▼
    ┌──────────────────────┐               ┌──────────────────────┐
    │  State Management    │               │  Geographic Database │
    │  • Active Donors     │               │  • 8 Divisions       │
    │  • Live SOS Requests │               │  • 64 Districts      │
    │  • User Availability │               │  • Key Upazilas      │
    │  • Audit Event Logs  │               │  • Compatibility Map │
    │  • LocalStorage Sync │               └──────────────────────┘
    └──────────────────────┘
```

### Data Model Entities
- **Donor**: `id`, `name`, `bloodGroup`, `division`, `district`, `upazila`, `phone`, `isPhoneMasked`, `available`, `lastDonatedDate`, `totalDonations`, `verifiedBadge`, `rating`, `reviewsCount`, `hospitalAffiliation`.
- **BloodRequest**: `id`, `patientName`, `bloodGroup`, `unitsNeeded`, `hospitalName`, `district`, `upazila`, `urgency` (`CRITICAL` | `URGENT` | `STANDARD`), `contactPhone`, `responders` (list of user IDs who clicked "I can donate"), `createdAt`, `status` (`ACTIVE` | `FULFILLED` | `CANCELLED`).
- **EligibilityCheck**: Answers to weight, age, interval, pulse, travel, surgery, yielding immediate pass/fail verdict with medical rationale.
- **AuditLog**: Records of phone unmasking, emergency broadcasts, and responder claims for security auditing.

---

## 5. Implementation Sequence

1. **Theme & Foundation Setup**: Configure glassmorphism CSS utilities, theme switching (Dark & Light), color tokens, and responsive layout shells.
2. **Bangladesh Location & Compatibility Utilities**: Implement full 8 divisions, 64 districts, blood compatibility algorithm, and English/Bangla dictionary.
3. **Donor Search & Filter View**: Implement high-speed multi-criteria filter, Banglish fuzzy matching, donor cards, and phone masking modal.
4. **Emergency SOS System**: Implement 1-tap SOS broadcast modal, live emergency banner, responder commitment counter, and social sharing.
5. **Eligibility & Matrix Tools**: Build the interactive blood compatibility visualizer and pre-donation qualification test.
6. **Mobile Simulation & Polish**: Add the mobile device frame toggle, toast notifications, keyboard shortcuts, and verified compilation.
