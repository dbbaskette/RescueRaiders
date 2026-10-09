<div align="center">

# RESCUE RAIDERS

**Fly the helicopter. Command the battlefield. Bring your people home.**

A browser tribute to *Rescue Raiders* and *Armor Alley*, with combined-arms tactics, airborne rescues, and a living battlefield.

[![Play online](https://img.shields.io/badge/PLAY-RESCUE_RAIDERS-9bbda5?style=for-the-badge&labelColor=14272b)](https://dbbaskette.github.io/RescueRaiders/)
[![Game checks](https://github.com/dbbaskette/RescueRaiders/actions/workflows/checks.yml/badge.svg)](https://github.com/dbbaskette/RescueRaiders/actions/workflows/checks.yml)
[![Latest commit](https://img.shields.io/github/last-commit/dbbaskette/RescueRaiders?color=c7ae77&labelColor=14272b)](https://github.com/dbbaskette/RescueRaiders/commits/main/)
[![License: MIT](https://img.shields.io/badge/License-MIT-789d9a?labelColor=14272b)](https://opensource.org/license/mit)

**[Play now](https://dbbaskette.github.io/RescueRaiders/)** · **[Field manual](docs/FIELD_MANUAL.md)** · **[Report an issue](https://github.com/dbbaskette/RescueRaiders/issues)**

</div>

![Actual desktop gameplay: helicopter, parachute insertion, protected convoy and bomb prediction](docs/media/day-operations.png)

## One helicopter. An entire front.

Escort your Demo Van to enemy HQ while protecting your own base. Airlift infantry to capture bunkers, insert engineers to rebuild turrets, and keep armor and anti-aircraft support moving together. Your helicopter can turn a battle—but it needs fuel, ammunition, and somewhere safe to land.

![Airlift troops, secure forward bases, and escort the combined-arms convoy](docs/media/operations.svg)

| Fly & recover | Command & adapt | Feel the battlefield |
| --- | --- | --- |
| Automatic boarding and four individual cargo seats | Infantry, armor and support orders | Day and night operations |
| Wind-aware bomb predictor | Tanks lead; AA and infantry cover the Van | Rain, wet ground and gusts |
| Forward-pad fuel guidance | Engineers capture and repair defenses | Terrain wash, smoke, wrecks and positional audio |
| Missile warning with bearing, four flares | Bunkers pay income; kills pay bounties | Team-outlined units that read against the terrain |
| Pilot bailout and recovery bonuses | Three campaign missions with saved checkpoints | Smooth action replays with slow motion |
| Keyboard, touch or gamepad | Three short lessons that lead into the campaign | Sharp on high-density screens |

## Night changes the view

Landing lights, turret searchlights, muzzle flashes and illuminated pads pick out the battlefield. Rain reduces visibility; wind moves the aircraft, parachutes, smoke and bombs. The final campaign mission takes place at night. Quick Battle also lets you choose daylight or night and clear, gusty or rainy conditions.

![Actual night operations in rain: landing light, a turret searchlight and an incoming-missile warning](docs/media/night-operations.png)

*Realism is expressed through readable 2D physics and visual approximations. This is an arcade tactics game, not a flight simulator.*

## A flight deck for your phone

Open the same game on a phone or tablet in **landscape**. Steer with one thumb and operate weapons with the other. The **Command** panel pauses the battle for purchases, group orders and passenger selection. Menus support finger scrolling, buttons have at least 44-pixel touch targets, and layouts respect screen cutouts. Rotation or leaving the page pauses safely.

![Actual mobile interface with flight joystick, weapons, compact radar and return guidance](docs/media/mobile-operations.png)

No installation or account required. Add the page to your home screen to fly full-screen in landscape without browser chrome; where the browser allows it, the menu also has a **Fullscreen** button. Use [`?touch=1`](https://dbbaskette.github.io/RescueRaiders/?touch=1) to preview the touch interface on desktop.

## Choose your sortie

| Mode | Your objective |
| --- | --- |
| **Quick Battle** | Capture territory and escort your Van through a full battlefield. |
| **Campaign · 1 / Foothold** | Secure the marked forward bunker. |
| **Campaign · 2 / Bring them home** | Recover four stranded troops and deliver them to HQ. |
| **Campaign · 3 / Breakthrough** | Escort your Van past occupied defenses at night. |
| **Training** | Learn flight, bombing, boarding and bunker capture without enemy deployments. |
| **Flight Academy** | Practice selective cargo drops, parachutes, engineer capture/repair and armor orders. |
| **Combat School** | Buy a unit, refuel at HQ, flare a missile and cross a balloon cable. |

The three lessons take a few minutes each and lead into one another, then into the campaign. The large menu button follows you: it offers the next lesson on a first visit, and afterwards whatever you flew last.

**Resume campaign** returns to the beginning of your saved mission. Difficulty, sound, shake and environment preferences are stored locally in your browser. No account or cloud save is involved; unavailable browser storage falls back to the current tab.

<details>
<summary><strong>Desktop controls</strong></summary>

| Input | Action |
| --- | --- |
| **WASD / arrows** | Fly |
| **Space** | Fire gun |
| **Hold B → release** | Preview → drop one bomb; **Esc** cancels |
| **M / C** | Missile / flares |
| **E** | Board low; deploy the bay low or one parachutist aloft |
| **Q / F** | Select passenger / deploy selected passenger |
| **1–5** | Buy infantry, tank, AA truck, Demo Van, engineer |
| **Tab** | Select All, Infantry, Armor or Support |
| **Z / X / V** | Advance / Hold / Rally selected group at helicopter |
| **J** | Bail out when damaged, high enough, and a spare helicopter remains |
| **P / Esc** | Pause: sound, shake, convoy escorts, fullscreen, restart or main menu. Esc cancels a bomb preview first |
| **H** on menu or pause | Controls reference for keyboard and gamepad |
| **Click radar** | Scan a sector; steering restores tracking |
| **Enter** on menu | Start the highlighted sortie |
| **Q / C / U** on menu | Quick battle / new campaign / resume campaign |
| **T / Y / K** on menu | Training / flight academy / combat school |
| **R** on debrief | Replay; **Space** changes speed, **F** changes camera, **Esc** exits |

**Gamepad** (standard layout; press any button to take control): left stick flies and hovers when released, **A** or **RT** fires, hold **X** to preview a bomb and release to drop, **B** missile, **Y** flares, **RB** board or unload, **LB** select passenger, **LT** drop the selected passenger, D-pad up / down / left for Advance / Hold / Rally and right for the next group, **Start** pauses or confirms. Reinforcements are bought with the keyboard, mouse or touch.

Landing in front of friendly troops and holding still boards them automatically. **Support** includes AA trucks and the Van; engineers follow the **Infantry** group. See the [field manual](docs/FIELD_MANUAL.md) for costs, service limits and tactical details.

</details>

<details>
<summary><strong>Run locally & contribute</strong></summary>

The game runs directly from static files: Canvas for graphics, Web Audio for synthesized sound. There are no runtime packages or build steps.

```sh
python3 -m http.server 8085
```

Open **http://localhost:8085/**. To run gameplay and mobile regressions with Node.js 22 or later:

```sh
node --test tests/*.cjs
```

| File | Responsibility |
| --- | --- |
| `index.html` | Simulation, rendering, audio, input and desktop interface |
| `experience.js` | Missions, cargo, commands, camera, replay and the shared desktop button |
| `operations.js` | Saves, weather/night, escorts, navigation, lessons and pilot recovery |
| `mobile.js` / `mobile.css` | Touch controls and responsive flight deck |
| `manifest.webmanifest` | Install metadata: landscape, full-screen, icons |
| `assets/process.py` | Rebuilds sprites and app icons from the `src_*.png` sources (needs Pillow) |
| `tools/balance.cjs` | Headless sorties that report how an idle or ground-only player fares |
| `tests/` | Dependency-free gameplay and mobile regression checks |

The simulation advances in fixed 1/120 s steps and the canvas renders at the display's pixel density (capped at 2×, 1.5× on touch), so speed and sharpness do not depend on the device. The desktop HUD and menus are drawn on the canvas with one shared button style so they scale with the 16:9 view; the touch interface uses DOM controls for native touch targets. Enemy tints, hit flashes and wrecks are shaded from one base sprite at load.

CI runs these tests on Node.js 22 and 24. The status and last-commit badges above update with the repository. The images are captures from the game; the [field manual](docs/FIELD_MANUAL.md) documents its rules.

</details>

## Credits & license

An independent tribute inspired by *Rescue Raiders* and *Armor Alley*. Not affiliated with their original creators. Code is released under the [MIT License](https://opensource.org/license/mit).
