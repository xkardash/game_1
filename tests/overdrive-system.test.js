const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

function loadOverdriveSystem() {
  const context = { console, Math };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync("src/overdrive-system.js", "utf8"), context, { filename: "src/overdrive-system.js" });
  return context.OverdriveSystem;
}

function createPlayer(overrides = {}) {
  return {
    overdrive: 0,
    overdriveCharge: 0,
    overdriveMax: 100,
    relics: [],
    stats: { damage: 2, magnet: 120 },
    upgrades: [],
    x: 100,
    y: 100,
    ...overrides,
  };
}

test("overdrive charge fills, clamps, and exposes ready state", () => {
  const OverdriveSystem = loadOverdriveSystem();
  const player = createPlayer();

  OverdriveSystem.addCharge(player, 34);
  assert.equal(player.overdriveCharge, 34);
  assert.equal(OverdriveSystem.isReady(player), false);

  OverdriveSystem.addCharge(player, 80);
  assert.equal(player.overdriveCharge, 100);
  assert.equal(player.overdriveReady, true);
  assert.equal(OverdriveSystem.isReady(player), true);
  assert.equal(OverdriveSystem.getChargeRatio(player), 1);
});

test("overdrive mode follows the current relic and upgrade build", () => {
  const OverdriveSystem = loadOverdriveSystem();

  assert.equal(OverdriveSystem.getMode(createPlayer()).id, "surge");
  assert.equal(OverdriveSystem.getMode(createPlayer({ relics: ["novaCore"], upgrades: ["damage"] })).id, "nova");
  assert.equal(OverdriveSystem.getMode(createPlayer({ relics: ["phaseInjector"], upgrades: ["rapid"] })).id, "phase");
  assert.equal(OverdriveSystem.getMode(createPlayer({ relics: ["voidSiphon"], upgrades: ["magnet"] })).id, "void");
});

test("nova overdrive spends charge and damages nearby enemies", () => {
  const OverdriveSystem = loadOverdriveSystem();
  const player = createPlayer({ overdriveCharge: 100, relics: ["novaCore"], upgrades: ["damage"] });
  const near = { hp: 6, maxHp: 6, type: "tank", x: 150, y: 100 };
  const far = { hp: 20, maxHp: 20, type: "sniper", x: 480, y: 100 };
  const state = { enemies: [near, far], overdriveBursts: [], player, shake: 0 };
  const particles = [];
  const destroyed = [];
  const effects = { emitParticles: (...args) => particles.push(args) };

  const event = OverdriveSystem.activate(state, effects, (enemy) => destroyed.push(enemy));

  assert.equal(event.mode, "nova");
  assert.equal(player.overdriveCharge, 0);
  assert.equal(player.overdriveReady, false);
  assert.ok(player.overdrive > 0);
  assert.equal(state.lastOverdrive.mode, "nova");
  assert.equal(state.overdriveBursts.length, 1);
  assert.ok(near.hp <= 0);
  assert.equal(far.hp, 20);
  assert.equal(destroyed[0], near);
  assert.ok(particles.length > 0);
});

test("void overdrive pulses damage while active", () => {
  const OverdriveSystem = loadOverdriveSystem();
  const player = createPlayer({ activeOverdriveMode: "void", overdrive: 3, stats: { damage: 1, magnet: 150 } });
  const enemy = { hp: 5, maxHp: 5, type: "scout", x: 130, y: 100 };
  const state = { enemies: [enemy], overdriveBursts: [], player, shake: 0 };

  OverdriveSystem.update(state, 0.4, { emitParticles: () => {} }, () => {});

  assert.ok(enemy.hp < 5);
  assert.equal(state.overdriveBursts.length, 1);
});
