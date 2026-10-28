# Roadmap — VoltEdge (EV news site + racing game)

## Current request — driving and drift simulator
- [ ] Resume and finish the previously interrupted simulator integration.
- [ ] Replace the old /game experience with a woodland-road driving/drift simulator, licensed vehicle, driver portrait and Deshmukh plate.
- [ ] Add camera angles, fullscreen, pause/restart, keyboard and touch driving, traffic/collision and driving telemetry.
- [ ] Add a cabin YouTube screen starting with vf-XIsSWiGA, custom links and automatic queue advance; report provider playback/HD restrictions honestly.
- [ ] Verify actual driving, camera views, fullscreen and mobile layout; preserve homepage media and private owner/contact flows.

## Current request — uploaded homepage media
- [x] Replace the homepage car viewer and its controls with the seven October 27 uploaded videos.
- [x] Provide a large player with sound/fullscreen controls and selectable video thumbnails, keeping the screenshot as reference only.
- [x] Verify playback, all seven selections, playback continuity, fullscreen, mute controls and mobile width. Additional uploads can be added when received.

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
- Licensed Tesla model is no longer needed for the homepage; uploaded videos replace the viewer.
