// ============================================================
// update.js — main game loop (runs every 250ms)
// ============================================================

    function update() {
        if (!playing) return;
        const now = Date.now();

        // Poll ADS-B live data
        fetchADSB();

        // Run auto-tasking engine
        runAutoTasking();

        // Jamming: randomly skip ticks
        if (isJammed && Math.random() < 0.3) return;

        // --- REGROUP PHASE ---
        if (isRegrouping) {
            let allHome = true;
            friends.forEach(f => {
                if (f.id !== 0) {
                    const orig = friendInit.find(init => init.id === f.id);
                    f.fuel     = Math.min(f.fuel + 1, MAX_FUEL);
                    f.missiles = Math.min(f.missiles + 0.1, MAX_MISSILES);
                    const dist = Math.hypot(orig.lng - f.lng, orig.lat - f.lat);
                    if (dist > 0.0001) {
                        allHome = false;
                        const a = Math.atan2(orig.lat - f.lat, orig.lng - f.lng);
                        f.lng  += Math.cos(a) * (f.speed * 1.5);
                        f.lat  += Math.sin(a) * (f.speed * 1.5);
                        f.bearing = (a * 180 / Math.PI) - 90;
                    } else {
                        f.lng = orig.lng;
                        f.lat = orig.lat;
                    }
                }
            });
            if (allHome) isRegrouping = false;
        }

        // --- CLG STATE MACHINE ---
        if (clgStatus === 'ACTIVATING' && now >= clgTargetTs) {
            clgStatus = 'ACTIVE';
            document.getElementById('clgBtn').textContent = 'CLG ACTIVE';
            document.getElementById('clgBtn').disabled    = false;
            speak('Laser Grid fully operational.', 1);
            if (map.getLayer('clg-perimeter')) {
                map.setPaintProperty('clg-perimeter', 'circle-opacity', 0.4);
                map.setPaintProperty('clg-perimeter', 'circle-stroke-opacity', 0.8);
            }
            addKill('<span style="color:#ff00ff;font-weight:bold;">CLG:</span> Operational. Mobility degraded.');
        } else if (clgStatus === 'SHUTTING_DOWN' && now >= clgTargetTs) {
            clgStatus   = 'COOLDOWN';
            clgTargetTs = now + CLG_COOLDOWN_MS;
            document.getElementById('clgBtn').disabled = true;
            speak('Laser Grid offline. System cooling down.', 1);
            if (map.getLayer('clg-perimeter')) {
                map.setPaintProperty('clg-perimeter', 'circle-opacity', 0.0);
                map.setPaintProperty('clg-perimeter', 'circle-stroke-opacity', 0.0);
            }
            addKill('<span style="color:#ff00ff;font-weight:bold;">CLG:</span> Cooldown Initiated.');
        } else if (clgStatus === 'COOLDOWN' && now >= clgTargetTs) {
            clgStatus = 'READY';
            document.getElementById('clgBtn').textContent = 'CLG GRID';
            document.getElementById('clgBtn').disabled    = false;
            speak('Laser Grid systems recharged and ready.', 1);
            addKill('<span style="color:#ff00ff;font-weight:bold;">CLG:</span> Systems Recharged.');
        } else if (clgStatus === 'OVERHEAT' && clgHeat <= 0) {
            clgStatus = 'READY';
            document.getElementById('clgBtn').textContent = 'CLG GRID';
            document.getElementById('clgBtn').disabled    = false;
            speak('Laser Grid temperature nominal. Systems rebooted.', 1);
            addKill('<span style="color:#00ffaa;font-weight:bold;">CLG:</span> Overheat Cycle Complete. Ready.');
        }

        // CLG heat management
        if (clgStatus === 'ACTIVE') {
            clgHeat += CLG_HEAT_RATE;
            if (clgHeat >= CLG_MAX_HEAT) {
                clgHeat   = CLG_MAX_HEAT;
                clgStatus = 'OVERHEAT';
                document.getElementById('clgBtn').disabled = true;
                speak('Warning. Laser Grid overheat. Emergency shutdown initiated.', 1);
                addKill('<span style="color:#ff0000;font-weight:bold;">CLG:</span> CRITICAL OVERHEAT! SHUTTING DOWN.');
                if (map.getLayer('clg-perimeter')) {
                    map.setPaintProperty('clg-perimeter', 'circle-opacity', 0.0);
                    map.setPaintProperty('clg-perimeter', 'circle-stroke-opacity', 0.0);
                }
            }
        } else {
            clgHeat = Math.max(0, clgHeat - CLG_COOL_RATE);
        }

        // --- EMP RECHARGE ---
        if (!empReady && now - empLastFiredTs >= EMP_COOLDOWN_MS) {
            empReady = true;
            speak('EMP Interdiction system fully charged and ready.', 1);
            addKill('<span style="color:#00ffff;font-weight:bold;">E-SYSTEM:</span> Charging Complete. Ready to Fire.');
        }

        // --- TTU EXPIRY ---
        if (ttuActive && now - ttuLastFiredTs >= TTU_DURATION_MS) {
            ttuActive = false;
            playNextSong();
            if (enemies.filter(e => e.alive).length === 0) {
                if (waveTimer) clearTimeout(waveTimer);
                waveTimer = setTimeout(spawnWave, 10000);
                speak('Telemetry uplink complete. Resuming wave rotation.', 1);
                addKill('<span style="color:#00ffff;font-weight:bold;">TTU:</span> Uplink Complete. Resuming Wave Rotation.');
            } else {
                speak('Telemetry uplink complete. Systems normalized.', 1);
                if (!waveTimer) waveTimer = setTimeout(spawnWave, 35000);
                addKill('<span style="color:#00ffff;font-weight:bold;">TTU:</span> Uplink Complete. System normalizing.');
            }
            document.getElementById('ttuBtn').textContent = 'TTU LINK';
        }

        // TTU cooldown expiry
        if (!ttuReady && now - ttuLastFiredTs >= TTU_COOLDOWN_MS) {
            ttuReady = true;
            speak('Telemetry Uplink ready.', 1);
        }

        // ORS cooldown expiry
        if (!orsReady && now - orsLastFiredTs >= ORS_COOLDOWN_MS) {
            orsReady = true;
            speak('Orbital Reconnaissance Scan ready.', 1);
        }

        // Enemy speed multiplier from ORS disruption
        let enemySpeedMul = 1;
        let orsRemain     = 0;
        if (now - orsDisruptionTs < ORS_DISRUPTION_DURATION_MS) {
            enemySpeedMul = 1.5;
            orsRemain     = Math.ceil((ORS_DISRUPTION_DURATION_MS - (now - orsDisruptionTs)) / 1000);
        }

        // --- HUD: EMP STATUS ---
        const empBtn = document.getElementById('empBtn');
        if (!empReady) {
            const s = Math.ceil((EMP_COOLDOWN_MS - (now - empLastFiredTs)) / 1000);
            document.getElementById('esysStatus').innerHTML = `E-System: <span style="color:#ffcc00;">CHARGING (${s}s)</span>`;
            empBtn.disabled = true;
        } else {
            document.getElementById('esysStatus').innerHTML = `E-System: <span style="color:#00ffaa;font-weight:bold;">READY</span>`;
            empBtn.disabled = !playing;
        }

        // --- HUD: CLG STATUS ---
        const clgBtn = document.getElementById('clgBtn');
        if (clgStatus === 'OVERHEAT') {
            document.getElementById('clgStatus').innerHTML = `CLG: <span style="color:#ff0000;font-weight:bold;">OVERHEAT (${Math.floor(clgHeat)}%)</span>`;
            clgBtn.textContent = `COOLING ${Math.floor(clgHeat)}%`;
            clgBtn.disabled    = true;
        } else if (clgStatus === 'ACTIVATING' || clgStatus === 'SHUTTING_DOWN') {
            const s = Math.ceil((clgTargetTs - now) / 1000);
            document.getElementById('clgStatus').innerHTML = `CLG: <span style="color:#ff00ff;font-weight:bold;">${clgStatus} (${s}s)</span>`;
            clgBtn.disabled = true;
        } else if (clgStatus === 'COOLDOWN') {
            const s = Math.ceil((clgTargetTs - now) / 1000);
            document.getElementById('clgStatus').innerHTML = `CLG: <span style="color:#ffcc00;">COOLDOWN (${s}s)</span>`;
            clgBtn.textContent = `CLG (${s}s)`;
            clgBtn.disabled    = true;
        } else if (clgStatus === 'ACTIVE') {
            const color = clgHeat > 70 ? '#ff0000' : '#ff00ff';
            document.getElementById('clgStatus').innerHTML = `CLG: <span style="color:${color};font-weight:bold;">ACTIVE (${Math.floor(clgHeat)}%)</span>`;
            clgBtn.textContent    = `DEACTIVATE (${Math.floor(clgHeat)}%)`;
            clgBtn.disabled       = !playing;
            clgBtn.style.color    = color;
            clgBtn.style.borderColor = color;
        } else {
            if (clgHeat > 0) {
                document.getElementById('clgStatus').innerHTML = `CLG: <span style="color:#ffff00;">COOLING (${Math.floor(clgHeat)}%)</span>`;
                clgBtn.textContent = `CLG (${Math.floor(clgHeat)}%)`;
            } else {
                document.getElementById('clgStatus').innerHTML = `CLG: <span style="color:#00ffaa;">READY</span>`;
                clgBtn.textContent = 'CLG GRID';
            }
            clgBtn.disabled          = !playing;
            clgBtn.style.color       = '#0f0';
            clgBtn.style.borderColor = '#0f0';
        }

        // --- HUD: TTU STATUS ---
        const ttuBtn = document.getElementById('ttuBtn');
        if (ttuActive) {
            const s = Math.ceil((TTU_DURATION_MS - (now - ttuLastFiredTs)) / 1000);
            document.getElementById('ttuStatus').innerHTML = `TTU: <span style="color:#00ffff;font-weight:bold;">UPLINK ACTIVE (${s}s)</span>`;
            ttuBtn.disabled = true;
        } else if (!ttuReady) {
            const s = Math.ceil((TTU_COOLDOWN_MS - (now - ttuLastFiredTs)) / 1000);
            document.getElementById('ttuStatus').innerHTML = `TTU: <span style="color:#ffcc00;">COOLDOWN (${s}s)</span>`;
            ttuBtn.disabled = true;
        } else {
            document.getElementById('ttuStatus').innerHTML = `TTU: <span style="color:#00ffaa;font-weight:bold;">READY</span>`;
            ttuBtn.textContent = 'TTU LINK';
            ttuBtn.disabled    = !playing;
        }

        // --- HUD: ORS STATUS ---
        if (orsRemain > 0) {
            document.getElementById('orsStatus').innerHTML = `ORS: <span style="color:#ffcc00;font-weight:bold;">DISRUPTION (${orsRemain}s)</span>`;
        } else if (!orsReady) {
            const s = Math.ceil((ORS_COOLDOWN_MS - (now - orsLastFiredTs)) / 1000);
            document.getElementById('orsStatus').innerHTML = `ORS: <span style="color:#ffcc00;">COOLDOWN (${s}s)</span>`;
        } else {
            document.getElementById('orsStatus').innerHTML = `ORS: <span style="color:#00ffaa;font-weight:bold;">READY</span>`;
        }
        document.getElementById('orsBtn').disabled = !playing || orsRemain > 0 || !orsReady;

        updateRoadrunnerStatus();

        // Effective RR speed (halved when CLG is active due to grid interference)
        let effSpeed = ROADRUNNER_BASE_SPEED;
        if (clgStatus === 'ACTIVE') effSpeed *= 0.5;

        // --- HUD: FURY STATUS ---
        const furyBtn = document.getElementById('furyBtn');
        if (!furyReady) {
            let s = Math.ceil((FURY_COOLDOWN_MS - (now - furyLastFiredTs)) / 1000);
            if (s <= 0) {
                furyReady = true;
                document.getElementById('furyStatus').innerHTML = `Air Support: <span style="color:#00ffff;font-weight:bold;">ON STATION</span>`;
                furyBtn.textContent = "FURY AIR SUPPORT";
                furyBtn.disabled    = !playing;
                speak('Air support refueling complete. Fury squadron on standby.', 1);
                addKill('<span style="color:#00ffff;font-weight:bold;">AIR SUPPORT:</span> Refueled and Ready.');
            } else {
                document.getElementById('furyStatus').innerHTML = `Air Support: <span style="color:#ffcc00;">REFUELING (${s}s)</span>`;
                furyBtn.textContent = `FURY (${s}s)`;
                furyBtn.disabled    = true;
            }
        } else {
            document.getElementById('furyStatus').innerHTML = `Air Support: <span style="color:#00ffff;font-weight:bold;">ON STATION</span>`;
            furyBtn.textContent = "FURY AIR SUPPORT";
            furyBtn.disabled    = !playing;
        }

        // --- DRONE SQUADRON HUD STATUS ---
        const altiusBtn = document.getElementById('altiusBtn');
        if (!altiusReady) {
            const s = Math.ceil((ALTIUS_COOLDOWN_MS - (now - altiusLastTs)) / 1000);
            if (s <= 0) {
                altiusReady = true;
                document.getElementById('altiusStatus').innerHTML = `ALTIUS: <span style="color:#00ffcc;font-weight:bold;">READY</span>`;
                altiusBtn.disabled = !playing;
                speak('Altius squadron ready.', 1);
            } else {
                document.getElementById('altiusStatus').innerHTML = `ALTIUS: <span style="color:#888;">RELOADING (${s}s)</span>`;
                altiusBtn.disabled = true;
            }
        } else {
            document.getElementById('altiusStatus').innerHTML = `ALTIUS: <span style="color:#00ffcc;font-weight:bold;">READY</span>`;
            altiusBtn.disabled = !playing;
        }

        const anvilBtn = document.getElementById('anvilBtn');
        if (!anvilReady) {
            const s = Math.ceil((ANVIL_COOLDOWN_MS - (now - anvilLastTs)) / 1000);
            if (s <= 0) {
                anvilReady = true;
                document.getElementById('anvilStatus').innerHTML = `ANVIL: <span style="color:#cc44ff;font-weight:bold;">READY</span>`;
                anvilBtn.disabled = !playing;
                speak('Anvil squadron ready.', 1);
            } else {
                document.getElementById('anvilStatus').innerHTML = `ANVIL: <span style="color:#888;">RELOADING (${s}s)</span>`;
                anvilBtn.disabled = true;
            }
        } else {
            document.getElementById('anvilStatus').innerHTML = `ANVIL: <span style="color:#cc44ff;font-weight:bold;">READY</span>`;
            anvilBtn.disabled = !playing;
        }

        const rrDeployBtn = document.getElementById('rrDeployBtn');
        if (!rrDeployReady) {
            const s = Math.ceil((RR_DEPLOY_COOLDOWN_MS - (now - rrDeployLastTs)) / 1000);
            if (s <= 0) {
                rrDeployReady = true;
                document.getElementById('rrDeployStatus').innerHTML = `RR DEPLOY: <span style="color:#00ffff;font-weight:bold;">READY</span>`;
                rrDeployBtn.disabled = !playing;
                speak('Roadrunner interceptors ready.', 1);
            } else {
                document.getElementById('rrDeployStatus').innerHTML = `RR DEPLOY: <span style="color:#888;">RELOADING (${s}s)</span>`;
                rrDeployBtn.disabled = true;
            }
        } else {
            document.getElementById('rrDeployStatus').innerHTML = `RR DEPLOY: <span style="color:#00ffff;font-weight:bold;">READY</span>`;
            rrDeployBtn.disabled = !playing;
        }

        // Jamming button always enabled while playing
        document.getElementById('jamBtn').disabled  = !playing;
        document.getElementById('autoBtn').disabled = !playing;

        // Fury overrides IFF — Fury pilots visually ID all enemies (confidence → 100)
        if (furySquad.length > 0) {
            enemies.forEach(e => {
                if (e.alive && !e.identified) {
                    e.confidence  = 100;
                    e.identified  = true;
                }
            });
        }

        // Panic launch removed — original Roadrunner ground units replaced by
        // deployable drone squadrons. Emergency response is handled by the
        // player deploying available squadrons manually.

        // --- FRIEND MOVEMENT & LOGISTICS ---
        // Original ground Roadrunner units removed. Drone squad logic above handles
        // all friendly asset movement. This loop is now a no-op (friends is empty).
        friends.filter(f => f.id !== 0).forEach(f => {

            // Resupply: replenish fuel and missiles, hold at base
            if (f.logisticsState === 'RESUPPLY') {
                f.fuel     = Math.min(f.fuel + REFUEL_RATE, MAX_FUEL);
                f.missiles = Math.min(f.missiles + RELOAD_RATE, MAX_MISSILES);
                f.lng = base.lng;
                f.lat = base.lat;
                if (f.fuel >= MAX_FUEL && f.missiles >= MAX_MISSILES) {
                    f.logisticsState = 'ACTIVE';
                }
                return; // nothing else to do this tick
            }

            // RTB: fly back to base
            if (f.logisticsState === 'RTB') {
                const distToBase = Math.hypot(base.lng - f.lng, base.lat - f.lat);
                if (distToBase < 0.001 || distToBase < (f.speed * 3.5)) {
                    f.logisticsState = 'RESUPPLY';
                    f.lng = base.lng;
                    f.lat = base.lat;
                } else {
                    const a = Math.atan2(base.lat - f.lat, base.lng - f.lng);
                    f.lng  += Math.cos(a) * (f.speed * 3.0);
                    f.lat  += Math.sin(a) * (f.speed * 3.0);
                    f.bearing = (a * 180 / Math.PI) - 90;
                }
                return; // nothing else to do this tick
            }

            // ACTIVE: hunt, engage, burn fuel
            // Fuel burn and RTB check happen AFTER movement so a freshly scrambled
            // unit gets at least one full tick of hunting before it can be re-RTB'd.
            // This also prevents the zero-distance RTB loop (scrambled at base →
            // fuel=0 → RTB → distToBase=0 → RESUPPLY → loiter forever).
            let closest = Infinity;
            let target  = null;

            enemies.forEach(e => {
                if (!e.alive) return;
                const d = Math.hypot(e.lng - f.lng, e.lat - f.lat);
                // Identify if in range
                if (!e.identified && d < ID_RANGE) e.identified = true;
                // Pick closest unengaged (or TTU-reassigned) target
                if (e.engagedBy === undefined || (ttuActive && e.engagedBy !== f.id)) {
                    if (e.identified || d < 0.003) {
                        const ed = e.isSwarmUnit ? d * 0.5 : e.isLoitererUnit ? d * 1.5 : d;
                        if (ed < closest) { closest = ed; target = e; }
                    }
                }
            });

            if (target) {
                if (ttuActive && target.engagedBy === undefined) target.engagedBy = f.id;
                const a = Math.atan2(target.lat - f.lat, target.lng - f.lng);
                f.lng += Math.cos(a) * effSpeed;
                f.lat += Math.sin(a) * effSpeed;
                f.bearing = (a * 180 / Math.PI) - 90;
                const chance = ttuActive ? 0.12 : 0.08;
                if (Math.random() < chance) fireProjectile(f, target);
            } else if (!isRegrouping) {
                f.bearing += 2; // slow drift when idle
            }

            // Burn fuel after movement; RTB if dry (missiles handled in fireProjectile)
            f.fuel -= FUEL_BURN_RATE;
            if (f.fuel <= 0) {
                f.fuel = 0;
                f.logisticsState = 'RTB';
                enemies.forEach(e => {
                    if (e.engagedBy === f.id) e.engagedBy = undefined;
                });
            }
        });

        // --- FURY JET MOVEMENT & FIRING ---
        furySquad.forEach(jet => {
            const distToBase = Math.hypot(jet.lng - base.lng, jet.lat - base.lat);
            const edwardsLat = jet.edwardsLat || base.lat + 0.089;
            const edwardsLng = jet.edwardsLng || base.lng + 0.316;

            // Mark when jet reaches the battlespace
            if (distToBase < 0.15) jet.reachedBattlespace = true;

            // Trigger egress once — set flag and lock in heading, never recalculate
            if (!jet.egressing && (jet.ammo <= 0 || (jet.reachedBattlespace && distToBase > 0.30))) {
                jet.egressing = true;
                const egressAngle = Math.atan2(edwardsLat - jet.lat, edwardsLng - jet.lng);
                jet.vx = Math.cos(egressAngle) * FURY_SPEED * 1.5;
                jet.vy = Math.sin(egressAngle) * FURY_SPEED * 1.5;
            }

            jet.lat += jet.vy;
            jet.lng += jet.vx;

            // Only fire if not egressing
            if (!jet.egressing && Math.random() < 0.50 && jet.ammo > 0) {
                const groundTargets = enemies.filter(e =>
                    e.alive &&
                    Math.hypot(e.lng - jet.lng, e.lat - jet.lat) < FURY_ENGAGE_RANGE &&
                    !furyMissiles.some(m => m.targetId === e.id)
                );
                const jetTargets = enemyJets.filter(j =>
                    j.alive && !j.egressing &&
                    Math.hypot(j.lng - jet.lng, j.lat - jet.lat) < FURY_ENGAGE_RANGE &&
                    !furyMissiles.some(m => m.targetId === j.id)
                );
                const allTargets = [...groundTargets, ...jetTargets];
                if (allTargets.length > 0) {
                    const t = allTargets.sort((a, b) =>
                        Math.hypot(a.lng - jet.lng, a.lat - jet.lat) -
                        Math.hypot(b.lng - jet.lng, b.lat - jet.lat)
                    )[0];
                    if (t) {
                        jet.ammo--;
                        furyMissiles.push({ lat: jet.lat, lng: jet.lng, targetId: t.id, speed: MISSILE_SPEED });
                    }
                }
            }
        });

        // Remove Fury jets that have returned to Edwards — checked after movement
        furySquad = furySquad.filter(j => {
            if (!j.egressing) return true; // still on attack run
            const distToEdwards = Math.hypot(
                (j.edwardsLng || base.lng + 0.316) - j.lng,
                (j.edwardsLat || base.lat + 0.089) - j.lat
            );
            return distToEdwards > 0.06; // remove when back at Edwards
        });

        // --- FURY MISSILE GUIDANCE ---
        furyMissiles = furyMissiles.filter(m => {
            // Check both ground enemies and enemy jets
            const t = enemies.find(e => e.id === m.targetId) ||
                      enemyJets.find(j => j.id === m.targetId);
            if (!t || !t.alive) { m.lat += 0.005; return false; }
            const distToTarget = Math.hypot(t.lng - m.lng, t.lat - m.lat);
            if (distToTarget < m.speed * 1.5) {
                t.alive = false;
                totalKills++;
                spawnExplosion(t.lat, t.lng, t.isSwarmUnit || false);
                const label = t.type ? `${t.type}` : 'target';
                addKill(`<span style="color:#00ffff;">FURY SQUAD:</span> ${label} eliminated (Sidewinder).`);
                return false;
            }
            const angle = Math.atan2(t.lat - m.lat, t.lng - m.lng);
            m.lng += Math.cos(angle) * m.speed;
            m.lat += Math.sin(angle) * m.speed;
            return true;
        });

        // --- ALTIUS SQUAD MOVEMENT & KAMIKAZE ---
        // Uses forEach + explicit dead marking instead of filter callbacks
        // to avoid ghost survival from filter's async-like return semantics.
        // Rules:
        //   - Always dies on kamikaze contact (no survival)
        //   - RTBs only when NO enemies are alive on the battlefield
        //   - While enemies exist but all targets are claimed, orbits and waits
        //   - Re-engages automatically when a target frees up
        // Prune dead drones from last tick BEFORE processing this tick
        altiusSquad = altiusSquad.filter(d => d.alive);
        altiusSquad.forEach(drone => {
            if (!drone.alive) return;

            // No RTB — drones always stay ACTIVE and loiter when no target available

            // ACTIVE — find closest unclaimed target
            // If current target died, clear it and look for a new one
            if (drone.targetId !== undefined) {
                const still = enemies.find(e => e.id === drone.targetId && e.alive);
                if (!still) {
                    drone.targetId = undefined;
                } else {
                    const dDrone  = Math.hypot(still.lng - drone.lng, still.lat - drone.lat);
                    const dBase   = Math.hypot(still.lng - base.lng,  still.lat - base.lat);
                    if (dDrone > dBase * 1.5 && dBase < 0.15) {
                        drone.targetId = undefined;
                    }
                }
            }

            if (drone.targetId === undefined) {
                const isReserve = drone.role === 'RESERVE';
                const visibleEnemies = isJammed
                    ? enemies.filter(e => localPictureAltius.includes(e.id))
                    : enemies;

                // RESERVE drones: only engage enemies already close to base
                if (isReserve) {
                    const closeThreats = visibleEnemies
                        .filter(e => e.alive && e.identified &&
                            Math.hypot(e.lng - base.lng, e.lat - base.lat) < 0.15)
                        .sort((a, b) =>
                            Math.hypot(a.lng - base.lng, a.lat - base.lat) -
                            Math.hypot(b.lng - base.lng, b.lat - base.lat));
                    if (closeThreats.length > 0) {
                        drone.targetId = closeThreats[0].id;
                    } else {
                        // No close threats — loiter tight to base facing outward
                        if (!drone.loiterAngle) drone.loiterAngle = Math.random() * Math.PI * 2;
                        drone.loiterAngle += 0.05;
                        drone.lng = base.lng + Math.cos(drone.loiterAngle) * 0.05;
                        drone.lat = base.lat + Math.sin(drone.loiterAngle) * 0.05;
                        return;
                    }
                } else {
                    // INTERCEPT drones: engage any identified enemy
                    let closest = Infinity;
                    let picked  = null;
                    visibleEnemies.forEach(e => {
                        if (!e.alive || !e.isSwarmUnit || !e.identified) return;
                        const claimed = altiusSquad.filter(d2 => d2.alive && d2.targetId === e.id && d2.role !== 'RESERVE').length;
                        if (claimed >= 1) return;
                        const d = Math.hypot(e.lng - drone.lng, e.lat - drone.lat);
                        if (d < closest) { closest = d; picked = e; }
                    });
                    if (!picked) {
                        visibleEnemies.forEach(e => {
                            if (!e.alive || e.isSwarmUnit || !e.identified) return;
                            const claimed = altiusSquad.filter(d2 => d2.alive && d2.targetId === e.id && d2.role !== 'RESERVE').length;
                            if (claimed >= 1) return;
                            const d = Math.hypot(e.lng - drone.lng, e.lat - drone.lat);
                            if (d < closest) { closest = d; picked = e; }
                        });
                    }
                    if (picked) {
                        drone.targetId = picked.id;
                    } else {
                        const anyAlive = enemies.some(e => e.alive);
                        if (!anyAlive) return;
                        const emergency = enemies
                            .filter(e => e.alive && e.identified &&
                                Math.hypot(e.lng - base.lng, e.lat - base.lat) < 0.20)
                            .sort((a, b) =>
                                Math.hypot(a.lng - base.lng, a.lat - base.lat) -
                                Math.hypot(b.lng - base.lng, b.lat - base.lat)
                            )[0];
                        if (emergency) { drone.targetId = emergency.id; return; }
                        if (!drone.loiterAngle) drone.loiterAngle = Math.random() * Math.PI * 2;
                        drone.loiterAngle += 0.04;
                        drone.lng = base.lng + Math.cos(drone.loiterAngle) * 0.10;
                        drone.lat = base.lat + Math.sin(drone.loiterAngle) * 0.10;
                        return;
                    }
                }
            }

            // Move toward target
            const target = enemies.find(e => e.id === drone.targetId && e.alive);
            // Re-check alive — another drone may have killed it this same tick
            if (!target || !target.alive) { drone.targetId = undefined; return; }

            const a = Math.atan2(target.lat - drone.lat, target.lng - drone.lng);
            drone.lng += Math.cos(a) * drone.speed;
            drone.lat += Math.sin(a) * drone.speed;

            // Distance check AFTER moving — radius must be larger than one tick of
            // movement (speed=0.0014) so the hit registers before visual pass-through
            const d = Math.hypot(target.lng - drone.lng, target.lat - drone.lat);
            if (d < 0.008) {
                if (!target.alive) {
                    drone.alive = false;
                    addKill(`<span style="color:#00ffcc;font-weight:bold;">ALTIUS:</span> ${drone.id} expended in debris field.`);
                    return;
                }
                target.alive     = false;
                target.engagedBy = undefined;
                totalKills++;
                spawnExplosion(target.lat, target.lng, target.isSwarmUnit);
                drone.alive = false;
                addKill(`<span style="color:#00ffcc;font-weight:bold;">ALTIUS SPLASH:</span> ${target.type || 'FPV SWARM'} destroyed. ${drone.id} expended.`);
                return;
            }
        });

        // --- ANVIL SQUAD MOVEMENT & KAMIKAZE ---
        // Same forEach pattern. 30% survival on impact — survives as RTB.
        // RTBs only when no non-swarm enemies are alive.
        // Prune dead drones from last tick BEFORE processing this tick
        anvilSquad = anvilSquad.filter(d => d.alive);
        anvilSquad.forEach(drone => {
            if (!drone.alive) return;

            // No RTB — drones stay ACTIVE and loiter when no target available

            // ACTIVE — find target
            if (drone.targetId !== undefined) {
                const still = enemies.find(e => e.id === drone.targetId && e.alive);
                if (!still) {
                    drone.targetId = undefined;
                } else {
                    // Viability check — release if we're chasing from behind near base
                    const dDrone = Math.hypot(still.lng - drone.lng, still.lat - drone.lat);
                    const dBase  = Math.hypot(still.lng - base.lng,  still.lat - base.lat);
                    if (dDrone > dBase * 1.5 && dBase < 0.15) {
                        drone.targetId = undefined;
                    }
                }
            }

            if (drone.targetId === undefined) {
                const isReserveAnvil = drone.role === 'RESERVE';
                const visibleEnemies = isJammed
                    ? enemies.filter(e => localPictureAnvil.includes(e.id))
                    : enemies;

                // RESERVE Anvil: only engage non-swarm enemies close to base
                if (isReserveAnvil) {
                    const closeThreats = visibleEnemies
                        .filter(e => e.alive && e.identified && !e.isSwarmUnit &&
                            Math.hypot(e.lng - base.lng, e.lat - base.lat) < 0.15)
                        .sort((a, b) =>
                            Math.hypot(a.lng - base.lng, a.lat - base.lat) -
                            Math.hypot(b.lng - base.lng, b.lat - base.lat));
                    if (closeThreats.length > 0) {
                        drone.targetId = closeThreats[0].id;
                    } else {
                        if (!drone.loiterAngle) drone.loiterAngle = Math.random() * Math.PI * 2;
                        drone.loiterAngle += 0.05;
                        drone.lng = base.lng + Math.cos(drone.loiterAngle) * 0.05;
                        drone.lat = base.lat + Math.sin(drone.loiterAngle) * 0.05;
                        return;
                    }
                } else {
                    // INTERCEPT Anvil: normal targeting
                    let closest = Infinity;
                    let picked  = null;
                    visibleEnemies.forEach(e => {
                        if (!e.alive || e.isSwarmUnit || !e.identified) return;
                        const claimed = anvilSquad.filter(d2 => d2.alive && d2.targetId === e.id && d2.role !== 'RESERVE').length;
                        if (claimed >= 1) return;
                        const d = Math.hypot(e.lng - drone.lng, e.lat - drone.lat);
                        if (d < closest) { closest = d; picked = e; }
                    });
                    if (!picked) {
                        const altiusCommitted = altiusSquad.filter(d2 => d2.alive && d2.targetId !== undefined).length;
                        const altiusTotal     = altiusSquad.filter(d2 => d2.alive).length;
                        const swarmsFpv = visibleEnemies.filter(e =>
                            e.alive && e.isSwarmUnit && e.identified &&
                            Math.hypot(e.lng - base.lng, e.lat - base.lat) < 0.35
                        );
                        if (swarmsFpv.length > 0 && (altiusCommitted >= altiusTotal * 0.50 || altiusTotal === 0)) {
                            swarmsFpv.forEach(e => {
                                const d = Math.hypot(e.lng - drone.lng, e.lat - drone.lat);
                                if (d < closest) { closest = d; picked = e; }
                            });
                        }
                    }
                    if (picked) {
                        drone.targetId = picked.id;
                    } else {
                        const anyAlive = enemies.some(e => e.alive);
                        if (!anyAlive) return;
                        const emergencyA = enemies
                            .filter(e => e.alive && e.identified &&
                                Math.hypot(e.lng - base.lng, e.lat - base.lat) < 0.20)
                            .sort((a, b) =>
                                Math.hypot(a.lng - base.lng, a.lat - base.lat) -
                                Math.hypot(b.lng - base.lng, b.lat - base.lat)
                            )[0];
                        if (emergencyA) { drone.targetId = emergencyA.id; return; }
                        if (!drone.loiterAngle) drone.loiterAngle = Math.random() * Math.PI * 2;
                        drone.loiterAngle += 0.03;
                        drone.lng = base.lng + Math.cos(drone.loiterAngle) * 0.12;
                        drone.lat = base.lat + Math.sin(drone.loiterAngle) * 0.12;
                        return;
                    }
                }
            }

            const target = enemies.find(e => e.id === drone.targetId && e.alive);
            if (!target || !target.alive) { drone.targetId = undefined; return; }

            const a = Math.atan2(target.lat - drone.lat, target.lng - drone.lng);
            drone.lng += Math.cos(a) * drone.speed;
            drone.lat += Math.sin(a) * drone.speed;

            const d = Math.hypot(target.lng - drone.lng, target.lat - drone.lat);
            if (d < 0.008) {
                drone.targetId = undefined;

                if (!target.alive) {
                    // debris field — stay active and find next target
                    return;
                }

                target.alive     = false;
                target.engagedBy = undefined;
                totalKills++;
                spawnExplosion(target.lat, target.lng, false);

                if (Math.random() < 0.30) {
                    // Glancing impact — survives, immediately re-engages
                    addKill(`<span style="color:#cc44ff;font-weight:bold;">ANVIL SPLASH:</span> ${target.type || 'CH-4 STRIKE'} destroyed. ${drone.id} glancing impact — re-engaging.`);
                } else {
                    drone.alive = false;
                    addKill(`<span style="color:#cc44ff;font-weight:bold;">ANVIL SPLASH:</span> ${target.type || 'CH-4 STRIKE'} destroyed. ${drone.id} expended.`);
                    return;
                }
            }
        });

        // --- ROADRUNNER INTERCEPTOR SQUAD ---
        // Each RR interceptor claims one jet or one missile — no doubling up.
        // Respects flare-induced lock loss — drone must reacquire after being flared.
        const nowRR = Date.now();
        rrSquad = rrSquad.filter(drone => {
            if (!drone.alive) return false;

            // If lock was broken by flares, wait until lock loss expires
            if (drone.lockLostUntilTs && nowRR < drone.lockLostUntilTs) {
                // Orbit in place — no target this tick
                drone.targetMissileId = undefined;
                drone.targetJetId     = undefined;
                return true;
            }

            // Re-evaluate target each tick
            let bestTarget = null;
            let bestDist   = Infinity;

            // Priority 1: jet missiles — unclaimed
            jetMissiles.filter(m => !m.intercepted).forEach(m => {
                const alreadyClaimed = rrSquad.some(d2 => d2.targetMissileId === m.id && d2 !== drone);
                if (alreadyClaimed) return;
                const d = Math.hypot(m.lng - drone.lng, m.lat - drone.lat);
                if (d < bestDist) { bestDist = d; bestTarget = { isJetMissile: true, ref: m }; }
            });

            // Priority 2: jets — only if no unclaimed missile exists
            if (!bestTarget) {
                enemyJets.filter(j => j.alive && !j.egressing).forEach(j => {
                    const alreadyClaimed = rrSquad.some(d2 => d2.targetJetId === j.id && d2 !== drone);
                    if (alreadyClaimed) return;
                    const d = Math.hypot(j.lng - drone.lng, j.lat - drone.lat);
                    if (d < bestDist) { bestDist = d; bestTarget = { isJetMissile: false, ref: j }; }
                });
            }

            if (bestTarget) {
                drone.targetMissileId = bestTarget.isJetMissile ? bestTarget.ref.id : undefined;
                drone.targetJetId     = !bestTarget.isJetMissile ? bestTarget.ref.id : undefined;
                const ref = bestTarget.ref;
                const a   = Math.atan2(ref.lat - drone.lat, ref.lng - drone.lng);
                drone.lng += Math.cos(a) * drone.speed;
                drone.lat += Math.sin(a) * drone.speed;
                if (bestDist < 0.004) {
                    if (bestTarget.isJetMissile) {
                        ref.intercepted = true;
                        spawnExplosion(ref.lat, ref.lng, false);
                        addKill(`<span style="color:#00ffff;font-weight:bold;">RR INTERCEPT:</span> Jet missile destroyed mid-flight.`);
                        speak('Missile intercept confirmed.', 1);
                    } else {
                        ref.alive = false;
                        totalKills++;
                        spawnExplosion(ref.lat, ref.lng, false, true);
                        addKill(`<span style="color:#00ffff;font-weight:bold;">RR INTERCEPT:</span> ${ref.type} destroyed.`);
                        speak(`${ref.type} down.`, 1);
                    }
                    return false;
                }
                return true;
            }
            return true;
        });

        // --- ENEMY JET MOVEMENT, EVASION & FLARES ---
        enemyJets = enemyJets.filter(jet => {
            if (!jet.alive) return false;

            // Egressing — fly away at double speed after firing
            if (jet.egressing) {
                const a = Math.atan2(jet.lat - base.lat, jet.lng - base.lng);
                jet.lng += Math.cos(a) * (jet.speed * 2.0);
                jet.lat += Math.sin(a) * (jet.speed * 2.0);
                return Math.hypot(jet.lng - base.lng, jet.lat - base.lat) < 0.45;
            }

            const nowJ = Date.now();
            const distToBase = Math.hypot(jet.lng - base.lng, jet.lat - base.lat);

            // --- THREAT DETECTION: scan for inbound RR interceptors ---
            let closestRR = Infinity;
            let closestRRDrone = null;
            rrSquad.forEach(rr => {
                if (!rr.alive) return;
                const d = Math.hypot(rr.lng - jet.lng, rr.lat - jet.lat);
                if (d < closestRR) { closestRR = d; closestRRDrone = rr; }
            });

            // --- FLARE DEPLOYMENT ---
            // If RR within flare range and flares available and cooled down
            if (closestRR < JET_FLARE_RANGE &&
                jet.flareCount > 0 &&
                nowJ - jet.flareLastTs > JET_FLARE_COOLDOWN_MS) {

                jet.flareCount--;
                jet.flareLastTs = nowJ;

                // Spawn flare particles behind the jet
                for (let fi = 0; fi < 5; fi++) {
                    const offset = (Math.random() - 0.5) * 0.008;
                    jetFlares.push({
                        id: nextId++,
                        lat: jet.lat + offset,
                        lng: jet.lng + offset,
                        born: nowJ
                    });
                }

                // Break RR lock — any RR targeting this jet loses lock temporarily
                rrSquad.forEach(rr => {
                    if (!rr.alive) return;
                    if (rr.targetJetId === jet.id) {
                        rr.lockLostUntilTs = nowJ + RR_LOCK_LOSS_MS;
                        rr.targetJetId     = undefined;
                        rr.targetMissileId = undefined;
                    }
                });

                addKill(`<span style="color:#ff9900;font-weight:bold;">⚡ FLARES:</span> ${jet.type} deployed countermeasures. Roadrunner lock broken.`);
                speak(`${jet.type} flares. Lock broken.`, 1);
            }

            // --- EVASION ---
            // If RR within evasion range, break toward a perpendicular heading
            if (closestRR < JET_EVASION_RANGE && nowJ > jet.evasionUntilTs) {
                // Pick a heading 90-135 degrees off current attack bearing
                const attackBearing = Math.atan2(base.lat - jet.lat, base.lng - jet.lng);
                const evadeSide     = Math.random() < 0.5 ? 1 : -1;
                const evadeAngle    = (Math.PI / 2) + (Math.random() * Math.PI / 4);
                jet.evasionHeading  = attackBearing + (evadeSide * evadeAngle);
                jet.evasionUntilTs  = nowJ + JET_EVASION_DURATION_MS;
            }

            // Clear evasion when timer expires
            if (nowJ >= jet.evasionUntilTs) {
                jet.evasionHeading = null;
            }

            // --- MOVEMENT ---
            let moveAngle;
            if (jet.evasionHeading !== null) {
                // Evading — fly evasion heading at higher speed
                moveAngle = jet.evasionHeading;
                jet.lng += Math.cos(moveAngle) * (jet.speed * 1.8);
                jet.lat += Math.sin(moveAngle) * (jet.speed * 1.8);
            } else {
                // Normal attack run toward base
                moveAngle = Math.atan2(base.lat - jet.lat, base.lng - jet.lng);
                jet.lng += Math.cos(moveAngle) * jet.speed;
                jet.lat += Math.sin(moveAngle) * jet.speed;
            }

            // Altitude descent on approach
            if (distToBase < ALT_DESCENT_START_RANGE * 1.5) {
                jet.alt = Math.max(3000, jet.alt - 30);
            }

            // --- FIRE MISSILE ---
            if (!jet.hasFired && distToBase < JET_FIRE_RANGE && jet.evasionHeading === null) {
                jet.hasFired  = true;
                jet.egressing = true;
                jetMissiles.push({
                    id: `JMSL-${nextId++}`,
                    lat: jet.lat,
                    lng: jet.lng,
                    alt: jet.alt,
                    intercepted: false
                });
                addKill(`<span style="color:#ff0000;font-weight:bold;">⚠ MISSILE AWAY:</span> ${jet.type} has fired! Intercept or brace for impact.`);
                speak(`Missile away. Intercept immediately.`, 2);
            }

            return true;
        });

        // --- FLARE PARTICLE CLEANUP (expire after 1.5 seconds) ---
        const nowFlare = Date.now();
        jetFlares = jetFlares.filter(f => nowFlare - f.born < 1500);

        // --- JET MISSILE GUIDANCE ---
        jetMissiles = jetMissiles.filter(m => {
            if (m.intercepted) return false;
            // Fast straight descent to base
            const a = Math.atan2(base.lat - m.lat, base.lng - m.lng);
            m.lng += Math.cos(a) * JET_MISSILE_SPEED;
            m.lat += Math.sin(a) * JET_MISSILE_SPEED;
            m.alt  = Math.max(0, m.alt - 200); // rapid descent
            // Impact threshold must exceed one tick of travel to prevent ping-pong
            if (Math.hypot(m.lng - base.lng, m.lat - base.lat) < JET_MISSILE_SPEED * 1.5) {
                spawnExplosion(base.lat, base.lng, false, true);
                flashBaseHit();
                baseHealth--;
                speak(`Direct hit. Base integrity ${Math.max(0, baseHealth * 20)} percent.`, 2);
                addKill(`<span style="color:#f00;font-weight:bold;">MISSILE IMPACT:</span> Base systems critically damaged! Integrity: ${Math.max(0, baseHealth * 20)}%`);
                // Knock out a random online XRST tower
                const online = xrstTowers.filter(t => t.online);
                if (online.length > 0) {
                    const hit = online[Math.floor(Math.random() * online.length)];
                    hit.online = false;
                    addKill(`<span style="color:#ff6600;font-weight:bold;">XRST ALERT:</span> ${hit.id} destroyed by missile strike.`);
                }
                // Also count as a base breach
                roadrunnerLosses++;
                const avail = friends.filter(f => f.id !== 0);
                if (avail.length > 0) {
                    const v = avail[Math.floor(Math.random() * avail.length)];
                    v.id = 0;
                    addKill(`<span style="color:#f00;font-weight:bold;">COLLATERAL:</span> ${v.name} destroyed in missile strike.`);
                }
                return false;
            }
            return true;
        });

        // --- CLG PERIMETER KILLS ---
        // Realistic laser constraints:
        //   - One target per tick (dwell time — can't split beam)
        //   - FPV swarms have 50% miss chance (small fast targets)
        //   - Each kill spikes heat faster (power draw per engagement)
        //   - Hard cap of CLG_MAX_KILLS per activation (thermal/power limit)
        if (clgStatus === 'ACTIVE' && clgKillsThisActivation < CLG_MAX_KILLS) {
            // Find closest enemy in range — laser always engages nearest threat
            const inRange = enemies
                .filter(e => e.alive && Math.hypot(e.lng - base.lng, e.lat - base.lat) < CLG_RANGE)
                .sort((a, b) =>
                    Math.hypot(a.lng - base.lng, a.lat - base.lat) -
                    Math.hypot(b.lng - base.lng, b.lat - base.lat)
                );

            if (inRange.length > 0) {
                const target = inRange[0];
                // FPV swarms: 50% hit chance per tick — small fast targets
                const hitChance = target.isSwarmUnit ? 0.5 : 1.0;
                if (Math.random() < hitChance) {
                    target.alive               = false;
                    target.engagedBy           = undefined;
                    target.isKillStreakProcessed = true;
                    totalKills++;
                    clgKillsThisActivation++;
                    // Each kill adds extra heat — power spike per engagement
                    clgHeat = Math.min(CLG_MAX_HEAT, clgHeat + 8);
                    spawnExplosion(target.lat, target.lng, target.isSwarmUnit);
                    friends.forEach(f => { f.currentStreak = 0; });
                    highestStreak = friends.reduce((m, f) => Math.max(m, f.currentStreak), 0);
                    addKill(`<span style="color:#ff00ff;">CLG:</span> ${target.type} eliminated. [${clgKillsThisActivation}/${CLG_MAX_KILLS}]`);

                    // Force cooldown when kill cap reached
                    if (clgKillsThisActivation >= CLG_MAX_KILLS) {
                        clgStatus   = 'COOLDOWN';
                        clgTargetTs = Date.now() + CLG_COOLDOWN_MS;
                        clgHeat     = CLG_MAX_HEAT;
                        document.getElementById('clgBtn').disabled    = true;
                        document.getElementById('clgBtn').textContent = 'CLG EXHAUSTED';
                        if (map.getLayer('clg-perimeter')) {
                            map.setPaintProperty('clg-perimeter', 'circle-opacity', 0.05);
                            map.setPaintProperty('clg-perimeter', 'circle-stroke-opacity', 0.1);
                        }
                        addKill('<span style="color:#ff00ff;font-weight:bold;">CLG:</span> Thermal limit reached. Forced cooldown.');
                        speak('Laser grid exhausted. Cooling down.', 1);
                    }
                }
            }
        }

        // --- PROJECTILE MOVEMENT & HIT DETECTION ---
        const pktChance = ttuActive ? TTU_PACKET_HIT_CHANCE : 0.35;
        projectiles = projectiles.filter(p => {
            p.lng += p.vx;
            p.lat += p.vy;
            let hit = false;

            if (p.isEMP) {
                // EMP: detonate when it reaches the detonation radius
                const d = Math.hypot(p.lng - base.lng, p.lat - base.lat);
                if (d < p.detonationRange) {
                    hit = true;
                    let enemyKills = 0;

                    // --- ENEMY KILLS ---
                    enemies.forEach(e => {
                        const ed = Math.hypot(e.lng - base.lng, e.lat - base.lat);
                        if (e.alive && ed < EMP_KILL_RANGE) {
                            e.alive                = false;
                            e.engagedBy            = undefined;
                            e.isKillStreakProcessed = true;
                            totalKills++;
                            enemyKills++;
                            spawnExplosion(e.lat, e.lng, e.isSwarmUnit, true);
                        }
                    });
                    if (enemyKills > 0) {
                        friends.forEach(f => { f.currentStreak = 0; });
                        highestStreak = friends.reduce((m, f) => Math.max(m, f.currentStreak), 0);
                        addKill(`<span style="color:#00ffff;font-weight:bold;">EMP DETONATION:</span> ${enemyKills} hostile contacts eliminated.`);
                        speak('E.M.P. detonation. Area denied.', 2);
                    }

                    // EMP outer disruption ring — slows enemies that survive the kill zone
                    let disrupted = 0;
                    const empNow = Date.now();
                    enemies.forEach(e => {
                        if (!e.alive) return;
                        const ed = Math.hypot(e.lng - base.lng, e.lat - base.lat);
                        if (ed >= EMP_KILL_RANGE && ed < EMP_DISRUPT_RANGE) {
                            e.empSlowedUntil = empNow + EMP_DISRUPT_DURATION;
                            disrupted++;
                        }
                    });
                    if (disrupted > 0) {
                        addKill(`<span style="color:#00ffff;font-weight:bold;">EMP DISRUPTION:</span> ${disrupted} contacts in outer ring — systems degraded.`);
                    }

                    // --- FRIENDLY COLLATERAL DAMAGE ---
                    // XRST towers: all online towers go offline — EMP pulse propagates
                    // beyond kill range since tower antennas are highly exposed
                    // Towers sit at ~0.14 from base so use a wider radius than EMP_KILL_RANGE
                    let towersHit = 0;
                    xrstTowers.forEach(tower => {
                        if (tower.online) {
                            tower.online = false;
                            towersHit++;
                        }
                    });
                    if (towersHit > 0) {
                        addKill(`<span style="color:#ff6600;font-weight:bold;">EMP COLLATERAL:</span> ${towersHit} XRST tower${towersHit > 1 ? 's' : ''} knocked offline by pulse.`);
                        speak('Warning. Friendly sensors offline from E.M.P. pulse.', 2);
                    }

                    // Altius drones: small consumer electronics — destroyed in range
                    let altiusLost = 0;
                    altiusSquad.forEach(drone => {
                        if (!drone.alive) return;
                        const dd = Math.hypot(drone.lng - base.lng, drone.lat - base.lat);
                        if (dd < EMP_KILL_RANGE) {
                            drone.alive = false;
                            altiusLost++;
                            spawnExplosion(drone.lat, drone.lng, true);
                        }
                    });
                    altiusSquad = altiusSquad.filter(d => d.alive);
                    if (altiusLost > 0) {
                        addKill(`<span style="color:#ff6600;font-weight:bold;">EMP COLLATERAL:</span> ${altiusLost} ALTIUS drone${altiusLost > 1 ? 's' : ''} lost to pulse.`);
                    }

                    // Anvil drones: similar vulnerability — destroyed in range
                    let anvilLost = 0;
                    anvilSquad.forEach(drone => {
                        if (!drone.alive) return;
                        const dd = Math.hypot(drone.lng - base.lng, drone.lat - base.lat);
                        if (dd < EMP_KILL_RANGE) {
                            drone.alive = false;
                            anvilLost++;
                            spawnExplosion(drone.lat, drone.lng, false);
                        }
                    });
                    anvilSquad = anvilSquad.filter(d => d.alive);
                    if (anvilLost > 0) {
                        addKill(`<span style="color:#ff6600;font-weight:bold;">EMP COLLATERAL:</span> ${anvilLost} ANVIL drone${anvilLost > 1 ? 's' : ''} lost to pulse.`);
                    }

                    // Roadrunner interceptors: hardened military hardware — 50% survive, stunned 10s
                    let rrStunned = 0;
                    let rrLost    = 0;
                    rrSquad.forEach(drone => {
                        if (!drone.alive) return;
                        const dd = Math.hypot(drone.lng - base.lng, drone.lat - base.lat);
                        if (dd < EMP_KILL_RANGE) {
                            if (Math.random() < 0.50) {
                                // Survives but stunned — loses lock, can't engage for 10s
                                drone.lockLostUntilTs = Date.now() + 10000;
                                drone.targetJetId     = undefined;
                                drone.targetMissileId = undefined;
                                rrStunned++;
                            } else {
                                drone.alive = false;
                                rrLost++;
                                spawnExplosion(drone.lat, drone.lng, false);
                            }
                        }
                    });
                    rrSquad = rrSquad.filter(d => d.alive);
                    if (rrStunned > 0 || rrLost > 0) {
                        addKill(`<span style="color:#ff6600;font-weight:bold;">EMP COLLATERAL:</span> Roadrunner — ${rrStunned} stunned, ${rrLost} lost.`);
                    }

                    // CLG: if active, pulse knocks it offline temporarily
                    if (clgStatus === 'ACTIVE' || clgStatus === 'ACTIVATING') {
                        clgStatus   = 'COOLDOWN';
                        clgTargetTs = Date.now() + CLG_COOLDOWN_MS;
                        document.getElementById('clgBtn').disabled    = true;
                        document.getElementById('clgBtn').textContent = 'CLG OFFLINE';
                        if (map.getLayer('clg-perimeter')) {
                            map.setPaintProperty('clg-perimeter', 'circle-opacity', 0.05);
                            map.setPaintProperty('clg-perimeter', 'circle-stroke-opacity', 0.1);
                        }
                        addKill('<span style="color:#ff6600;font-weight:bold;">EMP COLLATERAL:</span> CLG knocked offline by pulse.');
                    }

                    // Fury jets: hardened avionics — survive but lose targeting for 5s
                    furySquad.forEach(jet => {
                        const jd = Math.hypot(jet.lng - base.lng, jet.lat - base.lat);
                        if (jd < EMP_KILL_RANGE && !jet.egressing) {
                            jet.ammo = Math.max(0, jet.ammo - 2); // partial systems damage
                            addKill(`<span style="color:#ff6600;font-weight:bold;">EMP COLLATERAL:</span> ${jet.id} avionics disrupted — 2 missiles lost.`);
                        }
                    });

                    return false;
                }
            } else {
                // Standard projectile: check for proximity hit.
                // Roadrunner missiles are surface-to-air interceptors with a
                // limited engagement envelope — they cannot reach targets still
                // at cruise altitude. Only engage when target has descended.
                enemies.forEach(e => {
                    if (e.alive &&
                        Math.hypot(e.lng - p.lng, e.lat - p.lat) < 0.0035 &&
                        (e.alt || 0) < ALT_MISSILE_ENVELOPE) {
                        const isPkt = e.isSwarmUnit;
                        if (!isPkt || Math.random() < pktChance) {
                            e.alive     = false;
                            e.engagedBy = undefined;
                            hit         = true;
                            totalKills++;
                            const f = friends.find(x => x.id === p.firerId);
                            if (f) {
                                const msg = isPkt
                                    ? `SPLASH — PACKET DESTROYED <span style="color:#00ffaa;">(${f.name})</span>`
                                    : `SPLASH — TARGET DESTROYED <span style="color:#00ffaa;">(${f.name})</span>`;
                                if (!e.isKillStreakProcessed) {
                                    const nowK = Date.now();
                                    const prev = f.currentStreak;
                                    if (nowK - f.lastKillTs < STREAK_WINDOW_MS) {
                                        f.currentStreak++;
                                    } else {
                                        f.currentStreak = 1;
                                    }
                                    f.lastKillTs  = nowK;
                                    highestStreak = friends.reduce((m, x) => Math.max(m, x.currentStreak), 0);
                                    spawnExplosion(e.lat, e.lng, isPkt);
                                    const suffix = f.currentStreak > 1 ? ` (Streak: ${f.currentStreak})` : '';
                                    addKill(msg + suffix);
                                    if (f.currentStreak > sessionHighStreak) sessionHighStreak = f.currentStreak;
                                    setTimeout(() => {
                                        checkKillStreakVoice(f, prev);
                                    }, 1500);
                                    e.isKillStreakProcessed = true;
                                }
                            } else {
                                addKill('SPLASH — TARGET DESTROYED (UNKNOWN ASSET)');
                            }
                        } else {
                            // Packet survived the shot (RNG miss) — free it immediately
                            // so the next closest Roadrunner can re-engage without waiting
                            e.engagedBy = undefined;
                        }
                    }
                });
            }
            return !hit;
        });

        // Remove projectiles that have flown too far from base — free their target's engagedBy
        projectiles = projectiles.filter(p => {
            if (Math.hypot(p.lng - base.lng, p.lat - base.lat) > 0.25) {
                // Missile flew out of bounds without hitting — release the target lock
                if (p.targetId !== undefined) {
                    const missed = enemies.find(e => e.id === p.targetId && e.alive);
                    if (missed) missed.engagedBy = undefined;
                }
                return false;
            }
            return true;
        });

        // --- EXPLOSION ANIMATION TICK ---
        const nowE = Date.now();
        explosions = explosions.filter(e => {
            const t = (nowE - e.startTime) / e.duration;
            if (t >= 1) return false;
            e.radius  = e.isBigEMP ? 100 : (e.isSwarmUnit ? 25 : 40 * (1 - (1 - t) ** 4));
            e.opacity = 1 - t;
            e.color   = e.isBigEMP ? '#00ffff' : (e.isSwarmUnit ? '#ffff00' : '#ff9900');
            return true;
        });

        // --- TRACK CONFIDENCE & SENSOR FUSION ---
        // Four sensor layers each contribute confidence per tick.
        // Final confidence determines engagement authorization.
        //
        // RADAR:          +5/tick  — long range (0.45°), sees all, classifies nothing
        //                           Degraded to +2 under jamming
        // XRST:           +15/tick — medium range tower network, requires online tower
        // EO/IR (drone):  +35/tick in cone, +15 ambient — close range, directional
        //                           Offline under jamming
        // GROUND DETECT:  +20/tick — short range (0.08°), FPV/low-alt only
        //
        // Tiers: 0-39 UNKNOWN | 40-79 SUSPECT | 80-100 HOSTILE
        const nowConf = Date.now();
        enemies.forEach(e => {
            if (!e.alive) return;
            let gained = 0;
            let sources = []; // track which sensors are contributing (for debug/UI)

            // ── RADAR ─────────────────────────────────────────────
            const dBase = Math.hypot(e.lng - base.lng, e.lat - base.lat);
            if (dBase < RADAR_RANGE) {
                const radarRate = isJammed ? 2 : RADAR_CONF_RATE;
                gained += radarRate;
                sources.push('RADAR');
            }

            // ── XRST TOWERS ───────────────────────────────────────
            xrstTowers.forEach(tower => {
                if (!tower.online) return;
                const d = Math.hypot(e.lng - tower.lng, e.lat - tower.lat);
                if (d < XRST_DETECT_RANGE) { gained += 15; sources.push('XRST'); }
            });

            // ── EO/IR DRONE CAMERA ────────────────────────────────
            // Each active drone has a forward-facing camera cone.
            // Enemies inside the cone get high confidence; nearby enemies get lower.
            if (!isJammed) {
                [...altiusSquad, ...anvilSquad].forEach(drone => {
                    if (!drone.alive) return;
                    const dx = e.lng - drone.lng;
                    const dy = e.lat - drone.lat;
                    const dist = Math.hypot(dx, dy);
                    if (dist > EOIR_CONE_RANGE) return;

                    // Check if enemy is within the camera's forward cone
                    // Drone heading toward its target or toward base
                    const targetE = enemies.find(t => t.id === drone.targetId && t.alive);
                    // When drone has a target, face the target.
                    // When loitering (no target), face outward away from base
                    // so EO/IR cone sweeps the threat approach corridor.
                    let headingLng, headingLat;
                    if (targetE) {
                        headingLng = targetE.lng - drone.lng;
                        headingLat = targetE.lat - drone.lat;
                    } else {
                        // Outward — away from base
                        headingLng = drone.lng - base.lng;
                        headingLat = drone.lat - base.lat;
                    }
                    const headingAngle = Math.atan2(headingLat, headingLng);
                    const toEnemyAngle = Math.atan2(dy, dx);
                    let angleDiff = Math.abs(headingAngle - toEnemyAngle) * (180 / Math.PI);
                    if (angleDiff > 180) angleDiff = 360 - angleDiff;

                    if (angleDiff < EOIR_CONE_ANGLE / 2) {
                        gained += EOIR_CONF_RATE;  // in cone — high confidence
                        sources.push('EO/IR-CONE');
                    } else {
                        gained += EOIR_AMBIENT_RATE; // nearby but not in cone
                        sources.push('EO/IR');
                    }
                });
            }

            // ── GROUND DETECTION (acoustic/seismic) ───────────────
            // Short-range, detects low-altitude threats that radar might miss
            if (dBase < GROUND_DETECT_RANGE && (e.alt || 0) < 300) {
                gained += GROUND_CONF_RATE;
                sources.push('GND');
            }

            // ── TIME-ON-TRACK ─────────────────────────────────────
            if (gained > 0 && e.firstSeenTs === 0) e.firstSeenTs = nowConf;
            if (e.firstSeenTs > 0) gained += 2;

            // Apply confidence — cap at 100
            if (gained > 0) {
                e.confidence = Math.min(100, (e.confidence || 0) + gained);
                e.sensorSources = sources; // store for potential UI display
            }

            // Sync identified flag
            if (e.confidence >= 80 && !e.identified) e.identified = true;
        });

        // --- ENEMY MOVEMENT & ALTITUDE DESCENT ---
        // Enemies are threat-aware — they will divert to attack nearby friendly
        // drones rather than flying straight to base, making drone defense meaningful.
        // Engagement range: FPV swarms ignore drones (they are too small/fast to care),
        // but CH-4 and TB-001 will divert to engage Altius/Anvil squads.
        const ENEMY_DRONE_ENGAGE_RANGE = 0.025; // how close a drone must be to draw fire

        enemies.forEach(e => {
            if (!e.alive) return;

            let moveTargetLat = base.lat;
            let moveTargetLng = base.lng;

            // CH-4 and TB-001 will divert to attack nearby friendly drones
            if (!e.isSwarmUnit) {
                let closestDroneDist = Infinity;
                let droneTarget = null;

                // Check all friendly drone squads
                [...altiusSquad, ...anvilSquad, ...rrSquad].forEach(drone => {
                    if (!drone.alive) return;
                    const d = Math.hypot(drone.lng - e.lng, drone.lat - e.lat);
                    if (d < ENEMY_DRONE_ENGAGE_RANGE && d < closestDroneDist) {
                        closestDroneDist = d;
                        droneTarget = drone;
                    }
                });

                if (droneTarget) {
                    // Divert to engage the drone
                    moveTargetLat = droneTarget.lat;
                    moveTargetLng = droneTarget.lng;

                    // If close enough, destroy the drone (enemy rams it)
                    if (closestDroneDist < 0.003) {
                        droneTarget.alive = false;
                        spawnExplosion(droneTarget.lat, droneTarget.lng, false);
                        addKill(`<span style="color:#f00;font-weight:bold;">DRONE LOST:</span> ${droneTarget.id} destroyed by ${e.type || 'CH-4'}.`);
                        
                    }
                }
            }

            const a = Math.atan2(moveTargetLat - e.lat, moveTargetLng - e.lng);
            // Apply EMP slow if active
            const empSlow = (e.empSlowedUntil && Date.now() < e.empSlowedUntil) ? 0.15 : 1.0;
            e.lng += Math.cos(a) * e.speed * enemySpeedMul * empSlow;
            e.lat += Math.sin(a) * e.speed * enemySpeedMul * empSlow;

            // Altitude descent when closing on base
            const distToBase = Math.hypot(e.lng - base.lng, e.lat - base.lat);
            if (distToBase < ALT_DESCENT_START_RANGE && e.alt > 0) {
                let descentRate;
                if (e.isSwarmUnit)         descentRate = 18;
                else if (e.isLoitererUnit) descentRate = 6;
                else                       descentRate = 12;
                e.alt = Math.max(0, e.alt - descentRate);
            }
        });

        // --- BASE BREACH DETECTION ---
        // Enemy must be at ground level (alt < ALT_BREACH_THRESHOLD) to breach.
        // High altitude threats that reach the base perimeter are still descending
        // and haven't completed their terminal attack run yet.
        enemies = enemies.filter(e => {
            if (e.alive &&
                Math.hypot(e.lng - base.lng, e.lat - base.lat) < baseThreshold &&
                (e.alt || 0) < ALT_BREACH_THRESHOLD) {
                e.alive               = false;
                e.isKillStreakProcessed = false;
                flashBaseHit();
                // Check if breach is close enough to damage an XRST tower
                xrstTowers.forEach(tower => {
                    if (!tower.online) return;
                    const td = Math.hypot(e.lng - tower.lng, e.lat - tower.lat);
                    if (td < XRST_DAMAGE_RADIUS) {
                        tower.online = false;
                        addKill(`<span style="color:#ff6600;font-weight:bold;">XRST ALERT:</span> ${tower.id} knocked offline by breach event.`);
                        speak(`Warning. ${tower.id} offline. Sensor coverage degraded.`, 1);
                    }
                });
                baseHealth--;
                if (!isTelemetryActive && !ttuActive && baseHealth <= 0) {
                    speak('Critical. Base destroyed. Mission failed.', 2);
                }
                friends.forEach(f => { f.currentStreak = 0; f.lastKillTs = 0; });
                highestStreak    = friends.reduce((m, f) => Math.max(m, f.currentStreak), 0);
                lastStreakSpokenTs  = 0;
                lastKillFeedLogTs   = 0;

                const msg = e.isSwarmUnit
                    ? '<span style="color:#f00;font-weight:bold;">PACKET BREACH!</span> - Critical Infrastructure Hit!'
                    : e.isLoitererUnit
                        ? '<span style="color:#f00;font-weight:bold;">LOITERER BREACH!</span> - Critical Infrastructure Hit!'
                        : '<span style="color:#f00;font-weight:bold;">BASE BREACH!</span> - Roadrunner Lost!';

                if (!e.isSwarmUnit && !e.isLoitererUnit) {
                    roadrunnerLosses++;
                    addKill(`${msg} — Base systems damaged.`);
                } else {
                    addKill(msg);
                }
                return false;
            }
            return e.alive;
        });

        // --- WIN / LOSS CHECKS ---
        const alive            = enemies.filter(e => e.alive).length;
        // Egressing jets have fired and are leaving — don't hold up the wave timer
        const jetsAlive        = enemyJets.filter(j => j.alive && !j.egressing).length;
        const missilesInFlight = jetMissiles.filter(m => !m.intercepted).length;
        const totalThreats     = alive + jetsAlive + missilesInFlight;

        if (baseHealth <= 0 && playing) {
            // Base destroyed — game over
            if (waveTimer)              clearTimeout(waveTimer);
            if (telemetryInterval)      clearInterval(telemetryInterval);
            if (resumeInterval)         clearInterval(resumeInterval);
            if (recommendationInterval) clearInterval(recommendationInterval);
            playing    = false;
            isUpdating = false;
            showGameOver();
        } else if (totalThreats === 0 && playing) {
            // All threats cleared — begin next wave cycle
            if (waveNumber > 1) {
                if (!isTelemetryActive && !ttuActive && (now - lastAllClearVoiceTs) > 30000) {
                    speak('All threats eliminated. Drone squadrons standing by.', 1);
                    lastAllClearVoiceTs = now;
                }
                if (!waveTimer) {
                    waveTimer = setTimeout(spawnWave, 35000);
                    addKill('<span style="color:#00ffaa;font-weight:bold;">SYSTEM:</span> Airspace clear. Next wave inbound in 35 seconds.');
                }
            }
        }

        updateStatsBar();
        refresh();
    }

    // ============================================================
    // REFRESH MAP SOURCES
    // ============================================================
