const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

function loadRadarSystem() {
  const context = { console, Math };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync("src/radar-system.js", "utf8"), context, { filename: "src/radar-system.js" });
  return context.RadarSystem;
}

test("radar projects world positions into a clamped minimap square", () => {
  const RadarSystem = loadRadarSystem();
  const world = { width: 1760, height: 1040 };
  const inside = RadarSystem.projectPoint({ x: 880, y: 520 }, world, 120);
  const outside = RadarSystem.projectPoint({ x: 9999, y: -120 }, world, 120);

  assert.equal(inside.x, 60);
  assert.equal(inside.y, 60);
  assert.equal(outside.x, 120);
  assert.equal(outside.y, 0);
});

test("radar returns readable player, enemy, boss, elite, and loot blips", () => {
  const RadarSystem = loadRadarSystem();
  const state = {
    player: { x: 880, y: 520 },
    enemies: [
      { x: 300, y: 200, type: "scout" },
      { x: 1200, y: 540, type: "boss" },
      { x: 900, y: 700, type: "tank", elite: true },
    ],
    lootDrops: [{ x: 920, y: 500, type: "core" }],
  };
  const blips = RadarSystem.getBlips(state, { width: 1760, height: 1040 }, 120);

  assert.equal(blips.map((blip) => blip.kind).join(","), "player,enemy,boss,elite,loot");
  assert.ok(blips.every((blip) => blip.x >= 0 && blip.x <= 120 && blip.y >= 0 && blip.y <= 120));
});

test("radar includes the active tactical objective as a distinct blip", () => {
  const RadarSystem = loadRadarSystem();
  const state = {
    player: { x: 880, y: 520 },
    enemies: [],
    lootDrops: [],
    tacticalObjectives: {
      active: { x: 1320, y: 720, kind: "signalBeacon" },
    },
  };

  const blips = RadarSystem.getBlips(state, { width: 1760, height: 1040 }, 120);

  assert.equal(blips.map((blip) => blip.kind).join(","), "player,objective");
});
