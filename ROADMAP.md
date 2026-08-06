# Qurʼān Parho Framework — Roadmap & Feature Plans

> **Owner:** Maulana Syed Imon Rizvi (مولانا سیّد آئمن رضوی)  
> **Priority:** This document is the canonical source of truth for all planned features.  
> Any developer or AI agent working on this project MUST read this first before making changes.  
> Update this file whenever a feature is completed or a new plan is agreed upon.

---

## Project Tech Stack (Quick Reference)

| Layer | Technology |
|---|---|
| Framework | React 19 + TanStack Start + Vite |
| Styling | Tailwind CSS v4 (custom tokens in `src/styles.css`) |
| UI Components | shadcn/ui (`src/components/ui/`) |
| Routing | TanStack file-based routing (`src/routes/`) |
| i18n | Custom context in `src/lib/i18n.tsx` — keys added here for EN + UR |
| Quran Data | Per-surah JSON files in `public/quran/` — loaded on demand |
| Deployment | Vercel (Nitro preset) |
| State | Local component state + `localStorage` for persistence |
| Code Quality | ESLint + Prettier (run `npm run lint`, `npm run format`) |

---

## Recently Completed

### Fullscreen Timers + Custom Timer Durations (2026-08-06)

Users can now present **just the timers** on a big fullscreen screen and set their own
Session / Q&A / Turn lengths.

- **Shared modules** (reused by both entry points, no duplicated timer logic):
  - `src/lib/timer-durations.ts` — `TimerDurations { session, qa, turn }` (minutes), presets
    (`SESSION [30,45,60,90]`, `QA [2,5,10,15]`, `TURN [3,5,10]`), load/save via
    `localStorage` key `qp_timer_durations`, `toSeconds()`.
  - `src/lib/timer-beep.ts` — shared `playAlertBeep()` (moved out of presentation-mode) +
    `playWarningBeep()`.
  - `src/hooks/use-countdown-timer.ts` — `{ seconds, total, active, start, pause, toggle,
    reset, setDuration }`; `setDuration` applies immediately when idle, on next reset when
    running.
  - `src/components/shared/big-timer-card.tsx` — presentational giant timer card
    (huge `tabular-nums` digits, urgency/expired red styling, progress bar, play/pause +
    reset, preset chips + custom minutes input).
- **Quran presentation mode** (`presentation-mode.tsx`): Timer Dock totals/resets now use
  the saved durations; new **"Timer Durations"** section in the More Controls popover;
  new **Timers Only** top-bar toggle (Presentation icon) that swaps the Quran stage for the
  same two big timers (Session + Q&A) reusing live timer state. Durations persist across
  visits.
- **Practical Tools** (`facilitator-tools/index.tsx`): new prominent **"Launch Fullscreen
  Timers"** button above the tab grid opens `timers-screen.tsx` — a fullscreen Session +
  Q&A projection (dark, gold-accented) with beep mute, fullscreen toggle, Esc to close,
  and expiry + 1-minute warning beeps. Shares the same duration storage as presentation mode.

---



## Existing Sections (in page order)

| Anchor | Component | Nav Key |
|---|---|---|
| `#top` | `Hero` | — |
| `#about` | `Philosophy` | `nav_about` |
| `#cycles` | `Cycles` | `nav_cycles` |
| `#session` | `SurahExplorer` | `nav_explorer` |
| `#share` | `ShareSurah` | `nav_share` |
| `#howto` | `HowToGuide` | `nav_howto` |
| `#guide` | `SessionGuide` | `nav_guide` |
| `#kit` | `FacilitatorKit` | `nav_kit` |
| `#ai` | `AILab` | `nav_ai` |
| `#tafseer` | `TafseerResources` | — |
| `#tools` | `FacilitatorTools` | `nav_tools` |
| `#contact` | `Contact` | — |

To add a new section: create `src/components/sections/your-section.tsx`, import and place it
in `src/routes/index.tsx`, add nav key to `navItems[]`, and add i18n strings to `src/lib/i18n.tsx`.

---

## ⭐ PRIORITY 1 — Thematic Verse Library

