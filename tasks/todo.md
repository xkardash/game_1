# Browser 2D Game Plan

## Goal
Build a simple 2D browser game inspired by classic web game portal experiences: fast to load, instantly playable, keyboard-friendly, and fun within the first 10 seconds.

## Current Decision Needed
- [x] Choose the first game type: arcade shooter.

## Candidate Directions
- [ ] Platform runner: a boy character jumps over obstacles, collects coins, and reaches a finish line.
- [ ] Top-down adventure: a small character explores a map, collects keys, avoids enemies, and reaches an exit.
- [x] Arcade shooter: player moves left/right, shoots targets, and survives waves.

## Recommended First Version
- [x] Build an arcade shooter because the user selected it.
- [x] Use a single-screen wave survival loop: move left/right, shoot enemies, avoid collisions, score points, restart quickly.

## First Playable Scope
- [x] Single HTML page running in the browser.
- [x] 2D canvas-based game area.
- [x] Main menu, play state, game over state, and restart.
- [x] Keyboard controls: left/right or A/D to move, Space to shoot/start/restart.
- [x] Player ship movement with screen bounds.
- [x] Bullets with fire-rate control.
- [x] Enemy waves that descend and speed up over time.
- [x] Player lives, score, wave counter, and high score for the current session.
- [x] Collision detection for bullets/enemies and enemies/player.
- [x] Distinct game feel using canvas-drawn sprites and responsive layout.

## Verification Plan
- [x] Run the game locally in a browser.
- [x] Verify player can start, move, shoot, lose, and restart.
- [x] Check layout at desktop and smaller viewport sizes.
- [x] Document what was tested in this file before marking done.

## Review
- Built `index.html`, `styles.css`, `src/game.js`, and `src/draw.js`.
- `node --check src\game.js` passed.
- `node --check src\draw.js` passed.
- Chrome headless desktop render screenshot saved to `tasks/game-screenshot.png`.
- Chrome headless gameplay screenshot saved to `tasks/game-playing-screenshot.png`.
- Chrome headless mobile render screenshot saved to `tasks/game-mobile-screenshot.png`.
- CDP interaction check passed: start hides overlay, button changes to `Sifirla`, lives stay at 3, firing creates 108 bright bullet-region pixels.
- CDP movement check passed: player X moved from 480 to 363 after left input.
- CDP game-over/restart check passed: ready -> playing -> gameOver with 0 lives -> playing with 3 lives.

## Improvement Roadmap

### Recommended Next Step: Game Feel Pack
- [x] Add enemy hit flash and screen shake on impact.
- [x] Add player muzzle flash and clearer bullet trails.
- [x] Add explosion particles with different sizes and lifetimes.
- [x] Add pause/resume with `P` or `Escape`.
- [x] Add a short countdown before the wave starts.
- [x] Verify that the game still feels responsive and does not visually clutter the play area.

### Game Feel Pack Implementation Plan
- [x] Add browser behavior tests for countdown, pause/resume, hit feedback, and restart stability.
- [x] Watch the new tests fail against the current prototype.
- [x] Add countdown state before gameplay starts.
- [x] Add pause/resume state with `P` and `Escape`.
- [x] Add hit feedback state: enemy flash, muzzle flash, bullet trails, variable particles, and screen shake.
- [x] Keep source files small enough to review quickly.
- [x] Run syntax checks, behavior tests, and Chrome render screenshots.
- [x] Update this review section with the final evidence.

### Game Feel Pack Review
- Added `src/effects.js`, `src/controls.js`, and `src/test-hooks.js`.
- Updated `src/game.js` for countdown, pause/resume, wave countdowns, hit feedback state, and testable snapshots.
- Updated `src/draw.js` for screen shake, muzzle flashes, bullet trails, impact flashes, and variable-size particles.
- Added `tests/game-feel.test.js` using Node's test runner plus Chrome DevTools Protocol.
- RED evidence: `node --test --test-concurrency=1 tests\game-feel.test.js` initially failed 3 tests because countdown, pause, and hit-feedback behavior were missing.
- GREEN evidence: `node --test --test-concurrency=1 tests\game-feel.test.js` passed 3/3 tests.
- Syntax evidence: `node --check` passed for `src\game.js`, `src\draw.js`, `src\effects.js`, `src\controls.js`, `src\test-hooks.js`, and `tests\game-feel.test.js`.
- File size check: `src\game.js` 292 lines, `src\draw.js` 111, `src\effects.js` 76, `src\controls.js` 36, `src\test-hooks.js` 26, `tests\game-feel.test.js` 165.
- Security scan: `rg "innerHTML|eval\(|new Function|TODO|Not implemented" index.html styles.css src tests` returned no matches.
- Render evidence: `tasks/game-feel-ready.png`, `tasks/game-feel-mobile.png`, and `tasks/game-feel-playing.png`.

### Wave Flow + Space Environment Correction Plan
- [x] Add tests proving completed waves advance immediately without countdown.
- [x] Add tests proving the playfield exposes layered space-environment elements.
- [x] Watch those tests fail before changing production code.
- [x] Remove countdown from inter-wave transitions while keeping the initial start countdown.
- [x] Replace the grid-like background with a deeper space scene: layered stars, distant bodies, and subtle space dust.
- [x] Verify behavior tests, syntax checks, desktop screenshot, and mobile screenshot.
- [x] Update this section with evidence.

### Wave Flow + Space Environment Review
- Updated `src/game.js` so `nextWave()` no longer calls countdown; only initial game start keeps countdown.
- Added `finishWave` test hook to prove wave transition behavior without waiting for manual play.
- Updated `src/effects.js` with layered star metadata and persistent space objects.
- Replaced the grid-like canvas background in `src/draw.js` with nebula dust, layered stars, a ringed planet, and moons.
- Updated `src/test-hooks.js` snapshots with `spaceObjects` and `starLayers`.
- RED evidence: new tests initially failed because `finishWave` did not exist and `spaceObjects` was absent.
- GREEN evidence: `node --test --test-concurrency=1 tests\game-feel.test.js` passed 5/5 tests.
- Syntax evidence: `node --check` passed for updated source/test files.
- File size check: `src\game.js` 298 lines, `src\draw.js` 164, `src\effects.js` 87, `src\controls.js` 36, `src\test-hooks.js` 29, `tests\game-feel.test.js` 188.
- Security scan: `rg "innerHTML|eval\(|new Function|TODO|Not implemented" index.html styles.css src tests` returned no matches.
- Render evidence: `tasks/space-ready.png`, `tasks/space-mobile.png`, and `tasks/space-playing.png`.

### Player Space Shuttle Plan
- [x] Add a visual regression test that samples the player area for a shuttle-like bright fuselage.
- [x] Watch the test fail against the current triangle player.
- [x] Replace the triangle player drawing with a composite space shuttle: fuselage, nose, windows, wings, engine, and flame.
- [x] Verify behavior tests, syntax checks, and updated gameplay screenshot.
- [x] Update this section with final evidence.

