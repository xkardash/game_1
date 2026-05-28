(() => {
  const UPGRADE_POOL = [
    { id: "rapid", title: "Seri Lazer", body: "Ates hizi artar.", stat: "fireRate", amount: -0.045 },
    { id: "split", title: "Cift Namlu", body: "Bir mermi daha cikar.", stat: "projectileCount", amount: 1 },
    { id: "damage", title: "Plazma Basinc", body: "Mermi hasari artar.", stat: "damage", amount: 1 },
    { id: "engine", title: "Iyon Motoru", body: "Mekik daha hizli gider.", stat: "speed", amount: 34 },
    { id: "magnet", title: "Cekim Alani", body: "XP daha uzaktan toplanir.", stat: "magnet", amount: 26 },
    { id: "repair", title: "Tamir Kiti", body: "Can yenilenir.", stat: "repair", amount: 1 },
  ];
  const WEAPON_UPGRADES = new Set(["damage", "rapid", "split"]);
  const ENEMY_ROLES = {
    bomber: { width: 42, height: 38, hp: 3, speed: 104, xp: 2, score: 120, pulseRate: 6.8, blastRadius: 118 },
    scout: { width: 34, height: 30, hp: 2, speed: 138, xp: 1, score: 70, pulseRate: 7.4 },
    sniper: { width: 42, height: 34, hp: 3, speed: 74, xp: 2, score: 130, pulseRate: 4.8, fireRate: 1.55, preferredRange: 285 },
    tank: { width: 58, height: 48, hp: 7, speed: 58, xp: 3, score: 190, pulseRate: 3.8 },
  };
  const ROLE_SEQUENCE = ["scout", "tank", "sniper", "bomber"];
  const weaponEvolution = window.WeaponEvolution;
  let nextEnemyId = 1;

  function createPlayer(world, shipType = "aegis") {
    const isDreadnought = shipType === "dreadnought";
    return {
      x: world.width / 2,
      y: world.height / 2,
      width: 64,
      height: 56,
      speed: isDreadnought ? 250 : 315,
      lives: 3,
      cooldown: 0,
      invulnerable: 0,
      lootCores: 0,
      overdrive: 0,
      shields: isDreadnought ? 1 : 0,
      shipType,
      stats: {
        damage: isDreadnought ? 2 : 1,
        fireRate: isDreadnought ? 0.38 : 0.28,
        projectileCount: 1,
        magnet: 58
      },
      upgrades: isDreadnought ? ["damage"] : ["rapid"],
    };
  }

  function createEnemy(world, wave, type = "horde", center = null, viewport = null) {
    const position = center && viewport ? getThreatPosition(world, center, viewport) : getEdgePosition(world);
    const isBoss = type === "boss";
    const role = isBoss ? null : ENEMY_ROLES[normalizeEnemyType(type)];
    const hp = isBoss ? 22 + wave * 6 : role.hp + Math.floor(wave / 2);
    return {
      id: nextEnemyId++,
      ...position,
      width: isBoss ? 74 : role.width,
      height: isBoss ? 66 : role.height,
      hp,
      maxHp: hp,
      speed: isBoss ? 54 + wave * 2 : role.speed + wave * 4,
      type: isBoss ? "boss" : normalizeEnemyType(type),
      xp: isBoss ? 10 + wave * 2 : role.xp,
      score: isBoss ? 1200 + wave * 160 : role.score + wave * 12,
      pulse: Math.random() * Math.PI,
      pulseRate: isBoss ? 4 : role.pulseRate,
      flash: 0,
      fireCooldown: role?.fireRate || 0.9,
      fireRate: role?.fireRate || 1.8,
      preferredRange: role?.preferredRange || 0,
      blastRadius: role?.blastRadius || 0,
      orbit: Math.random() > 0.5 ? 1 : -1,
    };
  }

  function normalizeEnemyType(type) {
    return ENEMY_ROLES[type] ? type : "scout";
  }

  function getWaveEnemyType(wave, spawnIndex) {
    if (wave < 2) return spawnIndex % 3 === 0 ? "tank" : "scout";
    return ROLE_SEQUENCE[(spawnIndex + wave) % ROLE_SEQUENCE.length];
  }

  function getEdgePosition(world) {
    const side = Math.floor(Math.random() * 4);
    if (side === 0) return { x: Math.random() * world.width, y: -28 };
    if (side === 1) return { x: world.width + 28, y: Math.random() * world.height };
    if (side === 2) return { x: Math.random() * world.width, y: world.height + 28 };
    return { x: -28, y: Math.random() * world.height };
  }

  function getThreatPosition(world, center, viewport) {
    const side = Math.floor(Math.random() * 4);
    const margin = 88;
    const spreadX = viewport.width * 0.62;
    const spreadY = viewport.height * 0.62;
    if (side === 0) return {
      x: clamp(center.x + (Math.random() - 0.5) * spreadX, 24, world.width - 24),
      y: clamp(center.y - viewport.height / 2 - margin, 24, world.height - 24),
    };
    if (side === 1) return {
      x: clamp(center.x + viewport.width / 2 + margin, 24, world.width - 24),
      y: clamp(center.y + (Math.random() - 0.5) * spreadY, 24, world.height - 24),
    };
    if (side === 2) return {
      x: clamp(center.x + (Math.random() - 0.5) * spreadX, 24, world.width - 24),
      y: clamp(center.y + viewport.height / 2 + margin, 24, world.height - 24),
    };
    return {
      x: clamp(center.x - viewport.width / 2 - margin, 24, world.width - 24),
      y: clamp(center.y + (Math.random() - 0.5) * spreadY, 24, world.height - 24),
    };
  }

  function createXpGem(x, y, value) {
    return { x, y, value, width: 12, height: 12, size: 6 + value * 0.6 };
  }

  function createBullets(player, target) {
    const direction = getUnitVector(player, target);
    const profile = getProjectileProfile(player);
    const bullets = [];
    const count = Math.max(player.stats.projectileCount, profile.minProjectiles || 1);
    for (let index = 0; index < count; index += 1) {
      const spread = (index - (count - 1) / 2) * 0.16;
      bullets.push(createProjectile(player, rotateVector(direction, spread), profile, 0, -26, "main", 1));
    }
    if (profile.droneShots) {
      bullets.push(createProjectile(player, rotateVector(direction, -0.08), profile, -42, 0, "drone", 0.62));
      bullets.push(createProjectile(player, rotateVector(direction, 0.08), profile, 42, 0, "drone", 0.62));
    }
    if (profile.coreDroneShots) {
      bullets.push(createProjectile(player, rotateVector(direction, 0), profile, 0, 18, "coreDrone", 0.48));
    }
    return bullets;
  }

  function getProjectileProfile(player) {
    return weaponEvolution.getWeaponEvolution(player);
  }

  function createProjectile(player, direction, profile, offsetX, offsetY, origin, damageScale) {
    const isDrone = origin === "drone" || origin === "coreDrone";
    const isCoreDrone = origin === "coreDrone";
    const speed = isDrone ? profile.droneSpeed : profile.speed;
    return {
      x: player.x + offsetX,
      y: player.y + offsetY,
      vx: direction.x * speed,
      vy: direction.y * speed,
      width: isDrone ? 6 : profile.size,
      height: isDrone ? 6 : profile.size,
      damage: player.stats.damage * (profile.damageScale || 1) * damageScale,
      life: 1.6,
      burnDamage: isDrone ? 0 : profile.burnDamage || 0,
      burnTime: isDrone ? 0 : profile.burnTime || 0,
      chainDamage: isDrone ? 0 : player.stats.damage * (profile.chainDamageScale || 0),
      chainRange: isDrone ? 0 : profile.chainRange || 0,
      chainsLeft: isDrone ? 0 : profile.chainTargets || 0,
      color: isCoreDrone ? "#f2dfb6" : (isDrone ? "#7df8ff" : profile.color),
      style: isCoreDrone ? "coreDrone" : (isDrone ? "droneLaser" : profile.style),
      trailColor: isCoreDrone ? "#52d6bd" : (isDrone ? "#4fc3d6" : profile.trailColor),
      pierceLeft: isDrone ? 0 : profile.pierce || 0,
      origin,
    };
  }

  function createUpgradeChoices(playerLevel) {
    const offset = playerLevel % UPGRADE_POOL.length;
    return [0, 1, 2].map((step) => UPGRADE_POOL[(offset + step * 2) % UPGRADE_POOL.length]);
  }

  function applyUpgrade(player, upgrade) {
    player.upgrades.push(upgrade.id);
    if (upgrade.stat === "fireRate") player.stats.fireRate = Math.max(0.12, player.stats.fireRate + upgrade.amount);
    if (upgrade.stat === "projectileCount") player.stats.projectileCount = Math.min(5, player.stats.projectileCount + upgrade.amount);
    if (upgrade.stat === "damage") player.stats.damage += upgrade.amount;
    if (upgrade.stat === "speed") player.speed += upgrade.amount;
    if (upgrade.stat === "magnet") player.stats.magnet += upgrade.amount;
    if (upgrade.stat === "repair") player.lives = Math.min(5, player.lives + upgrade.amount);
  }

  function getMountedWeaponCount(player) {
    return player.upgrades.filter((upgradeId) => WEAPON_UPGRADES.has(upgradeId)).length;
  }

  function getMovementInput(pressedKeys, touchInput) {
    const x = Number(pressedKeys.has("ArrowRight") || pressedKeys.has("KeyD") || touchInput.right)
      - Number(pressedKeys.has("ArrowLeft") || pressedKeys.has("KeyA") || touchInput.left);
    const y = Number(pressedKeys.has("ArrowDown") || pressedKeys.has("KeyS") || touchInput.down)
      - Number(pressedKeys.has("ArrowUp") || pressedKeys.has("KeyW") || touchInput.up);
    const length = Math.hypot(x, y) || 1;
    return { x: x / length, y: y / length };
  }

  function getBounds(entity) {
    return { x: entity.x, y: entity.y, width: entity.width, height: entity.height };
  }

  function getNearestEnemy(player, enemies) {
    let nearest = null;
    let nearestDistance = Infinity;
    for (const enemy of enemies) {
      const distance = getDistance(player, enemy);
      if (distance < nearestDistance) {
        nearest = enemy;
        nearestDistance = distance;
      }
    }
    return nearest;
  }

  function getDistance(first, second) {
    return Math.hypot(first.x - second.x, first.y - second.y);
  }

  function getUnitVector(from, to) {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const length = Math.hypot(dx, dy) || 1;
    return { x: dx / length, y: dy / length };
  }

  function rotateVector(vector, radians) {
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);
    return { x: vector.x * cos - vector.y * sin, y: vector.x * sin + vector.y * cos };
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function overlaps(first, second) {
    return Math.abs(first.x - second.x) * 2 < first.width + second.width
      && Math.abs(first.y - second.y) * 2 < first.height + second.height;
  }

  window.SurvivalRules = {
    applyUpgrade,
    clamp,
    createBullets,
    createEnemy,
    createPlayer,
    createUpgradeChoices,
    createXpGem,
    getDistance,
    getBounds,
    getMountedWeaponCount,
    getMovementInput,
    getNearestEnemy,
    getProjectileProfile,
    getWaveEnemyType,
    getUnitVector,
    overlaps,
  };
})();
