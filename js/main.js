// ============================================================
// main.js — audio init, pause/resume, button wiring
// ============================================================

    function initializeAudioAndGame() {
        isFirstStart = false;
        playing      = true;

        const intro = "Starfighter, you have been recruited by the Star League to defend the frontier against Zur and the Codann armada. Victory or death. Good luck Starfighter.";
        speechSynthesis.speak(new SpeechSynthesisUtterance(intro));

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
            // RESUME
            btn.textContent = 'PAUSE';
            isUpdating = true;
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
            // PAUSE
            btn.textContent = 'RESUME';
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
            reinforcementDay = 4; // US assets arrive Day 4 instead of 7
            addKill(`<span style="color:#4499ff;font-weight:bold;">🇯🇵 JAPAN BASING: AUTHORIZED</span> — US strike operations from Okinawa/Misawa enabled. Reinforcements accelerated to Day 4. WARNING: PLA may now target Japanese bases — expect northeast threat vector.`);
            speak('Japan basing authorized. US reinforcements accelerated.', 1);
            // Schedule northeast threat vector starting next wave
            setTimeout(() => {
                if (playing && japanBasingEnabled) {
                    addKill(`<span style="color:#ff4444;font-weight:bold;">[PLA AI] JAPAN RESPONSE:</span> PLA activating northeast attack corridor — targeting Japan basing assets.`);
                    plaMemory.weights.jet = Math.min(3.0, plaMemory.weights.jet + 0.5);
                }
            }, 45000);
        } else {
            reinforcementDay = 7;
            addKill(`<span style="color:#4499ff;">JAPAN BASING: WITHDRAWN</span> — US operations reverting to Guam. Reinforcement timeline extended to Day 7.`);
        }
    };
    document.getElementById('empBtn').onclick      = fireEMPInterdiction;
    var himBtnWire = document.getElementById('himarsBtn');
    if (himBtnWire) himBtnWire.onclick = fireHimars;
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

