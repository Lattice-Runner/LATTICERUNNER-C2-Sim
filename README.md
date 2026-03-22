# 🛡️ LATTICERUNNER 22.0  
**Autonomous C2 Defense Simulation — Anduril Lattice Platform**  
**Taiwan Strait Contingency Edition**

[![Live Demo v22.0 Taiwan Strait](https://img.shields.io/badge/Live%20Demo-v22.0%20Taiwan%20Strait-blue?style=for-the-badge&logo=github)](https://lattice-runner.github.io/LATTICERUNNER-C2-Sim/)  
 **Note: Live page currently shows v22.0 Taiwan Strait simulation (title may display 21.11 internally). Earlier Antelope Valley version available on request if needed.**

A **real-time, browser-based, two-sided simulation** of Anduril's Lattice platform — now modeling a full Taiwan Strait contingency with **adaptive PLA AI**, **finite inventories**, **US reinforcement timelines**, and escalation drawn from unclassified CSIS & CNAS wargames.

This is **not** a tech demo or abstract game.  
It is a working model of the coordination layer that will define the next fight — rebuilt from the Mojave Desert to the Taiwan Strait because the threat is real and the timeline is **2027**.

## What's Running

### Sensor Fusion — 4 active layers per tick
- **Radar** → +5 confidence/tick, full spawn envelope  
- **XRST tower network** → +15 confidence/tick (4 towers on real Taiwan terrain: Yangmingshan, Keelung, Taoyuan, Danshui)  
- **EO/IR drone camera cones** → +35 inside cone, +15 ambient  
- **Acoustic/seismic ground detection** → +20 (low-altitude only)

Contacts evolve: **UNKNOWN** → **SUSPECT** → **HOSTILE**  
Engagement authorized at **≥80 confidence**.

### Autonomous & Manned Squadrons (Finite Inventories — You Run Out)
- **ALTIUS** — 45 anti-UAS attritable drones (20% held in close-in reserve)  
- **ANVIL** — 24 heavier attrition interceptors  
- **ROADRUNNER** — 8 precision turbojet interceptors (jets, missiles, DF-17 hypersonic only)  
- **F-16V** — 12 sorties departing Hualien Air Base (east coast hardened site)

### Effector Suite
- **EMP interdiction** — kill zone + outer disruption ring (friendly collateral modeled)  
- **CLG directed energy grid** — thermal-limited, 8 kills per activation  
- **TTU mesh uplink boost**  
- **ORS orbital ISR scan** — restores XRST towers, 20% base integrity repair  
- **HIMARS** — manual-fire precision salvo, cascading impact visual, **3-day cooldown**  
- **Carrier Strike** — USS Ronald Reagan F/A-18 package, 20-second inbound delay, full battlefield effect

### Threat Types — PLA Order of Battle
- **DF-17 hypersonic** — Mach 5+, radar +2/tick only, Roadrunner intercept only  
- **CJ-10 cruise missile** — terrain-hugging, H-6K launched  
- **FPV swarms** — ~$500, NOE kamikaze saturation  
- **CH-4 MALE strike drones** — ~$1–4M, mutual kill on drone collision  
- **TB-001 loitering munitions** — ~$2–5M  
- **J-16 fighters** — ~$70M, ECM + flares  
- **J-20 stealth fighters** — ~$110M, 4 flare sets  
- **Type 071/075 landing ships** — Day 3+, beach landing = base integrity loss

**Timeline phases** (CSIS-inspired):  
- **Day 1–2**: 85% missile saturation opening salvo  
- **Day 3+**: Drone & air campaign begins

### PLA Strategic AI — Adaptive Threat Evolution
The PLA learns every wave based on what’s killing it:

- ALTIUS shredding FPVs → shifts to CH-4 strike drones  
- Roadrunner killing jets → floods with cruise missiles  
- Anvil killing CH-4s → reverts to FPV swarms + DF-17s  
- 2 clean defensive waves → escalates **all vectors** simultaneously  
- **Day 4+**: Feint waves (decoy → real strike 20 seconds later)  
- **Day 3+**: Simultaneous multi-axis attacks from separate spawn directions

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
- **Japan basing toggle** → changes US reinforcement timeline  
- Opens northeast PLA attack corridor  
(Drawn from CSIS escalation modeling)

### Electronic Warfare
- Simulated adversary jamming  
  - Degrades EO/IR and data links  
  - Nodes fall back to local picture  
  - New contacts invisible to affected units  
  - Auto-tasking goes offline

## Intelligence Reference System
8 tabs inside the simulation:

| Tab              | Content Focus                              |
|------------------|--------------------------------------------|
| ⬡ Lattice System | Core architecture & logic                  |
| 🦅 American Assets | U.S. platforms & capabilities              |
| ☠️ Chinese Assets | PLA platforms & threat profiles            |
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

## Live Data
- Real **ADS-B aircraft** from OpenSky Network over Taiwan airspace  
- Updated every **30 seconds**

## Technical Stack
- **Rendering** — Mapbox GL JS + satellite imagery + dynamic GeoJSON  
- **Logic** — Vanilla ES6, zero frameworks, 250 ms update loop  
- **Build** — Python split script → modular JS for GitHub Pages  
- **Audio** — HTML5 + Web Speech Synthesis  
- **Deployment** — GitHub Pages

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
It's important to have people who understand both the **physical layers** and **software-defined layers**. .

This project is preparation.

Open to connect on:  
defense tech • CUAS • counter intrusion • contested logistics • autonomous systems deployment

— **Chris Nordahl**  
📍 34.8165°N, 118.2000°W → defending 25.0400°N, 121.5120°E

> Built using Anduril's **publicly available information**.  
> Not affiliated with or endorsed by Anduril Industries.
