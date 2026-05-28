(() => {
  function drawPiercingLaser(context, bullet) {
    const angle = Math.atan2(bullet.vy, bullet.vx);
    context.save();
    context.translate(bullet.x, bullet.y);
    context.rotate(angle);
    context.fillStyle = bullet.color || "#5ee6cf";
    context.fillRect(-bullet.width, -2, bullet.width * 3.4, 4);
    context.fillStyle = "#f2dfb6";
    context.fillRect(-bullet.width * 0.5, -1, bullet.width * 2.2, 2);
    context.restore();
  }

  function drawPhaseShot(context, bullet) {
    const angle = Math.atan2(bullet.vy, bullet.vx);
    context.save();
    context.translate(bullet.x, bullet.y);
    context.rotate(angle);
    context.fillStyle = bullet.trailColor || "#7df8ff";
    context.globalAlpha = 0.72;
    context.fillRect(-bullet.width * 1.6, -4, bullet.width * 3.8, 8);
    context.globalAlpha = 1;
    context.fillStyle = bullet.color || "#d9fbff";
    context.fillRect(-bullet.width * 0.8, -2, bullet.width * 2.7, 4);
    context.restore();
  }

  window.ProjectileVisual = { drawPhaseShot, drawPiercingLaser };
})();
