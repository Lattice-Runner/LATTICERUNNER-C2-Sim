// ============================================================
// audio.js — music metadata, playlist, playback
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
