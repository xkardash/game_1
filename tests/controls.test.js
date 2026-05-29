const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

function createButton() {
  return {
    listeners: {},
    addEventListener(type, handler) {
      this.listeners[type] = handler;
    },
  };
}

function loadControls(elements) {
  const context = {
    console,
    document: {
      querySelector(selector) {
        return elements[selector];
      },
    },
    listeners: {},
    addEventListener(type, handler) {
      this.listeners[type] = handler;
    },
  };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync("src/controls.js", "utf8"), context, { filename: "src/controls.js" });
  return context.ShooterControls;
}

function createControlElements() {
  return {
    "#downTouch": createButton(),
    "#leftTouch": createButton(),
    "#overdriveTouch": createButton(),
    "#rightTouch": createButton(),
    "#upTouch": createButton(),
  };
}

test("touch overdrive button activates overdrive only while playing", () => {
  const elements = createControlElements();
  const ShooterControls = loadControls(elements);
  const state = { phase: "playing" };
  let activations = 0;

  ShooterControls.installControls({
    activateOverdrive: () => { activations += 1; },
    chooseUpgrade: () => {},
    pressedKeys: new Set(),
    startGame: () => {},
    state,
    togglePause: () => {},
    touchInput: { down: false, left: false, right: false, up: false },
  });

  elements["#overdriveTouch"].listeners.pointerdown({ preventDefault() {} });
  state.phase = "levelUp";
  elements["#overdriveTouch"].listeners.pointerdown({ preventDefault() {} });

  assert.equal(activations, 1);
});
