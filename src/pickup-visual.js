(() => {
  function drawLootDrops(context, state) {
    for (const loot of state.lootDrops || []) {
      const size = loot.size || loot.width || 18;
      const pulse = Math.sin(loot.pulse || 0) * 2;
      context.save();
      context.translate(loot.x, loot.y);
      context.globalAlpha = 0.34;
      context.strokeStyle = loot.color || "#4fc3d6";
      context.lineWidth = 2;
      context.beginPath();
      context.ellipse(0, 0, size * 0.9 + pulse, size * 0.55 + pulse, 0, 0, Math.PI * 2);
      context.stroke();
      context.globalAlpha = 1;
      context.fillStyle = loot.color || "#4fc3d6";
      if (loot.type === "core") drawCoreLoot(context, size);
      else if (loot.type === "overdrive") drawOverdriveLoot(context, size);
      else if (loot.type === "repair") drawRepairLoot(context, size);
      else drawShieldLoot(context, size);
      context.restore();
    }
  }

  function drawCoreCombatEffects(context, state) {
    drawBurningEnemies(context, state);
    drawChainArcs(context, state);
  }

  function drawCoreDroneBullet(context, bullet) {
    context.save();
    context.translate(bullet.x, bullet.y);
    context.rotate(Math.atan2(bullet.vy, bullet.vx));
    context.fillStyle = bullet.color || "#f2dfb6";
    context.fillRect(-5, -3, 10, 6);
    context.fillStyle = "#52d6bd";
    context.fillRect(1, -1, 8, 2);
    context.restore();
  }

  function drawBurningEnemies(context, state) {
    for (const enemy of state.enemies) {
      if ((enemy.burnTime || 0) <= 0) continue;
      context.save();
      context.globalAlpha = Math.min(0.72, 0.22 + enemy.burnTime * 0.18);
      context.strokeStyle = "#f0a040";
      context.lineWidth = 3;
      context.beginPath();
      context.ellipse(enemy.x, enemy.y, enemy.width * 0.62, enemy.height * 0.55, 0, 0, Math.PI * 2);
      context.stroke();
      context.restore();
    }
  }

  function drawChainArcs(context, state) {
    for (const arc of state.chainArcs || []) {
      const alpha = arc.life / arc.maxLife;
      context.save();
      context.globalAlpha = alpha;
      context.strokeStyle = "#5ee6cf";
      context.lineWidth = 3;
      context.beginPath();
      context.moveTo(arc.x1, arc.y1);
      context.quadraticCurveTo((arc.x1 + arc.x2) / 2, (arc.y1 + arc.y2) / 2 - 24, arc.x2, arc.y2);
      context.stroke();
      context.restore();
    }
  }

  function drawCoreLoot(context, size) {
    context.beginPath();
    context.moveTo(0, -size * 0.62);
    context.lineTo(size * 0.58, 0);
    context.lineTo(0, size * 0.62);
    context.lineTo(-size * 0.58, 0);
    context.closePath();
    context.fill();
    context.fillStyle = "#f2dfb6";
    context.fillRect(-3, -7, 6, 14);
  }

  function drawOverdriveLoot(context, size) {
    context.fillRect(-size * 0.45, -size * 0.34, size * 0.9, size * 0.68);
    context.fillStyle = "#f2dfb6";
    context.fillRect(-2, -size * 0.52, 4, size * 1.04);
  }

  function drawRepairLoot(context, size) {
    context.fillRect(-3, -size * 0.48, 6, size * 0.96);
    context.fillRect(-size * 0.48, -3, size * 0.96, 6);
  }

  function drawShieldLoot(context, size) {
    context.beginPath();
    context.moveTo(0, -size * 0.6);
    context.lineTo(size * 0.52, -size * 0.15);
    context.lineTo(size * 0.32, size * 0.48);
    context.lineTo(0, size * 0.64);
    context.lineTo(-size * 0.32, size * 0.48);
    context.lineTo(-size * 0.52, -size * 0.15);
    context.closePath();
    context.fill();
  }

  window.PickupVisual = { drawCoreCombatEffects, drawCoreDroneBullet, drawLootDrops };
})();