### Player Space Shuttle Review
- Updated `src/draw.js` so the player is now a layered canvas shuttle instead of a triangle.
- Added `player renders a bright space shuttle fuselage` to `tests/game-feel.test.js`.
- RED evidence: the new shuttle visual test failed against the old triangle player because bright fuselage pixels were below threshold.
- GREEN evidence: `node --test --test-concurrency=1 tests\game-feel.test.js` passed 6/6 tests.
- Syntax evidence: `node --check` passed for `src\draw.js`, `tests\game-feel.test.js`, and the other source files.
- File size check: `src\game.js` 298 lines, `src\draw.js` 213, `src\effects.js` 87, `src\controls.js` 36, `src\test-hooks.js` 29, `tests\game-feel.test.js` 209.
- Security scan: `rg "innerHTML|eval\(|new Function|TODO|Not implemented" index.html styles.css src tests` returned no matches.
- Render evidence: `tasks/shuttle-player.png`.

### Survival Roguelite Conversion Plan
- [x] Add tests for free 2D movement, automatic targeting/fire, XP pickup/level-up, 3-choice upgrade selection, and boss spawning.
- [x] Watch the new tests fail against the current arcade shooter.
- [x] Convert controls to horizontal + vertical movement while preserving keyboard start/pause.
- [x] Convert enemy behavior from fixed formation to edge-spawned hordes that chase the player.
- [x] Convert firing to automatic nearest-target shots.
- [x] Add XP gems, XP thresholds, level-up phase, and three upgrade cards.
- [x] Add upgrade effects with simple synergies: fire rate, projectile count, damage, speed, magnet, repair.
- [x] Add boss spawning at threat milestones.
- [x] Update canvas rendering for XP gems, boss enemies, and upgrade overlay state.
- [x] Verify behavior tests, syntax checks, security scan, and screenshots.

### Survival Roguelite Conversion Review
- Reworked the game loop into a survival auto-shooter: free 2D movement, edge-spawned chasing hordes, automatic nearest-target firing, XP gem collection, level-up pause, three upgrade choices, and boss enemies.
- Added `src/survival.js` for survival rules and `src/ui.js` for HUD/upgrade-panel syncing so the main loop stays focused on state and timing.
- Updated `src/game.js`, `src/draw.js`, `src/controls.js`, `src/test-hooks.js`, `index.html`, and `styles.css` for the new mechanics and UI.
- RED evidence: the new survival tests initially failed because free movement, auto-fire, XP level-up, upgrade selection, and boss spawning did not exist yet.
- GREEN evidence: `node --test --test-concurrency=1 tests\game-feel.test.js` passed 11/11 tests.
- Syntax evidence: `node --check` passed for `src\game.js`, `src\draw.js`, `src\survival.js`, `src\ui.js`, `src\controls.js`, `src\effects.js`, `src\test-hooks.js`, and `tests\game-feel.test.js`.
- File size check: `src\game.js` 330 lines, `src\draw.js` 264, `src\survival.js` 137, `src\ui.js` 49, `src\controls.js` 43, `src\effects.js` 97, `src\test-hooks.js` 43, `tests\game-feel.test.js` 317.
- Security scan: `rg "innerHTML|eval\(|new Function|TODO|Not implemented" index.html styles.css src tests` returned no matches.
- Render evidence: `tasks/survival-playing.png` and `tasks/survival-levelup.png`.

### Second Step: Progression Pack
- [ ] Add power-ups: double shot, shield, rapid fire, and health repair.
- [ ] Add multiple enemy types with different movement and health.
- [ ] Add wave intro labels and difficulty pacing.
- [ ] Add a boss wave every 5 waves.
- [ ] Verify scoring, lives, power-up expiry, and boss win/loss states.

### Third Step: Polish Pack
- [ ] Add local high score persistence.
- [ ] Add sound effects and volume/mute control.
- [ ] Add title/menu screen with difficulty selection.
- [ ] Add short help modal for controls.
- [ ] Improve mobile controls with hold-to-fire and larger thumb zones.
- [ ] Verify desktop and mobile layout screenshots after polish.

### Bigger Future Direction
- [ ] Convert plain scripts into small modules if game logic grows further.
- [ ] Add sprite assets or generated pixel-art style images.
- [ ] Add level themes/background variations.
- [ ] Add saveable settings.
- [ ] Add a simple publish-ready build folder.

### Heavy Fighter + Expanded Map Plan
Narrative: The player is no longer a small shuttle pilot; they are flying a heavy frontier fighter through a larger hostile sector. The UI should keep the same instant-play arcade clarity while the ship itself communicates progression: every upgrade should leave a visible piece of hardware, glow, or weapon behavior on the craft.

- [x] Add tests for a world larger than the canvas and a camera that follows the player.
- [x] Add tests for an angular heavy-fighter hull instead of the old shuttle look.
- [x] Add tests proving upgrade selection mounts visible weapon modules and changes projectile visuals.
- [x] Watch the new tests fail against the current implementation.
- [x] Add a camera module with viewport/world separation.
- [x] Expand the world while keeping the canvas viewport stable.
- [x] Spawn enemies around the active camera/player zone so the larger map still has pressure.
- [x] Replace the shuttle drawing with an original DarkOrbit-inspired heavy fighter: angular wings, armored hull, engine glow, and energy core.
- [x] Render upgrade-specific modules: rapid laser emitters, split wing turrets, plasma cannon, engine boosters, magnet field, and repair armor nodes.
- [x] Update projectile visuals to reflect selected weapon upgrades.
- [x] Verify behavior tests, syntax checks, security scan, and screenshots.

### Heavy Fighter + Expanded Map Review
- Added `src/camera.js` and expanded the playable world to `1760x1040` while keeping the canvas viewport at `960x540`.
- Updated enemy spawning so hordes enter around the active player/camera zone instead of waiting at distant world edges.
- Added `src/ship-visual.js` with an original heavy-fighter design: armored angular wings, dark hull, engine flame, and teal energy core.
- Upgrade choices now leave visible equipment on the ship: plasma cannon, rapid emitters, split wing turrets, engine pods, magnet field, and repair nodes.
- Projectiles now change style after weapon upgrades; the plasma damage upgrade draws larger orange plasma shots.
- RED evidence: `node --test --test-concurrency=1 tests\game-feel.test.js` initially failed 3 tests for missing screen-space camera data, expanded world, and upgrade-mounted weapon visuals.
- GREEN evidence: `node --test --test-concurrency=1 tests\game-feel.test.js` passed 13/13 tests.
- Syntax evidence: `node --check` passed for `src\camera.js`, `src\ship-visual.js`, `src\game.js`, `src\draw.js`, `src\survival.js`, `src\test-hooks.js`, `tests\browser-driver.js`, and `tests\game-feel.test.js`.
- File size check: `src\game.js` 294 lines, `src\draw.js` 218, `src\survival.js` 213, `src\ship-visual.js` 135, `tests\game-feel.test.js` 236, `tests\browser-driver.js` 142.
- Security scan: `rg "innerHTML|eval\(|new Function|TODO|Not implemented" index.html styles.css src tests` returned no matches.
- Render evidence: `tasks/heavy-fighter-playing.png`.

### Themed Enemy Visual Plan
Narrative: Enemy units should read as hostile sector craft rather than arcade blocks: small raider drones hunt the player in packs, while bosses feel like heavier command ships. They should still remain readable at speed with warm hostile cores against the teal player ship.

