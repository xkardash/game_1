(() => {
  const PHASE_FLASH_LIFE = 0.62;
  const ARCHETYPE_ACCENTS = {
    bulwark: "#d7a64f",
    core: "#f0a040",
    phase: "#7df8ff",
  };

  function updateFlashes(state, delta) {
    if (!state.bossPhaseFlashes) return;
    for (const flash of state.bossPhaseFlashes) flash.life -= delta;
    for (let index = state.bossPhaseFlashes.length - 1; index >= 0; index -= 1) {
      if (state.bossPhaseFlashes[index].life <= 0) state.bossPhaseFlashes.splice(index, 1);
    }
  }

  function trackPhase(state, boss, phase) {
    if (!boss.currentBossPhase) {
      boss.currentBossPhase = phase;
      return;
    }
    if (boss.currentBossPhase === phase) return;
    boss.currentBossPhase = phase;
    boss.phaseFlash = PHASE_FLASH_LIFE;
    if (!state.bossPhaseFlashes) state.bossPhaseFlashes = [];
    state.bossPhaseFlashes.push(createPhaseFlash(boss, phase));
    state.lastBossPhaseChange = { archetype: boss.bossArchetype || "core", phase };
    state.shake = Math.max(state.shake || 0, 0.16 + phase * 0.02);
  }

  function createPhaseFlash(boss, phase) {
    return {
      x: boss.x,
      y: boss.y,
      phase,
      color: getAccent(boss.bossArchetype),
      radius: 72 + phase * 12,
      life: PHASE_FLASH_LIFE,
      maxLife: PHASE_FLASH_LIFE,
    };
  }

  function getAccent(archetype = "core") {
    return ARCHETYPE_ACCENTS[archetype] || ARCHETYPE_ACCENTS.core;
  }

  window.BossPhase = { createPhaseFlash, getAccent, trackPhase, updateFlashes };
})();
