(() => {
  function createSpawnDirector() {
    return { spawnTimer: 0, threatTimer: 0, lastDifficulty: getDifficulty(1, 0) };
  }

  function updateDirector(director, state, delta) {
    const seconds = state.runStats?.seconds || 0;
    const difficulty = getDifficulty(state.wave || 1, seconds);
    director.lastDifficulty = difficulty;
    const plan = createPlan(difficulty, state.wave || 1);
    if (state.phase !== "playing") return plan;

    director.spawnTimer -= delta;
    director.threatTimer += delta;
    if (director.spawnTimer <= 0) {
      const available = Math.max(0, difficulty.enemyCap - (state.enemies?.length || 0));
      plan.spawnCount = Math.min(difficulty.packSize, available);
      director.spawnTimer = difficulty.spawnInterval;
    }
    if (director.threatTimer >= difficulty.waveDuration) {
      director.threatTimer = 0;
      plan.advanceWave = true;
      plan.nextWave = (state.wave || 1) + 1;
      plan.spawnBoss = plan.nextWave % 10 === 0;
      plan.bossTier = plan.spawnBoss ? "major" : "";
      plan.swarmWave = plan.nextWave % 5 === 0;
      plan.difficulty = getDifficulty(plan.nextWave, seconds);
      director.lastDifficulty = plan.difficulty;
    }
    return plan;
  }

  function createPlan(difficulty, wave) {
    return {
      advanceWave: false,
      difficulty,
      nextWave: wave,
      bossTier: "",
      spawnBoss: false,
      spawnCount: 0,
      swarmWave: difficulty.swarmWave,
    };
  }

  function getDifficulty(wave, seconds) {
    const intensity = clamp(0.12 + wave * 0.07 + seconds / 280, 0.12, 1);
    const swarmWave = wave % 5 === 0;
    const bossWave = wave % 10 === 0;
    const swarmCapBonus = swarmWave ? 14 + Math.floor(wave / 5) * 2 : 0;
    const swarmPackBonus = swarmWave ? 4 + Math.floor(wave / 10) : 0;
    const bossCapBonus = bossWave ? 6 : 0;
    return {
      bossTier: bossWave ? "major" : "",
      bossWave,
      enemyCap: 24 + wave * 4 + Math.floor(intensity * 14) + swarmCapBonus + bossCapBonus,
      intensity: Number(intensity.toFixed(2)),
      packSize: 1 + Math.floor(wave / 3) + Math.floor(intensity * 2) + swarmPackBonus,
      spawnInterval: Number(Math.max(0.28, 1.12 - wave * 0.045 - intensity * 0.28 - (swarmWave ? 0.12 : 0)).toFixed(2)),
      swarmWave,
      threatLabel: getThreatLabel(intensity),
      waveDuration: Number(Math.max(8, 12 - wave * 0.22 - intensity * 1.5).toFixed(2)),
    };
  }

  function getThreatLabel(intensity) {
    if (intensity >= 0.68) return "Yuksek";
    if (intensity >= 0.35) return "Orta";
    return "Dusuk";
  }

  function getEnemyType(wave, spawnIndex) {
    const deck = getRoleDeck(wave);
    return deck[spawnIndex % deck.length];
  }

  function getRoleDeck(wave) {
    if (wave < 3) return ["scout", "scout", "tank"];
    if (wave < 5) return ["scout", "tank", "scout", "sniper"];
    if (wave < 8) return ["scout", "tank", "sniper", "scout", "bomber"];
    return ["scout", "tank", "sniper", "bomber", "scout", "sniper", "tank", "bomber"];
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  window.SpawnDirector = {
    createSpawnDirector,
    getDifficulty,
    getEnemyType,
    getRoleDeck,
    updateDirector,
  };
})();
