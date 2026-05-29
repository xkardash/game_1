(() => {
  const MAX_CHARGE = 100;
  const ACTIVE_DURATION = 5.2;
  const BURST_LIFE = 0.5;
  const MODES = {
    nova: { color: "#f0a040", damage: 9, label: "NOVA", radius: 190, title: "Nova Overdrive" },
    phase: { color: "#7df8ff", damage: 4, label: "PHASE", radius: 142, title: "Phase Overdrive" },
    surge: { color: "#f2dfb6", damage: 3, label: "SURGE", radius: 132, title: "Surge Overdrive" },
    void: { color: "#52d6bd", damage: 3.2, label: "VOID", radius: 170, title: "Void Overdrive" },
  };

  function addCharge(player, amount) {
    ensureChargeFields(player);
    player.overdriveCharge = clamp(player.overdriveCharge + amount, 0, player.overdriveMax);
    player.overdriveReady = isReady(player);
    return player.overdriveCharge;
  }

  function gainFromKill(state, enemy) {
    if (!state?.player || !enemy) return 0;
    const amount = enemy.type === "boss" ? 100 : (enemy.captain ? 20 : (enemy.elite ? 14 : 7));
    return addCharge(state.player, amount);
  }

  function activate(state, effects = {}, destroyEnemy = () => {}) {
    const player = state.player;
    ensureChargeFields(player);
    if (!isReady(player)) return null;
    const mode = getMode(player);
    player.overdriveCharge = 0;
    player.overdriveReady = false;
    player.overdrive = Math.max(player.overdrive || 0, ACTIVE_DURATION);
    player.activeOverdriveMode = mode.id;
    player.overdrivePulseCooldown = 0;
    state.lastOverdrive = { mode: mode.id, title: mode.title };
    state.overdriveBursts = state.overdriveBursts || [];
    state.overdriveBursts.push(createBurst(player.x, player.y, mode));
    state.shake = Math.max(state.shake || 0, 0.28);
    effects.emitParticles?.(state, player.x, player.y, mode.color, 30, { life: 0.42, size: 4, spread: 290 });
    if (mode.id === "nova") damageEnemiesInRadius(state, player, mode.radius, mode.damage + player.stats.damage, effects, destroyEnemy, mode.color);
    return { mode: mode.id, title: mode.title };
  }

  function update(state, delta, effects = {}, destroyEnemy = () => {}) {
    updateBursts(state, delta);
    const player = state.player;
    if (!player || (player.overdrive || 0) <= 0) {
      if (player) player.activeOverdriveMode = "";
      return;
    }
    if (player.activeOverdriveMode !== "void") return;
    player.overdrivePulseCooldown = Math.max(0, (player.overdrivePulseCooldown || 0) - delta);
    if (player.overdrivePulseCooldown > 0) return;
    player.overdrivePulseCooldown = 0.38;
    const mode = MODES.void;
    const radius = Math.max(mode.radius, Math.min(player.stats.magnet || mode.radius, 220));
    state.overdriveBursts = state.overdriveBursts || [];
    state.overdriveBursts.push(createBurst(player.x, player.y, { ...mode, radius }));
    damageEnemiesInRadius(state, player, radius, mode.damage, effects, destroyEnemy, mode.color);
  }

  function drawWorld(context, state) {
    for (const burst of state.overdriveBursts || []) {
      const alpha = Math.max(0, burst.life / burst.maxLife);
      context.save();
      context.globalAlpha = 0.16 + alpha * 0.56;
      context.strokeStyle = burst.color;
      context.lineWidth = 3;
      context.beginPath();
      context.arc(burst.x, burst.y, burst.radius, 0, Math.PI * 2);
      context.stroke();
      context.restore();
    }
  }

  function drawHud(context, state, viewport) {
    if (!state.player) return;
    const player = state.player;
    const mode = getMode(player);
    const ratio = getChargeRatio(player);
    const width = 240;
    const x = Math.round((viewport.width - width) / 2);
    const y = viewport.height - 38;
    context.save();
    context.globalAlpha = 0.86;
    context.fillStyle = "#07100f";
    context.fillRect(x, y, width, 10);
    context.strokeStyle = mode.color;
    context.lineWidth = 2;
    context.strokeRect(x, y, width, 10);
    context.fillStyle = mode.color;
    context.fillRect(x + 2, y + 2, Math.max(0, width - 4) * ratio, 6);
    context.fillStyle = "#f2dfb6";
    context.font = "11px sans-serif";
    context.textAlign = "center";
    context.fillText("OVERDRIVE", x + 52, y - 5);
    context.fillStyle = mode.color;
    context.fillText(isReady(player) ? `${mode.label} READY` : mode.label, x + width - 42, y - 5);
    context.restore();
  }

  function getMode(player) {
    if (hasRelic(player, "novaCore") && hasUpgrade(player, "damage")) return { id: "nova", ...MODES.nova };
    if (hasRelic(player, "phaseInjector") && hasUpgrade(player, "rapid")) return { id: "phase", ...MODES.phase };
    if (hasRelic(player, "voidSiphon") && hasUpgrade(player, "magnet")) return { id: "void", ...MODES.void };
    return { id: "surge", ...MODES.surge };
  }

  function isReady(player) {
    ensureChargeFields(player);
    return player.overdriveCharge >= player.overdriveMax;
  }

  function getChargeRatio(player) {
    ensureChargeFields(player);
    return player.overdriveMax <= 0 ? 0 : player.overdriveCharge / player.overdriveMax;
  }

  function createBurst(x, y, mode) {
    return {
      x,
      y,
      color: mode.color,
      radius: mode.radius,
      life: BURST_LIFE,
      maxLife: BURST_LIFE,
    };
  }

  function damageEnemiesInRadius(state, source, radius, damage, effects, destroyEnemy, color) {
    for (const enemy of [...(state.enemies || [])]) {
      if (getDistance(source, enemy) > radius) continue;
      enemy.hp -= damage;
      enemy.flash = 0.18;
      effects.emitParticles?.(state, enemy.x, enemy.y, color, 8, { life: 0.24, size: 3 });
      if (enemy.hp <= 0) destroyEnemy(enemy);
    }
  }

  function updateBursts(state, delta) {
    if (!state.overdriveBursts) return;
    for (const burst of state.overdriveBursts) burst.life -= delta;
    for (let index = state.overdriveBursts.length - 1; index >= 0; index -= 1) {
      if (state.overdriveBursts[index].life <= 0) state.overdriveBursts.splice(index, 1);
    }
  }

  function ensureChargeFields(player) {
    player.overdriveMax = player.overdriveMax || MAX_CHARGE;
    player.overdriveCharge = clamp(player.overdriveCharge || 0, 0, player.overdriveMax);
  }

  function hasRelic(player, relicId) {
    return (player.relics || []).includes(relicId);
  }

  function hasUpgrade(player, upgradeId) {
    return (player.upgrades || []).includes(upgradeId);
  }

  function getDistance(first, second) {
    return Math.hypot(first.x - second.x, first.y - second.y);
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  window.OverdriveSystem = {
    activate,
    addCharge,
    drawHud,
    drawWorld,
    gainFromKill,
    getChargeRatio,
    getMode,
    isReady,
    update,
  };
})();
