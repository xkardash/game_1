const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

function loadSectorEvents() {
  const context = { console, Math };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync("src/sector-events.js", "utf8"), context, { filename: "src/sector-events.js" });
  return context.SectorEvents;
}

function createState(eventIndex = 0) {
  return {
    phase: "playing",
    sector: { timer: 0, activeEvent: null, eventIndex, meteorCooldown: 0 },
    wave: 1,
    player: { x: 420, y: 300 },
    camera: { x: 0, y: 0, width: 960, height: 540 },
    world: { width: 1760, height: 1040 },
    enemyBullets: [],
    lootDrops: [],
    combatPings: [],
  };
}

test("meteor sector event starts every fourth wave before the timer expires", () => {
  const SectorEvents = loadSectorEvents();
  const state = createState(0);
  state.wave = 4;
  state.sector.timer = 99;

  SectorEvents.updateSectorEvents(state, 0.5);

  assert.equal(state.sector.activeEvent.type, "meteorShower");
  assert.equal(state.sector.lastMeteorWave, 4);
  assert.equal(state.enemyBullets.length, 1);
  assert.equal(state.enemyBullets[0].style, "meteor");
  assert.ok(state.enemyBullets[0].vy > 0);
});

test("normal sector rotation starts salvage instead of meteor rain", () => {
  const SectorEvents = loadSectorEvents();
  const state = createState(0);

  SectorEvents.updateSectorEvents(state, 0.2);

  assert.equal(state.sector.activeEvent.type, "salvageCache");
  assert.equal(state.lootDrops.length, 3);
});

test("salvage sector event drops a compact cache near the player", () => {
  const SectorEvents = loadSectorEvents();
  const state = createState(0);

  SectorEvents.updateSectorEvents(state, 0.2);

  assert.equal(state.sector.activeEvent.type, "salvageCache");
  assert.equal(state.lootDrops.length, 3);
  assert.equal(state.lootDrops.map((loot) => loot.type).join(","), "shield,overdrive,repair");
});

test("ion storm sector event fires readable diagonal bolts", () => {
  const SectorEvents = loadSectorEvents();
  const state = createState(1);

  SectorEvents.updateSectorEvents(state, 0.2);

  assert.equal(state.sector.activeEvent.type, "ionStorm");
  assert.equal(state.enemyBullets.length, 1);
  assert.equal(state.enemyBullets[0].style, "ionBolt");
  assert.equal(state.enemyBullets[0].damage, 1);
  assert.ok(Math.abs(state.enemyBullets[0].vx) >= 120);
  assert.ok(state.enemyBullets[0].vy > 150);
});

test("rift mine sector event seeds stationary dodge hazards", () => {
  const SectorEvents = loadSectorEvents();
  const state = createState(2);

  SectorEvents.updateSectorEvents(state, 0.2);

  assert.equal(state.sector.activeEvent.type, "riftMines");
  assert.equal(state.enemyBullets.length, 1);
  assert.equal(state.enemyBullets[0].style, "riftMine");
  assert.equal(state.enemyBullets[0].damage, 1);
  assert.equal(state.enemyBullets[0].vx, 0);
  assert.equal(state.enemyBullets[0].vy, 0);
  assert.ok(state.enemyBullets[0].life >= 4);
});

test("plasma front sector event creates a slow sweeping wall", () => {
  const SectorEvents = loadSectorEvents();
  const state = createState(3);

  SectorEvents.updateSectorEvents(state, 0.2);

  assert.equal(state.sector.activeEvent.type, "plasmaFront");
  assert.equal(state.enemyBullets.length, 1);
  assert.equal(state.enemyBullets[0].style, "plasmaWall");
  assert.equal(state.enemyBullets[0].damage, 1);
  assert.ok(state.enemyBullets[0].width > 32);
  assert.ok(Math.abs(state.enemyBullets[0].vx) >= 90);
});

test("challenge hazards stay bounded during a short event window", () => {
  const SectorEvents = loadSectorEvents();
  const state = createState(1);

  SectorEvents.updateSectorEvents(state, 0.2);
  for (let index = 0; index < 12; index += 1) {
    SectorEvents.updateSectorEvents(state, 0.25);
  }

  assert.ok(state.enemyBullets.length <= 7);
  assert.ok(state.enemyBullets.every((bullet) => bullet.damage === 1));
});

test("meteor checkpoint does not restart twice on the same wave", () => {
  const SectorEvents = loadSectorEvents();
  const state = createState(0);
  state.wave = 8;
  state.sector.timer = 99;

  SectorEvents.updateSectorEvents(state, 0.2);
  state.sector.activeEvent = null;
  state.enemyBullets = [];
  SectorEvents.updateSectorEvents(state, 0.2);

  assert.equal(state.sector.activeEvent, null);
  assert.equal(state.enemyBullets.length, 0);
  assert.equal(state.sector.lastMeteorWave, 8);
});

test("active sector events expire and schedule the next event", () => {
  const SectorEvents = loadSectorEvents();
  const state = createState(0);
  state.sector.activeEvent = { type: "meteorShower", title: "Meteor", timeLeft: 0.1, meteorCooldown: 0.4 };

  SectorEvents.updateSectorEvents(state, 0.2);

  assert.equal(state.sector.activeEvent, null);
  assert.ok(state.sector.timer > 10);
});
