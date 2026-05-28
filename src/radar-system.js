(() => {
  function projectPoint(entity, world, size) {
    return {
      x: Math.round(clamp((entity.x / world.width) * size, 0, size)),
      y: Math.round(clamp((entity.y / world.height) * size, 0, size)),
    };
  }

  function getBlips(state, world, size) {
    const blips = [{ kind: "player", ...projectPoint(state.player, world, size) }];
    for (const enemy of state.enemies) {
      const kind = enemy.type === "boss" ? "boss" : (enemy.elite ? "elite" : "enemy");
      blips.push({ kind, ...projectPoint(enemy, world, size) });
    }
    for (const loot of state.lootDrops || []) blips.push({ kind: "loot", ...projectPoint(loot, world, size) });
    return blips;
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  window.RadarSystem = { getBlips, projectPoint };
})();
