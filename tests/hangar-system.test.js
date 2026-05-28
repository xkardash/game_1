const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

function loadHangarSystem() {
  const context = { console };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync("src/hangar-system.js", "utf8"), context, { filename: "src/hangar-system.js" });
  return context.HangarSystem;
}

function createStorage() {
  const data = new Map();
  return {
    getItem: (key) => data.get(key) || null,
    setItem: (key, value) => { data.set(key, String(value)); },
  };
}

test("hangar saves collected cores and spends them on permanent upgrades", () => {
  const HangarSystem = loadHangarSystem();
  const storage = createStorage();
  const hangar = HangarSystem.load(storage);

  HangarSystem.addCores(hangar, 5, storage);
  const bought = HangarSystem.buyUpgrade(hangar, "shield", storage);
  const reloaded = HangarSystem.load(storage);

  assert.equal(bought, true);
  assert.equal(reloaded.cores, 3);
  assert.equal(reloaded.upgrades.shield, 1);
});

test("hangar applies shield, reactor, and magnet bonuses to the player", () => {
  const HangarSystem = loadHangarSystem();
  const player = {
    shields: 0,
    stats: { fireRate: 0.32, magnet: 58 },
  };

  HangarSystem.applyBonuses(player, {
    cores: 0,
    upgrades: { magnet: 2, reactor: 1, scavenger: 0, shield: 1 },
  });

  assert.equal(player.shields, 1);
  assert.equal(player.stats.fireRate, 0.3);
  assert.equal(player.stats.magnet, 76);
});
