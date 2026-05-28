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

test("boss phase scales as health drops", () => {
  const BossSystem = loadBossSystem();
  const boss = { hp: 90, maxHp: 100 };

  assert.equal(BossSystem.getBossPhase(boss), 1);
  boss.hp = 58;
  assert.equal(BossSystem.getBossPhase(boss), 2);
  boss.hp = 24;
  assert.equal(BossSystem.getBossPhase(boss), 3);
});

test("boss volleys scale bullet count and speed by phase", () => {
  const BossSystem = loadBossSystem();
  const boss = { x: 100, y: 100, hp: 24, maxHp: 100 };
  const bullets = BossSystem.createBossVolley(boss, { x: 180, y: 100 });

  assert.equal(bullets.length, 14);
  assert.ok(bullets.every((bullet) => bullet.life === 4));
  assert.ok(Math.hypot(bullets[0].vx, bullets[0].vy) > 280);
});

test("boss update fires radial volleys into enemy bullet state", () => {
  const BossSystem = loadBossSystem();
  const state = {
    enemyBullets: [],
    enemies: [{ x: 100, y: 100, hp: 40, maxHp: 100, type: "boss", bossFireCooldown: 0 }],
    player: { x: 160, y: 120 },
  };

  BossSystem.updateBosses(state, 0.16);

  assert.equal(state.enemyBullets.length, 12);
  assert.ok(state.enemies[0].bossFireCooldown > 0);
});

test("phase two bosses alternate into aimed burst patterns", () => {
  const BossSystem = loadBossSystem();
  const boss = { x: 100, y: 100, hp: 50, maxHp: 100, type: "boss", bossFireCooldown: 0, bossAttackIndex: 1 };
  const state = { enemyBullets: [], enemies: [boss], player: { x: 220, y: 100 } };
  let event = null;

  BossSystem.updateBosses(state, 0.16, (nextEvent) => { event = nextEvent; });

  assert.equal(event.pattern, "aimedBurst");
  assert.equal(state.enemyBullets.length, 5);
  assert.ok(state.enemyBullets.every((bullet) => bullet.style === "bossBurst"));
  assert.ok(state.enemyBullets.every((bullet) => bullet.vx > 0));
  assert.equal(boss.bossAttackIndex, 2);
});

test("phase three bosses can deploy slow hazard mine rings", () => {
  const BossSystem = loadBossSystem();
  const boss = { x: 100, y: 100, hp: 20, maxHp: 100, type: "boss", bossFireCooldown: 0, bossAttackIndex: 2 };
  const state = { enemyBullets: [], enemies: [boss], player: { x: 220, y: 100 } };
  let event = null;

  BossSystem.updateBosses(state, 0.16, (nextEvent) => { event = nextEvent; });

  assert.equal(event.pattern, "mineRing");
  assert.equal(state.enemyBullets.length, 10);
  assert.ok(state.enemyBullets.every((bullet) => bullet.style === "bossMine"));
  assert.ok(state.enemyBullets.every((bullet) => Math.hypot(bullet.vx, bullet.vy) < 120));
});
