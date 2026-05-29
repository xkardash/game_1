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

function fireAfterTelegraph(BossSystem, state) {
  let telegraphEvent = null;
  let volleyEvent = null;
  BossSystem.updateBosses(state, 0.16, () => {}, (event) => { telegraphEvent = event; });
  assert.ok(telegraphEvent);
  assert.equal(state.enemyBullets.length, 0);
  BossSystem.updateBosses(state, 0.5, (event) => { volleyEvent = event; }, () => {});
  return { telegraphEvent, volleyEvent };
}

test("bulwark bosses fire slow heavy pressure shots", () => {
  const BossSystem = loadBossSystem();
  const boss = { x: 100, y: 100, hp: 70, maxHp: 100, type: "boss", bossArchetype: "bulwark", bossFireCooldown: 0 };
  const state = createState(boss);

  const { telegraphEvent, volleyEvent } = fireAfterTelegraph(BossSystem, state);

  assert.equal(telegraphEvent.pattern, "bulwarkBarrage");
  assert.equal(volleyEvent.pattern, "bulwarkBarrage");
  assert.equal(state.lastBossAttackPattern, "bulwarkBarrage");
  assert.equal(state.enemyBullets.length, 6);
  assert.ok(state.enemyBullets.every((bullet) => bullet.style === "bulwarkShot"));
  assert.ok(state.enemyBullets.every((bullet) => bullet.width >= 16));
  assert.ok(state.enemyBullets.every((bullet) => Math.hypot(bullet.vx, bullet.vy) < 260));
});

test("phase bosses strafe and fire fast phase shards", () => {
  const BossSystem = loadBossSystem();
  const boss = { x: 100, y: 100, hp: 70, maxHp: 100, type: "boss", bossArchetype: "phase", bossFireCooldown: 0 };
  const state = createState(boss);

  const { telegraphEvent, volleyEvent } = fireAfterTelegraph(BossSystem, state);

  assert.equal(telegraphEvent.pattern, "phaseStrafe");
  assert.equal(volleyEvent.pattern, "phaseStrafe");
  assert.notEqual(Math.round(boss.y), 100);
  assert.equal(state.enemyBullets.length, 7);
  assert.ok(state.enemyBullets.every((bullet) => bullet.style === "phaseShard"));
  assert.ok(state.enemyBullets.every((bullet) => Math.hypot(bullet.vx, bullet.vy) > 410));
});

test("core bosses deploy lingering core hazard mines", () => {
  const BossSystem = loadBossSystem();
  const boss = { x: 100, y: 100, hp: 70, maxHp: 100, type: "boss", bossArchetype: "core", bossFireCooldown: 0 };
  const state = createState(boss);

  const { telegraphEvent, volleyEvent } = fireAfterTelegraph(BossSystem, state);

  assert.equal(telegraphEvent.pattern, "coreMineRing");
  assert.equal(volleyEvent.pattern, "coreMineRing");
  assert.equal(state.enemyBullets.length, 12);
  assert.ok(state.enemyBullets.every((bullet) => bullet.style === "coreMine"));
  assert.ok(state.enemyBullets.every((bullet) => bullet.life >= 6));
});
