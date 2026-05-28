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

  function createRelicChoices() {
    return RELICS.slice(0, 3).map(getRelicView);
  }

  function getRelicView(relic) {
    const source = getRelicById(relic.id) || relic;
    return {
      ...source,
      ...relic,
      rarityLabel: "Boss Relic",
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

  window.RelicSystem = { applyRelic, createRelicChoices, getRelicById, getRelicView };
})();
