const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

function createElement() {
  return {
    attributes: {},
    children: [],
    className: "",
    dataset: {},
    disabled: false,
    hidden: false,
    textContent: "",
    addEventListener() {},
    append(...items) {
      this.children.push(...items);
    },
    classList: {
      values: {},
      toggle(name, value) {
        this.values[name] = value;
      },
    },
    removeAttribute(name) {
      delete this.attributes[name];
    },
    replaceChildren(...items) {
      this.children = items;
    },
    setAttribute(name, value) {
      this.attributes[name] = value;
    },
  };
}

function createElements() {
  return {
    "#actionButton": createElement(),
    "#bestValue": createElement(),
    "#dashboard": createElement(),
    "#dashboardStatsList": createElement(),
    "#dbLaunchButton": createElement(),
    "#hangarReturnButton": createElement(),
    "#itemDraftCounter": createElement(),
    "#itemDraftGrid": createElement(),
    "#livesValue": createElement(),
    "#overlay": createElement(),
    "#phaseLabel": createElement(),
    "#phaseTitle": createElement(),
    "#runtimeStatsPanel": createElement(),
    "#runtimeStatsToggle": createElement(),
    "#scoreValue": createElement(),
    "#upgradeChoice0": createElement(),
    "#upgradeChoice1": createElement(),
    "#upgradeChoice2": createElement(),
    "#upgradePanel": createElement(),
    "#waveValue": createElement(),
    "#xpValue": createElement(),
  };
}

function loadUi(elements) {
  const context = {
    console,
    document: {
      createElement,
      querySelector(selector) {
        return elements[selector] || null;
      },
    },
  };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync("src/run-item-system.js", "utf8"), context, { filename: "src/run-item-system.js" });
  vm.runInContext(fs.readFileSync("src/upgrade-codex.js", "utf8"), context, { filename: "src/upgrade-codex.js" });
  vm.runInContext(fs.readFileSync("src/ui.js", "utf8"), context, { filename: "src/ui.js" });
  return { ShooterUi: context.ShooterUi, RunItemSystem: context.RunItemSystem };
}

test("dashboard renders 16 pre-run item choices and tier counters", () => {
  const elements = createElements();
  const { ShooterUi, RunItemSystem } = loadUi(elements);
  const ui = ShooterUi.createGameUi();
  const selection = RunItemSystem.createSelection();

  ui.sync({
    highScore: 0,
    itemSelection: selection,
    phase: "ready",
    player: { lives: 3, relics: [], upgrades: [], stats: {} },
    relicChoices: [],
    score: 0,
    upgradeChoices: [],
    wave: 1,
    xp: 0,
    xpNeeded: 5,
  });

  assert.equal(elements["#itemDraftGrid"].children.length, 16);
  assert.match(elements["#itemDraftCounter"].textContent, /8\/8 esya secildi/);
  assert.match(elements["#itemDraftCounter"].textContent, /Standart 2\/2/);
  assert.match(elements["#itemDraftCounter"].textContent, /Nadir 2\/2/);
  assert.match(elements["#itemDraftCounter"].textContent, /Epik 2\/2/);
  assert.match(elements["#itemDraftCounter"].textContent, /Efsanevi 2\/2/);
  assert.equal(elements["#dbLaunchButton"].disabled, false);

  const firstItem = elements["#itemDraftGrid"].children[0];
  assert.equal(firstItem.dataset.selected, "true");
  assert.equal(firstItem.attributes["aria-pressed"], "true");
  assert.equal(elements["#itemDraftGrid"].children.filter((child) => child.dataset.rarity === "legendary").length, 4);

  const missingLegendary = selection.selectedIds.filter((id) => RunItemSystem.getItemById(id).rarity !== "legendary")
    .concat(selection.selectedIds.filter((id) => RunItemSystem.getItemById(id).rarity === "legendary").slice(0, 1));

  ui.sync({
    highScore: 0,
    itemSelection: RunItemSystem.createSelection(missingLegendary),
    phase: "ready",
    player: { lives: 3, relics: [], upgrades: [], stats: {} },
    relicChoices: [],
    score: 0,
    upgradeChoices: [],
    wave: 1,
    xp: 0,
    xpNeeded: 5,
  });

  assert.match(elements["#itemDraftCounter"].textContent, /7\/8 esya secildi/);
  assert.match(elements["#itemDraftCounter"].textContent, /Efsanevi 1\/2/);
  assert.equal(elements["#dbLaunchButton"].disabled, true);
});
