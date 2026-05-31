(() => {
  const EVENT_ORDER = ["salvageCache", "ionStorm", "riftMines", "plasmaFront"];
  const EVENT_DEFS = {
    ionStorm: { duration: 8, title: "Iyon firtinasi" },
    meteorShower: { duration: 9, title: "Meteor yagmuru" },
    plasmaFront: { duration: 7, title: "Plazma cephesi" },
    riftMines: { duration: 8, title: "Faz mayinlari" },
    salvageCache: { duration: 7, title: "Salvage cache" },
  };
  const CACHE_TYPES = ["shield", "overdrive", "repair"];

  function createSectorState() {
    return { timer: 18, activeEvent: null, eventIndex: 0, lastMeteorWave: 0 };
  }

  function updateSectorEvents(state, delta) {
    if (!state.sector) state.sector = createSectorState();
    if (state.phase !== "playing") return;
    if (!state.sector.activeEvent) {
      if (shouldStartMeteorCheckpoint(state)) startSectorEvent(state, "meteorShower");
      else {
        state.sector.timer -= delta;
        if (state.sector.timer <= 0) startSectorEvent(state);
      }
    }
    if (state.sector.activeEvent) updateActiveEvent(state, delta);
  }

  function startSectorEvent(state, forcedType = "") {
    const type = forcedType || EVENT_ORDER[state.sector.eventIndex % EVENT_ORDER.length];
    const def = EVENT_DEFS[type];
    if (!forcedType) state.sector.eventIndex += 1;
    if (type === "meteorShower") state.sector.lastMeteorWave = state.wave || 0;
    state.sector.activeEvent = { type, title: def.title, timeLeft: def.duration, hazardCooldown: 0, spawned: 0 };
    if (type === "salvageCache") dropSalvageCache(state);
    addEventPing(state, type);
  }

  function shouldStartMeteorCheckpoint(state) {
    const wave = state.wave || 1;
    return wave > 0 && wave % 4 === 0 && state.sector.lastMeteorWave !== wave;
  }

  function updateActiveEvent(state, delta) {
    const event = state.sector.activeEvent;
    event.timeLeft -= delta;
    if (event.type === "ionStorm") updateHazardEvent(state, 0.62, createIonBolt, delta);
    if (event.type === "meteorShower") updateMeteorShower(state, delta);
    if (event.type === "plasmaFront") updateHazardEvent(state, 1.35, createPlasmaWall, delta);
    if (event.type === "riftMines") updateHazardEvent(state, 1.08, createRiftMine, delta);
    if (event.timeLeft <= 0) {
      state.sector.activeEvent = null;
      state.sector.timer = 24 + (state.wave || 1);
    }
  }

  function updateMeteorShower(state, delta) {
    updateHazardEvent(state, 0.52, createMeteor, delta);
  }

  function updateHazardEvent(state, cooldown, factory, delta) {
    const event = state.sector.activeEvent;
    event.hazardCooldown = (event.hazardCooldown || 0) - delta;
    if (event.hazardCooldown > 0) return;
    event.hazardCooldown = cooldown;
    const spawned = event.spawned || 0;
    event.spawned = spawned + 1;
    state.enemyBullets.push(factory(state, spawned));
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

  function createIonBolt(state, index) {
    const camera = getCamera(state);
    const leftSide = index % 2 === 0;
    const x = leftSide ? camera.x - 28 : camera.x + camera.width + 28;
    const y = clamp(camera.y + 70 + ((index * 149) % Math.max(1, camera.height - 140)), 24, state.world.height - 24);
    return {
      x,
      y,
      vx: leftSide ? 265 : -265,
      vy: 175 + (index % 3) * 22,
      width: 16,
      height: 16,
      life: 3.2,
      damage: 1,
      color: "#7df8ff",
      trailColor: "#d9fbff",
      style: "ionBolt",
    };
  }

  function createRiftMine(state, index) {
    const angle = index * 2.17;
    const radius = 155 + (index % 3) * 46;
    return {
      x: clamp(state.player.x + Math.cos(angle) * radius, 34, state.world.width - 34),
      y: clamp(state.player.y + Math.sin(angle) * radius, 34, state.world.height - 34),
      vx: 0,
      vy: 0,
      width: 42,
      height: 42,
      life: 4.8,
      damage: 1,
      color: "#8f6df2",
      trailColor: "#d9fbff",
      style: "riftMine",
    };
  }

  function createPlasmaWall(state, index) {
    const camera = getCamera(state);
    const fromLeft = index % 2 === 0;
    const x = fromLeft ? camera.x - 54 : camera.x + camera.width + 54;
    const y = clamp(camera.y + 120 + ((index * 211) % Math.max(1, camera.height - 240)), 44, state.world.height - 44);
    return {
      x,
      y,
      vx: fromLeft ? 118 : -118,
      vy: 0,
      width: 48,
      height: 122,
      life: 7.2,
      damage: 1,
      color: "#e8573f",
      trailColor: "#f0b84a",
      style: "plasmaWall",
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
    const kind = type === "salvageCache" ? "loot" : "bossVolley";
    window.CombatJuice.addPing(state, kind, state.player.x, state.player.y);
  }

  function getCamera(state) {
    return state.camera || { x: 0, y: 0, width: state.world.width, height: state.world.height };
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  window.SectorEvents = { createSectorState, startSectorEvent, updateSectorEvents };
})();