- [x] Add a visual test proving visible enemies use themed hull/core pixels rather than old yellow block sprites.
- [x] Watch the new test fail against the current enemy rectangles.
- [x] Move enemy rendering into a dedicated visual module.
- [x] Replace horde enemies with layered raider drones: dark hull, angular wings, hostile orange core, and small thruster glow.
- [x] Replace boss rendering with a heavier command-ship silhouette and health bar that matches the new enemy style.
- [x] Verify behavior tests, syntax checks, security scan, file sizes, and screenshot evidence.

### Themed Enemy Visual Review
- Added `src/enemy-visual.js` and loaded it from `index.html`.
- Replaced simple rectangle enemies with layered raider drones: dark blue hull, angular side wings, hostile orange core, teal engine glints, and hit-flash state.
- Replaced boss drawing with a larger command-ship silhouette, matching dark armor, orange reactor core, thrusters, and themed health bar.
- Updated `src/draw.js` so enemy drawing delegates to the enemy visual module instead of keeping sprite details in the main renderer.
- RED evidence: `node --test --test-concurrency=1 tests\game-feel.test.js` failed 1 new test because old enemies did not contain enough themed dark hull pixels.
- GREEN evidence: `node --test --test-concurrency=1 tests\game-feel.test.js` passed 14/14 tests.
- Syntax evidence: `node --check` passed for all files in `src` plus `tests\browser-driver.js` and `tests\game-feel.test.js`.
- File size check: `src\draw.js` 194 lines, `src\enemy-visual.js` 72, `src\game.js` 294, `tests\game-feel.test.js` 272.
- Security scan: `rg "innerHTML|eval\(|new Function|TODO|Not implemented" index.html styles.css src tests` returned no matches.
- Render evidence: `tasks/themed-enemies.png`.

### Enemy Variety Pack Plan
Narrative: The hostile sector should feel tactical. The player is not just cutting through a generic crowd; each enemy role should create a different decision: dodge scouts, burn tanks, interrupt snipers, and respect bomber blast zones.

- [x] Add tests for mixed tactical enemy roles appearing in waves.
- [x] Add tests for sniper ships keeping distance and firing hostile shots.
- [x] Add tests for bomber ships exploding into a danger radius when destroyed.
- [x] Watch the new tests fail against the current single-behavior enemy system.
- [x] Add role-based enemy stats: scout, tank, sniper, bomber, and boss.
- [x] Update enemy movement: scouts chase fast, tanks press slowly, snipers orbit at range, bombers rush and explode.
- [x] Add enemy projectile state, drawing, collision, and player damage.
- [x] Add bomber blast effects and nearby-player damage.
- [x] Update enemy visuals so roles read differently on screen.
- [x] Verify behavior tests, syntax checks, security scan, file sizes, and screenshot evidence.

### Enemy Variety Pack Review
- Added `src/enemy-system.js` for role-specific enemy movement, sniper shots, enemy projectile updates, projectile collision, and bomber explosions.
- Updated `src/survival.js` with role-based enemy stats for `scout`, `tank`, `sniper`, `bomber`, and `boss`, plus deterministic wave role mixing.
- Updated `src/game.js` to track enemy bullets, use the enemy system, and spawn mixed tactical roles instead of a single horde type.
- Updated `src/enemy-visual.js` so scout, tank, sniper, and bomber enemies have distinct silhouettes while staying in the same hostile ship style.
- Split enemy-specific tests into `tests\enemy-variety.test.js` to keep test files small.
- RED evidence: `node --test --test-concurrency=1 tests\game-feel.test.js` failed 3 new tests because waves only had `horde`, snipers did not hold range/fire, and bombers did not explode.
- GREEN evidence: `node --test --test-concurrency=1 tests\game-feel.test.js tests\enemy-variety.test.js` passed 17/17 tests.
- Syntax evidence: `node --check` passed for touched source files and both test files.
- File size check: `src\game.js` 295 lines, `src\survival.js` 238, `src\enemy-system.js` 88, `src\enemy-visual.js` 122, `tests\game-feel.test.js` 236, `tests\enemy-variety.test.js` 121.
- Security scan: `rg "innerHTML|eval\(|new Function|TODO|Not implemented" index.html styles.css src tests` returned no matches.
- Render evidence: `tasks/enemy-variety.png`.

### Weapon Evolution System Plan
Narrative: Upgrade choices should feel like real ship engineering. When the player combines compatible upgrades, the ship should visibly mount evolved hardware and the weapon behavior should change immediately without copying another game directly.

- [x] Add tests for `damage + split` unlocking twin plasma shots.
- [x] Add tests for `damage + rapid` unlocking piercing laser shots.
- [x] Add tests for `engine + rapid` unlocking drone support shots.
- [x] Watch the new tests fail against the current single-profile projectile logic.
- [x] Add a small weapon evolution rule layer while keeping survival logic readable.
- [x] Update collision behavior so piercing shots can pass through an enemy without double-hitting the same target instantly.
- [x] Update projectile drawing for twin plasma, piercing laser, and drone laser styles.
- [x] Add visible evolved weapon modules to the heavy fighter.
- [x] Expose evolution state through test hooks.
- [x] Verify syntax, behavior tests, security scan, file sizes, and screenshot evidence.

### Weapon Evolution System Review
- Added `src\weapon-evolution.js` as the shared combo resolver for projectile behavior, ship modules, and test snapshots.
- Added `tests\weapon-evolution.test.js` covering `damage + split` twin plasma, `damage + rapid` piercing laser, and `engine + rapid` drone support.
- Updated `src\survival.js` so projectile profiles now come from the evolution resolver and can emit main shots plus drone-origin shots.
- Updated `src\game.js` so fired-shot accounting uses the actual bullet count and piercing bullets track hit enemy IDs before passing through.
- Updated `src\draw.js` with distinct twin plasma, piercing laser, and drone laser rendering.
- Updated `src\ship-visual.js` with visible synergy hardware: twin plasma rails, a piercing lens, and drone pods.
- Updated `src\test-hooks.js` with `weaponEvolution`, `weaponSynergies`, `twinPlasmaBullets`, `piercingBullets`, `droneBullets`, and `pierceRemaining`.
- RED evidence: `node --test --test-concurrency=1 tests\weapon-evolution.test.js` failed 3/3 before implementation because weapon evolution fields/styles were absent.
- GREEN evidence: `node --test --test-concurrency=1 tests\game-feel.test.js tests\enemy-variety.test.js tests\weapon-evolution.test.js` passed 20/20.
- Syntax evidence: `node --check` passed for every JavaScript file in `src` and `tests`.
- File size check: `src\game.js` 298 lines, `src\survival.js` 236, `src\draw.js` 239, `src\ship-visual.js` 170, `src\weapon-evolution.js` 94, `tests\weapon-evolution.test.js` 120.
- Security scan: `rg "innerHTML|eval\(|new Function|TODO|Not implemented" index.html styles.css src tests` returned no matches.
- Render evidence: `tasks/weapon-evolution.png`.

### Loot Item System Plan
Narrative: The sector should reward movement and risk. Enemy wrecks now leave salvage that tempts the player to dive through danger: shield capsules for survival, overdrive reactors for burst damage, and boss cores for rare progression.

