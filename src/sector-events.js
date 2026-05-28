(() => {
  const EVENT_ORDER = ["meteorShower", "salvageCache"];
  const EVENT_DEFS = {
    meteorShower: { duration: 9, title: "Meteor yagmuru" },
    salvageCache: { duration: 7, title: "Salvage cache" },
  };
  const CACHE_TYPES = ["shield", "overdrive", "repair"];

  function createSectorState() {
    return { timer: 18, activeEvent: null, eventIndex: 0 };
  }

  function updateSectorEvents(state, delta) {
    if (!state.sector) state.sector = createSectorState();
    if (state.phase !== "playing") return;
    if (!state.sector.activeEvent) {
      state.sector.timer -= delta;
      if (state.sector.timer <= 0) startSectorEvent(state);
    }
    if (state.sector.activeEvent) updateActiveEvent(state, delta);
  }

  function startSectorEvent(state) {
    const type = EVENT_ORDER[state.sector.eventIndex % EVENT_ORDER.length];
    const def = EVENT_DEFS[type];
    state.sector.eventIndex += 1;
    state.sector.activeEvent = { type, title: def.title, timeLeft: def.duration, meteorCooldown: 0 };
    if (type === "salvageCache") dropSalvageCache(state);
    addEventPing(state, type);
  }

  function updateActiveEvent(state, delta) {
    const event = state.sector.activeEvent;
    event.timeLeft -= delta;
    if (event.type === "meteorShower") updateMeteorShower(state, delta);
    if (event.timeLeft <= 0) {
      state.sector.activeEvent = null;
      state.sector.timer = 24 + (state.wave || 1);
    }
  }

  function updateMeteorShower(state, delta) {
    const event = state.sector.activeEvent;
    event.meteorCooldown = (event.meteorCooldown || 0) - delta;
    if (event.meteorCooldown > 0) return;
    event.meteorCooldown = 0.52;
    const spawned = event.spawned || 0;
    event.spawned = spawned + 1;
    state.enemyBullets.push(createMeteor(state, spawned));
  }

  function createMeteor(state, index) {
    const camera = state.camera || { x: 0, y: 0, width: state.world.width, height: state.world.height };
    const x = clamp(camera.x + 80 + ((index * 173) % camera.width), 20, state.world.width - 20);
    const y = clamp(camera.y - 24, -40, state.world.height - 20);
    return {
      x,
      y,
      vx: -70 + (index % 3) * 70,
      vy: 360,
      width: 22,
      height: 22,
      life: 3.4,
      damage: 1,
      color: "#f0a040",
      trailColor: "#f2dfb6",
      style: "meteor",
    };
  }

  function dropSalvageCache(state) {
    const offsets = [-34, 0, 34];
    for (const [index, type] of CACHE_TYPES.entries()) {
      const loot = createCacheLoot(type, state.player.x + offsets[index], state.player.y - 58);
      state.lootDrops.push(loot);
    }
  }

  function createCacheLoot(type, x, y) {
    return { type, x, y, width: 18, height: 18, size: 18, life: 12, pulse: 0 };
  }

  function addEventPing(state, type) {
    if (!window.CombatJuice?.addPing) return;
    const kind = type === "meteorShower" ? "bossVolley" : "loot";
    window.CombatJuice.addPing(state, kind, state.player.x, state.player.y);
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  window.SectorEvents = { createSectorState, startSectorEvent, updateSectorEvents };
})();
