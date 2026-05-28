(() => {
  const UPGRADE_POOL = [
    {
      id: "rapid",
      title: "Seri Lazer",
      body: "Ates hizi artar.",
      category: "Silah",
      effect: "Ates hizi +",
      rarity: "rare",
      stat: "fireRate",
      amount: -0.045,
    },
    {
      id: "split",
      title: "Cift Namlu",
      body: "Bir mermi daha cikar.",
      category: "Silah",
      effect: "Mermi +1",
      rarity: "rare",
      stat: "projectileCount",
      amount: 1,
    },
    {
      id: "damage",
      title: "Plazma Basinc",
      body: "Mermi hasari artar.",
      category: "Silah",
      effect: "Hasar +1",
      rarity: "epic",
      stat: "damage",
      amount: 1,
    },
    {
      id: "engine",
      title: "Iyon Motoru",
      body: "Mekik daha hizli gider.",
      category: "Gemi",
      effect: "Hiz +34",
      rarity: "rare",
      stat: "speed",
      amount: 34,
    },
    {
      id: "magnet",
      title: "Cekim Alani",
      body: "XP daha uzaktan toplanir.",
      category: "Alan",
      effect: "Menzil +26",
      rarity: "common",
      stat: "magnet",
      amount: 26,
    },
    {
      id: "repair",
      title: "Tamir Kiti",
      body: "Can yenilenir.",
      category: "Destek",
      effect: "Can +1",
      rarity: "common",
      stat: "repair",
      amount: 1,
    },
  ];

  const RARITY_LABELS = {
    common: "Standart",
    rare: "Nadir",
    epic: "Epik",
  };

  const SYNERGIES = [
    { ids: ["damage", "rapid"], title: "Delici Lazer" },
    { ids: ["damage", "split"], title: "Ikiz Plazma" },
    { ids: ["engine", "rapid"], title: "Drone Destegi" },
  ];

  function createChoices(playerLevel, player = null) {
    const offset = playerLevel % UPGRADE_POOL.length;
    return [0, 1, 2].map((step) => getUpgradeView(UPGRADE_POOL[(offset + step * 2) % UPGRADE_POOL.length], player));
  }

  function getUpgradeView(upgrade, player = null) {
    const source = getUpgradeById(upgrade.id) || upgrade;
    const rarity = source.rarity || "common";
    return {
      ...source,
      ...upgrade,
      rarity,
      rarityLabel: RARITY_LABELS[rarity] || RARITY_LABELS.common,
      synergy: getSynergyPreview(source, player),
    };
  }

  function getUpgradeById(upgradeId) {
    return UPGRADE_POOL.find((upgrade) => upgrade.id === upgradeId) || null;
  }

  function getSynergyPreview(upgrade, player) {
    const owned = new Set(player?.upgrades || []);
    owned.add(upgrade.id);
    const completed = SYNERGIES.find((synergy) => synergy.ids.includes(upgrade.id) && synergy.ids.every((id) => owned.has(id)));
    if (completed) return `Sinerji hazir: ${completed.title}`;

    const partial = SYNERGIES.find((synergy) => synergy.ids.includes(upgrade.id) && synergy.ids.some((id) => owned.has(id)));
    if (!partial) return "";

    const missing = partial.ids.filter((id) => !owned.has(id)).map((id) => getUpgradeById(id)?.title || id);
    return `Sinerji: ${missing.join(" + ")} ile ${partial.title}`;
  }

  window.UpgradeCodex = { createChoices, getUpgradeById, getUpgradeView };
})();
