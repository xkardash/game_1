(() => {
  const RELICS = [
    {
      id: "starforgedHull",
      title: "Yildiz Zirhi",
      body: "Boss enkazindan cikan agir kalkan plakasi.",
      category: "Savunma",
      effect: "Kalkan +1",
      rarity: "boss",
    },
    {
      id: "novaCore",
      title: "Nova Cekirdegi",
      body: "Ana silahi yuksek enerjiyle besler.",
      category: "Silah",
      effect: "Hasar +0.5",
      rarity: "boss",
    },
    {
      id: "voidSiphon",
      title: "Bosluk Sifonu",
      body: "XP ve core parcaciklarini daha sert ceker.",
      category: "Alan",
      effect: "Cekim +32 / Core +1",
      rarity: "boss",
    },
    {
      id: "phaseInjector",
      title: "Faz Enjektoru",
      body: "Motor ve namlu ritmini ayni reaktore baglar.",
      category: "Gemi",
      effect: "Hiz +18 / Atis +",
      rarity: "boss",
    },
  ];

  const BUILD_HINTS = {
    novaCore: { upgrade: "damage", score: 80, synergy: "Build: Nova Lance acilir" },
    voidSiphon: { upgrade: "magnet", score: 80, synergy: "Build: Void Field acilir" },
    phaseInjector: { upgrade: "rapid", score: 80, synergy: "Build: Phase Burst acilir" },
  };
  const BOSS_HINTS = {
    bulwark: {
      starforgedHull: { score: 70, synergy: "Boss: zirh enkazi" },
    },
    core: {
      novaCore: { score: 54, synergy: "Boss: core anomali parcasi" },
      voidSiphon: { score: 54, synergy: "Boss: core anomali parcasi" },
    },
    phase: {
      phaseInjector: { score: 70, synergy: "Boss: faz kalintisi" },
    },
  };

  function createRelicChoices(state = {}) {
    const player = state.player || {};
    const bossReward = state.lastBossReward || {};
    return getChoicePool(player)
      .map((relic) => getRelicView(relic, player, bossReward))
      .sort((first, second) => second.priority - first.priority || getRelicIndex(first.id) - getRelicIndex(second.id))
      .slice(0, 3);
  }

  function getRelicView(relic, player = null, bossReward = {}) {
    const source = getRelicById(relic.id) || relic;
    const recommendation = getRecommendation(source.id, player, bossReward);
    return {
      ...source,
      ...relic,
      priority: getRelicScore(source.id, player, bossReward),
      recommended: Boolean(recommendation || relic.recommended),
      rarityLabel: "Boss Relic",
      synergy: recommendation?.synergy || relic.synergy || "",
    };
  }

  function applyRelic(state, relic) {
    const view = getRelicView(relic);
    const player = state.player;
    player.relics = [...(player.relics || []), view.id];
    if (view.id === "starforgedHull") player.shields = Math.min(4, (player.shields || 0) + 1);
    if (view.id === "novaCore") player.stats.damage = Number((player.stats.damage + 0.5).toFixed(1));
    if (view.id === "voidSiphon") {
      player.stats.magnet += 32;
      player.lootCores = (player.lootCores || 0) + 1;
    }
    if (view.id === "phaseInjector") {
      player.speed += 18;
      player.stats.fireRate = Math.max(0.1, Number((player.stats.fireRate - 0.03).toFixed(2)));
    }
  }

  function getRelicById(relicId) {
    return RELICS.find((relic) => relic.id === relicId) || null;
  }

  function getChoicePool(player) {
    const owned = new Set(player.relics || []);
    const fresh = RELICS.filter((relic) => !owned.has(relic.id));
    return fresh.length >= 3 ? fresh : RELICS;
  }

  function getRelicScore(relicId, player, bossReward = {}) {
    const recommendation = getRecommendation(relicId, player, bossReward);
    const bossScore = getBossHint(relicId, bossReward)?.score || 0;
    return (recommendation?.score || 0) + bossScore + (RELICS.length - getRelicIndex(relicId));
  }

  function getRecommendation(relicId, player, bossReward = {}) {
    if (!player) return null;
    if (hasRelic(player, relicId)) return null;
    const buildHint = BUILD_HINTS[relicId];
    if (buildHint && hasUpgrade(player, buildHint.upgrade)) return buildHint;
    const bossHint = getBossHint(relicId, bossReward);
    if (bossHint) return bossHint;
    if (relicId === "starforgedHull" && (player.shields || 0) <= 0) {
      return { score: 28, synergy: "Savunma: Kalkan acigini kapatir" };
    }
    return null;
  }

  function getBossHint(relicId, bossReward) {
    return BOSS_HINTS[bossReward?.archetype]?.[relicId] || null;
  }

  function getRelicIndex(relicId) {
    return RELICS.findIndex((relic) => relic.id === relicId);
  }

  function hasRelic(player, relicId) {
    return (player.relics || []).includes(relicId);
  }

  function hasUpgrade(player, upgradeId) {
    return (player.upgrades || []).includes(upgradeId);
  }

  window.RelicSystem = { applyRelic, createRelicChoices, getRelicById, getRelicView };
})();
