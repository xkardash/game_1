const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

function loadBossSystem() {
  const context = { console, Math };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync("src/boss-phase.js", "utf8"), context, { filename: "src/boss-phase.js" });
  vm.runInContext(fs.readFileSync("src/boss-system.js", "utf8"), context, { filename: "src/boss-system.js" });
  return context.BossSystem;
}

test("boss system records phase transition flashes without duplicating the same phase", () => {
  const BossSystem = loadBossSystem();
  const boss = { x: 140, y: 120, hp: 90, maxHp: 100, type: "boss", bossArchetype: "core", bossFireCooldown: 99 };
  const state = {
    bossPhaseFlashes: [],
    enemyBullets: [],
    enemies: [boss],
    player: { x: 240, y: 120 },
    shake: 0,
  };

  BossSystem.updateBosses(state, 0.1);
  assert.equal(boss.currentBossPhase, 1);
  assert.equal(state.bossPhaseFlashes.length, 0);

  boss.hp = 50;
  BossSystem.updateBosses(state, 0.1);
  assert.equal(boss.currentBossPhase, 2);
  assert.equal(state.lastBossPhaseChange.phase, 2);
  assert.equal(state.bossPhaseFlashes.length, 1);
  assert.equal(state.bossPhaseFlashes[0].color, "#f0a040");

  BossSystem.updateBosses(state, 0.1);
  assert.equal(state.bossPhaseFlashes.length, 1);

  boss.hp = 20;
  BossSystem.updateBosses(state, 0.1);
  assert.equal(boss.currentBossPhase, 3);
  assert.equal(state.lastBossPhaseChange.phase, 3);
  assert.equal(state.bossPhaseFlashes.length, 2);
});
