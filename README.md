# LATTICERUNNER // Autonomous C2 Simulation

**Live Deployment:** (Link Coming Soon)  
**Status:** v21.7 (Stable)

### 1. Project Objective
LATTICERUNNER is a browser-based Command & Control (C2) simulation designed to visualize the logistical and tactical constraints of autonomous interceptor swarms. 

I built this project to bridge the gap between **Field Operations** and **Software Engineering**. As an operator, I wanted to understand the logic that governs "Sensor-to-Shooter" loops and the autonomous behaviors required for high-threat environments where human reaction time is too slow.

### 2. Key Engineering Concepts
While this is a client-side simulation (Thin Client), it models several core concepts of modern Defense Operating Systems:

#### A. Autonomous Logistics FSM (Finite State Machine)
Units are not infinite resources. They are governed by a strict state machine that simulates fuel and munition constraints, requiring them to autonomously make decisions to disengage.
* **Logic:** `ACTIVE` → `RTB` (Low Fuel/Ammo) → `RESUPPLY` (Time penalty) → `ACTIVE`
* **Tactical Relevance:** Simulates the "loiter time" gap that occurs during sustained engagement waves.

#### B. Edge Autonomy ("Panic Launch" Logic)
To simulate operation in degraded communication environments, the system features a fail-safe. If the "Base" (High Value Asset) is undefended and threats are detected, the system overrides standard safety protocols.
* **Implementation:** Assets currently in `RESUPPLY` are forced to scramble immediately, bypassing full refuel procedures to intercept imminent threats.
* **Code Reference:** `if (activeDefenders === 0 && enemyCount > 0) { ...overrideLogistics() }`

#### C. Sensor Fusion & Deconfliction
The simulation models a "Common Operating Picture" (COP) where threat data is shared globally among assets.
* **Sensor-to-Shooter Loop:** Once a target is identified by a ground unit, the "Fury" air support module can engage it from beyond visual range (BVR).
* **Deconfliction:** Missile logic checks global state (`!target.engagedBy`) to prevent multiple assets from wasting munitions on the same target (Munition Efficiency).

### 3. Technical Stack
* **Core Logic:** Vanilla JavaScript (ES6) for high-performance state management without framework overhead.
* **Visualization:** Mapbox GL JS for vector-based geospatial rendering.
* **Audio:** HTML5 Audio API for situational awareness cues.

### 4. About the Author
I am a Field Operator and Logistician based in the High Desert (AVTA). I taught myself to code to better understand the systems I aim to deploy. 

I believe that for autonomous systems to scale effectively, we need operators who understand both the **hardware limitations** in the field and the **software logic** running on the edge.

* **Mission Aligned:** Focused on rapid capability scaling for the 2027 timeline.
* **Availability:** Ready to deploy immediately.

---
*Note: This is a conceptual prototype running client-side. Real-world implementation would require server-side sensor fusion and encrypted data links.*
