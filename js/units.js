// ============================================================
// units.js — init, wave spawning, weapons, drone launches
// ============================================================



    function init() {
        document.getElementById('gameOverScreen').style.display = 'none';

        // Clear all timers to prevent ghost stacking
        if (waveTimer)             { clearTimeout(waveTimer);             waveTimer = null; }
        if (telemetryInterval)     { clearInterval(telemetryInterval);    telemetryInterval = null; }
        if (resumeInterval)        { clearInterval(resumeInterval);       resumeInterval = null; }
        if (recommendationInterval){ clearInterval(recommendationInterval); recommendationInterval = null; }

        friends     = JSON.parse(JSON.stringify(friendInit));
        enemies     = [];
        projectiles = [];
        explosions  = [];
        publicContacts = [];

        nextId           = 111;
        waveNumber       = 1;
        dayNumber        = 1;
        dayElapsed       = 0;
        carrierGroupArrived = false;
        b21StrikeAvailable  = false;
        supportModalShown   = false;
        cyberStrikeActive   = false;
        cyberStrikeUntil    = 0;
        enemyAmphibious     = [];
        friendlyPatrols     = [];
        amphibiousReady     = true;
        hualienDegraded     = false;
        lastDayBannerDay    = 0;
        dayStartTs          = Date.now();  // start counting from game init
        nextEventTs         = 0;
        nextEventDelaySaved = 0;
        himarsArmed         = false;
        himarsLastUsedDay   = -99;
        carrierArmed        = false;
        carrierLastUsedDay  = -99;
        resupplyDelivered   = [];
        INVENTORY.altius.remaining     = INVENTORY.altius.total;
        INVENTORY.anvil.remaining      = INVENTORY.anvil.total;
        INVENTORY.roadrunner.remaining = INVENTORY.roadrunner.total;
        INVENTORY.f16v.remaining       = INVENTORY.f16v.total;
        INVENTORY.himars.remaining     = INVENTORY.himars.total;
        plaMemory.rrKillsVsJets = 0; plaMemory.rrKillsVsMissiles = 0;
        plaMemory.altiusKillsFPV = 0; plaMemory.anvilKillsCH4 = 0;
        plaMemory.empKills = 0; plaMemory.clgKills = 0;
        plaMemory.baseHitsThisWave = 0; plaMemory.consecutiveFailWaves = 0;
        plaMemory.feintActive = false;
        plaMemory.weights = { df17:1.0, cj10:1.0, fpv:1.0, ch4:1.0, tb001:1.0, jet:1.0 };
        totalKills       = 0;
        roadrunnerLosses = 0;
        baseHealth       = 5;
        highestStreak    = 0;
        sessionHighStreak = 0;

        lastStreakSpokenTs  = 0;
        lastKillFeedLogTs   = 0;
        lastTelemetryLogTs  = 0;
        lastAllClearVoiceTs = 0;

        empReady       = true;
        empLastFiredTs = 0;

        clgStatus   = 'READY';
        clgTargetTs = 0;
        clgHeat     = 0;
        clgKillsThisActivation = 0;

        ttuReady       = true;
        ttuActive      = false;
        ttuLastFiredTs = 0;

        orsReady        = true;
        orsLastFiredTs  = 0;
        orsDisruptionTs = 0;

        furyReady       = true;
        furyLastFiredTs = 0;
        furySquad       = [];
        furyMissiles    = [];

        // Restore all XRST towers to online on reset
        xrstTowers.forEach(tower => { tower.online = true; });

        // Reset drone squads and jets
        altiusSquad  = [];
        anvilSquad   = [];
        rrSquad      = [];
        enemyJets    = [];
        jetMissiles  = [];
        jetFlares    = [];
        adsbAircraft = [];
        adsbLastFetch = 0;

        altiusReady    = true;
        altiusLastTs   = 0;
        anvilReady     = true;
        anvilLastTs    = 0;
        rrDeployReady  = true;
        rrDeployLastTs = 0;

        document.getElementById('altiusBtn').disabled   = true;
        document.getElementById('anvilBtn').disabled    = true;
        document.getElementById('rrDeployBtn').disabled = true;
        document.getElementById('altiusStatus').innerHTML   = 'ALTIUS: <span style="color:#666;">INACTIVE</span>';
        document.getElementById('anvilStatus').innerHTML    = 'ANVIL: <span style="color:#666;">INACTIVE</span>';
        document.getElementById('rrDeployStatus').innerHTML = 'RR DEPLOY: <span style="color:#666;">INACTIVE</span>';

        isJammed = false;
        autoMode           = false;
        autoLastAssignTs   = 0;
        localPictureAltius = [];
        localPictureAnvil  = [];
        localPictureRR     = [];
        jammingStartTs     = 0;
        const autoBtn = document.getElementById('autoBtn');
        if (autoBtn) { autoBtn.textContent = 'AUTO-TASKING: OFF'; autoBtn.style.background = 'rgba(0,255,170,0.1)'; }
        document.body.classList.remove('jammed-fx');
        document.getElementById('jamOverlay').style.display = 'none';
        document.getElementById('jamBtn').classList.remove('active');
        document.getElementById('jamBtn').textContent = 'SIMULATE JAMMING';

        document.getElementById('np-artist').textContent = 'System Offline';
        document.getElementById('np-track').textContent  = 'Awaiting Input...';
        document.getElementById('esysStatus').innerHTML  = 'E-System: <span style="color:#666;">INACTIVE</span>';
        document.getElementById('clgStatus').innerHTML   = 'CLG: <span style="color:#666;">INACTIVE</span>';
        document.getElementById('ttuStatus').innerHTML   = 'TTU: <span style="color:#666;">INACTIVE</span>';
        document.getElementById('orsStatus').innerHTML   = 'ORS: <span style="color:#666;">INACTIVE</span>';
        document.getElementById('furyStatus').innerHTML  = 'Air Support: <span style="color:#666;">INACTIVE</span>';

        document.getElementById('recommendationText').textContent = 'SYSTEM OFFLINE.';
        document.getElementById('pauseBtn').textContent = 'START SYSTEM';
        document.getElementById('ttuBtn').textContent   = 'TTU LINK';
        document.getElementById('clgBtn').textContent   = 'CLG GRID';

        updateStatsBar();
        refresh();
    }

    // ============================================================
    // JAMMING TOGGLE
    // ============================================================
    function toggleJamming() {
        if (!playing) return;
        isJammed = !isJammed;
        const btn     = document.getElementById('jamBtn');
        const overlay = document.getElementById('jamOverlay');
        const body    = document.body;
        if (isJammed) {
            jammingStartTs = Date.now();
            btn.textContent = 'LINK COMPROMISED';
            btn.classList.add('active');
            overlay.style.display = 'block';
            body.classList.add('jammed-fx');

            // Snapshot local picture for each squad — they can only see
            // enemies identified BEFORE jamming started
            const identifiedNow = enemies.filter(e => e.alive && e.identified).map(e => e.id);
            localPictureAltius = [...identifiedNow];
            localPictureAnvil  = [...identifiedNow];
            localPictureRR     = [...identifiedNow];

            // Auto-tasking goes offline — squads act independently
            if (autoMode) {
                addKill('<span style="color:#f00;font-weight:bold;">[AUTO]</span> Auto-tasking OFFLINE — comms denied. Squads operating independently.');
            }

            speak("Warning. Electronic Counter Measures detected. Spectrum denied. Nodes autonomous.", 2);
            addKill('<span style="color:#f00;font-weight:bold;">ALERT:</span> SPECTRUM DENIAL. DEGRADED COMMS MODE ACTIVE.');
        } else {
            jammingStartTs = 0;
            localPictureAltius = [];
            localPictureAnvil  = [];
            localPictureRR     = [];
            btn.textContent = 'SIMULATE JAMMING';
            btn.classList.remove('active');
            overlay.style.display = 'none';
            body.classList.remove('jammed-fx');
            speak("Spectrum clear. Link restored. Auto-tasking nominal.", 1);
            addKill('<span style="color:#0f0;font-weight:bold;">SYSTEM:</span> SPECTRUM RESTORED. FULL MESH SYNC.');
        }
    }

    // ============================================================
    // SPAWN WAVE — Chinese threat hierarchy
    // Wave composition escalates realistically:
    //   Early  — FPV swarms (PACKET) and CH-4 strike drones (TRACK)
    //   Mid    — Adds TB-001 loiterers and larger swarm packets
    //   Late   — WZ-7 ISR drone (LOITERER type, high alt, disrupts XRST)
    //            + J-16/J-20 fighter jets spawn separately via spawnJet()
    // ============================================================
    function spawnWave() {
        if (!playing) return;
        isRegrouping = false;

        // Drones are always ACTIVE — no RTB state to clear

        const baseCount  = Math.floor(Math.random() * 8) + 7;
        // Escalation plateaus at wave 18 — threat count stabilizes rather than
        // growing unboundedly. Beyond wave 18 difficulty comes from composition
        // (more jets, more loiterers) not raw enemy count.
        const cappedWave = Math.min(waveNumber - 1, 7);
        const escalation = cappedWave * ENEMY_INCREASE_PER_WAVE;
        const total      = baseCount + escalation;
        // Also cap threat type probabilities so composition stabilizes
        // ── PLA ADAPTIVE AI — update weights based on last wave performance ──
        // After each wave PLA shifts composition away from what's being defeated
        // and doubles down on what's getting through
        if (waveNumber > 1) {
            // If Altius killed many FPVs → reduce FPV, increase CH-4
            if (plaMemory.altiusKillsFPV >= 3) {
                plaMemory.weights.fpv  = Math.max(0.2, plaMemory.weights.fpv  - 0.25);
                plaMemory.weights.ch4  = Math.min(2.5, plaMemory.weights.ch4  + 0.20);
                addKill('<span style="color:#ff4444;">[PLA AI]</span> Reducing FPV saturation — shifting to CH-4 strike drones.');
            }
            // If Anvil killed many CH-4s → shift to FPV swarms or DF-17s
            if (plaMemory.anvilKillsCH4 >= 2) {
                plaMemory.weights.ch4  = Math.max(0.2, plaMemory.weights.ch4  - 0.30);
                plaMemory.weights.fpv  = Math.min(2.5, plaMemory.weights.fpv  + 0.15);
                plaMemory.weights.df17 = Math.min(2.0, plaMemory.weights.df17 + 0.15);
                addKill('<span style="color:#ff4444;">[PLA AI]</span> CH-4 losses high — adjusting to FPV swarms and hypersonic.');
            }
            // If RR killed jets → send fewer jets, more cruise missiles
            if (plaMemory.rrKillsVsJets >= 1) {
                plaMemory.weights.jet  = Math.max(0.1, plaMemory.weights.jet  - 0.30);
                plaMemory.weights.cj10 = Math.min(2.5, plaMemory.weights.cj10 + 0.25);
                addKill('<span style="color:#ff4444;">[PLA AI]</span> Roadrunner threat neutralizing jets — switching to cruise missiles.');
            }
            // If EMP killed cluster → spread spawn points (handled in spawn loop)
            if (plaMemory.empKills >= 4) {
                plaMemory.lastWaveSpread = true;
                addKill('<span style="color:#ff4444;">[PLA AI]</span> EMP effectiveness noted — dispersing formation.');
            }
            // Consecutive fail waves → escalate everything
            if (plaMemory.consecutiveFailWaves >= 2) {
                Object.keys(plaMemory.weights).forEach(k => {
                    plaMemory.weights[k] = Math.min(3.0, plaMemory.weights[k] + 0.30);
                });
                plaMemory.consecutiveFailWaves = 0;
                addKill('<span style="color:#ff4444;">[PLA AI]</span> Defensive lines holding — escalating all vectors.');
            }
            // Reset wave tracking
            plaMemory.altiusKillsFPV = 0; plaMemory.anvilKillsCH4 = 0;
            plaMemory.rrKillsVsJets = 0; plaMemory.rrKillsVsMissiles = 0;
            plaMemory.empKills = 0; plaMemory.clgKills = 0;
            plaMemory.baseHitsThisWave = 0;
        }

        // Base probabilities scaled by AI weights
        const w = plaMemory.weights;
        const baseSum = w.df17 + w.cj10 + w.fpv + w.ch4 + w.tb001;
        const df17Prob = dayNumber <= 2 ? 0.50 * w.df17 : Math.max(0.05, (0.20 * w.df17) / baseSum);
        const cj10Prob = dayNumber <= 2 ? 0.35 * w.cj10 : Math.max(0.05, (0.18 * w.cj10) / baseSum);
        const pProb    = Math.min(0.60, (0.22 + waveNumber * 0.025) * w.fpv);
        const lProb    = Math.min(0.30, (0.08 + waveNumber * 0.012) * w.tb001);

        let fpv       = 0;
        let loiterers = 0;
        let ch4       = 0;
        let df17s     = 0;
        let cj10s     = 0;

        for (let i = 0; i < total; i++) {
            let type  = 'CH-4';
            const r   = Math.random();

            if (r < df17Prob) {
                type = 'DF-17';
                df17s++;
            } else if (r < df17Prob + cj10Prob) {
                type = 'CJ-10';
                cj10s++;
            } else if (waveNumber >= 3 && r < df17Prob + cj10Prob + pProb * (1 - df17Prob - cj10Prob)) {
                type = 'FPV';
                fpv++;
            } else if (waveNumber >= 5 && r < df17Prob + cj10Prob + pProb + lProb * 0.3) {
                type = 'TB-001';
                loiterers++;
            } else {
                ch4++;
            }

            const isP   = type === 'FPV';
            const isL   = type === 'TB-001';
            const isDF17 = type === 'DF-17';
            const isCJ10 = type === 'CJ-10';
            const speed = isP ? 0.0013 : isL ? 0.0003 : isDF17 ? DF17_SPEED : isCJ10 ? CJ10_SPEED : 0.0008;
            // Spawn outside XRST detection envelope so towers actually catch them inbound.
            // XRST towers sit at 0.14 from base with 0.18 detection range = 0.32 max reach.
            // Taiwan: directional spawning — primarily from west (Taiwan Strait)
            // 60% from west, 25% from north, 15% from southeast
            const spawnRoll = Math.random();
            let spawnLat, spawnLng;
            if (spawnRoll < 0.60) {
                // West — Fujian coast approach across the strait
                spawnLng = base.lng - (0.55 + Math.random() * 0.15);
                spawnLat = base.lat + (Math.random() - 0.5) * 0.60;
            } else if (spawnRoll < 0.85) {
                // North — from Zhoushan/mainland north
                spawnLat = base.lat + 0.55 + Math.random() * 0.15;
                spawnLng = base.lng + (Math.random() - 0.5) * 0.50;
            } else {
                // Southeast — PLAN carrier group
                spawnLat = base.lat - 0.55 - Math.random() * 0.15;
                spawnLng = base.lng + 0.35 + Math.random() * 0.20;
            }
            const d = Math.hypot(spawnLng - base.lng, spawnLat - base.lat); // kept for compat

            // Altitude by Chinese threat type:
            //   FPV swarms    — nap-of-earth: 20–150m
            //   TB-001        — high loiter orbit: 800–4000m
            //   CH-4 strike   — medium ingress: 200–2500m
            //   DF-17         — hypersonic glide terminal: 25,000–35,000m
            //   CJ-10         — terrain-hugging cruise: 50–150m
            let alt;
            if (isP)        alt = Math.floor(20    + Math.random() * 130);
            else if (isL)   alt = Math.floor(800   + Math.random() * 3200);
            else if (isDF17)alt = Math.floor(25000 + Math.random() * 10000);
            else if (isCJ10)alt = Math.floor(50    + Math.random() * 100);
            else            alt = Math.floor(200   + Math.random() * 2300);

            enemies.push({
                id: nextId++,
                lat: spawnLat,
                lng: spawnLng,
                speed,
                alive: true,
                identified: false,
                confidence: 0,        // 0-100 track confidence
                firstSeenTs: 0,       // timestamp when first detected by any sensor
                engagedBy: undefined,
                isEngagementCounted: false,
                isKillStreakProcessed: false,
                isSwarmUnit:     isP,
                isLoitererUnit:  isL,
                isHypersonic:    isDF17,
                isCruiseMissile: isCJ10,
                type,
                alt
            });
        }

        // Spawn a fighter jet on wave JET_SPAWN_WAVE and every 3 waves after
        if (waveNumber >= JET_SPAWN_WAVE && (waveNumber - JET_SPAWN_WAVE) % 3 === 0) {
            spawnJet();
        }

        let summary = `${total} threats`;
        if (df17s     > 0) summary += ` (<span style="color:#ff00ff;">DF-17: ${df17s}</span>)`;
        if (cj10s     > 0) summary += ` (<span style="color:#ff8800;">CJ-10: ${cj10s}</span>)`;
        if (fpv       > 0) summary += ` (<span style="color:#ffcc00;">FPV: ${fpv}</span>)`;
        if (loiterers > 0) summary += ` (<span style="color:#00ff77;">TB-001: ${loiterers}</span>)`;
        if (ch4       > 0) summary += ` (<span style="color:#f00;">CH-4: ${ch4}</span>)`;

        const missileAlert = (df17s > 0 || cj10s > 0)
            ? `${df17s > 0 ? 'HYPERSONIC BALLISTIC INBOUND. ' : ''}${cj10s > 0 ? 'CRUISE MISSILES DETECTED. ' : ''}`
            : '';
        // Only announce day number on first event of each day
        const isFirstEventOfDay = dayElapsed < 35000;
        const dayAnnounce = (dayNumber === 1 && waveNumber === 1)
            ? 'Day one. PLA Eastern Theater Command has initiated strike operations. Ballistic and cruise missiles inbound. All systems engage.'
            : isFirstEventOfDay
            ? `Day ${dayNumber}. ${missileAlert}${total} contacts. Identify and engage.`
            : `${missileAlert}${total} contacts inbound. Engage.`;
        const voice = dayAnnounce;

        // ── HUALIEN STRIKE — Day 1 Wave 1 only ────────────────────
        // PLA doctrine: hit airfields in the opening salvo
        // If a DF-17 gets through on day 1 wave 1, Hualien is degraded
        if (dayNumber === 1 && waveNumber === 1 && !hualienDegraded) {
            setTimeout(() => {
                if (!hualienDegraded && df17s > 0) {
                    // Simulate one DF-17 getting through to Hualien
                    const hitsHualien = Math.random() < 0.55; // 55% chance day 1
                    if (hitsHualien) {
                        hualienDegraded = true;
                        INVENTORY.f16v.remaining = Math.floor(INVENTORY.f16v.remaining / 2);
                        addKill(`<span style="color:#ff4444;font-weight:bold;">⚠ HUALIEN STRIKE:</span> DF-17 impact on Hualien Air Base. F-16V sorties halved — ${INVENTORY.f16v.remaining} remaining.`);
                        speak('Hualien Air Base struck. F-16V capacity degraded.', 2);
                    }
                }
            }, 8000);
        }

        // ── FEINT SYSTEM — Day 4+ PLA sends decoy wave then real strike ──
        const feintChance = dayNumber >= 4 ? 0.30 : 0;
        if (!plaMemory.feintActive && Math.random() < feintChance) {
            plaMemory.feintActive  = true;
            plaMemory.feintWaveNum = waveNumber;
            // Override: spawn small decoy wave (4-6 contacts, mostly FPV)
            const decoyCount = 4 + Math.floor(Math.random() * 3);
            for (let i = 0; i < decoyCount; i++) {
                const spawnRoll = Math.random();
                let sLat, sLng;
                if (spawnRoll < 0.60) { sLng = base.lng - (0.55 + Math.random() * 0.15); sLat = base.lat + (Math.random()-0.5)*0.60; }
                else { sLat = base.lat + 0.55 + Math.random()*0.15; sLng = base.lng + (Math.random()-0.5)*0.50; }
                enemies.push({ id: nextId++, lat: sLat, lng: sLng, speed: 0.0013, alive: true,
                    identified: false, confidence: 0, firstSeenTs: 0, engagedBy: undefined,
                    isKillStreakProcessed: false, isSwarmUnit: true, isLoitererUnit: false,
                    isHypersonic: false, isCruiseMissile: false, type: 'FPV',
                    alt: Math.floor(20 + Math.random()*130) });
            }
            addKill(`<span style="color:#ff4444;font-weight:bold;">[PLA AI] FEINT DETECTED:</span> Small probe wave — ${decoyCount} FPV contacts. Real strike imminent.`);
            // Schedule real strike 20 seconds after feint
            setTimeout(() => {
                plaMemory.feintActive = false;
                if (playing) spawnWave();
            }, 20000);
        }

        // ── MULTI-AXIS — Day 3+ split spawn from two directions simultaneously ──
        if (dayNumber >= 3 && Math.random() < 0.35 && !plaMemory.lastWaveSpread) {
            // Already spawned from one direction above — spawn a second axis group
            const axis2Count = Math.floor(total * 0.40);
            for (let i = 0; i < axis2Count; i++) {
                // Always from opposite axis — if main was west, second is northeast
                const sLat = base.lat + 0.55 + (Math.random()-0.5)*0.30;
                const sLng = base.lng + 0.40 + Math.random()*0.20;
                const axisType = Math.random() < 0.5 ? 'FPV' : 'CH-4';
                enemies.push({ id: nextId++, lat: sLat, lng: sLng,
                    speed: axisType === 'FPV' ? 0.0013 : 0.0008, alive: true,
                    identified: false, confidence: 0, firstSeenTs: 0, engagedBy: undefined,
                    isKillStreakProcessed: false, isSwarmUnit: axisType === 'FPV',
                    isLoitererUnit: false, isHypersonic: false, isCruiseMissile: false,
                    type: axisType, alt: Math.floor(axisType === 'FPV' ? 20+Math.random()*130 : 200+Math.random()*2300) });
            }
            addKill(`<span style="color:#ff4444;font-weight:bold;">[PLA AI] MULTI-AXIS:</span> Second attack vector from northeast — ${axis2Count} additional contacts.`);
            plaMemory.lastWaveSpread = false;
        }

        addKill(`<span style="color:#f00;">⚠ INCOMING STRIKE — DAY ${dayNumber} — ${summary}</span>`);
        if (!isTelemetryActive && !ttuActive) speak(voice, 1);

        document.getElementById('wn').textContent = dayNumber;
        waveNumber++;
        document.getElementById('wave').classList.add('active');
        setTimeout(() => document.getElementById('wave').classList.remove('active'), 3000);

        if (waveTimer) clearTimeout(waveTimer);

        // Threat events occur every 30-45s within a day
        // Day advances after DAY_DURATION_MS
        // Day 1 events come faster — no lull at the start
        const nextEventDelay = dayNumber === 1
            ? 40000 + Math.random() * 10000  // 40-50s on Day 1
            : 45000 + Math.random() * 15000; // 45-60s Day 2+
        nextEventTs = Date.now() + nextEventDelay;
        nextEventDelaySaved = nextEventDelay;
        waveTimer = setTimeout(() => {
            dayElapsed += nextEventDelay;
            // Also check real wall clock in case dayElapsed chunks haven't caught up
            const realElapsedCheck = dayStartTs > 0 ? Date.now() - dayStartTs : dayElapsed;
            if (dayElapsed >= DAY_DURATION_MS || realElapsedCheck >= DAY_DURATION_MS) {
                dayElapsed = 0;
                dayStartTs = Date.now(); // reset for new day
                dayNumber++;
                // Guard — only show banner once per day
                dayStartTs = Date.now();
                if (lastDayBannerDay !== dayNumber) {
                    lastDayBannerDay = dayNumber;
                    const timeOfDay = ['Dawn', 'Morning', 'Midday', 'Afternoon', 'Dusk', 'Night'][Math.floor(Math.random() * 6)];
                    addKill(`<span style="color:#00ffff;font-weight:bold;">═══ DAY ${dayNumber} — ${timeOfDay.toUpperCase()} ═══</span> PLA operations continue.`);
                    speak(`Day ${dayNumber}. ${timeOfDay}. PLA operations continuing.`, 1);
                    document.getElementById('wn').textContent = dayNumber;
                }

                // ── US RESUPPLY — C-17 arrives Day 3, 6, 9 ──────────────────
                if (RESUPPLY_DAYS.includes(dayNumber) && !resupplyDelivered.includes(dayNumber)) {
                    resupplyDelivered.push(dayNumber);
                    const resupplyAmt = { altius: 20, anvil: 10, roadrunner: 3, f16v: 4, himars: 2 };
                    INVENTORY.altius.remaining     = Math.min(INVENTORY.altius.total,     INVENTORY.altius.remaining     + resupplyAmt.altius);
                    INVENTORY.anvil.remaining      = Math.min(INVENTORY.anvil.total,      INVENTORY.anvil.remaining      + resupplyAmt.anvil);
                    INVENTORY.roadrunner.remaining = Math.min(INVENTORY.roadrunner.total, INVENTORY.roadrunner.remaining + resupplyAmt.roadrunner);
                    INVENTORY.f16v.remaining       = Math.min(INVENTORY.f16v.total,       INVENTORY.f16v.remaining       + resupplyAmt.f16v);
                    INVENTORY.himars.remaining     = Math.min(INVENTORY.himars.total,     INVENTORY.himars.remaining     + resupplyAmt.himars);
                    altiusReady = true; anvilReady = true; rrDeployReady = true; furyReady = true;
                    addKill(`<span style="color:#4499ff;font-weight:bold;">📦 C-17 RESUPPLY — DAY ${dayNumber}:</span> Altius +${resupplyAmt.altius}, Anvil +${resupplyAmt.anvil}, Roadrunner +${resupplyAmt.roadrunner}, F-16V +${resupplyAmt.f16v} sorties.`);
                    speak(`Day ${dayNumber}. C-17 resupply confirmed. Inventories restored.`, 1);
                }

                // ── HUALIEN STRIKE — Day 1 first wave chance ─────────────────
                // Handled in wave spawn — if DF-17 gets through on wave 1 day 1
                // that's already tracked. Here we just announce if degraded.
                if (dayNumber === 2 && hualienDegraded) {
                    addKill(`<span style="color:#ff4444;">⚠ HUALIEN STATUS:</span> Air base remains degraded. F-16V sortie capacity halved.`);
                }

                // Show support modal
                showSupportModal(dayNumber - 1);
                // Don't call spawnWave here — modal pauses playing, wave will resume after choice
            } else {
                spawnWave();
            }
        }, nextEventDelay);
    }

    // ============================================================
    // SPAWN FIGHTER JET — J-16 or J-20 strike run
    // Appears at edge of map, flies inbound, fires one missile
    // at the base when in range, then egresses.
    // Only Roadrunner interceptors can engage jets or their missiles.
    // ============================================================
    function spawnJet() {
        const jetType = waveNumber >= 8 ? 'J-20' : 'J-16';
        const angle   = Math.random() * Math.PI * 2;
        const spawnD  = 0.50; // spawn well outside battlespace
        const isJ20 = jetType === 'J-20';
        const jet = {
            id: `JET-${nextId++}`,
            type: jetType,
            lat: base.lat + Math.sin(angle) * spawnD,
            lng: base.lng + Math.cos(angle) * spawnD,
            speed: isJ20 ? JET_SPEED * 1.3 : JET_SPEED,  // J-20 faster
            alt: JET_ALT,
            alive: true,
            hasFired: false,
            egressing: false,
            egressLat: 0,
            egressLng: 0,
            // Evasion
            evasionHeading: null,      // current evasion angle (null = not evading)
            evasionUntilTs: 0,         // timestamp when evasion ends
            // Flares
            flareCount: isJ20 ? 4 : 2, // J-20 carries more flares
            flareLastTs: 0,            // last flare deployment timestamp
            // RR lock tracking — which RR drones have this jet locked
            lockedByIds: []
        };
        enemyJets.push(jet);
        addKill(`<span style="color:#ff0000;font-weight:bold;">⚠ AIR THREAT:</span> ${jetType} STRIKE PACKAGE INBOUND. ROADRUNNER INTERCEPT REQUIRED.`);
        speak(`Warning. ${jetType} fighter inbound. Roadrunner intercept required.`, 2);
    }

    // ============================================================
    // EMP INTERDICTION
    // ============================================================
    function fireEMPInterdiction() {
        const n = Date.now();
        if (!playing || !empReady || isTelemetryActive) return;
        empReady       = false;
        empLastFiredTs = n;
        document.getElementById('empBtn').disabled = true;
        const spd = 0.0030;
        projectiles.push({
            lng: base.lng,
            lat: base.lat + EMP_DETONATION_RANGE,
            vx: 0,
            vy: -spd,
            firerId: 0,
            isEMP: true,
            detonationRange: EMP_DETONATION_RANGE,
            isAntiPacket: false
        });
        addKill('<span style="color:#00ffff;font-weight:bold;">E-SYSTEM:</span> EMP Interdiction Launched.');
        speak('EMP Interdiction missile launched. Standby for area denial.', 1);
    }

    // ============================================================
    // CLG TOGGLE
    // ============================================================
    function toggleCLG() {
        if (!playing) return;
        const n = Date.now();
        if (clgStatus === 'READY') {
            if (clgHeat >= 90) { speak('System too hot to engage.', 1); return; }
            clgKillsThisActivation = 0;  // reset kill counter on fresh activation
            clgStatus   = 'ACTIVATING';
            clgTargetTs = n + CLG_ACTIVATION_MS;
            document.getElementById('clgBtn').textContent = 'CLG ACTIVATING';
            document.getElementById('clgBtn').disabled    = true;
            speak('Laser Grid activation sequence initiated.', 1);
            addKill('<span style="color:#ff00ff;font-weight:bold;">CLG:</span> Activation Sequence Initiated.');
        } else if (clgStatus === 'ACTIVE') {
            clgStatus   = 'SHUTTING_DOWN';
            clgTargetTs = n + CLG_SHUTDOWN_MS;
            document.getElementById('clgBtn').textContent = 'CLG SHUTTING DOWN';
            document.getElementById('clgBtn').disabled    = true;
            speak('Laser Grid deactivation initiated.', 1);
            addKill('<span style="color:#ff00ff;font-weight:bold;">CLG:</span> Deactivation Sequence Initiated.');
        }
    }

    // ============================================================
    // TTU ACTIVATE
    // ============================================================
    function activateTTU() {
        if (!playing || !ttuReady || ttuActive) return;
        ttuReady       = false;
        ttuActive      = true;
        ttuLastFiredTs = Date.now();
        if (waveTimer) { clearTimeout(waveTimer); waveTimer = null; }
        music.pause();
        speechSynthesis.cancel();
        let idx        = 0;
        const avail    = friends.filter(f => f.id !== 0);
        enemies.forEach(e => {
            if (e.alive && e.engagedBy === undefined && avail.length > 0) {
                e.engagedBy = avail[idx % avail.length].id;
                idx++;
            }
        });
        document.getElementById('ttuBtn').disabled    = true;
        document.getElementById('ttuBtn').textContent = 'TTU ACTIVE';
        speak('Telemetry uplink active. All voice communication constrained.', 1);
        addKill('<span style="color:#00ffff;font-weight:bold;">TTU:</span> Tactical Telemetry Uplink Active! Packet lock-on enhanced.');
    }

    // ============================================================
    // ORS ACTIVATE
    // ============================================================
    function activateORS() {
        if (!playing || !orsReady) return;
        orsReady        = false;
        orsLastFiredTs  = Date.now();
        orsDisruptionTs = Date.now();
        document.getElementById('orsBtn').disabled = true;

        let anyRestored = false;

        // First priority: restore any offline XRST towers
        xrstTowers.forEach(tower => {
            if (!tower.online) {
                tower.online = true;
                anyRestored  = true;
                addKill(`<span style="color:#00ffff;font-weight:bold;">ORS:</span> ${tower.id} restored to operational status.`);
                speak(`${tower.id} back online. Sensor coverage restored.`, 1);
            }
        });

        // ORS now focuses on XRST tower restoration only
        // (Original Roadrunner recovery removed with ground unit system)

        // ORS always repairs 10% base health — orbital scan assesses and patches damage
        if (baseHealth < 5) {
            baseHealth = Math.min(5, baseHealth + 1);
            addKill(`<span style="color:#00ffaa;font-weight:bold;">ORS:</span> Damage assessment complete. Base integrity restored to ${baseHealth * 20}%.`);
            speak(`Base integrity restored to ${baseHealth * 20} percent.`, 1);
        }

        if (!anyRestored && baseHealth >= 5) {
            speak('Orbital scan complete. All systems nominal.', 1);
            addKill('<span style="color:#00ffaa;font-weight:bold;">ORS:</span> Scan complete. No losses detected.');
        }

        speak('Warning. Scan detected. All enemy movement speed increased.', 1);
    }

    // ============================================================
    // FIRE PROJECTILE
    // ============================================================
    function fireProjectile(f, t) {
        if (f.missiles < 1) return;
        f.missiles = Math.max(0, f.missiles - 1);

        // FIX: Immediately RTB if this shot consumed the last missile.
        // Without this, a panic-scrambled unit with 1 missile would fire it,
        // reach missiles=0, but stay ACTIVE and loiter indefinitely.
        if (f.missiles <= 0 && f.logisticsState === 'ACTIVE') {
            f.logisticsState = 'RTB';
            enemies.forEach(e => {
                if (e.engagedBy === f.id) e.engagedBy = undefined;
            });
        }

        t.engagedBy = f.id;
        const pkt   = t.isSwarmUnit;
        const spd   = 0.0070;
        const a     = Math.atan2(t.lat - f.lat, t.lng - f.lng);
        projectiles.push({
            lng: f.lng,
            lat: f.lat,
            vx: Math.cos(a) * spd,
            vy: Math.sin(a) * spd,
            firerId: f.id,
            firerName: f.name,
            targetId: t.id,    // track target so a miss can immediately free engagedBy
            isAntiPacket: pkt,
            isEMP: false
        });
    }

    // ============================================================
    // ALTIUS — anti-UAS kamikaze drone squad
    // Targets FPV swarms and CH-4 strike drones only
    // ============================================================
    function launchAltius() {
        if (!playing || !altiusReady) return;
        if (INVENTORY.altius.remaining <= 0) {
            addKill('<span style="color:#ff4444;">ALTIUS:</span> Inventory depleted. Awaiting resupply.');
            return;
        }
        altiusReady  = false;
        altiusLastTs = Date.now();
        document.getElementById('altiusBtn').disabled = true;

        const deployCount = Math.min(ALTIUS_COUNT, INVENTORY.altius.remaining);
        INVENTORY.altius.remaining = Math.max(0, INVENTORY.altius.remaining - deployCount);
        const targets = enemies.filter(e => e.alive && e.isSwarmUnit);
        const altiusReserveCount = Math.max(1, Math.floor(deployCount * 0.20));
        for (let i = 0; i < deployCount; i++) {
            const angle     = (i / ALTIUS_COUNT) * Math.PI * 2;
            const isReserve = i < altiusReserveCount;
            altiusSquad.push({
                id: `ALTIUS-${String(nextId++).padStart(2,'0')}`,
                lat: base.lat + Math.sin(angle) * 0.003,
                lng: base.lng + Math.cos(angle) * 0.003,
                speed: ALTIUS_SPEED,
                targetType: 'swarm',
                alive: true,
                logisticsState: 'ACTIVE',
                targetId: undefined,
                role: isReserve ? 'RESERVE' : 'INTERCEPT'
            });
        }
        
        addKill(`<span style="color:#00ffcc;font-weight:bold;">ALTIUS:</span> ${deployCount} drones deployed. Inventory: ${INVENTORY.altius.remaining} remaining.`);
    }

    // ============================================================
    // ANVIL — heavier attrition drone
    // Targets CH-4 strike drones and TB-001 loiterers
    // ============================================================
    function launchAnvil() {
        if (!playing || !anvilReady) return;
        if (INVENTORY.anvil.remaining <= 0) {
            addKill('<span style="color:#cc44ff;">ANVIL:</span> Inventory depleted. Awaiting resupply.');
            return;
        }
        anvilReady  = false;
        anvilLastTs = Date.now();
        document.getElementById('anvilBtn').disabled = true;

        const anvilDeployCount = Math.min(ANVIL_COUNT, INVENTORY.anvil.remaining);
        INVENTORY.anvil.remaining = Math.max(0, INVENTORY.anvil.remaining - anvilDeployCount);
        const anvilReserveCount = Math.max(1, Math.floor(anvilDeployCount * 0.20));
        for (let i = 0; i < anvilDeployCount; i++) {
            const angle   = (i / ANVIL_COUNT) * Math.PI * 2;
            const isReserve = i < anvilReserveCount;
            anvilSquad.push({
                id: `ANVIL-${String(nextId++).padStart(2,'0')}`,
                lat: base.lat + Math.sin(angle) * 0.003,
                lng: base.lng + Math.cos(angle) * 0.003,
                speed: ANVIL_SPEED,
                targetType: 'strike',
                alive: true,
                logisticsState: 'ACTIVE',
                targetId: undefined,
                role: isReserve ? 'RESERVE' : 'INTERCEPT'
            });
        }
        
        addKill(`<span style="color:#cc44ff;font-weight:bold;">ANVIL:</span> ${anvilDeployCount} drones deployed. Inventory: ${INVENTORY.anvil.remaining} remaining.`);
    }

    // ============================================================
    // ROADRUNNER DEPLOY — precision interceptor
    // Targets jets and jet missiles ONLY
    // ============================================================
    function launchRRDeploy() {
        if (!playing || !rrDeployReady) return;
        if (INVENTORY.roadrunner.remaining <= 0) {
            addKill('<span style="color:#00ffff;">ROADRUNNER:</span> All interceptors expended. Awaiting resupply.');
            return;
        }
        rrDeployReady  = false;
        rrDeployLastTs = Date.now();
        document.getElementById('rrDeployBtn').disabled = true;

        const rrCount = Math.min(RR_DEPLOY_COUNT, INVENTORY.roadrunner.remaining);
        INVENTORY.roadrunner.remaining = Math.max(0, INVENTORY.roadrunner.remaining - rrCount);
        for (let i = 0; i < rrCount; i++) {
            const angle = (i / RR_DEPLOY_COUNT) * Math.PI * 2;
            rrSquad.push({
                id: `RR-INT-${String(nextId++).padStart(2,'0')}`,
                lat: base.lat + Math.sin(angle) * 0.003,
                lng: base.lng + Math.cos(angle) * 0.003,
                speed: RR_DEPLOY_SPEED,
                targetType: 'jet',    // jets and jet missiles only
                alive: true
            });
        }
        
        addKill(`<span style="color:#00ffff;font-weight:bold;">ROADRUNNER:</span> ${rrCount} interceptors deployed. Inventory: ${INVENTORY.roadrunner.remaining} remaining.`);
    }

    // ============================================================
    // F-16V AIR SUPPORT
    // ============================================================
    function launchFurySquad() {
        const n = Date.now();
        if (!playing || !furyReady) return;
        if (furySquad.length > 0) return;
        if (INVENTORY.f16v.remaining <= 0) {
            addKill(`<span style="color:#00ffff;">FURY:</span> ${hualienDegraded ? 'Hualien degraded — ' : ''}All sorties expended. Awaiting resupply.`);
            return;
        }
        INVENTORY.f16v.remaining--;
        furyReady       = false;
        furyLastFiredTs = n;
        document.getElementById('furyBtn').disabled = true;

        // Hualien Air Base is ~1.07 south and 0.106 east of base (F-16V home base)
        // Jets take off from Edwards, fly southwest toward the battlespace,
        // engage threats over base, then egress back northeast to Edwards
        const edwardsLat = base.lat - 1.07;  // Hualien Air Base — south of Taipei
        const edwardsLng = base.lng + 0.11;

        // Heading from Edwards toward base
        const angle = Math.atan2(base.lat - edwardsLat, base.lng - edwardsLng);
        const vx    = Math.cos(angle) * FURY_SPEED;
        const vy    = Math.sin(angle) * FURY_SPEED;

        const offsets = [-0.005, 0.005]; // slight lateral spread for formation
        offsets.forEach((offset, idx) => {
            furySquad.push({
                id: `F16V-${idx + 1}`,
                lat: edwardsLat + offset,
                lng: edwardsLng + offset,
                vx,
                vy,
                firedCount: 0,
                ammo: 10,
                edwardsLat,   // remember home base for egress
                edwardsLng
            });
        });

        speak("Hualien departure. F-16V squadron inbound.", 1);
        addKill('<span style="color:#00ffff;font-weight:bold;">AIR SUPPORT:</span> F-16V Squadron departing Hualien Air Base.');
    }

    // ============================================================
    // AUTO-TASKING ENGINE
    // Scores all identified threats and assigns optimal interceptors.
    // Runs once per second when autoMode is enabled.
    // Player can still override at any time.
    // Score formula: score = threatLevel * proximity / timeToImpact
    // ============================================================
    function runAutoTasking() {
        if (!autoMode || !playing || isJammed) return;
        const now = Date.now();
        if (now - autoLastAssignTs < 1000) return;
        autoLastAssignTs = now;

        // Score each alive identified enemy
        const scored = enemies
            .filter(e => e.alive && e.identified)
            .map(e => {
                const dist        = Math.hypot(e.lng - base.lng, e.lat - base.lat);
                const threatLevel = e.isSwarmUnit ? 1 : e.isLoitererUnit ? 3 : 2;
                const speed       = e.speed || 0.0008;
                const timeToImpact = dist / speed; // ticks to base
                const score       = (threatLevel * (1 / dist)) / (timeToImpact / 100);
                return { e, score, dist, threatLevel };
            })
            .sort((a, b) => b.score - a.score);

        if (scored.length === 0) return;

        let autoActions = [];

        // Auto-deploy Altius if swarms present and ready
        const hasSwarms = scored.some(s => s.e.isSwarmUnit);
        if (hasSwarms && altiusReady && altiusSquad.length === 0) {
            launchAltius();
            autoActions.push('ALTIUS deployed');
        }

        // Auto-deploy Anvil if strike/loiterer present and ready
        const hasStrike = scored.some(s => !s.e.isSwarmUnit);
        if (hasStrike && anvilReady && anvilSquad.length === 0) {
            launchAnvil();
            autoActions.push('ANVIL deployed');
        }

        // Auto-deploy RR if jets or missiles present
        const hasJets = enemyJets.some(j => j.alive) || jetMissiles.some(m => !m.intercepted);
        if (hasJets && rrDeployReady && rrSquad.length === 0) {
            launchRRDeploy();
            autoActions.push('ROADRUNNER deployed');
        }

        // Auto-EMP — last resort only. Strict conditions to prevent friendly fire waste:
        //   1. Base already damaged (integrity <= 60%)
        //   2. 6+ hostiles inside kill range
        //   3. No friendly drones airborne (they'd be destroyed)
        //   4. Overall saturation is overwhelming (10+ scored threats)
        const closePressure     = scored.filter(s => s.dist < EMP_KILL_RANGE * 1.2).length;
        const dronesAirborneNow = altiusSquad.filter(d => d.alive).length +
                                  anvilSquad.filter(d => d.alive).length;
        const empLastResort = baseHealth <= 3 &&        // base already at 60% or below
                              closePressure >= 6 &&     // dense close cluster
                              dronesAirborneNow === 0 && // no friendlies to destroy
                              scored.length >= 10;       // overwhelming saturation
        if (empLastResort && empReady) {
            fireEMPInterdiction();
            autoActions.push('EMP LAST RESORT fired');
        }

        // Auto-Fury if loiterers present or saturation >= 6
        if (furyReady && (scored.some(s => s.e.isLoitererUnit) || scored.length >= 6)) {
            launchFurySquad();
            autoActions.push('F-16V launched');
        }

        // Log auto actions
        if (autoActions.length > 0) {
            addKill(`<span style="color:#00ffaa;font-weight:bold;">[AUTO]</span> ${autoActions.join(' | ')}`);
        }
    }

    // ============================================================
    // ADS-B LIVE AIRCRAFT FEED
    // Polls OpenSky Network for real transponder data over the
    // Antelope Valley / Hualien Air Base airspace every 30 seconds.
    // Displayed as neutral white contacts — no game interaction.
    // ============================================================
    async function fetchADSB() {
        const now = Date.now();
        if (now - adsbLastFetch < ADSB_FETCH_INTERVAL_MS) return;
        adsbLastFetch = now;
        try {
            const { loLat, hiLat, loLng, hiLng } = ADSB_BOUNDS;
            const url = `https://opensky-network.org/api/states/all?lamin=${loLat}&lomin=${loLng}&lamax=${hiLat}&lomax=${hiLng}`;
            const res = await fetch(url);
            if (!res.ok) return;
            const data = await res.json();
            if (!data || !data.states) { adsbAircraft = []; return; }
            adsbAircraft = data.states
                .filter(s => s[5] !== null && s[6] !== null) // must have position
                .map(s => ({
                    icao:     s[0],
                    callsign: (s[1] || '').trim() || s[0],
                    lng:      s[5],
                    lat:      s[6],
                    alt:      s[7] ? Math.round(s[7]) : null,  // meters
                    heading:  s[10] || 0,
                    onGround: s[8]
                }))
                .filter(a => !a.onGround); // airborne only
        } catch (e) {
            // Fail silently — don't break the game
        }
    }

    // ============================================================
    // TACTICAL AI RECOMMENDATION
    // Each system is evaluated independently and added to a list
    // if it crosses its own urgency threshold. All qualifying
    // recommendations are displayed simultaneously, ranked by score.
    // ============================================================
    function recommendSystem() {
        if (!playing) {
            document.getElementById('recommendationText').textContent = 'SYSTEM OFFLINE.';
            return;
        }

        const imminent  = enemies.filter(e => e.alive && Math.hypot(e.lng - base.lng, e.lat - base.lat) < 0.02);
        const close     = enemies.filter(e => e.alive && Math.hypot(e.lng - base.lng, e.lat - base.lat) < EMP_KILL_RANGE);
        const unengaged = imminent.filter(e => e.engagedBy === undefined);
        const packets   = imminent.filter(e => e.isSwarmUnit);
        const tracks    = imminent.filter(e => !e.isSwarmUnit && !e.isLoitererUnit);
        const loiterers = imminent.filter(e => e.isLoitererUnit);

        // Weighted threat pressure index
        let idx = 0;
        imminent.forEach(e => {
            idx += e.isSwarmUnit ? 1.5 : e.isLoitererUnit ? 2.0 : 1;
        });

        // Offline XRST towers
        const offlineTowers = xrstTowers.filter(t => !t.online).length;

        // Build a list of { score, html } for every system that warrants action
        const recs = [];

        // EMP — only recommend as last resort
        // Warn about collateral damage, require base already hurt and high saturation
        if (empReady && !ttuActive) {
            const dronesUp = altiusSquad.filter(d => d.alive).length +
                             anvilSquad.filter(d => d.alive).length;
            // Only score EMP if base is damaged AND heavy close pressure
            if (baseHealth <= 3 && close.length >= 4) {
                let s = close.length * 20 + (5 - baseHealth) * 30;
                const warning = dronesUp > 0
                    ? `⚠ ${dronesUp} friendly drones in blast radius.`
                    : 'No friendlies in blast radius.';
                recs.push({ score: s, html: `<span style="color:#00ffff;font-weight:bold;">⚡ EMP LAST RESORT:</span> Base integrity critical. ${warning} Use only if overwhelmed.` });
            }
        }

        // TTU — packets or unengaged tracks
        if (ttuReady && !ttuActive) {
            let s = packets.length * 10 + unengaged.length * 5;
            if (s > 50) {
                recs.push({ score: s, html: '<span style="color:#00ffff;font-weight:bold;">📡 TTU LINK:</span> Packets/unengaged tracks — uplink recommended.' });
            }
        }

        // CLG — track-heavy, low packet mix
        if (clgStatus === 'READY') {
            let s = tracks.length * 10 - packets.length * 15;
            if (s > 50) {
                recs.push({ score: s, html: '<span style="color:#ff00ff;font-weight:bold;">🔆 CLG GRID:</span> Tracks closing on perimeter — laser grid recommended.' });
            }
        }

        // FURY — loiterers present or saturation high
        if (furyReady) {
            let s = 0;
            if (loiterers.length > 0)      s += 150;
            else if (imminent.length >= 6) s += 70;
            s += idx * 8;
            if (s > 50) {
                const reason = loiterers.length > 0
                    ? 'HEAVY ARMOR detected — air support critical.'
                    : 'Saturation level high — air support recommended.';
                recs.push({ score: s, html: `<span style="color:#00ffff;font-weight:bold;">✈ AIR SUPPORT:</span> ${reason}` });
            }
        }

        // ORS — offline towers or lost Roadrunners, low pressure
        if (orsReady && offlineTowers > 0) {
            const s = offlineTowers * 80;
            recs.push({ score: s, html: `<span style="color:#00ffaa;font-weight:bold;">🛰 ORS SCAN:</span> ${offlineTowers} XRST tower${offlineTowers > 1 ? 's' : ''} offline — scan recommended.` });
        }

        // Sort highest score first
        recs.sort((a, b) => b.score - a.score);

        // Build output with auto-mode status header
        const autoHeader = autoMode
            ? '<span style="color:#00ffaa;font-weight:bold;">⚡ AUTO-TASKING ACTIVE</span><br>'
            : '';
        const jamHeader = isJammed
            ? '<span style="color:#f00;font-weight:bold;">⚠ DEGRADED COMMS — LOCAL PICTURE ONLY</span><br>'
            : '';

        // Show track confidence summary
        const unknowns  = enemies.filter(e => e.alive && (e.confidence||0) < 40).length;
        const suspects  = enemies.filter(e => e.alive && (e.confidence||0) >= 40 && (e.confidence||0) < 80).length;
        const hostiles  = enemies.filter(e => e.alive && (e.confidence||0) >= 80).length;
        const trackLine = (unknowns + suspects + hostiles) > 0
            ? `<span style="color:#555;font-size:11px;">TRACKS: <span style="color:#ffff00;">${unknowns} UNK</span> · <span style="color:#ff9900;">${suspects} SUSP</span> · <span style="color:#ff3333;">${hostiles} HOSTILE</span></span><br><span style="color:#333;">───</span><br>`
            : '';

        if (recs.length === 0) {
            document.getElementById('recommendationText').innerHTML =
                autoHeader + jamHeader + trackLine + 'NO IMMEDIATE ACTION REQUIRED.';
        } else {
            document.getElementById('recommendationText').innerHTML =
                autoHeader + jamHeader + trackLine +
                recs.map(r => r.html).join('<br><span style="color:#333;">───</span><br>');
        }
    }

    // ============================================================
    // MAIN UPDATE LOOP (runs every 250ms)
    // ============================================================
