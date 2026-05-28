(() => {
  const BUILD_RULES = [
    {
      id: "novaLance",
      title: "Nova Lance",
      relic: "novaCore",
      upgrade: "damage",
      detail: "Nova cekirdegi plazma topunu alan vuran lance moduna cevirir.",
    },
    {
      id: "voidField",
      title: "Void Field",
      relic: "voidSiphon",
      upgrade: "magnet",
      detail: "Bosluk sifonu cekim alanini dusmanlari yakan karanlik halkaya cevirir.",
    },
    {
      id: "phaseBurst",
      title: "Phase Burst",
      relic: "phaseInjector",
      upgrade: "rapid",
      detail: "Faz enjektoru rapid namlulari hizli delici faz atisina baglar.",
    },
  ];

  function getActiveSynergies(player) {
    return BUILD_RULES.filter((rule) => hasRelic(player, rule.relic) && hasUpgrade(player, rule.upgrade))
      .map((rule) => ({ id: rule.id, title: rule.title, detail: rule.detail }));
  }

  function enhanceWeaponProfile(profile, player) {
    const relicSynergies = getActiveSynergies(player).map((synergy) => synergy.id);
    const base = { ...profile, relicSynergies };
    if (relicSynergies.includes("phaseBurst")) return createPhaseBurstProfile(base);
    if (relicSynergies.includes("novaLance")) return createNovaLanceProfile(base);
    return base;
  }

  function createNovaLanceProfile(profile) {
    return {
      ...profile,
      id: "novaLance",
      style: "novaLance",
      color: "#fff0bd",
      trailColor: "#f0a040",
      damageScale: Number(((profile.damageScale || 1) * 1.18).toFixed(2)),
      areaDamageScale: 0.72,
      areaRange: 76,
      size: Math.max(profile.size || 0, 16),
      speed: Math.max(profile.speed || 0, 655),
    };
  }

  function createPhaseBurstProfile(profile) {
    return {
      ...profile,
      id: "phaseBurst",
      style: "phaseShot",
      color: "#d9fbff",
      trailColor: "#7df8ff",
      damageScale: Math.max(profile.damageScale || 1, 1.04),
      pierce: Math.max(profile.pierce || 0, 1),
      size: Math.max(profile.size || 0, 9),
      speed: Math.max(profile.speed || 0, 860),
    };
  }

  function applyBulletImpact(state, bullet, enemy, effects, destroyEnemy = null) {
    if (!bullet.areaDamage || !bullet.areaRange) return;
    state.relicFields = state.relicFields || [];
    state.relicFields.push(createFieldPulse(enemy.x, enemy.y, bullet.areaRange, "#f0a040", 0.3));
    effects.emitParticles(state, enemy.x, enemy.y, "#f0a040", 10, { life: 0.24, size: 3 });
    for (const target of [...state.enemies]) {
      if (target === enemy || getDistance(target, enemy) > bullet.areaRange) continue;
      target.hp -= bullet.areaDamage;
      target.flash = 0.14;
      effects.emitParticles(state, target.x, target.y, "#fff0bd", 5, { life: 0.18, size: 2 });
      if (target.hp <= 0 && destroyEnemy) destroyEnemy(target);
    }
  }

  function updateCombatFields(state, effects, delta, destroyEnemy = null) {
    state.relicFields = state.relicFields || [];
    updateTimedFields(state.relicFields, delta);
    if (!getActiveSynergies(state.player).some((synergy) => synergy.id === "voidField")) return;
    state.player.voidFieldCooldown = Math.max(0, (state.player.voidFieldCooldown || 0) - delta);
    if (state.player.voidFieldCooldown > 0) return;
    state.player.voidFieldCooldown = 0.36;
    pulseVoidField(state, effects, destroyEnemy);
  }

  function pulseVoidField(state, effects, destroyEnemy) {
    const radius = Math.max(92, Math.min(state.player.stats.magnet, 178));
    const damage = 0.62 + (state.player.lootCores || 0) * 0.12;
    state.relicFields.push(createFieldPulse(state.player.x, state.player.y, radius, "#52d6bd", 0.36));
    effects.emitParticles(state, state.player.x, state.player.y, "#52d6bd", 8, { life: 0.22, size: 2 });
    for (const enemy of [...state.enemies]) {
      if (getDistance(state.player, enemy) > radius) continue;
      enemy.hp -= damage;
      enemy.flash = 0.12;
      if (enemy.hp <= 0 && destroyEnemy) destroyEnemy(enemy);
    }
  }

  function createFieldPulse(x, y, radius, color, life) {
    return { x, y, radius, color, life, maxLife: life };
  }

  function updateTimedFields(fields, delta) {
    for (const field of fields) field.life -= delta;
    for (let index = fields.length - 1; index >= 0; index -= 1) {
      if (fields[index].life <= 0) fields.splice(index, 1);
    }
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

  window.RelicSynergy = { applyBulletImpact, enhanceWeaponProfile, getActiveSynergies, updateCombatFields };
})();
