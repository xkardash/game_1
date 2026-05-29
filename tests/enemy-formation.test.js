const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

function loadFormationContext() {
  const context = { console, Math };
  context.window = context;
  context.UpgradeCodex = {};
  context.WeaponEvolution = { getWeaponEvolution: () => ({ color: "#fff", speed: 1, size: 1, style: "test", trailColor: "#fff" }) };
  vm.createContext(context);
  for (const file of ["src/survival.js", "src/enemy-formation.js"]) {
    vm.runInContext(fs.readFileSync(file, "utf8"), context, { filename: file });
  }
  return context;
}

test("formation packs spawn coordinated tactical roles with shared formation identity", () => {
  const { SurvivalRules, EnemyFormation } = loadFormationContext();
  const world = { width: 1760, height: 1040 };
  const viewport = { width: 960, height: 540 };
  const player = { x: 880, y: 520 };

  const formation = EnemyFormation.createFormation({
    rules: SurvivalRules,
    player,
    spawnIndex: 14,
    viewport,
    wave: 8,
    world,
  });

  const types = formation.map((enemy) => enemy.type).sort();
  const captain = formation.find((enemy) => enemy.captain);

  assert.ok(formation.length >= 5);
  assert.ok(types.includes("tank"));
  assert.ok(types.includes("sniper"));
  assert.ok(types.includes("bomber"));
  assert.ok(captain);
  assert.equal(new Set(formation.map((enemy) => enemy.formationId)).size, 1);
  assert.ok(formation.every((enemy) => enemy.formationSlot));
  assert.ok(captain.maxHp > 7 + Math.floor(8 / 2));
});

test("formation spawning can be gated by wave, spawn cadence, and open enemy slots", () => {
  const { EnemyFormation } = loadFormationContext();

  assert.equal(EnemyFormation.shouldSpawnFormation(2, 7, 8), false);
  assert.equal(EnemyFormation.shouldSpawnFormation(4, 7, 2), false);
  assert.equal(EnemyFormation.shouldSpawnFormation(4, 6, 8), false);
  assert.equal(EnemyFormation.shouldSpawnFormation(4, 7, 8), true);
});
