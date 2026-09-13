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

This app is deployed & available thanks to [Netlify](https://www.netlify.com/).
