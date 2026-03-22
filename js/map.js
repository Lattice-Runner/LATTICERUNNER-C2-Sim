// ============================================================
// map.js — Mapbox GL map init and layer setup
// ============================================================

    var map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/satellite-streets-v12',
        center: [base.lng, base.lat],
        zoom: 9,
        pitch: 45
    });

    map.on('load', () => {

        // Base marker
        map.addSource('base-icon', {
            type: 'geojson',
            data: { type: 'Feature', geometry: { type: 'Point', coordinates: [base.lng, base.lat] } }
        });
        map.addLayer({
            id: 'base-icon-layer',
            type: 'circle',
            source: 'base-icon',
            paint: {
                'circle-radius': 8,
                'circle-color': '#0066ff',
                'circle-stroke-width': 2,
                'circle-stroke-color': '#ffffff'
            }
        });
        map.addLayer({
            id: 'base-text-layer',
            type: 'symbol',
            source: 'base-icon',
            layout: { 'text-field': 'H', 'text-size': 10, 'text-allow-overlap': true },
            paint: { 'text-color': '#ffffff' }
        });

        // CLG perimeter ring
        map.addSource('clg-source', {
            type: 'geojson',
            data: { type: 'Feature', geometry: { type: 'Point', coordinates: [base.lng, base.lat] } }
        });
        map.addLayer({
            id: 'clg-perimeter',
            type: 'circle',
            source: 'clg-source',
            paint: {
                'circle-radius': ['interpolate', ['exponential', 2], ['zoom'], 10, 11, 14, 180, 22, 46080],
                'circle-color': '#ff00ff',
                'circle-opacity': 0,
                'circle-stroke-width': 2,
                'circle-stroke-color': '#ff00ff',
                'circle-stroke-opacity': 0
            }
        });

        // Friendly units
        map.addSource('friends', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
        map.addLayer({
            id: 'friends-layer',
            type: 'circle',
            source: 'friends',
            paint: {
                'circle-radius': 5,
                'circle-color': '#00ffaa',
                'circle-stroke-width': 1,
                'circle-stroke-color': '#ffffff'
            }
        });
        map.addSource('friend-headings', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
        map.addLayer({
            id: 'heading-layer',
            type: 'line',
            source: 'friend-headings',
            paint: { 'line-color': '#00ffaa', 'line-width': 2, 'line-opacity': 0.7 }
        });
        map.addLayer({
            id: 'friends-labels',
            type: 'symbol',
            source: 'friends',
            layout: {
                'text-field': ['get', 'name'],
                'text-size': 10,
                'text-offset': [0, 1.2],
                'text-allow-overlap': true,
                'text-ignore-placement': true
            },
            paint: { 'text-color': '#00ffaa', 'text-halo-color': '#000', 'text-halo-width': 1 }
        });

        // Enemy units
        map.addSource('enemies', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
        map.addLayer({
            id: 'enemies-layer',
            type: 'circle',
            source: 'enemies',
            paint: {
                'circle-radius': ['case', ['get', 'isSwarmUnit'], 3, ['get', 'isLoitererUnit'], 7, 5],
                'circle-color': ['case',
                    ['all', ['>=', ['get', 'confidence'], 80], ['==', ['get', 'isHypersonic'], true]], '#ff00ff', // DF-17 HOSTILE — magenta
                    ['all', ['>=', ['get', 'confidence'], 80], ['==', ['get', 'isCruiseMissile'], true]], '#ff8800', // CJ-10 HOSTILE — orange
                    ['>=', ['get', 'confidence'], 80], '#ff0000',   // HOSTILE — red
                    ['>=', ['get', 'confidence'], 40], '#ff9900',   // SUSPECT — orange
                    '#ffff00'                                        // UNKNOWN — yellow
                ],
                'circle-opacity': 0.9,
                'circle-stroke-width': 1,
                'circle-stroke-color': '#000'
            }
        });
        map.addLayer({
            id: 'enemies-labels',
            type: 'symbol',
            source: 'enemies',
            layout: {
                // Confidence tiers: UNKNOWN → SUSPECT → HOSTILE
                'text-field': ['case',
                    ['all', ['<', ['get', 'confidence'], 40], ['==', ['get', 'isHypersonic'], true]], '[ HYPERSONIC ]',
                    ['all', ['<', ['get', 'confidence'], 40], ['==', ['get', 'isCruiseMissile'], true]], '[ CRUISE ]',
                    ['<', ['get', 'confidence'], 40],  '[ UNKNOWN ]',
                    ['<', ['get', 'confidence'], 80],  ['concat', '[ SUSPECT ]\n', ['get', 'altLabel']],
                    ['get', 'isSwarmUnit'],    ['concat', 'FPV SWARM\n',       ['get', 'altLabel']],
                    ['get', 'isLoitererUnit'], ['concat', 'TB-001 LOITERER\n', ['get', 'altLabel']],
                    ['concat', 'CH-4 STRIKE\n', ['get', 'altLabel']]
                ],
                'text-size': 9,
                'text-offset': [0, -1.2],
                'text-allow-overlap': true,
                'text-ignore-placement': true
            },
            paint: {
                'text-color': ['case', ['==', ['get', 'identified'], true], '#ff3333', '#ffff00'],
                'text-halo-color': '#000',
                'text-halo-width': 1
            }
        
        });

        // Projectiles
        map.addSource('projectiles', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
        map.addLayer({
            id: 'projectiles-layer',
            type: 'circle',
            source: 'projectiles',
            paint: {
                'circle-radius': 3,
                'circle-color': ['case', ['get', 'isEMP'], '#00ffff', '#00ff00']
            }
        });
        map.addSource('missile-trails', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
        map.addLayer({
            id: 'missile-trails-layer',
            type: 'line',
            source: 'missile-trails',
            paint: { 'line-color': '#00ff00', 'line-width': 2, 'line-opacity': 0.8 }
        });
        map.addLayer({
            id: 'projectiles-labels',
            type: 'symbol',
            source: 'projectiles',
            layout: {
                'text-field': ['case', ['get', 'isEMP'], 'EMP', ''],
                'text-size': 9,
                'text-offset': [0, 1],
                'text-allow-overlap': true,
                'text-ignore-placement': true
            },
            paint: { 'text-color': '#00ffff', 'text-halo-color': '#000', 'text-halo-width': 1 }
        });

        // ── HOVER TOOLTIP EVENT HANDLERS ─────────────────────────

        // Naval ships hover
        map.on('mouseenter', 'naval-ships-layer', e => {
            map.getCanvas().style.cursor = 'crosshair';
            const props = e.features[0].properties;
            const id = props.shipId || (props.label ? props.label.split('\n')[0].replace(/^[⬟◆▣✦◈▸] /, '') : '');
            // Find ship in PLAN_SAG or US_CSG
            const ship = [...PLAN_SAG, ...US_CSG].find(s => s.id === id);
            const info = SHIP_INFO[id];
            if (!info) return;
            let status = 'OPERATIONAL';
            if (ship && !ship.alive) status = 'SUNK';
            else if (ship && ship.health < ship.maxHealth * 0.5) status = 'DAMAGED';
            const isPlan = PLAN_SAG.some(s => s.id === id);
            const color = isPlan ? '#ff4444' : '#4499ff';
            const h = buildTooltipHTML(info, status, ship?.health, ship?.maxHealth);
            showTooltip(e, h, color);
        });
        map.on('mousemove', 'naval-ships-layer', e => positionTooltip(e));
        map.on('mouseleave', 'naval-ships-layer', () => { map.getCanvas().style.cursor = ''; hideTooltip(); });

        // Enemy jets hover
        map.on('mouseenter', 'enemy-jets-layer', e => {
            map.getCanvas().style.cursor = 'crosshair';
            const props = e.features[0].properties;
            const jType = props.jtype || 'J-16';
            const info = JET_INFO[jType] || JET_INFO['J-16'];
            const alive = props.alive !== false;
            const status = alive ? 'AIRBORNE' : 'DESTROYED';
            const color = '#ff4444';
            const h = buildTooltipHTML(info, status);
            showTooltip(e, h, color);
        });
        map.on('mousemove', 'enemy-jets-layer', e => positionTooltip(e));
        map.on('mouseleave', 'enemy-jets-layer', () => { map.getCanvas().style.cursor = ''; hideTooltip(); });

        // Enemy amphibious hover
        map.on('mouseenter', 'enemy-amphibious-layer', e => {
            map.getCanvas().style.cursor = 'crosshair';
            const props = e.features[0].properties;
            const health = props.health || 0;
            const maxHealth = 3;
            const alive = props.alive !== false;
            const status = !alive ? 'SUNK' : health < 2 ? 'DAMAGED' : 'UNDERWAY';
            const info = { ...TRANSPORT_INFO };
            const h = buildTooltipHTML(info, status, health, maxHealth);
            showTooltip(e, h, '#ff7700');
        });
        map.on('mousemove', 'enemy-amphibious-layer', e => positionTooltip(e));
        map.on('mouseleave', 'enemy-amphibious-layer', () => { map.getCanvas().style.cursor = ''; hideTooltip(); });

        // Friendly patrol boats + carrier jets hover
        map.on('mouseenter', 'friendly-patrols-layer', e => {
            map.getCanvas().style.cursor = 'crosshair';
            const props = e.features[0].properties;
            const label = (props.label || '').replace(/\n.*/,'').replace(/[◀▶▲▼⚓] /,'');
            let html = '';
            if (label.startsWith('CVN') || label.startsWith('DDG')) {
                const ship = US_CSG.find(s => s.id === label);
                const info = SHIP_INFO[label];
                if (info && ship) {
                    const status = !ship.alive ? 'SUNK' : ship.health < ship.maxHealth * 0.5 ? 'DAMAGED' : 'OPERATIONAL';
                    html = buildTooltipHTML(info, status, ship.health, ship.maxHealth);
                }
            } else {
                // ROC Patrol Boat
                html = `<div class="tt-title">ROC Patrol Boat</div>
                <div class="tt-divider"></div>
                <div class="tt-row"><span>Type</span><span>Tuo Chiang-class corvette</span></div>
                <div class="tt-row"><span>Weapons</span><span>Hsiung Feng II/III AShM</span></div>
                <div class="tt-row"><span>Role</span><span>Strait picket, anti-landing</span></div>
                <div class="tt-row"><span>CSIS</span><span>ROC Navy's primary counter to PLAN amphibious forces in the strait. Fast, shallow-draft, difficult to target.</span></div>`;
            }
            if (html) showTooltip(e, html, '#4499ff');
        });
        map.on('mousemove', 'friendly-patrols-layer', e => positionTooltip(e));
        map.on('mouseleave', 'friendly-patrols-layer', () => { map.getCanvas().style.cursor = ''; hideTooltip(); });

        // Missile sites hover
        map.on('mouseenter', 'missile-sites-markers', e => {
            map.getCanvas().style.cursor = 'crosshair';
            const name = e.features[0].properties.name.replace(/\n/g, ' — ');
            const html = `<div class="tt-title" style="color:#ff4444">${name}</div>
            <div class="tt-divider"></div>
            <div class="tt-row"><span>Status</span><span style="color:#ff4444">ACTIVE — LAUNCHING</span></div>
            <div class="tt-row"><span>CSIS</span><span>Eastern Theater Command missile forces. Primary launch facilities identified by CSIS and DIA open-source analysis. These sites represent the first-strike capability modeled in CSIS "First Battle of the Next War."</span></div>`;
            showTooltip(e, html, '#ff4444');
        });
        map.on('mousemove', 'missile-sites-markers', e => positionTooltip(e));
        map.on('mouseleave', 'missile-sites-markers', () => { map.getCanvas().style.cursor = ''; hideTooltip(); });

        // Naval battle ships
        map.addSource('naval-ships', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
        map.addLayer({ id: 'naval-ships-layer', type: 'circle', source: 'naval-ships',
            paint: { 'circle-radius': 7, 'circle-color': ['get', 'color'],
                     'circle-stroke-width': 2, 'circle-stroke-color': '#ffffff',
                     'circle-opacity': 0.9 } });
        map.addLayer({ id: 'naval-ships-labels', type: 'symbol', source: 'naval-ships',
            layout: { 'text-field': ['get', 'label'], 'text-size': 10,
                      'text-offset': [0, -1.8], 'text-allow-overlap': true,
                      'text-ignore-placement': true },
            paint: { 'text-color': ['get', 'color'], 'text-halo-color': '#000', 'text-halo-width': 2 } });

        // PLA missile launcher sites on mainland — based on CSIS estimated positions
        const missileSites = [
            // DF-17 hypersonic glide vehicle brigades — Eastern Theater Command
            { name: 'DF-17 96B Brigade\nFuzhou',         lat: 26.08, lng: 119.28 },
            { name: 'DF-17 96B Brigade\nLongyan',        lat: 25.10, lng: 117.02 },
            // CJ-10 cruise missile — H-6K launch bases
            { name: 'H-6K/CJ-10\nHuian Air Base',       lat: 24.97, lng: 118.63 },
            { name: 'H-6K/CJ-10\nLongtian Air Base',    lat: 25.78, lng: 119.57 },
            // DF-16 / DF-21 ballistic missile brigades
            { name: 'DF-16 Brigade\nYongan',             lat: 25.97, lng: 117.37 },
            { name: 'DF-21D\nMeizhou',                   lat: 24.29, lng: 116.12 },
            // Amphibious staging
            { name: 'PLAN Amphibious\nQuanzhou Naval',   lat: 24.88, lng: 118.59 },
            { name: 'PLAN Amphibious\nZhoushan Naval',   lat: 29.99, lng: 122.20 },
        ];
        map.addSource('missile-sites', {
            type: 'geojson',
            data: {
                type: 'FeatureCollection',
                features: missileSites.map(s => ({
                    type: 'Feature',
                    geometry: { type: 'Point', coordinates: [s.lng, s.lat] },
                    properties: { name: s.name }
                }))
            }
        });
        map.addLayer({
            id: 'missile-sites-layer',
            type: 'symbol',
            source: 'missile-sites',
            layout: {
                'text-field': ['get', 'name'],
                'text-size': 9,
                'text-anchor': 'top',
                'text-offset': [0, 0.8],
                'text-allow-overlap': false,
                'text-ignore-placement': false,
                'icon-image': '',
            },
            paint: { 'text-color': '#ff4444', 'text-halo-color': '#000', 'text-halo-width': 1.5 }
        });
        // Red triangle markers for sites
        map.addLayer({
            id: 'missile-sites-markers',
            type: 'circle',
            source: 'missile-sites',
            paint: {
                'circle-radius': 5,
                'circle-color': '#ff2222',
                'circle-stroke-width': 1,
                'circle-stroke-color': '#ff6666',
                'circle-opacity': 0.85
            }
        });

        // Fury jets
        map.addSource('fury-jets', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
        map.addLayer({
            id: 'fury-jets-layer',
            type: 'circle',
            source: 'fury-jets',
            paint: {
                'circle-radius': 8,
                'circle-color': '#00ffff',
                'circle-stroke-width': 2,
                'circle-stroke-color': '#ffffff'
            }
        });
        map.addLayer({
            id: 'fury-jets-labels',
            type: 'symbol',
            source: 'fury-jets',
            layout: {
                'text-field': ['get', 'id'],
                'text-size': 11,
                'text-offset': [0, -1.5],
                'text-allow-overlap': true,
                'text-ignore-placement': true
            },
            paint: { 'text-color': '#00ffff', 'text-halo-color': '#000', 'text-halo-width': 2 }
        });

        // Fury missiles
        map.addSource('fury-missiles', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
        map.addLayer({
            id: 'fury-missiles-layer',
            type: 'circle',
            source: 'fury-missiles',
            paint: {
                'circle-radius': 3,
                'circle-color': '#ffaa00',
                'circle-stroke-width': 1,
                'circle-stroke-color': '#fff'
            }
        });
        map.addLayer({
            id: 'fury-missiles-labels',
            type: 'symbol',
            source: 'fury-missiles',
            layout: {
                'text-field': 'FOX-2',
                'text-size': 8,
                'text-offset': [0, 1],
                'text-allow-overlap': true,
                'text-ignore-placement': true
            },
            paint: { 'text-color': '#ffaa00', 'text-halo-color': '#000', 'text-halo-width': 1 }
        });

        // Explosions
        map.addSource('explosions', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
        map.addLayer({
            id: 'explosions-layer',
            type: 'circle',
            source: 'explosions',
            paint: {
                'circle-radius':  ['get', 'radius'],
                'circle-color':   ['get', 'color'],
                'circle-opacity': ['get', 'opacity']
            }
        });

        // Friendly drone squads (Altius, Anvil, RR Interceptors)
        map.addSource('friendly-drones', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
        map.addLayer({
            id: 'friendly-drones-layer',
            type: 'circle',
            source: 'friendly-drones',
            paint: {
                'circle-radius': 4,
                'circle-color': ['get', 'color'],
                'circle-stroke-width': 1,
                'circle-stroke-color': '#fff'
            }
        });
        map.addLayer({
            id: 'friendly-drones-labels',
            type: 'symbol',
            source: 'friendly-drones',
            layout: {
                'text-field': ['get', 'label'],
                'text-size': 8,
                'text-offset': [0, -1.4],
                'text-allow-overlap': true,
                'text-ignore-placement': true
            },
            paint: { 'text-color': ['get', 'color'], 'text-halo-color': '#000', 'text-halo-width': 1 }
        });

        // ── SENSOR LAYER RINGS ──────────────────────────────────────

        // Radar ring — long range, faint blue
        map.addSource('radar-ring', {
            type: 'geojson',
            data: { type: 'Feature', geometry: { type: 'Point', coordinates: [base.lng, base.lat] } }
        });
        map.addLayer({
            id: 'radar-ring-layer',
            type: 'circle',
            source: 'radar-ring',
            paint: {
                'circle-radius': ['interpolate', ['exponential', 2], ['zoom'], 10, 60, 14, 960, 22, 245760],
                'circle-color': '#0044ff',
                'circle-opacity': 0.03,
                'circle-stroke-width': 1,
                'circle-stroke-color': '#0044ff',
                'circle-stroke-opacity': 0.25
            }
        });

        // Ground detection ring — short range, amber
        map.addSource('ground-detect-ring', {
            type: 'geojson',
            data: { type: 'Feature', geometry: { type: 'Point', coordinates: [base.lng, base.lat] } }
        });
        map.addLayer({
            id: 'ground-detect-layer',
            type: 'circle',
            source: 'ground-detect-ring',
            paint: {
                'circle-radius': ['interpolate', ['exponential', 2], ['zoom'], 10, 13, 14, 213, 22, 54613],
                'circle-color': '#ff9900',
                'circle-opacity': 0.04,
                'circle-stroke-width': 1,
                'circle-stroke-color': '#ff9900',
                'circle-stroke-opacity': 0.3
            }
        });

        // EO/IR cones — rendered per-drone as thin triangles in refresh()
        map.addSource('eoir-cones', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
        map.addLayer({
            id: 'eoir-cones-layer',
            type: 'fill',
            source: 'eoir-cones',
            paint: {
                'fill-color': '#00ffcc',
                'fill-opacity': 0.08
            }
        });

        // Enemy amphibious ships layer
        map.addSource('enemy-amphibious', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
        map.addLayer({
            id: 'enemy-amphibious-layer',
            type: 'circle',
            source: 'enemy-amphibious',
            paint: {
                'circle-radius': 8,
                'circle-color': '#ff3300',
                'circle-stroke-width': 2,
                'circle-stroke-color': '#ff6600',
                'circle-opacity': 0.9
            }
        });
        map.addLayer({
            id: 'enemy-amphibious-label',
            type: 'symbol',
            source: 'enemy-amphibious',
            layout: { 'text-field': ['get', 'label'], 'text-size': 10, 'text-offset': [0, 1.5], 'text-allow-overlap': true },
            paint: { 'text-color': '#ff6600' }
        });

        // Friendly patrol boats layer
        map.addSource('friendly-patrols', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
        map.addLayer({
            id: 'friendly-patrols-layer',
            type: 'circle',
            source: 'friendly-patrols',
            paint: {
                'circle-radius': 7,
                'circle-color': '#ff9900',
                'circle-stroke-width': 2,
                'circle-stroke-color': '#ffcc00',
                'circle-opacity': 0.9
            }
        });
        map.addLayer({
            id: 'friendly-patrols-label',
            type: 'symbol',
            source: 'friendly-patrols',
            layout: { 'text-field': ['get', 'label'], 'text-size': 10, 'text-offset': [0, 1.5], 'text-allow-overlap': true },
            paint: { 'text-color': '#ffcc00' }
        });

        // ADS-B live aircraft layer
        map.addSource('adsb-aircraft', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
        map.addLayer({
            id: 'adsb-layer',
            type: 'circle',
            source: 'adsb-aircraft',
            paint: {
                'circle-radius': 4,
                'circle-color': '#ffffff',
                'circle-opacity': 0.7,
                'circle-stroke-width': 1,
                'circle-stroke-color': '#aaaaaa'
            }
        });
        map.addLayer({
            id: 'adsb-labels',
            type: 'symbol',
            source: 'adsb-aircraft',
            layout: {
                'text-field': ['get', 'label'],
                'text-size': 8,
                'text-offset': [0, -1.4],
                'text-allow-overlap': false,
                'text-ignore-placement': false
            },
            paint: {
                'text-color': '#cccccc',
                'text-halo-color': '#000000',
                'text-halo-width': 1
            }
        });

        // Flare particles
        map.addSource('jet-flares', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
        map.addLayer({
            id: 'jet-flares-layer',
            type: 'circle',
            source: 'jet-flares',
            paint: {
                'circle-radius': 3,
                'circle-color': '#ffaa00',
                'circle-opacity': 0.85,
                'circle-stroke-width': 0
            }
        });

        // Enemy jets and jet missiles
        map.addSource('enemy-jets', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
        map.addLayer({
            id: 'enemy-jets-layer',
            type: 'circle',
            source: 'enemy-jets',
            paint: {
                'circle-radius': 9,
                'circle-color': '#ff2200',
                'circle-stroke-width': 2,
                'circle-stroke-color': '#ffffff'
            }
        });
        map.addLayer({
            id: 'enemy-jets-labels',
            type: 'symbol',
            source: 'enemy-jets',
            layout: {
                'text-field': ['get', 'type'],
                'text-size': 11,
                'text-offset': [0, -1.8],
                'text-allow-overlap': true,
                'text-ignore-placement': true
            },
            paint: { 'text-color': '#ff2200', 'text-halo-color': '#000', 'text-halo-width': 2 }
        });
        map.addSource('jet-missiles', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
        map.addLayer({
            id: 'jet-missiles-layer',
            type: 'circle',
            source: 'jet-missiles',
            paint: {
                'circle-radius': 5,
                'circle-color': '#ff6600',
                'circle-stroke-width': 1,
                'circle-stroke-color': '#fff'
            }
        });
        map.addLayer({
            id: 'jet-missiles-labels',
            type: 'symbol',
            source: 'jet-missiles',
            layout: {
                'text-field': 'PL-15 AGM',
                'text-size': 9,
                'text-offset': [0, 1.3],
                'text-allow-overlap': true,
                'text-ignore-placement': true
            },
            paint: { 'text-color': '#ff6600', 'text-halo-color': '#000', 'text-halo-width': 1 }
        });

        // XRST towers — fixed sensor nodes
        map.addSource('xrst-towers', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
        // Detection rings
        map.addLayer({
            id: 'xrst-rings',
            type: 'circle',
            source: 'xrst-towers',
            paint: {
                // Scale ring to approximate XRST_DETECT_RANGE visually at zoom 14
                'circle-radius': ['interpolate', ['exponential', 2], ['zoom'], 10, 30, 14, 480, 22, 122880],
                'circle-color': ['case', ['get', 'online'], '#00ffff', '#555555'],
                'circle-opacity': 0.04,
                'circle-stroke-width': 1,
                'circle-stroke-color': ['case', ['get', 'online'], '#00ffff', '#555555'],
                'circle-stroke-opacity': ['case', ['get', 'online'], 0.5, 0.2]
            }
        });
        // Tower dot markers
        map.addLayer({
            id: 'xrst-dots',
            type: 'circle',
            source: 'xrst-towers',
            paint: {
                'circle-radius': 7,
                'circle-color': ['case', ['get', 'online'], '#00ffff', '#444444'],
                'circle-stroke-width': 2,
                'circle-stroke-color': ['case', ['get', 'online'], '#ffffff', '#666666']
            }
        });
        // Tower labels
        map.addLayer({
            id: 'xrst-labels',
            type: 'symbol',
            source: 'xrst-towers',
            layout: {
                'text-field': ['get', 'id'],
                'text-size': 10,
                'text-offset': [0, 1.5],
                'text-allow-overlap': true,
                'text-ignore-placement': true
            },
            paint: {
                'text-color': ['case', ['get', 'online'], '#00ffff', '#666666'],
                'text-halo-color': '#000',
                'text-halo-width': 1
            }
        });

        map.resize();
    
        // Boot the game only after map sources and layers are ready
        init();
        setInterval(update, 250);
        document.getElementById('killfeed').innerHTML =
            'Awaiting Tactical Input. Please press START SYSTEM.'
            + '<span class="dot dot1">.</span>'
            + '<span class="dot dot2">.</span>'
            + '<span class="dot dot3">.</span><br>';
    });
