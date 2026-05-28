(() => {
  const STORAGE_KEY = "dalga-hangar-v1";
  const UPGRADES = [
    { id: "shield", title: "Baslangic Kalkani", cost: 2, max: 3 },
    { id: "reactor", title: "Reaktor Ayari", cost: 3, max: 4 },
    { id: "magnet", title: "Toplama Bobini", cost: 2, max: 4 },
    { id: "scavenger", title: "Hurda Tarayici", cost: 4, max: 3 },
  ];

  function load(storage = getStorage()) {
    try {
      return normalize(JSON.parse(storage?.getItem(STORAGE_KEY) || "null"));
    } catch {
      return normalize(null);
    }
  }

  function save(hangar, storage = getStorage()) {
    storage?.setItem(STORAGE_KEY, JSON.stringify(normalize(hangar)));
  }

  function addCores(hangar, amount, storage = getStorage()) {
    hangar.cores = Math.max(0, hangar.cores + amount);
    save(hangar, storage);
    return hangar;
  }

  function buyUpgrade(hangar, upgradeId, storage = getStorage()) {
    const upgrade = UPGRADES.find((item) => item.id === upgradeId);
    if (!upgrade || hangar.cores < upgrade.cost || hangar.upgrades[upgradeId] >= upgrade.max) return false;
    hangar.cores -= upgrade.cost;
    hangar.upgrades[upgradeId] += 1;
    save(hangar, storage);
    return true;
  }

  function applyBonuses(player, hangar) {
    const upgrades = normalize(hangar).upgrades;
    player.shields += upgrades.shield;
    player.stats.fireRate = Math.max(0.1, Number((player.stats.fireRate - upgrades.reactor * 0.02).toFixed(2)));
    player.stats.magnet += upgrades.magnet * 9;
    player.coreDropBonus = upgrades.scavenger;
  }

  function getUpgradeList() {
    return UPGRADES.map((upgrade) => ({ ...upgrade }));
  }

  function normalize(raw) {
    const upgrades = raw?.upgrades || {};
    return {
      cores: Math.max(0, raw?.cores || 0),
      upgrades: {
        magnet: Math.max(0, upgrades.magnet || 0),
        reactor: Math.max(0, upgrades.reactor || 0),
        scavenger: Math.max(0, upgrades.scavenger || 0),
        shield: Math.max(0, upgrades.shield || 0),
      },
    };
  }

  function getStorage() {
    try {
      return window.localStorage;
    } catch {
      return null;
    }
  }

  window.HangarSystem = { addCores, applyBonuses, buyUpgrade, getUpgradeList, load, save };
})();