- [x] Add tests proving tank enemies drop shield loot when destroyed.
- [x] Add tests proving collected shield loot absorbs the next player hit.
- [x] Add tests proving overdrive loot temporarily accelerates automatic fire.
- [x] Add tests proving bosses drop rare cores and collecting them increments the player's core count.
- [x] Watch the new tests fail before implementation.
- [x] Add a focused loot module for drop rules, collection effects, timers, and fire-rate modifier.
- [x] Add loot state to the game loop without bloating `src\game.js`.
- [x] Draw themed loot pickups and shield feedback in the canvas.
- [x] Expose loot state through test hooks.
- [x] Verify syntax, behavior tests, security scan, file sizes, and screenshot evidence.

### Loot Item System Review
- Added `src\loot-system.js` for deterministic drop rules, pickup movement, collection effects, shield absorption, overdrive timing, and core-based fire-rate scaling.
- Added `tests\loot-system.test.js` covering tank shield drops, shield hit absorption, overdrive fire acceleration, and boss core drops/collection.
- Updated `src\game.js` with `lootDrops` state, loot update/collection calls, loot drops on enemy destruction, shield absorption in player damage, and overdrive-aware cooldowns.
- Updated `src\draw.js` with themed salvage pickups: shield capsule, overdrive reactor, repair cross, and rare core.
- Updated `src\ship-visual.js` with visible shield field, overdrive engine flare, and collected core sockets.
- Updated `src\test-hooks.js` with `lootItems`, `lootTypes`, `shields`, `overdriveActive`, `overdriveTime`, and `lootCores`.
- RED evidence: `node --test --test-concurrency=1 tests\loot-system.test.js` failed 4/4 before implementation because loot state/effects were absent.
- GREEN evidence: `node --test --test-concurrency=1 tests\game-feel.test.js tests\enemy-variety.test.js tests\weapon-evolution.test.js tests\loot-system.test.js` passed 24/24 after implementation and the small file-size refactor.
- Syntax evidence: `node --check` passed for every JavaScript file in `src` and `tests`.
- File size check: `src\game.js` 298 lines, `src\draw.js` 297, `src\loot-system.js` 104, `src\ship-visual.js` 210, `tests\loot-system.test.js` 116.
- Security scan: `rg "innerHTML|eval\(|new Function|TODO|Not implemented" index.html styles.css src tests` returned no matches.
- Render evidence: `tasks/loot-system.png`.

### Core Synergy Pack Plan
Narrative: Rare cores should make the player's build feel authored instead of just stronger. The same core should express itself differently through each evolved weapon: plasma leaves heat, piercing laser jumps to another hull, and drone support adds a compact defense satellite shot.

- [x] Add tests proving core-charged twin plasma burns enemies after impact.
- [x] Add tests proving core-charged piercing laser arcs damage into a nearby enemy.
- [x] Add tests proving core-charged drone support emits extra core satellite shots.
- [x] Watch the new tests fail before production changes.
- [x] Extend weapon evolution profiles with core-specific fields.
- [x] Apply burn and chain effects without growing `src\game.js` past the file-size guardrail.
- [x] Draw burn marks, chain arcs, and core drone shots clearly in the canvas.
- [x] Expose core synergy state through test hooks.
- [ ] Verify syntax, behavior tests, security scan, file sizes, and screenshot evidence.

### Core Synergy Pack Review
- Added `tests\core-synergy.test.js` covering core-charged twin plasma burn, piercing laser chain arcs, and drone support satellite shots.
- Updated `src\weapon-evolution.js` so collected cores enrich evolved weapon profiles with burn, chain, and satellite-shot fields.
- Updated `src\survival.js` so bullets carry burn/chain metadata and core drone shots are emitted for drone support builds.
- Updated `src\loot-system.js` with core synergy behavior: burn ticking, chain targeting, chain arc lifetime, and timed burn damage.
- Updated `src\game.js` with `chainArcs` state plus focused calls into the loot system for core synergy updates and bullet hit effects.
- Added `src\pickup-visual.js` and moved pickup/core combat visuals there so `src\draw.js` stays below the file-size guardrail.
- Updated `src\test-hooks.js` with `coreDroneBullets`, `burningEnemies`, and `chainArcs`.
- RED evidence: `node --test --test-concurrency=1 tests\core-synergy.test.js` failed 3/3 before implementation because burn, chain, and core drone behavior were absent.
- GREEN evidence before final whitespace-only file-size cleanup: `node --test --test-concurrency=1 tests\game-feel.test.js tests\enemy-variety.test.js tests\weapon-evolution.test.js tests\loot-system.test.js tests\core-synergy.test.js` passed 27/27.
- Post-cleanup syntax evidence: `node --check` passed for every JavaScript file in `src` and `tests`.
- Post-cleanup file size check: `src\game.js` 299 lines, `src\draw.js` 243, `src\loot-system.js` 174, `src\pickup-visual.js` 105, `tests\core-synergy.test.js` 115.
- Post-cleanup security scan: `rg "innerHTML|eval\(|new Function|TODO|Not implemented" index.html styles.css src tests` returned no matches.
- Blocked evidence: final full browser rerun and screenshot capture require elevated headless Chromium execution, but the escalation was rejected by the app usage limit after the final whitespace-only cleanup.

### Elite Affix Pack Plan
Narrative: Later waves should stop feeling like only larger crowds. Some enemy wrecks should read as special threats before they die: armored hulls that take longer to burn down, overcharged hunters that pressure positioning, and core carriers that tempt risky dives for rare resources.

- [x] Add pure Node tests for deterministic elite affix selection after wave 4.
- [x] Add pure Node tests proving armored and overcharged affixes modify enemy stats.
- [x] Add pure Node tests proving core carrier elites drop core loot.
- [x] Watch the new tests fail before implementation.
- [x] Add a focused `EliteSystem` module with deterministic affix rules.
- [x] Apply elite affixes during horde spawning without growing `src\game.js` past the guardrail.
- [x] Add affix-specific visual rings/marks to enemy rendering.
- [x] Verify pure Node tests, syntax, security scan, and file sizes.

### Elite Affix Pack Review
- Added `tests\elite-system.test.js` using Node's `vm` module to verify elite rules without launching a browser.
- Added `src\elite-system.js` with deterministic affix selection after wave 4: `coreCarrier`, `armored`, and `overcharged`.
- Updated `src\game.js` so horde spawns can become elite while keeping the file under 300 lines.
- Updated `src\loot-system.js` so `coreCarrier` elites drop core loot.
- Updated `src\enemy-visual.js` with affix rings and marks for armored, overcharged, and core-carrier enemies.
- Updated `src\test-hooks.js` with `eliteEnemies` and `eliteAffixes`.
- RED evidence: `node --test --test-concurrency=1 tests\elite-system.test.js` failed 3/3 before implementation because `src\elite-system.js` was absent.
- GREEN evidence: `node --test --test-concurrency=1 tests\elite-system.test.js` passed 3/3.
- Syntax evidence: `node --check` passed for every JavaScript file in `src` and `tests`.
- File size check: `src\game.js` 298 lines, `src\elite-system.js` 30, `src\enemy-visual.js` 160, `tests\elite-system.test.js` 58.
- Security scan: `rg "innerHTML|eval\(|new Function|TODO|Not implemented" index.html styles.css src tests` returned no matches.
- Browser regression note: this package was verified with pure Node tests because elevated headless Chromium execution was previously blocked by the app usage limit.

