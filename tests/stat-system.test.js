const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

function loadStatSystem() {
  const context = { console };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync("src/relic-synergy.js", "utf8"), context, { filename: "src/relic-synergy.js" });
  vm.runInContext(fs.readFileSync("src/weapon-evolution.js", "utf8"), context, { filename: "src/weapon-evolution.js" });
  vm.runInContext(fs.readFileSync("src/relic-system.js", "utf8"), context, { filename: "src/relic-system.js" });
  vm.runInContext(fs.readFileSync("src/stat-system.js", "utf8"), context, { filename: "src/stat-system.js" });
  return context.StatSystem;
}

test("stat system formats live ship stats and weapon synergies", () => {
  const StatSystem = loadStatSystem();
  const state = {
    level: 5,
    player: {
      lives: 4,
      shields: 2,
      speed: 349,
      stats: { damage: 2, fireRate: 0.25, projectileCount: 2, magnet: 84 },
      upgrades: ["damage", "rapid"],
      lootCores: 0,
      relics: ["starforgedHull", "novaCore"],
    },
  };

  const rows = StatSystem.createStatRows(state);
  const byKey = Object.fromEntries(Array.from(rows, (row) => [row.key, row]));

  assert.equal(byKey.damage.value, "2.5");
  assert.equal(byKey.fireRate.value, "4.0/sn");
  assert.equal(byKey.projectiles.value, "2");
  assert.equal(byKey.speed.value, "349");
  assert.equal(byKey.magnet.value, "84 px");
  assert.equal(byKey.shield.value, "2");
  assert.equal(byKey.weapon.value, "Nova Lance");
  assert.equal(byKey.synergy.value, "Delici Lazer + Nova Lance");
  assert.equal(byKey.relics.value, "Yildiz Zirhi + Nova Cekirdegi");
});
