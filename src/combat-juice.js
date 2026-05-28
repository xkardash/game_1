(() => {
  const PING_PRESETS = {
    bossVolley: { color: "#e8573f", lineWidth: 4, life: 0.55, radius: 34, maxRadius: 132 },
    corePickup: { color: "#f2dfb6", lineWidth: 3, life: 0.5, radius: 14, maxRadius: 72 },
    elite: { color: "#f0b84a", lineWidth: 3, life: 0.48, radius: 18, maxRadius: 86 },
    hit: { color: "#e8573f", lineWidth: 2, life: 0.2, radius: 10, maxRadius: 34 },
    levelUp: { color: "#52b69a", lineWidth: 4, life: 0.7, radius: 24, maxRadius: 118 },
    loot: { color: "#52b69a", lineWidth: 2, life: 0.38, radius: 10, maxRadius: 48 },
    overdrivePickup: { color: "#f0a040", lineWidth: 3, life: 0.44, radius: 12, maxRadius: 62 },
    playerHit: { color: "#f2dfb6", lineWidth: 4, life: 0.36, radius: 18, maxRadius: 76 },
    repairPickup: { color: "#78d96b", lineWidth: 3, life: 0.42, radius: 12, maxRadius: 58 },
    shieldPickup: { color: "#4fc3d6", lineWidth: 3, life: 0.42, radius: 12, maxRadius: 58 },
    xp: { color: "#52b69a", lineWidth: 2, life: 0.24, radius: 8, maxRadius: 30 },
  };
  const PICKUP_KINDS = {
    core: "corePickup",
    overdrive: "overdrivePickup",
    repair: "repairPickup",
    shield: "shieldPickup",
  };

  function addPing(state, kind, x, y, options = {}) {
    if (!state.combatPings) state.combatPings = [];
    const preset = { ...PING_PRESETS.loot, ...(PING_PRESETS[kind] || {}), ...options };
    const ping = {
      kind,
      x,
      y,
      color: preset.color,
      life: preset.life,
      maxLife: preset.life,
      lineWidth: preset.lineWidth,
      radius: preset.radius,
      startRadius: preset.radius,
      maxRadius: preset.maxRadius,
    };
    state.combatPings.push(ping);
    return ping;
  }

  function addPickupPing(state, pickup) {
    return addPing(state, PICKUP_KINDS[pickup.type] || "loot", pickup.x, pickup.y);
  }

  function addBossVolleyWarning(state, boss, phase = 1) {
    return addPing(state, "bossVolley", boss.x, boss.y, {
      maxRadius: 98 + phase * 18,
      lineWidth: 2 + phase,
    });
  }

  function addEliteSpawnPing(state, enemy) {
    return addPing(state, "elite", enemy.x, enemy.y, {
      color: enemy.affix === "coreCarrier" ? "#f2dfb6" : "#f0b84a",
    });
  }

  function addLevelUpPing(state, player) {
    return addPing(state, "levelUp", player.x, player.y);
  }

  function addPlayerHitPing(state, player) {
    return addPing(state, "playerHit", player.x, player.y);
  }

  function addXpPing(state, gem) {
    return addPing(state, "xp", gem.x, gem.y);
  }

  function updatePings(state, delta) {
    if (!state.combatPings) return;
    for (const ping of state.combatPings) {
      ping.life -= delta;
      const progress = 1 - Math.max(0, ping.life) / ping.maxLife;
      ping.radius = ping.startRadius + (ping.maxRadius - ping.startRadius) * progress;
    }
    for (let index = state.combatPings.length - 1; index >= 0; index -= 1) {
      if (state.combatPings[index].life <= 0) state.combatPings.splice(index, 1);
    }
  }

  window.CombatJuice = {
    addBossVolleyWarning,
    addEliteSpawnPing,
    addLevelUpPing,
    addPickupPing,
    addPing,
    addPlayerHitPing,
    addXpPing,
    updatePings,
  };
})();
