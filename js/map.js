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
            const ship = [...PLAN_SAG, ...US_CSG, ...JAPAN_DDG_SQUADRON].find(s => s.id === id);
            const info = SHIP_INFO[id];
            if (!info) return;
            const isPlan = PLAN_SAG.some(s => s.id === id);
            const color = isPlan ? '#ff4444' : (JAPAN_DDG_SQUADRON.some(s=>s.id===id) ? '#00aaff' : '#4499ff');
            let status = 'OPERATIONAL';
            if (ship && !ship.alive) status = 'SUNK';
            else if (ship && ship.health < ship.maxHealth * 0.5) status = 'DAMAGED';
            let html = buildTooltipHTML(info, status, ship?.health, ship?.maxHealth);
            // Add sunk details if applicable
            if (ship && !ship.alive && ship.sunkBy) {
                html += `<div class="tt-divider"></div>
                <div class="tt-row"><span>SUNK BY</span><span style="color:#ff4444">${ship.sunkBy}</span></div>
                <div class="tt-row"><span>SUNK DAY</span><span>Day ${ship.sunkDay || '?'}</span></div>`;
                if (ship.damageLog && ship.damageLog.length > 0) {
                    html += `<div class="tt-row"><span>DAMAGE LOG</span><span>${ship.damageLog.slice(-3).join(', ')}</span></div>`;
                }
            }
            showTooltip(e, html, ship && !ship.alive ? '#555' : color);
        });
        map.on('mousemove', 'naval-ships-layer', e => positionTooltip(e));
        map.on('mouseleave', 'naval-ships-layer', () => { map.getCanvas().style.cursor = ''; hideTooltip(); });

        // Air squadron hover
        map.on('mouseenter', 'air-squadrons-layer', e => {
            map.getCanvas().style.cursor = 'crosshair';
            const sqId = e.features[0].properties.sqId;
            const sq = [...PLAAF_OOB, ...US_AIR_OOB].find(s => s.id === sqId);
            if (!sq) return;
            const isPLAAF = PLAAF_OOB.some(s => s.id === sqId);
            const status  = !sq.alive || sq.sorties <= 0 ? 'DEPLETED' : sq.losses > sq.sorties * 0.4 ? 'ATTRITED' : 'ACTIVE';
            const statusColor = status === 'DEPLETED' ? '#888' : status === 'ATTRITED' ? '#ff9900' : (isPLAAF ? '#ff4444' : '#4499ff');
            const cvn = US_CSG.find(s => s.id === 'CVN-76 Ronald Reagan');
            const baseNote = sq.fromCarrier ? `CVN-76 Ronald Reagan (${cvn && cvn.alive ? 'operational' : 'SUNK — sorties impossible'})` : sq.base;
            const japanNote = sq.isJapanBased && !japanBasingEnabled ? ' ⚠ Japan basing not authorized — standing down' : '';
            const AIR_INFO = {
                'J-20': ['~$110M', 'Mach 2.0+', 'PL-15 (internal), PL-10', 'Stealth strike, SEAD suppression', 'Most capable PLAAF asset. Low-observable with internal weapons bay. Designed to penetrate defended airspace and suppress US air defenses. CSIS notes J-20 is the primary threat to E-2D Hawkeyes and any ISR assets.'],
                'J-16': ['~$70M', 'Mach 2.0', 'PL-15, PL-10, LS-6 glide bombs, KG600 ECM pod', 'Strike, air superiority', 'Backbone of PLAAF strike capability. 200+ in service. Operates in large packages specifically to overwhelm US fighter screens. KG600 jamming pod degrades XRST detection.'],
                'J-10C': ['~$40M', 'Mach 2.0', 'PL-15, PL-10', 'Air superiority, fleet defense', 'Upgraded domestic fighter. Acts as medium-range CAP to defend PLAN surface group from US airpower while J-20 and J-16 prosecute offensive missions.'],
                'H-6K': ['~$30M', 'Mach 0.75', 'CJ-10 LACM x6 per aircraft', 'Long-range cruise missile launch', 'Primary CJ-10 launch platform. Standoff range means H-6K never enters contested airspace — fires from mainland and turns back. CSIS identifies destroying these aircraft or their bases as highest-value air interdiction target.'],
                'F/A-18E': ['~$70M', 'Mach 1.8', 'AIM-120D AMRAAM, AIM-9X, JDAM, HARPOON', 'Multi-role carrier strike', 'Primary carrier strike aircraft. Large payload, proven reliability. Less stealthy than F-35 but more sorties per day. CSIS: carrier air wing is decisive only with Japan basing — from Guam the range math does not work.'],
                'F/A-18F': ['~$70M', 'Mach 1.8', 'AIM-120D, AIM-9X, JDAM, SLAM-ER', 'Multi-role, two-seat strike', 'Two-seat variant used for complex strike coordination. Often leads packages targeting PLAN surface ships. CSIS notes US carrier air wing attrition rate in Taiwan scenarios is severe due to PLAN IAMD density.'],
                'EA-18G': ['~$67M', 'Mach 1.8', 'AGM-88 HARM, ALQ-99 jamming pods', 'Electronic warfare, SEAD', 'Grizzlies. The most critical aircraft in the carrier air wing. ALQ-99 jamming degrades PLAN radar and missile guidance — reducing hit probability on all US strike aircraft. CSIS identifies Growler attrition as a key vulnerability.'],
                'F-35A': ['~$80M', 'Mach 1.6', 'AIM-120D (internal), AIM-9X, JDAM-ER', 'Stealth multirole', 'Land-based stealth fighter from Japan. Only available if Japan basing authorized. CSIS identifies F-35 operations from Kadena as the single most effective Japan-basing contribution — low-observable aircraft can penetrate PLAN IAMD that stops F/A-18s.'],
                'F-35B': ['~$100M', 'Mach 1.6', 'AIM-120D (internal), AIM-9X, JDAM', 'Stealth STOVL strike', 'Marine Corps F-35B from Iwakuni. STOVL capability provides basing flexibility. Japan basing required. Combines stealth with ability to operate from austere bases if Kadena is hit.'],
                'B-21': ['~$700M+', 'Subsonic', 'Large internal payload — GBU-57 MOP, LRASM, nuclear', 'Strategic stealth strike', 'Raider. Next-generation stealth bomber. Classified performance. CSIS scenarios identify B-21 as the decisive long-range strike asset against hardened PLAN targets — underground command bunkers, missile bases. Few available.'],
                'B-2': ['~$2.1B', 'Mach 0.95', 'GBU-57 MOP, JDAM, LRASM, nuclear', 'Strategic stealth strike', 'Spirit. Based at Andersen AFB, Guam. 20 aircraft total — not all operational. CSIS wargames often begin by eliminating B-2 options due to limited numbers. Each B-2 lost is irreplaceable.'],
            };
            const info = AIR_INFO[sq.type] || ['Unknown', 'Unknown', 'Unknown', 'Unknown', 'No data'];
            const html = `<div class="tt-title" style="color:${statusColor}">${sq.id}</div>
            <div class="tt-row"><span>TYPE</span><span>${sq.type}</span></div>
            <div class="tt-row"><span>STATUS</span><span style="color:${statusColor}">${status}${japanNote}</span></div>
            <div class="tt-row"><span>BASE</span><span>${baseNote}</span></div>
            <div class="tt-row"><span>SORTIES</span><span>${sq.sorties} remaining / ${sq.losses} lost</span></div>
            <div class="tt-divider"></div>
            <div class="tt-row"><span>UNIT COST</span><span>${info[0]}</span></div>
            <div class="tt-row"><span>SPEED</span><span>${info[1]}</span></div>
            <div class="tt-row"><span>WEAPONS</span><span>${info[2]}</span></div>
            <div class="tt-row"><span>ROLE</span><span>${info[3]}</span></div>
            <div class="tt-divider"></div>
            <div class="tt-row"><span>CSIS</span><span>${info[4]}</span></div>`;
            showTooltip(e, html, statusColor);
        });
        map.on('mousemove', 'air-squadrons-layer', e => positionTooltip(e));
        map.on('mouseleave', 'air-squadrons-layer', () => { map.getCanvas().style.cursor = ''; hideTooltip(); });

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

        // Landing zone hover
        map.on('mouseenter', 'landing-zones-layer', e => {
            map.getCanvas().style.cursor = 'crosshair';
            const lzId = e.features[0].properties.lzId;
            const lz = LANDING_ZONES.find(z => z.id === lzId);
            if (!lz) return;
            const statusColor = lz.status === 'SUPPRESSED' ? '#888'
                : lz.status === 'DEGRADED' ? '#ff9900'
                : lz.status === 'CONTESTED' ? '#ff4444' : '#ffcc00';
            const troops = lz.troopsLanded > 0 ? `~${lz.troopsLanded.toLocaleString()}` : 'None ashore';
            let html = `<div class="tt-title" style="color:${statusColor}">${lz.id} — ${lz.name}</div>
            <div class="tt-divider"></div>
            <div class="tt-row"><span>STATUS</span><span style="color:${statusColor}">${lz.status}</span></div>
            <div class="tt-row"><span>THREAT</span><span>${lz.threat}</span></div>
            <div class="tt-row"><span>TROOPS ASHORE</span><span>${troops}</span></div>
            <div class="tt-row"><span>PLA UNIT</span><span>${lz.plaMajorUnit}</span></div>
            <div class="tt-row"><span>ROC DEFENSE</span><span>${lz.rocDefenders}</span></div>
            <div class="tt-divider"></div>
            <div class="tt-row"><span>CSIS ASSESSMENT</span><span>${lz.csis}</span></div>`;
            showTooltip(e, html, statusColor);
        });
        map.on('mousemove', 'landing-zones-layer', e => positionTooltip(e));
        map.on('mouseleave', 'landing-zones-layer', () => { map.getCanvas().style.cursor = ''; hideTooltip(); });

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

        // Air battle squadrons
        map.addSource('air-squadrons', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
        map.addLayer({
            id: 'air-squadrons-layer', type: 'circle', source: 'air-squadrons',
            paint: {
                'circle-radius': 6,
                'circle-color': ['get', 'color'],
                'circle-opacity': ['case', ['get', 'degraded'], 0.4, 0.8],
                'circle-stroke-width': 1,
                'circle-stroke-color': ['get', 'color'],
            }
        });
        map.addLayer({
            id: 'air-squadrons-labels', type: 'symbol', source: 'air-squadrons',
            layout: {
                'text-field': ['get', 'label'], 'text-size': 9,
                'text-anchor': 'top', 'text-offset': [0, 1.2],
                'text-allow-overlap': false, 'text-ignore-placement': false,
            },
            paint: { 'text-color': ['get', 'color'], 'text-halo-color': '#000', 'text-halo-width': 1.5 }
        });

        // Landing zones
        map.addSource('landing-zones', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
        map.addLayer({
            id: 'landing-zones-layer',
            type: 'circle',
            source: 'landing-zones',
            paint: {
                'circle-radius': 14,
                'circle-color': ['get', 'color'],
                'circle-opacity': 0.25,
                'circle-stroke-width': 2,
                'circle-stroke-color': ['get', 'color'],
            }
        });
        map.addLayer({
            id: 'landing-zones-labels',
            type: 'symbol',
            source: 'landing-zones',
            layout: {
                'text-field': ['get', 'label'],
                'text-size': 9,
                'text-anchor': 'top',
                'text-offset': [0, 1.4],
                'text-allow-overlap': true,
                'text-ignore-placement': true,
            },
            paint: { 'text-color': ['get', 'color'], 'text-halo-color': '#000', 'text-halo-width': 1.5 }
        });

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
