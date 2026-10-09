# Rescue Raiders field manual

[Play](https://dbbaskette.github.io/RescueRaiders/) · [Repository overview](../README.md)

## Win the ground war

In Quick Battle and the final campaign mission, escort one friendly Demo Van to enemy HQ. An enemy Van reaching your HQ or losing every helicopter ends the sortie. Capture and rescue missions have their own objectives.

Your helicopter supports the convoy with guns, bombs, missiles and troop transport. Returning low to HQ repairs, refuels and rearms it. Friendly forward pads refuel and partially repair it. Aircraft and ground weapons share the same battlefield on desktop and mobile.

## Flight deck

- **WASD / arrows:** steer. On touch, drag the left joystick; releasing it provides vertical hover assistance while fuel or reserve remains. Wind still causes lateral drift.
- **Space / FIRE:** hold to fire. The small gun-direction mark and four pips ahead of the helicopter show weapon readiness.
- **Hold B / BOMB:** show the trajectory and estimated time to ground; release to drop once. Esc, dragging off the touch button, pausing or losing focus cancels the preview.
- **M / MISSILE:** launch at the selected aircraft or ground target. Brackets appear while engaging, rather than cluttering ordinary flight.
- **C / FLARE:** launch decoys that can divert incoming missiles.
- **P / pause button:** pause. Leaving the page, losing focus or rotating a phone to portrait also pauses. Resume explicitly.
- **Click or tap radar:** inspect a sector for 2.5 seconds; flight input restores camera tracking.

Damage flashes indicate the incoming direction. Critical hull and low fuel have visual and audible cautions. The enemy **HQ breach** timer estimates uninterrupted Van travel; combat, assembly and escorts can delay arrival. Full, reduced and disabled camera shake settings are available and saved.

## Troop transport

The bay holds four infantry, engineers or recovered pilots. Role, remaining health and rescue identity survive boarding and deployment.

**Automatic pickup:** land in front of friendly infantry or engineers and hold nearly still. Troops within 65 world units behind/beside the helicopter board every 0.35 seconds. Full cargo, moving too quickly or flying above the landing band stops pickup. Vehicles and enemies never board.

**Manual pickup:** use E / Board while low, within 115 world units of the troops.

**Selective deployment:** click a cargo seat or press Q, then F. Mobile offers seat selection and Deploy selected in Command. E deploys the entire bay low; above 130 world units from the ground it deploys one parachutist per press. Ground deployment inhibits automatic reboarding until you lift at least 70 world units from the ground.

Parachutists inherit horizontal aircraft motion, fall for 0.25 seconds before deployment, and inflate their canopy over 0.75 seconds. Gravity, drag and wind govern descent. They can be shot while airborne; there are no random canopy failures. Landing settles for 0.55 seconds, with discarded fabric fading afterward.

## Reinforcements and groups

| Key | Unit | Cost | Role / command group |
| --- | --- | ---: | --- |
| 1 | Infantry | $20 | Capture and replenish bunkers / Infantry |
| 2 | Tank | $120 | Lead the convoy and attack defenses / Armor |
| 3 | AA truck | $160 | Protect against aircraft / Support |
| 4 | Demo Van | $250 | Reach enemy HQ; one active per side / Support |
| 5 | Engineer | $40 | Capture turrets and repair defenses / Infantry |

Desktop: select a group with **Tab** or the four group buttons, then **Z Advance**, **X Hold** or **V Rally**. Mobile: open **Command**, select the group and order. Command pauses the battle while you decide. On a smaller phone, swipe vertically—even over buttons—to reach the rest of the panel. Opening a different menu restores its heading; remaining in that menu preserves your scroll position.

- **Advance:** move toward enemy HQ using escort spacing.
- **Hold:** stop movement while retaining firing, nearby capture and engineering work.
- **Rally:** move toward the helicopter's location at the moment of the order, then stop nearby. It does not continuously chase the aircraft.
- **All:** apply the order to every group. New reinforcements inherit their group's current order. Stranded rescue troops and downed pilots wait for recovery.

With **Convoy escorts** enabled, tanks overtake and lead infantry, AA and the Van. Infantry stays approximately 65 world units behind the foremost tank, AA 125 and the Van 210. Faster followers close gaps without overtaking the lead armor. A Van waits when it has no surviving infantry, tank or AA escort; buy replacement protection or turn escort behavior off. Engineers remain free to reach their work sites. AA trucks fire on the move, so they keep their place in the column while engaging aircraft. Explicit Hold and Rally orders take precedence over formation movement.

**Final run:** escorts stop to fight short of the opposing HQ, so within 680 world units of it the Van leaves formation, passes its escorts and drives for the line at full speed. It is unprotected for those seconds: clear the approach first, or **Hold** the Support group and release it with **Advance** when the way is open. The enemy Van makes the same run at your HQ.

Switch convoy escorts on/off in pause on desktop, or Command on mobile. This is a sortie setting for your column only; the enemy always keeps formation. Troops moving in the same direction can pass units assigned a rear formation position; this represents separate lanes within the side-on battlefield.

The enemy assembles combined-arms waves, releasing a column when it has a tank, AA and three infantry or after 45 seconds of waiting. Engineers can turn back to reclaim nearby turrets. Vans require two armor/AA escorts before purchase, obey escort spacing and make the same final run. Brief radio captions announce column movements.

## Bunkers, turrets and service

Three infantry capture a bunker. Its three garrison pips correspond to 30 HP each; additional friendly infantry can replenish a depleted garrison. Bunker guns engage ground units except tanks. Destroying its garrison neutralizes ownership, disables its balloon and closes the forward pad.

An engineer captures a turret after three uncontested seconds. Enemy ground troops within 90 world units interrupt work. Engineers then repair the turret at 20 HP/second; friendly manned bunkers repair at 12 HP/second. Turrets aim at aircraft and ground units. Both sides can use engineers.

Hostile balloon cables can damage a helicopter when its fuselage crosses them. Fly over the balloon or sever the cable with weapons. The collision envelope follows the helicopter's pitch; the main rotor and tail are not full damage boxes. Vehicle dimensions and infantry height follow their rendered proportions, with landing skids meeting the ground.

| Service area | Approach | Supplies |
| --- | --- | --- |
| HQ | Low over your base | Full hull repair, fuel and bombs/missiles/flares |
| Captured forward pad | Low and slow, just right of the bunker | Fuel at 5%/second; hull at 4 HP/second up to 75%; no ammunition |

The compact navigation readout selects the nearest currently friendly pad, shows distance and estimates fuel for a cruise-and-descent approach. **RETURN** appears when remaining fuel is within an eight-point margin of that estimate. It updates immediately when ownership changes. The estimate assumes a direct flight and does not account for combat, detours or future gusts.

Main fuel burns faster at higher horizontal speed. At zero, a 20-second emergency reserve preserves thrust. After the reserve expires, the helicopter descends without powered lift; landing away from a service area costs an aircraft. Servicing back to 20% replenishes the reserve. Hard landings above 95 world units/second cause proportional hull damage, capped at 60 per touchdown.

## Weather and night

Choose **Clear**, **Gusty** or **Rain** and **Day / Night** on the menu. Preferences apply to the next sortie. The final campaign mission always uses night lighting; the academy uses clear daylight.

- Aircraft feel lateral wind force, weaker in clear conditions and stronger in weather.
- Parachutes, smoke, grass and windsocks share the same wind field.
- Bombs sample wind at release. Their live drag calculation and predictor use that same sample, so the predicted ground position agrees with the simulation. Obstacles can intercept a bomb earlier.
- Rain adds streaks, haze and wet-ground highlights. Rotor wash becomes spray and vehicle road dust is suppressed.
- Night reduces visual visibility. Aircraft landing lights, navigation lamps, turret searchlights, illuminated pads and weapon flashes provide local cues. HUD and radar remain readable. These lights are visual aids; AI targeting does not depend on a light cone.

Natural-looking sprites and a photographic landscape, softer projected shadows, moving tracks, exhaust, wrecks and terrain effects establish the scene. Sound is synthesized locally with stereo placement, distance attenuation, layered weapons and rotor beds. Mute, pause, replay and page visibility control the audio mix.

A hostile Van within 1,100 world units horizontally of your helicopter jams enemy mobile contacts on radar. Friendly contacts and fixed landmarks remain visible. Destroy the Van or leave its range to restore those contacts. The computer commander does not use radar to make decisions.

## Bail out and recover

**J**, or **Bail out** in mobile Command, is available when hull is at most 35%, altitude exceeds 130 world units and at least one spare helicopter remains. It is disabled during training.

Bailout parachutes every passenger and the pilot, costs the damaged helicopter, and sends a replacement after five seconds. The marked pilot waits on the ground and remains vulnerable. Recover them like infantry and return to HQ for **$150 and 250 points**. Delivery removes the pilot from cargo, so the bonus cannot be collected twice. It does not restore the lost helicopter. A rescued pilot can be dropped again before delivery; their identity is preserved.

## Campaign, saves and training

| Mission | Objective |
| --- | --- |
| Foothold | Capture the marked neutral bunker with the provided troops. |
| Bring them home | Recover four stranded troops and return them to HQ. Losing any member fails the mission; Retry restores the team. |
| Breakthrough | Escort the Van through occupied defenses at night. |

The browser saves a checkpoint at the start of a campaign mission and advances it after victory. **Resume campaign** / menu **U** starts the saved mission fresh. Restart retries the current mission; Next Mission advances after victory. New Campaign starts over from Foothold. Quick Battle and training do not overwrite the campaign checkpoint.

Difficulty, sound, camera shake and environment preferences also persist. Storage uses a versioned, validated local record; corrupt data falls back to defaults, and unavailable storage retains only the current tab's checkpoint with a menu notice. Clearing browser data removes the save. There is no cloud synchronization or mid-battle save.

| Difficulty | Starting funds | Incoming attack damage | Enemy order interval | Earliest Van purchase |
| --- | ---: | ---: | ---: | ---: |
| Recruit | $450 | 70% | 6 seconds | 100 seconds |
| Normal | $300 | 100% | 4 seconds | 70 seconds |
| Veteran | $220 | 120% | 3 seconds | 50 seconds |

Enemy income also scales. Hard-landing and fuel-exhaustion losses do not receive attack-damage scaling.

**Training** / menu **T** covers flight, bombs, pickup and capture. **Flight Academy** / menu **Y** covers boarding mixed cargo, selecting an engineer for a parachute insertion, capturing and repairing a turret, and holding/rallying armor. Both provide the troops needed, disable enemy deployments and restart if the helicopter is lost. Use the aircraft to recover/reposition an engineer who lands away from the target turret.

## Debrief and replay

The debrief reports rescued troops/pilots, captured bases, convoy losses and the last aircraft-loss cause. **Watch final moments** / **R** plays a bounded history of up to 64 visual snapshots, sampled roughly eight times per second.

Playback interpolates between snapshots using stable entity identities. It follows a finishing Van, recent ordnance or the helicopter; **F / camera button** switches to the original view. **Space / speed button** changes between normal speed and 0.35× slow motion. **Esc / Back to debrief** exits. Replay is silent and never resumes, damages or awards points to the live battle. It is a visual recording, not a deterministic re-simulation.

Cosmetic budgets bound particles (180 on touch / 700 on desktop), wrecks, discarded canopies and replay history. Fixed terrain is cached in up to 40 tiles, with grass and rotor wash remaining animated.
