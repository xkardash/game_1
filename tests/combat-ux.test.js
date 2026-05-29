const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

function loadCombatUx() {
  const context = { console, Math };
  context.window = context;
  context.OverdriveSystem = {
    getMode() {
      return { color: "#f0a040", id: "nova", label: "NOVA" };
    },
    isReady(player) {
      return Boolean(player.overdriveReady);
    },
  };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync("src/combat-ux.js", "utf8"), context, { filename: "src/combat-ux.js" });
  return context.CombatUx;
}

test("ready overdrive creates a clear keyboard prompt with the active mode", () => {
  const CombatUx = loadCombatUx();
  const state = { phase: "playing", player: { overdriveReady: true } };

  const prompt = CombatUx.getOverdrivePrompt(state);

  assert.equal(prompt.key, "E");
  assert.equal(prompt.title, "NOVA READY");
  assert.equal(prompt.color, "#f0a040");
  assert.equal(CombatUx.getOverdrivePrompt({ ...state, phase: "paused" }), null);
});

test("off-screen objectives create an edge pointer while visible objectives do not", () => {
  const CombatUx = loadCombatUx();
  const viewport = { width: 960, height: 540 };
  const state = {
    camera: { x: 0, y: 0, width: 960, height: 540 },
    tacticalObjectives: {
      active: { kind: "supplyCapsule", title: "Tedarik kapsulu", x: 1420, y: 300 },
    },
  };

  const pointer = CombatUx.getObjectivePointer(state, viewport);

  assert.equal(pointer.title, "Tedarik kapsulu");
  assert.equal(pointer.kind, "supplyCapsule");
  assert.ok(pointer.x <= viewport.width - 28);
  assert.ok(pointer.y > 240 && pointer.y < 340);

  state.tacticalObjectives.active.x = 420;
  state.tacticalObjectives.active.y = 260;
  assert.equal(CombatUx.getObjectivePointer(state, viewport), null);
});

test("objective rewards create short readable reward notices", () => {
  const CombatUx = loadCombatUx();
  const state = {};

  CombatUx.addRewardNotice(state, {
    title: "Sinyal istasyonu",
    reward: { overdriveCharge: 18, xp: 4 },
  });

  assert.equal(state.uxNotices.length, 1);
  assert.equal(state.uxNotices[0].title, "Sinyal istasyonu tamamlandi");
  assert.equal(state.uxNotices[0].detail, "+4 XP / Overdrive +18");

  CombatUx.update(state, 2.5);
  assert.equal(state.uxNotices.length, 0);
});

test("touch overdrive button mirrors ready state and active mode", () => {
  const CombatUx = loadCombatUx();
  const attributes = {};
  const button = {
    disabled: true,
    hidden: true,
    textContent: "",
    removeAttribute(name) {
      delete attributes[name];
    },
    setAttribute(name, value) {
      attributes[name] = value;
    },
  };

  CombatUx.syncOverdriveButton(button, { phase: "playing", player: { overdriveReady: true } });

  assert.equal(button.hidden, false);
  assert.equal(button.disabled, false);
  assert.equal(button.textContent, "OD NOVA");
  assert.equal(attributes["aria-label"], "Overdrive hazir: NOVA");

  CombatUx.syncOverdriveButton(button, { phase: "levelUp", player: { overdriveReady: true } });
  assert.equal(button.disabled, true);
});
