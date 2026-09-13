# Shunmo 顺墨 — HSK Hanzi Practice PWA

*Smooth ink, steady strokes.*

Shunmo is a mobile-first **Progressive Web App** for learning and practicing Chinese characters at **HSK-1 and HSK-2** level. It runs entirely in the browser, installs on Android and iOS home screens, and works fully offline after the first visit.

## Features

- **Stroke-order studio** — animated stroke order for all 346 HSK-1/2 characters (real vector stroke data, not fonts), stroke-by-stroke step mode, and a graded **quiz mode** where you draw each stroke with finger/stylus/mouse.
- **Advanced practice** — hide the character outline and the 田字格 grid for true recall. A character only counts as *mastered* when the quiz is completed with both outline and grid hidden.
- **Dialogue drills** — every dialogue offers a guided series of up to 12 of its characters, quiz-only with outline + grid forced off; finishing the series marks them mastered.
- **Read-aloud dialogues** — 16 beginner dialogues (greetings, introductions, shopping, restaurant, time, directions, family, hobbies, weather, plans, café, transport, doctor, phone call, market, birthday) with per-line text-to-speech, play-all mode, speed control, and tap-a-word gloss popovers.
- **Flashcard review** — a spaced-repetition deck (SM-2-lite) covering all 300 HSK-1/2 words: flip cards with pinyin/gloss/dialogue context, Again/Hard/Good/Easy grading with interval previews, "study ahead" for new words, and a due-cards pill on the home dashboard.
- **Global pinyin toggle** — one tap in the top bar shows/hides pinyin everywhere.
- **Word origins & cultural facts** — 81 curated etymology/culture cards woven through the practice page, word details, and the home dashboard.
- **Vocabulary browser** — all 300 HSK-1/2 words with search, level/status filters, and per-character breakdowns.
- **Progress tracking** — mastered characters, streaks, and per-character stats, persisted on-device (localStorage). No account, no server.
- **Light & dark themes** — "Rice Paper" (light) and "Ink Night" (dark), with a quick toggle in the top bar and an Auto mode following the system preference.

## Tech stack

| Layer | Choice |
|---|---|
| Framework | React 19 + TypeScript, Vite 7 |
| Styling | Tailwind CSS 3.4 + shadcn/ui (Radix UI primitives) |
| Animation | Framer Motion |
| Stroke engine | Hanzi Writer 3 + hanzi-writer-data (346 offline JSON stroke files) |
| Speech | Web Speech API (`speechSynthesis`, zh-CN device voices) — no backend |
| PWA | vite-plugin-pwa + Workbox (precache app shell, CacheFirst for stroke data & fonts) |
| Routing | react-router 7 (`BrowserRouter`) |

## Getting started

```bash
npm install
npm run dev      # local dev server
npm run build    # production build → dist/
npm run preview  # preview the production build
```

## Deployment (Netlify)

The repo is ready for Netlify:

- **Build command:** `npm run build`
- **Publish directory:** `dist`
- `public/_redirects` already contains `/*  /index.html  200` so client-side routes survive refreshes.

To install as an app: Android — use the browser's "Install app" prompt; iOS — Share → Add to Home Screen.

## File structure & what each part does

