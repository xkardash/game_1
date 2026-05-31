(() => {
  const RARITY_ORDER = ["common", "rare", "epic", "legendary"];
  const SELECTION_RULES = {
    common: 2,
    rare: 2,
    epic: 2,
    legendary: 2,
  };
  const MAX_SELECTED_ITEMS = getMaxSelectedItems();
  const ITEM_POOL = [
    {
      id: "shieldBattery",
      title: "Kalkan Bataryasi",
      body: "Run icinde fazladan kalkan verir.",
      effect: "Kalkan +1",
      rarity: "common",
      tags: ["defense"],
    },
    {
      id: "repairDrone",
      title: "Tamir Dronu",
      body: "Gemi canini onarir.",
      effect: "Can +1",
      rarity: "common",
      tags: ["defense"],
    },
    {
      id: "magnetBeacon",
      title: "Manyetik Isaretci",
      body: "XP toplama menzilini buyutur.",
      effect: "Magnet +34",
      rarity: "common",
      tags: ["economy"],
    },
    {
      id: "xpCatalyst",
      title: "XP Katalizoru",
      body: "Toplanan XP daha degerli olur.",
      effect: "XP kazanci +18%",
      rarity: "rare",
      tags: ["economy"],
    },
    {
      id: "plasmaCartridge",
      title: "Plazma Kartusu",
      body: "Ana mermi hasarini artirir.",
      effect: "Hasar +1",
      rarity: "rare",
      tags: ["weapon"],
    },
    {
      id: "coolantLoop",
      title: "Sogutma Halkasi",
      body: "Silah bekleme suresini kisaltir.",
      effect: "Ates hizi +",
      rarity: "rare",
      tags: ["weapon"],
    },
    {
      id: "droneBay",
      title: "Drone Yuvasi",
      body: "Mekige destek atisi ekler.",
      effect: "Destek dronu +1",
      rarity: "epic",
      tags: ["weapon", "drone"],
    },
    {
      id: "ricochetNode",
      title: "Sekme Dugumu",
      body: "Enerji mermileri yakindaki hedefe sicrama kazanir.",
      effect: "Zincir +1",
      rarity: "epic",
      tags: ["weapon"],
    },
    {
      id: "ionGrease",
      title: "Iyon Yagi",
      body: "Motor ivmesini artirir.",
      effect: "Hiz +30",
      rarity: "common",
      tags: ["mobility"],
    },
    {
      id: "splitRegulator",
      title: "Namlu Regulatoru",
      body: "Bir ek mermi cikisi acabilir.",
      effect: "Mermi +1",
      rarity: "epic",
      tags: ["weapon"],
    },
    {
      id: "overdriveCell",
      title: "Overdrive Hucre",
      body: "Ultimate sarj kapasitesini ve ilk sarji artirir.",
      effect: "Overdrive +25",
      rarity: "rare",
      tags: ["utility"],
    },
    {
      id: "salvageScanner",
      title: "Enkaz Tarayici",
      body: "Kucuk dusmanlardan ekstra loot cikma sansi verir.",
      effect: "Loot sansi +16%",
      rarity: "epic",
      tags: ["economy"],
    },
    {
      id: "bossTracker",
      title: "Boss Izleyici",
      body: "Boss hedeflere karsi hasari artirir.",
      effect: "Boss hasari +18%",
      rarity: "legendary",
      tags: ["boss"],
    },
    {
      id: "phaseMesh",
      title: "Faz Orgusu",
      body: "Kritik anda hasardan kacma sansi verir.",
      effect: "Siyrilma +7%",
      rarity: "legendary",
      tags: ["mobility", "defense"],
    },
    {
      id: "voidAnchor",
      title: "Bosluk Capasi",
      body: "Yakindaki dusmanlari hafif yavaslatir.",
      effect: "Yavas aura +10%",
      rarity: "legendary",
      tags: ["control"],
    },
    {
      id: "singularityCore",
      title: "Tekillik Cekirdegi",
      body: "Boss avinda enerji odaklamasi ve overdrive baslangici verir.",
      effect: "Boss hasari +12%, Overdrive +18",
      rarity: "legendary",
      tags: ["boss", "utility"],
    },
  ];

  const RARITY_LABELS = {
    common: "Standart",
    rare: "Nadir",
    epic: "Epik",
    legendary: "Efsanevi",
  };

  const SYNERGIES = [
    {
      id: "emergencyBay",
      title: "Acil Durum Bolmesi",
      itemIds: ["shieldBattery", "repairDrone"],
      effect: "Kalkan +1, maksimum can +1",
    },
    {
      id: "harvestField",
      title: "Hasat Alani",
      itemIds: ["magnetBeacon", "xpCatalyst"],
      effect: "Magnet +20, XP kazanci +12%",
    },
    {
      id: "ionizedPlasma",
      title: "Iyonize Plazma",
      itemIds: ["plasmaCartridge", "coolantLoop"],
      effect: "Mermiler yakma etkisi kazanir.",
    },
    {
      id: "swarmRelay",
      title: "Suru Aktaricisi",
      itemIds: ["droneBay", "ricochetNode"],
      effect: "Drone +1, zincir etkisi guclenir.",
    },
    {
      id: "phaseSnare",
      title: "Faz Tuzagi",
      itemIds: ["phaseMesh", "voidAnchor"],
      effect: "Siyrilma ve yavaslatma artar.",
    },
    {
      id: "singularityProtocol",
      title: "Tekillik Protokolu",
      itemIds: ["bossTracker", "singularityCore"],
      effect: "Boss hasari ve overdrive kapasitesi artar.",
    },
  ];

  const DEFAULT_SELECTED_IDS = createDefaultSelectedIds();

  function getItemPool() {
    return ITEM_POOL.map(cloneItem);
  }

  function getItemById(itemId) {
    const item = ITEM_POOL.find((candidate) => candidate.id === itemId);
    return item ? cloneItem(item) : null;
  }

  function getRarityGroups() {
    return RARITY_ORDER.map((rarity) => ({
      rarity,
      label: RARITY_LABELS[rarity],
      required: SELECTION_RULES[rarity],
      items: ITEM_POOL.filter((item) => item.rarity === rarity).map(cloneItem),
    }));
  }

  function createSelection(selectedIds = DEFAULT_SELECTED_IDS) {
    return {
      maxItems: MAX_SELECTED_ITEMS,
      message: "",
      selectedIds: normalizeSelectedIds(selectedIds),
    };
  }

  function toggleSelection(selection, itemId) {
    const current = createSelection(selection?.selectedIds || []);
    const item = getItemById(itemId);
    if (!item) return { ...current, message: "Bilinmeyen esya." };
    if (current.selectedIds.includes(itemId)) {
      return {
        ...current,
        message: "",
        selectedIds: current.selectedIds.filter((id) => id !== itemId),
      };
    }
    const tier = getSelectionTier(current.selectedIds, item.rarity);
    if (tier.selected >= tier.required) {
      return { ...current, message: `${tier.label} icin en fazla ${tier.required} esya secilebilir.` };
    }
    if (current.selectedIds.length >= MAX_SELECTED_ITEMS) {
      return { ...current, message: "Run icin en fazla 8 esya secilebilir." };
    }
    return { ...current, message: "", selectedIds: [...current.selectedIds, itemId] };
  }

  function isSelectionReady(selection) {
    return getSelectionSummary(selection).ready;
  }

  function getSelectionSummary(selection) {
    const selectedIds = normalizeSelectedIds(selection?.selectedIds || []);
    const tiers = RARITY_ORDER.map((rarity) => getSelectionTier(selectedIds, rarity));
    return {
      maxItems: MAX_SELECTED_ITEMS,
      message: selection?.message || "",
      ready: tiers.every((tier) => tier.selected === tier.required),
      tiers,
      total: selectedIds.length,
    };
  }

  function createItemState(selection) {
    const actualSelection = createSelection(selection?.selectedIds || selection || DEFAULT_SELECTED_IDS);
    return {
      appliedSynergyIds: [],
      ownedIds: [],
      selectedIds: [...actualSelection.selectedIds],
    };
  }

  function hasActiveSelection(player) {
    return (player?.itemState?.selectedIds || []).length > 0;
  }

  function getAvailableItems(player) {
    const state = player?.itemState;
    if (!state) return [];
    const owned = new Set(state.ownedIds || []);
    return (state.selectedIds || [])
      .filter((id) => !owned.has(id))
      .map(getItemById)
      .filter(Boolean);
  }

  function createItemChoices(player, count, rng = Math.random) {
    const available = getAvailableItems(player);
    const shuffled = [...available].sort((first, second) => {
      const firstScore = getItemWeight(first, player) + rng();
      const secondScore = getItemWeight(second, player) + rng();
      return secondScore - firstScore;
    });
    return shuffled.slice(0, count).map((item) => getItemView(item, player));
  }

  function getItemView(itemLike, player = null) {
    const item = getItemById(itemLike?.id) || itemLike;
    const rarity = item.rarity || "common";
    return {
      ...item,
      category: "Esya",
      choiceType: "item",
      rarity,
      rarityLabel: RARITY_LABELS[rarity] || RARITY_LABELS.common,
      synergy: getSynergyPreview(item, player),
    };
  }

  function applyItem(player, itemLike) {
    const item = getItemById(itemLike?.id);
    if (!item) return false;
    ensurePlayerItemState(player);
    if (player.itemState.ownedIds.includes(item.id)) return false;
    player.itemState.ownedIds.push(item.id);
    applyItemEffect(player, item.id);
    applyNewSynergies(player);
    return true;
  }

  function getActiveSynergies(player) {
    const owned = new Set(player?.itemState?.ownedIds || []);
    return SYNERGIES
      .filter((synergy) => synergy.itemIds.every((id) => owned.has(id)))
      .map((synergy) => ({ ...synergy, itemIds: [...synergy.itemIds] }));
  }

  function scaleXp(player, amount) {
    if (amount <= 0) return 0;
    const multiplier = 1 + (player?.itemEffects?.xpGainMultiplier || 0);
    return Math.max(1, Math.round(amount * multiplier));
  }

  function getBossDamageScale(player) {
    return 1 + (player?.itemEffects?.bossDamageMultiplier || 0);
  }

  function rollDodge(player, rng = Math.random) {
    const chance = player?.itemEffects?.dodgeChance || 0;
    return chance > 0 && rng() < chance;
  }

  function getSlowScale(player, enemy) {
    const slowAura = player?.itemEffects?.slowAura || 0;
    if (slowAura <= 0 || !enemy) return 1;
    const distance = Math.hypot((player.x || 0) - enemy.x, (player.y || 0) - enemy.y);
    return distance <= 190 ? Math.max(0.68, 1 - slowAura) : 1;
  }

  function ensurePlayerItemState(player) {
    if (!player.itemState) player.itemState = createItemState();
    if (!player.itemEffects) player.itemEffects = {};
    if (!Array.isArray(player.itemState.ownedIds)) player.itemState.ownedIds = [];
    if (!Array.isArray(player.itemState.appliedSynergyIds)) player.itemState.appliedSynergyIds = [];
    if (!Array.isArray(player.itemState.selectedIds)) player.itemState.selectedIds = [...DEFAULT_SELECTED_IDS];
    if (!player.maxLives) player.maxLives = 5;
  }

  function normalizeSelectedIds(selectedIds) {
    const seen = new Set();
    const counts = {};
    const normalized = [];
    for (const id of selectedIds || []) {
      const item = getItemById(id);
      if (seen.has(id) || !item) continue;
      const rarity = item.rarity || "common";
      if ((counts[rarity] || 0) >= (SELECTION_RULES[rarity] || 0)) continue;
      seen.add(id);
      counts[rarity] = (counts[rarity] || 0) + 1;
      normalized.push(id);
      if (normalized.length >= MAX_SELECTED_ITEMS) break;
    }
    return normalized;
  }

  function createDefaultSelectedIds() {
    return RARITY_ORDER.flatMap((rarity) => ITEM_POOL
      .filter((item) => item.rarity === rarity)
      .slice(0, SELECTION_RULES[rarity])
      .map((item) => item.id));
  }

  function cloneItem(item) {
    return { ...item, tags: [...(item.tags || [])] };
  }

  function getMaxSelectedItems() {
    return RARITY_ORDER.reduce((total, rarity) => total + SELECTION_RULES[rarity], 0);
  }

  function getSelectionTier(selectedIds, rarity) {
    const selected = (selectedIds || []).filter((id) => getItemById(id)?.rarity === rarity).length;
    return {
      label: RARITY_LABELS[rarity],
      rarity,
      ready: selected === SELECTION_RULES[rarity],
      required: SELECTION_RULES[rarity],
      selected,
    };
  }

  function getItemWeight(item, player) {
    const owned = new Set(player?.itemState?.ownedIds || []);
    const synergyBonus = SYNERGIES.some((synergy) => synergy.itemIds.includes(item.id) && synergy.itemIds.some((id) => owned.has(id))) ? 0.55 : 0;
    const rarityBonus = item.rarity === "legendary" ? 0.18 : item.rarity === "epic" ? 0.12 : item.rarity === "rare" ? 0.06 : 0;
    return synergyBonus + rarityBonus;
  }

  function getSynergyPreview(item, player) {
    if (!player?.itemState) return "";
    const owned = new Set(player.itemState.ownedIds || []);
    owned.add(item.id);
    const ready = SYNERGIES.find((synergy) => synergy.itemIds.includes(item.id) && synergy.itemIds.every((id) => owned.has(id)));
    if (ready) return `Sinerji hazir: ${ready.title}`;
    const partial = SYNERGIES.find((synergy) => synergy.itemIds.includes(item.id) && synergy.itemIds.some((id) => owned.has(id)));
    if (!partial) return "";
    const missing = partial.itemIds.filter((id) => !owned.has(id)).map((id) => getItemById(id)?.title || id);
    return `Sinerji: ${missing.join(" + ")} ile ${partial.title}`;
  }

  function applyItemEffect(player, itemId) {
    ensureStats(player);
    if (itemId === "shieldBattery") player.shields = Math.min(4, (player.shields || 0) + 1);
    if (itemId === "repairDrone") player.lives = Math.min(player.maxLives || 5, player.lives + 1);
    if (itemId === "magnetBeacon") player.stats.magnet += 34;
    if (itemId === "xpCatalyst") addEffect(player, "xpGainMultiplier", 0.18);
    if (itemId === "plasmaCartridge") player.stats.damage += 1;
    if (itemId === "coolantLoop") player.stats.fireRate = Math.max(0.1, player.stats.fireRate - 0.035);
    if (itemId === "droneBay") addEffect(player, "extraDroneShots", 1);
    if (itemId === "ricochetNode") {
      addEffect(player, "chainTargets", 1);
      addEffect(player, "chainDamageScale", 0.25);
      addEffect(player, "chainRange", 110);
    }
    if (itemId === "ionGrease") player.speed += 30;
    if (itemId === "splitRegulator") player.stats.projectileCount = Math.min(5, player.stats.projectileCount + 1);
    if (itemId === "overdriveCell") {
      player.overdriveMax = (player.overdriveMax || 100) + 20;
      player.overdriveCharge = Math.min(player.overdriveMax, (player.overdriveCharge || 0) + 25);
    }
    if (itemId === "salvageScanner") addEffect(player, "lootLuck", 0.16);
    if (itemId === "bossTracker") addEffect(player, "bossDamageMultiplier", 0.18);
    if (itemId === "phaseMesh") addEffect(player, "dodgeChance", 0.07);
    if (itemId === "voidAnchor") addEffect(player, "slowAura", 0.1);
    if (itemId === "singularityCore") {
      addEffect(player, "bossDamageMultiplier", 0.12);
      player.overdriveCharge = Math.min(player.overdriveMax || 100, (player.overdriveCharge || 0) + 18);
    }
  }

  function applyNewSynergies(player) {
    const applied = new Set(player.itemState.appliedSynergyIds || []);
    for (const synergy of getActiveSynergies(player)) {
      if (applied.has(synergy.id)) continue;
      applySynergyEffect(player, synergy.id);
      applied.add(synergy.id);
    }
    player.itemState.appliedSynergyIds = [...applied];
  }

  function applySynergyEffect(player, synergyId) {
    ensureStats(player);
    if (synergyId === "emergencyBay") {
      player.maxLives = (player.maxLives || 5) + 1;
      player.shields = Math.min(4, (player.shields || 0) + 1);
    }
    if (synergyId === "harvestField") {
      player.stats.magnet += 20;
      addEffect(player, "xpGainMultiplier", 0.12);
    }
    if (synergyId === "ionizedPlasma") {
      addEffect(player, "burnDamage", 1.2);
      addEffect(player, "burnTime", 1.2);
    }
    if (synergyId === "swarmRelay") {
      addEffect(player, "extraDroneShots", 1);
      addEffect(player, "chainTargets", 1);
      addEffect(player, "chainDamageScale", 0.2);
    }
    if (synergyId === "phaseSnare") {
      addEffect(player, "dodgeChance", 0.04);
      addEffect(player, "slowAura", 0.08);
    }
    if (synergyId === "singularityProtocol") {
      player.overdriveMax = (player.overdriveMax || 100) + 15;
      addEffect(player, "bossDamageMultiplier", 0.1);
    }
  }

  function ensureStats(player) {
    if (!player.itemEffects) player.itemEffects = {};
    if (!player.stats) player.stats = {};
    if (!player.maxLives) player.maxLives = 5;
  }

  function addEffect(player, key, amount) {
    player.itemEffects[key] = (player.itemEffects[key] || 0) + amount;
  }

  window.RunItemSystem = {
    applyItem,
    createItemChoices,
    createItemState,
    createSelection,
    getActiveSynergies,
    getAvailableItems,
    getBossDamageScale,
    getItemById,
    getItemPool,
    getItemView,
    getRarityGroups,
    getSelectionSummary,
    getSlowScale,
    hasActiveSelection,
    isSelectionReady,
    rollDodge,
    scaleXp,
    toggleSelection,
  };
})();
