const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

function loadTacticalObjectiveSystem() {
  const context = { console, Math };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync("src/tactical-objective-system.js", "utf8"), context, { filename: "src/tactical-objective-system.js" });
  return context.TacticalObjectiveSystem;
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
    closePath() { trace.push("close"); },
    fill() { trace.push("paint"); },
    fillRect(x, y, width, height) { trace.push(`rect:${Math.round(x)},${Math.round(y)},${Math.round(width)},${Math.round(height)}`); },
    fillText(text, x, y) { trace.push(`text:${text}:${Math.round(x)},${Math.round(y)}`); },
    lineTo(x, y) { trace.push(`line:${Math.round(x)},${Math.round(y)}`); },
    moveTo(x, y) { trace.push(`move:${Math.round(x)},${Math.round(y)}`); },
    restore() { trace.push("restore"); },
    rotate(value) { trace.push(`rotate:${Number(value).toFixed(2)}`); },
    save() { trace.push("save"); },
    setLineDash(value) { trace.push(`dash:${value.join(",")}`); },
    stroke() { trace.push("strokePaint"); },
    strokeRect(x, y, width, height) { trace.push(`strokeRect:${Math.round(x)},${Math.round(y)},${Math.round(width)},${Math.round(height)}`); },
    translate(x, y) { trace.push(`translate:${Math.round(x)},${Math.round(y)}`); },
  };
}

test("objective renderer draws readable zone, progress ring, and title", () => {
  const TacticalObjectiveSystem = loadTacticalObjectiveSystem();
  const context = createRecordingContext();
  const state = {
    tacticalObjectives: {
      active: {
        kind: "supplyCapsule",
        title: "Tedarik kapsulu",
        x: 420,
        y: 260,
        radius: 96,
        progress: 2.4,
        target: 5,
        timeLeft: 18,
      },
    },
  };

  TacticalObjectiveSystem.drawWorld(context, state);

  const trace = context.trace.join("|");
  assert.match(trace, /arc:420,260,96/);
  assert.match(trace, /arc:420,260,106/);
  assert.match(trace, /text:Tedarik kapsulu/);
  assert.match(trace, /stroke:#52d6bd/);
});
