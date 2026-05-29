(() => {
  const FORMATION_CADENCE = 7;
  const MIN_FORMATION_WAVE = 4;
  const MIN_OPEN_SLOTS = 4;
  const CAPTAIN_WAVE = 6;
  const FORMATIONS = {
    pincer: [
      { slot: "front", type: "tank", forward: 62, side: 0 },
      { slot: "left-wing", type: "scout", forward: 8, side: -92 },
      { slot: "right-wing", type: "scout", forward: 8, side: 92 },
      { slot: "rear-sniper", type: "sniper", forward: -86, side: 0 },
    ],
    commandWing: [
      { captain: true, slot: "captain", type: "tank", forward: 0, side: 0 },
      { slot: "front-guard", type: "tank", forward: 74, side: 0 },
      { slot: "left-bomber", type: "bomber", forward: 8, side: -118 },
      { slot: "right-scout", type: "scout", forward: 12, side: 118 },
      { slot: "left-sniper", type: "sniper", forward: -92, side: -58 },
      { slot: "right-sniper", type: "sniper", forward: -92, side: 58 },
    ],
  };

  function shouldSpawnFormation(wave, spawnIndex, openSlots) {
    return wave >= MIN_FORMATION_WAVE
      && openSlots >= MIN_OPEN_SLOTS
      && spawnIndex > 0
      && spawnIndex % FORMATION_CADENCE === 0;
  }

  function createFormation({ rules, world, wave, player, viewport, spawnIndex, capacity = Infinity }) {
    const profile = getFormationProfile(wave);
    const anchor = getFormationAnchor(world, player, viewport, spawnIndex);
    const forward = getUnitVector(anchor, player);
    const right = { x: -forward.y, y: forward.x };
    const formationId = `${profile.id}-${wave}-${spawnIndex}`;
    return profile.slots.slice(0, capacity).map((slot, index) => {
      const enemy = rules.createEnemy(world, wave, slot.type, player, viewport);
      const position = projectSlot(anchor, forward, right, slot, world);
      Object.assign(enemy, {
        ...position,
        formationId,
        formationSlot: slot.slot,
        formationType: profile.id,
      });
      if (slot.captain) makeCaptain(enemy, wave);
      enemy.formationOrder = index;
      return enemy;
    });
  }

  function getFormationProfile(wave) {
    if (wave >= CAPTAIN_WAVE) return { id: "commandWing", slots: FORMATIONS.commandWing };
    return { id: "pincer", slots: FORMATIONS.pincer };
  }

  function makeCaptain(enemy, wave) {
    const hpBonus = 6 + Math.floor(wave / 3);
    enemy.captain = true;
    enemy.captainAura = { range: 220, speedScale: 1.18 };
    enemy.affixColor = "#f2dfb6";
    enemy.hp += hpBonus;
    enemy.maxHp += hpBonus;
    enemy.score += 260;
    enemy.xp += 2;
    enemy.width += 6;
    enemy.height += 4;
    return enemy;
  }

  function getFormationAnchor(world, player, viewport, spawnIndex) {
    const side = spawnIndex % 4;
    const margin = 130;
    if (side === 0) return {
      x: clamp(player.x, 36, world.width - 36),
      y: clamp(player.y - viewport.height / 2 - margin, 36, world.height - 36),
    };
    if (side === 1) return {
      x: clamp(player.x + viewport.width / 2 + margin, 36, world.width - 36),
      y: clamp(player.y, 36, world.height - 36),
    };
    if (side === 2) return {
      x: clamp(player.x, 36, world.width - 36),
      y: clamp(player.y + viewport.height / 2 + margin, 36, world.height - 36),
    };
    return {
      x: clamp(player.x - viewport.width / 2 - margin, 36, world.width - 36),
      y: clamp(player.y, 36, world.height - 36),
    };
  }

  function projectSlot(anchor, forward, right, slot, world) {
    return {
      x: clamp(anchor.x + forward.x * slot.forward + right.x * slot.side, 24, world.width - 24),
      y: clamp(anchor.y + forward.y * slot.forward + right.y * slot.side, 24, world.height - 24),
    };
  }

  function getUnitVector(from, to) {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const length = Math.hypot(dx, dy) || 1;
    return { x: dx / length, y: dy / length };
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  window.EnemyFormation = { createFormation, getFormationProfile, shouldSpawnFormation };
})();