```
├── index.html                  # Entry HTML: title, iOS PWA meta tags, apple-touch-icon
├── vite.config.ts              # Vite config + PWA manifest + Workbox caching rules
├── tailwind.config.js          # Design tokens: the whole color palette lives here
├── CODE_OF_CONDUCT.md          # Contributor Covenant 2.0
├── public/
│   ├── _redirects              # Netlify SPA fallback
│   ├── hanzidata/<字>.json     # 346 stroke-data files (Hanzi Writer format), served
│   │                           #   statically and cached by the service worker
│   ├── icon-*.png, apple-touch-icon.png, logo-seal.svg
│   │                           # App icons + the 墨 seal logo
│   └── *.png                   # Artwork: hero brush, avatars, textures (AI-generated, see Credits)
└── src/
    ├── main.tsx                # Bootstrap: registers the service worker, applies saved
    │                           #   theme before first paint, mounts <App/>
    ├── App.tsx                 # All routes (nested under <Layout/> via <Outlet/>)
    ├── index.css               # Global styles: fonts, paper texture, safe-area utilities
    │
    ├── pages/                  # One default-exported component per route
    │   ├── Home.tsx            #   /            dashboard: greeting, daily character,
    │   │                       #                progress rings, quick actions, culture fact
    │   ├── Practice.tsx        #   /practice    stroke studio: mode switching, char
    │   │                       #                switching, random picker, drill mode,
    │   │                       #                mastery gating logic
    │   ├── Dialogues.tsx       #   /dialogues   dialogue library with filters
    │   ├── DialogueDetail.tsx  #   /dialogues/:id  read-aloud player
    │   ├── Words.tsx           #   /words       300-word browser (search/filter/sort)
    │   ├── WordDetail.tsx      #   /words/:char word breakdown + stroke mini-player + facts
    │   ├── Review.tsx          #   /review      flashcard deck: SRS session flow, 3D flip
    │   │                       #                cards, grading, completion stats
    │   └── Settings.tsx        #   /settings    pinyin, voice, theme, install, reset
    │
    ├── components/
    │   ├── Layout.tsx          # App shell: content column + credit footer strip
    │   ├── Navbar.tsx          # Top app bar: title, theme toggle, pinyin 拼 chip, streak
    │   ├── Footer.tsx          # Bottom tab bar (Home/Practice/Review/Dialogues/Words)
    │   ├── SealLogo.tsx        # The 墨 vermilion seal logo (inline SVG)
    │   ├── TianGrid.tsx        # Reusable 田字格 practice-grid SVG
    │   ├── StrokeCanvas.tsx    # Shared Hanzi Writer wrapper (animate/quiz/reveal modes)
    │   ├── CharPickerSheet.tsx # Full-screen character picker (search + HSK filter)
    │   ├── Chip.tsx            # All / HSK-1 / HSK-2 segmented filter
    │   ├── ProgressRing.tsx    # SVG progress rings (jade HSK-1, gold HSK-2)
    │   ├── FactCard.tsx        # "Origin & Culture" accordion card
    │   ├── DialogueLine.tsx    # Dialogue line: pinyin row, hanzi row, speaker button
    │   ├── Toast.tsx           # Bottom toast notifications
    │   ├── practice/           # Practice-page internals: PracticeCanvas (quiz engine,
    │   │                       #   outline/grid toggles, haptics), RadicalConfetti,
    │   │                       #   usePracticeStats
    │   ├── dialogues/          # Player engine (useDialoguePlayer), bubbles, segmentation,
    │   │                       #   completion card, stats
    │   ├── drills/             # Dialogue-drill logic: char selection + completion card
    │   ├── review/             # Flashcard SRS (srs.ts): SM-2-lite scheduler, due/study-ahead
    │   │                       #   pools, deck stats — localStorage key `hanziflow:review`
    │   ├── words/              # Word row, swipe actions, search/status helpers
    │   ├── settings/           # Settings store (theme, voice, rate), control primitives
    │   └── ui/                 # shadcn/ui component library (buttons, cards, sheets…)
    │
    ├── hooks/
    │   ├── usePinyin.tsx       # Global pinyin visibility (context + localStorage)
    │   ├── useSpeech.ts        # speechSynthesis wrapper: zh voice picking, speak/cancel
    │   ├── useProgress.ts      # Mastered-character set + streak (localStorage)
    │   └── use-mobile.ts       # Viewport breakpoint helper
    │
    └── data/                   # All content, bundled as typed JSON (no backend)
        ├── hsk1.json           # 150 HSK-1 words: hanzi, pinyin (tone marks), gloss
        ├── hsk2.json           # 150 HSK-2 words
        ├── characters.json     # 346 unique characters: pinyin, gloss, radical, strokeCount
        ├── dialogues.json      # 16 dialogues × per-line zh/pinyin/en
        ├── facts.json          # 81 etymology & culture entries
        └── index.ts            # TypeScript interfaces + typed lookup helpers
```

## Adjusting the layout & look

**Colors** — every color is a named token in `tailwind.config.js` (`paper`, `ink`, `vermilion`, `jade`, `gold`, `wash-blue`, `grid-line`…). Change a hex value once and it propagates everywhere. Dark-theme values are defined alongside; dark mode works via a `dark` class on `<html>` managed by `src/components/settings/settings.ts`.

**Typography** — font imports are in `index.css` (Nunito Sans for UI, Fraunces for display, Ma Shan Zheng for decorative calligraphy, system CJK stack for hanzi). Hanzi on the practice canvas are vector paths from stroke data, so they never depend on fonts.

