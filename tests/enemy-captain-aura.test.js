const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

function loadEnemySystem() {
  const context = { console, Math };
  context.window = context;
  context.SurvivalRules = {
    getBounds: (entity) => entity,
    getDistance: (first, second) => Math.hypot(first.x - second.x, first.y - second.y),
    getUnitVector: (from, to) => {
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const length = Math.hypot(dx, dy) || 1;
      return { x: dx / length, y: dy / length };
    },
    overlaps: () => false,
  };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync("src/enemy-system.js", "utf8"), context, { filename: "src/enemy-system.js" });
  return context.EnemySystem;
}

test("captain aura buffs nearby allies but leaves distant enemies untouched", () => {
  const EnemySystem = loadEnemySystem();
  const captain = {
    captain: true,
    captainAura: { range: 220, speedScale: 1.18 },
    hp: 20,
    type: "tank",
    x: 100,
    y: 100,
  };
  const nearby = { type: "scout", speed: 100, x: 190, y: 100 };
  const distant = { type: "sniper", speed: 100, x: 420, y: 100 };
  const state = { enemies: [captain, nearby, distant] };

  EnemySystem.applyCaptainAuras(state);

  assert.equal(nearby.captainBuff, "speed");
  assert.equal(nearby.speedMultiplier, 1.18);
  assert.equal(distant.captainBuff, "");
  assert.equal(distant.speedMultiplier, 1);
});

test("captain aura changes chaser movement speed during enemy update", () => {
  const EnemySystem = loadEnemySystem();
  const captain = {
    captain: true,
    captainAura: { range: 220, speedScale: 1.5 },
    hp: 20,
    pulse: 0,
    pulseRate: 1,
    type: "tank",
    x: 100,
    y: 100,
  };
  const scout = { fireCooldown: 9, hp: 4, pulse: 0, pulseRate: 1, speed: 100, type: "scout", x: 150, y: 100 };
  const state = { enemies: [captain, scout], enemyBullets: [], player: { x: 450, y: 100 } };

  EnemySystem.updateEnemies(state, 1, () => {});

  assert.ok(scout.x >= 300);
  assert.equal(scout.captainBuff, "speed");
});
