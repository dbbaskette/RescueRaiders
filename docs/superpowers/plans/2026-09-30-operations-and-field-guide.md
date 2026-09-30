# Operations and field guide

Approved scope: implement the recommended gameplay/UX additions, create a graphical README, publish a PR and merge after verification. Owner: main agent for implementation and all integrated checks.

## Slices

1. **Persistent sorties and navigation** — `operations.js` (new), `experience.js`, `index.html`, `mobile.js`: versioned, validated local preferences and campaign checkpoints; resume from the start of the unlocked mission; nearest friendly pad, estimated fuel requirement and return warning. Storage failure must never block play.
2. **Combined arms and training** — shared group selection/orders, convoy spacing with tanks leading and Vans protected, enemy assembly and engineer recovery, a separate guided advanced academy. Keep stranded troops stationary and give new reinforcements the current group order. Verify both sides can progress without formation deadlock.
3. **Weather, night and recovery** — shared wind for aircraft, parachutes, smoke and launch-sampled bomb drift; wet ground/rain and reduced visual range; navigation/search/pad lights; explicit pilot bailout, preserved passengers and recoverable pilot reward. Align body/skid collision geometry with rendering. Gameplay remains a readable 2D approximation.
4. **Replay and interface integration** — stable snapshot identities, interpolation, decisive-action tracking and slow motion; equivalent touch controls, compact flight guidance, no large central overlay. Snapshots remain bounded and playback never changes live state.
5. **Repository presentation** — replace the accumulated README with a visual overview, actual desktop/mobile captures, tactical SVG artwork, controls and a maintained field manual. Add a dependency-free CI status badge and test workflow.

## Verification

Targeted tests after each coherent slice; full `node --test tests/*.cjs` once after integration. New checks cover persistence corruption/unavailability, group isolation and convoy recovery, weather/predictor agreement, pilot identity and rewards, academy progression, replay identity/interpolation/isolation, and mobile controls. Real Chromium checks cover reload/resume, graphics, desktop and mobile interaction, console errors and bounded rendering work. Inspect screenshots before using them in the README.

Review focus: script initialization order, cargo conservation, rally/formation interaction, environmental effects leaving HUD legible, storage never overwriting campaign progress during quick battle/training, and newly spawned replay entities never borrowing another entity's motion.

## Completion record

- All five implementation slices complete: shared operations module, desktop/touch integration, interpolated replay, graphics and field manual.
- 84 gameplay/mobile tests pass on the final source. Chromium interaction checks passed with no page errors, covering reload/resume, preferences, selected-group commands, bailout and replay controls. README desktop/night/mobile screenshots and the SVG were rendered and visually inspected.
- Synthetic seeded combat fixture (60 initial units, rain/night, 120 simulation/render steps) measured about 50.3 ms/render before caching, then 14.5 and 13.9 ms/render after. Static terrain caching alone did not materially improve the combined workload; caching damage and persistent wreck treatments removed repeated sprite filters. This is local headless-browser evidence, not a mobile-device benchmark.
- Save corruption/unavailable storage, convoy progression, pilot/passenger conservation, academy progression, prediction agreement and replay identity/isolation are covered by regression checks.
- Publication: push feature branch, create and attach PR, wait for required checks, merge without bypassing protections, verify merged tree.
