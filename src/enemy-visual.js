(() => {
  function drawEnemies(context, state) {
    for (const enemy of state.enemies) {
      if (enemy.type === "boss") drawCommandShip(context, enemy);
      else drawRaiderDrone(context, enemy);
    }
  }

  function drawRaiderDrone(context, enemy) {
    const wobble = Math.sin(enemy.pulse) * 3;
    context.save();
    context.translate(enemy.x, enemy.y + wobble);
    if (enemy.type === "tank") drawTankHull(context, enemy);
    else if (enemy.type === "sniper") drawSniperHull(context, enemy);
    else if (enemy.type === "bomber") drawBomberHull(context, enemy);
    else drawScoutHull(context, enemy);
    drawEliteAffix(context, enemy);
    context.restore();
  }

  function drawScoutHull(context, enemy) {
    drawCoreHull(context, enemy, [[0, -21], [-29, -4], [-18, 16], [0, 23], [18, 16], [29, -4]], "#203047", "#2f4965");
    context.fillStyle = "#111923";
    drawPath(context, [[-25, -2], [-39, 9], [-22, 17], [-12, 8]]);
    drawPath(context, [[25, -2], [39, 9], [22, 17], [12, 8]]);
    drawHostileCore(context, enemy, 12, 13);
    drawThrusters(context, 20, 14);
  }

  function drawTankHull(context, enemy) {
    drawCoreHull(context, enemy, [[0, -24], [-43, -12], [-49, 18], [-20, 31], [0, 24], [20, 31], [49, 18], [43, -12]], "#1b2a3f", "#3a526c");
    context.fillStyle = "#111923";
    context.fillRect(-42, -1, 18, 16);
    context.fillRect(24, -1, 18, 16);
    drawHostileCore(context, enemy, 18, 18);
    drawThrusters(context, 30, 22);
  }

  function drawSniperHull(context, enemy) {
    drawCoreHull(context, enemy, [[0, -32], [-25, -7], [-15, 15], [0, 22], [15, 15], [25, -7]], "#1f3048", "#324b64");
    context.fillStyle = "#111923";
    context.fillRect(-4, -42, 8, 24);
    context.fillRect(-32, 4, 15, 9);
    context.fillRect(17, 4, 15, 9);
    drawHostileCore(context, enemy, 10, 12);
    drawThrusters(context, 17, 17);
  }

  function drawBomberHull(context, enemy) {
    drawCoreHull(context, enemy, [[0, -23], [-32, -9], [-31, 19], [-10, 30], [0, 24], [10, 30], [31, 19], [32, -9]], "#243149", "#40546a");
    context.fillStyle = "#e8573f";
    context.globalAlpha = 0.38 + Math.sin(enemy.pulse) * 0.12;
    context.beginPath();
    context.arc(0, 4, 18, 0, Math.PI * 2);
    context.fill();
    context.globalAlpha = 1;
    drawHostileCore(context, enemy, 14, 16);
    drawThrusters(context, 24, 22);
  }

  function drawCoreHull(context, enemy, silhouette, hull, plate) {
    context.fillStyle = enemy.flash > 0 ? "#f2dfb6" : hull;
    drawPath(context, silhouette);
    context.fillStyle = enemy.flash > 0 ? "#f2dfb6" : plate;
    drawPath(context, [[0, -15], [-14, -2], [-9, 12], [0, 17], [9, 12], [14, -2]]);
  }

  function drawHostileCore(context, enemy, width, height) {
    context.fillStyle = enemy.hp > 2 ? "#f0a040" : "#e8573f";
    context.fillRect(-width / 2, -4, width, height);
    context.fillStyle = "rgba(242, 223, 182, 0.35)";
    context.fillRect(-3, -14, 4, 20);
  }

  function drawThrusters(context, x, y) {
    context.fillStyle = "#52b69a";
    context.globalAlpha = 0.62;
    context.fillRect(-x, y, 7, 5);
    context.fillRect(x - 7, y, 7, 5);
    context.globalAlpha = 1;
  }

  function drawEliteAffix(context, enemy) {
    if (!enemy.elite) return;
    context.save();
    context.globalAlpha = 0.78;
    context.strokeStyle = enemy.affixColor || "#f2dfb6";
    context.lineWidth = 3;
    context.beginPath();
    context.ellipse(0, 0, enemy.width * 0.62, enemy.height * 0.62, 0, 0, Math.PI * 2);
    context.stroke();
    if (enemy.affix === "armored") drawArmoredMark(context, enemy);
    if (enemy.affix === "overcharged") drawOverchargedMark(context, enemy);
    if (enemy.affix === "coreCarrier") drawCoreCarrierMark(context, enemy);
    context.restore();
  }

  function drawArmoredMark(context, enemy) {
    context.fillStyle = enemy.affixColor || "#d7a64f";
    context.fillRect(-enemy.width * 0.34, -enemy.height * 0.12, 8, enemy.height * 0.32);
    context.fillRect(enemy.width * 0.34 - 8, -enemy.height * 0.12, 8, enemy.height * 0.32);
  }

  function drawOverchargedMark(context, enemy) {
    context.strokeStyle = enemy.affixColor || "#f0a040";
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(-enemy.width * 0.2, -enemy.height * 0.42);
    context.lineTo(0, -enemy.height * 0.12);
    context.lineTo(-7, -enemy.height * 0.12);
    context.lineTo(enemy.width * 0.18, enemy.height * 0.34);
    context.stroke();
  }

  function drawCoreCarrierMark(context, enemy) {
    context.fillStyle = enemy.affixColor || "#52d6bd";
    drawPath(context, [[0, -enemy.height * 0.44], [9, -enemy.height * 0.25], [0, -enemy.height * 0.08], [-9, -enemy.height * 0.25]]);
  }

  function drawCommandShip(context, enemy) {
    const wobble = Math.sin(enemy.pulse) * 4;
    context.save();
    context.translate(enemy.x, enemy.y + wobble);
    context.fillStyle = enemy.flash > 0 ? "#f2dfb6" : "#1c2839";
    drawPath(context, [[0, -48], [-52, -16], [-42, 30], [-15, 42], [0, 34], [15, 42], [42, 30], [52, -16]]);
    context.fillStyle = enemy.flash > 0 ? "#f2dfb6" : "#324b64";
    drawPath(context, [[0, -38], [-29, -12], [-22, 22], [0, 30], [22, 22], [29, -12]]);
    context.fillStyle = "#111923";
    context.fillRect(-60, -6, 26, 20);
    context.fillRect(34, -6, 26, 20);
    context.fillStyle = "#e8573f";
    context.fillRect(-10, -16, 20, 28);
    context.fillStyle = "#f0a040";
    context.fillRect(-5, -27, 10, 10);
    context.fillStyle = "#52b69a";
    context.globalAlpha = 0.52;
    context.fillRect(-31, 29, 12, 7);
    context.fillRect(19, 29, 12, 7);
    context.globalAlpha = 1;
    drawBossHealth(context, enemy);
    context.restore();
  }

  function drawBossHealth(context, enemy) {
    context.fillStyle = "#17130f";
    context.fillRect(-33, -58, 66, 7);
    context.fillStyle = "#f0a040";
    context.fillRect(-31, -56, 62 * (enemy.hp / enemy.maxHp), 3);
  }

  function drawPath(context, points) {
    context.beginPath();
    context.moveTo(points[0][0], points[0][1]);
    for (let index = 1; index < points.length; index += 1) context.lineTo(points[index][0], points[index][1]);
    context.closePath();
    context.fill();
  }

  window.EnemyVisual = { drawEnemies };
})();
