🛡️ LATTICERUNNER // Autonomous C2 Simulation
Live Demo: https://lattice-runner.github.io/LATTICERUNNER-C2-Sim/

1. Project Objective
LATTICERUNNER is a modular Command & Control (C2) simulation designed to visualize the technical and logistical constraints of Distributed Sensor-to-Shooter Networks.

I built this project to bridge the gap between Field Operations and Edge Software Engineering. It models the autonomous coordination required for high-threat environments where human reaction time is the bottleneck.

2. Advanced Engineering Concepts
A. Modular C2 Architecture
The project has been refactored from a monolithic prototype into a modular system. This mirrors real-world defense software by isolating core logic into specialized domains:

Sensor Mesh (map.js): Manages the Common Operating Picture (COP).

Effector Logic (units.js): Governs autonomous interceptor behaviors.

State Pipeline (update.js): A high-frequency loop for real-time telemetry.

Build Automation (build.py): A Python-based pipeline to synchronize global state across modules.

B. XRST Sensor Fusion & IFF
The simulation features a persistent Extended Range Sentry Tower (XRST) network.

Autonomous Classification: Threats are identified through a tiered pipeline (UNKNOWN → SUSPECT → HOSTILE) based on XRST proximity.

System Resilience: If an XRST tower is physically breached, it goes offline, creating "Sensor Blind Spots" that require an ORS (Orbital Reconnaissance) pass to restore.

C. 3D Airspace Deconfliction & NOE Flight
The simulation handles heterogeneous threats with unique 3D profiles:

Nap-of-the-earth (NOE): FPV swarms maintain low-altitude (20m) profiles to utilize terrain masking.

Kinetic Intercept Envelopes: Roadrunner interceptors only engage within a specific altitude "slice" (ALT_MISSILE_ENVELOPE), simulating the physical limitations of surface-to-air effectors.

Countermeasures: High-value threats like the J-20 strike package utilize flares to break autonomous locks, forcing the C2 mesh to re-acquire the track.

3. Technical Stack
Visuals: Mapbox GL JS (Geospatial vector rendering).

Logic: Vanilla ES6 JavaScript (High-performance, framework-free state management).

DevOps: Python 3 (Modular build and extraction pipeline).

Audio: HTML5 Audio API (Situational awareness and killstreak feedback).

4. Mission Alignment
I am a Field Operator and Logistician based in the High Desert (Lancaster, CA). I hold a CDL Class A and have extensive experience in austere environments. I taught myself to code because I believe the future of defense depends on operators who can both climb a tower to fix a sensor and SSH into the box to debug the kernel.

Timeline: Focused on rapid capability scaling for the 2027 mission window.

Status: Ready to deploy immediately.
*Note: This is a conceptual prototype running client-side. Real-world implementation would require server-side sensor fusion and encrypted data links.*
