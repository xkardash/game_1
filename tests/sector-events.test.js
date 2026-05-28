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
    player: { x: 420, y: 300 },
    camera: { x: 0, y: 0, width: 960, height: 540 },
    world: { width: 1760, height: 1040 },
    enemyBullets: [],
    lootDrops: [],
    combatPings: [],
  };
}

test("meteor sector event starts deterministically and spawns hazards", () => {
  const SectorEvents = loadSectorEvents();
  const state = createState(0);

  SectorEvents.updateSectorEvents(state, 0.5);

  assert.equal(state.sector.activeEvent.type, "meteorShower");
  assert.equal(state.enemyBullets.length, 1);
  assert.equal(state.enemyBullets[0].style, "meteor");
  assert.ok(state.enemyBullets[0].vy > 0);
});

test("salvage sector event drops a compact cache near the player", () => {
  const SectorEvents = loadSectorEvents();
  const state = createState(1);

  SectorEvents.updateSectorEvents(state, 0.2);

  assert.equal(state.sector.activeEvent.type, "salvageCache");
  assert.equal(state.lootDrops.length, 3);
  assert.equal(state.lootDrops.map((loot) => loot.type).join(","), "shield,overdrive,repair");
});

test("active sector events expire and schedule the next event", () => {
  const SectorEvents = loadSectorEvents();
  const state = createState(0);
  state.sector.activeEvent = { type: "meteorShower", title: "Meteor", timeLeft: 0.1, meteorCooldown: 0.4 };

  SectorEvents.updateSectorEvents(state, 0.2);

  assert.equal(state.sector.activeEvent, null);
  assert.ok(state.sector.timer > 10);
});
