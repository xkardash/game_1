const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

function loadRunItemSystem() {
  const context = { console, Math };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync("src/run-item-system.js", "utf8"), context, { filename: "src/run-item-system.js" });
  return context.RunItemSystem;
}

function createDraftPlayer(RunItemSystem, ownedIds = []) {
  const selection = RunItemSystem.createSelection([
    "shieldBattery",
    "repairDrone",
    "xpCatalyst",
    "plasmaCartridge",
    "droneBay",
    "ricochetNode",
    "bossTracker",
    "phaseMesh",
  ]);
  return {
    itemState: {
      ...RunItemSystem.createItemState(selection),
      ownedIds,
    },
  };
}

function createSequenceRng(values) {
  let index = 0;
  return () => values[Math.min(index++, values.length - 1)];
}

test("run item pool has 16 items and balanced rarity tier quotas", () => {
  const RunItemSystem = loadRunItemSystem();
  const pool = RunItemSystem.getItemPool();
  const selection = RunItemSystem.createSelection();
  const groups = RunItemSystem.getRarityGroups();
  const summary = RunItemSystem.getSelectionSummary(selection);

  assert.equal(pool.length, 16);
  assert.deepEqual(
    Object.fromEntries(groups.map((group) => [group.rarity, group.items.length])),
    { common: 4, rare: 4, epic: 4, legendary: 4 },
  );
  assert.ok(groups.every((group) => group.required === 2));
  assert.equal(selection.selectedIds.length, 8);
  assert.equal(RunItemSystem.isSelectionReady(selection), true);
  assert.equal(summary.ready, true);
  assert.ok(summary.tiers.every((tier) => tier.selected === 2));
});

test("pre-run selection enforces two items per rarity tier", () => {
  const RunItemSystem = loadRunItemSystem();
  const pool = RunItemSystem.getItemPool();
  const selection = RunItemSystem.createSelection();
  const selectedEpic = selection.selectedIds.find((id) => RunItemSystem.getItemById(id).rarity === "epic");
  const incomplete = RunItemSystem.toggleSelection(selection, selectedEpic);
  const thirdCommon = pool.find((item) => item.rarity === "common" && !incomplete.selectedIds.includes(item.id));

  assert.equal(incomplete.selectedIds.length, 7);
  assert.equal(RunItemSystem.isSelectionReady(incomplete), false);

  const blocked = RunItemSystem.toggleSelection(incomplete, thirdCommon.id);
  assert.equal(blocked.selectedIds.length, 7);
  assert.equal(blocked.selectedIds.includes(thirdCommon.id), false);
  assert.match(blocked.message, /Standart.*2/);

  const restored = RunItemSystem.toggleSelection(incomplete, selectedEpic);
  assert.equal(restored.selectedIds.length, 8);
  assert.equal(restored.selectedIds.includes(selectedEpic), true);
  assert.equal(RunItemSystem.isSelectionReady(restored), true);
});

test("run items apply effects and activate synergies once both parts are owned", () => {
  const RunItemSystem = loadRunItemSystem();
  const selection = RunItemSystem.createSelection([
    "shieldBattery",
    "repairDrone",
    "xpCatalyst",
    "plasmaCartridge",
    "droneBay",
    "ricochetNode",
    "bossTracker",
    "phaseMesh",
  ]);
  const player = {
    lives: 3,
    maxLives: 5,
    shields: 0,
    stats: { damage: 1, fireRate: 0.28, magnet: 58, projectileCount: 1, speed: 315 },
    itemEffects: {},
    itemState: RunItemSystem.createItemState(selection),
  };

  assert.equal(RunItemSystem.applyItem(player, RunItemSystem.getItemById("shieldBattery")), true);
  assert.equal(player.shields, 1);
  assert.equal(RunItemSystem.getActiveSynergies(player).length, 0);

  assert.equal(RunItemSystem.applyItem(player, RunItemSystem.getItemById("repairDrone")), true);
  assert.equal(player.itemState.ownedIds.includes("repairDrone"), true);
  assert.equal(player.shields, 2);
  assert.ok(player.maxLives > 5);
  assert.deepEqual(Array.from(RunItemSystem.getActiveSynergies(player), (synergy) => synergy.id), ["emergencyBay"]);
});

test("item choices are drawn only from selected and unowned run items", () => {
  const RunItemSystem = loadRunItemSystem();
  const player = createDraftPlayer(RunItemSystem, ["shieldBattery", "repairDrone", "xpCatalyst", "plasmaCartridge", "droneBay", "ricochetNode"]);
  const choices = RunItemSystem.createItemChoices(player, 2, () => 0);

  assert.deepEqual(Array.from(choices, (choice) => choice.id).sort(), ["bossTracker", "phaseMesh"]);
  assert.ok(choices.every((choice) => choice.choiceType === "item"));
});

test("item reward rarity rolls use 40/30/20/10 odds", () => {
  const RunItemSystem = loadRunItemSystem();
  const cases = [
    { roll: 0.05, rarity: "common" },
    { roll: 0.45, rarity: "rare" },
    { roll: 0.75, rarity: "epic" },
    { roll: 0.95, rarity: "legendary" },
  ];

  for (const itemCase of cases) {
    const choices = RunItemSystem.createItemChoices(createDraftPlayer(RunItemSystem), 1, createSequenceRng([itemCase.roll, 0]));
    assert.equal(choices[0].rarity, itemCase.rarity);
  }
});

test("item reward rolls fall back when the rolled rarity is unavailable", () => {
  const RunItemSystem = loadRunItemSystem();
  const player = createDraftPlayer(RunItemSystem, ["shieldBattery", "repairDrone"]);
  const choices = RunItemSystem.createItemChoices(player, 1, createSequenceRng([0.05, 0]));

  assert.equal(choices.length, 1);
  assert.notEqual(choices[0].rarity, "common");
});