**Status:** PLANNED — Not yet built  
**Agreed on:** 2026-08-05  
**Estimated effort:** ~4–5 days  

### What It Is

A new "Themes" section on the homepage — a searchable, filterable library of curated verse
collections organized by topic (Patience, Justice, Tawbah, Imamat, etc.), drawing from **both
Shia and Sunni scholarship**, clearly labeled. Clicking any theme opens the existing in-app
Quran reader with all those verses ready to read.

This is a *self-owned feature* — data lives in a plain JSON file the owner controls and can
update at any time with no API dependency.

---

### Data Architecture

**File:** `src/data/themes.json` ← *The owner edits this file to update content*

```jsonc
[
  {
    "id": "patience",
    "tradition": "shared",
    "category": "Character & Soul",
    "en": "Patience (Sabr)",
    "ur": "صبر",
    "ar": "الصبر",
    "desc_en": "Verses on steadfastness in hardship and trust in Allah's plan.",
    "desc_ur": "مشکلات میں استقامت اور اللہ پر بھروسے کی آیات۔",
    "source_note": "Ref: Tafsir al-Mizan + Ibn Kathir",
    "verses": ["2:153", "2:155", "2:156", "2:157", "3:200", "39:10", "16:127"]
  }
]
```

**TypeScript type** (in `src/lib/themes.ts`):
```ts
export type Tradition = "shared" | "sunni" | "shia";
export type ThemeEntry = {
  id: string;
  tradition: Tradition;
  category: string;
  en: string; ur: string; ar: string;
  desc_en: string; desc_ur: string;
  source_note: string;
  verses: string[]; // Format: "surahNumber:ayahNumber"
};
```

---

### 35 Planned Seed Themes

#### Shared (Sunni + Shia Consensus — ~25 themes)

| Category | Themes |
|---|---|
| Faith (Aqeedah) | Tawheed, Prophethood (Nubuwwah), Day of Judgment, Angels & Unseen |
| Worship (Ibadah) | Salah, Fasting (Sawm), Zakat, Hajj, Tawbah (Repentance), Du'a & Supplication |
| Character (Akhlaq) | Patience (Sabr), Gratitude (Shukr), Honesty (Sidq), Kindness to Parents, Forgiveness |
| Society | Justice (Adl), Knowledge (Ilm), Charity & Generosity, Family & Marriage |
| Inner Life | Trust in God (Tawakkul), Fear & Hope (Khawf/Raja), Dhikr |

#### Shia-Emphasis (~6 themes)

| Category | Themes |
|---|---|
| Theology | Wilayah (Divine Authority), Imamat & Leadership, Love of Ahlul Bayt |
| Practice | Tawassul (Intercession), Ziyarat Context, Martyrdom & Karbala context |

#### Sunni-Emphasis (~4 themes)

| Category | Themes |
|---|---|
| Theology | The Companions (Sahabah) in Quran |
| Jurisprudence | Ijma & Shura (Community Consultation) |
| Practice | Following the Messenger (Sunnah context) |

---

### Data Sources (Reference Only — No Text Copying Permitted)

| Source | Tradition | Used For |
|---|---|---|
| Tafsir al-Mizan (Allama Tabatabai) | Shia | Shia verse selection reference |
| Tafsir Nemooneh (Makarem Shirazi) | Shia | Shia verse selection reference |
| Al-Islam.org | Shia | Reference reading (non-commercial only — no text copying) |
| Tafsir Ibn Kathir | Sunni | Sunni verse selection reference |
| The Last Dialogue (thelastdialogue.org) | Sunni | Subject-wise index reference |
| Quranic Arabic Corpus (corpus.quran.com) | Academic | Topic ontology reference (GPL — attribute if used directly) |
| Tanzil Project | Both | Verse text (CC BY-ND 3.0 — attribute with link) |

LEGAL NOTE: Verse references (e.g., "2:153") are public domain. Theme names are basic
concepts with no copyright. All descriptions in themes.json are original content owned by
this project. Do NOT copy text from al-Islam.org or any copyrighted tafsir works.

---

### Files to Create

