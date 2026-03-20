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
            btn.textContent = 'LINK COMPROMISED';
            btn.classList.add('active');
            overlay.style.display = 'block';
            body.classList.add('jammed-fx');
            speak("Warning. Electronic Counter Measures detected. Spectrum denied.", 2);
            addKill('<span style="color:#f00;font-weight:bold;">ALERT:</span> SPECTRUM DENIAL DETECTED.');
        } else {
            btn.textContent = 'SIMULATE JAMMING';
            btn.classList.remove('active');
            overlay.style.display = 'none';
            body.classList.remove('jammed-fx');
            speak("Spectrum clear. Link restored.", 1);
            addKill('<span style="color:#0f0;font-weight:bold;">SYSTEM:</span> SPECTRUM RESTORED.');
        }
    }
    document.getElementById('jamBtn').onclick = toggleJamming;

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

        // Wake up any RTB drones — new wave means new targets
        altiusSquad.forEach(d => { if (d.alive && d.logisticsState === 'RTB') d.logisticsState = 'ACTIVE'; });
        anvilSquad.forEach(d  => { if (d.alive && d.logisticsState === 'RTB') d.logisticsState = 'ACTIVE'; });

        const baseCount  = Math.floor(Math.random() * 8) + 7;
        const escalation = (waveNumber - 1) * ENEMY_INCREASE_PER_WAVE;
        const total      = baseCount + escalation;
        let fpv       = 0;  // FPV kamikaze swarm drones (PACKET)
        let loiterers = 0;  // TB-001 loitering munitions (LOITERER)
        let ch4       = 0;  // CH-4/CH-5 strike drones (TRACK)

        for (let i = 0; i < total; i++) {
            let type    = 'CH-4';
            const r     = Math.random();
            const pProb = 0.22 + (waveNumber * 0.025);  // FPV swarms grow fast
            const lProb = 0.08 + (waveNumber * 0.012);  // loiterers appear mid-game

            if (waveNumber >= 2 && r < pProb) {
                type = 'FPV';
                fpv++;
            } else if (waveNumber >= 4 && r < lProb) {
                type = 'TB-001';
                loiterers++;
            } else {
                ch4++;
            }

            const isP  = type === 'FPV';
            const isL  = type === 'TB-001';
            const speed = isP ? 0.0013 : isL ? 0.0003 : 0.0008;
            const d     = (0.040 + Math.random() * 0.010) * 3.0;

            // Altitude by Chinese threat type:
            //   FPV swarms    — nap-of-earth: 20–150m
            //   TB-001        — high loiter orbit: 800–4000m
            //   CH-4 strike   — medium ingress: 200–2500m
            let alt;
            if (isP)       alt = Math.floor(20  + Math.random() * 130);
            else if (isL)  alt = Math.floor(800 + Math.random() * 3200);
            else           alt = Math.floor(200 + Math.random() * 2300);

            enemies.push({
                id: nextId++,
                lat: base.lat + Math.sin(Math.random() * Math.PI * 2) * d,
                lng: base.lng + Math.cos(Math.random() * Math.PI * 2) * d,
                speed,
                alive: true,
                identified: false,
                engagedBy: undefined,
                isEngagementCounted: false,
                isKillStreakProcessed: false,
                isSwarmUnit: isP,
                isLoitererUnit: isL,
                type,
                alt
            });
        }

        // Spawn a fighter jet on wave JET_SPAWN_WAVE and every 3 waves after
        if (waveNumber >= JET_SPAWN_WAVE && (waveNumber - JET_SPAWN_WAVE) % 3 === 0) {
            spawnJet();
        }

        let summary = `${total} threats`;
        if (fpv       > 0) summary += ` (<span style="color:#ffcc00;">FPV: ${fpv}</span>)`;
        if (loiterers > 0) summary += ` (<span style="color:#00ff77;">TB-001: ${loiterers}</span>)`;
        if (ch4       > 0) summary += ` (<span style="color:#f00;">CH-4: ${ch4}</span>)`;

        const voice = waveNumber === 1
            ? `Initial contacts registered. Proceed to identify.`
            : `Wave ${waveNumber} inbound. ${loiterers > 0 ? 'Loitering munitions detected. ' : ''}${total} contacts. Identify and engage.`;

        addKill(`<span style="color:#f00;">WAVE ${waveNumber} INCOMING — ${summary}</span>`);
        if (!isTelemetryActive && !ttuActive) speak(voice, 1);

        document.getElementById('wn').textContent = waveNumber++;
        document.getElementById('wave').classList.add('active');
        setTimeout(() => document.getElementById('wave').classList.remove('active'), 3000);

        if (waveTimer) clearTimeout(waveTimer);
        waveTimer = setTimeout(spawnWave, 35000);
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
        const spawnD  = 0.30; // spawn far out
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
        altiusReady  = false;
        altiusLastTs = Date.now();
        document.getElementById('altiusBtn').disabled = true;

        const targets = enemies.filter(e => e.alive && e.isSwarmUnit);
        for (let i = 0; i < ALTIUS_COUNT; i++) {
            const angle = (i / ALTIUS_COUNT) * Math.PI * 2;
            altiusSquad.push({
                id: `ALTIUS-${String(nextId++).padStart(2,'0')}`,
                lat: base.lat + Math.sin(angle) * 0.003,
                lng: base.lng + Math.cos(angle) * 0.003,
                speed: ALTIUS_SPEED,
                targetType: 'swarm',
                alive: true,
                logisticsState: 'ACTIVE',  // ACTIVE = hunting, RTB = returning to base
                targetId: undefined
            });
        }
        
        addKill(`<span style="color:#00ffcc;font-weight:bold;">ALTIUS:</span> ${ALTIUS_COUNT} kamikaze drones deployed — targeting FPV swarms.`);
    }

    // ============================================================
    // ANVIL — heavier attrition drone
    // Targets CH-4 strike drones and TB-001 loiterers
    // ============================================================
    function launchAnvil() {
        if (!playing || !anvilReady) return;
        anvilReady  = false;
        anvilLastTs = Date.now();
        document.getElementById('anvilBtn').disabled = true;

        for (let i = 0; i < ANVIL_COUNT; i++) {
            const angle = (i / ANVIL_COUNT) * Math.PI * 2;
            anvilSquad.push({
                id: `ANVIL-${String(nextId++).padStart(2,'0')}`,
                lat: base.lat + Math.sin(angle) * 0.003,
                lng: base.lng + Math.cos(angle) * 0.003,
                speed: ANVIL_SPEED,
                targetType: 'strike',
                alive: true,
                logisticsState: 'ACTIVE',
                targetId: undefined
            });
        }
        
        addKill(`<span style="color:#cc44ff;font-weight:bold;">ANVIL:</span> ${ANVIL_COUNT} drones deployed — targeting strike drones and loiterers.`);
    }

    // ============================================================
    // ROADRUNNER DEPLOY — precision interceptor
    // Targets jets and jet missiles ONLY
    // ============================================================
    function launchRRDeploy() {
        if (!playing || !rrDeployReady) return;
        rrDeployReady  = false;
        rrDeployLastTs = Date.now();
        document.getElementById('rrDeployBtn').disabled = true;

        for (let i = 0; i < RR_DEPLOY_COUNT; i++) {
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
        
        addKill(`<span style="color:#00ffff;font-weight:bold;">ROADRUNNER:</span> ${RR_DEPLOY_COUNT} precision interceptors deployed — targeting jets and missiles.`);
    }

    // ============================================================
    // FURY AIR SUPPORT
    // ============================================================
    function launchFurySquad() {
        const n = Date.now();
        if (!playing || !furyReady) return;
        furyReady       = false;
        furyLastFiredTs = n;
        document.getElementById('furyBtn').disabled = true;

        const offsets = [-0.008, 0.008];
        offsets.forEach((offset, idx) => {
            furySquad.push({
                id: `FURY-${idx + 1}`,
                lat: base.lat - 0.08,
                lng: base.lng + offset,
                vx: 0,
                vy: FURY_SPEED,
                firedCount: 0,
                ammo: 10
            });
        });

        speak("Air support inbound. Fury squadron engaging.", 1);
        addKill('<span style="color:#00ffff;font-weight:bold;">AIR SUPPORT:</span> Fury Squadron Deployed.');
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

        // EMP — high density or close cluster
        if (empReady && !ttuActive) {
            let s = idx * 5;
            if (close.length >= 3) s += 50;
            if (s > 50) {
                recs.push({ score: s, html: '<span style="color:#00ffff;font-weight:bold;">⚡ EMP:</span> High threat density — area denial recommended.' });
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

        if (recs.length === 0) {
            document.getElementById('recommendationText').innerHTML = 'NO IMMEDIATE ACTION REQUIRED.';
        } else {
            // Join all recommendations with a divider between them
            document.getElementById('recommendationText').innerHTML =
                recs.map(r => r.html).join('<br><span style="color:#333;">───</span><br>');
        }
    }

    // ============================================================
    // MAIN UPDATE LOOP (runs every 250ms)
    // ============================================================
