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
        dayStartTs          = Date.now();
        killfeedLog.length  = 0; // clear log on new game
        nextEventTs         = 0;
        nextEventDelaySaved = 0;
        wallClockTriggered  = false;
        navalBattleActive   = false;
        csgVlsPool          = 380;
        infraDegraded       = 0;
        japanRetaliationTs   = 0;
        // Reset economy ledger
        Object.keys(economyLog.interceptorsFired).forEach(k => economyLog.interceptorsFired[k] = 0);
        Object.keys(economyLog.enemiesKilled).forEach(k => economyLog.enemiesKilled[k] = 0);
        economyLog.navalKills       = [];
        economyLog.defenseCost      = 0;
        economyLog.attritionValue   = 0;
        economyLog.exchangeRatioByDay = [];
        economyLog.currentDay       = 1;
        updateEconTicker();
        japanRetaliationCount = 0;
        csgWithdrawn        = false;
        csgWithdrawTs       = 0;
        landingZonesActive  = false;
        airBattleTs         = 0;
        combatAircraft      = [];
        if (map.getSource('combat-aircraft')) map.getSource('combat-aircraft').setData({ type: 'FeatureCollection', features: [] });
        PLAAF_OOB.forEach(sq => { sq.sorties = sq.sorties || 24; sq.losses = 0; sq.alive = true; });
        US_AIR_OOB.forEach(sq => { sq.losses = 0; sq.alive = true; });
        if (map.getSource('air-squadrons')) map.getSource('air-squadrons').setData({ type: 'FeatureCollection', features: [] });
        LANDING_ZONES.forEach(lz => { lz.status = lz.threat === 'PRIMARY' ? 'STAGING' : 'STAGING'; lz.troopsLanded = 0; });
        globalMarketIndex = 100.0;
        gdpLostTrillions  = 0.0;
        tsmcThreatLevel   = 0;
        if (map.getSource('landing-zones')) map.getSource('landing-zones').setData({ type: 'FeatureCollection', features: [] });
        navalPlanKills      = 0;
        navalUskills        = 0;
        carrierStrikeDegraded = false;
        PLAN_SAG.forEach(s => { s.alive = true; s.health = s.maxHealth; s.sunkBy = null; s.damageLog = []; });
        US_CSG.forEach(s  => { s.alive = true; s.health = s.maxHealth; s.sunkBy = null; s.damageLog = []; });
        JAPAN_DDG_SQUADRON.forEach(s => { s.alive = true; s.health = s.maxHealth; s.sunkBy = null; s.damageLog = []; });
        if (map.getSource('naval-ships')) map.getSource('naval-ships').setData({ type: 'FeatureCollection', features: [] });
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
        // Escalation is day-gated — caps at Day 5 so late game difficulty
        // comes from PLA AI composition shifts, not raw enemy count
        const dayScale   = Math.min(4, Math.max(1, dayNumber - 1));
        const cappedWave = Math.min(waveNumber - 1, 10);
        const escalation = Math.floor(cappedWave * ENEMY_INCREASE_PER_WAVE * (0.4 + dayScale * 0.15));
        // Naval kills reduce wave pressure — each PLAN ship sunk cuts wave by 1-2
        const navalReduction = Math.min(navalPlanKills * 2, 8);
        const rawTotal   = Math.max(3, baseCount + escalation - navalReduction);
        // Hard cap — never more than 25 enemies on map at once
        const currentAlive = enemies.filter(e => e.alive).length;
        const spawnBudget  = Math.max(0, 50 - currentAlive);
        const total        = Math.min(rawTotal, spawnBudget);
        // Also cap threat type probabilities so composition stabilizes
        // ── PLA ADAPTIVE AI — update weights based on last wave performance ──
        // After each wave PLA shifts composition away from what's being defeated
        // and doubles down on what's getting through
        if (waveNumber > 1 && waveNumber % 2 === 0) {  // adapt every 2 waves not every wave
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
        // Day 1: heavy missile saturation. Day 2: reduced missiles, more drones begin
        const df17Prob = dayNumber === 1 ? 0.50 * w.df17
                       : dayNumber === 2 ? 0.25 * w.df17
                       : Math.max(0.05, (0.20 * w.df17) / baseSum);
        const cj10Prob = dayNumber === 1 ? 0.35 * w.cj10
                       : dayNumber === 2 ? 0.20 * w.cj10
                       : Math.max(0.05, (0.18 * w.cj10) / baseSum);
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
        const tooManyAlive = enemies.filter(e => e.alive).length >= 40;
        if (!plaMemory.feintActive && !tooManyAlive && Math.random() < feintChance) {
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
        const aliveNow = enemies.filter(e => e.alive).length;
        if (dayNumber >= 3 && aliveNow < 35 && Math.random() < 0.35 && !plaMemory.lastWaveSpread) {
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
            const realElapsedCheck = dayStartTs > 0 ? Date.now() - dayStartTs : dayElapsed;
            if (dayElapsed >= DAY_DURATION_MS || realElapsedCheck >= DAY_DURATION_MS) {
                advanceDay();
            } else {
                spawnWave();
            }
        }, nextEventDelay);
    }

    // ============================================================
    // HOVER TOOLTIP SYSTEM
    // ============================================================

    var SHIP_INFO = {
        // PLAN vessels
        '南昌 (Nanchang)': {
            price: '~$900M USD per vessel',
            title: '南昌 (Nanchang) — Type 055 DDG',
            rows: [
                ['Class', 'Renhai (Type 055)'],
                ['Displacement', '13,000 tons'],
                ['Missiles', 'HHQ-9B SAM, YJ-18 AShM, CJ-10 LACM'],
                ['Role', 'Area air defense, surface strike'],
                ['CSIS assessment', 'Most capable PLAN surface combatant. Equivalent to US Ticonderoga cruiser. Primary AAW platform for SAG protection.'],
            ]
        },
        '延安 (Yanan)': {
            price: '~$900M USD per vessel',
            title: '延安 (Yanan) — Type 055 DDG',
            rows: [
                ['Class', 'Renhai (Type 055)'],
                ['Displacement', '13,000 tons'],
                ['Missiles', 'HHQ-9B SAM, YJ-18 AShM, CJ-10 LACM'],
                ['Role', 'Area air defense, surface strike'],
                ['CSIS assessment', 'Second Type 055 in SAG provides redundant AAW umbrella. Combined, they can track hundreds of targets simultaneously.'],
            ]
        },
        '贵阳 (Guiyang)': {
            price: '~$500M USD per vessel',
            title: '贵阳 (Guiyang) — Type 052D DDG',
            rows: [
                ['Class', 'Luyang III (Type 052D)'],
                ['Displacement', '7,500 tons'],
                ['Missiles', 'HHQ-9 SAM, YJ-12 AShM, YJ-18'],
                ['Role', 'General purpose destroyer'],
                ['CSIS assessment', 'Backbone of PLAN surface fleet. Over 20 in service. Provides medium-range AAW and anti-ship capability within the SAG.'],
            ]
        },
        '广西 (Guangxi)': {
            price: '~$1.2B USD per vessel',
            title: '广西 (Guangxi) — Type 075 LHD',
            rows: [
                ['Class', 'Yushen (Type 075)'],
                ['Displacement', '40,000 tons'],
                ['Aircraft', 'Z-8/Z-20 helos, WZ-10 attack helos'],
                ['Capacity', '~1,000 troops, 30+ vehicles, LCACs'],
                ['CSIS assessment', 'Primary amphibious assault ship. Sinking this forces PLA to rely on older Type 071 LPDs and civilian roll-on/roll-off vessels. High-value target.'],
            ]
        },
        // PLAN additional vessels
        '太原 (Taiyuan)': { title: '太原 (Taiyuan) — Type 052D DDG', rows: [['Class','Luyang III (052D)'],['Displacement','7,500 tons'],['Missiles','HHQ-9, YJ-18'],['CSIS','Second 052D provides overlapping AAW coverage for the SAG. Loss degrades PLAN medium-range air defense.'],] },
        '岳阳 (Yueyang)': { title: '岳阳 (Yueyang) — Type 054A Frigate', rows: [['Class','Jiangkai II (054A)'],['Displacement','4,000 tons'],['Missiles','HHQ-16 SAM, YJ-83 AShM'],['Role','ASW + escort'],['CSIS','ASW frigate — primary threat to US submarines. Torpedo tubes and hull-mounted sonar. CSIS notes PLAN ASW capability is improving but still inferior to US submarine force.'],] },
        '三亚 (Sanya)': { title: '三亚 (Sanya) — Type 054A Frigate', rows: [['Class','Jiangkai II (054A)'],['Displacement','4,000 tons'],['Missiles','HHQ-16 SAM, YJ-83 AShM'],['Role','ASW + escort'],['CSIS','Second ASW frigate. Together with Yueyang, they form the sub-surface defense layer for the SAG.'],] },
        'SS-329': { title: 'SS-329 — Type 039B (Yuan-class) SSK', rows: [['Class','Yuan (039B)'],['Displacement','3,600 tons submerged'],['Propulsion','AIP — 3 week submerged endurance'],['Weapons','Yu-6 torpedoes, YJ-18 AShM'],['CSIS','PLAN AIP submarine. Quieter than older designs, significant threat to US surface ships in shallow strait waters. PLAN subs are the primary unknown in CSIS modeling.'],] },
        'SS-331': { title: 'SS-331 — Type 039B (Yuan-class) SSK', rows: [['Class','Yuan (039B)'],['Displacement','3,600 tons submerged'],['Propulsion','AIP'],['Weapons','Yu-6 torpedoes'],['CSIS','Second PLAN submarine. Combined with SS-329 provides dual-axis undersea threat. CSIS notes these are the most likely US ships to be surprised by PLAN subs in shallow water.'],] },
        '四川 (Sichuan)': { title: '四川 (Sichuan) — Type 071 LPD', rows: [['Class','Yuzhao (071)'],['Displacement','25,000 tons'],['Capacity','800 troops, 4 LCACs, helicopters'],['CSIS','Type 071 LPD is the workhorse of PLAN amphibious force. 8 in service. Carries hovercraft (LCACs) for over-the-beach delivery. High-priority target — sinking delays assault timeline.'],] },
        '昆仑山 (Kunlunshan)': { title: '昆仑山 (Kunlunshan) — Type 071 LPD', rows: [['Class','Yuzhao (071)'],['Displacement','25,000 tons'],['Capacity','800 troops, 4 LCACs'],['CSIS','Lead ship of the 071 class. Named after Kunlun Mountains. CSIS identifies simultaneous LPD strikes as the critical window for Taiwan/US to derail the invasion before troops reach the beach.'],] },
        '查干湖 (Chaganhu)': { title: '查干湖 (Chaganhu) — Type 901 AOR', rows: [['Class','Fucha (901)'],['Displacement','45,000 tons'],['Role','Underway replenishment'],['CSIS','Largest PLAN replenishment ship. Without it the SAG cannot sustain extended operations. Sinking it forces PLAN to withdraw for resupply — effectively ending the naval campaign.'],] },
        // US additional vessels
        'CG-67 Shiloh': { title: 'USS Shiloh (CG-67)', rows: [['Class','Ticonderoga cruiser'],['Displacement','9,800 tons'],['Missiles','122-cell VLS — SM-2/SM-3/SM-6, Tomahawk'],['Role','Primary BMD — DF-21D intercept'],['CSIS','Ticonderoga cruisers are the backbone of CSG ballistic missile defense. SM-3 Block IIA is the primary interceptor for DF-21D. CSIS wargames show CGs are likely the first US ships targeted by PLAN because neutralizing them removes BMD coverage from the carrier.'],] },
        'CG-73 Port Royal': { title: 'USS Port Royal (CG-73)', rows: [['Class','Ticonderoga cruiser'],['Displacement','9,800 tons'],['Missiles','122-cell VLS'],['Role','BMD + strike coordination'],['CSIS','Second Ticonderoga provides redundant BMD. With both CGs operational, CVN-73 has substantial protection against DF-21D. Loss of either significantly increases carrier vulnerability.'],] },
        'DDG-110 William Lawrence': { title: 'USS William Lawrence (DDG-110)', rows: [['Class','Arleigh Burke Flight IIA'],['Displacement','9,200 tons'],['Missiles','96-cell VLS'],['Role','Forward screen'],['CSIS','Forward picket destroyer. Most likely to intercept YJ-18 salvos before they reach the carrier. CSIS scenarios show forward DDGs absorbing disproportionate hits in early exchanges.'],] },
        'DDG-71 Ross': { title: 'USS Ross (DDG-71)', rows: [['Class','Arleigh Burke Flight I'],['Displacement','8,900 tons'],['Missiles','90-cell VLS, Harpoon'],['Role','Surface strike'],['CSIS','Harpoon-equipped DDG provides primary anti-surface strike alongside the submarines. In CSIS scenarios DDG-71 and the SSNs account for most PLAN surface kills.'],] },
        'SSN-21 Seawolf': { title: 'USS Seawolf (SSN-21)', rows: [['Class','Seawolf-class'],['Displacement','9,100 tons submerged'],['Speed','35+ knots submerged'],['Weapons','8 torpedo tubes, 50 Mk48/Tomahawk'],['CSIS','Most capable US attack submarine. Faster and quieter than Virginia-class. CSIS considers the Seawolf-class the single most lethal platform in the strait — PLAN has no reliable counter to it in shallow water.'],] },
        'T-AKE Lewis Puller': { title: 'USNS Lewis B. Puller (T-ESB-3)', rows: [['Class','Lewis Puller ESB'],['Displacement','78,000 tons'],['Role','Expeditionary Sea Base'],['CSIS','Mobile staging platform for special operations and logistics. Not a combatant. If sunk, the CSG loses its forward staging capability and must return to Guam for extended maintenance.'],] },
        // Japan basing forces
        'DDG-107 Gravely': { title: 'USS Gravely (DDG-107)', rows: [['Class','Arleigh Burke Flight IIA'],['Displacement','9,200 tons'],['Home port','Yokosuka, Japan'],['Role','Japan-based forward screen'],['CSIS','Japan basing enables this Yokosuka-homeported DDG to enter the fight 3 days earlier. CSIS identifies forward-homeported ships as the key to early US naval effectiveness.'],] },
        'DDG-85 McCampbell': { title: 'USS McCampbell (DDG-85)', rows: [['Class','Arleigh Burke Flight IIA'],['Displacement','9,200 tons'],['Home port','Yokosuka, Japan'],['Role','Japan-based picket'],['CSIS','Second Yokosuka DDG. With Japan basing authorized, this ship provides additional SM-3 coverage against DF-21D. Without Japan basing, it cannot reach engagement range until Day 7.'],] },
        'JS Atago DDH-177': { title: 'JS Atago (DDH-177) — JMSDF', rows: [['Class','Atago-class DDG'],['Displacement','10,000 tons'],['Missiles','SM-3 Block IIA, Type 90 AShM'],['Role','JMSDF BMD escort'],['CSIS','Japan Maritime Self-Defense Force contribution. Japan basing not only forward-deploys US ships but brings in JMSDF assets. CSIS notes Japan force contribution roughly doubles effective US BMD coverage if authorized.'],] },

        // US vessels
        'CVN-73 George Washington': {
            price: '~$4.5B USD (1998 dollars)',
            title: 'USS George Washington (CVN-73)',
            rows: [
                ['Class', 'Nimitz-class carrier'],
                ['Displacement', '100,000 tons'],
                ['Air wing', 'CVW-5: F/A-18E/F, F-35C, EA-18G Growler, E-2D Hawkeye (~75 aircraft)'],
                ['Home port', 'Yokosuka, Japan — only US forward-deployed carrier'],
                ['Status Mar 2026', 'Completing in-port maintenance at Yokosuka — most available Pacific carrier'],
                ['⚠ Real-world context', 'CVN-76 Reagan in dry dock until Aug 2026. Lincoln + Ford committed to Operation Epic Fury vs Iran. George Washington is the realistic Taiwan scenario carrier as of 2026.'],
                ['CSIS assessment', 'Without Japan basing: Guam posture ~800nm — strike range insufficient. With Japan basing: closes to ~200nm Philippine Sea within 24 hours, decisive. DF-21D carrier-killer primary threat when forward-deployed.'],
                ['📋', '<button onclick="showPolicyBrief(&apos;CVN-73&apos;)" style="background:rgba(0,255,170,0.1);border:1px solid #00ffaa;color:#00ffaa;padding:3px 10px;cursor:pointer;border-radius:3px;font-size:10px;letter-spacing:1px;">READ POLICY BRIEF</button>'],
            ]
        },
        'DDG-109 Jason Dunham': {
            price: '~$1.8B USD per vessel',
            title: 'USS Jason Dunham (DDG-109)',
            rows: [
                ['Class', 'Arleigh Burke Flight IIA'],
                ['Displacement', '9,200 tons'],
                ['Missiles', 'SM-2/SM-6, Tomahawk LACM, ESSM'],
                ['Role', 'CSG air defense screen'],
                ['CSIS assessment', 'Forward screen destroyer. Primary role is SM-3/SM-6 intercept of inbound PLA ballistic missiles including DF-21D. Most likely US ship to take first hits.'],
            ]
        },
        'DDG-89 Mustin': {
            price: '~$1.8B USD per vessel',
            title: 'USS Mustin (DDG-89)',
            rows: [
                ['Class', 'Arleigh Burke Flight IIA'],
                ['Displacement', '9,200 tons'],
                ['Missiles', 'SM-2/SM-6, Tomahawk LACM, Harpoon'],
                ['Role', 'CSG screen + surface strike'],
                ['CSIS assessment', 'Second screen destroyer. Harpoon Block II+ provides anti-surface capability. With sub, forms the primary strike arm against PLAN surface forces.'],
            ]
        },
        'SSN-774 Virginia': {
            price: '~$3.4B USD per vessel',
            title: 'USS Virginia (SSN-774)',
            rows: [
                ['Class', 'Virginia-class SSN'],
                ['Displacement', '7,900 tons submerged'],
                ['Weapons', 'Mk 48 torpedoes, Tomahawk LACM, Harpoon'],
                ['Role', 'Undersea warfare, covert strike'],
                ['CSIS assessment', 'Submarine is the most survivable and lethal US asset in the strait. PLAN ASW capability is improving but remains inferior. Virginia-class sinking PLAN surface ships is the most likely mechanism for early US naval success in CSIS scenarios.'],
            ]
        },
        // Additional PLAN vessels
        '太原 (Taiyuan)': {
            price: '~$500M USD per vessel',
            title: '太原 (Taiyuan) — Type 052D DDG',
            rows: [
                ['Class', 'Luyang III (Type 052D)'],
                ['Displacement', '7,500 tons'],
                ['Missiles', 'HHQ-9 SAM, YJ-12 AShM, YJ-18'],
                ['Role', 'General purpose escort'],
                ['CSIS assessment', 'Second Type 052D providing layered AAW within the SAG. Paired with Guiyang to cover multiple threat axes simultaneously.'],
            ]
        },
        '岳阳 (Yueyang)': {
            price: '~$350M USD per vessel',
            title: '岳阳 (Yueyang) — Type 054A Frigate',
            rows: [
                ['Class', 'Jiangkai II (Type 054A)'],
                ['Displacement', '4,000 tons'],
                ['Missiles', 'HHQ-16 SAM, YJ-83 AShM'],
                ['Role', 'ASW, close escort'],
                ['CSIS assessment', 'PLAN workhorse frigate. Over 30 in service. Primary ASW platform — critical for hunting US submarines. Lighter armament than destroyers but highly capable in its niche.'],
            ]
        },
        '三亚 (Sanya)': {
            price: '~$350M USD per vessel',
            title: '三亚 (Sanya) — Type 054A Frigate',
            rows: [
                ['Class', 'Jiangkai II (Type 054A)'],
                ['Displacement', '4,000 tons'],
                ['Missiles', 'HHQ-16 SAM, YJ-83 AShM'],
                ['Role', 'ASW, outer screen'],
                ['CSIS assessment', 'Second ASW frigate completes the anti-submarine screen around the SAG. Virginia and Seawolf class submarines are the primary threat these ships are hunting.'],
            ]
        },
        'SS-329': {
            price: '~$250M USD per vessel',
            title: 'SS-329 — Type 039B Submarine',
            rows: [
                ['Class', 'Yuan-class (Type 039B)'],
                ['Displacement', '3,600 tons submerged'],
                ['Weapons', 'Yu-6 torpedoes, YJ-18 AShM, CJ-10 LACM'],
                ['Propulsion', 'AIP — very quiet'],
                ['CSIS assessment', 'Air-Independent Propulsion makes Yuan-class extremely difficult to detect. CSIS notes PLAN diesel-electric submarines are the most dangerous near-shore threat to US surface combatants. Primary mission: target US destroyers and deny carrier approach.'],
            ]
        },
        'SS-331': {
            price: '~$250M USD per vessel',
            title: 'SS-331 — Type 039B Submarine',
            rows: [
                ['Class', 'Yuan-class (Type 039B)'],
                ['Displacement', '3,600 tons submerged'],
                ['Weapons', 'Yu-6 torpedoes, YJ-18 AShM'],
                ['Propulsion', 'AIP — very quiet'],
                ['CSIS assessment', 'Second PLAN submarine operating in a coordinated wolf pack pattern with SS-329. Together they create a layered submarine threat that forces US surface ships to expend significant ASW resources.'],
            ]
        },
        '四川 (Sichuan)': {
            price: '~$600M USD per vessel',
            title: '四川 (Sichuan) — Type 071 LPD',
            rows: [
                ['Class', 'Yuzhao (Type 071)'],
                ['Displacement', '25,000 tons'],
                ['Capacity', '~800 troops, 4 LCACs, 15+ vehicles'],
                ['Role', 'Amphibious assault'],
                ['CSIS assessment', 'Type 071 LPD is the backbone of PLAN amphibious capability. Sinking this vessel eliminates one complete assault battalion and its equipment. CSIS notes these ships are highest-priority targets for US submarines.'],
            ]
        },
        '昆仑山 (Kunlunshan)': {
            price: '~$600M USD per vessel',
            title: '昆仑山 (Kunlunshan) — Type 071 LPD',
            rows: [
                ['Class', 'Yuzhao (Type 071)'],
                ['Displacement', '25,000 tons'],
                ['Capacity', '~800 troops, 4 LCACs'],
                ['Role', 'Amphibious assault'],
                ['CSIS assessment', 'Lead ship of the Type 071 class. First PLAN LPD capable of sustained blue-water amphibious operations. Loss of this vessel and Sichuan together would critically degrade the first wave landing capacity.'],
            ]
        },
        '查干湖 (Chaganhu)': {
            price: '~$400M USD per vessel',
            title: '查干湖 (Chaganhu) — Type 901 AOR',
            rows: [
                ['Class', 'Type 901 Replenishment Ship'],
                ['Displacement', '45,000 tons'],
                ['Role', 'Underway replenishment'],
                ['CSIS assessment', 'Combat logistics force. Extends the operational range of the entire SAG. Sinking this ship forces PLAN surface combatants to return to port for fuel and ammunition — significantly degrading sortie rates and operational tempo.'],
            ]
        },
        // Additional US vessels
        'CG-67 Shiloh': {
            price: '~$1.2B USD per vessel',
            title: 'USS Shiloh (CG-67)',
            rows: [
                ['Class', 'Ticonderoga-class cruiser'],
                ['Displacement', '9,800 tons'],
                ['Missiles', '122-cell VLS: SM-2/SM-3/SM-6, Tomahawk'],
                ['Role', 'Area air defense, BMD'],
                ['CSIS assessment', 'Primary BMD platform in the CSG. SM-3 Block IIA is the main intercept weapon against PLAN ballistic missiles. Two Ticonderogas provide overlapping coverage that significantly complicates PLA strike planning.'],
            ]
        },
        'CG-73 Port Royal': {
            price: '~$1.2B USD per vessel',
            title: 'USS Port Royal (CG-73)',
            rows: [
                ['Class', 'Ticonderoga-class cruiser'],
                ['Displacement', '9,800 tons'],
                ['Missiles', '122-cell VLS: SM-2/SM-3/SM-6, Tomahawk'],
                ['Role', 'Area air defense, Tomahawk strike'],
                ['CSIS assessment', 'Second Ticonderoga provides redundant BMD coverage. Combined VLS capacity of both cruisers gives the CSG over 200 strike-length cells. Key CSIS finding: these ships are priority DF-21D targets because losing BMD capability exposes the carrier.'],
            ]
        },
        'DDG-110 William Lawrence': {
            price: '~$1.8B USD per vessel',
            title: 'USS William P. Lawrence (DDG-110)',
            rows: [
                ['Class', 'Arleigh Burke Flight IIA'],
                ['Displacement', '9,200 tons'],
                ['Missiles', 'SM-2/SM-6, Tomahawk, Harpoon'],
                ['Role', 'ASW screen, surface strike'],
                ['CSIS assessment', 'Third destroyer in the screen. CSIS wargames show that saturation attacks by PLAN require all four destroyers fully operational to maintain the CSG AAW umbrella. First destroyer loss significantly degrades group survivability.'],
            ]
        },
        'DDG-71 Ross': {
            price: '~$1.8B USD per vessel',
            title: 'USS Ross (DDG-71)',
            rows: [
                ['Class', 'Arleigh Burke Flight I'],
                ['Displacement', '8,900 tons'],
                ['Missiles', 'SM-2/SM-6, Tomahawk, Harpoon'],
                ['Role', 'Forward ASW screen'],
                ['CSIS assessment', 'Outer screen destroyer — furthest forward position in the CSG formation. Most likely first US ship to detect and engage PLAN submarines. Also most exposed to PLAN anti-ship missiles.'],
            ]
        },
        'SSN-21 Seawolf': {
            price: '~$3.0B USD per vessel',
            title: 'USS Seawolf (SSN-21)',
            rows: [
                ['Class', 'Seawolf-class SSN'],
                ['Displacement', '9,100 tons submerged'],
                ['Weapons', '8 torpedo tubes, Mk 48, Tomahawk, Harpoon'],
                ['Speed', '35+ knots submerged'],
                ['CSIS assessment', 'Fastest and most capable US attack submarine. Designed specifically for contested near-shore environments against sophisticated adversaries. CSIS identifies Seawolf-class as decisive in early submarine vs surface exchanges. PLAN has no equivalent.'],
            ]
        },
        'T-AKE Lewis Puller': {
            price: '~$500M USD per vessel',
            title: 'USS Lewis B. Puller (ESB-3)',
            rows: [
                ['Class', 'Lewis B. Puller-class ESB'],
                ['Displacement', '78,000 tons'],
                ['Role', 'Expeditionary sea base, logistics'],
                ['CSIS assessment', 'Combat logistics and special operations support. Provides the CSG with extended operational endurance. CSIS notes that targeting logistics ships is a key PLAN strategy to degrade US operational tempo without engaging combat vessels directly.'],
            ]
        },
        // JAPAN DDG SQUADRON
        'DDG-107 Gravely': {
            price: '~$1.8B USD per vessel',
            title: 'USS Gravely (DDG-107)',
            rows: [
                ['Class', 'Arleigh Burke Flight IIA'],
                ['Displacement', '9,200 tons'],
                ['Missiles', 'SM-2/SM-6, Tomahawk'],
                ['Role', 'Japan-based forward screen'],
                ['CSIS assessment', 'One of two US destroyers forward-deployed to Japan (Yokosuka). With Japan basing authorized, joins the CSG within 24 hours. CSIS identifies Japan-based destroyers as the fastest-response US naval asset in the scenario.'],
            ]
        },
        'DDG-85 McCampbell': {
            price: '~$1.8B USD per vessel',
            title: 'USS McCampbell (DDG-85)',
            rows: [
                ['Class', 'Arleigh Burke Flight IIA'],
                ['Displacement', '9,200 tons'],
                ['Missiles', 'SM-2/SM-6, Tomahawk'],
                ['Role', 'Japan-based ASW screen'],
                ['CSIS assessment', 'Second Japan-based destroyer. Together with Gravely, these ships can be on station within 24 hours of Japan basing authorization — significantly earlier than Guam-based assets. Key CSIS variable: Japan political decision is the bottleneck, not ship readiness.'],
            ]
        },
        'JS Atago DDH-177': {
            price: '~$1.5B USD per vessel',
            title: 'JS Atago (DDH-177) — JMSDF',
            rows: [
                ['Class', 'Atago-class guided missile destroyer'],
                ['Displacement', '10,000 tons'],
                ['Missiles', 'SM-3 Block IIA (BMD), SM-2, ASROC'],
                ['Role', 'BMD, area air defense'],
                ['CSIS assessment', 'Japan Maritime Self-Defense Force Aegis destroyer. One of only a handful of non-US ships with SM-3 BMD capability. CSIS notes JMSDF participation would be politically significant and militarily meaningful — adding BMD capacity outside the US chain of command.'],
            ]
        },
    };

    // CSIS enemy jet/transport info
    var JET_INFO = {
        'J-16': {
            title: 'J-16 Strike Fighter',
            rows: [
                ['Cost', '~$70M USD'],
                ['Speed', 'Mach 2.0'],
                ['Role', 'Air superiority + strike'],
                ['Weapons', 'PL-15 BVR AAM, PL-10 WVR, LS-6 glide bombs'],
                ['ECM', 'KG600 jamming pod'],
                ['CSIS assessment', 'Primary PLAAF strike platform in Taiwan scenario. 200+ in service. Operates in packages of 4-8. ECM pod degrades XRST sensor confidence. PL-15 missile is a critical threat to any airborne asset.'],
            ]
        },
        'J-20': {
            title: 'J-20 Stealth Fighter',
            rows: [
                ['Cost', '~$110M USD'],
                ['Speed', 'Mach 2.0+'],
                ['Role', 'Stealth strike, SEAD'],
                ['Weapons', 'PL-15 (internal bay), PL-10'],
                ['Stealth', 'Low-observable, internal carriage'],
                ['CSIS assessment', 'Most capable PLAAF fighter. ~100 operational. Used for high-value suppression missions and penetrating defended airspace. Carries 4 flare sets. Roadrunner is the only system that can reliably intercept.'],
            ]
        },
    };

    var TRANSPORT_INFO = {
        title: 'PLAN Amphibious Landing Ship',
        rows: [
            ['Types', 'Type 071 LPD / Type 075 LHD'],
            ['Capacity', '500-1,000 troops + vehicles + LCACs'],
            ['Role', 'Amphibious assault on Taiwan beaches'],
            ['Speed', '18-25 knots'],
            ['CSIS assessment', 'CSIS wargames show amphibious assault is the riskiest phase for PLAN. Each landing ship sunk by ROC/US forces degrades the invasion timeline significantly. ROC Patrol Boats and HIMARS are primary counters.'],
        ]
    };

    function showTooltip(e, html, color) {
        const tt = document.getElementById('hoverTooltip');
        tt.style.borderColor = color || '#0f0';
        tt.innerHTML = html;
        tt.style.display = 'block';
        positionTooltip(e);
    }

    function hideTooltip() {
        document.getElementById('hoverTooltip').style.display = 'none';
    }

    function positionTooltip(e) {
        const tt = document.getElementById('hoverTooltip');
        const x = e.point ? e.point.x : e.clientX;
        const y = e.point ? e.point.y : e.clientY;
        const w = window.innerWidth;
        const h = window.innerHeight;
        const tw = 270;
        const th = 200;
        let left = x + 14;
        let top  = y - 10;
        if (left + tw > w - 20) left = x - tw - 14;
        if (top + th > h - 20) top  = h - th - 20;
        tt.style.left = left + 'px';
        tt.style.top  = top  + 'px';
    }

    function buildTooltipHTML(info, status, healthCurrent, healthMax) {
        let html = '';

        html += `<div class="tt-title">${info.title}</div>`;
        if (info.price) {
            html += `<div style="font-size:10px;color:#ffcc00;margin-bottom:4px;letter-spacing:1px;">💰 ${info.price}</div>`;
        }
        if (status) {
            const cls = status === 'SUNK' ? 'tt-status-sunk' : status === 'DAMAGED' ? 'tt-status-damage' : 'tt-status-alive';
            html += `<div class="tt-row"><span>STATUS</span><span class="${cls}">${status}</span></div>`;
        }
        if (healthCurrent !== undefined) {
            const pct = Math.round((healthCurrent / healthMax) * 100);
            const bar = '█'.repeat(Math.min(healthCurrent,12)) + '░'.repeat(Math.min(healthMax - healthCurrent,12));
            const cls = pct <= 33 ? 'tt-status-sunk' : pct <= 66 ? 'tt-status-damage' : 'tt-status-alive';
            html += `<div class="tt-row"><span>INTEGRITY</span><span class="${cls}">${bar} ${pct}%</span></div>`;
        }
        html += '<div class="tt-divider"></div>';
        info.rows.forEach(([label, val]) => {
            html += `<div class="tt-row"><span>${label}</span><span>${val}</span></div>`;
        });
        return html;
    }

    // ============================================================
    // NAVAL BATTLE SYSTEM
    // US CSG vs PLAN SAG in Philippine Sea / Taiwan Strait
    // Based on CSIS wargame findings — Japan basing is the
    // single largest variable in US naval effectiveness
    // ============================================================

    function initNavalBattle(japanBasing) {
        navalBattleActive = true;
        navalEngagementTs = Date.now() + 20000;

        // Reset all ships
        const allShips = [...PLAN_SAG, ...US_CSG, ...JAPAN_DDG_SQUADRON];
        allShips.forEach(s => {
            s.alive = true; s.health = s.maxHealth; s.sunkBy = null; s.sunkTs = 0; s.damageLog = [];
        });
        navalPlanKills = 0; navalUskills = 0; carrierStrikeDegraded = false;

        const csgStartLng = japanBasing ? base.lng + 1.8 : base.lng + 5.5;

        // PLAN SAG — strait and approaches, staggered formation
        const planOffsets = [
            [1.0,-1.2],[0.6,-1.5],[0.3,-1.0],[0.0,-1.3],  // 055s, 052Ds
            [0.8,-0.9],[0.2,-0.8],                          // 054A frigates
            [1.2,-1.0],[0.4,-1.6],                          // subs (forward)
            [1.3,-0.6],[0.9,-0.5],[1.5,-0.7],              // amphibious (back)
            [0.7,-0.4],                                     // replenishment
        ];
        PLAN_SAG.forEach((s, i) => {
            const [dlat, dlng] = planOffsets[i] || [0.5 + i*0.1, -1.0];
            s.lat = base.lat + dlat; s.lng = base.lng + dlng;
            s.heading = Math.atan2(base.lat - s.lat, base.lng - s.lng);
        });

        // US CSG — Philippine Sea east, spread formation
        const csgOffsets = [
            [0.0, 0.2],[0.5, 0.0],[-0.5, 0.1],            // CVN, CGs
            [0.8,-0.1],[0.3,-0.2],[-0.3,-0.1],[-0.7, 0.0], // DDGs
            [0.2,-0.3],[-0.2,-0.4],                         // SSNs (ahead)
            [-0.1, 0.4],                                     // replenishment
        ];
        US_CSG.forEach((s, i) => {
            const [dlat, dlng] = csgOffsets[i] || [0, 0];
            s.lat = base.lat + dlat; s.lng = csgStartLng + dlng;
            s.heading = Math.atan2(base.lat - s.lat, base.lng - s.lng);
        });

        // Japan ON — add Okinawa squadron from north
        if (japanBasing) {
            JAPAN_DDG_SQUADRON.forEach((s, i) => {
                s.alive = true; s.health = s.maxHealth; s.sunkBy = null; s.damageLog = [];
                s.lat = base.lat + 3.5 + i * 0.15;
                s.lng = base.lng + 1.2 + i * 0.1;
                s.heading = Math.atan2(base.lat - s.lat, base.lng - s.lng);
            });
        }

        const etaMsg = japanBasing ? 'CSG forward-deployed Philippine Sea — engagement Day 2' : 'CSG at Guam posture — closing, engagement Day 4-5';
        addKill(`<span style="color:#4499ff;font-weight:bold;">⚓ NAVAL OOB:</span> PLAN SAG (12 vessels) vs US CSG — CVN-73 George Washington (10 vessels${japanBasing ? ' + Okinawa DDG squadron' : ''}). ${etaMsg}.`);

        // Position squadrons on map edges — visible from Taipei view
        // PLAAF: stacked on west edge (Fujian coast side)
        PLAAF_OOB.forEach((sq, i) => {
            sq.lat = base.lat + 0.55 - (i * 0.22);
            sq.lng = base.lng - 1.10;
        });
        // US carrier squadrons: east edge, near CVN
        const cvnInit = US_CSG.find(s => s.id === 'CVN-73 George Washington');
        US_AIR_OOB.filter(sq => sq.fromCarrier).forEach((sq, i) => {
            sq.lat = base.lat + 0.30 - (i * 0.22);
            sq.lng = base.lng + 1.20;
        });
        // Japan-based: northeast edge
        US_AIR_OOB.filter(sq => sq.isJapanBased).forEach((sq, i) => {
            sq.lat = base.lat + 0.80 - (i * 0.20);
            sq.lng = base.lng + 1.35;
        });
        // Bombers: far east (Guam/continental)
        US_AIR_OOB.filter(sq => sq.isBomber).forEach((sq, i) => {
            sq.lat = base.lat - 0.40 - (i * 0.20);
            sq.lng = base.lng + 1.45;
        });
        if (japanBasing) {
            addKill(`<span style="color:#00aaff;font-weight:bold;">✈ AIR OOB:</span> PLAAF ~480 sorties vs US/Allied ~450 sorties. F-35 ops from Kadena and Misawa authorized.`);
        } else {
            addKill(`<span style="color:#00aaff;font-weight:bold;">✈ AIR OOB:</span> PLAAF ~480 sorties vs US carrier air wing ~180 sorties. Japan-based F-35s standing down.`);
        }
        airBattleTs = Date.now() - AIR_ENGAGE_INTERVAL + 30000; // first air exchange in 30s
    }

    function sinkShip(ship, cause, attackerId) {
        ship.alive    = false;
        ship.sunkBy   = cause;
        ship.sunkTs   = Date.now();
        ship.sunkDay  = dayNumber;
        ship.killedBy = attackerId || 'unknown';
        if (PLAN_SAG.some(s => s.id === ship.id)) econKill(null, ship.type);
        spawnExplosion(ship.lat, ship.lng, false, true);
    }

    function updateAirBattle() {
        if (!navalBattleActive || !playing) return;
        const now = Date.now();
        if (now - airBattleTs < AIR_ENGAGE_INTERVAL) return;
        airBattleTs = now; // track last fired

        // Keep carrier squadrons near CVN on the map edge
        const cvn = US_CSG.find(s => s.id === 'CVN-73 George Washington');
        US_AIR_OOB.filter(sq => sq.fromCarrier).forEach((sq, i) => {
            // Anchor near right edge regardless of CVN position — keeps them visible
            sq.lng = base.lng + 1.20;
            sq.lat = base.lat + 0.30 - (i * 0.22);
        });

        // Active PLAAF and US squadrons
        const plaafActive = PLAAF_OOB.filter(sq => sq.alive && sq.sorties > 0);
        const usActive    = US_AIR_OOB.filter(sq => sq.alive && sq.sorties > 0 &&
            (!sq.isJapanBased || japanBasingEnabled) &&
            (!sq.fromCarrier  || (cvn && cvn.alive)));

        if (plaafActive.length === 0 || usActive.length === 0) return;

        // Pick random attacker/defender pairs
        const plaAttacker = plaafActive[Math.floor(Math.random() * plaafActive.length)];
        const usDefender  = usActive[Math.floor(Math.random() * usActive.length)];

        // Exchange rates based on aircraft type matchups — CSIS derived
        // EA-18G jamming degrades PLAAF missile effectiveness
        const jammerActive = US_AIR_OOB.some(sq => sq.isJammer && sq.alive && sq.sorties > 0 &&
            (!sq.fromCarrier || (cvn && cvn.alive)));
        const plaHitChance = jammerActive ? 0.25 : 0.40;
        const usHitChance  = usDefender.type === 'F-35A' || usDefender.type === 'F-35B' ? 0.55
                           : usDefender.type === 'B-21' || usDefender.type === 'B-2'    ? 0.70
                           : 0.45;

        let msg = '';

        // PLAAF strikes US squadron
        plaAttacker.sorties = Math.max(0, plaAttacker.sorties - 2);
        if (Math.random() < plaHitChance) {
            const usLoss = Math.floor(Math.random() * 2) + 1;
            usDefender.losses  += usLoss;
            usDefender.sorties  = Math.max(0, usDefender.sorties - usLoss);
            if (usDefender.sorties <= 0) { usDefender.alive = false; }
            msg += `<span style="color:#ff4444">${plaAttacker.id} (${plaAttacker.type}): ${usLoss} ${usDefender.type} lost from ${usDefender.id}.</span> `;
        } else {
            msg += `<span style="color:#ffcc00">${plaAttacker.id} intercept — ${usDefender.id} ${jammerActive ? 'jamming effective' : 'evaded'}.</span> `;
        }

        // US strikes PLAAF
        usDefender.sorties = Math.max(0, usDefender.sorties - 2);
        if (Math.random() < usHitChance) {
            const plaLoss = Math.floor(Math.random() * 2) + 1;
            plaAttacker.losses  += plaLoss;
            plaAttacker.sorties  = Math.max(0, plaAttacker.sorties - plaLoss);
            if (plaAttacker.sorties <= 0) { plaAttacker.alive = false; }
            msg += `<span style="color:#4499ff">${usDefender.id} (${usDefender.type}): ${plaLoss} ${plaAttacker.type} destroyed from ${plaAttacker.id}.</span>`;
        } else {
            msg += `<span style="color:#ffcc00">${usDefender.id} — PLAAF evaded.</span>`;
        }

        if (msg) addKill(`<span style="color:#00aaff;font-weight:bold;">✈ AIR BATTLE:</span> ${msg}`);

        // Spawn brief flyover icons across the strait
        spawnCombatFlyover(plaAttacker, usDefender);
    }

    function spawnCombatFlyover(plaSquad, usSquad) {
        const now = Date.now();
        // PLAAF jets fly east toward Taiwan, US jets fly west
        const numPLA = Math.min(4, Math.max(1, Math.floor(plaSquad.sorties / 30)));
        const numUS  = Math.min(4, Math.max(1, Math.floor(usSquad.sorties  / 25)));

        for (let i = 0; i < numPLA; i++) {
            combatAircraft.push({
                id: `ca-${now}-pla-${i}`,
                lat: base.lat + (Math.random()-0.5) * 0.8,
                lng: base.lng - 0.90 + Math.random() * 0.15,
                dlng: 0.0025,
                dlat: (Math.random()-0.5) * 0.0005,
                icon: '▶',   // eastbound arrow
                color: plaSquad.color || '#ff4444',
                bearing: 0,
                expiresTs: now + 8000,
                type: 'pla'
            });
        }
        for (let i = 0; i < numUS; i++) {
            combatAircraft.push({
                id: `ca-${now}-us-${i}`,
                lat: base.lat + (Math.random()-0.5) * 0.8,
                lng: base.lng + 1.10 - Math.random() * 0.15,
                dlng: -0.0025,
                dlat: (Math.random()-0.5) * 0.0005,
                icon: '◀',   // westbound arrow
                color: usSquad.color || '#4499ff',
                bearing: 0,
                expiresTs: now + 8000,
                type: 'us'
            });
        }
    }

    function updateNavalBattle() {
        if (!navalBattleActive || !playing) return;
        const now = Date.now();

        const allUS   = [...US_CSG, ...(japanBasingEnabled ? JAPAN_DDG_SQUADRON : [])];
        const planAlive = PLAN_SAG.filter(s => s.alive);
        const usAlive   = allUS.filter(s => s.alive);
        if (planAlive.length === 0 || usAlive.length === 0) return;

        // Move PLAN toward Taiwan
        planAlive.forEach(s => {
            if (!s.isAmph && s.lng > base.lng - 0.4) {
                s.lng += Math.cos(s.heading) * s.speed;
                s.lat += Math.sin(s.heading) * s.speed;
            } else if (s.isAmph && s.lng > base.lng - 0.15) {
                s.lng += Math.cos(s.heading) * s.speed * 0.5;
                s.lat += Math.sin(s.heading) * s.speed * 0.5;
            }
        });

        // US closes on PLAN
        const planCLng = planAlive.reduce((a,s)=>a+s.lng,0)/planAlive.length;
        const planCLat = planAlive.reduce((a,s)=>a+s.lat,0)/planAlive.length;
        usAlive.forEach(s => {
            const a = Math.atan2(planCLat-s.lat, planCLng-s.lng);
            s.heading = a;
            if (Math.hypot(planCLng-s.lng, planCLat-s.lat) > 1.0) {
                s.lng += Math.cos(a) * s.speed;
                s.lat += Math.sin(a) * s.speed;
            }
        });

        if (now < navalEngagementTs) return;
        navalEngagementTs = now + NAVAL_ENGAGE_INTERVAL;

        const plan = PLAN_SAG.filter(s => s.alive);
        const csg  = allUS.filter(s => s.alive);
        if (!plan.length || !csg.length) return;

        const cvn  = csg.find(s => s.isCVN) || csg[0];
        const dist = Math.hypot(planCLng - cvn.lng, planCLat - cvn.lat);

        if (dist > 2.8) {
            addKill(`<span style="color:#4499ff;">⚓ NAVAL:</span> Forces closing. CSG distance to PLAN: ${dist.toFixed(1)}°`);
            return;
        }

        let usMsg = '', planMsg = '';

        // ── US STRIKES ───────────────────────────────────────────
        // SSNs fire torpedoes — prioritize amphibious ships
        csg.filter(s => s.isSub && s.alive).forEach(sub => {
            if (Math.random() < 0.40) {
                const amphTargets = plan.filter(s => s.isAmph);
                const target = amphTargets.length > 0 && Math.random() < 0.6
                    ? amphTargets[Math.floor(Math.random()*amphTargets.length)]
                    : plan[Math.floor(Math.random()*plan.length)];
                const dmg = sub.type.includes('Seawolf') ? 2 : 1;
                target.health -= dmg;
                target.damageLog.push(`Mk48 torpedo from ${sub.id}`);
                usMsg += `${sub.id} torpedo on ${target.id}. `;
                if (target.health <= 0 && target.alive) {
                    sinkShip(target, `Mk48 ADCAP torpedo from ${sub.id}`, sub.id);
                    navalPlanKills++;
                    usMsg += `<span style="color:#00ffcc;font-weight:bold;">${target.id} SUNK.</span> `;
                    navalApplyEffects();
                }
            }
        });

        // CGs fire SM-6 / Tomahawk at surface targets
        // Check VLS pool — if empty CSG can only defend, not strike
        if (csgVlsPool <= 0 && !csgWithdrawn) {
            csgWithdrawn = true;
            csgWithdrawTs = Date.now();
            addKill(`<span style="color:#ff9900;font-weight:bold;">⚓ CSG WITHDRAWAL:</span> Strike group VLS depleted (~380 missiles expended). Withdrawing to Guam for 72hr reload. Carrier air wing still operational.`);
            speak('Carrier strike group withdrawing. VLS depleted.', 1);
        }
        if (csgWithdrawn) {
            const elapsed = Date.now() - csgWithdrawTs;
            const reloadDays = Math.ceil((CSG_WITHDRAW_DURATION - elapsed) / DAY_DURATION_MS);
            if (elapsed >= CSG_WITHDRAW_DURATION) {
                csgWithdrawn = false;
                csgVlsPool = CSG_RELOAD_VLS;
                addKill(`<span style="color:#4499ff;font-weight:bold;">⚓ CSG RETURN:</span> George Washington strike group returned from Guam. VLS reloaded — 380 cells operational.`);
                speak('Carrier strike group back on station. VLS reloaded.', 1);
            }
        }
        const csgCanStrike = !csgWithdrawn && csgVlsPool > 0;

        csg.filter(s => s.isCG && s.alive && s.missiles > 0).forEach(cg => {
            if (csgCanStrike && Math.random() < 0.35 && plan.filter(s=>s.alive).length > 0) {
                const target = plan.filter(s=>s.alive)[Math.floor(Math.random()*plan.filter(s=>s.alive).length)];
                cg.missiles -= 1;
                csgVlsPool  = Math.max(0, csgVlsPool - 1);
                target.health -= 1;
                target.damageLog.push(`Tomahawk LACM from ${cg.id}`);
                if (target.health <= 0 && target.alive) {
                    sinkShip(target, `Tomahawk strike from ${cg.id}`, cg.id);
                    navalPlanKills++;
                    usMsg += `<span style="color:#5588ff;font-weight:bold;">${target.id} SUNK.</span> `;
                    navalApplyEffects();
                }
            }
        });

        // DDGs fire Harpoon / SM-6
        csg.filter(s => !s.isCVN && !s.isSub && !s.isCG && s.alive && s.missiles > 0).forEach(ddg => {
            if (csgCanStrike && Math.random() < 0.25 && plan.filter(s=>s.alive).length > 0) {
                const target = plan.filter(s=>s.alive)[Math.floor(Math.random()*plan.filter(s=>s.alive).length)];
                ddg.missiles--;
                csgVlsPool = Math.max(0, csgVlsPool - 1);
                target.health -= 1;
                target.damageLog.push(`Harpoon AShM from ${ddg.id}`);
                if (target.health <= 0 && target.alive) {
                    const weapon = ddg.isJMSDF ? 'Type 90 AShM' : 'Harpoon Block II';
                    sinkShip(target, `${weapon} from ${ddg.id}`, ddg.id);
                    navalPlanKills++;
                    usMsg += `<span style="color:#6699ff;font-weight:bold;">${target.id} SUNK.</span> `;
                    navalApplyEffects();
                }
            }
        });

        if (usMsg) addKill(`<span style="color:#4499ff;font-weight:bold;">⚓ US STRIKE:</span> ${usMsg}PLAN: ${plan.filter(s=>s.alive).length} ships.`);

        // ── PLAN STRIKES ─────────────────────────────────────────
        // DF-21D vs carrier if Japan basing
        if (japanBasingEnabled && cvn.alive && Math.random() < 0.30) {
            const intercepted = Math.random() < 0.55;
            if (!intercepted) {
                const cg = csg.find(s => s.isCG && s.alive);
                const interceptor = cg ? cg.id : 'SM-3 battery';
                cvn.health -= 2;
                cvn.damageLog.push('DF-21D impact');
                planMsg += `<span style="color:#ff4444;">DF-21D impact — CVN-73. Integrity ${Math.round(cvn.health/cvn.maxHealth*100)}%.</span> `;
                if (cvn.health <= 0) {
                    sinkShip(cvn, 'DF-21D ballistic anti-ship missile (ASBM) — overwhelmed SM-3 defense', '东风-21D');
                    navalUskills++; carrierStrikeDegraded = true;
                    planMsg += `<span style="color:#ff4444;font-weight:bold;">CVN-73 SUNK. Carrier strike DISABLED.</span> `;
                    const cb = document.getElementById('carrierBtn');
                    if (cb) { cb.disabled = true; cb.style.opacity = '0.3'; }
                }
            } else {
                const cg = csg.find(s => s.isCG && s.alive);
                planMsg += `<span style="color:#ffcc00;">DF-21D intercepted by ${cg ? cg.id : 'SM-3'}.</span> `;
            }
        }

        // YJ-18 AShM vs US surface ships — subs first
        const planShooters = plan.filter(s => s.alive && s.missiles > 0 && !s.isAmph);
        csg.filter(s => !s.isCVN && !s.isSub && s.alive).forEach(ship => {
            if (Math.random() < 0.30 && planShooters.length > 0) {
                const shooter = planShooters[Math.floor(Math.random()*planShooters.length)];
                shooter.missiles -= 2;
                ship.health -= 1;
                ship.damageLog.push(`YJ-18 from ${shooter.id}`);
                if (ship.health <= 0) {
                    sinkShip(ship, `YJ-18 anti-ship missile from ${shooter.id}`, shooter.id);
                    navalUskills++;
                    planMsg += `<span style="color:#ff4444;font-weight:bold;">${ship.id} SUNK.</span> `;
                } else {
                    planMsg += `${ship.id} hit (${ship.health}hp). `;
                }
            }
        });

        // PLAN subs vs US subs
        const planSubs = PLAN_SAG.filter(s => s.isSub && s.alive);
        const usSubs   = csg.filter(s => s.isSub && s.alive);
        if (planSubs.length && usSubs.length && Math.random() < 0.15) {
            const pSub = planSubs[Math.floor(Math.random()*planSubs.length)];
            const uSub = usSubs[Math.floor(Math.random()*usSubs.length)];
            uSub.health -= 1;
            uSub.damageLog.push(`Yu-6 torpedo from ${pSub.id}`);
            if (uSub.health <= 0) {
                sinkShip(uSub, `Yu-6 torpedo from PLAN ${pSub.id} — undersea engagement`, pSub.id);
                navalUskills++;
                planMsg += `<span style="color:#ff4444;font-weight:bold;">${uSub.id} SUNK — undersea engagement.</span> `;
            }
            // US sub fires back
            pSub.health -= 2;
            pSub.damageLog.push(`Mk48 from ${uSub.id}`);
            if (pSub.health <= 0 && pSub.alive) {
                sinkShip(pSub, `Mk48 torpedo from ${uSub.id} — undersea engagement`, uSub.id);
                navalPlanKills++;
                usMsg += `<span style="color:#00ffcc;font-weight:bold;">${pSub.id} SUNK — undersea duel.</span> `;
                navalApplyEffects();
            }
        }

        if (planMsg) addKill(`<span style="color:#ff4444;font-weight:bold;">⚓ PLAN STRIKE:</span> ${planMsg}US ships: ${csg.filter(s=>s.alive).length}.`);
        if (navalPlanKills > 0 || navalUskills > 0) speak(`Naval exchange. PLAN losses ${navalPlanKills}. US losses ${navalUskills}.`, 1);

        // PLA retaliation against Japan DDG squadron when Japan basing ON
        if (japanBasingEnabled && JAPAN_DDG_SQUADRON.some(s => s.alive)) {
            if (now - japanRetaliationTs > 90000 && Math.random() < 0.55) {
                japanRetaliationTs = now;
                japanRetaliationCount++;
                const aliveJapan = JAPAN_DDG_SQUADRON.filter(s => s.alive);
                const target = aliveJapan[Math.floor(Math.random() * aliveJapan.length)];
                const weapons = ['DF-21D salvo', 'YJ-12 AShM wave', 'CJ-10 LACM strike', 'DF-17 hypersonic'];
                const weapon  = weapons[Math.floor(Math.random() * weapons.length)];
                const blocked = Math.random() < 0.45;
                if (!blocked) {
                    const dmg = Math.floor(Math.random() * 2) + 1;
                    target.health -= dmg;
                    target.damageLog.push(`${weapon} — PLA Japan retaliation`);
                    if (target.health <= 0 && target.alive) {
                        sinkShip(target, `${weapon} — PLA retaliation for Japan basing`, 'PLARF');
                        const japanLost = JAPAN_DDG_SQUADRON.filter(s => !s.alive).length;
                        addKill(`<span style="color:#ff4444;font-weight:bold;">⚓ JAPAN DDG SUNK:</span> ${target.id} destroyed by ${weapon}. PLA directly retaliating for Japan basing authorization.`);
                        speak(`${target.id} lost. Japan under attack.`, 1);
                        if (japanLost >= 2) {
                            addKill(`<span style="color:#ffcc00;font-weight:bold;">⚠ POLITICAL WARNING:</span> ${japanLost} Japan-based assets destroyed. Tokyo facing domestic pressure. CSIS: Japanese basing participation degrades under sustained retaliation.`);
                        }
                    } else {
                        addKill(`<span style="color:#ff9900;font-weight:bold;">⚓ JAPAN RETALIATION:</span> PLAN ${weapon} hit ${target.id}. ${Math.round(target.health/target.maxHealth*100)}% integrity. PLA targeting Japan bases.`);
                    }
                } else {
                    addKill(`<span style="color:#ffcc00;">⚓ JAPAN DDG:</span> ${target.id} SM-3 intercepted PLAN ${weapon}. Japan under direct attack — political cost escalating.`);
                }
            }
        }
    }

    function navalApplyEffects() {
        // Each PLAN ship sunk reduces landing ship spawns and wave size
        addKill(`<span style="color:#00ffcc;font-weight:bold;">⚓ NAVAL EFFECT:</span> PLAN surface losses degrading amphibious capacity. ${navalPlanKills} ship${navalPlanKills>1?'s':''} sunk — landing ship spawns reduced, wave pressure decreasing.`);
    }

    function updateMarketIndex() {
        // Base decay: each day of war = -1.2 points (conflict uncertainty)
        globalMarketIndex = Math.max(0, globalMarketIndex - 1.2);
        gdpLostTrillions += 0.8; // ~$0.8T per day of conflict (CSIS estimate)

        // Hsinchu/TSMC threat multiplier
        const hsinchu = LANDING_ZONES.find(z => z.id === 'LZ-ECHO');
        if (hsinchu) {
            if (hsinchu.status === 'CONTESTED') {
                tsmcThreatLevel = 3;
                globalMarketIndex = Math.max(0, globalMarketIndex - 4.5);
                gdpLostTrillions += 3.2; // TSMC disruption = massive semiconductor supply shock
            } else if (hsinchu.status === 'APPROACH') {
                tsmcThreatLevel = 2;
                globalMarketIndex = Math.max(0, globalMarketIndex - 2.5);
                gdpLostTrillions += 1.8;
            } else if (hsinchu.dayActivated <= dayNumber) {
                tsmcThreatLevel = 1;
                globalMarketIndex = Math.max(0, globalMarketIndex - 1.0);
                gdpLostTrillions += 0.6;
            }
        }

        // Amphibious landings accelerate market crash
        const troopsTotal = LANDING_ZONES.reduce((s, z) => s + z.troopsLanded, 0);
        if (troopsTotal > 5000)  { globalMarketIndex = Math.max(0, globalMarketIndex - 3.0); gdpLostTrillions += 2.0; }
        if (troopsTotal > 20000) { globalMarketIndex = Math.max(0, globalMarketIndex - 5.0); gdpLostTrillions += 4.0; }

        // Update HUD
        const el = document.getElementById('statMarket');
        if (el) {
            el.textContent = globalMarketIndex.toFixed(1);
            el.style.color = globalMarketIndex > 70 ? '#00ffaa'
                           : globalMarketIndex > 40 ? '#ff9900'
                           : '#ff4444';
        }

        // Killfeed market update
        const crash = (100 - globalMarketIndex).toFixed(1);
        const tsmcNote = tsmcThreatLevel === 3 ? ' TSMC CONTESTED — semiconductor supply chain collapsing.' :
                         tsmcThreatLevel === 2 ? ' PLA approaching Hsinchu — TSMC at risk.' : '';
        addKill(`<span style="color:${globalMarketIndex > 70 ? '#ff9900' : '#ff4444'};font-weight:bold;">📉 MARKETS:</span> Global index ${globalMarketIndex.toFixed(1)} (−${crash}%). Est. GDP loss: $${gdpLostTrillions.toFixed(1)}T.${tsmcNote}`);

        if (tsmcThreatLevel >= 2 && globalMarketIndex < 60) {
            addKill(`<span style="color:#ff4444;font-weight:bold;">⚠ ECONOMIC WARNING:</span> TSMC produces 90% of the world's advanced chips. Disruption triggers supply shock across automotive, defense, consumer electronics. CSIS: "Taiwan survives, but the global economy is in ruins."`);
        }
    }

    function advanceDay() {
                econSnapshotDay();
                updateMarketIndex();
                dayElapsed = 0;
                dayNumber++;
                dayStartTs = Date.now();
                wallClockTriggered = false;
                if (lastDayBannerDay !== dayNumber) {
                    lastDayBannerDay = dayNumber;
                    const timeOfDay = ['Dawn', 'Morning', 'Midday', 'Afternoon', 'Dusk', 'Night'][Math.floor(Math.random() * 6)];
                    addKill(`<span style="color:#00ffff;font-weight:bold;">═══ DAY ${dayNumber} — ${timeOfDay.toUpperCase()} ═══</span> PLA operations continue.`);
                    speak(`Day ${dayNumber}.`, 1);
                    document.getElementById('wn').textContent = dayNumber;
                }

                // ── US RESUPPLY ──────────────────────────────────────────────
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

                if (dayNumber === 2 && hualienDegraded) {
                    addKill(`<span style="color:#ff4444;">⚠ HUALIEN STATUS:</span> Air base remains degraded. F-16V sortie capacity halved.`);
                }

                showSupportModal(dayNumber - 1);
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
        econSpend('altius', deployCount);
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
        econSpend('anvil', anvilDeployCount);
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
        econSpend('roadrunner', rrCount);
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
        econSpend('f16v', 2);
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
        const autoLatencyMs = infraDegraded >= 1 ? 3000 : 1000; // C2 hit = 3s lag
        if (now - autoLastAssignTs < autoLatencyMs) return;
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

        // Auto-Fury if loiterers present or saturation >= 6 and not already airborne
        if (furyReady && furySquad.length === 0 && (scored.some(s => s.e.isLoitererUnit) || scored.length >= 6)) {
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

        const { loLat, hiLat, loLng, hiLng } = ADSB_BOUNDS;
        const lat = (loLat + hiLat) / 2;
        const lon = (loLng + hiLng) / 2;

        // api.adsb.lol went offline — replaced with live alternatives
        // Both return identical ADSBExchange v2 format (same ac[] structure)
        // airplanes.live: primary — large feeder network, no auth, CORS open
        // adsb.one: fallback — independent infrastructure, same format
        const sources = [
            `https://api.airplanes.live/v2/lat/${lat}/lon/${lon}/dist/200`,
            `https://api.adsb.one/v2/lat/${lat}/lon/${lon}/dist/200`,
        ];

        for (const url of sources) {
            try {
                const res = await fetch(url);
                if (!res.ok) continue;
                const data = await res.json();
                if (!data || !data.ac) continue;
                adsbAircraft = data.ac
                    .filter(a => a.lat && a.lon &&
                        a.lat >= loLat && a.lat <= hiLat &&
                        a.lon >= loLng && a.lon <= hiLng &&
                        !a.gnd)  // airborne only
                    .map(a => ({
                        icao:     a.hex || '',
                        callsign: (a.flight || a.hex || '').trim(),
                        lng:      a.lon,
                        lat:      a.lat,
                        alt:      a.alt_baro ? Math.round(a.alt_baro * 0.3048) : null, // ft to meters
                        heading:  a.track || 0,
                        onGround: !!a.gnd
                    }));
                return; // success — stop trying sources
            } catch (e) {
                // try next source
            }
        }
        // all sources failed — leave adsbAircraft stale rather than blanking the map
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
                recs.push({ score: s, html: `<span style="color:#00ffff;font-weight:bold;">⚡ EMP LAST RESORT:</span> Presidential Office integrity critical. ${warning} Use only if overwhelmed.` });
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

        // FURY — only recommend when ready AND not already airborne
        if (furyReady && furySquad.length === 0 && INVENTORY.f16v.remaining > 0) {
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
