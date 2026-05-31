(() => {
  const LOOT_DEFS = {
    core: { accent: "#f2dfb6", color: "#52d6bd", size: 22 },
    overdrive: { accent: "#f2dfb6", color: "#f0a040", size: 18 },
    repair: { accent: "#f2dfb6", color: "#78d96b", size: 18 },
    shield: { accent: "#d9fbff", color: "#4fc3d6", size: 18 },
  };

  function createLootItem(type, x, y) {
    const def = LOOT_DEFS[type] || LOOT_DEFS.shield;
    return {
      type,
      x,
      y,
      width: def.size,
      height: def.size,
      size: def.size,
      color: def.color,
      accent: def.accent,
      life: 16,
      pulse: 0,
    };
  }

  function dropLoot(state, enemy) {
    const type = enemy.affix === "coreCarrier" ? "core" : getDropType(enemy);
    const bonusType = type || getLuckDropType(state.player);
    if (bonusType) state.lootDrops.push(createLootItem(bonusType, enemy.x, enemy.y));
  }

  function updateLootDrops(state, delta) {
    for (const loot of state.lootDrops) {
      loot.pulse = (loot.pulse || 0) + delta * 5.5;
      loot.life = (loot.life ?? 16) - delta;
      pullLootTowardPlayer(state.player, loot, delta);
    }
    state.lootDrops = state.lootDrops.filter((loot) => loot.life > 0);
  }

  function updateCoreSynergies(state, effects, delta, destroyEnemy) {
    updateBurningEnemies(state, effects, delta, destroyEnemy);
    updateTimedList(state.chainArcs || [], delta);
    window.RelicSynergy?.updateCombatFields?.(state, effects, delta, destroyEnemy);
  }

  function applyBulletSynergies(state, bullet, enemy, effects, destroyEnemy = null) {
    if (bullet.burnTime > 0) igniteEnemy(enemy, bullet);
    if (bullet.chainsLeft > 0) arcToNearbyEnemy(state, bullet, enemy, effects);
    window.RelicSynergy?.applyBulletImpact?.(state, bullet, enemy, effects, destroyEnemy);
  }

  function collectLootDrops(state, grantXp, grantCore = () => {}, onCollect = () => {}) {
    for (const loot of [...state.lootDrops]) {
      if (getDistance(state.player, loot) < 26) {
        state.lootDrops = state.lootDrops.filter((item) => item !== loot);
        applyLoot(state.player, loot, grantXp, grantCore);
        onCollect(loot);
      }
    }
  }

  function applyLoot(player, loot, grantXp, grantCore) {
    if (loot.type === "shield") player.shields = Math.min(4, (player.shields || 0) + 1);
    if (loot.type === "overdrive") {
      player.overdrive = Math.max(player.overdrive || 0, 6);
      window.OverdriveSystem?.addCharge?.(player, 26);
    }
    if (loot.type === "repair") player.lives = Math.min(player.maxLives || 5, player.lives + 1);
    if (loot.type === "core") {
      player.lootCores = (player.lootCores || 0) + 1;
      player.overdrive = Math.max(player.overdrive || 0, 4);
      window.OverdriveSystem?.addCharge?.(player, 18);
      grantCore(1 + Math.floor((player.coreDropBonus || 0) / 2));
      grantXp(3);
    }
  }

  function updatePlayerTimers(player, delta) {
    player.overdrive = Math.max(0, (player.overdrive || 0) - delta);
  }

  function absorbShield(player) {
    if ((player.shields || 0) <= 0) return false;
    player.shields -= 1;
    player.invulnerable = 0.55;
    return true;
  }

  function getFireCooldown(player) {
    const overdriveScale = player.overdrive > 0 ? 0.52 : 1;
    const coreScale = Math.max(0.82, 1 - (player.lootCores || 0) * 0.04);
    return Math.max(0.08, player.stats.fireRate * overdriveScale * coreScale);
  }

  function getDropType(enemy) {
    if (enemy.type === "boss") return "core";
    if (enemy.type === "tank") return "shield";
    if (enemy.type === "sniper") return "overdrive";
    if (enemy.type === "bomber") return "repair";
    return null;
  }

  function getLuckDropType(player) {
    const lootLuck = player?.itemEffects?.lootLuck || 0;
    if (lootLuck <= 0 || Math.random() >= lootLuck) return null;
    const deck = ["shield", "overdrive", "repair"];
    return deck[Math.floor(Math.random() * deck.length)];
  }

  function igniteEnemy(enemy, bullet) {
    enemy.burnTime = Math.max(enemy.burnTime || 0, bullet.burnTime);
    enemy.burnDamage = Math.max(enemy.burnDamage || 0, bullet.burnDamage);
    enemy.burnPulse = 0;
  }

  function arcToNearbyEnemy(state, bullet, enemy, effects) {
    const target = getChainTarget(state, enemy, bullet.chainRange);
    if (!target) return;
    bullet.chainsLeft -= 1;
    target.hp -= bullet.chainDamage;
    target.flash = 0.14;
    state.chainArcs.push({
      x1: enemy.x,
      y1: enemy.y,
      x2: target.x,
      y2: target.y,
      life: 0.18,
      maxLife: 0.18,
    });
    effects.emitParticles(state, target.x, target.y, "#5ee6cf", 8, { life: 0.2, size: 2 });
  }

  function updateBurningEnemies(state, effects, delta, destroyEnemy) {
    for (const enemy of [...state.enemies]) {
      if ((enemy.burnTime || 0) <= 0) continue;
      enemy.burnTime = Math.max(0, enemy.burnTime - delta);
      enemy.burnPulse = (enemy.burnPulse || 0) + delta;
      enemy.hp -= (enemy.burnDamage || 0) * delta;
      if (enemy.burnPulse >= 0.18) {
        enemy.burnPulse = 0;
        effects.emitParticles(state, enemy.x, enemy.y, "#f0a040", 3, { life: 0.18, size: 2 });
      }
      if (enemy.hp <= 0 && destroyEnemy) destroyEnemy(enemy);
    }
  }

  function getChainTarget(state, source, range) {
    let nearest = null;
    let nearestDistance = range;
    for (const enemy of state.enemies) {
      if (enemy === source) continue;
      const distance = getDistance(source, enemy);
      if (distance <= nearestDistance) {
        nearest = enemy;
        nearestDistance = distance;
      }
    }
    return nearest;
  }

  function updateTimedList(items, delta) {
    for (const item of items) item.life -= delta;
    for (let index = items.length - 1; index >= 0; index -= 1) {
      if (items[index].life <= 0) items.splice(index, 1);
    }
  }

  function pullLootTowardPlayer(player, loot, delta) {
    const distance = getDistance(player, loot);
    if (distance > player.stats.magnet + 26 || distance < 1) return;
    loot.x += ((player.x - loot.x) / distance) * 250 * delta;
    loot.y += ((player.y - loot.y) / distance) * 250 * delta;
  }

  function getDistance(first, second) {
    return Math.hypot(first.x - second.x, first.y - second.y);
  }

  window.LootSystem = {
    absorbShield,
    applyBulletSynergies,
    collectLootDrops,
    createLootItem,
    dropLoot,
    getFireCooldown,
    updateCoreSynergies,
    updateLootDrops,
    updatePlayerTimers,
  };
})();
