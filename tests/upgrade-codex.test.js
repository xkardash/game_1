const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

function loadUpgradeCodex() {
  const context = { console };
  context.window = context;
  vm.createContext(context);
  if (fs.existsSync("src/run-item-system.js")) {
    vm.runInContext(fs.readFileSync("src/run-item-system.js", "utf8"), context, { filename: "src/run-item-system.js" });
  }
  vm.runInContext(fs.readFileSync("src/upgrade-codex.js", "utf8"), context, { filename: "src/upgrade-codex.js" });
  return { UpgradeCodex: context.UpgradeCodex, RunItemSystem: context.RunItemSystem };
}

test("upgrade codex enriches choices with rarity, category, effect, and synergy preview", () => {
  const { UpgradeCodex } = loadUpgradeCodex();
  const player = { upgrades: ["rapid"] };
  const choices = UpgradeCodex.createChoices(2, player);
  const damage = choices[0];
  const view = UpgradeCodex.getUpgradeView(damage, player);

  assert.deepEqual(Array.from(choices, (upgrade) => upgrade.id), ["damage", "magnet", "rapid"]);
  assert.equal(view.rarity, "epic");
  assert.equal(view.category, "Silah");
  assert.equal(view.effect, "Hasar +1");
  assert.match(view.synergy, /Delici Lazer/);
});

test("upgrade views expose build route hints for relic and weapon evolutions", () => {
  const { UpgradeCodex } = loadUpgradeCodex();

  const damageView = UpgradeCodex.getUpgradeView({ id: "damage" }, {
    upgrades: ["rapid"],
    relics: ["novaCore"],
  });
  assert.deepEqual(Array.from(damageView.buildRoutes, (route) => route.id), ["novaLance", "piercingLaser"]);
  assert.equal(damageView.buildRoutes[0].state, "ready");
  assert.match(damageView.buildRoutes[0].hint, /Nova Cekirdegi aktif/);

  const rapidView = UpgradeCodex.getUpgradeView({ id: "rapid" }, {
    upgrades: ["engine"],
    relics: ["phaseInjector"],
  });
  assert.deepEqual(Array.from(rapidView.buildRoutes, (route) => route.id), ["phaseBurst", "droneSupport", "piercingLaser"]);
  assert.equal(rapidView.buildRoutes[0].state, "ready");

  const magnetView = UpgradeCodex.getUpgradeView({ id: "magnet" }, {
    upgrades: [],
    relics: [],
  });
  assert.equal(magnetView.buildRoutes[0].id, "voidField");
  assert.equal(magnetView.buildRoutes[0].state, "relic");
  assert.match(magnetView.buildRoutes[0].hint, /Bosluk Sifonu ile/);
});

test("level-up choices mix stat upgrades with lucky run item rewards", () => {
  const { UpgradeCodex, RunItemSystem } = loadUpgradeCodex();
  const player = {
    relics: [],
    upgrades: ["rapid"],
    itemState: RunItemSystem.createItemState(RunItemSystem.createSelection([
      "shieldBattery",
      "repairDrone",
      "xpCatalyst",
      "plasmaCartridge",
      "droneBay",
      "ricochetNode",
      "bossTracker",
      "phaseMesh",
    ])),
  };
  const choices = UpgradeCodex.createChoices(4, player, () => 0.2);
  const choiceTypes = choices.map((choice) => choice.choiceType || "stat");

  assert.equal(choices.length, 3);
  assert.equal(choiceTypes.filter((type) => type === "item").length, 2);
  assert.equal(choiceTypes.filter((type) => type === "stat").length, 1);

  const itemView = UpgradeCodex.getUpgradeView(choices.find((choice) => choice.choiceType === "item"), player);
  assert.equal(itemView.category, "Esya");
  assert.ok(itemView.effect.length > 0);
});
