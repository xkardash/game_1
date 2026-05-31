const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

function loadSpawnDirector() {
  const context = { console, Math };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync("src/spawn-director.js", "utf8"), context, { filename: "src/spawn-director.js" });
  return context.SpawnDirector;
}

test("difficulty curve increases pressure while clamping spawn interval", () => {
  const SpawnDirector = loadSpawnDirector();
  const early = SpawnDirector.getDifficulty(1, 0);
  const late = SpawnDirector.getDifficulty(9, 210);

  assert.ok(late.intensity > early.intensity);
  assert.ok(late.enemyCap > early.enemyCap);
  assert.ok(late.packSize > early.packSize);
  assert.ok(late.spawnInterval < early.spawnInterval);
  assert.ok(late.spawnInterval >= 0.28);
  assert.ok(late.waveDuration < early.waveDuration);
});

test("role decks add ranged and bomber pressure as waves advance", () => {
  const SpawnDirector = loadSpawnDirector();

  assert.equal(SpawnDirector.getEnemyType(1, 0), "scout");
  assert.equal(SpawnDirector.getEnemyType(1, 2), "tank");
  assert.equal(SpawnDirector.getRoleDeck(3).includes("sniper"), true);
  assert.equal(SpawnDirector.getRoleDeck(5).includes("bomber"), true);
  assert.ok(SpawnDirector.getRoleDeck(8).filter((role) => role === "sniper").length >= 2);
});

test("spawn plans respect enemy caps and trigger boss waves", () => {
  const SpawnDirector = loadSpawnDirector();
  const director = SpawnDirector.createSpawnDirector();
  const state = {
    wave: 9,
    phase: "playing",
    enemies: Array.from({ length: 2 }, () => ({ type: "scout" })),
    runStats: { seconds: 28 },
  };

  director.spawnTimer = 0;
  director.threatTimer = 99;
  const plan = SpawnDirector.updateDirector(director, state, 0.16);

  assert.ok(plan.spawnCount > 0);
  assert.ok(plan.spawnCount <= plan.difficulty.enemyCap - state.enemies.length);
  assert.equal(plan.advanceWave, true);
  assert.equal(plan.spawnBoss, true);
  assert.equal(plan.nextWave, 10);
  assert.equal(plan.bossTier, "major");
});

test("spawn plan pauses cleanly outside playing phase", () => {
  const SpawnDirector = loadSpawnDirector();
  const director = SpawnDirector.createSpawnDirector();
  const plan = SpawnDirector.updateDirector(director, { wave: 4, phase: "paused", enemies: [], runStats: { seconds: 50 } }, 1);

  assert.equal(plan.spawnCount, 0);
  assert.equal(plan.advanceWave, false);
});

test("every fifth wave is a swarm pressure spike", () => {
  const SpawnDirector = loadSpawnDirector();
  const normal = SpawnDirector.getDifficulty(4, 60);
  const swarm = SpawnDirector.getDifficulty(5, 60);

  assert.equal(normal.swarmWave, false);
  assert.equal(swarm.swarmWave, true);
  assert.ok(swarm.packSize > normal.packSize);
  assert.ok(swarm.enemyCap > normal.enemyCap);
});
