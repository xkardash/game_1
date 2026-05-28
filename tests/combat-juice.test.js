const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

function loadScripts(paths) {
  const context = { console, Math };
  context.window = context;
  vm.createContext(context);
  for (const filePath of paths) {
    vm.runInContext(fs.readFileSync(filePath, "utf8"), context, { filename: filePath });
  }
  return context;
}

test("combat pings expand, fade, and expire", () => {
  const { CombatJuice } = loadScripts(["src/combat-juice.js"]);
  const state = { combatPings: [] };

  const ping = CombatJuice.addPing(state, "loot", 120, 80);
  const startingRadius = ping.radius;
  CombatJuice.updatePings(state, 0.16);

  assert.equal(state.combatPings.length, 1);
  assert.ok(state.combatPings[0].radius > startingRadius);
  assert.ok(state.combatPings[0].life < state.combatPings[0].maxLife);

  CombatJuice.updatePings(state, 10);
  assert.equal(state.combatPings.length, 0);
});

test("pickup and elite helpers add themed battlefield feedback", () => {
  const { CombatJuice } = loadScripts(["src/combat-juice.js"]);
  const state = { combatPings: [] };

  CombatJuice.addPickupPing(state, { type: "core", x: 10, y: 20 });
  CombatJuice.addEliteSpawnPing(state, { x: 40, y: 50, affix: "armored" });

  assert.equal(state.combatPings.length, 2);
  assert.equal(state.combatPings[0].kind, "corePickup");
  assert.equal(state.combatPings[1].kind, "elite");
  assert.notEqual(state.combatPings[0].color, state.combatPings[1].color);
});

test("boss updates can emit volley warning combat pings", () => {
  const { BossSystem, CombatJuice } = loadScripts(["src/combat-juice.js", "src/boss-system.js"]);
  const state = {
    combatPings: [],
    enemyBullets: [],
    enemies: [{ x: 100, y: 100, hp: 40, maxHp: 100, type: "boss", bossFireCooldown: 0 }],
    player: { x: 160, y: 120 },
  };
  let volleyEvent = null;

  BossSystem.updateBosses(state, 0.16, (event) => {
    volleyEvent = event;
    CombatJuice.addBossVolleyWarning(state, event.boss, event.phase);
  });

  assert.equal(volleyEvent.phase, 2);
  assert.equal(state.enemyBullets.length, 12);
  assert.equal(state.combatPings.length, 1);
  assert.equal(state.combatPings[0].kind, "bossVolley");
});
