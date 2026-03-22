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
    // Wrapped in null checks so split-file load order does not matter
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
    // does not chain-skip through the whole playlist
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
        // Voice telemetry disabled — was interrupting music
        // Telemetry data is visible in the HUD panels
        isTelemetryActive = false;
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
    function fireCarrierStrike() {
        if (!playing || !carrierArmed) return;
        carrierArmed = false;
        const cBtn = document.getElementById('carrierBtn');
        const cSt  = document.getElementById('carrierStatus');
        if (cBtn) { cBtn.disabled = true; cBtn.style.background = 'rgba(68,153,255,0.08)'; cBtn.style.boxShadow = 'none'; }
        if (cSt)  cSt.textContent = 'LOCKED';

        addKill(`<span style="color:#4499ff;font-weight:bold;">✈ CARRIER LAUNCH:</span> F/A-18 squadron inbound from Philippine Sea. ETA 20 seconds.`);
        speak('Carrier strike package inbound. Stand by.', 1);

        setTimeout(() => {
            if (!playing) return;
            addKill(`<span style="color:#4499ff;font-weight:bold;">✈ CARRIER ON STATION:</span> F/A-18s over the strait. Weapons free — all threats.`);
            speak('Carrier jets on station. Weapons free.', 1);

            // Staggered strikes across all enemies and ships
            const targets = enemies.filter(e => e.alive);
            const ships   = enemyAmphibious.filter(s => s.alive);
            targets.forEach((e, i) => {
                setTimeout(() => {
                    if (!e.alive) return;
                    e.alive = false; e.engagedBy = undefined; totalKills++;
                    spawnExplosion(e.lat, e.lng, e.isSwarmUnit, true);
                }, i * 100);
            });
            ships.forEach((ship, i) => {
                setTimeout(() => {
                    if (!ship.alive) return;
                    ship.health = 0; ship.alive = false; totalKills++;
                    spawnExplosion(ship.lat, ship.lng, false, true);
                }, (targets.length + i) * 100);
            });
            setTimeout(() => {
                addKill(`<span style="color:#4499ff;font-weight:bold;">✈ STRIKE COMPLETE:</span> ${targets.length + ships.length} contacts destroyed. Squadron egressing.`);
                speak(`Strike complete. ${targets.length + ships.length} contacts destroyed.`, 1);
            }, (targets.length + ships.length) * 100 + 200);
        }, 20000);
    }

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

        // Freeze the day clock — record when modal opened so we can offset dayStartTs on close
        window._modalOpenTs = Date.now();
        // Also block wall clock trigger while modal is open
        wallClockTriggered = true;

        // Grey out HIMARS if on cooldown (3 day cooldown) or no inventory
        const himarsCooldownLeft = (himarsLastUsedDay + 3) - dayNumber;
        const himarsOnCooldown   = himarsCooldownLeft > 0;
        const himarsUnavailable  = himarsOnCooldown || INVENTORY.himars.remaining <= 0;
        // Grey out carrier if on cooldown (2-day cooldown)
        const carrierCooldownLeft = (carrierLastUsedDay + 2) - dayNumber;
        const carrierOnCooldown   = carrierCooldownLeft > 0;
        const carrierModalBtn = document.querySelector('.support-carrier');
        if (carrierModalBtn) {
            carrierModalBtn.disabled = carrierOnCooldown;
            carrierModalBtn.style.opacity = carrierOnCooldown ? '0.35' : '1';
            carrierModalBtn.style.cursor  = carrierOnCooldown ? 'not-allowed' : 'pointer';
            const carrierDescEl = carrierModalBtn.querySelector('.support-desc');
            if (carrierDescEl && carrierOnCooldown) {
                carrierDescEl.textContent = `⚠ On cooldown — available in ${carrierCooldownLeft} day${carrierCooldownLeft > 1 ? 's' : ''}. Carrier rearming.`;
            } else if (carrierDescEl) {
                carrierDescEl.textContent = 'Arms a manual button — launch when you need it. 4 F/A-18s from USS George Washington, arrive 20 seconds after launch, engage all threats for 30 seconds then egress. 2-day cooldown.';
            }
        }

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
        setTimeout(() => speak(`Day ${dayCompleted} survived. Choose your support asset.`, 1), 2000);
        // Keep map layers visible while modal is open
        if (typeof refresh === 'function') refresh();
    }

    function activateSupport(type) {
        document.getElementById('supportModal').style.display = 'none';
        playing = true;
        document.getElementById('pauseBtn').textContent = 'PAUSE';
        // Offset dayStartTs by however long the modal was open so the clock resumes correctly
        if (window._modalOpenTs) {
            dayStartTs += Date.now() - window._modalOpenTs;
            window._modalOpenTs = 0;
        }
        // Re-arm wall clock for new day
        wallClockTriggered = false;
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
            // Arm carrier button — player fires manually
            carrierArmed = true;
            carrierLastUsedDay = dayNumber;
            const cBtn = document.getElementById('carrierBtn');
            const cSt  = document.getElementById('carrierStatus');
            if (cBtn) { cBtn.disabled = false; cBtn.style.background = 'rgba(68,153,255,0.25)'; cBtn.style.boxShadow = '0 0 8px #4499ff'; }
            if (cSt)  cSt.textContent = '🔵 ARMED';
            addKill(`<span style="color:#4499ff;font-weight:bold;">✈ CARRIER STRIKE ARMED:</span> USS George Washington standing by. Press CARRIER STRIKE when ready.`);
            speak('Carrier strike package standing by. Awaiting launch order.', 1);

        } else if (type === 'resupply') {
            // Full inventory restore — top everything back to total
            INVENTORY.altius.remaining     = INVENTORY.altius.total;
            INVENTORY.anvil.remaining      = INVENTORY.anvil.total;
            INVENTORY.roadrunner.remaining = INVENTORY.roadrunner.total;
            INVENTORY.f16v.remaining       = INVENTORY.f16v.total;
            INVENTORY.himars.remaining     = INVENTORY.himars.total;
            // Reset cooldown flags
            altiusReady = true; anvilReady = true; rrDeployReady = true; furyReady = true;
            altiusLastTs = 0; anvilLastTs = 0; rrDeployLastTs = 0;
            // Repair base
            baseHealth = Math.min(5, baseHealth + 1);
            addKill(`<span style="color:#00ffaa;font-weight:bold;">📦 FULL RESUPPLY:</span> C-17 airdrop confirmed. All inventories restored to full. ALT:${INVENTORY.altius.remaining} ANV:${INVENTORY.anvil.remaining} RR:${INVENTORY.roadrunner.remaining} F16:${INVENTORY.f16v.remaining} HIM:${INVENTORY.himars.remaining}. Integrity +20%.`);
            speak('Full resupply complete. All systems at capacity.', 1);

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
                lng: base.lng - 0.55,
                picketLat: base.lat + offset,  // remember individual lane
                speed: PATROL_SPEED,
                alive: true,
                isCarrierJet: false,
                targetShipId: undefined,
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

    var killfeedLog = [];

    function addKill(m) {
        const t   = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const entry = `<span style="color:#0f0">[${t}]</span> ${m}`;
        killfeedLog.unshift(entry);
        if (killfeedLog.length > 500) killfeedLog.pop();

        // Small feed shows last 80 entries for performance
        const kf = document.getElementById('killfeed');
        kf.innerHTML = killfeedLog.slice(0, 80).join('<br>') + '<br>';
        if (!window.killfeedUserScrolling) {
            kf.scrollTop = 0;
        }
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
        html += `<span style="color:#f00;">P.O. HITS: ${roadrunnerLosses}</span>`;
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
        speak("Presidential Office destroyed. Taipei has fallen. Mission terminated.", 2);

        // ── AFTER ACTION REVIEW ──────────────────────────────────
        const aar = [];

        // Analyze inventories
        const altDep  = INVENTORY.altius.remaining    === 0;
        const anvDep  = INVENTORY.anvil.remaining     === 0;
        const rrDep   = INVENTORY.roadrunner.remaining === 0;
        const himDep  = INVENTORY.himars.remaining    === 0;
        const f16Dep  = INVENTORY.f16v.remaining      === 0;

        if (rrDep) aar.push({ icon: '⚠', text: '<strong>Roadrunner depleted.</strong> DF-17 hypersonic missiles had no intercept capability in final waves. Roadrunner is the only system that can kill DF-17s — preserve it for missile saturation phases.' });
        if (altDep && anvDep) aar.push({ icon: '⚠', text: '<strong>Altius and Anvil both depleted.</strong> FPV swarms and CH-4s had no autonomous intercept response. Stagger deployments — do not launch both squads against the same wave.' });
        else if (altDep) aar.push({ icon: '⚠', text: '<strong>Altius inventory exhausted.</strong> FPV saturation attacks went uncontested in late game. Use Altius only against confirmed swarm waves — conserve against mixed threats.' });
        else if (anvDep) aar.push({ icon: '⚠', text: '<strong>Anvil inventory exhausted.</strong> CH-4 and TB-001 strike drones had no intercept. Anvil should be reserved for non-swarm drone threats after Altius engages the FPV layer.' });

        if (!japanBasingEnabled) aar.push({ icon: '📍', text: '<strong>Japan basing was not authorized.</strong> US CSG operated from Guam posture — reinforcements arrived Day 7+ instead of Day 4. CSIS identifies this as the single largest variable in US effectiveness. Earlier authorization may have changed the outcome.' });
        if (himDep) aar.push({ icon: '⚠', text: '<strong>All HIMARS salvos expended.</strong> Consider holding at least one salvo for amphibious landing suppression on Day 3+ rather than using all against air threats.' });
        if (f16Dep) aar.push({ icon: '⚠', text: '<strong>F-16V sorties exhausted.</strong> ' + (hualienDegraded ? 'Hualien Air Base was struck in the Day 1 opening salvo — F-16V capacity was halved from the start. This is historically accurate: PLA doctrine prioritizes airfield suppression.' : 'All sorties used before late-game air threats. F-16Vs are most effective against jet packages — preserve sorties for J-16 and J-20 strikes.') });

        // Days analysis
        if (dayNumber <= 2) aar.push({ icon: '📊', text: '<strong>Fell on Day ' + dayNumber + '.</strong> Early collapse typically indicates missile saturation overwhelmed Roadrunner. Day 1-2 are the heaviest missile days per CSIS opening salvo doctrine. Prioritize Roadrunner deployment and use CLG on missile-heavy waves.' });
        else if (dayNumber <= 4) aar.push({ icon: '📊', text: '<strong>Survived ' + dayNumber + ' days.</strong> Mid-game collapse. PLA AI adaptation likely shifted composition to counter your strongest systems. Check killfeed for [PLA AI] adaptation messages — they signal what the AI learned.' });
        else aar.push({ icon: '✓', text: '<strong>Survived ' + dayNumber + ' days.</strong> Strong performance. Late-game collapse typically reflects inventory depletion without resupply or amphibious forces establishing a beach. Day 3+ C-17 resupply and HIMARS against landing ships are key.' });

        if (navalPlanKills >= 3) aar.push({ icon: '✓', text: '<strong>Naval attrition was effective</strong> — ' + navalPlanKills + ' PLAN ships sunk. This reduced amphibious capacity and wave pressure. Japan basing authorized naval engagement earlier.' });
        else if (navalPlanKills === 0 && !japanBasingEnabled) aar.push({ icon: '📍', text: '<strong>No PLAN naval losses.</strong> Without Japan basing the CSG could not engage until Day 7+. PLAN amphibious forces operated freely — landing ships reached the coast uncontested.' });

        if (aar.length === 0) aar.push({ icon: '📊', text: '<strong>Systems performed well.</strong> The fall of the Presidential Office was likely due to a concentrated amphibious assault or late-game wave saturation overwhelming the defense grid.' });

        document.getElementById('goAnalysis').innerHTML = aar.map(a =>
            `<div class="go-analysis-item"><span class="go-analysis-icon">${a.icon}</span><span class="go-analysis-text">${a.text}</span></div>`
        ).join('');

        // ── CSIS OUTCOME SECTION ─────────────────────────────────
        const csisText = japanBasingEnabled
            ? `CSIS wargames run since 2022 consistently find that Taiwan survives a Chinese invasion — but only barely, and only with full US and Japanese commitment. The most important single variable is Japan basing authorization, which you enabled. When Japan allows US operations from Okinawa and Misawa, the US can bring F-35s and carrier air power to bear within 48 hours rather than 7 days. CSIS found that in scenarios where Japan authorizes basing, Taiwan survives in roughly two thirds of runs. Where Japan withholds authorization, Taiwan falls in most scenarios.<br><br>
The human cost is staggering in all outcomes. CSIS estimates thousands of US military casualties, significant Taiwanese civilian losses, and economic disruption that triggers a global recession regardless of who wins the military contest. China absorbs catastrophic naval and air losses — enough to set PLAN modernization back a decade.<br><br>
CSIS conclusion: "The United States can defend Taiwan, but the cost will be far higher than most Americans understand — and the outcome depends on decisions made by Tokyo, not Washington."`
            : `CSIS wargames consistently find that without Japan basing authorization, the United States cannot effectively defend Taiwan. When Japan withholds permission for US operations from Okinawa and Misawa, the carrier strike group must operate from Guam — 800+ nautical miles away. At that range, F/A-18 strike packages cannot reach Taiwan and return without refueling, and the CSG arrives too late to prevent the first wave of PLA landings.<br><br>
In the CSIS base scenario without Japan basing, Taiwan falls within 7-10 days. The PLA successfully establishes a beachhead, captures Taoyuan Airport on Day 3-4, and begins airlift of reinforcements. The US can contest the air and sea but cannot reverse a ground situation that solidified while the CSG was still transiting from Guam.<br><br>
CSIS conclusion: "The Japan basing decision is the most consequential political variable in the entire scenario — more important than the number of US ships, more important than Taiwan's own defenses. Tokyo decides the outcome before the first shot is fired."`;

        document.getElementById('goCsisOutcome').innerHTML = csisText;

        document.getElementById('goThankyou').innerHTML =
            `Thank you for playing LATTICERUNNER 22.0.<br>
            Built by a field operator in Lancaster, CA — 34.8165°N 118.2000°W<br>
            defending 25.0400°N 121.5120°E<br><br>
            <span style="color:#333;">Based on publicly available CSIS and CNAS wargame findings.<br>
            Not affiliated with or endorsed by Anduril Industries.</span>`;
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
        lastDayBannerDay    = 0;
        dayStartTs          = Date.now();
        killfeedLog.length  = 0; // clear log on new game
        nextEventTs         = 0;
        nextEventDelaySaved = 0;
        wallClockTriggered  = false;
        navalBattleActive   = false;
        landingZonesActive  = false;
        airBattleTs         = 0;
        combatAircraft      = [];
        if (map.getSource('combat-aircraft')) map.getSource('combat-aircraft').setData({ type: 'FeatureCollection', features: [] });
        PLAAF_OOB.forEach(sq => { sq.sorties = sq.sorties || 24; sq.losses = 0; sq.alive = true; });
        US_AIR_OOB.forEach(sq => { sq.losses = 0; sq.alive = true; });
        if (map.getSource('air-squadrons')) map.getSource('air-squadrons').setData({ type: 'FeatureCollection', features: [] });
        LANDING_ZONES.forEach(lz => { lz.status = lz.threat === 'PRIMARY' ? 'STAGING' : 'STAGING'; lz.troopsLanded = 0; });
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
