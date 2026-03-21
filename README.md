# 🛡️ LATTICERUNNER // Autonomous C2 Simulation

**Live Demo:** [https://lattice-runner.github.io/LATTICERUNNER-C2-Sim/](https://lattice-runner.github.io/LATTICERUNNER-C2-Sim/)  
**Current Version:** 21.11 — STABILITY HOTFIX

LATTICERUNNER is a browser-based, real-time **autonomous networked defense simulation** that emulates a Lattice-style command node. Defend a fixed high-value asset against escalating waves of hostile UAS swarms, loitering munitions, and strike aircraft (including jet-launched air-to-ground missiles) using distributed sensors, autonomous interceptors, electronic warfare, and on-call air support — all coordinated through a software-defined mesh with minimal human input.

Built to surface real-world constraints: sensor fusion delays, classification confidence tiers, thermal/power limits on directed energy, comms jamming effects, altitude-specific engagement envelopes, and autonomous fallback when the operator or link is denied.

## Featured Capabilities (v21.11)

- **Persistent XRST Network** — 4 fixed Extended Range Sentry Towers (XRST-01–04) provide autonomous detection & classification out to ~7.5 mi. Towers go offline if physically breached.
- **Tiered IFF Pipeline** — Contacts progress UNKNOWN → SUSPECT → HOSTILE via multi-sensor confidence accumulation  
  (radar +5/tick, XRST +15/tick, EO/IR cone +35/tick, EO/IR ambient +15/tick, ground detect +20/tick, time-on-track bonus)
- **Drone Squadrons**
  - ALTIUS — fast anti-UAS kamikaze swarm (targets packets/FPV)
  - ANVIL — heavier attrition strike drones
  - ROADRUNNER — precision surface-to-air interceptors (limited altitude envelope)
- **Effector Suite**
  - EMP INTERDICTION — wide-area RF pulse (inner kill zone + outer disruption ring)
  - CLG GRID — close-in laser defense perimeter (thermal-limited, ~8 kills max per activation)
  - FURY AIR SUPPORT — on-demand autonomous CAS jets with air-to-air/ground missiles
  - TTU LINK — temporary mesh uplink boost (improves packet intercept probability)
  - ORS SCAN — orbital ISR refresh (recovers downed XRST towers, accelerates enemy approach as trade-off)
- **Live ADS-B Integration** — Real transponder data from OpenSky Network overlaid on the operational picture. Live (neutral) aircraft over Edwards AFB airspace rendered in real time.
- **Electronic Warfare Realism** — Simulated adversary jamming/ECM degrades EO/IR and TTU link; nodes fall back to local autonomy
- **Countermeasures & Evasion** — High-value threats deploy flares to break Roadrunner locks; jets perform evasion maneuvers when threatened
- **Persistent UI Elements** — Wave count, total kills, active assets, base integrity %, current streak, tactical AI recommendations, kill feed, glitch/jam FX, music marquee with volume controls

## Core Engineering Concepts

### Modular C2 Architecture
- **Sensor Mesh** — fused Common Operating Picture via XRST + drone EO/IR + ground layer
- **Effector Rules** — autonomous ROE, engagement envelopes, thermal/cooldown limits
- **State Tick** — 250 ms high-frequency simulation loop handling movement, confidence, intercepts, breaches
- **Build Pipeline** — Python script keeps global constants synchronized across modules

### Sensor Fusion & Classification
Multi-layer confidence scoring per tick:
- RADAR (wide coverage, low confidence) + XRST towers (medium range) + drone EO/IR cone (high confidence directional) + ground acoustic/seismic (low-alt only)
- Full HOSTILE authorization requires ≥80 confidence

### 3D Threat & Engagement Realism
- NOE flight for FPV swarms (~low altitude terrain masking)
- Altitude-based envelopes: Roadrunner missiles ineffective above ~500 m; base breach requires <50 m
- Jet ingress at high altitude → terminal missile dive
- Flares break locks → temporary Roadrunner re-acquisition delay

## Technical Stack

- **Rendering** → Mapbox GL JS (satellite + vector layers, dynamic sources for units/projectiles/explosions)
- **Logic** → Vanilla ES6 JavaScript (zero-framework, single update loop)
- **Audio** → HTML5 `<audio>` + Web Speech Synthesis (voice alerts + dynamic playlist)
- **UI/Effects** — CSS glassmorphism HUD, glitch animations, marquee track titles, pulsing indicators

## Mission Context

I’m a field operator/logistician based in the High Desert near Edwards AFB. CDL Class A, years working austere sites — climbing towers, troubleshooting RF in the dirt, moving heavy gear under time pressure.

I taught myself to code because I believe the future of defense depends on operators who can both climb a tower to fix a sensor and SSH into the box to debug the kernel.

- **Timeline**: Focused on rapid capability scaling for the **2027 mission window**
- **Status**: Ready to deploy immediately

