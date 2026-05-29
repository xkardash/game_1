const fs = require("node:fs");
const test = require("node:test");
const vm = require("node:vm");
const assert = require("node:assert/strict");

function loadScripts(paths) {
  const context = { console, Math };
  context.window = context;
  vm.createContext(context);
  for (const path of paths) {
    vm.runInContext(fs.readFileSync(path, "utf8"), context, { filename: path });
  }
  return context;
}

function createBoss(archetype, hp = 42) {
  return {
    bossArchetype: archetype,
    hp,
    maxHp: 100,
    type: "boss",
    x: 320,
    y: 220,
  };
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

test("boss HUD metadata exposes readable name, role, phase, HP, and accent", () => {
  const { BossUi } = loadScripts(["src/boss-system.js", "src/boss-ui.js"]);

  const model = BossUi.getBossHudModel(createBoss("phase", 42));

  assert.equal(model.title, "PHASE INTERCEPTOR");
  assert.equal(model.role, "Blink assault");
  assert.equal(model.phase, 2);
  assert.equal(model.phaseLabel, "FAZ II");
  assert.equal(model.hpRatio, 0.42);
  assert.equal(model.accent, "#7df8ff");
});

test("boss HUD and phase flash renderer emit readable canvas traces", () => {
  const { BossUi } = loadScripts(["src/boss-system.js", "src/boss-ui.js"]);
  const context = createRecordingContext();
  const boss = createBoss("bulwark", 24);
  const state = {
    bossPhaseFlashes: [{ color: "#d7a64f", life: 0.42, maxLife: 0.62, phase: 3, radius: 96, x: 320, y: 220 }],
    enemies: [boss],
  };

  BossUi.drawBossPhaseFlashes(context, state);
  BossUi.drawBossHud(context, state, { width: 960, height: 540 });

  const trace = context.trace.join("|");
  assert.match(trace, /arc:320,220,96/);
  assert.match(trace, /text:BULWARK CRUISER/);
  assert.match(trace, /text:FAZ III/);
  assert.match(trace, /rect:330,38,300,10/);
});
