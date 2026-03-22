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
                        isHypersonic: e.isHypersonic || false,
                        isCruiseMissile: e.isCruiseMissile || false,
                        identified: e.identified,
                        confidence: e.confidence || 0,
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
                    label: d.id,
                    color: '#00ffcc'
                }
            })),
            ...anvilSquad.filter(d => d.alive).map(d => ({
                type: 'Feature',
                geometry: { type: 'Point', coordinates: [d.lng, d.lat] },
                properties: {
                    label: d.id,
                    color: '#cc44ff'
                }
            })),
            ...rrSquad.filter(d => d.alive).map(d => ({
                type: 'Feature',
                geometry: { type: 'Point', coordinates: [d.lng, d.lat] },
                properties: { label: d.id, color: '#00ffff' }
            }))
        ];
        map.getSource('friendly-drones')?.setData({ type: 'FeatureCollection', features: allDrones });

        // Enemy amphibious ships
        map.getSource('enemy-amphibious')?.setData({
            type: 'FeatureCollection',
            features: enemyAmphibious.filter(s => s.alive).map(s => ({
                type: 'Feature',
                geometry: { type: 'Point', coordinates: [s.lng, s.lat] },
                properties: { label: `${s.type}\n⚓`, health: s.health, maxHealth: s.maxHealth, alive: s.alive }
            }))
        });

        // Air squadrons
        if (navalBattleActive) {
            const cvn = US_CSG.find(s => s.id === 'CVN-76 Ronald Reagan');
            const allAir = [
                ...PLAAF_OOB,
                ...US_AIR_OOB.filter(sq => !sq.isJapanBased || japanBasingEnabled)
            ];
            map.getSource('air-squadrons')?.setData({
                type: 'FeatureCollection',
                features: allAir.map(sq => ({
                    type: 'Feature',
                    geometry: { type: 'Point', coordinates: [sq.lng, sq.lat] },
                    properties: {
                        sqId: sq.id,
                        color: sq.alive && sq.sorties > 0 ? sq.color : '#444',
                        degraded: !sq.alive || sq.sorties <= 0,
                        label: `${sq.type}
${sq.sorties > 0 ? sq.sorties + ' sorties' : 'DEPLETED'}`
                    }
                }))
            });
        }

        // Landing zones — activate by day
        if (playing) {
            const activeLZs = LANDING_ZONES.filter(lz => dayNumber >= lz.dayActivated);
            if (activeLZs.length > 0) landingZonesActive = true;
            // Update status and troops based on naval kills and base health
            activeLZs.forEach(lz => {
                if (lz.status === 'STAGING') lz.status = 'APPROACH';
                if (lz.status === 'APPROACH' && dayNumber >= lz.dayActivated + 1) lz.status = 'CONTESTED';
                // Naval kills degrade landing capacity
                if (navalPlanKills >= 2 && lz.threat === 'PRIMARY') lz.status = 'DEGRADED';
                if (navalPlanKills >= 3) lz.status = 'SUPPRESSED';
                // Troop accumulation
                if (lz.status === 'CONTESTED') lz.troopsLanded = Math.min(10000, lz.troopsLanded + 200);
            });
            map.getSource('landing-zones')?.setData({
                type: 'FeatureCollection',
                features: activeLZs.map(lz => ({
                    type: 'Feature',
                    geometry: { type: 'Point', coordinates: [lz.lng, lz.lat] },
                    properties: {
                        lzId: lz.id,
                        color: lz.status === 'SUPPRESSED' ? '#555' : lz.status === 'DEGRADED' ? '#ff9900' : lz.color,
                        label: `${lz.id}
${lz.status}`
                    }
                }))
            });
        }

        // Naval battle ships
        if (navalBattleActive) {
            const allNaval = [...PLAN_SAG, ...US_CSG, ...(japanBasingEnabled ? JAPAN_DDG_SQUADRON : [])];
            map.getSource('naval-ships')?.setData({
                type: 'FeatureCollection',
                features: allNaval.map(s => {
                    const sunk = !s.alive;
                    const col  = sunk ? '#333333' : s.color;
                    const bar  = sunk ? '✕ SUNK' : ('█'.repeat(s.health) + '░'.repeat(s.maxHealth - s.health));
                    return {
                        type: 'Feature',
                        geometry: { type: 'Point', coordinates: [s.lng, s.lat] },
                        properties: {
                            color: col,
                            shipId: s.id,
                            label: `${s.symbol} ${s.id}\n${bar}`
                        }
                    };
                })
            });
        }

        // Friendly patrol boats + carrier jets
        map.getSource('friendly-patrols')?.setData({
            type: 'FeatureCollection',
            features: friendlyPatrols.filter(p => p.alive).map(p => {
                // Calculate directional arrow from heading
                let arrow = '⚓';
                if (p.isCarrierJet) {
                    const deg = ((p.heading || Math.PI) * 180 / Math.PI + 360) % 360;
                    if      (deg >= 337 || deg < 22)  arrow = '▲'; // N
                    else if (deg >= 22  && deg < 67)  arrow = '▶'; // NE → use right-ish
                    else if (deg >= 67  && deg < 112) arrow = '▶'; // E
                    else if (deg >= 112 && deg < 157) arrow = '▶'; // SE
                    else if (deg >= 157 && deg < 202) arrow = '▼'; // S/SW — flying west = left
                    else if (deg >= 202 && deg < 247) arrow = '◀'; // W
                    else if (deg >= 247 && deg < 292) arrow = '◀'; // NW
                    else                              arrow = '▲'; // N
                    // Carrier jets fly west (heading ~PI = 180°) so ◀
                }
                return {
                    type: 'Feature',
                    geometry: { type: 'Point', coordinates: [p.lng, p.lat] },
                    properties: { label: `${p.id}\n${arrow}` }
                };
            })
        });

        // EO/IR drone camera cones
        const eoirFeatures = [];
        [...altiusSquad, ...anvilSquad].forEach(drone => {
            if (!drone.alive) return;
            const targetE = enemies.find(t => t.id === drone.targetId && t.alive);
            const headingLng = targetE ? targetE.lng - drone.lng : drone.lng - base.lng;
            const headingLat = targetE ? targetE.lat - drone.lat : drone.lat - base.lat;
            const heading = Math.atan2(headingLat, headingLng);
            const coneRad = EOIR_CONE_RANGE;
            const halfAngle = (EOIR_CONE_ANGLE / 2) * (Math.PI / 180);
            const leftAngle  = heading - halfAngle;
            const rightAngle = heading + halfAngle;
            // Build triangle polygon: drone tip → left edge → right edge
            eoirFeatures.push({
                type: 'Feature',
                geometry: {
                    type: 'Polygon',
                    coordinates: [[
                        [drone.lng, drone.lat],
                        [drone.lng + Math.cos(leftAngle)  * coneRad, drone.lat + Math.sin(leftAngle)  * coneRad],
                        [drone.lng + Math.cos(rightAngle) * coneRad, drone.lat + Math.sin(rightAngle) * coneRad],
                        [drone.lng, drone.lat]
                    ]]
                }
            });
        });
        map.getSource('eoir-cones')?.setData({ type: 'FeatureCollection', features: eoirFeatures });

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
                properties: { jtype: j.type, label: j.id, alive: j.alive }
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
    function toggleMusicPause() {
        const music = document.getElementById('bgMusic');
        const btn   = document.getElementById('musicPauseBtn');
        if (music.paused) {
            music.play();
            if (btn) btn.textContent = '⏸';
        } else {
            music.pause();
            if (btn) btn.textContent = '▶';
        }
    }

