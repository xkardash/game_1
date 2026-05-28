(() => {
  const PROFILES = {
    pulse: {
      id: "pulse",
      color: "#f2dfb6",
      size: 8,
      speed: 620,
      style: "pulse",
      trailColor: "#f0b84a",
    },
    laser: {
      id: "laser",
      color: "#52d6bd",
      size: 7,
      speed: 690,
      style: "laser",
      trailColor: "#f2dfb6",
    },
    plasma: {
      id: "plasma",
      color: "#f0a040",
      size: 12,
      speed: 620,
      style: "plasma",
      trailColor: "#e8573f",
    },
    twinPlasma: {
      id: "twinPlasma",
      color: "#f0a040",
      damageScale: 1.08,
      minProjectiles: 2,
      size: 14,
      speed: 635,
      style: "twinPlasma",
      trailColor: "#e8573f",
    },
    piercingLaser: {
      id: "piercingLaser",
      color: "#5ee6cf",
      damageScale: 1.04,
      pierce: 2,
      size: 8,
      speed: 770,
      style: "piercingLaser",
      trailColor: "#f2dfb6",
    },
    droneSupport: {
      id: "droneSupport",
      color: "#52d6bd",
      droneShots: 2,
      droneSpeed: 720,
      size: 7,
      speed: 705,
      style: "laser",
      trailColor: "#d9fbff",
    },
  };

  function getWeaponEvolution(player) {
    const synergies = getSynergyIds(player);
    if (synergies.includes("piercingLaser")) return withSynergies(PROFILES.piercingLaser, synergies, player);
    if (synergies.includes("twinPlasma")) return withSynergies(PROFILES.twinPlasma, synergies, player);
    if (synergies.includes("droneSupport")) return withSynergies(PROFILES.droneSupport, synergies, player);
    if (hasUpgrade(player, "damage")) return withSynergies(PROFILES.plasma, synergies, player);
    if (hasUpgrade(player, "rapid")) return withSynergies(PROFILES.laser, synergies, player);
    return withSynergies(PROFILES.pulse, synergies, player);
  }

  function getSynergyIds(player) {
    const ids = [];
    if (hasAll(player, ["damage", "rapid"])) ids.push("piercingLaser");
    if (hasAll(player, ["damage", "split"])) ids.push("twinPlasma");
    if (hasAll(player, ["engine", "rapid"])) ids.push("droneSupport");
    return ids;
  }

  function withSynergies(profile, synergies, player) {
    const coreLevel = player.lootCores || 0;
    return {
      ...profile,
      burnDamage: coreLevel && profile.id === "twinPlasma" ? 2.4 + coreLevel * 0.4 : 0,
      burnTime: coreLevel && profile.id === "twinPlasma" ? 1.7 : 0,
      chainDamageScale: coreLevel && profile.id === "piercingLaser" ? 0.55 : 0,
      chainRange: coreLevel && profile.id === "piercingLaser" ? 150 : 0,
      chainTargets: coreLevel && profile.id === "piercingLaser" ? 1 : 0,
      coreDroneShots: coreLevel && synergies.includes("droneSupport") ? Math.min(2, coreLevel + 1) : 0,
      coreLevel,
      droneShots: synergies.includes("droneSupport") ? 2 : profile.droneShots || 0,
      synergies,
    };
  }

  function hasAll(player, upgradeIds) {
    return upgradeIds.every((upgradeId) => hasUpgrade(player, upgradeId));
  }

  function hasUpgrade(player, upgradeId) {
    return player.upgrades.includes(upgradeId);
  }

  window.WeaponEvolution = { getSynergyIds, getWeaponEvolution };
})();
