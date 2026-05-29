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
    closePath() { trace.push("close"); },
    fill() { trace.push("paint"); },
    fillRect(x, y, width, height) { trace.push(`rect:${Math.round(x)},${Math.round(y)},${Math.round(width)},${Math.round(height)}`); },
    fillText(text, x, y) { trace.push(`text:${text}:${Math.round(x)},${Math.round(y)}`); },
    lineTo(x, y) { trace.push(`line:${Math.round(x)},${Math.round(y)}`); },
    moveTo(x, y) { trace.push(`move:${Math.round(x)},${Math.round(y)}`); },
    restore() { trace.push("restore"); },
    rotate(value) { trace.push(`rotate:${Number(value).toFixed(2)}`); },
    save() { trace.push("save"); },
    stroke() { trace.push("strokePaint"); },
    strokeRect(x, y, width, height) { trace.push(`strokeRect:${Math.round(x)},${Math.round(y)},${Math.round(width)},${Math.round(height)}`); },
    translate(x, y) { trace.push(`translate:${Math.round(x)},${Math.round(y)}`); },
  };
}

test("combat UX renderer draws overdrive prompt, objective pointer, and reward notice", () => {
  const CombatUx = loadCombatUx();
  const context = createRecordingContext();
  const state = {
    camera: { x: 0, y: 0, width: 960, height: 540 },
    phase: "playing",
    player: { overdriveReady: true },
    tacticalObjectives: {
      active: { kind: "signalBeacon", title: "Sinyal istasyonu", x: 1420, y: 300 },
    },
    uxNotices: [{
      color: "#f0b84a",
      detail: "+4 XP / Overdrive +18",
      life: 1.2,
      maxLife: 2,
      title: "Sinyal istasyonu tamamlandi",
    }],
  };

  CombatUx.draw(context, state, { width: 960, height: 540 });

  const trace = context.trace.join("|");
  assert.match(trace, /text:E/);
  assert.match(trace, /text:NOVA READY/);
  assert.match(trace, /text:Sinyal istasyonu/);
  assert.match(trace, /text:Sinyal istasyonu tamamlandi/);
  assert.match(trace, /text:\+4 XP \/ Overdrive \+18/);
  assert.match(trace, /rotate:/);
});
