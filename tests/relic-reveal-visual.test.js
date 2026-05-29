const fs = require("node:fs");
const test = require("node:test");
const vm = require("node:vm");
const assert = require("node:assert/strict");

function loadRelicReveal() {
  const context = { console, Math };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync("src/relic-reveal.js", "utf8"), context, { filename: "src/relic-reveal.js" });
  return context.RelicReveal;
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
    moveTo(x, y) { trace.push(`move:${Math.round(x)},${Math.round(y)}`); },
    lineTo(x, y) { trace.push(`line:${Math.round(x)},${Math.round(y)}`); },
    restore() { trace.push("restore"); },
    save() { trace.push("save"); },
    stroke() { trace.push("strokePaint"); },
  };
}

test("relic reveal renderer draws a burst and readable signal banner", () => {
  const RelicReveal = loadRelicReveal();
  const context = createRecordingContext();
  const state = {
    relicReveal: { archetype: "core", color: "#f0a040", life: 0.54, maxLife: 0.78, x: 320, y: 220 },
    relicRevealBursts: [{ color: "#f0a040", life: 0.42, maxLife: 0.62, radius: 112, x: 320, y: 220 }],
  };

  RelicReveal.drawWorld(context, state);
  RelicReveal.drawScreen(context, state, { width: 960, height: 540 });

  const trace = context.trace.join("|");
  assert.match(trace, /arc:320,220,112/);
  assert.match(trace, /text:RELIC SIGNAL/);
  assert.match(trace, /text:CORE CACHE/);
  assert.match(trace, /rect:360,82,240,28/);
});
