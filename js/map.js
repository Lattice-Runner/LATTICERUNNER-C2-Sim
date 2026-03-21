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
