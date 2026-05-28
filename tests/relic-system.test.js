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
