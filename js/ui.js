// ============================================================
// ui.js — HUD updates, killfeed, speech, recommendations
// ============================================================

    function updateStatsBar() {
        const dronesAirborne = altiusSquad.filter(d => d.alive).length +
                               anvilSquad.filter(d => d.alive).length +
                               rrSquad.filter(d => d.alive).length;
        const aliveEnemies   = enemies.filter(e => e.alive).length +
                               enemyJets.filter(j => j.alive).length;
        document.getElementById('statWave').textContent    = playing ? (waveNumber - 1) || '—' : '—';
        document.getElementById('statKills').textContent   = totalKills;
        document.getElementById('statActive').textContent  = playing ? dronesAirborne : '—';
        document.getElementById('statLosses').textContent  = playing ? `${Math.max(0, baseHealth * 20)}%` : '—';
        document.getElementById('statStreak').textContent  = sessionHighStreak;
        document.getElementById('statThreats').textContent = playing ? aliveEnemies : '—';

        // --- BUTTON COOLDOWN TIMERS ---
        if (playing) {
            const n = Date.now();
            const setTimer = (id, ready, lastTs, cooldownMs) => {
                const el = document.getElementById(id);
                if (!el) return;
                if (ready) { el.textContent = ''; return; }
                const rem = Math.ceil((cooldownMs - (n - lastTs)) / 1000);
                el.textContent = rem > 0 ? `(${rem}s)` : '';
            };
            setTimer('empTimer',    empReady,    empLastFiredTs,    EMP_COOLDOWN_MS);
            setTimer('furyTimer',   furyReady,   furyLastFiredTs,   FURY_COOLDOWN_MS);
            setTimer('ttuTimer',    ttuReady,    ttuLastFiredTs,    TTU_COOLDOWN_MS);
            setTimer('orsTimer',    orsReady,    orsLastFiredTs,    ORS_COOLDOWN_MS);
            setTimer('altiusTimer', altiusReady, altiusLastTs,      ALTIUS_COOLDOWN_MS);
            setTimer('anvilTimer',  anvilReady,  anvilLastTs,       ANVIL_COOLDOWN_MS);
            setTimer('rrTimer',     rrDeployReady, rrDeployLastTs,  RR_DEPLOY_COOLDOWN_MS);
            // CLG timer — use clgTargetTs directly
            const clgEl = document.getElementById('clgTimer');
            if (clgEl) {
                if (clgStatus === 'READY' || clgStatus === 'ACTIVE') {
                    clgEl.textContent = '';
                } else {
                    const rem = Math.ceil((clgTargetTs - n) / 1000);
                    clgEl.textContent = rem > 0 ? `(${rem}s)` : '';
                }
            }
        }
    }

    // ============================================================
    // LATTICE REFERENCE PANEL
    // ============================================================
    // Unified reference panel — tab switching
    // Wrapped in null checks so split-file load order doesn't matter
    // ============================================================
    var refToggleEl = document.getElementById('refToggleBtn');
    var refCloseEl  = document.getElementById('refPanelClose');
    if (refToggleEl) refToggleEl.onclick = () => {
        document.getElementById('refPanel').classList.toggle('visible');
    };
    if (refCloseEl) refCloseEl.onclick = () => {
        document.getElementById('refPanel').classList.remove('visible');
    };
    document.querySelectorAll('.ref-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.dataset.tab;
            document.querySelectorAll('.ref-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.ref-tab-content').forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById('tab-' + target).classList.add('active');
        });
    });

    // ============================================================
    // INTRO SPLASH
    // ============================================================
    var introBtn = document.getElementById('introStartBtn');
    if (introBtn) introBtn.onclick = () => {
        const splash = document.getElementById('introSplash');
        splash.classList.add('fade-out');
        setTimeout(() => { splash.style.display = 'none'; }, 800);
    };

    // ============================================================
    // EXPLOSION SPAWNER
    // ============================================================
    function spawnExplosion(lat, lng, swarm, isBigEMP = false) {
        const n = Date.now();
        explosions.push({
            id: n,
            lng,
            lat,
            startTime: n,
            duration: isBigEMP ? 1200 : 600,
            isSwarmUnit: swarm,
            isBigEMP: isBigEMP
        });
    }

    // ============================================================
    // MUSIC HELPERS
    // ============================================================
    function getMetadata(url) {
        // Match against full URL so folder-hash-prefixed urlKeys resolve correctly
        const meta = songMetadata.find(x => url.includes(x.urlKey));
        if (meta) return meta;
        // Fallback: parse filename
        const m = url.match(/\/([^/]+)\?/);
        if (!m) return { artist: "Unknown Artist", title: "Unknown Track" };
        const raw = m[1];
        let t = raw
            .replace(/\.(mp3|flac)$/i, '')
            .replace(/(-|\.)/g, ' ')
            .replace(/^(\d+\s*|-\s*)/, '')
            .trim();
        t = t.toLowerCase()
            .split(' ')
            .map(w => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' ')
            .replace('Made In America', '')
            .trim();
        return { artist: "Unknown Artist", title: t };
    }

    function displaySongInfo() {
        const url = shuffledPlaylist[currentSongIndex];
        const { artist, title } = getMetadata(url);
        document.getElementById('np-artist').textContent = artist + ":";
        document.getElementById('np-track').textContent  = title;
    }

    function shuffleArray(a) {
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
    }

    function startPlaylist() {
        const full = [...masterPlaylist];
        const rem  = [];
        for (const u of full) {
            if (!fixedOrderUrls.some(f => u.startsWith(f.split('&st=')[0]))) {
                rem.push(u);
            }
        }
        shuffleArray(rem);
        shuffledPlaylist = fixedOrderUrls.concat(rem);
        currentSongIndex = -1;
        document.getElementById('np-artist').textContent = 'Initializing...';
    }

    function playNextSong() {
        if (ttuActive || !playing) return;
        if (shuffledPlaylist.length === 0) startPlaylist();
        currentSongIndex = (currentSongIndex + 1) % shuffledPlaylist.length;
        music.src = shuffledPlaylist[currentSongIndex];
        displaySongInfo();
        music.load();
        music.onerror = () => { playNextSong(); };
        music.play().catch(() => {
            addKill('<span style="color:#ffcc00;font-weight:bold;">AUDIO:</span> Click SKIP SONG to enable audio (browser policy).');
        });
    }

    music.addEventListener('ended', playNextSong);

    // ============================================================
    // SPEECH
    // ============================================================
    function speak(t, p = 0) {
        if (ttuActive) return;
        let txt = t
            .replace(/\bEMP\b/g, 'E. M. P.')
            .replace(/\bCLG\b/g, 'C. L. G.');
        if (!('speechSynthesis' in window)) return;
        if (!playing && p < 2) return;
        if (speechSynthesis.speaking) {
            if (isTelemetryActive && p < 2) return;
            if (p >= 1) speechSynthesis.cancel();
            else return;
        }
        const u = new SpeechSynthesisUtterance(txt);
        const allVoices = speechSynthesis.getVoices();
        const preferredVoice = allVoices.find(v =>
            v.name.includes('Google US English') ||
            v.name.includes('Zira') ||
            v.name.includes('Samantha') ||
            v.name.includes('Female')
        );
        if (preferredVoice) {
            u.voice = preferredVoice;
            if (preferredVoice.name.includes('Google')) u.rate = 0.9;
        }
        if (p === 0 && speechSynthesis.speaking) return;
        speechSynthesis.speak(u);
        return u;
    }

    // ============================================================
    // KILL STREAK VOICE
    // ============================================================
    function checkKillStreakVoice(f, prev) {
        if (ttuActive || !playing || f.currentStreak < 2 || isTelemetryActive) return;
        let phrase = '';
        let visual = '';
        switch (f.currentStreak) {
            case 2:  phrase = 'Double Kill!';      visual = 'DOUBLE KILL';    break;
            case 3:  phrase = 'Triple Kill!';      visual = 'TRIPLE KILL';    break;
            case 4:  phrase = 'Overkill!';         visual = 'OVERKILL';       break;
            case 5:  phrase = 'Killtacular!';      visual = 'KILLTACULAR';    break;
            case 6:  phrase = 'Killtrocity!';      visual = 'KILLTROCITY';    break;
            case 7:  phrase = 'Killimanjaro!';     visual = 'KILLIMANJARO';   break;
            case 8:  phrase = 'Killtastrophy!';    visual = 'KILLTASTROPHE';  break;
            case 9:  phrase = 'Killpahcalypse!';   visual = 'KILLPOCALYPSE';  break;
            case 10:
            case 11: phrase = 'Killionaire!';      visual = 'KILLIONAIRE';    break;
            default: return;
        }
        const now = Date.now();
        if (f.currentStreak > prev || (f.currentStreak === prev && now - lastStreakSpokenTs >= STREAK_WINDOW_MS)) {
            speak(phrase, 1);
            if (f.currentStreak > prev && now - lastKillFeedLogTs >= 2000) {
                addKill(`<span style="color:#00ffaa;font-weight:bold;">VOCAL ALERT:</span> ${visual} <span style="color:#00ffaa;">(${f.name})</span>`);
                lastKillFeedLogTs = now;
            }
            lastStreakSpokenTs = now;
        }
    }

    // ============================================================
    // TELEMETRY READ
    // ============================================================
    function readTelemetry() {
        if (!playing || ttuActive) return;
        isTelemetryActive = true;
        const op    = altiusSquad.filter(d => d.alive).length +
                      anvilSquad.filter(d => d.alive).length +
                      rrSquad.filter(d => d.alive).length;
        const alive = enemies.filter(e => e.alive).length;
        const proj  = projectiles.length;
        const ent   = alive + proj;
        const report = `Status Report. Operational Assets. ${op}. Total Entities: ${ent}. Enemy Tracks: ${alive}. Total Kills ${totalKills}. Base integrity: ${baseHealth * 20} percent.`;
        const u = speak(report, 2);
        addKill('<span style="color:#00ffaa;font-weight:bold;">SYSTEM:</span> Telemetry Report Initiated.');
        if (u) {
            u.onend  = () => { isTelemetryActive = false; };
            u.onerror = () => { isTelemetryActive = false; };
        }
    }

    // ============================================================
    // SIMULATE RESUME
    // ============================================================
    function simulateResume() {
        if (!playing || ttuActive) return;
        addKill('<span style="color:#00ffaa;font-weight:bold;">SYSTEM:</span> Autoresume Cycle Initiated.');
        if (waveTimer)         clearTimeout(waveTimer);
        if (telemetryInterval) clearInterval(telemetryInterval);
        if (resumeInterval)    clearInterval(resumeInterval);
        music.pause();
        playNextSong();
        waveTimer         = setTimeout(spawnWave, 35000);
        telemetryInterval = setInterval(readTelemetry, 120000);
        resumeInterval    = setInterval(simulateResume, 600000);
        isUpdating        = true;
    }

    // ============================================================
    // KILL FEED
    // ============================================================
    function addKill(m) {
        const t  = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const kf = document.getElementById('killfeed');
        kf.innerHTML = `<span style="color:#0f0">[${t}]</span> ${m}<br>` + kf.innerHTML;
        if (kf.scrollTop !== 0) kf.scrollTop = 0;
    }

    // ============================================================
    // DRONE SQUADRON STATUS PANEL
    // Shows live count of each active drone type in the air
    // ============================================================
    function updateRoadrunnerStatus() {
        const altiusActive  = altiusSquad.filter(d => d.alive).length;
        const anvilActive   = anvilSquad.filter(d => d.alive).length;
        const rrActive      = rrSquad.filter(d => d.alive).length;
        const jetsTracked   = enemyJets.filter(j => j.alive).length;
        const missilesInAir = jetMissiles.filter(m => !m.intercepted).length;

        let html = '<span style="font-weight:bold;color:#00ffaa;margin-bottom:6px;display:block;">DRONE SQUADRON STATUS:</span>';

        html += `<div class="status-row" style="color:#00ffcc;font-size:11px;">
            <span>ALTIUS (anti-UAS)</span>
            <span>${altiusActive} AIRBORNE${altiusReady ? ' | READY' : ''}</span>
        </div>`;
        html += `<div class="status-row" style="color:#cc44ff;font-size:11px;">
            <span>ANVIL (strike)</span>
            <span>${anvilActive} AIRBORNE${anvilReady ? ' | READY' : ''}</span>
        </div>`;
        html += `<div class="status-row" style="color:#00ffff;font-size:11px;">
            <span>ROADRUNNER (intercept)</span>
            <span>${rrActive} AIRBORNE${rrDeployReady ? ' | READY' : ''}</span>
        </div>`;

        html += `<div style="border-top:1px solid #333;margin-top:6px;padding-top:4px;font-size:11px;">`;
        if (jetsTracked > 0) {
            html += `<span style="color:#ff2200;font-weight:bold;">⚠ ${jetsTracked} HOSTILE JET${jetsTracked > 1 ? 'S' : ''} TRACKED</span><br>`;
        }
        if (missilesInAir > 0) {
            html += `<span style="color:#ff6600;font-weight:bold;">⚠ ${missilesInAir} AGM IN FLIGHT</span><br>`;
        }
        html += `<span style="color:#f00;">BASE HITS: ${roadrunnerLosses}</span>`;
        html += `</div>`;

        document.getElementById('roadrunnerStatus').innerHTML = html;
    }

    // ============================================================
    // FLASH BASE HIT
    // ============================================================
    function flashBaseHit() {
        baseHitIndicator.style.opacity = 1;
        setTimeout(() => { baseHitIndicator.style.opacity = 0; }, 300);
    }

    // ============================================================
    // GAME OVER
    // ============================================================
    function showGameOver() {
        const screen = document.getElementById('gameOverScreen');
        screen.style.display = 'block';
        document.getElementById('goWave').innerText   = waveNumber;
        document.getElementById('goKills').innerText  = totalKills;
        document.getElementById('goLosses').innerText = roadrunnerLosses;
        document.getElementById('goStreak').innerText = sessionHighStreak;
        speak("Critical failure. System compromise imminent. Mission terminated.", 2);
    }

    // ============================================================
    // INIT
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
