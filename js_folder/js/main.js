// ============================================================
// main.js — audio init, pause/resume, button wiring
// ============================================================

    function initializeAudioAndGame() {
        isFirstStart = false;
        playing      = true;

        if (shuffledPlaylist.length === 0) startPlaylist();
        currentSongIndex = (currentSongIndex + 1) % shuffledPlaylist.length;
        music.src = shuffledPlaylist[currentSongIndex];
        displaySongInfo();
        music.load();
        music.play().catch(() => {
            addKill('<span style="color:#ffcc00;font-weight:bold;">AUDIO:</span> Click SKIP SONG to enable audio (browser policy).');
        });

        document.getElementById('pauseBtn').textContent = 'PAUSE';
        isUpdating = true;
        const cdWrapper = document.getElementById('countdownWrapper');
        if (cdWrapper) cdWrapper.style.display = 'block';

        // Start naval battle immediately — Japan OFF posture by default
        initNavalBattle(false);

        setTimeout(() => {
            spawnWave();
            telemetryInterval    = setInterval(readTelemetry, 120000);
            resumeInterval       = setInterval(simulateResume, 600000);
            recommendationInterval = setInterval(recommendSystem, 1000);
            addKill('<span style="color:#00ffaa;font-weight:bold;">SYSTEM:</span> Tactical Command Node Engaged. Assets Deployed. Wave 1 Initiated.');
        }, 15000);
    }

    // ============================================================
    // PAUSE / RESUME HANDLER
    // ============================================================
    function handlePauseResume() {
        const btn      = document.getElementById('pauseBtn');
        const music    = document.getElementById('bgMusic');
        const musicBtn = document.getElementById('musicPauseBtn');
        const gameOver = roadrunnerLosses > 0 && !playing;

        if (gameOver) {
            playing = false;
            btn.textContent = 'START SYSTEM';
            music.pause();
            init();
            return;
        }

        if (isFirstStart) {
            initializeAudioAndGame();
            return;
        }

        playing = !playing;

        if (playing) {
            // RESUME — offset all wall-clock timestamps by pause duration
            btn.textContent = 'PAUSE';
            isUpdating = true;
            if (window._pauseStartTs && dayStartTs > 0) {
                const pausedMs = Date.now() - window._pauseStartTs;
                dayStartTs        += pausedMs;
                nextEventTs       += pausedMs;
                navalEngagementTs += pausedMs;
                airBattleTs       -= pausedMs; // airBattleTs tracks last-fired, so subtract
                if (window._modalOpenTs) window._modalOpenTs += pausedMs;
            }
            window._pauseStartTs = 0;
            // Clear any stale intervals before setting new ones — prevents stacking
            if (telemetryInterval)     clearInterval(telemetryInterval);
            if (resumeInterval)        clearInterval(resumeInterval);
            if (recommendationInterval) clearInterval(recommendationInterval);
            telemetryInterval     = setInterval(readTelemetry, 120000);
            resumeInterval        = setInterval(simulateResume, 600000);
            recommendationInterval = setInterval(recommendSystem, 1000);
            // Restart wave timer on resume only if the field is clear
            if (!waveTimer && enemies.filter(e => e.alive).length === 0) {
                const delay = (waveNumber === 1) ? 3000 : 35000;
                waveTimer = setTimeout(spawnWave, delay);
            }
            music.play().catch(() => {});
            if (musicBtn) musicBtn.textContent = '⏸';
            addKill('<span style="color:#00ffaa;font-weight:bold;">SYSTEM:</span> Resumed.');
        } else {
            // PAUSE — record when we paused so resume can offset clocks
            btn.textContent = 'RESUME';
            window._pauseStartTs = Date.now();
            music.pause();
            if (musicBtn) musicBtn.textContent = '▶';
            isUpdating = false;
            speechSynthesis.cancel();
            if (waveTimer) clearTimeout(waveTimer);
            // Null out all intervals so they cannot stack on resume
            if (telemetryInterval)     { clearInterval(telemetryInterval);     telemetryInterval = null; }
            if (resumeInterval)        { clearInterval(resumeInterval);        resumeInterval = null; }
            if (recommendationInterval){ clearInterval(recommendationInterval); recommendationInterval = null; }
            waveTimer = null;
            document.getElementById('recommendationText').textContent = 'SYSTEM PAUSED.';
            addKill('<span style="color:#ffcc00;font-weight:bold;">SYSTEM:</span> Tactical Pause Initiated.');
        }
    }

    // ============================================================
    // BUTTON WIRING
    // ============================================================
    // Economy export function
    window.exportEconomyReport = function() {
        const ek = economyLog.enemiesKilled;
        const ef = economyLog.interceptorsFired;
        const ratio = economyLog.attritionValue > 0
            ? (economyLog.defenseCost / economyLog.attritionValue).toFixed(2) : 'N/A';

        const textReport = [
            '═══════════════════════════════════════════════════',
            'LATTICERUNNER 22.0 — ECONOMY OF FORCE REPORT',
            `Generated: ${new Date().toISOString()}`,
            `Session: Day ${dayNumber} | Japan Basing: ${japanBasingEnabled ? 'ON' : 'OFF'}`,
            '═══════════════════════════════════════════════════',
            '',
            '── DEFENSE SPEND ──────────────────────────────────',
            `  Altius-600:      ${ef.altius} units  × $50K    = ${fmtUSD(ef.altius*50000)}`,
            `  Anvil:           ${ef.anvil} units  × $75K    = ${fmtUSD(ef.anvil*75000)}`,
            `  Roadrunner-M:    ${ef.roadrunner} units  × $125K   = ${fmtUSD(ef.roadrunner*125000)}`,
            `  F-16V sorties:   ${ef.f16v} sorties × $8M     = ${fmtUSD(ef.f16v*8000000)}`,
            `  HIMARS salvos:   ${ef.himars} salvos  × $150K   = ${fmtUSD(ef.himars*150000)}`,
            `  Carrier strikes: ${ef.carrier} strikes × $2M     = ${fmtUSD(ef.carrier*2000000)}`,
            `  TOTAL DEFENSE:   ${fmtUSD(economyLog.defenseCost)}`,
            '',
            '── ENEMY ATTRITION VALUE ──────────────────────────',
            `  FPV drones:  ${ek.fpv} killed  × $500      = ${fmtUSD(ek.fpv*500)}`,
            `  CH-4 drones: ${ek.ch4} killed  × $2.5M     = ${fmtUSD(ek.ch4*2500000)}`,
            `  TB-001:      ${ek.tb001} killed  × $3.5M     = ${fmtUSD(ek.tb001*3500000)}`,
            `  DF-17:       ${ek.df17} killed  × $20M      = ${fmtUSD(ek.df17*20000000)}`,
            `  CJ-10:       ${ek.cj10} killed  × $3M       = ${fmtUSD(ek.cj10*3000000)}`,
            `  J-16:        ${ek.j16} killed  × $70M      = ${fmtUSD(ek.j16*70000000)}`,
            `  J-20:        ${ek.j20} killed  × $110M     = ${fmtUSD(ek.j20*110000000)}`,
            `  PLAN ships:  ${economyLog.navalKills.length} sunk    = ${fmtUSD(economyLog.navalKills.reduce((s,n)=>s+n.value,0))}`,
            `  TOTAL ATTRITION: ${fmtUSD(economyLog.attritionValue)}`,
            '',
            '── EXCHANGE RATIO ─────────────────────────────────',
            `  Defense Spend ÷ Attrition Value = ${ratio}:1`,
            `  ${parseFloat(ratio) > 1 ? 'UNFAVORABLE — spending more than destroying' : 'FAVORABLE — destroying more value than spent'}`,
            '',
            '── DAILY TREND ────────────────────────────────────',
            ...economyLog.exchangeRatioByDay.map(d =>
                `  Day ${d.day}: Spend ${fmtUSD(d.defense)} | Kills ${fmtUSD(d.attrition)} | Ratio ${d.ratio}:1`
            ),
            '',
            '── NAVAL KILLS ────────────────────────────────────',
            ...economyLog.navalKills.map(n => `  ${n.type}: ${fmtUSD(n.value)}`),
            '',
            '═══════════════════════════════════════════════════',
            'CSIS CONTEXT: The exchange ratio is the central problem',
            'of autonomous defense. A $500 FPV destroying a $50K',
            'Altius = 100:1 unfavorable. The case for Lattice is',
            'collapsing this ratio through attritable interceptors.',
            '═══════════════════════════════════════════════════',
        ].join('\n');

        const jsonReport = JSON.stringify({
            meta: {
                timestamp: new Date().toISOString(),
                daysSurvived: dayNumber,
                japanBasing: japanBasingEnabled,
                totalKills,
            },
            defenseCost: economyLog.defenseCost,
            attritionValue: economyLog.attritionValue,
            exchangeRatio: ratio,
            interceptorsFired: ef,
            enemiesKilled: ek,
            navalKills: economyLog.navalKills,
            dailyTrend: economyLog.exchangeRatioByDay,
        }, null, 2);

        // Copy to clipboard
        navigator.clipboard.writeText(textReport + '\n\n--- JSON ---\n' + jsonReport)
            .then(() => alert('Economy report copied to clipboard!\n\nPaste into any text editor or spreadsheet.'))
            .catch(() => {
                // Fallback — open in new window
                const w = window.open('', '_blank');
                w.document.write('<pre style="font-family:monospace;font-size:12px;background:#000;color:#0f0;padding:20px;">'
                    + textReport.replace(/&/g,'&amp;').replace(/</g,'&lt;')
                    + '\n\n' + jsonReport + '</pre>');
            });
    };

    document.getElementById('rebootBtn').onclick = () => {
        document.getElementById('resetBtn').click();
    };

    document.getElementById('pauseBtn').addEventListener('click', handlePauseResume);

    document.getElementById('resetBtn').onclick = () => {
        playing = false;
        document.getElementById('pauseBtn').textContent = 'START SYSTEM';
        music.pause();
        music.currentTime = 0;
        speechSynthesis.cancel();
        document.getElementById('gameOverScreen').style.display = 'none';
        init();
        refresh();
        addKill('<span style="color:#ffcc00;font-weight:bold;">SYSTEM:</span> RESET COMPLETE. Awaiting Start.');
    };

    document.getElementById('skipBtn').onclick = () => {
        if (playing && !ttuActive) {
            music.pause();
            playNextSong();
        } else if (!playing) {
            const t = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            addKill(`<span style="color:#0f0">[${t}]</span> <span style="color:#ffcc00;">ALERT: Cannot skip. System is PAUSED.</span><br>`);
        } else if (ttuActive) {
            const t = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            addKill(`<span style="color:#0f0">[${t}]</span> <span style="color:#ffcc00;">ALERT: Music silenced during TTU Uplink.</span><br>`);
        }
    };

    document.getElementById('autoBtn').onclick = () => {
        if (!playing) return;
        autoMode = !autoMode;
        const btn = document.getElementById('autoBtn');
        btn.textContent = autoMode ? 'AUTO-TASKING: ON' : 'AUTO-TASKING: OFF';
        btn.style.background = autoMode ? 'rgba(0,255,170,0.3)' : 'rgba(0,255,170,0.1)';
        addKill(`<span style="color:#00ffaa;font-weight:bold;">SYSTEM:</span> Auto-tasking ${autoMode ? 'ENABLED — system will assign interceptors autonomously.' : 'DISABLED — manual control restored.'}`);
        speak(autoMode ? 'Auto tasking enabled.' : 'Manual control.', 1);
    };

    document.getElementById('jamBtn').onclick        = toggleJamming;
    document.getElementById('amphibiousBtn').onclick = launchPatrolBoats;

    // Japan basing toggle
    var japanBtn = document.getElementById('japanBtn');
    if (japanBtn) japanBtn.onclick = () => {
        if (!playing) return;
        japanBasingEnabled = !japanBasingEnabled;
        japanBtn.textContent = japanBasingEnabled ? 'JAPAN BASING: ON' : 'JAPAN BASING: OFF';
        japanBtn.style.background = japanBasingEnabled ? 'rgba(68,153,255,0.25)' : 'rgba(68,153,255,0.08)';
        if (japanBasingEnabled) {
            reinforcementDay = 4;
            // Reset ship health before repositioning
            PLAN_SAG.forEach(s => { s.alive = true; s.health = s.maxHealth; });
            US_CSG.forEach(s  => { s.alive = true; s.health = s.maxHealth; });
            initNavalBattle(true);
            addKill(`<span style="color:#4499ff;font-weight:bold;">🦅 JAPAN BASING: AUTHORIZED</span> — CSG repositioning to Philippine Sea forward station. Reinforcements Day 4. WARNING: PLA DF-21D carrier-killer posture elevated.`);
            speak('Japan basing authorized. Carrier strike group repositioning.', 1);
            setTimeout(() => {
                if (playing && japanBasingEnabled) {
                    addKill(`<span style="color:#ff4444;font-weight:bold;">[PLA AI] JAPAN RESPONSE:</span> Northeast attack corridor active. DF-21D threat to CVN-73 elevated.`);
                    plaMemory.weights.jet = Math.min(3.0, plaMemory.weights.jet + 0.5);
                }
            }, 45000);
        } else {
            reinforcementDay = 7;
            initNavalBattle(false);
            addKill(`<span style="color:#4499ff;">JAPAN BASING: WITHDRAWN</span> — CSG reverting to Guam posture. Reinforcement timeline Day 7.`);
        }
    };
    document.getElementById('empBtn').onclick      = fireEMPInterdiction;

    // Killfeed minimize/maximize
    window.killfeedUserScrolling = false;

    // Scroll lock
    var kfEl = document.getElementById('killfeed');
    if (kfEl) {
        kfEl.addEventListener('scroll', () => {
            window.killfeedUserScrolling = kfEl.scrollTop > 40;
        });
    }
const himBtnWire = document.getElementById('himarsBtn');
    if (himBtnWire) himBtnWire.onclick = fireHimars;
    var cBtnWire = document.getElementById('carrierBtn');
    if (cBtnWire) cBtnWire.onclick = fireCarrierStrike;
    document.getElementById('clgBtn').onclick      = toggleCLG;
    document.getElementById('ttuBtn').onclick      = activateTTU;
    document.getElementById('orsBtn').onclick      = activateORS;
    document.getElementById('furyBtn').onclick     = launchFurySquad;
    document.getElementById('altiusBtn').onclick   = launchAltius;
    document.getElementById('anvilBtn').onclick    = launchAnvil;
    document.getElementById('rrDeployBtn').onclick = launchRRDeploy;

    // ============================================================
    // BOOT — single update loop, never stacked
    // ============================================================
    init();
    if (!window._updateIntervalRunning) {
        window._updateIntervalRunning = true;
        setInterval(update, 250);
    }
    document.getElementById('killfeed').innerHTML =
        'Awaiting Tactical Input. Please press START SYSTEM.' +
        '<span class="dot dot1">.</span>' +
        '<span class="dot dot2">.</span>' +
        '<span class="dot dot3">.</span><br>';

