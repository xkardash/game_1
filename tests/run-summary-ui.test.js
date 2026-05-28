const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

function createElement() {
  return {
    hidden: false,
    textContent: "",
    classList: {
      values: {},
      toggle(name, value) {
        this.values[name] = value;
      },
    },
  };
}

function loadRunSummaryUi(elements) {
  const context = {
    console,
    document: {
      querySelector(selector) {
        return elements[selector];
      },
    },
  };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync("src/run-summary-ui.js", "utf8"), context, { filename: "src/run-summary-ui.js" });
  return context.RunSummaryUi;
}

test("run summary UI stays hidden until game over", () => {
  const elements = {
    "#runSummaryPanel": createElement(),
    "#summaryScore": createElement(),
    "#summaryBest": createElement(),
    "#summaryLine0": createElement(),
    "#summaryLine1": createElement(),
    "#summaryLine2": createElement(),
    "#summaryLine3": createElement(),
    "#summaryLine4": createElement(),
  };
  const RunSummaryUi = loadRunSummaryUi(elements);
  const ui = RunSummaryUi.createRunSummaryUi();

  ui.sync({ phase: "playing", runSummary: { lines: [] } });

  assert.equal(elements["#runSummaryPanel"].hidden, true);
});

test("run summary UI writes score and five summary lines safely", () => {
  const elements = {
    "#runSummaryPanel": createElement(),
    "#summaryScore": createElement(),
    "#summaryBest": createElement(),
    "#summaryLine0": createElement(),
    "#summaryLine1": createElement(),
    "#summaryLine2": createElement(),
    "#summaryLine3": createElement(),
    "#summaryLine4": createElement(),
  };
  const RunSummaryUi = loadRunSummaryUi(elements);
  const ui = RunSummaryUi.createRunSummaryUi();

  ui.sync({
    phase: "gameOver",
    runSummary: {
      score: 5400,
      best: 6000,
      lines: ["Sure 1:36", "Dalga 8 / Seviye 5", "Imha 28 / Boss 2", "Elite 3 / Core 4", "Silah Piercing Laser"],
    },
  });

  assert.equal(elements["#runSummaryPanel"].hidden, false);
  assert.equal(elements["#summaryScore"].textContent, "Puan 5400");
  assert.equal(elements["#summaryBest"].textContent, "En iyi 6000");
  assert.equal(elements["#summaryLine4"].textContent, "Silah Piercing Laser");
});