### Hangar + Radar + Boss 2.0 Plan
Narrative: The game now has strong moment-to-moment build decisions. The next layer should make the whole run loop feel bigger: the hangar turns collected cores into persistent ship tuning, the radar makes the expanded sector readable, and bosses become pattern fights instead of only heavy targets.

- [x] Add pure Node tests for hangar core saving, spending, and player bonus application.
- [x] Add pure Node tests for radar point projection and clamping.
- [x] Add pure Node tests for boss phase scaling and radial volley creation.
- [x] Watch all new tests fail before implementation.
- [x] Add `HangarSystem` for persistent cores and conservative permanent upgrades.
- [x] Add a compact hangar UI panel using safe `textContent` updates.
- [x] Add `RadarSystem` plus a canvas radar overlay for enemies, loot, elites, bosses, and the player.
- [x] Add `BossSystem` with phase-based radial volleys.
- [x] Wire the three systems into the game loop while keeping files below the guardrail.
- [x] Verify pure Node tests, syntax, security scan, and file sizes.

### Hangar + Radar + Boss 2.0 Review
- Added `src\hangar-system.js` and `src\hangar-ui.js` so collected core loot can be saved in local storage and spent on permanent shield, reactor, magnet, and scavenger upgrades.
- Added a compact hangar panel to `index.html` and `styles.css`, using safe button/text updates instead of HTML injection.
- Updated `src\game.js` so hangar bonuses apply at run start and core pickups add persistent hangar currency.
- Added `src\radar-system.js` and `src\radar-visual.js` for a canvas mini map showing player, enemies, elites, bosses, and loot.
- Added `src\boss-system.js` so bosses now use health-based phases and radial bullet volleys.
- Added `tests\hangar-system.test.js`, `tests\radar-system.test.js`, and `tests\boss-system.test.js`.
- RED evidence: the new tests initially failed 7/7 because `src\hangar-system.js`, `src\radar-system.js`, and `src\boss-system.js` were absent.
- GREEN evidence: `node --test --test-concurrency=1 tests\hangar-system.test.js tests\radar-system.test.js tests\boss-system.test.js` passed 7/7.
- Broader pure Node evidence: `node --test --test-concurrency=1 tests\hangar-system.test.js tests\radar-system.test.js tests\boss-system.test.js tests\elite-system.test.js` passed 10/10.
- Syntax evidence: `node --check` passed for every JavaScript file in `src` and `tests`.
- File size check: `src\game.js` 297 lines, `src\draw.js` 244, `src\hangar-system.js` 71, `src\hangar-ui.js` 22, `src\radar-system.js` 24, `src\radar-visual.js` 37, `src\boss-system.js` 45.
- Security scan: `rg "innerHTML|eval\(|new Function|TODO|Not implemented" index.html styles.css src tests` returned no matches.
- Browser regression note: browser tests/screenshots were not rerun in this package because elevated headless Chromium execution was previously blocked by the app usage limit.

### Sound + Combat Juice Plan
Narrative: The sector should feel alive without slowing the run down. Shots should have crisp generated audio, rare events should punch through the chaos, and pickups/boss attacks should leave short readable rings on the battlefield.

- [x] Add pure Node tests for audio settings, mute persistence, and generated event playback.
- [x] Add pure Node tests for combat ping creation, aging, and boss volley warning signals.
- [x] Watch the new tests fail before production changes.
- [x] Add a dependency-free Web Audio system with lazy unlock, mute, volume, and event presets.
- [x] Add a compact audio UI toggle using safe text updates.
- [x] Add combat feedback pings for loot, XP, elite spawns, level-up, player hits, and boss volleys.
- [x] Draw combat pings in the canvas without cluttering the expanded map.
- [x] Wire audio and pings into gameplay while keeping files below the guardrail.
- [x] Verify pure Node tests, syntax, security scan, and file sizes.

### Sound + Combat Juice Review
- Added `src\audio-system.js` for generated Web Audio effects, lazy unlock, mute persistence, volume clamping, and event rate limiting.
- Added `src\audio-ui.js` plus a compact topbar sound button and volume slider using safe text/attribute updates.
- Added `src\combat-juice.js`, `src\juice-visual.js`, and `src\game-feedback.js` for short battlefield pings and centralized audio/visual event feedback.
- Updated boss volleys, loot pickup collection, XP pickup, elite spawns, level-up, shield absorb, player hits, enemy hits, and game over to trigger feedback.
- RED evidence: `node --test --test-concurrency=1 tests\audio-system.test.js tests\combat-juice.test.js` initially failed 6/6 because the new audio and combat feedback modules did not exist.
- GREEN evidence: `node --test --test-concurrency=1 tests\audio-system.test.js tests\combat-juice.test.js` passed 6/6.
- Broader pure Node evidence: `node --test --test-concurrency=1 tests\hangar-system.test.js tests\radar-system.test.js tests\boss-system.test.js tests\elite-system.test.js tests\audio-system.test.js tests\combat-juice.test.js` passed 16/16.
- Syntax evidence: `node --check` passed for every JavaScript file in `src` and `tests`.
- File size check: `src\game.js` 293 lines, `src\draw.js` 229, `src\audio-system.js` 137, `src\combat-juice.js` 83, `src\game-feedback.js` 41, `src\juice-visual.js` 29, `src\audio-ui.js` 26.
- Security scan: `rg "innerHTML|eval\(|new Function|TODO|Not implemented" index.html styles.css src tests` returned no matches.
- Browser regression note: the in-app browser tool was not available from tool discovery in this turn, so this package was verified with pure Node tests, syntax checks, and security scans.

### Boss Mechanics 2.1 + Run Summary Plan
Narrative: Boss fights should become pattern recognition moments rather than only high-health enemies, and a completed run should leave the player with a readable combat report that makes the next run tempting.

- [x] Add pure Node tests for boss aimed bursts and hazard mine rings.
- [x] Add pure Node tests for run stat tracking and summary line generation.
- [x] Add pure Node tests for safe run-summary UI syncing.
- [x] Watch the new tests fail before production changes.
- [x] Extend `BossSystem` with deterministic phase-based pattern rotation.
- [x] Track run duration, kills, elites, bosses, cores, and best weapon evolution without bloating `src\game.js`.
- [x] Add a compact run-summary panel that appears only on game over.
- [x] Wire boss pattern feedback and summary updates into gameplay.
- [x] Verify pure Node tests, syntax, security scan, and file sizes.

