const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

function loadRelicReveal() {
  const context = { console, Math };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync("src/relic-reveal.js", "utf8"), context, { filename: "src/relic-reveal.js" });
  return context.RelicReveal;
}

function createBoss(archetype = "core") {
  return {
    bossArchetype: archetype,
    rewardTag: "reactor",
    type: "boss",
    x: 320,
    y: 220,
  };
}

test("boss relic reveal delays relic choice opening briefly", () => {
  const RelicReveal = loadRelicReveal();
  const state = { phase: "playing", relicChoices: [], relicRevealBursts: [], shake: 0 };
  let opened = 0;

  RelicReveal.start(state, createBoss("phase"));

  assert.equal(state.phase, "relicReveal");
  assert.equal(state.relicChoices.length, 0);
  assert.equal(state.relicReveal.archetype, "phase");
  assert.equal(state.relicRevealBursts.length, 1);
  assert.ok(state.shake >= 0.18);

  RelicReveal.update(state, 0.3, () => { opened += 1; });
  assert.equal(opened, 0);
  assert.equal(state.phase, "relicReveal");

  RelicReveal.update(state, 0.6, () => { opened += 1; state.phase = "relicChoice"; });
  assert.equal(opened, 1);
  assert.equal(state.phase, "relicChoice");

  RelicReveal.update(state, 1, () => { opened += 1; });
  assert.equal(opened, 1);
});

test("relic reveal burst expires cleanly", () => {
  const RelicReveal = loadRelicReveal();
  const state = { phase: "playing", relicRevealBursts: [], shake: 0 };

  RelicReveal.start(state, createBoss("bulwark"));
  RelicReveal.update(state, 0.4, () => {});

  assert.equal(state.relicRevealBursts.length, 1);
  assert.ok(state.relicRevealBursts[0].life < state.relicRevealBursts[0].maxLife);

  RelicReveal.update(state, 1.2, () => {});
  assert.equal(state.relicRevealBursts.length, 0);
});
