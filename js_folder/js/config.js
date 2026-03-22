// ============================================================
// config.js — constants, state variables, initial data
// ============================================================


    // ============================================================
    // MAPBOX & BASE
    // ============================================================
    mapboxgl.accessToken = 'pk.eyJ1IjoiY2hyaXNub3JkYWhsIiwiYSI6ImNtbWZybHUzbjBidjgyb3B2MGE2NXk3YXYifQ.rG46r5GB0RUnTFegkUnNAw';

    var base = { lat: 25.0400, lng: 121.5120 }; // Presidential Office, Taipei

    var baseHitIndicator = document.getElementById('baseHit');
    var baseThreshold    = 0.0018;
    var ID_RANGE         = 0.060;
    var STREAK_WINDOW_MS = 10000;

    // XRST — Extended Range Sentry Tower network
    // Real XRST detects to 7.5 miles; scaled here to dominate the battlespace
    var XRST_DETECT_RANGE   = 0.18;   // identification radius (degrees lat/lng)
    var DRONE_ID_RANGE      = 0.05;   // Altius/Anvil onboard sensors classify at close range

    // ── SENSOR LAYER CONSTANTS ────────────────────────────────────
    var RADAR_RANGE         = 0.45;   // long-range radar — covers full spawn envelope
    var RADAR_CONF_RATE     = 5;      // low confidence per tick — sees but does not classify
    var EOIR_CONE_ANGLE     = 30;     // EO/IR camera field of view (degrees)
    var EOIR_CONE_RANGE     = 0.08;   // EO/IR cone range from drone
    var EOIR_CONF_RATE      = 35;     // high confidence when in cone
    var EOIR_AMBIENT_RATE   = 15;     // lower confidence when nearby but not in cone
    var GROUND_DETECT_RANGE = 0.08;   // acoustic/seismic ground sensor range
    var GROUND_CONF_RATE    = 20;     // detects low-alt threats at close range
    var XRST_DAMAGE_RADIUS = 0.012; // a breach this close offline's the tower

    // Altitude engagement envelopes
    var ALT_BREACH_THRESHOLD     = 50;   // enemy must be below this (meters) to hit base
    var ALT_MISSILE_ENVELOPE     = 500;  // Roadrunner missiles only effective below this
    var ALT_DESCENT_START_RANGE  = 0.12; // distance from base at which descent begins (degrees)

    // ── ENGAGEMENT ZONE GEOMETRY (realistic) ─────────────────────
    // Outer Engagement Zone (OEZ): where long-range intercept is attempted
    // Inner Engagement Zone (IEZ): terminal last-ditch intercept
    // DF-17 at Mach 8: if it enters IEZ without prior intercept, breach is near-certain
    var OEZ_RANGE = 0.35;  // outer intercept zone — Roadrunner long-range shot
    var IEZ_RANGE = 0.10;  // inner terminal zone — last ditch, low Pk on hypersonic
    var DF17_IEZ_BREACH_PROB = 0.78; // if DF-17 reaches IEZ without intercept — 78% breach

    // ============================================================
    // SYSTEM CONSTANTS
    // ============================================================
    var EMP_COOLDOWN_MS       = 30000;  // reduced from 50s — more viable in late waves
    var EMP_DETONATION_RANGE  = 0.045;
    var EMP_KILL_RANGE        = 0.12;   // last resort weapon — very wide area denial
    var EMP_DISRUPT_RANGE     = 0.50;   // outer disruption ring — covers full spawn envelope
    var EMP_DISRUPT_DURATION  = 18000;  // ms enemies are slowed after EMP (18 seconds)

    var CLG_ACTIVATION_MS = 20000;
    var CLG_SHUTDOWN_MS   = 30000;
    var CLG_COOLDOWN_MS   = 60000;
    var CLG_RANGE         = 0.012;
    var CLG_HEAT_RATE     = 0.21;
    var CLG_COOL_RATE     = 0.5;
    var CLG_MAX_HEAT      = 100;

    var TTU_COOLDOWN_MS       = 70000;
    var TTU_DURATION_MS       = 10000;
    var TTU_PACKET_HIT_CHANCE = 0.75;

    var ORS_COOLDOWN_MS             = 70000;
    var ORS_DISRUPTION_DURATION_MS  = 20000;

    var FURY_COOLDOWN_MS  = 120000;  // Hualien is 1.07° away — needs longer cooldown
    var FURY_SPEED        = 0.0055;  // jets are fast — significantly faster than drones
    var MISSILE_SPEED     = 0.0100;  // Sidewinder — fast air-to-air/ground missile
    var FURY_ENGAGE_RANGE = 0.45;    // matches enemy spawn range so Furies engage on approach

    var MAX_FUEL    = 100;
    var FUEL_BURN_RATE = 0.04;
    var REFUEL_RATE    = 0.5;
    var MAX_MISSILES   = 6;
    var RELOAD_RATE    = 0.05;

    var ROADRUNNER_BASE_SPEED    = 0.0006;
    var ENEMY_INCREASE_PER_WAVE = 2;

    // ── TAIWAN THREAT CONSTANTS ───────────────────────────────
    // Spawn sectors — PLA attacks come from west (strait) and north
    // West sector: lng ~ 120.3 (Fujian coast is ~120.0-120.5)
    // North sector: from Zhoushan archipelago
    // Southeast: PLAN carrier group
    var SPAWN_WEST_LNG    = 120.30;  // Fujian coast
    var SPAWN_NORTH_LAT   = 25.80;   // north approach
    var SPAWN_SE_LAT      = 24.20;   // southeast PLAN group

    // DF-17 hypersonic glide vehicle
    var DF17_SPEED        = 0.0045;  // very fast — 5× normal drone
    var DF17_ALT          = 30000;   // meters, glide phase
    var DF17_CONF_NEEDED  = 95;      // nearly impossible to intercept in time

    // CJ-10 cruise missile (H-6K launched)
    var CJ10_SPEED        = 0.0012;  // subsonic but stealthy — low confidence gain
    var CJ10_ALT          = 100;     // terrain-hugging
    var CJ10_CONF_RATE    = 3;       // very hard to detect — low radar cross-section

    // ============================================================
    // FRIENDLY DRONE SQUAD CONSTANTS
    // ============================================================
    var ALTIUS_COOLDOWN_MS  = 45000;   // anti-UAS kamikaze, fast cooldown
    var ALTIUS_COUNT        = 15;      // drones per launch
    var ALTIUS_SPEED        = 0.0014;  // fast, targets swarm drones only

    var ANVIL_COOLDOWN_MS   = 70000;   // heavier attrition drone
    var ANVIL_COUNT         = 8;
    var ANVIL_SPEED         = 0.0010;  // targets strike drones and cruise missiles

    var RR_DEPLOY_COOLDOWN_MS = 90000; // precision interceptor, expensive
    var RR_DEPLOY_COUNT       = 2;
    var RR_DEPLOY_SPEED       = 0.0018; // fast, targets jets and missiles only

    // Fighter jet constants
    var JET_SPAWN_WAVE      = 4;       // jets start appearing from this wave
    var JET_FIRE_RANGE      = 0.15;    // range at which jet fires its missile
    var JET_MISSILE_SPEED   = 0.0120;  // air-to-ground missile — very fast
    var JET_SPEED           = 0.0009;  // jet ingress speed
    var JET_ALT             = 8000;    // jets cruise at high altitude (meters)
    var JET_EVASION_RANGE   = 0.08;    // RR within this range triggers evasion
    var JET_FLARE_RANGE     = 0.045;   // RR within this range triggers flares
    var JET_EVASION_DURATION_MS = 3000; // how long evasion heading lasts
    var JET_FLARE_COOLDOWN_MS   = 8000; // minimum time between flare deployments
    var RR_LOCK_LOSS_MS         = 3500; // how long RR loses lock after flares

    // ============================================================
    // GAME STATE
    // ============================================================
    var playing    = false;
    var friends    = [];
    var enemies    = [];
    var projectiles = [];
    var explosions = [];
    var nextId     = 1;
    var publicContacts = [];

    var furySquad   = [];
    var furyMissiles = [];

    // Friendly drone squads
    var altiusSquad  = [];  // anti-UAS kamikaze drones
    var anvilSquad   = [];  // heavier attrition drones
    var rrSquad      = [];  // Roadrunner precision interceptors

    // Cooldown tracking
    var altiusReady      = true;
    var altiusLastTs     = 0;
    var anvilReady       = true;
    var anvilLastTs      = 0;
    var rrDeployReady    = true;
    var rrDeployLastTs   = 0;

    // Enemy fighter jets, their missiles, and flare particles
    var enemyJets        = [];
    var jetMissiles      = [];
    var jetFlares        = [];  // visual flare particles { lat, lng, born, id }

    // ADS-B live aircraft data
    var adsbAircraft     = [];  // live transponder contacts from OpenSky
    var adsbLastFetch    = 0;
    var ADSB_FETCH_INTERVAL_MS = 30000; // poll every 30 seconds
    // Bounding box around Taiwan / Taipei airspace
    var ADSB_BOUNDS = { loLat: 24.0, hiLat: 26.0, loLng: 120.0, hiLng: 122.5 };

    // XRST tower network — fixed sensor nodes placed in a perimeter around base
    // Each tower: { id, name, lat, lng, online }
    var xrstTowers = [
        { id: 'XRST-01', lat: base.lat + 0.18, lng: base.lng - 0.10, online: true }, // Yangmingshan ridge (north)
        { id: 'XRST-02', lat: base.lat + 0.10, lng: base.lng + 0.18, online: true }, // Keelung coast (northeast)
        { id: 'XRST-03', lat: base.lat - 0.16, lng: base.lng + 0.12, online: true }, // Taoyuan approach (southwest)
        { id: 'XRST-04', lat: base.lat - 0.08, lng: base.lng - 0.18, online: true }  // Danshui River corridor (west)
    ];

    var waveNumber       = 1;  // kept internally for escalation logic
    // US reinforcement state
    var carrierGroupArrived   = false;
    var b21StrikeAvailable    = false;
    var reinforcementDay      = 5;
    var supportModalShown     = false;
    var cyberStrikeActive     = false;
    var cyberStrikeUntil      = 0;

    // ── FINITE INVENTORY SYSTEM ───────────────────────────────────
    var INVENTORY = {
        altius:    { total: 60, remaining: 60 },  // Taiwan forward-deployed Altius stock
        anvil:     { total: 32, remaining: 32 },  // Anvil interceptor stock
        roadrunner:{ total: 12, remaining: 12 },  // RR — more forward deployment
        f16v:      { total: 16, remaining: 16 },  // 16 F-16V sorties (141 aircraft in ROCAF)
        himars:    { total: 6,  remaining: 6  },  // 6 HIMARS salvos
    };
    var hualienDegraded   = false;
    var himarsArmed       = false;
    var himarsLastUsedDay = -99;
    var carrierArmed      = false;
    var carrierLastUsedDay = -99;
    var hualienHitTs      = 0;
    var lastDayBannerDay  = 0;
    var dayStartTs          = 0;
    var nextEventTs         = 0;
    var nextEventDelaySaved = 0;
    var wallClockTriggered  = false; // guard — prevent wall clock from firing twice per day
    // Resupply schedule: C-17 arrives Day 3, 6, 9
    var RESUPPLY_DAYS   = [3, 6, 9];
    function getPoliticsMsg(day) {
        const japan = japanBasingEnabled;
        const msgs = [
            "Day 1: PLA initiates strike ops. Washington monitoring. No US forces committed. UN convening.",
            "Day 2: UN Security Council emergency session. China vetoes resolution. Congress debates Taiwan Relations Act.",
            "Day 3: US Carrier Strike Group ordered to Philippine Sea. Positioning depends on Japan basing authorization.",
            japan
                ? "Day 4: Japan basing AUTHORIZED. CSG forward-deployed. US reinforcements imminent. PLA activating DF-21D posture."
                : "Day 4: Japan basing not authorized. CSG holding at Guam. US sortie range severely limited. Reinforcements Day 7.",
            "Day 5: Global semiconductor markets halted. Insurance war clauses invoked. US reinforcements authorized by Congress.",
            japan
                ? "Day 6: CSG on station. Strike packages active from Okinawa. PLA facing full US air power. Coalition forming."
                : "Day 6: CSG still at Guam. Taiwan absorbing maximum pressure without forward US air cover. Coalition forming.",
            japan
                ? "Day 7: Full coalition engaged. Australia, UK assets committed. PLA facing unsustainable attrition."
                : "Day 7: CSG arrives from Guam. Late entry — Taiwan has absorbed 7 days without forward US support. Coalition solidifying.",
            "Day 8: Nuclear shadow. PLA invasion faltering — CCP faces gamble for resurrection pressure. Escalation risk critical.",
            "Day 9: China seeks off-ramp. Diplomats exploring face-saving options. Military outcome largely determined.",
            "Day 10+: CSIS conclusion — Taiwan survives but at enormous cost to all sides. No clean victory.",
        ];
        return msgs[Math.min(day - 1, msgs.length - 1)] || msgs[msgs.length - 1];
    }

    var resupplyDelivered = [];     // which days have been delivered

    // ── PLA STRATEGIC AI MEMORY ───────────────────────────────────
    var plaMemory = {
        rrKillsVsJets:    0,   // how many jets RR killed last wave
        rrKillsVsMissiles:0,   // jet missiles RR killed
        altiusKillsFPV:   0,   // FPVs Altius killed last wave
        anvilKillsCH4:    0,   // CH-4s Anvil killed last wave
        empKills:         0,   // kills from EMP
        clgKills:         0,   // kills from CLG
        baseHitsThisWave: 0,   // PLA score this wave
        consecutiveFailWaves: 0, // waves where PLA got few through
        lastWaveSpread:   false, // whether last wave used multi-axis
        feintActive:      false, // feint wave currently in progress
        feintWaveNum:     0,
        // Composition weights — PLA adjusts these based on what's working
        weights: {
            df17: 1.0, cj10: 1.0, fpv: 1.0,
            ch4: 1.0, tb001: 1.0, jet: 1.0
        }
    };

    // ── JAPAN BASING ──────────────────────────────────────────────
    var japanBasingEnabled = false;

    // ── NAVAL BATTLE STATE — FULL CSIS ORDER OF BATTLE ─────────────
    function mkShip(id, type, symbol, color, health, missiles, speed, flags={}) {
        return { id, type, symbol, color, health, maxHealth: health, lat: 0, lng: 0,
                 alive: true, missiles, heading: 0, speed, sunkBy: null, sunkTs: 0,
                 damageLog: [], ...flags };
    }
    var PLAN_SAG = [
        mkShip('南昌 (Nanchang)',      'Type 055 Destroyer',     '⬟','#ff3333', 12, 112, 0.00040),
        mkShip('延安 (Yanan)',         'Type 055 Destroyer',     '⬟','#ff3333', 12, 112, 0.00040),
        mkShip('贵阳 (Guiyang)',       'Type 052D Destroyer',    '◆','#ff5555',  8,  64, 0.00050),
        mkShip('太原 (Taiyuan)',       'Type 052D Destroyer',    '◆','#ff5555',  8,  64, 0.00050),
        mkShip('岳阳 (Yueyang)',       'Type 054A Frigate',      '◇','#ff7777',  6,  32, 0.00055),
        mkShip('三亚 (Sanya)',         'Type 054A Frigate',      '◇','#ff7777',  6,  32, 0.00055),
        mkShip('SS-329',               'Type 039B Submarine',    '▾','#ff9900',  5,   6, 0.00070, {isSub:true}),
        mkShip('SS-331',               'Type 039B Submarine',    '▾','#ff9900',  5,   6, 0.00070, {isSub:true}),
        mkShip('广西 (Guangxi)',       'Type 075 LHD',           '▣','#ff7700', 10,   4, 0.00030, {isAmph:true}),
        mkShip('四川 (Sichuan)',       'Type 071 LPD',           '▢','#ff7700',  8,   2, 0.00030, {isAmph:true}),
        mkShip('昆仑山 (Kunlunshan)', 'Type 071 LPD',           '▢','#ff7700',  8,   2, 0.00030, {isAmph:true}),
        mkShip('查干湖 (Chaganhu)',   'Type 901 Replenishment', '○','#ff5500',  5,   0, 0.00030),
    ];
    var US_CSG = [
        mkShip('CVN-73 George Washington',       'Nimitz-class Carrier',  '✦','#4499ff', 20,  20, 0.00030, {isCVN:true}),
        mkShip('CG-67 Shiloh',               'Ticonderoga Cruiser',   '✧','#5588ff', 10, 122, 0.00040, {isCG:true}),
        mkShip('CG-73 Port Royal',           'Ticonderoga Cruiser',   '✧','#5588ff', 10, 122, 0.00040, {isCG:true}),
        mkShip('DDG-109 Jason Dunham',       'Arleigh Burke DDG',     '◈','#6699ff',  8,  96, 0.00050),
        mkShip('DDG-89 Mustin',              'Arleigh Burke DDG',     '◈','#6699ff',  8,  96, 0.00050),
        mkShip('DDG-110 William Lawrence',   'Arleigh Burke DDG',     '◈','#6699ff',  8,  96, 0.00050),
        mkShip('DDG-71 Ross',                'Arleigh Burke DDG',     '◈','#6699ff',  8,  96, 0.00050),
        mkShip('SSN-774 Virginia',           'Virginia-class SSN',    '▸','#00ffcc',  7,  38, 0.00060, {isSub:true}),
        mkShip('SSN-21 Seawolf',             'Seawolf-class SSN',     '▸','#00ffcc',  8,  50, 0.00070, {isSub:true}),
        mkShip('T-AKE Lewis Puller',         'Lewis Puller ESB',      '○','#4477aa',  5,   0, 0.00030),
    ];
    var JAPAN_DDG_SQUADRON = [
        mkShip('DDG-107 Gravely',    'Arleigh Burke DDG', '◈','#00aaff', 4, 96, 0.00050, {isJapanForce:true}),
        mkShip('DDG-85 McCampbell',  'Arleigh Burke DDG', '◈','#00aaff', 4, 96, 0.00050, {isJapanForce:true}),
        mkShip('JS Atago DDH-177',   'JMSDF Atago DDG',   '◈','#00ccff', 4, 90, 0.00050, {isJapanForce:true, isJMSDF:true}),
    ];
    var navalBattleActive    = false;
    var airBattleTs          = 0;
    var AIR_ENGAGE_INTERVAL = 60000;
    var combatAircraft       = [];    // brief flyover icons during air exchanges

    // PLAAF order of battle — Eastern Theater Command
    // CSIS estimate: PLAAF Eastern Theater ~400-500 front-line fighters
    // Modeled as 6 brigades representing ~480 total sorties
    var PLAAF_OOB = [
        { id: 'J-20 107th Brigade',  type: 'J-20',  base: 'Wuyishan AB',   lat: 27.83, lng: 117.98, sorties: 48, losses: 0, alive: true, color: '#ff3333' },
        { id: 'J-20 9th Brigade',    type: 'J-20',  base: 'Cangzhou AB',   lat: 38.35, lng: 116.87, sorties: 48, losses: 0, alive: true, color: '#ff3333' },
        { id: 'J-16 5th Brigade',    type: 'J-16',  base: 'Suzhou AB',     lat: 31.26, lng: 120.62, sorties: 96, losses: 0, alive: true, color: '#ff5555' },
        { id: 'J-16 54th Brigade',   type: 'J-16',  base: 'Huian AB',      lat: 24.97, lng: 118.63, sorties: 96, losses: 0, alive: true, color: '#ff5555' },
        { id: 'J-10C 3rd Brigade',   type: 'J-10C', base: 'Longtian AB',   lat: 25.78, lng: 119.57, sorties: 144,losses: 0, alive: true, color: '#ff7777' },
        { id: 'H-6K Bombers',        type: 'H-6K',  base: 'Neixiang AB',   lat: 33.05, lng: 111.61, sorties: 48, losses: 0, alive: true, color: '#ff9900' },
    ];

    // CSIS estimate: US Day 1 — ~200 carrier + ~100 Japan = ~300 sorties
    // Day 4+ with Japan basing: adds ~150 more. Total US: ~450 vs PLAAF ~480
    var US_AIR_OOB = [
        { id: 'VFA-27 Royal Maces',   type: 'F/A-18E', base: 'CVN-73',        lat: 0, lng: 0, sorties: 72, losses: 0, alive: true, color: '#4499ff', fromCarrier: true },
        { id: 'VFA-102 Diamondbacks', type: 'F/A-18F', base: 'CVN-73',        lat: 0, lng: 0, sorties: 72, losses: 0, alive: true, color: '#4499ff', fromCarrier: true },
        { id: 'VAQ-136 Gauntlets',    type: 'EA-18G',  base: 'CVN-73',        lat: 0, lng: 0, sorties: 36, losses: 0, alive: true, color: '#4499ff', fromCarrier: true, isJammer: true },
        { id: '13th FS Panthers',     type: 'F-35A',   base: 'Misawa AB',     lat: 40.70, lng: 141.37, sorties: 72, losses: 0, alive: true, color: '#00aaff', isJapanBased: true },
        { id: '67th FS Fighting Cocks',type:'F-35A',   base: 'Kadena AB',     lat: 26.35, lng: 127.77, sorties: 72, losses: 0, alive: true, color: '#00aaff', isJapanBased: true },
        { id: 'VMFA-121 Green Knights',type:'F-35B',   base: 'Iwakuni MCAS',  lat: 34.14, lng: 132.23, sorties: 60, losses: 0, alive: true, color: '#00ccff', isJapanBased: true },
        { id: '9th BS Buccaneers',    type: 'B-21',    base: 'Whiteman AFB',  lat: 38.72, lng: -93.55, sorties: 16, losses: 0, alive: true, color: '#ffffff', isBomber: true },
        { id: '20th BS Buccaneers',   type: 'B-2',     base: 'Andersen AFB',  lat: 13.58, lng: 144.93, sorties: 20, losses: 0, alive: true, color: '#ddddff', isBomber: true },
    ];

    // ── LANDING ZONES — CSIS identified beaches ───────────────────
    var LANDING_ZONES = [
        {
            id: 'LZ-ALPHA',
            name: 'Bali / Danshui Estuary',
            lat: 25.174, lng: 121.446,
            threat: 'PRIMARY',
            color: '#ff2222',
            status: 'CONTESTED',
            troopsLanded: 0,
            csis: 'CSIS identifies the Danshui River mouth as the highest-probability northern landing zone. Flat beach approach, proximity to Taipei (15km). PLA 73rd Group Army primary axis. ROC defenses include prepared obstacles and coastal artillery.',
            plaMajorUnit: 'PLA 73rd Group Army, 3rd Amphibious Brigade',
            rocDefenders: 'ROC Army 6th Army Corps, coastal defense batteries',
            dayActivated: 3,
        },
        {
            id: 'LZ-BRAVO',
            name: 'Taoyuan Coast',
            lat: 25.056, lng: 121.102,
            threat: 'PRIMARY',
            color: '#ff2222',
            status: 'CONTESTED',
            troopsLanded: 0,
            csis: 'Second primary landing axis. Access to Taoyuan International Airport is the strategic objective — seizure would enable PLA airlift of reinforcements. CSIS wargames show this as the most likely early objective after establishing a beachhead.',
            plaMajorUnit: 'PLA 72nd Group Army, 1st Amphibious Division',
            rocDefenders: 'ROC 33rd Infantry Brigade, Taoyuan garrison',
            dayActivated: 3,
        },
        {
            id: 'LZ-CHARLIE',
            name: 'Yilan Coast (NE)',
            lat: 24.757, lng: 121.762,
            threat: 'SECONDARY',
            color: '#ff7700',
            status: 'APPROACH',
            troopsLanded: 0,
            csis: 'Northeastern coast. CSIS identifies as secondary axis designed to pin ROC forces and prevent redeployment to western beaches. More difficult terrain but bypasses main coastal defenses. Activated Day 4+ in most CSIS scenarios.',
            plaMajorUnit: 'PLA 83rd Group Army, Marine Brigade',
            rocDefenders: 'ROC 269th Infantry Brigade',
            dayActivated: 4,
        },
        {
            id: 'LZ-DELTA',
            name: 'Tamsui River Mouth',
            lat: 25.178, lng: 121.437,
            threat: 'PRIMARY',
            color: '#ff2222',
            status: 'APPROACH',
            troopsLanded: 0,
            csis: 'River mouth approach toward Taipei city. Combined arms assault using amphibious APCs and hovercraft. CSIS notes that if PLA secures this approach, direct assault on the Presidential Office becomes possible within 48 hours.',
            plaMajorUnit: 'PLA Naval Marine Corps, 1st Marine Brigade',
            rocDefenders: 'ROC Marine Corps, Presidential Guard elements',
            dayActivated: 3,
        },
        {
            id: 'LZ-ECHO',
            name: 'Hsinchu Coast',
            lat: 24.849, lng: 120.817,
            threat: 'SECONDARY',
            color: '#ff7700',
            status: 'STAGING',
            troopsLanded: 0,
            csis: 'Southern approach along the coastal highway. CSIS identifies Hsinchu Science Park as a key PLA objective — Taiwan semiconductor manufacturing cluster. Seizure or destruction would achieve major economic warfare objectives independent of regime change.',
            plaMajorUnit: 'PLA 74th Group Army, Mechanized Infantry',
            rocDefenders: 'ROC Army 542nd Armored Brigade',
            dayActivated: 4,
        },
    ];
    var landingZonesActive = false;
    var globalMarketIndex  = 100.0;  // starts at 100 (pre-war baseline)
    var gdpLostTrillions   = 0.0;    // cumulative GDP loss estimate
    var tsmcThreatLevel    = 0;      // 0-3, rises as Hsinchu LZ activates
    var navalEngagementTs    = 0;    // last naval exchange timestamp
    var csgVlsPool           = 380;
    var infraDegraded        = 0;    // 0=normal, 1=C2 hit (60%), 2=grid down (30%)

    // ── ECONOMY OF FORCE LEDGER ──────────────────────────────
    var UNIT_COSTS = {
        // US interceptors (defense spend)
        altius:     50000,
        anvil:      75000,
        roadrunner: 125000,
        f16v:       8000000,   // per sortie cost approx
        himars:     150000,    // per rocket
        carrier:    2000000,   // per carrier strike sortie
        // Enemy assets (attrition value)
        fpv:        500,
        ch4:        2500000,
        tb001:      3500000,
        df17:       20000000,
        cj10:       3000000,
        j16:        70000000,
        j20:        110000000,
        // Naval (attrition value per ship type)
        'Type 055 Destroyer':    900000000,
        'Type 052D Destroyer':   500000000,
        'Type 054A Frigate':     350000000,
        'Type 039B Submarine':   250000000,
        'Type 075 LHD':          1200000000,
        'Type 071 LPD':          600000000,
        'Type 901 Replenishment':400000000,
    };
    var economyLog = {
        interceptorsFired: { altius:0, anvil:0, roadrunner:0, f16v:0, himars:0, carrier:0 },
        enemiesKilled:     { fpv:0, ch4:0, tb001:0, df17:0, cj10:0, j16:0, j20:0 },
        navalKills:        [],
        defenseCost:       0,
        attritionValue:    0,
        exchangeRatioByDay: [],
        currentDay:        1,
    };
    function econSpend(type, qty=1) {
        const cost = (UNIT_COSTS[type] || 0) * qty;
        economyLog.defenseCost += cost;
        if (economyLog.interceptorsFired[type] !== undefined)
            economyLog.interceptorsFired[type] += qty;
        updateEconTicker();
    }
    function econKill(type, shipClass) {
        let value = 0;
        if (shipClass) {
            value = UNIT_COSTS[shipClass] || 0;
            economyLog.navalKills.push({ type: shipClass, value });
        } else {
            value = UNIT_COSTS[type] || 0;
            if (economyLog.enemiesKilled[type] !== undefined)
                economyLog.enemiesKilled[type]++;
        }
        economyLog.attritionValue += value;
        updateEconTicker();
    }
    function econSnapshotDay() {
        const ratio = economyLog.attritionValue > 0
            ? (economyLog.defenseCost / economyLog.attritionValue).toFixed(2)
            : '∞';
        economyLog.exchangeRatioByDay.push({
            day: economyLog.currentDay,
            defense: economyLog.defenseCost,
            attrition: economyLog.attritionValue,
            ratio
        });
        economyLog.currentDay++;
    }
    function fmtUSD(n) {
        if (n >= 1e9) return `$${(n/1e9).toFixed(2)}B`;
        if (n >= 1e6) return `$${(n/1e6).toFixed(1)}M`;
        if (n >= 1e3) return `$${(n/1e3).toFixed(0)}K`;
        return `$${n}`;
    }
    // ── POLICY BRIEFS ────────────────────────────────────────
    var POLICY_BRIEFS = {
        'DF-17': {
            tag: 'PLARF // HYPERSONIC GLIDE VEHICLE // CSIS PRIORITY THREAT',
            title: 'DF-17 Hypersonic Glide Vehicle — The Carrier Killer Problem',
            content: `
                <div style="color:#ff00ff;font-size:11px;letter-spacing:1px;margin-bottom:12px;">CLASSIFICATION: UNCLASSIFIED // SOURCE: CSIS "First Battle of the Next War" (2023)</div>
                <p>The DF-17 is China's primary hypersonic strike weapon, purpose-built to defeat US carrier strike groups and their SM-3 missile defenses. Unlike ballistic missiles that follow predictable arcs, the DF-17's hypersonic glide vehicle maneuvers unpredictably at Mach 5–10 during terminal approach, making intercept geometrically marginal even for the most advanced US interceptors.</p>
                <div style="background:rgba(255,0,255,0.06);border-left:3px solid #ff00ff;padding:10px 14px;margin:14px 0;border-radius:0 4px 4px 0;">
                    <div style="color:#ff00ff;font-size:10px;letter-spacing:1px;margin-bottom:6px;">CSIS FINDING — "First Battle of the Next War" (2023)</div>
                    "Hypersonic saturation is the primary threat to US carrier survivability in the Taiwan Strait. CSIS wargames consistently found that 8–12 simultaneous DF-17 launches overwhelm CSG point defense. The United States has no high-confidence intercept capability against maneuvering hypersonic vehicles at scale."
                </div>
                <p><strong style="color:#ccc;">In this simulation:</strong> DF-17s use lead-pursuit intercept geometry rather than tail-chase. Roadrunner-M is the only system capable of engaging them, and must calculate a predicted intercept point ahead of the glide vehicle's trajectory. If the geometry closes — the DF-17 is moving faster than Roadrunner can reach the intercept point — the system issues a "BREACH POSSIBLE" warning. This models a real constraint: at Mach 8+, a tail-chase intercept is mathematically impossible.</p>
                <p><strong style="color:#ccc;">Eastern Theater inventory:</strong> PLARF operates an estimated 2 DF-17 brigades (~72 launchers, ~200 missiles). CSIS Day 1 estimate: 50–80 DF-17s in the opening salvo targeting carrier groups, airfields, and C2 nodes.</p>
                <p><strong style="color:#ccc;">Policy implication:</strong> The US has no deployed system analogous to Roadrunner that can reliably defeat DF-17 at scale. The CSIS recommendation is layered autonomous defense — not point defense — and accepting that some fraction of DF-17s will penetrate.</p>
                <div style="color:#333;font-size:10px;margin-top:16px;border-top:1px solid #111;padding-top:10px;">Source: Cancian, M. et al. "The First Battle of the Next War." CSIS, 2023. // DF-17 program: NASIC 2019, Pentagon China Military Power Report 2023.</div>`
        },
        'Roadrunner': {
            tag: 'ANDURIL INDUSTRIES // AUTONOMOUS INTERCEPTOR // CLASSIFIED PERFORMANCE',
            title: 'Roadrunner-M — The Attritable Intercept Problem',
            content: `
                <div style="color:#00ffff;font-size:11px;letter-spacing:1px;margin-bottom:12px;">CLASSIFICATION: UNCLASSIFIED // SOURCE: ANDURIL PUBLIC STATEMENTS + CSIS ANALYSIS</div>
                <p>Roadrunner-M is Anduril's turbojet-powered autonomous interceptor — the first US system specifically designed to be cheaper than the threats it kills. At an estimated $100–150K per unit, it sits below the cost of a Hellfire missile (~$150K) while being capable of engaging subsonic cruise missiles, fighter jets, and potentially hypersonic glide vehicles.</p>
                <div style="background:rgba(0,255,255,0.06);border-left:3px solid #00ffff;padding:10px 14px;margin:14px 0;border-radius:0 4px 4px 0;">
                    <div style="color:#00ffff;font-size:10px;letter-spacing:1px;margin-bottom:6px;">THE EXCHANGE RATIO PROBLEM</div>
                    CSIS identifies the fundamental challenge of autonomous defense: adversaries can produce cheap attritable weapons (FPV drones at $500, cruise missiles at $3M) faster than the US can produce expensive point-defense interceptors (SM-6 at $4M, PAC-3 at $6M). Roadrunner is designed to collapse this ratio. The question CSIS poses: can the US manufacture attritable interceptors fast enough at sub-$200K price points to make volume saturation attacks economically unviable for China?
                </div>
                <p><strong style="color:#ccc;">550 days:</strong> Anduril publicly stated Roadrunner went from white paper to first flight in 550 days — a development timeline that would have taken 10+ years in traditional defense acquisition. This speed is itself a CSIS finding: autonomous systems developed outside legacy procurement can respond to emerging threats faster than the threat evolves.</p>
                <p><strong style="color:#ccc;">In this simulation:</strong> Roadrunner has 12 units per deployment, finite inventory across 4 deployments (48 total). It is the only system capable of defeating DF-17 hypersonic missiles and PL-15 air-to-air missiles. Depletion is irreversible until C-17 resupply. This models the real constraint: Roadrunner production is not yet at scale.</p>
                <div style="color:#333;font-size:10px;margin-top:16px;border-top:1px solid #111;padding-top:10px;">Source: Anduril Industries press releases. CSIS "Affordable Mass" report. DoD Replicator Initiative documentation.</div>`
        },
        'J-20': {
            tag: 'PLAAF // 5TH GENERATION // CHENGDU AIRCRAFT CORPORATION',
            title: "J-20 Mighty Dragon — China's Stealth Air Superiority Threat",
            content: `
                <div style="color:#ff4444;font-size:11px;letter-spacing:1px;margin-bottom:12px;">CLASSIFICATION: UNCLASSIFIED // SOURCE: CSIS, NASIC, PENTAGON CHINA MILITARY POWER REPORT</div>
                <p>The Chengdu J-20 is China's first operational fifth-generation fighter — low-observable, AESA radar-equipped, and designed specifically to penetrate US air defenses and kill high-value assets: E-2D Hawkeye radar planes, EA-18G Growlers, tankers, and ISR platforms. Without these enablers, US strike packages become dramatically less effective.</p>
                <div style="background:rgba(255,68,68,0.06);border-left:3px solid #ff4444;padding:10px 14px;margin:14px 0;border-radius:0 4px 4px 0;">
                    <div style="color:#ff4444;font-size:10px;letter-spacing:1px;margin-bottom:6px;">CSIS FINDING</div>
                    "J-20 operations against US carrier air wings represent the highest-risk air threat in the Taiwan scenario. Its low-observable design means XRST towers and radar gain confidence slowly — by the time the threat is classified HOSTILE, engagement windows are narrow. CSIS wargames show that J-20 attrition of EA-18G Growlers in the first 48 hours significantly degrades subsequent US strike effectiveness."
                </div>
                <p><strong style="color:#ccc;">Numbers:</strong> ~200 J-20s operational as of 2025, ~20/year production. Eastern Theater Command: 2 brigades (~96 aircraft). Internal weapons bay carries 4 PL-15 BVR missiles — each valued at ~$1M. One J-20 sortie carries ~$4M in missiles and costs ~$110M to replace if lost.</p>
                <p><strong style="color:#ccc;">In this simulation:</strong> J-20 tracks gain confidence at +2/tick from radar only (stealth suppresses XRST), making them harder to engage before they enter firing range. They execute 4-flare evasion sequences and break lock more aggressively than J-16s. Only Roadrunner can reliably defeat them in the intercept phase.</p>
                <div style="color:#333;font-size:10px;margin-top:16px;border-top:1px solid #111;padding-top:10px;">Source: Pentagon China Military Power Report 2023. NASIC Ballistic and Cruise Missile Threat 2022. CSIS "First Battle" wargame series.</div>`
        },
        'CVN-73': {
            tag: 'US NAVY // CARRIER STRIKE GROUP 5 // YOKOSUKA JAPAN',
            title: 'USS George Washington — The Japan Basing Equation',
            content: `
                <div style="color:#4499ff;font-size:11px;letter-spacing:1px;margin-bottom:12px;">CLASSIFICATION: UNCLASSIFIED // SOURCE: CSIS, USNI, CURRENT DISPOSITION (MAR 2026)</div>
                <p>USS George Washington (CVN-73) is the US Navy's only forward-deployed aircraft carrier, homeported at Yokosuka, Japan. As of March 2026, she is the realistic carrier for a Taiwan contingency — USS Ronald Reagan is in 17-month dry dock at Puget Sound (out August 2026), and USS Abraham Lincoln and USS Gerald R. Ford are committed to Operation Epic Fury strikes against Iran.</p>
                <div style="background:rgba(255,153,0,0.06);border-left:3px solid #ff9900;padding:10px 14px;margin:14px 0;border-radius:0 4px 4px 0;">
                    <div style="color:#ff9900;font-size:10px;letter-spacing:1px;margin-bottom:6px;">THE TWO-FRONT WAR PROBLEM (CURRENT)</div>
                    With Lincoln and Ford fighting Iran and Reagan in dry dock, the US has George Washington as its primary Pacific carrier option. A simultaneous Taiwan crisis is the two-front war scenario defense planners have warned about for years — and as of March 2026, it is the operational reality. CSIS analyst Mark Cancian: "When Iran erupted, the United States didn't have the forces to make that threat real."
                </div>
                <p><strong style="color:#ccc;">The Japan basing equation:</strong> Without Japan basing authorization, George Washington operates from Guam (~800nm from Taiwan) — her air wing's combat radius does not reach the strait. With Japan basing authorized, she repositions to the Philippine Sea (~200nm) within 24 hours, and her full strike capability comes online. CSIS identifies this single political decision as the largest variable in Taiwan scenario outcomes.</p>
                <p><strong style="color:#ccc;">VLS depletion:</strong> The CSG's ~380 VLS cells represent roughly one week of high-intensity combat at CSIS-estimated expenditure rates. After depletion, the strike group must withdraw to Guam for 72 hours to reload — leaving Taiwan without naval fire support during the most critical amphibious phase.</p>
                <div style="color:#333;font-size:10px;margin-top:16px;border-top:1px solid #111;padding-top:10px;">Source: CSIS "First Battle" (2023). Stars & Stripes carrier status March 2026. USNI Fleet Tracker. National Interest carrier status report.</div>`
        },
        'Japan': {
            tag: 'GEOPOLITICS // JAPAN BASING // CSIS DECISIVE VARIABLE',
            title: 'Japan Basing Authorization — The Single Largest Variable',
            content: `
                <div style="color:#00aaff;font-size:11px;letter-spacing:1px;margin-bottom:12px;">CLASSIFICATION: UNCLASSIFIED // SOURCE: CSIS "FIRST BATTLE OF THE NEXT WAR" (2023)</div>
                <p>CSIS ran 24 iterations of its Taiwan wargame. The single variable that most determined the outcome — more than Taiwan's own defenses, more than US carrier availability, more than PLA force structure — was whether Japan authorized the United States to use bases on Japanese soil to conduct offensive operations.</p>
                <div style="background:rgba(0,170,255,0.06);border-left:3px solid #00aaff;padding:10px 14px;margin:14px 0;border-radius:0 4px 4px 0;">
                    <div style="color:#00aaff;font-size:10px;letter-spacing:1px;margin-bottom:6px;">CSIS FINDING — VERBATIM</div>
                    "In most scenarios where Japan did not allow the United States to use its bases, Taiwan fell. In most scenarios where Japan allowed full basing access, Taiwan survived — though at great cost to all parties. Tokyo, not Washington, decides the outcome."
                </div>
                <p><strong style="color:#ccc;">What basing authorization enables:</strong> F-35A operations from Kadena and Misawa (the most capable aircraft against PLAN air defenses), repositioning of the CSG from Guam posture to Philippine Sea (~600nm closer), and Japan Maritime Self-Defense Force participation with SM-3 BMD-capable destroyers. Without authorization, the US operates with one hand tied.</p>
                <p><strong style="color:#ccc;">Why Japan hesitates:</strong> Article 9 of Japan's constitution (recently reinterpreted), domestic political pressure, fear of PLA retaliation against Japanese cities and infrastructure, and the question of whether Taiwan is an existential threat to Japan vs. a US interest Japan is drawn into. In this simulation, Japan basing authorization triggers immediate PLA retaliatory strikes against Japan-based DDGs — modeling exactly this cost.</p>
                <p><strong style="color:#ccc;">The 2024-2026 shift:</strong> Japan has dramatically increased defense spending (2% GDP target), acquired Tomahawk missiles, and signed new basing agreements with the US. The political willingness to authorize basing in a Taiwan contingency is now assessed as higher than at any prior period — but remains uncertain under fire.</p>
                <div style="color:#333;font-size:10px;margin-top:16px;border-top:1px solid #111;padding-top:10px;">Source: Cancian, M. et al. "The First Battle of the Next War." CSIS, January 2023. Japan Defense White Paper 2024.</div>`
        },
        'TSMC': {
            tag: 'ECONOMIC WARFARE // HSINCHU SCIENCE PARK // SEMICONDUCTOR SUPPLY CHAIN',
            title: 'TSMC and the Semiconductor Chokepoint',
            content: `
                <div style="color:#ffcc00;font-size:11px;letter-spacing:1px;margin-bottom:12px;">CLASSIFICATION: UNCLASSIFIED // SOURCE: CSIS, SIA, RHODIUM GROUP</div>
                <p>Taiwan Semiconductor Manufacturing Company (TSMC) fabricates approximately 90% of the world's most advanced logic chips (sub-5nm). Every advanced US fighter jet, missile guidance system, smartphone, laptop, automobile, and data center depends on chips that either come from TSMC or from equipment only TSMC can build. The Hsinchu Science Park — LZ-ECHO in this simulation — is where TSMC's most advanced fabs are located.</p>
                <div style="background:rgba(255,204,0,0.06);border-left:3px solid #ffcc00;padding:10px 14px;margin:14px 0;border-radius:0 4px 4px 0;">
                    <div style="color:#ffcc00;font-size:10px;letter-spacing:1px;margin-bottom:6px;">ECONOMIC IMPACT ESTIMATE (RHODIUM GROUP / CSIS)</div>
                    A full disruption of Taiwan semiconductor production would trigger a global GDP contraction of $1–2 trillion in year one, with cascading effects lasting 3–5 years as alternative production capacity cannot be built quickly. The 2021 global chip shortage — caused by a ~10% supply disruption — cost the automotive industry alone $210 billion. A Taiwan conflict would be orders of magnitude larger.
                </div>
                <p><strong style="color:#ccc;">PLA doctrine:</strong> CSIS analysts assess that PLA strike doctrine would target Hsinchu in two ways: physically (missile strikes on fabs, which are extremely difficult to rebuild) and as a seizure objective (capturing TSMC technology and talent as a strategic prize). Either outcome achieves the same effect — denial of advanced chip production to the US and its allies for years.</p>
                <p><strong style="color:#ccc;">In this simulation:</strong> The Global Market Index crashes most severely when LZ-ECHO (Hsinchu) reaches CONTESTED status. Even before that, each day of conflict degrades the index as uncertainty shocks global markets. This models the CSIS conclusion: "Taiwan survives militarily, but the global economy is in ruins regardless."</p>
                <div style="color:#333;font-size:10px;margin-top:16px;border-top:1px solid #111;padding-top:10px;">Source: Rhodium Group Taiwan semiconductor disruption analysis. SIA State of the Industry 2024. CSIS "First Battle" economic appendix.</div>`
        },
        'VLS': {
            tag: 'CSG MUNITIONS // MISSILE SPREADSHEET PROBLEM // CSIS LOGISTICS FINDING',
            title: 'The VLS Depletion Problem — "We Run Out First"',
            content: `
                <div style="color:#4499ff;font-size:11px;letter-spacing:1px;margin-bottom:12px;">CLASSIFICATION: UNCLASSIFIED // SOURCE: CSIS 2023, CSBA, CRS REPORT</div>
                <p>The "missile spreadsheet" is one of the most sobering CSIS findings. The US carrier strike group carries approximately 300–400 VLS cells of strike and defense missiles. At CSIS-estimated expenditure rates in a high-intensity Taiwan conflict, the CSG depletes its inventory within 7–10 days — at which point it must withdraw to Guam for 72+ hours to reload. During that window, Taiwan has no naval fire support.</p>
                <div style="background:rgba(68,153,255,0.06);border-left:3px solid #4499ff;padding:10px 14px;margin:14px 0;border-radius:0 4px 4px 0;">
                    <div style="color:#4499ff;font-size:10px;letter-spacing:1px;margin-bottom:6px;">CSIS FINDING — LOGISTICS AS THE BINDING CONSTRAINT</div>
                    "In every iteration of our wargame, the United States and its allies ran out of certain munitions within one week. This is not a classified finding — the US defense industrial base simply does not produce precision guided munitions fast enough to sustain high-intensity conflict beyond 7–10 days. The 'missile spreadsheet' problem is arguably more important than any single weapons system capability."
                </div>
                <p><strong style="color:#ccc;">The SM-6 dilemma:</strong> SM-6 missiles cost ~$4M each and are used for both air defense (shooting down PL-15s and DF-17s) and anti-surface strikes (attacking PLAN ships). Every SM-6 fired at a $500 FPV drone is a catastrophically unfavorable exchange — but letting FPV drones reach the carrier is worse. This is the core decision this simulation forces: save expensive interceptors for DF-17s, or burn them on cheap saturation attacks?</p>
                <p><strong style="color:#ccc;">The production gap:</strong> The US produces approximately 100 SM-6 missiles per year. A single CSG engagement might expend 50–100 in a week. Ramping production takes 18–36 months. CSIS recommends stockpiling, allied burden-sharing, and cheaper attritable interceptors as the only near-term solutions.</p>
                <div style="color:#333;font-size:10px;margin-top:16px;border-top:1px solid #111;padding-top:10px;">Source: CSIS "First Battle" (2023). CSBA "Sustaining the Fight" logistics report. CRS "Navy Lasers, Railguns, and Hypervelocity Projectiles."</div>`
        },
    };

    window.showPolicyBrief = function(key) {
        const brief = POLICY_BRIEFS[key];
        if (!brief) return;
        document.getElementById('pbTag').textContent    = brief.tag;
        document.getElementById('pbTitle').textContent  = brief.title;
        document.getElementById('pbContent').innerHTML  = brief.content;
        const modal = document.getElementById('policyBriefModal');
        modal.style.display = 'flex';
    };
    window.closePolicyBrief = function() {
        document.getElementById('policyBriefModal').style.display = 'none';
    };

    function updateEconTicker() {
        const el = document.getElementById('econTicker');
        if (!el) return;
        const ratio = economyLog.attritionValue > 0
            ? (economyLog.defenseCost / economyLog.attritionValue).toFixed(2)
            : '∞';
        const col = parseFloat(ratio) > 1.5 ? '#ff4444'
                  : parseFloat(ratio) > 0.8 ? '#ff9900' : '#00ffaa';
        el.innerHTML = `
            <div style="display:flex;justify-content:space-between;font-size:10px;margin-bottom:3px;">
                <span style="color:#555;letter-spacing:1px;">ECONOMY OF FORCE</span>
            </div>
            <div style="display:flex;justify-content:space-between;">
                <span style="color:#ff4444;">SPEND: ${fmtUSD(economyLog.defenseCost)}</span>
                <span style="color:#00ffcc;">KILLS: ${fmtUSD(economyLog.attritionValue)}</span>
            </div>
            <div style="font-size:10px;color:${col};margin-top:2px;">
                EXCHANGE RATIO: ${ratio}:1 ${parseFloat(ratio)>1?'⚠ UNFAVORABLE':'✓ FAVORABLE'}
            </div>`;
    }
    var japanRetaliationTs   = 0;    // last PLA retaliation against Japan DDGs
    var japanRetaliationCount = 0;   // how many times Japan DDGs have been struck  // total CSG VLS cells (CSIS: ~1 week before depletion)
    var csgWithdrawn         = false; // true when CSG withdrawing to Guam to reload
    var csgWithdrawTs        = 0;    // when withdrawal started
    var CSG_WITHDRAW_DURATION = 72 * 60 * 1000; // 72 hours = compressed to 210s (1 day) * 3
    var CSG_RELOAD_VLS     = 380;  // reloaded cells on return
    var navalPlanKills       = 0;    // PLAN ships sunk — reduces landing ships & wave size
    var navalUskills         = 0;    // US ships sunk
    var carrierStrikeDegraded = false; // if CVN-73 sunk, carrier strike disabled
    var NAVAL_ENGAGE_INTERVAL = 60000; // exchange fire every 60s — CSIS battle takes days

    // Amphibious state
    var enemyAmphibious  = [];   // Type 071/075 landing ships
    var friendlyPatrols  = [];   // ROC patrol boats + US destroyer
    var amphibiousReady  = true;
    var amphibiousLastTs = 0;
    var AMPHIBIOUS_COOLDOWN_MS = 90000;
    var AMPHIBIOUS_SPEED       = 0.0003;  // slow — naval vessels
    var PATROL_SPEED           = 0.0005;
    var LANDING_SHIP_HEALTH    = 3;       // takes 3 hits to sink
    var dayNumber        = 1;  // displayed to player
    var dayElapsed       = 0;  // ms elapsed in current day
    var DAY_DURATION_MS = 210000; // 3.5 minutes = 1 in-game day
    var dayTimer         = null;
    var threatEventTimer = null;
    var totalKills       = 0;
    var roadrunnerLosses = 0;
    var baseHealth       = 5;   // base survives this many breaches before game over
    var highestStreak    = 0;
    var sessionHighStreak = 0;

    var waveTimer            = null;
    var telemetryInterval    = null;
    var resumeInterval       = null;
    var recommendationInterval = null;

    var isUpdating         = true;
    var isTelemetryActive  = false;
    var isRegrouping       = false;
    var isFirstStart       = true;
    var isJammed           = false;

    // ── AUTO-TASKING ENGINE ───────────────────────────────────────
    var autoMode           = false;  // true = system assigns interceptors automatically
    var autoLastAssignTs   = 0;      // throttle auto-assign to once per second

    // ── TRACK CONFIDENCE ─────────────────────────────────────────
    // Each enemy has e.confidence (0-100). Tiers:
    //   0-39:  UNKNOWN  (no engagement)
    //   40-79: SUSPECT  (XRST partial detection)
    //   80+:   HOSTILE  (full ID — engagement authorized)
    // e.identified stays as the engagement gate (confidence >= 80)

    // ── COMMS-DENIED STATE ────────────────────────────────────────
    var jammingStartTs     = 0;
    var localPictureAltius = [];  // enemy IDs visible to Altius at jam onset
    var localPictureAnvil  = [];  // enemy IDs visible to Anvil at jam onset
    var localPictureRR     = [];  // enemy IDs visible to RR at jam onset

    var lastStreakSpokenTs   = 0;
    var lastKillFeedLogTs    = 0;
    var lastTelemetryLogTs   = 0;
    var lastAllClearVoiceTs  = 0;

    var empReady       = true;
    var empLastFiredTs = 0;

    var clgStatus   = 'READY';
    var clgTargetTs = 0;
    var clgHeat     = 0;
    var clgKillsThisActivation = 0;  // hard cap per activation
    var CLG_MAX_KILLS = 8;         // max kills before forced cooldown

    var ttuReady       = true;
    var ttuActive      = false;
    var ttuLastFiredTs = 0;

    var orsReady          = true;
    var orsLastFiredTs    = 0;
    var orsDisruptionTs   = 0;

    var furyReady       = true;
    var furyLastFiredTs = 0;

    // ============================================================
    // FRIEND INIT DATA
    // Original Roadrunner ground units removed — replaced by
    // deployable drone squadrons (Altius, Anvil, RR Interceptors).
    // The friends[] array is kept for game-over loss tracking
    // but starts empty. Game-over now triggers when all drone
    // squadrons are expended and enemies are still alive.
    // ============================================================
    var friendInit = [];

    // ============================================================
    // MUSIC
    // ============================================================
    var music = document.getElementById('bgMusic');
    music.volume = 0.15;

    var songMetadata = [
        { urlKey: "01-I-ve-Waited-As-Long-As-I-Can",                                          artist: "Tony Rice",            title: "I've Waited As Long As I Can" },
        { urlKey: "mississippi-fred-mcdowell-steakbone-slide-guitar-03-the-train-i-ride",      artist: "Mississippi Fred McDowell", title: "The Train I Ride" },
        { urlKey: "09-The-Girl-Can t-Help-It-Little-Richard",                                  artist: "Little Richard",       title: "The Girl Can't Help It" },
        { urlKey: "09.-Huey-Lewis-The-News-Workin-For-A-Livin",                                artist: "Huey Lewis & The News", title: "Workin' For A Livin'" },
        { urlKey: "14-One-Way-Out-Sonny-Boy-Williamson",                                       artist: "Sonny Boy Williamson", title: "One Way Out" },
        { urlKey: "04-Too-Much-Monkey-Business-Chuck-Berry",                                   artist: "Chuck Berry",          title: "Too Much Monkey Business" },
        { urlKey: "12-I-Say-A-Little-Prayer",                                                  artist: "Aretha Franklin",      title: "I Say A Little Prayer" },
        { urlKey: "13-Johnny-B.-Goode-Chuck-Berry",                                            artist: "Chuck Berry",          title: "Johnny B. Goode" },
        { urlKey: "21-Back-In-The-U.S.A.-Chuck-Berry",                                        artist: "Chuck Berry",          title: "Back In The U.S.A." },
        { urlKey: "Blues-Brothers-Made-In-America-07-Green-Onions",                            artist: "Blues Brothers",       title: "Green Onions" },
        { urlKey: "0dsan6odub14pwktr818d/19.-Rainy-Night-In-Georgia",                         artist: "Ray Charles",          title: "Rainy Night In Georgia" },
        { urlKey: "16.-We-Will-Rock-You",                                                      artist: "Queen",                title: "We Will Rock You" },
        { urlKey: "13-When-The-Boys-Were-Out-On-The-Western-Plains",                           artist: "Lead Belly",           title: "When The Boys Were Out On The Western Plains" },
        { urlKey: "z7h56ti9ejy7rnq0kw15f/06.-Hurricane-Betsy",                                artist: "Lightnin' Hopkins",    title: "Hurricane Betsy" },
        { urlKey: "9mo0cjjtwygxeiugsjbw8/05.-Nothin-But-The-Blues",                           artist: "Lightnin' Hopkins",    title: "Nothin' But The Blues" },
        { urlKey: "275xgb4cvln3lln6w6167/01-Penitentiary-Blues",                              artist: "Lightnin' Hopkins",    title: "Penitentiary Blues" },
        { urlKey: "g7p8wu1dp4mpgy38hdk5q/26.-I-m-Gonna-Be-A-Wheel-Someday",                  artist: "Fats Domino",          title: "I'm Gonna-Be-A-Wheel-Someday" },
        { urlKey: "g2uajf7nnmtqvn91ezcm3/08.-Poor-Me",                                        artist: "Fats Domino",          title: "Poor Me" },
        { urlKey: "u8lug9zb1icn3l61temhp/06.I-Need-Some-Money",                               artist: "John Lee Hooker",      title: "I Need Some Money" },
        { urlKey: "j36dqmrryjr48472ddzrp/10-Up-Above-My-Head-I-Hear-Music-In-The-Air",        artist: "Sister Rosetta Tharpe", title: "Up Above My Head I Hear Music In The Air" },
        { urlKey: "3erof4x8z418wza0j7lxq/12-Better-Not-Look-Down",                            artist: "B.B. King",            title: "Better Not Look Down" },
        { urlKey: "b5bo69t35ggy02n58ukqf/07-Bird-Of-Paradise",                                artist: "Dizzy Gillespie",      title: "Bird Of Paradise" },
        { urlKey: "348duugaefvfn9xmkp67s/14.-Jimmy-Reed-Baby-What-Do-You-Want-Me-To-Do",      artist: "Jimmy Reed",           title: "Baby What-Do-You-Want-Me-To-Do" }
    ];

    var masterPlaylist = [
        "https://www.dropbox.com/scl/fi/iq0ba3vt3eeeyvp6p24cn/01-I-ve-Waited-As-Long-As-I-Can.mp3?rlkey=wk5vkrnjtlxdnrl6masjzu9w3&st=6563lacv&raw=1",
        "https://www.dropbox.com/scl/fi/yy8ag3q2jug96ecd77mba/mississippi-fred-mcdowell-steakbone-slide-guitar-03-the-train-i-ride.mp3?rlkey=wynvr46f0nt1tjoibneajc5b4&st=p1mlsjpd&raw=1",
        "https://www.dropbox.com/scl/fi/65zh2u6mfulola10th5q2/09-The-Girl-Can t-Help-It-Little-Richard.mp3?rlkey=edm1gou8em8b7zcfe2jxy7bc8&st=yvphp925&raw=1",
        "https://www.dropbox.com/scl/fi/b96rj8d844dyfu34mcg2xep6/09.-Huey-Lewis-The-News-Workin-For-A-Livin.flac?rlkey=b1a5jghx8rdyfu34mcgskwc5szlzs7isb&st=goqb8d44&raw=1",
        "https://www.dropbox.com/scl/fi/5fvt7y69vwn9f04azx88m/14-One-Way-Out-Sonny-Boy-Williamson.mp3?rlkey=rnjvo3wuozaxkvqd8zl52nzll&st=q4hto05x&raw=1",
        "https://www.dropbox.com/scl/fi/u8lug9zb1icn3l61temhp/06.I-Need-Some-Money.mp3?rlkey=t6eq4k9dqze66q9nisc3wps38&st=glpxjguw&raw=1",
        "https://www.dropbox.com/scl/fi/8mpi4we88rafxacqmv6d9/04-Too-Much-Monkey-Business-Chuck-Berry.mp3?rlkey=inoxzv9f0i8k28aoh0q6fwmn9&st=iggup33v&raw=1",
        "https://www.dropbox.com/scl/fi/z7h56ti9ejy7rnq0kw15f/06.-Hurricane-Betsy.flac?rlkey=kxb07y1msn99m0pf3lpl2a5ix&st=9ton1tfe&raw=1",
        "https://www.dropbox.com/scl/fi/b5bo69t35ggy02n58ukqf/07-Bird-Of-Paradise.flac?rlkey=yk5a56bbpfsu2n2mof8pn2dj2&st=8fhlzt68&raw=1",
        "https://www.dropbox.com/scl/fi/j36dqmrryjr48472ddzrp/10-Up-Above-My-Head-I-Hear-Music-In-The-Air.mp3?rlkey=6nsaz0rirp1gon1gssiws3tab&st=69llu37q&raw=1",
        "https://www.dropbox.com/scl/fi/3erof4x8z418wza0j7lxq/12-Better-Not-Look-Down.flac?rlkey=1pasavj3mcgskwc5szlzs7isb&st=zkx4gxxr&raw=1",
        "https://www.dropbox.com/scl/fi/348duugaefvfn9xmkp67s/14.-Jimmy-Reed-Baby-What-Do-You-Want-Me-To-Do-_.mp3?rlkey=cxlupv2btao501di351eu0v4r&st=jh4ze5ma&raw=1",
        "https://www.dropbox.com/scl/fi/1m8hvbmv96ilh9mb97bgt/12-I-Say-A-Little-Prayer.mp3?rlkey=e2nxdcax12t8uraief8zenavm&st=9ugk7yab&raw=1",
        "https://www.dropbox.com/scl/fi/76nvj9rvyaahomges3dds/13-Johnny-B.-Goode-Chuck-Berry.mp3?rlkey=hnro6vap2qiqm6hn9jxkc178f&st=jmrd9mjs&raw=1",
        "https://www.dropbox.com/scl/fi/w6jjve2tj1ihhpug602u/21-Back-In-The-U.S.A.-Chuck-Berry.mp3?rlkey=kbv9vbt6nczwd8cfl1np4dof2&st=kjes5f4l&raw=1",
        "https://www.dropbox.com/scl/fi/g7p8wu1dp4mpgy38hdk5q/26.-I-m-Gonna-Be-A-Wheel-Someday.flac?rlkey=0ynj6gv2dqu4dwtngsqd3h5wb&st=90h3q6sc&raw=1",
        "https://www.dropbox.com/scl/fi/9jj5ju3yrliqmdwdx1cky/16.-We-Will-Rock-You.mp3?rlkey=cz6f0l8pog84vr89527gn8u87&raw=1",
        "https://www.dropbox.com/scl/fi/w0ai5u9h3dtptzjllft0v/Blues-Brothers-Made-In-America-07-Green-Onions.mp3?rlkey=cb548pd9mu6xqg0t3ag4enqfi&st=taoh0bgg&raw=1",
        "https://www.dropbox.com/scl/fi/o2isrxylrqv9mioluptgl/13-When-The-Boys-Were-Out-On-The-Western-Plains.flac?rlkey=fhac79o0sfzdm2lknbqss94br&raw=1",
        "https://www.dropbox.com/scl/fi/z7h56ti9ejy7rnq0kw15f/06.-Hurricane-Betsy.flac?rlkey=kxb07y1msn99m0pf3lpl2a5ix&st=9ton1tfe&raw=1",
        "https://www.dropbox.com/scl/fi/0dsan6odub14pwktr818d/19.-Rainy-Night-In-Georgia.mp3?rlkey=ootry652qwuwmc8d08pluhyyh&raw=1",
        "https://www.dropbox.com/scl/fi/275xgb4cvln3l6w6167/01-Penitentiary-Blues.flac?rlkey=u6wqx3fqa1z4kc44opitls814&raw=1",
        "https://www.dropbox.com/scl/fi/9mo0cjjtwygxeiugsjbw8/05.-Nothin-But-The-Blues.flac?rlkey=urjzte2wg076p3i34zc0gqd91&raw=1",
        "https://www.dropbox.com/scl/fi/g2uajf7nnmtqvn91ezcm3/08.-Poor-Me.flac?rlkey=ua58vdokvyqkqveo5m3e7gd5u&raw=1",
        "https://www.dropbox.com/scl/fi/w0ai5u9h3dtptzjllft0v/Blues-Brothers-Made-In-America-07-Green-Onions.mp3?rlkey=cb548pd9mu6xqg0t3ag4enqfi&st=ppm0zjkn&raw=1"
    ];

    var fixedOrderUrls = [
        // "Up Above My Head" always plays first, then full shuffle
        "https://www.dropbox.com/scl/fi/j36dqmrryjr48472ddzrp/10-Up-Above-My-Head-I-Hear-Music-In-The-Air.mp3?rlkey=6nsaz0rirp1gon1gssiws3tab&st=69llu37q&raw=1"
    ];

    var shuffledPlaylist  = [];
    var currentSongIndex  = -1;

    // ============================================================
    // MAPBOX MAP INIT
    // ============================================================
