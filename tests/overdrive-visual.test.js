const fs = require("node:fs");
const test = require("node:test");
const vm = require("node:vm");
const assert = require("node:assert/strict");

function loadOverdriveSystem() {
  const context = { console, Math };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync("src/overdrive-system.js", "utf8"), context, { filename: "src/overdrive-system.js" });
  return context.OverdriveSystem;
}

function createRecordingContext() {
  const trace = [];
  return {
    trace,
    set fillStyle(value) { trace.push(`fill:${value}`); },
    get fillStyle() { return ""; },
    set font(value) { trace.push(`font:${value}`); },
    get font() { return ""; },
    set globalAlpha(value) { trace.push(`alpha:${Number(value).toFixed(2)}`); },
    get globalAlpha() { return 1; },
    set lineWidth(value) { trace.push(`width:${value}`); },
    get lineWidth() { return 1; },
    set strokeStyle(value) { trace.push(`stroke:${value}`); },
    get strokeStyle() { return ""; },
    set textAlign(value) { trace.push(`align:${value}`); },
    get textAlign() { return "left"; },
    beginPath() { trace.push("begin"); },
    arc(x, y, radius) { trace.push(`arc:${Math.round(x)},${Math.round(y)},${Math.round(radius)}`); },
    fill() { trace.push("paint"); },
    fillRect(x, y, width, height) { trace.push(`rect:${Math.round(x)},${Math.round(y)},${Math.round(width)},${Math.round(height)}`); },
    fillText(text, x, y) { trace.push(`text:${text}:${Math.round(x)},${Math.round(y)}`); },
    lineTo(x, y) { trace.push(`line:${Math.round(x)},${Math.round(y)}`); },
    moveTo(x, y) { trace.push(`move:${Math.round(x)},${Math.round(y)}`); },
    restore() { trace.push("restore"); },
    save() { trace.push("save"); },
    stroke() { trace.push("strokePaint"); },
    strokeRect(x, y, width, height) { trace.push(`strokeRect:${Math.round(x)},${Math.round(y)},${Math.round(width)},${Math.round(height)}`); },
  };
}

test("overdrive renderer draws burst rings and a readable charge bar", () => {
  const OverdriveSystem = loadOverdriveSystem();
  const context = createRecordingContext();
  const state = {
    overdriveBursts: [{ color: "#f0a040", life: 0.32, maxLife: 0.5, radius: 168, x: 120, y: 130 }],
    player: {
      overdrive: 0,
      overdriveCharge: 75,
      overdriveMax: 100,
      relics: ["phaseInjector"],
      upgrades: ["rapid"],
    },
  };

  OverdriveSystem.drawWorld(context, state);
  OverdriveSystem.drawHud(context, state, { width: 960, height: 540 });

  const trace = context.trace.join("|");
  assert.match(trace, /arc:120,130,168/);
  assert.match(trace, /text:OVERDRIVE/);
  assert.match(trace, /text:PHASE/);
  assert.match(trace, /rect:360,502,240,10/);
});