**Content width** — the app is a centered phone-width column: `max-w-[480px]` in `src/components/Layout.tsx`. Widen it there for a tablet-first feel; the decorative calligraphy side strips appear at `lg:` breakpoints in the same file.

**Top bar / tab bar / footer** — heights (56px top, 64px tab bar) and safe-area padding (`env(safe-area-inset-*)`) are set in `Navbar.tsx`, `Footer.tsx`, and the footer strip in `Layout.tsx`. If you change the tab bar height, update the matching `pb-[calc(64px+…)]` in `Layout.tsx` so content still clears it.

**Practice canvas** — stroke animation speed, delays, and quiz behavior (hints after 3 misses, haptics) are in `src/components/practice/PracticeCanvas.tsx`. The mastery rule (quiz must be completed with outline + grid hidden) lives in `src/pages/Practice.tsx` — search for `markMastered`.

**Dialogue drills** — the per-dialogue character selection (cap of 12, first-appearance order) is `getDrillChars` in `src/components/drills/drill.ts`.

**Content** — everything textual is data, not code: edit the JSON files in `src/data/` to add words, dialogues, or culture facts. If you add a **new character**, also drop its stroke file into `public/hanzidata/<字>.json` (copy it from `node_modules/hanzi-writer-data/` after `npm install`).

**PWA caching** — Workbox rules (what gets cached for offline) are in `vite.config.ts` under `workbox.runtimeCaching`.

## Resources & credits

Shunmo is built entirely on open-source software and openly licensed data/fonts. All artwork in `public/` (seal logo, icons, hero brush stroke, scholar avatars, textures, illustrations) was **generated for this project** — no third-party image licenses apply.

### Libraries

| Project | License | Repository |
|---|---|---|
| Hanzi Writer (stroke animation & quiz engine) | MIT | [chanind/hanzi-writer](https://github.com/chanind/hanzi-writer) |
| hanzi-writer-data (stroke graphics; code MIT, data APL — see below) | MIT / APL | [chanind/hanzi-writer-data](https://github.com/chanind/hanzi-writer-data) |
| Make Me a Hanzi (source of the stroke graphics data) | Arphic Public License / LGPL | [skishore/makemeahanzi](https://github.com/skishore/makemeahanzi) |
| React | MIT | [facebook/react](https://github.com/facebook/react) |
| Vite | MIT | [vitejs/vite](https://github.com/vitejs/vite) |
| Tailwind CSS | MIT | [tailwindlabs/tailwindcss](https://github.com/tailwindlabs/tailwindcss) |
| shadcn/ui | MIT | [shadcn-ui/ui](https://github.com/shadcn-ui/ui) |
| Radix UI (primitives) | MIT | [radix-ui/primitives](https://github.com/radix-ui/primitives) |
| Framer Motion | MIT | [motiondivision/motion](https://github.com/motiondivision/motion) |
| Lucide icons | ISC | [lucide-dev/lucide](https://github.com/lucide-dev/lucide) |
| React Router | MIT | [remix-run/react-router](https://github.com/remix-run/react-router) |
| vite-plugin-pwa | MIT | [vite-pwa/vite-plugin-pwa](https://github.com/vite-pwa/vite-plugin-pwa) |
| Workbox (service worker tooling) | MIT | [GoogleChrome/workbox](https://github.com/GoogleChrome/workbox) |

### Fonts (SIL Open Font License 1.1, via Google Fonts)

- **Nunito Sans** — UI & pinyin
- **Fraunces** — display headings
- **Ma Shan Zheng** — decorative calligraphy (seal logo, empty states)

### Data & content

- **Stroke graphics** — derived from the *Make Me a Hanzi* project, which builds on the Arphic public Chinese fonts (Arphic Public License). ~8,900 characters are available upstream; Shunmo bundles the 346 needed for HSK-1/2.
- **HSK-1/HSK-2 vocabulary lists** — the official HSK 2.0 word lists (public standard).
- **Dialogues, etymology & cultural notes** — original content written for Shunmo.
- **Speech** — native browser Web Speech API; voices are provided by the user's device/OS.

## Contributing

By participating you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md) (Contributor Covenant 2.0).

---

This site is powered by [Netlify](https://www.netlify.com/).
