(() => {
  const WEAPON_NAMES = {
    droneSupport: "Drone Destegi",
    laser: "Lazer",
    novaLance: "Nova Lance",
    phaseBurst: "Phase Burst",
    piercingLaser: "Delici Lazer",
    plasma: "Plazma",
    pulse: "Darbe",
    twinPlasma: "Ikiz Plazma",
  };

  function createStatRows(state) {
    const player = state.player;
    const evolution = window.WeaponEvolution.getWeaponEvolution(player);
    const damage = player.stats.damage * (evolution.damageScale || 1);
    const weaponSynergies = evolution.synergies.map(getWeaponName);
    const relicSynergies = window.RelicSynergy?.getActiveSynergies?.(player).map((synergy) => synergy.title) || [];
    const synergies = weaponSynergies.concat(relicSynergies);
    return [
      { key: "damage", label: "Hasar", value: formatDecimal(damage), detail: `Temel ${formatDecimal(player.stats.damage)}` },
      { key: "fireRate", label: "Atis", value: `${formatDecimal(1 / player.stats.fireRate)}/sn`, detail: `${player.stats.fireRate.toFixed(2)} sn bekleme` },
      { key: "projectiles", label: "Mermi", value: String(player.stats.projectileCount), detail: "Atis basina" },
      { key: "speed", label: "Hiz", value: String(Math.round(player.speed)), detail: player.shipType === "dreadnought" ? "Agir kruvazor" : "Interceptor" },
      { key: "magnet", label: "Cekim", value: `${Math.round(player.stats.magnet)} px`, detail: "XP toplama" },
      { key: "shield", label: "Kalkan", value: String(player.shields || 0), detail: `Can ${Math.max(0, player.lives)}` },
      { key: "weapon", label: "Silah", value: getWeaponName(evolution.id), detail: `${getMountedWeaponCount(player)} mod takili` },
      { key: "synergy", label: "Sinerji", value: synergies.join(" + ") || "Yok", detail: state.level ? `Seviye ${state.level}` : "" },
      { key: "relics", label: "Relicler", value: getRelicNames(player).join(" + ") || "Yok", detail: getRelicDetail(player) },
    ];
  }

  function getMountedWeaponCount(player) {
    return player.upgrades.filter((id) => id === "damage" || id === "rapid" || id === "split").length;
  }

  function getWeaponName(id) {
    return WEAPON_NAMES[id] || id;
  }

  function getRelicNames(player) {
    return (player.relics || []).map((relicId) => window.RelicSystem?.getRelicById?.(relicId)?.title || relicId);
  }

  function getRelicDetail(player) {
    const count = (player.relics || []).length;
    return count > 0 ? `Boss Relic x${count}` : "Relic yok";
  }

  function formatDecimal(value) {
    return Number(value).toFixed(1);
  }

  window.StatSystem = { createStatRows, getWeaponName };
})();
