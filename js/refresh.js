// ============================================================
// refresh.js — map source updates every tick
// ============================================================

    function refresh() {
        if (!map.getSource('friends')) return;

        // Friendly units
        map.getSource('friends')?.setData({
            type: 'FeatureCollection',
            features: friends.filter(f => f.id !== 0).map(f => ({
                type: 'Feature',
                geometry: { type: 'Point', coordinates: [f.lng, f.lat] },
                properties: { name: f.name }
            }))
        });

        // Heading indicator lines
        const headingFeatures = friends.filter(f => f.id !== 0).map(f => {
            const len = 0.0005;
            const rad = (f.bearing + 90) * (Math.PI / 180);
            return {
                type: 'Feature',
                geometry: {
                    type: 'LineString',
                    coordinates: [
                        [f.lng, f.lat],
                        [f.lng + Math.cos(rad) * len, f.lat + Math.sin(rad) * len]
                    ]
                }
            };
        });
        if (!map.getSource('friend-headings')) {
            map.addSource('friend-headings', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
            map.addLayer({ id: 'heading-layer', type: 'line', source: 'friend-headings', paint: { 'line-color': '#00ffaa', 'line-width': 2, 'line-opacity': 0.7 } });
        }
        map.getSource('friend-headings')?.setData({ type: 'FeatureCollection', features: headingFeatures });

        // Enemies
        map.getSource('enemies')?.setData({
            type: 'FeatureCollection',
            features: enemies.filter(e => e.alive).map(e => {
                // Altitude label — show altitude and descent indicator once identified
                const altM     = Math.round((e.alt || 0) / 10) * 10;
                const distToB  = Math.hypot(e.lng - base.lng, e.lat - base.lat);
                const descending = distToB < ALT_DESCENT_START_RANGE && altM > 0;
                const altLabel = e.identified
                    ? `${altM}m${descending ? ' ↓' : ''}`
                    : '';
                return {
                    type: 'Feature',
                    geometry: { type: 'Point', coordinates: [e.lng, e.lat] },
                    properties: {
                        alive: e.alive,
                        isSwarmUnit: e.isSwarmUnit,
                        isLoitererUnit: e.isLoitererUnit,
                        identified: e.identified,
                        altLabel
                    }
                };
            })
        });

        // Projectiles
        map.getSource('projectiles')?.setData({
            type: 'FeatureCollection',
            features: projectiles.map(p => ({
                type: 'Feature',
                geometry: { type: 'Point', coordinates: [p.lng, p.lat] },
                properties: { isAntiPacket: p.isAntiPacket, isEMP: p.isEMP }
            }))
        });

        // Missile trails
        const missileTrails = projectiles.filter(p => !p.isEMP).map(p => {
            const tailLen = 1;
            const tailLng = p.lng - (p.vx * tailLen);
            const tailLat = p.lat - (p.vy * tailLen);
            return {
                type: 'Feature',
                geometry: { type: 'LineString', coordinates: [[tailLng, tailLat], [p.lng, p.lat]] }
            };
        });
        map.getSource('missile-trails')?.setData({ type: 'FeatureCollection', features: missileTrails });

        // Fury jets
        map.getSource('fury-jets')?.setData({
            type: 'FeatureCollection',
            features: furySquad.map(j => ({
                type: 'Feature',
                geometry: { type: 'Point', coordinates: [j.lng, j.lat] },
                properties: { id: j.id }
            }))
        });

        // Fury missiles
        map.getSource('fury-missiles')?.setData({
            type: 'FeatureCollection',
            features: furyMissiles.map(m => ({
                type: 'Feature',
                geometry: { type: 'Point', coordinates: [m.lng, m.lat] }
            }))
        });

        // Explosions
        map.getSource('explosions')?.setData({
            type: 'FeatureCollection',
            features: explosions.map(e => ({
                type: 'Feature',
                geometry: { type: 'Point', coordinates: [e.lng, e.lat] },
                properties: { radius: e.radius, color: e.color, opacity: e.opacity }
            }))
        });

        // Friendly drone squads
        const allDrones = [
            ...altiusSquad.filter(d => d.alive).map(d => ({
                type: 'Feature',
                geometry: { type: 'Point', coordinates: [d.lng, d.lat] },
                properties: {
                    label: d.logisticsState === 'RTB' ? `${d.id}\nRTB` : d.id,
                    color: '#00ffcc'  // teal — same in-flight and RTB
                }
            })),
            ...anvilSquad.filter(d => d.alive).map(d => ({
                type: 'Feature',
                geometry: { type: 'Point', coordinates: [d.lng, d.lat] },
                properties: {
                    label: d.logisticsState === 'RTB' ? `${d.id}\nRTB` : d.id,
                    color: '#cc44ff'  // purple — same in-flight and RTB
                }
            })),
            ...rrSquad.filter(d => d.alive).map(d => ({
                type: 'Feature',
                geometry: { type: 'Point', coordinates: [d.lng, d.lat] },
                properties: { label: d.id, color: '#00ffff' }
            }))
        ];
        map.getSource('friendly-drones')?.setData({ type: 'FeatureCollection', features: allDrones });

        // ADS-B live aircraft
        map.getSource('adsb-aircraft')?.setData({
            type: 'FeatureCollection',
            features: adsbAircraft.map(a => ({
                type: 'Feature',
                geometry: { type: 'Point', coordinates: [a.lng, a.lat] },
                properties: {
                    label: a.alt
                        ? `${a.callsign}\n${Math.round(a.alt * 3.28084)}ft`
                        : a.callsign
                }
            }))
        });

        // Flare particles
        map.getSource('jet-flares')?.setData({
            type: 'FeatureCollection',
            features: jetFlares.map(f => ({
                type: 'Feature',
                geometry: { type: 'Point', coordinates: [f.lng, f.lat] }
            }))
        });

        // Enemy jets
        map.getSource('enemy-jets')?.setData({
            type: 'FeatureCollection',
            features: enemyJets.filter(j => j.alive).map(j => ({
                type: 'Feature',
                geometry: { type: 'Point', coordinates: [j.lng, j.lat] },
                properties: { type: j.type }
            }))
        });

        // Jet missiles
        map.getSource('jet-missiles')?.setData({
            type: 'FeatureCollection',
            features: jetMissiles.filter(m => !m.intercepted).map(m => ({
                type: 'Feature',
                geometry: { type: 'Point', coordinates: [m.lng, m.lat] }
            }))
        });

        // XRST towers
        map.getSource('xrst-towers')?.setData({
            type: 'FeatureCollection',
            features: xrstTowers.map(t => ({
                type: 'Feature',
                geometry: { type: 'Point', coordinates: [t.lng, t.lat] },
                properties: { id: t.id, online: t.online }
            }))
        });
    }

    // ============================================================
    // INITIALIZE AUDIO AND GAME (first start)
    // ============================================================