| File | Purpose |
|---|---|
| `src/data/themes.json` | Master curated data file (owner-maintained) |
| `src/lib/themes.ts` | TypeScript types + loader + filter helpers |
| `src/components/sections/thematic-library.tsx` | UI section component |

### Files to Modify

| File | Change |
|---|---|
| `src/routes/index.tsx` | Import ThematicLibrary, add to JSX, add nav item, wire onOpenTheme prop |
| `src/lib/i18n.tsx` | Add nav_themes, themes_title, themes_sub, themes_all, themes_shared, themes_shia, themes_sunni, themes_open, themes_verses, themes_search keys |
| `src/components/sections/header.tsx` | Add nav_themes to desktop nav |

### Nav Position

Place the Themes section between SurahExplorer (#session) and ShareSurah (#share).
Nav anchor: #themes, nav key: nav_themes, icon: Library (lucide-react).

### i18n Keys to Add

```ts
nav_themes:    { en: "Themes",                 ur: "موضوعات" },
themes_title:  { en: "Thematic Verse Library", ur: "موضوعاتی آیات کا ذخیرہ" },
themes_sub:    { en: "Explore Quranic verses organized by theme — drawing from both Shia and Sunni scholarship.", ur: "موضوع کے لحاظ سے مرتب آیات — شیعہ اور سنی دونوں علمی ذرائع سے ماخوذ۔" },
themes_all:    { en: "All Traditions",    ur: "تمام روایات" },
themes_shared: { en: "Shared",            ur: "مشترک" },
themes_shia:   { en: "Shia Emphasis",    ur: "شیعہ زور" },
themes_sunni:  { en: "Sunni Emphasis",   ur: "سنی زور" },
themes_open:   { en: "Open in Reader",   ur: "قاری میں کھولیں" },
themes_verses: { en: "verses",           ur: "آیات" },
themes_search: { en: "Search themes...", ur: "موضوع تلاش کریں..." },
```

### UI Spec (thematic-library.tsx)

Section id="themes" — same padding/bg pattern as tafseer.tsx and ai-lab.tsx.
- Header: Badge + h2 (themes_title) + p (themes_sub)
- Filter row: tradition pill buttons [All | Shared | Shia | Sunni] + category select + search input
- Responsive card grid: 1 → 2 → 3 columns
- Each card: Arabic name (font-arabic, top) + EN/UR name + tradition badge (green=shared, blue=shia, amber=sunni) + category tag + 1-line description + verse count chip + "Open in Reader" button

### Reader Integration (Phase 1)

```ts
const openTheme = (theme: ThemeEntry) => {
  const [surahStr] = theme.verses[0].split(":");
  openReader(parseInt(surahStr, 10));
};
```

Phase 2 (future): multi-surah playlist sidebar.

---

## PRIORITY 2 — Hero Banner Image

**Status:** Partially done
- `<img src="/hero-banner.png" />` already in `src/components/sections/hero.tsx`
- **Action needed:** Place the banner image at `public/hero-banner.png`

---

## PRIORITY 3 — Community Theme Contribution

Contact form (or new tab) where facilitators suggest new themes.
Owner vets + adds to themes.json.

---

## PRIORITY 4 — Multi-Surah Reader Playlist

Sidebar listing all theme verses when theme spans multiple surahs.
Builds on existing `onNavigate` and `jumpToVerse` reader props.

---

## PRIORITY 5 — Offline PWA Caching

Cache Quran data files for offline circle sessions.
Service worker already registered at `src/sw-register.ts`.

---

## Code Conventions (Mandatory)

1. All i18n strings in `src/lib/i18n.tsx` — both `en` and `ur` required
2. New sections follow pattern in `src/components/sections/tafseer.tsx`
3. Section IDs added to navItems[] in `src/routes/index.tsx` with lucide icon
4. TypeScript strict mode on — no `any`, no implicit types
5. After every change: `npx tsc --noEmit && npx eslint src/ --max-warnings=0`
6. Before declaring complete: `npm run build`
7. Always test Urdu (RTL) layout — toggle lang via header button
8. No external API dependencies for core features — data must work offline
9. shadcn/ui files in `src/components/ui/` are generated — do not restructure them
10. Run `npm run format` after any file edits