### Boss Mechanics 2.1 + Run Summary Review
- Updated `src\boss-system.js` so bosses rotate deterministic phase-based patterns: radial volleys, phase-2 aimed bursts, and phase-3 slow hazard mine rings.
- Updated enemy bullet rendering in `src\draw.js` so boss mines read as larger warning hazards instead of ordinary bullets.
- Added `src\run-summary.js` to track run seconds, kills, bosses, elites, cores, peak wave/level, and best weapon evolution.
- Added `src\run-summary-ui.js` plus a compact `index.html`/`styles.css` summary panel that appears on game over and uses safe text updates.
- Wired run stat updates, kill/core recording, and end-of-run summary creation into `src\game.js` while keeping it under the guardrail.
- RED evidence: `node --test --test-concurrency=1 tests\boss-system.test.js tests\run-summary.test.js tests\run-summary-ui.test.js` initially failed 6/9 because boss pattern fields and summary modules were missing.
- GREEN evidence: `node --test --test-concurrency=1 tests\boss-system.test.js tests\run-summary.test.js tests\run-summary-ui.test.js` passed 9/9.
- Broader pure Node evidence: `node --test --test-concurrency=1 tests\hangar-system.test.js tests\radar-system.test.js tests\boss-system.test.js tests\elite-system.test.js tests\audio-system.test.js tests\combat-juice.test.js tests\run-summary.test.js tests\run-summary-ui.test.js` passed 22/22.
- Syntax evidence: `node --check` passed for every JavaScript file in `src` and `tests`.
- File size check: `src\game.js` 299 lines, `src\boss-system.js` 105, `src\draw.js` 248, `src\run-summary.js` 77, `src\run-summary-ui.js` 21.
- Security scan: `rg "innerHTML|eval\(|new Function|TODO|Not implemented" index.html styles.css src tests` returned no matches.
- Browser regression note: browser screenshots were not rerun in this package because the in-app browser tool was not available earlier in this session and prior headless Chromium runs had hit the app usage limit.

### Sector Events + Mini Mission Plan
Narrative: The sector should occasionally push the player into a different tactical rhythm. Short hazards and salvage windows create texture between boss moments, while mini missions give each run a readable side objective without adding menu friction.

- [x] Add pure Node tests for deterministic sector event scheduling and meteor/salvage effects.
- [x] Add pure Node tests for mission creation, progress, completion rewards, and expiry.
- [x] Add pure Node tests for safe sector/mission UI syncing.
- [x] Watch the new tests fail before production changes.
- [x] Add `SectorEvents` with timed meteor showers and salvage cache events.
- [x] Add `MissionSystem` with compact kill/collect/survive objectives.
- [x] Add a small mission/event HUD strip using safe text updates.
- [x] Wire event updates, mission progress, and rewards into gameplay without growing `src\game.js` past the guardrail.
- [x] Verify pure Node tests, syntax, security scan, and file sizes.

### Sector Events + Mini Mission Review
- Added `src\sector-events.js` with deterministic timed sector events: meteor showers spawn meteor hazards, and salvage cache events drop shield/overdrive/repair loot near the player.
- Added `src\mission-system.js` with rotating hunt, collect, and survive objectives plus small run rewards.
- Added `src\sector-ui.js`, `index.html`, and `styles.css` updates for a compact event/mission HUD strip using safe `textContent` updates.
- Added `src\game-motion.js` and moved player/bullet/XP movement updates there so `src\game.js` stayed below the guardrail while wiring events and missions into gameplay.
- Updated `src\draw.js` so meteor hazards have a distinct falling rock/trail visual.
- Updated `src\test-hooks.js` with sector event, mission progress, completed missions, and meteor counts for future browser checks.
- RED evidence: `node --test --test-concurrency=1 tests\sector-events.test.js tests\mission-system.test.js tests\sector-ui.test.js` initially failed 8/8 because the new sector, mission, and UI modules did not exist.
- GREEN evidence: `node --test --test-concurrency=1 tests\sector-events.test.js tests\mission-system.test.js tests\sector-ui.test.js` passed 8/8.
- Broader pure Node evidence: `node --test --test-concurrency=1 tests\hangar-system.test.js tests\radar-system.test.js tests\boss-system.test.js tests\elite-system.test.js tests\audio-system.test.js tests\combat-juice.test.js tests\run-summary.test.js tests\run-summary-ui.test.js tests\sector-events.test.js tests\mission-system.test.js tests\sector-ui.test.js` passed 30/30.
- Syntax evidence: `node --check` passed for every JavaScript file in `src` and `tests`.
- File size check: `src\game.js` 287 lines, `src\draw.js` 273, `src\sector-events.js` 83, `src\mission-system.js` 68, `src\game-motion.js` 32, `src\sector-ui.js` 16.
- Security scan: `rg "innerHTML|eval\(|new Function|TODO|Not implemented" index.html styles.css src tests` returned no matches.
- Browser regression note: browser screenshots were not rerun because the in-app browser tool has not been available in this session and prior headless Chromium runs hit the app usage limit.

### Spawn Director + Difficulty Curve Plan
Narrative: Enemy pressure should feel authored, not random. Early runs should teach the player with scouts and tanks, mid waves should introduce ranged pressure, and late waves should compress decision time with larger mixed packs while still respecting enemy caps.

- [x] Add pure Node tests for difficulty scaling: intensity, spawn interval, pack size, cap, and wave duration.
- [x] Add pure Node tests for deterministic enemy role decks across early, mid, and late waves.
- [x] Add pure Node tests for spawn plan updates that respect caps and trigger boss waves.
- [x] Add pure Node tests for threat level display in the existing sector HUD.
- [x] Watch the new tests fail before production changes.
- [x] Add `SpawnDirector` as the single source of enemy pressure pacing.
- [x] Wire director output into `src\game.js` and replace ad hoc threat timing.
- [x] Add a compact threat display to the sector HUD using safe text updates.
- [x] Verify pure Node tests, syntax, security scan, and file sizes.

### Spawn Director + Difficulty Curve Review
- Added `src\spawn-director.js` as the pressure pacing layer: intensity, spawn interval, pack size, enemy cap, wave duration, threat label, and deterministic role decks.
- Replaced ad hoc spawn timing in `src\game.js` with director output while keeping boss waves on every third wave.
- Updated spawn role selection so early waves lean scout/tank, mid waves introduce sniper/bomber pressure, and late waves use denser mixed decks.
- Added a compact `Tehdit` value to the existing sector HUD and updated `src\sector-ui.js` with safe `textContent` syncing.
- Updated `src\test-hooks.js` with threat label, enemy cap, and spawn interval for future browser checks.
- RED evidence: `node --test --test-concurrency=1 tests\spawn-director.test.js tests\sector-ui.test.js` initially failed 6/6 because `src\spawn-director.js` was absent and the HUD did not write threat state.
- GREEN evidence: `node --test --test-concurrency=1 tests\spawn-director.test.js tests\sector-ui.test.js` passed 6/6.
- Broader pure Node evidence: `node --test --test-concurrency=1 tests\hangar-system.test.js tests\radar-system.test.js tests\boss-system.test.js tests\elite-system.test.js tests\audio-system.test.js tests\combat-juice.test.js tests\run-summary.test.js tests\run-summary-ui.test.js tests\sector-events.test.js tests\mission-system.test.js tests\sector-ui.test.js tests\spawn-director.test.js` passed 34/34.
- Syntax evidence: `node --check` passed for every JavaScript file in `src` and `tests`.
- File size check: `src\game.js` 280 lines, `src\spawn-director.js` 70, `src\sector-ui.js` 18, `src\test-hooks.js` 80.
- Security scan: `rg "innerHTML|eval\(|new Function|TODO|Not implemented" index.html styles.css src tests` returned no matches.
- Browser regression note: browser screenshots were not rerun because the in-app browser tool has not been available in this session and prior headless Chromium runs hit the app usage limit.

### Map Landmarks + Environmental Zones Plan
Narrative: The expanded sector should have places, not just coordinates. Landmarks create memorable navigation anchors: asteroid fields are dangerous shortcuts, while relay ruins and salvage beacons tempt the player to hold ground for rewards.

