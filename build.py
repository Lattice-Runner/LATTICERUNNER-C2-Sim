"""
build.py — LatticeRunner build script
======================================
Takes the single-file LATTICERUNNER_21.11_XRST.html and splits it into:
  index.html
  css/style.css
  js/config.js
  js/audio.js
  js/map.js
  js/ui.js
  js/units.js
  js/update.js
  js/refresh.js
  js/main.js

Usage:
  python build.py                          # looks for LATTICERUNNER_21.11_XRST.html in same folder
  python build.py path/to/yourfile.html    # specify a different source file
"""

import os
import re
import sys

import re

def varify(s):
    """Convert top-level const/let to var so they are global across script files."""
    s = re.sub(r"^(    (?:const|let)) ", r"    var ", s, flags=re.MULTILINE)
    return s


# ── Source file ──────────────────────────────────────────────────────────────
source = sys.argv[1] if len(sys.argv) > 1 else 'LATTICERUNNER_21.11_XRST.html'
if not os.path.exists(source):
    print(f"ERROR: source file not found: {source}")
    sys.exit(1)

with open(source, 'r', encoding='utf-8') as f:
    raw = f.read()
lines = raw.splitlines()

print(f"Source: {source} ({len(lines)} lines)")

# ── Output dirs ──────────────────────────────────────────────────────────────
os.makedirs('css', exist_ok=True)
os.makedirs('js',  exist_ok=True)

# ── Extract CSS ───────────────────────────────────────────────────────────────
css_start = next(i for i, l in enumerate(lines) if l.strip() == '<style>')
css_end   = next(i for i, l in enumerate(lines) if l.strip() == '</style>')
css = '\n'.join(lines[css_start + 1 : css_end])
with open('css/style.css', 'w', encoding='utf-8') as f:
    f.write(css)
print(f"css/style.css          {len(css.splitlines())} lines")

# ── Extract JS block ─────────────────────────────────────────────────────────
# Find the <script> block that is NOT the Mapbox CDN script
js_start = None
js_end   = None
for i, l in enumerate(lines):
    if l.strip() == '<script>' and js_start is None:
        js_start = i + 1
    if l.strip() == '</script>':
        js_end = i
with open('_extracted.js', 'w', encoding='utf-8') as f:
    f.write('\n'.join(lines[js_start:js_end]))

js_lines = lines[js_start:js_end]

def find(pattern, start=0):
    for i, l in enumerate(js_lines[start:], start):
        if pattern in l:
            return i
    return -1

def section(a, b):
    return '\n'.join(js_lines[a:b]) + '\n'

def header(filename, description):
    return f"// {'='*60}\n// {filename} — {description}\n// {'='*60}\n\n"

# ── Locate section boundaries ────────────────────────────────────────────────
map_init     = find("new mapboxgl.Map")
map_end_raw  = find("map.resize()")
# map.on('load') closes 2 lines after map.resize()
map_end      = map_end_raw + 3

statsbar     = find("function updateStatsBar")
spawn_expl   = find("function spawnExplosion")
get_meta     = find("function getMetadata")
speak_fn     = find("function speak(t")
init_fn      = find("function init()")
spawn_wave   = find("function spawnWave")
update_fn    = find("function update()")
refresh_fn   = find("function refresh()")
init_audio   = find("function initializeAudioAndGame")

# ── Write each JS file ───────────────────────────────────────────────────────

# config.js — everything before map init
with open('js/config.js', 'w', encoding='utf-8') as f:
    f.write(header('config.js', 'constants, state variables, initial data'))
    f.write(varify(section(0, map_init)))
print(f"js/config.js           {map_init} lines")

# map.js — map construction + map.on('load') + boot trigger
map_section = section(map_init, map_end)
boot_lines = (
    "\n        // Boot the game only after map sources and layers are ready\n"
    "        init();\n"
    "        setInterval(update, 250);\n"
    "        document.getElementById('killfeed').innerHTML =\n"
    "            'Awaiting Tactical Input. Please press START SYSTEM.'\n"
    "            + '<span class=\"dot dot1\">.</span>'\n"
    "            + '<span class=\"dot dot2\">.</span>'\n"
    "            + '<span class=\"dot dot3\">.</span><br>';\n"
    "    });\n"
)
# Remove the bare }); at the end and add our boot version
map_section = map_section.rstrip()
if map_section.endswith('});'):
    map_section = map_section[:-3]
