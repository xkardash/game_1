const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

function loadRunSummary() {
  const context = { console, Math };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync("src/run-summary.js", "utf8"), context, { filename: "src/run-summary.js" });
  return context.RunSummary;
}

test("run stats track time, kill types, cores, and peak progression", () => {
  const RunSummary = loadRunSummary();
  const stats = RunSummary.createRunStats();
  const state = { phase: "playing", wave: 7, level: 4, score: 1200 };

  RunSummary.updateRunStats(stats, state, 12.4);
  RunSummary.recordKill(stats, { type: "scout" });
  RunSummary.recordKill(stats, { type: "boss", elite: true });
  RunSummary.recordCore(stats, 2);

  assert.equal(stats.seconds, 12.4);
  assert.equal(stats.kills, 2);
  assert.equal(stats.bosses, 1);
  assert.equal(stats.elites, 1);
  assert.equal(stats.cores, 2);
  assert.equal(stats.maxWave, 7);
  assert.equal(stats.maxLevel, 4);
});

test("run summary creates readable end-of-run lines", () => {
  const RunSummary = loadRunSummary();
  const stats = {
    seconds: 96.2,
    kills: 28,
    bosses: 2,
    elites: 3,
    cores: 4,
    maxWave: 8,
    maxLevel: 5,
    bestEvolution: "piercingLaser",
  };
  const summary = RunSummary.createSummary({ score: 5400, highScore: 6000 }, stats);

  assert.equal(summary.score, 5400);
  assert.equal(summary.best, 6000);
  assert.equal(summary.time, "1:36");
  assert.equal(summary.weapon, "Piercing Laser");
  assert.equal(summary.lines.join("|"), [
    "Sure 1:36",
    "Dalga 8 / Seviye 5",
    "Imha 28 / Boss 2",
    "Elite 3 / Core 4",
    "Silah Piercing Laser",
  ].join("|"));
});