- [x] Add pure Node tests for deterministic landmark placement and active-zone detection.
- [x] Add pure Node tests for asteroid hazard damage events with cooldown.
- [x] Add pure Node tests for relay/salvage reward charge and cooldown.
- [x] Add pure Node tests for safe landmark display in the sector HUD.
- [x] Watch the new tests fail before production changes.
- [x] Add `LandmarkSystem` for map landmarks, active zone state, hazard events, and reward events.
- [x] Add `LandmarkVisual` so zones and landmark silhouettes are readable in the canvas.
- [x] Wire landmark updates and reward/damage events into gameplay while keeping `src\game.js` below the guardrail.
- [x] Add a compact `Bolge` display to the existing sector HUD using safe text updates.
- [x] Verify pure Node tests, syntax, security scan, and file sizes.

### Map Landmarks + Environmental Zones Review
- Added `src\landmark-system.js` with deterministic world landmarks: `asteroidField`, `relayRuin`, and `salvageBeacon`.
- Landmark zones now track the active region, asteroid hazard damage cooldowns, reward charging, and reward cooldowns.
- Added `src\landmark-visual.js` so hazard/reward zones and their landmark silhouettes render on the world map.
- Wired landmark events into `src\game.js`: asteroid fields can damage the player, while reward zones grant XP and spawn loot after a short hold.
- Added `Bolge` to the sector HUD and updated `src\sector-ui.js` with safe `textContent` syncing.
- Updated `src\test-hooks.js` with landmark zone, landmark count, and reward charge for future browser checks.
- RED evidence: `node --test --test-concurrency=1 tests\landmark-system.test.js tests\sector-ui.test.js` initially failed 7/7 because `src\landmark-system.js` was absent and the HUD did not write landmark state.
- GREEN evidence: `node --test --test-concurrency=1 tests\landmark-system.test.js tests\sector-ui.test.js` passed 7/7.
- Broader pure Node evidence: `node --test --test-concurrency=1 tests\hangar-system.test.js tests\radar-system.test.js tests\boss-system.test.js tests\elite-system.test.js tests\audio-system.test.js tests\combat-juice.test.js tests\run-summary.test.js tests\run-summary-ui.test.js tests\sector-events.test.js tests\mission-system.test.js tests\sector-ui.test.js tests\spawn-director.test.js tests\landmark-system.test.js` passed 39/39.
- Syntax evidence: `node --check` passed for every JavaScript file in `src` and `tests`.
- File size check: `src\game.js` 293 lines, `src\draw.js` 274, `src\landmark-system.js` 90, `src\landmark-visual.js` 53, `src\sector-ui.js` 20.
- Security scan: `rg "innerHTML|eval\(|new Function|TODO|Not implemented" index.html styles.css src tests` returned no matches.
- Browser regression note: browser screenshots were not rerun because the in-app browser tool has not been available in this session and prior headless Chromium runs hit the app usage limit.

### Changed Files Inspection Plan
- [x] Inspect git status and diff to identify user/game changes.
- [x] Read changed gameplay/UI files with attention to regressions, missing script links, and unsafe DOM updates.
- [x] Run fresh syntax, security, file-size, and available regression tests.
- [x] Document findings and evidence in this section.

Review:
- Finding: Game-over run summary is opened but covered by the new dashboard. Browser CSS check after `endGame()` returned `dashboardHidden=false`, `summaryHidden=false`, dashboard z-index `10`, summary z-index `3`, and the top element over the summary area was `.db-card ship-sec`.
- Finding: Dreadnought description uses `class="ship-yavaş"` while the stylesheet defines `.ship-specs`, so that copy misses the intended ship description styling.
- Verification: `node --check` passed for all `src` and `tests` JavaScript files.
- Verification: `rg "innerHTML|eval\(|new Function|TODO|FIXME|Not implemented|throw new Error" index.html src tests styles.css` only matched expected test-driver thrown errors.
- Verification: 39 pure Node tests passed. Targeted browser tests for Dreadnought selection, Hangar return, and trail color passed.
- File size note: `src/game.js` is 351 lines, `src/ship-visual.js` is 310 lines, `styles.css` is 759 lines.

### Dashboard Summary Fix Plan
- [x] Add a focused browser regression that proves the game-over summary sits above the dashboard.
- [x] Fix the game-over/dashboard layering with the smallest CSS change.
- [x] Fix the Dreadnought ship description class so it uses the existing `.ship-specs` styling.
- [x] Run syntax, security, pure Node, and targeted browser verification.
- [x] Record the verification evidence here.

Results:
- Added browser regression `game over summary stays above the dashboard lobby`; it failed before the fix with `summaryOnTop` as `false`.
- Raised `.run-summary-panel` above the dashboard by changing its z-index from `3` to `12`.
- Replaced the Dreadnought description class `ship-yavaş` with the existing `ship-specs` class.
- Verification: `node --check` passed for all `src` and `tests` JavaScript files.
- Verification: `rg "innerHTML|eval\(|new Function|TODO|FIXME|Not implemented|ship-yavaş" index.html src tests styles.css` returned no matches.
- Verification: 39 pure Node tests passed.
- Verification: 4 targeted browser tests passed for Dreadnought selection, Hangar return, game-over summary layering, and trail color selection.

### Upgrade Codex Plan
- [x] Add a focused upgrade metadata test for rarity, category, effect text, and synergy preview.
- [x] Add a browser regression for level-up cards showing rarity/category/synergy instead of plain multiline text.
- [x] Implement a small `UpgradeCodex` module and wire Survival/UI to it.
- [x] Style the level-up cards with stable compact rows that fit desktop and mobile.
- [x] Run syntax, security, pure Node, and targeted browser verification.
- [x] Record results here.

Results:
- Added `src/upgrade-codex.js` as the shared source for upgrade rarity, category, effect text, and synergy preview.
- Level-up cards now render structured rows with rarity, category, title, body, effect, and synergy text using safe DOM APIs.
- `SurvivalRules.createUpgradeChoices` now uses `UpgradeCodex`, and `game.js` passes the current player so synergy previews can react to owned upgrades.
- Verification: the new codex unit test failed before implementation because `src/upgrade-codex.js` did not exist.
- Verification: the new browser UI test failed before implementation because `.upgrade-category` did not exist on the card.
- Verification: `node --check` passed for all `src` and `tests` JavaScript files.
- Verification: `rg "innerHTML|eval\(|new Function|TODO|FIXME|Not implemented|ship-yavaş" index.html src tests styles.css` returned no matches.
- Verification: 40 pure Node tests passed.
- Verification: 5 targeted browser tests passed for XP level-up, enriched card UI, upgrade selection, visible weapon modules, and game-over summary layering.

### Ship Stats Panel Plan
- [x] Add a focused stat-system unit test for damage, fire rate, speed, magnet, shield, weapon, and synergy rows.
- [x] Add a browser regression proving dashboard stats and runtime stats are visible in the right phases.
- [x] Implement a shared `StatSystem` module so UI text and tests use the same stat formatting.
- [x] Add a dashboard "Gemi Statları" card and a compact in-run stat overlay.
- [x] Run syntax, security, pure Node, and targeted browser verification.
- [x] Record results here.

