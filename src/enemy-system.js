(() => {
  const rules = window.SurvivalRules;
  const runItemSystem = window.RunItemSystem;

  function updateEnemies(state, delta, damagePlayer) {
    applyCaptainAuras(state);
    for (const enemy of state.enemies) {
      if (enemy.type === "sniper") updateSniper(enemy, state, delta);
      else updateChaser(enemy, state, delta);
      enemy.pulse += delta * enemy.pulseRate;
      enemy.fireCooldown = Math.max(0, enemy.fireCooldown - delta);
      if (rules.overlaps(enemy, rules.getBounds(state.player))) damagePlayer();
    }
  }

  function updateChaser(enemy, state, delta) {
    const player = state.player;
    const direction = rules.getUnitVector(enemy, player);
    const speed = getEffectiveSpeed(enemy, state);
    enemy.x += direction.x * speed * delta;
    enemy.y += direction.y * speed * delta;
  }

  function updateSniper(enemy, state, delta) {
    const player = state.player;
    const distance = rules.getDistance(enemy, player);
    const direction = rules.getUnitVector(enemy, player);
    const range = enemy.preferredRange;
    const speed = getEffectiveSpeed(enemy, state);
    if (distance > range + 36) {
      enemy.x += direction.x * speed * delta;
      enemy.y += direction.y * speed * delta;
    } else if (distance < range - 52) {
      enemy.x -= direction.x * speed * delta;
      enemy.y -= direction.y * speed * delta;
    } else {
      enemy.x += -direction.y * speed * enemy.orbit * delta * 0.42;
      enemy.y += direction.x * speed * enemy.orbit * delta * 0.42;
    }
    if (enemy.fireCooldown <= 0 && distance < range + 80) fireSniperShot(enemy, state);
  }

  function applyCaptainAuras(state) {
    for (const enemy of state.enemies || []) {
      enemy.captainBuff = "";
      enemy.speedMultiplier = 1;
    }
    const captains = (state.enemies || []).filter((enemy) => enemy.captain && enemy.hp > 0);
    for (const captain of captains) {
      const aura = captain.captainAura || {};
      const range = aura.range || 0;
      for (const ally of state.enemies || []) {
        if (ally === captain || ally.type === "boss") continue;
        if (rules.getDistance(captain, ally) > range) continue;
        ally.captainBuff = "speed";
        ally.speedMultiplier = Math.max(ally.speedMultiplier || 1, aura.speedScale || 1);
      }
    }
  }

  function getEffectiveSpeed(enemy, state) {
    const slowScale = runItemSystem?.getSlowScale?.(state.player, enemy) || 1;
    return enemy.speed * (enemy.speedMultiplier || 1) * slowScale;
  }

  function fireSniperShot(enemy, state) {
    const direction = rules.getUnitVector(enemy, state.player);
    state.enemyBullets.push({
      x: enemy.x,
      y: enemy.y,
      vx: direction.x * 340,
      vy: direction.y * 340,
      width: 10,
      height: 10,
      life: 3,
      damage: 1,
      color: "#e8573f",
      trailColor: "#f0a040",
    });
    enemy.fireCooldown = enemy.fireRate;
  }

  function updateEnemyBullets(state, delta, world) {
    for (const bullet of state.enemyBullets) {
      bullet.x += bullet.vx * delta;
      bullet.y += bullet.vy * delta;
      bullet.life -= delta;
    }
    state.enemyBullets = state.enemyBullets.filter((bullet) => bullet.life > 0
      && bullet.x > -40 && bullet.x < world.width + 40
      && bullet.y > -40 && bullet.y < world.height + 40);
  }

  function checkEnemyBulletHits(state, damagePlayer) {
    for (const bullet of [...state.enemyBullets]) {
      if (!rules.overlaps(bullet, rules.getBounds(state.player))) continue;
      state.enemyBullets = state.enemyBullets.filter((item) => item !== bullet);
      damagePlayer();
    }
  }

  function explodeBomber(state, enemy, effects, damagePlayer) {
    const blastRadius = enemy.blastRadius;
    state.shake = Math.max(state.shake, 0.34);
    effects.addImpactFlash(state, enemy.x, enemy.y, "#f0a040");
    effects.emitParticles(state, enemy.x, enemy.y, "#f0a040", 34, { life: 0.52, size: 5, spread: 310 });
    if (rules.getDistance(state.player, enemy) < blastRadius) damagePlayer();
  }

  window.EnemySystem = {
    applyCaptainAuras,
    checkEnemyBulletHits,
    explodeBomber,
    updateEnemies,
    updateEnemyBullets,
  };
})();
