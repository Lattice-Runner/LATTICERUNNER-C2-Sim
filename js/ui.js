// ============================================================
// ui.js — HUD updates, killfeed, speech, recommendations
// ============================================================

    function updateStatsBar() {
        const dronesAirborne = altiusSquad.filter(d => d.alive).length +
                               anvilSquad.filter(d => d.alive).length +
                               rrSquad.filter(d => d.alive).length;
        const aliveEnemies   = enemies.filter(e => e.alive).length +
                               enemyJets.filter(j => j.alive).length;
        document.getElementById('statWave').textContent    = playing ? `Day ${dayNumber}` : '—';
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
        music.play().catch(() => {
            addKill('<span style="color:#ffcc00;font-weight:bold;">AUDIO:</span> Click SKIP SONG to enable audio (browser policy).');
        });
    }

    // Set onerror once — debounced so a bad Dropbox URL
    // doesn't chain-skip through the whole playlist
    var _songErrorTs = 0;
    music.onerror = () => {
        const now = Date.now();
        if (now - _songErrorTs < 2000) return; // ignore rapid cascades
        _songErrorTs = now;
        addKill('<span style="color:#ffcc00;font-weight:bold;">AUDIO:</span> Track unavailable — skipping.');
        playNextSong();
    };

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
        const u = speak(report, 1);
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
    // ============================================================
    // US DAY-SURVIVAL SUPPORT SYSTEM
    // ============================================================
    function fireHimars() {
        if (!playing || !himarsArmed || INVENTORY.himars.remaining <= 0) return;
        himarsArmed = false;
        INVENTORY.himars.remaining--;

        const himBtn = document.getElementById('himarsBtn');
        const himSt  = document.getElementById('himarsStatus');
        if (himBtn) { himBtn.disabled = true; himBtn.style.background = 'rgba(255,102,0,0.08)'; himBtn.style.boxShadow = 'none'; }
        if (himSt)  himSt.textContent = 'LOCKED';

        addKill(`<span style="color:#ff6600;font-weight:bold;">⚡ HIMARS LAUNCH:</span> Precision salvo inbound. Salvo ${INVENTORY.himars.total - INVENTORY.himars.remaining}/${INVENTORY.himars.total}.`);
        speak('HIMARS launch confirmed. Salvo inbound.', 1);

        // Staggered explosions across the map
        const targets = enemies.filter(e => e.alive);
        const ships   = enemyAmphibious.filter(s => s.alive);
        targets.forEach((e, i) => {
            setTimeout(() => {
                if (!e.alive) return;
                e.alive = false; e.engagedBy = undefined; totalKills++;
                spawnExplosion(e.lat, e.lng, e.isSwarmUnit, true);
            }, i * 120);
        });
        ships.forEach((ship, i) => {
            setTimeout(() => {
                if (!ship.alive) return;
                ship.health = 0; ship.alive = false; totalKills++;
                spawnExplosion(ship.lat, ship.lng, false, true);
            }, (targets.length + i) * 120);
        });
        setTimeout(() => {
            addKill(`<span style="color:#ff6600;font-weight:bold;">⚡ HIMARS IMPACT:</span> ${targets.length + ships.length} contacts destroyed. ${INVENTORY.himars.remaining} salvos remaining.`);
            speak(`HIMARS impact. ${targets.length + ships.length} contacts eliminated.`, 1);
        }, (targets.length + ships.length) * 120 + 200);
    }

    function showSupportModal(dayCompleted) {
        if (!playing) return;
        playing = false;
        document.getElementById('pauseBtn').textContent = 'RESUME';
        document.getElementById('supportDayNum').textContent = dayCompleted;

        // Grey out HIMARS if on cooldown (3 day cooldown) or no inventory
        const himarsCooldownLeft = (himarsLastUsedDay + 3) - dayNumber;
        const himarsOnCooldown   = himarsCooldownLeft > 0;
        const himarsUnavailable  = himarsOnCooldown || INVENTORY.himars.remaining <= 0;
        const himarsModalBtn = document.querySelector('.support-himars');
        if (himarsModalBtn) {
            himarsModalBtn.disabled = himarsUnavailable;
            himarsModalBtn.style.opacity = himarsUnavailable ? '0.35' : '1';
            himarsModalBtn.style.cursor  = himarsUnavailable ? 'not-allowed' : 'pointer';
            const descEl = himarsModalBtn.querySelector('.support-desc');
            if (descEl) {
                if (INVENTORY.himars.remaining <= 0) {
                    descEl.textContent = '⚠ No salvos remaining. Awaiting resupply.';
                } else if (himarsOnCooldown) {
                    descEl.textContent = `⚠ On cooldown — available in ${himarsCooldownLeft} day${himarsCooldownLeft > 1 ? 's' : ''}. Reload cycle in progress.`;
                } else {
                    descEl.textContent = 'Long-range artillery salvo destroys all enemies on the map. Cascading impact visual. One use per activation. 3-day reload cycle.';
                }
            }
        }

        document.getElementById('supportModal').style.display = 'block';
        speak(`Day ${dayCompleted} survived. US support available. Choose your asset.`, 1);
    }

    function activateSupport(type) {
        document.getElementById('supportModal').style.display = 'none';
        playing = true;
        document.getElementById('pauseBtn').textContent = 'PAUSE';
        if (type === 'himars') {
            // Check inventory
            if (INVENTORY.himars.remaining <= 0) {
                addKill('<span style="color:#ff4444;">HIMARS:</span> No salvos remaining.');
                if (waveTimer) clearTimeout(waveTimer);
                waveTimer = setTimeout(spawnWave, 5000);
                return;
            }
            // Arm the HIMARS button — player fires manually at the right moment
            himarsArmed = true;
            himarsLastUsedDay = dayNumber;
            const himBtn = document.getElementById('himarsBtn');
            const himSt  = document.getElementById('himarsStatus');
            if (himBtn) { himBtn.disabled = false; himBtn.style.background = 'rgba(255,102,0,0.25)'; himBtn.style.boxShadow = '0 0 8px #ff6600'; }
            if (himSt)  himSt.textContent = '🔴 ARMED';
            addKill(`<span style="color:#ff6600;font-weight:bold;">⚡ HIMARS ARMED:</span> Salvo loaded. Press HIMARS button when ready. ${INVENTORY.himars.remaining} salvos available.`);
            speak('HIMARS armed. Awaiting fire command.', 1);

        } else if (type === 'carrier') {
            // Carrier strike — spawn a wave of friendly jets from the east
            addKill(`<span style="color:#4499ff;font-weight:bold;">✈ CARRIER STRIKE:</span> USS Ronald Reagan F/A-18 sortie inbound from Philippine Sea. ETA 20 seconds.`);
            speak('Carrier strike package inbound. Stand by.', 1);
            setTimeout(() => {
                // Spawn 4 carrier jets from the east
                for (let i = 0; i < 4; i++) {
                    const offset = (i - 1.5) * 0.04;
                    friendlyPatrols.push({
                        id: `CVN-${nextId++}`,
                        lat: base.lat + offset,
                        lng: base.lng + 0.80,
                        speed: 0.0060,
                        alive: true,
                        isCarrierJet: true,
                        heading: Math.PI,  // fly west
                        ammo: 6,
                        engageUntil: Date.now() + 30000,
                        type: 'F/A-18'
                    });
                }
                addKill(`<span style="color:#4499ff;font-weight:bold;">✈ CARRIER STRIKE:</span> F/A-18 squadron over Taipei. Engaging all threats.`);
                speak('Carrier jets on station. Engaging.', 1);
            }, 20000);

        } else if (type === 'resupply') {
            // Restore INVENTORY counts
            const drop = { altius: 20, anvil: 10, roadrunner: 3, f16v: 4 };
            INVENTORY.altius.remaining     = Math.min(INVENTORY.altius.total,     INVENTORY.altius.remaining     + drop.altius);
            INVENTORY.anvil.remaining      = Math.min(INVENTORY.anvil.total,      INVENTORY.anvil.remaining      + drop.anvil);
            INVENTORY.roadrunner.remaining = Math.min(INVENTORY.roadrunner.total, INVENTORY.roadrunner.remaining + drop.roadrunner);
            INVENTORY.f16v.remaining       = Math.min(INVENTORY.f16v.total,       INVENTORY.f16v.remaining       + drop.f16v);
            // Reset cooldown flags
            altiusReady = true; anvilReady = true; rrDeployReady = true; furyReady = true;
            altiusLastTs = 0; anvilLastTs = 0; rrDeployLastTs = 0;
            // Repair base
            baseHealth = Math.min(5, baseHealth + 1);
            addKill(`<span style="color:#00ffaa;font-weight:bold;">📦 RESUPPLY:</span> C-17 airdrop confirmed. +${drop.altius} Altius, +${drop.anvil} Anvil, +${drop.roadrunner} Roadrunner, +${drop.f16v} F-16V sorties. Integrity +20%. Inventory: ALT:${INVENTORY.altius.remaining} ANV:${INVENTORY.anvil.remaining} RR:${INVENTORY.roadrunner.remaining}.`);
            speak('Resupply complete. Inventories restored.', 1);

        } else if (type === 'cyber') {
            // NSA cyber strike — drop all enemy confidence
            cyberStrikeActive = true;
            cyberStrikeUntil  = Date.now() + 25000;
            enemies.forEach(e => {
                if (e.alive) {
                    e.confidence  = 0;
                    e.identified  = false;
                    e.firstSeenTs = 0;
                }
            });
            addKill(`<span style="color:#ff00ff;font-weight:bold;">💻 CYBER STRIKE:</span> NSA offensive operation — PLA sensor network disrupted. All contacts degraded to UNKNOWN. 25 seconds.`);
            speak('Cyber strike active. Enemy sensors degraded.', 1);
            setTimeout(() => {
                cyberStrikeActive = false;
                addKill(`<span style="color:#ff00ff;">CYBER:</span> PLA restoring sensor network. Track confidence rebuilding.`);
            }, 25000);
        }

        // Resume wave spawning after support choice — 5 second grace period
        if (waveTimer) clearTimeout(waveTimer);
        waveTimer = setTimeout(spawnWave, 5000);
    }

    // ============================================================
    // AMPHIBIOUS SYSTEMS
    // ============================================================
    function launchPatrolBoats() {
        if (!playing || !amphibiousReady) return;
        amphibiousReady  = false;
        amphibiousLastTs = Date.now();
        document.getElementById('amphibiousBtn').disabled = true;

        // Spawn 4 ROC patrol boats in a defensive line west of Taipei in the strait
        for (let i = 0; i < 4; i++) {
            const offset = (i - 1.5) * 0.08;
            friendlyPatrols.push({
                id: `ROC-${String(nextId++).padStart(2,'0')}`,
                lat: base.lat + offset,
                lng: base.lng - 0.55,  // in the strait
                speed: PATROL_SPEED,
                alive: true,
                isCarrierJet: false,
                targetId: undefined,
                ammo: 4,
                type: 'PATROL'
            });
        }
        addKill(`<span style="color:#ff9900;font-weight:bold;">⚓ MARITIME:</span> ROC patrol boats deployed to Taiwan Strait. Intercepting amphibious threats.`);
        speak('Patrol boats deployed. Taiwan Strait picket line established.', 1);
    }

    function spawnEnemyLandingShips() {
        // Type 071/075 amphibious assault ships — spawn from west
        const count = 2 + Math.floor(dayNumber / 3);  // more ships as days progress
        for (let i = 0; i < count; i++) {
            const offset = (i - count / 2) * 0.12;
            enemyAmphibious.push({
                id: nextId++,
                lat: base.lat + offset,
                lng: base.lng - 0.90,  // spawn in strait, west approach
                speed: AMPHIBIOUS_SPEED,
                alive: true,
                health: LANDING_SHIP_HEALTH,
                type: Math.random() < 0.5 ? 'Type-075' : 'Type-071',
                confidence: 60,  // ships are easier to detect than aircraft
                identified: true
            });
        }
        addKill(`<span style="color:#ff0000;font-weight:bold;">⚠ MARITIME THREAT:</span> PLA amphibious group detected in Taiwan Strait — ${count} landing ships inbound.`);
        speak(`Warning. PLA amphibious assault ships in the strait. ${count} contacts.`, 1);
    }

    function getDayStamp() {
        if (!playing) return '';
        const mins = Math.floor((dayElapsed || 0) / 60000);
        const secs = Math.floor(((dayElapsed || 0) % 60000) / 1000);
        return `[D${dayNumber} ${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}] `;
    }

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
        document.getElementById('goWave').innerText   = dayNumber;
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
        himarsArmed         = false;
        himarsLastUsedDay   = -99;
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
