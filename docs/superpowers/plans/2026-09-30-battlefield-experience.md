# Battlefield experience pass

Approved scope: the UX, playability, realism and atmosphere additions listed in chat. Preserve quick battle and the existing desktop/mobile controls. No publication is requested.

1. Transport and command: contextual low-altitude landing/boarding cues, selectable cargo with role/health, shared Advance/Hold/Rally orders. Commands pause safely on mobile; manual ground unloading and automatic boarding protection remain intact.
2. Combat presentation: material-specific impacts, progressive landing damage and settling, destroyed-defense remnants, casualties, exhaust, tracks, clouds and windsocks. Keep effects bounded, cosmetic, and readable.
3. Camera and information: smooth velocity look-ahead, full/reduced/off shake setting, conditional weapon/pad labels. Keep essential warnings visible.
4. Mission loop: optional three-mission campaign (capture, rescue, escort), distinct defense layouts, next/retry flow, objective progress and useful debrief stats. Session-only progression; quick battle remains available.
5. Replay: bounded recent visual snapshots, optional debrief playback and skip, no replay mutation of gameplay, desktop/mobile access.

Verification owner: main agent. Add behavior tests at slice boundaries. Check orders do not move held troops, cargo identity survives selection/drop/pickup, landings damage once, campaign objectives and restart work, replay is bounded and read-only, and mobile controls clear held inputs. Run the integrated Node suite once at completion and browser checks of desktop/mobile command, campaign and replay flows. Inspect screenshots and browser errors. Reuse those checks for unchanged source.

## Completion evidence

Implemented all five slices in `experience.js`, `index.html`, and the shared mobile interface. The integrated suite passes 68 tests, including campaign progression/failure recovery, selected cargo identity, orders, landing damage, camera smoothing, replay isolation, and mobile command/replay flows. Desktop/mobile browser checks report no JavaScript errors; screenshots were inspected and menu/landing-cue overlaps corrected. The campaign is session-only, and the optional silent replay is a sampled visual history, as documented. No push or deployment was performed.
