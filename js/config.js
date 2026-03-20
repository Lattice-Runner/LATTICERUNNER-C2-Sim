// ============================================================
// config.js — constants, state variables, initial data
// ============================================================


    // ============================================================
    // MAPBOX & BASE
    // ============================================================
    mapboxgl.accessToken = 'pk.eyJ1IjoiY2hyaXNub3JkYWhsIiwiYSI6ImNtbWZybHUzbjBidjgyb3B2MGE2NXk3YXYifQ.rG46r5GB0RUnTFegkUnNAw';

    var base = { lat: 34.81597, lng: -118.20015 };

    var baseHitIndicator = document.getElementById('baseHit');
    var baseThreshold    = 0.0018;
    var ID_RANGE         = 0.060;
    var STREAK_WINDOW_MS = 10000;

    // XRST — Extended Range Sentry Tower network
    // Real XRST detects to 7.5 miles; scaled here to dominate the battlespace
    var XRST_DETECT_RANGE   = 0.18;   // identification radius (degrees lat/lng)
    var DRONE_ID_RANGE      = 0.05;   // Altius/Anvil onboard sensors classify at close range
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

    var FURY_COOLDOWN_MS  = 60000;
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
    // Bounding box around Edwards AFB / Antelope Valley
    var ADSB_BOUNDS = { loLat: 34.6, hiLat: 35.0, loLng: -118.5, hiLng: -117.9 };

    // XRST tower network — fixed sensor nodes placed in a perimeter around base
    // Each tower: { id, name, lat, lng, online }
    var xrstTowers = [
        { id: 'XRST-01', lat: base.lat + 0.14, lng: base.lng - 0.14, online: true },
        { id: 'XRST-02', lat: base.lat + 0.14, lng: base.lng + 0.14, online: true },
        { id: 'XRST-03', lat: base.lat - 0.14, lng: base.lng + 0.14, online: true },
        { id: 'XRST-04', lat: base.lat - 0.14, lng: base.lng - 0.14, online: true }
    ];

    var waveNumber       = 1;
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

    var lastStreakSpokenTs   = 0;
    var lastKillFeedLogTs    = 0;
    var lastTelemetryLogTs   = 0;
    var lastAllClearVoiceTs  = 0;

    var empReady       = true;
    var empLastFiredTs = 0;

    var clgStatus   = 'READY';
    var clgTargetTs = 0;
    var clgHeat     = 0;

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
    music.volume = 0.3;

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
