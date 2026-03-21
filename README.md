# 🛡️ LATTICERUNNER 21.12  
**Autonomous C2 Defense Simulation**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Open%20Simulation-blue?style=for-the-badge&logo=github)](https://lattice-runner.github.io/LATTICERUNNER-C2-Sim/)  
[![GitHub repo](https://img.shields.io/badge/Repo-GitHub-black?style=for-the-badge&logo=github)](https://github.com/Lattice-Runner/LATTICERUNNER-C2-Sim)

A **real-time browser-based simulation** of Anduril's Lattice platform — modeling **sensor fusion**, **autonomous drone tasking**, and **layered area denial** over live satellite imagery of the Antelope Valley.

This is **not** a tech demo or abstract game.  
It is a working model of the coordination layer that will define the next fight.

## What's Running

### Sensor Fusion — 4 active layers per tick
- **Radar** → +5 confidence/tick, full spawn envelope  
- **XRST tower network** → +15 confidence/tick (4 towers)  
- **EO/IR drone camera cones** → +35 inside cone, +15 ambient  
- **Acoustic/seismic ground detection** → +20 (low-altitude only)

Contacts evolve:  
**UNKNOWN** → **SUSPECT** → **HOSTILE**  
Engagement authorized at **≥80 confidence**.

### Autonomous Squadrons
- **ALTIUS** — 15 anti-UAS attritable drones (20% held in close-in reserve)  
- **ANVIL** — 8 heavier attrition interceptors (fallback anti-FPV when ALTIUS saturated)  
- **ROADRUNNER** — 2 precision turbojet interceptors (jets & missiles only)  
- **FURY** — 2 autonomous CAS jets (depart Edwards AFB, egress when ammo expended)

### Effector Suite
- **EMP interdiction** — kill zone + outer disruption ring (friendly collateral modeled)  
- **CLG directed energy grid** — thermal-limited, 8 kills per activation  
- **TTU mesh uplink boost**  
- **ORS orbital ISR scan** — restores XRST towers, 20% base integrity repair

### Threat Types (modeled PLA order of battle)
- FPV swarms (~$500, NOE kamikaze saturation)  
- CH-4 MALE strike drones (~$1–4M)  
- TB-001 loitering munitions (~$2–5M)  
- J-16 fighters (~$70M, ECM + flares)  
- J-20 stealth fighters (~$110M, 4 flare sets, higher speed)  
- PL-15 AGM missiles (~$1M, Mach 4+)

### Electronic Warfare
- Simulated adversary jamming  
  - Degrades EO/IR and data links  
  - Nodes fall back to local picture  
  - New contacts invisible to jammed squads  
  - Auto-tasking goes offline

## Intelligence Reference System
7 tabs inside the sim:

| Tab                  | Content Focus                              |
|----------------------|--------------------------------------------|
| Lattice System       | Core architecture & logic                  |
| 🦅 American Assets   | U.S. platforms & capabilities              |
| ☠️ Chinese Assets    | PLA platforms & threat profiles            |
| Economy of War       | Cost & production realities                |
| Wargame Ref          | CSIS & CNAS reports (see below)            |
| Music                | Soundtrack & immersion                     |
| About                | Project background & credits               |

**Wargame references** drawn from:  
- CSIS "The First Battle of the Next War" (2023)  
- CSIS "Lights Out" blockade study (2025)  
- CSIS "Confronting Armageddon" nuclear dynamics (2024)  
- CNAS "Dangerous Straits" (2023)

## Live Data
- Real **ADS-B aircraft** from OpenSky Network  
- Updated every **30 seconds** over Edwards AFB airspace

## Technical Stack
- **Rendering** — Mapbox GL JS + satellite imagery + dynamic GeoJSON  
- **Logic** — Vanilla ES6, zero frameworks, 250 ms update loop  
- **Build** — Python split script → modular JS for GitHub Pages  
- **Audio** — HTML5 + Web Speech Synthesis  
- **Deployment** — GitHub Pages + Dropbox CDN (audio)

## Who Built This
Field operator and logistician based in **Lancaster, CA** — right next to Edwards AFB and Plant 42.  
- CDL Class A  
- No formal CS background  
- Built off-grid on solar + Starlink  
- Used **AI-assisted development** as deliberate workflow

The **2027 China/Taiwan threat timeline is real**.  
It's important to have people who understand both the **physical layers** and **software-defined layers**.

This project is preparation.

Open to connect on:  
defense tech • CUAS • counter intrusion • contested logistics • autonomous systems deployment

— **Chris Nordahl**  
📍 34.8165°N, 118.2000°W

> Built using Anduril's **publicly available information**.  
> Not affiliated with or endorsed by Anduril Industries.
