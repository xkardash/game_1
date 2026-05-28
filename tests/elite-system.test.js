const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

function loadScripts(paths) {
  const context = { console, Math };
  context.window = context;
  vm.createContext(context);
  for (const filePath of paths) {
    vm.runInContext(fs.readFileSync(filePath, "utf8"), context, { filename: filePath });
  }
  return context;
}

function createEnemy() {
  return {
    type: "tank",
    hp: 7,
    maxHp: 7,
    speed: 60,
    score: 120,
    width: 58,
    height: 48,
  };
}

test("elite affixes start after wave four and are deterministic", () => {
  const { EliteSystem } = loadScripts(["src/elite-system.js"]);
  assert.equal(EliteSystem.getEliteAffix(3, 5), null);
  assert.equal(EliteSystem.getEliteAffix(5, 5).id, "coreCarrier");
  assert.equal(EliteSystem.getEliteAffix(6, 5).id, "armored");
});

test("armored and overcharged affixes modify enemy stats", () => {
  const { EliteSystem } = loadScripts(["src/elite-system.js"]);
  const armored = EliteSystem.applyEliteAffix(createEnemy(), 6, 5);
  const overcharged = EliteSystem.applyEliteAffix(createEnemy(), 7, 5);

  assert.equal(armored.elite, true);
  assert.equal(armored.affix, "armored");
  assert.ok(armored.maxHp > 7);
  assert.ok(armored.score > 120);
  assert.equal(overcharged.affix, "overcharged");
  assert.ok(overcharged.speed > 60);
});

test("core carrier elites drop core loot", () => {
  const { EliteSystem, LootSystem } = loadScripts(["src/loot-system.js", "src/elite-system.js"]);
  const state = { lootDrops: [] };
  const enemy = EliteSystem.applyEliteAffix({ ...createEnemy(), x: 120, y: 80, type: "scout" }, 5, 5);

  LootSystem.dropLoot(state, enemy);

  assert.equal(enemy.affix, "coreCarrier");
  assert.equal(state.lootDrops.length, 1);
  assert.equal(state.lootDrops[0].type, "core");
});
