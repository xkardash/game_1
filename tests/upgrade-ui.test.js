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
    "#hangarReturnButton": createElement(),
    "#livesValue": createElement(),
    "#overlay": createElement(),
    "#phaseLabel": createElement(),
    "#phaseTitle": createElement(),
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
  vm.runInContext(fs.readFileSync("src/upgrade-codex.js", "utf8"), context, { filename: "src/upgrade-codex.js" });
  vm.runInContext(fs.readFileSync("src/ui.js", "utf8"), context, { filename: "src/ui.js" });
  return context.ShooterUi;
}

test("upgrade cards show build route chips safely and accessibly", () => {
  const elements = createElements();
  const ui = loadUi(elements).createGameUi();

  ui.sync({
    bestValue: 0,
    highScore: 0,
    level: 2,
    phase: "levelUp",
    player: {
      lives: 3,
      relics: ["novaCore"],
      upgrades: ["rapid"],
    },
    relicChoices: [],
    score: 0,
    upgradeChoices: [{ id: "damage" }, { id: "magnet" }, { id: "repair" }],
    wave: 4,
    xp: 1,
    xpNeeded: 6,
  });

  const card = elements["#upgradeChoice0"];
  const buildChip = card.children.find((child) => child.className === "upgrade-build");
  const buildDetail = card.children.find((child) => child.className === "upgrade-build-detail");

  assert.equal(card.dataset.build, "novaLance");
  assert.equal(buildChip.textContent, "Build: Nova Lance");
  assert.match(buildDetail.textContent, /Nova Cekirdegi aktif/);
  assert.match(card.attributes["aria-label"], /Build: Nova Lance/);
});
