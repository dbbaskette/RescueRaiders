# RESCUE RAIDERS — Armor Alley Tribute

[![Play Online](https://img.shields.io/badge/Play%20Online-GitHub%20Pages-brightgreen?style=for-the-badge&logo=github)](https://dbbaskette.github.io/RescueRaiders/)

A fast-paced tactical side-scrolling air-ground combat game built in pure HTML5 Canvas and Web Audio API, paying homage to the classic Apple II / DOS retro titles *Rescue Raiders* and *Armor Alley*.

🎮 **[Play Live Now on GitHub Pages](https://dbbaskette.github.io/RescueRaiders/)**

![Gameplay Screenshot](assets/backdrop.jpg)

---

## 🚁 Mission Objective

Pilot your attack helicopter through contested territory. Deploy combined-arms ground forces from your Home Base (HQ), capture forward bunkers using infantry to secure protective barrage balloons, and escort your **Demo Van** to the enemy HQ on the far right to achieve victory.

**Defeat Conditions**:
- If the **Enemy Demo Van** reaches your HQ on the far left, your base is destroyed.
- If you lose all your helicopters, your mission fails.

---

## 🎮 Controls

### Helicopter Flight & Combat
| Key / Input | Action |
| :--- | :--- |
| **`W` / `A` / `S` / `D`** or **Arrows** | Flight Pitch, Direction & Altitude |
| **`SPACE`** | 30mm Minigun (Armor Piercing) |
| **Hold `B` / Release `B`** | Preview bomb trajectory / Drop one bomb (tap for a quick drop) |
| **`Esc`** | Cancel a held bomb preview |
| **`M`** | AIM Heat-Seeking Missiles (Air & Armor) |
| **`C`** | Thermal Flare Decoys (Diverts Incoming Missiles) |
| **`E`** | Troop Bay: Hover low near infantry to board (up to 4), or hover near bunkers to deploy |

### Tactical Command & Interface
| Key / Input | Action |
| :--- | :--- |
| **`1`** | Deploy Infantry ($20) — Captures bunkers |
| **`2`** | Deploy Battle Tank ($120) — Heavy armor & cannon firepower |
| **`3`** | Deploy AA Truck ($160) — Long-range anti-aircraft flak missiles |
| **`4`** | Deploy Demo Van ($250) — Strategic objective unit (1 max) |
| **`P`** | Tactical Pause Menu |
| **Mouse Click on Radar** | Scan a sector for 2.5 seconds; flight input returns to your helicopter |
| **Mouse Click on Dock** | Click any unit card at the bottom to purchase reinforcements |

---

## 📱 Mobile Play

Open the game on a touchscreen phone or tablet and rotate to landscape. Touch controls appear automatically; desktop keyboard controls remain available in the normal desktop interface. To preview the touch interface in a desktop browser, append `?touch=1` to the URL.

- **Left joystick:** Drag to steer proportionally. Release for hover assistance while fuel remains.
- **FIRE:** Hold to shoot while steering with your other thumb.
- **BOMB:** Hold to preview, release over the button to drop. Drag off the button or tap **Cancel bomb** to cancel.
- **MISSILE / FLARE:** Tap to launch or deploy. Ammunition counts appear on the buttons.
- **Troops:** A boarding/drop button appears when you are low enough and troops are available.
- **UNITS:** Opens a reinforcement tray and pauses the battle. Choose units, then tap **Back to flight**.
- **Radar:** Tap to scan a sector; moving the joystick restores tracking.
- **Pause / rotation:** Rotating to portrait or leaving the page clears held controls and pauses. Return to landscape and resume explicitly.

The mobile HUD uses readable touch targets, safe-area spacing for screen cutouts, and a reduced cosmetic particle budget. Gameplay, missions, and ammunition rules are shared with desktop. This is a mobile browser interface, not a separate app-store download.

---

## ⚡ Tactical Tips

- **Bunker Capture**: Drop 3 infantry at a neutral or enemy bunker to capture it. Friendly barrage balloons will deploy, giving you airspace cover against enemy fighters.
- **Barrage Balloon Cables**: Hostile barrage balloon cables will shred your helicopter on impact. Climb over them or sever them with gunfire or bombs.
- **HQ Rearm & Repair**: Return to your home base landing pad (`H`) and hover low to repair hull damage, refuel, and replenish your bombs, missiles, and flares.
- **Forward Bases**: Capturing a bunker also opens a marked landing pad just to its right. Hover low and slow over it to restore fuel at 5%/second and repair hull at 4 points/second, up to 75%. Forward pads do not restock ammunition; HQ still provides full repairs and rearming. Service stops if the bunker is recaptured. Green crosses on radar mark friendly forward bases.
- **Bomb Predictor**: Hold `B` to preview the trajectory and estimated time to ground impact, then release to drop one bomb. The estimate accounts for your speed, altitude, vertical motion, and bomb drag. Units, balloons, and cables may intercept the bomb before it reaches the marker. `Esc`, pausing, or losing focus cancels the preview without dropping.
- **Fuel Management**: A full tank lasts roughly 4–6 minutes depending on horizontal speed. Below 20%, an amber master caution calls you home. At zero fuel, lift and horizontal thrust stop; a forced landing away from a friendly service pad costs a helicopter. Land at HQ or a friendly forward pad before running dry. A safe landing at either can recover an empty tank.
- **Missile Lock**: Amber brackets show the target your next missile will acquire (aircraft take priority over ground units). Flares divert incoming missiles while the decoy remains active.
- **Flight HUD**: The small mark ahead of your helicopter shows gun direction; four pips below it refill between shots. Critical hull below 25% triggers a centered master caution.
- **Troop Transport**: Infantry walk slowly from base. Landing low and airlifting troops forward in your helicopter's cargo bay (`E`) is significantly faster.

---

## 🛠️ Running Locally

No dependencies or build steps required. Simply serve the directory with any static HTTP server:

```bash
# Using Python
python3 -m http.server 8085

# Open in browser:
# http://localhost:8085/
```

Or open `index.html` directly in any modern web browser.

---

## 📜 License

MIT License. Assets and tributes inspired by classic retro military gaming.

## Verification

Run the dependency-free gameplay regression suite with Node.js:

```bash
node --test tests/*.cjs
```

The game pauses when its window loses focus. Graphics include terrain-dependent rotor wash (dust over dirt, clippings over grass), vehicle road dust, wind- and rotor-driven grass movement, drifting smoke, navigation lights, muzzle illumination, and softened ground shadows. Vehicle wrecks remain for 75 seconds (up to 24 at once), with smoke during their first 20 seconds; ground scorch marks fade over 60 seconds. These effects are cosmetic and do not block movement.
