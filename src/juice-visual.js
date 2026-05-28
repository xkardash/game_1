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

  function drawWarningTicks(context, ping) {
    context.globalAlpha *= 0.72;
    for (let index = 0; index < 8; index += 1) {
      const angle = (Math.PI * 2 * index) / 8;
      const inner = ping.radius * 0.72;
      const outer = ping.radius;
      context.beginPath();
      context.moveTo(ping.x + Math.cos(angle) * inner, ping.y + Math.sin(angle) * inner);
      context.lineTo(ping.x + Math.cos(angle) * outer, ping.y + Math.sin(angle) * outer);
      context.stroke();
    }
  }

  window.JuiceVisual = { drawCombatPings };
})();
