(() => {
  function drawCombatPings(context, state) {
    for (const ping of state.combatPings || []) {
      const alpha = Math.max(0, ping.life / ping.maxLife);
      context.save();
      context.globalAlpha = alpha * 0.8;
      context.strokeStyle = ping.color;
      context.lineWidth = ping.lineWidth;
      context.beginPath();
      context.arc(ping.x, ping.y, ping.radius, 0, Math.PI * 2);
      context.stroke();
      if (ping.kind === "bossVolley") drawWarningTicks(context, ping);
      context.restore();
    }
  }

  function drawBossTelegraphs(context, state) {
    for (const telegraph of state.bossTelegraphs || []) {
      const alpha = Math.max(0, telegraph.life / telegraph.maxLife);
      context.save();
      context.globalAlpha = 0.28 + alpha * 0.54;
      context.strokeStyle = telegraph.color;
      context.lineWidth = telegraph.lineWidth;
      context.beginPath();
      context.arc(telegraph.x, telegraph.y, telegraph.radius, 0, Math.PI * 2);
      context.stroke();
      drawTelegraphMarks(context, telegraph);
      context.restore();
    }
  }

  function drawWarningTicks(context, ping) {
    context.globalAlpha *= 0.72;
    const count = ping.marks || 8;
    for (let index = 0; index < count; index += 1) {
      const angle = (Math.PI * 2 * index) / count;
      const inner = ping.radius * 0.72;
      const outer = ping.radius;
      context.beginPath();
      context.moveTo(ping.x + Math.cos(angle) * inner, ping.y + Math.sin(angle) * inner);
      context.lineTo(ping.x + Math.cos(angle) * outer, ping.y + Math.sin(angle) * outer);
      context.stroke();
    }
  }

  function drawTelegraphMarks(context, telegraph) {
    if (telegraph.pattern === "phaseStrafe") {
      drawPhaseTelegraph(context, telegraph);
      return;
    }
    if (telegraph.pattern === "coreMineRing") {
      drawCoreTelegraph(context, telegraph);
      return;
    }
    drawWarningTicks(context, telegraph);
  }

  function drawPhaseTelegraph(context, telegraph) {
    context.globalAlpha *= 0.76;
    const spread = telegraph.radius * 0.82;
    context.beginPath();
    context.moveTo(telegraph.x - spread, telegraph.y - 18);
    context.lineTo(telegraph.x + spread, telegraph.y + 18);
    context.moveTo(telegraph.x - spread, telegraph.y + 18);
    context.lineTo(telegraph.x + spread, telegraph.y - 18);
    context.stroke();
  }

  function drawCoreTelegraph(context, telegraph) {
    context.globalAlpha *= 0.68;
    context.beginPath();
    context.arc(telegraph.x, telegraph.y, telegraph.radius * 0.68, 0, Math.PI * 2);
    context.stroke();
    drawWarningTicks(context, telegraph);
  }

  window.JuiceVisual = { drawBossTelegraphs, drawCombatPings };
})();
