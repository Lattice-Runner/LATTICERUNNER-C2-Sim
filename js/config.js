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
    var RADAR_CONF_RATE     = 5;      // low confidence per tick — sees but doesn't classify
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
        mkShip('南昌 (Nanchang)',      'Type 055 Destroyer',     '⬟','#ff3333', 5, 112, 0.00040),
        mkShip('延安 (Yanan)',         'Type 055 Destroyer',     '⬟','#ff3333', 5, 112, 0.00040),
        mkShip('贵阳 (Guiyang)',       'Type 052D Destroyer',    '◆','#ff5555', 3,  64, 0.00050),
        mkShip('太原 (Taiyuan)',       'Type 052D Destroyer',    '◆','#ff5555', 3,  64, 0.00050),
        mkShip('岳阳 (Yueyang)',       'Type 054A Frigate',      '◇','#ff7777', 2,  32, 0.00055),
        mkShip('三亚 (Sanya)',         'Type 054A Frigate',      '◇','#ff7777', 2,  32, 0.00055),
        mkShip('SS-329',               'Type 039B Submarine',    '▾','#ff9900', 2,   6, 0.00070, {isSub:true}),
        mkShip('SS-331',               'Type 039B Submarine',    '▾','#ff9900', 2,   6, 0.00070, {isSub:true}),
        mkShip('广西 (Guangxi)',       'Type 075 LHD',           '▣','#ff7700', 4,   4, 0.00030, {isAmph:true}),
        mkShip('四川 (Sichuan)',       'Type 071 LPD',           '▢','#ff7700', 3,   2, 0.00030, {isAmph:true}),
        mkShip('昆仑山 (Kunlunshan)', 'Type 071 LPD',           '▢','#ff7700', 3,   2, 0.00030, {isAmph:true}),
        mkShip('查干湖 (Chaganhu)',   'Type 901 Replenishment', '○','#ff5500', 2,   0, 0.00030),
    ];
    var US_CSG = [
        mkShip('CVN-76 Ronald Reagan',       'Nimitz-class Carrier',  '✦','#4499ff', 8,  20, 0.00030, {isCVN:true}),
        mkShip('CG-67 Shiloh',               'Ticonderoga Cruiser',   '✧','#5588ff', 5, 122, 0.00040, {isCG:true}),
        mkShip('CG-73 Port Royal',           'Ticonderoga Cruiser',   '✧','#5588ff', 5, 122, 0.00040, {isCG:true}),
        mkShip('DDG-109 Jason Dunham',       'Arleigh Burke DDG',     '◈','#6699ff', 4,  96, 0.00050),
        mkShip('DDG-89 Mustin',              'Arleigh Burke DDG',     '◈','#6699ff', 4,  96, 0.00050),
        mkShip('DDG-110 William Lawrence',   'Arleigh Burke DDG',     '◈','#6699ff', 4,  96, 0.00050),
        mkShip('DDG-71 Ross',                'Arleigh Burke DDG',     '◈','#6699ff', 4,  96, 0.00050),
        mkShip('SSN-774 Virginia',           'Virginia-class SSN',    '▸','#00ffcc', 3,  38, 0.00060, {isSub:true}),
        mkShip('SSN-21 Seawolf',             'Seawolf-class SSN',     '▸','#00ffcc', 3,  50, 0.00070, {isSub:true}),
        mkShip('T-AKE Lewis Puller',         'Lewis Puller ESB',      '○','#4477aa', 2,   0, 0.00030),
    ];
    var JAPAN_DDG_SQUADRON = [
        mkShip('DDG-107 Gravely',    'Arleigh Burke DDG', '◈','#00aaff', 4, 96, 0.00050, {isJapanForce:true}),
        mkShip('DDG-85 McCampbell',  'Arleigh Burke DDG', '◈','#00aaff', 4, 96, 0.00050, {isJapanForce:true}),
        mkShip('JS Atago DDH-177',   'JMSDF Atago DDG',   '◈','#00ccff', 4, 90, 0.00050, {isJapanForce:true, isJMSDF:true}),
    ];
    var navalBattleActive    = false;
    var airBattleTs          = 0;     // last air exchange timestamp
    var AIR_ENGAGE_INTERVAL = 60000; // air exchange every 60s

    // PLAAF order of battle — Eastern Theater Command
    var PLAAF_OOB = [
        { id: 'J-20 107th Brigade',  type: 'J-20',  base: 'Wuyishan AB',   lat: 27.83, lng: 117.98, sorties: 24, losses: 0, alive: true, color: '#ff3333' },
        { id: 'J-20 9th Brigade',    type: 'J-20',  base: 'Cangzhou AB',   lat: 38.35, lng: 116.87, sorties: 24, losses: 0, alive: true, color: '#ff3333' },
        { id: 'J-16 5th Brigade',    type: 'J-16',  base: 'Suzhou AB',     lat: 31.26, lng: 120.62, sorties: 36, losses: 0, alive: true, color: '#ff5555' },
        { id: 'J-16 54th Brigade',   type: 'J-16',  base: 'Huian AB',      lat: 24.97, lng: 118.63, sorties: 36, losses: 0, alive: true, color: '#ff5555' },
        { id: 'J-10C 3rd Brigade',   type: 'J-10C', base: 'Longtian AB',   lat: 25.78, lng: 119.57, sorties: 48, losses: 0, alive: true, color: '#ff7777' },
        { id: 'H-6K Bombers',        type: 'H-6K',  base: 'Neixiang AB',   lat: 33.05, lng: 111.61, sorties: 12, losses: 0, alive: true, color: '#ff9900' },
    ];

    // US/Allied air order of battle
    var US_AIR_OOB = [
        { id: 'VFA-27 Royal Maces',   type: 'F/A-18E', base: 'CVN-76',        lat: 0, lng: 0, sorties: 24, losses: 0, alive: true, color: '#4499ff', fromCarrier: true },
        { id: 'VFA-102 Diamondbacks', type: 'F/A-18F', base: 'CVN-76',        lat: 0, lng: 0, sorties: 24, losses: 0, alive: true, color: '#4499ff', fromCarrier: true },
        { id: 'VAQ-136 Gauntlets',    type: 'EA-18G',  base: 'CVN-76',        lat: 0, lng: 0, sorties: 12, losses: 0, alive: true, color: '#4499ff', fromCarrier: true, isJammer: true },
        { id: '13th FS Panthers',     type: 'F-35A',   base: 'Misawa AB',     lat: 40.70, lng: 141.37, sorties: 24, losses: 0, alive: true, color: '#00aaff', isJapanBased: true },
        { id: '67th FS Fighting Cocks',type:'F-35A',   base: 'Kadena AB',     lat: 26.35, lng: 127.77, sorties: 24, losses: 0, alive: true, color: '#00aaff', isJapanBased: true },
        { id: 'VMFA-121 Green Knights',type:'F-35B',   base: 'Iwakuni MCAS',  lat: 34.14, lng: 132.23, sorties: 20, losses: 0, alive: true, color: '#00ccff', isJapanBased: true },
        { id: '9th BS Buccaneers',    type: 'B-21',    base: 'Whiteman AFB',  lat: 38.72, lng: -93.55, sorties: 6,  losses: 0, alive: true, color: '#ffffff', isBomber: true },
        { id: '20th BS Buccaneers',   type: 'B-2',     base: 'Andersen AFB',  lat: 13.58, lng: 144.93, sorties: 8,  losses: 0, alive: true, color: '#ddddff', isBomber: true },
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
    var navalEngagementTs    = 0;    // last naval exchange timestamp
    var navalPlanKills       = 0;    // PLAN ships sunk — reduces landing ships & wave size
    var navalUskills         = 0;    // US ships sunk
    var carrierStrikeDegraded = false; // if CVN-76 sunk, carrier strike disabled
    var NAVAL_ENGAGE_INTERVAL = 45000; // exchange fire every 45s

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
