const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

function loadBossSystem() {
  const context = { console, Math };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync("src/boss-system.js", "utf8"), context, { filename: "src/boss-system.js" });
  return context.BossSystem;
}

function createState(boss) {
  return {
    bossTelegraphs: [],
    enemyBullets: [],
    enemies: [boss],
    player: { x: 260, y: 120 },
    shake: 0,
  };
}

test("archetype bosses warn before special attacks spawn bullets", () => {
  const BossSystem = loadBossSystem();
  const boss = { x: 100, y: 100, hp: 70, maxHp: 100, type: "boss", bossArchetype: "phase", bossFireCooldown: 0 };
  const state = createState(boss);
  let volleyEvent = null;
  let telegraphEvent = null;

  BossSystem.updateBosses(
    state,
    0.2,
    (event) => { volleyEvent = event; },
    (event) => { telegraphEvent = event; },
  );

  assert.equal(volleyEvent, null);
  assert.equal(state.enemyBullets.length, 0);
  assert.equal(telegraphEvent.pattern, "phaseStrafe");
  assert.equal(state.lastBossTelegraphPattern, "phaseStrafe");
  assert.equal(state.bossTelegraphs.length, 1);
  assert.equal(state.bossTelegraphs[0].pattern, "phaseStrafe");
  assert.ok(boss.pendingBossAttack);
});

test("telegraphed archetype attacks fire after their windup", () => {
  const BossSystem = loadBossSystem();
  const boss = { x: 100, y: 100, hp: 70, maxHp: 100, type: "boss", bossArchetype: "bulwark", bossFireCooldown: 0 };
  const state = createState(boss);
  let volleyEvent = null;

  BossSystem.updateBosses(state, 0.16, () => {}, () => {});
  BossSystem.updateBosses(state, 0.5, (event) => { volleyEvent = event; }, () => {});

  assert.equal(volleyEvent.pattern, "bulwarkBarrage");
  assert.equal(state.lastBossAttackPattern, "bulwarkBarrage");
  assert.equal(state.enemyBullets.length, 6);
  assert.ok(state.enemyBullets.every((bullet) => bullet.style === "bulwarkShot"));
  assert.equal(boss.pendingBossAttack, null);
  assert.ok(boss.bossFireCooldown > 0);
});

test("untyped bosses keep firing immediately without telegraph windup", () => {
  const BossSystem = loadBossSystem();
  const boss = { x: 100, y: 100, hp: 70, maxHp: 100, type: "boss", bossFireCooldown: 0 };
  const state = createState(boss);
  let volleyEvent = null;
  let telegraphEvent = null;

  BossSystem.updateBosses(
    state,
    0.16,
    (event) => { volleyEvent = event; },
    (event) => { telegraphEvent = event; },
  );

  assert.equal(telegraphEvent, null);
  assert.equal(volleyEvent.pattern, "radialVolley");
  assert.equal(state.enemyBullets.length, 8);
  assert.equal(state.bossTelegraphs.length, 0);
});
