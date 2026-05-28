const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

function loadUpgradeCodex() {
  const context = { console };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync("src/upgrade-codex.js", "utf8"), context, { filename: "src/upgrade-codex.js" });
  return context.UpgradeCodex;
}

test("upgrade codex enriches choices with rarity, category, effect, and synergy preview", () => {
  const UpgradeCodex = loadUpgradeCodex();
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
