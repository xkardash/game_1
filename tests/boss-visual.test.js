const fs = require("node:fs");
const test = require("node:test");
const vm = require("node:vm");
const assert = require("node:assert/strict");

function loadEnemyVisual() {
  const context = { console };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync("src/enemy-visual.js", "utf8"), context, { filename: "src/enemy-visual.js" });
  return context.EnemyVisual;
}

function createBoss(archetype) {
  return {
    bossArchetype: archetype,
    flash: 0,
    height: 66,
    hp: 80,
    maxHp: 100,
    pulse: 0,
    type: "boss",
    width: 74,
    x: 200,
    y: 160,
  };
}

function createRecordingContext() {
  const trace = [];
  return {
    trace,
    set fillStyle(value) { trace.push(`fill:${value}`); },
    get fillStyle() { return ""; },
    set globalAlpha(value) { trace.push(`alpha:${Number(value).toFixed(2)}`); },
    get globalAlpha() { return 1; },
    beginPath() { trace.push("begin"); },
    closePath() { trace.push("close"); },
    ellipse(_x, _y, width, height) { trace.push(`ellipse:${Math.round(width)}x${Math.round(height)}`); },
    fill() { trace.push("paint"); },
    fillRect(x, y, width, height) { trace.push(`rect:${Math.round(x)},${Math.round(y)},${Math.round(width)},${Math.round(height)}`); },
    lineTo(x, y) { trace.push(`line:${Math.round(x)},${Math.round(y)}`); },
    moveTo(x, y) { trace.push(`move:${Math.round(x)},${Math.round(y)}`); },
    restore() { trace.push("restore"); },
    save() { trace.push("save"); },
    stroke() { trace.push("stroke"); },
    strokeRect(x, y, width, height) { trace.push(`strokeRect:${Math.round(x)},${Math.round(y)},${Math.round(width)},${Math.round(height)}`); },
    translate(x, y) { trace.push(`translate:${Math.round(x)},${Math.round(y)}`); },
  };
}

test("boss archetype visual profiles are distinct and readable", () => {
  const EnemyVisual = loadEnemyVisual();

  const bulwark = EnemyVisual.getBossVisualProfile("bulwark");
  const phase = EnemyVisual.getBossVisualProfile("phase");
  const core = EnemyVisual.getBossVisualProfile("core");

  assert.equal(bulwark.accent, "#d7a64f");
  assert.equal(phase.accent, "#7df8ff");
  assert.equal(core.accent, "#f0a040");
  assert.ok(bulwark.widthScale > phase.widthScale);
  assert.ok(core.reactorScale > bulwark.reactorScale);
});

test("boss archetype renderer emits different draw traces", () => {
  const EnemyVisual = loadEnemyVisual();
  const traces = ["bulwark", "phase", "core"].map((archetype) => {
    const context = createRecordingContext();
    EnemyVisual.drawEnemies(context, { enemies: [createBoss(archetype)] });
    return context.trace.join("|");
  });

  assert.notEqual(traces[0], traces[1]);
  assert.notEqual(traces[1], traces[2]);
  assert.match(traces[0], /#d7a64f/);
  assert.match(traces[1], /#7df8ff/);
  assert.match(traces[2], /ellipse:18x24/);
});
