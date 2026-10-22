# Roadmap — VoltEdge (EV news site + racing game)

## 1. Foundation
- [x] Install game dependencies (three, R3F, drei, zustand)
- [x] Design system in src/styles.css (dark futuristic, red accents, oklch tokens)
- [x] Data files: original articles + concept car specs (clearly labeled estimates)
- [x] Original artwork (hero, concept car, interior, night highway)

## 2. Website
- [x] __root: nav (desktop + mobile), footer, fonts, head defaults
- [x] Homepage (/)
- [x] Car pages: /cars + /cars/axion-gt (official vs estimate vs rumor labels)
- [x] News: /news listing with search + category filter; /news/$slug article page (sources, dates, share, related, ad slot)
- [x] About, Contact (validated form → mail compose), Privacy, Terms, Disclaimer
- [x] Cookie/privacy notice banner (dismissible, persisted)
- [x] Ad slot component that renders nothing until a publisher ID is configured
- [x] sitemap.xml route; robots.txt check
- [x] Per-route head() metadata

## 3. Racing game (/game, ssr:false)
- [x] Game store (menu/playing/paused/gameover), best score in localStorage
- [x] Web Audio: engine loop, crash, pickup, near-miss, UI sounds, mute toggle (persisted)
- [x] Input: keyboard (WASD + arrows) + touch buttons (left/right/accel/brake)
- [x] Scene: infinite scrolling road w/ markings, scenery, fog, lights
- [x] Player car: steering, accel/brake, lean, collision vs obstacles
- [x] Obstacles + energy pickups + difficulty ramp + near-miss bonus
- [x] HUD: speedometer, distance, score, best
- [x] Screens: loading, start, pause (Esc), resume, restart, game over
- [x] WebGL fallback + error boundary

## 4. Quality
- [x] Build clean, tests pass, no console errors
- [x] Playwright check of site nav + game flow
- [x] README: setup, GitHub, publishing, AdSense configuration steps

## Open items (need the user / external)
- Contact email address is a placeholder (src/config/site.ts) — replace with real address
- AdSense publisher ID left unconfigured by design (see README)
- No newsletter (no real email backend configured — per brief)
