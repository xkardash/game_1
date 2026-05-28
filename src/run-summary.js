(() => {
  const WEAPON_LABELS = {
    droneSupport: "Drone Support",
    piercingLaser: "Piercing Laser",
    standard: "Standart Top",
    twinPlasma: "Twin Plasma",
  };

  function createRunStats() {
    return {
      seconds: 0,
      kills: 0,
      bosses: 0,
      elites: 0,
      cores: 0,
      maxWave: 1,
      maxLevel: 1,
      bestEvolution: "standard",
    };
  }

  function updateRunStats(stats, state, delta) {
    if (state.phase === "playing") stats.seconds += delta;
    stats.maxWave = Math.max(stats.maxWave, state.wave || 1);
    stats.maxLevel = Math.max(stats.maxLevel, state.level || 1);
    if (state.player) {
      const evolution = window.WeaponEvolution?.getWeaponEvolution?.(state.player);
      if (evolution?.id && evolution.id !== "standard") stats.bestEvolution = evolution.id;
    }
  }

  function recordKill(stats, enemy) {
    stats.kills += 1;
    if (enemy.type === "boss") stats.bosses += 1;
    if (enemy.elite) stats.elites += 1;
  }

  function recordCore(stats, amount) {
    stats.cores += amount;
  }

  function createSummary(state, stats) {
    const weapon = WEAPON_LABELS[stats.bestEvolution] || stats.bestEvolution;
    const summary = {
      score: state.score,
      best: state.highScore,
      time: formatTime(stats.seconds),
      wave: stats.maxWave,
      level: stats.maxLevel,
      kills: stats.kills,
      bosses: stats.bosses,
      elites: stats.elites,
      cores: stats.cores,
      weapon,
    };
    summary.lines = createSummaryLines(summary);
    return summary;
  }

  function createSummaryLines(summary) {
    return [
      `Sure ${summary.time}`,
      `Dalga ${summary.wave} / Seviye ${summary.level}`,
      `Imha ${summary.kills} / Boss ${summary.bosses}`,
      `Elite ${summary.elites} / Core ${summary.cores}`,
      `Silah ${summary.weapon}`,
    ];
  }

  function formatTime(seconds) {
    const totalSeconds = Math.max(0, Math.floor(seconds));
    const minutes = Math.floor(totalSeconds / 60);
    return `${minutes}:${String(totalSeconds % 60).padStart(2, "0")}`;
  }

  window.RunSummary = {
    createRunStats,
    createSummary,
    createSummaryLines,
    formatTime,
    recordCore,
    recordKill,
    updateRunStats,
  };
})();