with open('js/map.js', 'w', encoding='utf-8') as f:
    f.write(header('map.js', 'Mapbox GL map init and layer setup'))
    f.write(varify(map_section))
    f.write(boot_lines)
print(f"js/map.js              {len(map_section.splitlines())} lines")

# audio.js — getMetadata through speak function
with open('js/audio.js', 'w', encoding='utf-8') as f:
    f.write(header('audio.js', 'music metadata, playlist, playback'))
    f.write(varify(section(get_meta, speak_fn)))
print(f"js/audio.js            {speak_fn - get_meta} lines")

# ui.js — updateStatsBar through spawnWave (excludes spawnExplosion which goes to units)
with open('js/ui.js', 'w', encoding='utf-8') as f:
    f.write(header('ui.js', 'HUD updates, killfeed, speech, recommendations'))
    f.write(varify(section(statsbar, spawn_wave)))
print(f"js/ui.js               {spawn_wave - statsbar} lines")

# units.js — spawnExplosion + init() through update()
with open('js/units.js', 'w', encoding='utf-8') as f:
    f.write(header('units.js', 'init, wave spawning, weapons, drone launches'))
    f.write(varify(section(spawn_expl, statsbar)))   # spawnExplosion
    f.write('\n')
    f.write(varify(section(init_fn, update_fn)))     # init() through launch functions
print(f"js/units.js            {(statsbar - spawn_expl) + (update_fn - init_fn)} lines")

# update.js — update() loop
with open('js/update.js', 'w', encoding='utf-8') as f:
    f.write(header('update.js', 'main game loop (runs every 250ms)'))
    f.write(varify(section(update_fn, refresh_fn)))
print(f"js/update.js           {refresh_fn - update_fn} lines")

# refresh.js — refresh() function
with open('js/refresh.js', 'w', encoding='utf-8') as f:
    f.write(header('refresh.js', 'map source updates every tick'))
    f.write(varify(section(refresh_fn, init_audio)))
print(f"js/refresh.js          {init_audio - refresh_fn} lines")

# main.js — initializeAudioAndGame + handlePauseResume + button wiring
# Strip the boot calls since they moved to map.js
main_raw = section(init_audio, len(js_lines))
# Remove the BOOT section (init() + setInterval + killfeed innerHTML)
main_raw = re.sub(
    r'    // [=]+\n    // BOOT\n    // [=]+\n    init\(\).*?\'<br>\';',
    '',
    main_raw,
    flags=re.DOTALL
)
with open('js/main.js', 'w', encoding='utf-8') as f:
    f.write(header('main.js', 'audio init, pause/resume, button wiring'))
    f.write(varify(main_raw))
print(f"js/main.js             {len(main_raw.splitlines())} lines")

# ── Write index.html ─────────────────────────────────────────────────────────
# Extract body content (between <body> and first CDN script)
body_start = next(i for i, l in enumerate(lines) if l.strip() == '<body>')
body_end   = next(i for i, l in enumerate(lines) if 'mapbox-gl-js/v3.4.0/mapbox-gl.js' in l and '<script src' in l)

body_content = '\n'.join(lines[body_start + 1 : body_end])

index = f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>LATTICERUNNER // 21.11</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<link href="https://api.mapbox.com/mapbox-gl-js/v3.4.0/mapbox-gl.css" rel="stylesheet">
<link rel="stylesheet" href="css/style.css">
</head>
<body>
{body_content}

<!-- Mapbox GL JS -->
<script src="https://api.mapbox.com/mapbox-gl-js/v3.4.0/mapbox-gl.js"></script>

<!-- Game scripts — load order matters -->
<script src="js/config.js"></script>
<script src="js/audio.js"></script>
<script src="js/map.js"></script>
<script src="js/ui.js"></script>
<script src="js/units.js"></script>
<script src="js/update.js"></script>
<script src="js/refresh.js"></script>
<script src="js/main.js"></script>
</body>
</html>
"""

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(index)
print(f"index.html             {len(index.splitlines())} lines")

# Cleanup temp file
os.remove('_extracted.js')

print(f"\n✓ Build complete. Open index.html via a local server or push to GitHub Pages.")
print(f"  For local testing, use VS Code Live Server or: python -m http.server 8000")
