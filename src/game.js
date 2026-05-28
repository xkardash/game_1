(() => {
  const canvas = document.querySelector("#gameCanvas");
  const context = canvas.getContext("2d");
  const cameraTools = window.ShooterCamera;
  const enemySystem = window.EnemySystem;
  const effects = window.ShooterEffects;
  const audio = window.AudioSystem.createAudioSystem();
  const feedback = window.GameFeedback.createGameFeedback(audio, window.CombatJuice);
  const lootSystem = window.LootSystem;
  const rules = window.SurvivalRules;
  const ui = window.ShooterUi.createGameUi();
  const audioUi = window.AudioUi.createAudioUi(audio);
  const summaryUi = window.RunSummaryUi.createRunSummaryUi();
  const sectorUi = window.SectorUi.createSectorUi();
  const hangar = window.HangarSystem.load();
  const hangarUi = window.HangarUi.createHangarUi();
  const viewport = { width: canvas.width, height: canvas.height };
  const world = { width: 1760, height: 1040 };
  const pressedKeys = new Set();
  const touchInput = { left: false, right: false, up: false, down: false };
  const state = createInitialState();

  function createInitialState(highScore = 0) {
    const player = rules.createPlayer(world);
    window.HangarSystem.applyBonuses(player, hangar);
    const camera = cameraTools.createCamera(viewport, world);
    cameraTools.updateCamera(camera, player, world, viewport);
    return {
      phase: "ready",
      countdown: 0,
      score: 0,
      highScore,
      wave: 1,
      level: 1,
      xp: 0,
      xpNeeded: 5,
      hangar,
      player,
      camera,
      bullets: [],
      enemyBullets: [],
      enemies: [],
      lootDrops: [],
      chainArcs: [],
      xpGems: [],
      sector: window.SectorEvents.createSectorState(),
      mission: window.MissionSystem.createMissionState(),
      spawnDirector: window.SpawnDirector.createSpawnDirector(),
      landmarkState: window.LandmarkSystem.createLandmarkState(world),
      particles: [],
      combatPings: [],
      muzzleFlashes: [],
      impactFlashes: [],
      stars: effects.createStars(140, world),
      spaceObjects: effects.createSpaceObjects(world),
      shake: 0,
      enemySpawnIndex: 0,
      shotsFired: 0,
      runStats: window.RunSummary.createRunStats(),
      upgradeChoices: [],
      lastFrameTime: 0,
    };
  }

  function resetRound() {
    Object.assign(state, createInitialState(state.highScore));
    spawnHorde(8);
  }

  function startGame() { audio.unlock(); resetRound(); beginCountdown(); }
  function startPlaying() { resetRound(); state.phase = "playing"; syncInterface(); }
  function beginCountdown() { state.phase = "countdown"; state.countdown = 1.8; syncInterface(); }
  function loop(timestamp) {
    const delta = Math.min((timestamp - state.lastFrameTime) / 1000 || 0, 0.033);
    state.lastFrameTime = timestamp;
    update(delta);
    window.ShooterDraw.drawGame(context, state, world, viewport);
    requestAnimationFrame(loop);
  }
  function update(delta) {
    effects.updateStars(state.stars, world, delta);
    effects.updateTimedEffects(state, delta);
    window.CombatJuice.updatePings(state, delta);
    window.RunSummary.updateRunStats(state.runStats, state, delta);
    if (state.phase === "countdown") updateCountdown(delta);
    updateCamera();
    if (state.phase !== "playing") return;
    updateThreat(delta);
    window.GameMotion.updatePlayer(state, delta, pressedKeys, touchInput, world, rules, lootSystem);
    updateCamera();
    updateAutoFire(delta);
    window.GameMotion.updateBullets(state, delta, world);
    enemySystem.updateEnemyBullets(state, delta, world);
    enemySystem.updateEnemies(state, delta, damagePlayer);
    window.BossSystem.updateBosses(state, delta, (event) => feedback.bossVolley(state, event));
    window.SectorEvents.updateSectorEvents(state, delta);
    updateLandmarks(delta);
    window.MissionSystem.updateMission(state.mission, state, delta, applyMissionReward);
    lootSystem.updateCoreSynergies(state, effects, delta, destroyEnemy);
    window.GameMotion.updateXpGems(state, delta, rules);
    lootSystem.updateLootDrops(state, delta);
    checkCollisions();
    syncInterface();
  }
  function updateCamera() { cameraTools.updateCamera(state.camera, state.player, world, viewport); }
  function updateCountdown(delta) {
    state.countdown -= delta;
    if (state.countdown <= 0) {
      state.countdown = 0;
      state.phase = "playing";
    }
    syncInterface();
  }
  function updateThreat(delta) {
    const plan = window.SpawnDirector.updateDirector(state.spawnDirector, state, delta);
    if (plan.spawnCount > 0) spawnHorde(plan.spawnCount, plan.difficulty);
    if (!plan.advanceWave) return;
    state.wave = plan.nextWave;
    if (plan.spawnBoss) spawnBoss();
  }

  function updateLandmarks(delta) {
    for (const event of window.LandmarkSystem.updateLandmarks(state, delta)) {
      if (event.type === "hazardDamage") damagePlayer();
      if (event.type === "zoneReward") grantLandmarkReward(event);
    }
  }
  function updateAutoFire() {
    if (state.player.cooldown > 0 || state.enemies.length === 0) return;
    const target = rules.getNearestEnemy(state.player, state.enemies);
    if (!target) return;
    fireAtTarget(target);
  }
  function fireAtTarget(target) {
    const player = state.player;
    const bullets = rules.createBullets(player, target);
    state.bullets.push(...bullets);
    state.shotsFired += bullets.length;
    effects.addMuzzleFlash(state, player.x, player.y - 30);
    feedback.shoot();
    player.cooldown = lootSystem.getFireCooldown(player);
  }
  function checkCollisions() {
    for (const bullet of [...state.bullets]) {
      const enemy = state.enemies.find((target) => !bullet.hitEnemyIds?.includes(target.id) && rules.overlaps(bullet, target));
      if (enemy) hitEnemy(bullet, enemy);
    }
    for (const enemy of state.enemies) {
      if (rules.overlaps(enemy, rules.getBounds(state.player))) damagePlayer();
    }
    enemySystem.checkEnemyBulletHits(state, damagePlayer);
    for (const gem of [...state.xpGems]) {
      if (rules.getDistance(state.player, gem) < 24) collectXpGem(gem);
    }
    lootSystem.collectLootDrops(state, grantXp, grantHangarCore, handleLootCollect);
  }

  function hitEnemy(bullet, enemy) {
    bullet.hitEnemyIds = [...(bullet.hitEnemyIds || []), enemy.id];
    if (bullet.pierceLeft > 0) bullet.pierceLeft -= 1;
    else state.bullets = state.bullets.filter((item) => item !== bullet);
    enemy.hp -= bullet.damage;
    enemy.flash = 0.16;
    state.shake = Math.max(state.shake, enemy.type === "boss" ? 0.24 : 0.12);
    effects.addImpactFlash(state, enemy.x, enemy.y, enemy.type === "boss" ? "#f0b84a" : "#e8573f");
    effects.emitParticles(state, enemy.x, enemy.y, "#e8573f", enemy.type === "boss" ? 20 : 10, { life: 0.34, size: 3 });
    feedback.enemyHit(state, enemy);
    lootSystem.applyBulletSynergies(state, bullet, enemy, effects);
    if (enemy.hp <= 0) destroyEnemy(enemy);
  }

  function destroyEnemy(enemy) {
    state.enemies = state.enemies.filter((item) => item !== enemy);
    state.score += enemy.score;
    window.RunSummary.recordKill(state.runStats, enemy);
    window.MissionSystem.recordKill(state.mission, enemy, applyMissionReward);
    if (enemy.type === "bomber") enemySystem.explodeBomber(state, enemy, effects, damagePlayer);
    lootSystem.dropLoot(state, enemy);
    state.xpGems.push(rules.createXpGem(enemy.x, enemy.y, enemy.xp));
  }

  function collectXpGem(gem) {
    state.xpGems = state.xpGems.filter((item) => item !== gem);
    feedback.xpCollect(state, gem);
    window.MissionSystem.recordPickup(state.mission, "xp", applyMissionReward);
    grantXp(gem.value);
  }

  function grantXp(amount) {
    state.xp += amount;
    if (state.xp >= state.xpNeeded && state.phase === "playing") openLevelUp();
    syncInterface();
  }

  function grantHangarCore(amount) {
    window.HangarSystem.addCores(state.hangar, amount);
    window.RunSummary.recordCore(state.runStats, amount);
    window.MissionSystem.recordPickup(state.mission, "core", applyMissionReward);
    syncInterface();
  }

  function grantLandmarkReward(event) {
    grantXp(event.xp);
    state.lootDrops.push(window.LootSystem.createLootItem(event.lootType, state.player.x + 24, state.player.y - 34));
    window.CombatJuice.addPing(state, "loot", state.player.x, state.player.y);
  }

  function applyMissionReward(reward) {
    if (reward.xp) grantXp(reward.xp);
    if (reward.shield) state.player.shields = Math.min(3, (state.player.shields || 0) + reward.shield);
    if (reward.overdrive) state.player.overdrive = Math.max(state.player.overdrive || 0, reward.overdrive);
  }

  function handleLootCollect(loot) {
    feedback.lootCollect(state, loot);
    window.MissionSystem.recordPickup(state.mission, "loot", applyMissionReward);
  }

  function openLevelUp() {
    state.xp -= state.xpNeeded;
    state.level += 1;
    state.xpNeeded = Math.ceil(state.xpNeeded * 1.35 + 2);
    state.phase = "levelUp";
    state.upgradeChoices = rules.createUpgradeChoices(state.level);
    feedback.levelUp(state);
  }

  function chooseUpgrade(index) {
    const upgrade = state.upgradeChoices[index];
    if (!upgrade || state.phase !== "levelUp") return;
    rules.applyUpgrade(state.player, upgrade);
    state.upgradeChoices = [];
    state.phase = "playing";
    syncInterface();
  }

  function damagePlayer() {
    const player = state.player;
    if (player.invulnerable > 0 || state.phase !== "playing") return;
    if (lootSystem.absorbShield(player)) {
      effects.emitParticles(state, player.x, player.y, "#4fc3d6", 18, { life: 0.32, size: 3 });
      feedback.shieldAbsorb(state);
      return;
    }
    player.lives -= 1;
    player.invulnerable = 1.1;
    state.shake = Math.max(state.shake, 0.24);
    effects.emitParticles(state, player.x, player.y, "#52b69a", 22, { life: 0.45, size: 4 });
    feedback.playerHit(state);
    if (player.lives <= 0) endGame();
  }

  function spawnHorde(count, difficulty = state.spawnDirector.lastDifficulty) {
    const cap = difficulty.enemyCap;
    for (let index = 0; index < count && state.enemies.length < cap; index += 1) {
      const type = window.SpawnDirector.getEnemyType(state.wave, state.enemySpawnIndex);
      const enemy = window.EliteSystem.applyEliteAffix(rules.createEnemy(world, state.wave, type, state.player, viewport), state.wave, state.enemySpawnIndex);
      state.enemies.push(enemy);
      if (enemy.elite) feedback.eliteSpawn(state, enemy);
      state.enemySpawnIndex += 1;
    }
  }

  function spawnBoss() { state.enemies.push(rules.createEnemy(world, state.wave, "boss", state.player, viewport)); }

  function finishWave() {
    state.wave += 1;
    spawnHorde(8 + state.wave);
    syncInterface();
  }

  function endGame() {
    state.phase = "gameOver";
    state.highScore = Math.max(state.highScore, state.score);
    state.runSummary = window.RunSummary.createSummary(state, state.runStats);
    feedback.gameOver();
    syncInterface();
  }

  function togglePause() {
    if (state.phase === "playing") state.phase = "paused";
    else if (state.phase === "paused") state.phase = "playing";
    syncInterface();
  }

  function syncInterface() { ui.sync(state); audioUi.sync(); hangarUi.sync(state.hangar); summaryUi.sync(state); sectorUi.sync(state); }

  function hitFirstEnemy() {
    const enemy = state.enemies[0];
    if (!enemy) return;
    const bullet = { x: enemy.x, y: enemy.y, width: 8, height: 8, damage: enemy.hp, vx: 0, vy: 0, life: 1 };
    state.bullets.push(bullet);
    hitEnemy(bullet, enemy);
    syncInterface();
  }

  ui.actionButton.addEventListener("click", startGame);
  for (const button of hangarUi.buttons) button.element.addEventListener("click", () => { if (window.HangarSystem.buyUpgrade(state.hangar, button.id)) syncInterface(); });
  for (const [index, button] of ui.upgradeButtons.entries()) button.addEventListener("click", () => chooseUpgrade(index));
  window.ShooterControls.installControls({ chooseUpgrade, pressedKeys, state, startGame, togglePause, touchInput });
  window.DalgaSavunmasiGame = {
    chooseUpgrade,
    finishWave,
    forceBoss: spawnBoss,
    grantXp,
    hitFirstEnemy,
    hitPlayer: () => { state.player.invulnerable = 0; damagePlayer(); syncInterface(); },
    start: startGame,
    startPlaying,
    state,
    viewport,
    world,
  };
  syncInterface();
  requestAnimationFrame(loop);
})();
