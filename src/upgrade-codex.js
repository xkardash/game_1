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
  const runItemSystem = window.RunItemSystem;
  const BUILD_ROUTES = [
    {
      id: "novaLance",
      kind: "relic",
      relic: "novaCore",
      relicTitle: "Nova Cekirdegi",
      title: "Nova Lance",
      upgrades: ["damage"],
    },
    {
      id: "phaseBurst",
      kind: "relic",
      relic: "phaseInjector",
      relicTitle: "Faz Enjektoru",
      title: "Phase Burst",
      upgrades: ["rapid"],
    },
    {
      id: "voidField",
      kind: "relic",
      relic: "voidSiphon",
      relicTitle: "Bosluk Sifonu",
      title: "Void Field",
      upgrades: ["magnet"],
    },
    {
      id: "droneSupport",
      kind: "weapon",
      progressFrom: "engine",
      title: "Drone Destegi",
      upgrades: ["engine", "rapid"],
    },
    {
      id: "piercingLaser",
      kind: "weapon",
      progressFrom: "rapid",
      title: "Delici Lazer",
      upgrades: ["damage", "rapid"],
    },
    {
      id: "twinPlasma",
      kind: "weapon",
      progressFrom: "split",
      title: "Ikiz Plazma",
      upgrades: ["damage", "split"],
    },
  ];

  function createChoices(playerLevel, player = null, rng = Math.random) {
    if (runItemSystem?.hasActiveSelection?.(player)) return createMixedChoices(playerLevel, player, rng);
    return createStatChoices(playerLevel, player, 3);
  }

  function createMixedChoices(playerLevel, player, rng) {
    const availableItems = runItemSystem.getAvailableItems(player);
    const itemCount = Math.min(availableItems.length, rng() < 0.5 ? 2 : 1);
    const statChoices = createStatChoices(playerLevel, player, 3 - itemCount);
    const itemChoices = runItemSystem.createItemChoices(player, itemCount, rng);
    return [...itemChoices, ...statChoices].slice(0, 3);
  }

  function createStatChoices(playerLevel, player = null, count = 3) {
    const offset = playerLevel % UPGRADE_POOL.length;
    return Array.from({ length: count }, (_, step) => getUpgradeView(UPGRADE_POOL[(offset + step * 2) % UPGRADE_POOL.length], player));
  }

  function getUpgradeView(upgrade, player = null) {
    if (upgrade?.choiceType === "item" && runItemSystem) return runItemSystem.getItemView(upgrade, player);
    const source = getUpgradeById(upgrade.id) || upgrade;
    const rarity = source.rarity || "common";
    return {
      ...source,
      ...upgrade,
      rarity,
      rarityLabel: RARITY_LABELS[rarity] || RARITY_LABELS.common,
      buildRoutes: getBuildRoutes(source, player),
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

  function getBuildRoutes(upgrade, player) {
    const routes = BUILD_ROUTES
      .filter((route) => route.upgrades.includes(upgrade.id))
      .map((route) => getBuildRouteView(route, upgrade, player))
      .filter(Boolean)
      .sort(compareBuildRoutes);
    const readyRoutes = routes.filter((route) => route.state === "ready");
    const nextRoute = routes.find((route) => route.state !== "ready");
    return nextRoute && readyRoutes.length < 3 ? [...readyRoutes, nextRoute] : readyRoutes;
  }

  function getBuildRouteView(route, upgrade, player = null) {
    const owned = new Set(player?.upgrades || []);
    owned.add(upgrade.id);
    const missing = route.upgrades.filter((id) => !owned.has(id));
    const hasRequiredUpgrades = missing.length === 0;
    const hasRequiredRelic = !route.relic || (player?.relics || []).includes(route.relic);
    if (!hasRequiredUpgrades && !route.upgrades.some((id) => owned.has(id))) return null;
    const state = getBuildRouteState(route, hasRequiredUpgrades, hasRequiredRelic);
    if (state === "progress" && route.progressFrom !== upgrade.id) return null;
    return {
      id: route.id,
      kind: route.kind,
      state,
      title: route.title,
      hint: getBuildRouteHint(route, state, missing),
    };
  }

  function getBuildRouteState(route, hasRequiredUpgrades, hasRequiredRelic) {
    if (hasRequiredUpgrades && hasRequiredRelic) return "ready";
    if (route.relic && hasRequiredUpgrades) return "relic";
    return "progress";
  }

  function getBuildRouteHint(route, state, missing) {
    if (state === "ready" && route.relic) return `${route.relicTitle} aktif: ${route.title} acilir.`;
    if (state === "ready") return `${route.title} hazir: ${route.upgrades.map(getUpgradeTitle).join(" + ")} birlesti.`;
    if (state === "relic") return `${route.relicTitle} ile ${route.title} rotasi.`;
    return `${missing.map(getUpgradeTitle).join(" + ")} ile ${route.title} tamamlanir.`;
  }

  function getUpgradeTitle(upgradeId) {
    return getUpgradeById(upgradeId)?.title || upgradeId;
  }

  function compareBuildRoutes(first, second) {
    return getRouteStateRank(first.state) - getRouteStateRank(second.state)
      || getRouteKindRank(first.kind) - getRouteKindRank(second.kind)
      || getRouteIndex(first.id) - getRouteIndex(second.id);
  }

  function getRouteStateRank(state) {
    if (state === "ready") return 0;
    if (state === "relic") return 1;
    return 2;
  }

  function getRouteKindRank(kind) {
    return kind === "relic" ? 0 : 1;
  }

  function getRouteIndex(routeId) {
    return BUILD_ROUTES.findIndex((route) => route.id === routeId);
  }

  window.UpgradeCodex = { createChoices, getUpgradeById, getUpgradeView };
})();
