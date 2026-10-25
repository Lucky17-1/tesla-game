# Roadmap — VoltEdge (EV news site + racing game)

## Current request — personalized homepage car and owner entry
- [ ] Personalize homepage exterior/interior, Deshmukh plate and driver likeness from lucky.jpeg.
- [ ] Add start/stop moving scenery and audio; center-screen Aaj Ki Raat playback and fullscreen.
- [ ] Replace owner email sign-in with server-validated password gate; preserve private messages and dashboard actions.
- [ ] Verify car controls and password-protected dashboard end-to-end.

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

## 5. Owner + contact (Oct 2026)
- [x] Rebuild game scene (road scroll, traffic, cells, near-miss, cockpit C, touch)
- [x] Homepage 3D exterior/interior viewer (temporary original model)
- [x] Cloud: contact_messages + owner role; contact form saves via server with honeypot + rate limit
- [x] Owner login / set password / reset + dashboard
- [ ] Email alerts to akilking.in@gmail.com — blocked: needs a verified sender domain
- [ ] Licensed Tesla model — blocked: needs a GLB the owner has rights to
