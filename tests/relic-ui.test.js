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
      contains(name) {
        return Boolean(this.values[name]);
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
  context.RelicSystem = { getRelicView: (relic) => relic };
  context.UpgradeCodex = { getUpgradeView: (upgrade) => upgrade };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync("src/ui.js", "utf8"), context, { filename: "src/ui.js" });
  return context.ShooterUi;
}

function createElements() {
  return {
    "#actionButton": createElement(),
    "#overlay": createElement(),
    "#phaseLabel": createElement(),
    "#phaseTitle": createElement(),
    "#scoreValue": createElement(),
    "#livesValue": createElement(),
    "#waveValue": createElement(),
    "#xpValue": createElement(),
    "#bestValue": createElement(),
    "#upgradePanel": createElement(),
    "#upgradeChoice0": createElement(),
    "#upgradeChoice1": createElement(),
    "#upgradeChoice2": createElement(),
    "#hangarReturnButton": createElement(),
  };
}

test("relic choice cards show recommended build synergy safely", () => {
  const elements = createElements();
  const ui = loadUi(elements).createGameUi();

  ui.sync({
    phase: "relicChoice",
    score: 0,
    highScore: 0,
    wave: 3,
    xp: 0,
    xpNeeded: 5,
    player: { lives: 3 },
    relicChoices: [
      {
        id: "novaCore",
        title: "Nova Cekirdegi",
        body: "Ana silahi besler.",
        category: "Silah",
        effect: "Hasar +0.5",
        rarity: "boss",
        rarityLabel: "Boss Relic",
        recommended: true,
        synergy: "Build: Nova Lance acilir",
      },
    ],
    upgradeChoices: [],
  });

  const card = elements["#upgradeChoice0"];
  const synergy = card.children.find((child) => child.className === "upgrade-synergy");

  assert.equal(card.dataset.rarity, "boss");
  assert.equal(synergy.textContent, "Build: Nova Lance acilir");
  assert.match(card.attributes["aria-label"], /Build: Nova Lance acilir/);
});
