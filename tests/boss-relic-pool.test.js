const fs = require("node:fs");
const test = require("node:test");
const vm = require("node:vm");
const assert = require("node:assert/strict");

function loadSurvivalRules() {
  const context = {
    Math: Object.create(Math),
    window: {
      UpgradeCodex: { createChoices: () => [] },
      WeaponEvolution: { getWeaponEvolution: () => ({ id: "pulse", size: 8, speed: 600, style: "pulse" }) },
    },
  };
  context.window.window = context.window;
  context.Math.random = () => 0.5;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync("src/survival.js", "utf8"), context, { filename: "src/survival.js" });
  return context.window.SurvivalRules;
}

function loadRelicSystem() {
  const context = { console };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync("src/relic-system.js", "utf8"), context, { filename: "src/relic-system.js" });
  return context.RelicSystem;
}

test("boss enemies receive deterministic reward archetypes", () => {
  const SurvivalRules = loadSurvivalRules();
  const world = { width: 1000, height: 700 };
  const player = { x: 500, y: 350 };
  const viewport = { width: 960, height: 540 };

  const first = SurvivalRules.createEnemy(world, 10, "boss", player, viewport);
  const second = SurvivalRules.createEnemy(world, 20, "boss", player, viewport);
  const third = SurvivalRules.createEnemy(world, 30, "boss", player, viewport);

  assert.equal(first.bossArchetype, "bulwark");
  assert.equal(second.bossArchetype, "phase");
  assert.equal(third.bossArchetype, "core");
  assert.equal(first.bossTier, "major");
  assert.ok(second.maxHp > first.maxHp);
  assert.equal(third.rewardTag, "Core Anomalisi");
});

test("boss archetypes bias relic choices by reward identity", () => {
  const RelicSystem = loadRelicSystem();
  const player = {
    shields: 2,
    stats: { damage: 1, fireRate: 0.28, magnet: 58 },
    upgrades: [],
    relics: [],
  };

  const bulwark = RelicSystem.createRelicChoices({ player, lastBossReward: { archetype: "bulwark" } });
  const phase = RelicSystem.createRelicChoices({ player, lastBossReward: { archetype: "phase" } });
  const core = RelicSystem.createRelicChoices({ player, lastBossReward: { archetype: "core" } });

  assert.equal(bulwark[0].id, "starforgedHull");
  assert.equal(bulwark[0].synergy, "Boss: zirh enkazi");
  assert.equal(phase[0].id, "phaseInjector");
  assert.equal(phase[0].synergy, "Boss: faz kalintisi");
  assert.deepEqual(Array.from(core.slice(0, 2), (choice) => choice.id), ["novaCore", "voidSiphon"]);
  assert.equal(core[0].synergy, "Boss: core anomali parcasi");
});

test("player build still breaks ties inside boss-biased relic pools", () => {
  const RelicSystem = loadRelicSystem();
  const choices = RelicSystem.createRelicChoices({
    lastBossReward: { archetype: "core" },
    player: {
      shields: 2,
      stats: { damage: 2, fireRate: 0.22, magnet: 120 },
      upgrades: ["magnet"],
      relics: [],
    },
  });

  assert.deepEqual(Array.from(choices.slice(0, 2), (choice) => choice.id), ["voidSiphon", "novaCore"]);
  assert.equal(choices[0].synergy, "Build: Void Field acilir");
});
