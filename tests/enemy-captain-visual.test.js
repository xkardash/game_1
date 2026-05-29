const fs = require("node:fs");
const test = require("node:test");
const vm = require("node:vm");
const assert = require("node:assert/strict");

function loadEnemyVisual() {
  const context = { console, Math };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync("src/enemy-visual.js", "utf8"), context, { filename: "src/enemy-visual.js" });
  return context.EnemyVisual;
}

function createRecordingContext() {
  const trace = [];
  return {
    trace,
    set fillStyle(value) { trace.push(`fill:${value}`); },
    get fillStyle() { return ""; },
    set globalAlpha(value) { trace.push(`alpha:${Number(value).toFixed(2)}`); },
    get globalAlpha() { return 1; },
    set lineWidth(value) { trace.push(`width:${value}`); },
    get lineWidth() { return 1; },
    set strokeStyle(value) { trace.push(`stroke:${value}`); },
    get strokeStyle() { return ""; },
    beginPath() { trace.push("begin"); },
    closePath() { trace.push("close"); },
    ellipse(_x, _y, width, height) { trace.push(`ellipse:${Math.round(width)}x${Math.round(height)}`); },
    fill() { trace.push("paint"); },
    fillRect(x, y, width, height) { trace.push(`rect:${Math.round(x)},${Math.round(y)},${Math.round(width)},${Math.round(height)}`); },
    lineTo(x, y) { trace.push(`line:${Math.round(x)},${Math.round(y)}`); },
    moveTo(x, y) { trace.push(`move:${Math.round(x)},${Math.round(y)}`); },
    restore() { trace.push("restore"); },
    save() { trace.push("save"); },
    stroke() { trace.push("strokePaint"); },
    translate(x, y) { trace.push(`translate:${Math.round(x)},${Math.round(y)}`); },
  };
}

test("captain enemies render a distinct command mark", () => {
  const EnemyVisual = loadEnemyVisual();
  const context = createRecordingContext();

  EnemyVisual.drawEnemies(context, {
    enemies: [{
      captain: true,
      captainAura: { range: 220 },
      flash: 0,
      height: 48,
      hp: 12,
      maxHp: 12,
      pulse: 0,
      type: "tank",
      width: 64,
      x: 120,
      y: 120,
    }],
  });

  const trace = context.trace.join("|");
  assert.match(trace, /stroke:#f2dfb6/);
  assert.match(trace, /ellipse:42x34/);
  assert.match(trace, /rect:-10,-36,20,6/);
});
