# 🛡️ LATTICERUNNER 22.0  
**Autonomous C2 Defense Simulation — Anduril Lattice Platform**  
**Taiwan Strait Contingency Edition**

[![Live Demo v22.0 Taiwan Strait](https://img.shields.io/badge/Live%20Demo-v22.0%20Taiwan%20Strait-blue?style=for-the-badge&logo=github)](https://lattice-runner.github.io/LATTICERUNNER-C2-Sim/)  
 **Note: Live page currently shows v22.0 Taiwan Strait simulation (title may display 21.11 internally). Earlier Antelope Valley version available on request if needed.**

A **real-time, browser-based, two-sided simulation** of Anduril's Lattice platform — now modeling a full Taiwan Strait contingency with **adaptive PLA AI**, **finite inventories**, **US reinforcement timelines**, and escalation drawn from unclassified CSIS & CNAS wargames.

This is **not** a tech demo or abstract game.  
It is a working model of the coordination layer that will define the next fight — rebuilt from the Mojave Desert to the Taiwan Strait because the threat is real and the timeline is **2027**.

---

## What's Running

### Sensor Fusion — 4 active layers per tick
- **Radar** → +5 confidence/tick, full spawn envelope  
- **XRST tower network** → +15 confidence/tick (4 towers on real Taiwan terrain: Yangmingshan, Keelung, Taoyuan, Danshui)  
- **EO/IR drone camera cones** → +35 inside cone, +15 ambient  
- **Acoustic/seismic ground detection** → +20 (low-altitude only)

Contacts evolve: **UNKNOWN** → **SUSPECT** → **HOSTILE**  
Engagement authorized at **≥80 confidence**.

### Autonomous & Manned Squadrons (Finite Inventories — You Run Out)
- **ALTIUS** — 45 anti-UAS attritable drones (20% held in close-in reserve, retaskable to ground strike)  
- **ANVIL** — 24 heavier attrition interceptors (retaskable to ground strike)  
- **ROADRUNNER** — 8 precision turbojet interceptors (jets, missiles, DF-17 hypersonic only)  
- **F-16V / Fury CCA** — 12 sorties departing Hualien Air Base (east coast hardened site), 96-second cooldown

### Effector Suite
- **EMP interdiction** — kill zone + outer disruption ring (friendly collateral modeled)  
- **CLG directed energy grid** — thermal-limited, 8 kills per activation  
- **TTU mesh uplink boost** — 75% intercept probability, silences voice comms during uplink  
- **ORS orbital ISR scan** — restores XRST towers, 20% base integrity repair  
- **HIMARS** — manual-fire precision salvo, cascading impact visual, **3-day cooldown**  
- **Carrier Strike** — USS George Washington F/A-18 package, 20-second inbound delay, full battlefield effect

### Naval Forces — Full Order of Battle

**US Carrier Strike Group (CVN-73 George Washington)**
- CVN-73 George Washington (Nimitz-class, $13B, 20 aircraft)  
- CG-67 Shiloh / CG-73 Port Royal (Ticonderoga cruisers, 122-cell VLS, BMD-capable)  
- DDG-109 Jason Dunham, DDG-89 Mustin, DDG-110 William Lawrence, DDG-71 Ross (Arleigh Burke DDGs, 96-cell VLS each)  
- SSN Virginia-class / SSN-21 Seawolf (submerged, torpedo + Tomahawk capable)  
- 380 total VLS cells — tracked and displayed live (CSG VLS Brief panel)

**Japan DDG Squadron (activates with Japan Basing ON)**
- DDG-107 Gravely, DDG-85 McCampbell (Arleigh Burke DDGs)  
- JS Atago DDH-177 (JMSDF, SM-3 Block IIA BMD-capable)

**PLAN Surface Action Group**
- 南昌 / 延安 (Type 055, 112 VLS each)  
- 贵阳 / 太原 (Type 052D, 64 VLS each)  
- 岳阳 / 三亚 (Type 054A, 40 VLS each)  
- SS-329 / SS-331 (Type 039B AIP submarines)  
- 广西 Type 075 LHD + 四川 / 昆仑山 Type 071 LPDs (amphibious assault)  
- 查干湖 Type 901 replenishment ship

**CSG Posture Control** — player-selectable stance:
- ⚔ **AGGRESSIVE** — CSG at 150nm, +50% VLS fire rate, +20% hit chance, 2× damage taken  
- ◆ **DEFENSIVE** — CSG at 300nm, balanced posture (default)  
- ◁ **WITHDRAW** — CSG at 500nm+, −50% VLS fire rate, −50% damage taken

CSG withdraws to Guam automatically for VLS reload (72-hour round trip).

**ROC Patrol Boats** — 4× Tuo Chiang-class corvettes with Hsiung Feng anti-ship missiles, independently hunting PLAN landing ships in assigned lanes.

### Taiwan IADS — 8 Integrated Air Defense Sites
- Taipei TK-III, Hsinchu PAC-3, Taichung TK-III, Hualien TK-III  
- Tainan PAC-3, Kaohsiung TK-III, Taipei PAC-3, Pingtung TK-III  
- 600 combined missile pool (TK-III + PAC-3)  
- CSIS-sourced Pk values per threat type (ballistic / cruise / hypersonic)  
- Sites degraded by opening salvo — status tracked live in right panel

### Strategic Bomber Strikes
- **9th BS Buccaneers** — B-21 Raider, 16 sorties from Whiteman AFB  
- **20th BS Buccaneers** — B-2 Spirit, 20 sorties from Andersen AFB (Guam)  
- JASSM-ER stand-off strikes against PLAN missile brigades and naval targets  
- Each B-2 loss = ~1/16th of total US stealth bomber capacity

### Air Wing (CVN-73 + Land-Based)
- VFA-27 Royal Maces — 72× F/A-18E  
- VFA-102 Diamondbacks — 72× F/A-18F  
- VAQ-136 Gauntlets — 36× EA-18G (ALQ-99 jamming, irreplaceable EW asset)  
- Air-to-air engagements modeled with BVR (AIM-120D vs PL-15), ambush mechanics, and loss tracking per squadron

### Ground War System
- PLA amphibious forces land and advance toward the Presidential Office (25.0400°N, 121.5120°E)  
- ROC ground forces (Army brigades, Marine battalions) block and attrit PLA columns  
- Terrain modifiers and tank multipliers affect combat outcomes  
- Presidential Guard defends the final objective room-to-room  
- **TAIPEI HAS FALLEN** = game over — PLA seizes the Presidential Office regardless of air/naval kill count  
- ALTIUS and ANVIL retaskable to ground strike mode to support ground defense

### Threat Types — PLA Order of Battle
- **DF-17 hypersonic** — Mach 5+, radar +2/tick only, Roadrunner intercept only  
- **DF-21D anti-ship ballistic missile** — targets CSG, countered by SM-3/SM-6  
- **CJ-10 cruise missile** — terrain-hugging, H-6K launched  
- **FPV swarms** — ~$500, NOE kamikaze saturation  
- **CH-4 MALE strike drones** — ~$1–4M, mutual kill on drone collision  
- **TB-001 loitering munitions** — ~$2–5M  
- **J-16 fighters** — ~$70M, ECM + flares, PL-15 BVR  
- **J-20 stealth fighters** — ~$110M, 4 flare sets  
- **Type 071/075 landing ships** — Day 3+, beach landing = base integrity loss  
- **PLAN SAG missile salvos** — YJ-18 ASCMs, HHQ-9 SAMs from surface combatants

**Timeline phases** (CSIS-inspired):  
- **Day 1–2**: 85% missile saturation opening salvo (200× DF-15B, 100× DF-11A, 300× CJ-10, 50× DF-17 HGV, 350× misc SRBM/GLCM)  
- **Day 3+**: Drone & air campaign begins, amphibious assault force launches  
- **Day 7**: CSG arrives from Guam (if Japan basing OFF)

### PLA Strategic AI — Adaptive Threat Evolution
The PLA learns every wave based on what's killing it:

- ALTIUS shredding FPVs → shifts to CH-4 strike drones  
- Roadrunner killing jets → floods with cruise missiles  
- Anvil killing CH-4s → reverts to FPV swarms + DF-17s  
- 2 clean defensive waves → escalates **all vectors** simultaneously  
- **Day 4+**: Feint waves (decoy → real strike 20 seconds later)  
- **Day 3+**: Simultaneous multi-axis attacks from separate spawn directions

### Economy of Force — Full War Cost Tracking

**Live strip** (bottom-left) shows true total war cost per side:  
- **US/Taiwan** = munitions expended + ships lost + aircraft lost  
- **PLA** = munitions expended + air assets destroyed + naval assets destroyed

**Detailed AAR cards** (game-over screen) break down:
- **Spending** — itemized munitions expended per weapon type with unit costs  
- **Losses** — destroyed assets valued per platform (ships, aircraft, drones)  
- **Spending Ratio** — who spent more to fight  
- **Loss Ratio** — who lost more in destroyed asset value  
- **Cost-Per-Kill** — what it cost each side to destroy $1 of enemy assets  
- **Exchange Ratio by Day** — daily trend of defense efficiency

All numbers use the same calculation path — strip totals match card totals exactly.

### Logistics & Reinforcement
- **Hualien strike** — 55% chance Day 1 DF-17 hit → halves F-16V capacity  
- **US resupply** — C-17 arrives automatically Days 3, 6, 9  
- **Daily survival choice** (pick one per day survived):  
  - ⚡ **HIMARS** (manual fire, 3-day cooldown)  
  - ✈ **Carrier Strike** (manual fire, 2-day cooldown)  
  - 📦 **Full Resupply** (all inventories restored)  
  - 💻 **NSA Cyber Strike** (all contacts reset to UNKNOWN, 25 seconds)

### Political Escalation Layer
Real-time political context updates daily:  
- **Japan basing toggle** → changes US reinforcement timeline, enables Japan DDG Squadron  
- Opens northeast PLA attack corridor  
- CSIS: Japan basing is the **single largest variable** in US effectiveness  
(Drawn from CSIS escalation modeling)

### Electronic Warfare
- Simulated adversary jamming  
  - Degrades EO/IR and data links  
  - Nodes fall back to local picture  
  - New contacts invisible to affected units  
  - Auto-tasking goes offline

### Voice Narration
- Web Speech Synthesis narrates key events: carrier strikes, HIMARS launches, day transitions, kill streaks  
- Synced to opening salvo timeline and major combat milestones

---

## Intelligence Reference System
8 tabs inside the simulation:

| Tab              | Content Focus                              |
|------------------|--------------------------------------------|
| ⬡ Lattice System | Core architecture & logic                  |
| 🦅 American Assets | U.S. platforms & capabilities — with hoverable baseball cards (photos, specs, history) for all major assets |
| ☠️ Chinese Assets | PLA platforms & threat profiles — with baseball cards for all PLAN/PLAAF units |
| 💰 Economy of War | Cost & production realities                |
| 🎯 Wargame Ref   | CSIS & CNAS reports                        |
| 🌐 Politics      | Day-by-day escalation ladder               |
| 🎵 Music         | Soundtrack & immersion                     |
| 👤 About         | Project background & credits               |

**Wargame references**:
- CSIS "The First Battle of the Next War" (2023)  
- CSIS "Lights Out" blockade study (July 2025)  
- CSIS "Confronting Armageddon" nuclear dynamics (Dec 2024)  
- CNAS "Dangerous Straits" (2023)

---

## Live Data
- Real **ADS-B aircraft** from OpenSky Network over Taiwan airspace  
- Updated every **30 seconds**
- Real airbase coordinates for PLAAF and US/Allied bases — aircraft animate from actual locations

---

## Technical Stack
- **Rendering** — Mapbox GL JS + satellite imagery + dynamic GeoJSON  
- **Logic** — Vanilla ES6, zero frameworks, 250 ms update loop  
- **UI** — Lattice-style dark slate-blue palette, collapsible panel strips, Force Disposition sidebar with live asset status, CMD command input bar  
- **Audio** — HTML5 + Web Speech Synthesis (voice narration)  
- **Deployment** — GitHub Pages

---

## Who Built This
Field operator and logistician based in **Lancaster, CA** — 10 miles from Edwards AFB and Plant 42.

- CDL Class A manual  
- No formal CS background  
- Built off-grid on solar + Starlink  
- **AI-assisted development** as deliberate workflow — because that's how the job works now

Started as a Lattice demo over the Antelope Valley.  
Couldn't stop building.  
Now it's a **two-sided Taiwan Strait wargame**.

The **2027 China/Taiwan threat timeline is real**.  
It's important to have people who understand both the **physical layers** and **software-defined layers**.

This project is preparation.

Open to connect on:  
defense tech • CUAS • counter intrusion • contested logistics • autonomous systems deployment

— **Chris Nordahl**  
📍 34.8165°N, 118.2000°W → defending 25.0400°N, 121.5120°E

> Built using Anduril's **publicly available information**.  
> Not affiliated with or endorsed by Anduril Industries.
