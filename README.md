# RESCUE RAIDERS — Armor Alley Tribute

A fast-paced tactical side-scrolling air-ground combat game built in pure HTML5 Canvas and Web Audio API, paying homage to the classic Apple II / DOS retro titles *Rescue Raiders* and *Armor Alley*.

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
| **`B`** | Heavy Blast Bombs (Ground Targets & Bunkers) |
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
| **Mouse Click on Radar** | Click the minimap to instantly scan sectors |
| **Mouse Click on Dock** | Click any unit card at the bottom to purchase reinforcements |

---

## ⚡ Tactical Tips

- **Bunker Capture**: Drop 3 infantry at a neutral or enemy bunker to capture it. Friendly barrage balloons will deploy, giving you airspace cover against enemy fighters.
- **Barrage Balloon Cables**: Hostile barrage balloon cables will shred your helicopter on impact. Climb over them or sever them with gunfire or bombs.
- **HQ Rearm & Repair**: Return to your home base landing pad (`H`) and hover low to repair hull damage and replenish your bombs, missiles, and flares.
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
