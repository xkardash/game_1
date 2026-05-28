(() => {
  const rules = window.SurvivalRules;

  function updateEnemies(state, delta, damagePlayer) {
    for (const enemy of state.enemies) {
      if (enemy.type === "sniper") updateSniper(enemy, state, delta);
      else updateChaser(enemy, state.player, delta);
      enemy.pulse += delta * enemy.pulseRate;
      enemy.fireCooldown = Math.max(0, enemy.fireCooldown - delta);
      if (rules.overlaps(enemy, rules.getBounds(state.player))) damagePlayer();
    }
  }

  function updateChaser(enemy, player, delta) {
    const direction = rules.getUnitVector(enemy, player);
    enemy.x += direction.x * enemy.speed * delta;
    enemy.y += direction.y * enemy.speed * delta;
  }

  function updateSniper(enemy, state, delta) {
    const player = state.player;
    const distance = rules.getDistance(enemy, player);
    const direction = rules.getUnitVector(enemy, player);
    const range = enemy.preferredRange;
    if (distance > range + 36) {
      enemy.x += direction.x * enemy.speed * delta;
      enemy.y += direction.y * enemy.speed * delta;
    } else if (distance < range - 52) {
      enemy.x -= direction.x * enemy.speed * delta;
      enemy.y -= direction.y * enemy.speed * delta;
    } else {
      enemy.x += -direction.y * enemy.speed * enemy.orbit * delta * 0.42;
      enemy.y += direction.x * enemy.speed * enemy.orbit * delta * 0.42;
    }
    if (enemy.fireCooldown <= 0 && distance < range + 80) fireSniperShot(enemy, state);
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
    checkEnemyBulletHits,
    explodeBomber,
    updateEnemies,
    updateEnemyBullets,
  };
})();