Results:
- Added `src/stat-system.js` to format damage, fire rate, projectile count, speed, magnet range, shields, weapon, and synergy rows.
- Added dashboard stat card `#dashboardStatsList` and in-run compact panel `#runtimeStatsPanel`.
- Stat panels use safe DOM rendering with `textContent` and `replaceChildren`; no HTML string injection.
- Verification: the new stat-system unit test failed before implementation because `src/stat-system.js` did not exist.
- Verification: the new browser test failed before implementation because dashboard stat values were empty.
- Verification: `node --check` passed for all `src` and `tests` JavaScript files.
- Verification: `rg "innerHTML|eval\(|new Function|TODO|FIXME|Not implemented|ship-yavaş" index.html src tests styles.css` returned no matches.
- Verification: 41 pure Node tests passed.
- Verification: 7 targeted browser tests passed for level-up, enriched card UI, upgrade selection, weapon modules, Dreadnought launch, stat panels, and game-over summary layering.

### Boss Relic Plan
- [x] Add a focused relic-system unit test for relic choices and stat application.
- [x] Add a browser regression proving boss death opens a three-choice relic reward and selection resumes play.
- [x] Implement a shared `RelicSystem` module with boss-tier reward metadata and application effects.
- [x] Add a `relicChoice` phase to game, UI, keyboard controls, and test hooks.
- [x] Style relic cards distinctly while reusing the existing upgrade choice panel.
- [x] Run syntax, security, pure Node, and targeted browser verification.
- [x] Record results here.

Results:
- Added `src/relic-system.js` with boss-tier relic metadata and effects for shield, damage, magnet/core, and phase injector rewards.
- Boss death now opens `relicChoice`, shows three relic cards in the existing choice panel, and resumes play after selection.
- Keyboard digits 1-3 now work for both level-up choices and boss relic choices.
- Test hooks now expose `relicChoices` and `relicCount` for browser regression checks.
- Verification: the relic unit test failed before implementation because `src/relic-system.js` did not exist.
- Verification: the boss browser test failed before implementation because boss death stayed in `playing` instead of `relicChoice`.
- Verification: `node --check` passed for all `src` and `tests` JavaScript files.
- Verification: `rg "innerHTML|eval\(|new Function|TODO|FIXME|Not implemented|ship-yavaş" index.html src tests styles.css` returned no matches.
- Verification: 42 pure Node tests passed.
- Verification: 8 targeted browser tests passed for level-up, enriched card UI, upgrade selection, weapon modules, boss relic reward, Dreadnought launch, stat panels, and game-over summary layering.

### Runtime Stats Toggle Plan
- [x] Capture the UX correction in `tasks/lessons.md`.
- [x] Add a browser regression proving runtime stats start collapsed and can be opened/closed.
- [x] Add a compact runtime stats toggle button without changing dashboard stats.
- [x] Keep stat rendering safe with `textContent` and avoid rendering the hidden panel every frame.
- [x] Run syntax, security, pure Node, and targeted browser verification.
- [x] Record results here.

Results:
- Added `#runtimeStatsToggle` as a compact in-run `STAT +` / `STAT -` button.
- Runtime stats now start collapsed during gameplay and can be opened/closed without changing dashboard stats.
- Updated browser regression so it verifies closed, open, and closed-again states.
- Updated `tasks/lessons.md` with the rule that in-run secondary panels should default to compact/collapsed UI.
- Verification: the updated browser test failed before implementation because `#runtimeStatsToggle` did not exist.
- Verification: `node --check` passed for all `src` and `tests` JavaScript files.
- Verification: `rg "innerHTML|eval\(|new Function|TODO|FIXME|Not implemented|ship-yavaş" index.html src tests styles.css` returned no matches.
- Verification: 42 pure Node tests passed.
- Verification: 4 targeted browser tests passed for stat toggle, boss relic reward, Dreadnought launch, and game-over summary layering.

### Relic Visual Attachment Plan
- [x] Add a stat-system regression proving equipped relic names appear as a stat row.
- [x] Add a browser regression proving a selected boss relic appears in runtime stats and leaves visible relic pixels on the ship.
- [x] Implement a small `RelicVisual` module and call it from ship drawing without growing `ship-visual.js` further.
- [x] Add a small boss reward burst when relic choices open.
- [x] Run syntax, security, pure Node, and targeted browser verification.
- [x] Record results here.

Results:
- Added `src/relic-visual.js` so equipped boss relics add visible hardware to the player ship: gold armor plates, nova core glow, siphon ring, and phase injector pods.
- The ship renderer now calls `RelicVisual.drawRelics()` after normal upgrade modules, keeping relic artwork separate from the already-large ship visual file.
- Runtime and dashboard stat rows now include equipped relic names plus a `Boss Relic xN` detail line.
- Boss kills now emit a short gold reward burst before opening relic choices.
- Verification: the stat-system regression failed before implementation because the `relics` stat row did not exist.
- Verification: the boss browser regression failed before implementation because the selected relic was not visible in runtime stats.
- Verification: `node --check` passed for all `src` and `tests` JavaScript files.
- Verification: `rg "innerHTML|eval\(|new Function|TODO|FIXME|Not implemented|ship-yavaÅŸ" index.html src tests styles.css` returned no matches.
- Verification: 42 pure Node tests passed.
- Verification: 4 targeted browser tests passed for boss relic reward/readout/ship pixels, stat toggle, visible weapon modules, and game-over summary layering.

### Relic Build Evolution Plan
- [x] Add pure Node tests for relic+upgrade build rules: Nova Lance, Void Field, and Phase Burst.
- [x] Add browser regressions proving the new builds affect bullets, enemy damage, and exposed runtime state.
- [x] Watch the new tests fail before production changes.
- [x] Implement a small `RelicSynergy` module instead of growing weapon or relic files.
- [x] Wire Nova Lance and Phase Burst into weapon profiles and projectile drawing.
- [x] Wire Void Field into combat updates with a readable canvas effect.
- [x] Expose active relic build names in stats/test hooks.
- [x] Run syntax, security, and pure Node verification.
- [ ] Run targeted browser verification when headless Chromium usage is available.
- [x] Record results here.

Results:
- Added `src/relic-synergy.js` with three relic+upgrade build evolutions: `Nova Lance`, `Void Field`, and `Phase Burst`.
- `Nova Cekirdegi + Hasar` now evolves the projectile profile into `novaLance`, adds area impact damage, and draws a brighter lance core.
- `Bosluk Sifonu + Cekim` now pulses a damaging field around the ship and draws a visible field ring.
- `Faz Enjektoru + Rapid` now evolves shots into fast piercing `phaseShot` projectiles with a separate projectile visual module.
- Active relic synergies now appear in stat synergy text and test snapshots.
- RED evidence: `tests/relic-synergy.test.js` first failed because `src/relic-synergy.js` did not exist.
- RED evidence: `tests/relic-builds.test.js` failed because `novaCore+damage` still produced `plasma`, `phaseInjector+rapid` still produced `laser`, and `voidField` was absent from runtime state.
- Verification: `node --check` passed for all `src` and `tests` JavaScript files.
- Verification: `rg "innerHTML|eval\(|new Function|TODO|FIXME|Not implemented|ship-yava" index.html src tests styles.css` returned no matches.
- Verification: 45 pure Node tests passed.
- Verification gap: targeted browser verification could not be rerun after implementation because the headless Chromium escalation was rejected by the app usage limit. The browser regression file remains in `tests/relic-builds.test.js` for the next available run.
