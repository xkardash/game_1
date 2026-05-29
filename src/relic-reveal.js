(() => {
  const REVEAL_LIFE = 0.78;
  const BURST_LIFE = 0.62;
  const REVEAL_PROFILES = {
    bulwark: { color: "#d7a64f", label: "ARMOR VAULT" },
    core: { color: "#f0a040", label: "CORE CACHE" },
    phase: { color: "#7df8ff", label: "PHASE CACHE" },
  };

  function start(state, boss) {
    const profile = getProfile(boss.bossArchetype);
    state.phase = "relicReveal";
    state.relicChoices = [];
    state.upgradeChoices = [];
    state.relicReveal = {
      x: boss.x,
      y: boss.y,
      archetype: boss.bossArchetype || "core",
      label: profile.label,
      color: profile.color,
      life: REVEAL_LIFE,
      maxLife: REVEAL_LIFE,
      opened: false,
    };
    if (!state.relicRevealBursts) state.relicRevealBursts = [];
    state.relicRevealBursts.push(createBurst(state.relicReveal));
    state.shake = Math.max(state.shake || 0, 0.18);
  }

  function update(state, delta, openRelicChoice) {
    updateBursts(state, delta);
    if (!state.relicReveal || state.relicReveal.opened) return;
    state.relicReveal.life -= delta;
    if (state.relicReveal.life > 0) return;
    state.relicReveal.opened = true;
    state.relicReveal = null;
    openRelicChoice();
  }

  function drawWorld(context, state) {
    for (const burst of state.relicRevealBursts || []) {
      const alpha = Math.max(0, burst.life / burst.maxLife);
      context.save();
      context.globalAlpha = 0.18 + alpha * 0.6;
      context.strokeStyle = burst.color;
      context.lineWidth = 3;
      context.beginPath();
      context.arc(burst.x, burst.y, burst.radius, 0, Math.PI * 2);
      context.stroke();
      drawBurstSparks(context, burst);
      context.restore();
    }
  }

  function drawScreen(context, state, viewport) {
    if (!state.relicReveal) return;
    const reveal = state.relicReveal;
    const progress = 1 - Math.max(0, reveal.life) / reveal.maxLife;
    const width = Math.min(240, viewport.width - 96);
    const x = Math.round((viewport.width - width) / 2);
    const y = 82;
    context.save();
    context.globalAlpha = 0.78 + progress * 0.18;
    context.fillStyle = "#07100f";
    context.fillRect(x, y, width, 28);
    context.strokeStyle = reveal.color;
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(x, y);
    context.lineTo(x + width, y);
    context.lineTo(x + width - 18, y + 28);
    context.lineTo(x + 18, y + 28);
    context.lineTo(x, y);
    context.stroke();
    context.fillStyle = "#f2dfb6";
    context.font = "12px sans-serif";
    context.textAlign = "center";
    context.fillText("RELIC SIGNAL", x + width / 2, y + 11);
    context.fillStyle = reveal.color;
    context.fillText(reveal.label || getProfile(reveal.archetype).label, x + width / 2, y + 24);
    context.restore();
  }

  function createBurst(reveal) {
    return {
      x: reveal.x,
      y: reveal.y,
      color: reveal.color,
      radius: 112,
      life: BURST_LIFE,
      maxLife: BURST_LIFE,
    };
  }

  function drawBurstSparks(context, burst) {
    context.globalAlpha *= 0.72;
    for (let index = 0; index < 10; index += 1) {
      const angle = (Math.PI * 2 * index) / 10;
      const inner = burst.radius * 0.46;
      const outer = burst.radius * 0.92;
      context.beginPath();
      context.moveTo(burst.x + Math.cos(angle) * inner, burst.y + Math.sin(angle) * inner);
      context.lineTo(burst.x + Math.cos(angle) * outer, burst.y + Math.sin(angle) * outer);
      context.stroke();
    }
  }

  function updateBursts(state, delta) {
    if (!state.relicRevealBursts) return;
    for (const burst of state.relicRevealBursts) burst.life -= delta;
    for (let index = state.relicRevealBursts.length - 1; index >= 0; index -= 1) {
      if (state.relicRevealBursts[index].life <= 0) state.relicRevealBursts.splice(index, 1);
    }
  }

  function getProfile(archetype = "core") {
    return REVEAL_PROFILES[archetype] || REVEAL_PROFILES.core;
  }

  window.RelicReveal = { drawScreen, drawWorld, getProfile, start, update };
})();
