(() => {
  function drawRelics(context, player) {
    const relics = new Set(player.relics || []);
    if (relics.has("starforgedHull")) drawStarforgedHull(context);
    if (relics.has("novaCore")) drawNovaCore(context);
    if (relics.has("voidSiphon")) drawVoidSiphon(context);
    if (relics.has("phaseInjector")) drawPhaseInjector(context);
    drawBuildModules(context, player);
  }

  function drawRelicFields(context, state) {
    for (const field of state.relicFields || []) {
      const alpha = Math.max(0, field.life / field.maxLife);
      context.save();
      context.globalAlpha = alpha * 0.58;
      context.strokeStyle = field.color;
      context.lineWidth = 3;
      context.beginPath();
      context.ellipse(field.x, field.y, field.radius, field.radius * 0.62, 0, 0, Math.PI * 2);
      context.stroke();
      context.globalAlpha = alpha * 0.12;
      context.fillStyle = field.color;
      context.fill();
      context.restore();
    }
  }

  function drawBuildModules(context, player) {
    const active = window.RelicSynergy?.getActiveSynergies?.(player).map((synergy) => synergy.id) || [];
    if (active.includes("novaLance")) drawNovaLanceModule(context);
    if (active.includes("phaseBurst")) drawPhaseBurstModule(context);
    if (active.includes("voidField")) drawVoidFieldAmplifier(context);
  }

  function drawStarforgedHull(context) {
    context.save();
    context.fillStyle = "#d9b56b";
    drawPath(context, [[-61, -15], [-49, -24], [-35, -14], [-42, 5], [-58, 10]]);
    drawPath(context, [[61, -15], [49, -24], [35, -14], [42, 5], [58, 10]]);
    context.fillStyle = "#f2dfb6";
    context.fillRect(-55, -13, 9, 17);
    context.fillRect(46, -13, 9, 17);
    context.restore();
  }

  function drawNovaCore(context) {
    context.save();
    context.fillStyle = "#f0a040";
    context.beginPath();
    context.ellipse(0, -6, 17, 21, 0, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = "#fff0bd";
    context.fillRect(-3, -22, 6, 31);
    context.restore();
  }

  function drawVoidSiphon(context) {
    context.save();
    context.strokeStyle = "#52d6bd";
    context.lineWidth = 3;
    context.globalAlpha = 0.72;
    context.beginPath();
    context.ellipse(0, 3, 82, 54, -0.08, 0, Math.PI * 2);
    context.stroke();
    context.globalAlpha = 1;
    context.fillStyle = "#52d6bd";
    context.fillRect(-73, -1, 8, 8);
    context.fillRect(65, -1, 8, 8);
    context.restore();
  }

  function drawPhaseInjector(context) {
    context.save();
    context.fillStyle = "#4fc3d6";
    context.fillRect(-33, 23, 10, 25);
    context.fillRect(23, 23, 10, 25);
    context.fillStyle = "#d9fbff";
    context.fillRect(-30, 40, 4, 13);
    context.fillRect(26, 40, 4, 13);
    context.restore();
  }

  function drawNovaLanceModule(context) {
    context.save();
    context.fillStyle = "#fff0bd";
    context.fillRect(-8, -76, 16, 22);
    context.fillStyle = "#f0a040";
    context.fillRect(-4, -84, 8, 13);
    context.restore();
  }

  function drawPhaseBurstModule(context) {
    context.save();
    context.fillStyle = "#d9fbff";
    context.fillRect(-24, -45, 5, 29);
    context.fillRect(19, -45, 5, 29);
    context.fillStyle = "#7df8ff";
    context.fillRect(-27, -50, 11, 5);
    context.fillRect(16, -50, 11, 5);
    context.restore();
  }

  function drawVoidFieldAmplifier(context) {
    context.save();
    context.strokeStyle = "#52d6bd";
    context.lineWidth = 2;
    context.globalAlpha = 0.86;
    context.beginPath();
    context.ellipse(0, 2, 94, 62, 0.04, 0, Math.PI * 2);
    context.stroke();
    context.restore();
  }

  function drawPath(context, points) {
    context.beginPath();
    context.moveTo(points[0][0], points[0][1]);
    for (let index = 1; index < points.length; index += 1) context.lineTo(points[index][0], points[index][1]);
    context.closePath();
    context.fill();
  }

  window.RelicVisual = { drawRelicFields, drawRelics };
})();
