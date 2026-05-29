const fs = require("node:fs");
const test = require("node:test");
const vm = require("node:vm");
const assert = require("node:assert/strict");

function loadJuiceVisual() {
  const context = { console, Math };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync("src/juice-visual.js", "utf8"), context, { filename: "src/juice-visual.js" });
  return context.JuiceVisual;
}

function createRecordingContext() {
  const trace = [];
  return {
    trace,
    set globalAlpha(value) { trace.push(`alpha:${Number(value).toFixed(2)}`); },
    get globalAlpha() { return 1; },
    set lineWidth(value) { trace.push(`width:${value}`); },
    get lineWidth() { return 1; },
    set strokeStyle(value) { trace.push(`stroke:${value}`); },
    get strokeStyle() { return ""; },
    beginPath() { trace.push("begin"); },
    arc(x, y, radius) { trace.push(`arc:${Math.round(x)},${Math.round(y)},${Math.round(radius)}`); },
    ellipse(x, y, width, height) { trace.push(`ellipse:${Math.round(x)},${Math.round(y)},${Math.round(width)},${Math.round(height)}`); },
    lineTo(x, y) { trace.push(`line:${Math.round(x)},${Math.round(y)}`); },
    moveTo(x, y) { trace.push(`move:${Math.round(x)},${Math.round(y)}`); },
    restore() { trace.push("restore"); },
    save() { trace.push("save"); },
    stroke() { trace.push("paint"); },
  };
}

test("boss telegraph renderer draws a readable warning ring and direction marks", () => {
  const JuiceVisual = loadJuiceVisual();
  const context = createRecordingContext();

  JuiceVisual.drawBossTelegraphs(context, {
    bossTelegraphs: [{
      color: "#7df8ff",
      life: 0.24,
      lineWidth: 3,
      maxLife: 0.42,
      pattern: "phaseStrafe",
      radius: 74,
      x: 120,
      y: 130,
    }],
  });

  const trace = context.trace.join("|");
  assert.match(trace, /stroke:#7df8ff/);
  assert.match(trace, /arc:120,130,74/);
  assert.match(trace, /line:/);
});
