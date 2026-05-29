(() => {
  const BOSS_LABELS = {
    bulwark: { title: "BULWARK CRUISER", role: "Siege armor" },
    core: { title: "CORE DREADNOUGHT", role: "Reactor hazard" },
    phase: { title: "PHASE INTERCEPTOR", role: "Blink assault" },
  };
  const BOSS_ACCENTS = {
    bulwark: "#d7a64f",
    core: "#f0a040",
    phase: "#7df8ff",
  };
  const PHASE_LABELS = { 1: "FAZ I", 2: "FAZ II", 3: "FAZ III" };

  function getBossHudModel(boss) {
    const archetype = boss.bossArchetype || "core";
    const label = BOSS_LABELS[archetype] || BOSS_LABELS.core;
    const phase = window.BossSystem?.getBossPhase?.(boss) || getPhaseFallback(boss);
    return {
      ...label,
      accent: window.BossPhase?.getAccent?.(archetype) || BOSS_ACCENTS[archetype] || BOSS_ACCENTS.core,
      phase,
      phaseLabel: PHASE_LABELS[phase],
      hpRatio: clamp((boss.hp || 0) / (boss.maxHp || 1), 0, 1),
    };
  }

  function drawBossHud(context, state, viewport) {
    const boss = (state.enemies || []).find((enemy) => enemy.type === "boss");
    if (!boss) return;
    const model = getBossHudModel(boss);
    const width = Math.min(300, viewport.width - 96);
    const x = Math.round((viewport.width - width) / 2);
    const y = 26;
    context.save();
    drawHudPanel(context, x, y, width, model);
    drawPhaseChips(context, x, y, width, model);
    context.restore();
  }

  function drawBossPhaseFlashes(context, state) {
    for (const flash of state.bossPhaseFlashes || []) {
      const alpha = Math.max(0, flash.life / flash.maxLife);
      context.save();
      context.globalAlpha = 0.16 + alpha * 0.52;
      context.strokeStyle = flash.color;
      context.lineWidth = 2 + flash.phase;
      context.beginPath();
      context.arc(flash.x, flash.y, flash.radius, 0, Math.PI * 2);
      context.stroke();
      context.restore();
    }
  }

  function drawHudPanel(context, x, y, width, model) {
    context.globalAlpha = 0.82;
    context.fillStyle = "#07100f";
    context.fillRect(x - 18, y - 18, width + 36, 62);
    context.globalAlpha = 1;
    context.strokeStyle = model.accent;
    context.lineWidth = 2;
    context.strokeRect(x - 18, y - 18, width + 36, 62);
    context.fillStyle = "#f2dfb6";
    context.font = "14px sans-serif";
    context.textAlign = "center";
    context.fillText(model.title, x + width / 2, y - 1);
    context.fillStyle = model.accent;
    context.font = "11px sans-serif";
    context.fillText(`${model.role} / ${model.phaseLabel}`, x + width / 2, y + 16);
    context.fillText(model.phaseLabel, x + 34, y + 37);
    context.fillStyle = "#17130f";
    context.fillRect(x, y + 12, width, 10);
    context.fillStyle = model.accent;
    context.fillRect(x + 2, y + 14, Math.max(0, width - 4) * model.hpRatio, 6);
  }

  function drawPhaseChips(context, x, y, width, model) {
    const chipWidth = 28;
    const start = x + width - chipWidth * 3 - 8;
    for (let phase = 1; phase <= 3; phase += 1) {
      context.globalAlpha = phase <= model.phase ? 1 : 0.28;
      context.fillStyle = phase === model.phase ? model.accent : "#3d5368";
      context.fillRect(start + (phase - 1) * chipWidth, y + 28, 20, 5);
    }
    context.globalAlpha = 1;
  }

  function getPhaseFallback(boss) {
    const ratio = boss.hp / boss.maxHp;
    if (ratio <= 0.3) return 3;
    if (ratio <= 0.65) return 2;
    return 1;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  window.BossUi = { drawBossHud, drawBossPhaseFlashes, getBossHudModel };
})();
