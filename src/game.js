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
  const runItemSystem = window.RunItemSystem;
  const ui = window.ShooterUi.createGameUi();
  const audioUi = window.AudioUi.createAudioUi(audio);
  const summaryUi = window.RunSummaryUi.createRunSummaryUi();
  const sectorUi = window.SectorUi.createSectorUi();
  const overdriveTouchButton = document.querySelector("#overdriveTouch");
  const hangar = window.HangarSystem.load();
  const hangarUi = window.HangarUi.createHangarUi();
  const viewport = { width: canvas.width, height: canvas.height };
  const world = { width: 1760, height: 1040 };
  const pressedKeys = new Set();
  const touchInput = { left: false, right: false, up: false, down: false };
  const state = createInitialState();

  function createInitialState(highScore = 0, selectedShip = "aegis", trailColor = null, itemSelection = null) {
    const actualItemSelection = runItemSystem
      ? runItemSystem.createSelection(itemSelection?.selectedIds || itemSelection || undefined)
      : null;
    const player = rules.createPlayer(world, selectedShip, actualItemSelection);
    player.trailHistory = [];
    window.HangarSystem.applyBonuses(player, hangar);
    const camera = cameraTools.createCamera(viewport, world);
    cameraTools.updateCamera(camera, player, world, viewport);
    const actualTrailColor = trailColor || (selectedShip === "aegis" ? "cyan" : "crimson");
    return {
      phase: "ready",
      countdown: 0,
      score: 0,
      highScore,
      itemSelection: actualItemSelection,
      selectedShip,
      trailColor: actualTrailColor,
      wave: 1,
      level: 1,
      xp: 0,
      xpNeeded: 5,
      hangar,
      player,
      camera,
      world,
      bullets: [],
      enemyBullets: [],
      bossTelegraphs: [],
      enemies: [],
      lootDrops: [],
      chainArcs: [],
      overdriveBursts: [],
      relicFields: [],
      relicReveal: null,
      relicRevealBursts: [],
      uxNotices: [],
      xpGems: [],
      sector: window.SectorEvents.createSectorState(),
      mission: window.MissionSystem.createMissionState(),
      tacticalObjectives: window.TacticalObjectiveSystem.createObjectiveState(world),
      spawnDirector: window.SpawnDirector.createSpawnDirector(),
      landmarkState: window.LandmarkSystem.createLandmarkState(world),
      particles: [],
      combatPings: [],
      bossPhaseFlashes: [],
      muzzleFlashes: [],
      impactFlashes: [],
      stars: effects.createStars(140, world),
      spaceObjects: effects.createSpaceObjects(world),
      shake: 0,
      enemySpawnIndex: 0,
      shotsFired: 0,
      runStats: window.RunSummary.createRunStats(),
      upgradeChoices: [],
      relicChoices: [],
      lastBossReward: null,
      lastFormation: null,
      lastFrameTime: 0,
    };
  }

  function resetRound() {
    Object.assign(state, createInitialState(state.highScore, state.selectedShip || "aegis", state.trailColor, state.itemSelection));
    spawnHorde(8);
  }

  function startGame() {
    if (!canLaunchRun()) return;
    audio.unlock();
    resetRound();
    beginCountdown();
  }
  function startPlaying() {
    if (!canLaunchRun()) return;
    resetRound();
    state.phase = "playing";
    syncInterface();
  }
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
    window.CombatUx.update(state, delta);
    window.CombatJuice.updatePings(state, delta);
    window.RunSummary.updateRunStats(state.runStats, state, delta);
    if (state.phase === "countdown") updateCountdown(delta);
    if (state.phase === "relicReveal") updateRelicReveal(delta);
    updateCamera();
    if (state.phase !== "playing") return;
    updateThreat(delta);
    window.GameMotion.updatePlayer(state, delta, pressedKeys, touchInput, world, rules, lootSystem);
    if (state.player) {
      if (!state.player.trailHistory) state.player.trailHistory = [];
      state.player.trailHistory.push({ x: state.player.x, y: state.player.y });
      if (state.player.trailHistory.length > 15) {
        state.player.trailHistory.shift();
      }
    }
    updateCamera();
    updateAutoFire(delta);
    window.GameMotion.updateBullets(state, delta, world);
    enemySystem.updateEnemyBullets(state, delta, world);
    enemySystem.updateEnemies(state, delta, damagePlayer);
    window.BossSystem.updateBosses(
      state,
      delta,
      (event) => feedback.bossVolley(state, event),
      (event) => feedback.bossTelegraph(state, event),
    );
    window.SectorEvents.updateSectorEvents(state, delta);
    updateLandmarks(delta);
    updateTacticalObjectives(delta);
    window.MissionSystem.updateMission(state.mission, state, delta, applyMissionReward);
    lootSystem.updateCoreSynergies(state, effects, delta, destroyEnemy);
    window.GameMotion.updateXpGems(state, delta, rules);
    lootSystem.updateLootDrops(state, delta);
    window.OverdriveSystem.update(state, delta, effects, destroyEnemy);
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
    if (plan.swarmWave) spawnHorde(plan.difficulty.packSize + 5, plan.difficulty);
    if (plan.spawnBoss) spawnBoss(plan.bossTier);
  }

  function updateLandmarks(delta) {
    for (const event of window.LandmarkSystem.updateLandmarks(state, delta)) {
      if (event.type === "hazardDamage") damagePlayer();
      if (event.type === "zoneReward") grantLandmarkReward(event);
    }
  }

  function updateTacticalObjectives(delta) {
    for (const event of window.TacticalObjectiveSystem.updateObjectives(state.tacticalObjectives, state, delta)) {
      if (event.type === "anomalyPressure") handleAnomalyPressure(event);
      if (event.type === "objectiveReward") grantObjectiveReward(event);
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
    const damage = enemy.type === "boss" ? bullet.damage * (bullet.bossDamageScale || 1) : bullet.damage;
    enemy.hp -= damage;
    enemy.flash = 0.16;
    state.shake = Math.max(state.shake, enemy.type === "boss" ? 0.24 : 0.12);
    effects.addImpactFlash(state, enemy.x, enemy.y, enemy.type === "boss" ? "#f0b84a" : "#e8573f");
    effects.emitParticles(state, enemy.x, enemy.y, "#e8573f", enemy.type === "boss" ? 20 : 10, { life: 0.34, size: 3 });
    feedback.enemyHit(state, enemy);
    lootSystem.applyBulletSynergies(state, bullet, enemy, effects, destroyEnemy);
    if (enemy.hp <= 0) destroyEnemy(enemy);
  }

  function destroyEnemy(enemy) {
    state.enemies = state.enemies.filter((item) => item !== enemy);
    state.score += enemy.score;
    window.RunSummary.recordKill(state.runStats, enemy);
    window.MissionSystem.recordKill(state.mission, enemy, applyMissionReward);
    window.OverdriveSystem.gainFromKill(state, enemy);
    if (enemy.type === "bomber") enemySystem.explodeBomber(state, enemy, effects, damagePlayer);
    lootSystem.dropLoot(state, enemy);
    state.xpGems.push(rules.createXpGem(enemy.x, enemy.y, enemy.xp));
    if (enemy.type === "boss") {
      state.lastBossReward = { archetype: enemy.bossArchetype, tag: enemy.rewardTag };
      effects.emitParticles(state, enemy.x, enemy.y, "#f0b84a", 34, { life: 0.68, size: 4 });
      window.CombatJuice.addPing(state, "loot", enemy.x, enemy.y);
      openRelicReveal(enemy);
    }
  }

  function collectXpGem(gem) {
    state.xpGems = state.xpGems.filter((item) => item !== gem);
    feedback.xpCollect(state, gem);
    window.MissionSystem.recordPickup(state.mission, "xp", applyMissionReward);
    window.OverdriveSystem.addCharge(state.player, gem.value * 2);
    grantXp(gem.value);
  }

  function grantXp(amount) {
    state.xp += runItemSystem?.scaleXp?.(state.player, amount) || amount;
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

  function grantObjectiveReward(event) {
    const reward = event.reward;
    if (reward.xp) grantXp(reward.xp);
    if (reward.overdriveCharge) window.OverdriveSystem.addCharge(state.player, reward.overdriveCharge);
    if (reward.shield) state.player.shields = Math.min(4, (state.player.shields || 0) + reward.shield);
    if (reward.lootType) state.lootDrops.push(window.LootSystem.createLootItem(reward.lootType, event.x, event.y));
    window.CombatUx.addRewardNotice(state, event);
    window.CombatJuice.addPing(state, "loot", event.x, event.y);
    syncInterface();
  }

  function handleAnomalyPressure(event) {
    spawnHorde(1);
    window.CombatJuice.addPing(state, "bossVolley", event.objective.x, event.objective.y);
  }

  function applyMissionReward(reward) {
    if (reward.xp) grantXp(reward.xp);
    if (reward.shield) state.player.shields = Math.min(4, (state.player.shields || 0) + reward.shield);
    if (reward.overdrive) state.player.overdrive = Math.max(state.player.overdrive || 0, reward.overdrive);
  }

  function handleLootCollect(loot) {
    feedback.lootCollect(state, loot);
    window.MissionSystem.recordPickup(state.mission, "loot", applyMissionReward);
  }

  function activateOverdrive() {
    const event = window.OverdriveSystem.activate(state, effects, destroyEnemy);
    if (!event) return;
    window.CombatJuice.addPing(state, "overdrivePickup", state.player.x, state.player.y, {
      color: window.OverdriveSystem.getMode(state.player).color,
      maxRadius: 138,
    });
    syncInterface();
  }

  function openLevelUp() {
    state.xp -= state.xpNeeded;
    state.level += 1;
    state.xpNeeded = Math.ceil(state.xpNeeded * 1.35 + 2);
    state.phase = "levelUp";
    state.upgradeChoices = rules.createUpgradeChoices(state.level, state.player);
    feedback.levelUp(state);
  }

  function chooseUpgrade(index) {
    if (state.phase === "relicChoice") {
      chooseRelic(index);
      return;
    }
    const upgrade = state.upgradeChoices[index];
    if (!upgrade || state.phase !== "levelUp") return;
    rules.applyUpgrade(state.player, upgrade);
    state.upgradeChoices = [];
    state.phase = "playing";
    syncInterface();
  }

  function openRelicChoice() {
    state.phase = "relicChoice";
    state.relicChoices = window.RelicSystem.createRelicChoices(state);
    state.upgradeChoices = [];
    feedback.levelUp(state);
    syncInterface();
  }

  function openRelicReveal(enemy) {
    window.RelicReveal.start(state, enemy);
    syncInterface();
  }

  function updateRelicReveal(delta) {
    lootSystem.updateLootDrops(state, delta);
    lootSystem.collectLootDrops(state, grantXp, grantHangarCore, handleLootCollect);
    window.RelicReveal.update(state, delta, openRelicChoice);
    syncInterface();
  }

  function chooseRelic(index) {
    const relic = state.relicChoices[index];
    if (!relic || state.phase !== "relicChoice") return;
    window.RelicSystem.applyRelic(state, relic);
    state.relicChoices = [];
    state.phase = "playing";
    syncInterface();
  }

  function damagePlayer() {
    const player = state.player;
    if (player.invulnerable > 0 || state.phase !== "playing") return;
    if (runItemSystem?.rollDodge?.(player)) {
      player.invulnerable = 0.42;
      effects.emitParticles(state, player.x, player.y, "#d9fbff", 12, { life: 0.24, size: 2 });
      return;
    }
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
    const openSlots = cap - state.enemies.length;
    if (window.EnemyFormation.shouldSpawnFormation(state.wave, state.enemySpawnIndex, openSlots)) {
      spawnFormation(Math.min(openSlots, 6));
      count = Math.max(0, count - 1);
    }
    for (let index = 0; index < count && state.enemies.length < cap; index += 1) {
      const type = window.SpawnDirector.getEnemyType(state.wave, state.enemySpawnIndex);
      const enemy = window.EliteSystem.applyEliteAffix(rules.createEnemy(world, state.wave, type, state.player, viewport), state.wave, state.enemySpawnIndex);
      state.enemies.push(enemy);
      if (enemy.elite) feedback.eliteSpawn(state, enemy);
      state.enemySpawnIndex += 1;
    }
  }

  function spawnFormation(capacity) {
    const formation = window.EnemyFormation.createFormation({
      capacity,
      player: state.player,
      rules,
      spawnIndex: state.enemySpawnIndex,
      viewport,
      wave: state.wave,
      world,
    });
    for (const enemy of formation) {
      const spawned = window.EliteSystem.applyEliteAffix(enemy, state.wave, state.enemySpawnIndex);
      state.enemies.push(spawned);
      if (spawned.elite) feedback.eliteSpawn(state, spawned);
      state.enemySpawnIndex += 1;
    }
    if (formation.length > 0) {
      state.lastFormation = {
        count: formation.length,
        id: formation[0].formationId,
        type: formation[0].formationType,
      };
    }
  }

  function spawnBoss(tier = "") {
    const boss = rules.createEnemy(world, state.wave, "boss", state.player, viewport);
    if (tier) {
      boss.bossTier = tier;
      boss.majorBoss = tier === "major";
    }
    state.enemies.push(boss);
  }

  function finishWave() {
    state.wave += 1;
    const difficulty = window.SpawnDirector.getDifficulty(state.wave, state.runStats?.seconds || 0);
    spawnHorde(8 + state.wave + (difficulty.swarmWave ? 6 : 0), difficulty);
    if (difficulty.bossWave) spawnBoss(difficulty.bossTier);
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

  function syncInterface() {
    ui.sync(state);
    audioUi.sync();
    hangarUi.sync(state.hangar);
    summaryUi.sync(state);
    sectorUi.sync(state);
    window.CombatUx.syncOverdriveButton(overdriveTouchButton, state);
  }

  function canLaunchRun() {
    if (!runItemSystem) return true;
    if (runItemSystem.isSelectionReady(state.itemSelection)) return true;
    state.itemSelection = {
      ...(state.itemSelection || runItemSystem.createSelection([])),
      message: "Run baslamadan once her nadirlikten 2 esya sec.",
    };
    syncInterface();
    return false;
  }

  function toggleDraftItem(itemId) {
    if (!runItemSystem || !["ready", "gameOver"].includes(state.phase)) return;
    state.itemSelection = runItemSystem.toggleSelection(state.itemSelection, itemId);
    state.player.itemState = runItemSystem.createItemState(state.itemSelection);
    syncInterface();
  }

  function hitFirstEnemy() {
    const enemy = state.enemies[0];
    if (!enemy) return;
    const bullet = { x: enemy.x, y: enemy.y, width: 8, height: 8, damage: enemy.hp, vx: 0, vy: 0, life: 1 };
    state.bullets.push(bullet);
    hitEnemy(bullet, enemy);
    syncInterface();
  }

  ui.actionButton.addEventListener("click", startGame);
  const dbLaunchBtn = document.querySelector("#dbLaunchButton");
  if (dbLaunchBtn) dbLaunchBtn.addEventListener("click", startGame);
  const itemDraftGrid = document.querySelector("#itemDraftGrid");
  if (itemDraftGrid) {
    itemDraftGrid.addEventListener("click", (event) => {
      const button = event.target.closest("[data-item-id]");
      if (!button || !itemDraftGrid.contains(button)) return;
      toggleDraftItem(button.dataset.itemId);
    });
  }
  const aegisBtn = document.querySelector("#ship-aegis");
  if (aegisBtn) aegisBtn.addEventListener("click", () => { state.selectedShip = "aegis"; resetRound(); syncInterface(); });
  const dreadnoughtBtn = document.querySelector("#ship-dreadnought");
  if (dreadnoughtBtn) dreadnoughtBtn.addEventListener("click", () => { state.selectedShip = "dreadnought"; resetRound(); syncInterface(); });

  if (ui.hangarReturnButton) {
    ui.hangarReturnButton.addEventListener("click", endGame);
  }

  const colorBtns = ["cyan", "crimson", "acid", "gold"].map(c => document.querySelector(`#trail-${c}`));
  colorBtns.forEach(btn => {
    if (btn) {
      btn.addEventListener("click", () => {
        state.trailColor = btn.getAttribute("data-color");
        resetRound();
        syncInterface();
      });
    }
  });

  for (const button of hangarUi.buttons) button.element.addEventListener("click", () => { if (window.HangarSystem.buyUpgrade(state.hangar, button.id)) syncInterface(); });
  for (const [index, button] of ui.upgradeButtons.entries()) button.addEventListener("click", () => chooseUpgrade(index));
  window.ShooterControls.installControls({ activateOverdrive, chooseUpgrade, pressedKeys, state, startGame, togglePause, touchInput });
  window.DalgaSavunmasiGame = {
    activateOverdrive,
    chooseUpgrade,
    chooseRelic,
    endGame,
    finishWave,
    forceBoss: spawnBoss,
    grantXp,
    hitFirstEnemy,
    hitPlayer: () => { state.player.invulnerable = 0; damagePlayer(); syncInterface(); },
    start: startGame,
    startPlaying,
    state,
    toggleDraftItem,
    viewport,
    world,
  };
  syncInterface();
  requestAnimationFrame(loop);
})();
