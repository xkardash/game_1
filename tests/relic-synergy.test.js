const fs = require("node:fs");
const test = require("node:test");
const vm = require("node:vm");
const assert = require("node:assert/strict");

function loadSystems() {
  const context = { window: {} };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync("src/relic-synergy.js", "utf8"), context, { filename: "src/relic-synergy.js" });
  vm.runInContext(fs.readFileSync("src/weapon-evolution.js", "utf8"), context, { filename: "src/weapon-evolution.js" });
  return context;
}

test("relic synergy rules identify build evolutions", () => {
  const { RelicSynergy } = loadSystems();
  const player = {
    upgrades: ["damage", "magnet", "rapid"],
    relics: ["novaCore", "voidSiphon", "phaseInjector"],
    stats: { damage: 2, fireRate: 0.25, magnet: 120 },
  };

  const ids = Array.from(RelicSynergy.getActiveSynergies(player), (synergy) => synergy.id);

  assert.deepEqual(ids, ["novaLance", "voidField", "phaseBurst"]);
});

test("relic synergies evolve projectile profiles", () => {
  const { WeaponEvolution } = loadSystems();

  const novaProfile = WeaponEvolution.getWeaponEvolution({
    upgrades: ["damage"],
    relics: ["novaCore"],
    lootCores: 0,
  });
  assert.equal(novaProfile.id, "novaLance");
  assert.equal(novaProfile.style, "novaLance");
  assert.ok(novaProfile.areaDamageScale > 0);

  const phaseProfile = WeaponEvolution.getWeaponEvolution({
    upgrades: ["rapid"],
    relics: ["phaseInjector"],
    lootCores: 0,
  });
  assert.equal(phaseProfile.id, "phaseBurst");
  assert.equal(phaseProfile.style, "phaseShot");
  assert.ok(phaseProfile.pierce >= 1);
  assert.ok(phaseProfile.speed > 800);
});

test("void field pulses damage nearby enemies but not distant enemies", () => {
  const { RelicSynergy } = loadSystems();
  const state = {
    relicFields: [],
    player: {
      x: 100,
      y: 100,
      upgrades: ["magnet"],
      relics: ["voidSiphon"],
      stats: { magnet: 110 },
    },
    enemies: [
      { id: 1, x: 135, y: 100, hp: 8, flash: 0 },
      { id: 2, x: 300, y: 100, hp: 8, flash: 0 },
    ],
  };
  const particles = [];

  RelicSynergy.updateCombatFields(state, {
    emitParticles: (_state, x, y, color, amount) => particles.push({ x, y, color, amount }),
  }, 0.42);

  assert.ok(state.enemies[0].hp < 8);
  assert.equal(state.enemies[1].hp, 8);
  assert.equal(state.relicFields.length, 1);
  assert.equal(particles[0].color, "#52d6bd");
});
