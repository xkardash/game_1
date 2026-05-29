const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

function loadRelicSystem() {
  const context = { console };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync("src/relic-system.js", "utf8"), context, { filename: "src/relic-system.js" });
  return context.RelicSystem;
}

test("relic system offers boss relic choices and applies the selected reward", () => {
  const RelicSystem = loadRelicSystem();
  const state = {
    player: {
      shields: 0,
      stats: { damage: 1, fireRate: 0.28, magnet: 58 },
      relics: [],
    },
  };
  const choices = RelicSystem.createRelicChoices(state);

  assert.equal(choices.length, 3);
  assert.equal(choices[0].id, "starforgedHull");
  assert.equal(choices[0].rarity, "boss");

  RelicSystem.applyRelic(state, choices[0]);

  assert.equal(state.player.shields, 1);
  assert.deepEqual(Array.from(state.player.relics), ["starforgedHull"]);
});

test("relic choices prioritize the current player build", () => {
  const RelicSystem = loadRelicSystem();
  const state = {
    player: {
      shields: 2,
      stats: { damage: 2, fireRate: 0.22, magnet: 118 },
      upgrades: ["damage", "magnet", "rapid"],
      relics: [],
    },
  };

  const choices = RelicSystem.createRelicChoices(state);
  const ids = Array.from(choices, (choice) => choice.id);

  assert.deepEqual(ids, ["novaCore", "voidSiphon", "phaseInjector"]);
  assert.equal(choices[0].recommended, true);
  assert.equal(choices[0].synergy, "Build: Nova Lance acilir");
  assert.equal(choices[2].synergy, "Build: Phase Burst acilir");
});

test("relic choices avoid owned relics while enough fresh rewards remain", () => {
  const RelicSystem = loadRelicSystem();
  const state = {
    player: {
      shields: 1,
      stats: { damage: 2, fireRate: 0.24, magnet: 110 },
      upgrades: ["damage", "magnet", "rapid"],
      relics: ["novaCore"],
    },
  };

  const ids = Array.from(RelicSystem.createRelicChoices(state), (choice) => choice.id);

  assert.equal(ids.includes("novaCore"), false);
  assert.deepEqual(ids, ["voidSiphon", "phaseInjector", "starforgedHull"]);
});

test("relic views expose safe synergy hints for recommended choices", () => {
  const RelicSystem = loadRelicSystem();

  const view = RelicSystem.getRelicView({ id: "phaseInjector" }, {
    upgrades: ["rapid"],
    relics: [],
  });

  assert.equal(view.recommended, true);
  assert.equal(view.synergy, "Build: Phase Burst acilir");
});
