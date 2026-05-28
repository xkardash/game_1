(() => {
  function updatePlayer(state, delta, pressedKeys, touchInput, world, rules, lootSystem) {
    const input = rules.getMovementInput(pressedKeys, touchInput);
    const halfWidth = state.player.width / 2;
    const halfHeight = state.player.height / 2;
    state.player.x = rules.clamp(state.player.x + input.x * state.player.speed * delta, halfWidth, world.width - halfWidth);
    state.player.y = rules.clamp(state.player.y + input.y * state.player.speed * delta, halfHeight, world.height - halfHeight);
    state.player.cooldown = Math.max(0, state.player.cooldown - delta);
    state.player.invulnerable = Math.max(0, state.player.invulnerable - delta);
    lootSystem.updatePlayerTimers(state.player, delta);
  }

  function updateBullets(state, delta, world) {
    for (const bullet of state.bullets) {
      bullet.x += bullet.vx * delta;
      bullet.y += bullet.vy * delta;
      bullet.life -= delta;
    }
    state.bullets = state.bullets.filter((bullet) => bullet.life > 0
      && bullet.x > -30 && bullet.x < world.width + 30
      && bullet.y > -30 && bullet.y < world.height + 30);
  }

  function updateXpGems(state, delta, rules) {
    for (const gem of state.xpGems) {
      const distance = rules.getDistance(state.player, gem);
      if (distance >= state.player.stats.magnet) continue;
      const direction = rules.getUnitVector(gem, state.player);
      gem.x += direction.x * 360 * delta;
      gem.y += direction.y * 360 * delta;
    }
  }

  window.GameMotion = { updateBullets, updatePlayer, updateXpGems };
})();
