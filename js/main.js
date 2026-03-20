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
            btn.textContent = 'PAUSE';
            speechSynthesis.cancel();
            isUpdating = true;
            if (!telemetryInterval)    telemetryInterval    = setInterval(readTelemetry, 120000);
            if (!resumeInterval)       resumeInterval       = setInterval(simulateResume, 600000);
            if (!recommendationInterval) recommendationInterval = setInterval(recommendSystem, 1000);
            // Restart wave timer on resume only if the field is clear
            if (!waveTimer && enemies.filter(e => e.alive).length === 0) {
                const delay = (waveNumber === 1) ? 3000 : 35000;
                waveTimer = setTimeout(spawnWave, delay);
            }
            music.play().catch(() => {});
            addKill('<span style="color:#00ffaa;font-weight:bold;">SYSTEM:</span> Resumed.');
        } else {
            btn.textContent = 'RESUME';
            music.pause();
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

    document.getElementById('empBtn').onclick      = fireEMPInterdiction;
    document.getElementById('clgBtn').onclick      = toggleCLG;
    document.getElementById('ttuBtn').onclick      = activateTTU;
    document.getElementById('orsBtn').onclick      = activateORS;
    document.getElementById('furyBtn').onclick     = launchFurySquad;
    document.getElementById('altiusBtn').onclick   = launchAltius;
    document.getElementById('anvilBtn').onclick    = launchAnvil;
    document.getElementById('rrDeployBtn').onclick = launchRRDeploy;

    // ============================================================
    // BOOT
    // ============================================================
    init();
    setInterval(update, 250);
    document.getElementById('killfeed').innerHTML =
        'Awaiting Tactical Input. Please press START SYSTEM.' +
        '<span class="dot dot1">.</span>' +
        '<span class="dot dot2">.</span>' +
        '<span class="dot dot3">.</span><br>';

