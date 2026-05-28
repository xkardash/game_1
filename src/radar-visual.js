(() => {
  const COLORS = {
    boss: "#e8573f",
    elite: "#f0a040",
    enemy: "#d7a64f",
    loot: "#52d6bd",
    player: "#f2dfb6",
  };

  function drawRadar(context, state, world, viewport) {
    const size = 118;
    const x = viewport.width - size - 18;
    const y = 18;
    context.save();
    context.translate(x, y);
    context.fillStyle = "rgba(7, 16, 15, 0.72)";
    context.fillRect(0, 0, size, size);
    context.strokeStyle = "rgba(242, 223, 182, 0.38)";
    context.lineWidth = 2;
    context.strokeRect(0, 0, size, size);
    for (const blip of window.RadarSystem.getBlips(state, world, size)) drawBlip(context, blip);
    context.restore();
  }

  function drawBlip(context, blip) {
    context.fillStyle = COLORS[blip.kind] || COLORS.enemy;
    if (blip.kind === "player") {
      context.fillRect(blip.x - 3, blip.y - 3, 6, 6);
    } else {
      context.beginPath();
      context.arc(blip.x, blip.y, blip.kind === "boss" ? 4 : 2.6, 0, Math.PI * 2);
      context.fill();
    }
  }

  window.RadarVisual = { drawRadar };
})();
